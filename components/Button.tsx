import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-teja text-white hover:bg-teja/90 dark:bg-teja-claro dark:text-negro dark:hover:bg-teja-claro/90",
  secondary:
    "border border-teja text-teja bg-white hover:bg-teja/10 dark:border-teja-claro dark:text-teja-claro dark:bg-transparent dark:hover:bg-teja-claro/10",
  ghost:
    "text-teja hover:bg-teja/10 dark:text-teja-claro dark:hover:bg-teja-claro/10",
};

const BASE_CLASSES =
  "inline-flex w-fit items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-40";

type CommonProps = {
  variant?: ButtonVariant;
  className?: string;
  children: ReactNode;
};

type ButtonAsButton = CommonProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: undefined;
  };

type ButtonAsLink = CommonProps & {
  href: string;
};

export type ButtonProps = ButtonAsButton | ButtonAsLink;

// Botón/enlace-botón con la misma apariencia, para mantener coherencia entre
// acciones de navegación (Link) y acciones de formulario/JS (button).
export function Button({
  variant = "primary",
  className = "",
  children,
  ...props
}: ButtonProps) {
  const classes = `${BASE_CLASSES} ${VARIANT_CLASSES[variant]} ${className}`;

  if ("href" in props && props.href !== undefined) {
    const { href, ...rest } = props as ButtonAsLink;
    return (
      <Link href={href} className={classes} {...rest}>
        {children}
      </Link>
    );
  }

  const buttonProps = props as ButtonHTMLAttributes<HTMLButtonElement>;
  return (
    <button type="button" className={classes} {...buttonProps}>
      {children}
    </button>
  );
}
