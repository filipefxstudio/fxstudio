"use server";

import {
  buildUserFacingError,
  mapAuthErrorFromSupabase,
  mapCadastroErrorFromPostgres,
} from "@/lib/auth/errors";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";
import type { AssinaturaInsert, CorretorInsert } from "@/types";
import type { AuthError, PostgrestError } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

export type CadastroFailureStep =
  | "signUp"
  | "serviceRoleClient"
  | "corretorInsert"
  | "assinaturaInsert";

export type AuthActionState = {
  error?: string;
  success?: string;
  errorDetails?: {
    step: CadastroFailureStep;
    message: string;
    code?: string;
    status?: number;
    details?: string;
    hint?: string;
  };
};

function getFormValue(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function logAuthError(step: CadastroFailureStep, error: AuthError): void {
  console.error(`[cadastroAction] ${step} failed`, {
    step,
    message: error.message,
    status: error.status,
    code: error.code,
    name: error.name,
  });
}

function logPostgresError(step: CadastroFailureStep, error: PostgrestError): void {
  console.error(`[cadastroAction] ${step} failed`, {
    step,
    message: error.message,
    code: error.code,
    details: error.details,
    hint: error.hint,
  });
}

function logStepError(step: CadastroFailureStep, error: unknown): void {
  console.error(`[cadastroAction] ${step} failed`, {
    step,
    error,
  });
}

function buildDevErrorDetails(
  step: CadastroFailureStep,
  error: AuthError | PostgrestError | Error,
): AuthActionState["errorDetails"] | undefined {
  if (process.env.NODE_ENV !== "development") {
    return undefined;
  }

  if ("status" in error && "code" in error && typeof error.status === "number") {
    const authError = error as AuthError;

    return {
      step,
      message: authError.message,
      code: authError.code ?? undefined,
      status: authError.status,
    };
  }

  if ("details" in error || ("code" in error && "hint" in error)) {
    const postgresError = error as PostgrestError;

    return {
      step,
      message: postgresError.message,
      code: postgresError.code ?? undefined,
      details: postgresError.details ?? undefined,
      hint: postgresError.hint ?? undefined,
    };
  }

  return {
    step,
    message: error.message,
  };
}

async function ensureUniqueSlug(
  baseSlug: string,
  checkSlug: (slug: string) => Promise<boolean>,
): Promise<string> {
  const normalizedBase = baseSlug || "corretor";
  let slug = normalizedBase;
  let counter = 1;

  while (await checkSlug(slug)) {
    slug = `${normalizedBase}-${counter}`;
    counter += 1;
  }

  return slug;
}

export async function loginAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = getFormValue(formData, "email");
  const password = getFormValue(formData, "password");

  if (!email || !password) {
    return { error: "Preencha e-mail e senha." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: mapAuthErrorFromSupabase(error) };
  }

  redirect("/dashboard");
}

export async function cadastroAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const nome = getFormValue(formData, "nome");
  const email = getFormValue(formData, "email");
  const password = getFormValue(formData, "password");
  const confirmPassword = getFormValue(formData, "confirmarSenha");
  const telefone = getFormValue(formData, "telefone");
  const creci = getFormValue(formData, "creci");

  if (!nome || !email || !password || !confirmPassword) {
    return { error: "Preencha todos os campos obrigatórios." };
  }

  if (password.length < 6) {
    return { error: "A senha deve ter pelo menos 6 caracteres." };
  }

  if (password !== confirmPassword) {
    return { error: "As senhas não coincidem." };
  }

  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        nome,
      },
    },
  });

  if (authError) {
    logAuthError("signUp", authError);

    return {
      error: buildUserFacingError(
        mapAuthErrorFromSupabase(authError),
        authError.message,
      ),
      errorDetails: buildDevErrorDetails("signUp", authError),
    };
  }

  const user = authData.user;

  if (!user) {
    logStepError("signUp", new Error("Auth signUp returned no user"));

    return {
      error: "Não foi possível criar sua conta. Tente novamente.",
      errorDetails: buildDevErrorDetails(
        "signUp",
        new Error("Auth signUp returned no user"),
      ),
    };
  }

  if (user.identities?.length === 0) {
    return { error: "Este e-mail já está cadastrado." };
  }

  let admin;

  try {
    admin = createServiceRoleClient();
  } catch (error) {
    logStepError("serviceRoleClient", error);

    const message =
      error instanceof Error
        ? error.message
        : "Falha ao inicializar cliente administrativo.";

    return {
      error: buildUserFacingError(
        "Configuração do servidor inválida. Entre em contato com o suporte.",
        message,
      ),
      errorDetails: buildDevErrorDetails(
        "serviceRoleClient",
        error instanceof Error ? error : new Error(message),
      ),
    };
  }

  const baseSlug = slugify(nome);
  const slug = await ensureUniqueSlug(baseSlug, async (candidate) => {
    const { data } = await admin
      .from("corretores")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();

    return Boolean(data);
  });

  const corretorPayload: CorretorInsert = {
    user_id: user.id,
    nome,
    email,
    telefone: telefone || null,
    creci: creci || null,
    slug,
  };

  const { data: corretor, error: corretorError } = await admin
    .from("corretores")
    .insert(corretorPayload)
    .select("id")
    .single();

  if (corretorError || !corretor) {
    if (corretorError) {
      logPostgresError("corretorInsert", corretorError);
    } else {
      logStepError("corretorInsert", new Error("Insert returned no corretor row"));
    }

    const rawMessage = corretorError?.message ?? "Erro ao criar perfil.";

    return {
      error: buildUserFacingError(
        corretorError
          ? mapCadastroErrorFromPostgres(corretorError)
          : "Erro ao criar perfil.",
        rawMessage,
      ),
      errorDetails: buildDevErrorDetails(
        "corretorInsert",
        corretorError ?? new Error(rawMessage),
      ),
    };
  }

  const assinaturaPayload: AssinaturaInsert = {
    corretor_id: corretor.id,
    plano: "basico",
    status: "ativo",
  };

  const { error: assinaturaError } = await admin
    .from("assinaturas")
    .insert(assinaturaPayload);

  if (assinaturaError) {
    logPostgresError("assinaturaInsert", assinaturaError);
    await admin.from("corretores").delete().eq("id", corretor.id);

    return {
      error: buildUserFacingError(
        mapCadastroErrorFromPostgres(assinaturaError),
        assinaturaError.message,
      ),
      errorDetails: buildDevErrorDetails("assinaturaInsert", assinaturaError),
    };
  }

  if (!authData.session) {
    return {
      success:
        "Conta criada! Enviamos um e-mail de confirmação. Confirme seu e-mail antes de entrar.",
    };
  }

  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
