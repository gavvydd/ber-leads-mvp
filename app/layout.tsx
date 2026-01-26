import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "BER Leads MVP",
  description: "Get BER quotes fast, simple, and competitive.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
