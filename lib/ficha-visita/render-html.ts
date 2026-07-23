import {
  escapeHtml,
  formatDataLocalPorExtenso,
  formatEnderecoImovel,
  formatValorImovel,
  getClausulaTexto,
  getOfficeDisplay,
  resolveCidadeDocumento,
  type ImovelFichaRow,
} from "@/lib/ficha-visita/utils";
import type { Corretor } from "@/types";

export interface FichaVisitaLeadData {
  codigo_atendimento?: string | null;
  nome?: string | null;
  telefone?: string | null;
  cliente_nome?: string | null;
  cliente_endereco?: string | null;
}

export interface FichaVisitaRenderInput {
  corretor: Corretor;
  lead: FichaVisitaLeadData;
  corretorResponsavel: string;
  corretorTelefone?: string | null;
  imoveis: ImovelFichaRow[];
  clausula: {
    usaTextoPadrao: boolean;
    textoClausula?: string | null;
    percentualComissao: number;
  };
  dataReferencia?: Date;
}

export function renderFichaVisitaHtml(input: FichaVisitaRenderInput): string {
  const { corretor, lead, corretorResponsavel, corretorTelefone, imoveis, clausula } = input;
  const office = getOfficeDisplay(corretor);
  const dataRef = input.dataReferencia ?? new Date();

  const officeLine = [office.nome, office.endereco, office.telefone]
    .filter(Boolean)
    .join(" - ");

  const clienteNome = lead.cliente_nome?.trim() || lead.nome?.trim() || "—";
  const atendimentoCodigo = lead.codigo_atendimento?.trim() || "—";

  const clausulaTexto = getClausulaTexto(
    clausula.usaTextoPadrao,
    clausula.textoClausula,
    {
      imobiliaria: office.nome,
      percentual: clausula.percentualComissao,
      corretor: corretorResponsavel,
    },
  );

  const cidadeDoc = resolveCidadeDocumento(
    imoveis.map((i) => i.cidade),
    corretor,
  );
  const dataPorExtenso = formatDataLocalPorExtenso(dataRef, cidadeDoc || "—");

  const tableRows = imoveis
    .map((imovel) => {
      const codigo = imovel.codigo?.trim() || "—";
      const endereco = formatEnderecoImovel(imovel);
      const bairro = imovel.bairro?.trim() || "—";
      const valor = formatValorImovel(imovel);
      return `<tr>
        <td>${escapeHtml(codigo)}</td>
        <td>${escapeHtml(endereco)}</td>
        <td>${escapeHtml(bairro)}</td>
        <td>${escapeHtml(valor)}</td>
      </tr>`;
    })
    .join("");

  const clienteEndereco = lead.cliente_endereco?.trim();

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>Ficha de visita — ${escapeHtml(atendimentoCodigo)}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: "Segoe UI", system-ui, sans-serif;
      color: #1a1a2e;
      line-height: 1.5;
      max-width: 800px;
      margin: 0 auto;
      padding: 32px 24px;
      font-size: 13px;
    }
    h1.title {
      text-align: center;
      font-size: 18px;
      font-weight: 700;
      margin: 0 0 12px;
      letter-spacing: 0.04em;
    }
    .office {
      text-align: center;
      font-size: 12px;
      margin-bottom: 24px;
      color: #333;
    }
    .section { margin-bottom: 16px; }
    .section p { margin: 4px 0; }
    .label { font-weight: 600; }
    .clausula {
      white-space: pre-wrap;
      text-align: justify;
      margin: 20px 0;
      font-size: 12px;
      line-height: 1.6;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
      font-size: 12px;
    }
    th, td {
      border: 1px solid #333;
      padding: 6px 8px;
      text-align: left;
    }
    th {
      background: #f0f0f0;
      font-weight: 700;
      text-transform: uppercase;
      font-size: 11px;
    }
    .data-local {
      margin: 24px 0;
      text-align: right;
    }
    .assinatura {
      margin-top: 48px;
      text-align: center;
    }
    .assinatura-traco,
    .assinatura-nome {
      margin: 0;
      font-size: 12px;
    }
    .assinatura-traco {
      margin-bottom: 8px;
      letter-spacing: 0.02em;
    }
    @media print {
      body { padding: 16px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="text-align:right;margin-bottom:16px;">
    <button onclick="window.print()" style="padding:8px 16px;cursor:pointer;">Imprimir</button>
  </div>

  <h1 class="title">FICHA DE VISITA</h1>
  <p class="office">${escapeHtml(officeLine)}</p>

  <section class="section">
    <p><span class="label">ATENDIMENTO:</span> ${escapeHtml(atendimentoCodigo)}</p>
    <p><span class="label">CLIENTE:</span> ${escapeHtml(clienteNome)}</p>
    ${clienteEndereco ? `<p><span class="label">Endereço:</span> ${escapeHtml(clienteEndereco)}</p>` : ""}
    <p><span class="label">Tel.:</span> ${escapeHtml(lead.telefone?.trim() || "—")}</p>
  </section>

  <section class="section">
    <p><span class="label">Corretor responsável:</span> ${escapeHtml(corretorResponsavel)}</p>
    ${corretorTelefone ? `<p><span class="label">Tel. corretor:</span> ${escapeHtml(corretorTelefone)}</p>` : ""}
  </section>

  <section class="clausula">${escapeHtml(clausulaTexto)}</section>

  <table>
    <thead>
      <tr>
        <th>CÓD.</th>
        <th>ENDEREÇO</th>
        <th>BAIRRO</th>
        <th>VALOR</th>
      </tr>
    </thead>
    <tbody>
      ${tableRows}
    </tbody>
  </table>

  <p class="data-local">${escapeHtml(dataPorExtenso)}</p>

  <div class="assinatura">
    <p class="assinatura-traco">____________________________________________</p>
    <p class="assinatura-nome">${escapeHtml(clienteNome)} - CPF: ___________________</p>
  </div>
</body>
</html>`;
}
