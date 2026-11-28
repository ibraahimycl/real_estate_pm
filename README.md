# Emlak Yönetim Platformu (EYP)

Gazi Üniversitesi · Yönetim Bilişim Sistemleri · **YBS405 Proje Yönetimi** dönem projesi.
GİB İş Analisti case çalışmasında tanımlanan emlak platformunun çalışan MVP uygulaması.

Ekip: Beyzanur Gürpınar · Erdal Türk · Fatih Enes Şenol · İbrahim Yücel

---

## 1. Zorunlu senaryo

Ödev metnindeki akış uçtan uca çalışır:

| # | Adım | Ekran |
|---|------|-------|
| 1 | İş yeri (emlak işletmesi) tanımlanır | `/panel/isyeri` |
| 2 | Satıcı/kiraya veren müşteri kaydedilir | `/panel/musteriler/yeni` |
| 3 | Bu müşteriye ait kiralık emlak ve özellikleri girilir | `/panel/emlaklar/yeni` |
| 4 | İkinci (alıcı/kiracı) müşteri kaydedilir | `/panel/musteriler/yeni` |
| 5 | Kriterlerle filtreli arama yapılır | `/panel/arama` |
| 6 | Uygun kaydın yazıcı çıktısı alınır | `/panel/emlaklar/[id]/cikti` |

## 2. Modüller

**Zorunlu dört modül**
- **İş Yeri Tanımı** — işletme kimlik, adres ve iletişim bilgileri
- **Müşteri Tanımı** — alıcı, satıcı, kiracı ve ev sahibi tüm müşteriler (CRUD)
- **Emlak Tanımı** — portföy kayıtları, fotoğraf yönetimi, durum takibi (CRUD)
- **Emlak Arama** — filtreli sorgulama, arama loglama ve yazıcı çıktısı

**Ek modüller**
- **AI Emlak Danışmanı** — ofisi aramanın sistem içi karşılığı. Portföyü sorgular,
  müşteri onay verirse talebini kaydeder.
- **Talep Eşleştirme** — yeni ilan girildiğinde kriterleri tutan müşteriler bulunur,
  bildirim izni olanlara otomatik mesaj üretilir.
- **Talep Analizi** — sonuç dönmeyen aramalar gruplanarak portföydeki eksikler
  ölçülebilir hâle getirilir.
- **Randevu** — gün bazında randevu talebi (saati danışman telefonla netleştirir).
- **Kira Sözleşmesi** — çift taraflı onay sonrası yazdırılabilir sözleşme çıktısı.
- **KPI Panosu** — aylık ilan girişi, gerçekleşen işlem ve komisyon geliri.

## 3. Teknoloji

| Katman | Seçim |
|--------|-------|
| Uygulama | Next.js 16 (App Router) · React 19 · TypeScript |
| Arayüz | Tailwind CSS v4 |
| Veri tabanı | Supabase (PostgreSQL) |
| Kimlik doğrulama | Supabase Auth (e-posta + parola) |
| Dosya depolama | Supabase Storage (`ilan-fotograflari`) |
| Yapay zekâ | OpenAI (anahtar yoksa kural tabanlı yedeğe düşer) |
| Dağıtım | Vercel |

## 4. Kurulum

```bash
cd web
npm install
cp .env.local.example .env.local   # değerleri doldurun
npm run dev
```

`.env.local` içeriği:

```
NEXT_PUBLIC_SUPABASE_URL=https://<proje>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...      # yalnızca sunucuda kullanılır
OPENAI_API_KEY=                               # boş bırakılabilir
OPENAI_MODEL=gpt-4o-mini
```

### Veri tabanı

Supabase SQL Editor'da **sırayla** çalıştırın:

| Dosya | İçerik |
|-------|--------|
| `db/01_schema.sql` | 16 tablo, 2 görünüm, 12 enum, trigger'lar, iş kuralı CHECK kısıtları |
| `db/02_rls.sql` | 31 satır düzeyi güvenlik politikası + yardımcı fonksiyonlar |
| `db/03_seed.sql` | Örnek/test verisi (ofis, müşteriler, 12 ilan, talepler, randevular) |
| `db/04_grants.sql` | Rol bazlı tablo ayrıcalıkları |

> Çalıştırma sırası: **01 → 02 → 04 → 03**. Seed verisi yazılırken
> ayrıcalıkların tanımlı olması gerekir.
>
> Ekip olarak veritabanında değişiklik yapacaksanız önce
> **[db/VERITABANI-REHBERI.md](db/VERITABANI-REHBERI.md)** dosyasını okuyun:
> erişim alma, artımlı değişiklik (migration) yazma, demo verisini sıfırlama
> ve güvenlik katmanlarını bozmama kuralları orada.

Ardından Supabase panelinden `ilan-fotograflari` adında **public** bir Storage
kovası oluşturun (5 MB sınır, yalnızca görsel MIME türleri).

Authentication → Providers → Email altında **Confirm email** kapatılırsa kayıt
olan kullanıcı doğrudan giriş yapabilir (demo için önerilir).

## 5. Test kullanıcıları

