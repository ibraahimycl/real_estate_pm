import type { Metadata } from "next";
import { gerektirGiris } from "@/lib/auth";
import { MusteriIlanFormu } from "./MusteriIlanFormu";

export const metadata: Metadata = { title: "Yeni İlan Oluştur" };

export default async function YeniMusteriIlaniSayfasi() {
  await gerektirGiris("/hesabim/ilanlarim/yeni");

  return (
    <>
      <h1 className="text-xl font-semibold text-metin">Yeni İlan Oluştur</h1>
      <p className="mt-1 mb-5 text-sm text-metin-ikincil">
        Satmak veya kiralamak istediğiniz mülkün bilgilerini doldurup emlakçı
        onayına gönderin.
      </p>
      <MusteriIlanFormu />
    </>
  );
}
