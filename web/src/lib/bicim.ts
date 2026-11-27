/** Ortak biçimlendirme yardımcıları — para, tarih, alan ölçüsü. */

const paraBicimi = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
  maximumFractionDigits: 0,
});

const sayiBicimi = new Intl.NumberFormat("tr-TR");

export function para(deger: number | string | null | undefined): string {
  if (deger === null || deger === undefined) return "—";
  return paraBicimi.format(Number(deger));
}

export function sayi(deger: number | string | null | undefined): string {
  if (deger === null || deger === undefined) return "—";
  return sayiBicimi.format(Number(deger));
}

export function tarih(deger: string | null | undefined): string {
  if (!deger) return "—";
  return new Date(deger).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function tarihSaat(deger: string | null | undefined): string {
  if (!deger) return "—";
  return new Date(deger).toLocaleString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function gunAdi(deger: string | null | undefined): string {
  if (!deger) return "—";
  return new Date(deger).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    weekday: "long",
  });
}

/** "3 gün önce" gibi göreli ifade. */
export function gorece(deger: string | null | undefined): string {
  if (!deger) return "—";
  const fark = Date.now() - new Date(deger).getTime();
  const dakika = Math.round(fark / 60000);
  if (dakika < 1) return "az önce";
  if (dakika < 60) return `${dakika} dakika önce`;
  const saat = Math.round(dakika / 60);
  if (saat < 24) return `${saat} saat önce`;
  const gun = Math.round(saat / 24);
  if (gun < 30) return `${gun} gün önce`;
  return tarih(deger);
}

export function metrekare(deger: number | null | undefined): string {
  if (deger === null || deger === undefined) return "—";
  return `${sayiBicimi.format(deger)} m²`;
}

export function kat(deger: number | null | undefined): string {
  if (deger === null || deger === undefined) return "—";
  if (deger === 0) return "Zemin kat";
  if (deger < 0) return `${Math.abs(deger)}. bodrum kat`;
  return `${deger}. kat`;
}

export function telefon(deger: string | null | undefined): string {
  if (!deger) return "—";
  const t = deger.replace(/\D/g, "");
  if (t.length === 11) return `${t.slice(0, 4)} ${t.slice(4, 7)} ${t.slice(7, 9)} ${t.slice(9)}`;
  if (t.length === 10) return `0${t.slice(0, 3)} ${t.slice(3, 6)} ${t.slice(6, 8)} ${t.slice(8)}`;
  return deger;
}

/** Bugünün tarihini <input type="date"> biçiminde döndürür. */
export function bugunISO(): string {
  return new Date().toISOString().slice(0, 10);
}
