"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { Controller, useForm, type Resolver } from "react-hook-form";

import { CepInput } from "@/components/imoveis/CepInput";
import { FotoUpload, type FotoItem } from "@/components/imoveis/FotoUpload";
import { ProprietarioSection } from "@/components/imoveis/ProprietarioSection";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { toast } from "@/hooks/use-toast";
import {
  checkImovelDuplicado,
  createImovel,
  getProximoCodigoPreview,
  updateImovel,
} from "@/lib/actions/imoveis";
import { CARACTERISTICAS_CHECKLIST } from "@/lib/constants/caracteristicas-checklist";
import {
  COMPLEMENTO_TIPOS,
  ESTADOS_BR,
  FINALIDADES_IMOVEL,
  LOCAL_CHAVES_OPCOES,
  TIPOS_IMOVEL,
  VAGAS_COBERTURA_OPCOES,
  VAGAS_TIPO_OPCOES,
} from "@/lib/constants/imoveis";
import { geocodeAddress } from "@/lib/imoveis/geocode";
import { buildComplementoString, fotosToFotoItems, imovelToFormValues } from "@/lib/imoveis/form";
import { generateImovelSlug, cn } from "@/lib/utils";
import {
  imovelFormDefaultValues,
  imovelFormSchema,
  type ImovelFormValues,
} from "@/lib/validations/imovel";
import type { Imovel, StatusImovel } from "@/types";

interface ImovelFormProps {
  mode?: "create" | "edit";
  imovel?: Imovel;
  statusList?: StatusImovel[];
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return (
    <p className="text-sm text-destructive" role="alert">
      {message}
    </p>
  );
}

