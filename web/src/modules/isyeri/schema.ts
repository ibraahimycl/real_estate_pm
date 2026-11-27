import { z } from "zod";

/**
 * Modül 1 — İş Yeri Tanımı doğrulama kuralları.
 * İlgili iş kuralları: BR-ISY-101 (zorunlu alanlar), BR-ISY-102 (format).
 */
export const isyeriSemasi = z.object({
  unvan: z
    .string()
    .min(2, "İşletme unvanı en az 2 karakter olmalıdır.")
    .max(150, "İşletme unvanı en fazla 150 karakter olabilir."),
  yetkili_ad: z
    .string()
    .min(2, "Yetkili adı en az 2 karakter olmalıdır.")
    .max(100),
  vergi_dairesi: z.string().max(100).nullable(),
  vergi_no: z
    .string()
    .regex(/^[0-9]{10,11}$/, "Vergi numarası 10 veya 11 haneli olmalıdır.")
    .nullable(),
  adres: z.string().min(10, "Adres en az 10 karakter olmalıdır."),
  il: z.string().min(2, "İl alanı zorunludur."),
  ilce: z.string().min(2, "İlçe alanı zorunludur."),
  telefon: z
    .string()
    .regex(/^[0-9]{10,11}$/, "Telefon 10 veya 11 haneli, yalnızca rakam olmalıdır."),
  faks: z
    .string()
    .regex(/^[0-9]{10,11}$/, "Faks 10 veya 11 haneli, yalnızca rakam olmalıdır.")
    .nullable(),
  eposta: z.string().email("Geçerli bir e-posta adresi giriniz."),
  web_sitesi: z.string().url("Geçerli bir adres giriniz (https:// ile).").nullable(),
});

export type IsyeriGirdisi = z.infer<typeof isyeriSemasi>;
