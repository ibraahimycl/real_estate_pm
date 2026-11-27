import "server-only";

import { ilanAra, talepKaydet } from "./araclar";
import { para } from "@/lib/bicim";
import type { IslemTuru, OdaSayisi } from "@/types/database";
import type { SohbetMesaji } from "./gorusme";

/**
 * KURAL TABANLI YEDEK DANIŞMAN
 *
 * OPENAI_API_KEY tanımlı değilken devreye girer. Dil modeli kullanmadan,
 * konuşma metninden düzenli ifadelerle kriter çıkarır, aynı araçları
 * (ilan_ara / talep_kaydet) çağırır ve şablon yanıtlar üretir.
 *
 * Amacı: AI erişimi olmasa bile akışın uçtan uca sınanabilmesi.
 */

const ILCELER = [
  "Çankaya", "Keçiören", "Yenimahalle", "Gölbaşı", "Etimesgut",
  "Mamak", "Sincan", "Altındağ", "Pursaklar", "Polatlı",
];

const ONAY_SOZCUKLERI = [
  "evet", "olur", "tamam", "kaydet", "kaydedin", "lütfen kaydet",
  "peki", "uygun", "onaylıyorum", "haber ver",
];

type Kriterler = {
  islem_turu?: IslemTuru;
  ilce?: string;
  max_fiyat?: number;
  min_m2?: number;
  oda_sayilari?: OdaSayisi[];
  asansor?: boolean;
  otopark?: boolean;
  esyali?: boolean;
  ad_soyad?: string;
  telefon?: string;
};

function kriterleriCikar(gecmis: SohbetMesaji[]): Kriterler {
  const metin = gecmis
    .filter((m) => m.rol === "user")
    .map((m) => m.icerik)
    .join(" ")
    .toLocaleLowerCase("tr");

  const k: Kriterler = {};

  if (/kiral[ıi]k|kiraya|kira/.test(metin)) k.islem_turu = "kiralik";
  if (/sat[ıi]l[ıi]k|sat[ıi]n al|satis|satış/.test(metin)) k.islem_turu = "satilik";

  const ilce = ILCELER.find((i) =>
    metin.includes(i.toLocaleLowerCase("tr")),
  );
  if (ilce) k.ilce = ilce;

  // Metindeki "2+1", "7+3" gibi tüm oda kalıplarını yakalar.
  const odalar = [...new Set(metin.match(/\b[1-9][0-9]?\+[0-9]{1,2}\b/g) ?? [])];
  if (odalar.length) k.oda_sayilari = odalar;

  if (/asansör|asansor/.test(metin)) k.asansor = true;
  if (/otopark|garaj/.test(metin)) k.otopark = true;
  if (/eşyalı|esyali|mobilyalı|mobilyali/.test(metin)) k.esyali = true;

  // "30 bin", "30000", "1.5 milyon" gibi bütçe ifadeleri
  const bin = metin.match(/(\d+(?:[.,]\d+)?)\s*bin/);
  const milyon = metin.match(/(\d+(?:[.,]\d+)?)\s*milyon/);
  const duz = metin.match(/(\d{4,})\s*(?:tl|lira|₺)?/);
  if (milyon) k.max_fiyat = Number(milyon[1].replace(",", ".")) * 1_000_000;
  else if (bin) k.max_fiyat = Number(bin[1].replace(",", ".")) * 1_000;
  else if (duz) k.max_fiyat = Number(duz[1]);

  const m2 = metin.match(/(\d{2,4})\s*(?:m2|m²|metrekare)/);
  if (m2) k.min_m2 = Number(m2[1]);

  const tel = metin.match(/0?5\d{9}/);
  if (tel) k.telefon = tel[0].length === 10 ? `0${tel[0]}` : tel[0];

  const ad = metin.match(
    /(?:ad[ıi]m|ben|is[ıi]m|ismim)\s+([a-zçğıöşü]+(?:\s+[a-zçğıöşü]+)?)/i,
  );
  if (ad) {
    k.ad_soyad = ad[1]
      .split(" ")
      .map((p) => p.charAt(0).toLocaleUpperCase("tr") + p.slice(1))
      .join(" ");
  }

  return k;
}

/**
 * Arama yapabilmek için gereken asgari bilgi: işlem türü, ilçe ve oda sayısı.
 * Bütçe bilinçli olarak zorunlu tutulmaz — müşteri "Çankaya'da eşyalı 1+1
 * kiralık var mı?" diye sorduğunda bütçe sorup oyalamak yerine doğrudan
 * cevap verilir; bütçe yalnızca sonuç çoksa daraltmak için istenir.
 */
