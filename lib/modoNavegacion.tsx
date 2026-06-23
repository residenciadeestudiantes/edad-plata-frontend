"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type ModoNavegacion = "lectura" | "investigacion";

const STORAGE_KEY = "edad-plata-modo-navegacion";

const ModoNavegacionContext = createContext<{
  modo: ModoNavegacion;
  setModo: (modo: ModoNavegacion) => void;
  // Se incrementa cada vez que se activa el modo investigación (transición
  // real desde lectura, no la restauración inicial desde localStorage), para
  // que AvisoModoInvestigacion pueda mostrar su aviso sin recibir un booleano
  // que no cambiaría si el modo ya estaba activo.
  avisoActivacion: number;
} | null>(null);

export function ModoNavegacionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [modo, setModoState] = useState<ModoNavegacion>("lectura");
  const [avisoActivacion, setAvisoActivacion] = useState(0);

  useEffect(() => {
    const guardado = window.localStorage.getItem(STORAGE_KEY);

    Promise.resolve().then(() => {
      if (guardado === "investigacion" || guardado === "lectura") {
        setModoState(guardado);
      }
    });
  }, []);

  function setModo(siguiente: ModoNavegacion) {
    // Se compara contra localStorage (síncrono) y no contra `modo`: AnalisisGate
    // activa el modo investigación en un efecto de montaje que puede ejecutarse
    // antes de que el efecto de restauración de arriba haya actualizado `modo`,
    // lo que haría saltar el aviso en cada recarga aunque ya estuviera activo.
    if (siguiente === "investigacion" && window.localStorage.getItem(STORAGE_KEY) !== "investigacion") {
      setAvisoActivacion((n) => n + 1);
    }
    setModoState(siguiente);
    window.localStorage.setItem(STORAGE_KEY, siguiente);
  }

  return (
    <ModoNavegacionContext.Provider value={{ modo, setModo, avisoActivacion }}>
      {children}
    </ModoNavegacionContext.Provider>
  );
}

export function useModoNavegacion() {
  const context = useContext(ModoNavegacionContext);
  if (!context) {
    throw new Error(
      "useModoNavegacion debe usarse dentro de ModoNavegacionProvider"
    );
  }
  return context;
}
