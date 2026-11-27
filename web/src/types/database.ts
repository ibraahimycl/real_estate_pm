/**
 * Veri tabanı tip tanımları — db/01_schema.sql ile birebir eşleşir.
 *
 * Not: Supabase CLI bağlandıktan sonra bu dosya
 *   npx supabase gen types typescript --project-id poamkjxryunswbpnigii
 * komutuyla otomatik üretilebilir. Şu an elle yazılmış hali kullanılıyor;
 * alan adları ve enum değerleri şemadan kopyalanmıştır.
 */

// ---------------------------------------------------------------------
// ENUM'lar
// ---------------------------------------------------------------------
export type RolTuru = "yonetici" | "emlakci" | "musteri";
export type IslemTuru = "kiralik" | "satilik";
export type EmlakTuru =
  | "daire" | "mustakil_ev" | "villa" | "residence"
  | "ofis" | "dukkan" | "isyeri" | "depo" | "arsa";
export type EmlakDurumu = "aktif" | "rezerve" | "kiralandi" | "satildi" | "pasif";
export type IsinmaTuru =
  | "dogalgaz_kombi" | "dogalgaz_soba" | "merkezi" | "merkezi_pay_olcer"
  | "klima" | "yerden_isitma" | "soba" | "yok";
export type KayitKaynagi = "self" | "emlakci";
export type TalepDurumu = "aktif" | "karsilandi" | "kapandi";
export type TalepKaynagi = "web" | "ai_gorusme" | "emlakci";
export type MesajYonu = "giden" | "gelen";
export type RandevuDurumu = "talep" | "onaylandi" | "tamamlandi" | "iptal";
export type SozlesmeDurumu =
  | "taslak" | "emlakci_onayladi" | "musteri_onayladi" | "imzalandi" | "iptal";
export type IslemKaydiTuru = "kiralama" | "satis";

/**
 * Oda sayısı sabit bir küme değildir: "<oda>+<salon>" biçimine uyan her değer
 * geçerlidir (bkz. lib/oda.ts ve veri tabanındaki CHECK kısıtı).
 */
export type OdaSayisi = string;

// ---------------------------------------------------------------------
// Satır (Row) tipleri
// ---------------------------------------------------------------------
export type Ofis = {
  id: string;
  unvan: string;
  yetkili_ad: string;
  vergi_dairesi: string | null;
  vergi_no: string | null;
  adres: string;
  il: string;
  ilce: string;
  telefon: string;
  faks: string | null;
  eposta: string;
  web_sitesi: string | null;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
}

export type Profil = {
  id: string;
  auth_user_id: string | null;
  ad: string;
  soyad: string;
  tckn: string | null;
  eposta: string;
  ev_telefon: string | null;
  cep_telefon: string;
  rol: RolTuru;
  il: string | null;
  ilce: string | null;
  adres: string | null;
  kayit_kaynagi: KayitKaynagi;
  notlar: string | null;
  created_at: string;
  updated_at: string;
}

export type Emlak = {
  id: string;
  ilan_no: number;
  ofis_id: string;
  sahip_profil_id: string;
  danisman_id: string | null;
  baslik: string;
  aciklama: string | null;
  islem_turu: IslemTuru;
  emlak_turu: EmlakTuru;
  durum: EmlakDurumu;
  fiyat: number;
  aidat: number;
  depozito: number | null;
  m2_brut: number;
  m2_net: number;
  oda_sayisi: OdaSayisi;
  bulundugu_kat: number;
  bina_kat_sayisi: number;
  bina_yasi: number;
  isinma_turu: IsinmaTuru;
  banyo_sayisi: number | null;
  esyali: boolean;
  asansor: boolean;
  otopark: boolean;
  balkon: boolean;
  site_icinde: boolean;
  krediye_uygun: boolean;
  il: string;
  ilce: string;
  mahalle: string | null;
  adres: string | null;
  yayin_tarihi: string;
  created_at: string;
  updated_at: string;
}

export type EmlakFotografi = {
  id: string;
  emlak_id: string;
  url: string;
  sira: number;
  kapak: boolean;
  created_at: string;
}

export type EmlakGoruntulenme = {
  id: number;
  emlak_id: string;
  profil_id: string | null;
  ziyaretci_hash: string | null;
  created_at: string;
}

export type Favori = {
  profil_id: string;
  emlak_id: string;
  created_at: string;
}

export type Talep = {
  id: string;
  profil_id: string | null;
  ad_soyad: string;
  telefon: string;
  eposta: string | null;
  islem_turu: IslemTuru;
  emlak_turu: EmlakTuru | null;
  il: string | null;
  ilce: string | null;
  min_fiyat: number | null;
  max_fiyat: number | null;
  min_m2: number | null;
  oda_sayilari: string[] | null;
  min_kat: number | null;
  max_kat: number | null;
  max_bina_yasi: number | null;
  asansor_sart: boolean;
  otopark_sart: boolean;
  esyali_sart: boolean;
  notlar: string | null;
  bildirim_izni: boolean;
  durum: TalepDurumu;
  kaynak: TalepKaynagi;
  created_at: string;
  updated_at: string;
}

export type AramaLogu = {
  id: number;
  profil_id: string | null;
  filtreler: Record<string, unknown>;
  islem_turu: IslemTuru | null;
  il: string | null;
  ilce: string | null;
  oda_sayisi: string | null;
  sonuc_sayisi: number;
  created_at: string;
}

