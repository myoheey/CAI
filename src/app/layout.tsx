import type { Metadata } from "next";
import type { ReactNode } from "react";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

import "./globals.css";

export const metadata: Metadata = {
  title: "Career Anchor Insight | 교육학 기반 커리어 앵커 진단",
  description:
    "Edgar Schein의 커리어 앵커 이론 기반 40문항 진단으로 당신의 커리어 중심축을 발견하세요. AI 맞춤 분석 리포트 제공.",
  keywords: "커리어 앵커, 직업 적성 검사, 커리어 진단, Edgar Schein, AI 리포트",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body>
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}
