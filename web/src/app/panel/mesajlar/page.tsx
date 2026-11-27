import Link from "next/link";
import type { Metadata } from "next";
import { mesajlariListele } from "@/modules/mesaj/queries";
import { tumMesajlariOku } from "@/modules/mesaj/actions";
import { aiKullanilabilir } from "@/lib/ai/openai";
import { SayfaBasligi } from "@/components/panel/SayfaBasligi";
import { Kart, KartGovde } from "@/components/ui/Kart";
import { Rozet } from "@/components/ui/Rozet";
import { BosDurum } from "@/components/ui/BosDurum";
import { BagButon, Buton } from "@/components/ui/Buton";
import { Uyari } from "@/components/ui/Uyari";
import { ISLEM_TURU } from "@/lib/etiketler";
import { gorece, para, telefon } from "@/lib/bicim";

export const metadata: Metadata = { title: "AI Mesajları" };

/**
 * AI Mesajları ekranı.
 *
 * Yeni bir ilan kaydedildiğinde eşleştirme motoru çalışır; kriterleri tutan
 * ve bildirim izni olan müşteriler için burada görülen mesajlar üretilir.
 */
export default async function MesajlarSayfasi() {
  const mesajlar = await mesajlariListele();
  const okunmamis = mesajlar.filter((m) => !m.okundu).length;
  const aiAktif = aiKullanilabilir();

  return (
    <>
      <SayfaBasligi
        baslik="AI Mesajları"
        aciklama="Yeni ilan girildiğinde kriterleri tutan müşterilere otomatik üretilen bildirim mesajları."
        eylem={
          okunmamis > 0 ? (
            <form action={tumMesajlariOku}>
              <Buton type="submit" gorunum="ikincil">
                Tümünü okundu işaretle
              </Buton>
            </form>
          ) : undefined
        }
      />

      {!aiAktif && (
        <div className="mb-5">
          <Uyari tur="uyari" baslik="Kural tabanlı mod">
            <code>OPENAI_API_KEY</code> tanımlı değil. Eşleştirme motoru
            çalışmaya devam ediyor; mesaj metinleri dil modeli yerine şablondan
            üretiliyor.
          </Uyari>
        </div>
      )}

      {mesajlar.length === 0 ? (
        <Kart>
          <BosDurum
            baslik="Henüz mesaj üretilmedi"
            aciklama="Yeni bir ilan kaydedin: kriterleri tutan ve bildirim izni olan müşteriler için mesaj otomatik olarak burada belirir."
            eylem={<BagButon href="/panel/emlaklar/yeni">Yeni ilan ekle</BagButon>}
          />
        </Kart>
      ) : (
        <ul className="space-y-3">
          {mesajlar.map((m) => (
            <li key={m.id}>
              <Kart className={m.okundu ? "" : "border-marka-300"}>
                <KartGovde className="space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-metin">
                        {m.talep?.ad_soyad ?? "Bilinmeyen müşteri"}
                        {!m.okundu && (
                          <span className="ml-2 align-middle">
                            <Rozet ton="vurgu">Yeni</Rozet>
                          </span>
                        )}
                      </p>
                      <p className="rakam text-xs text-metin-silik">
                        {m.talep ? telefon(m.talep.telefon) : "—"}
                        {m.talep?.ilce && ` · ${m.talep.ilce}`}
                        {m.talep && ` · ${ISLEM_TURU[m.talep.islem_turu]} talebi`}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {m.eslesme_skoru !== null && (
                        <Rozet ton={m.eslesme_skoru >= 80 ? "basari" : "uyari"}>
                          %{m.eslesme_skoru} uyum
                        </Rozet>
                      )}
                      <Rozet ton={m.model ? "marka" : "notr"}>
                        {m.model ?? "şablon"}
                      </Rozet>
                      <span className="text-xs text-metin-silik">
                        {gorece(m.gonderim_zamani)}
                      </span>
                    </div>
                  </div>

                  {/* Müşteriye gönderilen mesaj */}
                  <div className="rounded-lg rounded-tl-sm bg-marka-50 px-4 py-3 text-sm leading-relaxed text-metin">
                    {m.icerik}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-cizgi pt-3">
                    {m.emlak ? (
                      <Link
                        href={`/panel/emlaklar/${m.emlak_id}`}
                        className="text-sm text-marka-600 hover:underline"
                      >
                        İlan #{m.emlak.ilan_no} · {m.emlak.baslik} ·{" "}
                        <span className="rakam">{para(m.emlak.fiyat)}</span>
                      </Link>
                    ) : (
                      <span className="text-sm text-metin-silik">
                        İlan kaydı silinmiş
                      </span>
                    )}
                  </div>
                </KartGovde>
              </Kart>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-4 text-xs text-metin-silik">
        Toplam {mesajlar.length} mesaj · {okunmamis} okunmamış. Aynı müşteriye
        aynı ilan için ikinci kez mesaj üretilmesi veri tabanındaki
        <code> UNIQUE(talep_id, emlak_id)</code> kısıtıyla engellenir.
      </p>
    </>
  );
}
