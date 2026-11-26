"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Panel" },
  { href: "/matriz/insumos", label: "Insumos" },
  { href: "/matriz/nomina", label: "Nómina" },
  { href: "/costos-personal", label: "Costos de personal" },
  { href: "/recursos", label: "Recursos" },
  { href: "/parametros", label: "Parámetros" },
];

export function SiteNav() {
  const pathname = usePathname();

  return (
    <header className="w-full border-b border-sage/50 bg-gradient-to-r from-forest via-leaf to-forest shadow-lg shadow-forest/15">
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-x-8 gap-y-3 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="group flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cream text-forest shadow-lg shadow-black/10">
            <LeafMark />
          </span>
          <span className="leading-tight">
            <span className="block font-display text-xl font-bold tracking-[0.28em] text-cream">
              RENOVA
            </span>
            <span className="block text-[0.66rem] font-semibold uppercase tracking-[0.22em] text-cream/70">
              Simulador de negocio
            </span>
          </span>
        </Link>

        <nav className="flex flex-1 flex-wrap items-center gap-1.5">
          {LINKS.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  active
                    ? "bg-cream text-forest shadow-md shadow-black/10"
                    : "text-cream/80 hover:bg-cream/15 hover:text-cream"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

function LeafMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden>
      <path
        d="M20 3C20 3 8.5 2.5 5 6.5 2 9.7 3 16 7 18c3.4 1.7 7.5 1 9.5-1.5 3.4-4.2 3.5-13.5 3.5-13.5Z"
        fill="currentColor"
        opacity="0.95"
      />
      <path
        d="M4 21c2.5-5.5 6.5-9.5 12-12"
        stroke="#145B45"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
