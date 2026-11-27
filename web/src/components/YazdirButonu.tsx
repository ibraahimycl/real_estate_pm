"use client";

import { Buton } from "@/components/ui/Buton";

export function YazdirButonu({ etiket = "Yazdır" }: { etiket?: string }) {
  return (
    <Buton gorunum="birincil" onClick={() => window.print()}>
      {etiket}
    </Buton>
  );
}
