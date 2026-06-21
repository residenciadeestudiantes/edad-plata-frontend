"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/Button";
import {
  getAuthors,
  getCadenasLexicas,
  type Author,
  type CadenasLexicasResponse,
  type ProbabilidadToken,
  type ProbabilidadTokenConDesviacion,
} from "@/lib/api";

type Status = "idle" | "loading" | "error" | "success";

function interpretarEntropia(valor: number): string {
  if (valor < 1) return "Uso muy convencional en el corpus";
  if (valor < 2) return "Uso moderadamente predecible";
  if (valor < 3) return "Uso variado";
  return "Uso muy innovador en el corpus";
}

function BarraProbabilidad({
  token,
  probabilidad,
  color,
}: {
  token: ProbabilidadToken;
  probabilidad: number;
  color: string;
}) {
  return (
    <li className="flex items-center gap-3">
      <span className="w-28 flex-shrink-0 truncate text-sm font-medium" title={token.token}>
        {token.token}
      </span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
        <div
          className="h-full rounded-full"
          style={{ width: `${probabilidad * 100}%`, backgroundColor: color }}
        />
      </div>
      <span className="w-12 flex-shrink-0 text-right text-sm font-light text-zinc-500 dark:text-zinc-400">
        {Math.round(probabilidad * 100)}%
      </span>
    </li>
  );
}

