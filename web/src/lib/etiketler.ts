/**
 * Veri tabanı enum değerlerinin kullanıcıya gösterilen Türkçe karşılıkları.
 * Tek kaynak: hem formlardaki açılır listeler hem de listeleme ekranları
 * bu haritaları kullanır.
 */
import type {
  EmlakDurumu,
  EmlakTuru,
  IsinmaTuru,
  IslemTuru,
  RandevuDurumu,
  RolTuru,
  SozlesmeDurumu,
  TalepDurumu,
  TalepKaynagi,
} from "@/types/database";

export const ISLEM_TURU: Record<IslemTuru, string> = {
  kiralik: "Kiralık",
  satilik: "Satılık",
};

export const EMLAK_TURU: Record<EmlakTuru, string> = {
  daire: "Daire",
  mustakil_ev: "Müstakil Ev",
  villa: "Villa",
  residence: "Residence",
  ofis: "Ofis",
  dukkan: "Dükkan",
  isyeri: "İş Yeri",
  depo: "Depo",
  arsa: "Arsa",
};

export const EMLAK_DURUMU: Record<EmlakDurumu, string> = {
  aktif: "Aktif",
  rezerve: "Rezerve",
  kiralandi: "Kiralandı",
  satildi: "Satıldı",
  pasif: "Pasif",
};

export const ISINMA_TURU: Record<IsinmaTuru, string> = {
  dogalgaz_kombi: "Doğalgaz (Kombi)",
  dogalgaz_soba: "Doğalgaz Sobası",
  merkezi: "Merkezi",
  merkezi_pay_olcer: "Merkezi (Pay Ölçer)",
  klima: "Klima",
  yerden_isitma: "Yerden Isıtma",
  soba: "Soba",
  yok: "Yok",
};

export const ROL: Record<RolTuru, string> = {
  yonetici: "Ofis Yöneticisi",
  emlakci: "Emlak Danışmanı",
  musteri: "Müşteri",
};

export const TALEP_DURUMU: Record<TalepDurumu, string> = {
  aktif: "Aktif",
  karsilandi: "Karşılandı",
  kapandi: "Kapandı",
};

export const TALEP_KAYNAGI: Record<TalepKaynagi, string> = {
  web: "Web Formu",
  ai_gorusme: "AI Görüşmesi",
  emlakci: "Danışman Kaydı",
};

export const RANDEVU_DURUMU: Record<RandevuDurumu, string> = {
  talep: "Talep Alındı",
  onaylandi: "Onaylandı",
  tamamlandi: "Tamamlandı",
  iptal: "İptal",
};

export const SOZLESME_DURUMU: Record<SozlesmeDurumu, string> = {
  taslak: "Taslak",
  emlakci_onayladi: "Danışman Onayladı",
  musteri_onayladi: "Müşteri Onayladı",
  imzalandi: "İmzalandı",
  iptal: "İptal",
};

/** Açılır liste seçeneklerine çeviren yardımcı. */
export function secenekler<T extends string>(
  harita: Record<T, string>,
): { deger: T; etiket: string }[] {
  return (Object.keys(harita) as T[]).map((deger) => ({
    deger,
    etiket: harita[deger],
  }));
}
