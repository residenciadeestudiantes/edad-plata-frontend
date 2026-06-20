"use client";

import { Button } from "@/components/Button";

interface BotonDescargaCsvProps {
  onDescargar: () => void;
  etiqueta: string;
}

export function BotonDescargaCsv({ onDescargar, etiqueta }: BotonDescargaCsvProps) {
  return (
    <Button variant="secondary" onClick={onDescargar}>
      <span aria-hidden="true">↓</span>
      {etiqueta}
    </Button>
  );
}
