import { Suspense } from "react";
import "./globals.css";
import Providers from "@/src/components/Providers";
import Navbar from "@/src/components/Navbar"; // ✅ Ensure this is imported
import packageJson from "@/package.json";

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
          <footer className="border-t border-slate-200 bg-white px-4 py-4 text-center text-xs text-slate-500">
            JerseyShop · v{packageJson.version}
          </footer>
        </Providers>
      </body>
    </html>
  );
}
