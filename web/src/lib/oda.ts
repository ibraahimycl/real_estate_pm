/**
 * ODA SAYISI YARDIMCILARI
 *
 * Oda sayısı "<oda>+<salon>" biçiminde tutulur (3+1 gibi). Sabit bir liste
 * yerine biçim doğrulaması yapılır; böylece 7+3 gibi sıra dışı kombinasyonlar
 * da hem ilan kaydında hem aramada kullanılabilir.
 * Aynı kural veri tabanında CHECK kısıtı olarak da tanımlıdır.
 */

/** Filtre ve formlarda kutucuk olarak sunulan yaygın kombinasyonlar. */
export const ODA_ON_TANIMLI = [
  "1+0", "1+1", "2+1", "3+1", "3+2", "4+1", "4+2", "5+1", "5+2",
] as const;

/** Oda/salon sayısıyla ifade edilemeyen özel değerler. */
export const ODA_OZEL = ["Stüdyo", "Diğer"] as const;

export const ODA_BICIMI = /^([1-9][0-9]?)\+([0-9]|[1-9][0-9])$/;

export function odaSayisiGecerli(deger: string): boolean {
  return ODA_BICIMI.test(deger) || (ODA_OZEL as readonly string[]).includes(deger);
}

/** İki sayıdan "3+1" üretir; eksik/geçersiz girişte null döner. */
export function odaBirlestir(
  oda: number | null | undefined,
  salon: number | null | undefined,
): string | null {
  if (oda === null || oda === undefined) return null;
  const s = salon ?? 0;
  if (!Number.isInteger(oda) || !Number.isInteger(s)) return null;
  if (oda < 1 || oda > 99 || s < 0 || s > 99) return null;
  return `${oda}+${s}`;
}

/** "3+1" değerini parçalarına ayırır; özel değerlerde null döner. */
export function odaAyir(deger: string | null | undefined): {
  oda: number | null;
  salon: number | null;
} {
  const eslesme = deger ? ODA_BICIMI.exec(deger) : null;
  if (!eslesme) return { oda: null, salon: null };
  return { oda: Number(eslesme[1]), salon: Number(eslesme[2]) };
}
