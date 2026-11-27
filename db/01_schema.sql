-- =====================================================================
-- EMLAK YÖNETİM PLATFORMU (EYP) — VERİTABANI ŞEMASI
-- Proje Yönetimi Dersi Dönem Projesi / Gazi Üniversitesi YBS405
-- Hedef platform: Supabase (PostgreSQL 15+)
-- Dosya: 01_schema.sql  |  Çalıştırma sırası: 1
-- =====================================================================

create extension if not exists citext;

-- ---------------------------------------------------------------------
-- 0. ENUM (Tanım Kümeleri)
-- ---------------------------------------------------------------------
create type rol_turu           as enum ('yonetici', 'emlakci', 'musteri');
create type islem_turu         as enum ('kiralik', 'satilik');
create type emlak_turu         as enum ('daire','mustakil_ev','villa','residence','ofis','dukkan','isyeri','depo','arsa');
create type emlak_durumu       as enum ('aktif','rezerve','kiralandi','satildi','pasif');
create type isinma_turu        as enum ('dogalgaz_kombi','dogalgaz_soba','merkezi','merkezi_pay_olcer','klima','yerden_isitma','soba','yok');
create type kayit_kaynagi      as enum ('self','emlakci');
create type talep_durumu       as enum ('aktif','karsilandi','kapandi');
create type talep_kaynagi      as enum ('web','ai_gorusme','emlakci');
create type mesaj_yonu         as enum ('giden','gelen');
create type randevu_durumu     as enum ('talep','onaylandi','tamamlandi','iptal');
create type sozlesme_durumu    as enum ('taslak','emlakci_onayladi','musteri_onayladi','imzalandi','iptal');
create type islem_kaydi_turu   as enum ('kiralama','satis');

