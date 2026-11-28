"use server";

/**
 * Modül 3 — Emlak Tanımı Server Action'ları.
 * FR-EML-101..108 · BR-EML-101..104 · UC-EML-01
 */

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sunucuIstemcisi } from "@/lib/supabase/server";
import { yoneticiIstemcisi } from "@/lib/supabase/admin";
import { gerektirEmlakci, gerektirGiris } from "@/lib/auth";
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
  const profil = await gerektirEmlakci();

  const id = metin(form, "id");
  if (!id) return { basarili: false, mesaj: "Güncellenecek ilan bulunamadı." };

  const sonuc = formdanOku(form);
  if (!sonuc.success) return zodHatalari(sonuc.error);

  const supabase = await sunucuIstemcisi();

  // Güncelleme öncesi durum: ilan yayına yeni alınıyorsa eşleştirme tetiklenir.
  const { data: oncekiKayit } = await supabase
    .from("emlaklar")
    .select("durum, danisman_id")
    .eq("id", id)
    .maybeSingle();

  const guncellemeVerisi =
    !oncekiKayit?.danisman_id && sonuc.data.durum !== "pasif"
      ? { ...sonuc.data, danisman_id: profil.id }
      : sonuc.data;

  const { error } = await supabase
    .from("emlaklar")
    .update(guncellemeVerisi)
    .eq("id", id);

  if (error) return dbHatasi(error);

  // İlan pasif/rezerve/kiralandı durumundan "aktif"e çevrildiyse, portföye
  // yeni düşmüş sayılır ve bekleyen talepler yeniden taranır.
  if (oncekiKayit?.durum !== "aktif" && sonuc.data.durum === "aktif") {
    await yeniIlaniEslestir(id);
  }

  revalidatePath("/panel/emlaklar");
  revalidatePath("/panel/ilan-talepleri");
  revalidatePath("/panel", "layout");
  revalidatePath(`/panel/emlaklar/${id}`);
  revalidatePath(`/ilan/${id}`);
  revalidatePath("/hesabim/ilanlarim");
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
export async function eslestirmeyiCalistir(
  _oncekiDurum: EylemSonucu,
  form: FormData,
): Promise<EylemSonucu> {
  await gerektirEmlakci();
  const id = metin(form, "id");
  if (!id) return { basarili: false, mesaj: "İlan bulunamadı." };

  const supabase = await sunucuIstemcisi();
  const { data: emlak } = await supabase
    .from("emlaklar")
    .select("durum")
    .eq("id", id)
    .maybeSingle();

  if (!emlak) {
    return { basarili: false, mesaj: "İlan bulunamadı." };
  }
  if (emlak.durum !== "aktif") {
    return {
      basarili: false,
      mesaj:
        "İlan 'Aktif' durumda olmadığı için eşleştirme taraması yapılmadı.",
    };
  }

  const uretilen = await yeniIlaniEslestir(id);

  revalidatePath(`/panel/emlaklar/${id}`);
  revalidatePath("/panel/mesajlar");
  revalidatePath("/panel", "layout");

  const saat = new Date().toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  if (uretilen > 0) {
    return {
      basarili: true,
      mesaj: `Tarama tamamlandı (${saat}): ${uretilen} müşteri için yeni eşleşme mesajı üretildi.`,
    };
  }

  return {
    basarili: true,
    mesaj: `Tarama tamamlandı (${saat}): Yeni eşleşme mesajı üretilmedi (uygun yeni talep yok veya mesajlar daha önce gönderilmiş).`,
  };
}

/**
 * Müşterinin satmak veya kiralamak istediği mülk için ilan talebi oluşturması.
 * Kayıt mevcut emlaklar tablosuna durum='pasif' ve danisman_id=null olarak yazılır;
 * emlakçı onaylayana kadar site kataloğunda görünmez.
 */
