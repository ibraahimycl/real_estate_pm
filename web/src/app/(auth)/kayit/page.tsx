import Link from "next/link";
import type { Metadata } from "next";
import { KayitFormu } from "./KayitFormu";

export const metadata: Metadata = { title: "Kayıt Ol" };

export default function KayitSayfasi() {
  return (
    <>
      <h1 className="text-2xl font-semibold text-metin">Hesap oluştur</h1>
      <p className="text-sm text-metin-ikincil mt-1 mb-7">
        İlanları kaydedin, randevu talebi oluşturun ve aradığınız kriterlere
        uygun ilan düştüğünde haberdar olun.
      </p>

      <KayitFormu />

      <p className="text-sm text-metin-ikincil mt-6 text-center">
        Zaten hesabınız var mı?{" "}
        <Link href="/giris" className="text-marka-600 font-medium hover:underline">
          Giriş yapın
        </Link>
      </p>
    </>
  );
}
