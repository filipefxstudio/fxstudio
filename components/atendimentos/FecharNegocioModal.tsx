"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";

import { ImovelAtendimentoResumo } from "@/components/atendimentos/ImovelAtendimentoResumo";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createNegocio, updateNegocio } from "@/lib/actions/atendimentos";
import { MSG_NEGOCIO_PROPOSTA_NAO_ACEITA } from "@/lib/atendimentos/regras";
import { todayBrasiliaDateInput } from "@/lib/dates/format";
import { getCaptadorPrincipal } from "@/lib/imoveis/captador";
import { formatCurrency } from "@/lib/site/format";
import { toast } from "@/hooks/use-toast";
import type {
  FormaPagamentoNegocio,
  Imovel,
  Negocio,
  NegocioRateioItem,
  PapelRateioNegocio,
  Proposta,
} from "@/types";

interface RateioLinha {
  key: string;
  perfil_id: string;
  papel: PapelRateioNegocio;
  percentual: number | null;
  valor: number | null;
  fixo?: boolean;
}

interface FecharNegocioModalProps {
  leadId: string;
  proposta?: Proposta | null;
  negocio?: Negocio | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  perfis: { id: string; nome: string }[];
  perfilAtualId?: string | null;
  mode?: "create" | "edit";
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function buildRateioInicial(
  imovel: Imovel | null | undefined,
  perfilAtualId: string | null | undefined,
  valorComissao: number | null,
  existente?: NegocioRateioItem[] | null,
): RateioLinha[] {
  if (existente?.length) {
    return existente.map((item, index) => ({
      key: `${item.perfil_id}-${index}`,
      perfil_id: item.perfil_id,
      papel: item.papel,
      percentual: item.percentual,
      valor: item.valor,
      fixo: item.papel === "vendedor" || item.papel === "captador",
    }));
  }

  const linhas: RateioLinha[] = [];
  const captador = imovel ? getCaptadorPrincipal(imovel) : null;
  const captadorId = captador?.perfil_id ?? imovel?.captador_id ?? null;

  if (perfilAtualId) {
    linhas.push({
      key: `vendedor-${perfilAtualId}`,
      perfil_id: perfilAtualId,
      papel: "vendedor",
      percentual: captadorId && captadorId !== perfilAtualId ? 50 : 100,
      valor:
        valorComissao != null
          ? roundMoney(valorComissao * (captadorId && captadorId !== perfilAtualId ? 0.5 : 1))
          : null,
      fixo: true,
    });
  }

  if (captadorId && captadorId !== perfilAtualId) {
    linhas.push({
      key: `captador-${captadorId}`,
      perfil_id: captadorId,
      papel: "captador",
      percentual: perfilAtualId ? 50 : 100,
      valor:
        valorComissao != null
          ? roundMoney(valorComissao * (perfilAtualId ? 0.5 : 1))
          : null,
      fixo: true,
    });
  }

  return linhas;
}

function recalcularRateioPorPercentual(
  linhas: RateioLinha[],
  valorComissao: number | null,
): RateioLinha[] {
  if (valorComissao == null) return linhas;
  return linhas.map((linha) => ({
    ...linha,
    valor:
      linha.percentual != null
        ? roundMoney((valorComissao * linha.percentual) / 100)
        : linha.valor,
  }));
}

function recalcularRateioPorValor(
  linhas: RateioLinha[],
  valorComissao: number | null,
): RateioLinha[] {
  if (valorComissao == null || valorComissao <= 0) return linhas;
  return linhas.map((linha) => ({
    ...linha,
    percentual:
      linha.valor != null ? roundMoney((linha.valor / valorComissao) * 100) : linha.percentual,
  }));
}

export function FecharNegocioModal({
  leadId,
  proposta,
  negocio,
  open,
  onOpenChange,
  perfis,
  perfilAtualId,
  mode = "create",
}: FecharNegocioModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const onOpenChangeRef = useRef(onOpenChange);
  onOpenChangeRef.current = onOpenChange;

  const imovel = negocio?.imovel ?? proposta?.imovel ?? null;
  const isEdit = mode === "edit" && Boolean(negocio);
  const propostaId = proposta?.id ?? null;
  const propostaStatus = proposta?.status ?? null;

  const [dataFechamento, setDataFechamento] = useState(todayBrasiliaDateInput());
  const [valorNegocio, setValorNegocio] = useState<number | null>(null);
  const [percentualComissao, setPercentualComissao] = useState<number | null>(null);
  const [valorComissao, setValorComissao] = useState<number | null>(null);
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamentoNegocio | "">("");
  const [valorRecursos, setValorRecursos] = useState<number | null>(null);
  const [valorFinanciado, setValorFinanciado] = useState<number | null>(null);
  const [valorFgts, setValorFgts] = useState<number | null>(null);
  const [rateio, setRateio] = useState<RateioLinha[]>([]);

  useEffect(() => {
    if (!open || isEdit) return;
    if (propostaStatus != null && propostaStatus !== "aceita") {
      toast({
        variant: "destructive",
        title: MSG_NEGOCIO_PROPOSTA_NAO_ACEITA,
      });
      onOpenChangeRef.current(false);
    }
  }, [open, isEdit, propostaId, propostaStatus]);

  useEffect(() => {
    if (!open || !isEdit || !negocio) return;

    setDataFechamento(negocio.data_fechamento.slice(0, 10));
    setValorNegocio(Number(negocio.valor_fechamento));
    setPercentualComissao(
      negocio.percentual_comissao != null ? Number(negocio.percentual_comissao) : null,
    );
    setValorComissao(negocio.valor_comissao != null ? Number(negocio.valor_comissao) : null);
    setFormaPagamento(negocio.forma_pagamento ?? "");
    setValorRecursos(
      negocio.valor_recursos_proprios != null ? Number(negocio.valor_recursos_proprios) : null,
    );
    setValorFinanciado(
      negocio.valor_financiado != null ? Number(negocio.valor_financiado) : null,
    );
    setValorFgts(negocio.valor_fgts != null ? Number(negocio.valor_fgts) : null);
    setRateio(
      buildRateioInicial(
        negocio.imovel,
        perfilAtualId,
        negocio.valor_comissao != null ? Number(negocio.valor_comissao) : null,
        negocio.rateio,
      ),
    );
  }, [open, isEdit, negocio, perfilAtualId]);

  useEffect(() => {
    if (!open || isEdit) return;

    const valorInicial = proposta ? Number(proposta.valor_proposto) : null;
    setDataFechamento(todayBrasiliaDateInput());
    setValorNegocio(valorInicial);
    setPercentualComissao(null);
    setValorComissao(null);
    setFormaPagamento("");
    setValorRecursos(null);
    setValorFinanciado(null);
    setValorFgts(null);
    setRateio(buildRateioInicial(imovel, perfilAtualId, null));
  }, [open, isEdit, propostaId, proposta, imovel, perfilAtualId]);

  function handleValorNegocioChange(value: number | null) {
    setValorNegocio(value);
    if (percentualComissao != null && value != null) {
      const comissao = roundMoney((value * percentualComissao) / 100);
      setValorComissao(comissao);
      setRateio((prev) => recalcularRateioPorPercentual(prev, comissao));
    }
  }

  function handlePercentualComissaoChange(raw: string) {
    const pct = raw === "" ? null : Number(raw);
    setPercentualComissao(pct);
    if (pct != null && valorNegocio != null) {
      const comissao = roundMoney((valorNegocio * pct) / 100);
      setValorComissao(comissao);
      setRateio((prev) => recalcularRateioPorPercentual(prev, comissao));
    }
  }

  function handleValorComissaoChange(value: number | null) {
    setValorComissao(value);
    if (value != null && valorNegocio != null && valorNegocio > 0) {
      setPercentualComissao(roundMoney((value / valorNegocio) * 100));
    }
    setRateio((prev) => recalcularRateioPorValor(prev, value));
  }

  function atualizarRateioPercentual(key: string, raw: string) {
    const pct = raw === "" ? null : Number(raw);
    setRateio((prev) => {
      const next = prev.map((linha) =>
        linha.key === key ? { ...linha, percentual: pct } : linha,
      );
      return recalcularRateioPorPercentual(next, valorComissao);
    });
  }

  function atualizarRateioValor(key: string, value: number | null) {
    setRateio((prev) => {
      const next = prev.map((linha) => (linha.key === key ? { ...linha, valor: value } : linha));
      return recalcularRateioPorValor(next, valorComissao);
    });
  }

  function adicionarParticipante() {
    const disponivel = perfis.find((p) => !rateio.some((r) => r.perfil_id === p.id));
    if (!disponivel) {
      toast({ variant: "destructive", title: "Todos os perfis já foram adicionados." });
      return;
    }
    setRateio((prev) => [
      ...prev,
      {
        key: `outro-${disponivel.id}-${Date.now()}`,
        perfil_id: disponivel.id,
        papel: "outro",
        percentual: null,
        valor: null,
      },
    ]);
  }

  function removerParticipante(key: string) {
    setRateio((prev) => prev.filter((linha) => linha.key !== key || linha.fixo));
  }

  const somaFinanciamento = useMemo(() => {
    return (valorRecursos ?? 0) + (valorFinanciado ?? 0) + (valorFgts ?? 0);
  }, [valorRecursos, valorFinanciado, valorFgts]);

  const financiamentoValido =
    formaPagamento !== "financiado" ||
    (valorNegocio != null && roundMoney(somaFinanciamento) === roundMoney(valorNegocio));

  const perfilNomeMap = useMemo(
    () => new Map(perfis.map((p) => [p.id, p.nome])),
    [perfis],
  );

  function salvar() {
    if (!isEdit && proposta && proposta.status !== "aceita") {
      toast({
        variant: "destructive",
        title: MSG_NEGOCIO_PROPOSTA_NAO_ACEITA,
      });
      return;
    }
    if (!imovel?.id) {
      toast({ variant: "destructive", title: "Imóvel não informado." });
      return;
    }
    if (valorNegocio == null || valorNegocio <= 0) {
      toast({ variant: "destructive", title: "Informe o valor do negócio." });
      return;
    }
    if (!dataFechamento) {
      toast({ variant: "destructive", title: "Informe a data do fechamento." });
      return;
    }
    if (!formaPagamento) {
      toast({ variant: "destructive", title: "Selecione a forma de pagamento." });
      return;
    }
    if (formaPagamento === "financiado" && !financiamentoValido) {
      toast({
        variant: "destructive",
        title: "Valores de financiamento inconsistentes.",
        description: `A soma deve ser igual a ${formatCurrency(valorNegocio)}.`,
      });
      return;
    }

    const rateioPayload: NegocioRateioItem[] = rateio
      .filter((linha) => linha.perfil_id)
      .map((linha) => ({
        perfil_id: linha.perfil_id,
        papel: linha.papel,
        percentual: linha.percentual ?? 0,
        valor: linha.valor ?? 0,
        nome: perfilNomeMap.get(linha.perfil_id) ?? null,
      }));

    startTransition(async () => {
      const payload = {
        imovel_id: imovel.id,
        proposta_id: proposta?.id ?? negocio?.proposta_id ?? undefined,
        perfil_id: perfilAtualId ?? undefined,
        valor_fechamento: valorNegocio,
        valor_comissao: valorComissao ?? undefined,
        percentual_comissao: percentualComissao ?? undefined,
        data_fechamento: dataFechamento,
        forma_pagamento: formaPagamento,
        valor_recursos_proprios:
          formaPagamento === "financiado" ? (valorRecursos ?? 0) : undefined,
        valor_financiado: formaPagamento === "financiado" ? (valorFinanciado ?? 0) : undefined,
        valor_fgts: formaPagamento === "financiado" ? (valorFgts ?? 0) : undefined,
        rateio: rateioPayload,
      };

      const result =
        isEdit && negocio
          ? await updateNegocio(negocio.id, payload)
          : await createNegocio(leadId, payload);

      if (result.error) {
        toast({ variant: "destructive", title: "Erro", description: result.error });
        return;
      }

      toast({ title: result.message });
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar negociação" : "Fechar negócio"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {imovel ? <ImovelAtendimentoResumo imovel={imovel} /> : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="data-fechamento">Data do fechamento</Label>
              <Input
                id="data-fechamento"
                type="date"
                value={dataFechamento}
                onChange={(e) => setDataFechamento(e.target.value)}
              />
            </div>
            <div>
              <Label>Valor do negócio</Label>
              <CurrencyInput value={valorNegocio} onChange={handleValorNegocioChange} />
            </div>
            <div>
              <Label htmlFor="pct-comissao">Percentual comissão (%)</Label>
              <Input
                id="pct-comissao"
                type="number"
                min={0}
                max={100}
                step="0.01"
                value={percentualComissao ?? ""}
                onChange={(e) => handlePercentualComissaoChange(e.target.value)}
              />
            </div>
            <div>
              <Label>Valor comissão</Label>
              <CurrencyInput value={valorComissao} onChange={handleValorComissaoChange} />
            </div>
          </div>

          <div className="space-y-3 rounded-lg border border-border p-3">
            <div className="flex items-center justify-between gap-2">
              <Label>Rateio comissão</Label>
              <Button type="button" size="sm" variant="outline" onClick={adicionarParticipante}>
                <Plus className="size-3.5" />
                Adicionar
              </Button>
            </div>
            <div className="space-y-2">
              {rateio.map((linha) => (
                <div
                  key={linha.key}
                  className="grid gap-2 rounded-md bg-muted/40 p-2 sm:grid-cols-[1fr_100px_140px_32px]"
                >
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {linha.papel === "vendedor"
                        ? "Vendedor"
                        : linha.papel === "captador"
                          ? "Captador"
                          : "Participante"}
                    </p>
                    <p className="text-sm font-medium">
                      {perfilNomeMap.get(linha.perfil_id) ?? "—"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs">%</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      step="0.01"
                      value={linha.percentual ?? ""}
                      onChange={(e) => atualizarRateioPercentual(linha.key, e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Valor</Label>
                    <CurrencyInput
                      value={linha.valor}
                      onChange={(value) => atualizarRateioValor(linha.key, value)}
                    />
                  </div>
                  {!linha.fixo ? (
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="self-end text-destructive"
                      onClick={() => removerParticipante(linha.key)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  ) : (
                    <span />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label>Forma de pagamento</Label>
            <Select
              value={formaPagamento}
              onValueChange={(v) => setFormaPagamento(v as FormaPagamentoNegocio)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="avista">À vista</SelectItem>
                <SelectItem value="financiado">Financiado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formaPagamento === "financiado" ? (
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <Label>Valor recursos próprios</Label>
                <CurrencyInput value={valorRecursos} onChange={setValorRecursos} />
              </div>
              <div>
                <Label>Valor financiado</Label>
                <CurrencyInput value={valorFinanciado} onChange={setValorFinanciado} />
              </div>
              <div>
                <Label>Valor FGTS</Label>
                <CurrencyInput value={valorFgts} onChange={setValorFgts} />
              </div>
              {!financiamentoValido && valorNegocio != null ? (
                <p className="sm:col-span-3 text-sm text-destructive">
                  Soma atual: {formatCurrency(somaFinanciamento)} — deve ser{" "}
                  {formatCurrency(valorNegocio)}.
                </p>
              ) : null}
            </div>
          ) : null}

          <Button
            onClick={salvar}
            disabled={isPending || !financiamentoValido}
            className="w-full"
          >
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : isEdit ? (
              "Salvar negociação"
            ) : (
              "Cadastrar negociação"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
