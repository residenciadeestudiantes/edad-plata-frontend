"use client";

import { useState } from "react";
import { Button } from "@/components/Button";
import {
  getPublicidadCadenasLexicas,
  type ProbabilidadToken,
  type PublicidadCadenasLexicasResponse,
} from "@/lib/api";

type Status = "idle" | "loading" | "error" | "success";

// Mismas 4 zonas que interpretarEntropia() en el backend (sin "insuficiente",
// que es un aviso de fiabilidad independiente del color).
function colorYEtiquetaEntropia(normalizada: number): { color: string; etiqueta: string } {
  if (normalizada < 0.3) return { color: "#3838BD", etiqueta: "Convencional" };
  if (normalizada < 0.5) return { color: "#008867", etiqueta: "Moderado" };
  if (normalizada < 0.7) return { color: "#FF7D45", etiqueta: "Variado" };
  return { color: "#DA3C00", etiqueta: "Innovador" };
}

function BarraProbabilidad({ token, color }: { token: ProbabilidadToken; color: string }) {
  return (
    <li className="flex items-center gap-3">
      <span className="w-28 flex-shrink-0 truncate text-sm font-medium" title={token.token}>
        {token.token}
      </span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
        <div
          className="h-full rounded-full"
          style={{ width: `${token.probabilidad * 100}%`, backgroundColor: color }}
        />
      </div>
      <span className="w-12 flex-shrink-0 text-right text-sm font-light text-zinc-500 dark:text-zinc-400">
        {Math.round(token.probabilidad * 100)}%
      </span>
    </li>
  );
}

