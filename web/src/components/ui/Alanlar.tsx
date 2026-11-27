import type { ComponentProps, ReactNode } from "react";

const temelAlan =
  "w-full rounded-lg border bg-yuzey px-3 py-2 text-sm text-metin " +
  "placeholder:text-metin-silik transition-colors " +
  "disabled:bg-yuzey-alt disabled:text-metin-silik";

const normal = "border-cizgi-koyu focus:border-marka-500";
const hataliSinif = "border-hata-500 bg-hata-100/40";

/**
 * Form alanı sarmalayıcısı: etiket, zorunluluk işareti, yardım metni ve
 * hata mesajı. Hatalı alan kırmızı çerçeve ile işaretlenir
 * (FR-*-103 ve NFR-GEN-04 gereksinimleri).
 */
export function Alan({
  etiket,
  htmlFor,
  zorunlu,
  yardim,
  hata,
  children,
}: {
  etiket: string;
  htmlFor?: string;
  zorunlu?: boolean;
  yardim?: string;
  hata?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-metin">
        {etiket}
        {zorunlu && (
          <span className="text-hata-500 ml-0.5" aria-hidden>
            *
          </span>
        )}
      </label>
      {children}
      {hata ? (
        <p className="text-xs text-hata-600" role="alert">
          {hata}
        </p>
      ) : yardim ? (
        <p className="text-xs text-metin-silik">{yardim}</p>
      ) : null}
    </div>
  );
}

export function Girdi({
  hatali,
  className = "",
  ...props
}: ComponentProps<"input"> & { hatali?: boolean }) {
  return (
    <input
      className={`${temelAlan} ${hatali ? hataliSinif : normal} ${className}`}
      aria-invalid={hatali || undefined}
      {...props}
    />
  );
}

export function MetinAlani({
  hatali,
  className = "",
  ...props
}: ComponentProps<"textarea"> & { hatali?: boolean }) {
  return (
    <textarea
      className={`${temelAlan} ${hatali ? hataliSinif : normal} ${className}`}
      aria-invalid={hatali || undefined}
      {...props}
    />
  );
}

export function Secim({
  hatali,
  className = "",
  children,
  ...props
}: ComponentProps<"select"> & { hatali?: boolean }) {
  return (
    <select
      className={`${temelAlan} ${hatali ? hataliSinif : normal} ${className}`}
      aria-invalid={hatali || undefined}
      {...props}
    >
      {children}
    </select>
  );
}

export function OnayKutusu({
  etiket,
  className = "",
  ...props
}: ComponentProps<"input"> & { etiket: string }) {
  return (
    <label
      className={`flex items-center gap-2 text-sm text-metin cursor-pointer ${className}`}
    >
      <input
        type="checkbox"
        className="h-4 w-4 rounded border-cizgi-koyu accent-marka-600"
        {...props}
      />
      {etiket}
    </label>
  );
}
