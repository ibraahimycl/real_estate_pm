"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type MenuOgesi = { yol: string; etiket: string; rozet?: number };
export type MenuGrubu = { baslik: string; ogeler: MenuOgesi[] };

export function PanelMenu({ gruplar }: { gruplar: MenuGrubu[] }) {
  const simdikiYol = usePathname();

  return (
    <nav className="space-y-6">
      {gruplar.map((grup) => (
        <div key={grup.baslik}>
          <p className="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-metin-silik">
            {grup.baslik}
          </p>
          <ul className="space-y-0.5">
            {grup.ogeler.map((oge) => {
              // /panel yalnızca tam eşleşmede aktif; diğerleri alt yollarda da.
              const aktif =
                oge.yol === "/panel"
                  ? simdikiYol === "/panel"
                  : simdikiYol.startsWith(oge.yol);
              return (
                <li key={oge.yol}>
                  <Link
                    href={oge.yol}
                    aria-current={aktif ? "page" : undefined}
                    className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                      aktif
                        ? "bg-marka-50 text-marka-700 font-medium"
                        : "text-metin-ikincil hover:bg-yuzey-alt hover:text-metin"
                    }`}
                  >
                    <span>{oge.etiket}</span>
                    {oge.rozet !== undefined && oge.rozet > 0 && (
                      <span className="rakam shrink-0 rounded-full bg-vurgu-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                        {oge.rozet}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
