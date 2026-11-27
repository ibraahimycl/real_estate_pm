import "server-only";

import type OpenAI from "openai";
import { aiIstemcisi, aiModeli } from "./openai";
import { DANISMAN_TALIMATI } from "./prompts";
import {
  ARAC_TANIMLARI,
  ilanAra,
  ilanlariOzetle,
  talepKaydet,
  type IlanAramaArgumanlari,
  type TalepKayitArgumanlari,
} from "./araclar";
import { yoneticiIstemcisi } from "@/lib/supabase/admin";
import { kuralTabanliYanit } from "./yedek";
import { gunlukKotaDoldu } from "./limitler";

export type SohbetMesaji = { rol: "user" | "assistant"; icerik: string };

const ARAC_TUR_SINIRI = 4;

/**
 * Bir görüşme turunu yürütür.
 *
 * AI anahtarı tanımlıysa OpenAI araç çağrısı döngüsü çalışır: model
 * ilan_ara / talep_kaydet araçlarını çağırır, sonuçlar modele geri verilir
 * ve nihai yanıt üretilir.
 *
 * Anahtar yoksa kural tabanlı yedek devreye girer; sistem çalışmaya
 * devam eder, yalnızca dil akıcılığı düşer.
 */
export async function gorusmeTuru(
  gorusmeId: string,
  gecmis: SohbetMesaji[],
  profilId: string | null,
): Promise<{ yanit: string; aiKullanildi: boolean; talepKaydedildi: boolean }> {
  // Günlük çağrı tavanı dolduysa AI'a gidilmez; sistem yedekle çalışır.
  const istemci = (await gunlukKotaDoldu()) ? null : aiIstemcisi();

  if (!istemci) {
    const yedek = await kuralTabanliYanit(gecmis, gorusmeId, profilId);
    return { ...yedek, aiKullanildi: false };
  }

  const mesajlar: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: DANISMAN_TALIMATI },
    ...gecmis.map((m) => ({
      role: m.rol === "user" ? ("user" as const) : ("assistant" as const),
      content: m.icerik,
    })),
  ];

  let talepKaydedildi = false;

  for (let tur = 0; tur < ARAC_TUR_SINIRI; tur++) {
    const yanit = await istemci.chat.completions.create({
      model: aiModeli(),
      temperature: 0.6,
      max_tokens: 500,
      tools: ARAC_TANIMLARI,
      messages: mesajlar,
    });

    const secim = yanit.choices[0]?.message;
    if (!secim) break;

    const aracCagrilari = secim.tool_calls ?? [];

    if (aracCagrilari.length === 0) {
      return {
        yanit:
          secim.content?.trim() ??
          "Üzgünüm, sizi tam anlayamadım. Nasıl bir yer aradığınızı anlatır mısınız?",
        aiKullanildi: true,
        talepKaydedildi,
      };
    }

    mesajlar.push(secim);

    for (const cagri of aracCagrilari) {
      if (cagri.type !== "function") continue;

      let sonuc: string;
      try {
        const argumanlar = JSON.parse(cagri.function.arguments || "{}");

        if (cagri.function.name === "ilan_ara") {
          const { ilanlar } = await ilanAra(argumanlar as IlanAramaArgumanlari);
          sonuc = ilanlariOzetle(ilanlar);
        } else if (cagri.function.name === "talep_kaydet") {
          const kayit = await talepKaydet(
            argumanlar as TalepKayitArgumanlari,
            gorusmeId,
            profilId,
          );
          if (kayit.basarili) talepKaydedildi = true;
          sonuc = kayit.mesaj;
        } else {
          sonuc = "Bilinmeyen araç.";
        }
      } catch (hata) {
        sonuc = `Araç çalıştırılamadı: ${
          hata instanceof Error ? hata.message : "bilinmeyen hata"
        }`;
      }

      mesajlar.push({
        role: "tool",
        tool_call_id: cagri.id,
        content: sonuc,
      });
    }
  }

  return {
    yanit:
      "Şu an isteğinizi işleyemedim. Dilerseniz kriterlerinizi tekrar yazar mısınız?",
    aiKullanildi: true,
    talepKaydedildi,
  };
}

/** Görüşme ve mesajlarını veri tabanına yazar. */
export async function mesajiKaydet(
  gorusmeId: string,
  rol: "user" | "assistant" | "system",
  icerik: string,
): Promise<void> {
  const admin = yoneticiIstemcisi();
  await admin
    .from("gorusme_mesajlari")
    .insert({ gorusme_id: gorusmeId, rol, icerik });
}

export async function gorusmeBaslat(profilId: string | null): Promise<string> {
  const admin = yoneticiIstemcisi();
  const { data } = await admin
    .from("gorusmeler")
    .insert({ profil_id: profilId })
    .select("id")
    .single();
  return data!.id;
}

export async function gorusmeGecmisi(
  gorusmeId: string,
): Promise<SohbetMesaji[]> {
  const admin = yoneticiIstemcisi();
  const { data } = await admin
    .from("gorusme_mesajlari")
    .select("rol, icerik")
    .eq("gorusme_id", gorusmeId)
    .order("created_at");

  return ((data ?? []) as { rol: string; icerik: string }[])
    .filter((m) => m.rol === "user" || m.rol === "assistant")
    .map((m) => ({ rol: m.rol as "user" | "assistant", icerik: m.icerik }));
}
