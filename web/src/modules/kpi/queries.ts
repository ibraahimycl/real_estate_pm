import "server-only";

import { sunucuIstemcisi } from "@/lib/supabase/server";
import type { Emlak, IslemKaydi } from "@/types/database";

export type AyKutugu = {
  anahtar: string; // 2026-11
  etiket: string; // Kas
  tamEtiket: string; // Kasım 2026
  kiralikIlan: number;
  satilikIlan: number;
  kiralama: number;
  satis: number;
  gelir: number;
};

export type PanelOzeti = {
  aktifPortfoy: number;
  buAyEklenen: number;
  gecenAyEklenen: number;
  buAyKiralanan: number;
  buAySatilan: number;
  buAyGelir: number;
  gecenAyGelir: number;
  toplamGelir: number;
  bekleyenRandevu: number;
  aktifTalep: number;
  okunmamisMesaj: number;
  karsilanamayanArama: number;
  aylar: AyKutugu[];
};

function ayAnahtari(tarih: Date): string {
  return `${tarih.getFullYear()}-${String(tarih.getMonth() + 1).padStart(2, "0")}`;
}

/** Son N ayın boş kütüklerini üretir (veri olmayan ay da grafikte yer alır). */
function sonAylar(adet: number): AyKutugu[] {
  const kisa = new Intl.DateTimeFormat("tr-TR", { month: "short" });
  const uzun = new Intl.DateTimeFormat("tr-TR", { month: "long", year: "numeric" });
  const bugun = new Date();

  return Array.from({ length: adet }, (_, i) => {
    const t = new Date(bugun.getFullYear(), bugun.getMonth() - (adet - 1 - i), 1);
    return {
      anahtar: ayAnahtari(t),
      etiket: kisa.format(t).replace(".", ""),
      tamEtiket: uzun.format(t),
      kiralikIlan: 0,
      satilikIlan: 0,
      kiralama: 0,
      satis: 0,
      gelir: 0,
    };
  });
}

/** Emlakçı panelindeki tüm KPI verilerini tek seferde toplar. */
export async function panelOzeti(ayAdedi = 6): Promise<PanelOzeti> {
  const supabase = await sunucuIstemcisi();
  const aylar = sonAylar(ayAdedi);
  const enEskiAy = new Date();
  enEskiAy.setMonth(enEskiAy.getMonth() - (ayAdedi - 1));
  enEskiAy.setDate(1);
  enEskiAy.setHours(0, 0, 0, 0);

  const [
    { data: emlaklar },
    { data: islemler },
    { count: aktifPortfoy },
    { count: bekleyenRandevu },
    { count: aktifTalep },
    { count: okunmamisMesaj },
    { count: karsilanamayanArama },
  ] = await Promise.all([
    supabase
      .from("emlaklar")
      .select("id, islem_turu, created_at")
      .gte("created_at", enEskiAy.toISOString()),
    supabase
      .from("islemler")
      .select("id, tur, tutar, komisyon, tarih")
      .gte("tarih", enEskiAy.toISOString().slice(0, 10)),
    supabase
      .from("emlaklar")
      .select("id", { count: "exact", head: true })
      .eq("durum", "aktif"),
    supabase
      .from("randevular")
      .select("id", { count: "exact", head: true })
      .eq("durum", "talep"),
    supabase
      .from("talepler")
      .select("id", { count: "exact", head: true })
      .eq("durum", "aktif"),
    supabase
      .from("mesajlar")
      .select("id", { count: "exact", head: true })
      .eq("okundu", false),
    supabase
      .from("arama_loglari")
      .select("id", { count: "exact", head: true })
      .eq("sonuc_sayisi", 0),
  ]);

  const harita = new Map(aylar.map((a) => [a.anahtar, a]));

  for (const e of (emlaklar ?? []) as Pick<
    Emlak,
    "id" | "islem_turu" | "created_at"
  >[]) {
    const kutuk = harita.get(ayAnahtari(new Date(e.created_at)));
    if (!kutuk) continue;
    if (e.islem_turu === "kiralik") kutuk.kiralikIlan++;
    else kutuk.satilikIlan++;
  }

  let toplamGelirSonAylar = 0;
  for (const i of (islemler ?? []) as Pick<
    IslemKaydi,
    "id" | "tur" | "tutar" | "komisyon" | "tarih"
  >[]) {
    const kutuk = harita.get(ayAnahtari(new Date(i.tarih)));
    toplamGelirSonAylar += Number(i.komisyon);
    if (!kutuk) continue;
    if (i.tur === "kiralama") kutuk.kiralama++;
    else kutuk.satis++;
    kutuk.gelir += Number(i.komisyon);
  }

  const buAy = aylar.at(-1)!;
  const gecenAy = aylar.at(-2);

  return {
    aktifPortfoy: aktifPortfoy ?? 0,
    buAyEklenen: buAy.kiralikIlan + buAy.satilikIlan,
    gecenAyEklenen: gecenAy ? gecenAy.kiralikIlan + gecenAy.satilikIlan : 0,
    buAyKiralanan: buAy.kiralama,
    buAySatilan: buAy.satis,
    buAyGelir: buAy.gelir,
    gecenAyGelir: gecenAy?.gelir ?? 0,
    toplamGelir: toplamGelirSonAylar,
    bekleyenRandevu: bekleyenRandevu ?? 0,
    aktifTalep: aktifTalep ?? 0,
    okunmamisMesaj: okunmamisMesaj ?? 0,
    karsilanamayanArama: karsilanamayanArama ?? 0,
    aylar,
  };
}

/** En çok ilgi gören ilanlar (görüntülenme + kaydedilme). */
export async function enCokIlgiGorenler(adet = 5) {
  const supabase = await sunucuIstemcisi();
  const { data } = await supabase
    .from("ilanlar_public")
    .select("id, ilan_no, baslik, fiyat, goruntulenme_sayisi, favori_sayisi")
    .order("goruntulenme_sayisi", { ascending: false })
    .limit(adet);
  return (data ?? []) as {
    id: string;
    ilan_no: number;
    baslik: string;
    fiyat: number;
    goruntulenme_sayisi: number;
    favori_sayisi: number;
  }[];
}
