"use client";

import { useActionState } from "react";
import { profilimiGuncelle } from "@/modules/musteri/actions";
import { BOS_SONUC } from "@/modules/ortak/sonuc";
import { Alan, Girdi, MetinAlani } from "@/components/ui/Alanlar";
import { GonderButonu } from "@/components/ui/GonderButonu";
import { Uyari } from "@/components/ui/Uyari";
import { Kart, KartGovde } from "@/components/ui/Kart";
import type { Profil } from "@/types/database";

export function ProfilFormu({ profil }: { profil: Profil }) {
  const [durum, eylem] = useActionState(profilimiGuncelle, BOS_SONUC);
  const h = durum.alanHatalari;

  return (
    <form action={eylem} className="space-y-5">
      {durum.mesaj && (
        <Uyari tur={durum.basarili ? "basari" : "hata"}>{durum.mesaj}</Uyari>
      )}

      <Kart>
        <KartGovde className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Alan etiket="Ad" htmlFor="ad" zorunlu hata={h?.ad}>
              <Girdi id="ad" name="ad" defaultValue={profil.ad} hatali={Boolean(h?.ad)} required />
            </Alan>
            <Alan etiket="Soyad" htmlFor="soyad" zorunlu hata={h?.soyad}>
              <Girdi id="soyad" name="soyad" defaultValue={profil.soyad} hatali={Boolean(h?.soyad)} required />
            </Alan>
          </div>

          <Alan etiket="E-posta" htmlFor="eposta"
            yardim="E-posta adresi değiştirilemez; ilanlarınızın hesabınıza bağlanmasında kullanılır.">
            <Girdi id="eposta" value={profil.eposta} disabled readOnly />
          </Alan>

          <div className="grid gap-4 sm:grid-cols-2">
            <Alan etiket="TC Kimlik No" htmlFor="tckn" hata={h?.tckn}
              yardim="Kira sözleşmesi düzenlenebilmesi için gereklidir.">
              <Girdi id="tckn" name="tckn" inputMode="numeric" maxLength={11}
                defaultValue={profil.tckn ?? ""} hatali={Boolean(h?.tckn)} />
            </Alan>
            <Alan etiket="Cep Telefonu" htmlFor="cep_telefon" zorunlu hata={h?.cep_telefon}>
              <Girdi id="cep_telefon" name="cep_telefon" inputMode="numeric" maxLength={11}
                defaultValue={profil.cep_telefon} hatali={Boolean(h?.cep_telefon)} required />
            </Alan>
            <Alan etiket="Ev Telefonu" htmlFor="ev_telefon" hata={h?.ev_telefon}>
              <Girdi id="ev_telefon" name="ev_telefon" inputMode="numeric" maxLength={11}
                defaultValue={profil.ev_telefon ?? ""} hatali={Boolean(h?.ev_telefon)} />
            </Alan>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Alan etiket="İl" htmlFor="il" hata={h?.il}>
              <Girdi id="il" name="il" defaultValue={profil.il ?? ""} hatali={Boolean(h?.il)} />
            </Alan>
            <Alan etiket="İlçe" htmlFor="ilce" hata={h?.ilce}>
              <Girdi id="ilce" name="ilce" defaultValue={profil.ilce ?? ""} hatali={Boolean(h?.ilce)} />
            </Alan>
          </div>

          <Alan etiket="Adres" htmlFor="adres" hata={h?.adres}>
            <MetinAlani id="adres" name="adres" rows={2}
              defaultValue={profil.adres ?? ""} hatali={Boolean(h?.adres)} />
          </Alan>
        </KartGovde>
      </Kart>

      <div className="flex justify-end">
        <GonderButonu>Bilgilerimi Güncelle</GonderButonu>
      </div>
    </form>
  );
}
