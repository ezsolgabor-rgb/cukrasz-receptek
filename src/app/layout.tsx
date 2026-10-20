import type { Metadata } from "next";
import { EB_Garamond, Inter } from "next/font/google";
import { Navbar } from "../components/navbar";

import "./globals.css";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
  display: "swap",
});

const garamond = EB_Garamond({
  subsets: ["latin", "latin-ext"],
  variable: "--font-garamond",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Gábor receptkönyve",
  description:
    "Saját receptek egy helyen: hozzávalók, adagszámítás, lépések és fotók.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="hu" className={`${inter.variable} ${garamond.variable}`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body className="min-h-dvh">
        <div className="mx-auto max-w-[100vw] overflow-x-hidden">
          <Navbar />
          <main className="pt-4">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}