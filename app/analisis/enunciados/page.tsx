import type { Metadata } from "next";
import { Badge } from "@/components/Badge";
import { MetodologiaCientifica } from "@/components/MetodologiaCientifica";
import { PageTitle } from "@/components/PageTitle";
import { EnunciadosClient } from "./EnunciadosClient";

export const metadata: Metadata = {
  title: "Enunciados empíricos y metafísicos | Edad de Plata",
  description:
    "Proyecto de investigación experimental: clasificación de los enunciados de los artículos según su anclaje en la experiencia observable, siguiendo el criterio de verificación del Círculo de Viena.",
};

export default function EnunciadosPage() {
  return (
    <div className="mx-auto w-full max-w-[1520px] flex flex-1 flex-col gap-12 px-10 py-12 sm:px-20">
      <header className="flex flex-col gap-3">
        <Badge color="magenta" className="self-start">
          Proyecto de investigación experimental
        </Badge>
        <PageTitle color="azul">Enunciados empíricos y metafísicos</PageTitle>
        <p className="max-w-3xl font-light text-zinc-600 dark:text-zinc-400">
          Qué parte de lo que afirman los textos podría contrastarse con la
          experiencia y qué parte habla de esencias, almas o destinos que
          ninguna observación puede confirmar ni desmentir. Cada artículo se
          descompone en enunciados y cada enunciado se clasifica. Prueba
          piloto sobre 30 artículos de seis revistas: los resultados sirven
          para valorar el método, no para sacar conclusiones sobre el corpus.
        </p>
      </header>

      <EnunciadosClient />

      <section className="flex max-w-3xl flex-col gap-4">
        <h2 className="font-titulo text-2xl font-bold text-negro dark:text-blanco">
          Notas: bases de la investigación
        </h2>
        <div className="flex flex-col gap-3 font-light text-zinc-700 dark:text-zinc-300">
          <p>
            <strong>El criterio.</strong> El Círculo de Viena (Schlick, Carnap,
            Neurath) sostuvo que un enunciado sobre el mundo solo tiene
            contenido cognitivo si existe algún procedimiento, al menos en
            principio, para contrastarlo con la experiencia. Lo que no cumple
            esa condición no sería verdadero ni falso, sino carente de sentido
            cognitivo: es la tesis de Carnap en{" "}
            <em>
              La superación de la metafísica mediante el análisis lógico del
              lenguaje
            </em>{" "}
            (1932). A. J. Ayer la difundió en <em>Lenguaje, verdad y lógica</em>{" "}
            (1936).
          </p>
          <p>
            <strong>Por qué aplicarlo a estas revistas.</strong> El criterio se
            formula exactamente en los años del corpus. En España, la
            Residencia de Estudiantes, la JAE y la <em>Revista de Occidente</em>{" "}
            convivían con una tradición ensayística, católica y vitalista que
            hablaba del «alma de la raza» o del «destino de España». Medir el
            peso de cada registro permite estudiar históricamente cómo se
            repartía la autoridad entre el discurso de la ciencia y el de la
            especulación, sin juzgar a los autores con criterios de hoy.
          </p>
          <p>
            <strong>Lo que se mide y lo que no.</strong> No se mide la verdad
            de los textos: un enunciado verificable puede ser falso, y en la
            muestra hay casos claros (una lista de supuestos músicos judíos que
            incluye a Liszt y a Brahms). Se mide el <em>régimen de
            enunciación</em>: si el texto pretende traducir la realidad
            observable a palabras o se sitúa en un plano al que la observación
            no llega. Los juicios de valor y la ficción tienen categorías
            propias, porque no pretenden describir hechos.
          </p>
          <p>
            <strong>Las críticas al criterio.</strong> El verificacionismo fue
            abandonado en su forma estricta: el propio criterio no es
            verificable, deja fuera las leyes universales (Popper propuso la
            falsabilidad en su lugar) y Quine mostró que los enunciados no se
            contrastan uno a uno sino en bloque. Aquí se usa como lente
            historiográfica, no como doctrina: interesa cómo hablaban los
            textos, no dar la razón al Círculo de Viena.
          </p>
          <p>
            <strong>Estado del proyecto.</strong> Es un experimento. La
            clasificación de esta prueba la ha hecho un modelo de lenguaje
            (Claude) en una sola pasada y nadie la ha revisado todavía. Antes
            de extender el análisis al corpus completo hace falta que
            especialistas anoten una muestra, medir su acuerdo con el modelo y
            ajustar las categorías.
          </p>
        </div>

        <MetodologiaCientifica>
          <p>
            <strong>Muestra.</strong> 30 artículos en prosa y en español (se
            excluyen poemas, anuncios y obra gráfica), de 3.500 a 11.000
            caracteres, elegidos al azar y repartidos por años dentro de seis
            revistas de perfil contrastado: <em>Residencia</em> (8),{" "}
            <em>Cruz y Raya</em> (7), <em>La Gaceta Literaria</em> (5),{" "}
            <em>Octubre</em> (4), <em>Ultra</em> (3) y <em>Música</em> (3).
          </p>
          <p>
            <strong>Segmentación.</strong> El texto se divide en párrafos y
            cada párrafo en oraciones (punto, interrogación o exclamación
            seguidos de mayúscula), protegiendo abreviaturas habituales. Cada
            oración es un enunciado: 1.446 en total. Las oraciones compuestas
            reciben la etiqueta de su afirmación principal.
          </p>
          <p>
            <strong>Categorías.</strong> Observacional (O): hechos particulares
            comprobables. Empírico general (G): generalizaciones o leyes
            contrastables. Analítico (A): definiciones y verdades formales.
            Valorativo (N): juicios de valor, estéticos o morales,
            prescripciones e interpretaciones críticas. Metafísico (M):
            afirmaciones sobre esencias, el absoluto, el alma, el espíritu de
            un pueblo o el destino, sin condiciones posibles de verificación.
            Ficción (F): narración, imagen poética o verso. Excluido (X):
            títulos, firmas, referencias bibliográficas y fragmentos.
          </p>
          <p>
            <strong>Índices.</strong> Anclaje empírico = (O + G) / (O + G + M):
            de los enunciados que afirman algo sobre la realidad, qué
            proporción es contrastable. Peso empírico y peso metafísico =
            (O + G) y M divididos entre todos los enunciados que no son
            ficción ni excluidos. El primero compara registros; los segundos
            muestran cuánto del texto ocupa cada uno, porque un artículo de
            crítica puede no tener metafísica y, aun así, casi ningún dato.
          </p>
          <p>
            <strong>Limitaciones.</strong> Una sola persona clasificadora (el
            modelo), sin acuerdo entre anotadores; zonas grises frecuentes
            entre lo valorativo y lo metafísico, y entre la crítica
            interpretativa y lo empírico; la metáfora atraviesa casi toda la
            prosa de la época; el OCR introduce cortes de oración erróneos. Con
            30 artículos, las diferencias entre revistas son orientativas.
          </p>
        </MetodologiaCientifica>
      </section>
    </div>
  );
}
