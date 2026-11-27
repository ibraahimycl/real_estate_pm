import "server-only";

import { sunucuIstemcisi } from "@/lib/supabase/server";
import type { Talep } from "@/types/database";

/** Emlakçı paneli: tüm talepler. */
export async function taplepleriListele(durum?: string): Promise<Talep[]> {
  const supabase = await sunucuIstemcisi();
  let sorgu = supabase
    .from("talepler")
    .select("*")
    .order("created_at", { ascending: false });
  if (durum === "aktif" || durum === "karsilandi" || durum === "kapandi") {
    sorgu = sorgu.eq("durum", durum);
  }
  const { data } = await sorgu;
  return (data ?? []) as Talep[];
}

/** Müşteri hesabı: yalnızca kendi talepleri (RLS zaten sınırlar). */
export async function taleplerim(profilId: string): Promise<Talep[]> {
  const supabase = await sunucuIstemcisi();
  const { data } = await supabase
    .from("talepler")
    .select("*")
    .eq("profil_id", profilId)
    .order("created_at", { ascending: false });
  return (data ?? []) as Talep[];
}

export async function talepGetir(id: string): Promise<Talep | null> {
  const supabase = await sunucuIstemcisi();
  const { data } = await supabase
    .from("talepler")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return (data as Talep | null) ?? null;
}
