"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Panel" },
  { href: "/matriz/insumos", label: "Insumos" },
  { href: "/matriz/nomina", label: "Nómina" },
  { href: "/recursos", label: "Recursos" },
  { href: "/parametros", label: "Parámetros" },
];

export function SiteNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 -mx-4 mt-0 border-b border-sage/40 bg-ivory/85 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <Link href="/" className="group flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-forest text-cream shadow-lg shadow-forest/25">
            <LeafMark />
          </span>
          <span className="leading-tight">
            <span className="block font-display text-xl font-bold tracking-[0.24em] text-forest">
              RENOVA
            </span>
            <span className="block text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-forest/60">
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
                    ? "bg-forest text-cream shadow-md shadow-forest/20"
                    : "text-forest/70 hover:bg-sage/30 hover:text-forest"
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
