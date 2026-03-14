import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/src/components/Navbar";
import Providers from "@/src/components/Providers"; // Import the new wrapper

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "JerseyShop | Premium Football Kits",
  description: "Modern jersey e-commerce website for authentic football fans",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body 
        className="bg-slate-50 text-slate-900 antialiased min-h-screen flex flex-col" 
        suppressHydrationWarning={true}
      >
        <Providers>
          <Navbar />
          {/* Added flex-grow so footer (if any) stays at bottom */}
          <main className="flex-grow">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
