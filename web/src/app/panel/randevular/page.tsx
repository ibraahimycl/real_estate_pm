import Link from "next/link";
import type { Metadata } from "next";
import { sunucuIstemcisi } from "@/lib/supabase/server";
import { SayfaBasligi } from "@/components/panel/SayfaBasligi";
import { Kart } from "@/components/ui/Kart";
import { Rozet, durumTonu } from "@/components/ui/Rozet";
import { BosDurum } from "@/components/ui/BosDurum";
import { Tablo, TabloSarmal, Td, Th, Tr } from "@/components/ui/Tablo";
import { RandevuEylemleri } from "./RandevuEylemleri";
import { RANDEVU_DURUMU } from "@/lib/etiketler";
import { gunAdi, gorece, telefon } from "@/lib/bicim";
import type { Emlak, Randevu } from "@/types/database";

export const metadata: Metadata = { title: "Randevular" };

/**
 * Randevu modülü — emlakçı görünümü.
 * Randevular GÜN bazında alınır; saati danışman müşteriyi arayarak belirler.
 */
export default async function RandevularSayfasi() {
  const supabase = await sunucuIstemcisi();

  const { data } = await supabase
    .from("randevular")
    .select("*")
    .order("tercih_gun", { ascending: true });

  const randevular = (data ?? []) as Randevu[];

  const { data: emlakKayitlari } = await supabase
    .from("emlaklar")
    .select("id, ilan_no, baslik")
    .in("id", [...new Set(randevular.map((r) => r.emlak_id))]);

  const emlakHarita = new Map(
    ((emlakKayitlari ?? []) as Pick<Emlak, "id" | "ilan_no" | "baslik">[]).map(
      (e) => [e.id, e],
    ),
  );

  const bekleyen = randevular.filter((r) => r.durum === "talep").length;

  return (
    <>
      <SayfaBasligi
        baslik="Randevular"
        aciklama="Müşteriler gün bazında randevu talep eder; saati siz telefonla netleştirirsiniz."
      />

      <Kart>
        {randevular.length === 0 ? (
          <BosDurum
            baslik="Randevu talebi yok"
            aciklama="Ziyaretçiler ilan sayfasından randevu bıraktıkça burada listelenir."
          />
        ) : (
          <TabloSarmal>
            <Tablo>
              <thead>
                <tr>
                  <Th>Müşteri</Th>
                  <Th>İlan</Th>
                  <Th>Tercih Edilen Gün</Th>
                  <Th>Not</Th>
                  <Th>Durum</Th>
                  <Th sagaYasli>İşlem</Th>
                </tr>
              </thead>
              <tbody>
                {randevular.map((r) => {
                  const emlak = emlakHarita.get(r.emlak_id);
                  return (
                    <Tr key={r.id}>
                      <Td>
                        <p className="font-medium text-metin">{r.ad_soyad}</p>
                        <a
                          href={`tel:${r.telefon}`}
                          className="rakam text-xs text-marka-600 hover:underline"
                        >
                          {telefon(r.telefon)}
                        </a>
                      </Td>
                      <Td>
                        {emlak ? (
                          <Link
                            href={`/panel/emlaklar/${r.emlak_id}`}
                            className="text-sm text-metin hover:text-marka-600"
                          >
                            #{emlak.ilan_no} {emlak.baslik}
                          </Link>
                        ) : (
                          <span className="text-metin-silik">—</span>
                        )}
                      </Td>
                      <Td className="whitespace-nowrap">
                        <p className="text-sm font-medium">{gunAdi(r.tercih_gun)}</p>
                        {r.alternatif_gun && (
                          <p className="text-xs text-metin-silik">
                            Alternatif: {gunAdi(r.alternatif_gun)}
                          </p>
                        )}
                        <p className="text-xs text-metin-silik">
                          Talep: {gorece(r.created_at)}
                        </p>
                      </Td>
                      <Td className="max-w-48 text-xs text-metin-ikincil">
                        {r.musteri_notu ?? "—"}
                      </Td>
                      <Td>
                        <Rozet ton={durumTonu(r.durum)}>
                          {RANDEVU_DURUMU[r.durum]}
                        </Rozet>
                      </Td>
                      <Td sagaYasli>
                        <RandevuEylemleri
                          id={r.id}
                          durum={r.durum}
                          danismanNotu={r.danisman_notu}
                        />
                      </Td>
                    </Tr>
                  );
                })}
              </tbody>
            </Tablo>
          </TabloSarmal>
        )}
      </Kart>

      <p className="mt-3 text-xs text-metin-silik">
        Toplam {randevular.length} randevu · {bekleyen} tanesi yanıt bekliyor.
      </p>
    </>
  );
}
