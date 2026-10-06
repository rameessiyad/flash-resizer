import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://flashresizer.in"),
  title: {
    default:
      "FlashResizer – Resize Photos & Signatures for Indian Applications",
    template: "%s | FlashResizer",
  },
  description:
    "Resize and compress photos and signatures for Kerala PSC, PAN Card, Passport and Kerala MVD requirements. Free, fast and processed entirely in your browser.",
  openGraph: {
    type: "website",
    siteName: "FlashResizer",
    locale: "en_IN",
    title: "FlashResizer – Resize Photos & Signatures for Indian Applications",
    description:
      "Exact size and KB for Kerala PSC, PAN, Passport and MVD. No upload, no signup.",
  },
  twitter: { card: "summary_large_image" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "FlashResizer",
  url: "https://flashresizer.in",
  applicationCategory: "MultimediaApplication",
  operatingSystem: "Any (web browser)",
  offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}
