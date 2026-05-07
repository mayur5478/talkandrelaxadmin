import React, { useState, useEffect, useId } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ChevronRight, X } from 'lucide-react';
import { cn } from '../lib/cn';
import { navGroups } from './nav-config';

/**
 * Sidebar — desktop pinned, mobile drawer.
 *
 * Behaviour:
 *   - On screens >= md the sidebar is permanently mounted at width 220px.
 *   - Below md it slides in from the left when `open` is true; backdrop
 *     dismisses it. Spring-physics feel via cubic-bezier ease-out-soft.
 *   - Each parent with children auto-expands when one of its children is
 *     the current route.
 *   - Active item: left accent rule + tinted bg, weight 500.
 *   - Keyboard: every link/button has a visible focus ring (ring-2 from
 *     fg-info) without disturbing the layout.
 */
export default function Sidebar({ open, onClose, badges = {} }) {
  return (
    <>
      {/* Mobile backdrop */}
      <div
        aria-hidden={!open}
        onClick={onClose}
        className={cn(
          'tw-fixed tw-inset-0 tw-z-40 tw-bg-black/30 md:tw-hidden tw-transition-opacity tw-duration-base tw-ease-out-soft',
          open ? 'tw-opacity-100' : 'tw-opacity-0 tw-pointer-events-none',
        )}
      />
      <aside
        aria-label="Primary"
        className={cn(
          'tw-fixed tw-z-50 tw-inset-y-0 tw-left-0 tw-w-[220px]',
          'md:tw-static md:tw-z-0 md:tw-translate-x-0',
          'tw-bg-bg-primary tw-border-r tw-border-hairline tw-border-tertiary',
          'tw-flex tw-flex-col',
          'tw-transition-transform tw-duration-slow tw-ease-out-soft',
          open ? 'tw-translate-x-0' : '-tw-translate-x-full md:tw-translate-x-0',
        )}
      >
        <Brand onClose={onClose} />
        <nav className="tw-flex-1 tw-overflow-y-auto tw-px-3 tw-pb-6">
          {navGroups.map((group) => (
            <NavGroup key={group.label} group={group} badges={badges} />
          ))}
        </nav>
      </aside>
    </>
  );
}

function Brand({ onClose }) {
  return (
    <div className="tw-flex tw-items-center tw-gap-3 tw-px-4 tw-pt-4 tw-pb-4 tw-border-b tw-border-hairline tw-border-tertiary">
      <div className="tw-w-[26px] tw-h-[26px] tw-rounded-sm tw-bg-bg-info tw-text-fg-info tw-grid tw-place-items-center tw-text-[13px] tw-font-medium">
        T
      </div>
      <div className="tw-flex-1 tw-min-w-0">
        <div className="tw-text-[14px] tw-font-medium tw-text-fg-primary tw-leading-tight">
          Talk & Relax
        </div>
        <div className="tw-text-[11px] tw-text-fg-tertiary">Admin</div>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close navigation"
        className="md:tw-hidden tw-w-7 tw-h-7 tw-grid tw-place-items-center tw-rounded-sm tw-text-fg-secondary hover:tw-bg-bg-secondary focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-fg-info"
      >
        <X size={16} aria-hidden />
      </button>
    </div>
  );
}

function NavGroup({ group, badges }) {
  return (
    <div className="tw-pt-3">
      <div className="tw-px-3 tw-pb-1 tw-text-eyebrow tw-text-fg-tertiary">
        {group.label}
      </div>
      <ul className="tw-flex tw-flex-col tw-gap-[2px]">
        {group.items.map((item) =>
          item.children ? (
            <NavParent key={item.title} item={item} badges={badges} />
          ) : (
            <li key={item.path}>
              <NavLeaf item={item} badges={badges} />
            </li>
          ),
        )}
      </ul>
    </div>
  );
}

function NavLeaf({ item, indent = false, badges }) {
  const Icon = item.icon;
  const badge = badges[item.path];
  return (
    <NavLink
      to={item.path}
      end
      className={({ isActive }) =>
        cn(
          'tw-relative tw-flex tw-items-center tw-gap-3 tw-px-3 tw-py-2 tw-rounded-md',
          'tw-text-small tw-text-fg-secondary',
          'tw-transition-colors tw-duration-fast tw-ease-out-soft',
          'hover:tw-bg-bg-secondary hover:tw-text-fg-primary',
          'focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-fg-info focus-visible:tw-ring-offset-0',
          indent && 'tw-pl-9',
          isActive &&
            'tw-bg-bg-info tw-text-fg-info tw-font-medium before:tw-content-[""] before:tw-absolute before:tw-left-0 before:tw-top-1 before:tw-bottom-1 before:tw-w-[2px] before:tw-rounded-r before:tw-bg-fg-info',
        )
      }
    >
      {Icon && !indent && <Icon size={16} aria-hidden className="tw-shrink-0" />}
      <span className="tw-flex-1 tw-truncate">{item.title}</span>
      {badge != null && (
        <span className="tw-text-[10px] tw-leading-none tw-px-2 tw-py-[2px] tw-rounded-full tw-bg-bg-secondary tw-text-fg-secondary tw-font-medium tw-tabular-nums">
          {badge}
        </span>
      )}
    </NavLink>
  );
}

function NavParent({ item, badges }) {
  const id = useId();
  const { pathname } = useLocation();
  const hasActive = item.children.some((c) => pathname === c.path || pathname.startsWith(c.path + '/'));
  const [open, setOpen] = useState(hasActive);
  // Auto-expand when navigation lands on a child outside this state.
  useEffect(() => { if (hasActive) setOpen(true); }, [hasActive]);

  const Icon = item.icon;
  return (
    <li>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'tw-w-full tw-flex tw-items-center tw-gap-3 tw-px-3 tw-py-2 tw-rounded-md',
          'tw-text-small tw-text-fg-secondary',
          'tw-transition-colors tw-duration-fast tw-ease-out-soft',
          'hover:tw-bg-bg-secondary hover:tw-text-fg-primary',
          'focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-fg-info',
          hasActive && 'tw-text-fg-primary',
        )}
      >
        {Icon && <Icon size={16} aria-hidden className="tw-shrink-0" />}
        <span className="tw-flex-1 tw-truncate tw-text-left">{item.title}</span>
        <ChevronRight
          size={14}
          aria-hidden
          className={cn(
            'tw-shrink-0 tw-transition-transform tw-duration-fast tw-ease-out-soft',
            open && 'tw-rotate-90',
          )}
        />
      </button>
      <ul
        id={id}
        className={cn(
          'tw-overflow-hidden tw-transition-[max-height] tw-duration-base tw-ease-out-soft',
          open ? 'tw-max-h-[600px]' : 'tw-max-h-0',
        )}
      >
        {item.children.map((child) => (
          <li key={child.path}>
            <NavLeaf item={child} indent badges={badges} />
          </li>
        ))}
      </ul>
    </li>
  );
}
