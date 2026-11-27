import { cikisYap } from "@/modules/auth/actions";

export function CikisButonu({ className = "" }: { className?: string }) {
  return (
    <form action={cikisYap}>
      <button
        type="submit"
        className={`text-sm text-metin-ikincil hover:text-hata-600 transition-colors ${className}`}
      >
        Çıkış yap
      </button>
    </form>
  );
}
