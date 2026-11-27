import Link from "next/link";
import { Marka } from "@/components/Marka";
import { oturumProfili, emlakciMi } from "@/lib/auth";
import { CikisButonu } from "@/components/CikisButonu";
import { BagButon } from "@/components/ui/Buton";
import { isyeriGetir } from "@/modules/isyeri/queries";
import { telefon } from "@/lib/bicim";

export default async function PublicLayout({ children }: LayoutProps<"/">) {
  const [profil, ofis] = await Promise.all([oturumProfili(), isyeriGetir()]);
  const yonetici = emlakciMi(profil);

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 border-b border-cizgi bg-yuzey/95 backdrop-blur yazdirma-gizle">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
          <Marka />

          <nav className="ml-auto hidden items-center gap-1 sm:flex">
            <Link
              href="/"
              className="rounded-lg px-3 py-2 text-sm text-metin-ikincil hover:bg-yuzey-alt hover:text-metin"
            >
              İlanlar
            </Link>
            <Link
              href="/ai-danisman"
              className="rounded-lg px-3 py-2 text-sm text-metin-ikincil hover:bg-yuzey-alt hover:text-metin"
            >
              AI Danışman
            </Link>
          </nav>

          <div className="ml-auto flex items-center gap-2 sm:ml-0">
            {profil ? (
              <>
                {yonetici && (
                  <BagButon href="/panel" gorunum="ikincil" boyut="sm">
                    Panel
                  </BagButon>
                )}
                <BagButon href="/hesabim" gorunum="sessiz" boyut="sm">
                  {profil.ad}
                </BagButon>
                <CikisButonu className="hidden sm:block" />
              </>
            ) : (
              <>
                <BagButon href="/giris" gorunum="sessiz" boyut="sm">
                  Giriş
                </BagButon>
                <BagButon href="/kayit" boyut="sm">
                  Kayıt Ol
                </BagButon>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-cizgi bg-yuzey yazdirma-gizle">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:grid-cols-3 sm:px-6">
          <div>
            <Marka boyut="sm" />
            <p className="mt-3 text-sm text-metin-ikincil leading-relaxed">
              {ofis?.unvan ?? "Başkent Emlak"} — portföy, talep ve randevu
              yönetimini tek sistemde toplayan emlak platformu.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-metin">İletişim</p>
            {ofis ? (
              <address className="mt-2 text-sm not-italic text-metin-ikincil leading-relaxed">
                {ofis.adres}
                <br />
                {ofis.ilce} / {ofis.il}
                <br />
                <span className="rakam">{telefon(ofis.telefon)}</span>
                <br />
                {ofis.eposta}
              </address>
            ) : (
              <p className="mt-2 text-sm text-metin-silik">
                İş yeri bilgileri henüz tanımlanmadı.
              </p>
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-metin">Bağlantılar</p>
            <ul className="mt-2 space-y-1.5 text-sm text-metin-ikincil">
              <li>
                <Link href="/" className="hover:text-marka-600">
                  Tüm ilanlar
                </Link>
              </li>
              <li>
                <Link href="/ai-danisman" className="hover:text-marka-600">
                  AI danışman ile görüş
                </Link>
              </li>
              <li>
                <Link href="/hesabim/taleplerim" className="hover:text-marka-600">
                  Talep bırak
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-cizgi px-4 py-4 text-center text-xs text-metin-silik sm:px-6">
          © {new Date().getFullYear()} {ofis?.unvan ?? "Başkent Emlak"} · Tüm
          hakları saklıdır.
        </div>
      </footer>
    </div>
  );
}
