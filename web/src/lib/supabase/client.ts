"use client";

import { createBrowserClient } from "@supabase/ssr";
import { env } from "@/lib/env";
import type { Database } from "@/types/database";

/**
 * Tarayıcı istemcisi — publishable (anon) anahtarı kullanır.
 * Tüm erişim RLS politikaları (db/02_rls.sql) ile sınırlandırılmıştır.
 */
export function tarayiciIstemcisi() {
  return createBrowserClient<Database>(env.supabaseUrl, env.supabaseAnonKey);
}
