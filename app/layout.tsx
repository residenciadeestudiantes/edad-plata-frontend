import type { Metadata } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import Image from "next/image";
import Link from "next/link";
import { MobileNav } from "@/components/MobileNav";
import "./globals.css";

// Auguste Sans Bold, tipografía oficial de títulos de la Residencia de
// Estudiantes.
const augusteSans = localFont({
  src: "../public/fonts/auguste-sans-bold-pro.woff2",
  variable: "--font-titulo-src",
  weight: "700",
  style: "normal",
  display: "swap",
});

const inter = Inter({
  variable: "--font-cuerpo-google",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
});

export const metadata: Metadata = {
  title: "Edad de Plata | Hemeroteca digital",
  description:
    "Hemeroteca digital de revistas culturales de la Edad de Plata española.",
};

const navLinks = [
  { href: "/revistas", label: "Revistas" },
  { href: "/autores", label: "Autores" },
  { href: "/buscar", label: "Buscador" },
  { href: "/analisis", label: "Análisis" },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${augusteSans.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-gris-claro text-negro dark:bg-negro dark:text-blanco">
        <header className="relative border-b border-teja bg-blanco">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 sm:px-12">
            <Link href="/" className="flex items-center">
              <Image
                src="/images/logo-residencia.png"
                alt="Residencia de Estudiantes"
                width={180}
                height={51}
                className="h-12 w-auto"
                priority
              />
            </Link>
            <nav className="hidden gap-6 font-titulo text-lg font-bold text-teja sm:flex">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="transition-opacity hover:opacity-75"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <MobileNav links={navLinks} />
          </div>
        </header>

        <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col">
          {children}
        </main>

        <footer className="bg-negro text-white">
          <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8 text-sm sm:flex-row sm:items-start sm:justify-between sm:px-12">
            <div>
              <p className="font-titulo font-semibold text-white">
                Hemeroteca Digital de la Edad de Plata
              </p>
              <p className="mt-2 max-w-2xl font-light text-zinc-300">
                Proyecto de digitalización y catalogación de revistas
                culturales españolas del primer tercio del siglo XX, dedicado
                a la preservación y difusión del patrimonio hemerográfico de
                la Edad de Plata.
              </p>
              <p className="mt-4 font-light text-zinc-400">
                Residencia de Estudiantes ·{" "}
                <a
                  href="https://residenciadeestudiantes.com"
                  className="hover:text-teja-claro"
                >
                  residenciadeestudiantes.com
                </a>
              </p>
              <p className="mt-2 font-light text-zinc-400">
                © {new Date().getFullYear()} Residencia de Estudiantes
              </p>
            </div>

            <nav
              aria-label="Sobre el proyecto"
              className="flex flex-col gap-2 text-zinc-300 sm:items-end"
            >
              <Link href="/que-es-la-edad-de-plata" className="hover:text-teja-claro">
                Qué es la Edad de Plata
              </Link>
              <Link href="/proyecto-edad-de-plata" className="hover:text-teja-claro">
                Proyecto Edad de Plata
              </Link>
            </nav>

            <nav
              aria-label="Enlaces legales"
              className="flex flex-col gap-2 text-zinc-300 sm:items-end"
            >
              <a href="#" className="hover:text-teja-claro">
                Aviso legal
              </a>
              <a href="#" className="hover:text-teja-claro">
                Política de privacidad
              </a>
              <a href="#" className="hover:text-teja-claro">
                Accesibilidad
              </a>
            </nav>
          </div>
        </footer>
      </body>
    </html>
  );
}
