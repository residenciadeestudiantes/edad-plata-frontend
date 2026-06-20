// DATOS DE MUESTRA para validación del prototipo.
// En producción se calcularán desde el corpus real vía API.

export const REVISTAS_TIMELINE = [
  { revista: "Revista de Occidente", inicio: 1923, fin: 1936, color: "#DA3C00" },
  { revista: "La Gaceta Literaria", inicio: 1927, fin: 1932, color: "#3838BD" },
  { revista: "Litoral", inicio: 1926, fin: 1929, color: "#008867" },
  { revista: "Mediodía", inicio: 1926, fin: 1929, color: "#DD158B" },
  { revista: "Verso y Prosa", inicio: 1927, fin: 1928, color: "#FF7D45" },
  { revista: "Carmen", inicio: 1927, fin: 1928, color: "#45D2FF" },
  { revista: "Meseta", inicio: 1928, fin: 1928, color: "#00EDB4" },
  { revista: "Cruz y Raya", inicio: 1933, fin: 1936, color: "#FF65C1" },
];

export const AUTORES_BURBUJAS = [
  { autor: "Federico García Lorca", articulos: 47, revista: "Revista de Occidente", color: "#DA3C00" },
  { autor: "Rafael Alberti", articulos: 38, revista: "La Gaceta Literaria", color: "#3838BD" },
  { autor: "Jorge Guillén", articulos: 42, revista: "Litoral", color: "#008867" },
  { autor: "Pedro Salinas", articulos: 35, revista: "Revista de Occidente", color: "#DA3C00" },
  { autor: "Gerardo Diego", articulos: 51, revista: "Carmen", color: "#FF7D45" },
  { autor: "Vicente Aleixandre", articulos: 29, revista: "Revista de Occidente", color: "#DA3C00" },
  { autor: "Dámaso Alonso", articulos: 33, revista: "Revista de Occidente", color: "#DA3C00" },
  { autor: "Luis Cernuda", articulos: 24, revista: "Litoral", color: "#008867" },
  { autor: "Emilio Prados", articulos: 31, revista: "Litoral", color: "#008867" },
  { autor: "Manuel Altolaguirre", articulos: 28, revista: "Litoral", color: "#008867" },
  { autor: "José Bergamín", articulos: 44, revista: "Cruz y Raya", color: "#FF65C1" },
  { autor: "León Felipe", articulos: 19, revista: "La Gaceta Literaria", color: "#3838BD" },
];

export const AUTORES_MULTIREVISTA = [
  { autor: "Gerardo Diego", revistas: 6 },
  { autor: "Federico García Lorca", revistas: 5 },
  { autor: "José Bergamín", revistas: 4 },
  { autor: "Rafael Alberti", revistas: 4 },
  { autor: "Pedro Salinas", revistas: 3 },
  { autor: "Jorge Guillén", revistas: 3 },
  { autor: "Dámaso Alonso", revistas: 3 },
  { autor: "Vicente Aleixandre", revistas: 2 },
  { autor: "Luis Cernuda", revistas: 2 },
  { autor: "Manuel Altolaguirre", revistas: 2 },
];

export const VOCABULARIO_QUINQUENIOS = [
  {
    periodo: "1920-1924",
    terminos: [
      { palabra: "modernismo", frecuencia: 89 },
      { palabra: "poesía", frecuencia: 134 },
      { palabra: "arte", frecuencia: 112 },
      { palabra: "espíritu", frecuencia: 78 },
      { palabra: "belleza", frecuencia: 67 },
    ],
  },
  {
    periodo: "1925-1929",
    terminos: [
      { palabra: "vanguardia", frecuencia: 143 },
      { palabra: "imagen", frecuencia: 156 },
      { palabra: "surrealismo", frecuencia: 98 },
      { palabra: "metáfora", frecuencia: 87 },
      { palabra: "creación", frecuencia: 112 },
    ],
  },
  {
    periodo: "1930-1936",
    terminos: [
      { palabra: "pueblo", frecuencia: 178 },
      { palabra: "revolución", frecuencia: 134 },
      { palabra: "libertad", frecuencia: 145 },
      { palabra: "social", frecuencia: 167 },
      { palabra: "España", frecuencia: 198 },
    ],
  },
];

export const DERIVA_ESTILISTCA = [
  {
    autor: "Federico García Lorca",
    color: "#DA3C00",
    trayectoria: [
      { año: 1920, distancia: 0.41 },
      { año: 1923, distancia: 0.52 },
      { año: 1926, distancia: 0.67 },
      { año: 1929, distancia: 0.79 },
      { año: 1933, distancia: 0.89 },
      { año: 1936, distancia: 0.94 },
    ],
  },
  {
    autor: "Jorge Guillén",
    color: "#3838BD",
    trayectoria: [
      { año: 1920, distancia: 0.28 },
      { año: 1923, distancia: 0.31 },
      { año: 1926, distancia: 0.29 },
      { año: 1929, distancia: 0.33 },
      { año: 1933, distancia: 0.3 },
      { año: 1936, distancia: 0.32 },
    ],
  },
  {
    autor: "Rafael Alberti",
    color: "#008867",
    trayectoria: [
      { año: 1920, distancia: 0.35 },
      { año: 1923, distancia: 0.41 },
      { año: 1926, distancia: 0.58 },
      { año: 1929, distancia: 0.72 },
      { año: 1933, distancia: 0.81 },
      { año: 1936, distancia: 0.88 },
    ],
  },
];
