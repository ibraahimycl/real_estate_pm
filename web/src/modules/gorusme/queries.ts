import "server-only";

import { sunucuIstemcisi } from "@/lib/supabase/server";
import type { Gorusme, GorusmeMesaji, Talep } from "@/types/database";

export type GorusmeOzeti = Gorusme & {
  mesaj_sayisi: number;
  ilk_soru: string | null;
  son_zaman: string;
  talep: Pick<Talep, "ad_soyad" | "islem_turu" | "ilce" | "durum"> | null;
};

/** Görüşme listesi için özet bilgiler; mesajlar tek sorguda toplanır. */
async function ozetle(gorusmeler: Gorusme[]): Promise<GorusmeOzeti[]> {
  if (gorusmeler.length === 0) return [];
  const supabase = await sunucuIstemcisi();

  const { data: mesajlar } = await supabase
    .from("gorusme_mesajlari")
    .select("gorusme_id, rol, icerik, created_at")
    .in(
      "gorusme_id",
      gorusmeler.map((g) => g.id),
    )
    .order("created_at");

  const talepIdleri = gorusmeler
    .map((g) => g.talep_id)
    .filter(Boolean) as string[];

  const { data: talepler } = talepIdleri.length
    ? await supabase
        .from("talepler")
        .select("id, ad_soyad, islem_turu, ilce, durum")
        .in("id", talepIdleri)
    : { data: [] };

  const talepHarita = new Map(
    ((talepler ?? []) as (Talep & { id: string })[]).map((t) => [t.id, t]),
  );

  const satirlar = (mesajlar ?? []) as Pick<
    GorusmeMesaji,
    "gorusme_id" | "rol" | "icerik" | "created_at"
  >[];

  return gorusmeler.map((g) => {
    const kendi = satirlar.filter((m) => m.gorusme_id === g.id);
    return {
      ...g,
      mesaj_sayisi: kendi.length,
      ilk_soru: kendi.find((m) => m.rol === "user")?.icerik ?? null,
      son_zaman: kendi.at(-1)?.created_at ?? g.created_at,
      talep: g.talep_id ? (talepHarita.get(g.talep_id) ?? null) : null,
    };
  });
}

/** Emlakçı paneli: tüm AI görüşmeleri. */
export async function gorusmeleriListele(): Promise<GorusmeOzeti[]> {
  const supabase = await sunucuIstemcisi();
  const { data } = await supabase
    .from("gorusmeler")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);
  return ozetle((data ?? []) as Gorusme[]);
}

/** Müşteri hesabı: yalnızca kendi görüşmeleri (RLS de sınırlar). */
export async function gorusmelerim(profilId: string): Promise<GorusmeOzeti[]> {
  const supabase = await sunucuIstemcisi();
  const { data } = await supabase
    .from("gorusmeler")
    .select("*")
    .eq("profil_id", profilId)
    .order("created_at", { ascending: false });
  return ozetle((data ?? []) as Gorusme[]);
}

export async function gorusmeDetayi(id: string): Promise<{
  gorusme: Gorusme;
  mesajlar: GorusmeMesaji[];
  talep: Talep | null;
} | null> {
  const supabase = await sunucuIstemcisi();

  const { data: kayit } = await supabase
    .from("gorusmeler")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!kayit) return null;
  const gorusme = kayit as Gorusme;

  const [{ data: mesajlar }, talepSorgusu] = await Promise.all([
    supabase
      .from("gorusme_mesajlari")
      .select("*")
      .eq("gorusme_id", id)
      .order("created_at"),
    gorusme.talep_id
      ? supabase.from("talepler").select("*").eq("id", gorusme.talep_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  return {
    gorusme,
    mesajlar: (mesajlar ?? []) as GorusmeMesaji[],
    talep: (talepSorgusu.data as Talep | null) ?? null,
  };
}

/** Bir talebin hangi görüşmeden doğduğunu bulur. */
export async function talebinGorusmesi(
  talepId: string,
): Promise<{ id: string; created_at: string } | null> {
  const supabase = await sunucuIstemcisi();
  const { data } = await supabase
    .from("gorusmeler")
    .select("id, created_at")
    .eq("talep_id", talepId)
    .maybeSingle();
  return (data as { id: string; created_at: string } | null) ?? null;
}