-- ---------------------------------------------------------------------
-- Ortak: updated_at otomatik güncelleme
-- ---------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- =====================================================================
-- MODÜL 1 — İŞ YERİ TANIMI
-- =====================================================================
create table ofis (
  id              uuid primary key default gen_random_uuid(),
  unvan           text        not null check (char_length(unvan) between 2 and 150),
  yetkili_ad      text        not null check (char_length(yetkili_ad) between 2 and 100),
  vergi_dairesi   text,
  vergi_no        varchar(11) unique check (vergi_no ~ '^[0-9]{10,11}$'),
  adres           text        not null,
  il              text        not null,
  ilce            text        not null,
  telefon         varchar(20) not null check (telefon ~ '^[0-9]{10,11}$'),
  faks            varchar(20) check (faks ~ '^[0-9]{10,11}$'),
  eposta          citext      not null check (eposta ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  web_sitesi      text,
  logo_url        text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
comment on table ofis is 'Modül 1: Programı kullanan emlak işletmesinin tanım bilgileri.';

create trigger trg_ofis_updated before update on ofis
  for each row execute function set_updated_at();

-- =====================================================================
-- MODÜL 2 — MÜŞTERİ TANIMI (+ sistem kullanıcıları)
-- =====================================================================
-- auth_user_id NULL olabilir: emlakçının kaydettiği, henüz sisteme üye
-- olmamış müşteriler de bu tabloda tutulur. Kişi sonradan aynı e-posta
-- ile kayıt olunca trg_auth_user_olusunca bu satırı bağlar.
create table profiller (
  id              uuid primary key default gen_random_uuid(),
  auth_user_id    uuid unique references auth.users(id) on delete set null,
  ad              text        not null check (char_length(ad) between 2 and 50),
  soyad           text        not null check (char_length(soyad) between 2 and 50),
  tckn            char(11)    unique check (tckn ~ '^[1-9][0-9]{10}$'),
  eposta          citext      not null unique check (eposta ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  ev_telefon      varchar(11) check (ev_telefon ~ '^[0-9]{10,11}$'),
  cep_telefon     varchar(11) not null check (cep_telefon ~ '^[0-9]{10,11}$'),
  rol             rol_turu    not null default 'musteri',
  il              text,
  ilce            text,
  adres           text,
  kayit_kaynagi   kayit_kaynagi not null default 'self',
  notlar          text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
comment on table profiller is 'Modül 2: Alıcı, satıcı, kiracı ve ev sahibi tüm müşteriler ile sistem kullanıcıları.';
comment on column profiller.auth_user_id is 'NULL ise kişi henüz siteye üye olmamıştır; emlakçı tarafından kaydedilmiştir.';

create index idx_profiller_rol on profiller(rol);
create trigger trg_profiller_updated before update on profiller
  for each row execute function set_updated_at();

-- Yeni auth kullanıcısı: aynı e-postalı profil varsa bağla, yoksa oluştur.
create or replace function auth_user_olusunca()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update profiller
     set auth_user_id = new.id,
         updated_at   = now()
   where eposta = new.email
     and auth_user_id is null;

  if not found then
    insert into profiller (auth_user_id, ad, soyad, eposta, cep_telefon, rol, kayit_kaynagi)
    values (
      new.id,
      coalesce(new.raw_user_meta_data->>'ad', 'Ad'),
      coalesce(new.raw_user_meta_data->>'soyad', 'Soyad'),
      new.email,
      coalesce(new.raw_user_meta_data->>'cep_telefon', '00000000000'),
      'musteri',
      'self'
    );
  end if;
  return new;
end $$;

create trigger trg_auth_user_olusunca
  after insert on auth.users
  for each row execute function auth_user_olusunca();

-- =====================================================================
-- MODÜL 3 — EMLAK TANIMI
-- =====================================================================
create table emlaklar (
  id                uuid primary key default gen_random_uuid(),
  ilan_no           int generated always as identity unique,
  ofis_id           uuid not null references ofis(id) on delete restrict,
  sahip_profil_id   uuid not null references profiller(id) on delete restrict,
  danisman_id       uuid references profiller(id) on delete set null,

  baslik            text not null check (char_length(baslik) between 10 and 150),
  aciklama          text check (char_length(aciklama) <= 2000),
  islem_turu        islem_turu   not null,
  emlak_turu        emlak_turu   not null,
  durum             emlak_durumu not null default 'aktif',

  fiyat             numeric(12,2) not null check (fiyat > 0),
  aidat             numeric(10,2) not null default 0 check (aidat >= 0),
  depozito          numeric(12,2) check (depozito >= 0),

  m2_brut           int not null check (m2_brut > 0 and m2_brut <= 100000),
  m2_net            int not null check (m2_net  > 0),
  -- Sabit liste yerine BİÇİM kontrolü: 1+1, 3+2, hatta 7+3 girilebilir;
  -- '2 oda' gibi anlamsız değerler engellenir.
  oda_sayisi        text not null check (
                      oda_sayisi ~ '^([1-9][0-9]?)\+([0-9]|[1-9][0-9])$'
                      or oda_sayisi in ('Stüdyo','Diğer')),
  bulundugu_kat     int not null check (bulundugu_kat between -3 and 100),
  bina_kat_sayisi   int not null check (bina_kat_sayisi between 1 and 100),
  bina_yasi         int not null check (bina_yasi between 0 and 200),
  isinma_turu       isinma_turu not null,
  banyo_sayisi      int check (banyo_sayisi between 0 and 10),

  esyali            boolean not null default false,
  asansor           boolean not null default false,
  otopark           boolean not null default false,
  balkon            boolean not null default false,
  site_icinde       boolean not null default false,
  krediye_uygun     boolean not null default false,

  il                text not null,
  ilce              text not null,
  mahalle           text,
  adres             text,

  yayin_tarihi      date not null default current_date,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  constraint chk_net_brutten_kucuk   check (m2_net <= m2_brut),
  constraint chk_kat_binayi_asmasin  check (bulundugu_kat <= bina_kat_sayisi)
);
comment on table emlaklar is 'Modül 3: Satıcı/kiraya veren müşteriler tarafından emlakçıya verilen portföy kayıtları.';
comment on column emlaklar.sahip_profil_id is 'Evin gerçek sahibi. Yalnızca emlakçı ve sahibin kendisi görebilir.';

create index idx_emlak_arama   on emlaklar(islem_turu, durum, il, ilce);
create index idx_emlak_fiyat   on emlaklar(fiyat);
create index idx_emlak_oda     on emlaklar(oda_sayisi);
create index idx_emlak_sahip   on emlaklar(sahip_profil_id);
create trigger trg_emlak_updated before update on emlaklar
  for each row execute function set_updated_at();

create table emlak_fotograflari (
  id          uuid primary key default gen_random_uuid(),
  emlak_id    uuid not null references emlaklar(id) on delete cascade,
  url         text not null,
  sira        int  not null default 0,
  kapak       boolean not null default false,
  created_at  timestamptz not null default now()
);
create index idx_foto_emlak on emlak_fotograflari(emlak_id, sira);

-- ---- İlan etkileşim sayaçları (ev sahibinin gördüğü rakamlar) --------
create table emlak_goruntulenme (
  id              bigserial primary key,
  emlak_id        uuid not null references emlaklar(id) on delete cascade,
  profil_id       uuid references profiller(id) on delete set null,
  ziyaretci_hash  text,
  created_at      timestamptz not null default now()
);
create index idx_goruntulenme_emlak on emlak_goruntulenme(emlak_id, created_at);

create table favoriler (
  profil_id   uuid not null references profiller(id) on delete cascade,
  emlak_id    uuid not null references emlaklar(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (profil_id, emlak_id)
);
create index idx_favori_emlak on favoriler(emlak_id);

-- =====================================================================
-- MODÜL 4 — EMLAK ARAMA, TALEPLER VE TALEP ANALİZİ
-- =====================================================================
-- Müşterinin kayıtlı arama kriteri. AI eşleştirmesinin kaynağıdır.
create table talepler (
  id              uuid primary key default gen_random_uuid(),
  profil_id       uuid references profiller(id) on delete set null,
  ad_soyad        text not null,
  telefon         varchar(11) not null check (telefon ~ '^[0-9]{10,11}$'),
  eposta          citext,

  islem_turu      islem_turu not null,
  emlak_turu      emlak_turu,
  il              text,
  ilce            text,
  min_fiyat       numeric(12,2) check (min_fiyat >= 0),
  max_fiyat       numeric(12,2) check (max_fiyat > 0),
  min_m2          int check (min_m2 > 0),
  oda_sayilari    text[],
  min_kat         int,
  max_kat         int,
  max_bina_yasi   int check (max_bina_yasi >= 0),
  asansor_sart    boolean not null default false,
  otopark_sart    boolean not null default false,
  esyali_sart     boolean not null default false,
  notlar          text,

  bildirim_izni   boolean not null default false,
  durum           talep_durumu  not null default 'aktif',
  kaynak          talep_kaynagi not null default 'web',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint chk_fiyat_araligi check (min_fiyat is null or max_fiyat is null or max_fiyat >= min_fiyat),
  constraint chk_kat_araligi   check (min_kat  is null or max_kat   is null or max_kat   >= min_kat)
);
comment on table talepler is 'Alıcı/kiracı müşterinin kayıtlı arama kriteri. bildirim_izni=true ise AI eşleşme mesajı gönderebilir (KVKK açık rıza).';
create index idx_talep_aktif on talepler(durum, islem_turu, il, ilce);
create trigger trg_talep_updated before update on talepler
  for each row execute function set_updated_at();

-- Her arama loglanır. sonuc_sayisi = 0 olan satırlar "karşılanamayan talep"
-- analizini (emlakçı paneli) besler; ayrı sayaç tablosuna gerek yoktur.
create table arama_loglari (
  id            bigserial primary key,
  profil_id     uuid references profiller(id) on delete set null,
  filtreler     jsonb not null,
  islem_turu    islem_turu,
  il            text,
  ilce          text,
  oda_sayisi    text,
  sonuc_sayisi  int not null check (sonuc_sayisi >= 0),
  created_at    timestamptz not null default now()
);
create index idx_arama_sonucsuz on arama_loglari(sonuc_sayisi, created_at) where sonuc_sayisi = 0;

-- =====================================================================
-- AI MODÜLÜ — GÖRÜŞME VE EŞLEŞME MESAJLARI
-- =====================================================================
create table gorusmeler (
  id              uuid primary key default gen_random_uuid(),
  profil_id       uuid references profiller(id) on delete set null,
  talep_id        uuid references talepler(id) on delete set null,
  arayan_adi      text,
  arayan_telefon  varchar(11),
  ozet            text,
  created_at      timestamptz not null default now()
);
comment on table gorusmeler is 'AI sesli/yazılı danışman görüşmesi oturumu (telefon görüşmesi simülasyonu).';

create table gorusme_mesajlari (
  id          bigserial primary key,
  gorusme_id  uuid not null references gorusmeler(id) on delete cascade,
  rol         text not null check (rol in ('system','user','assistant')),
  icerik      text not null,
  created_at  timestamptz not null default now()
);
create index idx_gorusme_mesaj on gorusme_mesajlari(gorusme_id, created_at);

-- Yeni ilan girildiğinde AI'ın eşleşen taleplere ürettiği mesajlar.
create table mesajlar (
  id              uuid primary key default gen_random_uuid(),
  talep_id        uuid not null references talepler(id) on delete cascade,
  emlak_id        uuid references emlaklar(id) on delete set null,
  profil_id       uuid references profiller(id) on delete set null,
  yon             mesaj_yonu not null default 'giden',
  icerik          text not null,
  ai_uretti       boolean not null default true,
  model           text,
  eslesme_skoru   int check (eslesme_skoru between 0 and 100),
  okundu          boolean not null default false,
  gonderim_zamani timestamptz not null default now(),
  constraint uq_talep_emlak_mesaj unique (talep_id, emlak_id)
);
comment on constraint uq_talep_emlak_mesaj on mesajlar is 'Aynı talep + aynı ilan için ikinci kez mesaj üretilmesini engeller.';
create index idx_mesaj_profil on mesajlar(profil_id, gonderim_zamani desc);

-- =====================================================================
-- RANDEVU MODÜLÜ (gün bazında — saat yok)
-- =====================================================================
create table randevular (
  id              uuid primary key default gen_random_uuid(),
  emlak_id        uuid not null references emlaklar(id) on delete cascade,
  profil_id       uuid references profiller(id) on delete set null,
  ad_soyad        text not null,
  telefon         varchar(11) not null check (telefon ~ '^[0-9]{10,11}$'),
  tercih_gun      date not null,
  alternatif_gun  date,
  musteri_notu    text,
  durum           randevu_durumu not null default 'talep',
  danisman_id     uuid references profiller(id) on delete set null,
  danisman_notu   text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint chk_alternatif_sonra check (alternatif_gun is null or alternatif_gun >= tercih_gun)
);
comment on column randevular.tercih_gun is 'Saat alınmaz; emlakçı telefonla arayıp saati netleştirir.';
create trigger trg_randevu_updated before update on randevular
  for each row execute function set_updated_at();

-- Geçmiş tarihe randevu alınamaz (CHECK içinde current_date kullanılamadığı için trigger).
create or replace function randevu_gun_kontrol()
returns trigger language plpgsql as $$
begin
  if new.tercih_gun < current_date then
    raise exception 'Geçmiş bir güne randevu talebi oluşturulamaz.';
  end if;
  return new;
end $$;

create trigger trg_randevu_gun before insert on randevular
  for each row execute function randevu_gun_kontrol();

-- =====================================================================
-- KİRA SÖZLEŞMESİ MODÜLÜ
-- =====================================================================
create table sozlesmeler (
  id                  uuid primary key default gen_random_uuid(),
  emlak_id            uuid not null references emlaklar(id) on delete restrict,
  ev_sahibi_profil_id uuid not null references profiller(id) on delete restrict,
  kiraci_profil_id    uuid not null references profiller(id) on delete restrict,
  baslangic_tarihi    date not null,
  bitis_tarihi        date not null,
  kira_bedeli         numeric(12,2) not null check (kira_bedeli > 0),
  depozito            numeric(12,2) not null default 0 check (depozito >= 0),
  ozel_sartlar        text,
  emlakci_onay_at     timestamptz,
  musteri_onay_at     timestamptz,
  durum               sozlesme_durumu not null default 'taslak',
  pdf_url             text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint chk_sozlesme_tarih check (bitis_tarihi > baslangic_tarihi),
  constraint chk_taraflar_farkli check (ev_sahibi_profil_id <> kiraci_profil_id)
);
create trigger trg_sozlesme_updated before update on sozlesmeler
  for each row execute function set_updated_at();

-- Çift taraflı onay tamamlanınca durum otomatik 'imzalandi' olur.
create or replace function sozlesme_durum_guncelle()
returns trigger language plpgsql as $$
begin
  if new.emlakci_onay_at is not null and new.musteri_onay_at is not null then
    new.durum := 'imzalandi';
  elsif new.emlakci_onay_at is not null then
    new.durum := 'emlakci_onayladi';
  elsif new.musteri_onay_at is not null then
    new.durum := 'musteri_onayladi';
  end if;
  return new;
end $$;

create trigger trg_sozlesme_durum before insert or update on sozlesmeler
  for each row execute function sozlesme_durum_guncelle();

-- =====================================================================
-- KPI / GELİR KAYITLARI
-- =====================================================================
create table islemler (
  id            uuid primary key default gen_random_uuid(),
  emlak_id      uuid not null references emlaklar(id) on delete restrict,
  sozlesme_id   uuid references sozlesmeler(id) on delete set null,
  tur           islem_kaydi_turu not null,
  tutar         numeric(12,2) not null check (tutar > 0),
  komisyon      numeric(12,2) not null default 0 check (komisyon >= 0),
  tarih         date not null default current_date,
  danisman_id   uuid references profiller(id) on delete set null,
  created_at    timestamptz not null default now()
);
comment on table islemler is 'KPI dashboard geliri: gerçekleşen kiralama/satış ve komisyon tutarları.';
create index idx_islem_tarih on islemler(tarih);

-- =====================================================================
-- GÖRÜNÜMLER (VIEW)
-- =====================================================================
-- Herkese açık ilan görünümü: sahip bilgisi ve iç notlar DIŞARIDA bırakılır.
create view ilanlar_public
with (security_invoker = false) as
select
  e.id, e.ilan_no, e.baslik, e.aciklama, e.islem_turu, e.emlak_turu, e.durum,
  e.fiyat, e.aidat, e.depozito, e.m2_brut, e.m2_net, e.oda_sayisi,
  e.bulundugu_kat, e.bina_kat_sayisi, e.bina_yasi, e.isinma_turu, e.banyo_sayisi,
  e.esyali, e.asansor, e.otopark, e.balkon, e.site_icinde, e.krediye_uygun,
  e.il, e.ilce, e.mahalle, e.yayin_tarihi, e.created_at,
  (select f.url from emlak_fotograflari f
     where f.emlak_id = e.id order by f.kapak desc, f.sira limit 1) as kapak_foto,
  (select count(*) from emlak_goruntulenme g where g.emlak_id = e.id) as goruntulenme_sayisi,
  (select count(*) from favoriler fv where fv.emlak_id = e.id)        as favori_sayisi
from emlaklar e
where e.durum in ('aktif','rezerve');

-- Karşılanamayan talep analizi (emlakçı paneli).
create view karsilanamayan_talepler
with (security_invoker = true) as
select islem_turu, il, ilce, oda_sayisi,
       count(*)      as arama_sayisi,
       max(created_at) as son_arama
from arama_loglari
where sonuc_sayisi = 0 and il is not null
group by islem_turu, il, ilce, oda_sayisi
order by arama_sayisi desc;
