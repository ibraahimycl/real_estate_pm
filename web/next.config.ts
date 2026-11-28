import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Tüm rotalar oturum/rol bağımlı veri gösterdiği için dinamik çalışır.
  cacheComponents: false,
  partialPrefetching: false,
  experimental: {
    // Fotoğraf yükleme formları 5 MB'a kadar görsel kabul ediyor
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },

  // Tailwind CSS v4, Turbopack yükleyicisi üzerinden işlenir.
  // Bu kural olmadan @theme bloğu çözümlenmez ve hiçbir utility sınıfı
  // üretilmez (sayfalar stilsiz görünür).
  turbopack: {
    // Çalışma alanı kökünü açıkça belirtir; üst dizinlerdeki dosyalara
    // bakarak yanlış kök çıkarımı yapılmasını ve uyarı üretilmesini önler.
    root: __dirname,
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },

  images: {
    remotePatterns: [
      // Seed verisindeki geçici ilan görselleri
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "fastly.picsum.photos" },
      // Supabase Storage'a yüklenen gerçek ilan fotoğrafları
      { protocol: "https", hostname: "poamkjxryunswbpnigii.supabase.co" },
    ],
  },
};

export default nextConfig;
