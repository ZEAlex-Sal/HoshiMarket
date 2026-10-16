import type { Metadata } from "next";
import "./globals.css";
import { StoreProvider } from "@/context/store-context";

export const metadata: Metadata = {
  title: "Hoshi Market | Catálogo Coreano & K-Pop en Huánuco",
  description: "Catálogo oficial de Hoshi Market (Jr. Crespo Castillo 614, Huánuco). Ramens virales, paletas Melona, snacks asiáticos, bebidas, artículos K-Pop, mangas y promociones 2x1 y 3x2 con pedidos por WhatsApp.",
  keywords: ["Hoshi Market", "Huánuco", "Ramen coreano", "Melona", "K-pop", "Buldak", "Shin Ramyun", "Snacks coreanos"],
  icons: {
    icon: [
      { url: "/logo.png?v=3", type: "image/png" },
      { url: "/icon.png?v=3", type: "image/png" },
    ],
    shortcut: "/logo.png?v=3",
    apple: "/logo.png?v=3",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="h-full">
      <body className="min-h-full flex flex-col antialiased bg-[#FAF8F5] text-[#261C30]">
        <StoreProvider>
          {children}
        </StoreProvider>
      </body>
    </html>
  );
}
