import { sayi } from "@/lib/bicim";

export type SutunSerisi = {
  anahtar: string;
  etiket: string;
  renk: string;
};

export type SutunKutugu = {
  etiket: string;
  tamEtiket: string;
  degerler: Record<string, number>;
};

/**
 * Gruplanmış sütun grafiği — bağımlılıksız satır içi SVG.
 *
 * Tasarım kuralları:
 *  · ince marklar, sütun uçları 4px yuvarlatılmış ve taban çizgisine oturur
 *  · bitişik sütunlar arasında 2px yüzey boşluğu (çerçeve yok)
 *  · ızgara ve eksenler saç teli kalınlığında, geri planda
 *  · iki seri olduğu için gösterge (legend) daima var
 *  · değer etiketi yalnızca son ayda; diğer değerler tablo görünümünde
 *  · her sütunda <title> ile yerel ipucu, klavyeyle de okunabilir
 */
export function SutunGrafigi({
  kutukler,
  seriler,
  birim,
  baslik,
}: {
  kutukler: SutunKutugu[];
  seriler: SutunSerisi[];
  birim?: string;
  baslik: string;
}) {
  const G = 760; // viewBox genişliği
  const Y = 200; // çizim yüksekliği
  const SOL = 44;
  const SAG = 8;
  const UST = 14;

  const tumDegerler = kutukler.flatMap((k) =>
    seriler.map((s) => k.degerler[s.anahtar] ?? 0),
  );
  const enBuyuk = Math.max(1, ...tumDegerler);
  // Üst sınırı okunur bir basamağa yuvarla
  const adim = Math.max(1, Math.ceil(enBuyuk / 4));
  const tavan = adim * 4;

  const cizimGenisligi = G - SOL - SAG;
  const grupGenisligi = cizimGenisligi / kutukler.length;
  const BOSLUK = 2; // seriler arası yüzey boşluğu
  const grupIcPay = Math.min(18, grupGenisligi * 0.22);
  const sutunGenisligi = Math.max(
    6,
    (grupGenisligi - grupIcPay * 2 - BOSLUK * (seriler.length - 1)) /
      seriler.length,
  );

  const yKonum = (deger: number) => UST + (Y - UST) * (1 - deger / tavan);

  /** Yalnızca üst köşeleri yuvarlatılmış sütun yolu. */
  function sutunYolu(x: number, y: number, g: number, yuk: number) {
    const r = Math.min(4, g / 2, Math.max(0, yuk));
    if (yuk <= 0) return "";
    return `M${x},${y + yuk} L${x},${y + r} Q${x},${y} ${x + r},${y} L${x + g - r},${y} Q${x + g},${y} ${x + g},${y + r} L${x + g},${y + yuk} Z`;
  }

  return (
    <figure className="m-0">
      <figcaption className="sr-only">{baslik}</figcaption>

      {/* Gösterge */}
      <ul className="mb-3 flex flex-wrap gap-4">
        {seriler.map((s) => (
          <li key={s.anahtar} className="flex items-center gap-1.5 text-xs text-metin-ikincil">
            <span
              className="h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: s.renk }}
              aria-hidden
            />
            {s.etiket}
          </li>
        ))}
      </ul>

      <svg
        viewBox={`0 0 ${G} ${Y + 26}`}
        className="w-full"
        role="img"
        aria-label={baslik}
      >
        {/* Izgara ve y ekseni etiketleri */}
        {Array.from({ length: 5 }, (_, i) => {
          const deger = (tavan / 4) * i;
          const y = yKonum(deger);
          return (
            <g key={i}>
              <line
                x1={SOL}
                x2={G - SAG}
                y1={y}
                y2={y}
                stroke="var(--color-cizgi)"
                strokeWidth={1}
              />
              <text
                x={SOL - 8}
                y={y + 4}
                textAnchor="end"
                className="fill-[var(--color-metin-silik)] text-[11px]"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {sayi(deger)}
              </text>
            </g>
          );
        })}

        {/* Sütunlar */}
        {kutukler.map((k, ki) => {
          const grupX = SOL + ki * grupGenisligi + grupIcPay;
          const sonAy = ki === kutukler.length - 1;

          return (
            <g key={k.etiket}>
              {seriler.map((s, si) => {
                const deger = k.degerler[s.anahtar] ?? 0;
                const x = grupX + si * (sutunGenisligi + BOSLUK);
                const y = yKonum(deger);
                const yuk = Y - y;

                return (
                  <g key={s.anahtar}>
                    <path
                      d={sutunYolu(x, y, sutunGenisligi, yuk)}
                      fill={s.renk}
                    >
                      <title>{`${k.tamEtiket} · ${s.etiket}: ${sayi(deger)}${birim ? ` ${birim}` : ""}`}</title>
                    </path>
                    {/* Değer etiketi yalnızca son ayda (seçici doğrudan etiketleme) */}
                    {sonAy && deger > 0 && (
                      <text
                        x={x + sutunGenisligi / 2}
                        y={y - 6}
                        textAnchor="middle"
                        className="fill-[var(--color-metin-ikincil)] text-[11px] font-medium"
                        style={{ fontVariantNumeric: "tabular-nums" }}
                      >
                        {sayi(deger)}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* x ekseni etiketi */}
              <text
                x={SOL + ki * grupGenisligi + grupGenisligi / 2}
                y={Y + 18}
                textAnchor="middle"
                className={
                  sonAy
                    ? "fill-[var(--color-metin)] text-[11px] font-medium"
                    : "fill-[var(--color-metin-silik)] text-[11px]"
                }
              >
                {k.etiket}
              </text>
            </g>
          );
        })}

        {/* Taban çizgisi */}
        <line
          x1={SOL}
          x2={G - SAG}
          y1={Y}
          y2={Y}
          stroke="var(--color-cizgi-koyu)"
          strokeWidth={1}
        />
      </svg>

      {/* Tablo görünümü — her değer grafik dışında da okunabilir olmalı */}
      <details className="mt-3">
        <summary className="cursor-pointer text-xs text-metin-silik hover:text-metin">
          Tablo görünümü
        </summary>
        <table className="mt-2 w-full text-xs">
          <thead>
            <tr>
              <th className="py-1 text-left font-medium text-metin-silik">Ay</th>
              {seriler.map((s) => (
                <th
                  key={s.anahtar}
                  className="py-1 text-right font-medium text-metin-silik"
                >
                  {s.etiket}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {kutukler.map((k) => (
              <tr key={k.etiket} className="border-t border-cizgi">
                <td className="py-1 text-metin-ikincil">{k.tamEtiket}</td>
                {seriler.map((s) => (
                  <td key={s.anahtar} className="rakam py-1 text-right text-metin">
                    {sayi(k.degerler[s.anahtar] ?? 0)}
                    {birim ? ` ${birim}` : ""}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
