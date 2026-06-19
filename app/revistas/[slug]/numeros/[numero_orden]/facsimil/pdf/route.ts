import { getIssueByNumeroOrden, getStrapiMediaUrl } from "@/lib/api";

// Sirve de proxy del PDF del facsímil para no exponer la URL directa del
// backend de Strapi al cliente (el visor en /facsimil sólo conoce esta ruta).
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string; numero_orden: string }> }
) {
  const { slug, numero_orden } = await params;
  const issue = await getIssueByNumeroOrden(slug, Number(numero_orden));

  const pdfUrl = getStrapiMediaUrl(issue?.url_facsimil);

  if (!pdfUrl) {
    return new Response("Facsímil no encontrado", { status: 404 });
  }

  const upstream = await fetch(pdfUrl);

  if (!upstream.ok || !upstream.body) {
    return new Response("No se ha podido obtener el facsímil", {
      status: 502,
    });
  }

  return new Response(upstream.body, {
    headers: {
      "Content-Type": "application/pdf",
      "Cache-Control": "private, max-age=300",
      "Content-Disposition": "inline",
    },
  });
}
