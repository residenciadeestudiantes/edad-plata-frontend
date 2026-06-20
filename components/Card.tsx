import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

const CARD_CLASSES =
  "group flex flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white transition-colors hover:border-teja dark:border-zinc-800 dark:bg-negro dark:hover:border-teja-claro";

function CardImage({
  src,
  alt,
}: {
  src: string | null;
  alt: string;
}) {
  return (
    <div className="relative aspect-[3/4] w-full bg-gris-claro dark:bg-zinc-900">
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform group-hover:scale-105"
        />
      ) : (
        <div className="flex h-full items-center justify-center text-sm text-zinc-400">
          Sin imagen
        </div>
      )}
    </div>
  );
}

// Tarjeta genérica para listados (revistas, números…): imagen, título en
// font-titulo y metadatos en gris. Si recibe `href` se renderiza como enlace
// completo (uso en app/page.tsx); si no, solo el bloque visual, para que la
// página pueda añadir sus propios botones de acción debajo (uso en numeros/page.tsx).
export function Card({
  href,
  imageUrl,
  imageAlt,
  title,
  meta,
  children,
  className = "",
}: {
  href?: string;
  imageUrl: string | null;
  imageAlt: string;
  title: ReactNode;
  meta?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  const content = (
    <>
      <CardImage src={imageUrl} alt={imageAlt} />
      <div className="flex flex-1 flex-col gap-1 p-4">
        <h2 className="font-titulo leading-snug text-teja dark:text-teja-claro">
          {title}
        </h2>
        {meta && (
          <p className="text-sm font-light text-zinc-500 dark:text-zinc-400">
            {meta}
          </p>
        )}
      </div>
      {children}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={`${CARD_CLASSES} ${className}`}>
        {content}
      </Link>
    );
  }

  return <div className={`${CARD_CLASSES} ${className}`}>{content}</div>;
}
