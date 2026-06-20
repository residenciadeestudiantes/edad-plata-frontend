const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL ?? "http://localhost:1337";
const API_URL = `${STRAPI_URL}/api`;

// Strapi 5 devuelve los media y bloques de rich text con esta forma.
export interface StrapiMedia {
  id: number;
  documentId: string;
  url: string;
  alternativeText: string | null;
  width: number | null;
  height: number | null;
}

export type StrapiBlocksContent = Array<Record<string, unknown>>;

export interface StrapiPagination {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
}

export interface StrapiListResponse<T> {
  data: T[];
  meta: { pagination: StrapiPagination };
}

export interface StrapiSingleResponse<T> {
  data: T | null;
}

export interface Publication {
  id: number;
  documentId: string;
  titulo: string;
  slug: string;
  descripcion: StrapiBlocksContent | null;
  imagen_portada: StrapiMedia | null;
  año_inicio: number | null;
  año_fin: number | null;
  lugar_publicacion: string | null;
  notas: string | null;
  issues?: Issue[];
}

export interface Issue {
  id: number;
  documentId: string;
  titulo: string | null;
  numero_orden: number | null;
  mes: number | null;
  año: number | null;
  imagen_portada: StrapiMedia | null;
  url_facsimil: string | null;
  publication?: Publication;
  articles?: Article[];
}

export interface Article {
  id: number;
  documentId: string;
  titulo: string;
  slug: string;
  texto: string | null;
  posicion: number | null;
  pagina_inicio: number | null;
  pagina_fin: number | null;
  imagenes?: StrapiMedia[];
  issue?: Issue;
  authors?: Author[];
}

export interface Author {
  id: number;
  documentId: string;
  nombre: string;
  slug: string;
  nombre_normalizado: string | null;
  variantes_nombre: string | null;
  biografia: StrapiBlocksContent | null;
  imagen: StrapiMedia | null;
  articles?: Article[];
}

type QueryParams = Record<string, unknown>;

// Convierte un objeto de parámetros anidado a la notación con corchetes que espera Strapi (similar a qs.stringify).
function toQueryEntries(params: QueryParams, prefix = ""): string[] {
  const entries: string[] = [];

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    const fullKey = prefix ? `${prefix}[${key}]` : key;

    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        if (item !== null && typeof item === "object") {
          entries.push(...toQueryEntries(item as QueryParams, `${fullKey}[${index}]`));
        } else {
          entries.push(`${encodeURIComponent(`${fullKey}[${index}]`)}=${encodeURIComponent(String(item))}`);
        }
      });
    } else if (typeof value === "object") {
      entries.push(...toQueryEntries(value as QueryParams, fullKey));
    } else {
      entries.push(`${encodeURIComponent(fullKey)}=${encodeURIComponent(String(value))}`);
    }
  }

  return entries;
}

function buildQuery(params: QueryParams): string {
  const query = toQueryEntries(params).join("&");
  return query ? `?${query}` : "";
}

async function fetchAPI<T>(path: string, params: QueryParams = {}): Promise<T> {
  const url = `${API_URL}${path}${buildQuery(params)}`;
  const res = await fetch(url, { next: { revalidate: 60 } });

  if (!res.ok) {
    throw new Error(`Error ${res.status} al consumir ${url}`);
  }

  return res.json();
}

