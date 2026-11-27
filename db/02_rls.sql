-- =====================================================================
-- EMLAK YÖNETİM PLATFORMU (EYP) — SATIR DÜZEYİ GÜVENLİK (RLS)
-- Dosya: 02_rls.sql  |  Çalıştırma sırası: 2 (01_schema.sql'den sonra)
--
-- TEMEL İLKE: Ev sahibinin kimliği (emlaklar.sahip_profil_id) ve müşteri
-- kişisel verileri dışarıya ASLA açılmaz. Ziyaretçi ilanları yalnızca
-- ilanlar_public görünümü üzerinden okur.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Yardımcı fonksiyonlar
-- SECURITY DEFINER: politika içinden profiller tablosu okunurken
-- sonsuz RLS özyinelemesi oluşmasını engeller.
-- ---------------------------------------------------------------------
create or replace function aktif_profil_id()
returns uuid language sql stable security definer set search_path = public as $$
  select id from profiller where auth_user_id = auth.uid() limit 1;
$$;

create or replace function yetkili_mi()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from profiller
    where auth_user_id = auth.uid() and rol in ('emlakci','yonetici')
  );
$$;

-- İlgili ilan yayında mı? SECURITY DEFINER'dır: RLS alt sorguları çağıranın
-- yetkisiyle çalıştığı için, anon rolüne emlaklar tablosunu açmadan
-- fotoğraf görünürlüğünü denetlememizi sağlar.
create or replace function ilan_yayinda(p_emlak_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from emlaklar
    where id = p_emlak_id and durum in ('aktif','rezerve')
  );
$$;

