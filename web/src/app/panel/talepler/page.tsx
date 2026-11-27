import Link from "next/link";
import type { Metadata } from "next";
import { taplepleriListele } from "@/modules/talep/queries";
import { SayfaBasligi } from "@/components/panel/SayfaBasligi";
import { Kart } from "@/components/ui/Kart";
import { Rozet, durumTonu } from "@/components/ui/Rozet";
import { BosDurum } from "@/components/ui/BosDurum";
import { Uyari } from "@/components/ui/Uyari";
import { BagButon } from "@/components/ui/Buton";
import { Tablo, TabloSarmal, Td, Th, Tr } from "@/components/ui/Tablo";
import { DurumFormu } from "./DurumFormu";
import { ISLEM_TURU, TALEP_DURUMU, TALEP_KAYNAGI } from "@/lib/etiketler";
import { gorece, para, telefon } from "@/lib/bicim";

export const metadata: Metadata = { title: "Müşteri Talepleri" };

/** Alıcı/kiracı müşterilerin kayıtlı arama kriterleri. */
export default async function TaleplerSayfasi({
  searchParams,
}: PageProps<"/panel/talepler">) {
  const sp = await searchParams;
  const durum = typeof sp.durum === "string" ? sp.durum : undefined;
  const talepler = await taplepleriListele(durum);

  return (
    <>
      <SayfaBasligi
        baslik="Müşteri Talepleri"
        aciklama="Müşterilerin aradığı kriterler. Yeni bir ilan girildiğinde bu talepler otomatik taranır ve izinli olanlara mesaj gönderilir."
        eylem={
          <>
            <BagButon
              href="/panel/talepler"
              gorunum={durum ? "ikincil" : "birincil"}
              boyut="sm"
            >
              Tümü
            </BagButon>
            <BagButon
              href="/panel/talepler?durum=aktif"
              gorunum={durum === "aktif" ? "birincil" : "ikincil"}
              boyut="sm"
            >
              Aktif
            </BagButon>
          </>
        }
      />

      {sp.kayit === "eklendi" && (
        <div className="mb-5">
          <Uyari tur="basari">Talep kaydedildi.</Uyari>
        </div>
      )}

      <Kart>
        {talepler.length === 0 ? (
          <BosDurum
            baslik="Kayıtlı talep yok"
            aciklama="Müşteriler site üzerinden veya AI danışman görüşmesinden talep bıraktıkça burada listelenir."
          />
        ) : (
          <TabloSarmal>
            <Tablo>
              <thead>
                <tr>
                  <Th>Müşteri</Th>
                  <Th>Aradığı</Th>
                  <Th sagaYasli>Bütçe</Th>
                  <Th>Bildirim</Th>
                  <Th>Kaynak</Th>
                  <Th>Durum</Th>
                  <Th sagaYasli>Eşleşme</Th>
                </tr>
              </thead>
              <tbody>
                {talepler.map((t) => (
                  <Tr key={t.id}>
                    <Td>
                      <p className="font-medium text-metin">{t.ad_soyad}</p>
                      <p className="rakam text-xs text-metin-silik">
                        {telefon(t.telefon)}
                      </p>
                    </Td>
                    <Td className="text-metin-ikincil">
                      {ISLEM_TURU[t.islem_turu]}
                      {t.ilce && ` · ${t.ilce}`}
                      {t.oda_sayilari?.length && ` · ${t.oda_sayilari.join("/")}`}
                      {t.min_m2 && ` · ${t.min_m2}+ m²`}
                      {(t.asansor_sart || t.otopark_sart || t.esyali_sart) && (
                        <p className="text-xs text-metin-silik">
                          {[
                            t.asansor_sart && "asansör",
                            t.otopark_sart && "otopark",
                            t.esyali_sart && "eşyalı",
                          ]
                            .filter(Boolean)
                            .join(", ")}{" "}
                          şartı
                        </p>
                      )}
                    </Td>
                    <Td sagaYasli className="rakam whitespace-nowrap">
                      {t.max_fiyat ? para(t.max_fiyat) : "—"}
                      <p className="text-xs font-normal text-metin-silik">
                        üst sınır
                      </p>
                    </Td>
                    <Td>
                      {t.bildirim_izni ? (
                        <Rozet ton="basari">İzinli</Rozet>
                      ) : (
                        <Rozet>İzin yok</Rozet>
                      )}
                    </Td>
                    <Td className="text-xs text-metin-ikincil">
                      {TALEP_KAYNAGI[t.kaynak]}
                      <p className="text-metin-silik">{gorece(t.created_at)}</p>
                    </Td>
                    <Td>
                      <div className="space-y-1.5">
                        <Rozet ton={durumTonu(t.durum)}>
                          {TALEP_DURUMU[t.durum]}
                        </Rozet>
                        <DurumFormu id={t.id} durum={t.durum} />
                      </div>
                    </Td>
                    <Td sagaYasli>
                      <Link
                        href={`/panel/talepler/${t.id}`}
                        className="text-sm text-marka-600 hover:underline"
                      >
                        Uyan ilanlar →
                      </Link>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Tablo>
          </TabloSarmal>
        )}
      </Kart>

      <p className="mt-3 text-xs text-metin-silik">
        Toplam {talepler.length} talep. &quot;İzin yok&quot; işaretli
        müşterilere otomatik mesaj gönderilmez (KVKK açık rıza); eşleşme yine
        de ilan ekranında görünür.
      </p>
    </>
  );
}
