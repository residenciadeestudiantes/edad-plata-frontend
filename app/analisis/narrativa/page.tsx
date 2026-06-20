import type { Metadata } from "next";
import { Button } from "@/components/Button";
import { ScrollyTelling, type Capitulo } from "@/components/ScrollyTelling";
import { GraficoBurbujas27 } from "@/components/narrativa/GraficoBurbujas27";
import { GraficoDeriva27 } from "@/components/narrativa/GraficoDeriva27";
import { GraficoMultirevista } from "@/components/narrativa/GraficoMultirevista";
import { GraficoTimeline } from "@/components/narrativa/GraficoTimeline";
import { GraficoVocabulario } from "@/components/narrativa/GraficoVocabulario";

export const metadata: Metadata = {
  title: "Narrativa Visual · Revistas de la Edad de Plata",
  description:
    "Una narrativa visual sobre el ecosistema editorial de la Generación del 27.",
};

const capitulos: Capitulo[] = [
  {
    id: "revistas",
    numero: 1,
    titulo: "El paisaje de las revistas",
    texto: "Entre 1920 y 1936 florecieron en España más de treinta revistas literarias y culturales que dieron voz a una generación excepcional. Cada una tenía su propio carácter: Revista de Occidente era el gran foro intelectual europeo; Litoral, el laboratorio lírico malagueño; La Gaceta Literaria, el escaparate de las vanguardias. Juntas formaron el ecosistema editorial más rico de la literatura española del siglo XX.",
    nota: "Datos de demostración. En producción se calcularán desde el corpus real.",
    grafico: <GraficoTimeline />,
  },
  {
    id: "voces",
    numero: 2,
    titulo: "Las voces dominantes",
    texto: "No todos los poetas publicaban con la misma intensidad. Gerardo Diego fue el más prolífico, con más de cincuenta artículos distribuidos entre casi todas las revistas del período. García Lorca, en cambio, publicaba menos pero con mayor impacto: cada aparición suya en una revista era un acontecimiento. El tamaño de cada burbuja refleja el volumen de publicación; el color, la revista donde más aparecieron.",
    nota: "Datos de demostración.",
    grafico: <GraficoBurbujas27 />,
  },
  {
    id: "geografia",
    numero: 3,
    titulo: "Geografía de la publicación",
    texto: "Algunos poetas eran ubicuos: publicaban en todas las revistas, cruzaban fronteras editoriales y tendencias estéticas. Otros eran fieles a una sola cabecera, vinculados a un proyecto concreto. Esta fidelidad o dispersión no era casual: reflejaba alianzas intelectuales, amistades personales y posicionamientos estéticos. Gerardo Diego era el gran viajero; Luis Cernuda, el más hermético.",
    nota: "Datos de demostración.",
    grafico: <GraficoMultirevista />,
  },
  {
    id: "vocabulario",
    numero: 4,
    titulo: "La evolución del vocabulario",
    texto: "El léxico de las revistas no fue estático. En los años veinte dominaban palabras como \"vanguardia\", \"imagen\" y \"metáfora\": el debate era estético. En los años treinta el vocabulario cambió radicalmente: \"pueblo\", \"revolución\", \"libertad\" y \"España\" pasaron a dominar las páginas. La literatura se politizó. El gráfico muestra este desplazamiento semántico quinquenio a quinquenio.",
    nota: "Datos de demostración.",
    grafico: <GraficoVocabulario />,
  },
  {
    id: "innovacion",
    numero: 5,
    titulo: "Los innovadores",
    texto: "No todos los poetas evolucionaron igual. García Lorca y Alberti comenzaron cerca de la norma del corpus y fueron alejándose progresivamente, hasta alcanzar un estilo completamente singular. Jorge Guillén, en cambio, mantuvo una coherencia estilística casi matemática a lo largo de toda su trayectoria. La distancia a la norma no es un juicio de valor: es una medida de singularidad.",
    nota: "Datos de demostración. El análisis real usará el corpus completo y un microservicio Python.",
    grafico: <GraficoDeriva27 />,
  },
];

export default function NarrativaPage() {
  return (
    <div className="flex flex-1 flex-col gap-16 px-6 py-12 sm:px-12">
      <div className="flex flex-col gap-3">
        <div className="rounded-md border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm text-yellow-800 dark:border-yellow-700 dark:bg-yellow-950 dark:text-yellow-200">
          Visualización con datos de demostración. En producción los datos se
          calcularán desde el corpus real de 8.000 artículos.
        </div>
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
          Lectura: 8 minutos · {capitulos.length} capítulos
        </p>
      </div>

      <ScrollyTelling
        titulo="La Generación del 27 a través de sus revistas"
        subtitulo="Una narrativa visual sobre el ecosistema editorial de la Edad de Plata"
        capitulos={capitulos}
      />

      <section className="flex flex-col items-start gap-4 border-t border-zinc-200 pt-10 dark:border-zinc-800">
        <p className="max-w-2xl font-light text-zinc-600 dark:text-zinc-400">
          Esta narrativa se basa en el corpus completo de revistas de la Edad
          de Plata digitalizado por la Residencia de Estudiantes. Puedes
          explorar los datos por tu cuenta en las herramientas de análisis.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button href="/analisis/corpus" variant="primary">
            Explorar el corpus
          </Button>
          <Button href="/analisis/estilometrico" variant="secondary">
            Análisis estilométrico
          </Button>
        </div>
      </section>
    </div>
  );
}
