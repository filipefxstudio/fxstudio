"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";

import {
  ImovelInteresseAutocomplete,
  type ImovelSearchResult,
} from "@/components/atendimentos/ImovelInteresseAutocomplete";
import { LeadHistorico } from "@/components/leads/LeadHistorico";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  calcularFaixaValorImovel,
  updateAtendimentoDados,
} from "@/lib/actions/atendimentos";
import { SITUACAO_LEAD_LABELS } from "@/lib/constants/atendimentos";
import {
  ETAPA_LEAD_LABELS,
  ETAPAS_LEAD,
  FINALIDADE_BUSCA_OPTIONS,
  TEMPERATURA_LEAD_LABELS,
} from "@/lib/constants/leads";
import { formatOrigemDisplay, formatTempoPrimeiraResposta } from "@/lib/leads/format";
import { parseLeadObservacoes } from "@/lib/leads/observacoes";
import { toast } from "@/hooks/use-toast";
import type { EtapaLead, Lead, SituacaoLead, TemperaturaLead, TipoImovelCustom } from "@/types";

interface AtendimentoDadosTabProps {
  lead: Lead;
  perfis: { id: string; nome: string }[];
  tiposImovel: TipoImovelCustom[];
}

export function AtendimentoDadosTab({ lead, perfis, tiposImovel }: AtendimentoDadosTabProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const responsavelNome =
    lead.perfil?.nome ?? perfis.find((p) => p.id === lead.perfil_id)?.nome ?? null;

  const [temperatura, setTemperatura] = useState<TemperaturaLead>(
    lead.temperatura ?? "indefinido",
  );
  const [etapa, setEtapa] = useState<EtapaLead>(lead.etapa);
  const [situacao, setSituacao] = useState<SituacaoLead>(lead.situacao ?? "em_atendimento");

  const [imovelInteresse, setImovelInteresse] = useState<ImovelSearchResult | null>(
    lead.imovel
      ? {
          id: lead.imovel.id,
          titulo: lead.imovel.titulo,
          codigo: lead.imovel.codigo,
          bairro: lead.imovel.bairro,
          logradouro: lead.imovel.logradouro,
          tipo: lead.imovel.tipo,
          finalidade: lead.imovel.finalidade,
          status: lead.imovel.status,
          valor_venda: lead.imovel.valor_venda,
          valor_locacao: lead.imovel.valor_locacao,
          fotos: lead.imovel.fotos ?? [],
        }
      : null,
  );

  const [finalidade, setFinalidade] = useState(lead.finalidade_busca ?? "");
  const [tipoImovel, setTipoImovel] = useState(lead.tipo_imovel_busca ?? "");
  const [bairros, setBairros] = useState<string[]>(lead.bairros_interesse ?? []);
  const [bairroInput, setBairroInput] = useState("");
  const [quartos, setQuartos] = useState(lead.quartos_minimo?.toString() ?? "");
  const [suites, setSuites] = useState(lead.suites_minimas?.toString() ?? "");
  const [banheiros, setBanheiros] = useState(lead.banheiros_minimos?.toString() ?? "");
  const [vagas, setVagas] = useState(lead.vagas_minimas?.toString() ?? "");
  const [valorMin, setValorMin] = useState<number | null>(lead.valor_minimo ?? null);
  const [valorMax, setValorMax] = useState<number | null>(lead.valor_maximo ?? null);
  const [prazo, setPrazo] = useState(lead.prazo_decisao ?? "");
  const [obsTexto, setObsTexto] = useState(parseLeadObservacoes(lead.observacoes).texto);

  const [entradaFgts, setEntradaFgts] = useState<number | null>(lead.entrada_fgts ?? null);
  const [entradaProprios, setEntradaProprios] = useState<number | null>(
    lead.entrada_recursos_proprios ?? null,
  );
  const [finAprovado, setFinAprovado] = useState(lead.financiamento_aprovado ?? false);
  const [possuiImovel, setPossuiImovel] = useState(lead.possui_imovel_venda ?? false);
  const [interessePermuta, setInteressePermuta] = useState(lead.interesse_permuta ?? false);
  const [infoPermuta, setInfoPermuta] = useState(lead.info_permuta ?? "");
  const [obsFinanceiras, setObsFinanceiras] = useState(lead.obs_financeiras ?? "");

  const tiposAtivos = useMemo(
    () => tiposImovel.filter((t) => t.ativo),
    [tiposImovel],
  );

  useEffect(() => {
    if (!imovelInteresse) return;
    startTransition(async () => {
      const faixa = await calcularFaixaValorImovel(imovelInteresse.id);
      if (faixa) {
        setValorMin(faixa.min);
        setValorMax(faixa.max);
      }
      if (imovelInteresse.finalidade === "venda") setFinalidade("compra");
      if (imovelInteresse.finalidade === "locacao") setFinalidade("locacao");
      if (imovelInteresse.tipo) setTipoImovel(imovelInteresse.tipo);
      if (imovelInteresse.bairro && !bairros.includes(imovelInteresse.bairro)) {
        setBairros((prev) => [...prev, imovelInteresse.bairro!]);
      }
    });
  }, [imovelInteresse]);

  function save(partial?: Parameters<typeof updateAtendimentoDados>[1]) {
    startTransition(async () => {
      const result = await updateAtendimentoDados(lead.id, partial ?? {
        temperatura,
        etapa,
        situacao,
        imovel_id: imovelInteresse?.id ?? null,
        finalidade_busca: finalidade || undefined,
        tipo_imovel_busca: tipoImovel,
        bairros_interesse: bairros,
        quartos_minimo: quartos ? Number(quartos) : null,
        suites_minimas: suites ? Number(suites) : null,
        banheiros_minimos: banheiros ? Number(banheiros) : null,
        vagas_minimas: vagas ? Number(vagas) : null,
        valor_minimo: valorMin,
        valor_maximo: valorMax,
        prazo_decisao: prazo || null,
        observacoes: obsTexto,
        entrada_fgts: entradaFgts,
        entrada_recursos_proprios: entradaProprios,
        financiamento_aprovado: finAprovado,
        possui_imovel_venda: possuiImovel,
        interesse_permuta: interessePermuta,
        info_permuta: infoPermuta,
        obs_financeiras: obsFinanceiras,
      });

      if (result.error) {
        toast({ variant: "destructive", title: "Erro", description: result.error });
        return;
      }
      toast({ title: result.message });
      router.refresh();
    });
  }

  function addBairro() {
    const b = bairroInput.trim();
    if (b && !bairros.includes(b)) setBairros((prev) => [...prev, b]);
    setBairroInput("");
  }

  return (
    <div className="space-y-6">
      <section className="space-y-4 rounded-xl border border-border p-4">
        <h3 className="font-semibold text-primary">Status</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>Temperatura</Label>
            <Select
              value={temperatura}
              onValueChange={(v) => {
                setTemperatura(v as TemperaturaLead);
                save({ temperatura: v as TemperaturaLead });
              }}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(TEMPERATURA_LEAD_LABELS) as TemperaturaLead[]).map((t) => (
                  <SelectItem key={t} value={t}>{TEMPERATURA_LEAD_LABELS[t]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Etapa</Label>
            <Select
              value={etapa}
              onValueChange={(v) => {
                setEtapa(v as EtapaLead);
                save({ etapa: v as EtapaLead });
              }}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ETAPAS_LEAD.map((e) => (
                  <SelectItem key={e} value={e}>{ETAPA_LEAD_LABELS[e]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Situação</Label>
            <Select
              value={situacao}
              onValueChange={(v) => {
                setSituacao(v as SituacaoLead);
                save({ situacao: v as SituacaoLead });
              }}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(SITUACAO_LEAD_LABELS) as SituacaoLead[]).map((s) => (
                  <SelectItem key={s} value={s}>{SITUACAO_LEAD_LABELS[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-border p-4">
        <h3 className="font-semibold text-primary">Interesse</h3>
        <ImovelInteresseAutocomplete
          value={imovelInteresse}
          onChange={setImovelInteresse}
          disabled={isPending}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Finalidade</Label>
            <Select value={finalidade} onValueChange={setFinalidade}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {FINALIDADE_BUSCA_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Tipo de imóvel</Label>
            <Select value={tipoImovel} onValueChange={setTipoImovel}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {tiposAtivos.map((t) => (
                  <SelectItem key={t.id} value={t.nome.toLowerCase()}>
                    {t.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Bairros</Label>
            <div className="flex gap-2">
              <Input
                value={bairroInput}
                onChange={(e) => setBairroInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addBairro())}
              />
              <Button type="button" variant="outline" onClick={addBairro}>Adicionar</Button>
            </div>
            <div className="flex flex-wrap gap-1">
              {bairros.map((b) => (
                <span key={b} className="rounded-full bg-muted px-2 py-0.5 text-xs">{b}</span>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Quartos mín.</Label>
            <Input type="number" value={quartos} onChange={(e) => setQuartos(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Suítes mín.</Label>
            <Input type="number" value={suites} onChange={(e) => setSuites(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Banheiros mín.</Label>
            <Input type="number" value={banheiros} onChange={(e) => setBanheiros(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Vagas mín.</Label>
            <Input type="number" value={vagas} onChange={(e) => setVagas(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Valor mín.</Label>
            <CurrencyInput value={valorMin} onChange={setValorMin} />
          </div>
          <div className="space-y-2">
            <Label>Valor máx.</Label>
            <CurrencyInput value={valorMax} onChange={setValorMax} />
          </div>
          <div className="space-y-2">
            <Label>Prazo decisão</Label>
            <Input value={prazo} onChange={(e) => setPrazo(e.target.value)} />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Observações</Label>
          <Textarea value={obsTexto} onChange={(e) => setObsTexto(e.target.value)} rows={2} />
        </div>
        <Button type="button" onClick={() => save()} disabled={isPending}>
          {isPending ? <Loader2 className="size-4 animate-spin" /> : "Salvar preferências"}
        </Button>
      </section>

      <section className="space-y-4 rounded-xl border border-border p-4">
        <h3 className="font-semibold text-primary">Perfil financeiro</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Entrada FGTS</Label>
            <CurrencyInput value={entradaFgts} onChange={setEntradaFgts} />
          </div>
          <div className="space-y-2">
            <Label>Recursos próprios</Label>
            <CurrencyInput value={entradaProprios} onChange={setEntradaProprios} />
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Switch checked={finAprovado} onCheckedChange={setFinAprovado} id="fin" />
            <Label htmlFor="fin">Financiamento aprovado</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={possuiImovel} onCheckedChange={setPossuiImovel} id="imovel-venda" />
            <Label htmlFor="imovel-venda">Possui imóvel à venda</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={interessePermuta} onCheckedChange={setInteressePermuta} id="permuta" />
            <Label htmlFor="permuta">Interesse em permuta</Label>
          </div>
        </div>
        {interessePermuta ? (
          <div className="space-y-2">
            <Label>Informações permuta</Label>
            <Textarea value={infoPermuta} onChange={(e) => setInfoPermuta(e.target.value)} rows={2} />
          </div>
        ) : null}
        <div className="space-y-2">
          <Label>Observações financeiras</Label>
          <Textarea value={obsFinanceiras} onChange={(e) => setObsFinanceiras(e.target.value)} rows={2} />
        </div>
        <Button type="button" variant="outline" onClick={() => save()} disabled={isPending}>
          Salvar perfil financeiro
        </Button>
      </section>

      <section className="space-y-3 rounded-xl border border-border p-4">
        <h3 className="font-semibold text-primary">Informações do atendimento</h3>
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Código</dt>
            <dd className="font-medium">{lead.codigo_atendimento ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Responsável</dt>
            <dd className="font-medium">{responsavelNome ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Entrada</dt>
            <dd>{lead.data_entrada ? new Date(lead.data_entrada).toLocaleString("pt-BR") : "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Tempo 1ª resposta</dt>
            <dd>{formatTempoPrimeiraResposta(lead.tempo_primeira_resposta_min)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Mídia</dt>
            <dd>{formatOrigemDisplay(lead.origem)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Cadastro</dt>
            <dd>{new Date(lead.criado_em).toLocaleDateString("pt-BR")}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-xl border border-border p-4">
        <h3 className="mb-4 font-semibold text-primary">Histórico de interações</h3>
        <LeadHistorico interacoes={lead.interacoes ?? []} />
      </section>
    </div>
  );
}
