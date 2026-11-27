-- =====================================================================
-- EMLAK YÖNETİM PLATFORMU (EYP) — ÖRNEK / TEST VERİSİ
-- Dosya: 03_seed.sql  |  Çalıştırma sırası: 3
--
-- Bu veri, dokümanın "Test Kullanıcıları ve Test Verileri" bölümünü de
-- besler. Tekrar çalıştırılabilir (idempotent): sabit UUID + ON CONFLICT.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) İŞ YERİ
-- ---------------------------------------------------------------------
insert into ofis (id, unvan, yetkili_ad, vergi_dairesi, vergi_no, adres, il, ilce, telefon, faks, eposta, web_sitesi)
values ('a0000000-0000-4000-8000-000000000001',
        'Başkent Emlak Yönetim Ltd. Şti.', 'Erdal Türk', 'Çankaya', '1234567890',
        'Kızılırmak Mah. Dumlupınar Blv. No:12/5', 'Ankara', 'Çankaya',
        '03124445566', '03124445567', 'info@baskentemlak.com', 'https://baskentemlak.com')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- 2) PROFİLLER
-- auth_user_id NULL'dur: bu kişiler emlakçı tarafından kaydedilmiştir.
-- Kişi aynı e-posta ile siteye üye olursa trigger kaydı otomatik bağlar.
--
-- ÖNEMLİ: Emlakçı hesabı için önce siteden 'emlakci@baskentemlak.com'
-- adresiyle kayıt olun; trigger aşağıdaki satırı o kullanıcıya bağlar ve
-- hesap doğrudan 'emlakci' rolüyle açılır.
-- ---------------------------------------------------------------------
insert into profiller (id, ad, soyad, tckn, eposta, cep_telefon, ev_telefon, rol, il, ilce, kayit_kaynagi) values
 ('b0000000-0000-4000-8000-000000000001','Erdal','Türk','10000000002','emlakci@baskentemlak.com','05321110001','03124445566','emlakci','Ankara','Çankaya','emlakci'),
 ('b0000000-0000-4000-8000-000000000002','Beyzanur','Gürpınar','10000000003','yonetici@baskentemlak.com','05321110002',null,'yonetici','Ankara','Çankaya','emlakci'),
 ('b0000000-0000-4000-8000-000000000003','Fatih Enes','Şenol','10000000004','fatih@baskentemlak.com','05321110003',null,'emlakci','Ankara','Çankaya','emlakci'),
 ('b0000000-0000-4000-8000-000000000004','İbrahim','Yücel','10000000005','ibrahim@baskentemlak.com','05321110004',null,'emlakci','Ankara','Çankaya','emlakci'),
 -- Satıcı / kiraya veren müşteriler (ilan sahipleri)
 ('b0000000-0000-4000-8000-000000000011','Ayşe','Demir','12345678902','ayse.demir@example.com','05331110011','03122220011','musteri','Ankara','Çankaya','emlakci'),
 ('b0000000-0000-4000-8000-000000000012','Mehmet','Kaya','23456789013','mehmet.kaya@example.com','05331110012',null,'musteri','Ankara','Keçiören','emlakci'),
 ('b0000000-0000-4000-8000-000000000013','Fatma','Şahin','34567890124','fatma.sahin@example.com','05331110013',null,'musteri','Ankara','Yenimahalle','emlakci'),
 ('b0000000-0000-4000-8000-000000000014','Ali','Yıldız','45678901235','ali.yildiz@example.com','05331110014',null,'musteri','Ankara','Gölbaşı','emlakci'),
 ('b0000000-0000-4000-8000-000000000015','Zeynep','Arslan','56789012346','zeynep.arslan@example.com','05331110015',null,'musteri','Ankara','Etimesgut','emlakci'),
 -- Alıcı / kiracı müşteriler
 ('b0000000-0000-4000-8000-000000000021','İbrahim','Yücel','67890123457','ibrahim.yucel@example.com','05341110021',null,'musteri','Ankara','Çankaya','emlakci'),
 ('b0000000-0000-4000-8000-000000000022','Elif','Koç','78901234568','elif.koc@example.com','05341110022',null,'musteri','Ankara','Gölbaşı','emlakci'),
 ('b0000000-0000-4000-8000-000000000023','Fatih Enes','Şenol','89012345679','fatih.senol@example.com','05341110023',null,'musteri','Ankara','Mamak','emlakci')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- 3) EMLAK PORTFÖYÜ
