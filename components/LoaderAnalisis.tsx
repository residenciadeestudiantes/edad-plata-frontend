const COLOR_CLASSES = {
  azul: "bg-azul dark:bg-azul-claro",
  teja: "bg-teja dark:bg-teja-claro",
};

// Indicador de carga común a todos los análisis: mensaje + porcentaje
// (simulado, ver useProgresoSimulado) + barra de progreso + aviso de que
// el proceso puede tardar, dado el volumen de datos del corpus.
export function LoaderAnalisis({
  progreso,
  mensaje = "Analizando el corpus…",
  color = "azul",
}: {
  progreso: number;
  mensaje?: string;
  color?: keyof typeof COLOR_CLASSES;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-6 text-center text-sm font-light text-zinc-500">
      <p>
        {mensaje} {Math.round(progreso)}%
      </p>
      <div className="h-1.5 w-full max-w-md overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
        <div
          className={`h-full rounded-full transition-all duration-300 ease-out ${COLOR_CLASSES[color]}`}
          style={{ width: `${progreso}%` }}
        />
      </div>
      <p className="text-xs text-zinc-400 dark:text-zinc-500">
        Debido a la cantidad de datos, este proceso puede tardar más de la cuenta.
      </p>
    </div>
  );
}
