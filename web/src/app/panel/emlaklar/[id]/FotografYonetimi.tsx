"use client";

import Image from "next/image";
import { useActionState } from "react";
import {
  fotografSil,
  fotografYukle,
  kapakYap,
} from "@/modules/emlak/actions";
import { BOS_SONUC } from "@/modules/ortak/sonuc";
import { GonderButonu } from "@/components/ui/GonderButonu";
import { Uyari } from "@/components/ui/Uyari";
import { Rozet } from "@/components/ui/Rozet";
import type { EmlakFotografi } from "@/types/database";

export function FotografYonetimi({
  emlakId,
  fotograflar,
}: {
  emlakId: string;
  fotograflar: EmlakFotografi[];
}) {
  const [durum, eylem] = useActionState(fotografYukle, BOS_SONUC);

  return (
    <div className="space-y-4">
      {durum.mesaj && (
        <Uyari tur={durum.basarili ? "basari" : "hata"}>{durum.mesaj}</Uyari>
      )}

      {fotograflar.length === 0 ? (
        <p className="text-sm text-metin-ikincil">
          Bu ilan için henüz fotoğraf yüklenmemiş.
        </p>
      ) : (
        <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {fotograflar.map((f) => (
            <li
              key={f.id}
              className="group relative aspect-4/3 rounded-lg overflow-hidden border border-cizgi bg-yuzey-alt"
            >
              <Image
                src={f.url}
                alt=""
                fill
                sizes="(max-width: 640px) 50vw, 200px"
                className="object-cover"
                unoptimized
              />
              {f.kapak && (
                <span className="absolute top-1.5 left-1.5">
                  <Rozet ton="marka">Kapak</Rozet>
                </span>
              )}
              <div className="absolute inset-x-0 bottom-0 flex gap-1 p-1.5 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                {!f.kapak && (
                  <form action={kapakYap}>
                    <input type="hidden" name="foto_id" value={f.id} />
                    <input type="hidden" name="emlak_id" value={emlakId} />
                    <button
                      type="submit"
                      className="rounded bg-white/90 px-2 py-1 text-[11px] font-medium text-metin hover:bg-white"
                    >
                      Kapak yap
                    </button>
                  </form>
                )}
                <form action={fotografSil} className="ml-auto">
                  <input type="hidden" name="foto_id" value={f.id} />
                  <input type="hidden" name="emlak_id" value={emlakId} />
                  <button
                    type="submit"
                    className="rounded bg-hata-500 px-2 py-1 text-[11px] font-medium text-white hover:bg-hata-600"
                  >
                    Sil
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form action={eylem} className="flex flex-wrap items-end gap-2 pt-1">
        <input type="hidden" name="emlak_id" value={emlakId} />
        <div className="flex-1 min-w-[12rem]">
          <label
            htmlFor="dosya"
            className="block text-sm font-medium text-metin mb-1.5"
          >
            Fotoğraf yükle
          </label>
          <input
            id="dosya"
            name="dosya"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            required
            className="block w-full text-sm text-metin-ikincil file:mr-3 file:rounded-lg file:border-0 file:bg-yuzey-alt file:px-3 file:py-2 file:text-sm file:font-medium file:text-metin hover:file:bg-cizgi"
          />
        </div>
        <GonderButonu gorunum="ikincil" bekleyenMetin="Yükleniyor…">
          Yükle
        </GonderButonu>
      </form>
      <p className="text-xs text-metin-silik">
        JPEG, PNG, WebP veya AVIF · en fazla 5 MB. İlk yüklenen fotoğraf
        otomatik olarak kapak olur.
      </p>
    </div>
  );
}
