import "server-only";

import { createClient } from "@supabase/supabase-js";
import { env, servisAnahtari } from "@/lib/env";
import type { Database } from "@/types/database";

/**
 * Yönetici istemcisi — RLS'i atlar.
 *
 * DİKKAT: Yalnızca kullanıcı kimliğinden bağımsız çalışması gereken
 * sunucu işleri için kullanılır (AI eşleştirme motorunun tüm aktif
 * talepleri taraması, görüntülenme sayacının yazılması gibi).
 * Hiçbir koşulda istemci bileşenlerine aktarılmaz — "server-only"
 * içe aktarımı bunu derleme zamanında zorlar.
 */
export function yoneticiIstemcisi() {
  return createClient<Database>(env.supabaseUrl, servisAnahtari(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
