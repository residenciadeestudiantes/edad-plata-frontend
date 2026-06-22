"use client";

import { Button, type ButtonProps } from "@/components/Button";

interface BotonDescargaCsvProps {
  onDescargar: () => void;
  etiqueta: string;
  variant?: Extract<ButtonProps["variant"], "secondary" | "secondary-azul">;
}

export function BotonDescargaCsv({
  onDescargar,
  etiqueta,
  variant = "secondary",
}: BotonDescargaCsvProps) {
  return (
    <Button variant={variant} onClick={onDescargar}>
      <span aria-hidden="true">↓</span>
      {etiqueta}
    </Button>
  );
}
