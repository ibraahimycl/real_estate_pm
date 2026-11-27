import { z } from "zod";

/**
 * Kira sözleşmesi doğrulama kuralları.
 * BR-SZL-101: Bitiş tarihi başlangıç tarihinden sonra olmalıdır.
 * BR-SZL-102: Kira bedeli 0'dan büyük olmalıdır.
 * BR-SZL-103: Ev sahibi ile kiracı aynı kişi olamaz.
 * BR-SZL-104: Sözleşme PDF'i yalnızca her iki taraf da onay verdikten
 *             sonra üretilebilir.
 */
export const sozlesmeSemasi = z
  .object({
    emlak_id: z.string().uuid("İlan seçilmelidir."),
    kiraci_profil_id: z.string().uuid("Kiracı müşteri seçilmelidir."),
    baslangic_tarihi: z.string().min(1, "Başlangıç tarihi zorunludur."),
    bitis_tarihi: z.string().min(1, "Bitiş tarihi zorunludur."),
    kira_bedeli: z.number().positive("Kira bedeli 0'dan büyük olmalıdır."),
    depozito: z.number().min(0, "Depozito negatif olamaz."),
    ozel_sartlar: z.string().max(2000).nullable(),
  })
  .refine((v) => new Date(v.bitis_tarihi) > new Date(v.baslangic_tarihi), {
    path: ["bitis_tarihi"],
    message: "Bitiş tarihi, başlangıç tarihinden sonra olmalıdır.",
  });

export type SozlesmeGirdisi = z.infer<typeof sozlesmeSemasi>;
