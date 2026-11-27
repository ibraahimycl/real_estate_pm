import Link from "next/link";
import type { Metadata } from "next";
import { gorusmeleriListele } from "@/modules/gorusme/queries";
import { SayfaBasligi } from "@/components/panel/SayfaBasligi";
import { Kart } from "@/components/ui/Kart";
import { Rozet } from "@/components/ui/Rozet";
import { BosDurum } from "@/components/ui/BosDurum";
import { BagButon } from "@/components/ui/Buton";
import { Tablo, TabloSarmal, Td, Th, Tr } from "@/components/ui/Tablo";
import { ISLEM_TURU } from "@/lib/etiketler";
import { gorece, tarihSaat, telefon } from "@/lib/bicim";

export const metadata: Metadata = { title: "AI Görüşmeleri" };

/**
 * AI danışmanla yapılan tüm görüşmelerin kaydı.
 * "İki hafta önce bu müşteriyle şöyle konuşmuştuk" bilgisinin kaynağıdır.
 */
export default async function GorusmelerSayfasi() {
  const gorusmeler = await gorusmeleriListele();
  const talebeDonusen = gorusmeler.filter((g) => g.talep_id).length;

  return (
    <>
      <SayfaBasligi
        baslik="AI Görüşmeleri"
        aciklama="Müşterilerin AI danışmanla yaptığı konuşmaların tam kaydı. Hangi görüşmenin talebe dönüştüğü de burada görünür."
      />

      <Kart>
        {gorusmeler.length === 0 ? (
          <BosDurum
            baslik="Henüz görüşme yok"
            aciklama="Bir ziyaretçi AI danışman sayfasında konuşma başlattığında kayıt burada belirir."
            eylem={
              <BagButon href="/ai-danisman" gorunum="ikincil">
                AI danışmanı gör
              </BagButon>
            }
          />
        ) : (
          <TabloSarmal>
            <Tablo>
              <thead>
                <tr>
                  <Th>Tarih</Th>
                  <Th>Arayan</Th>
                  <Th>İlk sorusu</Th>
                  <Th>Mesaj</Th>
                  <Th>Sonuç</Th>
                  <Th sagaYasli>Döküm</Th>
                </tr>
              </thead>
              <tbody>
                {gorusmeler.map((g) => (
                  <Tr key={g.id}>
                    <Td className="whitespace-nowrap">
                      <p className="text-sm">{tarihSaat(g.created_at)}</p>
                      <p className="text-xs text-metin-silik">
                        {gorece(g.son_zaman)}
                      </p>
                    </Td>
                    <Td>
                      {g.arayan_adi ? (
                        <>
                          <p className="text-sm font-medium text-metin">
                            {g.arayan_adi}
                          </p>
                          {g.arayan_telefon && (
                            <a
                              href={`tel:${g.arayan_telefon}`}
                              className="rakam text-xs text-marka-600 hover:underline"
                            >
                              {telefon(g.arayan_telefon)}
                            </a>
                          )}
                        </>
                      ) : (
                        <span className="text-sm text-metin-silik">
                          İsim vermedi
                        </span>
                      )}
                    </Td>
                    <Td className="max-w-72">
                      <p className="line-clamp-2 text-sm text-metin-ikincil">
                        {g.ilk_soru ?? "—"}
                      </p>
                    </Td>
                    <Td className="rakam text-center">{g.mesaj_sayisi}</Td>
                    <Td>
                      {g.talep ? (
                        <>
                          <Rozet ton="basari">Talebe dönüştü</Rozet>
                          <p className="mt-1 text-xs text-metin-silik">
                            {ISLEM_TURU[g.talep.islem_turu]}
                            {g.talep.ilce && ` · ${g.talep.ilce}`}
                          </p>
                        </>
                      ) : (
                        <Rozet>Kayıt alınmadı</Rozet>
                      )}
                    </Td>
                    <Td sagaYasli>
                      <Link
                        href={`/panel/gorusmeler/${g.id}`}
                        className="text-sm text-marka-600 hover:underline"
                      >
                        Oku →
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
        Toplam {gorusmeler.length} görüşme · {talebeDonusen} tanesi kayıtlı
        talebe dönüştü.
      </p>
    </>
  );
}
