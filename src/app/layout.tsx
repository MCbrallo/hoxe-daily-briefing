import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HOXE | Today, with context",
  description: "A beautifully curated daily briefing connecting history, music, science, people, and observances to the date you are living right now.",
};

import { Navbar } from "@/components/layout/Navbar";
import { LanguageProvider } from "@/context/LanguageContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${playfair.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="font-sans antialiased text-granite-grey bg-mist-white min-h-screen flex flex-col bg-fixed" suppressHydrationWarning>
        <LanguageProvider>
          <Navbar />
          <main className="w-full flex-1 flex flex-col">
            {children}
          </main>
        </LanguageProvider>
      </body>
    </html>
  );
}
