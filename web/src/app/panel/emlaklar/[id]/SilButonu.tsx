"use client";

import { useActionState } from "react";
import { emlakSil } from "@/modules/emlak/actions";
import { BOS_SONUC } from "@/modules/ortak/sonuc";
import { GonderButonu } from "@/components/ui/GonderButonu";
import { Uyari } from "@/components/ui/Uyari";

export function SilButonu({ id, baslik }: { id: string; baslik: string }) {
  const [durum, eylem] = useActionState(emlakSil, BOS_SONUC);

  return (
    <div className="space-y-3">
      {durum.mesaj && <Uyari tur="hata">{durum.mesaj}</Uyari>}
      <form
        action={eylem}
        onSubmit={(e) => {
          if (!confirm(`"${baslik}" ilanı silinecek. Devam edilsin mi?`)) {
            e.preventDefault();
          }
        }}
      >
        <input type="hidden" name="id" value={id} />
        <GonderButonu gorunum="tehlike" boyut="sm" bekleyenMetin="Siliniyor…">
          İlanı Sil
        </GonderButonu>
      </form>
    </div>
  );
}
