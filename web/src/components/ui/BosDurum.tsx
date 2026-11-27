import type { ReactNode } from "react";

export function BosDurum({
  baslik,
  aciklama,
  eylem,
}: {
  baslik: string;
  aciklama?: string;
  eylem?: ReactNode;
}) {
  return (
    <div className="text-center py-14 px-6">
      <p className="font-medium text-metin">{baslik}</p>
      {aciklama && (
        <p className="text-sm text-metin-ikincil mt-1 max-w-md mx-auto">
          {aciklama}
        </p>
      )}
      {eylem && <div className="mt-5 flex justify-center">{eylem}</div>}
    </div>
  );
}
