"use server";

/** İlan kaydetme (favori) işlemleri. FR-FAV-101 · UC-FAV-01 */

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sunucuIstemcisi } from "@/lib/supabase/server";
import { oturumProfili } from "@/lib/auth";
import { metin } from "@/modules/ortak/sonuc";

export async function favoriDegistir(form: FormData): Promise<void> {
  const emlakId = metin(form, "emlak_id");
  if (!emlakId) return;

  const profil = await oturumProfili();
  if (!profil) {
    redirect(`/giris?devam=${encodeURIComponent(`/ilan/${emlakId}`)}`);
  }

  const supabase = await sunucuIstemcisi();
  const { count } = await supabase
    .from("favoriler")
    .select("emlak_id", { count: "exact", head: true })
    .eq("profil_id", profil.id)
    .eq("emlak_id", emlakId);

  if ((count ?? 0) > 0) {
    await supabase
      .from("favoriler")
      .delete()
      .eq("profil_id", profil.id)
      .eq("emlak_id", emlakId);
  } else {
    await supabase
      .from("favoriler")
      .insert({ profil_id: profil.id, emlak_id: emlakId });
  }

  revalidatePath(`/ilan/${emlakId}`);
  revalidatePath("/hesabim/favorilerim");
}
