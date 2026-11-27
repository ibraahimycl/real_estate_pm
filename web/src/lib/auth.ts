import "server-only";

import { redirect } from "next/navigation";
import { sunucuIstemcisi } from "@/lib/supabase/server";
import type { Profil } from "@/types/database";

/**
 * Giriş yapmış kullanıcının profil kaydı. Giriş yoksa null.
 * RLS sayesinde kullanıcı yalnızca kendi profilini okuyabilir.
 */
export async function oturumProfili(): Promise<Profil | null> {
  const supabase = await sunucuIstemcisi();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiller")
    .select("*")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  return (data as Profil | null) ?? null;
}

export function emlakciMi(profil: Profil | null): boolean {
  return profil?.rol === "emlakci" || profil?.rol === "yonetici";
}

/** Giriş zorunlu sayfalar için. */
export async function gerektirGiris(devamYolu = "/hesabim"): Promise<Profil> {
  const profil = await oturumProfili();
  if (!profil) {
    redirect(`/giris?devam=${encodeURIComponent(devamYolu)}`);
  }
  return profil;
}

/** Yalnızca emlakçı/yönetici erişebilen sayfalar için. */
export async function gerektirEmlakci(devamYolu = "/panel"): Promise<Profil> {
  const profil = await gerektirGiris(devamYolu);
  if (!emlakciMi(profil)) {
    redirect("/hesabim");
  }
  return profil;
}
