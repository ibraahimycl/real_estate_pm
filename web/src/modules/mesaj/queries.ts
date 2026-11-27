import "server-only";

import { sunucuIstemcisi } from "@/lib/supabase/server";
import type { Emlak, Mesaj, Talep } from "@/types/database";

export type MesajSatiri = Mesaj & {
  talep: Pick<Talep, "ad_soyad" | "telefon" | "ilce" | "islem_turu"> | null;
  emlak: Pick<Emlak, "ilan_no" | "baslik" | "fiyat"> | null;
};

/** Emlakçı paneli: AI'ın ürettiği tüm eşleşme mesajları. */
export async function mesajlariListele(): Promise<MesajSatiri[]> {
  const supabase = await sunucuIstemcisi();

  const { data } = await supabase
    .from("mesajlar")
    .select("*")
    .order("gonderim_zamani", { ascending: false })
    .limit(100);

  const mesajlar = (data ?? []) as Mesaj[];
  if (mesajlar.length === 0) return [];

  const [{ data: talepler }, { data: emlaklar }] = await Promise.all([
    supabase
      .from("talepler")
      .select("id, ad_soyad, telefon, ilce, islem_turu")
      .in("id", [...new Set(mesajlar.map((m) => m.talep_id))]),
    supabase
      .from("emlaklar")
      .select("id, ilan_no, baslik, fiyat")
      .in(
        "id",
        [...new Set(mesajlar.map((m) => m.emlak_id).filter(Boolean))] as string[],
      ),
  ]);

  const talepHarita = new Map(
    ((talepler ?? []) as (Talep & { id: string })[]).map((t) => [t.id, t]),
  );
  const emlakHarita = new Map(
    ((emlaklar ?? []) as (Emlak & { id: string })[]).map((e) => [e.id, e]),
  );

  return mesajlar.map((m) => ({
    ...m,
    talep: talepHarita.get(m.talep_id) ?? null,
    emlak: m.emlak_id ? (emlakHarita.get(m.emlak_id) ?? null) : null,
  }));
}

/** Müşteri hesabı: kendisine gelen mesajlar. */
export async function mesajlarim(profilId: string): Promise<MesajSatiri[]> {
  const supabase = await sunucuIstemcisi();

  const { data } = await supabase
    .from("mesajlar")
    .select("*")
    .eq("profil_id", profilId)
    .order("gonderim_zamani", { ascending: false });

  const mesajlar = (data ?? []) as Mesaj[];
  if (mesajlar.length === 0) return [];

  const { data: emlaklar } = await supabase
    .from("ilanlar_public")
    .select("id, ilan_no, baslik, fiyat")
    .in(
      "id",
      [...new Set(mesajlar.map((m) => m.emlak_id).filter(Boolean))] as string[],
    );

  const emlakHarita = new Map(
    ((emlaklar ?? []) as { id: string; ilan_no: number; baslik: string; fiyat: number }[]).map(
      (e) => [e.id, e],
    ),
  );

  return mesajlar.map((m) => ({
    ...m,
    talep: null,
    emlak: m.emlak_id
      ? ((emlakHarita.get(m.emlak_id) ?? null) as MesajSatiri["emlak"])
      : null,
  }));
}
