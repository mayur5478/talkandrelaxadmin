import React from 'react';
import { cn } from '../../../lib/cn';

/**
 * PageHeader — shared page-head used by every v2 list/detail page.
 *
 *   <PageHeader
 *     title="Application requests"
 *     description="Listeners who have applied and are pending review."
 *     primaryAction={<Button><Plus size={14}/> New report</Button>}
 *   />
 */
export function PageHeader({ title, description, primaryAction, secondary, className }) {
  return (
    <div className={cn('tw-flex tw-items-end tw-justify-between tw-gap-4 tw-flex-wrap', className)}>
      <div className="tw-min-w-0">
        <h1 className="tw-text-h1 tw-text-fg-primary tw-m-0 tw-truncate">{title}</h1>
        {description && (
          <p className="tw-text-small tw-text-fg-tertiary tw-mt-1 tw-mb-0">{description}</p>
        )}
      </div>
      {(primaryAction || secondary) && (
        <div className="tw-flex tw-items-center tw-gap-2 tw-shrink-0">
          {secondary}
          {primaryAction}
        </div>
      )}
    </div>
  );
}
