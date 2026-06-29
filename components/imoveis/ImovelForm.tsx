"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { Controller, useForm, type Resolver } from "react-hook-form";

import { CepInput } from "@/components/imoveis/CepInput";
import { FotoUpload, type FotoItem } from "@/components/imoveis/FotoUpload";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { createImovel } from "@/lib/actions/imoveis";
import {
  DIFERENCIAIS_OPCOES,
  ESTADOS_BR,
  FINALIDADES_IMOVEL,
  STATUS_IMOVEL,
  TIPOS_IMOVEL,
} from "@/lib/constants/imoveis";
import { generateImovelSlug, cn } from "@/lib/utils";
import {
  imovelFormDefaultValues,
  imovelFormSchema,
  type ImovelFormValues,
} from "@/lib/validations/imovel";

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

export function ImovelForm() {
  const [fotos, setFotos] = useState<FotoItem[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
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
    defaultValues: imovelFormDefaultValues,
  });

  const finalidade = watch("finalidade");
  const titulo = watch("titulo");
  const cidade = watch("cidade");

  const slugPreview = useMemo(
    () => generateImovelSlug(titulo ?? "", cidade ?? ""),
    [titulo, cidade],
  );

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
      const result = await createImovel(
        values,
        fotos.map((foto) => ({
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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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

          <div className="grid gap-4 sm:grid-cols-2">
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
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger aria-invalid={Boolean(errors.status)}>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_IMOVEL.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError message={errors.status?.message} />
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

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="logradouro">Logradouro</Label>
              <Input
                id="logradouro"
                placeholder="Rua, avenida..."
                aria-invalid={Boolean(errors.logradouro)}
                {...register("logradouro")}
              />
              <FieldError message={errors.logradouro?.message} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="numero">Número</Label>
              <Input
                id="numero"
                placeholder="123"
                aria-invalid={Boolean(errors.numero)}
                {...register("numero")}
              />
              <FieldError message={errors.numero?.message} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="complemento">
              Complemento{" "}
              <span className="font-normal text-muted-foreground">(opcional)</span>
            </Label>
            <Input
              id="complemento"
              placeholder="Apto, bloco, sala..."
              {...register("complemento")}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="bairro">Bairro</Label>
              <Input
                id="bairro"
                aria-invalid={Boolean(errors.bairro)}
                {...register("bairro")}
              />
              <FieldError message={errors.bairro?.message} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cidade">Cidade</Label>
              <Input
                id="cidade"
                aria-invalid={Boolean(errors.cidade)}
                {...register("cidade")}
              />
              <FieldError message={errors.cidade?.message} />
            </div>

            <div className="space-y-2">
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
                        <SelectItem key={uf} value={uf}>
                          {uf}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError message={errors.estado?.message} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="latitude">
                Latitude{" "}
                <span className="font-normal text-muted-foreground">(opcional)</span>
              </Label>
              <Input
                id="latitude"
                type="number"
                step="any"
                placeholder="-23.550520"
                aria-invalid={Boolean(errors.latitude)}
                {...register("latitude")}
              />
              <FieldError message={errors.latitude?.message} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="longitude">
                Longitude{" "}
                <span className="font-normal text-muted-foreground">(opcional)</span>
              </Label>
              <Input
                id="longitude"
                type="number"
                step="any"
                placeholder="-46.633308"
                aria-invalid={Boolean(errors.longitude)}
                {...register("longitude")}
              />
              <FieldError message={errors.longitude?.message} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>3. Características</CardTitle>
          <CardDescription>Áreas e composição do imóvel.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="area_util">
                Área útil (m²){" "}
                <span className="font-normal text-muted-foreground">(opcional)</span>
              </Label>
              <Input
                id="area_util"
                type="number"
                min={0}
                step="0.01"
                {...register("area_util")}
              />
              <FieldError message={errors.area_util?.message} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="area_total">
                Área total (m²){" "}
                <span className="font-normal text-muted-foreground">(opcional)</span>
              </Label>
              <Input
                id="area_total"
                type="number"
                min={0}
                step="0.01"
                {...register("area_total")}
              />
              <FieldError message={errors.area_total?.message} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {(
              [
                ["quartos", "Quartos"],
                ["suites", "Suítes"],
                ["banheiros", "Banheiros"],
                ["vagas", "Vagas"],
              ] as const
            ).map(([name, label]) => (
              <div key={name} className="space-y-2">
                <Label htmlFor={name}>{label}</Label>
                <Input
                  id={name}
                  type="number"
                  min={0}
                  step={1}
                  aria-invalid={Boolean(errors[name])}
                  {...register(name)}
                />
                <FieldError message={errors[name]?.message} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>4. Valores</CardTitle>
          <CardDescription>
            {finalidade === "venda"
              ? "Informe o valor de venda e taxas associadas."
              : "Informe o valor de locação e taxas associadas."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {finalidade === "venda" ? (
            <div className="space-y-2">
              <Label htmlFor="valor_venda">Valor de venda (R$)</Label>
              <Input
                id="valor_venda"
                type="number"
                min={0}
                step="0.01"
                placeholder="450000"
                aria-invalid={Boolean(errors.valor_venda)}
                {...register("valor_venda")}
              />
              <FieldError message={errors.valor_venda?.message} />
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="valor_locacao">Valor de locação (R$)</Label>
              <Input
                id="valor_locacao"
                type="number"
                min={0}
                step="0.01"
                placeholder="3500"
                aria-invalid={Boolean(errors.valor_locacao)}
                {...register("valor_locacao")}
              />
              <FieldError message={errors.valor_locacao?.message} />
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="valor_condominio">
                Condomínio (R$){" "}
                <span className="font-normal text-muted-foreground">(opcional)</span>
              </Label>
              <Input
                id="valor_condominio"
                type="number"
                min={0}
                step="0.01"
                {...register("valor_condominio")}
              />
              <FieldError message={errors.valor_condominio?.message} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="valor_iptu">
                IPTU (R$){" "}
                <span className="font-normal text-muted-foreground">(opcional)</span>
              </Label>
              <Input
                id="valor_iptu"
                type="number"
                min={0}
                step="0.01"
                {...register("valor_iptu")}
              />
              <FieldError message={errors.valor_iptu?.message} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>5. Descrição e diferenciais</CardTitle>
          <CardDescription>
            Texto de apresentação e destaques do imóvel.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="descricao">
              Descrição{" "}
              <span className="font-normal text-muted-foreground">(opcional)</span>
            </Label>
            <Textarea
              id="descricao"
              rows={5}
              placeholder="Descreva o imóvel, ambientes, acabamentos..."
              {...register("descricao")}
            />
          </div>

          <div className="space-y-2">
            <Label>Diferenciais</Label>
            <Controller
              control={control}
              name="diferenciais"
              render={({ field }) => (
                <div className="flex flex-wrap gap-2">
                  {DIFERENCIAIS_OPCOES.map((item) => {
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
                            : "border-border bg-background text-foreground hover:bg-muted",
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

          <div className="space-y-2">
            <Label htmlFor="video_url">
              URL do vídeo{" "}
              <span className="font-normal text-muted-foreground">(opcional)</span>
            </Label>
            <Input
              id="video_url"
              type="url"
              placeholder="https://youtube.com/..."
              aria-invalid={Boolean(errors.video_url)}
              {...register("video_url")}
            />
            <FieldError message={errors.video_url?.message} />
          </div>

          <Controller
            control={control}
            name="publicado_site"
            render={({ field }) => (
              <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3">
                <Checkbox
                  id="publicado_site"
                  checked={field.value}
                  onCheckedChange={(checked) => field.onChange(checked === true)}
                />
                <div>
                  <Label htmlFor="publicado_site" className="cursor-pointer">
                    Publicar no site
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    O imóvel ficará visível na vitrine pública do corretor.
                  </p>
                </div>
              </div>
            )}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>6. Fotos</CardTitle>
          <CardDescription>
            Adicione imagens do imóvel. A primeira foto será a capa.
          </CardDescription>
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
          <Link href="/dashboard/imoveis">Cancelar</Link>
        </Button>
        <Button type="submit" disabled={isPending} className="min-w-36">
          {isPending ? (
            <>
              <Loader2 className="animate-spin" data-icon="inline-start" />
              Salvando...
            </>
          ) : (
            "Cadastrar imóvel"
          )}
        </Button>
      </div>
    </form>
  );
}
