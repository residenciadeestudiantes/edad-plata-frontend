"use client";

import { useState } from "react";
import { SoloModoInvestigacion } from "@/components/SoloModoInvestigacion";

const CHAT_SRC =
  "https://eu-west-1.quicksight.aws.amazon.com/sn/account/residenciadeestudiantes/embed/share/accounts/445026229679/chatagents/f56ca75e-b1a2-4f5e-be76-3dd733273094";

// Asistente de IA (Amazon QuickSight Q) flotante, exclusivo del modo
// investigación: un botón fijo abajo a la derecha que despliega el chat
// embebido en un panel, sin ocupar espacio en el resto de la página.
export function ChatInvestigacion() {
  const [abierto, setAbierto] = useState(false);

  return (
    <SoloModoInvestigacion>
      {abierto ? (
        <div className="fixed bottom-6 right-6 z-50 flex h-[min(800px,calc(100vh-6rem))] w-[min(450px,calc(100vw-2rem))] flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800">
          <div className="flex items-center justify-between bg-azul px-4 py-3 dark:bg-azul-claro">
            <span className="font-titulo text-sm font-bold text-white dark:text-negro">
              Asistente de investigación
            </span>
            <button
              type="button"
              onClick={() => setAbierto(false)}
              aria-label="Cerrar chat"
              className="text-xl leading-none text-white transition-opacity hover:opacity-75 dark:text-negro"
            >
              ×
            </button>
          </div>
          <iframe
            title="Asistente de investigación"
            src={CHAT_SRC}
            allow="clipboard-read https://eu-west-1.quicksight.aws.amazon.com; clipboard-write https://eu-west-1.quicksight.aws.amazon.com"
            className="w-full flex-1 border-0"
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAbierto(true)}
          aria-label="Abrir el asistente de investigación"
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-azul text-white shadow-lg transition-transform hover:scale-105 dark:bg-azul-claro dark:text-negro"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="h-6 w-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z"
            />
          </svg>
        </button>
      )}
    </SoloModoInvestigacion>
  );
}
