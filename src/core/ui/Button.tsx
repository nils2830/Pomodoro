"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "../lib/cn";

type Variant = "primary" | "soft" | "ghost" | "outline" | "danger";
type Size = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  trailing?: ReactNode;
}

const variants: Record<Variant, string> = {
  primary: "bg-btn text-btn-ink hover:brightness-110 active:brightness-95",
  soft: "bg-fill text-ink hover:bg-ink/12",
  ghost: "text-ink-2 hover:text-ink hover:bg-fill",
  outline: "border border-line text-ink hover:bg-fill",
  danger: "bg-bad/10 text-bad hover:bg-bad/15",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px] gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-[15px] gap-2.5",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "soft", size = "md", icon, trailing, className, children, type = "button", ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-medium whitespace-nowrap transition-[background-color,color,filter,transform] duration-150 select-none disabled:opacity-45 active:translate-y-px",
        variants[variant],
        sizes[size],
        className,
      )}
      {...rest}
    >
      {icon}
      {children}
      {trailing}
    </button>
  );
});

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  size?: "sm" | "md" | "lg";
  variant?: "soft" | "ghost" | "outline";
  active?: boolean;
}

const iconSizes = { sm: "size-8", md: "size-10", lg: "size-12" };

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, size = "md", variant = "ghost", active, className, children, type = "button", ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      aria-pressed={active}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full transition-[background-color,color,transform] duration-150 active:scale-95 disabled:opacity-40",
        iconSizes[size],
        variant === "soft" && "bg-fill text-ink hover:bg-ink/14",
        variant === "ghost" && "text-ink-2 hover:bg-fill hover:text-ink",
        variant === "outline" && "border border-line text-ink hover:bg-fill",
        active && "bg-ink! text-page!",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
});
