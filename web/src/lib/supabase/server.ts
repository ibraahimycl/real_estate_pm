import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/lib/env";
import type { Database } from "@/types/database";

/**
 * Server Component / Server Action istemcisi.
 * Oturum çerezlerini okur, böylece RLS politikaları giriş yapmış
 * kullanıcının kimliğiyle (auth.uid()) çalışır.
 */
export async function sunucuIstemcisi() {
  const cookieStore = await cookies();

  return createServerClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Component içinden çerez yazılamaz; oturum yenilemesi
          // middleware tarafından yapıldığı için bu durum güvenle yutulabilir.
        }
      },
    },
  });
}
