"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface ImageLightboxProps {
  src: string;
  alt: string;
  wrapperClassName?: string;
  sizes?: string;
}

export function ImageLightbox({
  src,
  alt,
  wrapperClassName = "",
  sizes = "320px",
}: ImageLightboxProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`block cursor-zoom-in ${wrapperClassName}`}
        aria-label={`Ver imagen completa: ${alt}`}
      >
        <Image src={src} alt={alt} fill sizes={sizes} className="object-cover" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-negro/80 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal
          aria-label={alt}
        >
          <div
            className="relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={alt}
              className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
            />
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Cerrar"
              className="absolute -right-3 -top-3 flex h-8 w-8 items-center justify-center rounded-full bg-negro text-lg leading-none text-white shadow-lg hover:bg-zinc-700"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </>
  );
}
