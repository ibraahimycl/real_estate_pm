import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  emlakFotograflari,
  emlakGetir,
  ilanEtkilesimi,
} from "@/modules/emlak/queries";
import { musteriSecenekleri } from "@/modules/musteri/queries";
import { ilanaUyanTalepler } from "@/lib/ai/eslestirme";
import { SayfaBasligi } from "@/components/panel/SayfaBasligi";
import { Kart, KartBaslik, KartGovde } from "@/components/ui/Kart";
import { Rozet } from "@/components/ui/Rozet";
import { Uyari } from "@/components/ui/Uyari";
import { BagButon } from "@/components/ui/Buton";
import { EmlakFormu } from "../EmlakFormu";
import { eslestirmeyiCalistir } from "@/modules/emlak/actions";
import { FotografYonetimi } from "./FotografYonetimi";
import { SilButonu } from "./SilButonu";
import { ISLEM_TURU } from "@/lib/etiketler";
import { para, telefon } from "@/lib/bicim";

export const metadata: Metadata = { title: "İlan Detayı" };

export default async function EmlakDetaySayfasi({
  params,
  searchParams,
}: PageProps<"/panel/emlaklar/[id]">) {
  const { id } = await params;
  const sp = await searchParams;

  const emlak = await emlakGetir(id);
  if (!emlak) notFound();

  const [musteriler, fotograflar, etkilesim, uyanTalepler] = await Promise.all([
    musteriSecenekleri(),
    emlakFotograflari(id),
    ilanEtkilesimi(id),
    ilanaUyanTalepler(id),
  ]);

  const bildirimli = uyanTalepler.filter((t) => t.talep.bildirim_izni).length;

  return (
    <>
      <SayfaBasligi
        baslik={emlak.baslik}
        aciklama={`İlan no ${emlak.ilan_no} · ${ISLEM_TURU[emlak.islem_turu]} · ${para(emlak.fiyat)}`}
        eylem={
          <>
            <BagButon href={`/ilan/${emlak.id}`} gorunum="ikincil">
              Sitede gör
            </BagButon>
            <BagButon href={`/panel/emlaklar/${emlak.id}/cikti`} gorunum="ikincil">
              Yazıcı çıktısı
            </BagButon>
          </>
        }
      />

      {sp.kayit === "eklendi" && (
        <div className="mb-5">
          <Uyari tur="basari" baslik="İlan kaydedildi.">
            {uyanTalepler.length === 0 ? (
              "Bu ilanın kriterlerine uyan aktif müşteri talebi bulunamadı."
            ) : (
              <>
                Kriterlere uyan <strong>{uyanTalepler.length}</strong> müşteri
                talebi bulundu
                {bildirimli > 0 ? (
                  <>
                    ; bildirim izni olan <strong>{bildirimli}</strong> müşteriye
                    mesaj üretildi.{" "}
                    <Link href="/panel/mesajlar" className="font-medium underline">
                      Mesajları gör →
                    </Link>
                  </>
                ) : (
                  ", ancak hiçbirinin bildirim izni yok."
                )}
              </>
            )}
          </Uyari>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-5 items-start">
        <div className="lg:col-span-2">
          <EmlakFormu emlak={emlak} musteriler={musteriler} />
        </div>

        <div className="space-y-5">
          <Kart>
            <KartBaslik
              baslik="İlan Etkileşimi"
              aciklama="Bu rakamlar ilan sahibinin hesabında da görünür."
            />
            <KartGovde>
              <dl className="grid grid-cols-3 gap-3 text-center">
                {[
                  { etiket: "Görüntülenme", deger: etkilesim.goruntulenme },
                  { etiket: "Kaydedilme", deger: etkilesim.favori },
                  { etiket: "Randevu", deger: etkilesim.randevu },
                ].map((k) => (
                  <div key={k.etiket} className="rounded-lg bg-yuzey-alt py-3">
                    <dd className="text-xl font-semibold rakam text-metin">
                      {k.deger}
                    </dd>
                    <dt className="text-[11px] text-metin-silik mt-0.5">
                      {k.etiket}
                    </dt>
                  </div>
                ))}
              </dl>
            </KartGovde>
          </Kart>

          <Kart>
            <KartBaslik
              baslik="Eşleşen Müşteri Talepleri"
              aciklama={`${uyanTalepler.length} talep bu ilanın kriterlerine uyuyor`}
              eylem={
                <form action={eslestirmeyiCalistir}>
                  <input type="hidden" name="id" value={emlak.id} />
                  <button
                    type="submit"
                    className="text-xs font-medium text-marka-600 hover:underline"
                  >
                    Yeniden tara
                  </button>
                </form>
              }
            />
            <KartGovde className="space-y-3">
              {uyanTalepler.length === 0 ? (
                <p className="text-sm text-metin-ikincil">
                  Bu ilana uyan aktif talep yok.
                </p>
              ) : (
                uyanTalepler.slice(0, 6).map(({ talep, skor, gerekceler }) => (
                  <div
                    key={talep.id}
                    className="rounded-lg border border-cizgi p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-metin">
                          {talep.ad_soyad}
                        </p>
                        <p className="text-xs text-metin-silik rakam">
                          {telefon(talep.telefon)}
                        </p>
                      </div>
                      <Rozet ton={skor >= 80 ? "basari" : "uyari"}>
                        %{skor} uyum
                      </Rozet>
                    </div>
                    <p className="text-xs text-metin-ikincil mt-1.5">
                      {gerekceler.slice(0, 3).join(" · ")}
                    </p>
                    {!talep.bildirim_izni && (
                      <p className="text-[11px] text-metin-silik mt-1">
                        Bildirim izni yok — mesaj gönderilmedi.
                      </p>
                    )}
                  </div>
                ))
              )}
            </KartGovde>
          </Kart>

          <Kart>
            <KartBaslik baslik="Fotoğraflar" />
            <KartGovde>
              <FotografYonetimi emlakId={emlak.id} fotograflar={fotograflar} />
            </KartGovde>
          </Kart>

          <Kart>
            <KartBaslik
              baslik="Tehlikeli Bölge"
              aciklama="Sözleşmesi olan ilan silinemez."
            />
            <KartGovde>
              <SilButonu id={emlak.id} baslik={emlak.baslik} />
            </KartGovde>
          </Kart>
        </div>
      </div>
    </>
  );
}
