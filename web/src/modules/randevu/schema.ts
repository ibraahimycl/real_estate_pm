import { z } from "zod";

/**
 * Randevu modülü doğrulama kuralları.
 * BR-RND-101: Randevu saat değil GÜN bazında alınır; saati danışman
 *             telefonla netleştirir.
 * BR-RND-102: Geçmiş bir güne randevu talebi oluşturulamaz.
 * BR-RND-103: İletişim telefonu zorunludur.
 */
export const randevuSemasi = z
  .object({
    emlak_id: z.string().uuid("İlan bulunamadı."),
    ad_soyad: z.string().min(3, "Ad soyad en az 3 karakter olmalıdır.").max(100),
    telefon: z
      .string()
      .regex(/^[0-9]{10,11}$/, "Telefon 10 veya 11 haneli olmalıdır."),
    tercih_gun: z.string().min(1, "Randevu günü seçilmelidir."),
    alternatif_gun: z.string().nullable(),
    musteri_notu: z.string().max(500).nullable(),
  })
  .refine(
    (v) => {
      const bugun = new Date();
      bugun.setHours(0, 0, 0, 0);
      return new Date(v.tercih_gun) >= bugun;
    },
    { path: ["tercih_gun"], message: "Geçmiş bir güne randevu alınamaz." },
  )
  .refine(
    (v) => !v.alternatif_gun || new Date(v.alternatif_gun) >= new Date(v.tercih_gun),
    {
      path: ["alternatif_gun"],
      message: "Alternatif gün, tercih edilen günden önce olamaz.",
    },
  );