export function ImovelForm({ mode = "create", imovel, statusList = [] }: ImovelFormProps) {
  const isEdit = mode === "edit" && imovel;

  const [fotos, setFotos] = useState<FotoItem[]>(() =>
    isEdit ? fotosToFotoItems(imovel.fotos ?? []) : [],
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [proximoCodigo, setProximoCodigo] = useState<string | null>(
    isEdit ? (imovel.codigo ?? null) : null,
  );
  const [isPending, startTransition] = useTransition();

  const {
    control,
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ImovelFormValues>({
    resolver: zodResolver(imovelFormSchema) as Resolver<ImovelFormValues>,
    defaultValues: isEdit ? imovelToFormValues(imovel) : imovelFormDefaultValues,
  });

  const finalidade = watch("finalidade");
  const titulo = watch("titulo");
  const cidade = watch("cidade");
  const cep = watch("cep");
  const numero = watch("numero");
  const complementoTipo = watch("complemento_tipo");
  const complementoNumero = watch("complemento_numero");
  const complementoTorre = watch("complemento_torre");
  const condominioNome = watch("condominio_nome");
  const portalDiferente = watch("portal_endereco_diferente");
  const portalCep = watch("portal_cep");
  const portalLogradouro = watch("portal_logradouro");
  const portalNumero = watch("portal_numero");
  const portalBairro = watch("portal_bairro");
  const portalCidade = watch("portal_cidade");
  const portalEstado = watch("portal_estado");
  const logradouro = watch("logradouro");
  const bairro = watch("bairro");
  const estado = watch("estado");
  const localChaves = watch("local_chaves");
  const clienteId = watch("cliente_id");
  const statusImovelId = watch("status_imovel_id");

  const slugPreview = useMemo(
    () => generateImovelSlug(titulo ?? "", cidade ?? ""),
    [titulo, cidade],
  );

  useEffect(() => {
    if (!isEdit) {
      getProximoCodigoPreview().then(setProximoCodigo);
    }
  }, [isEdit]);

  useEffect(() => {
    if (!isEdit && statusList.length > 0 && !statusImovelId) {
      const defaultStatus = statusList.find((s) => s.nome === "Disponível") ?? statusList[0];
      if (defaultStatus) {
        setValue("status_imovel_id", defaultStatus.id);
      }
    }
  }, [isEdit, statusList, statusImovelId, setValue]);

  useEffect(() => {
    const address = portalDiferente
      ? {
          logradouro: portalLogradouro ?? "",
          numero: portalNumero ?? "",
          bairro: portalBairro ?? "",
          cidade: portalCidade ?? "",
          estado: portalEstado ?? "",
          cep: portalCep,
        }
      : {
          logradouro: logradouro ?? "",
          numero: numero ?? "",
          bairro: bairro ?? "",
          cidade: cidade ?? "",
          estado: estado ?? "",
          cep,
        };

    if (!address.logradouro || !address.cidade) {
      return;
    }

    const timer = setTimeout(async () => {
      const result = await geocodeAddress(address);
      if (result) {
        setValue("latitude", result.latitude, { shouldValidate: true });
        setValue("longitude", result.longitude, { shouldValidate: true });
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [
    cep,
    numero,
    logradouro,
    bairro,
    estado,
    cidade,
    portalDiferente,
    portalCep,
    portalLogradouro,
    portalNumero,
    portalBairro,
    portalCidade,
    portalEstado,
    setValue,
  ]);

  useEffect(() => {
    if (!cep || !numero) {
      return;
    }

    const complemento = buildComplementoString({
      ...imovelFormDefaultValues,
      cep,
      numero,
      complemento_tipo: complementoTipo,
      complemento_numero: complementoNumero,
      complemento_torre: complementoTorre,
      condominio_nome: condominioNome,
    });

    const timer = setTimeout(async () => {
      const result = await checkImovelDuplicado(
        cep,
        numero,
        complemento,
        isEdit ? imovel.id : undefined,
      );

      if (result.duplicado) {
        toast({
          title: "Possível duplicidade",
          description: result.titulo
            ? `Já existe um imóvel neste endereço: "${result.titulo}".`
            : "Já existe um imóvel com este CEP, número e complemento.",
          variant: "destructive",
        });
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [
    cep,
    numero,
    complementoTipo,
    complementoNumero,
    complementoTorre,
    condominioNome,
    isEdit,
    imovel?.id,
  ]);

  function toggleDiferencial(
    current: string[],
    item: string,
    checked: boolean,
  ): string[] {
    if (checked) {
      return current.includes(item) ? current : [...current, item];
    }
    return current.filter((value) => value !== item);
  }

  function onSubmit(values: ImovelFormValues) {
    setSubmitError(null);

    startTransition(async () => {
      if (isEdit) {
        const result = await updateImovel(
          imovel.id,
          values,
          fotos.map((foto) => ({
            existingId: foto.existingId,
            file: foto.file,
            legenda: foto.legenda,
            ordem: foto.ordem,
          })),
        );

        if (result?.error) {
          setSubmitError(result.error);
        }
        return;
      }

      const newFotos = fotos.filter(
        (foto): foto is FotoItem & { file: File } => Boolean(foto.file),
      );

      const result = await createImovel(
        values,
        newFotos.map((foto) => ({
          file: foto.file,
          legenda: foto.legenda,
          ordem: foto.ordem,
        })),
      );

      if (result?.error) {
        setSubmitError(result.error);
      }
    });
  }

  const checkboxFields = [
    { name: "exclusividade" as const, label: "Exclusividade" },
    { name: "imovel_ocupado" as const, label: "Imóvel ocupado" },
    { name: "contrato_aluguel_ativo" as const, label: "Contrato de aluguel ativo" },
    { name: "aceita_financiamento" as const, label: "Aceita financiamento" },
    { name: "aceita_permuta" as const, label: "Aceita permuta" },
    { name: "imovel_na_planta" as const, label: "Imóvel na planta" },
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Código do imóvel</CardTitle>
          <CardDescription>
            Código sequencial automático e código personalizado opcional.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="codigo">Código</Label>
            <Input
              id="codigo"
              value={proximoCodigo ?? "—"}
              readOnly
              className="bg-muted font-mono"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="codigo_personalizado">
              Código personalizado{" "}
              <span className="font-normal text-muted-foreground">(opcional)</span>
            </Label>
            <Input
              id="codigo_personalizado"
              placeholder="Ex.: APT-102"
              {...register("codigo_personalizado")}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>1. Informações básicas</CardTitle>
          <CardDescription>
            Dados principais do imóvel exibidos no CRM e no site.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="titulo">Título</Label>
            <Input
              id="titulo"
              placeholder="Ex.: Apartamento 3 quartos com vista"
              aria-invalid={Boolean(errors.titulo)}
              {...register("titulo")}
            />
            <FieldError message={errors.titulo?.message} />
          </div>

          {slugPreview ? (
            <p className="text-sm text-muted-foreground">
              Slug: <span className="font-mono text-foreground">{slugPreview}</span>
            </p>
          ) : null}

          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Controller
                control={control}
                name="tipo"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger aria-invalid={Boolean(errors.tipo)}>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPOS_IMOVEL.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError message={errors.tipo?.message} />
            </div>

            <div className="space-y-2">
              <Label>Finalidade</Label>
              <Controller
                control={control}
                name="finalidade"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger aria-invalid={Boolean(errors.finalidade)}>
                      <SelectValue placeholder="Selecione a finalidade" />
                    </SelectTrigger>
                    <SelectContent>
                      {FINALIDADES_IMOVEL.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError message={errors.finalidade?.message} />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Controller
                control={control}
                name="status_imovel_id"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger aria-invalid={Boolean(errors.status_imovel_id)}>
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      {statusList.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError message={errors.status_imovel_id?.message} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. Localização</CardTitle>
          <CardDescription>
            Endereço completo. O CEP preenche logradouro, bairro, cidade e UF automaticamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 grid-cols-12">
            <div className="col-span-12 sm:col-span-2">
              <Controller
                control={control}
                name="cep"
                render={({ field }) => (
                  <CepInput
                    value={field.value}
                    onChange={field.onChange}
                    onAddressFound={(address) => {
                      setValue("logradouro", address.logradouro, { shouldValidate: true });
                      setValue("bairro", address.bairro, { shouldValidate: true });
                      setValue("cidade", address.cidade, { shouldValidate: true });
                      setValue("estado", address.estado, { shouldValidate: true });
                    }}
                    error={errors.cep?.message}
                    disabled={isPending}
                  />
                )}
              />
            </div>
            <div className="col-span-12 space-y-2 sm:col-span-7">
              <Label htmlFor="logradouro">Logradouro</Label>
              <Input id="logradouro" aria-invalid={Boolean(errors.logradouro)} {...register("logradouro")} />
              <FieldError message={errors.logradouro?.message} />
            </div>
            <div className="col-span-6 space-y-2 sm:col-span-3">
              <Label htmlFor="numero">Número</Label>
              <Input id="numero" aria-invalid={Boolean(errors.numero)} {...register("numero")} />
              <FieldError message={errors.numero?.message} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Tipo de complemento</Label>
              <Controller
                control={control}
                name="complemento_tipo"
                render={({ field }) => (
                  <Select value={field.value || undefined} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {COMPLEMENTO_TIPOS.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="complemento_numero">Número / Identificação</Label>
              <Input id="complemento_numero" placeholder="102" {...register("complemento_numero")} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="complemento_torre">Torre / Bloco</Label>
              <Input id="complemento_torre" placeholder="Torre A" {...register("complemento_torre")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="condominio_nome">Nome do condomínio</Label>
              <Input id="condominio_nome" placeholder="Residencial das Flores" {...register("condominio_nome")} />
            </div>
          </div>

          <div className="grid gap-4 grid-cols-12">
            <div className="col-span-12 space-y-2 sm:col-span-4">
              <Label htmlFor="bairro">Bairro</Label>
              <Input id="bairro" aria-invalid={Boolean(errors.bairro)} {...register("bairro")} />
              <FieldError message={errors.bairro?.message} />
            </div>
            <div className="col-span-12 space-y-2 sm:col-span-6">
              <Label htmlFor="cidade">Cidade</Label>
              <Input id="cidade" aria-invalid={Boolean(errors.cidade)} {...register("cidade")} />
              <FieldError message={errors.cidade?.message} />
            </div>
            <div className="col-span-12 space-y-2 sm:col-span-2">
              <Label>Estado (UF)</Label>
              <Controller
                control={control}
                name="estado"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger aria-invalid={Boolean(errors.estado)}>
                      <SelectValue placeholder="UF" />
                    </SelectTrigger>
                    <SelectContent>
                      {ESTADOS_BR.map((uf) => (
                        <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError message={errors.estado?.message} />
            </div>
          </div>

          <Controller
            control={control}
            name="portal_endereco_diferente"
            render={({ field }) => (
              <div className="space-y-4 rounded-lg border border-border bg-muted/20 p-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="portal_endereco_diferente"
                    checked={field.value}
                    onCheckedChange={(checked) => field.onChange(checked === true)}
                  />
                  <div>
                    <Label htmlFor="portal_endereco_diferente" className="cursor-pointer">
                      Usar endereço diferente para publicação nos portais
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      O endereço real ficará apenas no sistema interno.
                    </p>
                  </div>
                </div>

                {portalDiferente ? (
                  <div className="space-y-4">
                    <Controller
                      control={control}
                      name="portal_cep"
                      render={({ field }) => (
                        <CepInput
                          id="portal_cep"
                          value={field.value ?? ""}
                          onChange={field.onChange}
                          onAddressFound={(address) => {
                            setValue("portal_logradouro", address.logradouro, { shouldValidate: true });
                            setValue("portal_bairro", address.bairro, { shouldValidate: true });
                            setValue("portal_cidade", address.cidade, { shouldValidate: true });
                            setValue("portal_estado", address.estado, { shouldValidate: true });
                          }}
                          error={errors.portal_cep?.message}
                          disabled={isPending}
                        />
                      )}
                    />
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="portal_logradouro">Logradouro para portais *</Label>
                        <Input id="portal_logradouro" {...register("portal_logradouro")} />
                        <FieldError message={errors.portal_logradouro?.message} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="portal_numero">Número *</Label>
                        <Input id="portal_numero" {...register("portal_numero")} />
                        <FieldError message={errors.portal_numero?.message} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="portal_bairro">Bairro *</Label>
                        <Input id="portal_bairro" {...register("portal_bairro")} />
                        <FieldError message={errors.portal_bairro?.message} />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="portal_cidade">Cidade *</Label>
                        <Input id="portal_cidade" {...register("portal_cidade")} />
                        <FieldError message={errors.portal_cidade?.message} />
                      </div>
                      <div className="space-y-2">
                        <Label>Estado *</Label>
                        <Controller
                          control={control}
                          name="portal_estado"
                          render={({ field }) => (
                            <Select value={field.value || undefined} onValueChange={field.onChange}>
                              <SelectTrigger>
                                <SelectValue placeholder="UF" />
                              </SelectTrigger>
                              <SelectContent>
                                {ESTADOS_BR.map((uf) => (
                                  <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                        <FieldError message={errors.portal_estado?.message} />
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="latitude">Latitude</Label>
              <Input id="latitude" type="number" step="any" readOnly className="bg-muted" {...register("latitude")} />
              <p className="text-xs text-muted-foreground">Preenchida automaticamente pelo endereço</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="longitude">Longitude</Label>
              <Input id="longitude" type="number" step="any" readOnly className="bg-muted" {...register("longitude")} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>3. Chaves e opções</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Local das chaves *</Label>
              <Controller
                control={control}
                name="local_chaves"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger aria-invalid={Boolean(errors.local_chaves)}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LOCAL_CHAVES_OPCOES.map((item) => (
                        <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError message={errors.local_chaves?.message} />
            </div>

            {localChaves === "imobiliaria" ? (
              <div className="space-y-2">
                <Label htmlFor="chaves_codigo">Código / número da chave *</Label>
                <Input id="chaves_codigo" {...register("chaves_codigo")} />
                <FieldError message={errors.chaves_codigo?.message} />
              </div>
            ) : null}

            {localChaves === "outros" ? (
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="chaves_descricao">Descrição do local *</Label>
                <Textarea id="chaves_descricao" rows={2} {...register("chaves_descricao")} />
                <FieldError message={errors.chaves_descricao?.message} />
              </div>
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {checkboxFields.map(({ name, label }) => (
              <Controller
                key={name}
                control={control}
                name={name}
                render={({ field }) => (
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={name}
                      checked={field.value}
                      onCheckedChange={(checked) => field.onChange(checked === true)}
                    />
                    <Label htmlFor={name} className="cursor-pointer font-normal">{label}</Label>
                  </div>
                )}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>4. Características</CardTitle>
          <CardDescription>Áreas e composição do imóvel.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="area_util">Área útil (m²)</Label>
              <Input id="area_util" type="number" min={0} step="0.01" {...register("area_util")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="area_total">Área total (m²)</Label>
              <Input id="area_total" type="number" min={0} step="0.01" {...register("area_total")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ano_construcao">Ano de construção</Label>
              <Input id="ano_construcao" type="number" min={1800} step={1} {...register("ano_construcao")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="elevadores">Elevadores</Label>
              <Input id="elevadores" type="number" min={0} step={1} {...register("elevadores")} />
            </div>
          </div>

          <div className="grid gap-4 grid-cols-2 sm:grid-cols-5">
            {(
              [
                ["quartos", "Quartos"],
                ["suites", "Suítes"],
                ["banheiros", "Banheiros"],
                ["salas", "Salas"],
                ["vagas", "Vagas"],
              ] as const
            ).map(([name, label]) => (
              <div key={name} className="space-y-2">
                <Label htmlFor={name}>{label}</Label>
                <Input id={name} type="number" min={0} step={1} {...register(name)} />
                <FieldError message={errors[name]?.message} />
              </div>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Tipo de vaga</Label>
              <Controller
                control={control}
                name="vagas_tipo"
                render={({ field }) => (
                  <Select value={field.value || undefined} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {VAGAS_TIPO_OPCOES.map((item) => (
                        <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label>Cobertura da vaga</Label>
              <Controller
                control={control}
                name="vagas_cobertura"
                render={({ field }) => (
                  <Select value={field.value || undefined} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {VAGAS_COBERTURA_OPCOES.map((item) => (
                        <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>5. Valores</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {finalidade === "venda" ? (
            <div className="grid gap-4 grid-cols-12">
              <div className="col-span-12 space-y-2 sm:col-span-5">
                <Label htmlFor="valor_venda">Valor de venda (R$)</Label>
                <Controller
                  control={control}
                  name="valor_venda"
                  render={({ field }) => (
                    <CurrencyInput
                      id="valor_venda"
                      value={field.value}
                      onChange={field.onChange}
                      aria-invalid={Boolean(errors.valor_venda)}
                      disabled={isPending}
                    />
                  )}
                />
                <FieldError message={errors.valor_venda?.message} />
              </div>
              <div className="col-span-6 space-y-2 sm:col-span-4">
                <Label htmlFor="valor_condominio">Condomínio (R$)</Label>
                <Controller
                  control={control}
                  name="valor_condominio"
                  render={({ field }) => (
                    <CurrencyInput id="valor_condominio" value={field.value} onChange={field.onChange} disabled={isPending} />
                  )}
                />
              </div>
              <div className="col-span-6 space-y-2 sm:col-span-3">
                <Label htmlFor="valor_iptu">IPTU (R$)</Label>
                <Controller
                  control={control}
                  name="valor_iptu"
                  render={({ field }) => (
                    <CurrencyInput id="valor_iptu" value={field.value} onChange={field.onChange} disabled={isPending} />
                  )}
                />
              </div>
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-12">
              <div className="col-span-12 space-y-2 sm:col-span-5">
                <Label htmlFor="valor_locacao">Valor de locação (R$)</Label>
                <Controller
                  control={control}
                  name="valor_locacao"
                  render={({ field }) => (
                    <CurrencyInput
                      id="valor_locacao"
                      value={field.value}
                      onChange={field.onChange}
                      aria-invalid={Boolean(errors.valor_locacao)}
                      disabled={isPending}
                    />
                  )}
                />
                <FieldError message={errors.valor_locacao?.message} />
              </div>
              <div className="col-span-6 space-y-2 sm:col-span-4">
                <Label htmlFor="valor_condominio">Condomínio (R$)</Label>
                <Controller
                  control={control}
                  name="valor_condominio"
                  render={({ field }) => (
                    <CurrencyInput id="valor_condominio" value={field.value} onChange={field.onChange} disabled={isPending} />
                  )}
                />
              </div>
              <div className="col-span-6 space-y-2 sm:col-span-3">
                <Label htmlFor="valor_iptu">IPTU (R$)</Label>
                <Controller
                  control={control}
                  name="valor_iptu"
                  render={({ field }) => (
                    <CurrencyInput id="valor_iptu" value={field.value} onChange={field.onChange} disabled={isPending} />
                  )}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>6. Descrição e características</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea id="descricao" rows={5} {...register("descricao")} />
          </div>

          {CARACTERISTICAS_CHECKLIST.map((categoria) => (
            <div key={categoria.id} className="space-y-2">
              <Label>{categoria.titulo}</Label>
              <Controller
                control={control}
                name="diferenciais"
                render={({ field }) => (
                  <div className="flex flex-wrap gap-2">
                    {categoria.itens.map((item) => {
                      const selected = field.value.includes(item);
                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() =>
                            field.onChange(toggleDiferencial(field.value, item, !selected))
                          }
                          className={cn(
                            "rounded-full border px-3 py-1.5 text-sm transition-colors",
                            selected
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-background hover:bg-muted",
                          )}
                        >
                          {item}
                        </button>
                      );
                    })}
                  </div>
                )}
              />
            </div>
          ))}

          <div className="space-y-2">
            <Label htmlFor="video_url">URL do vídeo</Label>
            <Input id="video_url" type="url" {...register("video_url")} />
            <FieldError message={errors.video_url?.message} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Publicação</CardTitle>
          <CardDescription>
            Controle onde o imóvel será exibido.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Controller
            control={control}
            name="publicado_site"
            render={({ field }) => (
              <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3">
                <Label htmlFor="publicado_site" className="cursor-pointer">
                  Publicar no site
                </Label>
                <Switch
                  id="publicado_site"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isPending}
                />
              </div>
            )}
          />
          <Controller
            control={control}
            name="publicado_portais"
            render={({ field }) => (
              <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3">
                <Label htmlFor="publicado_portais" className="cursor-pointer">
                  Publicar nos portais
                </Label>
                <Switch
                  id="publicado_portais"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isPending}
                />
              </div>
            )}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>7. Proprietário</CardTitle>
          <CardDescription>Vincule ou cadastre o proprietário do imóvel.</CardDescription>
        </CardHeader>
        <CardContent>
          <ProprietarioSection
            control={control}
            setValue={setValue}
            clienteId={clienteId}
            disabled={isPending}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>8. Fotos</CardTitle>
        </CardHeader>
        <CardContent>
          <FotoUpload fotos={fotos} onChange={setFotos} disabled={isPending} />
        </CardContent>
      </Card>

      {submitError ? (
        <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert">
          {submitError}
        </p>
      ) : null}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" asChild disabled={isPending}>
          <Link href={isEdit ? `/dashboard/imoveis/${imovel.id}` : "/dashboard/imoveis"}>
            Cancelar
          </Link>
        </Button>
        <Button type="submit" disabled={isPending} className="min-w-36">
          {isPending ? (
            <>
              <Loader2 className="animate-spin" data-icon="inline-start" />
              Salvando...
            </>
          ) : isEdit ? (
            "Salvar alterações"
          ) : (
            "Cadastrar imóvel"
          )}
        </Button>
      </div>
    </form>
  );
}
