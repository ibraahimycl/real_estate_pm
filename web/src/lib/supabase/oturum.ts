import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";

/**
 * Her istekte Supabase oturum çerezini tazeler.
 * Bu olmadan Server Component'ler süresi dolmuş bir token görür ve
 * kullanıcı rastgele oturumdan düşer.
 */
export async function oturumuTazele(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const yol = request.nextUrl.pathname;
  const korumali = yol.startsWith("/panel") || yol.startsWith("/hesabim");

  if (korumali && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/giris";
    url.searchParams.set("devam", yol);
    return NextResponse.redirect(url);
  }

  return response;
}
