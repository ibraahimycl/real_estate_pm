import Link from "next/link";

const VARSAYILAN_AD = "Başkent Emlak";

function basHarfler(ad: string): string {
  const kelimeler = ad.trim().split(/\s+/).filter(Boolean);
  if (kelimeler.length >= 2) {
    return (kelimeler[0][0] + kelimeler[1][0]).toLocaleUpperCase("tr-TR");
  }
  return (kelimeler[0]?.slice(0, 2) || "BE").toLocaleUpperCase("tr-TR");
}

export function Marka({
  boyut = "md",
  href = "/",
  unvan,
}: {
  boyut?: "sm" | "md" | "lg";
  href?: string;
  unvan?: string | null;
}) {
  const ad = unvan?.trim() || VARSAYILAN_AD;
  const olcu = {
    sm: { kutu: "h-7 w-7 text-[11px]", yazi: "text-sm" },
    md: { kutu: "h-9 w-9 text-xs", yazi: "text-base" },
    lg: { kutu: "h-11 w-11 text-sm", yazi: "text-lg" },
  }[boyut];

  return (
    <Link href={href} className="inline-flex items-center gap-2.5 group">
      <span
        className={`${olcu.kutu} grid place-items-center rounded-lg bg-marka-600 text-white font-bold tracking-tight shrink-0`}
        aria-hidden
      >
        {basHarfler(ad)}
      </span>
      <span className="leading-tight">
        <span className={`block font-semibold text-metin ${olcu.yazi}`}>
          {ad}
        </span>
        <span className="block text-[11px] text-metin-silik">
          Emlak Yönetim Platformu
        </span>
      </span>
    </Link>
  );
}
