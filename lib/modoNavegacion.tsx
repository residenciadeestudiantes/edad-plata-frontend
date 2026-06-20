"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type ModoNavegacion = "lectura" | "investigacion";

const STORAGE_KEY = "edad-plata-modo-navegacion";

const ModoNavegacionContext = createContext<{
  modo: ModoNavegacion;
  setModo: (modo: ModoNavegacion) => void;
} | null>(null);

export function ModoNavegacionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [modo, setModoState] = useState<ModoNavegacion>("lectura");

  useEffect(() => {
    const guardado = window.localStorage.getItem(STORAGE_KEY);

    Promise.resolve().then(() => {
      if (guardado === "investigacion" || guardado === "lectura") {
        setModoState(guardado);
      }
    });
  }, []);

  function setModo(siguiente: ModoNavegacion) {
    setModoState(siguiente);
    window.localStorage.setItem(STORAGE_KEY, siguiente);
  }

  return (
    <ModoNavegacionContext.Provider value={{ modo, setModo }}>
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
