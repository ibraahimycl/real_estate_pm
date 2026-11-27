import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { musteriGetir } from "@/modules/musteri/queries";
import { sunucuIstemcisi } from "@/lib/supabase/server";
import { SayfaBasligi } from "@/components/panel/SayfaBasligi";
import { Kart, KartBaslik, KartGovde } from "@/components/ui/Kart";
import { Rozet, durumTonu } from "@/components/ui/Rozet";
import { Uyari } from "@/components/ui/Uyari";
import { BagButon } from "@/components/ui/Buton";
import { MusteriFormu } from "../MusteriFormu";
import { SilButonu } from "./SilButonu";
import { EMLAK_DURUMU, ISLEM_TURU, TALEP_DURUMU } from "@/lib/etiketler";
import { para, tarih } from "@/lib/bicim";
import type { Emlak, Talep } from "@/types/database";

export const metadata: Metadata = { title: "Müşteri Detayı" };

export default async function MusteriDetaySayfasi({
  params,
  searchParams,
}: PageProps<"/panel/musteriler/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  const musteri = await musteriGetir(id);
  if (!musteri) notFound();

  const supabase = await sunucuIstemcisi();
  const [{ data: ilanlar }, { data: talepler }] = await Promise.all([
    supabase
      .from("emlaklar")
      .select("id, ilan_no, baslik, islem_turu, fiyat, durum")
      .eq("sahip_profil_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("talepler")
      .select("id, islem_turu, il, ilce, min_fiyat, max_fiyat, durum, created_at")
      .eq("profil_id", id)
      .order("created_at", { ascending: false }),
  ]);

  const portfoy = (ilanlar ?? []) as Pick<
    Emlak,
    "id" | "ilan_no" | "baslik" | "islem_turu" | "fiyat" | "durum"
  >[];
  const istekler = (talepler ?? []) as Pick<
    Talep,
    "id" | "islem_turu" | "il" | "ilce" | "min_fiyat" | "max_fiyat" | "durum" | "created_at"
  >[];

  return (
    <>
      <SayfaBasligi
        baslik={`${musteri.ad} ${musteri.soyad}`}
        aciklama={`${musteri.eposta} · Kayıt tarihi ${tarih(musteri.created_at)}`}
        eylem={
          <BagButon href="/panel/musteriler" gorunum="ikincil">
            Listeye dön
          </BagButon>
        }
      />

      {sp.kayit === "eklendi" && (
        <div className="mb-5">
          <Uyari tur="basari" baslik="Müşteri kaydı oluşturuldu.">
            Sıradaki adım: bu müşteriye ait emlak kaydını girebilirsiniz.{" "}
            <Link
              href={`/panel/emlaklar/yeni?sahip=${musteri.id}`}
              className="font-medium underline"
            >
              Emlak girişine geç →
            </Link>
          </Uyari>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-5 items-start">
        <div className="lg:col-span-2">
          <MusteriFormu musteri={musteri} />
        </div>

        <div className="space-y-5">
          <Kart>
            <KartBaslik
              baslik="Portföyündeki İlanlar"
              aciklama={`${portfoy.length} kayıt`}
            />
            <KartGovde className="space-y-3">
              {portfoy.length === 0 ? (
                <p className="text-sm text-metin-ikincil">
                  Bu müşteriye ait emlak kaydı yok.
                </p>
              ) : (
                portfoy.map((e) => (
                  <Link
                    key={e.id}
                    href={`/panel/emlaklar/${e.id}`}
                    className="block rounded-lg border border-cizgi p-3 hover:border-marka-300 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-metin line-clamp-2">
                        {e.baslik}
                      </p>
                      <Rozet ton={durumTonu(e.durum)}>
                        {EMLAK_DURUMU[e.durum]}
                      </Rozet>
                    </div>
                    <p className="text-xs text-metin-silik mt-1 rakam">
                      İlan no {e.ilan_no} · {ISLEM_TURU[e.islem_turu]} ·{" "}
                      {para(e.fiyat)}
                    </p>
                  </Link>
                ))
              )}
              <BagButon
                href={`/panel/emlaklar/yeni?sahip=${musteri.id}`}
                gorunum="ikincil"
                boyut="sm"
                className="w-full"
              >
                Bu müşteriye emlak ekle
              </BagButon>
            </KartGovde>
          </Kart>

          <Kart>
            <KartBaslik
              baslik="Arama Talepleri"
              aciklama={`${istekler.length} kayıt`}
            />
            <KartGovde className="space-y-3">
              {istekler.length === 0 ? (
                <p className="text-sm text-metin-ikincil">
                  Kayıtlı arama talebi yok.
                </p>
              ) : (
                istekler.map((t) => (
                  <div
                    key={t.id}
                    className="rounded-lg border border-cizgi p-3 text-sm"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">
                        {ISLEM_TURU[t.islem_turu]} · {t.ilce ?? t.il ?? "Fark etmez"}
                      </span>
                      <Rozet ton={durumTonu(t.durum)}>
                        {TALEP_DURUMU[t.durum]}
                      </Rozet>
                    </div>
                    <p className="text-xs text-metin-silik mt-1 rakam">
                      {para(t.min_fiyat)} – {para(t.max_fiyat)}
                    </p>
                  </div>
                ))
              )}
            </KartGovde>
          </Kart>

          <Kart>
            <KartBaslik
              baslik="Tehlikeli Bölge"
              aciklama="Portföyünde ilan bulunan müşteri silinemez."
            />
            <KartGovde>
              <SilButonu
                id={musteri.id}
                ad={`${musteri.ad} ${musteri.soyad}`}
              />
            </KartGovde>
          </Kart>
        </div>
      </div>
    </>
  );
}
