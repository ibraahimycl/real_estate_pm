import { NextResponse, type NextRequest } from "next/server";
import { oturumProfili } from "@/lib/auth";
import {
  gorusmeBaslat,
  gorusmeGecmisi,
  gorusmeTuru,
  mesajiKaydet,
  type SohbetMesaji,
} from "@/lib/ai/gorusme";
import { aiKullanilabilir } from "@/lib/ai/openai";
import { GORUSME_MESAJ_SINIRI, gorusmeSiniriAsildi } from "@/lib/ai/limitler";

/**
 * AI danışman görüşme uç noktası.
 *
 * Akış: kullanıcı mesajı kaydedilir → geçmiş veri tabanından okunur →
 * model (veya kural tabanlı yedek) yanıt üretir → yanıt kaydedilir.
 * Geçmişin kaynağı daima veri tabanıdır; istemciden gelen metne
 * güvenilmez.
 */
export async function POST(request: NextRequest) {
  let govde: { gorusme_id?: string; mesaj?: string };
  try {
    govde = await request.json();
  } catch {
    return NextResponse.json({ hata: "Geçersiz istek." }, { status: 400 });
  }

  const mesaj = (govde.mesaj ?? "").trim();
  if (!mesaj) {
    return NextResponse.json({ hata: "Mesaj boş olamaz." }, { status: 400 });
  }
  if (mesaj.length > 1000) {
    return NextResponse.json(
      { hata: "Mesaj en fazla 1000 karakter olabilir." },
      { status: 400 },
    );
  }

  const profil = await oturumProfili();
  const gorusmeId = govde.gorusme_id ?? (await gorusmeBaslat(profil?.id ?? null));

  // Tek bir sohbetin sonsuza kadar uzatılmasını engeller (maliyet freni).
  if (govde.gorusme_id && (await gorusmeSiniriAsildi(gorusmeId))) {
    return NextResponse.json({
      gorusme_id: gorusmeId,
      yanit:
        `Bu görüşme ${GORUSME_MESAJ_SINIRI} mesajı aştı. Dilerseniz sayfayı ` +
        "yenileyip yeni bir görüşme başlatabilir ya da ofisimizi arayabilirsiniz.",
      ai_kullanildi: false,
      talep_kaydedildi: false,
      sinir_asildi: true,
    });
  }

  await mesajiKaydet(gorusmeId, "user", mesaj);

  const gecmis: SohbetMesaji[] = await gorusmeGecmisi(gorusmeId);

  try {
    const { yanit, aiKullanildi, talepKaydedildi } = await gorusmeTuru(
      gorusmeId,
      gecmis,
      profil?.id ?? null,
    );

    await mesajiKaydet(gorusmeId, "assistant", yanit);

    return NextResponse.json({
      gorusme_id: gorusmeId,
      yanit,
      ai_kullanildi: aiKullanildi,
      talep_kaydedildi: talepKaydedildi,
    });
  } catch (hata) {
    const metin =
      hata instanceof Error ? hata.message : "Bilinmeyen bir hata oluştu.";
    return NextResponse.json(
      { gorusme_id: gorusmeId, hata: `Yanıt üretilemedi: ${metin}` },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({ ai_aktif: aiKullanilabilir() });
}
