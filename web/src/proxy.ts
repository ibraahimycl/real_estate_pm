import type { NextRequest } from "next/server";
import { oturumuTazele } from "@/lib/supabase/oturum";

/**
 * Next.js 16'da Middleware'in adı Proxy oldu; dosya adı proxy.ts olmalıdır.
 * Görevi: her istekte Supabase oturum çerezini tazelemek ve /panel ile
 * /hesabim altındaki rotalar için iyimser giriş kontrolü yapmak.
 *
 * Not: Burası yetkilendirmenin tek katmanı DEĞİLDİR. Asıl kontrol
 * sayfalarda gerektirGiris()/gerektirEmlakci() ve veri tabanında RLS ile
 * yapılır (bkz. db/02_rls.sql).
 */
export async function proxy(request: NextRequest) {
  return oturumuTazele(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
