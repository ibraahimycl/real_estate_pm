"use server";

/**
 * Modül 1 — İş Yeri Tanımı Server Action'ları.
 * FR-ISY-101..105 · BR-ISY-101, BR-ISY-102 · UC-ISY-01
 */

import { revalidatePath } from "next/cache";
import { sunucuIstemcisi } from "@/lib/supabase/server";
import { gerektirEmlakci } from "@/lib/auth";
import { isyeriSemasi } from "./schema";
import {
  dbHatasi,
  metin,
  type EylemSonucu,
  zodHatalari,
} from "@/modules/ortak/sonuc";

export async function isyeriKaydet(
  _oncekiDurum: EylemSonucu,
  form: FormData,
): Promise<EylemSonucu> {
  // Server Action doğrudan POST ile de çağrılabilir; yetki her seferinde
  // yeniden doğrulanır.
  await gerektirEmlakci();

  const sonuc = isyeriSemasi.safeParse({
    unvan: metin(form, "unvan"),
    yetkili_ad: metin(form, "yetkili_ad"),
    vergi_dairesi: metin(form, "vergi_dairesi"),
    vergi_no: metin(form, "vergi_no"),
    adres: metin(form, "adres"),
    il: metin(form, "il"),
    ilce: metin(form, "ilce"),
    telefon: metin(form, "telefon"),
    faks: metin(form, "faks"),
    eposta: metin(form, "eposta"),
    web_sitesi: metin(form, "web_sitesi"),
  });
  if (!sonuc.success) return zodHatalari(sonuc.error);

  const supabase = await sunucuIstemcisi();
  const id = metin(form, "id");

  const { error } = id
    ? await supabase.from("ofis").update(sonuc.data).eq("id", id)
    : await supabase.from("ofis").insert(sonuc.data);

  if (error) return dbHatasi(error);

  revalidatePath("/panel/isyeri");
  revalidatePath("/", "layout");
  return {
    basarili: true,
    mesaj: id
      ? "İş yeri bilgileri güncellendi."
      : "İş yeri kaydı oluşturuldu.",
  };
}