-- DİKKAT: Gölbaşı'nda KİRALIK 2+1 bilerek yoktur. "Karşılanamayan talep"
-- analizi demosu bu boşluk üzerinden çalışır (bkz. bölüm 6).
-- ---------------------------------------------------------------------
insert into emlaklar (id, ofis_id, sahip_profil_id, danisman_id, baslik, aciklama, islem_turu, emlak_turu, durum,
                      fiyat, aidat, depozito, m2_brut, m2_net, oda_sayisi, bulundugu_kat, bina_kat_sayisi,
                      bina_yasi, isinma_turu, banyo_sayisi, esyali, asansor, otopark, balkon, site_icinde,
                      krediye_uygun, il, ilce, mahalle, adres) values
 ('c0000000-0000-4000-8000-000000000001','a0000000-0000-4000-8000-000000000001','b0000000-0000-4000-8000-000000000011','b0000000-0000-4000-8000-000000000001',
  'Çankaya Kızılırmak''ta Ferah 3+1 Kiralık Daire','Metroya 5 dakika yürüme mesafesinde, güney cepheli, aydınlık daire.','kiralik','daire','aktif',
  32000,1500,64000,145,125,'3+1',4,8,6,'dogalgaz_kombi',2,false,true,true,true,true,false,'Ankara','Çankaya','Kızılırmak','Dumlupınar Blv.'),
 ('c0000000-0000-4000-8000-000000000002','a0000000-0000-4000-8000-000000000001','b0000000-0000-4000-8000-000000000011','b0000000-0000-4000-8000-000000000001',
  'Çankaya Bahçelievler Eşyalı 1+1 Kiralık','Öğrenci ve çalışanlar için uygun, tamamen eşyalı stüdyo tipi daire.','kiralik','daire','aktif',
  18500,800,37000,65,55,'1+1',2,5,12,'dogalgaz_kombi',1,true,false,false,true,false,false,'Ankara','Çankaya','Bahçelievler','7. Cadde'),
 ('c0000000-0000-4000-8000-000000000003','a0000000-0000-4000-8000-000000000001','b0000000-0000-4000-8000-000000000012','b0000000-0000-4000-8000-000000000001',
  'Keçiören Kalaba''da Satılık 2+1 Daire','Yeni yapı, asansörlü, otoparklı. Krediye uygun tapu.','satilik','daire','aktif',
  2850000,900,null,110,95,'2+1',3,6,2,'dogalgaz_kombi',1,false,true,true,true,false,true,'Ankara','Keçiören','Kalaba','Fatih Cad.'),
 ('c0000000-0000-4000-8000-000000000004','a0000000-0000-4000-8000-000000000001','b0000000-0000-4000-8000-000000000012','b0000000-0000-4000-8000-000000000001',
  'Keçiören''de Kiralık 2+1 Bakımlı Daire','Site içerisinde, çocuk oyun alanı ve güvenlik mevcut.','kiralik','daire','aktif',
  21000,1200,42000,105,90,'2+1',5,9,4,'merkezi_pay_olcer',1,false,true,true,true,true,false,'Ankara','Keçiören','Aşağı Eğlence','Şehit Cengiz Sk.'),
 ('c0000000-0000-4000-8000-000000000005','a0000000-0000-4000-8000-000000000001','b0000000-0000-4000-8000-000000000013','b0000000-0000-4000-8000-000000000001',
  'Yenimahalle Batıkent Satılık 3+1 Geniş Daire','Metro ve alışveriş merkezine yakın, ebeveyn banyolu.','satilik','daire','aktif',
  4200000,1100,null,160,138,'3+1',7,12,8,'merkezi',2,false,true,true,true,true,true,'Ankara','Yenimahalle','Batıkent','Çamlıca Mah.'),
 ('c0000000-0000-4000-8000-000000000006','a0000000-0000-4000-8000-000000000001','b0000000-0000-4000-8000-000000000013','b0000000-0000-4000-8000-000000000001',
  'Yenimahalle''de Kiralık Cadde Üzeri Dükkan','Yoğun yaya trafiği olan cadde üzeri, vitrinli dükkan.','kiralik','dukkan','aktif',
  45000,0,90000,80,75,'Diğer',0,4,15,'klima',1,false,false,false,false,false,false,'Ankara','Yenimahalle','Demetevler','Ragıp Tüzün Cad.'),
 ('c0000000-0000-4000-8000-000000000007','a0000000-0000-4000-8000-000000000001','b0000000-0000-4000-8000-000000000014','b0000000-0000-4000-8000-000000000001',
  'Gölbaşı Gölkent''te Satılık 4+1 Villa','Göl manzaralı, bahçeli, müstakil girişli villa.','satilik','villa','aktif',
  8750000,0,null,280,240,'4+1',2,2,5,'yerden_isitma',3,false,false,true,true,true,true,'Ankara','Gölbaşı','Gölkent','Göl Cad.'),
 ('c0000000-0000-4000-8000-000000000008','a0000000-0000-4000-8000-000000000001','b0000000-0000-4000-8000-000000000014','b0000000-0000-4000-8000-000000000001',
  'Gölbaşı''nda Kiralık 3+1 Bahçe Katı','Müstakil bahçe kullanımlı, doğayla iç içe geniş daire.','kiralik','daire','aktif',
  24000,600,48000,135,118,'3+1',0,3,9,'dogalgaz_kombi',1,false,false,true,true,false,false,'Ankara','Gölbaşı','Karşıyaka','Çamlık Sk.'),
 ('c0000000-0000-4000-8000-000000000009','a0000000-0000-4000-8000-000000000001','b0000000-0000-4000-8000-000000000015','b0000000-0000-4000-8000-000000000001',
  'Etimesgut Eryaman Satılık 2+1 Residence','Rezidans içi havuz, spor salonu ve 7/24 güvenlik.','satilik','residence','aktif',
  3650000,2500,null,120,102,'2+1',11,18,3,'merkezi',1,false,true,true,true,true,true,'Ankara','Etimesgut','Eryaman','Üniversiteler Mah.'),
 ('c0000000-0000-4000-8000-000000000010','a0000000-0000-4000-8000-000000000001','b0000000-0000-4000-8000-000000000015','b0000000-0000-4000-8000-000000000001',
  'Etimesgut''ta Kiralık Hazır Ofis Katı','Bölünmüş çalışma alanları ve toplantı odası ile hazır ofis.','kiralik','ofis','aktif',
  38000,3000,76000,200,180,'Diğer',6,10,7,'merkezi',2,true,true,true,false,false,false,'Ankara','Etimesgut','Elvankent','İstasyon Cad.'),
 ('c0000000-0000-4000-8000-000000000011','a0000000-0000-4000-8000-000000000001','b0000000-0000-4000-8000-000000000011','b0000000-0000-4000-8000-000000000001',
  'Çankaya Ayrancı''da Kiralık 1+1 Eşyasız','Sessiz sokakta, bakımlı binada, tadilatlı daire.','kiralik','daire','kiralandi',
  16000,700,32000,60,52,'1+1',1,4,20,'dogalgaz_soba',1,false,false,false,true,false,false,'Ankara','Çankaya','Ayrancı','Hoşdere Cad.'),
 ('c0000000-0000-4000-8000-000000000012','a0000000-0000-4000-8000-000000000001','b0000000-0000-4000-8000-000000000012','b0000000-0000-4000-8000-000000000001',
  'Mamak Boğaziçi''nde Satılık 3+1 Uygun Fiyat','Yatırımlık, geniş balkonlu, ulaşımı kolay konum.','satilik','daire','satildi',
  1950000,450,null,115,98,'3+1',2,5,18,'dogalgaz_kombi',1,false,false,false,true,false,true,'Ankara','Mamak','Boğaziçi','Alemdağ Sk.')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- 4) FOTOĞRAFLAR
