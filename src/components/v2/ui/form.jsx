import React, { useId } from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '../../../lib/cn';

/**
 * Field — wraps an input with a label, optional helper, and an inline
 * error message. Wires aria-describedby/aria-invalid automatically.
 *
 *   <Field label="Email" helper="We'll never share it." error={errors.email}>
 *     <Input type="email" name="email" />
 *   </Field>
 *
 * The child must accept `id`, `aria-describedby`, `aria-invalid` props
 * — Input/Textarea/Select below all do.
 */
export function Field({ label, helper, error, required, children, className }) {
  const id = useId();
  const helperId = `${id}-helper`;
  const errorId = `${id}-error`;

  const child = React.Children.only(children);
  const cloned = React.cloneElement(child, {
    id,
    'aria-invalid': !!error || child.props['aria-invalid'],
    'aria-describedby': cn(error ? errorId : helper ? helperId : '', child.props['aria-describedby']),
  });

  return (
    <div className={cn('tw-flex tw-flex-col tw-gap-1', className)}>
      {label && (
        <label htmlFor={id} className="tw-text-[12px] tw-font-medium tw-text-fg-primary">
          {label}
          {required && <span aria-hidden className="tw-text-fg-danger tw-ml-0.5">*</span>}
        </label>
      )}
      {cloned}
      {error ? (
        <div id={errorId} role="alert" className="tw-flex tw-items-center tw-gap-1 tw-text-[11px] tw-text-fg-danger">
          <AlertCircle size={11} aria-hidden /> {error}
        </div>
      ) : helper ? (
        <div id={helperId} className="tw-text-[11px] tw-text-fg-tertiary">{helper}</div>
      ) : null}
    </div>
  );
}

/**
 * Fieldset — groups related Fields with a legend.
 */
export function Fieldset({ legend, description, children, className }) {
  return (
    <fieldset className={cn('tw-flex tw-flex-col tw-gap-3', className)}>
      {legend && (
        <legend className="tw-text-h3 tw-text-fg-primary tw-mb-1">
          {legend}
          {description && <div className="tw-text-small tw-text-fg-tertiary tw-font-normal tw-mt-1">{description}</div>}
        </legend>
      )}
      <div className="tw-flex tw-flex-col tw-gap-3">{children}</div>
    </fieldset>
  );
}

const baseControl = cn(
  'tw-w-full tw-bg-bg-primary tw-text-fg-primary',
  'tw-border tw-border-hairline tw-border-tertiary tw-rounded-md',
  'tw-text-small tw-px-3 tw-py-2',
  'tw-transition-shadow tw-duration-fast tw-ease-out-soft',
  'placeholder:tw-text-fg-tertiary',
  'focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-fg-info focus-visible:tw-border-strong',
  'disabled:tw-opacity-60 disabled:tw-cursor-not-allowed',
  'aria-[invalid=true]:tw-border-fg-danger aria-[invalid=true]:focus-visible:tw-ring-fg-danger',
);

export const Input = React.forwardRef(function Input({ className, ...rest }, ref) {
  return <input ref={ref} className={cn(baseControl, className)} {...rest} />;
});

export const Textarea = React.forwardRef(function Textarea({ className, rows = 4, ...rest }, ref) {
  return <textarea ref={ref} rows={rows} className={cn(baseControl, 'tw-resize-y tw-min-h-[80px]', className)} {...rest} />;
});

export const Select = React.forwardRef(function Select({ className, children, ...rest }, ref) {
  return (
    <select ref={ref} className={cn(baseControl, 'tw-appearance-none tw-bg-no-repeat tw-bg-[right_0.75rem_center] tw-pr-8', className)} {...rest}>
      {children}
    </select>
  );
});

/**
 * Checkbox — styled native checkbox with a 4px focus ring.
 */
export const Checkbox = React.forwardRef(function Checkbox({ className, label, id, ...rest }, ref) {
  const fallback = useId();
  const realId = id || fallback;
  return (
    <div className="tw-inline-flex tw-items-center tw-gap-2">
      <input
        id={realId}
        ref={ref}
        type="checkbox"
        className={cn(
          'tw-w-4 tw-h-4 tw-rounded-sm tw-border tw-border-hairline tw-border-tertiary',
          'tw-text-fg-info tw-bg-bg-primary',
          'focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-fg-info',
          className,
        )}
        {...rest}
      />
      {label && <label htmlFor={realId} className="tw-text-small tw-text-fg-secondary tw-select-none">{label}</label>}
    </div>
  );
});
