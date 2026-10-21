import type { Metadata } from "next";
import "./globals.css";
import { SiteNav } from "@/components/site-nav";
import { RenovaProvider } from "@/components/renova-provider";

export const metadata: Metadata = {
  title: "RENOVA · Simulador de costos y sostenibilidad",
  description:
    "Simulador financiero del detergente en polvo RENOVA: volumen mensual, costos de insumos, nómina, punto de equilibrio, margen y sostenibilidad.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className="min-h-screen antialiased">
        <div className="flex min-h-screen w-full flex-col">
          <SiteNav />
          <div className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col px-4 pb-16 sm:px-6 lg:px-8">
            <main className="flex-1 pt-6">
              <RenovaProvider>{children}</RenovaProvider>
            </main>
            <footer className="mt-14 border-t border-sage/40 pt-6 text-xs text-forest/60">
              <p>
                RENOVA · Simulador financiero interno
              </p>
            </footer>
          </div>
        </div>
      </body>
    </html>
  );
}
