# Veritabanı ile Çalışma Rehberi

Ekipte dört kişi aynı **tek bir Supabase projesini** paylaşıyoruz. Bu, demo
verisinin herkeste aynı olmasını sağlar ama şu riski getirir: birimizin yaptığı
şema değişikliği anında herkesi etkiler. Aşağıdaki kurallar bunun içindir.

---

## 1. Erişim nasıl alınır?

Supabase panelini kullanmak için projeye davet edilmen gerekir:

> Supabase → Organization → **Team** → *Invite member* → e-postan

Davet gelince `supabase.com/dashboard` üzerinden projeyi görürsün. Asıl
çalışacağın iki yer:

| Bölüm | Ne için |
|---|---|
| **SQL Editor** | Sorgu çalıştırma, şema değişikliği |
| **Table Editor** | Veriye göz atma, tek tek satır düzenleme |

Uygulamayı kendi bilgisayarında çalıştırmak için ayrıca `web/.env.local`
dosyası gerekir. Bu dosya **depoda yoktur** (anahtar içerdiği için). Şablonu
`web/.env.local.example`; içindeki değerleri ekipten özelden iste.

---

## 2. ALTIN KURAL: panelden yaptığın değişikliği dosyaya da yaz

SQL Editor'dan bir sütun eklemek on saniye sürer. Ama o değişiklik sadece
veritabanında kalırsa:

- Depodaki `db/01_schema.sql` gerçeği yansıtmaz
- Projeyi sıfırdan kuran biri farklı bir şema elde eder
- Altı ay sonra "bu sütun neden var?" sorusunun cevabı kaybolur

**Bu yüzden her şema değişikliği bir dosyaya yazılır ve commit edilir.**

---

## 3. Değişiklik nasıl yapılır?

### Durum A — Sistem zaten kurulu, bir şey eklemek/değiştirmek istiyorsun

Bu en sık karşılaşılan durum. `db/migrations/` klasörüne **yeni bir dosya**
ekle. Mevcut `01-04` dosyalarını bu iş için değiştirme — onlar sıfırdan
kurulum içindir ve tekrar çalıştırıldığında hata verir.

Dosya adı: `NNN_kisa-aciklama.sql` (sıra numarası + ne yaptığı)

```sql
-- db/migrations/001_emlaklara_kapali_otopark_alani_ekle.sql
-- Tarih: 28.11.2026 · Yapan: Fatih Enes Şenol
-- Neden: Müşteriler açık/kapalı otopark ayrımını soruyor.

alter table emlaklar
  add column if not exists kapali_otopark boolean not null default false;
```

Adımlar:

1. Dosyayı yaz (`if not exists` / `if exists` kullan — iki kez çalışsa da
   patlamasın)
2. SQL Editor'da çalıştır
3. Değişiklik şemayı ilgilendiriyorsa **`db/01_schema.sql` dosyasını da
   güncelle** ki sıfırdan kurulum aynı sonucu versin
4. Yeni sütun/tabloyu TypeScript tarafına da işle:
   `web/src/types/database.ts`
5. Commit et: `git add db/ web/src/types/ && git commit -m "..."`
6. **Ekibe haber ver** — şema değişikliği herkesi etkiler

### Durum B — Projeyi sıfırdan kuruyorsun

Yeni bir Supabase projesi açtıysan, SQL Editor'da **sırayla**:

```
db/01_schema.sql     tablolar, enum'lar, trigger'lar, iş kuralı kısıtları
db/02_rls.sql        satır düzeyi güvenlik politikaları
db/04_grants.sql     rol bazlı tablo ayrıcalıkları
db/03_seed.sql       örnek veri
db/migrations/*.sql  varsa, numara sırasıyla
```

> `04` neden `03`'ten önce? Seed verisi yazılırken ayrıcalıkların tanımlı
> olması gerekir.

Ardından Storage'da **`ilan-fotograflari`** adında public bir kova oluştur
(5 MB sınır, yalnızca görsel MIME türleri).

---

## 4. Riskli işlemler

