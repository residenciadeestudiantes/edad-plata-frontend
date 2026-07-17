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
  latitud: number | null;
  longitud: number | null;
  lugar_publicacion_2: string | null;
  latitud_2: number | null;
  longitud_2: number | null;
  notas: string | null;
  metadatos_marc21: string | null;
  periodicidad: string | null;
  numeros_publicados: number | null;
  fecha_primer_numero: string | null;
  fecha_ultimo_numero: string | null;
  issn: string | null;
  idioma: string | null;
  mostrar_en_home: boolean;
  orden_home: number | null;
  issues?: Issue[];
  directores?: Author[];
  impresores?: Author[];
  materias?: Materia[];
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
  pies_imagen: string | null;
  idioma: string | null;
  es_anuncio: boolean | null;
  es_poema: boolean | null;
  es_obra_grafica: boolean | null;
  texto_ocr_anuncios: string | null;
  posicion: number | null;
  pagina_inicio: number | null;
  pagina_fin: number | null;
  imagenes?: StrapiMedia[];
  issue?: Issue;
  authors?: Author[];
  temas?: Tema[];
}

// El campo idioma de un artículo es un único string, pero puede contener
// varios idiomas separados por "|" (p. ej. "Español | Gallego") cuando el
// artículo está escrito en más de uno. Esta función lo descompone en una
// lista, para tratar cada idioma como una etiqueta independiente en vez de
// mostrar el separador crudo.
export function parseIdiomas(idioma: string | null | undefined): string[] {
  if (!idioma) return [];
  return idioma
    .split("|")
    .map((valor) => valor.trim())
    .filter(Boolean);
}

export interface Tema {
  id: number;
  documentId: string;
  nombre: string;
  slug: string;
}

export interface Actividad {
  id: number;
  documentId: string;
  nombre: string;
  slug: string;
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
  destacado_galeria?: boolean;
  orden_destacado_galeria?: number | null;
  anio_nacimiento?: number | null;
  anio_fallecimiento?: number | null;
  lugar_nacimiento?: string | null;
  lugar_fallecimiento?: string | null;
  actividades?: Actividad[];
}

