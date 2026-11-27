import { z } from "zod";

/**
 * Modül 2 — Müşteri Tanımı doğrulama kuralları.
 * BR-MUS-101: Zorunlu alanlar boş bırakılamaz.
 * BR-MUS-102: TCKN 11 hane olmalı, 0 ile başlayamaz ve benzersiz olmalıdır.
 * BR-MUS-103: Cep telefonu zorunludur; müşteriye ulaşmanın asgari yoludur.
 */
export const musteriSemasi = z.object({
  ad: z.string().min(2, "Ad en az 2 karakter olmalıdır.").max(50),
  soyad: z.string().min(2, "Soyad en az 2 karakter olmalıdır.").max(50),
  tckn: z
    .string()
    .regex(/^[1-9][0-9]{10}$/, "TCKN 11 haneli olmalı ve 0 ile başlayamaz.")
    .nullable(),
  eposta: z.string().email("Geçerli bir e-posta adresi giriniz."),
  cep_telefon: z
    .string()
    .regex(/^[0-9]{10,11}$/, "Cep telefonu 10 veya 11 haneli olmalıdır."),
  ev_telefon: z
    .string()
    .regex(/^[0-9]{10,11}$/, "Ev telefonu 10 veya 11 haneli olmalıdır.")
    .nullable(),
  il: z.string().max(50).nullable(),
  ilce: z.string().max(50).nullable(),
  adres: z.string().max(300).nullable(),
  notlar: z.string().max(1000).nullable(),
});

export type MusteriGirdisi = z.infer<typeof musteriSemasi>;
