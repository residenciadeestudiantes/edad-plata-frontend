"use client";

import { useState } from "react";
import { getContextoArchivo, type ContextoArchivoResponse } from "@/lib/api";

type Status = "idle" | "loading" | "success" | "error";

interface ContextoArchivoProps {
  tipo: "articulo";
  nombre: string;
}

export function ContextoArchivo({ tipo, nombre }: ContextoArchivoProps) {
  const [status, setStatus] = useState<Status>("idle");
  const [data, setData] = useState<ContextoArchivoResponse | null>(null);

  async function handleConsultar() {
    setStatus("loading");

    try {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      const res = await getContextoArchivo(tipo, nombre);
      setData(res);
      setStatus("success");
    } catch (error) {
      console.error("Error al consultar el archivo", error);
      setStatus("error");
    }
  }

  function handleCerrar() {
    setStatus("idle");
    setData(null);
  }

  return (
    <div className="flex flex-col gap-4 border-y border-zinc-200 py-6 dark:border-zinc-800">
      {status !== "success" && (
        <button
          type="button"
          onClick={handleConsultar}
          disabled={status === "loading"}
          className="inline-flex w-fit items-center gap-2 rounded-md border border-teja bg-white px-5 py-3 text-sm font-medium text-teja transition-colors hover:bg-teja/10 disabled:pointer-events-none disabled:opacity-60 dark:border-teja-claro dark:bg-transparent dark:text-teja-claro dark:hover:bg-teja-claro/10"
        >
          {status === "loading" ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Consultando archivo digital…
            </>
          ) : (
            <>
              <span aria-hidden="true">▣</span>
              Consultar fondos del archivo
            </>
          )}
        </button>
      )}

      {status === "error" && (
        <p className="text-sm text-red-600 dark:text-red-400">
          No se ha podido conectar con el archivo digital.
        </p>
      )}

      {status === "success" && data && (
        <div className="flex flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-5 animate-[fadeIn_0.3s_ease-out] dark:border-zinc-800 dark:bg-zinc-950">
          <div className="rounded-md border border-yellow-300 bg-yellow-50 px-3 py-2 text-xs text-yellow-800 dark:border-yellow-700 dark:bg-yellow-950 dark:text-yellow-200">
            Demostración — datos de ejemplo. En producción se consultará el
            archivo digital real.
          </div>

          <p className="font-light text-negro dark:text-blanco">
            {data.respuesta}
          </p>

          <hr className="border-zinc-200 dark:border-zinc-800" />

          <ul className="flex flex-col divide-y divide-zinc-200 dark:divide-zinc-800">
            {data.fondos.map((doc, i) => (
              <li key={i} className="flex flex-col gap-1 py-3">
                <p className="font-semibold text-teja dark:text-teja-claro">
                  {doc.fondo}
                </p>
                <p className="font-light text-zinc-700 dark:text-zinc-300">
                  {doc.descripcion}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {doc.signatura} · {doc.fecha}
                </p>
                <a
                  href={doc.url_atom}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-teja hover:underline dark:text-teja-claro"
                >
                  Ver en archivo digital →
                </a>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              Relevancia
            </span>
            <div className="h-1.5 flex-1 max-w-xs overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
              <div
                className="h-full rounded-full bg-verde"
                style={{ width: `${Math.round(data.confianza * 100)}%` }}
              />
            </div>
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              {Math.round(data.confianza * 100)}%
            </span>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleCerrar}
              className="rounded-md px-3 py-1.5 text-sm text-teja transition-colors hover:bg-teja/10 dark:text-teja-claro dark:hover:bg-teja-claro/10"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
