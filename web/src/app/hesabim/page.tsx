import Link from "next/link";
import type { Metadata } from "next";
import { gerektirGiris } from "@/lib/auth";
import { sunucuIstemcisi } from "@/lib/supabase/server";
import { Kart, KartGovde } from "@/components/ui/Kart";
import { KpiKarti } from "@/components/panel/KpiKarti";
import { BagButon } from "@/components/ui/Buton";
import { sayi } from "@/lib/bicim";

export const metadata: Metadata = { title: "Hesabım" };

export default async function HesabimSayfasi() {
  const profil = await gerektirGiris();
  const supabase = await sunucuIstemcisi();

  const [
    { count: favori },
    { count: talep },
    { count: randevu },
    { count: ilan },
    { count: mesaj },
  ] = await Promise.all([
    supabase
      .from("favoriler")
      .select("emlak_id", { count: "exact", head: true })
      .eq("profil_id", profil.id),
    supabase
      .from("talepler")
      .select("id", { count: "exact", head: true })
      .eq("profil_id", profil.id)
      .eq("durum", "aktif"),
    supabase
      .from("randevular")
      .select("id", { count: "exact", head: true })
      .eq("profil_id", profil.id),
    supabase
      .from("emlaklar")
      .select("id", { count: "exact", head: true })
      .eq("sahip_profil_id", profil.id),
    supabase
      .from("mesajlar")
      .select("id", { count: "exact", head: true })
      .eq("profil_id", profil.id)
      .eq("okundu", false),
  ]);

  return (
    <>
      <h1 className="text-xl font-semibold text-metin">
        Merhaba {profil.ad},
      </h1>
      <p className="mt-1 text-sm text-metin-ikincil">
        Kaydettiğiniz ilanları, taleplerinizi ve randevularınızı buradan takip
        edebilirsiniz.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiKarti
          etiket="Kaydettiğim ilan"
          deger={sayi(favori ?? 0)}
          dipnot={
            <Link href="/hesabim/favorilerim" className="hover:text-marka-600">
              Listeye git →
            </Link>
          }
        />
        <KpiKarti
          etiket="Aktif talebim"
          deger={sayi(talep ?? 0)}
          dipnot={
            <Link href="/hesabim/taleplerim" className="hover:text-marka-600">
              Taleplerime git →
            </Link>
          }
        />
        <KpiKarti
          etiket="Randevu talebim"
          deger={sayi(randevu ?? 0)}
          dipnot={
            <Link href="/hesabim/randevularim" className="hover:text-marka-600">
              Randevularıma git →
            </Link>
          }
        />
        <KpiKarti
          etiket="Okunmamış mesaj"
          deger={sayi(mesaj ?? 0)}
          dipnot={
            <Link href="/hesabim/mesajlarim" className="hover:text-marka-600">
              Mesajlarıma git →
            </Link>
          }
        />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Kart>
          <KartGovde>
            <h2 className="font-semibold text-metin">Aradığınızı bulamadınız mı?</h2>
            <p className="mt-1 text-sm text-metin-ikincil">
              Kriterlerinizi kaydedin; portföyümüze uyan bir ilan girildiğinde
              size haber verelim. İsterseniz AI danışmanımızla konuşarak da
              talep bırakabilirsiniz.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <BagButon href="/hesabim/taleplerim/yeni">Talep oluştur</BagButon>
              <BagButon href="/ai-danisman" gorunum="ikincil">
                AI danışmana sor
              </BagButon>
            </div>
          </KartGovde>
        </Kart>

        {(ilan ?? 0) > 0 && (
          <Kart>
            <KartGovde>
              <h2 className="font-semibold text-metin">Mülkleriniz</h2>
              <p className="mt-1 text-sm text-metin-ikincil">
                Emlak ofisine verdiğiniz{" "}
                <strong className="text-metin">{ilan}</strong> ilan var. İlan
                metinlerini danışmanınız yönetir; siz ilanlarınızın kaç kez
                görüntülendiğini ve kaç kişi tarafından kaydedildiğini
                izleyebilirsiniz.
              </p>
              <div className="mt-4">
                <BagButon href="/hesabim/ilanlarim" gorunum="ikincil">
                  İlanlarımı gör
                </BagButon>
              </div>
            </KartGovde>
          </Kart>
        )}
      </div>
    </>
  );
}