export type Gorusme = {
  id: string;
  profil_id: string | null;
  talep_id: string | null;
  arayan_adi: string | null;
  arayan_telefon: string | null;
  ozet: string | null;
  created_at: string;
}

export type GorusmeMesaji = {
  id: number;
  gorusme_id: string;
  rol: "system" | "user" | "assistant";
  icerik: string;
  created_at: string;
}

export type Mesaj = {
  id: string;
  talep_id: string;
  emlak_id: string | null;
  profil_id: string | null;
  yon: MesajYonu;
  icerik: string;
  ai_uretti: boolean;
  model: string | null;
  eslesme_skoru: number | null;
  okundu: boolean;
  gonderim_zamani: string;
}

export type Randevu = {
  id: string;
  emlak_id: string;
  profil_id: string | null;
  ad_soyad: string;
  telefon: string;
  tercih_gun: string;
  alternatif_gun: string | null;
  musteri_notu: string | null;
  durum: RandevuDurumu;
  danisman_id: string | null;
  danisman_notu: string | null;
  created_at: string;
  updated_at: string;
}

export type Sozlesme = {
  id: string;
  emlak_id: string;
  ev_sahibi_profil_id: string;
  kiraci_profil_id: string;
  baslangic_tarihi: string;
  bitis_tarihi: string;
  kira_bedeli: number;
  depozito: number;
  ozel_sartlar: string | null;
  emlakci_onay_at: string | null;
  musteri_onay_at: string | null;
  durum: SozlesmeDurumu;
  pdf_url: string | null;
  created_at: string;
  updated_at: string;
}

export type IslemKaydi = {
  id: string;
  emlak_id: string;
  sozlesme_id: string | null;
  tur: IslemKaydiTuru;
  tutar: number;
  komisyon: number;
  tarih: string;
  danisman_id: string | null;
  created_at: string;
}

// ---------------------------------------------------------------------
// Görünümler (View)
// ---------------------------------------------------------------------
/** Herkese açık ilan görünümü — sahip bilgisi İÇERMEZ. */
export type IlanPublic = {
  id: string;
  ilan_no: number;
  baslik: string;
  aciklama: string | null;
  islem_turu: IslemTuru;
  emlak_turu: EmlakTuru;
  durum: EmlakDurumu;
  fiyat: number;
  aidat: number;
  depozito: number | null;
  m2_brut: number;
  m2_net: number;
  oda_sayisi: OdaSayisi;
  bulundugu_kat: number;
  bina_kat_sayisi: number;
  bina_yasi: number;
  isinma_turu: IsinmaTuru;
  banyo_sayisi: number | null;
  esyali: boolean;
  asansor: boolean;
  otopark: boolean;
  balkon: boolean;
  site_icinde: boolean;
  krediye_uygun: boolean;
  il: string;
  ilce: string;
  mahalle: string | null;
  yayin_tarihi: string;
  created_at: string;
  kapak_foto: string | null;
  goruntulenme_sayisi: number;
  favori_sayisi: number;
}

export type KarsilanamayanTalep = {
  islem_turu: IslemTuru;
  il: string;
  ilce: string | null;
  oda_sayisi: string | null;
  arama_sayisi: number;
  son_arama: string;
}

// ---------------------------------------------------------------------
// supabase-js'in beklediği şema haritası
// ---------------------------------------------------------------------
type Tablo<R> = {
  Row: R;
  Insert: Partial<R>;
  Update: Partial<R>;
  Relationships: [];
};

type Gorunum<R> = { Row: R; Relationships: [] };

export type Database = {
  public: {
    Tables: {
      ofis: Tablo<Ofis>;
      profiller: Tablo<Profil>;
      emlaklar: Tablo<Emlak>;
      emlak_fotograflari: Tablo<EmlakFotografi>;
      emlak_goruntulenme: Tablo<EmlakGoruntulenme>;
      favoriler: Tablo<Favori>;
      talepler: Tablo<Talep>;
      arama_loglari: Tablo<AramaLogu>;
      gorusmeler: Tablo<Gorusme>;
      gorusme_mesajlari: Tablo<GorusmeMesaji>;
      mesajlar: Tablo<Mesaj>;
      randevular: Tablo<Randevu>;
      sozlesmeler: Tablo<Sozlesme>;
      islemler: Tablo<IslemKaydi>;
    };
    Views: {
      ilanlar_public: Gorunum<IlanPublic>;
      karsilanamayan_talepler: Gorunum<KarsilanamayanTalep>;
    };
    Functions: {
      sozlesme_onayla: {
        Args: { p_sozlesme_id: string };
        Returns: Sozlesme;
      };
    };
    Enums: {
      rol_turu: RolTuru;
      islem_turu: IslemTuru;
      emlak_turu: EmlakTuru;
      emlak_durumu: EmlakDurumu;
      isinma_turu: IsinmaTuru;
      kayit_kaynagi: KayitKaynagi;
      talep_durumu: TalepDurumu;
      talep_kaynagi: TalepKaynagi;
      mesaj_yonu: MesajYonu;
      randevu_durumu: RandevuDurumu;
      sozlesme_durumu: SozlesmeDurumu;
      islem_kaydi_turu: IslemKaydiTuru;
    };
    CompositeTypes: Record<string, never>;
  };
}
