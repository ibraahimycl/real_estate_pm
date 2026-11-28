import Image from "next/image";
import type { Metadata } from "next";
import { ilanTalepleriniListele } from "@/modules/emlak/queries";
import { SayfaBasligi } from "@/components/panel/SayfaBasligi";
import { Kart, KartGovde } from "@/components/ui/Kart";
import { Rozet } from "@/components/ui/Rozet";
import { BosDurum } from "@/components/ui/BosDurum";
import { IlanTalebiEylemleri } from "./IlanTalebiEylemleri";
import { EMLAK_TURU, ISINMA_TURU, ISLEM_TURU } from "@/lib/etiketler";
import { kat, para, tarih, telefon } from "@/lib/bicim";

export const metadata: Metadata = { title: "İlan Talepleri" };

export default async function IlanTalepleriSayfasi() {
  const talepler = await ilanTalepleriniListele();

  return (
    <>
      <SayfaBasligi
        baslik="İlan Talepleri"
        aciklama="Müşterilerin satmak veya kiralamak üzere gönderdiği, onay bekleyen ilan kayıtları. Onaylanan ilanlar doğrudan site kataloğunda yayınlanır."
      />

      {talepler.length === 0 ? (
        <Kart>
          <BosDurum
            baslik="Onay bekleyen ilan talebi yok"
            aciklama="Müşteriler hesaplarından yeni ilan talebi gönderdiğinde incelemeniz ve onaylamanız için burada listelenir."
          />
        </Kart>
      ) : (
        <div className="space-y-4">
          {talepler.map((ilan) => {
            const ozellikler = [
              ilan.asansor && "Asansör",
              ilan.otopark && "Otopark",
              ilan.balkon && "Balkon",
              ilan.esyali && "Eşyalı",
              ilan.site_icinde && "Site içinde",
              ilan.krediye_uygun && "Krediye uygun",
            ].filter(Boolean) as string[];

            const kapak = ilan.fotograflar[0]?.url;

            return (
              <Kart key={ilan.id}>
                <KartGovde className="space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-start gap-4 min-w-0">
                      {kapak && (
                        <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-lg border border-cizgi bg-yuzey-alt">
                          <Image
                            src={kapak}
                            alt={ilan.baslik}
                            fill
                            sizes="112px"
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Rozet ton="uyari">Onay Bekliyor</Rozet>
                          <span className="text-xs text-metin-silik rakam">
                            İlan #{ilan.ilan_no} · {tarih(ilan.created_at)}
                          </span>
                        </div>
                        <h2 className="mt-1 text-base font-semibold text-metin">
                          {ilan.baslik}
                        </h2>
                        <p className="text-sm text-metin-ikincil">
                          {ISLEM_TURU[ilan.islem_turu]} ·{" "}
                          {EMLAK_TURU[ilan.emlak_turu]} · {ilan.il} /{" "}
                          {ilan.ilce}
                          {ilan.mahalle && ` / ${ilan.mahalle}`}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold text-marka-700 rakam">
                        {para(ilan.fiyat)}
                      </p>
                      <p className="text-xs text-metin-silik rakam">
                        Aidat: {para(ilan.aidat)}
                        {ilan.depozito !== null &&
                          ` · Depozito: ${para(ilan.depozito)}`}
                      </p>
                    </div>
                  </div>

                  {ilan.aciklama && (
                    <p className="text-sm text-metin-ikincil leading-relaxed">
                      {ilan.aciklama}
                    </p>
                  )}

                  <div className="grid gap-3 rounded-lg bg-yuzey-alt p-3.5 text-xs sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <span className="text-metin-silik">Mülk Sahibi</span>
                      <p className="mt-0.5 font-medium text-metin">
                        {ilan.sahip
                          ? `${ilan.sahip.ad} ${ilan.sahip.soyad}`
                          : "—"}
                      </p>
                      {ilan.sahip && (
                        <p className="text-metin-ikincil rakam">
                          {telefon(ilan.sahip.cep_telefon)}
                        </p>
                      )}
                    </div>
                    <div>
                      <span className="text-metin-silik">Oda & Alan</span>
                      <p className="mt-0.5 font-medium text-metin rakam">
                        {ilan.oda_sayisi} · {ilan.m2_brut} m² brüt /{" "}
                        {ilan.m2_net} m² net
                      </p>
                    </div>
                    <div>
                      <span className="text-metin-silik">Kat & Isıtma</span>
                      <p className="mt-0.5 font-medium text-metin">
                        {kat(ilan.bulundugu_kat)} ({ilan.bina_kat_sayisi} katlı,{" "}
                        {ilan.bina_yasi} yaş) · {ISINMA_TURU[ilan.isinma_turu]}
                      </p>
                    </div>
                    <div>
                      <span className="text-metin-silik">Açık Adres</span>
                      <p className="mt-0.5 font-medium text-metin">
                        {ilan.adres || "Belirtilmedi"}
                      </p>
                    </div>
                  </div>

                  {ozellikler.length > 0 && (
                    <p className="text-xs text-metin-ikincil">
                      <span className="font-medium text-metin">
                        Özellikler:{" "}
                      </span>
                      {ozellikler.join(" · ")}
                    </p>
                  )}

                  <div className="border-t border-cizgi pt-3">
                    <IlanTalebiEylemleri
                      emlakId={ilan.id}
                      baslik={ilan.baslik}
                    />
                  </div>
                </KartGovde>
              </Kart>
            );
          })}
        </div>
      )}
    </>
  );
}
