"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  PDFDocumentLoadingTask,
  PDFDocumentProxy,
  RenderTask,
} from "pdfjs-dist";
import { applyPdfJsCompatPolyfills } from "@/lib/pdfjsCompatPolyfills";

const MIN_SCALE = 0.5;
const MAX_SCALE = 3;
const SCALE_STEP = 0.25;

export function PdfViewer({ pdfUrl }: { pdfUrl: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const loadingTaskRef = useRef<PDFDocumentLoadingTask | null>(null);
  const pdfDocRef = useRef<PDFDocumentProxy | null>(null);
  const renderTaskRef = useRef<RenderTask | null>(null);

  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading"
  );
  const [loadProgress, setLoadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.2);

  // Carga el documento PDF una sola vez.
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        applyPdfJsCompatPolyfills();
        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.entry.mjs";

        const loadingTask = pdfjsLib.getDocument({ url: pdfUrl });
        loadingTaskRef.current = loadingTask;
        loadingTask.onProgress = (progress: { loaded: number; total: number }) => {
          if (progress.total > 0) {
            setLoadProgress(Math.min(100, Math.round((progress.loaded / progress.total) * 100)));
          }
        };

        const pdfDoc = await loadingTask.promise;
        if (cancelled) {
          loadingTask.destroy();
          return;
        }

        pdfDocRef.current = pdfDoc;
        setNumPages(pdfDoc.numPages);
        setStatus("ready");
      } catch (error) {
        if (cancelled) return;
        console.error("Error al cargar el facsímil", error);
        setErrorMessage(
          "No se ha podido cargar el facsímil. Inténtalo de nuevo más tarde."
        );
        setStatus("error");
      }
    }

    load();

    return () => {
      cancelled = true;
      loadingTaskRef.current?.destroy();
      loadingTaskRef.current = null;
      pdfDocRef.current = null;
    };
  }, [pdfUrl]);

  const renderPage = useCallback(async () => {
    const pdfDoc = pdfDocRef.current;
    const canvas = canvasRef.current;
    if (!pdfDoc || !canvas || status !== "ready") return;

    renderTaskRef.current?.cancel();

    const page = await pdfDoc.getPage(currentPage);
    const viewport = page.getViewport({ scale });

    const context = canvas.getContext("2d");
    if (!context) return;

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const renderTask = page.render({ canvas, canvasContext: context, viewport });
    renderTaskRef.current = renderTask;

    try {
      await renderTask.promise;
    } catch (error) {
      const name = (error as { name?: string } | null)?.name;
      if (name !== "RenderingCancelledException") {
        console.error("Error al renderizar la página", error);
      }
    }
  }, [currentPage, scale, status]);

  useEffect(() => {
    renderPage();
  }, [renderPage]);

  function goToPreviousPage() {
    setCurrentPage((page) => Math.max(1, page - 1));
  }

  function goToNextPage() {
    setCurrentPage((page) => Math.min(numPages, page + 1));
  }

  function zoomIn() {
    setScale((value) => Math.min(MAX_SCALE, Number((value + SCALE_STEP).toFixed(2))));
  }

  function zoomOut() {
    setScale((value) => Math.max(MIN_SCALE, Number((value - SCALE_STEP).toFixed(2))));
  }

  if (status === "error") {
    return (
      <div className="flex min-h-[400px] flex-1 items-center justify-center rounded-lg border border-zinc-200 p-12 text-center text-zinc-500 dark:border-zinc-800">
        {errorMessage}
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goToPreviousPage}
            disabled={status !== "ready" || currentPage <= 1}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm transition-colors hover:bg-zinc-100 disabled:pointer-events-none disabled:opacity-40 dark:border-zinc-700 dark:hover:bg-zinc-900"
          >
            Anterior
          </button>
          <span className="min-w-[120px] text-center text-sm text-zinc-600 dark:text-zinc-400">
            {status === "ready" ? `Página ${currentPage} de ${numPages}` : "Cargando…"}
          </span>
          <button
            type="button"
            onClick={goToNextPage}
            disabled={status !== "ready" || currentPage >= numPages}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm transition-colors hover:bg-zinc-100 disabled:pointer-events-none disabled:opacity-40 dark:border-zinc-700 dark:hover:bg-zinc-900"
          >
            Siguiente
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={zoomOut}
            disabled={status !== "ready" || scale <= MIN_SCALE}
            aria-label="Reducir zoom"
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm transition-colors hover:bg-zinc-100 disabled:pointer-events-none disabled:opacity-40 dark:border-zinc-700 dark:hover:bg-zinc-900"
          >
            −
          </button>
          <span className="min-w-[48px] text-center text-sm text-zinc-600 dark:text-zinc-400">
            {Math.round(scale * 100)}%
          </span>
          <button
            type="button"
            onClick={zoomIn}
            disabled={status !== "ready" || scale >= MAX_SCALE}
            aria-label="Aumentar zoom"
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm transition-colors hover:bg-zinc-100 disabled:pointer-events-none disabled:opacity-40 dark:border-zinc-700 dark:hover:bg-zinc-900"
          >
            +
          </button>
        </div>
      </div>

      <div className="flex flex-1 items-start justify-center overflow-auto rounded-lg border border-zinc-200 bg-zinc-100 p-6 dark:border-zinc-800 dark:bg-zinc-950">
        {status === "loading" ? (
          <div className="flex min-h-[400px] w-full max-w-md flex-col items-center justify-center gap-3 text-center text-sm text-zinc-500">
            <p>Cargando facsímil… {loadProgress > 0 ? `${loadProgress}%` : ""}</p>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
              <div
                className="h-full rounded-full bg-zinc-500 transition-all dark:bg-zinc-400"
                style={{ width: `${loadProgress > 0 ? loadProgress : 10}%` }}
              />
            </div>
          </div>
        ) : (
          <canvas ref={canvasRef} className="max-w-full shadow-sm" />
        )}
      </div>
    </div>
  );
}
