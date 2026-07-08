import { ActivarModoInvestigacion } from "@/components/ActivarModoInvestigacion";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { PageTitle } from "@/components/PageTitle";
import { getHomePublications, getStrapiMediaUrl } from "@/lib/api";

// Evita que el build de producción necesite el backend arrancado y
// accesible (lo necesitaría para la generación estática con ISR); se
// renderiza en el servidor en cada petición en su lugar.
export const dynamic = "force-dynamic";

export default async function Home() {
  const { data: publications } = await getHomePublications();

  return (
    <div className="flex flex-1 flex-col px-10 py-12 sm:px-20">
      <header className="mb-10">
        <PageTitle>Revistas de la Edad de Plata</PageTitle>
        <p className="mt-2 font-light text-zinc-600 dark:text-zinc-400">
          Explora una selección del catálogo de publicaciones periódicas de la
          Edad de Plata española, un periodo de extraordinaria efervescencia
          cultural e intelectual que se desarrolló entre 1902 y 1939. Durante
          estas décadas, varias generaciones de escritores, artistas,
          científicos y pensadores renovaron profundamente la vida cultural
          española, situándola en diálogo con las principales corrientes
          intelectuales y artísticas de la Europa de su tiempo.
        </p>
      </header>

      {publications.length === 0 ? (
        <p className="text-zinc-500">No se han encontrado revistas.</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {publications.map((publication) => {
            const imageUrl = getStrapiMediaUrl(
              publication.imagen_portada?.url
            );
            const years = [publication.año_inicio, publication.año_fin]
              .filter((year) => year !== null && year !== undefined)
              .join(" - ");

            return (
              <Card
                key={publication.id}
                href={`/revistas/${publication.slug}`}
                imageUrl={imageUrl}
                imageAlt={publication.titulo}
                title={publication.titulo}
                meta={years || undefined}
              />
            );
          })}
        </div>
      )}

      <div className="mt-10 flex justify-center">
        <Button href="/revistas" variant="secondary">
          Ver todas las revistas
        </Button>
      </div>

      <section className="mt-16 flex flex-col items-start gap-4 rounded-lg bg-teja px-10 py-10 sm:px-20">
        <h2 className="font-titulo text-4xl font-bold text-white">
          Herramientas de análisis para investigadores
        </h2>
        <p className="max-w-2xl font-light text-white/90">
          Explora el corpus de las revistas de la Edad de Plata con
          herramientas de análisis lingüístico y estilométrico. Busca
          términos, estudia su distribución por autor y revista, compara
          estilos de escritura y descubre trayectorias de innovación
          literaria a lo largo del tiempo.
        </p>
        <Button href="/analisis" variant="inverse">
          Acceder al análisis
        </Button>
      </section>

      <section className="mt-8 flex flex-col items-start gap-4 rounded-lg bg-azul px-10 py-10 sm:px-20">
        <h2 className="font-titulo text-4xl font-bold text-white">
          Explora en modo investigación
        </h2>
        <p className="max-w-2xl font-light text-white/90">
          Selecciona el modo investigación para tener una experiencia desde
          la que podrás acceder a información adicional en cada página.
          Podrás consultar análisis léxicos, metadatos detallados y fuentes
          primarias relacionadas procedentes de nuestros fondos, que aportan
          contexto y enriquecen la interpretación de los contenidos.
        </p>
        <ActivarModoInvestigacion />
      </section>
    </div>
  );
}
