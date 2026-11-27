import "server-only";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { yoneticiIstemcisi } from "@/lib/supabase/admin";

const TEKRAR_SAYMA_SAATI = 6;

/**
 * İlan görüntülenme sayacı.
 *
 * Aynı ziyaretçinin sayfayı yenilemesi sayacı şişirmesin diye, IP + tarayıcı
 * imzasından üretilen bir karma ile son 6 saat içinde kayıt var mı diye
 * bakılır. IP açık biçimde saklanmaz, yalnızca tek yönlü karması tutulur.
 */
export async function goruntulenmeKaydet(
  emlakId: string,
  profilId: string | null,
): Promise<void> {
  try {
    const basliklar = await headers();
    const ip =
      basliklar.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      basliklar.get("x-real-ip") ??
      "bilinmiyor";
    const tarayici = basliklar.get("user-agent") ?? "bilinmiyor";
    const hash = createHash("sha256")
      .update(`${ip}|${tarayici}|${emlakId}`)
      .digest("hex")
      .slice(0, 32);

    const admin = yoneticiIstemcisi();
    const esik = new Date(
      Date.now() - TEKRAR_SAYMA_SAATI * 60 * 60 * 1000,
    ).toISOString();

    const { count } = await admin
      .from("emlak_goruntulenme")
      .select("id", { count: "exact", head: true })
      .eq("emlak_id", emlakId)
      .eq("ziyaretci_hash", hash)
      .gte("created_at", esik);

    if ((count ?? 0) > 0) return;

    await admin.from("emlak_goruntulenme").insert({
      emlak_id: emlakId,
      profil_id: profilId,
      ziyaretci_hash: hash,
    });
  } catch {
    // Sayaç yazılamazsa ilan sayfası yine de açılmalıdır.
  }
}
