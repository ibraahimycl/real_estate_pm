"use client";

import { useActionState } from "react";
import { randevuDurumGuncelle } from "@/modules/randevu/actions";
import { BOS_SONUC } from "@/modules/ortak/sonuc";
import { GonderButonu } from "@/components/ui/GonderButonu";
import { Girdi, Secim } from "@/components/ui/Alanlar";
import { RANDEVU_DURUMU, secenekler } from "@/lib/etiketler";
import type { RandevuDurumu } from "@/types/database";

export function RandevuEylemleri({
  id,
  durum,
  danismanNotu,
}: {
  id: string;
  durum: RandevuDurumu;
  danismanNotu: string | null;
}) {
  const [sonuc, eylem] = useActionState(randevuDurumGuncelle, BOS_SONUC);

  return (
    <form action={eylem} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <Secim
        name="durum"
        defaultValue={durum}
        className="w-auto py-1 text-xs"
        aria-label="Randevu durumu"
      >
        {secenekler(RANDEVU_DURUMU).map((s) => (
          <option key={s.deger} value={s.deger}>
            {s.etiket}
          </option>
        ))}
      </Secim>
      <Girdi
        name="danisman_notu"
        defaultValue={danismanNotu ?? ""}
        placeholder="Danışman notu (örn. saat 14:00 için arandı)"
        className="w-56 py-1 text-xs"
        aria-label="Danışman notu"
      />
      <GonderButonu gorunum="ikincil" boyut="sm" bekleyenMetin="…">
        Kaydet
      </GonderButonu>
      {sonuc.basarili && (
        <span className="text-xs text-basari-600">Güncellendi</span>
      )}
    </form>
  );
}
