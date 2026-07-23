import type { SupabaseClient } from "@supabase/supabase-js";

let negociosCamposCompletos: boolean | null = null;

/** Verifica se a migration 20260718200000_negocios_completo foi aplicada. */
export async function negociosTemCamposCompletos(
  supabase: SupabaseClient,
): Promise<boolean> {
  if (negociosCamposCompletos !== null) return negociosCamposCompletos;

  const { error } = await supabase.from("negocios").select("rateio").limit(0);
  negociosCamposCompletos = !error;
  return negociosCamposCompletos;
}
