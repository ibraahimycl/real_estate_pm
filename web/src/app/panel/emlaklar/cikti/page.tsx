import type { Metadata } from "next";
import { portfoyTumunuListele } from "@/modules/emlak/queries";
import { isyeriGetir } from "@/modules/isyeri/queries";
import { YazdirButonu } from "@/components/YazdirButonu";
import { BagButon } from "@/components/ui/Buton";
import { EMLAK_DURUMU, EMLAK_TURU, ISLEM_TURU } from "@/lib/etiketler";
import { para, tarih, telefon } from "@/lib/bicim";
import type { EmlakDurumu, IslemTuru } from "@/types/database";

export const metadata: Metadata = { title: "Portföy Listesi Çıktısı" };

export default async function PortfoyCiktiSayfasi({
  searchParams,
}: PageProps<"/panel/emlaklar/cikti">) {
  const sp = await searchParams;
  const arama = typeof sp.arama === "string" ? sp.arama : undefined;
  const durum =
    typeof sp.durum === "string" ? (sp.durum as EmlakDurumu) : undefined;
  const islemTuru =
    typeof sp.islem === "string" ? (sp.islem as IslemTuru) : undefined;

  const [kayitlar, ofis] = await Promise.all([
    portfoyTumunuListele({ arama, durum, islemTuru }),
    isyeriGetir(),
  ]);

  const params = new URLSearchParams();
  if (arama) params.set("arama", arama);
  if (durum) params.set("durum", durum);
  if (islemTuru) params.set("islem", islemTuru);
  const donusYolu = params.toString()
    ? `/panel/emlaklar?${params.toString()}`
    : "/panel/emlaklar";

  const kriterler = [
    arama && `Arama: "${arama}"`,
    islemTuru && `İşlem: ${ISLEM_TURU[islemTuru]}`,
    durum && `Durum: ${EMLAK_DURUMU[durum]}`,
  ].filter(Boolean) as string[];

  return (
    <div className="max-w-5xl">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 yazdirma-gizle">
        <BagButon href={donusYolu} gorunum="ikincil">
          ← Portföye dön
        </BagButon>
        <YazdirButonu etiket="Yazdır / PDF olarak kaydet" />
      </div>

      <article className="yazdirma-sayfa rounded-kart border border-cizgi bg-yuzey p-6 sm:p-8">
        <header className="flex items-start justify-between gap-6 border-b-2 border-metin pb-4">
          <div>
            <h1 className="text-lg font-bold text-metin">
              {ofis?.unvan ?? "Emlak İşletmesi"}
            </h1>
            {ofis && (
              <p className="mt-1 text-xs leading-relaxed text-metin-ikincil">
                {ofis.adres}, {ofis.ilce}/{ofis.il}
                <br />
                Tel: {telefon(ofis.telefon)} · {ofis.eposta}
              </p>
            )}
          </div>
          <div className="shrink-0 text-right">
            <p className="text-sm font-semibold text-metin">
              Portföy Kayıt Listesi
            </p>
            <p className="mt-0.5 text-xs text-metin-silik rakam">
              Toplam {kayitlar.length} kayıt
            </p>
            <p className="mt-0.5 text-xs text-metin-silik">
              Çıktı: {tarih(new Date().toISOString())}
            </p>
          </div>
        </header>

        <div className="mt-4 rounded-lg bg-yuzey-alt px-4 py-2.5 text-xs text-metin-ikincil">
          <span className="font-semibold text-metin">Filtreler: </span>
          {kriterler.length > 0
            ? kriterler.join(" · ")
            : "Filtre uygulanmadı (tüm portföy)"}
        </div>

        {kayitlar.length === 0 ? (
          <p className="py-10 text-center text-sm text-metin-ikincil">
            Bu kriterlere uygun emlak kaydı bulunmamaktadır.
          </p>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b-2 border-cizgi-koyu text-metin">
                  <th className="py-2 pr-3 font-semibold">No</th>
                  <th className="py-2 pr-3 font-semibold">Başlık / Tür</th>
                  <th className="py-2 pr-3 font-semibold">Konum</th>
                  <th className="py-2 pr-3 font-semibold">Sahibi</th>
                  <th className="py-2 pr-3 font-semibold">Nitelik</th>
                  <th className="py-2 pr-3 text-right font-semibold">Fiyat</th>
                  <th className="py-2 font-semibold">Durum</th>
                </tr>
              </thead>
              <tbody>
                {kayitlar.map((e) => (
                  <tr key={e.id} className="border-b border-cizgi align-top">
                    <td className="py-2.5 pr-3 rakam font-medium text-metin">
                      {e.ilan_no}
                    </td>
                    <td className="py-2.5 pr-3">
                      <p className="font-medium text-metin">{e.baslik}</p>
                      <p className="text-[11px] text-metin-silik">
                        {ISLEM_TURU[e.islem_turu]} · {EMLAK_TURU[e.emlak_turu]}
                      </p>
                    </td>
                    <td className="py-2.5 pr-3 text-metin-ikincil">
                      {e.il} / {e.ilce}
                    </td>
                    <td className="py-2.5 pr-3 text-metin-ikincil">
                      {e.sahip ? (
                        <>
                          <span>
                            {e.sahip.ad} {e.sahip.soyad}
                          </span>
                          <span className="block text-[11px] text-metin-silik rakam">
                            {telefon(e.sahip.cep_telefon)}
                          </span>
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-2.5 pr-3 whitespace-nowrap rakam text-metin-ikincil">
                      {e.oda_sayisi} · {e.m2_brut} m²
                    </td>
                    <td className="py-2.5 pr-3 text-right whitespace-nowrap rakam font-semibold text-metin">
                      {para(e.fiyat)}
                    </td>
                    <td className="py-2.5 whitespace-nowrap text-metin-ikincil">
                      {EMLAK_DURUMU[e.durum]}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <footer className="mt-6 border-t border-cizgi pt-3 text-[11px] text-metin-silik">
          Bu belge {ofis?.unvan ?? "emlak işletmesi"} ofis içi portföy çıktısıdır.
        </footer>
      </article>
    </div>
  );
}