export function LenguajeTab() {
  const [palabra, setPalabra] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [data, setData] = useState<PublicidadCadenasLexicasResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [avisoPalabraCorta, setAvisoPalabraCorta] = useState(false);

  async function handleAnalizar() {
    const trimmed = palabra.trim();
    if (trimmed.length < 2) {
      setAvisoPalabraCorta(true);
      return;
    }
    setAvisoPalabraCorta(false);
    setStatus("loading");
    setErrorMessage(null);

    try {
      const res = await getPublicidadCadenasLexicas(trimmed);
      setData(res);
      setStatus("success");
    } catch (error) {
      console.error("Error al calcular el lenguaje publicitario", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No se ha podido completar el análisis. Inténtalo de nuevo más tarde."
      );
      setStatus("error");
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="border-l-4 border-teja pl-4">
        <p className="max-w-3xl font-light text-zinc-600 dark:text-zinc-400">
          Qué palabras acompañan a un término concreto dentro del corpus de
          anuncios: el adjetivo o reclamo con el que se suele presentar (p.
          ej. «nueva», «moderno», «el mejor»). La entropía mide la variedad
          de combinaciones: un valor alto indica un repertorio de promesas
          publicitarias más variado para esa palabra.
        </p>
      </div>

      <div className="flex flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-negro">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex flex-1 flex-col gap-1.5">
            <label htmlFor="palabra-publicidad" className="text-sm font-medium">
              Palabra a analizar
            </label>
            <input
              id="palabra-publicidad"
              type="text"
              value={palabra}
              onChange={(event) => {
                setPalabra(event.target.value);
                if (avisoPalabraCorta) setAvisoPalabraCorta(false);
              }}
              placeholder="Ej: casa, automóvil, nuevo…"
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
            {avisoPalabraCorta && (
              <p className="text-sm text-red-600 dark:text-red-400">
                Introduce al menos 2 caracteres.
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="azul" onClick={handleAnalizar} disabled={status === "loading"}>
              Analizar
            </Button>
            {(status === "success" || status === "error") && (
              <Button
                variant="secondary"
                onClick={() => { setData(null); setStatus("idle"); setErrorMessage(null); setPalabra(""); }}
              >
                Limpiar
              </Button>
            )}
          </div>
        </div>
      </div>

      {status === "error" && errorMessage && (
        <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
      )}

      {status === "success" && data && (
        <>
          {data.corpus.frecuenciaTotal === 0 ? (
            <p className="text-sm font-light text-zinc-500">
              No se han encontrado ocurrencias de «{data.palabra}» en los
              anuncios disponibles.
            </p>
          ) : (
            <>
            {/* Desglose por revista */}
            {data.por_revista.length > 0 && (
              <section className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-5 dark:border-zinc-800">
                <h3 className="font-medium">
                  «{data.palabra}» aparece{" "}
                  <span className="text-teja dark:text-teja-claro font-semibold">
                    {data.corpus.frecuenciaTotal} vece{data.corpus.frecuenciaTotal === 1 ? "z" : "s"}
                  </span>{" "}
                  en el corpus publicitario
                </h3>
                <ul className="flex flex-col gap-2">
                  {data.por_revista.map((r) => (
                    <li key={r.slug} className="flex items-center gap-3">
                      <span className="w-44 flex-shrink-0 truncate text-sm font-medium" title={r.revista}>
                        {r.revista}
                      </span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                        <div
                          className="h-full rounded-full bg-teja dark:bg-teja-claro"
                          style={{ width: `${(r.frecuencia / data.corpus.frecuenciaTotal) * 100}%` }}
                        />
                      </div>
                      <span className="w-8 flex-shrink-0 text-right text-sm font-light text-zinc-500 dark:text-zinc-400">
                        {r.frecuencia}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <section className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-5 dark:border-zinc-800">
                <h3 className="font-medium">
                  Palabras que siguen a «{data.palabra}» en los anuncios
                </h3>
                {data.corpus.sucesores.length === 0 ? (
                  <p className="text-sm font-light text-zinc-500">Sin datos suficientes.</p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {data.corpus.sucesores.map((token) => (
                      <BarraProbabilidad key={token.token} token={token} color="#3838BD" />
                    ))}
                  </ul>
                )}
              </section>

              <section className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-5 dark:border-zinc-800">
                <h3 className="font-medium">
                  Palabras que preceden a «{data.palabra}» en los anuncios
                </h3>
                {data.corpus.predecesores.length === 0 ? (
                  <p className="text-sm font-light text-zinc-500">Sin datos suficientes.</p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {data.corpus.predecesores.map((token) => (
                      <BarraProbabilidad key={token.token} token={token} color="#008867" />
                    ))}
                  </ul>
                )}
              </section>

              <section className="flex flex-col gap-4 rounded-lg border border-zinc-200 p-5 dark:border-zinc-800">
                <h3 className="font-medium">Entropía en los anuncios</h3>

                <div className="flex flex-col items-center gap-1 text-center">
                  <p className="font-playfair text-5xl font-bold text-teja dark:text-teja-claro">
                    {data.corpus.entropia.toFixed(3)} bits
                  </p>
                  <p className="text-sm font-light text-zinc-500 dark:text-zinc-400">
                    de {data.corpus.entropiaMaxima.toFixed(3)} bits posibles ·{" "}
                    {Math.round(data.corpus.entropiaNormalizada * 100)}% del máximo
                    teórico
                  </p>
                </div>

                {(() => {
                  const { color, etiqueta } = colorYEtiquetaEntropia(data.corpus.entropiaNormalizada);
                  return (
                    <div className="flex flex-col gap-1">
                      <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min(100, data.corpus.entropiaNormalizada * 100)}%`,
                            backgroundColor: color,
                          }}
                        />
                      </div>
                      <span className="self-end text-xs font-medium" style={{ color }}>
                        {etiqueta}
                      </span>
                    </div>
                  );
                })()}

                {!data.corpus.fiable && (
                  <p className="text-sm font-light text-zinc-500 dark:text-zinc-400">
                    Frecuencia insuficiente (menos de {data.corpus.frecuenciaMinima} apariciones)
                    para una interpretación fiable.
                  </p>
                )}
              </section>
            </div>
            </>
          )}

          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Corpus de anuncios indexado: {data.metadatos.totalArticulos} anuncios ·{" "}
            {data.metadatos.totalTokens} palabras.
          </p>
        </>
      )}
    </div>
  );
}
