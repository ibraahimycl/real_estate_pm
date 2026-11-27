import { favoriDegistir } from "@/modules/favori/actions";
import { GonderButonu } from "@/components/ui/GonderButonu";

export function FavoriButonu({
  emlakId,
  kayitli,
}: {
  emlakId: string;
  kayitli: boolean;
}) {
  return (
    <form action={favoriDegistir}>
      <input type="hidden" name="emlak_id" value={emlakId} />
      <GonderButonu
        gorunum={kayitli ? "ikincil" : "birincil"}
        className="w-full"
        bekleyenMetin="İşleniyor…"
      >
        {kayitli ? "Kayıtlardan çıkar" : "İlanı kaydet"}
      </GonderButonu>
    </form>
  );
}
