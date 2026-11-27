import "server-only";

import { sunucuIstemcisi } from "@/lib/supabase/server";
import type { Profil } from "@/types/database";

export const SAYFA_BOYUTU = 15;

export type MusteriListesi = {
  kayitlar: Profil[];
  toplam: number;
  sayfa: number;
  sayfaSayisi: number;
};

/** Ad, soyad, e-posta, telefon veya TCKN üzerinden arama yapar. */
export async function musterileriListele({
  arama,
  sayfa = 1,
}: {
  arama?: string;
  sayfa?: number;
}): Promise<MusteriListesi> {
  const supabase = await sunucuIstemcisi();
  const baslangic = (sayfa - 1) * SAYFA_BOYUTU;

  let sorgu = supabase
    .from("profiller")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(baslangic, baslangic + SAYFA_BOYUTU - 1);

  if (arama) {
    const d = arama.replace(/[%,]/g, " ").trim();
    sorgu = sorgu.or(
      `ad.ilike.%${d}%,soyad.ilike.%${d}%,eposta.ilike.%${d}%,cep_telefon.ilike.%${d}%,tckn.ilike.%${d}%`,
    );
  }

  const { data, count } = await sorgu;
  const toplam = count ?? 0;

  return {
    kayitlar: (data ?? []) as Profil[],
    toplam,
    sayfa,
    sayfaSayisi: Math.max(1, Math.ceil(toplam / SAYFA_BOYUTU)),
  };
}

export async function musteriGetir(id: string): Promise<Profil | null> {
  const supabase = await sunucuIstemcisi();
  const { data } = await supabase
    .from("profiller")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return (data as Profil | null) ?? null;
}

/** Emlak formundaki "sahip müşteri" açılır listesi için hafif sorgu. */
export async function musteriSecenekleri(): Promise<
  { id: string; ad: string; soyad: string; eposta: string; cep_telefon: string }[]
> {
  const supabase = await sunucuIstemcisi();
  const { data } = await supabase
    .from("profiller")
    .select("id, ad, soyad, eposta, cep_telefon")
    .order("ad");
  return (data ?? []) as {
    id: string;
    ad: string;
    soyad: string;
    eposta: string;
    cep_telefon: string;
  }[];
}

/** Bir müşterinin sahibi olduğu ilan sayısı — silme kontrolünde kullanılır. */
export async function musteriIlanSayisi(profilId: string): Promise<number> {
  const supabase = await sunucuIstemcisi();
  const { count } = await supabase
    .from("emlaklar")
    .select("id", { count: "exact", head: true })
    .eq("sahip_profil_id", profilId);
  return count ?? 0;
}
