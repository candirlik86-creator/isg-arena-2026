import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "İSG Arena 2026",
  description: "Kahoot benzeri İSG bilgi yarışması frontend prototipi",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
