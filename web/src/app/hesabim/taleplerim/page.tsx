import type { Metadata } from "next";
import { gerektirGiris } from "@/lib/auth";
import { taleplerim } from "@/modules/talep/queries";
import { bildirimIzniDegistir, talebiKapat } from "@/modules/talep/actions";
import { Kart, KartGovde } from "@/components/ui/Kart";
import { Rozet, durumTonu } from "@/components/ui/Rozet";
import { BosDurum } from "@/components/ui/BosDurum";
import { Uyari } from "@/components/ui/Uyari";
import { BagButon } from "@/components/ui/Buton";
import {
  EMLAK_TURU,
  ISLEM_TURU,
  TALEP_DURUMU,
  TALEP_KAYNAGI,
} from "@/lib/etiketler";
import { para, tarih } from "@/lib/bicim";

export const metadata: Metadata = { title: "Taleplerim" };

export default async function TaleplerimSayfasi({
  searchParams,
}: PageProps<"/hesabim/taleplerim">) {
  const profil = await gerektirGiris("/hesabim/taleplerim");
  const sp = await searchParams;
  const talepler = await taleplerim(profil.id);

  return (
    <>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-metin">Taleplerim</h1>
          <p className="mt-1 text-sm text-metin-ikincil">
            Kayıtlı arama kriterleriniz. Uyan bir ilan girildiğinde haber
            veririz.
          </p>
        </div>
        <BagButon href="/hesabim/taleplerim/yeni">Yeni Talep</BagButon>
      </div>

      {sp.kayit === "eklendi" && (
        <div className="mb-5">
          <Uyari tur="basari">
            Talebiniz kaydedildi. Uygun ilan düştüğünde size haber vereceğiz.
          </Uyari>
        </div>
      )}

      {talepler.length === 0 ? (
        <Kart>
          <BosDurum
            baslik="Kayıtlı talebiniz yok"
            aciklama="Aradığınız kriterleri kaydedin; portföyümüze uyan bir ilan girildiğinde ilk siz haberdar olun."
            eylem={
              <div className="flex flex-wrap justify-center gap-2">
                <BagButon href="/hesabim/taleplerim/yeni">Talep oluştur</BagButon>
                <BagButon href="/ai-danisman" gorunum="ikincil">
                  AI danışmana sor
                </BagButon>
              </div>
            }
          />
        </Kart>
      ) : (
        <ul className="space-y-3">
          {talepler.map((t) => (
            <li key={t.id}>
              <Kart>
                <KartGovde className="space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-metin">
                        {ISLEM_TURU[t.islem_turu]}
                        {t.emlak_turu && ` · ${EMLAK_TURU[t.emlak_turu]}`}
                        {t.ilce && ` · ${t.ilce}`}
                      </p>
                      <p className="text-xs text-metin-silik">
                        {TALEP_KAYNAGI[t.kaynak]} · {tarih(t.created_at)}
                      </p>
                    </div>
                    <Rozet ton={durumTonu(t.durum)}>
                      {TALEP_DURUMU[t.durum]}
                    </Rozet>
                  </div>

                  <dl className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
                    {[
                      [
                        "Bütçe",
                        `${t.min_fiyat ? para(t.min_fiyat) : "—"} – ${t.max_fiyat ? para(t.max_fiyat) : "—"}`,
                      ],
                      ["Oda sayısı", t.oda_sayilari?.join(", ") ?? "Fark etmez"],
                      ["En az alan", t.min_m2 ? `${t.min_m2} m²` : "Fark etmez"],
                      [
                        "Şartlar",
                        [
                          t.asansor_sart && "Asansör",
                          t.otopark_sart && "Otopark",
                          t.esyali_sart && "Eşyalı",
                        ]
                          .filter(Boolean)
                          .join(", ") || "Yok",
                      ],
                    ].map(([etiket, deger]) => (
                      <div key={etiket} className="flex justify-between gap-3 border-b border-cizgi py-1">
                        <dt className="text-metin-ikincil">{etiket}</dt>
                        <dd className="rakam text-right text-metin">{deger}</dd>
                      </div>
                    ))}
                  </dl>

                  {t.notlar && (
                    <p className="rounded-lg bg-yuzey-alt p-3 text-sm text-metin-ikincil">
                      {t.notlar}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-3 border-t border-cizgi pt-3">
                    <form action={bildirimIzniDegistir}>
                      <input type="hidden" name="id" value={t.id} />
                      <button
                        type="submit"
                        className={`text-sm font-medium ${
                          t.bildirim_izni
                            ? "text-metin-ikincil hover:text-hata-600"
                            : "text-marka-600 hover:underline"
                        }`}
                      >
                        {t.bildirim_izni
                          ? "Bildirimleri kapat"
                          : "Bildirimleri aç"}
                      </button>
                    </form>

                    <Rozet ton={t.bildirim_izni ? "basari" : "notr"}>
                      {t.bildirim_izni ? "Bildirim açık" : "Bildirim kapalı"}
                    </Rozet>

                    {t.durum === "aktif" && (
                      <form action={talebiKapat} className="ml-auto">
                        <input type="hidden" name="id" value={t.id} />
                        <button
                          type="submit"
                          className="text-sm text-metin-ikincil hover:text-hata-600"
                        >
                          Talebi kapat
                        </button>
                      </form>
                    )}
                  </div>
                </KartGovde>
              </Kart>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
