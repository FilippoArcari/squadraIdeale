import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Provider from "./Provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Squadra Ideale",
  description: "Manage your sports tournaments",
  verification: {
    google: 'google0d4c40275ccf6ef2', // Inserisci solo il codice qui
  },
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <title>Squadra Ideale - Crea la tua formazione perfetta</title>
        <meta name="description" content="Squadra Ideale è il tool definitivo per gestire e creare la tua formazione calcistica." />
        <meta name="keywords" content="squadra ideale, calcio, formazione, fantasy football" />
        <meta name="google-site-verification" content="DSrPfCD1XAl4LE1sevq1T1mLkNm1uDRIBDJTQdSb_Gg" />
      </head>
      <body className={inter.className}>
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}