export interface Materia {
  id: number;
  documentId: string;
  nombre: string;
  slug: string;
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

async function postAPI<T>(path: string, body: unknown): Promise<T> {
  const url = `${API_URL}${path}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data: { error?: { message?: string } } | null = await res.json().catch(() => null);
    throw new Error(data?.error?.message || `Error ${res.status}`);
  }
  return res.json();
}

async function fetchAPI<T>(path: string, params: QueryParams = {}): Promise<T> {
  const url = `${API_URL}${path}${buildQuery(params)}`;
  const res = await fetch(url, { next: { revalidate: 60 } });

  if (!res.ok) {
    // Strapi devuelve el detalle del error en el cuerpo (p. ej. los mensajes
    // de validación de ctx.badRequest); sin esto, el frontend solo vería un
    // "Error 400" genérico y perdería el mensaje útil para el usuario.
    const body: { error?: { message?: string } } | null = await res.json().catch(() => null);
    throw new Error(body?.error?.message || `Error ${res.status} al consumir ${url}`);
  }

  return res.json();
}

// Antepone la URL del backend a las rutas de media relativas que devuelve Strapi.
export function getStrapiMediaUrl(url?: string | null): string | null {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${STRAPI_URL}${url}`;
}

export async function getPublications(
  page = 1,
  pageSize = 25,
  query?: string,
  materiaSlug?: string
) {
  const filters: QueryParams = {};
  if (query) filters.titulo = { $containsi: query };
  if (materiaSlug) filters.materias = { slug: { $eq: materiaSlug } };

  return fetchAPI<StrapiListResponse<Publication>>("/publications", {
    filters: Object.keys(filters).length > 0 ? filters : undefined,
    populate: ["imagen_portada"],
    sort: ["titulo:asc"],
    pagination: { page, pageSize },
  });
}

export async function getHomePublications() {
  return fetchAPI<StrapiListResponse<Publication>>("/publications", {
    filters: { mostrar_en_home: { $eq: true } },
    populate: ["imagen_portada"],
    sort: ["orden_home:asc"],
    pagination: { pageSize: 100 },
  });
}

export async function getMaterias() {
  const res = await fetchAPI<StrapiListResponse<Materia>>("/materias", {
    sort: ["nombre:asc"],
    pagination: { pageSize: 200 },
  });
  return res.data;
}

// Revistas con coordenadas conocidas (rellenadas en el backend a partir de
// `lugar_publicacion`, ver backend/src/api/publication/.../lifecycles.ts),
// para el módulo de mapa. Las que no tienen ciudad reconocida no aparecen.
export async function getPublicacionesConUbicacion() {
  const res = await fetchAPI<StrapiListResponse<Publication>>("/publications", {
    filters: { $or: [{ latitud: { $notNull: true } }, { latitud_2: { $notNull: true } }] },
    fields: [
      "titulo", "slug", "año_inicio", "año_fin",
      "lugar_publicacion", "latitud", "longitud",
      "lugar_publicacion_2", "latitud_2", "longitud_2",
    ],
    sort: ["titulo:asc"],
    pagination: { pageSize: 200 },
  });
  return res.data;
}

// Idioma y tipo (poema / anuncio / obra gráfica) de todos los artículos del
// corpus, para los gráficos de la página de datos hemerográficos. Pagina si
// el total supera el límite máximo de Strapi (100 por página).
export async function getArticulosHemerografico(): Promise<Article[]> {
  const pageSize = 100;
  const fields = ["idioma", "es_poema", "es_anuncio", "es_obra_grafica"];
  const primera = await fetchAPI<StrapiListResponse<Article>>("/articles", {
    fields,
    pagination: { page: 1, pageSize },
  });
  const total = primera.meta.pagination.pageCount;
  if (total <= 1) return primera.data;

  const resto = await Promise.all(
    Array.from({ length: total - 1 }, (_, i) =>
      fetchAPI<StrapiListResponse<Article>>("/articles", {
        fields,
        pagination: { page: i + 2, pageSize },
      }).then((r) => r.data)
    )
  );
  return [...primera.data, ...resto.flat()];
}

// Temas y revista (issue.publication) de todos los artículos del corpus,
// para el gráfico comparativo de artículos por tema de la página de datos
// hemerográficos. Pagina igual que getArticulosHemerografico.
export async function getArticulosTemasHemerografico(): Promise<Article[]> {
  const pageSize = 100;
  const populate = {
    temas: { fields: ["nombre"] },
    issue: { populate: { publication: { fields: ["slug", "titulo"] } } },
  };
  const primera = await fetchAPI<StrapiListResponse<Article>>("/articles", {
    fields: ["id"],
    populate,
    pagination: { page: 1, pageSize },
  });
  const total = primera.meta.pagination.pageCount;
  if (total <= 1) return primera.data;

  const resto = await Promise.all(
    Array.from({ length: total - 1 }, (_, i) =>
      fetchAPI<StrapiListResponse<Article>>("/articles", {
        fields: ["id"],
        populate,
        pagination: { page: i + 2, pageSize },
      }).then((r) => r.data)
    )
  );
  return [...primera.data, ...resto.flat()];
}

// Lugar de publicación de todas las revistas, para el gráfico de barras de
// la página de datos hemerográficos.
export async function getPublicacionesDatosHemerograficos() {
  const res = await fetchAPI<StrapiListResponse<Publication>>("/publications", {
    fields: ["lugar_publicacion"],
    pagination: { pageSize: 200 },
  });
  return res.data;
}

// Título y slug de todas las revistas (sin filtrar por año), para el
// selector del comparador de artículos por tema.
export async function getPublicacionesSelectorHemerografico() {
  const res = await fetchAPI<StrapiListResponse<Publication>>("/publications", {
    fields: ["titulo", "slug"],
    sort: ["titulo:asc"],
    pagination: { pageSize: 200 },
  });
  return res.data;
}

// Revistas con año de inicio conocido, para la línea de tiempo del análisis
// hemerográfico (periodo de publicación de cada revista).
export async function getPublicacionesLineaTiempo() {
  const res = await fetchAPI<StrapiListResponse<Publication>>("/publications", {
    filters: { año_inicio: { $notNull: true } },
    fields: ["titulo", "slug", "año_inicio", "año_fin"],
    sort: ["año_inicio:asc"],
    pagination: { pageSize: 200 },
  });
  return res.data;
}

export async function getPublication(slug: string) {
  const res = await fetchAPI<StrapiListResponse<Publication>>("/publications", {
    filters: { slug: { $eq: slug } },
    populate: {
      imagen_portada: true,
      issues: { sort: ["año:asc", "numero_orden:asc"], populate: ["imagen_portada"] },
      directores: true,
      impresores: true,
      materias: true,
    },
  });
  return res.data[0] ?? null;
}

export async function getIssues(publicationSlug?: string, page = 1, pageSize = 25) {
  return fetchAPI<StrapiListResponse<Issue>>("/issues", {
    filters: publicationSlug ? { publication: { slug: { $eq: publicationSlug } } } : undefined,
    populate: ["imagen_portada", "publication"],
    sort: ["año:asc", "numero_orden:asc"],
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
      articles: { sort: ["posicion:asc"], populate: ["authors", "temas"] },
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
      temas: true,
      issue: { populate: ["publication", "imagen_portada"] },
    },
  });
  return res.data[0] ?? null;
}

