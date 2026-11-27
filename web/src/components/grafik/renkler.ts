/**
 * GRAFİK RENK PALETİ
 *
 * Kategorik iki seri (Kiralık / Satılık). Değerler gözle değil,
 * dataviz doğrulayıcısıyla seçildi ve beyaz yüzeye karşı altı kontrolden
 * de geçti:
 *   açıklık bandı ✓ · kroma tabanı ✓ · renk körlüğü ayrımı ΔE 19.9 (protan) ✓
 *   normal görüş ΔE 25.8 ✓ · yüzey kontrastı ≥ 3:1 ✓
 *
 * Arayüzün marka yeşilinden bilerek ayrıldı: grafik renkleri kimlik taşır,
 * düğme/bağlantı renkleriyle karışmamalıdır.
 */
export const SERI_RENKLERI = {
  kiralik: "#2d6ea3",
  satilik: "#bf6a1e",
} as const;

/** Tek serili grafiklerde kullanılan birinci yuva. */
export const TEK_SERI = SERI_RENKLERI.kiralik;
