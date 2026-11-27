import Link from "next/link";
import type { Metadata } from "next";
import { gerektirGiris } from "@/lib/auth";
import { mesajlarim } from "@/modules/mesaj/queries";
import { Kart, KartGovde } from "@/components/ui/Kart";
import { BosDurum } from "@/components/ui/BosDurum";
import { BagButon } from "@/components/ui/Buton";
import { Rozet } from "@/components/ui/Rozet";
import { gorece, para } from "@/lib/bicim";

export const metadata: Metadata = { title: "Mesajlarım" };

export default async function MesajlarimSayfasi() {
  const profil = await gerektirGiris("/hesabim/mesajlarim");
  const mesajlar = await mesajlarim(profil.id);

  return (
    <>
      <h1 className="text-xl font-semibold text-metin">Mesajlarım</h1>
      <p className="mt-1 mb-5 text-sm text-metin-ikincil">
        Kriterlerinize uyan ilan girildiğinde gönderilen bildirimler.
      </p>

      {mesajlar.length === 0 ? (
        <Kart>
          <BosDurum
            baslik="Henüz mesajınız yok"
            aciklama="Bir talep oluşturup bildirim iznini açarsanız, kriterlerinize uyan ilan girildiğinde burada bildirim alırsınız."
            eylem={<BagButon href="/hesabim/taleplerim/yeni">Talep oluştur</BagButon>}
          />
        </Kart>
      ) : (
        <ul className="space-y-3">
          {mesajlar.map((m) => (
            <li key={m.id}>
              <Kart>
                <KartGovde className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="grid h-8 w-8 place-items-center rounded-full bg-marka-600 text-xs font-bold text-white">
                        BE
                      </span>
                      <div>
                        <p className="text-sm font-medium text-metin">
                          Başkent Emlak
                        </p>
                        <p className="text-xs text-metin-silik">
                          {gorece(m.gonderim_zamani)}
                        </p>
                      </div>
                    </div>
                    {!m.okundu && <Rozet ton="vurgu">Yeni</Rozet>}
                  </div>

                  <p className="whitespace-pre-line rounded-lg rounded-tl-sm bg-yuzey-alt px-4 py-3 text-sm leading-relaxed text-metin">
                    {m.icerik}
                  </p>

                  {m.emlak && (
                    <Link
                      href={`/ilan/${m.emlak_id}`}
                      className="flex items-center justify-between gap-3 rounded-lg border border-cizgi p-3 transition-colors hover:border-marka-300"
                    >
                      <span className="min-w-0">
                        <span className="line-clamp-1 block text-sm font-medium text-metin">
                          {m.emlak.baslik}
                        </span>
                        <span className="rakam text-xs text-metin-silik">
                          İlan #{m.emlak.ilan_no}
                        </span>
                      </span>
                      <span className="rakam shrink-0 font-semibold text-marka-700">
                        {para(m.emlak.fiyat)}
                      </span>
                    </Link>
                  )}
                </KartGovde>
              </Kart>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
