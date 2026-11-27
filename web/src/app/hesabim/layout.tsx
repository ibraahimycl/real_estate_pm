import Link from "next/link";
import { gerektirGiris, emlakciMi } from "@/lib/auth";
import { sunucuIstemcisi } from "@/lib/supabase/server";
import { Marka } from "@/components/Marka";
import { CikisButonu } from "@/components/CikisButonu";
import { PanelMenu, type MenuGrubu } from "@/components/panel/PanelMenu";
import { BagButon } from "@/components/ui/Buton";

/**
 * Müşteri hesabı kabuğu.
 * "İlanlarım", e-postası ilanın sahibiyle eşleşen kullanıcılar için
 * görünür; bu kullanıcılar ilanlarını DEĞİŞTİREMEZ, yalnızca etkileşim
 * rakamlarını görür.
 */
export default async function HesabimLayout({
  children,
}: LayoutProps<"/hesabim">) {
  const profil = await gerektirGiris();
  const supabase = await sunucuIstemcisi();

  const [{ count: ilanSayisi }, { count: okunmamis }] = await Promise.all([
    supabase
      .from("emlaklar")
      .select("id", { count: "exact", head: true })
      .eq("sahip_profil_id", profil.id),
    supabase
      .from("mesajlar")
      .select("id", { count: "exact", head: true })
      .eq("profil_id", profil.id)
      .eq("okundu", false),
  ]);

  const gruplar: MenuGrubu[] = [
    {
      baslik: "Hesabım",
      ogeler: [
        { yol: "/hesabim", etiket: "Özet" },
        { yol: "/hesabim/profilim", etiket: "Profil Bilgilerim" },
      ],
    },
    {
      baslik: "Aramalarım",
      ogeler: [
        { yol: "/hesabim/favorilerim", etiket: "Kaydettiğim İlanlar" },
        { yol: "/hesabim/taleplerim", etiket: "Taleplerim" },
        {
          yol: "/hesabim/mesajlarim",
          etiket: "Mesajlarım",
          rozet: okunmamis ?? 0,
        },
        { yol: "/hesabim/randevularim", etiket: "Randevularım" },
        { yol: "/hesabim/gorusmelerim", etiket: "AI Görüşmelerim" },
      ],
    },
    {
      baslik: "Mülklerim",
      ogeler: [
        {
          yol: "/hesabim/ilanlarim",
          etiket: "İlanlarım",
          rozet: ilanSayisi ?? 0,
        },
        { yol: "/hesabim/sozlesmelerim", etiket: "Sözleşmelerim" },
      ],
    },
  ];

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-cizgi bg-yuzey yazdirma-gizle">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
          <Marka />
          <div className="ml-auto flex items-center gap-3">
            {emlakciMi(profil) && (
              <BagButon href="/panel" gorunum="ikincil" boyut="sm">
                Yönetim paneli
              </BagButon>
            )}
            <Link
              href="/"
              className="text-sm text-metin-ikincil hover:text-marka-600"
            >
              İlanlar
            </Link>
            <CikisButonu />
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row">
        <aside className="hidden w-60 shrink-0 lg:block yazdirma-gizle">
          <div className="mb-4 rounded-kart border border-cizgi bg-yuzey p-4">
            <p className="font-medium text-metin">
              {profil.ad} {profil.soyad}
            </p>
            <p className="truncate text-xs text-metin-silik">{profil.eposta}</p>
          </div>
          <PanelMenu gruplar={gruplar} />
        </aside>

        <div className="lg:hidden">
          <div className="mb-4 overflow-x-auto rounded-kart border border-cizgi bg-yuzey p-2">
            <div className="min-w-max">
              <PanelMenu gruplar={gruplar} />
            </div>
          </div>
        </div>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
