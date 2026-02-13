import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MyWash - Car Wash Audit Platform",
  description:
    "Simple, fast car wash quality audits with photo capture and reporting",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
