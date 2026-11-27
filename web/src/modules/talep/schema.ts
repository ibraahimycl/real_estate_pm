import { z } from "zod";
import { odaSayisiGecerli } from "@/lib/oda";

/**
 * Müşteri talebi (kayıtlı arama kriteri) doğrulama kuralları.
 * BR-TLP-101: Ad soyad ve telefon zorunludur — eşleşme çıktığında
 *             müşteriye ulaşılabilmesi gerekir.
 * BR-TLP-102: Maksimum fiyat, minimum fiyattan küçük olamaz.
 * BR-TLP-103: Bildirim gönderimi için açık rıza (bildirim_izni) şarttır.
 */
export const talepSemasi = z
  .object({
    ad_soyad: z.string().min(3, "Ad soyad en az 3 karakter olmalıdır.").max(100),
    telefon: z
      .string()
      .regex(/^[0-9]{10,11}$/, "Telefon 10 veya 11 haneli olmalıdır."),
    eposta: z.string().email("Geçerli bir e-posta adresi giriniz.").nullable(),

    islem_turu: z.enum(["kiralik", "satilik"]),
    emlak_turu: z
      .enum([
        "daire", "mustakil_ev", "villa", "residence",
        "ofis", "dukkan", "isyeri", "depo", "arsa",
      ])
      .nullable(),
    il: z.string().max(50).nullable(),
    ilce: z.string().max(50).nullable(),
    min_fiyat: z.number().min(0).nullable(),
    max_fiyat: z.number().positive("Maksimum fiyat 0'dan büyük olmalıdır.").nullable(),
    min_m2: z.number().int().positive().nullable(),
    oda_sayilari: z
      .array(z.string().refine(odaSayisiGecerli, "Geçersiz oda sayısı."))
      .nullable(),
    max_bina_yasi: z.number().int().min(0).nullable(),
    asansor_sart: z.boolean(),
    otopark_sart: z.boolean(),
    esyali_sart: z.boolean(),
    notlar: z.string().max(1000).nullable(),
    bildirim_izni: z.boolean(),
  })
  .refine(
    (v) =>
      v.min_fiyat === null ||
      v.max_fiyat === null ||
      v.max_fiyat >= v.min_fiyat,
    {
      path: ["max_fiyat"],
      message: "Maksimum fiyat, minimum fiyattan küçük olamaz.",
    },
  );

export type TalepGirdisi = z.infer<typeof talepSemasi>;
