import Link from "next/link";

export function Marka({
  boyut = "md",
  href = "/",
}: {
  boyut?: "sm" | "md" | "lg";
  href?: string;
}) {
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
        BE
      </span>
      <span className="leading-tight">
        <span className={`block font-semibold text-metin ${olcu.yazi}`}>
          Başkent Emlak
        </span>
        <span className="block text-[11px] text-metin-silik">
          Emlak Yönetim Platformu
        </span>
      </span>
    </Link>
  );
}
