import Link from "next/link";

export function Sayfalama({
  sayfa,
  sayfaSayisi,
  temelYol,
  parametreler = {},
}: {
  sayfa: number;
  sayfaSayisi: number;
  temelYol: string;
  parametreler?: Record<string, string | undefined>;
}) {
  if (sayfaSayisi <= 1) return null;

  const yol = (hedef: number) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(parametreler)) if (v) p.set(k, v);
    if (hedef > 1) p.set("sayfa", String(hedef));
    const q = p.toString();
    return q ? `${temelYol}?${q}` : temelYol;
  };

  const bag =
    "px-3 py-1.5 rounded-lg border border-cizgi-koyu text-sm hover:bg-yuzey-alt transition-colors";
  const pasif = "px-3 py-1.5 rounded-lg border border-cizgi text-sm text-metin-silik";

  return (
    <div className="flex items-center justify-between gap-4 px-5 py-3 border-t border-cizgi yazdirma-gizle">
      {sayfa > 1 ? (
        <Link href={yol(sayfa - 1)} className={bag}>
          ← Önceki
        </Link>
      ) : (
        <span className={pasif}>← Önceki</span>
      )}
      <span className="text-sm text-metin-ikincil rakam">
        Sayfa {sayfa} / {sayfaSayisi}
      </span>
      {sayfa < sayfaSayisi ? (
        <Link href={yol(sayfa + 1)} className={bag}>
          Sonraki →
        </Link>
      ) : (
        <span className={pasif}>Sonraki →</span>
      )}
    </div>
  );
}
