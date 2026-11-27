"use client";

import { useActionState } from "react";
import { randevuTalepEt } from "@/modules/randevu/actions";
import { BOS_SONUC } from "@/modules/ortak/sonuc";
import { Alan, Girdi, MetinAlani } from "@/components/ui/Alanlar";
import { GonderButonu } from "@/components/ui/GonderButonu";
import { Uyari } from "@/components/ui/Uyari";
import { bugunISO } from "@/lib/bicim";

export function RandevuFormu({
  emlakId,
  adSoyad,
  telefon,
}: {
  emlakId: string;
  adSoyad?: string;
  telefon?: string;
}) {
  const [durum, eylem] = useActionState(randevuTalepEt, BOS_SONUC);
  const h = durum.alanHatalari;

  if (durum.basarili) {
    return <Uyari tur="basari" baslik="Talebiniz alındı">{durum.mesaj}</Uyari>;
  }

  return (
    <form action={eylem} className="space-y-3">
      <input type="hidden" name="emlak_id" value={emlakId} />

      {durum.mesaj && !h && <Uyari tur="hata">{durum.mesaj}</Uyari>}

      <Alan etiket="Ad Soyad" htmlFor="ad_soyad" zorunlu hata={h?.ad_soyad}>
        <Girdi id="ad_soyad" name="ad_soyad" defaultValue={adSoyad ?? ""}
          hatali={Boolean(h?.ad_soyad)} required />
      </Alan>

      <Alan etiket="Telefon" htmlFor="telefon" zorunlu hata={h?.telefon}
        yardim="Danışmanımız saati netleştirmek için sizi arayacak.">
        <Girdi id="telefon" name="telefon" inputMode="numeric" maxLength={11}
          placeholder="05321234567" defaultValue={telefon ?? ""}
          hatali={Boolean(h?.telefon)} required />
      </Alan>

      <Alan etiket="Tercih Ettiğiniz Gün" htmlFor="tercih_gun" zorunlu
        hata={h?.tercih_gun} yardim="Saat seçmenize gerek yok, gün yeterli.">
        <Girdi id="tercih_gun" name="tercih_gun" type="date" min={bugunISO()}
          hatali={Boolean(h?.tercih_gun)} required />
      </Alan>

      <Alan etiket="Alternatif Gün" htmlFor="alternatif_gun" hata={h?.alternatif_gun}>
        <Girdi id="alternatif_gun" name="alternatif_gun" type="date" min={bugunISO()}
          hatali={Boolean(h?.alternatif_gun)} />
      </Alan>

      <Alan etiket="Notunuz" htmlFor="musteri_notu" hata={h?.musteri_notu}>
        <MetinAlani id="musteri_notu" name="musteri_notu" rows={2}
          placeholder="Örn: Hafta içi öğleden sonra müsaitim."
          hatali={Boolean(h?.musteri_notu)} />
      </Alan>

      <GonderButonu className="w-full" bekleyenMetin="Gönderiliyor…">
        Randevu Talebi Gönder
      </GonderButonu>
    </form>
  );
}