-- Geçici dış kaynak (picsum.photos). Emlakçı panelinden yüklenen gerçek
-- fotoğraflar Supabase Storage URL'i olarak aynı sütuna yazılır.
-- ---------------------------------------------------------------------
insert into emlak_fotograflari (emlak_id, url, sira, kapak)
select e.id,
       'https://picsum.photos/seed/eyp-' || e.ilan_no || '-' || s || '/900/600',
       s,
       (s = 1)
from emlaklar e
cross join generate_series(1,4) as s
on conflict do nothing;

-- ---------------------------------------------------------------------
-- 5) AKTİF MÜŞTERİ TALEPLERİ (AI eşleştirmesinin hedefleri)
-- ---------------------------------------------------------------------
insert into talepler (id, profil_id, ad_soyad, telefon, eposta, islem_turu, emlak_turu, il, ilce,
                      min_fiyat, max_fiyat, min_m2, oda_sayilari, max_bina_yasi,
                      asansor_sart, otopark_sart, esyali_sart, notlar, bildirim_izni, durum, kaynak) values
 ('d0000000-0000-4000-8000-000000000001','b0000000-0000-4000-8000-000000000021','İbrahim Yücel','05341110021','ibrahim.yucel@example.com',
  'kiralik','daire','Ankara','Gölbaşı',15000,28000,90,array['2+1','3+1'],15,true,true,false,
  'Asansör şart, tercihen site içinde. Gölbaşı veya çevresi olabilir.',true,'aktif','ai_gorusme'),
 ('d0000000-0000-4000-8000-000000000002','b0000000-0000-4000-8000-000000000022','Elif Koç','05341110022','elif.koc@example.com',
  'kiralik','daire','Ankara','Çankaya',10000,20000,50,array['1+1','2+1'],25,false,false,true,
  'Eşyalı olması önemli, tek başına yaşayacak.',true,'aktif','web'),
 ('d0000000-0000-4000-8000-000000000003','b0000000-0000-4000-8000-000000000023','Fatih Enes Şenol','05341110023','fatih.senol@example.com',
  'satilik','daire','Ankara','Keçiören',2000000,3200000,95,array['2+1','3+1'],10,true,true,false,
  'Krediye uygun olmalı, ilk ev alımı.',true,'aktif','web'),
 ('d0000000-0000-4000-8000-000000000004',null,'Hasan Çelik','05351110031',null,
  'kiralik','dukkan','Ankara','Yenimahalle',30000,60000,60,null,null,false,false,false,
  'Cadde üzeri, vitrinli olsun. Market açacak.',false,'aktif','ai_gorusme')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- 6) ARAMA LOGLARI — "Karşılanamayan Talep" analizi demo verisi
