export const STOPWORDS = new Set([
  // Artículos
  'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas',
  // Preposiciones
  'a', 'ante', 'bajo', 'con', 'contra', 'de', 'desde', 'durante', 'en', 'entre',
  'hacia', 'hasta', 'mediante', 'para', 'por', 'según', 'sin', 'sobre', 'tras',
  // Conjunciones
  'y', 'e', 'ni', 'o', 'u', 'pero', 'sino', 'aunque', 'porque', 'pues', 'que',
  'si', 'como', 'cuando', 'donde', 'mientras', 'aunque', 'sino',
  // Pronombres
  'yo', 'tú', 'él', 'ella', 'nosotros', 'vosotros', 'ellos', 'ellas',
  'me', 'te', 'se', 'nos', 'os', 'le', 'les', 'lo', 'la', 'los', 'las',
  'mi', 'tu', 'su', 'nuestro', 'vuestro', 'este', 'ese', 'aquel',
  'esto', 'eso', 'aquello', 'quien', 'quién', 'cual', 'cuál', 'qué', 'que',
  // Verbos auxiliares y copulativos comunes
  'ser', 'estar', 'haber', 'tener', 'hacer', 'poder', 'deber', 'querer',
  'es', 'son', 'era', 'eran', 'fue', 'fueron', 'sido', 'siendo',
  'está', 'están', 'estaba', 'estaban', 'estuvo', 'estuvieron',
  'ha', 'han', 'había', 'habían', 'hubo', 'hubieron',
  'tiene', 'tienen', 'tenía', 'tenían', 'tuvo', 'tuvieron',
  'hace', 'hacen', 'hacía', 'hacían', 'hizo', 'hicieron',
  // Adverbios frecuentes
  'no', 'sí', 'también', 'tampoco', 'muy', 'más', 'menos', 'tan', 'tanto',
  'ya', 'aún', 'todavía', 'siempre', 'nunca', 'jamás', 'aquí', 'ahí', 'allí',
  'hoy', 'ayer', 'mañana', 'antes', 'después', 'entonces', 'así', 'bien', 'mal',
  // Determinantes y cuantificadores
  'todo', 'toda', 'todos', 'todas', 'mismo', 'misma', 'mismos', 'mismas',
  'otro', 'otra', 'otros', 'otras', 'cada', 'cualquier', 'algún', 'alguna',
  'ningún', 'ninguna', 'poco', 'mucho', 'varios', 'bastante',
  // Palabras muy frecuentes en textos históricos
  'don', 'doña', 'señor', 'señora', 'doctor', 'parte', 'vez', 'año', 'años',
  'día', 'días', 'casa', 'manera', 'forma', 'caso', 'tiempo', 'momento',
  'modo', 'lugar', 'vida', 'obra', 'gran', 'grande', 'pequeño', 'nuevo',
  'nueva', 'primer', 'primera', 'segundo', 'última', 'último',
  // Signos y partículas
  'al', 'del', 'lo', 'le', 'les', 'hay', 'ser', 'han', 'sido', 'está',
]);

// Limpia el HTML y devuelve los tokens ya filtrados (sin stopwords ni
// palabras de 3 letras o menos). Compartido por extraerPalabras y
// contarPalabrasFiltradas para no duplicar la limpieza del texto.
function tokenizarYFiltrar(html: string): string[] {
  // 1. Decodificar entidades HTML y eliminar etiquetas
  const sinEntidades = html
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&mdash;/g, '—')
    .replace(/&[a-z]+;/g, ' ');
  const texto = sinEntidades.replace(/<[^>]+>/g, ' ');
  // 2. Convertir a minúsculas y eliminar puntuación
  const limpio = texto.toLowerCase().replace(/[^a-záéíóúüñ\s]/g, ' ');
  // 3. Tokenizar
  const palabras = limpio.split(/\s+/).filter((p) => p.length > 3);
  // 4. Filtrar stopwords
  return palabras.filter((p) => !STOPWORDS.has(p));
}

// Número de palabras que quedan tras quitar etiquetas, puntuación y
// stopwords (antes de agrupar por frecuencia). Sirve para decidir si hay
// suficiente texto como para que la nube de palabras tenga sentido.
export function contarPalabrasFiltradas(html: string): number {
  return tokenizarYFiltrar(html).length;
}

// Extrae las palabras más frecuentes de un texto HTML, excluyendo stopwords,
// para alimentar la nube de palabras del artículo.
export function extraerPalabras(html: string): { text: string; value: number }[] {
  const filtradas = tokenizarYFiltrar(html);
  // 5. Contar frecuencias
  const frecuencias = new Map<string, number>();
  filtradas.forEach((p) => frecuencias.set(p, (frecuencias.get(p) || 0) + 1));
  // 6. Convertir a array, ordenar por frecuencia, tomar top 80
  return Array.from(frecuencias.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 80)
    .map(([text, value]) => ({ text, value }));
}
