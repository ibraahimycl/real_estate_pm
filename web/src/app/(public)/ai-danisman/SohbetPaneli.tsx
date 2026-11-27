"use client";

import { useEffect, useRef, useState } from "react";
import { Buton } from "@/components/ui/Buton";
import { Uyari } from "@/components/ui/Uyari";

type Mesaj = { rol: "user" | "assistant"; icerik: string };

// Bölme için global, sınama için global OLMAYAN iki ayrı desen:
// global bir regex'te .test() çağırmak lastIndex'i ilerletir ve ardışık
// çağrılarda dönüşümlü yanlış sonuç verir.
const ILAN_YOLU_BOL = /(\/ilan\/[0-9a-fA-F-]{36})/g;
const ILAN_YOLU_SINA = /^\/ilan\/[0-9a-fA-F-]{36}$/;

/**
 * Danışmanın yanıtındaki ham "/ilan/<id>" yollarını tıklanabilir bağlantıya
 * çevirir. Markdown ayrıştırıcısı eklemek yerine yalnızca bu desen işlenir —
 * modele de markdown yazmaması söylendiği için fazlası gereksiz.
 */
function MetinParcalari({ metin }: { metin: string }) {
  return (
    <>
      {metin.split(ILAN_YOLU_BOL).map((parca, i) =>
        ILAN_YOLU_SINA.test(parca) ? (
          <a
            key={i}
            href={parca}
            className="font-medium underline underline-offset-2"
          >
            İlanı aç
          </a>
        ) : (
          <span key={i}>{parca}</span>
        ),
      )}
    </>
  );
}

const ACILIS_MESAJI: Mesaj = {
  rol: "assistant",
  icerik:
    "Merhaba, Başkent Emlak'a hoş geldiniz. Ben ofisin yapay zekâ danışmanıyım. " +
    "Aradığınız evi veya iş yerini anlatın; portföyümüzde uygun kayıt varsa hemen söyleyeyim. " +
    "Bulamazsak, isterseniz kriterlerinizi kaydedip uygun ilan düştüğünde size haber verelim.",
};

const ORNEK_SORULAR = [
  "Gölbaşı'nda 2+1 kiralık ev arıyorum, bütçem 25 bin TL.",
  "Çankaya'da eşyalı 1+1 kiralık var mı?",
  "3 numaralı ilanın fiyatı ne kadar?",
];

export function SohbetPaneli({ aiAktif }: { aiAktif: boolean }) {
  const [mesajlar, setMesajlar] = useState<Mesaj[]>([ACILIS_MESAJI]);
  const [girdi, setGirdi] = useState("");
  const [bekliyor, setBekliyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [gorusmeId, setGorusmeId] = useState<string | null>(null);
  const [talepKaydedildi, setTalepKaydedildi] = useState(false);
  const sonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    sonRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [mesajlar, bekliyor]);

  async function gonder(metin: string) {
    const temiz = metin.trim();
    if (!temiz || bekliyor) return;

    setHata(null);
    setGirdi("");
    setMesajlar((o) => [...o, { rol: "user", icerik: temiz }]);
    setBekliyor(true);

    try {
      const yanit = await fetch("/api/ai/gorusme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gorusme_id: gorusmeId, mesaj: temiz }),
      });
      const veri = await yanit.json();

      if (!yanit.ok) {
        setHata(veri.hata ?? "Yanıt alınamadı.");
        return;
      }

      setGorusmeId(veri.gorusme_id);
      if (veri.talep_kaydedildi) setTalepKaydedildi(true);
      setMesajlar((o) => [...o, { rol: "assistant", icerik: veri.yanit }]);
    } catch {
      setHata("Bağlantı kurulamadı. Lütfen tekrar deneyin.");
    } finally {
      setBekliyor(false);
    }
  }

  return (
    <div className="flex h-[min(42rem,75dvh)] flex-col overflow-hidden rounded-kart border border-cizgi bg-yuzey">
      {/* Başlık çubuğu */}
      <div className="flex items-center gap-3 border-b border-cizgi px-5 py-3.5">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-marka-600 text-sm font-bold text-white">
          AI
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-metin">AI Emlak Danışmanı</p>
          <p className="text-xs text-metin-silik">
            {aiAktif ? "Çevrim içi" : "Kural tabanlı mod"}
          </p>
        </div>
        {talepKaydedildi && (
          <span className="ml-auto rounded-full bg-basari-100 px-2.5 py-1 text-xs font-medium text-basari-600">
            Talebiniz kaydedildi
          </span>
        )}
      </div>

      {/* Mesajlar */}
      <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
        {mesajlar.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.rol === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] whitespace-pre-line rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                m.rol === "user"
                  ? "rounded-br-sm bg-marka-600 text-white"
                  : "rounded-bl-sm bg-yuzey-alt text-metin"
              }`}
            >
              {m.rol === "assistant" ? (
                <MetinParcalari metin={m.icerik} />
              ) : (
                m.icerik
              )}
            </div>
          </div>
        ))}

        {bekliyor && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-sm bg-yuzey-alt px-4 py-3">
              <span className="flex gap-1" aria-label="Danışman yazıyor">
                {[0, 150, 300].map((g) => (
                  <span
                    key={g}
                    className="h-1.5 w-1.5 animate-bounce rounded-full bg-metin-silik"
                    style={{ animationDelay: `${g}ms` }}
                  />
                ))}
              </span>
            </div>
          </div>
        )}

        {hata && <Uyari tur="hata">{hata}</Uyari>}

        {mesajlar.length === 1 && (
          <div className="pt-2">
            <p className="mb-2 text-xs text-metin-silik">Örnek sorular:</p>
            <div className="flex flex-wrap gap-2">
              {ORNEK_SORULAR.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => gonder(s)}
                  className="rounded-full border border-cizgi-koyu px-3 py-1.5 text-xs text-metin-ikincil transition-colors hover:border-marka-300 hover:bg-marka-50 hover:text-marka-700"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={sonRef} />
      </div>

      {/* Giriş */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          gonder(girdi);
        }}
        className="flex gap-2 border-t border-cizgi p-3"
      >
        <input
          value={girdi}
          onChange={(e) => setGirdi(e.target.value)}
          placeholder="Nasıl bir yer arıyorsunuz?"
          maxLength={1000}
          disabled={bekliyor}
          aria-label="Mesajınız"
          className="flex-1 rounded-lg border border-cizgi-koyu bg-yuzey px-3 py-2 text-sm text-metin placeholder:text-metin-silik focus:border-marka-500 disabled:bg-yuzey-alt"
        />
        <Buton type="submit" disabled={bekliyor || girdi.trim() === ""}>
          Gönder
        </Buton>
      </form>
    </div>
  );
}
