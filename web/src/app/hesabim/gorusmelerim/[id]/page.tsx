import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { gerektirGiris } from "@/lib/auth";
import { gorusmeDetayi } from "@/modules/gorusme/queries";
import { Kart, KartBaslik, KartGovde } from "@/components/ui/Kart";
import { GorusmeDokumu } from "@/components/gorusme/GorusmeDokumu";
import { BagButon } from "@/components/ui/Buton";
import { Uyari } from "@/components/ui/Uyari";
import { tarihSaat } from "@/lib/bicim";

export const metadata: Metadata = { title: "Görüşme Kaydı" };

export default async function GorusmemSayfasi({
  params,
}: PageProps<"/hesabim/gorusmelerim/[id]">) {
  const { id } = await params;
  const profil = await gerektirGiris("/hesabim/gorusmelerim");

  const detay = await gorusmeDetayi(id);
  // RLS zaten başkasının görüşmesini döndürmez; yine de açıkça kontrol edilir.
  if (!detay || detay.gorusme.profil_id !== profil.id) notFound();

  return (
    <>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-metin">Görüşme Kaydı</h1>
          <p className="mt-1 text-sm text-metin-ikincil">
            {tarihSaat(detay.gorusme.created_at)} · {detay.mesajlar.length} mesaj
          </p>
        </div>
        <BagButon href="/hesabim/gorusmelerim" gorunum="ikincil">
          Listeye dön
        </BagButon>
      </div>

      <div className="max-w-3xl space-y-5">
        <Kart>
          <KartBaslik baslik="Konuşma" />
          <KartGovde>
            <GorusmeDokumu mesajlar={detay.mesajlar} />
          </KartGovde>
        </Kart>

        {detay.talep ? (
          <Uyari tur="basari" baslik="Bu görüşmede talebiniz kaydedildi">
            Kriterlerinize uyan bir ilan girildiğinde size haber vereceğiz.
            Talebinizi “Taleplerim” ekranından görebilir, bildirim iznini
            dilediğiniz zaman geri çekebilirsiniz.
          </Uyari>
        ) : (
          <Uyari tur="bilgi" baslik="Bu görüşmede kayıt alınmadı">
            Kriterlerinizin kaydedilmesine onay vermediniz. Dilerseniz
            “Taleplerim” ekranından yeni bir talep oluşturabilirsiniz.
          </Uyari>
        )}
      </div>
    </>
  );
}
