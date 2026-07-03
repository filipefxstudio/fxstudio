async function enviarEmailResend(to: string, subject: string, html: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.info("[site/leads] RESEND_API_KEY não configurada — e-mail não enviado:", {
      to,
      subject,
    });
    return false;
  }

  const from = process.env.RESEND_FROM_EMAIL ?? "FX Studio <noreply@fxstudio.com.br>";

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, html }),
  });

  return response.ok;
}

export async function notificarCorretorNovoLead(input: {
  email: string;
  corretorNome: string;
  leadNome: string;
  leadTelefone: string;
  observacoes?: string | null;
}): Promise<void> {
  const subject = `Novo lead do site — ${input.leadNome}`;
  const html = `
    <p>Olá, ${input.corretorNome}.</p>
    <p>Você recebeu um novo lead pelo site:</p>
    <ul>
      <li><strong>Nome:</strong> ${input.leadNome}</li>
      <li><strong>Telefone:</strong> ${input.leadTelefone}</li>
    </ul>
    ${input.observacoes ? `<p><strong>Observações:</strong><br/>${input.observacoes.replace(/\n/g, "<br/>")}</p>` : ""}
  `;

  await enviarEmailResend(input.email, subject, html);
}