-- Çağıranın sahibi olduğu bir ilan mı?
create or replace function ilan_sahibi_miyim(p_emlak_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from emlaklar e
    join profiller pr on pr.id = e.sahip_profil_id
    where e.id = p_emlak_id and pr.auth_user_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------
-- RLS'i tüm tablolarda aç
-- ---------------------------------------------------------------------
alter table ofis                enable row level security;
alter table profiller           enable row level security;
alter table emlaklar            enable row level security;
alter table emlak_fotograflari  enable row level security;
alter table emlak_goruntulenme  enable row level security;
alter table favoriler           enable row level security;
alter table talepler            enable row level security;
alter table arama_loglari       enable row level security;
alter table gorusmeler          enable row level security;
alter table gorusme_mesajlari   enable row level security;
alter table mesajlar            enable row level security;
alter table randevular          enable row level security;
alter table sozlesmeler         enable row level security;
alter table islemler            enable row level security;

-- =====================================================================
-- MODÜL 1 — İŞ YERİ
-- =====================================================================
create policy ofis_herkes_okur on ofis
  for select using (true);
create policy ofis_yetkili_yazar on ofis
  for all using (yetkili_mi()) with check (yetkili_mi());

-- =====================================================================
-- MODÜL 2 — PROFİLLER
-- Kullanıcı yalnızca kendi kaydını görür; emlakçı tümünü görür.
-- =====================================================================
create policy profil_kendi_veya_yetkili on profiller
  for select using (auth_user_id = auth.uid() or yetkili_mi());
create policy profil_kendi_guncelle on profiller
  for update using (auth_user_id = auth.uid() or yetkili_mi())
           with check (auth_user_id = auth.uid() or yetkili_mi());
create policy profil_yetkili_ekler on profiller
  for insert with check (yetkili_mi());
create policy profil_yetkili_siler on profiller
  for delete using (yetkili_mi());
-- Not: Siteye kendi kayıt olan kullanıcının profili, auth.users trigger'ı
-- (SECURITY DEFINER) tarafından oluşturulur; RLS'e takılmaz.

-- =====================================================================
-- MODÜL 3 — EMLAKLAR
-- Ziyaretçi bu tabloya DOĞRUDAN erişemez; ilanlar_public görünümünü okur.
-- Ev sahibi kendi ilanını görür ama DEĞİŞTİREMEZ (yalnız istatistik).
-- =====================================================================
create policy emlak_yetkili_tam on emlaklar
  for all using (yetkili_mi()) with check (yetkili_mi());
create policy emlak_sahibi_okur on emlaklar
  for select using (sahip_profil_id = aktif_profil_id());

-- Fotoğraflar kişisel veri içermez: yayındaki ilanların görselleri herkese açık.
create policy foto_yayindaki_ilanlar on emlak_fotograflari
  for select using (
    ilan_yayinda(emlak_id) or yetkili_mi() or ilan_sahibi_miyim(emlak_id)
  );
create policy foto_yetkili_yazar on emlak_fotograflari
  for all using (yetkili_mi()) with check (yetkili_mi());

-- =====================================================================
-- ETKİLEŞİM SAYAÇLARI
-- =====================================================================
-- Görüntülenme kaydını ziyaretçi de (anon) oluşturabilir; kimse silemez.
create policy goruntulenme_herkes_ekler on emlak_goruntulenme
  for insert with check (true);
create policy goruntulenme_yetkili_veya_sahip_okur on emlak_goruntulenme
  for select using (yetkili_mi() or ilan_sahibi_miyim(emlak_id));

create policy favori_kendi on favoriler
  for all using (profil_id = aktif_profil_id())
           with check (profil_id = aktif_profil_id());
create policy favori_yetkili_okur on favoriler
  for select using (yetkili_mi());

-- =====================================================================
-- MODÜL 4 — TALEPLER VE ARAMA LOGLARI
-- =====================================================================
-- Talebi ziyaretçi de bırakabilir (AI görüşmesi / web formu).
create policy talep_herkes_ekler on talepler
  for insert with check (true);
create policy talep_kendi_veya_yetkili on talepler
  for select using (profil_id = aktif_profil_id() or yetkili_mi());
create policy talep_kendi_guncelle on talepler
  for update using (profil_id = aktif_profil_id() or yetkili_mi())
           with check (profil_id = aktif_profil_id() or yetkili_mi());

-- Her arama loglanır (anon dahil); yalnızca emlakçı analiz edebilir.
create policy arama_herkes_ekler on arama_loglari
  for insert with check (true);
create policy arama_yetkili_okur on arama_loglari
  for select using (yetkili_mi());

-- =====================================================================
-- AI MODÜLÜ
-- =====================================================================
create policy gorusme_herkes_ekler on gorusmeler
  for insert with check (true);
create policy gorusme_kendi_veya_yetkili on gorusmeler
  for select using (profil_id = aktif_profil_id() or yetkili_mi());

create policy gorusme_mesaj_herkes_ekler on gorusme_mesajlari
  for insert with check (true);
create policy gorusme_mesaj_okur on gorusme_mesajlari
  for select using (
    yetkili_mi()
    or exists (select 1 from gorusmeler g
               where g.id = gorusme_id and g.profil_id = aktif_profil_id())
  );

-- AI eşleşme mesajlarını yalnızca sunucu (service_role) üretir.
create policy mesaj_alici_veya_yetkili_okur on mesajlar
  for select using (profil_id = aktif_profil_id() or yetkili_mi());
create policy mesaj_yetkili_yazar on mesajlar
  for all using (yetkili_mi()) with check (yetkili_mi());

-- =====================================================================
-- RANDEVU
-- =====================================================================
create policy randevu_herkes_ekler on randevular
  for insert with check (true);
create policy randevu_kendi_veya_yetkili on randevular
  for select using (profil_id = aktif_profil_id() or yetkili_mi());
create policy randevu_yetkili_yonetir on randevular
  for update using (yetkili_mi()) with check (yetkili_mi());

-- =====================================================================
-- SÖZLEŞME — taraflar okur, yalnız emlakçı yazar.
-- Müşteri onayı doğrudan UPDATE ile değil, sozlesme_onayla() ile verilir.
-- =====================================================================
create policy sozlesme_taraflar_okur on sozlesmeler
  for select using (
    yetkili_mi()
    or kiraci_profil_id    = aktif_profil_id()
    or ev_sahibi_profil_id = aktif_profil_id()
  );
create policy sozlesme_yetkili_yazar on sozlesmeler
  for all using (yetkili_mi()) with check (yetkili_mi());

create or replace function sozlesme_onayla(p_sozlesme_id uuid)
returns sozlesmeler language plpgsql security definer set search_path = public as $$
declare
  v_profil uuid := aktif_profil_id();
  v_kayit  sozlesmeler;
begin
  if v_profil is null then
    raise exception 'Onay için giriş yapmış olmanız gerekir.';
  end if;

  select * into v_kayit from sozlesmeler where id = p_sozlesme_id;
  if not found then
    raise exception 'Sözleşme bulunamadı.';
  end if;

  if yetkili_mi() then
    update sozlesmeler set emlakci_onay_at = coalesce(emlakci_onay_at, now())
     where id = p_sozlesme_id returning * into v_kayit;
  elsif v_profil in (v_kayit.kiraci_profil_id, v_kayit.ev_sahibi_profil_id) then
    update sozlesmeler set musteri_onay_at = coalesce(musteri_onay_at, now())
     where id = p_sozlesme_id returning * into v_kayit;
  else
    raise exception 'Bu sözleşmeyi onaylama yetkiniz yok.';
  end if;

  return v_kayit;
end $$;

-- =====================================================================
-- KPI / İŞLEMLER — yalnızca emlakçı.
-- =====================================================================
create policy islem_yetkili on islemler
  for all using (yetkili_mi()) with check (yetkili_mi());

-- =====================================================================
-- GÖRÜNÜM YETKİLERİ
-- ilanlar_public SECURITY DEFINER'dır: RLS'i atlar, ama zaten sahip
-- bilgisi içermeyen sütunları döndürür.
-- =====================================================================
grant select on ilanlar_public to anon, authenticated;
revoke all on karsilanamayan_talepler from anon;
grant select on karsilanamayan_talepler to authenticated;
