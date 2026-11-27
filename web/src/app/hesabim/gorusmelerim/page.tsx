import Link from "next/link";
import type { Metadata } from "next";
import { gerektirGiris } from "@/lib/auth";
import { gorusmelerim } from "@/modules/gorusme/queries";
import { Kart, KartGovde } from "@/components/ui/Kart";
import { Rozet } from "@/components/ui/Rozet";
import { BosDurum } from "@/components/ui/BosDurum";
import { BagButon } from "@/components/ui/Buton";
import { gorece, tarihSaat } from "@/lib/bicim";

export const metadata: Metadata = { title: "AI Görüşmelerim" };

export default async function GorusmelerimSayfasi() {
  const profil = await gerektirGiris("/hesabim/gorusmelerim");
  const gorusmeler = await gorusmelerim(profil.id);

  return (
    <>
      <h1 className="text-xl font-semibold text-metin">AI Görüşmelerim</h1>
      <p className="mb-5 mt-1 text-sm text-metin-ikincil">
        AI danışmanla yaptığınız konuşmaların kaydı. Ne konuştuğunuzu ve hangi
        kriterlerin kaydedildiğini buradan görebilirsiniz.
      </p>

      {gorusmeler.length === 0 ? (
        <Kart>
          <BosDurum
            baslik="Henüz görüşmeniz yok"
            aciklama="AI danışmanla konuştuğunuzda konuşma kaydı burada saklanır."
            eylem={<BagButon href="/ai-danisman">AI danışmanla konuş</BagButon>}
          />
        </Kart>
      ) : (
        <ul className="space-y-3">
          {gorusmeler.map((g) => (
            <li key={g.id}>
              <Link href={`/hesabim/gorusmelerim/${g.id}`} className="block">
                <Kart className="transition-colors hover:border-marka-300">
                  <KartGovde>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-metin">
                          {tarihSaat(g.created_at)}
                        </p>
                        <p className="mt-0.5 text-xs text-metin-silik">
                          {g.mesaj_sayisi} mesaj · {gorece(g.son_zaman)}
                        </p>
                      </div>
                      {g.talep ? (
                        <Rozet ton="basari">Talep kaydedildi</Rozet>
                      ) : (
                        <Rozet>Kayıt alınmadı</Rozet>
                      )}
                    </div>
                    {g.ilk_soru && (
                      <p className="mt-2 line-clamp-2 rounded-lg bg-yuzey-alt px-3 py-2 text-sm text-metin-ikincil">
                        “{g.ilk_soru}”
                      </p>
                    )}
                  </KartGovde>
                </Kart>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
