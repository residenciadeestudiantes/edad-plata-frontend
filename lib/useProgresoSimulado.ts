import { useEffect, useState } from "react";

// No hay progreso real que reportar desde el backend (una única petición
// HTTP por análisis): mientras `cargando` es true, el progreso se acerca a
// 90% cada vez más despacio (nunca llega a completarse solo), y salta a
// 100% en cuanto `cargando` pasa a false. Solo da una sensación de avance
// en procesos largos, no un porcentaje exacto.
export function useProgresoSimulado(cargando: boolean): number {
  const [progreso, setProgreso] = useState(0);

  useEffect(() => {
    if (!cargando) return;

    setProgreso(0);
    const intervalo = setInterval(() => {
      setProgreso((p) => (p >= 90 ? p : p + (90 - p) * 0.1));
    }, 300);

    return () => {
      clearInterval(intervalo);
      setProgreso(100);
    };
  }, [cargando]);

  return progreso;
}
