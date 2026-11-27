import { Alan, Girdi, OnayKutusu, Secim } from "@/components/ui/Alanlar";
import { BagButon, Buton } from "@/components/ui/Buton";
import { EMLAK_TURU, ISLEM_TURU, secenekler } from "@/lib/etiketler";
import { ODA_ON_TANIMLI, odaAyir } from "@/lib/oda";
import type { AramaFiltresi } from "@/modules/arama/schema";

/**
 * Modül 4 — Arama filtre paneli.
 * Normal bir <form> olarak çalışır: JavaScript kapalı olsa bile arama
 * yapılabilir ve sonuç URL'i paylaşılabilir (erişilebilirlik gereksinimi).
 */
export function FiltrePaneli({
  filtre,
  iller,
  ilceler,
  hedef = "/",
}: {
  filtre: AramaFiltresi;
  iller: string[];
  ilceler: string[];
  hedef?: string;
}) {
  // Kutucuklarda bulunmayan, kullanıcının elle yazdığı kombinasyon
  const serbest = filtre.oda_sayilari?.find(
    (o) => !(ODA_ON_TANIMLI as readonly string[]).includes(o),
  );
  const elleOda = odaAyir(serbest);

  return (
    <form action={hedef} className="space-y-4">
      <Alan etiket="İşlem Türü" htmlFor="islem">
        <Secim id="islem" name="islem" defaultValue={filtre.islem_turu ?? ""}>
          <option value="">Tümü</option>
          {secenekler(ISLEM_TURU).map((s) => (
            <option key={s.deger} value={s.deger}>
              {s.etiket}
            </option>
          ))}
        </Secim>
      </Alan>

      <Alan etiket="Emlak Türü" htmlFor="tur">
        <Secim id="tur" name="tur" defaultValue={filtre.emlak_turu ?? ""}>
          <option value="">Tümü</option>
          {secenekler(EMLAK_TURU).map((s) => (
            <option key={s.deger} value={s.deger}>
              {s.etiket}
            </option>
          ))}
        </Secim>
      </Alan>

      <div className="grid grid-cols-2 gap-3">
        <Alan etiket="İl" htmlFor="il">
          <Secim id="il" name="il" defaultValue={filtre.il ?? ""}>
            <option value="">Tümü</option>
            {iller.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </Secim>
        </Alan>
        <Alan etiket="İlçe" htmlFor="ilce">
          <Secim id="ilce" name="ilce" defaultValue={filtre.ilce ?? ""}>
            <option value="">Tümü</option>
            {ilceler.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </Secim>
        </Alan>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Alan etiket="Min. Fiyat" htmlFor="min_fiyat">
          <Girdi
            id="min_fiyat"
            name="min_fiyat"
            type="number"
            min="0"
            step="1000"
            placeholder="0"
            defaultValue={filtre.min_fiyat ?? ""}
          />
        </Alan>
        <Alan etiket="Maks. Fiyat" htmlFor="max_fiyat">
          <Girdi
            id="max_fiyat"
            name="max_fiyat"
            type="number"
            min="0"
            step="1000"
            placeholder="—"
            defaultValue={filtre.max_fiyat ?? ""}
          />
        </Alan>
      </div>

      <fieldset>
        <legend className="mb-2 block text-sm font-medium text-metin">
          Oda Sayısı
        </legend>
        <div className="grid grid-cols-3 gap-1.5">
          {ODA_ON_TANIMLI.map((o) => (
            <OnayKutusu
              key={o}
              etiket={o}
              name="oda"
              value={o}
              defaultChecked={filtre.oda_sayilari?.includes(o)}
              className="text-xs"
            />
          ))}
        </div>

        {/* Listede olmayan kombinasyonlar için elle giriş (örn. 7+3) */}
        <div className="mt-3 rounded-lg border border-cizgi bg-yuzey-alt/60 p-3">
          <p className="mb-2 text-xs text-metin-ikincil">
            Listede yoksa kendiniz yazın:
          </p>
          <div className="flex items-end gap-2">
            <label className="flex-1">
              <span className="mb-1 block text-xs text-metin-silik">Oda</span>
              <Girdi
                name="oda_n"
                type="number"
                min="1"
                max="99"
                placeholder="7"
                defaultValue={elleOda.oda ?? ""}
                className="py-1.5 text-sm"
              />
            </label>
            <span className="pb-2 text-metin-silik">+</span>
            <label className="flex-1">
              <span className="mb-1 block text-xs text-metin-silik">Salon</span>
              <Girdi
                name="salon_n"
                type="number"
                min="0"
                max="99"
                placeholder="3"
                defaultValue={elleOda.salon ?? ""}
                className="py-1.5 text-sm"
              />
            </label>
          </div>
        </div>
      </fieldset>

      <div className="grid grid-cols-2 gap-3">
        <Alan etiket="Min. m² (brüt)" htmlFor="min_m2">
          <Girdi
            id="min_m2"
            name="min_m2"
            type="number"
            min="0"
            step="5"
            placeholder="—"
            defaultValue={filtre.min_m2 ?? ""}
          />
        </Alan>
        <Alan etiket="Maks. Bina Yaşı" htmlFor="max_bina_yasi">
          <Girdi
            id="max_bina_yasi"
            name="max_bina_yasi"
            type="number"
            min="0"
            placeholder="—"
            defaultValue={filtre.max_bina_yasi ?? ""}
          />
        </Alan>
      </div>

      <fieldset>
        <legend className="mb-2 block text-sm font-medium text-metin">
          Özellikler
        </legend>
        <div className="space-y-1.5">
          <OnayKutusu etiket="Asansör" name="asansor" value="1" defaultChecked={filtre.asansor} />
          <OnayKutusu etiket="Otopark" name="otopark" value="1" defaultChecked={filtre.otopark} />
          <OnayKutusu etiket="Eşyalı" name="esyali" value="1" defaultChecked={filtre.esyali} />
          <OnayKutusu etiket="Site İçinde" name="site_icinde" value="1" defaultChecked={filtre.site_icinde} />
          <OnayKutusu etiket="Krediye Uygun" name="krediye_uygun" value="1" defaultChecked={filtre.krediye_uygun} />
        </div>
      </fieldset>

      <Alan etiket="Sıralama" htmlFor="sirala">
        <Secim id="sirala" name="sirala" defaultValue={filtre.siralama ?? "yeni"}>
          <option value="yeni">En yeni ilanlar</option>
          <option value="fiyat_artan">Fiyat (artan)</option>
          <option value="fiyat_azalan">Fiyat (azalan)</option>
          <option value="m2_azalan">Alan (büyükten küçüğe)</option>
        </Secim>
      </Alan>

      <div className="flex gap-2 pt-1">
        <Buton type="submit" className="flex-1">
          Ara
        </Buton>
        <BagButon href={hedef} gorunum="ikincil">
          Sıfırla
        </BagButon>
      </div>
    </form>
  );
}
