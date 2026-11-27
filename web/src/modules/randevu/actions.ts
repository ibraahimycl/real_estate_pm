"use server";

/** Randevu modülü Server Action'ları. FR-RND-101..105 · UC-RND-01 */

import { revalidatePath } from "next/cache";
import { sunucuIstemcisi } from "@/lib/supabase/server";
import { yoneticiIstemcisi } from "@/lib/supabase/admin";
import { gerektirEmlakci, oturumProfili } from "@/lib/auth";
import { randevuSemasi } from "./schema";
import {
  dbHatasi,
  metin,
  type EylemSonucu,
  zodHatalari,
} from "@/modules/ortak/sonuc";
import type { RandevuDurumu } from "@/types/database";

export async function randevuTalepEt(
  _oncekiDurum: EylemSonucu,
  form: FormData,
): Promise<EylemSonucu> {
  const sonuc = randevuSemasi.safeParse({
    emlak_id: metin(form, "emlak_id"),
    ad_soyad: metin(form, "ad_soyad"),
    telefon: metin(form, "telefon"),
    tercih_gun: metin(form, "tercih_gun"),
    alternatif_gun: metin(form, "alternatif_gun"),
    musteri_notu: metin(form, "musteri_notu"),
  });
  if (!sonuc.success) return zodHatalari(sonuc.error);

  const profil = await oturumProfili();

  // Ziyaretçi de randevu bırakabilsin diye yönetici istemcisi kullanılır;
  // giriş yapılmışsa talep profile bağlanır.
  const admin = yoneticiIstemcisi();
  const { error } = await admin.from("randevular").insert({
    ...sonuc.data,
    profil_id: profil?.id ?? null,
  });

  if (error) return dbHatasi(error);

  revalidatePath("/panel/randevular");
  revalidatePath("/hesabim/randevularim");
  return {
    basarili: true,
    mesaj:
      "Randevu talebiniz alındı. Danışmanımız saati netleştirmek için sizi arayacak.",
  };
}

export async function randevuDurumGuncelle(
  _oncekiDurum: EylemSonucu,
  form: FormData,
): Promise<EylemSonucu> {
  const profil = await gerektirEmlakci();

  const id = metin(form, "id");
  const durum = metin(form, "durum") as RandevuDurumu | null;
  if (!id || !durum) {
    return { basarili: false, mesaj: "Randevu veya durum bilgisi eksik." };
  }

  const supabase = await sunucuIstemcisi();
  const { error } = await supabase
    .from("randevular")
    .update({
      durum,
      danisman_id: profil.id,
      danisman_notu: metin(form, "danisman_notu"),
    })
    .eq("id", id);

  if (error) return dbHatasi(error);

  revalidatePath("/panel/randevular");
  revalidatePath("/hesabim/randevularim");
  return { basarili: true, mesaj: "Randevu güncellendi." };
}
