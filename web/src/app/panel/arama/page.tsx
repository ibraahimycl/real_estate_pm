import Link from "next/link";
import type { Metadata } from "next";
import {
  aramayiLogla,
  ilanlariAra,
  konumSecenekleri,
} from "@/modules/arama/queries";
import { filtreDolu, filtreyiOku } from "@/modules/arama/schema";
import { oturumProfili } from "@/lib/auth";
import { SayfaBasligi } from "@/components/panel/SayfaBasligi";
import { FiltrePaneli } from "@/components/ilan/FiltrePaneli";
import { Kart, KartBaslik, KartGovde } from "@/components/ui/Kart";
import { BosDurum } from "@/components/ui/BosDurum";
import { Sayfalama } from "@/components/ui/Sayfalama";
import { Tablo, TabloSarmal, Td, Th, Tr } from "@/components/ui/Tablo";
import { BagButon } from "@/components/ui/Buton";
import { Uyari } from "@/components/ui/Uyari";
import { EMLAK_TURU, ISLEM_TURU } from "@/lib/etiketler";
import { para } from "@/lib/bicim";

export const metadata: Metadata = { title: "Emlak Arama" };

/**
 * Modül 4 — Emlakçı arama ekranı.
 * Alıcı müşterinin talepleri kriter olarak girilir, uygun kayıtlar
 * sorgulanır ve her kayıt için yazıcı çıktısı alınabilir.
 */
export default async function PanelAramaSayfasi({
  searchParams,
}: PageProps<"/panel/arama">) {
  const sp = await searchParams;
  const filtre = filtreyiOku(sp);
  const aramaYapildi = filtreDolu(filtre);

  const [sonuc, konumlar, profil] = await Promise.all([
    ilanlariAra(filtre),
    konumSecenekleri(),
    oturumProfili(),
  ]);

  if (aramaYapildi) {
    await aramayiLogla(filtre, sonuc.toplam, profil?.id ?? null);
  }

  const sayfaParametreleri: Record<string, string | undefined> = {};
  for (const [anahtar, deger] of Object.entries(sp)) {
    if (anahtar === "sayfa") continue;
    if (typeof deger === "string") sayfaParametreleri[anahtar] = deger;
  }

  return (
    <>
      <SayfaBasligi
        baslik="Emlak Arama"
        aciklama="Alıcı veya kiracı müşterinin taleplerini girin, portföyde uygun kayıt olup olmadığını sorgulayın ve eşleşen ilanın yazıcı çıktısını alın."
      />

      <div className="grid gap-5 lg:grid-cols-[18rem_1fr] items-start">
        <Kart className="p-5 lg:sticky lg:top-6">
          <h2 className="mb-4 font-semibold text-metin">Müşteri Talepleri</h2>
          <FiltrePaneli
            filtre={filtre}
            iller={konumlar.iller}
            ilceler={konumlar.ilceler}
            hedef="/panel/arama"
          />
        </Kart>

        <div className="space-y-4">
          {!aramaYapildi && (
            <Uyari tur="bilgi">
              Soldaki alanlara müşterinin aradığı kriterleri girip
              &quot;Ara&quot; butonuna basın. Aşağıda tüm aktif portföy
              listelenmektedir.
            </Uyari>
          )}

          {aramaYapildi && sonuc.toplam === 0 && (
            <Uyari tur="uyari" baslik="Uygun kayıt bulunamadı">
              Bu kriterlerde portföyde ilan yok. Arama kaydedildi ve{" "}
              <Link href="/panel/talep-analizi" className="font-medium underline">
                Talep Analizi
              </Link>{" "}
              ekranına eksik portföy ihtiyacı olarak düştü. Müşteriyi{" "}
              <Link href="/panel/talepler" className="font-medium underline">
                talep kaydı
              </Link>{" "}
              açarak uygun ilan düştüğünde haberdar edebilirsiniz.
            </Uyari>
          )}

          <Kart>
            <KartBaslik
              baslik="Sorgu Sonucu"
              aciklama={`${sonuc.toplam} uygun kayıt`}
            />

            {sonuc.ilanlar.length === 0 ? (
              <BosDurum
                baslik="Eşleşen ilan yok"
                aciklama="Kriterleri gevşetmeyi deneyin: fiyat aralığını genişletin veya ilçe filtresini kaldırın."
              />
            ) : (
              <>
                <TabloSarmal>
                  <Tablo>
                    <thead>
                      <tr>
                        <Th>İlan No</Th>
                        <Th>Başlık</Th>
                        <Th>Konum</Th>
                        <Th>Nitelik</Th>
                        <Th sagaYasli>Fiyat</Th>
                        <Th sagaYasli>Çıktı</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {sonuc.ilanlar.map((ilan) => (
                        <Tr key={ilan.id}>
                          <Td className="rakam">{ilan.ilan_no}</Td>
                          <Td>
                            <Link
                              href={`/panel/emlaklar/${ilan.id}`}
                              className="font-medium text-metin hover:text-marka-600"
                            >
                              {ilan.baslik}
                            </Link>
                            <p className="text-xs text-metin-silik">
                              {ISLEM_TURU[ilan.islem_turu]} ·{" "}
                              {EMLAK_TURU[ilan.emlak_turu]}
                            </p>
                          </Td>
                          <Td className="whitespace-nowrap text-metin-ikincil">
                            {ilan.ilce}
                          </Td>
                          <Td className="rakam whitespace-nowrap text-metin-ikincil">
                            {ilan.oda_sayisi} · {ilan.m2_brut} m²
                          </Td>
                          <Td sagaYasli className="rakam font-medium whitespace-nowrap">
                            {para(ilan.fiyat)}
                          </Td>
                          <Td sagaYasli>
                            <BagButon
                              href={`/panel/emlaklar/${ilan.id}/cikti`}
                              gorunum="ikincil"
                              boyut="sm"
                            >
                              Yazdır
                            </BagButon>
                          </Td>
                        </Tr>
                      ))}
                    </tbody>
                  </Tablo>
                </TabloSarmal>
                <Sayfalama
                  sayfa={sonuc.sayfa}
                  sayfaSayisi={sonuc.sayfaSayisi}
                  temelYol="/panel/arama"
                  parametreler={sayfaParametreleri}
                />
              </>
            )}
          </Kart>

          <KartGovde className="px-0">
            <p className="text-xs text-metin-silik">
              Her arama kaydedilir. Sonuç dönmeyen aramalar, portföyde eksik
              olan kriterleri göstermek üzere Talep Analizi ekranında toplanır.
            </p>
          </KartGovde>
        </div>
      </div>
    </>
  );
}
