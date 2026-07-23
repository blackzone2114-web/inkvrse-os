import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Architect OS | LiNK",
  description: "Architect OS command interface powered by LiNK.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
