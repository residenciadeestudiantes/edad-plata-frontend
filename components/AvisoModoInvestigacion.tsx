"use client";

import { useEffect, useRef, useState } from "react";
import { useModoNavegacion } from "@/lib/modoNavegacion";

const DURACION_VISIBLE_MS = 3000;
const DURACION_TRANSICION_MS = 300;

type Estado = "oculto" | "entrando" | "saliendo";

// Aviso flotante (tipo toast) que aparece con fade-in al activar el modo
// investigación y se retira solo con fade-out a los 3 segundos.
// avisoActivacion solo cambia en una activación real (no al restaurar el
// modo guardado en localStorage al cargar la página), así que cada cambio
// dispara una nueva aparición del aviso.
export function AvisoModoInvestigacion() {
  const { avisoActivacion } = useModoNavegacion();
  const [estado, setEstado] = useState<Estado>("oculto");
  const procesadoRef = useRef(avisoActivacion);

  useEffect(() => {
    if (avisoActivacion === procesadoRef.current) return;
    procesadoRef.current = avisoActivacion;

    setEstado("entrando");
    const idSalida = setTimeout(() => setEstado("saliendo"), DURACION_VISIBLE_MS);
    const idOculto = setTimeout(
      () => setEstado("oculto"),
      DURACION_VISIBLE_MS + DURACION_TRANSICION_MS
    );

    return () => {
      clearTimeout(idSalida);
      clearTimeout(idOculto);
    };
  }, [avisoActivacion]);

  if (estado === "oculto") return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-20 left-1/2 z-50 w-[calc(100%-3rem)] max-w-md -translate-x-1/2 sm:top-24"
    >
      <div
        className={`rounded-lg bg-azul px-5 py-3 text-center text-sm font-medium text-white shadow-lg dark:bg-azul-claro dark:text-negro ${
          estado === "entrando"
            ? "animate-[fadeIn_0.3s_ease-out]"
            : "animate-[fadeOut_0.3s_ease-in_forwards]"
        }`}
      >
        Has activado el modo investigación. Las herramientas de investigación
        aparecerán en color azul.
      </div>
    </div>
  );
}
