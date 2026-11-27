"use client";

import { useActionState, useState } from "react";
import { sozlesmeOlustur } from "@/modules/sozlesme/actions";
import { BOS_SONUC } from "@/modules/ortak/sonuc";
import { Alan, Girdi, MetinAlani, Secim } from "@/components/ui/Alanlar";
import { GonderButonu } from "@/components/ui/GonderButonu";
import { Uyari } from "@/components/ui/Uyari";
import { Kart, KartGovde } from "@/components/ui/Kart";
import { BagButon } from "@/components/ui/Buton";
import { para } from "@/lib/bicim";

type Ilan = {
  id: string;
  ilan_no: number;
  baslik: string;
  fiyat: number;
  depozito: number | null;
  sahip_profil_id: string;
};

type Musteri = { id: string; ad: string; soyad: string; eposta: string };

export function SozlesmeFormu({
  ilanlar,
  musteriler,
}: {
  ilanlar: Ilan[];
  musteriler: Musteri[];
}) {
  const [durum, eylem] = useActionState(sozlesmeOlustur, BOS_SONUC);
  const [secilenIlan, setSecilenIlan] = useState<Ilan | null>(null);
  const h = durum.alanHatalari;

  return (
    <form action={eylem} className="space-y-5">
      {durum.mesaj && <Uyari tur="hata">{durum.mesaj}</Uyari>}

      <Kart>
        <KartGovde className="space-y-4">
          <h2 className="font-semibold text-metin">Taraflar ve Konut</h2>

          <Alan etiket="Kiralanan İlan" htmlFor="emlak_id" zorunlu hata={h?.emlak_id}
            yardim="Yalnızca kiralık ve henüz kiralanmamış ilanlar listelenir. Ev sahibi, ilanın sahibi olarak otomatik atanır.">
            <Secim
              id="emlak_id"
              name="emlak_id"
              defaultValue=""
              hatali={Boolean(h?.emlak_id)}
              required
              onChange={(e) =>
                setSecilenIlan(
                  ilanlar.find((i) => i.id === e.target.value) ?? null,
                )
              }
            >
              <option value="">— İlan seçiniz —</option>
              {ilanlar.map((i) => (
                <option key={i.id} value={i.id}>
                  #{i.ilan_no} — {i.baslik} ({para(i.fiyat)})
                </option>
              ))}
            </Secim>
          </Alan>

          <Alan etiket="Kiracı Müşteri" htmlFor="kiraci_profil_id" zorunlu
            hata={h?.kiraci_profil_id}>
            <Secim id="kiraci_profil_id" name="kiraci_profil_id" defaultValue=""
              hatali={Boolean(h?.kiraci_profil_id)} required>
              <option value="">— Müşteri seçiniz —</option>
              {musteriler
                .filter((m) => m.id !== secilenIlan?.sahip_profil_id)
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.ad} {m.soyad} ({m.eposta})
                  </option>
                ))}
            </Secim>
          </Alan>
        </KartGovde>
      </Kart>

      <Kart>
        <KartGovde className="space-y-4">
          <h2 className="font-semibold text-metin">Sözleşme Koşulları</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Alan etiket="Başlangıç Tarihi" htmlFor="baslangic_tarihi" zorunlu
              hata={h?.baslangic_tarihi}>
              <Girdi id="baslangic_tarihi" name="baslangic_tarihi" type="date"
                hatali={Boolean(h?.baslangic_tarihi)} required />
            </Alan>
            <Alan etiket="Bitiş Tarihi" htmlFor="bitis_tarihi" zorunlu
              hata={h?.bitis_tarihi} yardim="Genellikle 1 yıl sonrası.">
              <Girdi id="bitis_tarihi" name="bitis_tarihi" type="date"
                hatali={Boolean(h?.bitis_tarihi)} required />
            </Alan>
            <Alan etiket="Aylık Kira Bedeli (TL)" htmlFor="kira_bedeli" zorunlu
              hata={h?.kira_bedeli}>
              <Girdi id="kira_bedeli" name="kira_bedeli" type="number" min="1" step="1"
                key={`kira-${secilenIlan?.id ?? "yok"}`}
                defaultValue={secilenIlan?.fiyat ?? ""}
                hatali={Boolean(h?.kira_bedeli)} required />
            </Alan>
            <Alan etiket="Depozito (TL)" htmlFor="depozito" hata={h?.depozito}>
              <Girdi id="depozito" name="depozito" type="number" min="0" step="1"
                key={`dep-${secilenIlan?.id ?? "yok"}`}
                defaultValue={secilenIlan?.depozito ?? 0}
                hatali={Boolean(h?.depozito)} />
            </Alan>
          </div>

          <Alan etiket="Özel Şartlar" htmlFor="ozel_sartlar" hata={h?.ozel_sartlar}
            yardim="Sözleşme metnine eklenecek ek maddeler.">
            <MetinAlani id="ozel_sartlar" name="ozel_sartlar" rows={4}
              placeholder="Örn: Evde evcil hayvan beslenmeyecektir. Aidat kiracıya aittir."
              hatali={Boolean(h?.ozel_sartlar)} />
          </Alan>
        </KartGovde>
      </Kart>

      <div className="flex justify-end gap-2">
        <BagButon href="/panel/sozlesmeler" gorunum="ikincil">Vazgeç</BagButon>
        <GonderButonu>Sözleşme Taslağı Oluştur</GonderButonu>
      </div>
    </form>
  );
}