Bu komutlardan **önce ekibe sor**, tek başına çalıştırma:

```sql
drop table ...        -- veri geri gelmez
drop column ...       -- veri geri gelmez
truncate ...          -- veri geri gelmez
delete from ... ;     -- WHERE olmadan tüm tabloyu siler
update ... ;          -- WHERE olmadan tüm satırları değiştirir
```

Ücretsiz planda otomatik yedek yok. Silinen veri gitmiştir.

**Güvenli alışkanlık:** `delete`/`update` yazmadan önce aynı koşulu `select`
ile dene, kaç satır döndüğünü gör:

```sql
-- önce bu
select count(*) from emlaklar where durum = 'pasif';
-- sayı beklediğin gibiyse sonra bu
delete from emlaklar where durum = 'pasif';
```

---

## 5. Demo verisini sıfırlama

Kurcalarken veri dağıldıysa başlangıç durumuna dönmek için SQL Editor'da:

```sql
-- Sıra önemli: yabancı anahtarlar yüzünden önce bağımlı tablolar
truncate table
  mesajlar, gorusme_mesajlari, gorusmeler, arama_loglari,
  emlak_goruntulenme, favoriler, randevular, islemler,
  sozlesmeler, talepler, emlak_fotograflari, emlaklar
  restart identity cascade;

delete from profiller where auth_user_id is null;
```

Sonra `db/03_seed.sql` dosyasını yeniden çalıştır.

> Dikkat: `profiller` tablosundaki **hesabı bağlı** kayıtlar silinmez,
> çünkü silinirse ekibin giriş yapamaz. Seed dosyası `on conflict do nothing`
> kullandığı için mevcut hesapların üstüne yazmaz.

---

## 6. Güvenlik yapısı — bozmadan önce oku

Veritabanında iki bağımsız koruma katmanı var:

1. **GRANT** (`04_grants.sql`) — rol tabloya *hiç* dokunabilir mi?
   Örneğin `anon` rolünün `emlaklar` ve `profiller` tablolarına ayrıcalığı
   **yoktur**. Ziyaretçi ilanları yalnızca `ilanlar_public` görünümünden
   okur; o görünümde ev sahibi kimliği ve açık adres bulunmaz.
2. **RLS** (`02_rls.sql`) — dokunabiliyorsa *hangi satırlara*?

Yeni bir tablo eklersen **ikisini de yapman gerekir**, yoksa ya herkese açık
kalır ya da hiç kimse erişemez:

```sql
alter table yeni_tablo enable row level security;

create policy yeni_tablo_okuma on yeni_tablo
  for select using (yetkili_mi());

grant select, insert, update, delete on yeni_tablo to authenticated;
grant all on yeni_tablo to service_role;   -- sunucu işleri için
```

> `service_role`'ü unutma. RLS'i atlar ama **tablo ayrıcalığından muaf
> değildir**; verilmezse sunucu tarafı işler (AI eşleştirme, görüntülenme
> sayacı) sessizce boş sonuç alır ve hatayı bulmak saatler sürer.

---

## 7. Kodla veritabanı arasındaki bağ

Şema değiştiğinde güncellenmesi gereken yerler:

| Dosya | Ne var |
|---|---|
| `web/src/types/database.ts` | Tablo tipleri, enum'lar |
| `web/src/modules/<modül>/schema.ts` | Zod doğrulama kuralları |
| `web/src/modules/<modül>/queries.ts` | Okuma sorguları |
| `web/src/modules/<modül>/actions.ts` | Yazma işlemleri |
| `web/src/lib/etiketler.ts` | Enum değerlerinin Türkçe karşılıkları |

İş kuralları bilerek **iki yerde** tanımlı: veri tabanında `CHECK` kısıtı,
uygulamada Zod şeması. Biri kullanıcıya anlaşılır hata mesajı verir, diğeri
veriyi her koşulda korur. Birini değiştirirken diğerini de güncelle.

Değişiklikten sonra mutlaka çalıştır:

```bash
cd web && npx tsc --noEmit && npm run build
```
