"use client";

import { useActionState } from "react";
import { girisYap } from "@/modules/auth/actions";
import { BOS_SONUC } from "@/modules/ortak/sonuc";
import { Alan, Girdi } from "@/components/ui/Alanlar";
import { GonderButonu } from "@/components/ui/GonderButonu";
import { Uyari } from "@/components/ui/Uyari";

export function GirisFormu({ devam }: { devam?: string }) {
  const [durum, eylem] = useActionState(girisYap, BOS_SONUC);

  return (
    <form action={eylem} className="space-y-4">
      {devam && <input type="hidden" name="devam" value={devam} />}

      {durum.mesaj && !durum.alanHatalari && (
        <Uyari tur="hata">{durum.mesaj}</Uyari>
      )}

      <Alan
        etiket="E-posta"
        htmlFor="eposta"
        zorunlu
        hata={durum.alanHatalari?.eposta}
      >
        <Girdi
          id="eposta"
          name="eposta"
          type="email"
          autoComplete="email"
          placeholder="ornek@eposta.com"
          hatali={Boolean(durum.alanHatalari?.eposta)}
          required
        />
      </Alan>

      <Alan
        etiket="Parola"
        htmlFor="parola"
        zorunlu
        hata={durum.alanHatalari?.parola}
      >
        <Girdi
          id="parola"
          name="parola"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          hatali={Boolean(durum.alanHatalari?.parola)}
          required
        />
      </Alan>

      <GonderButonu className="w-full" bekleyenMetin="Giriş yapılıyor…">
        Giriş Yap
      </GonderButonu>
    </form>
  );
}