Seed verisindeki profiller, **aynı e-posta ile kayıt olunduğunda** otomatik
bağlanır — mükerrer müşteri kaydı oluşmaz.

| E-posta | Parola | Rol | Ne gösterir |
|---------|--------|-----|-------------|
| `emlakci@baskentemlak.com` | `Emlak2026!` | Emlak Danışmanı | Tüm yönetim paneli |
| `yonetici@baskentemlak.com` | `Emlak2026!` | Ofis Yöneticisi | Tüm yönetim paneli |
| `fatih@baskentemlak.com` | `Emlak2026!` | Emlak Danışmanı | Tüm yönetim paneli |
| `ibrahim@baskentemlak.com` | `Emlak2026!` | Emlak Danışmanı | Tüm yönetim paneli |
| `ayse.demir@example.com` | `Musteri2026!` | Müşteri (ev sahibi) | "İlanlarım" — 3 ilanın etkileşim rakamları |
| `ibrahim.yucel@example.com` | `Musteri2026!` | Müşteri (alıcı) | Talep, mesaj ve imzalı sözleşme |
| `fatih.senol@example.com` | `Musteri2026!` | Müşteri (alıcı) | Satılık daire talebi |

## 6. Jüri demosu — AI eşleştirme

Seed verisinde **Gölbaşı'nda kiralık 2+1 ilan bilerek yoktur**; buna karşılık
o kritere 14 sonuçsuz arama ve bildirim izinli bir müşteri talebi (İbrahim Yücel)
kayıtlıdır. Akış:

1. `/panel/talep-analizi` → *Gölbaşı · kiralık · 2+1 → 14 sonuçsuz arama* satırı görünür.
2. `/panel/emlaklar/yeni` → Gölbaşı'nda, 2+1, asansörlü ve otoparklı, 15.000–28.000 TL
   aralığında, en az 90 m² bir **kiralık** ilan girin (sahibi: Ali Yıldız).
3. Kaydettiğiniz anda eşleştirme motoru çalışır; ilan sayfasında
   *"Kriterlere uyan 1 müşteri talebi bulundu, 1 müşteriye mesaj üretildi"* uyarısı çıkar.
4. `/panel/mesajlar` → müşteriye gönderilen mesaj, %uyum skoru ve ilan bağlantısıyla görünür.
5. `ibrahim.yucel@example.com` ile giriş yapıp `/hesabim/mesajlarim` ekranında
   aynı mesajın müşteri tarafındaki hâlini gösterin.

Aynı müşteriye aynı ilan için ikinci kez mesaj üretilmesini veri tabanındaki
`UNIQUE(talep_id, emlak_id)` kısıtı engeller. İlan ekranındaki **"Yeniden tara"**
bağlantısı eşleştirmeyi tekrar çalıştırır.

## 7. Güvenlik yaklaşımı

İki bağımsız katman vardır:

1. **GRANT** (`04_grants.sql`) — rol tabloya *hiç* dokunabilir mi?
   `anon` rolünün `emlaklar` ve `profiller` tablolarına ayrıcalığı **yoktur**.
2. **RLS** (`02_rls.sql`) — dokunabiliyorsa *hangi satırlara*?

Ziyaretçi ilanları yalnızca `ilanlar_public` görünümünden okur; bu görünüm
ev sahibi kimliğini ve açık adresi içermez. İlan sahibi kendi ilanını görebilir
ama **güncelleyemez** — bunu sağlayan bir `UPDATE` politikası yoktur.

İş kuralları (TCKN 11 hane, fiyat/m² > 0, net ≤ brüt alan, kat ≤ bina kat sayısı,
geçmiş güne randevu yok, sözleşme bitiş > başlangıç) hem Zod şemalarında hem
veri tabanı `CHECK` kısıtlarında tanımlıdır.

## 8. Proje yapısı

```
db/                      SQL dosyaları (şema, RLS, seed, grant)
web/src/
  app/
    (public)/            ziyaretçi: ilan vitrini, ilan detayı, AI danışman
    (auth)/              giriş, kayıt
    hesabim/             müşteri hesabı ekranları
    panel/               emlakçı yönetim paneli
    api/ai/gorusme/      AI görüşme uç noktası
  modules/               iş mantığı — modül başına schema/queries/actions
  lib/
    supabase/            istemciler (tarayıcı, sunucu, yönetici)
    ai/                  eşleştirme motoru, araçlar, talimatlar, yedek
  components/            ortak arayüz bileşenleri
  types/database.ts      veri tabanı tip tanımları
```

Her modül dosyasının başında ilgili gereksinim kodları (`FR-…`, `BR-…`, `UC-…`)
yorum olarak yer alır; gereksinim dokümanıyla kod arasında izlenebilirlik sağlar.

## 9. Vercel'e dağıtım

1. Depoyu GitHub'a gönderin.
2. Vercel → New Project → depoyu seçin.
3. **Root Directory** olarak `web` seçin.
4. Environment Variables bölümüne `.env.local`'daki dört değeri girin.
5. Deploy.

Supabase Authentication → URL Configuration bölümünde **Site URL** değerini
Vercel adresiniz olarak güncelleyin.
