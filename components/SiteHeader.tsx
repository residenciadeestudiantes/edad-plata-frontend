"use client";

import { HeaderLogo } from "@/components/HeaderLogo";
import { MainNav } from "@/components/MainNav";
import { MobileNav } from "@/components/MobileNav";
import { ModoNavegacionSwitch } from "@/components/ModoNavegacionSwitch";
import { useModoNavegacion } from "@/lib/modoNavegacion";

// Cabecera completa: el borde inferior cambia a azul (marca del modo
// investigación) mientras ese modo está activo, igual que MainNav y HeaderLogo.
export function SiteHeader({
  links,
}: {
  links: { href: string; label: string }[];
}) {
  const { modo } = useModoNavegacion();
  const activo = modo === "investigacion";

  return (
    <header
      className={`sticky top-0 z-50 border-b bg-blanco transition-colors ${
        activo ? "border-azul" : "border-teja"
      }`}
    >
      <div className="flex items-center justify-between px-10 py-5 sm:px-20">
        <HeaderLogo />
        <MainNav links={links} />
        <div className="flex items-center gap-4">
          <ModoNavegacionSwitch />
          <MobileNav links={links} />
        </div>
      </div>
    </header>
  );
}
