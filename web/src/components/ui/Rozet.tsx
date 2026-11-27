import type { ReactNode } from "react";

type Ton = "notr" | "marka" | "basari" | "uyari" | "hata" | "vurgu";

const tonlar: Record<Ton, string> = {
  notr: "bg-yuzey-alt text-metin-ikincil border-cizgi-koyu",
  marka: "bg-marka-50 text-marka-700 border-marka-100",
  basari: "bg-basari-100 text-basari-600 border-basari-100",
  uyari: "bg-uyari-100 text-uyari-600 border-uyari-100",
  hata: "bg-hata-100 text-hata-600 border-hata-100",
  vurgu: "bg-vurgu-100 text-vurgu-600 border-vurgu-100",
};

export function Rozet({
  children,
  ton = "notr",
}: {
  children: ReactNode;
  ton?: Ton;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${tonlar[ton]}`}
    >
      {children}
    </span>
  );
}

/** Emlak durumuna göre uygun renk tonu. */
export function durumTonu(durum: string): Ton {
  switch (durum) {
    case "aktif":
      return "basari";
    case "rezerve":
      return "uyari";
    case "kiralandi":
    case "satildi":
    case "imzalandi":
    case "tamamlandi":
      return "marka";
    case "pasif":
    case "iptal":
    case "kapandi":
      return "notr";
    case "talep":
    case "taslak":
      return "vurgu";
    default:
      return "notr";
  }
}
