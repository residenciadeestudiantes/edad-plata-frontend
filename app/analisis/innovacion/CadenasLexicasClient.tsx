"use client";

import { useState } from "react";
import { AuthorCombobox } from "@/components/AuthorCombobox";
import { Button } from "@/components/Button";
import { MetodologiaCientifica } from "@/components/MetodologiaCientifica";
import {
  getCadenasLexicas,
  type CadenasLexicasResponse,
  type ProbabilidadToken,
  type ProbabilidadTokenConDesviacion,
} from "@/lib/api";

type Status = "idle" | "loading" | "error" | "success";

// Color y etiqueta de la entropía normalizada (0-1 respecto al máximo
// teórico), en las mismas 4 zonas que distingue interpretarEntropia() en el
// backend (sin contar "insuficiente", que es un aviso de fiabilidad
// independiente del color).
function colorYEtiquetaEntropia(normalizada: number): { color: string; etiqueta: string } {
  if (normalizada < 0.3) return { color: "#3838BD", etiqueta: "Convencional" };
  if (normalizada < 0.5) return { color: "#008867", etiqueta: "Moderado" };
  if (normalizada < 0.7) return { color: "#FF7D45", etiqueta: "Variado" };
  return { color: "#DA3C00", etiqueta: "Innovador" };
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
  const [palabra, setPalabra] = useState("");
  const [autorSlug, setAutorSlug] = useState("");
  const [autorNombre, setAutorNombre] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [data, setData] = useState<CadenasLexicasResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [avisoPalabraCorta, setAvisoPalabraCorta] = useState(false);
  const [indiceConstruido, setIndiceConstruido] = useState(false);

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

  function handleLimpiar() {
    setPalabra("");
    setAutorSlug("");
    setAutorNombre("");
    setStatus("idle");
    setData(null);
    setErrorMessage(null);
    setAvisoPalabraCorta(false);
  }

  const sinOcurrenciasEnCorpus = data && data.corpus.frecuenciaTotal === 0;
  const autorSinOcurrencias =
    data?.autor && !data.autor.sinDatos && (data.autor.frecuenciaTotal ?? 0) === 0;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 border-l-4 border-azul pl-4">
        <p className="max-w-3xl font-light text-zinc-600 dark:text-zinc-400">
          Analiza la probabilidad de que una palabra vaya precedida o seguida
          de otra en el corpus, y compara el uso de un autor concreto con la
          norma general.
        </p>

        <MetodologiaCientifica>
          <p>
            La entropía mide la variedad de combinaciones: una entropía alta
            indica un uso más impredecible e innovador de la palabra. La
            desviación muestra cómo el uso de un autor se aleja de la norma
            del corpus.
          </p>
        </MetodologiaCientifica>
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
            <AuthorCombobox
              id="autor-cadena"
              value={autorSlug}
              onChange={(slug, author) => {
                setAutorSlug(slug);
                setAutorNombre(author?.nombre ?? "");
              }}
              placeholder="Solo corpus general"
            />
          </div>

          <Button variant="azul" onClick={handleAnalizar} disabled={status === "loading"}>
            Analizar cadena
          </Button>
          <Button variant="secondary-azul" onClick={handleLimpiar}>
            Limpiar
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
            <>
              {!data.corpus.fiable && (
                <div className="rounded-md border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm text-yellow-800 dark:border-yellow-700 dark:bg-yellow-950 dark:text-yellow-200">
                  Resultados orientativos. La palabra «{data.palabra}» aparece{" "}
                  {data.corpus.frecuenciaTotal}{" "}
                  {data.corpus.frecuenciaTotal === 1 ? "vez" : "veces"} en el
                  corpus. Se necesitan al menos {data.corpus.frecuenciaMinima}{" "}
                  ocurrencias para un análisis fiable.
                </div>
              )}

              <div
                className={`grid grid-cols-1 gap-8 ${autorSlug ? "lg:grid-cols-2" : ""}`}
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

                  <section className="flex flex-col gap-4 rounded-lg border border-zinc-200 p-5 dark:border-zinc-800">
                    <h3 className="font-medium">Entropía del corpus</h3>

                    {/* Elemento 1: valor con contexto */}
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

                    {/* Elemento 2: barra de progreso normalizada */}
                    {(() => {
                      const { color, etiqueta } = colorYEtiquetaEntropia(
                        data.corpus.entropiaNormalizada
                      );
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

                    {/* Elemento 3: recuadro explicativo, siempre visible */}
                    <div className="rounded-md border-l-4 border-teja bg-gris-claro p-4 dark:bg-zinc-900">
                      <h4 className="font-bold text-teja dark:text-teja-claro">
                        Qué significa innovador en este contexto
                      </h4>
                      <p className="mt-2 text-sm font-light text-zinc-600 dark:text-zinc-400">
                        La entropía mide la variedad de combinaciones léxicas.
                        Una entropía baja indica que la palabra aparece casi
                        siempre con las mismas palabras: uso convencional y
                        predecible.
                      </p>
                      <p className="mt-2 text-sm font-light text-zinc-600 dark:text-zinc-400">
                        Una entropía alta indica combinaciones variadas e
                        impredecibles: indicador estadístico de creatividad
                        léxica e innovación estilística.
                      </p>
                      <p className="mt-2 text-sm font-light italic text-zinc-600 dark:text-zinc-400">
                        Este análisis mide variedad de combinaciones, no
                        calidad literaria. La entropía es una medida
                        cuantitativa, no un juicio crítico.
                      </p>
                    </div>
                  </section>
                </div>

                {/* Columna derecha: solo si se seleccionó un autor */}
                {autorSlug && data.autor && (
                  <div className="flex flex-col gap-8">
                    {data.autor.sinArticulosEnEspanol ? (
                      <p className="text-sm font-light text-zinc-500">
                        {autorNombre} no tiene artículos en español (los análisis
                        solo incluyen artículos en español).
                      </p>
                    ) : data.autor.sinDatos || autorSinOcurrencias ? (
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
                            const significativa = Math.abs(desviacion) > 0.3;
                            const colorDesviacion =
                              desviacion > 0
                                ? "text-verde dark:text-verde-claro"
                                : desviacion < 0
                                  ? "text-teja dark:text-teja-claro"
                                  : "text-zinc-500";

                            let texto: string;
                            if (!significativa) {
                              texto = `${autorNombre} muestra un uso similar a la norma general del corpus.`;
                            } else if (desviacion > 0) {
                              texto = `${autorNombre} usa esta palabra de forma más variada que la norma del corpus, lo que sugiere un uso más innovador.`;
                            } else {
                              texto = `${autorNombre} usa esta palabra de forma más convencional que la norma del corpus.`;
                            }

                            return (
                              <div className="text-center text-sm">
                                <span className={`font-medium ${colorDesviacion}`}>
                                  {desviacion > 0 ? "+" : ""}
                                  {desviacion.toFixed(3)} de desviación de entropía
                                </span>
                                <p className="mt-1 font-light text-gris-oscuro dark:text-zinc-400">
                                  {texto}
                                </p>
                              </div>
                            );
                          })()}
                        </section>
                      </>
                    )}
                  </div>
                )}
              </div>
            </>
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