-- Gölbaşı / kiralık / 2+1 aramasında portföyde karşılığı yok (14 arama).
-- ---------------------------------------------------------------------
insert into arama_loglari (profil_id, filtreler, islem_turu, il, ilce, oda_sayisi, sonuc_sayisi, created_at)
select null,
       jsonb_build_object('islem_turu','kiralik','il','Ankara','ilce','Gölbaşı','oda_sayisi','2+1'),
       'kiralik','Ankara','Gölbaşı','2+1',0,
       now() - (i || ' days')::interval
from generate_series(1,14) as i;

insert into arama_loglari (profil_id, filtreler, islem_turu, il, ilce, oda_sayisi, sonuc_sayisi, created_at)
select null,
       jsonb_build_object('islem_turu','kiralik','il','Ankara','ilce','Mamak','oda_sayisi','1+1'),
       'kiralik','Ankara','Mamak','1+1',0,
       now() - (i || ' days')::interval
from generate_series(1,6) as i;

insert into arama_loglari (profil_id, filtreler, islem_turu, il, ilce, oda_sayisi, sonuc_sayisi, created_at)
select null,
       jsonb_build_object('islem_turu','satilik','il','Ankara','ilce','Çankaya','oda_sayisi','3+1'),
       'satilik','Ankara','Çankaya','3+1',0,
       now() - (i || ' days')::interval