// Antepone la URL del backend a las rutas de media relativas que devuelve Strapi.
export function getStrapiMediaUrl(url?: string | null): string | null {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${STRAPI_URL}${url}`;
}

export async function getPublications(page = 1, pageSize = 25, query?: string) {
  return fetchAPI<StrapiListResponse<Publication>>("/publications", {
    filters: query ? { titulo: { $containsi: query } } : undefined,
    populate: ["imagen_portada"],
    sort: ["titulo:asc"],
    pagination: { page, pageSize },
  });
}

export async function getPublication(slug: string) {
  const res = await fetchAPI<StrapiListResponse<Publication>>("/publications", {
    filters: { slug: { $eq: slug } },
    populate: {
      imagen_portada: true,
      issues: { sort: ["año:desc", "numero_orden:desc"], populate: ["imagen_portada"] },
    },
  });
  return res.data[0] ?? null;
}

export async function getIssues(publicationSlug?: string, page = 1, pageSize = 25) {
  return fetchAPI<StrapiListResponse<Issue>>("/issues", {
    filters: publicationSlug ? { publication: { slug: { $eq: publicationSlug } } } : undefined,
    populate: ["imagen_portada", "publication"],
    sort: ["año:desc", "numero_orden:desc"],
    pagination: { page, pageSize },
  });
}

export async function getIssue(documentId: string) {
  const res = await fetchAPI<StrapiSingleResponse<Issue>>(`/issues/${documentId}`, {
    populate: {
      imagen_portada: true,
      publication: true,
      articles: { sort: ["posicion:asc"], populate: ["authors"] },
    },
  });
  return res.data;
}

export async function getIssueByNumeroOrden(publicationSlug: string, numeroOrden: number) {
  const res = await fetchAPI<StrapiListResponse<Issue>>("/issues", {
    filters: {
      numero_orden: { $eq: numeroOrden },
      publication: { slug: { $eq: publicationSlug } },
    },
    populate: {
      imagen_portada: true,
      publication: true,
      articles: { sort: ["posicion:asc"], populate: ["authors"] },
    },
  });
  return res.data[0] ?? null;
}

export async function getArticles(issueDocumentId?: string, page = 1, pageSize = 25) {
  return fetchAPI<StrapiListResponse<Article>>("/articles", {
    filters: issueDocumentId ? { issue: { documentId: { $eq: issueDocumentId } } } : undefined,
    populate: ["authors", "issue"],
    sort: ["posicion:asc"],
    pagination: { page, pageSize },
  });
}

export async function getArticle(slug: string) {
  const res = await fetchAPI<StrapiListResponse<Article>>("/articles", {
    filters: { slug: { $eq: slug } },
    populate: {
      authors: true,
      imagenes: true,
      issue: { populate: ["publication"] },
    },
  });
  return res.data[0] ?? null;
}

export async function getAuthors(page = 1, pageSize = 25) {
  return fetchAPI<StrapiListResponse<Author>>("/authors", {
    populate: ["imagen"],
    sort: ["nombre:asc"],
    pagination: { page, pageSize },
  });
}

export async function getAuthor(slug: string) {
  const res = await fetchAPI<StrapiListResponse<Author>>("/authors", {
    filters: { slug: { $eq: slug } },
    populate: {
      imagen: true,
      articles: { populate: { issue: { populate: ["publication"] } } },
    },
  });
  return res.data[0] ?? null;
}

// Autores con al menos un artículo publicado en algún número de esta revista.
export async function getAuthorsByPublication(publicationSlug: string) {
  const res = await fetchAPI<StrapiListResponse<Author>>("/authors", {
    filters: {
      articles: { issue: { publication: { slug: { $eq: publicationSlug } } } },
    },
    sort: ["nombre:asc"],
    pagination: { page: 1, pageSize: 100 },
  });

  const seen = new Set<number>();
  return res.data.filter((author) => {
    if (seen.has(author.id)) return false;
    seen.add(author.id);
    return true;
  });
}

export interface ConcordanciaPorRevista {
  revista: string;
  slug: string;
  ocurrencias: number;
  articulos: number;
}

export interface ConcordanciaPorAutor {
  autor: string;
  slug: string;
  ocurrencias: number;
  articulos: number;
}

export interface ConcordanciaPorAño {
  año: number;
  ocurrencias: number;
  articulos: number;
}

export interface Concordancia {
  articuloTitulo: string;
  articuloSlug: string;
  autores: string[];
  revista: string;
  numeroOrden: number | null;
  año: number | null;
  fragmento: string;
  enTitulo: boolean;
}

export interface ConcordanciaPorAñoCronologico {
  año: number;
  ocurrencias: number;
}

export interface ConcordanciaPorAutorBurbuja {
  autor: string;
  autor_slug: string;
  ocurrencias: number;
  num_articulos: number;
}

export interface ConcordanciasResponse {
  palabra: string;
  totalOcurrencias: number;
  totalArticulos: number;
  porRevista: ConcordanciaPorRevista[];
  porAutor: ConcordanciaPorAutor[];
  porAño: ConcordanciaPorAño[];
  por_año: ConcordanciaPorAñoCronologico[];
  por_autor_burbuja: ConcordanciaPorAutorBurbuja[];
  concordancias: Concordancia[];
}

export interface ConcordanciasScope {
  autor?: string;
  revista?: string;
  año?: number;
}

// Análisis filológico: busca concordancias de una palabra (en título y texto)
// en el corpus de artículos publicados, insensible a mayúsculas y tildes (ver
// backend). El ámbito puede acotarse a un autor, una revista o un año.
export async function getConcordancias(palabra: string, scope: ConcordanciasScope = {}) {
  return fetchAPI<ConcordanciasResponse>("/analisis/concordancias", {
    palabra,
    autor: scope.autor,
    revista: scope.revista,
    año: scope.año,
  });
}

export interface SearchArticlesParams {
  query?: string;
  publicationSlug?: string;
  authorSlug?: string;
  yearFrom?: number;
  yearTo?: number;
  page?: number;
  pageSize?: number;
}

// Búsqueda avanzada de artículos: combina texto libre (título de artículo o
// nombre de autor) con filtros opcionales de revista, autor y rango de años
// del número. Usa los operadores $containsi de Strapi (case-insensitive).
export async function searchArticles({
  query,
  publicationSlug,
  authorSlug,
  yearFrom,
  yearTo,
  page = 1,
  pageSize = 20,
}: SearchArticlesParams) {
  const and: QueryParams[] = [];

  const trimmedQuery = query?.trim();
  if (trimmedQuery) {
    and.push({
      $or: [
        { titulo: { $containsi: trimmedQuery } },
        { authors: { nombre: { $containsi: trimmedQuery } } },
      ],
    });
  }

  if (publicationSlug) {
    and.push({ issue: { publication: { slug: { $eq: publicationSlug } } } });
  }

  if (authorSlug) {
    and.push({ authors: { slug: { $eq: authorSlug } } });
  }

  if (yearFrom !== undefined) {
    and.push({ issue: { año: { $gte: yearFrom } } });
  }

  if (yearTo !== undefined) {
    and.push({ issue: { año: { $lte: yearTo } } });
  }

  return fetchAPI<StrapiListResponse<Article>>("/articles", {
    filters: and.length > 0 ? { $and: and } : undefined,
    populate: {
      authors: true,
      issue: { populate: ["publication"] },
    },
    sort: ["issue.año:desc", "posicion:asc"],
    pagination: { page, pageSize },
  });
}

export interface EstilometriaAutor {
  slug: string;
  nombre: string;
  num_articulos: number;
}

export interface PalabraCaracteristica {
  palabra: string;
  peso: number;
}

export interface EstilometriaResponse {
  autor1: EstilometriaAutor;
  autor2: EstilometriaAutor;
  distancia_coseno: number;
  similitud_coseno: number;
  palabras_caracteristicas: {
    autor1: PalabraCaracteristica[];
    autor2: PalabraCaracteristica[];
  };
  interpretacion: string;
}

// Análisis estilométrico: calcula la distancia de coseno TF-IDF entre los
// corpus de dos autores y devuelve las palabras más características de cada
// uno. Prototipo en Node; en producción delegará en un microservicio Python.
export async function getEstilometria(slug1: string, slug2: string) {
  return fetchAPI<EstilometriaResponse>("/analisis/estilometria", {
    autor1: slug1,
    autor2: slug2,
  });
}

export interface Page {
  id: number;
  documentId: string;
  titulo: string;
  slug: string;
  contenido: StrapiBlocksContent | null;
}

// Páginas institucionales editables desde Strapi (Qué es la Edad de Plata,
// Proyecto Edad de Plata, etc.).
export async function getPage(slug: string) {
  const res = await fetchAPI<StrapiListResponse<Page>>("/pages", {
    filters: { slug: { $eq: slug } },
  });
  return res.data[0] ?? null;
}

export interface InnovacionPuntoTrayectoria {
  año: number;
  distancia: number;
}

export interface InnovacionAutor {
  nombre: string;
  color: string;
  trayectoria: InnovacionPuntoTrayectoria[];
}

export interface InnovacionEstilisticaResponse {
  es_prototipo: boolean;
  nota: string;
  centroide_año_inicio: number;
  centroide_año_fin: number;
  autores: InnovacionAutor[];
}

// Innovación Estilística: PROTOTIPO de demostración visual con datos
// hardcodeados en el backend (no consulta el corpus real todavía).
export async function getInnovacionEstilistica() {
  return fetchAPI<InnovacionEstilisticaResponse>("/analisis/innovacion");
}

export interface FondoArchivo {
  fondo: string;
  descripcion: string;
  signatura: string;
  fecha: string;
  url_atom: string;
}

export interface ContextoArchivoResponse {
  es_prototipo: boolean;
  nota: string;
  respuesta: string;
  fondos: FondoArchivo[];
  confianza: number;
}

// Consultar fondos del archivo: PROTOTIPO que simula una respuesta de Amazon
// Q Business sobre el archivo digital de la Residencia de Estudiantes.
export async function getContextoArchivo(
  tipo: string,
  nombre: string
): Promise<ContextoArchivoResponse> {
  const res = await fetch(
    `${STRAPI_URL}/api/archivo/contexto?tipo=${tipo}&nombre=${encodeURIComponent(nombre)}`
  );
  if (!res.ok) throw new Error("Error al consultar el archivo");
  return res.json();
}

export interface ResultadoBusquedaTexto {
  id: number;
  titulo: string;
  slug: string;
  autores: string[];
  revista: string;
  revista_slug: string;
  numero_orden: number | null;
  año: number | null;
  fragmento: string;
}

export interface BusquedaTextoResponse {
  data: ResultadoBusquedaTexto[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    pageCount: number;
  };
}

// Búsqueda exacta en el cuerpo completo de los artículos (frase literal).
export async function buscarEnTexto(
  frase: string,
  page: number = 1,
  pageSize: number = 20
): Promise<BusquedaTextoResponse> {
  const res = await fetch(
    `${STRAPI_URL}/api/buscar/texto?q=${encodeURIComponent(frase)}&page=${page}&pageSize=${pageSize}`
  );
  if (!res.ok) throw new Error("Error en la búsqueda de texto");
  return res.json();
}
