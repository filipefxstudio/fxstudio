import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import type { Corretor } from "@/types";

export const getCorretorForUser = cache(async (): Promise<Corretor | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data } = await supabase
    .from("corretores")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return data;
});

export function getSaudacao(): string {
  const hora = new Date().getHours();

  if (hora >= 5 && hora < 12) {
    return "Bom dia";
  }

  if (hora >= 12 && hora < 18) {
    return "Boa tarde";
  }

  return "Boa noite";
}
