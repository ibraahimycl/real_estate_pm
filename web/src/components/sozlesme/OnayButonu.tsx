"use client";

import { useActionState } from "react";
import { sozlesmeOnayla } from "@/modules/sozlesme/actions";
import { BOS_SONUC } from "@/modules/ortak/sonuc";
import { GonderButonu } from "@/components/ui/GonderButonu";
import { Uyari } from "@/components/ui/Uyari";

export function OnayButonu({
  id,
  etiket,
  devredisi,
}: {
  id: string;
  etiket: string;
  devredisi?: boolean;
}) {
  const [durum, eylem] = useActionState(sozlesmeOnayla, BOS_SONUC);

  if (durum.mesaj) {
    return <Uyari tur={durum.basarili ? "basari" : "hata"}>{durum.mesaj}</Uyari>;
  }

  return (
    <form action={eylem}>
      <input type="hidden" name="id" value={id} />
      <GonderButonu
        className="w-full"
        disabled={devredisi}
        bekleyenMetin="Onaylanıyor…"
      >
        {etiket}
      </GonderButonu>
    </form>
  );
}
