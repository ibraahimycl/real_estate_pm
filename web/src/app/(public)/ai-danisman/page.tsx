import type { Metadata } from "next";
import { aiKullanilabilir } from "@/lib/ai/openai";
import { SohbetPaneli } from "./SohbetPaneli";
import { Kart, KartGovde } from "@/components/ui/Kart";
import { Uyari } from "@/components/ui/Uyari";

export const metadata: Metadata = { title: "AI Emlak Danışmanı" };

/**
 * AI Danışman ekranı — ofisi telefonla aramanın sistem içi karşılığı.
 * Danışman, veri tabanındaki ilanları sorgular ve müşteri onay verirse
 * talebini kaydeder.
 */
export default function AiDanismanSayfasi() {
  const aiAktif = aiKullanilabilir();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-metin">AI Emlak Danışmanı</h1>
        <p className="mt-1 max-w-2xl text-sm text-metin-ikincil">
          Ofisi aradığınızda telefonu açan danışmanın sistem içindeki
          karşılığı. Aradığınız yeri anlatın; portföyü sizin için sorgulasın,
          uygun kayıt yoksa kriterlerinizi kaydetsin.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem] items-start">
        <SohbetPaneli aiAktif={aiAktif} />

        <aside className="space-y-4">
          {!aiAktif && (
            <Uyari tur="uyari" baslik="Kural tabanlı mod">
              <code>OPENAI_API_KEY</code> tanımlı olmadığı için danışman, dil
              modeli yerine kural tabanlı yedekle çalışıyor. Portföy sorgulama
              ve talep kaydetme işlevleri aynen çalışır; yalnızca dil akıcılığı
              sınırlıdır.
            </Uyari>
          )}

          <Kart>
            <KartGovde>
              <h2 className="mb-2 text-sm font-semibold text-metin">
                Danışman neler yapabilir?
              </h2>
              <ul className="space-y-2 text-sm text-metin-ikincil">
                <li>
                  <strong className="text-metin">Portföyü sorgular.</strong>{" "}
                  İlçe, bütçe, oda sayısı ve özelliklere göre gerçek ilanları
                  arar — bilgileri uydurmaz.
                </li>
                <li>
                  <strong className="text-metin">İlan bilgisi verir.</strong>{" "}
                  İlan numarasıyla fiyat ve özellikleri söyler.
                </li>
                <li>
                  <strong className="text-metin">Talebinizi kaydeder.</strong>{" "}
                  Yalnızca siz açıkça onay verirseniz ad, telefon ve
                  kriterlerinizi kaydeder.
                </li>
                <li>
                  <strong className="text-metin">Haber verir.</strong>{" "}
                  Kriterlerinize uyan yeni bir ilan girildiğinde size mesaj
                  gönderilir.
                </li>
              </ul>
            </KartGovde>
          </Kart>

          <Kart>
            <KartGovde>
              <h2 className="mb-1.5 text-sm font-semibold text-metin">
                Kişisel verileriniz
              </h2>
              <p className="text-xs leading-relaxed text-metin-ikincil">
                Ad ve telefon bilgileriniz yalnızca siz onay verdiğinizde
                kaydedilir ve sadece size uygun ilan bildirimi için kullanılır.
                Hesabınızdan talebinizi dilediğiniz zaman kapatabilir, bildirim
                iznini geri çekebilirsiniz.
              </p>
            </KartGovde>
          </Kart>
        </aside>
      </div>
    </div>
  );
}
