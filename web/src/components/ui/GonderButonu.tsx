"use client";

import { useFormStatus } from "react-dom";
import { Buton } from "./Buton";
import type { ComponentProps } from "react";

/**
 * Form gönderilirken kendini devre dışı bırakan buton.
 * Çift gönderimi ve mükerrer kayıt oluşmasını engeller.
 */
export function GonderButonu({
  children,
  bekleyenMetin = "Kaydediliyor…",
  ...props
}: ComponentProps<typeof Buton> & { bekleyenMetin?: string }) {
  const { pending } = useFormStatus();
  return (
    <Buton type="submit" disabled={pending} {...props}>
      {pending ? bekleyenMetin : children}
    </Buton>
  );
}
