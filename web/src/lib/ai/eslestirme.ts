import "server-only";

import { yoneticiIstemcisi } from "@/lib/supabase/admin";
import { aiIstemcisi, aiModeli } from "./openai";
import { gunlukKotaDoldu } from "./limitler";
import { MESAJ_TALIMATI } from "./prompts";
import { para } from "@/lib/bicim";
import { EMLAK_TURU, ISINMA_TURU, ISLEM_TURU } from "@/lib/etiketler";
import type { Emlak, Talep } from "@/types/database";

/**
 * TALEP–İLAN EŞLEŞTİRME MOTORU
 *
 * İki aşamalıdır:
 *   1. ELEME (kural tabanlı, deterministik): Talebin kesin şartlarını
 *      sağlamayan ilanlar elenir. Bu aşama AI kullanmaz; sonuç her zaman
 *      aynıdır ve sınanabilir.
 *   2. METİN ÜRETİMİ (AI): Eşleşen müşteriye gidecek mesaj OpenAI ile
 *      yazılır. Anahtar yoksa şablon metne düşer, sistem çalışmaya devam eder.
 */

export type EslesmeSonucu = {
  talep: Talep;
  skor: number;
  gerekceler: string[];
};

/** Bir talep ile bir ilanın uyumunu değerlendirir. */
export function talebiDegerlendir(
  talep: Talep,
  emlak: Emlak,
): { uyumlu: boolean; skor: number; gerekceler: string[] } {
  const gerekceler: string[] = [];
  const esitMi = (a: string | null, b: string | null) =>
    (a ?? "").toLocaleLowerCase("tr") === (b ?? "").toLocaleLowerCase("tr");

  // --- Kesin şartlar: biri bile tutmazsa eşleşme yok ---
  if (talep.islem_turu !== emlak.islem_turu) return bos();
  if (talep.emlak_turu && talep.emlak_turu !== emlak.emlak_turu) return bos();
  if (talep.il && !esitMi(talep.il, emlak.il)) return bos();
  if (talep.ilce && !esitMi(talep.ilce, emlak.ilce)) return bos();
  if (talep.max_fiyat !== null && Number(emlak.fiyat) > Number(talep.max_fiyat))
    return bos();
  if (talep.min_fiyat !== null && Number(emlak.fiyat) < Number(talep.min_fiyat))
    return bos();
  if (talep.min_m2 !== null && emlak.m2_brut < talep.min_m2) return bos();
  if (
    talep.oda_sayilari?.length &&
    !talep.oda_sayilari.includes(emlak.oda_sayisi)
  )
    return bos();
  if (talep.max_bina_yasi !== null && emlak.bina_yasi > talep.max_bina_yasi)
    return bos();
  if (talep.min_kat !== null && emlak.bulundugu_kat < talep.min_kat) return bos();
  if (talep.max_kat !== null && emlak.bulundugu_kat > talep.max_kat) return bos();
  if (talep.asansor_sart && !emlak.asansor) return bos();
  if (talep.otopark_sart && !emlak.otopark) return bos();
  if (talep.esyali_sart && !emlak.esyali) return bos();

  // --- Skor: belirtilen kriterlerden kaçı gerçekten tutuyor ---
  let kriter = 1;
  let tutan = 1;
  gerekceler.push(`${ISLEM_TURU[emlak.islem_turu]} işlem türü uyuyor`);

  if (talep.ilce) {
    kriter++;
    tutan++;
    gerekceler.push(`Konum: ${emlak.ilce}`);
  } else if (talep.il) {
    kriter++;
    tutan++;
    gerekceler.push(`Konum: ${emlak.il}`);
  }
  if (talep.max_fiyat !== null) {
    kriter++;
    tutan++;
    gerekceler.push(`Fiyat bütçe içinde (${para(emlak.fiyat)})`);
  }
  if (talep.oda_sayilari?.length) {
    kriter++;
    tutan++;
    gerekceler.push(`Oda sayısı: ${emlak.oda_sayisi}`);
  }
  if (talep.min_m2 !== null) {
    kriter++;
    tutan++;
    gerekceler.push(`Alan: ${emlak.m2_brut} m²`);
  }
  if (talep.asansor_sart) {
    kriter++;
    tutan++;
    gerekceler.push("Asansör mevcut");
  }
  if (talep.otopark_sart) {
    kriter++;
    tutan++;
    gerekceler.push("Otopark mevcut");
  }
  if (talep.esyali_sart) {
    kriter++;
    tutan++;
    gerekceler.push("Eşyalı");
  }

  return {
    uyumlu: true,
    skor: Math.round((tutan / kriter) * 100),
    gerekceler,
  };

  function bos() {
    return { uyumlu: false, skor: 0, gerekceler: [] };
  }
}

