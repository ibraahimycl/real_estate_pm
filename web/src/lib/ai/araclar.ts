import "server-only";

import { yoneticiIstemcisi } from "@/lib/supabase/admin";
import { para } from "@/lib/bicim";
import { EMLAK_TURU, ISLEM_TURU } from "@/lib/etiketler";
import type { IlanPublic, IslemTuru, OdaSayisi } from "@/types/database";

/**
 * AI DANIŞMANIN KULLANABİLECEĞİ ARAÇLAR
 *
 * Model serbestçe metin uydurmaz; ilan bilgisini yalnızca ilan_ara aracıyla
 * veri tabanından alır, talebi yalnızca talep_kaydet aracıyla yazar.
 * Böylece "olmayan ev önerme" riski ortadan kalkar.
 */

export const ARAC_TANIMLARI = [
  {
    type: "function" as const,
    function: {
      name: "ilan_ara",
      description:
        "Portföydeki aktif ilanlar arasında arama yapar. Kullanıcı bir ev/iş yeri tarif ettiğinde veya belirli bir ilan sorduğunda çağrılır.",
      parameters: {
        type: "object",
        properties: {
          islem_turu: {
            type: "string",
            enum: ["kiralik", "satilik"],
            description: "Kiralık mı satılık mı aranıyor.",
          },
          ilce: { type: "string", description: "İlçe adı, örn. Gölbaşı." },
          max_fiyat: { type: "number", description: "Üst bütçe sınırı (TL)." },
          min_fiyat: { type: "number", description: "Alt bütçe sınırı (TL)." },
          oda_sayilari: {
            type: "array",
            items: { type: "string" },
            description: "Örn. ['2+1','3+1'].",
          },
          min_m2: { type: "number", description: "En az brüt metrekare." },
          asansor: { type: "boolean", description: "Asansör şartı var mı." },
          otopark: { type: "boolean", description: "Otopark şartı var mı." },
          esyali: { type: "boolean", description: "Eşyalı olması isteniyor mu." },
          ilan_no: { type: "number", description: "Belirli bir ilan numarası." },
        },
        required: [],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "talep_kaydet",
      description:
        "Müşterinin aradığı kriterleri veri tabanına kaydeder. YALNIZCA müşteri açıkça onay verdiyse çağrılır. Uygun ilan düştüğünde müşteriye mesaj gönderilebilmesini sağlar.",
      parameters: {
        type: "object",
        properties: {
          ad_soyad: { type: "string" },
          telefon: {
            type: "string",
            description: "10 veya 11 haneli, yalnızca rakam.",
          },
          islem_turu: { type: "string", enum: ["kiralik", "satilik"] },
          ilce: { type: "string" },
          min_fiyat: { type: "number" },
          max_fiyat: { type: "number" },
          min_m2: { type: "number" },
          oda_sayilari: { type: "array", items: { type: "string" } },
          asansor_sart: { type: "boolean" },
          otopark_sart: { type: "boolean" },
          notlar: { type: "string", description: "Serbest metin ek istekler." },
        },
        required: ["ad_soyad", "telefon", "islem_turu"],
        additionalProperties: false,
      },
    },
  },
];

/**
 * Modelden gelen sayısal argümanları temizler.
 * Dil modelleri "bilmiyorum" yerine 0 göndermeye eğilimlidir; veri tabanındaki
 * "0'dan büyük olmalı" kısıtları bu yüzden tetiklenir. Anlamsız değerler
 * hatayla dönmek yerine "belirtilmemiş" (null) sayılır.
 */
function pozitif(deger: unknown): number | null {
  const n = Number(deger);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function negatifOlmayan(deger: unknown): number | null {
  const n = Number(deger);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export type IlanAramaArgumanlari = {
  islem_turu?: IslemTuru;
  ilce?: string;
  max_fiyat?: number;
  min_fiyat?: number;
  oda_sayilari?: string[];
  min_m2?: number;
  asansor?: boolean;
  otopark?: boolean;
  esyali?: boolean;
  ilan_no?: number;
};

/** ilan_ara aracının gerçek uygulaması. */
export async function ilanAra(
  args: IlanAramaArgumanlari,
): Promise<{ bulunan: number; ilanlar: IlanPublic[] }> {
  const admin = yoneticiIstemcisi();
  let sorgu = admin
    .from("ilanlar_public")
    .select("*")
    .eq("durum", "aktif")
    .limit(6);

  if (args.ilan_no) sorgu = sorgu.eq("ilan_no", args.ilan_no);
  if (args.islem_turu) sorgu = sorgu.eq("islem_turu", args.islem_turu);
  if (args.ilce) sorgu = sorgu.ilike("ilce", `%${args.ilce}%`);
  const maxFiyat = pozitif(args.max_fiyat);
  const minFiyat = pozitif(args.min_fiyat);
  const minM2 = pozitif(args.min_m2);
  if (maxFiyat) sorgu = sorgu.lte("fiyat", maxFiyat);
  if (minFiyat) sorgu = sorgu.gte("fiyat", minFiyat);
  if (minM2) sorgu = sorgu.gte("m2_brut", minM2);
  if (args.asansor) sorgu = sorgu.eq("asansor", true);
  if (args.otopark) sorgu = sorgu.eq("otopark", true);
  if (args.esyali) sorgu = sorgu.eq("esyali", true);
  if (args.oda_sayilari?.length)
    sorgu = sorgu.in("oda_sayisi", args.oda_sayilari as OdaSayisi[]);

  const { data } = await sorgu;
  const ilanlar = (data ?? []) as IlanPublic[];
  return { bulunan: ilanlar.length, ilanlar };
}

/** Modele verilecek sade ilan özeti (token tasarrufu + uydurma riski yok). */
export function ilanlariOzetle(ilanlar: IlanPublic[]): string {
  if (ilanlar.length === 0) return "Bu kriterlerde aktif ilan bulunamadı.";
  return ilanlar
    .map(
      (i) =>
        `#${i.ilan_no} | ${i.baslik} | ${ISLEM_TURU[i.islem_turu]} ${
          EMLAK_TURU[i.emlak_turu]
        } | ${i.ilce}/${i.il} | ${i.oda_sayisi} | ${i.m2_brut} m² | ${
          i.bulundugu_kat
        }. kat | ${i.asansor ? "asansörlü" : "asansörsüz"} | ${para(
          i.fiyat,
        )} | link: /ilan/${i.id}`,
    )
    .join("\n");
}

export type TalepKayitArgumanlari = {
  ad_soyad: string;
  telefon: string;
  islem_turu: IslemTuru;
  ilce?: string;
  min_fiyat?: number;
  max_fiyat?: number;
  min_m2?: number;
  oda_sayilari?: string[];
  asansor_sart?: boolean;
  otopark_sart?: boolean;
  notlar?: string;
};

/** talep_kaydet aracının gerçek uygulaması. */
export async function talepKaydet(
  args: TalepKayitArgumanlari,
  gorusmeId: string,
  profilId: string | null,
): Promise<{ basarili: boolean; mesaj: string; talepId?: string }> {
  const telefon = (args.telefon ?? "").replace(/\D/g, "");
  if (!/^[0-9]{10,11}$/.test(telefon)) {
    return {
      basarili: false,
      mesaj:
        "Telefon numarası 10 veya 11 haneli olmalı. Müşteriden numarayı tekrar iste.",
    };
  }
  if (!args.ad_soyad || args.ad_soyad.trim().length < 3) {
    return { basarili: false, mesaj: "Ad soyad eksik. Müşteriden adını iste." };
  }

  const admin = yoneticiIstemcisi();
  const { data, error } = await admin
    .from("talepler")
    .insert({
      profil_id: profilId,
      ad_soyad: args.ad_soyad.trim(),
      telefon,
      islem_turu: args.islem_turu,
      il: "Ankara",
      ilce: args.ilce ?? null,
      min_fiyat: negatifOlmayan(args.min_fiyat),
      max_fiyat: pozitif(args.max_fiyat),
      min_m2: pozitif(args.min_m2),
      // Yalnızca "3+1" biçimine uyan değerler kabul edilir.
      oda_sayilari:
        args.oda_sayilari?.filter((o) => /^[1-9][0-9]?\+[0-9]{1,2}$/.test(o))
          .length
          ? args.oda_sayilari.filter((o) =>
              /^[1-9][0-9]?\+[0-9]{1,2}$/.test(o),
            )
          : null,
      asansor_sart: args.asansor_sart ?? false,
      otopark_sart: args.otopark_sart ?? false,
      esyali_sart: false,
      notlar: args.notlar ?? null,
      // Müşteri görüşmede açıkça onay verdiği için izin işaretlenir.
      bildirim_izni: true,
      durum: "aktif",
      kaynak: "ai_gorusme",
    })
    .select("id")
    .single();

  if (error) {
    return { basarili: false, mesaj: `Kayıt başarısız: ${error.message}` };
  }

  await admin
    .from("gorusmeler")
    .update({
      talep_id: data!.id,
      arayan_adi: args.ad_soyad.trim(),
      arayan_telefon: telefon,
    })
    .eq("id", gorusmeId);

  return {
    basarili: true,
    mesaj: "Talep kaydedildi. Müşteriye kaydın yapıldığını bildir.",
    talepId: data!.id,
  };
}
