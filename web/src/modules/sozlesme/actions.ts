"use server";

/**
 * Kira sözleşmesi Server Action'ları.
 * FR-SZL-101..107 · BR-SZL-101..104 · UC-SZL-01
 */

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sunucuIstemcisi } from "@/lib/supabase/server";
import { yoneticiIstemcisi } from "@/lib/supabase/admin";
import { gerektirEmlakci, oturumProfili } from "@/lib/auth";
import { sozlesmeSemasi } from "./schema";
import {
  dbHatasi,
  metin,
  sayi,
  type EylemSonucu,
  zodHatalari,
} from "@/modules/ortak/sonuc";

export async function sozlesmeOlustur(
  _oncekiDurum: EylemSonucu,
  form: FormData,
): Promise<EylemSonucu> {
  await gerektirEmlakci();

  const sonuc = sozlesmeSemasi.safeParse({
    emlak_id: metin(form, "emlak_id"),
    kiraci_profil_id: metin(form, "kiraci_profil_id"),
    baslangic_tarihi: metin(form, "baslangic_tarihi"),
    bitis_tarihi: metin(form, "bitis_tarihi"),
    kira_bedeli: sayi(form, "kira_bedeli"),
    depozito: sayi(form, "depozito") ?? 0,
    ozel_sartlar: metin(form, "ozel_sartlar"),
  });
  if (!sonuc.success) return zodHatalari(sonuc.error);

  const supabase = await sunucuIstemcisi();

  // Ev sahibi, ilanın sahibi olan müşteridir.
  const { data: emlak } = await supabase
    .from("emlaklar")
    .select("sahip_profil_id")
    .eq("id", sonuc.data.emlak_id)
    .maybeSingle();

  if (!emlak) return { basarili: false, mesaj: "İlan bulunamadı." };

  if (emlak.sahip_profil_id === sonuc.data.kiraci_profil_id) {
    return {
      basarili: false,
      mesaj: "Ev sahibi ile kiracı aynı kişi olamaz.",
      alanHatalari: {
        kiraci_profil_id: "Bu kişi ilanın sahibi. Farklı bir müşteri seçin.",
      },
    };
  }

  const { data, error } = await supabase
    .from("sozlesmeler")
    .insert({ ...sonuc.data, ev_sahibi_profil_id: emlak.sahip_profil_id })
    .select("id")
    .single();

  if (error) return dbHatasi(error);

  revalidatePath("/panel/sozlesmeler");
  redirect(`/panel/sozlesmeler/${data!.id}?kayit=eklendi`);
}

/**
 * Sözleşme onayı.
 *
 * Veri tabanındaki sozlesme_onayla() fonksiyonu çağıranın rolüne göre
 * doğru onay alanını doldurur; iki taraf da onayladığında trigger durumu
 * 'imzalandi' yapar. Onay mantığı veri tabanında olduğu için istemciden
 * gelen bir değere güvenilmez.
 */
export async function sozlesmeOnayla(
  _oncekiDurum: EylemSonucu,
  form: FormData,
): Promise<EylemSonucu> {
  const profil = await oturumProfili();
  if (!profil) return { basarili: false, mesaj: "Önce giriş yapmalısınız." };

  const id = metin(form, "id");
  if (!id) return { basarili: false, mesaj: "Sözleşme bulunamadı." };

  const supabase = await sunucuIstemcisi();
  const { data, error } = await supabase.rpc("sozlesme_onayla", {
    p_sozlesme_id: id,
  });

  if (error) return dbHatasi(error);

  // İmzalandıysa: ilan 'kiralandi' olur ve gelir kaydı oluşur.
  // Son onayı KİMİN verdiğine bakılmaz — normal akışta son onay müşteriden
  // gelir ve yan etkiler yine de işlemelidir.
  if (data?.durum === "imzalandi") {
    await tamamlananSozlesmeyiIsle(id);
  }

  revalidatePath("/panel/sozlesmeler");
  revalidatePath(`/panel/sozlesmeler/${id}`);
  revalidatePath("/hesabim/sozlesmelerim");

  return {
    basarili: true,
    mesaj:
      data?.durum === "imzalandi"
        ? "Her iki taraf da onayladı. Sözleşme imzalandı, çıktısını alabilirsiniz."
        : "Onayınız kaydedildi. Diğer tarafın onayı bekleniyor.",
  };
}

/**
 * Sözleşme imzalandığında yapılacak yan işlemler:
 * ilan durumunun güncellenmesi ve KPI için gelir kaydı.
 */
async function tamamlananSozlesmeyiIsle(sozlesmeId: string): Promise<void> {
  // Yönetici istemcisi kullanılır: son onayı müşteri verdiğinde, o kullanıcının
  // emlaklar ve islemler tablolarına yazma yetkisi yoktur. Bu işlem kullanıcı
  // adına değil, sistem adına yapılır.
  const supabase = yoneticiIstemcisi();

  const { data: sozlesme } = await supabase
    .from("sozlesmeler")
    .select("id, emlak_id, kira_bedeli")
    .eq("id", sozlesmeId)
    .maybeSingle();
  if (!sozlesme) return;

  await supabase
    .from("emlaklar")
    .update({ durum: "kiralandi" })
    .eq("id", sozlesme.emlak_id);

  // Mükerrer gelir kaydı oluşmasın
  const { count } = await supabase
    .from("islemler")
    .select("id", { count: "exact", head: true })
    .eq("sozlesme_id", sozlesmeId);
  if ((count ?? 0) > 0) return;

  await supabase.from("islemler").insert({
    emlak_id: sozlesme.emlak_id,
    sozlesme_id: sozlesmeId,
    tur: "kiralama",
    tutar: sozlesme.kira_bedeli,
    // Sektör uygulaması: kiralamada komisyon bir aylık kira bedelidir.
    komisyon: sozlesme.kira_bedeli,
  });

  revalidatePath("/panel");
  revalidatePath("/panel/emlaklar");
}

export async function sozlesmeIptal(form: FormData): Promise<void> {
  await gerektirEmlakci();
  const id = metin(form, "id");
  if (!id) return;

  const supabase = await sunucuIstemcisi();
  await supabase.from("sozlesmeler").update({ durum: "iptal" }).eq("id", id);

  revalidatePath("/panel/sozlesmeler");
  revalidatePath(`/panel/sozlesmeler/${id}`);
}
