import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { sozlesmeGetir } from "@/modules/sozlesme/queries";
import { isyeriGetir } from "@/modules/isyeri/queries";
import { YazdirButonu } from "@/components/YazdirButonu";
import { BagButon } from "@/components/ui/Buton";
import { para, tarih, telefon } from "@/lib/bicim";

export const metadata: Metadata = { title: "Sözleşme Çıktısı" };

function Taraf({
  rol,
  ad,
  tckn,
  tel,
  adres,
}: {
  rol: string;
  ad: string;
  tckn: string;
  tel: string;
  adres: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-metin-silik">
        {rol}
      </p>
      <dl className="mt-1.5 space-y-0.5 text-sm">
        <div className="flex gap-2">
          <dt className="w-28 shrink-0 text-metin-ikincil">Adı Soyadı</dt>
          <dd className="font-medium text-metin">{ad}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-28 shrink-0 text-metin-ikincil">T.C. Kimlik No</dt>
          <dd className="rakam text-metin">{tckn}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-28 shrink-0 text-metin-ikincil">Telefon</dt>
          <dd className="rakam text-metin">{tel}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-28 shrink-0 text-metin-ikincil">Adres</dt>
          <dd className="text-metin">{adres}</dd>
        </div>
      </dl>
    </div>
  );
}

/**
 * Kira sözleşmesi çıktısı.
 *
 * Tarayıcının "Yazdır → PDF olarak kaydet" özelliğiyle PDF üretilir.
 * Bu yol bilinçli seçildi: sunucu tarafı PDF kitaplıkları Türkçe karakterler
 * için ayrıca yazı tipi gömülmesini gerektirir; HTML çıktısı ise ğ/ş/İ dahil
 * tüm karakterleri sorunsuz basar ve ek bağımlılık getirmez.
 *
 * BR-SZL-104: Çıktı yalnızca her iki taraf da onayladıysa alınabilir.
 */
