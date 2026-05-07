import React from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, Search, Bell, Moon, Sun, ChevronRight } from 'lucide-react';
import { cn } from '../lib/cn';
import { resolveBreadcrumb } from './nav-config';
import { useTheme } from './ThemeProvider';

/**
 * Topbar — breadcrumbs / ⌘K search trigger / bell / theme toggle / avatar.
 *
 * The mobile menu icon is shown below md and toggles the sidebar drawer
 * via the onMenuClick prop. Notification dot is hard-wired to a default
 * `hasUnread` prop so it can be flipped on later when a real
 * notifications API is wired.
 */
export default function Topbar({
  onMenuClick,
  onSearchOpen,
  hasUnread = false,
  user,
}) {
  const { pathname } = useLocation();
  const trail = resolveBreadcrumb(pathname);
  const { theme, toggle: toggleTheme } = useTheme();

  return (
    <header className="tw-h-14 tw-flex tw-items-center tw-gap-3 tw-px-4 md:tw-px-6 tw-bg-bg-primary tw-border-b tw-border-hairline tw-border-tertiary">
      {/* Mobile menu */}
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Open navigation"
        className="md:tw-hidden tw-w-8 tw-h-8 tw-grid tw-place-items-center tw-rounded-md tw-text-fg-secondary hover:tw-bg-bg-secondary focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-fg-info"
      >
        <Menu size={16} aria-hidden />
      </button>

      <Breadcrumbs trail={trail} />

      <SearchTrigger onClick={onSearchOpen} />

      <div className="tw-ml-auto tw-flex tw-items-center tw-gap-2">
        <IconButton ariaLabel="Notifications">
          <Bell size={15} aria-hidden />
          {hasUnread && (
            <span
              aria-hidden
              className="tw-absolute tw-top-[6px] tw-right-[6px] tw-w-[6px] tw-h-[6px] tw-rounded-full tw-bg-fg-danger"
            />
          )}
        </IconButton>

        <IconButton
          ariaLabel={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          onClick={toggleTheme}
        >
          {theme === 'dark' ? <Sun size={15} aria-hidden /> : <Moon size={15} aria-hidden />}
        </IconButton>

        <Avatar name={user?.fullName || user?.name || 'Admin'} />
      </div>
    </header>
  );
}

function Breadcrumbs({ trail }) {
  return (
    <nav aria-label="Breadcrumb" className="tw-hidden sm:tw-flex tw-items-center tw-gap-1 tw-text-[12px] tw-text-fg-secondary tw-min-w-0">
      <span>Dashboard</span>
      {trail.map((seg, i) => (
        <React.Fragment key={`${seg}-${i}`}>
          <ChevronRight size={12} aria-hidden className="tw-text-fg-tertiary tw-shrink-0" />
          <span
            className={cn('tw-truncate', i === trail.length - 1 && 'tw-text-fg-primary tw-font-medium')}
            aria-current={i === trail.length - 1 ? 'page' : undefined}
          >
            {seg}
          </span>
        </React.Fragment>
      ))}
    </nav>
  );
}

function SearchTrigger({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Open search"
      className={cn(
        'tw-hidden md:tw-flex tw-items-center tw-gap-2 tw-h-8 tw-w-[280px] tw-px-3',
        'tw-bg-bg-primary tw-border tw-border-hairline tw-border-tertiary tw-rounded-md',
        'tw-text-[12px] tw-text-fg-tertiary',
        'tw-transition-colors tw-duration-fast tw-ease-out-soft',
        'hover:tw-text-fg-secondary hover:tw-border-strong',
        'focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-fg-info',
      )}
    >
      <Search size={14} aria-hidden />
      <span className="tw-flex-1 tw-text-left">Search anything</span>
      <kbd className="tw-text-[10px] tw-font-medium tw-px-1.5 tw-py-[1px] tw-rounded-sm tw-bg-bg-secondary tw-text-fg-tertiary tw-tabular-nums">
        ⌘K
      </kbd>
    </button>
  );
}

function IconButton({ children, onClick, ariaLabel }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={cn(
        'tw-relative tw-w-8 tw-h-8 tw-grid tw-place-items-center',
        'tw-bg-bg-primary tw-border tw-border-hairline tw-border-tertiary tw-rounded-md',
        'tw-text-fg-secondary',
        'tw-transition-colors tw-duration-fast tw-ease-out-soft',
        'hover:tw-bg-bg-secondary hover:tw-text-fg-primary',
        'focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-fg-info',
      )}
    >
      {children}
    </button>
  );
}

function Avatar({ name }) {
  const initials = (name || '')
    .split(' ')
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'A';
  return (
    <div
      aria-label={`Account: ${name}`}
      className="tw-w-8 tw-h-8 tw-rounded-full tw-bg-bg-info tw-text-fg-info tw-grid tw-place-items-center tw-text-[11px] tw-font-medium"
    >
      {initials}
    </div>
  );
}
