"use server";

/**
 * Modül 3 — Emlak Tanımı Server Action'ları.
 * FR-EML-101..108 · BR-EML-101..104 · UC-EML-01
 */

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sunucuIstemcisi } from "@/lib/supabase/server";
import { yoneticiIstemcisi } from "@/lib/supabase/admin";
import { gerektirEmlakci } from "@/lib/auth";
import { emlakSemasi } from "./schema";
import { odaBirlestir } from "@/lib/oda";
import { yeniIlaniEslestir } from "@/lib/ai/eslestirme";
import {
  dbHatasi,
  metin,
  onay,
  sayi,
  type EylemSonucu,
  zodHatalari,
} from "@/modules/ortak/sonuc";

const FOTO_KOVASI = "ilan-fotograflari";

function formdanOku(form: FormData) {
  return emlakSemasi.safeParse({
    sahip_profil_id: metin(form, "sahip_profil_id"),
    baslik: metin(form, "baslik"),
    aciklama: metin(form, "aciklama"),
    islem_turu: metin(form, "islem_turu"),
    emlak_turu: metin(form, "emlak_turu"),
    durum: metin(form, "durum") ?? "aktif",
    fiyat: sayi(form, "fiyat"),
    aidat: sayi(form, "aidat") ?? 0,
    depozito: sayi(form, "depozito"),
    m2_brut: sayi(form, "m2_brut"),
    m2_net: sayi(form, "m2_net"),
    oda_sayisi: odaBirlestir(sayi(form, "oda_n"), sayi(form, "salon_n")),
    bulundugu_kat: sayi(form, "bulundugu_kat"),
    bina_kat_sayisi: sayi(form, "bina_kat_sayisi"),
    bina_yasi: sayi(form, "bina_yasi"),
    isinma_turu: metin(form, "isinma_turu"),
    banyo_sayisi: sayi(form, "banyo_sayisi"),
    esyali: onay(form, "esyali"),
    asansor: onay(form, "asansor"),
    otopark: onay(form, "otopark"),
    balkon: onay(form, "balkon"),
    site_icinde: onay(form, "site_icinde"),
    krediye_uygun: onay(form, "krediye_uygun"),
    il: metin(form, "il"),
    ilce: metin(form, "ilce"),
    mahalle: metin(form, "mahalle"),
    adres: metin(form, "adres"),
  });
}

export async function emlakEkle(
  _oncekiDurum: EylemSonucu,
  form: FormData,
): Promise<EylemSonucu> {
  const profil = await gerektirEmlakci();

  const sonuc = formdanOku(form);
  if (!sonuc.success) return zodHatalari(sonuc.error);

  const supabase = await sunucuIstemcisi();

  const { data: ofis } = await supabase
    .from("ofis")
    .select("id")
    .limit(1)
    .maybeSingle();
  if (!ofis) {
    return {
      basarili: false,
      mesaj:
        "Önce İş Yeri Tanımı yapılmalıdır. Emlak kayıtları bir işletmeye bağlanır.",
    };
  }

  const { data, error } = await supabase
    .from("emlaklar")
    .insert({ ...sonuc.data, ofis_id: ofis.id, danisman_id: profil.id })
    .select("id")
    .single();

  if (error) return dbHatasi(error);

  // Yeni ilan düştü: kriterleri tutan aktif müşteri taleplerini bul ve
  // bildirim izni olanlara AI mesajı üret (AI modülü).
  await yeniIlaniEslestir(data!.id);

  revalidatePath("/panel/emlaklar");
  revalidatePath("/");
  redirect(`/panel/emlaklar/${data!.id}?kayit=eklendi`);
}

export async function emlakGuncelle(
  _oncekiDurum: EylemSonucu,
  form: FormData,
): Promise<EylemSonucu> {
  await gerektirEmlakci();

  const id = metin(form, "id");
  if (!id) return { basarili: false, mesaj: "Güncellenecek ilan bulunamadı." };

  const sonuc = formdanOku(form);
  if (!sonuc.success) return zodHatalari(sonuc.error);

  const supabase = await sunucuIstemcisi();

  // Güncelleme öncesi durum: ilan yayına yeni alınıyorsa eşleştirme tetiklenir.
  const { data: oncekiKayit } = await supabase
    .from("emlaklar")
    .select("durum")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase
    .from("emlaklar")
    .update(sonuc.data)
    .eq("id", id);

  if (error) return dbHatasi(error);

  // İlan pasif/rezerve/kiralandı durumundan "aktif"e çevrildiyse, portföye
  // yeni düşmüş sayılır ve bekleyen talepler yeniden taranır.
  if (oncekiKayit?.durum !== "aktif" && sonuc.data.durum === "aktif") {
    await yeniIlaniEslestir(id);
  }

  revalidatePath("/panel/emlaklar");
  revalidatePath(`/panel/emlaklar/${id}`);
  revalidatePath(`/ilan/${id}`);
  revalidatePath("/");
  return { basarili: true, mesaj: "İlan bilgileri güncellendi." };
}