export async function getAuthors(
  page = 1,
  pageSize = 25,
  query?: string,
  letter?: string,
  publicationSlug?: string
) {
  const nombreFilter: Record<string, string> = {};
  if (query) nombreFilter.$containsi = query;
  if (letter) nombreFilter.$startsWithi = letter;

  const filters: Record<string, unknown> = {};
  if (Object.keys(nombreFilter).length) filters.nombre = nombreFilter;
  if (publicationSlug) {
    filters.articles = { issue: { publication: { slug: { $eq: publicationSlug } } } };
  }

  return fetchAPI<StrapiListResponse<Author>>("/authors", {
    filters: Object.keys(filters).length ? filters : undefined,
    populate: ["imagen"],
    sort: ["nombre:asc"],
    pagination: { page, pageSize },
  });
}

export interface ArticulosPorRevista {
  revista: string;
  revista_slug: string;
  num_articulos: number;
}

// Desglose de artículos por revista para un autor, usado por el gráfico de
// burbujas de colaboraciones. Se agrupa en el cliente porque Strapi no ofrece
// una agregación nativa por relación anidada (issue.publication).
export async function getArticulosPorRevistaDeAutor(
  autorSlug: string
): Promise<ArticulosPorRevista[]> {
  const { data: articles } = await fetchAPI<StrapiListResponse<Article>>("/articles", {
    filters: { authors: { slug: { $eq: autorSlug } } },
    populate: { issue: { populate: { publication: { fields: ["titulo", "slug"] } } } },
    fields: ["id"],
    pagination: { pageSize: 500 },
  });

  const conteo = new Map<string, ArticulosPorRevista>();
  for (const articulo of articles) {
    const publication = articulo.issue?.publication;
    if (!publication) continue;

    const entry = conteo.get(publication.slug) ?? {
      revista: publication.titulo,
      revista_slug: publication.slug,
      num_articulos: 0,
    };
    entry.num_articulos += 1;
    conteo.set(publication.slug, entry);
  }

  return Array.from(conteo.values()).sort((a, b) => b.num_articulos - a.num_articulos);
}

// ── Author network data ───────────────────────────────────────────────────────
// Returns one entry per (author × publication) pair, restricted to the
// publications where `autorSlug` has written. Used to build the collaboration
// network graph in the Redes tab.

export interface NetworkEntry {
  authorSlug: string;
  authorNombre: string;
  publicationSlug: string;
  publicationTitulo: string;
  issueId: number;     // key: two authors sharing an issueId are co-authors of that issue
}

export async function getAuthorNetworkData(autorSlug: string): Promise<NetworkEntry[]> {
  const publicaciones = await getArticulosPorRevistaDeAutor(autorSlug);
  const pubSlugs = publicaciones.map((p) => p.revista_slug);
  if (pubSlugs.length === 0) return [];

  const entries: NetworkEntry[] = [];
  let page = 1;
  for (;;) {
    const res = await fetchAPI<StrapiListResponse<Article>>("/articles", {
      filters: { issue: { publication: { slug: { $in: pubSlugs } } } },
      populate: {
        authors: { fields: ["nombre", "slug"] },
        issue: {
          fields: ["id"],
          populate: { publication: { fields: ["titulo", "slug"] } },
        },
      },
      fields: ["id"],
      pagination: { page, pageSize: 100 },
    });
    for (const art of res.data) {
      const pub = art.issue?.publication;
      const issueId = art.issue?.id;
      if (!pub?.slug || !issueId) continue;
      for (const a of art.authors ?? []) {
        entries.push({
          authorSlug: a.slug,
          authorNombre: a.nombre,
          publicationSlug: pub.slug,
          publicationTitulo: pub.titulo,
          issueId,
        });
      }
    }
    if (page >= res.meta.pagination.pageCount) break;
    page++;
  }
  return entries;
}

export interface ActividadConConteo {
  id: number;
  documentId: string;
  nombre: string;
  slug: string;
  autoresCount: number;
}

// Nº de autores por tipo de actividad (ver content-type Actividad), para el
// gráfico de barras de Análisis > Autores. Pagina manualmente porque el
// límite del API (config/api.ts, maxLimit: 100) es menor que el nº de
// actividades registradas.
export async function getActividadesConConteo(): Promise<ActividadConConteo[]> {
  const resultado: ActividadConConteo[] = [];
  let page = 1;
  for (;;) {
    const res = await fetchAPI<StrapiListResponse<Actividad & { authors?: { id: number }[] }>>(
      "/actividades",
      {
        fields: ["nombre", "slug"],
        populate: { authors: { fields: ["id"] } },
        pagination: { page, pageSize: 100 },
      }
    );
    for (const a of res.data) {
      resultado.push({
        id: a.id,
        documentId: a.documentId,
        nombre: a.nombre,
        slug: a.slug,
        autoresCount: a.authors?.length ?? 0,
      });
    }
    if (page >= res.meta.pagination.pageCount) break;
    page++;
  }
  return resultado.sort((a, b) => b.autoresCount - a.autoresCount);
}

