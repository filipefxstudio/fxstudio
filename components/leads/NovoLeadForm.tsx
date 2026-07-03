"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createLead } from "@/lib/actions/leads";
import { FINALIDADE_BUSCA_OPTIONS } from "@/lib/constants/leads";
import type { MidiaOrigem } from "@/types";

interface NovoLeadFormProps {
  midias: MidiaOrigem[];
  perfis: { id: string; nome: string }[];
}

export function NovoLeadForm({ midias, perfis }: NovoLeadFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [finalidade, setFinalidade] = useState<string>("");
  const [tipoImovel, setTipoImovel] = useState("");
  const [bairros, setBairros] = useState("");
  const [midiaNome, setMidiaNome] = useState("");
  const [perfilId, setPerfilId] = useState("");
  const [observacoes, setObservacoes] = useState("");

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await createLead({
        nome,
        telefone,
        email: email || undefined,
        finalidade_busca: finalidade || undefined,
        tipo_imovel_busca: tipoImovel || undefined,
        bairros_interesse: bairros
          ? bairros.split(",").map((b) => b.trim()).filter(Boolean)
          : undefined,
        midia_nome: midiaNome || undefined,
        perfil_id: perfilId || undefined,
        observacoes: observacoes || undefined,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      if (result.leadId) {
        router.push(`/dashboard/atendimentos/${result.leadId}`);
      } else {
        router.push("/dashboard/atendimentos");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Novo lead</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone *</Label>
              <Input
                id="telefone"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Finalidade</Label>
              <Select value={finalidade} onValueChange={setFinalidade}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {FINALIDADE_BUSCA_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo de imóvel buscado</Label>
              <Input
                id="tipo"
                value={tipoImovel}
                onChange={(e) => setTipoImovel(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bairros">Bairros (separados por vírgula)</Label>
              <Input
                id="bairros"
                value={bairros}
                onChange={(e) => setBairros(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Mídia de origem</Label>
              <Select value={midiaNome} onValueChange={setMidiaNome}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {midias
                    .filter((m) => m.ativo)
                    .map((midia) => (
                      <SelectItem key={midia.id} value={midia.nome}>
                        {midia.nome}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            {perfis.length > 0 ? (
              <div className="space-y-2">
                <Label>Responsável</Label>
                <Select value={perfilId} onValueChange={setPerfilId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {perfis.map((perfil) => (
                      <SelectItem key={perfil.id} value={perfil.id}>
                        {perfil.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="obs">Observações</Label>
            <Textarea
              id="obs"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={3}
            />
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button type="submit" disabled={isPending}>
              {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Salvar lead
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link href="/dashboard/atendimentos">Cancelar</Link>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
