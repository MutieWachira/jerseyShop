import { Suspense } from "react";
import "./globals.css";
import Providers from "@/src/components/Providers";
import Navbar from "@/src/components/Navbar"; // ✅ Ensure this is imported

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      {/* ✅ Add suppressHydrationWarning={true} to the body tag */}
      <body 
        className="antialiased bg-slate-50" 
        suppressHydrationWarning={true}
      >
        <Providers>
          <Suspense fallback={null}>
            <Navbar />
          </Suspense>
          <main className="flex-grow">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}

