import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ilanGetir } from "@/modules/emlak/queries";
import { sunucuIstemcisi } from "@/lib/supabase/server";
import { goruntulenmeKaydet } from "@/modules/etkilesim/actions";
import { oturumProfili } from "@/lib/auth";
import { isyeriGetir } from "@/modules/isyeri/queries";
import { Kart, KartBaslik, KartGovde } from "@/components/ui/Kart";
import { Rozet } from "@/components/ui/Rozet";
import { RandevuFormu } from "./RandevuFormu";
import { FavoriButonu } from "./FavoriButonu";
import {
  EMLAK_TURU,
  ISINMA_TURU,
  ISLEM_TURU,
} from "@/lib/etiketler";
import { kat, metrekare, para, tarih, telefon } from "@/lib/bicim";
import type { EmlakFotografi } from "@/types/database";

export async function generateMetadata({
  params,
}: PageProps<"/ilan/[id]">): Promise<Metadata> {
  const { id } = await params;
  const ilan = await ilanGetir(id);
  return { title: ilan?.baslik ?? "İlan" };
}

function Ozellik({ etiket, deger }: { etiket: string; deger: string }) {
  return (
    <div className="border-b border-cizgi py-2.5">
      <dt className="text-xs text-metin-silik">{etiket}</dt>
      <dd className="rakam mt-0.5 text-sm font-medium text-metin">{deger}</dd>
    </div>
  );
}