export async function emlakSil(
  _oncekiDurum: EylemSonucu,
  form: FormData,
): Promise<EylemSonucu> {
  await gerektirEmlakci();

  const id = metin(form, "id");
  if (!id) return { basarili: false, mesaj: "Silinecek ilan bulunamadı." };

  const supabase = await sunucuIstemcisi();

  // Sözleşmesi olan ilan silinemez (FK ON DELETE RESTRICT).
  const { count } = await supabase
    .from("sozlesmeler")
    .select("id", { count: "exact", head: true })
    .eq("emlak_id", id);

  if ((count ?? 0) > 0) {
    return {
      basarili: false,
      mesaj:
        "Bu ilana bağlı kira sözleşmesi bulunduğu için silinemez. İlanı 'Pasif' durumuna alabilirsiniz.",
    };
  }

  const { error } = await supabase.from("emlaklar").delete().eq("id", id);
  if (error) return dbHatasi(error);

  revalidatePath("/panel/emlaklar");
  revalidatePath("/");
  redirect("/panel/emlaklar?kayit=silindi");
}

/** Fotoğraf yükleme — Supabase Storage'a yazar, URL'i tabloya işler. */
export async function fotografYukle(
  _oncekiDurum: EylemSonucu,
  form: FormData,
): Promise<EylemSonucu> {
  await gerektirEmlakci();

  const emlakId = metin(form, "emlak_id");
  if (!emlakId) return { basarili: false, mesaj: "İlan bulunamadı." };

  const dosya = form.get("dosya");
  if (!(dosya instanceof File) || dosya.size === 0) {
    return { basarili: false, mesaj: "Lütfen bir görsel dosyası seçin." };
  }
  if (dosya.size > 5 * 1024 * 1024) {
    return { basarili: false, mesaj: "Dosya boyutu en fazla 5 MB olabilir." };
  }

  const admin = yoneticiIstemcisi();
  const uzanti = dosya.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const yol = `${emlakId}/${crypto.randomUUID()}.${uzanti}`;

  const { error: yuklemeHatasi } = await admin.storage
    .from(FOTO_KOVASI)
    .upload(yol, dosya, { contentType: dosya.type, upsert: false });

  if (yuklemeHatasi) {
    return { basarili: false, mesaj: `Yükleme başarısız: ${yuklemeHatasi.message}` };
  }

  const {
    data: { publicUrl },
  } = admin.storage.from(FOTO_KOVASI).getPublicUrl(yol);

  const supabase = await sunucuIstemcisi();
  const { count } = await supabase
    .from("emlak_fotograflari")
    .select("id", { count: "exact", head: true })
    .eq("emlak_id", emlakId);

  const { error } = await supabase.from("emlak_fotograflari").insert({
    emlak_id: emlakId,
    url: publicUrl,
    sira: count ?? 0,
    kapak: (count ?? 0) === 0,
  });

  if (error) return dbHatasi(error);

  revalidatePath(`/panel/emlaklar/${emlakId}`);
  revalidatePath(`/ilan/${emlakId}`);
  return { basarili: true, mesaj: "Fotoğraf yüklendi." };
}

export async function fotografSil(form: FormData): Promise<void> {
  await gerektirEmlakci();
  const id = metin(form, "foto_id");
  const emlakId = metin(form, "emlak_id");
  if (!id || !emlakId) return;

  const supabase = await sunucuIstemcisi();
  await supabase.from("emlak_fotograflari").delete().eq("id", id);

  revalidatePath(`/panel/emlaklar/${emlakId}`);
  revalidatePath(`/ilan/${emlakId}`);
}

export async function kapakYap(form: FormData): Promise<void> {
  await gerektirEmlakci();
  const id = metin(form, "foto_id");
  const emlakId = metin(form, "emlak_id");
  if (!id || !emlakId) return;

  const supabase = await sunucuIstemcisi();
  await supabase
    .from("emlak_fotograflari")
    .update({ kapak: false })
    .eq("emlak_id", emlakId);
  await supabase.from("emlak_fotograflari").update({ kapak: true }).eq("id", id);

  revalidatePath(`/panel/emlaklar/${emlakId}`);
  revalidatePath(`/ilan/${emlakId}`);
}

/**
 * Eşleştirmeyi elle yeniden çalıştırır.
 *
 * Eşleştirme normalde ilan kaydedilirken otomatik çalışır. Bu eylem,
 * ilan kaydedildikten SONRA yeni bir müşteri talebi açıldığında veya ilan
 * pasiften aktife alındığında taramayı tekrarlamak içindir.
 * Mükerrer mesaj üretilmez: UNIQUE(talep_id, emlak_id) kısıtı engeller.
 */
export async function eslestirmeyiCalistir(form: FormData): Promise<void> {
  await gerektirEmlakci();
  const id = metin(form, "id");
  if (!id) return;

  await yeniIlaniEslestir(id);

  revalidatePath(`/panel/emlaklar/${id}`);
  revalidatePath("/panel/mesajlar");
  revalidatePath("/panel", "layout");
}
