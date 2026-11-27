"use client";

import { useActionState } from "react";
import { talepOlustur } from "@/modules/talep/actions";
import { BOS_SONUC } from "@/modules/ortak/sonuc";
import {
  Alan,
  Girdi,
  MetinAlani,
  OnayKutusu,
  Secim,
} from "@/components/ui/Alanlar";
import { GonderButonu } from "@/components/ui/GonderButonu";
import { Uyari } from "@/components/ui/Uyari";
import { Kart, KartGovde } from "@/components/ui/Kart";
import { EMLAK_TURU, ISLEM_TURU, secenekler } from "@/lib/etiketler";
import { ODA_ON_TANIMLI } from "@/lib/oda";

export function TalepFormu({
  adSoyad,
  telefon,
  eposta,
}: {
  adSoyad?: string;
  telefon?: string;
  eposta?: string;
}) {
  const [durum, eylem] = useActionState(talepOlustur, BOS_SONUC);
  const h = durum.alanHatalari;

  if (durum.basarili) {
    return (
      <Uyari tur="basari" baslik="Talebiniz kaydedildi">
        {durum.mesaj}
      </Uyari>
    );
  }

  return (
    <form action={eylem} className="space-y-5">
      {durum.mesaj && !h && <Uyari tur="hata">{durum.mesaj}</Uyari>}

      <Kart>
        <KartGovde className="space-y-4">
          <h2 className="font-semibold text-metin">İletişim Bilgileriniz</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <Alan etiket="Ad Soyad" htmlFor="ad_soyad" zorunlu hata={h?.ad_soyad}>
              <Girdi id="ad_soyad" name="ad_soyad" defaultValue={adSoyad ?? ""}
                hatali={Boolean(h?.ad_soyad)} required />
            </Alan>
            <Alan etiket="Telefon" htmlFor="telefon" zorunlu hata={h?.telefon}>
              <Girdi id="telefon" name="telefon" inputMode="numeric" maxLength={11}
                placeholder="05321234567" defaultValue={telefon ?? ""}
                hatali={Boolean(h?.telefon)} required />
            </Alan>
            <Alan etiket="E-posta" htmlFor="eposta" hata={h?.eposta}>
              <Girdi id="eposta" name="eposta" type="email"
                defaultValue={eposta ?? ""} hatali={Boolean(h?.eposta)} />
            </Alan>
          </div>
        </KartGovde>
      </Kart>

      <Kart>
        <KartGovde className="space-y-4">
          <h2 className="font-semibold text-metin">Aradığınız Yer</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <Alan etiket="İşlem Türü" htmlFor="islem_turu" zorunlu hata={h?.islem_turu}>
              <Secim id="islem_turu" name="islem_turu" defaultValue="kiralik"
                hatali={Boolean(h?.islem_turu)}>
                {secenekler(ISLEM_TURU).map((s) => (
                  <option key={s.deger} value={s.deger}>{s.etiket}</option>
                ))}
              </Secim>
            </Alan>
            <Alan etiket="Emlak Türü" htmlFor="emlak_turu" hata={h?.emlak_turu}>
              <Secim id="emlak_turu" name="emlak_turu" defaultValue=""
                hatali={Boolean(h?.emlak_turu)}>
                <option value="">Fark etmez</option>
                {secenekler(EMLAK_TURU).map((s) => (
                  <option key={s.deger} value={s.deger}>{s.etiket}</option>
                ))}
              </Secim>
            </Alan>
            <Alan etiket="İl" htmlFor="il" hata={h?.il}>
              <Girdi id="il" name="il" defaultValue="Ankara" hatali={Boolean(h?.il)} />
            </Alan>
            <Alan etiket="İlçe" htmlFor="ilce" hata={h?.ilce}>
              <Girdi id="ilce" name="ilce" placeholder="Örn: Gölbaşı"
                hatali={Boolean(h?.ilce)} />
            </Alan>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Alan etiket="Alt Bütçe (TL)" htmlFor="min_fiyat" hata={h?.min_fiyat}>
              <Girdi id="min_fiyat" name="min_fiyat" type="number" min="0" step="1000"
                hatali={Boolean(h?.min_fiyat)} />
            </Alan>
            <Alan etiket="Üst Bütçe (TL)" htmlFor="max_fiyat" hata={h?.max_fiyat}
              yardim="Eşleştirme için en önemli kriter.">
              <Girdi id="max_fiyat" name="max_fiyat" type="number" min="0" step="1000"
                hatali={Boolean(h?.max_fiyat)} />
            </Alan>
          </div>

          <fieldset>
            <legend className="mb-2 block text-sm font-medium text-metin">
              Oda Sayısı
            </legend>
            <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-5">
              {ODA_ON_TANIMLI.map((o) => (
                <OnayKutusu key={o} etiket={o} name="oda" value={o} className="text-xs" />
              ))}
            </div>
            <div className="mt-3 flex items-end gap-2 rounded-lg border border-cizgi bg-yuzey-alt/60 p-3">
              <p className="pb-2 text-xs text-metin-ikincil">
                Listede yoksa yazın:
              </p>
              <Girdi name="oda_n" type="number" min="1" max="99" placeholder="7"
                aria-label="Oda sayısı" className="w-20 py-1.5 text-sm" />
              <span className="pb-2 text-metin-silik">+</span>
              <Girdi name="salon_n" type="number" min="0" max="99" placeholder="3"
                aria-label="Salon sayısı" className="w-20 py-1.5 text-sm" />
            </div>
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2">
            <Alan etiket="En Az Alan (m²)" htmlFor="min_m2" hata={h?.min_m2}>
              <Girdi id="min_m2" name="min_m2" type="number" min="1" step="5"
                hatali={Boolean(h?.min_m2)} />
            </Alan>
            <Alan etiket="En Fazla Bina Yaşı" htmlFor="max_bina_yasi" hata={h?.max_bina_yasi}>
              <Girdi id="max_bina_yasi" name="max_bina_yasi" type="number" min="0"
                hatali={Boolean(h?.max_bina_yasi)} />
            </Alan>
          </div>

          <fieldset>
            <legend className="mb-2 block text-sm font-medium text-metin">
              Olmazsa Olmaz Şartlar
            </legend>
            <div className="space-y-1.5">
              <OnayKutusu etiket="Asansör olmalı" name="asansor_sart" />
              <OnayKutusu etiket="Otopark olmalı" name="otopark_sart" />
              <OnayKutusu etiket="Eşyalı olmalı" name="esyali_sart" />
            </div>
          </fieldset>

          <Alan etiket="Eklemek istedikleriniz" htmlFor="notlar" hata={h?.notlar}>
            <MetinAlani id="notlar" name="notlar" rows={3}
              placeholder="Örn: Okula yürüme mesafesinde olsun, güney cepheli tercih ederim."
              hatali={Boolean(h?.notlar)} />
          </Alan>
        </KartGovde>
      </Kart>

      <Kart>
        <KartGovde className="space-y-3">
          <OnayKutusu
            etiket="Kriterlerime uyan ilan düştüğünde bana mesaj gönderilsin."
            name="bildirim_izni"
            defaultChecked
          />
          <p className="text-xs text-metin-silik">
            Bu izni vermezseniz talebiniz yine kaydedilir ve danışmanımız
            tarafından görülür; ancak otomatik bildirim gönderilmez. İzni
            dilediğiniz zaman &quot;Taleplerim&quot; ekranından geri
            çekebilirsiniz.
          </p>
        </KartGovde>
      </Kart>

      <div className="flex justify-end">
        <GonderButonu>Talebimi Kaydet</GonderButonu>
      </div>
    </form>
  );
}
