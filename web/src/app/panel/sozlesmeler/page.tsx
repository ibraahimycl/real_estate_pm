import Link from "next/link";
import type { Metadata } from "next";
import { sozlesmeleriListele } from "@/modules/sozlesme/queries";
import { SayfaBasligi } from "@/components/panel/SayfaBasligi";
import { Kart } from "@/components/ui/Kart";
import { Rozet, durumTonu } from "@/components/ui/Rozet";
import { BosDurum } from "@/components/ui/BosDurum";
import { BagButon } from "@/components/ui/Buton";
import { Tablo, TabloSarmal, Td, Th, Tr } from "@/components/ui/Tablo";
import { SOZLESME_DURUMU } from "@/lib/etiketler";
import { para, tarih } from "@/lib/bicim";

export const metadata: Metadata = { title: "Sözleşmeler" };

export default async function SozlesmelerSayfasi() {
  const sozlesmeler = await sozlesmeleriListele();

  return (
    <>
      <SayfaBasligi
        baslik="Kira Sözleşmeleri"
        aciklama="Çift taraflı onay tamamlandığında sözleşme imzalanır ve yazdırılabilir çıktısı üretilir."
        eylem={<BagButon href="/panel/sozlesmeler/yeni">Yeni Sözleşme</BagButon>}
      />

      <Kart>
        {sozlesmeler.length === 0 ? (
          <BosDurum
            baslik="Sözleşme kaydı yok"
            aciklama="Kiralama anlaşması sağlandığında buradan sözleşme taslağı oluşturabilirsiniz."
            eylem={<BagButon href="/panel/sozlesmeler/yeni">Yeni Sözleşme</BagButon>}
          />
        ) : (
          <TabloSarmal>
            <Tablo>
              <thead>
                <tr>
                  <Th>Konut</Th>
                  <Th>Kiracı</Th>
                  <Th>Ev Sahibi</Th>
                  <Th>Dönem</Th>
                  <Th sagaYasli>Kira</Th>
                  <Th>Durum</Th>
                  <Th sagaYasli>İşlem</Th>
                </tr>
              </thead>
              <tbody>
                {sozlesmeler.map((s) => (
                  <Tr key={s.id}>
                    <Td>
                      <p className="font-medium text-metin line-clamp-1">
                        {s.emlak?.baslik ?? "—"}
                      </p>
                      <p className="rakam text-xs text-metin-silik">
                        İlan #{s.emlak?.ilan_no ?? "—"}
                      </p>
                    </Td>
                    <Td>{s.kiraci ? `${s.kiraci.ad} ${s.kiraci.soyad}` : "—"}</Td>
                    <Td>
                      {s.ev_sahibi
                        ? `${s.ev_sahibi.ad} ${s.ev_sahibi.soyad}`
                        : "—"}
                    </Td>
                    <Td className="rakam whitespace-nowrap text-xs text-metin-ikincil">
                      {tarih(s.baslangic_tarihi)}
                      <br />
                      {tarih(s.bitis_tarihi)}
                    </Td>
                    <Td sagaYasli className="rakam font-medium whitespace-nowrap">
                      {para(s.kira_bedeli)}
                    </Td>
                    <Td>
                      <Rozet ton={durumTonu(s.durum)}>
                        {SOZLESME_DURUMU[s.durum]}
                      </Rozet>
                    </Td>
                    <Td sagaYasli>
                      <Link
                        href={`/panel/sozlesmeler/${s.id}`}
                        className="text-sm text-marka-600 hover:underline"
                      >
                        Detay →
                      </Link>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Tablo>
          </TabloSarmal>
        )}
      </Kart>
    </>
  );
}
