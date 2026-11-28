import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { portfoyListele } from "@/modules/emlak/queries";
import { SayfaBasligi } from "@/components/panel/SayfaBasligi";
import { Kart } from "@/components/ui/Kart";
import { BagButon, Buton } from "@/components/ui/Buton";
import { Rozet, durumTonu } from "@/components/ui/Rozet";
import { Uyari } from "@/components/ui/Uyari";
import { BosDurum } from "@/components/ui/BosDurum";
import { Sayfalama } from "@/components/ui/Sayfalama";
import { Girdi, Secim } from "@/components/ui/Alanlar";
import { Tablo, TabloSarmal, Td, Th, Tr } from "@/components/ui/Tablo";
import { EMLAK_DURUMU, EMLAK_TURU, ISLEM_TURU, secenekler } from "@/lib/etiketler";
import { para, telefon } from "@/lib/bicim";
import type { EmlakDurumu, IslemTuru } from "@/types/database";

export const metadata: Metadata = { title: "Emlak Tanımı" };

/** Modül 3 — Portföy listeleme ekranı. */
export default async function EmlaklarSayfasi({
  searchParams,
}: PageProps<"/panel/emlaklar">) {
  const sp = await searchParams;
  const arama = typeof sp.arama === "string" ? sp.arama : undefined;
  const durum = typeof sp.durum === "string" ? (sp.durum as EmlakDurumu) : undefined;
  const islemTuru =
    typeof sp.islem === "string" ? (sp.islem as IslemTuru) : undefined;
  const sayfa = Number(sp.sayfa) || 1;

  const liste = await portfoyListele({ arama, durum, islemTuru, sayfa });

  const ciktiParams = new URLSearchParams();
  if (arama) ciktiParams.set("arama", arama);
  if (durum) ciktiParams.set("durum", durum);
  if (islemTuru) ciktiParams.set("islem", islemTuru);
  const ciktiYolu = ciktiParams.toString()
    ? `/panel/emlaklar/cikti?${ciktiParams.toString()}`
    : "/panel/emlaklar/cikti";

  return (
    <>
      <SayfaBasligi
        baslik="Emlak Tanımı"
        aciklama="Satıcı ve kiraya veren müşteriler tarafından ofise verilen emlak kayıtları."
        eylem={
          <>
            {liste.toplam > 0 && (
              <BagButon href={ciktiYolu} gorunum="ikincil">
                Listeyi Yazdır / PDF
              </BagButon>
            )}
            <BagButon href="/panel/emlaklar/yeni">Yeni İlan</BagButon>
          </>
        }
      />

      {sp.kayit === "silindi" && (
        <div className="mb-5">
          <Uyari tur="basari">İlan kaydı silindi.</Uyari>
        </div>
      )}

      <Kart>
        <div className="p-4 border-b border-cizgi yazdirma-gizle">
          <form className="flex flex-wrap gap-2">
            <Girdi
              name="arama"
              defaultValue={arama ?? ""}
              placeholder="Başlık, ilçe veya ilan numarası…"
              className="max-w-xs"
              aria-label="İlan ara"
            />
            <Secim name="islem" defaultValue={islemTuru ?? ""} className="w-auto" aria-label="İşlem türü">
              <option value="">Tüm işlem türleri</option>
              {secenekler(ISLEM_TURU).map((s) => (
                <option key={s.deger} value={s.deger}>{s.etiket}</option>
              ))}
            </Secim>
            <Secim name="durum" defaultValue={durum ?? ""} className="w-auto" aria-label="Durum">
              <option value="">Tüm durumlar</option>
              {secenekler(EMLAK_DURUMU).map((s) => (
                <option key={s.deger} value={s.deger}>{s.etiket}</option>
              ))}
            </Secim>
            <Buton type="submit" gorunum="ikincil">Filtrele</Buton>
            {(arama || durum || islemTuru) && (
              <BagButon href="/panel/emlaklar" gorunum="sessiz">Temizle</BagButon>
            )}
          </form>
        </div>

        {liste.kayitlar.length === 0 ? (
          <BosDurum
            baslik="İlan bulunamadı"
            aciklama="Filtreleri değiştirin veya yeni bir emlak kaydı oluşturun. Emlak girişi için önce sahibinin müşteri kaydı gerekir."
            eylem={<BagButon href="/panel/emlaklar/yeni">Yeni İlan</BagButon>}
          />
        ) : (
          <>
            <TabloSarmal>
              <Tablo>
                <thead>
                  <tr>
                    <Th>İlan</Th>
                    <Th>Sahibi</Th>
                    <Th>Nitelik</Th>
                    <Th sagaYasli>Fiyat</Th>
                    <Th>Durum</Th>
                  </tr>
                </thead>
                <tbody>
                  {liste.kayitlar.map((e) => (
                    <Tr key={e.id}>
                      <Td>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-14 shrink-0 rounded bg-yuzey-alt overflow-hidden relative">
                            <Image
                              src={`https://picsum.photos/seed/eyp-${e.ilan_no}-1/900/600`}
                              alt=""
                              fill
                              sizes="56px"
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                          <div className="min-w-0">
                            <Link
                              href={`/panel/emlaklar/${e.id}`}
                              className="font-medium text-metin hover:text-marka-600 line-clamp-1"
                            >
                              {e.baslik}
                            </Link>
                            <p className="text-xs text-metin-silik rakam">
                              İlan no {e.ilan_no} · {e.il} / {e.ilce}
                            </p>
                          </div>
                        </div>
                      </Td>
                      <Td>
                        {e.sahip ? (
                          <>
                            <p className="text-sm">{e.sahip.ad} {e.sahip.soyad}</p>
                            <p className="text-xs text-metin-silik rakam">
                              {telefon(e.sahip.cep_telefon)}
                            </p>
                          </>
                        ) : (
                          "—"
                        )}
                      </Td>
                      <Td className="text-metin-ikincil whitespace-nowrap">
                        {EMLAK_TURU[e.emlak_turu]} · {e.oda_sayisi} · {e.m2_brut} m²
                      </Td>
                      <Td sagaYasli className="rakam font-medium whitespace-nowrap">
                        {para(e.fiyat)}
                        <p className="text-xs font-normal text-metin-silik">
                          {ISLEM_TURU[e.islem_turu]}
                        </p>
                      </Td>
                      <Td>
                        <Rozet ton={durumTonu(e.durum)}>{EMLAK_DURUMU[e.durum]}</Rozet>
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Tablo>
            </TabloSarmal>
            <Sayfalama
              sayfa={liste.sayfa}
              sayfaSayisi={liste.sayfaSayisi}
              temelYol="/panel/emlaklar"
              parametreler={{ arama, durum, islem: islemTuru }}
            />
          </>
        )}
      </Kart>

      <p className="text-xs text-metin-silik mt-3">Toplam {liste.toplam} ilan.</p>
    </>
  );
}