from generate_series(1,9) as i;

-- Sonuç dönen aramalar (analizin sadece sorunlu olanı göstermesi için kontrol verisi)
insert into arama_loglari (profil_id, filtreler, islem_turu, il, ilce, oda_sayisi, sonuc_sayisi, created_at)
select null,
       jsonb_build_object('islem_turu','kiralik','il','Ankara','ilce','Keçiören','oda_sayisi','2+1'),
       'kiralik','Ankara','Keçiören','2+1',1,
       now() - (i || ' days')::interval
from generate_series(1,5) as i;

-- ---------------------------------------------------------------------
-- 7) GÖRÜNTÜLENME VE FAVORİ (ev sahibinin göreceği rakamlar)
-- ---------------------------------------------------------------------
insert into emlak_goruntulenme (emlak_id, profil_id, ziyaretci_hash, created_at)
select e.id, null, md5(e.id::text || s::text), now() - (s || ' hours')::interval
from emlaklar e
cross join generate_series(1, (abs(hashtext(e.id::text)) % 40) + 5) as s;

insert into favoriler (profil_id, emlak_id, created_at) values
 ('b0000000-0000-4000-8000-000000000021','c0000000-0000-4000-8000-000000000008', now() - interval '3 days'),
 ('b0000000-0000-4000-8000-000000000021','c0000000-0000-4000-8000-000000000004', now() - interval '2 days'),
 ('b0000000-0000-4000-8000-000000000022','c0000000-0000-4000-8000-000000000002', now() - interval '5 days'),
 ('b0000000-0000-4000-8000-000000000023','c0000000-0000-4000-8000-000000000003', now() - interval '1 day')
on conflict do nothing;

-- ---------------------------------------------------------------------
-- 8) RANDEVU TALEPLERİ (gün bazında)
-- ---------------------------------------------------------------------
insert into randevular (emlak_id, profil_id, ad_soyad, telefon, tercih_gun, alternatif_gun, musteri_notu, durum, danisman_id) values
 ('c0000000-0000-4000-8000-000000000008','b0000000-0000-4000-8000-000000000021','İbrahim Yücel','05341110021',
  current_date + 2, current_date + 4, 'Hafta içi öğleden sonra müsaitim.','talep',null),
 ('c0000000-0000-4000-8000-000000000004','b0000000-0000-4000-8000-000000000022','Elif Koç','05341110022',
  current_date + 1, null, 'Sabah saatleri tercihim.','onaylandi','b0000000-0000-4000-8000-000000000001'),
 ('c0000000-0000-4000-8000-000000000003','b0000000-0000-4000-8000-000000000023','Fatih Enes Şenol','05341110023',
  current_date + 5, current_date + 6, null,'talep',null);

-- ---------------------------------------------------------------------
-- 9) GERÇEKLEŞEN İŞLEMLER (KPI dashboard geliri)
-- ---------------------------------------------------------------------
insert into islemler (emlak_id, tur, tutar, komisyon, tarih, danisman_id) values
 ('c0000000-0000-4000-8000-000000000011','kiralama',16000,16000, current_date - 20,'b0000000-0000-4000-8000-000000000001'),
 ('c0000000-0000-4000-8000-000000000012','satis',1950000,39000, current_date - 12,'b0000000-0000-4000-8000-000000000001');

-- ---------------------------------------------------------------------
-- 10) İMZALANMIŞ KİRA SÖZLEŞMESİ (demo)
-- Keçiören'deki 2+1 kiralık daire, İbrahim Yücel'e kiralanmıştır.
-- Her iki taraf da onayladığı için trg_sozlesme_durum durumu
-- 'imzalandi' yapar ve sözleşme çıktısı alınabilir hâle gelir.
-- ---------------------------------------------------------------------
insert into sozlesmeler (id, emlak_id, ev_sahibi_profil_id, kiraci_profil_id,
                         baslangic_tarihi, bitis_tarihi, kira_bedeli, depozito,
                         ozel_sartlar, emlakci_onay_at, musteri_onay_at)