// Autores con una actividad concreta (al hacer clic en una barra del
// gráfico de Análisis > Autores). Algunas actividades (ej. "Poeta") superan
// el límite de página del API, de ahí la paginación manual.
export async function getAuthorsByActividad(
  actividadSlug: string
): Promise<Pick<Author, "id" | "documentId" | "nombre" | "slug">[]> {
  const resultado: Pick<Author, "id" | "documentId" | "nombre" | "slug">[] = [];
  let page = 1;
  for (;;) {
    const res = await fetchAPI<StrapiListResponse<Author>>("/authors", {
      filters: { actividades: { slug: { $eq: actividadSlug } } },
      fields: ["nombre", "slug"],
      sort: ["nombre:asc"],
      pagination: { page, pageSize: 100 },
    });
    resultado.push(...res.data);
    if (page >= res.meta.pagination.pageCount) break;
    page++;
  }
  return resultado;
}

// Autores marcados para la galería de destacados (ver `destacado_galeria`
// / `orden_destacado_galeria` en el content-type Author), en el orden
// editorial definido en el backend.
export async function getAutoresDestacados() {
  const res = await fetchAPI<StrapiListResponse<Author>>("/authors", {
    filters: { destacado_galeria: { $eq: true } },
    populate: { imagen: true, articles: { fields: ["id"] } },
    sort: ["orden_destacado_galeria:asc"],
    pagination: { pageSize: 20 },
  });
  return res.data;
}

