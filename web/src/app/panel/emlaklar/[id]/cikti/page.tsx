import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { emlakGetir } from "@/modules/emlak/queries";
import { isyeriGetir } from "@/modules/isyeri/queries";
import { musteriGetir } from "@/modules/musteri/queries";
import { YazdirButonu } from "@/components/YazdirButonu";
import { BagButon } from "@/components/ui/Buton";
import {
  EMLAK_DURUMU,
  EMLAK_TURU,
  ISINMA_TURU,
  ISLEM_TURU,
} from "@/lib/etiketler";
import { kat, metrekare, para, tarih, telefon } from "@/lib/bicim";

export const metadata: Metadata = { title: "İlan Çıktısı" };

function Satir({ etiket, deger }: { etiket: string; deger: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-cizgi py-1.5">
      <dt className="text-metin-ikincil">{etiket}</dt>
      <dd className="font-medium text-metin text-right rakam">{deger}</dd>
    </div>
  );
}

/**
 * Modül 4 — Yazıcı çıktısı.
 * Ekranda normal görünür; yazdırıldığında kenar çubuğu, butonlar ve
 * gezinme öğeleri gizlenir (globals.css içindeki @media print kuralları).
 */
export default async function IlanCiktisiSayfasi({
  params,
}: PageProps<"/panel/emlaklar/[id]/cikti">) {
  const { id } = await params;
  const emlak = await emlakGetir(id);
  if (!emlak) notFound();

  const [ofis, sahip] = await Promise.all([
    isyeriGetir(),
    musteriGetir(emlak.sahip_profil_id),
  ]);

  const ozellikler = [
    emlak.asansor && "Asansör",
    emlak.otopark && "Otopark",
    emlak.balkon && "Balkon",
    emlak.esyali && "Eşyalı",
    emlak.site_icinde && "Site içinde",
    emlak.krediye_uygun && "Krediye uygun",
  ].filter(Boolean) as string[];

  return (
    <div className="max-w-3xl">
      <div className="flex justify-between items-center mb-5 yazdirma-gizle">
        <BagButon href={`/panel/emlaklar/${emlak.id}`} gorunum="ikincil">
          ← İlana dön
        </BagButon>
        <YazdirButonu etiket="Yazdır / PDF olarak kaydet" />
      </div>

      <article className="yazdirma-sayfa bg-yuzey border border-cizgi rounded-kart p-8">
        {/* Antet */}
        <header className="flex items-start justify-between gap-6 pb-4 border-b-2 border-metin">
          <div>
            <h1 className="text-lg font-bold text-metin">
              {ofis?.unvan ?? "Emlak İşletmesi"}
            </h1>
            {ofis && (
              <p className="text-xs text-metin-ikincil mt-1 leading-relaxed">
                {ofis.adres}, {ofis.ilce}/{ofis.il}
                <br />
                Tel: {telefon(ofis.telefon)} · {ofis.eposta}
                {ofis.vergi_no && ` · VKN: ${ofis.vergi_no}`}
              </p>
            )}
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs text-metin-silik">İlan No</p>
            <p className="text-2xl font-bold rakam text-metin">
              {emlak.ilan_no}
            </p>
            <p className="text-xs text-metin-silik mt-1">
              Çıktı: {tarih(new Date().toISOString())}
            </p>
          </div>
        </header>

        <h2 className="text-xl font-semibold text-metin mt-6">{emlak.baslik}</h2>
        <p className="text-sm text-metin-ikincil mt-1">
          {emlak.il} / {emlak.ilce}
          {emlak.mahalle && ` / ${emlak.mahalle}`}
        </p>

        <p className="text-2xl font-bold text-marka-700 rakam mt-4">
          {para(emlak.fiyat)}
          <span className="text-sm font-normal text-metin-ikincil ml-2">
            {ISLEM_TURU[emlak.islem_turu]}
          </span>
        </p>

        {emlak.aciklama && (
          <p className="text-sm text-metin-ikincil mt-4 leading-relaxed">
            {emlak.aciklama}
          </p>
        )}

        <div className="grid sm:grid-cols-2 gap-x-10 gap-y-0 mt-6 text-sm">
          <dl>
            <Satir etiket="Emlak Türü" deger={EMLAK_TURU[emlak.emlak_turu]} />
            <Satir etiket="Oda Sayısı" deger={emlak.oda_sayisi} />
            <Satir etiket="Brüt / Net Alan" deger={`${metrekare(emlak.m2_brut)} / ${metrekare(emlak.m2_net)}`} />
            <Satir etiket="Bulunduğu Kat" deger={kat(emlak.bulundugu_kat)} />
            <Satir etiket="Bina Kat Sayısı" deger={String(emlak.bina_kat_sayisi)} />
          </dl>
          <dl>
            <Satir etiket="Bina Yaşı" deger={`${emlak.bina_yasi}`} />
            <Satir etiket="Isıtma" deger={ISINMA_TURU[emlak.isinma_turu]} />
            <Satir etiket="Banyo Sayısı" deger={emlak.banyo_sayisi?.toString() ?? "—"} />
            <Satir etiket="Aidat" deger={para(emlak.aidat)} />
            <Satir etiket="Depozito" deger={para(emlak.depozito)} />
          </dl>
        </div>

        {ozellikler.length > 0 && (
          <div className="mt-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-metin-silik mb-1.5">
              Ek Özellikler
            </p>
            <p className="text-sm text-metin">{ozellikler.join(" · ")}</p>
          </div>
        )}

        {/* Ofis içi bölüm: ziyaretçiye gösterilen sayfada yer almaz */}
        <div className="mt-6 pt-4 border-t border-cizgi">
          <p className="text-xs font-semibold uppercase tracking-wide text-metin-silik mb-2">
            Ofis İçi Bilgiler
          </p>
          <dl className="text-sm">
            <Satir
              etiket="Emlak Sahibi"
              deger={sahip ? `${sahip.ad} ${sahip.soyad}` : "—"}
            />
            <Satir
              etiket="Sahibi İletişim"
              deger={sahip ? telefon(sahip.cep_telefon) : "—"}
            />
            <Satir etiket="Açık Adres" deger={emlak.adres ?? "—"} />
            <Satir etiket="İlan Durumu" deger={EMLAK_DURUMU[emlak.durum]} />
            <Satir etiket="Yayın Tarihi" deger={tarih(emlak.yayin_tarihi)} />
          </dl>
        </div>

        <footer className="mt-6 pt-3 border-t border-cizgi text-[11px] text-metin-silik">
          Bu belge {ofis?.unvan ?? "emlak işletmesi"} tarafından bilgilendirme
          amacıyla düzenlenmiştir ve sözleşme niteliği taşımaz.
        </footer>
      </article>
    </div>
  );
}
