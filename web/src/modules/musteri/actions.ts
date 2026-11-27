"use server";

/**
 * Modül 2 — Müşteri Tanımı Server Action'ları.
 * FR-MUS-101..106 · BR-MUS-101, BR-MUS-102, BR-MUS-103 · UC-MUS-01
 */

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sunucuIstemcisi } from "@/lib/supabase/server";
import { gerektirEmlakci, oturumProfili } from "@/lib/auth";
import { musteriSemasi } from "./schema";
import {
  dbHatasi,
  metin,
  type EylemSonucu,
  zodHatalari,
} from "@/modules/ortak/sonuc";

function formdanOku(form: FormData) {
  return musteriSemasi.safeParse({
    ad: metin(form, "ad"),
    soyad: metin(form, "soyad"),
    tckn: metin(form, "tckn"),
    eposta: metin(form, "eposta"),
    cep_telefon: metin(form, "cep_telefon"),
    ev_telefon: metin(form, "ev_telefon"),
    il: metin(form, "il"),
    ilce: metin(form, "ilce"),
    adres: metin(form, "adres"),
    notlar: metin(form, "notlar"),
  });
}

/** Mükerrer kayıt hatalarını doğru alanın altında gösterir (BR-MUS-102). */
function mukerrerHatasi(mesaj: string): EylemSonucu | null {
  if (!mesaj.includes("duplicate key")) return null;
  if (mesaj.includes("tckn")) {
    return {
      basarili: false,
      mesaj: "Bu TCKN ile kayıtlı bir müşteri zaten var.",
      alanHatalari: { tckn: "Bu TCKN sistemde kayıtlı." },
    };
  }
  if (mesaj.includes("eposta")) {
    return {
      basarili: false,
      mesaj: "Bu e-posta ile kayıtlı bir müşteri zaten var.",
      alanHatalari: { eposta: "Bu e-posta adresi sistemde kayıtlı." },
    };
  }
  return null;
}

export async function musteriEkle(
  _oncekiDurum: EylemSonucu,
  form: FormData,
): Promise<EylemSonucu> {
  await gerektirEmlakci();

  const sonuc = formdanOku(form);
  if (!sonuc.success) return zodHatalari(sonuc.error);

  const supabase = await sunucuIstemcisi();
  const { data, error } = await supabase
    .from("profiller")
    .insert({ ...sonuc.data, rol: "musteri", kayit_kaynagi: "emlakci" })
    .select("id")
    .single();

  if (error) return mukerrerHatasi(error.message) ?? dbHatasi(error);

  revalidatePath("/panel/musteriler");
  redirect(`/panel/musteriler/${data!.id}?kayit=eklendi`);
}

export async function musteriGuncelle(
  _oncekiDurum: EylemSonucu,
  form: FormData,
): Promise<EylemSonucu> {
  await gerektirEmlakci();

  const id = metin(form, "id");
  if (!id) return { basarili: false, mesaj: "Güncellenecek kayıt bulunamadı." };

  const sonuc = formdanOku(form);
  if (!sonuc.success) return zodHatalari(sonuc.error);

  const supabase = await sunucuIstemcisi();
  const { error } = await supabase
    .from("profiller")
    .update(sonuc.data)
    .eq("id", id);

  if (error) return mukerrerHatasi(error.message) ?? dbHatasi(error);

  revalidatePath("/panel/musteriler");
  revalidatePath(`/panel/musteriler/${id}`);
  return { basarili: true, mesaj: "Müşteri bilgileri güncellendi." };
}

/**
 * Müşteri silme.
 * BR-MUS-104: Portföyünde ilan bulunan müşteri silinemez; veri tabanındaki
 * FK kısıtı (ON DELETE RESTRICT) bunu zaten engeller, burada kullanıcıya
 * anlaşılır bir mesajla önceden bildiririz.
 */
export async function musteriSil(
  _oncekiDurum: EylemSonucu,
  form: FormData,
): Promise<EylemSonucu> {
  await gerektirEmlakci();

  const id = metin(form, "id");
  if (!id) return { basarili: false, mesaj: "Silinecek kayıt bulunamadı." };

  const supabase = await sunucuIstemcisi();

  const { count } = await supabase
    .from("emlaklar")
    .select("id", { count: "exact", head: true })
    .eq("sahip_profil_id", id);

  if ((count ?? 0) > 0) {
    return {
      basarili: false,
      mesaj: `Bu müşterinin portföyünde ${count} ilan bulunuyor. Önce ilanları başka bir sahibe aktarın veya silin.`,
    };
  }

  const { error } = await supabase.from("profiller").delete().eq("id", id);
  if (error) return dbHatasi(error);

  revalidatePath("/panel/musteriler");
  redirect("/panel/musteriler?kayit=silindi");
}

/**
 * Müşterinin kendi profilini güncellemesi.
 * Rol ve e-posta değiştirilemez: e-posta, ilan sahipliğinin hesapla
 * eşleştirildiği anahtardır (BR-MUS-105).
 */
export async function profilimiGuncelle(
  _oncekiDurum: EylemSonucu,
  form: FormData,
): Promise<EylemSonucu> {
  const profil = await oturumProfili();
  if (!profil) return { basarili: false, mesaj: "Önce giriş yapmalısınız." };

  const sema = musteriSemasi.pick({
    ad: true,
    soyad: true,
    tckn: true,
    cep_telefon: true,
    ev_telefon: true,
    il: true,
    ilce: true,
    adres: true,
  });

  const sonuc = sema.safeParse({
    ad: metin(form, "ad"),
    soyad: metin(form, "soyad"),
    tckn: metin(form, "tckn"),
    cep_telefon: metin(form, "cep_telefon"),
    ev_telefon: metin(form, "ev_telefon"),
    il: metin(form, "il"),
    ilce: metin(form, "ilce"),
    adres: metin(form, "adres"),
  });
  if (!sonuc.success) return zodHatalari(sonuc.error);

  const supabase = await sunucuIstemcisi();
  const { error } = await supabase
    .from("profiller")
    .update(sonuc.data)
    .eq("id", profil.id);

  if (error) return mukerrerHatasi(error.message) ?? dbHatasi(error);

  revalidatePath("/hesabim/profilim");
  revalidatePath("/", "layout");
  return { basarili: true, mesaj: "Profil bilgileriniz güncellendi." };
}
