"use client";

import { useActionState } from "react";
import { ilanTalebiOnayla, ilanTalebiReddet } from "@/modules/emlak/actions";
import { BOS_SONUC } from "@/modules/ortak/sonuc";
import { BagButon } from "@/components/ui/Buton";
import { GonderButonu } from "@/components/ui/GonderButonu";
import { Uyari } from "@/components/ui/Uyari";

export function IlanTalebiEylemleri({
  emlakId,
  baslik,
}: {
  emlakId: string;
  baslik: string;
}) {
  const [onayDurumu, onayEylemi] = useActionState(ilanTalebiOnayla, BOS_SONUC);
  const [redDurumu, redEylemi] = useActionState(ilanTalebiReddet, BOS_SONUC);

  const mesaj = onayDurumu.mesaj || redDurumu.mesaj;
  const basarili = onayDurumu.mesaj ? onayDurumu.basarili : redDurumu.basarili;

  return (
    <div className="space-y-3">
      {mesaj && <Uyari tur={basarili ? "basari" : "hata"}>{mesaj}</Uyari>}
      <div className="flex flex-wrap items-center gap-2">
        <form action={onayEylemi}>
          <input type="hidden" name="id" value={emlakId} />
          <GonderButonu bekleyenMetin="Onaylanıyor…">
            Onayla ve Yayınla
          </GonderButonu>
        </form>

        <BagButon href={`/panel/emlaklar/${emlakId}`} gorunum="ikincil">
          İncele / Düzenle
        </BagButon>

        <form
          action={redEylemi}
          className="ml-auto"
          onSubmit={(e) => {
            if (
              !confirm(
                `"${baslik}" ilan talebini reddedip kaldırmak istediğinizden emin misiniz?`,
              )
            ) {
              e.preventDefault();
            }
          }}
        >
          <input type="hidden" name="id" value={emlakId} />
          <GonderButonu gorunum="tehlike" bekleyenMetin="Reddediliyor…">
            Reddet
          </GonderButonu>
        </form>
      </div>
    </div>
  );
}
