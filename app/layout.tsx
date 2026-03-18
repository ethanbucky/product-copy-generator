import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Product Copy Generator",
  description: "Generate SEO titles, descriptions, bullet points, and keywords with AI",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
