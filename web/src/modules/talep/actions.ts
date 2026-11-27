"use server";

/** Müşteri talebi Server Action'ları. FR-TLP-101..106 · UC-TLP-01 */

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sunucuIstemcisi } from "@/lib/supabase/server";
import { yoneticiIstemcisi } from "@/lib/supabase/admin";
import { gerektirEmlakci, oturumProfili } from "@/lib/auth";
import { talepSemasi } from "./schema";
import { odaBirlestir } from "@/lib/oda";
import {
  dbHatasi,
  metin,
  onay,
  sayi,
  type EylemSonucu,
  zodHatalari,
} from "@/modules/ortak/sonuc";
import type { OdaSayisi, TalepDurumu } from "@/types/database";

function formdanOku(form: FormData) {
  const odalar = form.getAll("oda").filter((o) => typeof o === "string") as string[];
  // Kutucuklarda olmayan kombinasyon elle yazılmış olabilir (örn. 7+3).
  const elle = odaBirlestir(sayi(form, "oda_n"), sayi(form, "salon_n") ?? 0);
  if (elle && !odalar.includes(elle)) odalar.push(elle);
  return talepSemasi.safeParse({
    ad_soyad: metin(form, "ad_soyad"),
    telefon: metin(form, "telefon"),
    eposta: metin(form, "eposta"),
    islem_turu: metin(form, "islem_turu"),
    emlak_turu: metin(form, "emlak_turu"),
    il: metin(form, "il"),
    ilce: metin(form, "ilce"),
    min_fiyat: sayi(form, "min_fiyat"),
    max_fiyat: sayi(form, "max_fiyat"),
    min_m2: sayi(form, "min_m2"),
    oda_sayilari: odalar.length ? (odalar as OdaSayisi[]) : null,
    max_bina_yasi: sayi(form, "max_bina_yasi"),
    asansor_sart: onay(form, "asansor_sart"),
    otopark_sart: onay(form, "otopark_sart"),
    esyali_sart: onay(form, "esyali_sart"),
    notlar: metin(form, "notlar"),
    bildirim_izni: onay(form, "bildirim_izni"),
  });
}

export async function talepOlustur(
  _oncekiDurum: EylemSonucu,
  form: FormData,
): Promise<EylemSonucu> {
  const sonuc = formdanOku(form);
  if (!sonuc.success) return zodHatalari(sonuc.error);

  const profil = await oturumProfili();

  // Ziyaretçi de talep bırakabildiği için yönetici istemcisi kullanılır.
  const admin = yoneticiIstemcisi();
  const { error } = await admin.from("talepler").insert({
    ...sonuc.data,
    profil_id: profil?.id ?? null,
    kaynak: profil ? "web" : "web",
  });

  if (error) return dbHatasi(error);

  revalidatePath("/panel/talepler");
  revalidatePath("/hesabim/taleplerim");

  if (profil) redirect("/hesabim/taleplerim?kayit=eklendi");
  return {
    basarili: true,
    mesaj:
      "Talebiniz kaydedildi. Kriterlerinize uyan bir ilan düştüğünde sizinle iletişime geçeceğiz.",
  };
}

/** Emlakçının müşteri adına talep açması. */
export async function talepOlusturDanisman(
  _oncekiDurum: EylemSonucu,
  form: FormData,
): Promise<EylemSonucu> {
  await gerektirEmlakci();

  const sonuc = formdanOku(form);
  if (!sonuc.success) return zodHatalari(sonuc.error);

  const supabase = await sunucuIstemcisi();
  const { error } = await supabase.from("talepler").insert({
    ...sonuc.data,
    profil_id: metin(form, "profil_id"),
    kaynak: "emlakci",
  });

  if (error) return dbHatasi(error);

  revalidatePath("/panel/talepler");
  redirect("/panel/talepler?kayit=eklendi");
}

export async function talepDurumGuncelle(
  _oncekiDurum: EylemSonucu,
  form: FormData,
): Promise<EylemSonucu> {
  await gerektirEmlakci();

  const id = metin(form, "id");
  const durum = metin(form, "durum") as TalepDurumu | null;
  if (!id || !durum) return { basarili: false, mesaj: "Bilgiler eksik." };

  const supabase = await sunucuIstemcisi();
  const { error } = await supabase.from("talepler").update({ durum }).eq("id", id);
  if (error) return dbHatasi(error);

  revalidatePath("/panel/talepler");
  revalidatePath("/hesabim/taleplerim");
  return { basarili: true, mesaj: "Talep durumu güncellendi." };
}

/** Müşterinin kendi talebini kapatması. */
export async function talebiKapat(form: FormData): Promise<void> {
  const profil = await oturumProfili();
  const id = metin(form, "id");
  if (!profil || !id) return;

  const supabase = await sunucuIstemcisi();
  await supabase
    .from("talepler")
    .update({ durum: "kapandi" })
    .eq("id", id)
    .eq("profil_id", profil.id);

  revalidatePath("/hesabim/taleplerim");
}

/** Bildirim izninin açılıp kapatılması (KVKK açık rıza yönetimi). */
export async function bildirimIzniDegistir(form: FormData): Promise<void> {
  const profil = await oturumProfili();
  const id = metin(form, "id");
  if (!profil || !id) return;

  const supabase = await sunucuIstemcisi();
  const { data } = await supabase
    .from("talepler")
    .select("bildirim_izni")
    .eq("id", id)
    .eq("profil_id", profil.id)
    .maybeSingle();

  if (!data) return;

  await supabase
    .from("talepler")
    .update({ bildirim_izni: !data.bildirim_izni })
    .eq("id", id)
    .eq("profil_id", profil.id);

  revalidatePath("/hesabim/taleplerim");
}