function eksikBilgiSorusu(k: Kriterler): string | null {
  if (!k.islem_turu) return "Kiralık mı yoksa satılık mı bakıyorsunuz?";
  if (!k.ilce) return "Hangi ilçede arıyorsunuz?";
  if (!k.oda_sayilari?.length) return "Kaç odalı olsun? Örneğin 2+1 veya 3+1.";
  return null;
}

export async function kuralTabanliYanit(
  gecmis: SohbetMesaji[],
  gorusmeId: string,
  profilId: string | null,
): Promise<{ yanit: string; talepKaydedildi: boolean }> {
  const k = kriterleriCikar(gecmis);
  const sonMesaj =
    gecmis.filter((m) => m.rol === "user").at(-1)?.icerik.toLocaleLowerCase("tr") ??
    "";
  const onayVerdi = ONAY_SOZCUKLERI.some((s) => sonMesaj.includes(s));

  // 1) Müşteri onay verdiyse ve ad/telefon elimizdeyse talebi kaydet
  if (onayVerdi && k.ad_soyad && k.telefon && k.islem_turu) {
    const kayit = await talepKaydet(
      {
        ad_soyad: k.ad_soyad,
        telefon: k.telefon,
        islem_turu: k.islem_turu,
        ilce: k.ilce,
        max_fiyat: k.max_fiyat,
        min_m2: k.min_m2,
        oda_sayilari: k.oda_sayilari,
        asansor_sart: k.asansor,
        notlar: "AI görüşmesi (kural tabanlı mod) sırasında alındı.",
      },
      gorusmeId,
      profilId,
    );

    if (kayit.basarili) {
      return {
        yanit:
          `Teşekkürler ${k.ad_soyad}. Aradığınız kriterleri kaydettim. ` +
          `Portföyümüze uyan bir ilan düştüğünde size ${k.telefon} numarasından haber vereceğiz.`,
        talepKaydedildi: true,
      };
    }
    return { yanit: kayit.mesaj, talepKaydedildi: false };
  }

  // 2) Onay verdi ama iletişim bilgisi eksikse iste
  if (onayVerdi && (!k.ad_soyad || !k.telefon)) {
    const eksik = !k.ad_soyad ? "adınızı" : "telefon numaranızı";
    return {
      yanit: `Memnuniyetle kaydedeyim. ${
        eksik.charAt(0).toLocaleUpperCase("tr") + eksik.slice(1)
      } alabilir miyim?`,
      talepKaydedildi: false,
    };
  }

  // 3) Yeterli kriter yoksa eksik olanı sor
  // Açılış selamlaması istemci tarafında bir kez gösterildiği için burada
  // tekrarlanmaz; doğrudan eksik bilgi sorulur.
  const soru = eksikBilgiSorusu(k);
  if (soru) {
    return { yanit: soru, talepKaydedildi: false };
  }

  // 4) Kriterler tamam: portföyde ara
  const { ilanlar } = await ilanAra({
    islem_turu: k.islem_turu,
    ilce: k.ilce,
    max_fiyat: k.max_fiyat,
    min_m2: k.min_m2,
    oda_sayilari: k.oda_sayilari,
    asansor: k.asansor,
    otopark: k.otopark,
    esyali: k.esyali,
  });

  if (ilanlar.length > 3 && !k.max_fiyat) {
    return {
      yanit: `${ilanlar.length} uygun ilanımız var. Bütçenizin üst sınırını söylerseniz listeyi daraltabilirim.`,
      talepKaydedildi: false,
    };
  }

  if (ilanlar.length > 0) {
    const liste = ilanlar
      .slice(0, 3)
      .map(
        (i) =>
          `• ${i.baslik} — ${i.oda_sayisi}, ${i.m2_brut} m², ${para(i.fiyat)} (ilan no ${i.ilan_no})`,
      )
      .join("\n");
    return {
      yanit:
        `Aradığınız kriterlere uyan ${ilanlar.length} ilanımız var:\n${liste}\n\n` +
        `İsterseniz bu ilanları sitemizden inceleyebilirsiniz. ` +
        `Ayrıca kriterlerinizi kaydedeyim mi? Yeni bir ilan düştüğünde size haber verelim.`,
      talepKaydedildi: false,
    };
  }

  return {
    yanit:
      `Şu anda ${k.ilce} bölgesinde ${k.esyali ? "eşyalı " : ""}${k.oda_sayilari?.join("/") ?? ""} ` +
      `${k.islem_turu === "kiralik" ? "kiralık" : "satılık"} portföyümüzde uygun bir kayıt bulamadım. ` +
      `İsterseniz adınızı ve telefonunuzu alıp kriterlerinizi kaydedeyim; uygun bir ilan düştüğünde ilk siz haberdar olun. Kaydedeyim mi?`,
    talepKaydedildi: false,
  };
}
