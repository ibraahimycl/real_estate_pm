import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Gorunum = "birincil" | "ikincil" | "sessiz" | "tehlike" | "vurgu" | "ters";
type Boyut = "sm" | "md" | "lg";

const gorunumler: Record<Gorunum, string> = {
  birincil:
    "bg-marka-600 text-white hover:bg-marka-700 disabled:bg-marka-300 shadow-sm",
  ikincil:
    "bg-yuzey text-metin border border-cizgi-koyu hover:bg-yuzey-alt disabled:text-metin-silik",
  sessiz: "text-metin-ikincil hover:bg-yuzey-alt hover:text-metin",
  tehlike: "bg-hata-500 text-white hover:bg-hata-600 disabled:opacity-50",
  vurgu: "bg-vurgu-500 text-white hover:bg-vurgu-600 shadow-sm",
  // Koyu zemin üzerinde kullanılır (tanıtım bandı gibi). Ayrı bir görünüm
  // olarak tanımlandı: className ile bg/text ezmek Tailwind'de sınıf sırasına
  // bağlı olduğu için güvenilir değil — buton beyaz üstüne beyaz kalabiliyor.
  ters: "bg-transparent text-white border border-white/40 hover:bg-white/10",
};

const boyutlar: Record<Boyut, string> = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2",
};

function sinif(gorunum: Gorunum, boyut: Boyut, ek?: string) {
  return [
    "inline-flex items-center justify-center rounded-lg font-medium",
    "transition-colors disabled:cursor-not-allowed whitespace-nowrap",
    gorunumler[gorunum],
    boyutlar[boyut],
    ek ?? "",
  ].join(" ");
}

export function Buton({
  gorunum = "birincil",
  boyut = "md",
  className,
  ...props
}: ComponentProps<"button"> & { gorunum?: Gorunum; boyut?: Boyut }) {
  return <button className={sinif(gorunum, boyut, className)} {...props} />;
}

export function BagButon({
  gorunum = "birincil",
  boyut = "md",
  className,
  children,
  ...props
}: ComponentProps<typeof Link> & {
  gorunum?: Gorunum;
  boyut?: Boyut;
  children: ReactNode;
}) {
  return (
    <Link className={sinif(gorunum, boyut, className)} {...props}>
      {children}
    </Link>
  );
}
