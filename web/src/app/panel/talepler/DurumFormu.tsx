"use client";

import { useActionState } from "react";
import { talepDurumGuncelle } from "@/modules/talep/actions";
import { BOS_SONUC } from "@/modules/ortak/sonuc";
import { GonderButonu } from "@/components/ui/GonderButonu";
import { Secim } from "@/components/ui/Alanlar";
import { TALEP_DURUMU, secenekler } from "@/lib/etiketler";
import type { TalepDurumu } from "@/types/database";

export function DurumFormu({
  id,
  durum,
}: {
  id: string;
  durum: TalepDurumu;
}) {
  const [, eylem] = useActionState(talepDurumGuncelle, BOS_SONUC);

  return (
    <form action={eylem} className="flex items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <Secim
        name="durum"
        defaultValue={durum}
        className="w-auto py-1 text-xs"
        aria-label="Talep durumu"
      >
        {secenekler(TALEP_DURUMU).map((s) => (
          <option key={s.deger} value={s.deger}>
            {s.etiket}
          </option>
        ))}
      </Secim>
      <GonderButonu gorunum="ikincil" boyut="sm" bekleyenMetin="…">
        Güncelle
      </GonderButonu>
    </form>
  );
}
