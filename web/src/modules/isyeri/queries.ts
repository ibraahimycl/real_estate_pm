import "server-only";

import { yoneticiIstemcisi } from "@/lib/supabase/admin";
import type { Ofis } from "@/types/database";

/**
 * Sistem tek bir emlak işletmesi için tasarlanmıştır; bu nedenle
 * ofis tablosunda tek kayıt tutulur ve ilk kayıt okunur.
 *
 * Yönetici istemcisi kullanılır: ofis bilgileri herkese açık (RLS: using(true))
 * olmasına karşın anon rolünde GRANT eksik olabileceğinden ziyaretçilerin
 * logo ve footer'da güncel işletme adını görmesini garanti eder.
 */
export async function isyeriGetir(): Promise<Ofis | null> {
  const supabase = yoneticiIstemcisi();
  const { data } = await supabase
    .from("ofis")
    .select("*")
    .order("created_at")
    .limit(1)
    .maybeSingle();
  return (data as Ofis | null) ?? null;
}
