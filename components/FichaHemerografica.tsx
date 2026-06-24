import Link from "next/link";
import type { ReactNode } from "react";
import type { Author, Publication } from "@/lib/api";

function formatFecha(fecha: string): string {
  return new Date(`${fecha}T00:00:00`).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function ListaAutores({ authors }: { authors: Author[] }) {
  return (
    <>
      {authors.map((author, index) => (
        <span key={author.id}>
          <Link
            href={`/autores/${author.slug}`}
            className="hover:text-teja hover:underline dark:hover:text-teja-claro"
          >
            {author.nombre}
          </Link>
          {index < authors.length - 1 && ", "}
        </span>
      ))}
    </>
  );
}

function Campo({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
      <dt className="w-44 flex-shrink-0 text-sm font-medium text-zinc-500 dark:text-zinc-400">
        {label}
      </dt>
      <dd className="text-sm font-light text-zinc-700 dark:text-zinc-300">{children}</dd>
    </div>
  );
}

// Bloque de metadatos hemerográficos de la revista (director, impresores,
// periodicidad…). Se omite por completo si no hay ningún dato, y cada campo
// individualmente si está vacío.
export function FichaHemerografica({ publication }: { publication: Publication }) {
  const directores = publication.directores ?? [];
  const impresores = publication.impresores ?? [];

  const tieneAlgunDato =
    directores.length > 0 ||
    impresores.length > 0 ||
    Boolean(publication.periodicidad) ||
    publication.numeros_publicados !== null ||
    Boolean(publication.fecha_primer_numero) ||
    Boolean(publication.fecha_ultimo_numero) ||
    Boolean(publication.issn) ||
    Boolean(publication.materia) ||
    Boolean(publication.idioma) ||
    Boolean(publication.notas);

  if (!tieneAlgunDato) return null;

  return (
    <section>
      <h2 className="font-titulo text-xl font-semibold tracking-tight text-teja dark:text-teja-claro">
        Ficha hemerográfica
      </h2>
      <dl className="mt-4 flex flex-col gap-2">
        {directores.length > 0 && (
          <Campo label="Director">
            <ListaAutores authors={directores} />
          </Campo>
        )}
        {impresores.length > 0 && (
          <Campo label="Impresores">
            <ListaAutores authors={impresores} />
          </Campo>
        )}
        {publication.periodicidad && (
          <Campo label="Periodicidad">{publication.periodicidad}</Campo>
        )}
        {publication.numeros_publicados !== null && (
          <Campo label="Números publicados">{publication.numeros_publicados}</Campo>
        )}
        {publication.fecha_primer_numero && (
          <Campo label="Fecha primer número">{formatFecha(publication.fecha_primer_numero)}</Campo>
        )}
        {publication.fecha_ultimo_numero && (
          <Campo label="Fecha último número">{formatFecha(publication.fecha_ultimo_numero)}</Campo>
        )}
        {publication.issn && <Campo label="ISSN">{publication.issn}</Campo>}
        {publication.materia && <Campo label="Materia">{publication.materia}</Campo>}
        {publication.idioma && <Campo label="Idioma">{publication.idioma}</Campo>}
        {publication.notas && <Campo label="Notas">{publication.notas}</Campo>}
      </dl>
    </section>
  );
}
