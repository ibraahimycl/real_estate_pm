"use client";

import { useActionState } from "react";
import { kayitOl } from "@/modules/auth/actions";
import { BOS_SONUC } from "@/modules/ortak/sonuc";
import { Alan, Girdi } from "@/components/ui/Alanlar";
import { GonderButonu } from "@/components/ui/GonderButonu";
import { Uyari } from "@/components/ui/Uyari";

export function KayitFormu() {
  const [durum, eylem] = useActionState(kayitOl, BOS_SONUC);
  const h = durum.alanHatalari;

  return (
    <form action={eylem} className="space-y-4">
      {durum.mesaj && !h && <Uyari tur="hata">{durum.mesaj}</Uyari>}

      <div className="grid grid-cols-2 gap-3">
        <Alan etiket="Ad" htmlFor="ad" zorunlu hata={h?.ad}>
          <Girdi id="ad" name="ad" autoComplete="given-name" hatali={Boolean(h?.ad)} required />
        </Alan>
        <Alan etiket="Soyad" htmlFor="soyad" zorunlu hata={h?.soyad}>
          <Girdi id="soyad" name="soyad" autoComplete="family-name" hatali={Boolean(h?.soyad)} required />
        </Alan>
      </div>

      <Alan etiket="E-posta" htmlFor="eposta" zorunlu hata={h?.eposta}
        yardim="Emlakçı sizi daha önce kaydettiyse, aynı e-posta ile ilanlarınız hesabınıza bağlanır.">
        <Girdi id="eposta" name="eposta" type="email" autoComplete="email"
          placeholder="ornek@eposta.com" hatali={Boolean(h?.eposta)} required />
      </Alan>

      <Alan etiket="Cep Telefonu" htmlFor="cep_telefon" zorunlu hata={h?.cep_telefon}
        yardim="Başında 0 ile, boşluksuz. Örn: 05321234567">
        <Girdi id="cep_telefon" name="cep_telefon" inputMode="numeric" maxLength={11}
          placeholder="05321234567" hatali={Boolean(h?.cep_telefon)} required />
      </Alan>

      <Alan etiket="Parola" htmlFor="parola" zorunlu hata={h?.parola} yardim="En az 8 karakter.">
        <Girdi id="parola" name="parola" type="password" autoComplete="new-password"
          placeholder="••••••••" hatali={Boolean(h?.parola)} required />
      </Alan>

      <Alan etiket="Parola (Tekrar)" htmlFor="parolaTekrar" zorunlu hata={h?.parolaTekrar}>
        <Girdi id="parolaTekrar" name="parolaTekrar" type="password" autoComplete="new-password"
          placeholder="••••••••" hatali={Boolean(h?.parolaTekrar)} required />
      </Alan>

      <GonderButonu className="w-full" bekleyenMetin="Hesap oluşturuluyor…">
        Hesap Oluştur
      </GonderButonu>
    </form>
  );
}
