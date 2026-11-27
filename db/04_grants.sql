-- =====================================================================
-- EMLAK YÖNETİM PLATFORMU (EYP) — TABLO AYRICALIKLARI (GRANT)
-- Dosya: 04_grants.sql  |  Çalıştırma sırası: 4
--
-- İKİ KATMANLI GÜVENLİK:
--   1. Katman (bu dosya) — GRANT: Rol tabloya HİÇ dokunabilir mi?
--   2. Katman (02_rls.sql) — RLS: Dokunabiliyorsa HANGİ SATIRLARA?
-- Bir katman atlansa bile diğeri veriyi korur (NFR-GEN-02, NFR-GEN-03).
-- =====================================================================

grant usage on schema public to anon, authenticated;

-- ---------------------------------------------------------------------
-- ANON (giriş yapmamış ziyaretçi)
-- Okuma: yalnızca ilan vitrini. emlaklar/profiller tablolarına
-- ayrıcalığı dahi yoktur; ilanları ilanlar_public görünümünden okur.
-- ---------------------------------------------------------------------
grant select on ilanlar_public      to anon;
grant select on emlak_fotograflari  to anon;

-- Yazma: ziyaretçinin bırakabileceği kayıtlar (RLS ile sınırlı).
grant insert on emlak_goruntulenme  to anon;  -- ilan görüntülenme sayacı
grant insert on arama_loglari       to anon;  -- talep analizi verisi
grant insert on talepler            to anon;  -- "beni haberdar et" formu
grant insert on randevular          to anon;  -- randevu talebi
grant insert on gorusmeler          to anon;  -- AI görüşmesi başlatma
grant insert on gorusme_mesajlari   to anon;

grant usage, select on all sequences in schema public to anon;

-- ---------------------------------------------------------------------
-- AUTHENTICATED (giriş yapmış kullanıcı — müşteri veya emlakçı)
-- Tüm tablolara ayrıcalık verilir; satır bazlı sınırı RLS koyar.
-- Örn. müşteri emlaklar tablosuna SELECT yapabilir ama RLS yalnızca
-- kendi sahibi olduğu ilanları döndürür.
-- ---------------------------------------------------------------------
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;

-- Görünümler
grant select on ilanlar_public           to authenticated;
grant select on karsilanamayan_talepler  to authenticated;

-- RPC: sözleşme onayı
grant execute on function sozlesme_onayla(uuid) to authenticated;

-- ---------------------------------------------------------------------
-- SERVICE_ROLE (sunucu tarafı yönetici istemcisi)
-- RLS'i atlar, ancak tablo AYRICALIĞI yine de açıkça verilmelidir; aksi
-- halde sunucu işleri sessizce boş sonuç alır. Bu rol yalnızca sunucuda
-- kullanılır: AI eşleştirme motoru, görüntülenme sayacı ve ziyaretçi adına
-- yazılan kayıtlar (talep, randevu, görüşme).
-- ---------------------------------------------------------------------
grant usage on schema public to service_role;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant all on all functions in schema public to service_role;

-- ---------------------------------------------------------------------
-- Bundan sonra oluşturulacak nesneler için varsayılan ayrıcalıklar
-- ---------------------------------------------------------------------
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public
  grant usage, select on sequences to anon, authenticated;
alter default privileges in schema public
  grant all on tables to service_role;
alter default privileges in schema public
  grant all on sequences to service_role;
