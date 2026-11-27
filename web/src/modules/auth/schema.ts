import { z } from "zod";

/**
 * Giriş ve kayıt doğrulama kuralları.
 * Aynı şema hem formda hem Server Action içinde kullanılır.
 */

export const telefonSemasi = z
  .string()
  .regex(/^[0-9]{10,11}$/, "Telefon 10 veya 11 haneli, yalnızca rakam olmalıdır.");

export const girisSemasi = z.object({
  eposta: z.string().email("Geçerli bir e-posta adresi giriniz."),
  parola: z.string().min(1, "Parola alanı zorunludur."),
});

export const kayitSemasi = z
  .object({
    ad: z.string().min(2, "Ad en az 2 karakter olmalıdır.").max(50),
    soyad: z.string().min(2, "Soyad en az 2 karakter olmalıdır.").max(50),
    eposta: z.string().email("Geçerli bir e-posta adresi giriniz."),
    cep_telefon: telefonSemasi,
    parola: z.string().min(8, "Parola en az 8 karakter olmalıdır."),
    parolaTekrar: z.string(),
  })
  .refine((v) => v.parola === v.parolaTekrar, {
    path: ["parolaTekrar"],
    message: "Parolalar eşleşmiyor.",
  });

export type GirisGirdisi = z.infer<typeof girisSemasi>;
export type KayitGirdisi = z.infer<typeof kayitSemasi>;
