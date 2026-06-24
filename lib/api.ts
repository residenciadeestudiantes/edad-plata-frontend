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
  notas: string | null;
  metadatos_marc21: string | null;
  periodicidad: string | null;
  numeros_publicados: number | null;
  fecha_primer_numero: string | null;
  fecha_ultimo_numero: string | null;
  issn: string | null;
  idioma: string | null;
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
  idioma: string | null;
  es_anuncio: boolean | null;
  texto_ocr_anuncios: string | null;
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
    filters: { latitud: { $notNull: true }, longitud: { $notNull: true } },
    fields: ["titulo", "slug", "lugar_publicacion", "latitud", "longitud", "año_inicio", "año_fin"],
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

export interface InnovacionPuntoTrayectoria {
  año: number;
  distancia: number;
  num_articulos: number;
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
  aviso_pocos_datos: string | null;
}

export interface InnovacionEstilisticaResponse {
  norma: InnovacionNorma;
  autores: InnovacionAutor[];
}

// Innovación Estilística: deriva estilística de 1 a 4 autores respecto a la
// norma del corpus (centroide TF-IDF de todos los autores).
export async function getInnovacionEstilistica(slugs: string[]) {
  return fetchAPI<InnovacionEstilisticaResponse>("/analisis/innovacion", {
    autores: slugs.join(","),
  });
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

  const res = await fetch(`${STRAPI_URL}/api/buscar/texto?${params.toString()}`);
  if (!res.ok) throw new Error("Error en la búsqueda de texto");
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
