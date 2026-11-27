import Link from "next/link";
import type { Metadata } from "next";
import { gerektirGiris } from "@/lib/auth";
import { sunucuIstemcisi } from "@/lib/supabase/server";
import { ilanEtkilesimi } from "@/modules/emlak/queries";
import { Kart, KartGovde } from "@/components/ui/Kart";
import { Rozet, durumTonu } from "@/components/ui/Rozet";
import { BosDurum } from "@/components/ui/BosDurum";
import { Uyari } from "@/components/ui/Uyari";
import { BagButon } from "@/components/ui/Buton";
import { EMLAK_DURUMU, EMLAK_TURU, ISLEM_TURU } from "@/lib/etiketler";
import { para, sayi, tarih } from "@/lib/bicim";
import type { Emlak } from "@/types/database";

export const metadata: Metadata = { title: "İlanlarım" };

/**
 * İlan sahibinin görünümü.
 *
 * Sahip, ilanını DÜZENLEYEMEZ — ilan metni ve fiyatı emlak danışmanının
 * sorumluluğundadır. Burada yalnızca ilanının ne kadar ilgi gördüğü
 * (görüntülenme, kaydedilme, randevu) okunur biçimde gösterilir.
 * Bu kısıt uygulamada değil, veri tabanı RLS politikalarında tanımlıdır.
 */
export default async function IlanlarimSayfasi() {
  const profil = await gerektirGiris("/hesabim/ilanlarim");
  const supabase = await sunucuIstemcisi();

  const { data } = await supabase
    .from("emlaklar")
    .select("*")
    .eq("sahip_profil_id", profil.id)
    .order("created_at", { ascending: false });

  const ilanlar = (data ?? []) as Emlak[];
  const etkilesimler = await Promise.all(
    ilanlar.map((i) => ilanEtkilesimi(i.id)),
  );

  const toplam = etkilesimler.reduce(
    (t, e) => ({
      goruntulenme: t.goruntulenme + e.goruntulenme,
      favori: t.favori + e.favori,
      randevu: t.randevu + e.randevu,
    }),
    { goruntulenme: 0, favori: 0, randevu: 0 },
  );

  return (
    <>
      <h1 className="text-xl font-semibold text-metin">İlanlarım</h1>
      <p className="mt-1 mb-5 text-sm text-metin-ikincil">
        Emlak ofisine verdiğiniz mülklerin ilan performansı.
      </p>

      {ilanlar.length === 0 ? (
        <Kart>
          <BosDurum
            baslik="Adınıza kayıtlı ilan yok"
            aciklama="Emlak ofisi sizin adınıza bir ilan girdiğinde — kaydınızdaki e-posta adresiyle eşleştirilerek — ilanlar burada görünür."
            eylem={<BagButon href="/">İlanlara göz at</BagButon>}
          />
        </Kart>
      ) : (
        <>
          <div className="mb-5 grid gap-3 sm:grid-cols-3">
            {[
              { etiket: "Toplam görüntülenme", deger: toplam.goruntulenme },
              { etiket: "Toplam kaydedilme", deger: toplam.favori },
              { etiket: "Toplam randevu talebi", deger: toplam.randevu },
            ].map((k) => (
              <div
                key={k.etiket}
                className="rounded-kart border border-cizgi bg-yuzey p-4"
              >
                <p className="text-xs text-metin-ikincil">{k.etiket}</p>
                <p className="mt-1.5 text-2xl font-semibold leading-none text-metin">
                  {sayi(k.deger)}
                </p>
              </div>
            ))}
          </div>

          <ul className="space-y-3">
            {ilanlar.map((ilan, i) => {
              const e = etkilesimler[i];
              const yayinda = ilan.durum === "aktif" || ilan.durum === "rezerve";

              return (
                <li key={ilan.id}>
                  <Kart>
                    <KartGovde>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          {yayinda ? (
                            <Link
                              href={`/ilan/${ilan.id}`}
                              className="font-medium text-metin hover:text-marka-600"
                            >
                              {ilan.baslik}
                            </Link>
                          ) : (
                            <span className="font-medium text-metin">
                              {ilan.baslik}
                            </span>
                          )}
                          <p className="rakam mt-0.5 text-xs text-metin-silik">
                            İlan #{ilan.ilan_no} · {ISLEM_TURU[ilan.islem_turu]}{" "}
                            · {EMLAK_TURU[ilan.emlak_turu]} ·{" "}
                            {tarih(ilan.yayin_tarihi)} tarihinde yayınlandı
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="rakam font-semibold text-metin">
                            {para(ilan.fiyat)}
                          </p>
                          <Rozet ton={durumTonu(ilan.durum)}>
                            {EMLAK_DURUMU[ilan.durum]}
                          </Rozet>
                        </div>
                      </div>

                      <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-cizgi pt-4 text-center">
                        {[
                          { etiket: "Görüntülenme", deger: e.goruntulenme },
                          { etiket: "Kaydedilme", deger: e.favori },
                          { etiket: "Randevu talebi", deger: e.randevu },
                        ].map((k) => (
                          <div key={k.etiket}>
                            <dd className="text-xl font-semibold text-metin">
                              {sayi(k.deger)}
                            </dd>
                            <dt className="text-[11px] text-metin-silik">
                              {k.etiket}
                            </dt>
                          </div>
                        ))}
                      </dl>
                    </KartGovde>
                  </Kart>
                </li>
              );
            })}
          </ul>

          <div className="mt-5">
            <Uyari tur="bilgi">
              İlan metni, fiyat ve fotoğraflar emlak danışmanınız tarafından
              yönetilir. Değişiklik için ofisle iletişime geçebilirsiniz.
            </Uyari>
          </div>
        </>
      )}
    </>
  );
}
