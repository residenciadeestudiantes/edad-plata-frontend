export interface CampoMarc21 {
  etiqueta: string;
  contenido: string;
}

// Los metadatos MARC21 se guardan como texto plano, una línea por campo
// (p. ej. "245 00 $a La Gaceta Literaria"). Para el CSV separamos la
// etiqueta de 3 cifras del resto del contenido del campo.
export function parseMarc21(texto: string): CampoMarc21[] {
  return texto
    .split("\n")
    .map((linea) => linea.trim())
    .filter((linea) => linea.length > 0)
    .map((linea) => {
      const match = linea.match(/^(\d{3})\s+(.*)$/);
      return match
        ? { etiqueta: match[1], contenido: match[2] }
        : { etiqueta: "", contenido: linea };
    });
}
