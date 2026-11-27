import Link from "next/link";
import type { Metadata } from "next";
import { GirisFormu } from "./GirisFormu";

export const metadata: Metadata = { title: "Giriş Yap" };

export default async function GirisSayfasi({ searchParams }: PageProps<"/giris">) {
  const { devam } = await searchParams;

  return (
    <>
      <h1 className="text-2xl font-semibold text-metin">Giriş yap</h1>
      <p className="text-sm text-metin-ikincil mt-1 mb-7">
        Hesabınıza girerek ilanlarınızı, taleplerinizi ve randevularınızı
        yönetin.
      </p>

      <GirisFormu devam={typeof devam === "string" ? devam : undefined} />

      <p className="text-sm text-metin-ikincil mt-6 text-center">
        Hesabınız yok mu?{" "}
        <Link href="/kayit" className="text-marka-600 font-medium hover:underline">
          Kayıt olun
        </Link>
      </p>
    </>
  );
}
