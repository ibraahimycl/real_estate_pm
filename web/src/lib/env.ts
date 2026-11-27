/**
 * Ortam değişkenlerine tek noktadan, doğrulanmış erişim.
 * Eksik bir anahtar varsa uygulama sessizce yanlış davranmak yerine
 * açık bir hata ile durur (NFR-GEN-03 · veri bütünlüğü).
 */

function zorunlu(ad: string, deger: string | undefined): string {
  if (!deger) {
    throw new Error(
      `Ortam değişkeni eksik: ${ad}. web/.env.local dosyasını kontrol edin.`,
    );
  }
  return deger;
}

export const env = {
  supabaseUrl: zorunlu(
    "NEXT_PUBLIC_SUPABASE_URL",
    process.env.NEXT_PUBLIC_SUPABASE_URL,
  ),
  supabaseAnonKey: zorunlu(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  ),
};

/** Yalnızca sunucu tarafında çağrılmalıdır. */
export function servisAnahtari(): string {
  return zorunlu(
    "SUPABASE_SERVICE_ROLE_KEY",
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

/** Yalnızca sunucu tarafında çağrılmalıdır. */
export function openAiAyarlari() {
  return {
    apiKey: zorunlu("OPENAI_API_KEY", process.env.OPENAI_API_KEY),
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
  };
}
