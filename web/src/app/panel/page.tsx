import Link from "next/link";
import type { Metadata } from "next";
import { enCokIlgiGorenler, panelOzeti } from "@/modules/kpi/queries";
import { karsilanamayanTalepler } from "@/modules/arama/queries";
import { isyeriGetir } from "@/modules/isyeri/queries";
import { SayfaBasligi } from "@/components/panel/SayfaBasligi";
import { KpiKarti } from "@/components/panel/KpiKarti";
import { Kart, KartBaslik, KartGovde } from "@/components/ui/Kart";
import { SutunGrafigi } from "@/components/grafik/SutunGrafigi";
import { SERI_RENKLERI } from "@/components/grafik/renkler";
import { BagButon } from "@/components/ui/Buton";
import { Uyari } from "@/components/ui/Uyari";
import { Rozet } from "@/components/ui/Rozet";
import { ISLEM_TURU } from "@/lib/etiketler";
import { para, sayi } from "@/lib/bicim";
import type { KarsilanamayanTalep } from "@/types/database";

export const metadata: Metadata = { title: "Genel Bakış" };

/** Emlakçı KPI panosu. */
export default async function PanelAnaSayfa() {
  const [ozet, ilgiGorenler, eksikler, ofis] = await Promise.all([
    panelOzeti(6),
    enCokIlgiGorenler(5),
    karsilanamayanTalepler(),
    isyeriGetir(),
  ]);

  const eksikListesi = (eksikler as KarsilanamayanTalep[]).slice(0, 4);

  return (
    <>
      <SayfaBasligi
        baslik="Genel Bakış"
        aciklama={
          ofis
            ? `${ofis.unvan} · son 6 aylık performans özeti`
            : "Son 6 aylık performans özeti"
        }
        eylem={<BagButon href="/panel/emlaklar/yeni">Yeni İlan</BagButon>}
      />

      {!ofis && (
        <div className="mb-5">
          <Uyari tur="uyari" baslik="İş yeri tanımı eksik">
            Emlak kaydı oluşturabilmek için önce iş yeri bilgilerini
            tanımlamalısınız.{" "}
            <Link href="/panel/isyeri" className="font-medium underline">
              İş Yeri Tanımı&apos;na git →
            </Link>
          </Uyari>
        </div>
      )}

      {/* KPI kartları */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiKarti
          etiket="Aktif portföy"
          deger={sayi(ozet.aktifPortfoy)}
          dipnot="Sitede yayında olan ilan"
        />
        <KpiKarti
          etiket="Bu ay eklenen ilan"
          deger={sayi(ozet.buAyEklenen)}
          fark={ozet.buAyEklenen - ozet.gecenAyEklenen}
          farkEtiketi="geçen aya göre"
        />
        <KpiKarti
          etiket="Bu ay kiralanan / satılan"
          deger={`${ozet.buAyKiralanan} / ${ozet.buAySatilan}`}
          dipnot="Sözleşme ve satış kayıtları"
        />
        <KpiKarti
          etiket="Bu ay elde edilen gelir"
          deger={para(ozet.buAyGelir)}
          fark={
            ozet.gecenAyGelir === 0 && ozet.buAyGelir === 0
              ? undefined
              : Math.round(ozet.buAyGelir - ozet.gecenAyGelir)
          }
          farkEtiketi="TL, geçen aya göre"
          dipnot="Komisyon geliri"
        />
      </div>

      {/* İkincil göstergeler */}
      <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiKarti
          etiket="Yanıt bekleyen randevu"
          deger={sayi(ozet.bekleyenRandevu)}
          dipnot={<Link href="/panel/randevular" className="hover:text-marka-600">Randevulara git →</Link>}
        />
        <KpiKarti
          etiket="Aktif müşteri talebi"
          deger={sayi(ozet.aktifTalep)}
          dipnot={<Link href="/panel/talepler" className="hover:text-marka-600">Taleplere git →</Link>}
        />
        <KpiKarti
          etiket="Okunmamış AI mesajı"
          deger={sayi(ozet.okunmamisMesaj)}
          dipnot={<Link href="/panel/mesajlar" className="hover:text-marka-600">Mesajlara git →</Link>}
        />
        <KpiKarti
          etiket="Sonuçsuz arama"
          deger={sayi(ozet.karsilanamayanArama)}
          dipnot={<Link href="/panel/talep-analizi" className="hover:text-marka-600">Talep analizine git →</Link>}
        />
      </div>

      {/* Grafikler */}
      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <Kart>
          <KartBaslik
            baslik="Aylık ilan girişi"
            aciklama="Sisteme eklenen ilanların işlem türüne göre dağılımı"
          />
          <KartGovde>
            <SutunGrafigi
              baslik="Aylık ilan girişi — kiralık ve satılık"
              kutukler={ozet.aylar.map((a) => ({
                etiket: a.etiket,
                tamEtiket: a.tamEtiket,
                degerler: { kiralik: a.kiralikIlan, satilik: a.satilikIlan },
              }))}
              seriler={[
                { anahtar: "kiralik", etiket: "Kiralık", renk: SERI_RENKLERI.kiralik },
                { anahtar: "satilik", etiket: "Satılık", renk: SERI_RENKLERI.satilik },
              ]}
              birim="ilan"
            />
          </KartGovde>
        </Kart>

        <Kart>
          <KartBaslik
            baslik="Aylık gerçekleşen işlem"
            aciklama="Tamamlanan kiralama ve satış adetleri"
          />
          <KartGovde>
            <SutunGrafigi
              baslik="Aylık gerçekleşen kiralama ve satış"
              kutukler={ozet.aylar.map((a) => ({
                etiket: a.etiket,
                tamEtiket: a.tamEtiket,
                degerler: { kiralik: a.kiralama, satilik: a.satis },
              }))}
              seriler={[
                { anahtar: "kiralik", etiket: "Kiralama", renk: SERI_RENKLERI.kiralik },
                { anahtar: "satilik", etiket: "Satış", renk: SERI_RENKLERI.satilik },
              ]}
              birim="işlem"
            />
          </KartGovde>
        </Kart>
      </div>

      {/* Alt listeler */}
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Kart>
          <KartBaslik
            baslik="En çok ilgi gören ilanlar"
            aciklama="Görüntülenme ve kaydedilme sayılarına göre"
          />
          <KartGovde className="space-y-3">
            {ilgiGorenler.length === 0 ? (
              <p className="text-sm text-metin-ikincil">Henüz veri yok.</p>
            ) : (
              ilgiGorenler.map((i) => (
                <div
                  key={i.id}
                  className="flex items-start justify-between gap-3 border-b border-cizgi pb-2.5 last:border-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <Link
                      href={`/panel/emlaklar/${i.id}`}
                      className="line-clamp-1 text-sm font-medium text-metin hover:text-marka-600"
                    >
                      {i.baslik}
                    </Link>
                    <p className="rakam text-xs text-metin-silik">
                      İlan #{i.ilan_no} · {para(i.fiyat)}
                    </p>
                  </div>
                  <p className="rakam shrink-0 text-right text-xs text-metin-ikincil">
                    {sayi(i.goruntulenme_sayisi)} görüntülenme
                    <br />
                    <span className="text-metin-silik">
                      {sayi(i.favori_sayisi)} kaydetme
                    </span>
                  </p>
                </div>
              ))
            )}
          </KartGovde>
        </Kart>

        <Kart>
          <KartBaslik
            baslik="Portföyde eksik kalanlar"
            aciklama="En çok aranıp bulunamayan kriterler"
            eylem={
              <BagButon href="/panel/talep-analizi" gorunum="sessiz" boyut="sm">
                Tümü →
              </BagButon>
            }
          />
          <KartGovde className="space-y-3">
            {eksikListesi.length === 0 ? (
              <p className="text-sm text-metin-ikincil">
                Tüm aramalar sonuç döndürdü.
              </p>
            ) : (
              eksikListesi.map((e, i) => (
                <div
                  key={`${e.ilce}-${e.oda_sayisi}-${i}`}
                  className="flex items-center justify-between gap-3 border-b border-cizgi pb-2.5 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="text-sm font-medium text-metin">
                      {e.ilce ?? e.il} · {e.oda_sayisi ?? "Tüm odalar"}
                    </p>
                    <Rozet ton={e.islem_turu === "kiralik" ? "marka" : "vurgu"}>
                      {ISLEM_TURU[e.islem_turu]}
                    </Rozet>
                  </div>
                  <p className="rakam shrink-0 text-right text-xs text-metin-ikincil">
                    <span className="text-base font-semibold text-metin">
                      {e.arama_sayisi}
                    </span>
                    <br />
                    sonuçsuz arama
                  </p>
                </div>
              ))
            )}
          </KartGovde>
        </Kart>
      </div>
    </>
  );
}
