import type { ReactNode } from "react";

export function SayfaBasligi({
  baslik,
  aciklama,
  eylem,
}: {
  baslik: string;
  aciklama?: string;
  eylem?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
      <div>
        <h1 className="text-xl font-semibold text-metin">{baslik}</h1>
        {aciklama && (
          <p className="text-sm text-metin-ikincil mt-1 max-w-2xl">{aciklama}</p>
        )}
      </div>
      {eylem && <div className="flex gap-2 yazdirma-gizle">{eylem}</div>}
    </div>
  );
}
