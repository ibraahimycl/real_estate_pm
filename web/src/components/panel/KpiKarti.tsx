import type { ReactNode } from "react";

/**
 * KPI kartı (stat tile).
 * Değer, büyük puntoda orantılı rakamlarla yazılır — tabular-nums yalnızca
 * sütun hâlinde hizalanan rakamlarda kullanılır (tablolar, eksen etiketleri).
 */
export function KpiKarti({
  etiket,
  deger,
  fark,
  farkEtiketi,
  yukariIyi = true,
  dipnot,
}: {
  etiket: string;
  deger: string;
  fark?: number;
  farkEtiketi?: string;
  yukariIyi?: boolean;
  dipnot?: ReactNode;
}) {
  const farkVar = fark !== undefined && fark !== 0;
  const iyiMi = farkVar && (fark > 0) === yukariIyi;

  return (
    <div className="rounded-kart border border-cizgi bg-yuzey p-4">
      <p className="text-xs text-metin-ikincil">{etiket}</p>
      <p className="mt-1.5 text-2xl font-semibold leading-none text-metin">
        {deger}
      </p>

      {farkVar && (
        <p
          className={`mt-2 text-xs font-medium ${
            iyiMi ? "text-basari-600" : "text-hata-600"
          }`}
        >
          {fark > 0 ? "▲" : "▼"} {Math.abs(fark)}
          {farkEtiketi && (
            <span className="font-normal text-metin-silik"> {farkEtiketi}</span>
          )}
        </p>
      )}

      {!farkVar && dipnot && (
        <p className="mt-2 text-xs text-metin-silik">{dipnot}</p>
      )}
    </div>
  );
}
