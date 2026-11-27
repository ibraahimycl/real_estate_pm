import type { Metadata } from "next";
import { gerektirGiris } from "@/lib/auth";
import { TalepFormu } from "./TalepFormu";

export const metadata: Metadata = { title: "Yeni Talep" };

export default async function YeniTalepSayfasi() {
  const profil = await gerektirGiris("/hesabim/taleplerim/yeni");

  return (
    <>
      <h1 className="text-xl font-semibold text-metin">Yeni Talep Oluştur</h1>
      <p className="mt-1 mb-5 max-w-2xl text-sm text-metin-ikincil">
        Aradığınız yeri tarif edin. Portföyümüze uyan bir ilan girildiğinde
        sistem sizi otomatik olarak eşleştirip haber verir.
      </p>
      <div className="max-w-3xl">
        <TalepFormu
          adSoyad={`${profil.ad} ${profil.soyad}`}
          telefon={profil.cep_telefon}
          eposta={profil.eposta}
        />
      </div>
    </>
  );
}
