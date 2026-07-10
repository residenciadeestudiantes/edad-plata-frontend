import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "secondary-azul"
  | "ghost"
  | "inverse"
  | "azul"
  | "negro"
  | "negro-outline";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-teja text-white hover:bg-teja/90 dark:bg-teja-claro dark:text-negro dark:hover:bg-teja-claro/90",
  secondary:
    "border border-teja text-teja bg-white hover:bg-teja/10 dark:border-teja-claro dark:text-teja-claro dark:bg-transparent dark:hover:bg-teja-claro/10",
  // Variante en línea (mismo trazo que "secondary"), pero en azul de marca,
  // para herramientas de modo investigación.
  "secondary-azul":
    "border border-azul text-azul bg-white hover:bg-azul/10 dark:border-azul-claro dark:text-azul-claro dark:bg-transparent dark:hover:bg-azul-claro/10",
  ghost:
    "text-teja hover:bg-teja/10 dark:text-teja-claro dark:hover:bg-teja-claro/10",
  // Para usar sobre fondos de color de marca (p. ej. un banner en teja): un
  // hover que oscurece ligeramente el blanco en vez de tintarlo con el color
  // de la marca, que se fundiría con el fondo y haría "desaparecer" el botón.
  inverse: "bg-white text-teja hover:bg-zinc-200",
  // Variante en azul de marca, para diferenciar visualmente acciones (p. ej.
  // la búsqueda exacta en texto frente a la búsqueda general en teja).
  azul:
    "bg-azul text-white hover:bg-azul/90 dark:bg-azul-claro dark:text-negro dark:hover:bg-azul-claro/90",
  // Variantes neutras (negro sólido / negro con borde), para composiciones
  // editoriales donde el acento de marca no debe competir con el CTA
  // principal (p. ej. la portada).
  negro: "bg-negro text-blanco hover:bg-negro/85 dark:bg-blanco dark:text-negro dark:hover:bg-blanco/85",
  "negro-outline":
    "border border-negro text-negro bg-transparent hover:bg-negro/5 dark:border-blanco dark:text-blanco dark:hover:bg-blanco/10",
};

const BASE_CLASSES =
  "inline-flex w-fit items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-bold transition-colors disabled:pointer-events-none disabled:opacity-40";

function ArrowIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
      className="h-4 w-4 shrink-0"
    >
      <path
        d="M4 10h12m0 0-5-5m5 5-5 5"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Flecha en diagonal, para enlaces que salen del sitio (abren otra web).
function DiagonalArrowIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
      className="h-4 w-4 shrink-0"
    >
      <path
        d="M6 14 14 6m0 0H7m7 0v7"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type CommonProps = {
  variant?: ButtonVariant;
  className?: string;
  children: ReactNode;
  showArrow?: boolean;
  // "diagonal" señala visualmente que el enlace sale del sitio.
  arrowDirection?: "right" | "diagonal";
};

type ButtonAsButton = CommonProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: undefined;
  };

type ButtonAsLink = CommonProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
  };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

// Botón/enlace-botón con la misma apariencia, para mantener coherencia entre
// acciones de navegación (Link) y acciones de formulario/JS (button).
export function Button({
  variant = "primary",
  className = "",
  children,
  showArrow = true,
  arrowDirection = "right",
  ...props
}: ButtonProps) {
  const classes = `${BASE_CLASSES} ${VARIANT_CLASSES[variant]} ${className}`;
  const arrow = arrowDirection === "diagonal" ? <DiagonalArrowIcon /> : <ArrowIcon />;

  if ("href" in props && props.href !== undefined) {
    const { href, ...rest } = props as ButtonAsLink;
    return (
      <Link href={href} className={classes} {...rest}>
        {children}
        {showArrow && arrow}
      </Link>
    );
  }

  const buttonProps = props as ButtonHTMLAttributes<HTMLButtonElement>;
  return (
    <button type="button" className={classes} {...buttonProps}>
      {children}
      {showArrow && arrow}
    </button>
  );
}
