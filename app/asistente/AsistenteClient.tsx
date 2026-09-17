"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/Button";
import {
  preguntarAsistente,
  type FuenteAsistente,
  type MensajeChat,
} from "@/lib/api";

interface MensajeUI extends MensajeChat {
  fuentes?: FuenteAsistente[];
}

const MAX_HISTORIAL = 6;

const TIPO_LABEL: Record<FuenteAsistente["tipo"], string> = {
  articulo: "Artículo",
  autor: "Autor",
  entidad: "Entidad",
  diccionario: "Diccionario de vanguardias",
};

export function AsistenteClient() {
  const [mensajes, setMensajes] = useState<MensajeUI[]>([]);
  const [input, setInput] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const finRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [mensajes, enviando]);

  async function handleEnviar(e: React.FormEvent) {
    e.preventDefault();
    const pregunta = input.trim();
    if (!pregunta || enviando) return;

    const historial = mensajes
      .slice(-MAX_HISTORIAL)
      .map(({ rol, contenido }) => ({ rol, contenido }));

    setMensajes((prev) => [...prev, { rol: "usuario", contenido: pregunta }]);
    setInput("");
    setEnviando(true);
    setError(null);

    try {
      const res = await preguntarAsistente(pregunta, historial);
      setMensajes((prev) => [
        ...prev,
        { rol: "asistente", contenido: res.respuesta, fuentes: res.fuentes },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se ha podido obtener respuesta.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <p className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-light leading-relaxed text-amber-800 dark:border-amber-700/50 dark:bg-amber-950/40 dark:text-amber-300">
        <strong className="font-medium">Aviso.</strong>{" "}
        Las respuestas se generan con un modelo de inteligencia artificial
        generativa a partir de lo que encuentra en el corpus. Su finalidad es
        exclusivamente orientativa y no constituye una fuente académica. Puede
        contener errores o imprecisiones — verifica cualquier dato relevante
        con las fuentes citadas.
      </p>

      <div className="flex min-h-[24rem] flex-1 flex-col gap-4 overflow-y-auto rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
        {mensajes.length === 0 && (
          <p className="m-auto max-w-sm text-center text-sm font-light text-zinc-500">
            Pregunta, por ejemplo, «¿Quién fue Federico García Lorca?» o
            «¿Qué revistas publicaron sobre el cubismo?».
          </p>
        )}

        {mensajes.map((m, i) => (
          <div
            key={i}
            className={`flex max-w-[85%] flex-col gap-2 ${
              m.rol === "usuario" ? "self-end items-end" : "self-start items-start"
            }`}
          >
            <div
              className={`rounded-lg px-4 py-2.5 text-sm leading-relaxed ${
                m.rol === "usuario"
                  ? "bg-teja text-white dark:bg-teja-claro dark:text-negro"
                  : "bg-zinc-100 text-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
              }`}
            >
              {m.contenido}
            </div>

            {m.fuentes && m.fuentes.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {m.fuentes.map((f) => {
                  const chip = (
                    <span className="rounded-full border border-teja/30 px-2.5 py-1 text-[0.7rem] font-light text-teja dark:border-teja-claro/30 dark:text-teja-claro">
                      [{f.id}] {TIPO_LABEL[f.tipo]} · {f.titulo}
                    </span>
                  );
                  return f.link ? (
                    <Link key={f.id} href={f.link} className="hover:opacity-80">
                      {chip}
                    </Link>
                  ) : (
                    <span key={f.id}>{chip}</span>
                  );
                })}
              </div>
            )}
          </div>
        ))}

        {enviando && (
          <div className="flex items-center gap-2 self-start text-sm font-light text-zinc-500">
            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
              <div className="h-full w-1/2 animate-pulse rounded-full bg-teja dark:bg-teja-claro" />
            </div>
            <span>Pensando…</span>
          </div>
        )}

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        <div ref={finRef} />
      </div>

      <form onSubmit={handleEnviar} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe tu pregunta…"
          disabled={enviando}
          className="flex-1 rounded-md border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-teja focus:outline-none disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-teja-claro"
        />
        <Button type="submit" showArrow={false} disabled={enviando || !input.trim()}>
          Enviar
        </Button>
      </form>
    </div>
  );
}
