import "server-only";

import { sunucuIstemcisi } from "@/lib/supabase/server";
import type { Emlak, Profil, Sozlesme } from "@/types/database";

export type SozlesmeSatiri = Sozlesme & {
  emlak: Pick<Emlak, "ilan_no" | "baslik" | "il" | "ilce" | "adres" | "oda_sayisi" | "m2_brut"> | null;
  kiraci: Pick<Profil, "ad" | "soyad" | "tckn" | "cep_telefon" | "adres"> | null;
  ev_sahibi: Pick<Profil, "ad" | "soyad" | "tckn" | "cep_telefon" | "adres"> | null;
};

const PROFIL_ALANLARI = "id, ad, soyad, tckn, cep_telefon, adres";
const EMLAK_ALANLARI = "id, ilan_no, baslik, il, ilce, adres, oda_sayisi, m2_brut";

async function zenginlestir(sozlesmeler: Sozlesme[]): Promise<SozlesmeSatiri[]> {
  if (sozlesmeler.length === 0) return [];
  const supabase = await sunucuIstemcisi();

  const profilIdleri = [
    ...new Set(
      sozlesmeler.flatMap((s) => [s.kiraci_profil_id, s.ev_sahibi_profil_id]),
    ),
  ];

  const [{ data: profiller }, { data: emlaklar }] = await Promise.all([
    supabase.from("profiller").select(PROFIL_ALANLARI).in("id", profilIdleri),
    supabase
      .from("emlaklar")
      .select(EMLAK_ALANLARI)
      .in("id", [...new Set(sozlesmeler.map((s) => s.emlak_id))]),
  ]);

  const profilHarita = new Map(
    ((profiller ?? []) as (Profil & { id: string })[]).map((p) => [p.id, p]),
  );
  const emlakHarita = new Map(
    ((emlaklar ?? []) as (Emlak & { id: string })[]).map((e) => [e.id, e]),
  );

  return sozlesmeler.map((s) => ({
    ...s,
    emlak: emlakHarita.get(s.emlak_id) ?? null,
    kiraci: profilHarita.get(s.kiraci_profil_id) ?? null,
    ev_sahibi: profilHarita.get(s.ev_sahibi_profil_id) ?? null,
  }));
}

export async function sozlesmeleriListele(): Promise<SozlesmeSatiri[]> {
  const supabase = await sunucuIstemcisi();
  const { data } = await supabase
    .from("sozlesmeler")
    .select("*")
    .order("created_at", { ascending: false });
  return zenginlestir((data ?? []) as Sozlesme[]);
}

export async function sozlesmelerim(profilId: string): Promise<SozlesmeSatiri[]> {
  const supabase = await sunucuIstemcisi();
  const { data } = await supabase
    .from("sozlesmeler")
    .select("*")
    .or(`kiraci_profil_id.eq.${profilId},ev_sahibi_profil_id.eq.${profilId}`)
    .order("created_at", { ascending: false });
  return zenginlestir((data ?? []) as Sozlesme[]);
}

export async function sozlesmeGetir(id: string): Promise<SozlesmeSatiri | null> {
  const supabase = await sunucuIstemcisi();
  const { data } = await supabase
    .from("sozlesmeler")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  const [satir] = await zenginlestir([data as Sozlesme]);
  return satir ?? null;
}

/** Sözleşme açılabilecek ilanlar: kiralık ve henüz kiralanmamış. */
export async function sozlesmeyeUygunIlanlar() {
  const supabase = await sunucuIstemcisi();
  const { data } = await supabase
    .from("emlaklar")
    .select("id, ilan_no, baslik, fiyat, depozito, sahip_profil_id")
    .eq("islem_turu", "kiralik")
    .in("durum", ["aktif", "rezerve"])
    .order("ilan_no");
  return (data ?? []) as {
    id: string;
    ilan_no: number;
    baslik: string;
    fiyat: number;
    depozito: number | null;
    sahip_profil_id: string;
  }[];
}
