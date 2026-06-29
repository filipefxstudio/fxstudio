import type { AuthError } from "@supabase/supabase-js";
import type { PostgrestError } from "@supabase/supabase-js";

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  "Invalid login credentials": "E-mail ou senha incorretos.",
  "Email not confirmed": "Confirme seu e-mail antes de entrar.",
  "User already registered": "Este e-mail já está cadastrado.",
  "Password should be at least 6 characters": "A senha deve ter pelo menos 6 caracteres.",
  "Unable to validate email address: invalid format": "Informe um e-mail válido.",
  "Signup requires a valid password": "Informe uma senha válida.",
  "Email signups are disabled": "Cadastro por e-mail está desabilitado no momento.",
  "Signups not allowed for this instance": "Cadastro por e-mail está desabilitado no momento.",
  "Invalid API key": "Configuração do servidor inválida. Entre em contato com o suporte.",
};

const AUTH_ERROR_CODES: Record<string, string> = {
  email_provider_disabled: "Cadastro por e-mail está desabilitado no momento.",
  signup_disabled: "Cadastro por e-mail está desabilitado no momento.",
  user_already_exists: "Este e-mail já está cadastrado.",
  email_exists: "Este e-mail já está cadastrado.",
  weak_password: "A senha deve ter pelo menos 6 caracteres.",
  invalid_credentials: "E-mail ou senha incorretos.",
  over_email_send_rate_limit:
    "Muitas tentativas de cadastro. Aguarde alguns minutos e tente novamente.",
  over_request_rate_limit:
    "Muitas tentativas. Aguarde alguns minutos e tente novamente.",
  validation_failed: "Verifique os dados informados e tente novamente.",
};

const POSTGRES_ERROR_CODES: Record<string, string> = {
  "23505": "Este e-mail ou slug já está em uso.",
  "23503": "Não foi possível concluir o cadastro. Tente novamente.",
  "42501": "Não foi possível concluir o cadastro. Tente novamente ou entre em contato com o suporte.",
};

function isRlsError(message: string): boolean {
  const normalized = message.toLowerCase();

  return (
    normalized.includes("row-level security") ||
    normalized.includes("row level security") ||
    normalized.includes("permission denied") ||
    normalized.includes("violates row-level security policy")
  );
}

export function mapAuthError(message: string, code?: string | null): string {
  if (code && AUTH_ERROR_CODES[code]) {
    return AUTH_ERROR_CODES[code];
  }

  if (AUTH_ERROR_MESSAGES[message]) {
    return AUTH_ERROR_MESSAGES[message];
  }

  if (message.toLowerCase().includes("already registered")) {
    return "Este e-mail já está cadastrado.";
  }

  if (message.toLowerCase().includes("signups are disabled")) {
    return "Cadastro por e-mail está desabilitado no momento.";
  }

  if (message.toLowerCase().includes("password")) {
    return "A senha deve ter pelo menos 6 caracteres.";
  }

  if (message.toLowerCase().includes("invalid login")) {
    return "E-mail ou senha incorretos.";
  }

  if (isRlsError(message)) {
    return "Não foi possível concluir o cadastro. Tente novamente ou entre em contato com o suporte.";
  }

  return "Ocorreu um erro. Tente novamente.";
}

export function mapAuthErrorFromSupabase(error: AuthError): string {
  return mapAuthError(error.message, error.code);
}

export function mapCadastroError(message: string, code?: string | null): string {
  if (code && POSTGRES_ERROR_CODES[code]) {
    return POSTGRES_ERROR_CODES[code];
  }

  if (message.includes("duplicate key") || message.includes("unique")) {
    return "Este e-mail ou slug já está em uso.";
  }

  if (isRlsError(message)) {
    return "Não foi possível concluir o cadastro. Tente novamente ou entre em contato com o suporte.";
  }

  return mapAuthError(message, code);
}

export function mapCadastroErrorFromPostgres(error: PostgrestError): string {
  return mapCadastroError(error.message, error.code);
}

export function buildUserFacingError(
  mappedMessage: string,
  rawMessage: string,
): string {
  if (process.env.NODE_ENV === "development") {
    return `${mappedMessage} (${rawMessage})`;
  }

  return mappedMessage;
}
