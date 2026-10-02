import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Nav, Footer } from "@/components/Nav";

export const metadata: Metadata = {
  title: "HF Guideline Navigator — 2026 ESC Heart Failure Guidelines",
  description: "Searchable recommendations, drug information and full-text explorer for the 2026 ESC Guidelines for the management of heart failure.",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Nav />
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
