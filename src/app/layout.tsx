import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Visualiser - Premium Animation Tool | PixelUp Labs",
  description: "Create stunning visual animations with ASCII art, shaders, tunnels, waves, and isometric patterns. Export as WebM or GIF. Built by PixelUp Labs.",
  keywords: ["animation", "visualizer", "ASCII art", "shader", "generative art", "motion graphics", "PixelUp Labs"],
  authors: [{ name: "PixelUp Labs", url: "https://pixeluplabs.com" }],
  creator: "PixelUp Labs",
  publisher: "PixelUp Labs",
  metadataBase: new URL("https://visualiser.pixeluplabs.com"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://visualiser.pixeluplabs.com",
    siteName: "Visualiser by PixelUp Labs",
    title: "Visualiser - Premium Animation Tool | PixelUp Labs",
    description: "Create stunning visual animations with ASCII art, shaders, tunnels, waves, and isometric patterns. Export as WebM or GIF.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Visualiser by PixelUp Labs",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Visualiser - Premium Animation Tool | PixelUp Labs",
    description: "Create stunning visual animations with ASCII art, shaders, tunnels, waves, and isometric patterns.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", type: "image/png" },
    ],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
