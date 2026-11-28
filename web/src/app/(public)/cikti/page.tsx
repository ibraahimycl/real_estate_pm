import type { Metadata } from "next";
import { tumIlanlariAra } from "@/modules/arama/queries";
import { filtreyiOku } from "@/modules/arama/schema";
import { isyeriGetir } from "@/modules/isyeri/queries";
import { ListeCiktiBelgesi } from "@/components/ilan/ListeCiktiBelgesi";

export const metadata: Metadata = { title: "İlan Listesi Çıktısı" };

function sorguDizisi(sp: Record<string, string | string[] | undefined>): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (k === "sayfa") continue;
    if (typeof v === "string" && v !== "") params.set(k, v);
    else if (Array.isArray(v)) {
      for (const item of v) if (item !== "") params.append(k, item);
    }
  }
  const s = params.toString();
  return s ? `/?${s}` : "/";
}

export default async function PublicListeCiktiSayfasi({
  searchParams,
}: PageProps<"/cikti">) {
  const sp = await searchParams;
  const filtre = filtreyiOku(sp);
  const [ilanlar, ofis] = await Promise.all([
    tumIlanlariAra(filtre),
    isyeriGetir(),
  ]);

  return (
    <ListeCiktiBelgesi
      ilanlar={ilanlar}
      filtre={filtre}
      ofis={ofis}
      donusYolu={sorguDizisi(sp)}
      donusEtiketi="← İlanlara dön"
    />
  );
}
