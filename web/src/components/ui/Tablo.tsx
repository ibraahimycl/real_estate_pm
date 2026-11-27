import type { ReactNode } from "react";

/** Dar ekranlarda yatay kayan tablo sarmalayıcısı. */
export function TabloSarmal({ children }: { children: ReactNode }) {
  return <div className="overflow-x-auto">{children}</div>;
}

export function Tablo({ children }: { children: ReactNode }) {
  return <table className="w-full text-sm border-collapse">{children}</table>;
}

export function Th({
  children,
  sagaYasli,
}: {
  children: ReactNode;
  sagaYasli?: boolean;
}) {
  return (
    <th
      className={`px-4 py-2.5 font-medium text-xs uppercase tracking-wide text-metin-silik border-b border-cizgi whitespace-nowrap ${
        sagaYasli ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  sagaYasli,
  className = "",
}: {
  children: ReactNode;
  sagaYasli?: boolean;
  className?: string;
}) {
  return (
    <td
      className={`px-4 py-3 border-b border-cizgi align-middle ${
        sagaYasli ? "text-right" : ""
      } ${className}`}
    >
      {children}
    </td>
  );
}

export function Tr({ children }: { children: ReactNode }) {
  return <tr className="hover:bg-yuzey-alt/60 transition-colors">{children}</tr>;
}
