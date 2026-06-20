import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { PageTitle } from "@/components/PageTitle";
import { getPublications, getStrapiMediaUrl } from "@/lib/api";

const HOME_PAGE_SIZE = 8;

export default async function Home() {
  const { data: publications } = await getPublications(1, HOME_PAGE_SIZE);

  return (
    <div className="flex flex-1 flex-col px-6 py-12 sm:px-12">
      <header className="mb-10">
        <PageTitle>Revistas de la Edad de Plata</PageTitle>
        <p className="mt-2 font-light text-zinc-600 dark:text-zinc-400">
          Explora el catálogo de publicaciones periódicas de la Edad de Plata
          española.
        </p>
      </header>

      {publications.length === 0 ? (
        <p className="text-zinc-500">No se han encontrado revistas.</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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

      <section className="mt-16 flex flex-col items-start gap-4 rounded-lg bg-negro px-6 py-10 sm:px-12">
        <h2 className="font-titulo text-2xl font-bold text-white">
          Herramientas de análisis para investigadores
        </h2>
        <p className="max-w-2xl font-light text-zinc-300">
          Explora el corpus de las revistas de la Edad de Plata con
          herramientas de análisis lingüístico y estilométrico. Busca
          términos, estudia su distribución por autor y revista, compara
          estilos de escritura y descubre trayectorias de innovación
          literaria a lo largo del tiempo.
        </p>
        <Button href="/analisis" variant="primary">
          Acceder al análisis
        </Button>
      </section>
    </div>
  );
}
