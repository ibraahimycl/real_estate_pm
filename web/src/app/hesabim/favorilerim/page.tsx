import type { Metadata } from "next";
import { gerektirGiris } from "@/lib/auth";
import { sunucuIstemcisi } from "@/lib/supabase/server";
import { IlanKarti } from "@/components/ilan/IlanKarti";
import { Kart } from "@/components/ui/Kart";
import { BosDurum } from "@/components/ui/BosDurum";
import { BagButon } from "@/components/ui/Buton";
import type { IlanPublic } from "@/types/database";

export const metadata: Metadata = { title: "Kaydettiğim İlanlar" };

export default async function FavorilerimSayfasi() {
  const profil = await gerektirGiris("/hesabim/favorilerim");
  const supabase = await sunucuIstemcisi();

  const { data: favoriler } = await supabase
    .from("favoriler")
    .select("emlak_id")
    .eq("profil_id", profil.id)
    .order("created_at", { ascending: false });

  const idler = ((favoriler ?? []) as { emlak_id: string }[]).map(
    (f) => f.emlak_id,
  );

  const { data: ilanlar } = idler.length
    ? await supabase.from("ilanlar_public").select("*").in("id", idler)
    : { data: [] };

  const liste = (ilanlar ?? []) as IlanPublic[];

  return (
    <>
      <h1 className="text-xl font-semibold text-metin">Kaydettiğim İlanlar</h1>
      <p className="mt-1 mb-5 text-sm text-metin-ikincil">
        Beğendiğiniz ilanlar. Kaydettiğiniz ilan sayısı, ilan sahibine toplam
        rakam olarak yansır; kimliğiniz paylaşılmaz.
      </p>

      {liste.length === 0 ? (
        <Kart>
          <BosDurum
            baslik="Henüz ilan kaydetmediniz"
            aciklama="İlan sayfasındaki 'İlanı kaydet' butonuyla beğendiğiniz ilanları buraya ekleyebilirsiniz."
            eylem={<BagButon href="/">İlanlara göz at</BagButon>}
          />
        </Kart>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {liste.map((ilan) => (
            <IlanKarti key={ilan.id} ilan={ilan} />
          ))}
        </div>
      )}
    </>
  );
}
