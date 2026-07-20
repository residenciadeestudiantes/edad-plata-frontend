// Sesión de usuario registrado (backend/src/api/cuenta): usada hoy solo
// para exigir sesión en /analisis (ver AnalisisGate.tsx) en vez de la
// contraseña fija provisional que había antes.

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL ?? "http://localhost:1337";
const TOKEN_KEY = "edad-plata-jwt";

export interface SessionUser {
  id: number;
  email: string;
  nombre: string;
  apellidos: string;
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

function setToken(jwt: string) {
  window.localStorage.setItem(TOKEN_KEY, jwt);
}

export function logout() {
  window.localStorage.removeItem(TOKEN_KEY);
}

async function parseAuthResponse(res: Response): Promise<{ jwt: string; user: SessionUser }> {
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(body?.error?.message || `Error ${res.status}`);
  }
  return body;
}

export async function login(email: string, password: string): Promise<SessionUser> {
  const res = await fetch(`${STRAPI_URL}/api/auth/local`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier: email, password }),
  });
  const body = await parseAuthResponse(res);
  setToken(body.jwt);
  return body.user;
}

export async function registrar(
  nombre: string,
  apellidos: string,
  email: string,
  password: string
): Promise<SessionUser> {
  const res = await fetch(`${STRAPI_URL}/api/cuenta/registro`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nombre, apellidos, email, password }),
  });
  const body = await parseAuthResponse(res);
  setToken(body.jwt);
  return body.user;
}

// Comprueba que el JWT guardado sigue siendo válido llamando a un endpoint
// autenticado; si no lo es (caducado, cuenta eliminada), limpia el token.
export async function getSesionActual(): Promise<SessionUser | null> {
  const token = getToken();
  if (!token) return null;

  const res = await fetch(`${STRAPI_URL}/api/users/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    logout();
    return null;
  }

  return res.json();
}

async function parseJsonResponse<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(body?.error?.message || `Error ${res.status}`);
  }
  return body;
}

// Adjunta el JWT guardado (si existe) a cualquier llamada al backend.
// Usado por lib/proyectos.ts para las operaciones sobre "Mis Proyectos".
export function authFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = getToken();
  return fetch(`${STRAPI_URL}${path}`, {
    ...init,
    headers: {
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
}

export async function actualizarCuenta(
  datos: Partial<Pick<SessionUser, "nombre" | "apellidos" | "email">>
): Promise<SessionUser> {
  const res = await authFetch("/api/cuenta/me", {
    method: "PUT",
    body: JSON.stringify(datos),
  });
  return parseJsonResponse<SessionUser>(res);
}

export async function eliminarCuenta(): Promise<void> {
  const res = await authFetch("/api/cuenta/me", { method: "DELETE" });
  await parseJsonResponse(res);
  logout();
}
