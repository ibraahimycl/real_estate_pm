import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { isyeriGetir } from "@/modules/isyeri/queries";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  const ofis = await isyeriGetir();
  const unvan = ofis?.unvan?.trim() || "Başkent Emlak";
  return {
    title: {
      default: `${unvan} — Emlak Yönetim Platformu`,
      template: `%s · ${unvan}`,
    },
    description:
      "Emlak portföyü, müşteri ve talep yönetimi ile yapay zekâ destekli eşleştirme platformu.",
  };
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="tr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
