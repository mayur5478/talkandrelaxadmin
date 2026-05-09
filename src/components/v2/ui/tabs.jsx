import React, { createContext, useContext, useId } from 'react';
import { cn } from '../../../lib/cn';

/**
 * Tabs — controlled tab strip.
 *
 *   <Tabs value={tab} onChange={setTab}>
 *     <TabsList ariaLabel="Sections">
 *       <Tab value="overview">Overview</Tab>
 *       <Tab value="activity">Activity</Tab>
 *     </TabsList>
 *     <TabPanel value="overview">…</TabPanel>
 *     <TabPanel value="activity">…</TabPanel>
 *   </Tabs>
 */

const TabsCtx = createContext(null);

export function Tabs({ value, onChange, children, className }) {
  const idBase = useId();
  return (
    <TabsCtx.Provider value={{ value, onChange, idBase }}>
      <div className={className}>{children}</div>
    </TabsCtx.Provider>
  );
}

export function TabsList({ ariaLabel = 'Tabs', children, className }) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        'tw-flex tw-w-full tw-border-b tw-border-hairline tw-border-tertiary tw-gap-4',
        /* mobile: scroll tabs horizontally, hide the scrollbar */
        'tw-overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:tw-hidden',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Tab({ value: tabValue, children }) {
  const ctx = useContext(TabsCtx);
  if (!ctx) throw new Error('<Tab> must be inside <Tabs>');
  const active = ctx.value === tabValue;
  const tabId = `${ctx.idBase}-tab-${tabValue}`;
  const panelId = `${ctx.idBase}-panel-${tabValue}`;
  return (
    <button
      type="button"
      role="tab"
      id={tabId}
      aria-controls={panelId}
      aria-selected={active}
      tabIndex={active ? 0 : -1}
      onClick={() => ctx.onChange?.(tabValue)}
      className={cn(
        /* bootstrap reset */
        'tw-bg-transparent tw-border-0 tw-shadow-none tw-appearance-none tw-outline-none',
        /* sizing & text */
        'tw-px-3 tw-py-2 tw-text-[13px] tw-font-medium tw-whitespace-nowrap tw-cursor-pointer',
        'tw-transition-colors tw-duration-fast tw-ease-out-soft',
        'focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-fg-info tw-rounded-sm',
        active
          ? 'tw-text-fg-primary tw-border-b-2 tw-border-fg-info -tw-mb-[1px]'
          : 'tw-text-fg-tertiary hover:tw-text-fg-secondary',
      )}
    >
      {children}
    </button>
  );
}

export function TabPanel({ value: tabValue, children, className }) {
  const ctx = useContext(TabsCtx);
  if (!ctx) throw new Error('<TabPanel> must be inside <Tabs>');
  const active = ctx.value === tabValue;
  const tabId = `${ctx.idBase}-tab-${tabValue}`;
  const panelId = `${ctx.idBase}-panel-${tabValue}`;
  if (!active) return null;
  return (
    <div role="tabpanel" id={panelId} aria-labelledby={tabId} tabIndex={0} className={cn('tw-pt-4 focus:tw-outline-none', className)}>
      {children}
    </div>
  );
}
