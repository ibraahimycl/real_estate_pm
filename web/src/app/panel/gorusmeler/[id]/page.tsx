import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { gorusmeDetayi } from "@/modules/gorusme/queries";
import { talebeUyanIlanlar } from "@/lib/ai/eslestirme";
import { SayfaBasligi } from "@/components/panel/SayfaBasligi";
import { Kart, KartBaslik, KartGovde } from "@/components/ui/Kart";
import { GorusmeDokumu } from "@/components/gorusme/GorusmeDokumu";
import { Rozet, durumTonu } from "@/components/ui/Rozet";
import { BagButon } from "@/components/ui/Buton";
import { Uyari } from "@/components/ui/Uyari";
import { ISLEM_TURU, TALEP_DURUMU } from "@/lib/etiketler";
import { para, tarihSaat, telefon } from "@/lib/bicim";

export const metadata: Metadata = { title: "Görüşme Dökümü" };

export default async function GorusmeDetaySayfasi({
  params,
}: PageProps<"/panel/gorusmeler/[id]">) {
  const { id } = await params;
  const detay = await gorusmeDetayi(id);
  if (!detay) notFound();

  const { gorusme, mesajlar, talep } = detay;
  const uyanlar = talep ? await talebeUyanIlanlar(talep.id) : [];

  return (
    <>
      <SayfaBasligi
        baslik="Görüşme Dökümü"
        aciklama={`${tarihSaat(gorusme.created_at)} · ${mesajlar.length} mesaj${
          gorusme.arayan_adi ? ` · ${gorusme.arayan_adi}` : ""
        }`}
        eylem={
          <BagButon href="/panel/gorusmeler" gorunum="ikincil">
            Listeye dön
          </BagButon>
        }
      />

      <div className="grid items-start gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Kart>
            <KartBaslik
              baslik="Konuşma"
              aciklama="Müşterinin sohbet ekranında gördüğü hâliyle"
            />
            <KartGovde>
              <GorusmeDokumu mesajlar={mesajlar} />
            </KartGovde>
          </Kart>
        </div>

        <div className="space-y-5">
          <Kart>
            <KartBaslik baslik="Arayan" />
            <KartGovde>
              {gorusme.arayan_adi || gorusme.arayan_telefon ? (
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-metin-ikincil">Ad Soyad</dt>
                    <dd className="font-medium text-metin">
                      {gorusme.arayan_adi ?? "—"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-metin-ikincil">Telefon</dt>
                    <dd className="rakam text-metin">
                      {gorusme.arayan_telefon
                        ? telefon(gorusme.arayan_telefon)
                        : "—"}
                    </dd>
                  </div>
                </dl>
              ) : (
                <p className="text-sm text-metin-ikincil">
                  Müşteri iletişim bilgisi bırakmadı; görüşme kayıt alınmadan
                  sonlandı.
                </p>
              )}
            </KartGovde>
          </Kart>

          {talep ? (
            <Kart>
              <KartBaslik
                baslik="Bu Görüşmeden Doğan Talep"
                eylem={
                  <Rozet ton={durumTonu(talep.durum)}>
                    {TALEP_DURUMU[talep.durum]}
                  </Rozet>
                }
              />
              <KartGovde className="space-y-3">
                <dl className="space-y-1.5 text-sm">
                  {[
                    ["İşlem", ISLEM_TURU[talep.islem_turu]],
                    ["Konum", talep.ilce ?? talep.il ?? "Fark etmez"],
                    [
                      "Bütçe",
                      `${talep.min_fiyat ? para(talep.min_fiyat) : "—"} – ${
                        talep.max_fiyat ? para(talep.max_fiyat) : "—"
                      }`,
                    ],
                    ["Oda", talep.oda_sayilari?.join(", ") ?? "Fark etmez"],
                    [
                      "Bildirim",
                      talep.bildirim_izni ? "İzin verildi" : "İzin yok",
                    ],
                  ].map(([etiket, deger]) => (
                    <div
                      key={etiket}
                      className="flex justify-between gap-3 border-b border-cizgi pb-1.5"
                    >
                      <dt className="text-metin-ikincil">{etiket}</dt>
                      <dd className="rakam text-right text-metin">{deger}</dd>
                    </div>
                  ))}
                </dl>

                <p className="text-xs text-metin-ikincil">
                  Portföyde bu kritere uyan{" "}
                  <strong className="text-metin">{uyanlar.length}</strong> ilan
                  var.
                </p>

                <BagButon
                  href={`/panel/talepler/${talep.id}`}
                  gorunum="ikincil"
                  boyut="sm"
                  className="w-full"
                >
                  Talep detayına git
                </BagButon>
              </KartGovde>
            </Kart>
          ) : (
            <Uyari tur="bilgi" baslik="Talep kaydı yok">
              Müşteri kriterlerinin kaydedilmesine onay vermedi. Yukarıdaki
              konuşmadan ihtiyacını okuyup kendiniz arayabilirsiniz.
            </Uyari>
          )}
        </div>
      </div>
    </>
  );
}
