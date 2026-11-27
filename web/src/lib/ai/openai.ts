import "server-only";

import OpenAI from "openai";
import { aiElleKapatildi } from "./limitler";

/**
 * OpenAI istemcisi.
 *
 * Anahtar tanımlı değilse uygulama ÇÖKMEZ: AI'a bağlı her özellik
 * kural tabanlı yedeğine düşer (bkz. lib/ai/eslestirme.ts).
 * Böylece anahtar girilmeden de sistem uçtan uca çalışır ve demo yapılabilir.
 */
export function aiKullanilabilir(): boolean {
  if (aiElleKapatildi()) return false;
  return Boolean(process.env.OPENAI_API_KEY);
}

export function aiModeli(): string {
  return process.env.OPENAI_MODEL ?? "gpt-4o-mini";
}

let istemci: OpenAI | null = null;

export function aiIstemcisi(): OpenAI | null {
  if (!aiKullanilabilir()) return null;
  istemci ??= new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return istemci;
}
