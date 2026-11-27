"use client";

import { useActionState } from "react";
import { musteriEkle, musteriGuncelle } from "@/modules/musteri/actions";
import { BOS_SONUC } from "@/modules/ortak/sonuc";
import { Alan, Girdi, MetinAlani } from "@/components/ui/Alanlar";
import { GonderButonu } from "@/components/ui/GonderButonu";
import { Uyari } from "@/components/ui/Uyari";
import { Kart, KartGovde } from "@/components/ui/Kart";
import { BagButon } from "@/components/ui/Buton";
import type { Profil } from "@/types/database";

export function MusteriFormu({ musteri }: { musteri?: Profil }) {
  const duzenleme = Boolean(musteri);
  const [durum, eylem] = useActionState(
    duzenleme ? musteriGuncelle : musteriEkle,
    BOS_SONUC,
  );
  const h = durum.alanHatalari;

  return (
    <form action={eylem} className="space-y-5">
      {musteri && <input type="hidden" name="id" value={musteri.id} />}

      {durum.mesaj && (
        <Uyari tur={durum.basarili ? "basari" : "hata"}>{durum.mesaj}</Uyari>
      )}

      <Kart>
        <KartGovde className="space-y-4">
          <h2 className="font-semibold text-metin">Kimlik Bilgileri</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <Alan etiket="Ad" htmlFor="ad" zorunlu hata={h?.ad}>
              <Girdi id="ad" name="ad" defaultValue={musteri?.ad ?? ""}
                hatali={Boolean(h?.ad)} required />
            </Alan>
            <Alan etiket="Soyad" htmlFor="soyad" zorunlu hata={h?.soyad}>
              <Girdi id="soyad" name="soyad" defaultValue={musteri?.soyad ?? ""}
                hatali={Boolean(h?.soyad)} required />
            </Alan>
            <Alan etiket="TC Kimlik No" htmlFor="tckn" hata={h?.tckn}
              yardim="11 haneli. Sözleşme düzenlenecekse zorunludur.">
              <Girdi id="tckn" name="tckn" inputMode="numeric" maxLength={11}
                defaultValue={musteri?.tckn ?? ""} hatali={Boolean(h?.tckn)} />
            </Alan>
            <Alan etiket="E-posta" htmlFor="eposta" zorunlu hata={h?.eposta}
              yardim="Müşteri bu adresle üye olursa ilanları hesabına bağlanır.">
              <Girdi id="eposta" name="eposta" type="email"
                defaultValue={musteri?.eposta ?? ""} hatali={Boolean(h?.eposta)} required />
            </Alan>
          </div>
        </KartGovde>
      </Kart>

      <Kart>
        <KartGovde className="space-y-4">
          <h2 className="font-semibold text-metin">İletişim</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <Alan etiket="Cep Telefonu" htmlFor="cep_telefon" zorunlu hata={h?.cep_telefon}
              yardim="Başında 0 ile, boşluksuz.">
              <Girdi id="cep_telefon" name="cep_telefon" inputMode="numeric" maxLength={11}
                placeholder="05321234567" defaultValue={musteri?.cep_telefon ?? ""}
                hatali={Boolean(h?.cep_telefon)} required />
            </Alan>
            <Alan etiket="Ev Telefonu" htmlFor="ev_telefon" hata={h?.ev_telefon}>
              <Girdi id="ev_telefon" name="ev_telefon" inputMode="numeric" maxLength={11}
                defaultValue={musteri?.ev_telefon ?? ""} hatali={Boolean(h?.ev_telefon)} />
            </Alan>
            <Alan etiket="İl" htmlFor="il" hata={h?.il}>
              <Girdi id="il" name="il" defaultValue={musteri?.il ?? ""} hatali={Boolean(h?.il)} />
            </Alan>
            <Alan etiket="İlçe" htmlFor="ilce" hata={h?.ilce}>
              <Girdi id="ilce" name="ilce" defaultValue={musteri?.ilce ?? ""} hatali={Boolean(h?.ilce)} />
            </Alan>
          </div>
          <Alan etiket="Adres" htmlFor="adres" hata={h?.adres}>
            <MetinAlani id="adres" name="adres" rows={2}
              defaultValue={musteri?.adres ?? ""} hatali={Boolean(h?.adres)} />
          </Alan>
          <Alan etiket="Danışman Notu" htmlFor="notlar" hata={h?.notlar}
            yardim="Yalnızca ofis içi görünür.">
            <MetinAlani id="notlar" name="notlar" rows={3}
              defaultValue={musteri?.notlar ?? ""} hatali={Boolean(h?.notlar)} />
          </Alan>
        </KartGovde>
      </Kart>

      <div className="flex justify-end gap-2">
        <BagButon href="/panel/musteriler" gorunum="ikincil">
          Vazgeç
        </BagButon>
        <GonderButonu>
          {duzenleme ? "Değişiklikleri Kaydet" : "Müşteriyi Kaydet"}
        </GonderButonu>
      </div>
    </form>
  );
}
