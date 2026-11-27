"use client";

import { useActionState } from "react";
import { musteriSil } from "@/modules/musteri/actions";
import { BOS_SONUC } from "@/modules/ortak/sonuc";
import { GonderButonu } from "@/components/ui/GonderButonu";
import { Uyari } from "@/components/ui/Uyari";

export function SilButonu({ id, ad }: { id: string; ad: string }) {
  const [durum, eylem] = useActionState(musteriSil, BOS_SONUC);

  return (
    <div className="space-y-3">
      {durum.mesaj && <Uyari tur="hata">{durum.mesaj}</Uyari>}
      <form
        action={eylem}
        onSubmit={(e) => {
          if (
            !confirm(
              `${ad} adlı müşteri kaydı silinecek. Bu işlem geri alınamaz. Devam edilsin mi?`,
            )
          ) {
            e.preventDefault();
          }
        }}
      >
        <input type="hidden" name="id" value={id} />
        <GonderButonu gorunum="tehlike" boyut="sm" bekleyenMetin="Siliniyor…">
          Müşteriyi Sil
        </GonderButonu>
      </form>
    </div>
  );
}
