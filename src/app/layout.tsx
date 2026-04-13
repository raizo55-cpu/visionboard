import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "VisionFlow | 直感から習慣へ",
  description: "デジタル時代のビジョンボードアプリ。あなたの目標を視覚化し、毎日の習慣に繋げます。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={`${inter.variable} h-full antialiased dark`}>
      <body className="min-h-full flex flex-col bg-background text-foreground bg-zinc-950 text-slate-100 selection:bg-zinc-700 font-sans">
        {children}
      </body>
    </html>
  );
}
