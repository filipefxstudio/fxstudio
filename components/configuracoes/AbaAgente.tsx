"use client";

import { useMemo, useState, useTransition } from "react";
import { Bot, Sparkles } from "lucide-react";

import {
  saveAgenteConfig,
  testarConexaoIA,
  type AgenteConfigPublic,
  type SaveAgenteConfigInput,
} from "@/lib/actions/agente-config";
import {
  API_KEY_MASK,
  MODELO_PADRAO_POR_PROVEDOR,
  MODELOS_POR_PROVEDOR,
} from "@/lib/constants/agente";
import { ChatTesteAgente } from "@/components/configuracoes/ChatTesteAgente";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { cn } from "@/lib/utils";
import type { PlanoAssinatura, ProvedorIA, TomAgente } from "@/types";

interface AbaAgenteProps {
  plano: PlanoAssinatura;
  initialConfig: AgenteConfigPublic;
}

const TOM_OPCOES: { value: TomAgente; label: string }[] = [
  { value: "profissional", label: "Profissional" },
  { value: "descontraido", label: "Descontraído" },
  { value: "formal", label: "Formal" },
];

const PROVEDOR_OPCOES: { value: ProvedorIA; label: string }[] = [
  { value: "openai", label: "OpenAI" },
  { value: "anthropic", label: "Anthropic" },
  { value: "gemini", label: "Google Gemini" },
];

