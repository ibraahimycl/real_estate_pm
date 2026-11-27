import { ZodError } from "zod";

/**
 * Tüm Server Action'ların ortak dönüş tipi.
 * useActionState ile forma bağlanır; alan bazlı hatalar ilgili girdinin
 * altında kırmızı olarak gösterilir.
 */
export type EylemSonucu = {
  basarili: boolean;
  mesaj?: string;
  alanHatalari?: Record<string, string>;
};

export const BOS_SONUC: EylemSonucu = { basarili: false };

/** Zod doğrulama hatasını alan -> mesaj haritasına çevirir. */
export function zodHatalari(hata: ZodError): EylemSonucu {
  const alanHatalari: Record<string, string> = {};
  for (const sorun of hata.issues) {
    const alan = sorun.path.join(".");
    if (alan && !alanHatalari[alan]) alanHatalari[alan] = sorun.message;
  }
  return {
    basarili: false,
    mesaj: "Lütfen işaretli alanları düzeltin.",
    alanHatalari,
  };
}

/** Veri tabanı hatalarını kullanıcıya anlaşılır mesaja çevirir. */
export function dbHatasi(hata: { code?: string; message: string }): EylemSonucu {
  const eslesmeler: Record<string, string> = {
    "23505": "Bu kayıt zaten mevcut. Benzersiz olması gereken bir alan tekrar ediyor.",
    "23503": "İlişkili bir kayıt bulunamadı. Seçimlerinizi kontrol edin.",
    "23514": "Girilen değerlerden biri iş kurallarına uymuyor.",
    "42501": "Bu işlem için yetkiniz bulunmuyor.",
  };
  return {
    basarili: false,
    mesaj: (hata.code && eslesmeler[hata.code]) || hata.message,
  };
}

/** FormData'dan metin okur; boş string'i null'a çevirir. */
export function metin(form: FormData, alan: string): string | null {
  const deger = form.get(alan);
  if (typeof deger !== "string") return null;
  const kirpik = deger.trim();
  return kirpik === "" ? null : kirpik;
}

export function sayi(form: FormData, alan: string): number | null {
  const deger = metin(form, alan);
  if (deger === null) return null;
  const n = Number(deger);
  return Number.isNaN(n) ? null : n;
}

export function onay(form: FormData, alan: string): boolean {
  return form.get(alan) === "on" || form.get(alan) === "true";
}
