import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Next Starter Admin",
  description: "Production-oriented Next.js admin starter kit"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
