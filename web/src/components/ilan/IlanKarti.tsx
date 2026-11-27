import Image from "next/image";
import Link from "next/link";
import { Rozet } from "@/components/ui/Rozet";
import { EMLAK_TURU, ISLEM_TURU } from "@/lib/etiketler";
import { para } from "@/lib/bicim";
import type { IlanPublic } from "@/types/database";

export function IlanKarti({ ilan }: { ilan: IlanPublic }) {
  return (
    <article className="group overflow-hidden rounded-kart border border-cizgi bg-yuzey transition-shadow hover:shadow-md">
      <Link href={`/ilan/${ilan.id}`} className="block">
        <div className="relative aspect-4/3 bg-yuzey-alt">
          {ilan.kapak_foto ? (
            <Image
              src={ilan.kapak_foto}
              alt={ilan.baslik}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              unoptimized
            />
          ) : (
            <div className="grid h-full place-items-center text-sm text-metin-silik">
              Görsel yok
            </div>
          )}
          <div className="absolute left-2 top-2 flex gap-1.5">
            <Rozet ton={ilan.islem_turu === "kiralik" ? "marka" : "vurgu"}>
              {ISLEM_TURU[ilan.islem_turu]}
            </Rozet>
            {ilan.durum === "rezerve" && <Rozet ton="uyari">Rezerve</Rozet>}
          </div>
        </div>

        <div className="p-4">
          <p className="rakam text-lg font-semibold text-metin">
            {para(ilan.fiyat)}
            {ilan.islem_turu === "kiralik" && (
              <span className="text-sm font-normal text-metin-silik"> / ay</span>
            )}
          </p>
          <h3 className="mt-1 line-clamp-2 text-sm font-medium text-metin">
            {ilan.baslik}
          </h3>
          <p className="mt-1 text-xs text-metin-silik">
            {ilan.ilce} / {ilan.il}
            {ilan.mahalle && ` · ${ilan.mahalle}`}
          </p>

          <dl className="mt-3 flex flex-wrap gap-x-3 gap-y-1 border-t border-cizgi pt-3 text-xs text-metin-ikincil">
            <div className="rakam">{ilan.oda_sayisi}</div>
            <span className="text-cizgi-koyu">·</span>
            <div className="rakam">{ilan.m2_brut} m²</div>
            <span className="text-cizgi-koyu">·</span>
            <div>{EMLAK_TURU[ilan.emlak_turu]}</div>
          </dl>
        </div>
      </Link>
    </article>
  );
}
