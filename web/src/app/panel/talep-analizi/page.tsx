import type { Metadata } from "next";
import { karsilanamayanTalepler } from "@/modules/arama/queries";
import { SayfaBasligi } from "@/components/panel/SayfaBasligi";
import { Kart } from "@/components/ui/Kart";
import { BosDurum } from "@/components/ui/BosDurum";
import { Tablo, TabloSarmal, Td, Th, Tr } from "@/components/ui/Tablo";
import { BagButon } from "@/components/ui/Buton";
import { Rozet } from "@/components/ui/Rozet";
import { ISLEM_TURU } from "@/lib/etiketler";
import { gorece } from "@/lib/bicim";
import type { KarsilanamayanTalep } from "@/types/database";

export const metadata: Metadata = { title: "Talep Analizi" };

/**
 * Karşılanamayan Talep Analizi.
 *
 * Ziyaretçiler filtreleyip sonuç bulamadığında arama kriterleri
 * arama_loglari tablosuna yazılır. Bu ekran, sonuç dönmeyen aramaları
 * ilçe + oda sayısı + işlem türü kırılımında gruplar; böylece portföyde
 * hangi tip ilanın eksik olduğu ölçülebilir hale gelir.
 */
export default async function TalepAnaliziSayfasi() {
  const satirlar = (await karsilanamayanTalepler()) as KarsilanamayanTalep[];
  const enYuksek = satirlar[0]?.arama_sayisi ?? 0;

  return (
    <>
      <SayfaBasligi
        baslik="Talep Analizi"
        aciklama="Müşterilerin aradığı ama portföyümüzde karşılığı olmayan kriterler. Hangi bölgede hangi tip ilana ihtiyaç olduğunu gösterir."
      />

      <Kart>
        {satirlar.length === 0 ? (
          <BosDurum
            baslik="Karşılanamayan talep yok"
            aciklama="Şu ana kadar yapılan tüm aramalar en az bir sonuç döndürdü. Ziyaretçiler arama yaptıkça bu ekran dolar."
            eylem={<BagButon href="/panel/arama">Arama ekranına git</BagButon>}
          />
        ) : (
          <TabloSarmal>
            <Tablo>
              <thead>
                <tr>
                  <Th>İşlem</Th>
                  <Th>Konum</Th>
                  <Th>Oda Sayısı</Th>
                  <Th>Sonuçsuz Arama</Th>
                  <Th>Son Arama</Th>
                  <Th sagaYasli>Eylem</Th>
                </tr>
              </thead>
              <tbody>
                {satirlar.map((s, i) => (
                  <Tr key={`${s.islem_turu}-${s.ilce}-${s.oda_sayisi}-${i}`}>
                    <Td>
                      <Rozet
                        ton={s.islem_turu === "kiralik" ? "marka" : "vurgu"}
                      >
                        {ISLEM_TURU[s.islem_turu]}
                      </Rozet>
                    </Td>
                    <Td className="font-medium">
                      {s.ilce ?? "—"}
                      <span className="text-metin-silik"> / {s.il}</span>
                    </Td>
                    <Td className="rakam">{s.oda_sayisi ?? "Fark etmez"}</Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <span className="rakam w-8 font-semibold text-metin">
                          {s.arama_sayisi}
                        </span>
                        <span
                          className="h-2 rounded-full bg-vurgu-500"
                          style={{
                            width: `${Math.max(
                              8,
                              (s.arama_sayisi / Math.max(enYuksek, 1)) * 140,
                            )}px`,
                          }}
                          aria-hidden
                        />
                      </div>
                    </Td>
                    <Td className="whitespace-nowrap text-metin-ikincil">
                      {gorece(s.son_arama)}
                    </Td>
                    <Td sagaYasli>
                      <BagButon
                        href={`/panel/arama?islem=${s.islem_turu}&il=${encodeURIComponent(
                          s.il,
                        )}${s.ilce ? `&ilce=${encodeURIComponent(s.ilce)}` : ""}${
                          s.oda_sayisi ? `&oda=${encodeURIComponent(s.oda_sayisi)}` : ""
                        }`}
                        gorunum="ikincil"
                        boyut="sm"
                      >
                        Sorgula
                      </BagButon>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Tablo>
          </TabloSarmal>
        )}
      </Kart>

      <p className="mt-3 text-xs text-metin-silik">
        Veri kaynağı: sonuç sayısı sıfır olan arama kayıtları
        (<code>arama_loglari</code>), <code>karsilanamayan_talepler</code>{" "}
        görünümüyle gruplanır.
      </p>
    </>
  );
}
