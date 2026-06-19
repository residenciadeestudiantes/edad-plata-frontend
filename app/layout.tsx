import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-white text-zinc-900 dark:bg-black dark:text-zinc-50">
        <header className="border-b border-zinc-200 dark:border-zinc-800">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 sm:px-12">
            <Link href="/" className="text-lg font-bold tracking-tight">
              Edad de Plata
            </Link>
            <nav className="flex gap-6 text-sm font-medium">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="transition-colors hover:text-zinc-500 dark:hover:text-zinc-400"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>

        <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col">
          {children}
        </main>

        <footer className="border-t border-zinc-200 dark:border-zinc-800">
          <div className="mx-auto max-w-6xl px-6 py-8 text-sm text-zinc-500 sm:px-12 dark:text-zinc-400">
            <p className="font-semibold text-zinc-700 dark:text-zinc-300">
              Hemeroteca Digital de la Edad de Plata
            </p>
            <p className="mt-1 max-w-2xl">
              Proyecto de digitalización y catalogación de revistas culturales
              españolas del primer tercio del siglo XX, dedicado a la
              preservación y difusión del patrimonio hemerográfico de la
              Edad de Plata.
            </p>
            <p className="mt-4">
              © {new Date().getFullYear()} Hemeroteca Digital de la Edad de
              Plata. Todos los derechos reservados.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
