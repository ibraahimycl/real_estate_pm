import { z } from "zod";
import { odaSayisiGecerli } from "@/lib/oda";

/**
 * Modül 3 — Emlak Tanımı doğrulama kuralları.
 * BR-EML-101: Zorunlu alanlar boş bırakılamaz.
 * BR-EML-102: Fiyat ve metrekare 0'dan büyük olmalıdır.
 * BR-EML-103: Net alan brüt alandan büyük olamaz.
 * BR-EML-104: Bulunduğu kat, bina kat sayısını aşamaz.
 * BR-EML-105: Oda sayısı "<oda>+<salon>" biçiminde olmalıdır (7+3 dahil).
 * Aynı kurallar veri tabanında CHECK kısıtı olarak da tanımlıdır.
 */
export const emlakSemasi = z
  .object({
    sahip_profil_id: z.string().uuid("Emlak sahibi müşteri seçilmelidir."),
    baslik: z
      .string()
      .min(10, "Başlık en az 10 karakter olmalıdır.")
      .max(150, "Başlık en fazla 150 karakter olabilir."),
    aciklama: z.string().max(2000, "Açıklama en fazla 2000 karakter olabilir.").nullable(),

    islem_turu: z.enum(["kiralik", "satilik"]),
    emlak_turu: z.enum([
      "daire", "mustakil_ev", "villa", "residence",
      "ofis", "dukkan", "isyeri", "depo", "arsa",
    ]),
    durum: z.enum(["aktif", "rezerve", "kiralandi", "satildi", "pasif"]),

    fiyat: z.number().positive("Fiyat 0'dan büyük olmalıdır."),
    aidat: z.number().min(0, "Aidat negatif olamaz."),
    depozito: z.number().min(0, "Depozito negatif olamaz.").nullable(),

    m2_brut: z.number().int().positive("Brüt alan 0'dan büyük olmalıdır."),
    m2_net: z.number().int().positive("Net alan 0'dan büyük olmalıdır."),
    oda_sayisi: z
      .string()
      .refine(odaSayisiGecerli, "Oda sayısı 3+1 gibi bir biçimde olmalıdır."),
    bulundugu_kat: z
      .number()
      .int()
      .min(-3, "Kat bilgisi -3 ile 100 arasında olmalıdır.")
      .max(100, "Kat bilgisi -3 ile 100 arasında olmalıdır."),
    bina_kat_sayisi: z
      .number()
      .int()
      .min(1, "Bina kat sayısı en az 1 olmalıdır.")
      .max(100),
    bina_yasi: z.number().int().min(0, "Bina yaşı negatif olamaz.").max(200),
    isinma_turu: z.enum([
      "dogalgaz_kombi", "dogalgaz_soba", "merkezi", "merkezi_pay_olcer",
      "klima", "yerden_isitma", "soba", "yok",
    ]),
    banyo_sayisi: z.number().int().min(0).max(10).nullable(),

    esyali: z.boolean(),
    asansor: z.boolean(),
    otopark: z.boolean(),
    balkon: z.boolean(),
    site_icinde: z.boolean(),
    krediye_uygun: z.boolean(),

    il: z.string().min(2, "İl alanı zorunludur."),
    ilce: z.string().min(2, "İlçe alanı zorunludur."),
    mahalle: z.string().max(100).nullable(),
    adres: z.string().max(300).nullable(),
  })
  .refine((v) => v.m2_net <= v.m2_brut, {
    path: ["m2_net"],
    message: "Net alan, brüt alandan büyük olamaz.",
  })
  .refine((v) => v.bulundugu_kat <= v.bina_kat_sayisi, {
    path: ["bulundugu_kat"],
    message: "Bulunduğu kat, bina kat sayısından büyük olamaz.",
  });

export type EmlakGirdisi = z.infer<typeof emlakSemasi>;
