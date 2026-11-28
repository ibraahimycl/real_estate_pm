import { YazdirButonu } from "@/components/YazdirButonu";
import { BagButon } from "@/components/ui/Buton";
import { EMLAK_TURU, ISINMA_TURU, ISLEM_TURU } from "@/lib/etiketler";
import { kat, para, tarih, telefon } from "@/lib/bicim";
import type { AramaFiltresi } from "@/modules/arama/schema";
import type { IlanPublic, Ofis } from "@/types/database";

function filtreOzeti(filtre: AramaFiltresi): string[] {
  const ozet: string[] = [];
  if (filtre.islem_turu) ozet.push(`İşlem: ${ISLEM_TURU[filtre.islem_turu]}`);
  if (filtre.emlak_turu) ozet.push(`Tür: ${EMLAK_TURU[filtre.emlak_turu]}`);
  if (filtre.il) ozet.push(`İl: ${filtre.il}`);
  if (filtre.ilce) ozet.push(`İlçe: ${filtre.ilce}`);
  if (filtre.min_fiyat !== undefined || filtre.max_fiyat !== undefined) {
    ozet.push(
      `Fiyat: ${filtre.min_fiyat !== undefined ? para(filtre.min_fiyat) : "—"} – ${filtre.max_fiyat !== undefined ? para(filtre.max_fiyat) : "—"}`,
    );
  }
  if (filtre.min_m2 !== undefined) ozet.push(`Min Alan: ${filtre.min_m2} m²`);
  if (filtre.oda_sayilari?.length) {
    ozet.push(`Oda: ${filtre.oda_sayilari.join(", ")}`);
  }
  if (filtre.max_bina_yasi !== undefined) {
    ozet.push(`Maks. Bina Yaşı: ${filtre.max_bina_yasi}`);
  }
  if (filtre.asansor) ozet.push("Asansörlü");
  if (filtre.otopark) ozet.push("Otoparklı");
  if (filtre.esyali) ozet.push("Eşyalı");
  if (filtre.site_icinde) ozet.push("Site içinde");
  if (filtre.krediye_uygun) ozet.push("Krediye uygun");
  return ozet;
}

export function ListeCiktiBelgesi({
  ilanlar,
  filtre,
  ofis,
  donusYolu,
  donusEtiketi = "← Listeye dön",
  baslik = "İlan Listesi Çıktısı",
}: {
  ilanlar: IlanPublic[];
  filtre: AramaFiltresi;
  ofis: Ofis | null;
  donusYolu: string;
  donusEtiketi?: string;
  baslik?: string;
}) {
  const kriterler = filtreOzeti(filtre);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 yazdirma-gizle">
        <BagButon href={donusYolu} gorunum="ikincil">
          {donusEtiketi}
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
            <p className="text-sm font-semibold text-metin">{baslik}</p>
            <p className="mt-0.5 text-xs text-metin-silik rakam">
              Toplam {ilanlar.length} kayıt
            </p>
            <p className="mt-0.5 text-xs text-metin-silik">
              Çıktı: {tarih(new Date().toISOString())}
            </p>
          </div>
        </header>

        <div className="mt-4 rounded-lg bg-yuzey-alt px-4 py-2.5 text-xs text-metin-ikincil">
          <span className="font-semibold text-metin">Uygulanan Kriterler: </span>
          {kriterler.length > 0
            ? kriterler.join(" · ")
            : "Filtre uygulanmadı (tüm aktif ilanlar)"}
        </div>

        {ilanlar.length === 0 ? (
          <p className="py-10 text-center text-sm text-metin-ikincil">
            Bu kriterlere uygun ilan kaydı bulunmamaktadır.
          </p>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b-2 border-cizgi-koyu text-metin">
                  <th className="py-2 pr-3 font-semibold">No</th>
                  <th className="py-2 pr-3 font-semibold">Başlık / Tür</th>
                  <th className="py-2 pr-3 font-semibold">Konum</th>
                  <th className="py-2 pr-3 font-semibold">Oda / Alan</th>
                  <th className="py-2 pr-3 font-semibold">Kat / Isıtma</th>
                  <th className="py-2 text-right font-semibold">Fiyat</th>
                </tr>
              </thead>
              <tbody>
                {ilanlar.map((ilan) => (
                  <tr key={ilan.id} className="border-b border-cizgi align-top">
                    <td className="py-2.5 pr-3 rakam font-medium text-metin">
                      {ilan.ilan_no}
                    </td>
                    <td className="py-2.5 pr-3">
                      <p className="font-medium text-metin">{ilan.baslik}</p>
                      <p className="text-[11px] text-metin-silik">
                        {ISLEM_TURU[ilan.islem_turu]} ·{" "}
                        {EMLAK_TURU[ilan.emlak_turu]}
                      </p>
                    </td>
                    <td className="py-2.5 pr-3 text-metin-ikincil">
                      {ilan.il} / {ilan.ilce}
                      {ilan.mahalle && (
                        <span className="block text-[11px] text-metin-silik">
                          {ilan.mahalle}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 pr-3 whitespace-nowrap rakam text-metin-ikincil">
                      {ilan.oda_sayisi}
                      <span className="block text-[11px] text-metin-silik">
                        {ilan.m2_brut} / {ilan.m2_net} m²
                      </span>
                    </td>
                    <td className="py-2.5 pr-3 text-metin-ikincil">
                      {kat(ilan.bulundugu_kat)} / {ilan.bina_kat_sayisi}
                      <span className="block text-[11px] text-metin-silik">
                        {ISINMA_TURU[ilan.isinma_turu]}
                      </span>
                    </td>
                    <td className="py-2.5 text-right whitespace-nowrap rakam font-semibold text-metin">
                      {para(ilan.fiyat)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <footer className="mt-6 border-t border-cizgi pt-3 text-[11px] text-metin-silik">
          Bu liste {ofis?.unvan ?? "emlak işletmesi"} tarafından bilgilendirme
          amacıyla oluşturulmuştur.
        </footer>
      </article>
    </div>
  );
}