export default async function SozlesmeCiktisiSayfasi({
  params,
}: PageProps<"/panel/sozlesmeler/[id]/cikti">) {
  const { id } = await params;
  const sozlesme = await sozlesmeGetir(id);
  if (!sozlesme) notFound();

  if (sozlesme.durum !== "imzalandi") {
    redirect(`/panel/sozlesmeler/${id}`);
  }

  const ofis = await isyeriGetir();
  const konutAdresi =
    [sozlesme.emlak?.adres, sozlesme.emlak?.ilce, sozlesme.emlak?.il]
      .filter(Boolean)
      .join(", ") || "—";

  const sure = Math.round(
    (new Date(sozlesme.bitis_tarihi).getTime() -
      new Date(sozlesme.baslangic_tarihi).getTime()) /
      (1000 * 60 * 60 * 24 * 30),
  );

  return (
    <div className="max-w-3xl">
      <div className="mb-5 flex items-center justify-between yazdirma-gizle">
        <BagButon href={`/panel/sozlesmeler/${id}`} gorunum="ikincil">
          ← Sözleşmeye dön
        </BagButon>
        <YazdirButonu etiket="Yazdır / PDF olarak kaydet" />
      </div>

      <article className="yazdirma-sayfa rounded-kart border border-cizgi bg-yuzey p-10 text-sm leading-relaxed">
        <header className="border-b-2 border-metin pb-4 text-center">
          <h1 className="text-lg font-bold uppercase tracking-wide text-metin">
            Konut Kira Sözleşmesi
          </h1>
          {ofis && (
            <p className="mt-1.5 text-xs text-metin-ikincil">
              {ofis.unvan} aracılığıyla düzenlenmiştir · {ofis.ilce}/{ofis.il} ·{" "}
              <span className="rakam">{telefon(ofis.telefon)}</span>
            </p>
          )}
        </header>

        {/* 1. Taraflar */}
        <section className="mt-6">
          <h2 className="mb-3 font-bold text-metin">1. TARAFLAR</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <Taraf
              rol="Kiraya Veren"
              ad={
                sozlesme.ev_sahibi
                  ? `${sozlesme.ev_sahibi.ad} ${sozlesme.ev_sahibi.soyad}`
                  : "—"
              }
              tckn={sozlesme.ev_sahibi?.tckn ?? "—"}
              tel={sozlesme.ev_sahibi ? telefon(sozlesme.ev_sahibi.cep_telefon) : "—"}
              adres={sozlesme.ev_sahibi?.adres ?? "—"}
            />
            <Taraf
              rol="Kiracı"
              ad={
                sozlesme.kiraci
                  ? `${sozlesme.kiraci.ad} ${sozlesme.kiraci.soyad}`
                  : "—"
              }
              tckn={sozlesme.kiraci?.tckn ?? "—"}
              tel={sozlesme.kiraci ? telefon(sozlesme.kiraci.cep_telefon) : "—"}
              adres={sozlesme.kiraci?.adres ?? "—"}
            />
          </div>
        </section>

        {/* 2. Kiralanan */}
        <section className="mt-6">
          <h2 className="mb-2 font-bold text-metin">2. KİRALANAN TAŞINMAZ</h2>
          <dl className="space-y-1">
            <div className="flex gap-3 border-b border-cizgi py-1.5">
              <dt className="w-40 shrink-0 text-metin-ikincil">Adres</dt>
              <dd className="font-medium text-metin">{konutAdresi}</dd>
            </div>
            <div className="flex gap-3 border-b border-cizgi py-1.5">
              <dt className="w-40 shrink-0 text-metin-ikincil">Nitelik</dt>
              <dd className="rakam text-metin">
                {sozlesme.emlak?.oda_sayisi ?? "—"} ·{" "}
                {sozlesme.emlak?.m2_brut ?? "—"} m² brüt
              </dd>
            </div>
            <div className="flex gap-3 border-b border-cizgi py-1.5">
              <dt className="w-40 shrink-0 text-metin-ikincil">Kullanım Amacı</dt>
              <dd className="text-metin">Konut</dd>
            </div>
          </dl>
        </section>

        {/* 3. Süre ve bedel */}
        <section className="mt-6">
          <h2 className="mb-2 font-bold text-metin">3. SÜRE VE KİRA BEDELİ</h2>
          <dl className="space-y-1">
            <div className="flex gap-3 border-b border-cizgi py-1.5">
              <dt className="w-40 shrink-0 text-metin-ikincil">Kira Başlangıcı</dt>
              <dd className="rakam font-medium text-metin">
                {tarih(sozlesme.baslangic_tarihi)}
              </dd>
            </div>
            <div className="flex gap-3 border-b border-cizgi py-1.5">
              <dt className="w-40 shrink-0 text-metin-ikincil">Kira Bitişi</dt>
              <dd className="rakam font-medium text-metin">
                {tarih(sozlesme.bitis_tarihi)}
              </dd>
            </div>
            <div className="flex gap-3 border-b border-cizgi py-1.5">
              <dt className="w-40 shrink-0 text-metin-ikincil">Sözleşme Süresi</dt>
              <dd className="rakam text-metin">Yaklaşık {sure} ay</dd>
            </div>
            <div className="flex gap-3 border-b border-cizgi py-1.5">
              <dt className="w-40 shrink-0 text-metin-ikincil">Aylık Kira Bedeli</dt>
              <dd className="rakam font-bold text-metin">
                {para(sozlesme.kira_bedeli)}
              </dd>
            </div>
            <div className="flex gap-3 border-b border-cizgi py-1.5">
              <dt className="w-40 shrink-0 text-metin-ikincil">Depozito</dt>
              <dd className="rakam font-medium text-metin">
                {para(sozlesme.depozito)}
              </dd>
            </div>
          </dl>
        </section>

        {/* 4. Genel hükümler */}
        <section className="mt-6">
          <h2 className="mb-2 font-bold text-metin">4. GENEL HÜKÜMLER</h2>
          <ol className="list-decimal space-y-1.5 pl-5 text-metin-ikincil">
            <li>
              Kiracı, kira bedelini her ayın ilk beş günü içinde kiraya verenin
              bildireceği banka hesabına ödemeyi kabul eder.
            </li>
            <li>
              Kiralanan taşınmaz yalnızca konut olarak kullanılacak, kiraya
              verenin yazılı izni olmadan başkasına devredilemeyecek veya alt
              kiraya verilemeyecektir.
            </li>
            <li>
              Elektrik, su, doğalgaz, internet abonelik bedelleri ile aidat
              kiracıya aittir.
            </li>
            <li>
              Kiracı, taşınmazı teslim aldığı durumda korumakla yükümlüdür;
              kendi kusurundan doğan hasarları gidermekle sorumludur.
            </li>
            <li>
              Depozito, sözleşme sonunda taşınmazın hasarsız teslimi hâlinde
              kiracıya iade edilir.
            </li>
            <li>
              Bu sözleşmede hüküm bulunmayan hâllerde 6098 sayılı Türk Borçlar
              Kanunu hükümleri uygulanır.
            </li>
          </ol>
        </section>

        {sozlesme.ozel_sartlar && (
          <section className="mt-6">
            <h2 className="mb-2 font-bold text-metin">5. ÖZEL ŞARTLAR</h2>
            <p className="whitespace-pre-line text-metin-ikincil">
              {sozlesme.ozel_sartlar}
            </p>
          </section>
        )}

        {/* İmza */}
        <section className="mt-10 grid gap-10 sm:grid-cols-2">
          {[
            {
              rol: "KİRAYA VEREN",
              ad: sozlesme.ev_sahibi
                ? `${sozlesme.ev_sahibi.ad} ${sozlesme.ev_sahibi.soyad}`
                : "—",
            },
            {
              rol: "KİRACI",
              ad: sozlesme.kiraci
                ? `${sozlesme.kiraci.ad} ${sozlesme.kiraci.soyad}`
                : "—",
            },
          ].map((t) => (
            <div key={t.rol} className="text-center">
              <p className="text-xs font-semibold text-metin-silik">{t.rol}</p>
              <p className="mt-1 font-medium text-metin">{t.ad}</p>
              <div className="mx-auto mt-10 w-40 border-t border-metin pt-1.5 text-xs text-metin-silik">
                İmza
              </div>
            </div>
          ))}
        </section>

        <footer className="mt-8 border-t border-cizgi pt-3 text-[11px] text-metin-silik">
          Bu sözleşme {tarih(sozlesme.baslangic_tarihi)} tarihinde iki nüsha
          olarak düzenlenmiş; taraflarca sistem üzerinden onaylanmıştır.
          Danışman onayı: {tarih(sozlesme.emlakci_onay_at)} · Müşteri onayı:{" "}
          {tarih(sozlesme.musteri_onay_at)} · Belge no: {sozlesme.id.slice(0, 8).toUpperCase()}
        </footer>
      </article>
    </div>
  );
}
