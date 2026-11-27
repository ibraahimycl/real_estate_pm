import type { Metadata } from "next";
import { sozlesmeyeUygunIlanlar } from "@/modules/sozlesme/queries";
import { musteriSecenekleri } from "@/modules/musteri/queries";
import { SayfaBasligi } from "@/components/panel/SayfaBasligi";
import { Uyari } from "@/components/ui/Uyari";
import { SozlesmeFormu } from "./SozlesmeFormu";

export const metadata: Metadata = { title: "Yeni Sözleşme" };

export default async function YeniSozlesmeSayfasi() {
  const [ilanlar, musteriler] = await Promise.all([
    sozlesmeyeUygunIlanlar(),
    musteriSecenekleri(),
  ]);

  return (
    <>
      <SayfaBasligi
        baslik="Yeni Kira Sözleşmesi"
        aciklama="Taslak oluşturulur, ardından hem danışman hem müşteri onayladığında sözleşme imzalanmış sayılır ve çıktısı alınabilir."
      />

      {ilanlar.length === 0 ? (
        <Uyari tur="uyari" baslik="Uygun ilan yok">
          Sözleşme açılabilmesi için kiralık ve henüz kiralanmamış bir ilan
          gerekir.
        </Uyari>
      ) : (
        <div className="max-w-3xl">
          <SozlesmeFormu ilanlar={ilanlar} musteriler={musteriler} />
        </div>
      )}
    </>
  );
}
