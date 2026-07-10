import { sendEmail } from "@/lib/email/resend";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const papelLabels: Record<string, string> = {
  admin: "Admin",
  gerente: "Gerente/Diretor",
  corretor: "Corretor",
};

export async function enviarConviteEquipe(input: {
  email: string;
  nome: string;
  papel: string;
  corretorNome: string;
}) {
  const to = input.email.trim();
  const appUrl =
    process.env.NEXT_PUBLIC_SITE_BASE_URL?.replace(/\/$/, "") ?? "https://fxstudio.com.br";
  const papelLabel = papelLabels[input.papel] ?? input.papel;
  const subject = `Convite para equipe — ${input.corretorNome}`;
  const html = `
    <h2>Você foi convidado para a equipe</h2>
    <p>Olá, ${escapeHtml(input.nome)}.</p>
    <p><strong>${escapeHtml(input.corretorNome)}</strong> convidou você para participar da equipe no FX Studio como <strong>${escapeHtml(papelLabel)}</strong>.</p>
    <p>Acesse o painel para criar sua conta e começar:</p>
    <p><a href="${escapeHtml(appUrl)}/login">${escapeHtml(appUrl)}/login</a></p>
    <p><em>Se você não esperava este convite, pode ignorar este e-mail.</em></p>
  `;

  console.info("[email]", {
    phase: "before",
    function: "enviarConviteEquipe",
    to,
    subject,
    corretorNome: input.corretorNome,
    papel: input.papel,
  });

  const result = await sendEmail("enviarConviteEquipe", to, subject, html);

  console.info("[email]", {
    phase: "after",
    function: "enviarConviteEquipe",
    to,
    subject,
    success: result.success,
    error: result.error ?? null,
    resendBody: result.resendBody ?? null,
  });

  return result;
}
