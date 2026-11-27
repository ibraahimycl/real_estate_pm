import type { Metadata } from "next";
import { isyeriGetir } from "@/modules/isyeri/queries";
import { SayfaBasligi } from "@/components/panel/SayfaBasligi";
import { IsyeriFormu } from "./IsyeriFormu";

export const metadata: Metadata = { title: "İş Yeri Tanımı" };

/** Modül 1 — İş Yeri Tanımı ekranı. */
export default async function IsyeriSayfasi() {
  const ofis = await isyeriGetir();

  return (
    <>
      <SayfaBasligi
        baslik="İş Yeri Tanımı"
        aciklama="Programı kullanan emlak işletmesinin kimlik, adres ve iletişim bilgileri. Bu bilgiler ilan çıktılarında ve kira sözleşmelerinde kullanılır."
      />
      <div className="max-w-3xl">
        <IsyeriFormu ofis={ofis} />
      </div>
    </>
  );
}
