import type { Metadata } from "next";
import { musteriSecenekleri } from "@/modules/musteri/queries";
import { SayfaBasligi } from "@/components/panel/SayfaBasligi";
import { Uyari } from "@/components/ui/Uyari";
import { BagButon } from "@/components/ui/Buton";
import { EmlakFormu } from "../EmlakFormu";

export const metadata: Metadata = { title: "Yeni İlan" };

export default async function YeniEmlakSayfasi({
  searchParams,
}: PageProps<"/panel/emlaklar/yeni">) {
  const sp = await searchParams;
  const sahip = typeof sp.sahip === "string" ? sp.sahip : undefined;
  const musteriler = await musteriSecenekleri();

  return (
    <>
      <SayfaBasligi
        baslik="Yeni İlan"
        aciklama="Müşteriye ait emlak kaydı. Kaydedildiğinde sistem, kriterleri tutan aktif müşteri taleplerini otomatik tarar."
      />

      {musteriler.length === 0 ? (
        <Uyari tur="uyari" baslik="Önce müşteri kaydı gerekiyor.">
          <p className="mb-3">
            Her emlak kaydı bir sahibe bağlanır. Lütfen önce emlağın sahibini
            müşteri olarak kaydedin.
          </p>
          <BagButon href="/panel/musteriler/yeni" boyut="sm">
            Müşteri kaydına git
          </BagButon>
        </Uyari>
      ) : (
        <div className="max-w-4xl">
          <EmlakFormu musteriler={musteriler} varsayilanSahip={sahip} />
        </div>
      )}
    </>
  );
}