/** İlanın AI'a ve şablona verilecek özet metni. */
export function ilanOzeti(emlak: Emlak): string {
  const ozellikler = [
    emlak.asansor && "asansörlü",
    emlak.otopark && "otoparklı",
    emlak.esyali && "eşyalı",
    emlak.balkon && "balkonlu",
    emlak.site_icinde && "site içinde",
  ].filter(Boolean);

  return [
    `${emlak.baslik}`,
    `${ISLEM_TURU[emlak.islem_turu]} ${EMLAK_TURU[emlak.emlak_turu]}`,
    `${emlak.il} / ${emlak.ilce}${emlak.mahalle ? ` / ${emlak.mahalle}` : ""}`,
    `${emlak.oda_sayisi}, ${emlak.m2_brut} m² brüt`,
    `${emlak.bulundugu_kat}. kat (${emlak.bina_kat_sayisi} katlı), ${emlak.bina_yasi} yaşında`,
    `Isıtma: ${ISINMA_TURU[emlak.isinma_turu]}`,
    ozellikler.length ? `Özellikler: ${ozellikler.join(", ")}` : null,
    `Fiyat: ${para(emlak.fiyat)}`,
  ]
    .filter(Boolean)
    .join(" · ");
}

/** AI anahtarı yokken kullanılan şablon mesaj. */
function sablonMesaj(talep: Talep, emlak: Emlak, gerekceler: string[]): string {
  const ad = talep.ad_soyad.split(" ")[0];
  return [
    `Merhaba ${ad},`,
    `Daha önce ${ISLEM_TURU[emlak.islem_turu].toLocaleLowerCase("tr")} ${
      talep.ilce ?? talep.il ?? ""
    } bölgesinde bir yer aradığınızı konuşmuştuk.`,
    `Kriterlerinize uyan yeni bir ilan girdi: ${emlak.baslik} — ${emlak.oda_sayisi}, ${emlak.m2_brut} m², ${para(emlak.fiyat)}.`,
    gerekceler.length ? `(${gerekceler.slice(0, 3).join(", ")})` : "",
    `İncelemek isterseniz ilana göz atabilirsiniz.`,
    `Başkent Emlak`,
  ]
    .filter(Boolean)
    .join(" ");
}

/** Eşleşme mesajını AI ile yazar; başarısız olursa şablona düşer. */
async function mesajUret(
  talep: Talep,
  emlak: Emlak,
  gerekceler: string[],
): Promise<{ icerik: string; model: string | null }> {
  const istemci = (await gunlukKotaDoldu()) ? null : aiIstemcisi();
  if (!istemci) {
    return { icerik: sablonMesaj(talep, emlak, gerekceler), model: null };
  }

  try {
    const yanit = await istemci.chat.completions.create({
      model: aiModeli(),
      temperature: 0.7,
      max_tokens: 300,
      messages: [
        { role: "system", content: MESAJ_TALIMATI },
        {
          role: "user",
          content: [
            `Müşteri: ${talep.ad_soyad}`,
            `Müşterinin talebi: ${ISLEM_TURU[talep.islem_turu]}, ${
              talep.ilce ?? talep.il ?? "konum farketmez"
            }, bütçe ${talep.min_fiyat ? para(talep.min_fiyat) : "—"} - ${
              talep.max_fiyat ? para(talep.max_fiyat) : "—"
            }, oda: ${talep.oda_sayilari?.join("/") ?? "farketmez"}${
              talep.notlar ? `, not: ${talep.notlar}` : ""
            }`,
            `Yeni ilan: ${ilanOzeti(emlak)}`,
            `Eşleşme gerekçeleri: ${gerekceler.join(", ")}`,
          ].join("\n"),
        },
      ],
    });

    const icerik = yanit.choices[0]?.message?.content?.trim();
    if (!icerik) throw new Error("Boş yanıt");
    return { icerik, model: aiModeli() };
  } catch {
    // AI erişilemezse sistem durmaz, şablon mesaj gönderilir.
    return { icerik: sablonMesaj(talep, emlak, gerekceler), model: null };
  }
}

