import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Koperasi Terang",
  description: "Platform Transparansi & Akuntabilitas Koperasi Desa",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="min-h-screen">
        <div className="max-w-5xl mx-auto px-4 py-6">{children}</div>
      </body>
    </html>
  );
}
