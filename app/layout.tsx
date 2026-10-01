import "./globals.css";
import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "FlashResizer – Resize Photos & Signatures for Indian Applications",
  description:
    "Resize and compress photos and signatures for Kerala PSC, PAN Card, Passport and Kerala MVD requirements. Free, fast and processed entirely in your browser.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
