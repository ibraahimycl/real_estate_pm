import "server-only";

import { sunucuIstemcisi } from "@/lib/supabase/server";
import type {
  Emlak,
  EmlakDurumu,
  EmlakFotografi,
  IlanPublic,
  IslemTuru,
} from "@/types/database";

export const SAYFA_BOYUTU = 12;

/** Emlakçı panelindeki portföy listesi (tüm durumlar dahil). */
export async function portfoyListele({
  arama,
  durum,
  islemTuru,
  sayfa = 1,
}: {
  arama?: string;
  durum?: EmlakDurumu;
  islemTuru?: IslemTuru;
  sayfa?: number;
}) {
  const supabase = await sunucuIstemcisi();
  const baslangic = (sayfa - 1) * SAYFA_BOYUTU;

  let sorgu = supabase
    .from("emlaklar")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(baslangic, baslangic + SAYFA_BOYUTU - 1);

  if (arama) {
    const d = arama.replace(/[%,]/g, " ").trim();
    const ilanNo = Number(d);
    sorgu = Number.isInteger(ilanNo) && d !== ""
      ? sorgu.or(`baslik.ilike.%${d}%,ilce.ilike.%${d}%,ilan_no.eq.${ilanNo}`)
      : sorgu.or(`baslik.ilike.%${d}%,ilce.ilike.%${d}%,mahalle.ilike.%${d}%`);
  }
  if (durum) sorgu = sorgu.eq("durum", durum);
  if (islemTuru) sorgu = sorgu.eq("islem_turu", islemTuru);

  const { data, count } = await sorgu;
  const kayitlar = (data ?? []) as Emlak[];

  // Sahip bilgisi ayrı sorguyla getirilip eşleştirilir. PostgREST gömülü
  // ilişkisi yerine bu yol seçildi: tip tanımları elle yazıldığı için
  // ilişki şeması olmadan da güvenli ve okunur kalıyor.
  const sahipler = await sahipHaritasi(kayitlar.map((e) => e.sahip_profil_id));
  const toplam = count ?? 0;

  return {
    kayitlar: kayitlar.map((e) => ({
      ...e,
      sahip: sahipler.get(e.sahip_profil_id) ?? null,
    })),
    toplam,
    sayfa,
    sayfaSayisi: Math.max(1, Math.ceil(toplam / SAYFA_BOYUTU)),
  };
}

/** Toplu yazıcı/PDF çıktısı için sayfalamasız portföy listesi. */
export async function portfoyTumunuListele({
  arama,
  durum,
  islemTuru,
}: {
  arama?: string;
  durum?: EmlakDurumu;
  islemTuru?: IslemTuru;
}) {
  const supabase = await sunucuIstemcisi();

  let sorgu = supabase
    .from("emlaklar")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);

  if (arama) {
    const d = arama.replace(/[%,]/g, " ").trim();
    const ilanNo = Number(d);
    sorgu =
      Number.isInteger(ilanNo) && d !== ""
        ? sorgu.or(`baslik.ilike.%${d}%,ilce.ilike.%${d}%,ilan_no.eq.${ilanNo}`)
        : sorgu.or(`baslik.ilike.%${d}%,ilce.ilike.%${d}%,mahalle.ilike.%${d}%`);
  }
  if (durum) sorgu = sorgu.eq("durum", durum);
  if (islemTuru) sorgu = sorgu.eq("islem_turu", islemTuru);

  const { data } = await sorgu;
  const kayitlar = (data ?? []) as Emlak[];
  const sahipler = await sahipHaritasi(kayitlar.map((e) => e.sahip_profil_id));

  return kayitlar.map((e) => ({
    ...e,
    sahip: sahipler.get(e.sahip_profil_id) ?? null,
  }));
}

export type SahipOzeti = { ad: string; soyad: string; cep_telefon: string };

/** Verilen profil kimlikleri için ad/telefon haritası döndürür. */
export async function sahipHaritasi(
  idler: string[],
): Promise<Map<string, SahipOzeti>> {
  const benzersiz = [...new Set(idler)];
  if (benzersiz.length === 0) return new Map();

  const supabase = await sunucuIstemcisi();
  const { data } = await supabase
    .from("profiller")
    .select("id, ad, soyad, cep_telefon")
    .in("id", benzersiz);

  return new Map(
    ((data ?? []) as (SahipOzeti & { id: string })[]).map((p) => [
      p.id,
      { ad: p.ad, soyad: p.soyad, cep_telefon: p.cep_telefon },
    ]),
  );
}

export async function emlakGetir(id: string): Promise<Emlak | null> {
  const supabase = await sunucuIstemcisi();
  const { data } = await supabase
    .from("emlaklar")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return (data as Emlak | null) ?? null;
}

export async function emlakFotograflari(
  emlakId: string,
): Promise<EmlakFotografi[]> {
  const supabase = await sunucuIstemcisi();
  const { data } = await supabase
    .from("emlak_fotograflari")
    .select("*")
    .eq("emlak_id", emlakId)
    .order("kapak", { ascending: false })
    .order("sira");
  return (data ?? []) as EmlakFotografi[];
}

/** Ziyaretçiye açık ilan görünümünden tek kayıt. */
export async function ilanGetir(id: string): Promise<IlanPublic | null> {
  const supabase = await sunucuIstemcisi();
  const { data } = await supabase
    .from("ilanlar_public")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return (data as IlanPublic | null) ?? null;
}

/** Bir ilanın etkileşim özeti — ev sahibinin "İlanlarım" ekranı için. */
export async function ilanEtkilesimi(emlakId: string) {
  const supabase = await sunucuIstemcisi();
  const [{ count: goruntulenme }, { count: favori }, { count: randevu }] =
    await Promise.all([
      supabase
        .from("emlak_goruntulenme")
        .select("id", { count: "exact", head: true })
        .eq("emlak_id", emlakId),
      supabase
        .from("favoriler")
        .select("emlak_id", { count: "exact", head: true })
        .eq("emlak_id", emlakId),
      supabase
        .from("randevular")
        .select("id", { count: "exact", head: true })
        .eq("emlak_id", emlakId),
    ]);

  return {
    goruntulenme: goruntulenme ?? 0,
    favori: favori ?? 0,
    randevu: randevu ?? 0,
  };
}
