import Link from "next/link";
import type { Metadata } from "next";
import { musterileriListele } from "@/modules/musteri/queries";
import { SayfaBasligi } from "@/components/panel/SayfaBasligi";
import { Kart } from "@/components/ui/Kart";
import { BagButon, Buton } from "@/components/ui/Buton";
import { Rozet } from "@/components/ui/Rozet";
import { Uyari } from "@/components/ui/Uyari";
import { BosDurum } from "@/components/ui/BosDurum";
import { Sayfalama } from "@/components/ui/Sayfalama";
import { Girdi } from "@/components/ui/Alanlar";
import { Tablo, TabloSarmal, Td, Th, Tr } from "@/components/ui/Tablo";
import { ROL } from "@/lib/etiketler";
import { tarih, telefon } from "@/lib/bicim";

export const metadata: Metadata = { title: "Müşteri Tanımı" };

/** Modül 2 — Müşteri listeleme ve arama ekranı. */
export default async function MusterilerSayfasi({
  searchParams,
}: PageProps<"/panel/musteriler">) {
  const sp = await searchParams;
  const arama = typeof sp.arama === "string" ? sp.arama : undefined;
  const sayfa = Number(sp.sayfa) || 1;
  const kayit = typeof sp.kayit === "string" ? sp.kayit : undefined;

  const liste = await musterileriListele({ arama, sayfa });

  return (
    <>
      <SayfaBasligi
        baslik="Müşteri Tanımı"
        aciklama="Emlak alan, satan, kiralayan ve kiraya veren tüm müşterilerin kaydedildiği bölüm."
        eylem={<BagButon href="/panel/musteriler/yeni">Yeni Müşteri</BagButon>}
      />

      {kayit === "silindi" && (
        <div className="mb-5">
          <Uyari tur="basari">Müşteri kaydı silindi.</Uyari>
        </div>
      )}

      <Kart>
        <div className="p-4 border-b border-cizgi yazdirma-gizle">
          <form className="flex gap-2 max-w-lg">
            <Girdi
              name="arama"
              defaultValue={arama ?? ""}
              placeholder="Ad, soyad, e-posta, telefon veya TCKN ile ara…"
              aria-label="Müşteri ara"
            />
            <Buton type="submit" gorunum="ikincil">
              Ara
            </Buton>
            {arama && (
              <BagButon href="/panel/musteriler" gorunum="sessiz">
                Temizle
              </BagButon>
            )}
          </form>
        </div>

        {liste.kayitlar.length === 0 ? (
          <BosDurum
            baslik={arama ? "Eşleşen müşteri bulunamadı" : "Henüz müşteri kaydı yok"}
            aciklama={
              arama
                ? `"${arama}" için sonuç çıkmadı. Farklı bir ifadeyle aramayı deneyin.`
                : "İlk müşteriyi kaydederek başlayın. Emlak girişi yapabilmek için önce sahibinin müşteri kaydı gerekir."
            }
            eylem={
              !arama && (
                <BagButon href="/panel/musteriler/yeni">Yeni Müşteri</BagButon>
              )
            }
          />
        ) : (
          <>
            <TabloSarmal>
              <Tablo>
                <thead>
                  <tr>
                    <Th>Ad Soyad</Th>
                    <Th>İletişim</Th>
                    <Th>TCKN</Th>
                    <Th>Rol</Th>
                    <Th>Kayıt</Th>
                    <Th sagaYasli>İşlem</Th>
                  </tr>
                </thead>
                <tbody>
                  {liste.kayitlar.map((m) => (
                    <Tr key={m.id}>
                      <Td>
                        <Link
                          href={`/panel/musteriler/${m.id}`}
                          className="font-medium text-metin hover:text-marka-600"
                        >
                          {m.ad} {m.soyad}
                        </Link>
                        <p className="text-xs text-metin-silik">{m.eposta}</p>
                      </Td>
                      <Td className="rakam whitespace-nowrap">
                        {telefon(m.cep_telefon)}
                      </Td>
                      <Td className="rakam">{m.tckn ?? "—"}</Td>
                      <Td>
                        <Rozet ton={m.rol === "musteri" ? "notr" : "marka"}>
                          {ROL[m.rol]}
                        </Rozet>
                      </Td>
                      <Td className="text-metin-ikincil whitespace-nowrap">
                        {tarih(m.created_at)}
                        {m.auth_user_id && (
                          <span
                            className="ml-1.5 text-basari-600"
                            title="Müşteri siteye üye olmuş, hesabı bağlı"
                          >
                            ●
                          </span>
                        )}
                      </Td>
                      <Td sagaYasli>
                        <Link
                          href={`/panel/musteriler/${m.id}`}
                          className="text-sm text-marka-600 hover:underline"
                        >
                          Düzenle
                        </Link>
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Tablo>
            </TabloSarmal>
            <Sayfalama
              sayfa={liste.sayfa}
              sayfaSayisi={liste.sayfaSayisi}
              temelYol="/panel/musteriler"
              parametreler={{ arama }}
            />
          </>
        )}
      </Kart>

      <p className="text-xs text-metin-silik mt-3">
        Toplam {liste.toplam} müşteri · Yeşil nokta, müşterinin siteye üye
        olduğunu ve ilanlarının hesabına bağlandığını gösterir.
      </p>
    </>
  );
}
