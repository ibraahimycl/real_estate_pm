import Link from "next/link";
import type { Metadata } from "next";
import { gerektirGiris } from "@/lib/auth";
import { sunucuIstemcisi } from "@/lib/supabase/server";
import { Kart } from "@/components/ui/Kart";
import { Rozet, durumTonu } from "@/components/ui/Rozet";
import { BosDurum } from "@/components/ui/BosDurum";
import { BagButon } from "@/components/ui/Buton";
import { Tablo, TabloSarmal, Td, Th, Tr } from "@/components/ui/Tablo";
import { RANDEVU_DURUMU } from "@/lib/etiketler";
import { gunAdi, gorece } from "@/lib/bicim";
import type { Emlak, Randevu } from "@/types/database";

export const metadata: Metadata = { title: "Randevularım" };

export default async function RandevularimSayfasi() {
  const profil = await gerektirGiris("/hesabim/randevularim");
  const supabase = await sunucuIstemcisi();

  const { data } = await supabase
    .from("randevular")
    .select("*")
    .eq("profil_id", profil.id)
    .order("tercih_gun", { ascending: false });

  const randevular = (data ?? []) as Randevu[];

  const { data: emlakKayitlari } = randevular.length
    ? await supabase
        .from("ilanlar_public")
        .select("id, ilan_no, baslik")
        .in("id", [...new Set(randevular.map((r) => r.emlak_id))])
    : { data: [] };

  const emlakHarita = new Map(
    ((emlakKayitlari ?? []) as Pick<Emlak, "id" | "ilan_no" | "baslik">[]).map(
      (e) => [e.id, e],
    ),
  );

  return (
    <>
      <h1 className="text-xl font-semibold text-metin">Randevularım</h1>
      <p className="mt-1 mb-5 text-sm text-metin-ikincil">
        Gün bazında bıraktığınız randevu talepleri. Saati danışmanımız sizi
        arayarak netleştirir.
      </p>

      <Kart>
        {randevular.length === 0 ? (
          <BosDurum
            baslik="Randevu talebiniz yok"
            aciklama="Beğendiğiniz bir ilanın sayfasından gün seçerek randevu talebi bırakabilirsiniz."
            eylem={<BagButon href="/">İlanlara göz at</BagButon>}
          />
        ) : (
          <TabloSarmal>
            <Tablo>
              <thead>
                <tr>
                  <Th>İlan</Th>
                  <Th>Tercih Ettiğim Gün</Th>
                  <Th>Durum</Th>
                  <Th>Danışman Notu</Th>
                </tr>
              </thead>
              <tbody>
                {randevular.map((r) => {
                  const emlak = emlakHarita.get(r.emlak_id);
                  return (
                    <Tr key={r.id}>
                      <Td>
                        {emlak ? (
                          <Link
                            href={`/ilan/${r.emlak_id}`}
                            className="text-sm font-medium text-metin hover:text-marka-600"
                          >
                            {emlak.baslik}
                          </Link>
                        ) : (
                          <span className="text-metin-silik">
                            İlan yayından kalkmış
                          </span>
                        )}
                      </Td>
                      <Td className="whitespace-nowrap">
                        <p className="text-sm">{gunAdi(r.tercih_gun)}</p>
                        {r.alternatif_gun && (
                          <p className="text-xs text-metin-silik">
                            Alternatif: {gunAdi(r.alternatif_gun)}
                          </p>
                        )}
                        <p className="text-xs text-metin-silik">
                          Talep: {gorece(r.created_at)}
                        </p>
                      </Td>
                      <Td>
                        <Rozet ton={durumTonu(r.durum)}>
                          {RANDEVU_DURUMU[r.durum]}
                        </Rozet>
                      </Td>
                      <Td className="max-w-56 text-xs text-metin-ikincil">
                        {r.danisman_notu ?? "—"}
                      </Td>
                    </Tr>
                  );
                })}
              </tbody>
            </Tablo>
          </TabloSarmal>
        )}
      </Kart>
    </>
  );
}
