import "server-only";

import { sunucuIstemcisi } from "@/lib/supabase/server";
import { yoneticiIstemcisi } from "@/lib/supabase/admin";
import type { IlanPublic } from "@/types/database";
import type { AramaFiltresi } from "./schema";

export const SAYFA_BOYUTU = 9;

export type AramaSonucu = {
  ilanlar: IlanPublic[];
  toplam: number;
  sayfa: number;
  sayfaSayisi: number;
};

/**
 * Filtreli ilan araması.
 * Yalnızca ilanlar_public görünümü sorgulanır: bu görünüm sahip bilgisi
 * ve açık adres içermez, dolayısıyla ziyaretçiye kişisel veri sızmaz.
 */
export async function ilanlariAra(
  filtre: AramaFiltresi,
): Promise<AramaSonucu> {
  const supabase = await sunucuIstemcisi();
  const sayfa = filtre.sayfa ?? 1;
  const baslangic = (sayfa - 1) * SAYFA_BOYUTU;

  let sorgu = supabase
    .from("ilanlar_public")
    .select("*", { count: "exact" })
    .range(baslangic, baslangic + SAYFA_BOYUTU - 1);

  if (filtre.islem_turu) sorgu = sorgu.eq("islem_turu", filtre.islem_turu);
  if (filtre.emlak_turu) sorgu = sorgu.eq("emlak_turu", filtre.emlak_turu);
  if (filtre.il) sorgu = sorgu.ilike("il", filtre.il);
  if (filtre.ilce) sorgu = sorgu.ilike("ilce", filtre.ilce);
  if (filtre.min_fiyat !== undefined) sorgu = sorgu.gte("fiyat", filtre.min_fiyat);
  if (filtre.max_fiyat !== undefined) sorgu = sorgu.lte("fiyat", filtre.max_fiyat);
  if (filtre.min_m2 !== undefined) sorgu = sorgu.gte("m2_brut", filtre.min_m2);
  if (filtre.oda_sayilari?.length)
    sorgu = sorgu.in("oda_sayisi", filtre.oda_sayilari);
  if (filtre.max_bina_yasi !== undefined)
    sorgu = sorgu.lte("bina_yasi", filtre.max_bina_yasi);
  if (filtre.asansor) sorgu = sorgu.eq("asansor", true);
  if (filtre.otopark) sorgu = sorgu.eq("otopark", true);
  if (filtre.esyali) sorgu = sorgu.eq("esyali", true);
  if (filtre.site_icinde) sorgu = sorgu.eq("site_icinde", true);
  if (filtre.krediye_uygun) sorgu = sorgu.eq("krediye_uygun", true);

  switch (filtre.siralama) {
    case "fiyat_artan":
      sorgu = sorgu.order("fiyat", { ascending: true });
      break;
    case "fiyat_azalan":
      sorgu = sorgu.order("fiyat", { ascending: false });
      break;
    case "m2_azalan":
      sorgu = sorgu.order("m2_brut", { ascending: false });
      break;
    default:
      sorgu = sorgu.order("created_at", { ascending: false });
  }

  const { data, count } = await sorgu;
  const toplam = count ?? 0;

  return {
    ilanlar: (data ?? []) as IlanPublic[],
    toplam,
    sayfa,
    sayfaSayisi: Math.max(1, Math.ceil(toplam / SAYFA_BOYUTU)),
  };
}

/**
 * Her aramayı kaydeder. Sonuç sayısı 0 olan kayıtlar, emlakçı panelindeki
 * "Karşılanamayan Talepler" analizini besler — portföyde eksik olan
 * kriter kombinasyonları böylece görünür hale gelir.
 *
 * Yönetici istemcisi kullanılır: log yazımı ziyaretçinin oturumundan
 * bağımsız olmalı ve hiçbir koşulda arama akışını bozmamalıdır.
 */
export async function aramayiLogla(
  filtre: AramaFiltresi,
  sonucSayisi: number,
  profilId: string | null,
): Promise<void> {
  try {
    const admin = yoneticiIstemcisi();
    await admin.from("arama_loglari").insert({
      profil_id: profilId,
      filtreler: filtre as unknown as Record<string, unknown>,
      islem_turu: filtre.islem_turu ?? null,
      il: filtre.il ?? null,
      ilce: filtre.ilce ?? null,
      oda_sayisi: filtre.oda_sayilari?.[0] ?? null,
      sonuc_sayisi: sonucSayisi,
    });
  } catch {
    // Log yazılamazsa arama yine de sonuç döndürmelidir.
  }
}

/** Filtre açılır listelerini doldurmak için mevcut il/ilçe değerleri. */
export async function konumSecenekleri(): Promise<{
  iller: string[];
  ilceler: string[];
}> {
  const supabase = await sunucuIstemcisi();
  const { data } = await supabase
    .from("ilanlar_public")
    .select("il, ilce")
    .limit(500);

  const kayitlar = (data ?? []) as { il: string; ilce: string }[];
  return {
    iller: [...new Set(kayitlar.map((k) => k.il))].sort((a, b) =>
      a.localeCompare(b, "tr"),
    ),
    ilceler: [...new Set(kayitlar.map((k) => k.ilce))].sort((a, b) =>
      a.localeCompare(b, "tr"),
    ),
  };
}

/** Karşılanamayan talep analizi (emlakçı paneli). */
export async function karsilanamayanTalepler() {
  const supabase = await sunucuIstemcisi();
  const { data } = await supabase
    .from("karsilanamayan_talepler")
    .select("*")
    .limit(50);
  return data ?? [];
}
