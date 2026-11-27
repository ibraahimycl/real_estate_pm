import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { sozlesmeGetir } from "@/modules/sozlesme/queries";
import { oturumProfili, emlakciMi } from "@/lib/auth";
import { SayfaBasligi } from "@/components/panel/SayfaBasligi";
import { Kart, KartBaslik, KartGovde } from "@/components/ui/Kart";
import { Rozet, durumTonu } from "@/components/ui/Rozet";
import { Uyari } from "@/components/ui/Uyari";
import { BagButon } from "@/components/ui/Buton";
import { OnayButonu } from "@/components/sozlesme/OnayButonu";
import { SOZLESME_DURUMU } from "@/lib/etiketler";
import { para, tarih, tarihSaat, telefon } from "@/lib/bicim";

export const metadata: Metadata = { title: "Sözleşme Detayı" };

export default async function SozlesmeDetaySayfasi({
  params,
  searchParams,
}: PageProps<"/panel/sozlesmeler/[id]">) {
  const { id } = await params;
  const sp = await searchParams;

  const [sozlesme, profil] = await Promise.all([
    sozlesmeGetir(id),
    oturumProfili(),
  ]);
  if (!sozlesme) notFound();

  const imzalandi = sozlesme.durum === "imzalandi";
  const danismanOnayli = Boolean(sozlesme.emlakci_onay_at);
  const musteriOnayli = Boolean(sozlesme.musteri_onay_at);

  return (
    <>
      <SayfaBasligi
        baslik="Kira Sözleşmesi"
        aciklama={sozlesme.emlak?.baslik ?? ""}
        eylem={
          <>
            <BagButon href="/panel/sozlesmeler" gorunum="ikincil">
              Listeye dön
            </BagButon>
            {imzalandi && (
              <BagButon href={`/panel/sozlesmeler/${sozlesme.id}/cikti`}>
                Sözleşme çıktısı
              </BagButon>
            )}
          </>
        }
      />

      {sp.kayit === "eklendi" && (
        <div className="mb-5">
          <Uyari tur="basari" baslik="Sözleşme taslağı oluşturuldu.">
            Çıktı alabilmek için hem danışman hem müşteri onayı gerekiyor.
          </Uyari>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-3 items-start">
        <div className="space-y-5 lg:col-span-2">
          <Kart>
            <KartBaslik baslik="Sözleşme Bilgileri" />
            <KartGovde>
              <dl className="grid gap-x-8 sm:grid-cols-2">
                {[
                  ["Konut", sozlesme.emlak?.baslik ?? "—"],
                  ["İlan No", sozlesme.emlak?.ilan_no?.toString() ?? "—"],
                  [
                    "Adres",
                    [sozlesme.emlak?.adres, sozlesme.emlak?.ilce, sozlesme.emlak?.il]
                      .filter(Boolean)
                      .join(", ") || "—",
                  ],
                  ["Nitelik", `${sozlesme.emlak?.oda_sayisi ?? "—"} · ${sozlesme.emlak?.m2_brut ?? "—"} m²`],
                  ["Başlangıç", tarih(sozlesme.baslangic_tarihi)],
                  ["Bitiş", tarih(sozlesme.bitis_tarihi)],
                  ["Aylık Kira", para(sozlesme.kira_bedeli)],
                  ["Depozito", para(sozlesme.depozito)],
                ].map(([etiket, deger]) => (
                  <div
                    key={etiket}
                    className="flex justify-between gap-3 border-b border-cizgi py-2 text-sm"
                  >
                    <dt className="text-metin-ikincil">{etiket}</dt>
                    <dd className="rakam text-right font-medium text-metin">
                      {deger}
                    </dd>
                  </div>
                ))}
              </dl>

              {sozlesme.ozel_sartlar && (
                <div className="mt-4 rounded-lg bg-yuzey-alt p-3">
                  <p className="text-xs font-medium text-metin-silik">
                    Özel Şartlar
                  </p>
                  <p className="mt-1 whitespace-pre-line text-sm text-metin">
                    {sozlesme.ozel_sartlar}
                  </p>
                </div>
              )}
            </KartGovde>
          </Kart>

          <Kart>
            <KartBaslik baslik="Taraflar" />
            <KartGovde className="grid gap-5 sm:grid-cols-2">
              {[
                { baslik: "Kiraya Veren (Ev Sahibi)", kisi: sozlesme.ev_sahibi },
                { baslik: "Kiracı", kisi: sozlesme.kiraci },
              ].map(({ baslik, kisi }) => (
                <div key={baslik}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-metin-silik">
                    {baslik}
                  </p>
                  <p className="mt-1.5 font-medium text-metin">
                    {kisi ? `${kisi.ad} ${kisi.soyad}` : "—"}
                  </p>
                  <p className="rakam text-sm text-metin-ikincil">
                    TCKN: {kisi?.tckn ?? "—"}
                  </p>
                  <p className="rakam text-sm text-metin-ikincil">
                    {kisi ? telefon(kisi.cep_telefon) : "—"}
                  </p>
                </div>
              ))}
            </KartGovde>
          </Kart>
        </div>

        <div className="space-y-5">
          <Kart>
            <KartBaslik baslik="Onay Durumu" />
            <KartGovde className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-metin-ikincil">Genel durum</span>
                <Rozet ton={durumTonu(sozlesme.durum)}>
                  {SOZLESME_DURUMU[sozlesme.durum]}
                </Rozet>
              </div>

              <ul className="space-y-2.5 text-sm">
                <li className="flex items-start justify-between gap-2">
                  <span className="text-metin-ikincil">Danışman onayı</span>
                  <span className="text-right">
                    {danismanOnayli ? (
                      <>
                        <span className="text-basari-600">✓ Onaylandı</span>
                        <br />
                        <span className="text-xs text-metin-silik">
                          {tarihSaat(sozlesme.emlakci_onay_at)}
                        </span>
                      </>
                    ) : (
                      <span className="text-metin-silik">Bekliyor</span>
                    )}
                  </span>
                </li>
                <li className="flex items-start justify-between gap-2">
                  <span className="text-metin-ikincil">Müşteri onayı</span>
                  <span className="text-right">
                    {musteriOnayli ? (
                      <>
                        <span className="text-basari-600">✓ Onaylandı</span>
                        <br />
                        <span className="text-xs text-metin-silik">
                          {tarihSaat(sozlesme.musteri_onay_at)}
                        </span>
                      </>
                    ) : (
                      <span className="text-metin-silik">Bekliyor</span>
                    )}
                  </span>
                </li>
              </ul>

              {sozlesme.durum !== "iptal" && !imzalandi && (
                <OnayButonu
                  id={sozlesme.id}
                  etiket={
                    emlakciMi(profil)
                      ? "Danışman olarak onayla"
                      : "Sözleşmeyi onayla"
                  }
                  devredisi={emlakciMi(profil) ? danismanOnayli : musteriOnayli}
                />
              )}

              {imzalandi && (
                <Uyari tur="basari">
                  Sözleşme imzalandı. İlan &quot;Kiralandı&quot; durumuna
                  alındı ve gelir kaydı oluşturuldu.
                </Uyari>
              )}

              {!imzalandi && !musteriOnayli && (
                <p className="text-xs text-metin-silik">
                  Müşteri, kendi hesabındaki &quot;Sözleşmelerim&quot;
                  ekranından onay verebilir.
                </p>
              )}
            </KartGovde>
          </Kart>
        </div>
      </div>
    </>
  );
}
