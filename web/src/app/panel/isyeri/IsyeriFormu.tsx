"use client";

import { useActionState } from "react";
import { isyeriKaydet } from "@/modules/isyeri/actions";
import { BOS_SONUC } from "@/modules/ortak/sonuc";
import { Alan, Girdi, MetinAlani } from "@/components/ui/Alanlar";
import { GonderButonu } from "@/components/ui/GonderButonu";
import { Uyari } from "@/components/ui/Uyari";
import { Kart, KartGovde } from "@/components/ui/Kart";
import type { Ofis } from "@/types/database";

export function IsyeriFormu({ ofis }: { ofis: Ofis | null }) {
  const [durum, eylem] = useActionState(isyeriKaydet, BOS_SONUC);
  const h = durum.alanHatalari;

  return (
    <form action={eylem}>
      {ofis && <input type="hidden" name="id" value={ofis.id} />}

      {durum.mesaj && (
        <div className="mb-5">
          <Uyari tur={durum.basarili ? "basari" : "hata"}>{durum.mesaj}</Uyari>
        </div>
      )}

      <div className="space-y-5">
        <Kart>
          <KartGovde className="space-y-4">
            <h2 className="font-semibold text-metin">İşletme Bilgileri</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Alan etiket="İşletme Unvanı" htmlFor="unvan" zorunlu hata={h?.unvan}>
                <Girdi id="unvan" name="unvan" defaultValue={ofis?.unvan ?? ""}
                  placeholder="Örn: Başkent Emlak Yönetim Ltd. Şti."
                  hatali={Boolean(h?.unvan)} required />
              </Alan>
              <Alan etiket="Yetkili Adı Soyadı" htmlFor="yetkili_ad" zorunlu hata={h?.yetkili_ad}>
                <Girdi id="yetkili_ad" name="yetkili_ad" defaultValue={ofis?.yetkili_ad ?? ""}
                  hatali={Boolean(h?.yetkili_ad)} required />
              </Alan>
              <Alan etiket="Vergi Dairesi" htmlFor="vergi_dairesi" hata={h?.vergi_dairesi}>
                <Girdi id="vergi_dairesi" name="vergi_dairesi"
                  defaultValue={ofis?.vergi_dairesi ?? ""} hatali={Boolean(h?.vergi_dairesi)} />
              </Alan>
              <Alan etiket="Vergi Numarası" htmlFor="vergi_no" hata={h?.vergi_no}
                yardim="10 veya 11 haneli, yalnızca rakam.">
                <Girdi id="vergi_no" name="vergi_no" inputMode="numeric" maxLength={11}
                  defaultValue={ofis?.vergi_no ?? ""} hatali={Boolean(h?.vergi_no)} />
              </Alan>
            </div>
          </KartGovde>
        </Kart>

        <Kart>
          <KartGovde className="space-y-4">
            <h2 className="font-semibold text-metin">Adres</h2>
            <Alan etiket="Açık Adres" htmlFor="adres" zorunlu hata={h?.adres}>
              <MetinAlani id="adres" name="adres" rows={2} defaultValue={ofis?.adres ?? ""}
                hatali={Boolean(h?.adres)} required />
            </Alan>
            <div className="grid sm:grid-cols-2 gap-4">
              <Alan etiket="İl" htmlFor="il" zorunlu hata={h?.il}>
                <Girdi id="il" name="il" defaultValue={ofis?.il ?? ""} hatali={Boolean(h?.il)} required />
              </Alan>
              <Alan etiket="İlçe" htmlFor="ilce" zorunlu hata={h?.ilce}>
                <Girdi id="ilce" name="ilce" defaultValue={ofis?.ilce ?? ""} hatali={Boolean(h?.ilce)} required />
              </Alan>
            </div>
          </KartGovde>
        </Kart>

        <Kart>
          <KartGovde className="space-y-4">
            <h2 className="font-semibold text-metin">İletişim</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Alan etiket="Telefon" htmlFor="telefon" zorunlu hata={h?.telefon}
                yardim="Başında 0 ile, boşluksuz. Örn: 03124445566">
                <Girdi id="telefon" name="telefon" inputMode="numeric" maxLength={11}
                  defaultValue={ofis?.telefon ?? ""} hatali={Boolean(h?.telefon)} required />
              </Alan>
              <Alan etiket="Faks" htmlFor="faks" hata={h?.faks}>
                <Girdi id="faks" name="faks" inputMode="numeric" maxLength={11}
                  defaultValue={ofis?.faks ?? ""} hatali={Boolean(h?.faks)} />
              </Alan>
              <Alan etiket="E-posta" htmlFor="eposta" zorunlu hata={h?.eposta}>
                <Girdi id="eposta" name="eposta" type="email"
                  defaultValue={ofis?.eposta ?? ""} hatali={Boolean(h?.eposta)} required />
              </Alan>
              <Alan etiket="Web Sitesi" htmlFor="web_sitesi" hata={h?.web_sitesi}>
                <Girdi id="web_sitesi" name="web_sitesi" type="url" placeholder="https://"
                  defaultValue={ofis?.web_sitesi ?? ""} hatali={Boolean(h?.web_sitesi)} />
              </Alan>
            </div>
          </KartGovde>
        </Kart>

        <div className="flex justify-end">
          <GonderButonu>
            {ofis ? "Değişiklikleri Kaydet" : "İş Yerini Kaydet"}
          </GonderButonu>
        </div>
      </div>
    </form>
  );
}
