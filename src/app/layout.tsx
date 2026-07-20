import type { Metadata } from "next";
import "./globals.css";
import { ConnectionStatusBadge } from "@/components/ConnectionStatusBadge";

export const metadata: Metadata = {
  title: "İSG Arena 2026",
  description: "PIN ile katılımlı İSG yarışması ve forklift güvenli sürüş finali",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr">
      <body>
        <ConnectionStatusBadge />
        {children}
      </body>
    </html>
  );
}
