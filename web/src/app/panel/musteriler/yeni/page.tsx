import type { Metadata } from "next";
import { SayfaBasligi } from "@/components/panel/SayfaBasligi";
import { MusteriFormu } from "../MusteriFormu";

export const metadata: Metadata = { title: "Yeni Müşteri" };

export default function YeniMusteriSayfasi() {
  return (
    <>
      <SayfaBasligi
        baslik="Yeni Müşteri"
        aciklama="Zorunlu senaryonun ilk adımı: emlak girişi yapabilmek için önce sahibinin müşteri kaydı oluşturulur."
      />
      <div className="max-w-3xl">
        <MusteriFormu />
      </div>
    </>
  );
}
