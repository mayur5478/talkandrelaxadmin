import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge tailwind classes with conflict resolution.
 *
 *   cn('tw-text-fg-primary tw-px-3', condition && 'tw-px-4', custom)
 *
 * Note: we use Tailwind's `tw-` prefix in this app (see tailwind.config.js)
 * to keep our utilities from colliding with react-bootstrap's reset.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
