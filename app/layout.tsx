import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globais/globals.css";
import SessionProvider from "./provedores/SessionProvider";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "FluxoCerto · Suas Finanças em Ordem",
    template: "%s · FluxoCerto",
  },
  description: "A plataforma definitiva para controle de finanças, gestão de estoque atacarejo e planejamento de dívidas com inteligência neural.",
  keywords: ["finanças", "controle financeiro", "gestão de estoque", "atacarejo", "planejamento financeiro", "mestre dino"],
  authors: [{ name: "FluxoCerto Team" }],
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: "/favicon.svg",
  },
  openGraph: {
    title: "FluxoCerto · Suas Finanças em Ordem",
    description: "A plataforma definitiva para controle de finanças e gestão de estoque.",
    url: "https://fluxocerto.com",
    siteName: "FluxoCerto",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "FluxoCerto Dashboard",
      },
    ],
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FluxoCerto · Suas Finanças em Ordem",
    description: "Controle financeiro inteligente com visão total do seu dinheiro.",
    images: ["/og-image.png"],
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "FluxoCerto",
  },
};

export const viewport: Viewport = {
  themeColor: "#047857",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className}>
        <SessionProvider>{children}</SessionProvider>
        <Script id="sw-register" strategy="afterInteractive">{`
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
              navigator.serviceWorker.register('/sw.js').catch(function(err) {
                console.log('SW registration failed:', err);
              });
            });
          }
        `}</Script>
      </body>
    </html>
  );
}
