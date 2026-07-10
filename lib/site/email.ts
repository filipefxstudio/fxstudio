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

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function notificarCorretorContatoSite(input: {
  email: string;
  corretorNome: string;
  leadNome: string;
  leadTelefone: string;
  leadEmail?: string | null;
  observacoes?: string | null;
}): Promise<void> {
  const subject = `[Site] Novo contato — ${input.leadNome}`;
  const html = `
    <h2>Novo contato pelo site</h2>
    <p>Olá, ${escapeHtml(input.corretorNome)}.</p>
    <p>Um visitante enviou mensagem pela página de contato:</p>
    <ul>
      <li><strong>Nome:</strong> ${escapeHtml(input.leadNome)}</li>
      <li><strong>Telefone:</strong> ${escapeHtml(input.leadTelefone)}</li>
      ${input.leadEmail ? `<li><strong>E-mail:</strong> ${escapeHtml(input.leadEmail)}</li>` : ""}
    </ul>
    ${input.observacoes ? `<p><strong>Mensagem:</strong><br/>${escapeHtml(input.observacoes).replace(/\n/g, "<br/>")}</p>` : ""}
    <p><em>Origem: site — página Contato</em></p>
  `;

  await enviarEmailResend(input.email, subject, html);
}

export async function notificarCorretorInteresseImovel(input: {
  email: string;
  corretorNome: string;
  leadNome: string;
  leadTelefone: string;
  leadEmail?: string | null;
  imovelTitulo: string;
  imovelCodigo?: string | null;
  observacoes?: string | null;
  preferenciaContato?: string | null;
}): Promise<void> {
  const subject = `[Site] Interesse em imóvel — ${input.imovelTitulo}`;
  const html = `
    <h2>Interesse em imóvel</h2>
    <p>Olá, ${escapeHtml(input.corretorNome)}.</p>
    <p>Um visitante demonstrou interesse em um imóvel publicado no site:</p>
    <ul>
      <li><strong>Imóvel:</strong> ${escapeHtml(input.imovelTitulo)}</li>
      ${input.imovelCodigo ? `<li><strong>Código:</strong> ${escapeHtml(input.imovelCodigo)}</li>` : ""}
      <li><strong>Nome:</strong> ${escapeHtml(input.leadNome)}</li>
      <li><strong>Telefone:</strong> ${escapeHtml(input.leadTelefone)}</li>
      ${input.leadEmail ? `<li><strong>E-mail:</strong> ${escapeHtml(input.leadEmail)}</li>` : ""}
      ${input.preferenciaContato ? `<li><strong>Preferência de contato:</strong> ${escapeHtml(input.preferenciaContato)}</li>` : ""}
    </ul>
    ${input.observacoes ? `<p><strong>Mensagem:</strong><br/>${escapeHtml(input.observacoes).replace(/\n/g, "<br/>")}</p>` : ""}
    <p><em>Origem: site — página do imóvel</em></p>
  `;

  await enviarEmailResend(input.email, subject, html);
}

/** @deprecated Use notificarCorretorContatoSite ou notificarCorretorInteresseImovel */
export async function notificarCorretorNovoLead(input: {
  email: string;
  corretorNome: string;
  leadNome: string;
  leadTelefone: string;
  observacoes?: string | null;
}): Promise<void> {
  await notificarCorretorContatoSite({
    email: input.email,
    corretorNome: input.corretorNome,
    leadNome: input.leadNome,
    leadTelefone: input.leadTelefone,
    observacoes: input.observacoes,
  });
}
