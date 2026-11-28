import Link from "next/link";
import {
  aramayiLogla,
  ilanlariAra,
  konumSecenekleri,
} from "@/modules/arama/queries";
import { filtreDolu, filtreyiOku } from "@/modules/arama/schema";
import { oturumProfili } from "@/lib/auth";
import { IlanKarti } from "@/components/ilan/IlanKarti";
import { FiltrePaneli } from "@/components/ilan/FiltrePaneli";
import { Kart } from "@/components/ui/Kart";
import { BosDurum } from "@/components/ui/BosDurum";
import { Sayfalama } from "@/components/ui/Sayfalama";
import { BagButon } from "@/components/ui/Buton";

/**
 * Modül 4 — Ziyaretçi arama ekranı.
 * Her arama arama_loglari tablosuna yazılır; sonuç çıkmayan kriterler
 * emlakçı panelindeki talep analizini besler.
 */
export default async function AnaSayfa({ searchParams }: PageProps<"/">) {
  const sp = await searchParams;
  const filtre = filtreyiOku(sp);
  const aramaYapildi = filtreDolu(filtre);

  const [sonuc, konumlar, profil] = await Promise.all([
    ilanlariAra(filtre),
    konumSecenekleri(),
    oturumProfili(),
  ]);

  if (aramaYapildi) {
    await aramayiLogla(filtre, sonuc.toplam, profil?.id ?? null);
  }

  // Sayfalama ve yazıcı çıktısı bağlantılarının mevcut filtreyi koruması için
  const sayfaParametreleri: Record<string, string | undefined> = {};
  const ciktiParams = new URLSearchParams();
  for (const [anahtar, deger] of Object.entries(sp)) {
    if (anahtar === "sayfa") continue;
    if (typeof deger === "string") {
      sayfaParametreleri[anahtar] = deger;
      if (deger !== "") ciktiParams.set(anahtar, deger);
    } else if (Array.isArray(deger)) {
      for (const item of deger) if (item !== "") ciktiParams.append(anahtar, item);
    }
  }
  const ciktiYolu = ciktiParams.toString()
    ? `/cikti?${ciktiParams.toString()}`
    : "/cikti";

  return (
    <>
      {/* Tanıtım bandı */}
      <section className="border-b border-cizgi bg-marka-700 text-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
          <h1 className="max-w-2xl text-3xl font-semibold leading-tight sm:text-4xl">
            Ankara&apos;da size uygun evi bulmanın kolay yolu
          </h1>
          <p className="mt-3 max-w-xl text-marka-100">
            Portföyümüzü filtreleyerek inceleyin, beğendiğiniz ilanlar için gün
            bazlı randevu bırakın. Aradığınızı bulamazsanız kriterlerinizi
            kaydedin — uygun ilan düştüğünde size haber verelim.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <BagButon href="/ai-danisman" gorunum="vurgu">
              AI danışmana sor
            </BagButon>
            <BagButon href="/hesabim/taleplerim/yeni" gorunum="ters">
              Talep bırak
            </BagButon>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[18rem_1fr]">
        {/* Filtreler */}
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <Kart className="p-5">
            <h2 className="mb-4 font-semibold text-metin">Filtrele</h2>
            <FiltrePaneli
              filtre={filtre}
              iller={konumlar.iller}
              ilceler={konumlar.ilceler}
            />
          </Kart>
        </aside>

        {/* Sonuçlar */}
        <section>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-metin-ikincil">
              <span className="rakam font-semibold text-metin">
                {sonuc.toplam}
              </span>{" "}
              ilan bulundu
            </p>
            {sonuc.toplam > 0 && (
              <BagButon href={ciktiYolu} gorunum="ikincil" boyut="sm">
                Listeyi Yazdır / PDF
              </BagButon>
            )}
          </div>

          {sonuc.ilanlar.length === 0 ? (
            <Kart>
              <BosDurum
                baslik="Aradığınız kriterlere uygun ilan bulunamadı"
                aciklama="Kriterlerinizi kaydedin; portföyümüze uygun bir ilan düştüğünde size haber verelim. Bu arama, eksik kalan portföy ihtiyacı olarak ekibimize de iletildi."
                eylem={
                  <div className="flex flex-wrap justify-center gap-2">
                    <BagButon href="/hesabim/taleplerim/yeni">
                      Kriterlerimi kaydet
                    </BagButon>
                    <BagButon href="/ai-danisman" gorunum="ikincil">
                      AI danışmana sor
                    </BagButon>
                  </div>
                }
              />
            </Kart>
          ) : (
            <>
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {sonuc.ilanlar.map((ilan) => (
                  <IlanKarti key={ilan.id} ilan={ilan} />
                ))}
              </div>

              <div className="mt-6">
                <Kart>
                  <Sayfalama
                    sayfa={sonuc.sayfa}
                    sayfaSayisi={sonuc.sayfaSayisi}
                    temelYol="/"
                    parametreler={sayfaParametreleri}
                  />
                </Kart>
              </div>
            </>
          )}

          {sonuc.ilanlar.length > 0 && (
            <p className="mt-6 text-center text-sm text-metin-ikincil">
              Aradığınızı bulamadınız mı?{" "}
              <Link
                href="/hesabim/taleplerim/yeni"
                className="font-medium text-marka-600 hover:underline"
              >
                Kriterlerinizi kaydedin
              </Link>
              , uygun ilan düştüğünde haber verelim.
            </p>
          )}
        </section>
      </div>
    </>
  );
}
