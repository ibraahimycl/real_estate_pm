import type { Metadata } from "next";
import { gerektirGiris } from "@/lib/auth";
import { ProfilFormu } from "./ProfilFormu";

export const metadata: Metadata = { title: "Profil Bilgilerim" };

export default async function ProfilimSayfasi() {
  const profil = await gerektirGiris("/hesabim/profilim");

  return (
    <>
      <h1 className="text-xl font-semibold text-metin">Profil Bilgilerim</h1>
      <p className="mt-1 mb-5 text-sm text-metin-ikincil">
        İletişim bilgileriniz, randevu ve sözleşme işlemlerinde kullanılır.
      </p>
      <div className="max-w-3xl">
        <ProfilFormu profil={profil} />
      </div>
    </>
  );
}
