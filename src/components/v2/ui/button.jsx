import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../../lib/cn';

/**
 * Button — premium v2 redesign.
 *
 * Variants:
 *   primary   — indigo gradient, white text, soft glow on hover
 *   secondary — subtle filled, primary text
 *   outline   — bordered, transparent bg
 *   ghost     — no border, hover fill only
 *   danger    — red gradient
 *   link      — text-only, underline on hover
 *
 * Sizes:  xs | sm | md | lg
 * Extras: loading spinner, icon-only variant
 */

const base = cn(
  /* layout */
  'tw-relative tw-inline-flex tw-items-center tw-justify-center tw-gap-1.5',
  /* typography */
  'tw-font-semibold tw-tracking-tight tw-whitespace-nowrap',
  /* shape */
  'tw-rounded-lg',
  /* interaction */
  'tw-cursor-pointer tw-select-none',
  'tw-transition-all tw-duration-150 tw-ease-out',
  'active:tw-scale-[0.97]',
  /* focus */
  'focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-fg-info focus-visible:tw-ring-offset-2',
  /* disabled */
  'disabled:tw-opacity-40 disabled:tw-cursor-not-allowed disabled:tw-pointer-events-none disabled:tw-scale-100',
);

const buttonStyles = cva(base, {
  variants: {
    variant: {
      primary: cn(
        'tw-bg-gradient-to-b tw-from-[#6366f1] tw-to-[#4f46e5]',
        'tw-text-white tw-border tw-border-[#4338ca]',
        'tw-shadow-[0_1px_2px_rgba(0,0,0,.25),inset_0_1px_0_rgba(255,255,255,.12)]',
        'hover:tw-from-[#5457e8] hover:tw-to-[#4338ca]',
        'hover:tw-shadow-[0_4px_14px_rgba(99,102,241,.45)]',
      ),
      secondary: cn(
        'tw-bg-bg-secondary tw-text-fg-primary',
        'tw-border tw-border-hairline tw-border-tertiary',
        'tw-shadow-xs',
        'hover:tw-bg-bg-tertiary hover:tw-border-[var(--color-border-tertiary)]',
        'hover:tw-shadow-sm',
      ),
      outline: cn(
        'tw-bg-transparent tw-text-fg-secondary',
        'tw-border tw-border-hairline tw-border-tertiary',
        'hover:tw-bg-bg-secondary hover:tw-text-fg-primary hover:tw-border-[var(--color-border-tertiary)]',
      ),
      ghost: cn(
        'tw-bg-transparent tw-text-fg-secondary tw-border-0',
        'hover:tw-bg-bg-secondary hover:tw-text-fg-primary',
      ),
      danger: cn(
        'tw-bg-gradient-to-b tw-from-[#ef4444] tw-to-[#dc2626]',
        'tw-text-white tw-border tw-border-[#b91c1c]',
        'tw-shadow-[0_1px_2px_rgba(0,0,0,.25),inset_0_1px_0_rgba(255,255,255,.10)]',
        'hover:tw-from-[#e53e3e] hover:tw-to-[#c53030]',
        'hover:tw-shadow-[0_4px_14px_rgba(239,68,68,.40)]',
      ),
      link: cn(
        'tw-bg-transparent tw-text-fg-info tw-border-0 tw-p-0 tw-h-auto',
        'hover:tw-underline tw-underline-offset-4 tw-rounded-sm',
      ),
    },
    size: {
      xs: 'tw-h-6  tw-px-2   tw-text-[11px]',
      sm: 'tw-h-7  tw-px-2.5 tw-text-[12px]',
      md: 'tw-h-8  tw-px-3.5 tw-text-[13px]',
      lg: 'tw-h-10 tw-px-5   tw-text-[14px]',
      icon: 'tw-h-8 tw-w-8 tw-p-0 tw-text-[13px]',
    },
  },
  defaultVariants: { variant: 'primary', size: 'md' },
});

export const Button = React.forwardRef(function Button(
  { className, variant, size, type = 'button', loading, children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-busy={loading || undefined}
      className={cn(buttonStyles({ variant, size }), className)}
      {...rest}
    >
      {loading && (
        <span
          aria-hidden
          className="tw-w-3.5 tw-h-3.5 tw-border-2 tw-border-current tw-border-t-transparent tw-rounded-full tw-animate-spin tw-shrink-0"
        />
      )}
      {children}
    </button>
  );
});

/**
 * IconButton — square, icon-only. Always pass aria-label.
 * Default variant is "ghost" — flat, shows bg only on hover.
 */
export const IconButton = React.forwardRef(function IconButton(
  { className, variant = 'ghost', size = 'icon', children, ...rest },
  ref,
) {
  return (
    <Button ref={ref} variant={variant} size={size} className={cn('tw-rounded-md', className)} {...rest}>
      {children}
    </Button>
  );
});