export function AbaAgente({ plano, initialConfig }: AbaAgenteProps) {
  const [ativo, setAtivo] = useState(initialConfig.ativo);
  const [nomeAgente, setNomeAgente] = useState(initialConfig.nome_agente);
  const [tom, setTom] = useState<TomAgente>(initialConfig.tom);
  const [provedor, setProvedor] = useState<ProvedorIA>(initialConfig.provedor);
  const [modelo, setModelo] = useState(initialConfig.modelo);
  const [apiKey, setApiKey] = useState(initialConfig.has_api_key ? API_KEY_MASK : "");
  const [horarioInicio, setHorarioInicio] = useState(initialConfig.horario_inicio);
  const [horarioFim, setHorarioFim] = useState(initialConfig.horario_fim);
  const [agendarVisitas, setAgendarVisitas] = useState(initialConfig.agendar_visitas);
  const [instrucoes, setInstrucoes] = useState(initialConfig.instrucoes_customizadas ?? "");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isTestingConnection, startTestConnection] = useTransition();

  const modelosDisponiveis = useMemo(
    () => MODELOS_POR_PROVEDOR[provedor],
    [provedor],
  );

  if (plano !== "profissional") {
    return (
      <Card className="border-accent/30">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-accent/15 text-accent">
              <Sparkles className="size-5" />
            </div>
            <div>
              <CardTitle>Agente de IA — Plano Profissional</CardTitle>
              <CardDescription>
                Automatize o atendimento no WhatsApp com inteligência artificial.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Seu plano atual é <strong className="text-foreground">Básico</strong>. Faça upgrade
            para o plano Profissional e configure um agente de IA personalizado para qualificar
            leads e sugerir imóveis automaticamente.
          </p>
          <Button variant="secondary" disabled>
            Fazer upgrade (em breve)
          </Button>
        </CardContent>
      </Card>
    );
  }

  function handleProvedorChange(novoProvedor: ProvedorIA) {
    setProvedor(novoProvedor);

    if (!MODELOS_POR_PROVEDOR[novoProvedor].includes(modelo)) {
      setModelo(MODELO_PADRAO_POR_PROVEDOR[novoProvedor]);
    }
  }

  function handleApiKeyFocus() {
    if (apiKey === API_KEY_MASK) {
      setApiKey("");
    }
  }

  function buildPayload(): SaveAgenteConfigInput {
    return {
      ativo,
      nome_agente: nomeAgente,
      tom,
      provedor,
      modelo,
      api_key: apiKey,
      instrucoes_customizadas: instrucoes,
      horario_inicio: horarioInicio,
      horario_fim: horarioFim,
      agendar_visitas: agendarVisitas,
    };
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    setError(null);

    startTransition(async () => {
      const result = await saveAgenteConfig(buildPayload());

      if (result.error) {
        setError(result.error);
        return;
      }

      if (apiKey && apiKey !== API_KEY_MASK) {
        setApiKey(API_KEY_MASK);
      }

      setFeedback(result.message ?? "Configurações salvas.");
    });
  }

  function handleTestarConexao() {
    setFeedback(null);
    setError(null);

    startTestConnection(async () => {
      const result = await testarConexaoIA(provedor, modelo, apiKey);

      if (result.error) {
        setError(result.error);
        return;
      }

      setFeedback(result.message ?? "Conexão OK.");
    });
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-secondary/15 text-secondary">
                <Bot className="size-5" />
              </div>
              <div>
                <CardTitle>Agente de IA</CardTitle>
                <CardDescription>
                  Configure o assistente virtual que atende leads no WhatsApp.
                </CardDescription>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2">
              <span
                className={cn(
                  "size-2 rounded-full",
                  ativo ? "bg-green-500" : "bg-muted-foreground/40",
                )}
                aria-hidden
              />
              <Label htmlFor="agente-ativo" className="cursor-pointer">
                {ativo ? "Ativo" : "Inativo"}
              </Label>
              <Switch id="agente-ativo" checked={ativo} onCheckedChange={setAtivo} />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="nome_agente">Nome do agente</Label>
                <Input
                  id="nome_agente"
                  value={nomeAgente}
                  onChange={(event) => setNomeAgente(event.target.value)}
                  placeholder="Assistente Virtual"
                />
              </div>

              <fieldset className="space-y-2 sm:col-span-2">
                <legend className="text-sm font-medium">Tom de voz</legend>
                <div className="flex flex-wrap gap-2">
                  {TOM_OPCOES.map((opcao) => (
                    <button
                      key={opcao.value}
                      type="button"
                      onClick={() => setTom(opcao.value)}
                      className={cn(
                        "rounded-lg border px-3 py-2 text-sm transition-colors",
                        tom === opcao.value
                          ? "border-secondary bg-secondary/10 text-secondary"
                          : "border-border hover:bg-muted",
                      )}
                    >
                      {opcao.label}
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset className="space-y-2 sm:col-span-2">
                <legend className="text-sm font-medium">Provedor</legend>
                <div className="flex flex-wrap gap-2">
                  {PROVEDOR_OPCOES.map((opcao) => (
                    <button
                      key={opcao.value}
                      type="button"
                      onClick={() => handleProvedorChange(opcao.value)}
                      className={cn(
                        "rounded-lg border px-3 py-2 text-sm transition-colors",
                        provedor === opcao.value
                          ? "border-secondary bg-secondary/10 text-secondary"
                          : "border-border hover:bg-muted",
                      )}
                    >
                      {opcao.label}
                    </button>
                  ))}
                </div>
              </fieldset>

              <div className="space-y-2">
                <Label htmlFor="modelo">Modelo</Label>
                <Select value={modelo} onValueChange={setModelo}>
                  <SelectTrigger id="modelo">
                    <SelectValue placeholder="Selecione o modelo" />
                  </SelectTrigger>
                  <SelectContent>
                    {modelosDisponiveis.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="api_key">Chave de API</Label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    id="api_key"
                    type="password"
                    value={apiKey}
                    onChange={(event) => setApiKey(event.target.value)}
                    onFocus={handleApiKeyFocus}
                    placeholder="sk-..."
                    autoComplete="off"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleTestarConexao}
                    disabled={isTestingConnection}
                    className="shrink-0"
                  >
                    {isTestingConnection ? "Testando..." : "Testar conexão"}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="horario_inicio">Horário início</Label>
                <Input
                  id="horario_inicio"
                  type="time"
                  value={horarioInicio}
                  onChange={(event) => setHorarioInicio(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="horario_fim">Horário fim</Label>
                <Input
                  id="horario_fim"
                  type="time"
                  value={horarioFim}
                  onChange={(event) => setHorarioFim(event.target.value)}
                />
              </div>

              <div className="flex items-center gap-3 sm:col-span-2">
                <Switch
                  id="agendar_visitas"
                  checked={agendarVisitas}
                  onCheckedChange={setAgendarVisitas}
                />
                <Label htmlFor="agendar_visitas" className="cursor-pointer">
                  Pode propor agendamento de visita
                </Label>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="instrucoes">Instruções extras</Label>
                <Textarea
                  id="instrucoes"
                  value={instrucoes}
                  onChange={(event) => setInstrucoes(event.target.value)}
                  placeholder="Ex.: Sempre mencionar financiamento. Não falar de imóveis acima de R$ 1M."
                  rows={4}
                />
              </div>
            </div>

            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}

            {feedback ? (
              <p className="text-sm text-secondary" role="status">
                {feedback}
              </p>
            ) : null}

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="submit" disabled={isPending}>
                {isPending ? "Salvando..." : "Salvar configurações"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setChatOpen(true)}
              >
                Testar agente agora
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <ChatTesteAgente open={chatOpen} onOpenChange={setChatOpen} />
    </>
  );
}
