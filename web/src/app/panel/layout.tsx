import { gerektirEmlakci } from "@/lib/auth";
import { sunucuIstemcisi } from "@/lib/supabase/server";
import { Marka } from "@/components/Marka";
import { CikisButonu } from "@/components/CikisButonu";
import { PanelMenu, type MenuGrubu } from "@/components/panel/PanelMenu";
import { ROL } from "@/lib/etiketler";
import Link from "next/link";

/**
 * Emlakçı paneli kabuğu.
 * Yetki kontrolü burada yapılır: emlakci/yonetici olmayan kullanıcı
 * /hesabim'a yönlendirilir (proxy.ts'teki kontrol yalnızca iyimser bir
 * ön elemedir, asıl kapı burasıdır).
 */
export default async function PanelLayout({ children }: LayoutProps<"/panel">) {
  const profil = await gerektirEmlakci();
  const supabase = await sunucuIstemcisi();

  // Menüdeki bekleyen iş rozetleri
  const [{ count: bekleyenRandevu }, { count: okunmamisMesaj }] =
    await Promise.all([
      supabase
        .from("randevular")
        .select("id", { count: "exact", head: true })
        .eq("durum", "talep"),
      supabase
        .from("mesajlar")
        .select("id", { count: "exact", head: true })
        .eq("okundu", false),
    ]);

  const gruplar: MenuGrubu[] = [
    {
      baslik: "Genel",
      ogeler: [{ yol: "/panel", etiket: "Genel Bakış" }],
    },
    {
      baslik: "Tanımlar",
      ogeler: [
        { yol: "/panel/isyeri", etiket: "İş Yeri Tanımı" },
        { yol: "/panel/musteriler", etiket: "Müşteri Tanımı" },
        { yol: "/panel/emlaklar", etiket: "Emlak Tanımı" },
      ],
    },
    {
      baslik: "İşlemler",
      ogeler: [
        { yol: "/panel/arama", etiket: "Emlak Arama" },
        { yol: "/panel/talepler", etiket: "Müşteri Talepleri" },
        { yol: "/panel/talep-analizi", etiket: "Talep Analizi" },
        {
          yol: "/panel/randevular",
          etiket: "Randevular",
          rozet: bekleyenRandevu ?? 0,
        },
        {
          yol: "/panel/mesajlar",
          etiket: "AI Mesajları",
          rozet: okunmamisMesaj ?? 0,
        },
        { yol: "/panel/gorusmeler", etiket: "AI Görüşmeleri" },
        { yol: "/panel/sozlesmeler", etiket: "Sözleşmeler" },
      ],
    },
  ];

  return (
    <div className="flex min-h-dvh">
      {/* Yan menü */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-cizgi bg-yuzey yazdirma-gizle">
        <div className="px-5 py-5 border-b border-cizgi">
          <Marka boyut="sm" href="/panel" />
        </div>
        <div className="flex-1 overflow-y-auto px-2 py-4">
          <PanelMenu gruplar={gruplar} />
        </div>
        <div className="border-t border-cizgi px-5 py-4">
          <p className="text-sm font-medium text-metin truncate">
            {profil.ad} {profil.soyad}
          </p>
          <p className="text-xs text-metin-silik mb-2">{ROL[profil.rol]}</p>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-sm text-metin-ikincil hover:text-marka-600"
            >
              Siteyi gör
            </Link>
            <span className="text-cizgi-koyu">·</span>
            <CikisButonu />
          </div>
        </div>
      </aside>

      {/* Küçük ekran üst çubuğu */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="lg:hidden flex items-center justify-between gap-3 border-b border-cizgi bg-yuzey px-4 py-3 yazdirma-gizle">
          <Marka boyut="sm" href="/panel" />
          <CikisButonu />
        </header>
        <div className="lg:hidden border-b border-cizgi bg-yuzey px-2 py-2 overflow-x-auto yazdirma-gizle">
          <div className="min-w-max">
            <PanelMenu gruplar={gruplar} />
          </div>
        </div>

        <main className="flex-1 px-4 py-6 sm:px-8 sm:py-8 max-w-7xl w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
