import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { talepGetir } from "@/modules/talep/queries";
import { talebinGorusmesi } from "@/modules/gorusme/queries";
import { talebeUyanIlanlar } from "@/lib/ai/eslestirme";
import { SayfaBasligi } from "@/components/panel/SayfaBasligi";
import { Kart, KartBaslik, KartGovde } from "@/components/ui/Kart";
import { Rozet, durumTonu } from "@/components/ui/Rozet";
import { BosDurum } from "@/components/ui/BosDurum";
import { BagButon } from "@/components/ui/Buton";
import {
  ISLEM_TURU,
  TALEP_DURUMU,
  TALEP_KAYNAGI,
  EMLAK_TURU,
} from "@/lib/etiketler";
import { para, tarihSaat, telefon } from "@/lib/bicim";

export const metadata: Metadata = { title: "Talep Detayı" };

export default async function TalepDetaySayfasi({
  params,
}: PageProps<"/panel/talepler/[id]">) {
  const { id } = await params;
  const talep = await talepGetir(id);
  if (!talep) notFound();

  const [uyanlar, gorusme] = await Promise.all([
    talebeUyanIlanlar(id),
    talebinGorusmesi(id),
  ]);

  return (
    <>
      <SayfaBasligi
        baslik={talep.ad_soyad}
        aciklama={`${telefon(talep.telefon)} · ${TALEP_KAYNAGI[talep.kaynak]} · ${tarihSaat(talep.created_at)}`}
        eylem={
          <BagButon href="/panel/talepler" gorunum="ikincil">
            Listeye dön
          </BagButon>
        }
      />

      <div className="grid gap-5 lg:grid-cols-3 items-start">
        <Kart>
          <KartBaslik baslik="Aranan Kriterler" />
          <KartGovde>
            <dl className="space-y-2.5 text-sm">
              {[
                ["İşlem Türü", ISLEM_TURU[talep.islem_turu]],
                ["Emlak Türü", talep.emlak_turu ? EMLAK_TURU[talep.emlak_turu] : "Fark etmez"],
                ["Konum", [talep.ilce, talep.il].filter(Boolean).join(" / ") || "Fark etmez"],
                ["Bütçe", `${talep.min_fiyat ? para(talep.min_fiyat) : "—"} – ${talep.max_fiyat ? para(talep.max_fiyat) : "—"}`],
                ["Oda Sayısı", talep.oda_sayilari?.join(", ") ?? "Fark etmez"],
                ["En Az Alan", talep.min_m2 ? `${talep.min_m2} m²` : "Fark etmez"],
                ["En Fazla Bina Yaşı", talep.max_bina_yasi?.toString() ?? "Fark etmez"],
                [
                  "Şartlar",
                  [
                    talep.asansor_sart && "Asansör",
                    talep.otopark_sart && "Otopark",
                    talep.esyali_sart && "Eşyalı",
                  ]
                    .filter(Boolean)
                    .join(", ") || "Yok",
                ],
              ].map(([etiket, deger]) => (
                <div key={etiket} className="flex justify-between gap-3 border-b border-cizgi pb-2">
                  <dt className="text-metin-ikincil">{etiket}</dt>
                  <dd className="rakam text-right font-medium text-metin">{deger}</dd>
                </div>
              ))}
            </dl>

            {gorusme && (
              <div className="mt-4 rounded-lg border border-marka-100 bg-marka-50 p-3">
                <p className="text-xs font-medium text-marka-700">
                  Bu talep bir AI görüşmesinden doğdu
                </p>
                <p className="mt-0.5 text-xs text-metin-ikincil">
                  {tarihSaat(gorusme.created_at)} tarihli konuşma
                </p>
                <Link
                  href={`/panel/gorusmeler/${gorusme.id}`}
                  className="mt-1.5 inline-block text-sm font-medium text-marka-600 hover:underline"
                >
                  Konuşmanın tamamını oku →
                </Link>
              </div>
            )}

            {talep.notlar && (
              <div className="mt-4 rounded-lg bg-yuzey-alt p-3">
                <p className="text-xs font-medium text-metin-silik">Müşteri notu</p>
                <p className="mt-1 text-sm text-metin">{talep.notlar}</p>
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              <Rozet ton={durumTonu(talep.durum)}>{TALEP_DURUMU[talep.durum]}</Rozet>
              <Rozet ton={talep.bildirim_izni ? "basari" : "notr"}>
                {talep.bildirim_izni ? "Bildirim izni var" : "Bildirim izni yok"}
              </Rozet>
            </div>
          </KartGovde>
        </Kart>

        <div className="lg:col-span-2">
          <Kart>
            <KartBaslik
              baslik="Bu Talebe Uyan İlanlar"
              aciklama={`Portföyde ${uyanlar.length} uygun kayıt bulundu`}
            />
            {uyanlar.length === 0 ? (
              <BosDurum
                baslik="Uygun ilan yok"
                aciklama="Bu kriterlere uyan aktif ilan bulunmuyor. Uygun bir ilan girildiğinde müşteriye otomatik mesaj üretilir."
                eylem={<BagButon href="/panel/emlaklar/yeni">Yeni ilan ekle</BagButon>}
              />
            ) : (
              <ul className="divide-y divide-cizgi">
                {uyanlar.map(({ emlak, skor, gerekceler }) => (
                  <li key={emlak.id} className="flex flex-wrap items-start gap-3 p-4">
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/panel/emlaklar/${emlak.id}`}
                        className="font-medium text-metin hover:text-marka-600"
                      >
                        {emlak.baslik}
                      </Link>
                      <p className="rakam mt-0.5 text-xs text-metin-silik">
                        İlan #{emlak.ilan_no} · {emlak.ilce} · {emlak.oda_sayisi} ·{" "}
                        {emlak.m2_brut} m²
                      </p>
                      <p className="mt-1 text-xs text-metin-ikincil">
                        {gerekceler.join(" · ")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="rakam font-semibold text-metin">
                        {para(emlak.fiyat)}
                      </p>
                      <Rozet ton={skor >= 80 ? "basari" : "uyari"}>
                        %{skor} uyum
                      </Rozet>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Kart>
        </div>
      </div>
    </>
  );
}