export default async function IlanDetaySayfasi({
  params,
}: PageProps<"/ilan/[id]">) {
  const { id } = await params;

  const [ilan, profil] = await Promise.all([ilanGetir(id), oturumProfili()]);
  if (!ilan) notFound();

  // Görüntülenme sayacı: ilan sahibinin hesabında görünen rakamı besler.
  await goruntulenmeKaydet(ilan.id, profil?.id ?? null);

  const supabase = await sunucuIstemcisi();
  const [{ data: fotoKayitlari }, favoriSorgusu, ofis] = await Promise.all([
    supabase
      .from("emlak_fotograflari")
      .select("*")
      .eq("emlak_id", ilan.id)
      .order("kapak", { ascending: false })
      .order("sira"),
    profil
      ? supabase
          .from("favoriler")
          .select("emlak_id", { count: "exact", head: true })
          .eq("profil_id", profil.id)
          .eq("emlak_id", ilan.id)
      : Promise.resolve({ count: 0 }),
    isyeriGetir(),
  ]);

  const fotograflar = (fotoKayitlari ?? []) as EmlakFotografi[];
  const kayitli = (favoriSorgusu.count ?? 0) > 0;

  const ozellikler = [
    ilan.asansor && "Asansör",
    ilan.otopark && "Otopark",
    ilan.balkon && "Balkon",
    ilan.esyali && "Eşyalı",
    ilan.site_icinde && "Site içinde",
    ilan.krediye_uygun && "Krediye uygun",
  ].filter(Boolean) as string[];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <nav className="mb-4 text-sm text-metin-ikincil">
        <Link href="/" className="hover:text-marka-600">
          İlanlar
        </Link>
        <span className="mx-1.5 text-cizgi-koyu">/</span>
        <span>
          {ilan.il} / {ilan.ilce}
        </span>
      </nav>

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem] items-start">
        <div>
          {/* Görseller */}
          {fotograflar.length > 0 ? (
            <div className="grid grid-cols-4 gap-2">
              <div className="col-span-4 relative aspect-16/9 overflow-hidden rounded-kart bg-yuzey-alt">
                <Image
                  src={fotograflar[0].url}
                  alt={ilan.baslik}
                  fill
                  sizes="(max-width: 1024px) 100vw, 60vw"
                  className="object-cover"
                  priority
                  unoptimized
                />
              </div>
              {fotograflar.slice(1, 5).map((f) => (
                <div
                  key={f.id}
                  className="relative aspect-4/3 overflow-hidden rounded-lg bg-yuzey-alt"
                >
                  <Image
                    src={f.url}
                    alt=""
                    fill
                    sizes="(max-width: 1024px) 25vw, 15vw"
                    className="object-cover"
                    unoptimized
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid aspect-16/9 place-items-center rounded-kart bg-yuzey-alt text-metin-silik">
              Bu ilan için görsel eklenmemiş
            </div>
          )}

          {/* Başlık ve fiyat */}
          <div className="mt-6">
            <div className="flex flex-wrap items-center gap-2">
              <Rozet ton={ilan.islem_turu === "kiralik" ? "marka" : "vurgu"}>
                {ISLEM_TURU[ilan.islem_turu]}
              </Rozet>
              <Rozet>{EMLAK_TURU[ilan.emlak_turu]}</Rozet>
              {ilan.durum === "rezerve" && <Rozet ton="uyari">Rezerve</Rozet>}
              <span className="rakam ml-auto text-xs text-metin-silik">
                İlan no {ilan.ilan_no} · {tarih(ilan.yayin_tarihi)}
              </span>
            </div>

            <h1 className="mt-3 text-2xl font-semibold text-metin">
              {ilan.baslik}
            </h1>
            <p className="mt-1 text-sm text-metin-ikincil">
              {ilan.il} / {ilan.ilce}
              {ilan.mahalle && ` / ${ilan.mahalle}`}
            </p>

            <p className="rakam mt-4 text-3xl font-bold text-marka-700">
              {para(ilan.fiyat)}
              {ilan.islem_turu === "kiralik" && (
                <span className="text-base font-normal text-metin-silik">
                  {" "}
                  / ay
                </span>
              )}
            </p>
          </div>

          {ilan.aciklama && (
            <div className="mt-6">
              <h2 className="mb-2 font-semibold text-metin">Açıklama</h2>
              <p className="whitespace-pre-line text-sm leading-relaxed text-metin-ikincil">
                {ilan.aciklama}
              </p>
            </div>
          )}

          {/* Nitelikler */}
          <div className="mt-6">
            <h2 className="mb-2 font-semibold text-metin">Emlak Bilgileri</h2>
            <dl className="grid gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
              <Ozellik etiket="Oda Sayısı" deger={ilan.oda_sayisi} />
              <Ozellik etiket="Brüt Alan" deger={metrekare(ilan.m2_brut)} />
              <Ozellik etiket="Net Alan" deger={metrekare(ilan.m2_net)} />
              <Ozellik etiket="Bulunduğu Kat" deger={kat(ilan.bulundugu_kat)} />
              <Ozellik
                etiket="Bina Kat Sayısı"
                deger={String(ilan.bina_kat_sayisi)}
              />
              <Ozellik etiket="Bina Yaşı" deger={String(ilan.bina_yasi)} />
              <Ozellik etiket="Isıtma" deger={ISINMA_TURU[ilan.isinma_turu]} />
              <Ozellik
                etiket="Banyo Sayısı"
                deger={ilan.banyo_sayisi?.toString() ?? "—"}
              />
              <Ozellik etiket="Aidat" deger={para(ilan.aidat)} />
              {ilan.islem_turu === "kiralik" && (
                <Ozellik etiket="Depozito" deger={para(ilan.depozito)} />
              )}
            </dl>
          </div>

          {ozellikler.length > 0 && (
            <div className="mt-5">
              <h2 className="mb-2 font-semibold text-metin">Ek Özellikler</h2>
              <ul className="flex flex-wrap gap-2">
                {ozellikler.map((o) => (
                  <li key={o}>
                    <Rozet ton="marka">{o}</Rozet>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="mt-6 rakam text-xs text-metin-silik">
            Bu ilan {ilan.goruntulenme_sayisi} kez görüntülendi ·{" "}
            {ilan.favori_sayisi} kişi kaydetti
          </p>
        </div>

        {/* Yan sütun */}
        <aside className="space-y-5 lg:sticky lg:top-20">
          <Kart>
            <KartGovde className="space-y-3">
              <FavoriButonu emlakId={ilan.id} kayitli={kayitli} />
              {ofis && (
                <div className="border-t border-cizgi pt-3 text-sm">
                  <p className="font-medium text-metin">{ofis.unvan}</p>
                  <p className="rakam mt-0.5 text-metin-ikincil">
                    {telefon(ofis.telefon)}
                  </p>
                  <p className="text-metin-ikincil">{ofis.eposta}</p>
                </div>
              )}
            </KartGovde>
          </Kart>

          <Kart>
            <KartBaslik
              baslik="Randevu Talebi"
              aciklama="Gün seçin; saati danışmanımız sizinle konuşarak belirlesin."
            />
            <KartGovde>
              <RandevuFormu
                emlakId={ilan.id}
                adSoyad={profil ? `${profil.ad} ${profil.soyad}` : undefined}
                telefon={profil?.cep_telefon}
              />
            </KartGovde>
          </Kart>
        </aside>
      </div>
    </div>
  );
}