/**
 * Yeni bir ilan kaydedildiğinde çağrılır.
 * Aktif ve bildirim izni olan talepleri tarar, uyanlara mesaj üretir.
 *
 * Mükerrer mesajı veri tabanındaki UNIQUE(talep_id, emlak_id) kısıtı
 * engeller; bu yüzden onConflict ile sessizce geçilir.
 */
export async function yeniIlaniEslestir(emlakId: string): Promise<number> {
  const admin = yoneticiIstemcisi();

  const { data: emlakKaydi, error: emlakHatasi } = await admin
    .from("emlaklar")
    .select("*")
    .eq("id", emlakId)
    .maybeSingle();

  // Sessiz boş sonuç, hatayı bulunamaz kılar: eksik yetki veya bağlantı
  // sorunu "eşleşme yok" gibi görünür. Bu yüzden hata açıkça yükseltilir.
  if (emlakHatasi) {
    throw new Error(`Eşleştirme için ilan okunamadı: ${emlakHatasi.message}`);
  }

  const emlak = emlakKaydi as Emlak | null;
  if (!emlak || emlak.durum !== "aktif") return 0;

  const { data: talepKayitlari, error: talepHatasi } = await admin
    .from("talepler")
    .select("*")
    .eq("durum", "aktif")
    .eq("islem_turu", emlak.islem_turu);

  if (talepHatasi) {
    throw new Error(`Talepler okunamadı: ${talepHatasi.message}`);
  }

  const talepler = (talepKayitlari ?? []) as Talep[];
  let uretilen = 0;

  for (const talep of talepler) {
    const { uyumlu, skor, gerekceler } = talebiDegerlendir(talep, emlak);
    if (!uyumlu) continue;

    // KVKK: açık rıza vermemiş müşteriye mesaj gönderilmez.
    // Eşleşme yine de emlakçı panelinde görünür.
    if (!talep.bildirim_izni) continue;

    const { icerik, model } = await mesajUret(talep, emlak, gerekceler);

    const { error } = await admin.from("mesajlar").insert({
      talep_id: talep.id,
      emlak_id: emlak.id,
      profil_id: talep.profil_id,
      yon: "giden",
      icerik,
      ai_uretti: true,
      model,
      eslesme_skoru: skor,
    });

    if (!error) uretilen++;
  }

  return uretilen;
}

/** Bir ilana uyan tüm talepleri döndürür (emlakçı paneli için). */
export async function ilanaUyanTalepler(
  emlakId: string,
): Promise<EslesmeSonucu[]> {
  const admin = yoneticiIstemcisi();

  const { data: emlakKaydi, error: emlakHatasi } = await admin
    .from("emlaklar")
    .select("*")
    .eq("id", emlakId)
    .maybeSingle();
  if (emlakHatasi) throw new Error(`İlan okunamadı: ${emlakHatasi.message}`);

  const emlak = emlakKaydi as Emlak | null;
  if (!emlak) return [];

  const { data: talepKayitlari, error: talepHatasi } = await admin
    .from("talepler")
    .select("*")
    .eq("durum", "aktif")
    .eq("islem_turu", emlak.islem_turu);
  if (talepHatasi) throw new Error(`Talepler okunamadı: ${talepHatasi.message}`);

  return ((talepKayitlari ?? []) as Talep[])
    .map((talep) => ({ talep, ...talebiDegerlendir(talep, emlak) }))
    .filter((s) => s.uyumlu)
    .sort((a, b) => b.skor - a.skor)
    .map(({ talep, skor, gerekceler }) => ({ talep, skor, gerekceler }));
}

/** Bir talebe uyan tüm aktif ilanları döndürür (talep detayı için). */
export async function talebeUyanIlanlar(talepId: string) {
  const admin = yoneticiIstemcisi();

  const { data: talepKaydi, error: talepHatasi } = await admin
    .from("talepler")
    .select("*")
    .eq("id", talepId)
    .maybeSingle();
  if (talepHatasi) throw new Error(`Talep okunamadı: ${talepHatasi.message}`);

  const talep = talepKaydi as Talep | null;
  if (!talep) return [];

  const { data: emlakKayitlari, error: emlakHatasi } = await admin
    .from("emlaklar")
    .select("*")
    .eq("durum", "aktif")
    .eq("islem_turu", talep.islem_turu);
  if (emlakHatasi) throw new Error(`İlanlar okunamadı: ${emlakHatasi.message}`);

  return ((emlakKayitlari ?? []) as Emlak[])
    .map((emlak) => ({ emlak, ...talebiDegerlendir(talep, emlak) }))
    .filter((s) => s.uyumlu)
    .sort((a, b) => b.skor - a.skor);
}
