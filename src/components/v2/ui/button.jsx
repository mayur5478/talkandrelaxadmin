import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../../lib/cn';

/**
 * Button — primary action, with variants and sizes via cva.
 *
 *   <Button>                   primary (blue)
 *   <Button variant="ghost">   transparent, hover bg
 *   <Button variant="outline"> outlined neutral
 *   <Button variant="danger">  destructive
 *   <Button size="sm">         compact
 */
const buttonStyles = cva(
  cn(
    'tw-inline-flex tw-items-center tw-justify-center tw-gap-2',
    'tw-text-small tw-font-medium tw-rounded-md',
    'tw-transition-colors tw-duration-fast tw-ease-out-soft',
    'focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-fg-info focus-visible:tw-ring-offset-2',
    'disabled:tw-opacity-50 disabled:tw-cursor-not-allowed disabled:tw-pointer-events-none',
  ),
  {
    variants: {
      variant: {
        primary: 'tw-bg-fg-info tw-text-white hover:tw-opacity-90 tw-shadow-xs',
        outline:
          'tw-bg-bg-primary tw-text-fg-primary tw-border tw-border-hairline tw-border-tertiary hover:tw-bg-bg-secondary',
        ghost:    'tw-text-fg-secondary hover:tw-bg-bg-secondary hover:tw-text-fg-primary',
        danger:   'tw-bg-fg-danger tw-text-white hover:tw-opacity-90 tw-shadow-xs',
        link:     'tw-text-fg-info hover:tw-underline tw-rounded-sm',
      },
      size: {
        sm: 'tw-h-7 tw-px-2',
        md: 'tw-h-8 tw-px-3',
        lg: 'tw-h-10 tw-px-4',
        icon: 'tw-h-8 tw-w-8 tw-p-0',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

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
        <span className="tw-w-3 tw-h-3 tw-border-2 tw-border-current tw-border-t-transparent tw-rounded-full tw-animate-spin" aria-hidden />
      )}
      {children}
    </button>
  );
});

/**
 * IconButton — square button with only an icon child.
 * Same focus + transition behaviour as Button. Always pass `aria-label`.
 */
export const IconButton = React.forwardRef(function IconButton(
  { className, variant = 'outline', size = 'icon', children, ...rest },
  ref,
) {
  return (
    <Button ref={ref} variant={variant} size={size} className={className} {...rest}>
      {children}
    </Button>
  );
});
