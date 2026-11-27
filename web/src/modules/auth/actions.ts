"use server";

/**
 * Kimlik doğrulama Server Action'ları.
 * İlgili gereksinimler: FR-AUTH-101..105, BR-AUTH-101, UC-AUTH-01
 */

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { sunucuIstemcisi } from "@/lib/supabase/server";
import { girisSemasi, kayitSemasi } from "./schema";
import { type EylemSonucu, zodHatalari } from "@/modules/ortak/sonuc";

function guvenliYol(devam: string | null): string | null {
  // Açık yönlendirme (open redirect) açığını kapatır: yalnızca kendi
  // sitemizdeki mutlak yollara izin verilir.
  if (!devam) return null;
  if (!devam.startsWith("/") || devam.startsWith("//")) return null;
  return devam;
}

export async function girisYap(
  _oncekiDurum: EylemSonucu,
  form: FormData,
): Promise<EylemSonucu> {
  const sonuc = girisSemasi.safeParse({
    eposta: form.get("eposta"),
    parola: form.get("parola"),
  });
  if (!sonuc.success) return zodHatalari(sonuc.error);

  const supabase = await sunucuIstemcisi();
  const { error } = await supabase.auth.signInWithPassword({
    email: sonuc.data.eposta,
    password: sonuc.data.parola,
  });

  if (error) {
    return {
      basarili: false,
      mesaj:
        error.message === "Invalid login credentials"
          ? "E-posta veya parola hatalı."
          : error.message,
    };
  }

  const { data: user } = await supabase.auth.getUser();
  const { data: profil } = await supabase
    .from("profiller")
    .select("rol")
    .eq("auth_user_id", user.user!.id)
    .maybeSingle();

  revalidatePath("/", "layout");

  const devam = guvenliYol(form.get("devam") as string | null);
  const varsayilan =
    profil?.rol === "emlakci" || profil?.rol === "yonetici" ? "/panel" : "/hesabim";
  redirect(devam ?? varsayilan);
}

export async function kayitOl(
  _oncekiDurum: EylemSonucu,
  form: FormData,
): Promise<EylemSonucu> {
  const sonuc = kayitSemasi.safeParse({
    ad: form.get("ad"),
    soyad: form.get("soyad"),
    eposta: form.get("eposta"),
    cep_telefon: form.get("cep_telefon"),
    parola: form.get("parola"),
    parolaTekrar: form.get("parolaTekrar"),
  });
  if (!sonuc.success) return zodHatalari(sonuc.error);

  const supabase = await sunucuIstemcisi();
  const { error } = await supabase.auth.signUp({
    email: sonuc.data.eposta,
    password: sonuc.data.parola,
    // Bu veriler auth.users.raw_user_meta_data'ya yazılır; veri tabanındaki
    // trg_auth_user_olusunca trigger'ı profil kaydını buradan oluşturur
    // veya aynı e-postalı mevcut müşteri kaydına bağlar.
    options: {
      data: {
        ad: sonuc.data.ad,
        soyad: sonuc.data.soyad,
        cep_telefon: sonuc.data.cep_telefon,
      },
    },
  });

  if (error) {
    const mukerrer =
      error.message.toLowerCase().includes("already") ||
      error.code === "user_already_exists";
    return {
      basarili: false,
      mesaj: mukerrer
        ? "Bu e-posta adresiyle bir hesap zaten var. Giriş yapmayı deneyin."
        : error.message,
    };
  }

  revalidatePath("/", "layout");
  redirect("/hesabim");
}

export async function cikisYap() {
  const supabase = await sunucuIstemcisi();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
