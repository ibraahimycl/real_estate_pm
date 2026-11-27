import type { ReactNode } from "react";

type Tur = "bilgi" | "basari" | "uyari" | "hata";

const tonlar: Record<Tur, string> = {
  bilgi: "bg-marka-50 border-marka-100 text-marka-700",
  basari: "bg-basari-100 border-basari-100 text-basari-600",
  uyari: "bg-uyari-100 border-uyari-100 text-uyari-600",
  hata: "bg-hata-100 border-hata-100 text-hata-600",
};

export function Uyari({
  tur = "bilgi",
  baslik,
  children,
}: {
  tur?: Tur;
  baslik?: string;
  children?: ReactNode;
}) {
  return (
    <div
      className={`rounded-lg border px-4 py-3 text-sm ${tonlar[tur]}`}
      role={tur === "hata" ? "alert" : "status"}
    >
      {baslik && <p className="font-semibold">{baslik}</p>}
      {children && <div className={baslik ? "mt-0.5" : ""}>{children}</div>}
    </div>
  );
}
