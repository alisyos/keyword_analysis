import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/layout/header";

export const metadata: Metadata = {
  title: "네이버 키워드 분석 도구",
  description: "네이버 Search Ad API를 활용한 키워드 분석 도구",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">
        <Header />
        <main>
          {children}
        </main>
      </body>
    </html>
  );
}