export async function getAuthor(slug: string) {
  const res = await fetchAPI<StrapiListResponse<Author>>("/authors", {
    filters: { slug: { $eq: slug } },
    populate: {
      imagen: true,
      actividades: { fields: ["nombre", "slug"] },
      articles: {
        populate: { issue: { populate: ["publication"] }, temas: true },
      },
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

// Total de artículos publicados en algún número de esta revista (para la
// ficha hemerográfica); pageSize:1 porque solo se necesita meta.pagination.total.
export async function getArticleCountByPublication(publicationSlug: string): Promise<number> {
  const res = await fetchAPI<StrapiListResponse<Article>>("/articles", {
    filters: {
      issue: { publication: { slug: { $eq: publicationSlug } } },
      es_anuncio: { $ne: true },
    },
    fields: ["id"],
    pagination: { page: 1, pageSize: 1 },
  });
  return res.meta.pagination.total;
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
  total_palabras: number;
  densidad_10k: number;
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

export interface PalabraFrecuencia {
  text: string;
  value: number;
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
  nube_palabras: {
    autor1: PalabraFrecuencia[];
    autor2: PalabraFrecuencia[];
  };
  interpretacion: string;
}

// Análisis estilométrico: calcula la distancia de coseno TF-IDF entre los
// corpus de dos autores y devuelve las palabras más características de cada
// uno. Prototipo en Node; en producción delegará en un microservicio Python.
export async function getEstilometria(
  slug1: string,
  slug2: string,
  incluirFuncionales = false
) {
  return fetchAPI<EstilometriaResponse>("/analisis/estilometria", {
    autor1: slug1,
    autor2: slug2,
    incluirFuncionales: incluirFuncionales ? "true" : undefined,
  });
}

export interface NubePalabrasAutorRevista {
  slug: string;
  titulo: string;
  num_articulos: number;
  palabras: PalabraFrecuencia[];
}

export interface NubePalabrasAutorResponse {
  autor: EstilometriaAutor;
  corpus_completo: PalabraFrecuencia[];
  revista: NubePalabrasAutorRevista | null;
}

// Nube de palabras del corpus completo de un autor, calculada a demanda
// desde la página de autor. Si se indica `revistaSlug`, además devuelve la
// nube acotada a esa revista para poder comparar ambas.
export async function getNubePalabrasAutor(autorSlug: string, revistaSlug?: string) {
  return fetchAPI<NubePalabrasAutorResponse>("/analisis/nube-palabras-autor", {
    autor: autorSlug,
    revista: revistaSlug || undefined,
  });
}

export interface NubePalabrasRevista {
  slug: string;
  titulo: string;
  num_articulos: number;
  palabras: PalabraFrecuencia[];
}

export interface NubePalabrasRevistaResponse {
  revista: NubePalabrasRevista;
  comparar: NubePalabrasRevista | null;
}

// Nube de palabras de todo el contenido publicado de una revista, calculada
// a demanda desde la página de revista. Si se indica `compararSlug`, además
// devuelve la nube de esa otra revista para poder comparar ambas.
export async function getNubePalabrasRevista(revistaSlug: string, compararSlug?: string) {
  return fetchAPI<NubePalabrasRevistaResponse>("/analisis/nube-palabras-revista", {
    revista: revistaSlug,
    comparar: compararSlug || undefined,
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

export interface InnovacionArticulo {
  slug: string;
  titulo: string;
}

export interface InnovacionPuntoTrayectoria {
  año: number;
  distancia: number;
  num_articulos: number;
  articulos: InnovacionArticulo[];
}

export interface InnovacionAutor {
  slug: string;
  nombre: string;
  color: string;
  num_articulos: number;
  aviso_pocos_datos: string | null;
  trayectoria: InnovacionPuntoTrayectoria[];
}

export interface InnovacionNorma {
  num_autores: number;
  num_articulos: number;
  media: number;
  std: number;
  aviso_pocos_datos: string | null;
}

export interface InnovacionEstilisticaResponse {
  norma: InnovacionNorma;
  autores: InnovacionAutor[];
}

// Innovación Estilística: deriva estilística de 1 a 4 autores respecto a la
// norma del corpus (centroide TF-IDF de todos los autores).
export async function getInnovacionEstilistica(
  slugs: string[],
  modo: "prosa" | "poesia" = "prosa"
) {
  return fetchAPI<InnovacionEstilisticaResponse>("/analisis/innovacion", {
    autores: slugs.join(","),
    modo,
  });
}

export async function getInterpretacionDeriva(payload: {
  modo: "prosa" | "poesia";
  norma: InnovacionNorma;
  autores: {
    nombre: string;
    num_articulos: number;
    trayectoria: { año: number; distancia: number }[];
  }[];
}): Promise<{ interpretacion: string }> {
  return postAPI("/analisis/interpretar-deriva", payload);
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

export type OperadorBooleano = "AND" | "OR" | "NOT";

export interface BuscarEnTextoFiltros {
  publicationSlug?: string;
  authorSlug?: string;
  yearFrom?: number;
  yearTo?: number;
  // Búsqueda avanzada (booleana): hasta 3 palabras encadenadas con
  // operadores Y/O/NO entre la 1ª-2ª y la 2ª-3ª, evaluados de izquierda a
  // derecha. operador2/palabra3 solo tienen efecto si operador1/palabra2
  // también están presentes.
  operador1?: OperadorBooleano;
  palabra2?: string;
  operador2?: OperadorBooleano;
  palabra3?: string;
  // Ámbito de la búsqueda: en qué campos se busca la palabra/frase. Si se
  // omiten, el backend asume que ambos están activos.
  enTituloAutor?: boolean;
  enTexto?: boolean;
  enPiesImagen?: boolean;
  // Slugs de tema: ninguno, uno o varios (combinados en OR por el backend).
  temas?: string[];
}

// Búsqueda exacta en el cuerpo completo de los artículos (frase literal),
// con los mismos filtros opcionales que la búsqueda general (revista, autor,
// rango de años) y un encadenado booleano opcional de hasta 3 palabras.
export async function buscarEnTexto(
  frase: string,
  page: number = 1,
  pageSize: number = 20,
  filtros: BuscarEnTextoFiltros = {}
): Promise<BusquedaTextoResponse> {
  const params = new URLSearchParams();
  params.set("q", frase);
  params.set("page", String(page));
  params.set("pageSize", String(pageSize));
  if (filtros.publicationSlug) params.set("revista", filtros.publicationSlug);
  if (filtros.authorSlug) params.set("autor", filtros.authorSlug);
  if (filtros.yearFrom !== undefined) params.set("desde", String(filtros.yearFrom));
  if (filtros.yearTo !== undefined) params.set("hasta", String(filtros.yearTo));
  if (filtros.operador1 && filtros.palabra2) {
    params.set("op1", filtros.operador1);
    params.set("q2", filtros.palabra2);
    if (filtros.operador2 && filtros.palabra3) {
      params.set("op2", filtros.operador2);
      params.set("q3", filtros.palabra3);
    }
  }
  if (filtros.enTituloAutor !== undefined) {
    params.set("enTituloAutor", filtros.enTituloAutor ? "true" : "false");
  }
  if (filtros.enTexto !== undefined) {
    params.set("enTexto", filtros.enTexto ? "true" : "false");
  }
  if (filtros.enPiesImagen) {
    params.set("enPiesImagen", "true");
  }
  if (filtros.temas && filtros.temas.length > 0) {
    params.set("temas", filtros.temas.join(","));
  }

  const res = await fetch(`${STRAPI_URL}/api/buscar/texto?${params.toString()}`);
  if (!res.ok) throw new Error("Error en la búsqueda de texto");
  return res.json();
}

export interface ResultadoBusquedaImagenes {
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

export interface BusquedaImagenesResponse {
  data: ResultadoBusquedaImagenes[];
  meta: { total: number; page: number; pageSize: number; pageCount: number };
}

export async function buscarImagenes(
  q: string,
  page: number = 1,
  pageSize: number = 20,
  filtros: { publicationSlug?: string; authorSlug?: string; yearFrom?: number; yearTo?: number } = {}
): Promise<BusquedaImagenesResponse> {
  const params = new URLSearchParams();
  params.set("q", q);
  params.set("page", String(page));
  params.set("pageSize", String(pageSize));
  if (filtros.publicationSlug) params.set("revista", filtros.publicationSlug);
  if (filtros.authorSlug)      params.set("autor",   filtros.authorSlug);
  if (filtros.yearFrom !== undefined) params.set("desde", String(filtros.yearFrom));
  if (filtros.yearTo   !== undefined) params.set("hasta", String(filtros.yearTo));
  const res = await fetch(`${STRAPI_URL}/api/buscar/imagenes?${params.toString()}`);
  if (!res.ok) throw new Error("Error en la búsqueda de imágenes");
  return res.json();
}

export interface ResultadoBusquedaSemantica {
  id: number;
  titulo: string;
  slug: string;
  autores: string[];
  revista: string;
  revista_slug: string;
  numero_orden: number | null;
  año: number | null;
  fragmento: string;
  similitud: number;
}

export interface BusquedaSemanticaResponse {
  data: ResultadoBusquedaSemantica[];
  meta: { total: number; page: number; pageSize: number; pageCount: number };
}

export async function buscarSemantico(
  q: string,
  page: number = 1,
  pageSize: number = 20,
  filtros: {
    publicationSlug?: string;
    authorSlug?: string;
    yearFrom?: number;
    yearTo?: number;
    temas?: string[];
  } = {}
): Promise<BusquedaSemanticaResponse> {
  const params = new URLSearchParams();
  params.set("q", q);
  params.set("page", String(page));
  params.set("pageSize", String(pageSize));
  if (filtros.publicationSlug) params.set("revista", filtros.publicationSlug);
  if (filtros.authorSlug)      params.set("autor",   filtros.authorSlug);
  if (filtros.yearFrom !== undefined) params.set("desde", String(filtros.yearFrom));
  if (filtros.yearTo   !== undefined) params.set("hasta", String(filtros.yearTo));
  if (filtros.temas && filtros.temas.length > 0) params.set("temas", filtros.temas.join(","));
  const res = await fetch(`${STRAPI_URL}/api/buscar/semantico?${params.toString()}`);
  if (!res.ok) throw new Error("Error en la búsqueda semántica");
  return res.json();
}

export interface BuscarMorfologicaFiltros {
  publicationSlug?: string;
  authorSlug?: string;
  yearFrom?: number;
  yearTo?: number;
  enTituloAutor?: boolean;
  enTexto?: boolean;
  // Si se indican ambos, en vez de ocurrencias sueltas de `palabra` se busca
  // la proximidad entre `palabra` y `palabra2` (a un máximo de `distancia`
  // palabras de separación) en el cuerpo de cada artículo.
  palabra2?: string;
  distancia?: number;
}

// Búsqueda con expansión morfológica: el backend reduce la palabra (o las
// dos palabras) buscada(s) y cada palabra del texto a su raíz (stemming en
// español) para encontrar también conjugaciones y variantes de número, no
// solo la forma literal escrita.
export async function buscarMorfologica(
  palabra: string,
  page: number = 1,
  pageSize: number = 20,
  filtros: BuscarMorfologicaFiltros = {}
): Promise<BusquedaTextoResponse> {
  const params = new URLSearchParams();
  params.set("palabra", palabra);
  params.set("page", String(page));
  params.set("pageSize", String(pageSize));
  if (filtros.publicationSlug) params.set("revista", filtros.publicationSlug);
  if (filtros.authorSlug) params.set("autor", filtros.authorSlug);
  if (filtros.yearFrom !== undefined) params.set("desde", String(filtros.yearFrom));
  if (filtros.yearTo !== undefined) params.set("hasta", String(filtros.yearTo));
  if (filtros.enTituloAutor !== undefined) {
    params.set("enTituloAutor", filtros.enTituloAutor ? "true" : "false");
  }
  if (filtros.enTexto !== undefined) {
    params.set("enTexto", filtros.enTexto ? "true" : "false");
  }
  if (filtros.palabra2) params.set("palabra2", filtros.palabra2);
  if (filtros.distancia !== undefined) params.set("distancia", String(filtros.distancia));

  const res = await fetch(`${STRAPI_URL}/api/analisis/morfologica?${params.toString()}`);
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error?.message ?? "Error en la búsqueda morfológica");
  }
  return res.json();
}

export interface ProbabilidadToken {
  token: string;
  frecuencia: number;
  probabilidad: number;
}

export interface ProbabilidadTokenConDesviacion extends ProbabilidadToken {
  probabilidadCorpus: number;
  desviacion: number;
}

export interface InterpretacionEntropia {
  nivel: "insuficiente" | "convencional" | "moderado" | "variado" | "innovador";
  texto: string;
  fiable: boolean;
}

export interface CadenasLexicasAutor {
  slug: string;
  sucesores?: ProbabilidadTokenConDesviacion[];
  predecesores?: ProbabilidadToken[];
  entropia?: number;
  desviacionEntropia?: number;
  frecuenciaTotal?: number;
  fiable?: boolean;
  frecuenciaMinima?: number;
  entropiaNormalizada?: number;
  entropiaMaxima?: number;
  interpretacion?: InterpretacionEntropia;
  sinDatos?: boolean;
  sinArticulosEnEspanol?: boolean;
}

export interface CadenasLexicasResponse {
  palabra: string;
  corpus: {
    sucesores: ProbabilidadToken[];
    predecesores: ProbabilidadToken[];
    entropia: number;
    frecuenciaTotal: number;
    fiable: boolean;
    frecuenciaMinima: number;
    entropiaNormalizada: number;
    entropiaMaxima: number;
    interpretacion: InterpretacionEntropia;
  };
  autor: CadenasLexicasAutor | null;
  metadatos: {
    fechaConstruccionIndice: string | null;
    totalArticulos: number;
    totalTokens: number;
  };
}

// Cadenas léxicas: probabilidad de que una palabra vaya seguida/precedida de
// otra en el corpus (y opcionalmente en los textos de un autor concreto),
// con su entropía de Shannon como medida de variedad de uso. El backend
// construye y cachea en memoria un índice de bigramas bajo demanda.
export async function getCadenasLexicas(
  palabra: string,
  autorSlug?: string,
  reconstruir?: boolean
): Promise<CadenasLexicasResponse> {
  const params = new URLSearchParams({ palabra });
  if (autorSlug) params.set("autorSlug", autorSlug);
  if (reconstruir) params.set("reconstruir", "true");

  const res = await fetch(`${STRAPI_URL}/api/analisis/cadenas-lexicas?${params.toString()}`);
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error?.message ?? "Error al calcular cadenas léxicas");
  }
  return res.json();
}

// --- Análisis de Publicidad ---

export interface DistribucionRevista {
  revista: string;
  slug: string;
  num_anuncios: number;
}

export interface DistribucionAño {
  año: number;
  num_anuncios: number;
}

export interface PublicidadFrecuenciaResponse {
  total_anuncios: number;
  total_anuncios_filtrados: number;
  palabras: PalabraFrecuencia[];
  por_revista: DistribucionRevista[];
  por_año: DistribucionAño[];
}

// Tab 1 (frecuencia y distribución): palabras más frecuentes del texto OCR
// de los anuncios, acotables a una revista y/o año, más la distribución
// completa (sin acotar) por revista y por año.
export async function getPublicidadFrecuencia(revistaSlug?: string, año?: number) {
  return fetchAPI<PublicidadFrecuenciaResponse>("/analisis/publicidad/frecuencia", {
    revista: revistaSlug || undefined,
    año: año || undefined,
  });
}

export interface CategoriaTecnologica {
  categoria: string;
  grupo: string;
  palabras_clave: string[];
  serie: DistribucionAño[];
}

export interface PublicidadTendenciasResponse {
  total_anuncios: number;
  categorias: CategoriaTecnologica[];
}

export async function getPublicidadTendencias(publicacionSlug?: string) {
  return fetchAPI<PublicidadTendenciasResponse>("/analisis/publicidad/tendencias", {
    ...(publicacionSlug ? { publicacion: publicacionSlug } : {}),
  });
}

export interface PublicidadPublicacion {
  slug: string;
  titulo: string;
  num_anuncios: number;
}

export async function getPublicidadPublicaciones() {
  return fetchAPI<{ publicaciones: PublicidadPublicacion[] }>(
    "/analisis/publicidad/publicaciones",
    {}
  );
}

export interface CategoriaTecnologicaDB {
  id: number;
  nombre: string;
  concepto: string;
  activa: boolean;
}

export async function getListarCategorias() {
  return fetchAPI<{ categorias: CategoriaTecnologicaDB[] }>("/analisis/publicidad/categorias", {});
}

export async function postDescubrirCategorias() {
  return postAPI<{ sugerencias: { nombre: string; concepto: string }[] }>(
    "/analisis/publicidad/descubrir-categorias",
    {}
  );
}

export async function postGuardarCategorias(categorias: { nombre: string; concepto: string }[]) {
  return postAPI<{ insertadas: number }>("/analisis/publicidad/guardar-categorias", { categorias });
}

export async function postToggleCategoria(id: number) {
  return postAPI<{ id: number; activa: boolean }>("/analisis/publicidad/toggle-categoria", { id });
}

export interface PublicidadCadenasLexicasResponse {
  palabra: string;
  corpus: {
    sucesores: ProbabilidadToken[];
    predecesores: ProbabilidadToken[];
    entropia: number;
    frecuenciaTotal: number;
    fiable: boolean;
    frecuenciaMinima: number;
    entropiaNormalizada: number;
    entropiaMaxima: number;
    interpretacion: InterpretacionEntropia;
  };
  por_revista: { revista: string; slug: string; frecuencia: number }[];
  metadatos: {
    fechaConstruccionIndice: string | null;
    totalArticulos: number;
    totalTokens: number;
  };
}

// Tab 3 (lenguaje publicitario): igual que getCadenasLexicas, pero contra
// el índice de SOLO anuncios (sin desglose por autor).
export async function getPublicidadCadenasLexicas(palabra: string, reconstruir?: boolean) {
  const params = new URLSearchParams({ palabra });
  if (reconstruir) params.set("reconstruir", "true");

  const res = await fetch(`${STRAPI_URL}/api/analisis/publicidad/cadenas-lexicas?${params.toString()}`);
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error?.message ?? "Error al calcular las cadenas léxicas de la publicidad");
  }
  return res.json() as Promise<PublicidadCadenasLexicasResponse>;
}

export interface PublicidadVanguardiaResponse {
  anuncios: { num_articulos: number };
  literatura: { num_articulos: number };
  distancia_coseno: number;
  similitud_coseno: number;
  palabras_caracteristicas: {
    anuncios: PalabraCaracteristica[];
    literatura: PalabraCaracteristica[];
  };
  nube_palabras: {
    anuncios: PalabraFrecuencia[];
    literatura: PalabraFrecuencia[];
  };
  interpretacion: string;
}

// Tab 4 (influencia de vanguardia): compara, con el mismo TF-IDF + distancia
// de coseno que estilometria, el corpus de anuncios contra el literario
// (artículos que no son anuncios), acotable a una revista y, dentro de
// ella, a un número concreto.
export async function getPublicidadVanguardia(revistaSlug?: string, numeroOrden?: number) {
  return fetchAPI<PublicidadVanguardiaResponse>("/analisis/publicidad/vanguardia", {
    revista: revistaSlug || undefined,
    numero_orden: numeroOrden || undefined,
  });
}

// Validador manual de es_poema/es_obra_grafica (herramienta interna, sin
// enlazar desde la navegación): lista los artículos de una revista para
// corregir a mano los falsos positivos/negativos de ambos clasificadores.
export interface ArticuloValidador {
  documentId: string;
  titulo: string;
  slug: string;
  es_poema: boolean;
  es_obra_grafica: boolean;
  numero_orden: number | null;
  posicion: number | null;
}

export async function getValidadorArticulos(revistaSlug: string) {
  return fetchAPI<{ data: ArticuloValidador[] }>("/analisis/validador/articulos", {
    revista: revistaSlug,
  });
}

export async function guardarValidadorTipos(
  cambios: { documentId: string; es_poema: boolean; es_obra_grafica: boolean }[]
) {
  return postAPI<{ actualizados: number }>("/analisis/validador/guardar", { cambios });
}

// Validador de temas dudosos: solo los artículos a los que la clasificación
// automática con LLM les asignó más de un tema (el propio modelo detectó
// ambigüedad), para revisarlos a mano con checkboxes multi-selección.
export interface ArticuloValidadorTema {
  documentId: string;
  titulo: string;
  slug: string;
  revista: string | null;
  temas: { documentId: string; nombre: string }[];
}

export async function getTemas() {
  return fetchAPI<StrapiListResponse<Tema>>("/temas", {
    sort: ["nombre:asc"],
    pagination: { pageSize: 50 },
  });
}

export async function getValidadorTemasArticulos() {
  return fetchAPI<{ data: ArticuloValidadorTema[] }>("/analisis/validador-temas/articulos", {});
}

export async function guardarValidadorTemas(
  cambios: { documentId: string; temaIds: string[] }[]
) {
  return postAPI<{ actualizados: number }>("/analisis/validador-temas/guardar", { cambios });
}
