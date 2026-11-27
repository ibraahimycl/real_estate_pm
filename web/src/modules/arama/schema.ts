import { odaBirlestir } from "@/lib/oda";
import type { EmlakTuru, IslemTuru, OdaSayisi } from "@/types/database";

/**
 * Modül 4 — Emlak Arama filtre modeli.
 * URL arama parametrelerinden okunur; böylece arama sonucu paylaşılabilir
 * ve tarayıcı geri tuşu beklendiği gibi çalışır.
 */
export type AramaFiltresi = {
  islem_turu?: IslemTuru;
  emlak_turu?: EmlakTuru;
  il?: string;
  ilce?: string;
  min_fiyat?: number;
  max_fiyat?: number;
  min_m2?: number;
  oda_sayilari?: OdaSayisi[];
  max_bina_yasi?: number;
  asansor?: boolean;
  otopark?: boolean;
  esyali?: boolean;
  site_icinde?: boolean;
  krediye_uygun?: boolean;
  siralama?: "yeni" | "fiyat_artan" | "fiyat_azalan" | "m2_azalan";
  sayfa?: number;
};

type Parametreler = Record<string, string | string[] | undefined>;

function tek(p: Parametreler, ad: string): string | undefined {
  const d = p[ad];
  const v = Array.isArray(d) ? d[0] : d;
  return v && v.trim() !== "" ? v.trim() : undefined;
}

function tamsayi(p: Parametreler, ad: string): number | undefined {
  const v = tek(p, ad);
  if (v === undefined) return undefined;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

function bayrak(p: Parametreler, ad: string): boolean | undefined {
  return tek(p, ad) === "1" ? true : undefined;
}

/** URL parametrelerini doğrulanmış filtre nesnesine çevirir. */
export function filtreyiOku(p: Parametreler): AramaFiltresi {
  const odalar = p.oda;
  const secilenler = (
    Array.isArray(odalar) ? odalar : odalar ? [odalar] : []
  ) as OdaSayisi[];

  // Kutucuklarda olmayan kombinasyonlar (örn. 7+3) elle girilebilir.
  const elle = odaBirlestir(tamsayi(p, "oda_n") ?? null, tamsayi(p, "salon_n") ?? 0);
  const oda_sayilari = elle && !secilenler.includes(elle)
    ? [...secilenler, elle]
    : secilenler;

  const islem = tek(p, "islem");
  const tur = tek(p, "tur");
  const siralama = tek(p, "sirala");

  return {
    islem_turu:
      islem === "kiralik" || islem === "satilik" ? islem : undefined,
    emlak_turu: tur as EmlakTuru | undefined,
    il: tek(p, "il"),
    ilce: tek(p, "ilce"),
    min_fiyat: tamsayi(p, "min_fiyat"),
    max_fiyat: tamsayi(p, "max_fiyat"),
    min_m2: tamsayi(p, "min_m2"),
    oda_sayilari: oda_sayilari.length ? oda_sayilari : undefined,
    max_bina_yasi: tamsayi(p, "max_bina_yasi"),
    asansor: bayrak(p, "asansor"),
    otopark: bayrak(p, "otopark"),
    esyali: bayrak(p, "esyali"),
    site_icinde: bayrak(p, "site_icinde"),
    krediye_uygun: bayrak(p, "krediye_uygun"),
    siralama:
      siralama === "fiyat_artan" ||
      siralama === "fiyat_azalan" ||
      siralama === "m2_azalan"
        ? siralama
        : "yeni",
    sayfa: tamsayi(p, "sayfa") || 1,
  };
}

/** Filtrede en az bir kriter seçilmiş mi? */
export function filtreDolu(f: AramaFiltresi): boolean {
  return Boolean(
    f.islem_turu ||
      f.emlak_turu ||
      f.il ||
      f.ilce ||
      f.min_fiyat ||
      f.max_fiyat ||
      f.min_m2 ||
      f.oda_sayilari?.length ||
      f.max_bina_yasi ||
      f.asansor ||
      f.otopark ||
      f.esyali ||
      f.site_icinde ||
      f.krediye_uygun,
  );
}
