import type { Metadata } from "next";
import { gerektirGiris } from "@/lib/auth";
import { sozlesmelerim } from "@/modules/sozlesme/queries";
import { Kart, KartGovde } from "@/components/ui/Kart";
import { Rozet, durumTonu } from "@/components/ui/Rozet";
import { BosDurum } from "@/components/ui/BosDurum";
import { Uyari } from "@/components/ui/Uyari";
import { OnayButonu } from "@/components/sozlesme/OnayButonu";
import { SOZLESME_DURUMU } from "@/lib/etiketler";
import { para, tarih } from "@/lib/bicim";

export const metadata: Metadata = { title: "Sözleşmelerim" };

/**
 * Müşterinin sözleşme onay ekranı.
 * Onay, veri tabanındaki sozlesme_onayla() fonksiyonu üzerinden verilir;
 * iki taraf da onayladığında sözleşme imzalanmış sayılır.
 */
export default async function SozlesmelerimSayfasi() {
  const profil = await gerektirGiris("/hesabim/sozlesmelerim");
  const sozlesmeler = await sozlesmelerim(profil.id);

  return (
    <>
      <h1 className="text-xl font-semibold text-metin">Sözleşmelerim</h1>
      <p className="mt-1 mb-5 text-sm text-metin-ikincil">
        Kiracı veya ev sahibi olarak taraf olduğunuz kira sözleşmeleri.
      </p>

      {sozlesmeler.length === 0 ? (
        <Kart>
          <BosDurum
            baslik="Sözleşmeniz yok"
            aciklama="Bir kiralama anlaşması yapıldığında danışmanınız sözleşme taslağını hazırlar ve onayınız için buraya düşer."
          />
        </Kart>
      ) : (
        <ul className="space-y-3">
          {sozlesmeler.map((s) => {
            const kiraciMiyim = s.kiraci_profil_id === profil.id;
            const imzalandi = s.durum === "imzalandi";

            return (
              <li key={s.id}>
                <Kart>
                  <KartGovde className="space-y-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-metin">
                          {s.emlak?.baslik ?? "İlan kaydı bulunamadı"}
                        </p>
                        <p className="text-xs text-metin-silik">
                          {kiraciMiyim ? "Kiracı" : "Kiraya veren"} olarak taraf
                          · İlan #{s.emlak?.ilan_no ?? "—"}
                        </p>
                      </div>
                      <Rozet ton={durumTonu(s.durum)}>
                        {SOZLESME_DURUMU[s.durum]}
                      </Rozet>
                    </div>

                    <dl className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
                      {[
                        ["Kira dönemi", `${tarih(s.baslangic_tarihi)} – ${tarih(s.bitis_tarihi)}`],
                        ["Aylık kira", para(s.kira_bedeli)],
                        ["Depozito", para(s.depozito)],
                        [
                          "Karşı taraf",
                          kiraciMiyim
                            ? s.ev_sahibi
                              ? `${s.ev_sahibi.ad} ${s.ev_sahibi.soyad}`
                              : "—"
                            : s.kiraci
                              ? `${s.kiraci.ad} ${s.kiraci.soyad}`
                              : "—",
                        ],
                      ].map(([etiket, deger]) => (
                        <div
                          key={etiket}
                          className="flex justify-between gap-3 border-b border-cizgi py-1"
                        >
                          <dt className="text-metin-ikincil">{etiket}</dt>
                          <dd className="rakam text-right text-metin">{deger}</dd>
                        </div>
                      ))}
                    </dl>

                    {s.ozel_sartlar && (
                      <div className="rounded-lg bg-yuzey-alt p-3">
                        <p className="text-xs font-medium text-metin-silik">
                          Özel şartlar
                        </p>
                        <p className="mt-1 whitespace-pre-line text-sm text-metin">
                          {s.ozel_sartlar}
                        </p>
                      </div>
                    )}

                    <div className="border-t border-cizgi pt-3">
                      {imzalandi ? (
                        <Uyari tur="basari">
                          Sözleşme her iki tarafça onaylandı. Çıktısını emlak
                          ofisinden talep edebilirsiniz.
                        </Uyari>
                      ) : s.durum === "iptal" ? (
                        <Uyari tur="uyari">Bu sözleşme iptal edilmiştir.</Uyari>
                      ) : s.musteri_onay_at ? (
                        <p className="text-sm text-metin-ikincil">
                          Onayınız alındı. Danışman onayı bekleniyor.
                        </p>
                      ) : (
                        <div className="max-w-xs">
                          <OnayButonu
                            id={s.id}
                            etiket="Sözleşmeyi onaylıyorum"
                          />
                        </div>
                      )}
                    </div>
                  </KartGovde>
                </Kart>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
