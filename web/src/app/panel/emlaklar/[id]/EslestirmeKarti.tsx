"use client";

import { useActionState, type ReactNode } from "react";
import { eslestirmeyiCalistir } from "@/modules/emlak/actions";
import { BOS_SONUC } from "@/modules/ortak/sonuc";
import { Kart, KartBaslik, KartGovde } from "@/components/ui/Kart";
import { Uyari } from "@/components/ui/Uyari";

export function EslestirmeKarti({
  emlakId,
  talepSayisi,
  children,
}: {
  emlakId: string;
  talepSayisi: number;
  children: ReactNode;
}) {
  const [durum, eylem, taraniyor] = useActionState(
    eslestirmeyiCalistir,
    BOS_SONUC,
  );

  return (
    <Kart>
      <KartBaslik
        baslik="Eşleşen Müşteri Talepleri"
        aciklama={`${talepSayisi} talep bu ilanın kriterlerine uyuyor`}
        eylem={
          <form action={eylem}>
            <input type="hidden" name="id" value={emlakId} />
            <button
              type="submit"
              disabled={taraniyor}
              className="text-xs font-medium text-marka-600 hover:underline disabled:opacity-50"
            >
              {taraniyor ? "Taranıyor…" : "Yeniden tara"}
            </button>
          </form>
        }
      />
      <KartGovde className="space-y-3">
        {durum.mesaj && (
          <Uyari tur={durum.basarili ? "basari" : "hata"}>{durum.mesaj}</Uyari>
        )}
        {children}
      </KartGovde>
    </Kart>
  );
}
