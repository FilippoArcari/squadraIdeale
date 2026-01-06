import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Provider from "./Provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Squadra Ideale - Organizza Tornei Sportivi e Crea Formazioni Perfette",
    template: "%s | Squadra Ideale"
  },
  description: "Squadra Ideale è la piattaforma definitiva per organizzare tornei di calcio, basket e volley. Bilancia squadre automaticamente, traccia statistiche e gestisci i tuoi tornei con facilità. Gratis e facile da usare.",
  keywords: [
    "squadra ideale",
    "tornei calcio",
    "organizzare torneo",
    "bilanciamento squadre",
    "formazione calcio",
    "fantasy football",
    "statistiche calcio",
    "gestione tornei",
    "tornei sportivi",
    "calcio amatoriale",
    "tornei amici",
    "app tornei calcio",
    "squadre equilibrate"
  ],
  authors: [{ name: "Squadra Ideale" }],
  creator: "Squadra Ideale",
  publisher: "Squadra Ideale",
  metadataBase: new URL("https://squadra-ideale.vercel.app"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Squadra Ideale - Organizza Tornei e Crea Formazioni Perfette",
    description: "Organizza tornei sportivi, bilancia squadre automaticamente e traccia statistiche. La piattaforma completa per gestire i tuoi tornei.",
    url: "https://squadra-ideale.vercel.app",
    siteName: "Squadra Ideale",
    locale: "it_IT",
    type: "website",
    images: [
      {
        url: "/calcio_vert.jpeg",
        width: 1200,
        height: 630,
        alt: "Squadra Ideale - Gestione Tornei Sportivi",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Squadra Ideale - Organizza Tornei Sportivi",
    description: "Organizza tornei, bilancia squadre e traccia statistiche facilmente",
    images: ["/calcio_vert.jpeg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: 'DSrPfCD1XAl4LE1sevq1T1mLkNm1uDRIBDJTQdSb_Gg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it">
      <body className={inter.className}>
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}
