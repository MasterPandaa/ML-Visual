import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "MLVisual — Interactive Machine Learning Lab",
  description: "Platform edukatif modern untuk memahami model Machine Learning melalui visualisasi interaktif, animasi algoritma, dan playground interaktif. Belajar tanpa pusing.",
  keywords: "machine learning, visualisasi, interaktif, edukasi, AI, deep learning, decision tree",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="dark bg-black text-white" suppressHydrationWarning>
      <body className="bg-black text-white min-h-screen flex flex-col relative" suppressHydrationWarning>
        <div className="absolute inset-0 bg-gradient-animated pointer-events-none z-0" />
        <Navbar />
        <main className="flex-1 pt-16 relative z-10">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
