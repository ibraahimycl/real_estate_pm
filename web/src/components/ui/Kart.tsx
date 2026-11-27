import type { ReactNode } from "react";

export function Kart({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-yuzey border border-cizgi rounded-kart shadow-[0_1px_2px_rgba(28,27,24,0.04)] ${className}`}
    >
      {children}
    </div>
  );
}

export function KartBaslik({
  baslik,
  aciklama,
  eylem,
}: {
  baslik: string;
  aciklama?: string;
  eylem?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-cizgi">
      <div>
        <h2 className="font-semibold text-metin">{baslik}</h2>
        {aciklama && (
          <p className="text-sm text-metin-ikincil mt-0.5">{aciklama}</p>
        )}
      </div>
      {eylem}
    </div>
  );
}

export function KartGovde({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`p-5 ${className}`}>{children}</div>;
}
