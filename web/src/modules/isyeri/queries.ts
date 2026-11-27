import "server-only";

import { sunucuIstemcisi } from "@/lib/supabase/server";
import type { Ofis } from "@/types/database";

/**
 * Sistem tek bir emlak işletmesi için tasarlanmıştır; bu nedenle
 * ofis tablosunda tek kayıt tutulur ve ilk kayıt okunur.
 */
export async function isyeriGetir(): Promise<Ofis | null> {
  const supabase = await sunucuIstemcisi();
  const { data } = await supabase
    .from("ofis")
    .select("*")
    .order("created_at")
    .limit(1)
    .maybeSingle();
  return (data as Ofis | null) ?? null;
}
