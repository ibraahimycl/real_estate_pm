import { tarihSaat } from "@/lib/bicim";
import type { GorusmeMesaji } from "@/types/database";

/**
 * Bir AI görüşmesinin tam dökümü.
 * Müşterinin yazdıkları sağda, danışmanın yanıtları solda gösterilir —
 * sohbet ekranının birebir aynısı, böylece danışman konuşmayı okurken
 * müşterinin ne gördüğünü de görmüş olur.
 */
export function GorusmeDokumu({ mesajlar }: { mesajlar: GorusmeMesaji[] }) {
  if (mesajlar.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-metin-ikincil">
        Bu görüşmede kayıtlı mesaj yok.
      </p>
    );
  }

  return (
    <ol className="space-y-3">
      {mesajlar.map((m) => {
        const musteri = m.rol === "user";
        return (
          <li
            key={m.id}
            className={`flex flex-col ${musteri ? "items-end" : "items-start"}`}
          >
            <div
              className={`max-w-[85%] whitespace-pre-line rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                musteri
                  ? "rounded-br-sm bg-marka-600 text-white"
                  : "rounded-bl-sm bg-yuzey-alt text-metin"
              }`}
            >
              {m.icerik}
            </div>
            <span className="mt-1 px-1 text-[11px] text-metin-silik">
              {musteri ? "Müşteri" : "AI danışman"} · {tarihSaat(m.created_at)}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
