import "server-only";

import { yoneticiIstemcisi } from "@/lib/supabase/admin";

/**
 * MALİYET VE KÖTÜYE KULLANIM FRENLERİ
 *
 * Üç katman vardır. Hiçbiri sistemi durdurmaz: sınır aşıldığında AI devre
 * dışı kalır ve kural tabanlı yedek devralır, site çalışmaya devam eder.
 *
 *   1. AI_KAPALI=true           → acil durum anahtarı, tüm AI çağrılarını keser
 *   2. AI_GORUSME_MESAJ_SINIRI  → tek bir sohbet sonsuza kadar uzatılamaz
 *   3. AI_GUNLUK_CAGRI_SINIRI   → günlük toplam çağrı tavanı
 */

export const GORUSME_MESAJ_SINIRI = Number(
  process.env.AI_GORUSME_MESAJ_SINIRI ?? 20,
);

export const GUNLUK_CAGRI_SINIRI = Number(
  process.env.AI_GUNLUK_CAGRI_SINIRI ?? 200,
);

export function aiElleKapatildi(): boolean {
  return process.env.AI_KAPALI === "true";
}

function bugunBasi(): string {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return t.toISOString();
}

/**
 * Bugün kaç AI çağrısı yapıldı?
 * Her danışman yanıtı bir çağrıdır; her AI üretimi eşleşme mesajı da öyle.
 * Ayrı bir sayaç tablosu tutmak yerine mevcut kayıtlar sayılır.
 */
export async function bugunkuCagriSayisi(): Promise<number> {
  const admin = yoneticiIstemcisi();
  const esik = bugunBasi();

  const [{ count: sohbet }, { count: eslesme }] = await Promise.all([
    admin
      .from("gorusme_mesajlari")
      .select("id", { count: "exact", head: true })
      .eq("rol", "assistant")
      .gte("created_at", esik),
    admin
      .from("mesajlar")
      .select("id", { count: "exact", head: true })
      .not("model", "is", null)
      .gte("gonderim_zamani", esik),
  ]);

  return (sohbet ?? 0) + (eslesme ?? 0);
}

export async function gunlukKotaDoldu(): Promise<boolean> {
  if (GUNLUK_CAGRI_SINIRI <= 0) return false;
  try {
    return (await bugunkuCagriSayisi()) >= GUNLUK_CAGRI_SINIRI;
  } catch {
    // Sayım yapılamıyorsa akışı engelleme.
    return false;
  }
}

/** Bir görüşmedeki mesaj sayısı sınıra ulaştı mı? */
export async function gorusmeSiniriAsildi(gorusmeId: string): Promise<boolean> {
  if (GORUSME_MESAJ_SINIRI <= 0) return false;
  try {
    const admin = yoneticiIstemcisi();
    const { count } = await admin
      .from("gorusme_mesajlari")
      .select("id", { count: "exact", head: true })
      .eq("gorusme_id", gorusmeId);
    return (count ?? 0) >= GORUSME_MESAJ_SINIRI;
  } catch {
    return false;
  }
}
