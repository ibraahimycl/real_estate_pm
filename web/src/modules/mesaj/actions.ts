"use server";

import { revalidatePath } from "next/cache";
import { sunucuIstemcisi } from "@/lib/supabase/server";
import { gerektirEmlakci } from "@/lib/auth";
import { metin } from "@/modules/ortak/sonuc";

export async function mesajOkunduIsaretle(form: FormData): Promise<void> {
  await gerektirEmlakci();
  const id = metin(form, "id");
  if (!id) return;

  const supabase = await sunucuIstemcisi();
  await supabase.from("mesajlar").update({ okundu: true }).eq("id", id);

  revalidatePath("/panel/mesajlar");
  revalidatePath("/panel", "layout");
}

export async function tumMesajlariOku(): Promise<void> {
  await gerektirEmlakci();
  const supabase = await sunucuIstemcisi();
  await supabase.from("mesajlar").update({ okundu: true }).eq("okundu", false);

  revalidatePath("/panel/mesajlar");
  revalidatePath("/panel", "layout");
}