export async function musteriIlanTalebiGonder(
  _oncekiDurum: EylemSonucu,
  form: FormData,
): Promise<EylemSonucu> {
  const profil = await gerektirGiris("/hesabim/ilanlarim/yeni");

  const sonuc = emlakSemasi.safeParse({
    sahip_profil_id: profil.id,
    baslik: metin(form, "baslik"),
    aciklama: metin(form, "aciklama"),
    islem_turu: metin(form, "islem_turu"),
    emlak_turu: metin(form, "emlak_turu"),
    durum: "pasif",
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
  if (!sonuc.success) return zodHatalari(sonuc.error);

  const dosya = form.get("dosya");
  const gecerliDosya = dosya instanceof File && dosya.size > 0 ? dosya : null;
  if (gecerliDosya && gecerliDosya.size > 5 * 1024 * 1024) {
    return {
      basarili: false,
      mesaj: "Fotoğraf boyutu en fazla 5 MB olabilir.",
    };
  }

  const admin = yoneticiIstemcisi();

  const { data: ofis } = await admin
    .from("ofis")
    .select("id")
    .order("created_at")
    .limit(1)
    .maybeSingle();

  if (!ofis) {
    return {
      basarili: false,
      mesaj:
        "Emlak ofisi henüz tanımlanmadığı için ilan talebi oluşturulamıyor.",
    };
  }

  const { data, error } = await admin
    .from("emlaklar")
    .insert({
      ...sonuc.data,
      sahip_profil_id: profil.id,
      ofis_id: ofis.id,
      danisman_id: null,
      durum: "pasif",
    })
    .select("id")
    .single();

  if (error) return dbHatasi(error);

  if (gecerliDosya && data?.id) {
    const uzanti = gecerliDosya.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const yol = `${data.id}/${crypto.randomUUID()}.${uzanti}`;
    const { error: yuklemeHatasi } = await admin.storage
      .from(FOTO_KOVASI)
      .upload(yol, gecerliDosya, {
        contentType: gecerliDosya.type,
        upsert: false,
      });

    if (!yuklemeHatasi) {
      const {
        data: { publicUrl },
      } = admin.storage.from(FOTO_KOVASI).getPublicUrl(yol);

      await admin.from("emlak_fotograflari").insert({
        emlak_id: data.id,
        url: publicUrl,
        sira: 0,
        kapak: true,
      });
    }
  }

  revalidatePath("/hesabim/ilanlarim");
  revalidatePath("/hesabim", "layout");
  revalidatePath("/panel/ilan-talepleri");
  revalidatePath("/panel/emlaklar");
  revalidatePath("/panel", "layout");
  redirect("/hesabim/ilanlarim?kayit=onaya-gonderildi");
}

/** Emlakçının müşteri ilan talebini onaylayıp site kataloğuna alması. */
export async function ilanTalebiOnayla(
  _oncekiDurum: EylemSonucu,
  form: FormData,
): Promise<EylemSonucu> {
  const profil = await gerektirEmlakci();
  const id = metin(form, "id");
  if (!id) return { basarili: false, mesaj: "İlan talebi bulunamadı." };

  const supabase = await sunucuIstemcisi();
  const bugun = new Date().toISOString().slice(0, 10);

  const { error } = await supabase
    .from("emlaklar")
    .update({
      durum: "aktif",
      danisman_id: profil.id,
      yayin_tarihi: bugun,
    })
    .eq("id", id);

  if (error) return dbHatasi(error);

  const uretilen = await yeniIlaniEslestir(id);

  revalidatePath("/panel/ilan-talepleri");
  revalidatePath("/panel/emlaklar");
  revalidatePath("/panel/mesajlar");
  revalidatePath("/panel", "layout");
  revalidatePath("/hesabim/ilanlarim");
  revalidatePath("/");

  return {
    basarili: true,
    mesaj:
      uretilen > 0
        ? `İlan onaylandı ve site kataloğunda yayınlandı. ${uretilen} müşteri talebiyle eşleşti.`
        : "İlan onaylandı ve site kataloğunda yayınlandı.",
  };
}

/** Emlakçının müşteri ilan talebini reddetmesi (kaydı siler). */
export async function ilanTalebiReddet(
  _oncekiDurum: EylemSonucu,
  form: FormData,
): Promise<EylemSonucu> {
  await gerektirEmlakci();
  const id = metin(form, "id");
  if (!id) return { basarili: false, mesaj: "İlan talebi bulunamadı." };

  const supabase = await sunucuIstemcisi();
  const { error } = await supabase
    .from("emlaklar")
    .delete()
    .eq("id", id)
    .eq("durum", "pasif")
    .is("danisman_id", null);

  if (error) return dbHatasi(error);

  revalidatePath("/panel/ilan-talepleri");
  revalidatePath("/panel/emlaklar");
  revalidatePath("/panel", "layout");
  revalidatePath("/hesabim/ilanlarim");
  revalidatePath("/hesabim", "layout");

  return { basarili: true, mesaj: "İlan talebi reddedildi ve kaldırıldı." };
}
