import { authFetch } from "./auth";
import type { Author, Issue } from "./api";

// "Mis Proyectos": carpetas privadas donde un usuario registrado guarda
// artículos ya publicados del sitio (backend/src/api/proyecto).

export interface Proyecto {
  id: number;
  documentId: string;
  nombre: string;
}

export interface ArticuloGuardado {
  id: number;
  documentId: string;
  titulo: string;
  slug: string;
  texto_plano: string | null;
  pagina_inicio: number | null;
  pagina_fin: number | null;
  issue?: Issue;
  authors?: Author[];
}

async function parseJson<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(body?.error?.message || `Error ${res.status}`);
  }
  return body;
}

export async function listarProyectos(): Promise<Proyecto[]> {
  const res = await authFetch("/api/proyectos");
  const body = await parseJson<{ data: Proyecto[] }>(res);
  return body.data;
}

export async function crearProyecto(nombre: string): Promise<Proyecto> {
  const res = await authFetch("/api/proyectos", {
    method: "POST",
    body: JSON.stringify({ nombre }),
  });
  const body = await parseJson<{ data: Proyecto }>(res);
  return body.data;
}

export async function renombrarProyecto(documentId: string, nombre: string): Promise<Proyecto> {
  const res = await authFetch(`/api/proyectos/${documentId}`, {
    method: "PUT",
    body: JSON.stringify({ nombre }),
  });
  const body = await parseJson<{ data: Proyecto }>(res);
  return body.data;
}

export async function eliminarProyecto(documentId: string): Promise<void> {
  const res = await authFetch(`/api/proyectos/${documentId}`, { method: "DELETE" });
  await parseJson(res);
}

export async function listarArticulosDeProyecto(documentId: string): Promise<ArticuloGuardado[]> {
  const res = await authFetch(`/api/proyectos/${documentId}/articulos`);
  const body = await parseJson<{ data: ArticuloGuardado[] }>(res);
  return body.data;
}

export async function agregarArticuloAProyecto(documentId: string, articleId: number): Promise<void> {
  const res = await authFetch(`/api/proyectos/${documentId}/articulos`, {
    method: "POST",
    body: JSON.stringify({ articleId }),
  });
  await parseJson(res);
}

export async function quitarArticuloDeProyecto(documentId: string, articleId: number): Promise<void> {
  const res = await authFetch(`/api/proyectos/${documentId}/articulos/${articleId}`, {
    method: "DELETE",
  });
  await parseJson(res);
}
