"use client";

import { useActionState } from "react";
import { musteriIlanTalebiGonder } from "@/modules/emlak/actions";
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
import { BagButon } from "@/components/ui/Buton";
import {
  EMLAK_TURU,
  ISINMA_TURU,
  ISLEM_TURU,
  secenekler,
} from "@/lib/etiketler";

export function MusteriIlanFormu() {
  const [durum, eylem] = useActionState(musteriIlanTalebiGonder, BOS_SONUC);
  const h = durum.alanHatalari;

  return (
    <form action={eylem} className="space-y-5">
      {durum.mesaj && (
        <Uyari tur={durum.basarili ? "basari" : "hata"}>{durum.mesaj}</Uyari>
      )}

      <Uyari tur="bilgi">
        Girdiğiniz mülk bilgileri önce emlak danışmanının incelemesine
        gönderilir. Danışman onayladıktan sonra ilanınız site kataloğunda
        yayınlanır.
      </Uyari>

      {/* --- İlan Künyesi --- */}
      <Kart>
        <KartGovde className="space-y-4">
          <h2 className="font-semibold text-metin">İlan Künyesi</h2>

          <Alan
            etiket="İlan Başlığı"
            htmlFor="baslik"
            zorunlu
            hata={h?.baslik}
            yardim="En az 10 karakter. Konum ve oda sayısı içermesi aramada yardımcı olur."
          >
            <Girdi
              id="baslik"
              name="baslik"
              placeholder="Örn: Çankaya Kızılırmak'ta Ferah 3+1 Kiralık Daire"
              hatali={Boolean(h?.baslik)}
              required
            />
          </Alan>

          <Alan etiket="Açıklama" htmlFor="aciklama" hata={h?.aciklama}>
            <MetinAlani
              id="aciklama"
              name="aciklama"
              rows={3}
              placeholder="Mülkün öne çıkan özellikleri, cephe, ulaşım vb."
              hatali={Boolean(h?.aciklama)}
            />
          </Alan>

          <div className="grid sm:grid-cols-2 gap-4">
            <Alan
              etiket="İşlem Türü"
              htmlFor="islem_turu"
              zorunlu
              hata={h?.islem_turu}
            >
              <Secim
                id="islem_turu"
                name="islem_turu"
                defaultValue="satilik"
                hatali={Boolean(h?.islem_turu)}
              >
                {secenekler(ISLEM_TURU).map((s) => (
                  <option key={s.deger} value={s.deger}>
                    {s.etiket}
                  </option>
                ))}
              </Secim>
            </Alan>
            <Alan
              etiket="Emlak Türü"
              htmlFor="emlak_turu"
              zorunlu
              hata={h?.emlak_turu}
            >
              <Secim
                id="emlak_turu"
                name="emlak_turu"
                defaultValue="daire"
                hatali={Boolean(h?.emlak_turu)}
              >
                {secenekler(EMLAK_TURU).map((s) => (
                  <option key={s.deger} value={s.deger}>
                    {s.etiket}
                  </option>
                ))}
              </Secim>
            </Alan>
          </div>
        </KartGovde>
      </Kart>

      {/* --- Fiyat --- */}
      <Kart>
        <KartGovde className="space-y-4">
          <h2 className="font-semibold text-metin">Fiyat Bilgileri</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <Alan
              etiket="Fiyat (TL)"
              htmlFor="fiyat"
              zorunlu
              hata={h?.fiyat}
              yardim="Kiralık ilanlarda aylık kira bedeli."
            >
              <Girdi
                id="fiyat"
                name="fiyat"
                type="number"
                min="1"
                step="1"
                hatali={Boolean(h?.fiyat)}
                required
              />
            </Alan>
            <Alan etiket="Aidat (TL)" htmlFor="aidat" hata={h?.aidat}>
              <Girdi
                id="aidat"
                name="aidat"
                type="number"
                min="0"
                step="1"
                defaultValue={0}
                hatali={Boolean(h?.aidat)}
              />
            </Alan>
            <Alan etiket="Depozito (TL)" htmlFor="depozito" hata={h?.depozito}>
              <Girdi
                id="depozito"
                name="depozito"
                type="number"
                min="0"
                step="1"
                hatali={Boolean(h?.depozito)}
              />
            </Alan>
          </div>
        </KartGovde>
      </Kart>

      {/* --- Nitelikler --- */}
      <Kart>
        <KartGovde className="space-y-4">
          <h2 className="font-semibold text-metin">Emlak Nitelikleri</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <Alan
              etiket="Brüt Alan (m²)"
              htmlFor="m2_brut"
              zorunlu
              hata={h?.m2_brut}
            >
              <Girdi
                id="m2_brut"
                name="m2_brut"
                type="number"
                min="1"
                step="1"
                hatali={Boolean(h?.m2_brut)}
                required
              />
            </Alan>
            <Alan
              etiket="Net Alan (m²)"
              htmlFor="m2_net"
              zorunlu
              hata={h?.m2_net}
              yardim="Brüt alandan büyük olamaz."
            >
              <Girdi
                id="m2_net"
                name="m2_net"
                type="number"
                min="1"
                step="1"
                hatali={Boolean(h?.m2_net)}
                required
              />
            </Alan>
            <Alan
              etiket="Oda Sayısı"
              htmlFor="oda_n"
              zorunlu
              hata={h?.oda_sayisi}
              yardim="Oda ve salon ayrı yazılır (örn. 3 ve 1)."
            >
              <div className="flex items-center gap-2">
                <Girdi
                  id="oda_n"
                  name="oda_n"
                  type="number"
                  min="1"
                  max="99"
                  aria-label="Oda sayısı"
                  placeholder="3"
                  hatali={Boolean(h?.oda_sayisi)}
                  required
                />
                <span className="text-metin-silik">+</span>
                <Girdi
                  id="salon_n"
                  name="salon_n"
                  type="number"
                  min="0"
                  max="99"
                  aria-label="Salon sayısı"
                  placeholder="1"
                  hatali={Boolean(h?.oda_sayisi)}
                  required
                />
              </div>
            </Alan>
            <Alan
              etiket="Bulunduğu Kat"
              htmlFor="bulundugu_kat"
              zorunlu
              hata={h?.bulundugu_kat}
              yardim="Zemin kat için 0, bodrum için negatif değer."
            >
              <Girdi
                id="bulundugu_kat"
                name="bulundugu_kat"
                type="number"
                min="-3"
                max="100"
                defaultValue={0}
                hatali={Boolean(h?.bulundugu_kat)}
                required
              />
            </Alan>
            <Alan
              etiket="Bina Kat Sayısı"
              htmlFor="bina_kat_sayisi"
              zorunlu
              hata={h?.bina_kat_sayisi}
            >
              <Girdi
                id="bina_kat_sayisi"
                name="bina_kat_sayisi"
                type="number"
                min="1"
                max="100"
                defaultValue={1}
                hatali={Boolean(h?.bina_kat_sayisi)}
                required
              />
            </Alan>
            <Alan
              etiket="Bina Yaşı"
              htmlFor="bina_yasi"
              zorunlu
              hata={h?.bina_yasi}
            >
              <Girdi
                id="bina_yasi"
                name="bina_yasi"
                type="number"
                min="0"
                max="200"
                defaultValue={0}
                hatali={Boolean(h?.bina_yasi)}
                required
              />
            </Alan>
            <Alan
              etiket="Isıtma Türü"
              htmlFor="isinma_turu"
              zorunlu
              hata={h?.isinma_turu}
            >
              <Secim
                id="isinma_turu"
                name="isinma_turu"
                defaultValue="dogalgaz_kombi"
                hatali={Boolean(h?.isinma_turu)}
              >
                {secenekler(ISINMA_TURU).map((s) => (
                  <option key={s.deger} value={s.deger}>
                    {s.etiket}
                  </option>
                ))}
              </Secim>
            </Alan>
            <Alan
              etiket="Banyo Sayısı"
              htmlFor="banyo_sayisi"
              hata={h?.banyo_sayisi}
            >
              <Girdi
                id="banyo_sayisi"
                name="banyo_sayisi"
                type="number"
                min="0"
                max="10"
                hatali={Boolean(h?.banyo_sayisi)}
              />
            </Alan>
          </div>

          <fieldset className="pt-1">
            <legend className="text-sm font-medium text-metin mb-2">
              Ek Özellikler
            </legend>
            <div className="grid sm:grid-cols-3 gap-2.5">
              <OnayKutusu etiket="Asansör" name="asansor" />
              <OnayKutusu etiket="Otopark" name="otopark" />
              <OnayKutusu etiket="Balkon" name="balkon" />
              <OnayKutusu etiket="Eşyalı" name="esyali" />
              <OnayKutusu etiket="Site İçinde" name="site_icinde" />
              <OnayKutusu etiket="Krediye Uygun" name="krediye_uygun" />
            </div>
          </fieldset>
        </KartGovde>
      </Kart>

      {/* --- Konum --- */}
      <Kart>
        <KartGovde className="space-y-4">
          <h2 className="font-semibold text-metin">Konum</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <Alan etiket="İl" htmlFor="il" zorunlu hata={h?.il}>
              <Girdi
                id="il"
                name="il"
                defaultValue="Ankara"
                hatali={Boolean(h?.il)}
                required
              />
            </Alan>
            <Alan etiket="İlçe" htmlFor="ilce" zorunlu hata={h?.ilce}>
              <Girdi id="ilce" name="ilce" hatali={Boolean(h?.ilce)} required />
            </Alan>
            <Alan etiket="Mahalle" htmlFor="mahalle" hata={h?.mahalle}>
              <Girdi id="mahalle" name="mahalle" hatali={Boolean(h?.mahalle)} />
            </Alan>
          </div>
          <Alan
            etiket="Açık Adres"
            htmlFor="adres"
            hata={h?.adres}
            yardim="Yalnızca emlak ofisi tarafından görülür; sitede herkese açık gösterilmez."
          >
            <MetinAlani
              id="adres"
              name="adres"
              rows={2}
              hatali={Boolean(h?.adres)}
            />
          </Alan>
        </KartGovde>
      </Kart>

      {/* --- İsteğe Bağlı Fotoğraf --- */}
      <Kart>
        <KartGovde className="space-y-3">
          <h2 className="font-semibold text-metin">Kapak Fotoğrafı (İsteğe Bağlı)</h2>
          <Alan
            etiket="Mülk Fotoğrafı"
            htmlFor="dosya"
            yardim="JPEG, PNG, WebP veya AVIF · en fazla 5 MB. Diğer fotoğrafları danışmanınız da ekleyebilir."
          >
            <input
              id="dosya"
              name="dosya"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              className="block w-full text-sm text-metin-ikincil file:mr-3 file:rounded-lg file:border-0 file:bg-yuzey-alt file:px-3 file:py-2 file:text-sm file:font-medium file:text-metin hover:file:bg-cizgi"
            />
          </Alan>
        </KartGovde>
      </Kart>

      <div className="flex justify-end gap-2">
        <BagButon href="/hesabim/ilanlarim" gorunum="ikincil">
          Vazgeç
        </BagButon>
        <GonderButonu bekleyenMetin="Gönderiliyor…">
          Emlakçı Onayına Gönder
        </GonderButonu>
      </div>
    </form>
  );
}
