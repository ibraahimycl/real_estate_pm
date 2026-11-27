"use client";

import { useActionState } from "react";
import { emlakEkle, emlakGuncelle } from "@/modules/emlak/actions";
import { BOS_SONUC } from "@/modules/ortak/sonuc";
import { Alan, Girdi, MetinAlani, OnayKutusu, Secim } from "@/components/ui/Alanlar";
import { GonderButonu } from "@/components/ui/GonderButonu";
import { Uyari } from "@/components/ui/Uyari";
import { Kart, KartGovde } from "@/components/ui/Kart";
import { BagButon } from "@/components/ui/Buton";
import {
  EMLAK_DURUMU,
  EMLAK_TURU,
  ISINMA_TURU,
  ISLEM_TURU,
  secenekler,
} from "@/lib/etiketler";
import { odaAyir } from "@/lib/oda";
import type { Emlak } from "@/types/database";

type MusteriSecenegi = {
  id: string;
  ad: string;
  soyad: string;
  eposta: string;
};

export function EmlakFormu({
  emlak,
  musteriler,
  varsayilanSahip,
}: {
  emlak?: Emlak;
  musteriler: MusteriSecenegi[];
  varsayilanSahip?: string;
}) {
  const duzenleme = Boolean(emlak);
  const mevcutOda = odaAyir(emlak?.oda_sayisi);
  const [durum, eylem] = useActionState(
    duzenleme ? emlakGuncelle : emlakEkle,
    BOS_SONUC,
  );
  const h = durum.alanHatalari;

  return (
    <form action={eylem} className="space-y-5">
      {emlak && <input type="hidden" name="id" value={emlak.id} />}

      {durum.mesaj && (
        <Uyari tur={durum.basarili ? "basari" : "hata"}>{durum.mesaj}</Uyari>
      )}

      {/* --- Sahip ve ilan türü --- */}
      <Kart>
        <KartGovde className="space-y-4">
          <h2 className="font-semibold text-metin">İlan Künyesi</h2>

          <Alan
            etiket="Emlak Sahibi (Müşteri)"
            htmlFor="sahip_profil_id"
            zorunlu
            hata={h?.sahip_profil_id}
            yardim="Bu bilgi ziyaretçilere gösterilmez. Sahibi, kendi hesabında yalnızca ilanın görüntülenme ve kaydedilme sayılarını görür."
          >
            <Secim
              id="sahip_profil_id"
              name="sahip_profil_id"
              defaultValue={emlak?.sahip_profil_id ?? varsayilanSahip ?? ""}
              hatali={Boolean(h?.sahip_profil_id)}
              required
            >
              <option value="">— Müşteri seçiniz —</option>
              {musteriler.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.ad} {m.soyad} ({m.eposta})
                </option>
              ))}
            </Secim>
          </Alan>

          <Alan etiket="İlan Başlığı" htmlFor="baslik" zorunlu hata={h?.baslik}
            yardim="En az 10 karakter. Konum ve oda sayısı içermesi aramada yardımcı olur.">
            <Girdi id="baslik" name="baslik" defaultValue={emlak?.baslik ?? ""}
              placeholder="Örn: Çankaya Kızılırmak'ta Ferah 3+1 Kiralık Daire"
              hatali={Boolean(h?.baslik)} required />
          </Alan>

          <Alan etiket="Açıklama" htmlFor="aciklama" hata={h?.aciklama}>
            <MetinAlani id="aciklama" name="aciklama" rows={3}
              defaultValue={emlak?.aciklama ?? ""} hatali={Boolean(h?.aciklama)} />
          </Alan>

          <div className="grid sm:grid-cols-3 gap-4">
            <Alan etiket="İşlem Türü" htmlFor="islem_turu" zorunlu hata={h?.islem_turu}>
              <Secim id="islem_turu" name="islem_turu"
                defaultValue={emlak?.islem_turu ?? "kiralik"} hatali={Boolean(h?.islem_turu)}>
                {secenekler(ISLEM_TURU).map((s) => (
                  <option key={s.deger} value={s.deger}>{s.etiket}</option>
                ))}
              </Secim>
            </Alan>
            <Alan etiket="Emlak Türü" htmlFor="emlak_turu" zorunlu hata={h?.emlak_turu}>
              <Secim id="emlak_turu" name="emlak_turu"
                defaultValue={emlak?.emlak_turu ?? "daire"} hatali={Boolean(h?.emlak_turu)}>
                {secenekler(EMLAK_TURU).map((s) => (
                  <option key={s.deger} value={s.deger}>{s.etiket}</option>
                ))}
              </Secim>
            </Alan>
            <Alan etiket="Durum" htmlFor="durum" zorunlu hata={h?.durum}
              yardim="Yalnızca 'Aktif' ve 'Rezerve' ilanlar sitede görünür.">
              <Secim id="durum" name="durum" defaultValue={emlak?.durum ?? "aktif"}
                hatali={Boolean(h?.durum)}>
                {secenekler(EMLAK_DURUMU).map((s) => (
                  <option key={s.deger} value={s.deger}>{s.etiket}</option>
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
            <Alan etiket="Fiyat (TL)" htmlFor="fiyat" zorunlu hata={h?.fiyat}
              yardim="Kiralık ilanlarda aylık kira bedeli.">
              <Girdi id="fiyat" name="fiyat" type="number" min="1" step="1"
                defaultValue={emlak?.fiyat ?? ""} hatali={Boolean(h?.fiyat)} required />
            </Alan>
            <Alan etiket="Aidat (TL)" htmlFor="aidat" hata={h?.aidat}>
              <Girdi id="aidat" name="aidat" type="number" min="0" step="1"
                defaultValue={emlak?.aidat ?? 0} hatali={Boolean(h?.aidat)} />
            </Alan>
            <Alan etiket="Depozito (TL)" htmlFor="depozito" hata={h?.depozito}>
              <Girdi id="depozito" name="depozito" type="number" min="0" step="1"
                defaultValue={emlak?.depozito ?? ""} hatali={Boolean(h?.depozito)} />
            </Alan>
          </div>
        </KartGovde>
      </Kart>

      {/* --- Nitelikler --- */}
      <Kart>
        <KartGovde className="space-y-4">
          <h2 className="font-semibold text-metin">Emlak Nitelikleri</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <Alan etiket="Brüt Alan (m²)" htmlFor="m2_brut" zorunlu hata={h?.m2_brut}>
              <Girdi id="m2_brut" name="m2_brut" type="number" min="1" step="1"
                defaultValue={emlak?.m2_brut ?? ""} hatali={Boolean(h?.m2_brut)} required />
            </Alan>
            <Alan etiket="Net Alan (m²)" htmlFor="m2_net" zorunlu hata={h?.m2_net}
              yardim="Brüt alandan büyük olamaz.">
              <Girdi id="m2_net" name="m2_net" type="number" min="1" step="1"
                defaultValue={emlak?.m2_net ?? ""} hatali={Boolean(h?.m2_net)} required />
            </Alan>
            <Alan etiket="Oda Sayısı" htmlFor="oda_n" zorunlu hata={h?.oda_sayisi}
              yardim="Oda ve salon ayrı yazılır; 7+3 gibi sıra dışı kombinasyonlar da girilebilir.">
              <div className="flex items-center gap-2">
                <Girdi id="oda_n" name="oda_n" type="number" min="1" max="99"
                  aria-label="Oda sayısı" placeholder="3"
                  defaultValue={mevcutOda.oda ?? ""} hatali={Boolean(h?.oda_sayisi)} required />
                <span className="text-metin-silik">+</span>
                <Girdi id="salon_n" name="salon_n" type="number" min="0" max="99"
                  aria-label="Salon sayısı" placeholder="1"
                  defaultValue={mevcutOda.salon ?? ""} hatali={Boolean(h?.oda_sayisi)} required />
              </div>
            </Alan>
            <Alan etiket="Bulunduğu Kat" htmlFor="bulundugu_kat" zorunlu hata={h?.bulundugu_kat}
              yardim="Zemin kat için 0, bodrum için negatif değer.">
              <Girdi id="bulundugu_kat" name="bulundugu_kat" type="number" min="-3" max="100"
                defaultValue={emlak?.bulundugu_kat ?? 0} hatali={Boolean(h?.bulundugu_kat)} required />
            </Alan>
            <Alan etiket="Bina Kat Sayısı" htmlFor="bina_kat_sayisi" zorunlu hata={h?.bina_kat_sayisi}>
              <Girdi id="bina_kat_sayisi" name="bina_kat_sayisi" type="number" min="1" max="100"
                defaultValue={emlak?.bina_kat_sayisi ?? 1} hatali={Boolean(h?.bina_kat_sayisi)} required />
            </Alan>
            <Alan etiket="Bina Yaşı" htmlFor="bina_yasi" zorunlu hata={h?.bina_yasi}>
              <Girdi id="bina_yasi" name="bina_yasi" type="number" min="0" max="200"
                defaultValue={emlak?.bina_yasi ?? 0} hatali={Boolean(h?.bina_yasi)} required />
            </Alan>
            <Alan etiket="Isıtma Türü" htmlFor="isinma_turu" zorunlu hata={h?.isinma_turu}>
              <Secim id="isinma_turu" name="isinma_turu"
                defaultValue={emlak?.isinma_turu ?? "dogalgaz_kombi"} hatali={Boolean(h?.isinma_turu)}>
                {secenekler(ISINMA_TURU).map((s) => (
                  <option key={s.deger} value={s.deger}>{s.etiket}</option>
                ))}
              </Secim>
            </Alan>
            <Alan etiket="Banyo Sayısı" htmlFor="banyo_sayisi" hata={h?.banyo_sayisi}>
              <Girdi id="banyo_sayisi" name="banyo_sayisi" type="number" min="0" max="10"
                defaultValue={emlak?.banyo_sayisi ?? ""} hatali={Boolean(h?.banyo_sayisi)} />
            </Alan>
          </div>

          <fieldset className="pt-1">
            <legend className="text-sm font-medium text-metin mb-2">
              Ek Özellikler
            </legend>
            <div className="grid sm:grid-cols-3 gap-2.5">
              <OnayKutusu etiket="Asansör" name="asansor" defaultChecked={emlak?.asansor} />
              <OnayKutusu etiket="Otopark" name="otopark" defaultChecked={emlak?.otopark} />
              <OnayKutusu etiket="Balkon" name="balkon" defaultChecked={emlak?.balkon} />
              <OnayKutusu etiket="Eşyalı" name="esyali" defaultChecked={emlak?.esyali} />
              <OnayKutusu etiket="Site İçinde" name="site_icinde" defaultChecked={emlak?.site_icinde} />
              <OnayKutusu etiket="Krediye Uygun" name="krediye_uygun" defaultChecked={emlak?.krediye_uygun} />
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
              <Girdi id="il" name="il" defaultValue={emlak?.il ?? "Ankara"}
                hatali={Boolean(h?.il)} required />
            </Alan>
            <Alan etiket="İlçe" htmlFor="ilce" zorunlu hata={h?.ilce}>
              <Girdi id="ilce" name="ilce" defaultValue={emlak?.ilce ?? ""}
                hatali={Boolean(h?.ilce)} required />
            </Alan>
            <Alan etiket="Mahalle" htmlFor="mahalle" hata={h?.mahalle}>
              <Girdi id="mahalle" name="mahalle" defaultValue={emlak?.mahalle ?? ""}
                hatali={Boolean(h?.mahalle)} />
            </Alan>
          </div>
          <Alan etiket="Açık Adres" htmlFor="adres" hata={h?.adres}
            yardim="Yalnızca ofis içi görünür; ilan detayında gösterilmez.">
            <MetinAlani id="adres" name="adres" rows={2}
              defaultValue={emlak?.adres ?? ""} hatali={Boolean(h?.adres)} />
          </Alan>
        </KartGovde>
      </Kart>

      <div className="flex justify-end gap-2">
        <BagButon href="/panel/emlaklar" gorunum="ikincil">Vazgeç</BagButon>
        <GonderButonu>
          {duzenleme ? "Değişiklikleri Kaydet" : "İlanı Kaydet"}
        </GonderButonu>
      </div>
    </form>
  );
}