values ('e0000000-0000-4000-8000-000000000001',
        'c0000000-0000-4000-8000-000000000004',
        'b0000000-0000-4000-8000-000000000012',
        'b0000000-0000-4000-8000-000000000021',
        current_date, current_date + 365, 21000, 42000,
        'Evde evcil hayvan beslenmeyecektir. Aidat kiracıya aittir.',
        now(), now())
on conflict (id) do nothing;

-- Sözleşmenin sonuçları: ilan kiralandı, komisyon geliri kaydedildi.
update emlaklar set durum = 'kiralandi'
 where id = 'c0000000-0000-4000-8000-000000000004';

insert into islemler (emlak_id, sozlesme_id, tur, tutar, komisyon, tarih, danisman_id)
select 'c0000000-0000-4000-8000-000000000004',
       'e0000000-0000-4000-8000-000000000001',
       'kiralama', 21000, 21000, current_date,
       'b0000000-0000-4000-8000-000000000001'
where not exists (
  select 1 from islemler
   where sozlesme_id = 'e0000000-0000-4000-8000-000000000001');

-- ---------------------------------------------------------------------
-- 11) AI GÖRÜŞME KAYDI (demo)
-- İbrahim Yücel iki hafta önce AI danışmanı aramış, aradığı evi anlatmış,
-- portföyde karşılığı çıkmayınca kriterlerinin kaydedilmesine onay vermiştir.
-- 6 numaralı talep bu görüşmeden doğmuştur.
-- ---------------------------------------------------------------------
insert into gorusmeler (id, profil_id, talep_id, arayan_adi, arayan_telefon, ozet, created_at)
values ('f0000000-0000-4000-8000-000000000001',
        'b0000000-0000-4000-8000-000000000021',
        'd0000000-0000-4000-8000-000000000001',
        'İbrahim Yücel', '05341110021',
        'Gölbaşı''nda 2+1 veya 3+1 kiralık, asansörlü ve otoparklı ev arıyor. Bütçe 28.000 TL. Portföyde karşılık çıkmadı, talep kaydedildi.',
        now() - interval '14 days')
on conflict (id) do nothing;

insert into gorusme_mesajlari (gorusme_id, rol, icerik, created_at) values
 ('f0000000-0000-4000-8000-000000000001','user',
  'Merhaba, Gölbaşı tarafında kiralık ev bakıyorum.',
  now() - interval '14 days' + interval '0 second'),
 ('f0000000-0000-4000-8000-000000000001','assistant',
  'Merhaba, Başkent Emlak''a hoş geldiniz. Kaç odalı olsun? Örneğin 2+1 veya 3+1.',
  now() - interval '14 days' + interval '12 second'),
 ('f0000000-0000-4000-8000-000000000001','user',
  '2+1 ya da 3+1 olabilir. Asansör ve otopark şart, en az 90 metrekare olsun. Bütçem 28 bin TL.',
  now() - interval '14 days' + interval '48 second'),
 ('f0000000-0000-4000-8000-000000000001','assistant',
  'Şu anda Gölbaşı bölgesinde 2+1/3+1 kiralık portföyümüzde bu kriterlere uyan bir kayıt bulamadım. İsterseniz adınızı ve telefonunuzu alıp kriterlerinizi kaydedeyim; uygun bir ilan düştüğünde ilk siz haberdar olun. Kaydedeyim mi?',
  now() - interval '14 days' + interval '55 second'),
 ('f0000000-0000-4000-8000-000000000001','user',
  'Olur, kaydedin lütfen. Adım İbrahim Yücel, telefonum 05341110021.',
  now() - interval '14 days' + interval '96 second'),
 ('f0000000-0000-4000-8000-000000000001','assistant',
  'Teşekkürler İbrahim. Aradığınız kriterleri kaydettim. Portföyümüze uyan bir ilan düştüğünde size 05341110021 numarasından haber vereceğiz.',
  now() - interval '14 days' + interval '104 second')
on conflict do nothing;

-- Talebin oluşma tarihi de görüşmeyle tutarlı olmalıdır.
update talepler set created_at = now() - interval '14 days'
 where id = 'd0000000-0000-4000-8000-000000000001';