function BarraConDesviacion({ token }: { token: ProbabilidadTokenConDesviacion }) {
  const positivo = token.desviacion > 0;
  const colorDesviacion = positivo
    ? "text-verde dark:text-verde-claro"
    : "text-teja dark:text-teja-claro";

  return (
    <li className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{token.token}</span>
        <span className={`font-medium ${token.desviacion === 0 ? "text-zinc-400" : colorDesviacion}`}>
          {token.desviacion > 0 ? "+" : ""}
          {token.desviacion.toFixed(2)} {positivo ? "más que la norma" : "menos que la norma"}
        </span>
      </div>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-zinc-300 dark:bg-zinc-600"
          style={{ width: `${token.probabilidadCorpus * 100}%` }}
        />
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-[#DA3C00]"
          style={{ width: `${token.probabilidad * 100}%` }}
        />
      </div>
    </li>
  );
}

export function CadenasLexicasClient() {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [palabra, setPalabra] = useState("");
  const [autorSlug, setAutorSlug] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [data, setData] = useState<CadenasLexicasResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [avisoPalabraCorta, setAvisoPalabraCorta] = useState(false);
  const [indiceConstruido, setIndiceConstruido] = useState(false);

  useEffect(() => {
    getAuthors(1, 100)
      .then((res) => setAuthors(res.data))
      .catch(() => {});
  }, []);

  const authorsOrdenados = [...authors].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  const autorNombre = authors.find((a) => a.slug === autorSlug)?.nombre ?? autorSlug;

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
      const res = await getCadenasLexicas(trimmed, autorSlug || undefined);
      setData(res);
      setStatus("success");
      setIndiceConstruido(true);
    } catch (error) {
      console.error("Error al calcular cadenas léxicas", error);
      setErrorMessage("No se ha podido completar el análisis. Inténtalo de nuevo más tarde.");
      setStatus("error");
    }
  }

  const sinOcurrenciasEnCorpus = data && data.corpus.frecuenciaTotal === 0;
  const autorSinOcurrencias =
    data?.autor && !data.autor.sinDatos && (data.autor.frecuenciaTotal ?? 0) === 0;

  return (
    <div className="flex flex-col gap-8">
      <div className="border-l-4 border-teja pl-4">
        <p className="max-w-3xl font-light text-zinc-600 dark:text-zinc-400">
          Analiza la probabilidad de que una palabra vaya precedida o seguida
          de otra en el corpus. La entropía mide la variedad de
          combinaciones: una entropía alta indica un uso más impredecible e
          innovador de la palabra. La desviación muestra cómo el uso de un
          autor se aleja de la norma del corpus.
        </p>
      </div>

      <div className="flex flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-negro">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex flex-1 flex-col gap-1.5">
            <label htmlFor="palabra-cadena" className="text-sm font-medium">
              Palabra a analizar
            </label>
            <input
              id="palabra-cadena"
              type="text"
              value={palabra}
              onChange={(event) => {
                setPalabra(event.target.value);
                if (avisoPalabraCorta) setAvisoPalabraCorta(false);
              }}
              placeholder="Ej: libertad, muerte, luz…"
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
            {avisoPalabraCorta && (
              <p className="text-sm text-red-600 dark:text-red-400">
                Introduce al menos 2 caracteres.
              </p>
            )}
          </div>

          <div className="flex flex-1 flex-col gap-1.5">
            <label htmlFor="autor-cadena" className="text-sm font-medium">
              Autor
            </label>
            <select
              id="autor-cadena"
              value={autorSlug}
              onChange={(event) => setAutorSlug(event.target.value)}
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            >
              <option value="">Solo corpus general</option>
              {authorsOrdenados.map((author) => (
                <option key={author.slug} value={author.slug}>
                  {author.nombre}
                </option>
              ))}
            </select>
          </div>

          <Button variant="primary" onClick={handleAnalizar} disabled={status === "loading"}>
            Analizar cadena
          </Button>
        </div>

        {status === "loading" && (
          <div className="flex flex-col items-center justify-center gap-3 py-6 text-center text-sm font-light text-zinc-500">
            <p>
              {indiceConstruido
                ? "Analizando…"
                : "Construyendo índice léxico... (puede tardar unos segundos con pocos datos, más con el corpus completo)"}
            </p>
            <div className="h-1.5 w-full max-w-md overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
              <div className="h-full w-1/3 animate-pulse rounded-full bg-teja dark:bg-teja-claro" />
            </div>
          </div>
        )}
      </div>

      {status === "error" && errorMessage && (
        <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
      )}

      {status === "success" && data && (
        <>
          {sinOcurrenciasEnCorpus ? (
            <p className="text-sm font-light text-zinc-500">
              No se han encontrado ocurrencias de «{data.palabra}» en el corpus.
            </p>
          ) : (
            <div
              className={`grid grid-cols-1 gap-8 ${
                autorSlug ? "lg:grid-cols-2" : ""
              }`}
            >
              {/* Columna izquierda: corpus general */}
              <div className="flex flex-col gap-8">
                <section className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-5 dark:border-zinc-800">
                  <h3 className="font-medium">
                    Palabras que siguen a «{data.palabra}» en el corpus
                  </h3>
                  {data.corpus.sucesores.length === 0 ? (
                    <p className="text-sm font-light text-zinc-500">Sin datos suficientes.</p>
                  ) : (
                    <ul className="flex flex-col gap-2">
                      {data.corpus.sucesores.map((token) => (
                        <BarraProbabilidad
                          key={token.token}
                          token={token}
                          probabilidad={token.probabilidad}
                          color="#3838BD"
                        />
                      ))}
                    </ul>
                  )}
                </section>

                <section className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-5 dark:border-zinc-800">
                  <h3 className="font-medium">
                    Palabras que preceden a «{data.palabra}» en el corpus
                  </h3>
                  {data.corpus.predecesores.length === 0 ? (
                    <p className="text-sm font-light text-zinc-500">Sin datos suficientes.</p>
                  ) : (
                    <ul className="flex flex-col gap-2">
                      {data.corpus.predecesores.map((token) => (
                        <BarraProbabilidad
                          key={token.token}
                          token={token}
                          probabilidad={token.probabilidad}
                          color="#008867"
                        />
                      ))}
                    </ul>
                  )}
                </section>

                <section className="flex flex-col items-center gap-1 rounded-lg border border-zinc-200 p-5 text-center dark:border-zinc-800">
                  <h3 className="mb-2 self-start font-medium">Entropía del corpus</h3>
                  <p className="font-playfair text-5xl font-bold text-teja dark:text-teja-claro">
                    {data.corpus.entropia.toFixed(3)}
                  </p>
                  <p className="text-sm font-light text-zinc-500 dark:text-zinc-400">
                    bits de entropía — {interpretarEntropia(data.corpus.entropia)}
                  </p>
                </section>
              </div>

              {/* Columna derecha: solo si se seleccionó un autor */}
              {autorSlug && data.autor && (
                <div className="flex flex-col gap-8">
                  {data.autor.sinDatos || autorSinOcurrencias ? (
                    <p className="text-sm font-light text-zinc-500">
                      No se han encontrado ocurrencias de «{data.palabra}» en los
                      textos de {autorNombre} disponibles en el corpus.
                    </p>
                  ) : (
                    <>
                      <section className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-5 dark:border-zinc-800">
                        <h3 className="font-medium">
                          Uso de «{data.palabra}» por {autorNombre}
                        </h3>
                        {(data.autor.sucesores ?? []).length === 0 ? (
                          <p className="text-sm font-light text-zinc-500">
                            Sin sucesores suficientes para comparar.
                          </p>
                        ) : (
                          <ul className="flex flex-col gap-2">
                            {(data.autor.sucesores ?? []).map((token) => (
                              <BarraConDesviacion key={token.token} token={token} />
                            ))}
                          </ul>
                        )}
                      </section>

                      <section className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-5 dark:border-zinc-800">
                        <h3 className="font-medium">Entropía: {autorNombre} frente al corpus</h3>
                        <div className="flex items-center justify-center gap-8 py-2">
                          <div className="flex flex-col items-center gap-1">
                            <p className="font-playfair text-4xl font-bold text-teja dark:text-teja-claro">
                              {(data.autor.entropia ?? 0).toFixed(3)}
                            </p>
                            <p className="text-xs font-light text-zinc-500">{autorNombre}</p>
                          </div>
                          <div className="flex flex-col items-center gap-1">
                            <p className="font-playfair text-4xl font-bold text-zinc-400">
                              {data.corpus.entropia.toFixed(3)}
                            </p>
                            <p className="text-xs font-light text-zinc-500">Corpus</p>
                          </div>
                        </div>
                        {(() => {
                          const desviacion = data.autor?.desviacionEntropia ?? 0;
                          const positivo = desviacion > 0;
                          return (
                            <p className="text-center text-sm">
                              <span
                                className={`font-medium ${
                                  positivo
                                    ? "text-verde dark:text-verde-claro"
                                    : "text-teja dark:text-teja-claro"
                                }`}
                              >
                                {desviacion > 0 ? "+" : ""}
                                {desviacion.toFixed(3)} de desviación de entropía
                              </span>
                              {desviacion > 0.5 && (
                                <span className="mt-1 block font-light text-zinc-500 dark:text-zinc-400">
                                  Este autor usa «{data.palabra}» de forma más
                                  innovadora que la norma del corpus.
                                </span>
                              )}
                            </p>
                          );
                        })()}
                      </section>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}

      <p className="text-xs font-light text-zinc-400 dark:text-zinc-500">
        El índice léxico se construye sobre el corpus disponible en el
        momento de la consulta. Con más textos ingestados, los resultados
        serán más representativos. El índice se cachea en memoria hasta el
        próximo reinicio del servidor.
      </p>
    </div>
  );
}
