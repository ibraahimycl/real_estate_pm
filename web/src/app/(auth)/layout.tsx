import { Marka } from "@/components/Marka";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="min-h-dvh grid lg:grid-cols-2">
      {/* Sol: tanıtım paneli (küçük ekranda gizlenir) */}
      <div className="hidden lg:flex flex-col justify-between bg-marka-700 text-white p-12">
        <Marka boyut="lg" />
        <div className="max-w-md">
          <h1 className="text-3xl font-semibold leading-tight">
            Portföyünüzü, müşterilerinizi ve taleplerinizi tek yerden yönetin.
          </h1>
          <p className="mt-4 text-marka-100 leading-relaxed">
            Emlak kayıtları, müşteri talepleri ve randevular aynı sistemde
            buluşur. Yeni bir ilan girildiğinde, kriterleri tutan müşteriler
            yapay zekâ desteğiyle otomatik olarak eşleştirilir.
          </p>
          <ul className="mt-8 space-y-2.5 text-sm text-marka-100">
            <li>• Filtreli portföy araması ve yazıcı çıktısı</li>
            <li>• Gün bazlı randevu talepleri</li>
            <li>• Karşılanamayan talep analizi</li>
            <li>• Kira sözleşmesi PDF çıktısı</li>
          </ul>
        </div>
        <p className="text-xs text-marka-300">
          Başkent Emlak Yönetim Ltd. Şti.
        </p>
      </div>

      {/* Sağ: form alanı */}
      <div className="flex flex-col justify-center px-6 py-12 sm:px-12">
        <div className="w-full max-w-sm mx-auto">
          <div className="lg:hidden mb-8">
            <Marka />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
