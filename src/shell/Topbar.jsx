import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, Search, Bell, Moon, Sun, ChevronRight } from 'lucide-react';
import { cn } from '../lib/cn';
import { resolveBreadcrumb } from './nav-config';
import { useTheme } from './ThemeProvider';
import {
  useLogoutAdminMutation,
  useResetAdminPasswordMutation,
} from '../services/auth';
import { clearCookie } from '../cookie_helper/cookie';
import ResetPassword from '../components/common/reset-password/ResetPassword';

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
  const navigate = useNavigate();
  const trail = resolveBreadcrumb(pathname);
  const { theme, toggle: toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetAdminPassword, { isError: resetError }] = useResetAdminPasswordMutation();
  const [logoutAdmin] = useLogoutAdminMutation();

  const displayName = useMemo(() => {
    if (user?.first_name || user?.last_name) {
      return `${user?.first_name || ''} ${user?.last_name || ''}`.trim();
    }
    return user?.fullName || user?.name || 'Admin';
  }, [user]);

  const handleLogout = async () => {
    try {
      await logoutAdmin({ adminId: user?.id }).unwrap();
    } catch (err) {
      // proceed with local logout even if API call fails
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      clearCookie('token');
      clearCookie('role');
      setMenuOpen(false);
      navigate('/');
    }
  };

  const handleResetPasswordSubmit = async (newPassword, oldPassword) => {
    setIsSubmitting(true);
    try {
      await resetAdminPassword({
        adminId: user?.id,
        newPassword,
        oldPassword,
      }).unwrap();
      setShowResetModal(false);
      await handleLogout();
    } catch (err) {
      if (err?.status === 401) {
        alert('Old password is incorrect');
      } else {
        console.error('Reset password error:', err);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
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

        <Avatar
          name={displayName}
          open={menuOpen}
          onToggle={() => setMenuOpen((prev) => !prev)}
          onChangePassword={() => {
            setShowResetModal(true);
            setMenuOpen(false);
          }}
          onLogout={handleLogout}
        />
      </div>
    </header>
    <ResetPassword
      show={showResetModal}
      close={setShowResetModal}
      onHide={() => setShowResetModal(false)}
      onSubmit={handleResetPasswordSubmit}
      isSubmitting={isSubmitting}
      FormError={resetError}
    />
    </>
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
      aria-label="Open search (⌘K)"
      className={cn(
        'tw-hidden md:tw-flex tw-items-center tw-gap-2.5',
        'tw-h-8 tw-w-[260px] tw-px-3',
        'tw-rounded-full',
        'tw-bg-bg-secondary tw-border tw-border-hairline tw-border-tertiary',
        'tw-text-[12.5px] tw-font-medium tw-text-fg-tertiary',
        'tw-transition-all tw-duration-150',
        'hover:tw-border-fg-info/40 hover:tw-bg-bg-secondary hover:tw-text-fg-secondary',
        'hover:tw-shadow-[0_0_0_3px_rgba(99,102,241,.08)]',
        'focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-fg-info',
      )}
    >
      <Search size={13} aria-hidden className="tw-shrink-0" />
      <span className="tw-flex-1 tw-text-left">Search anything…</span>
      <kbd className={cn(
        'tw-text-[10px] tw-font-semibold tw-tabular-nums',
        'tw-px-1.5 tw-py-[2px] tw-rounded-md',
        'tw-bg-bg-primary tw-text-fg-tertiary',
        'tw-border tw-border-hairline tw-border-tertiary',
      )}>
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
        'tw-rounded-lg',
        'tw-text-fg-secondary',
        'tw-transition-all tw-duration-150 tw-ease-out',
        'hover:tw-bg-bg-secondary hover:tw-text-fg-primary',
        'active:tw-scale-90',
        'focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-fg-info',
      )}
    >
      {children}
    </button>
  );
}

function Avatar({ name, open, onToggle, onChangePassword, onLogout }) {
  const initials = (name || '')
    .split(' ')
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'A';
  return (
    <div className="tw-relative">
      <button
        type="button"
        onClick={onToggle}
        aria-label={`Account: ${name}`}
        className="tw-w-8 tw-h-8 tw-rounded-full tw-bg-gradient-to-br tw-from-[#6366f1] tw-to-[#8b5cf6] tw-text-white tw-grid tw-place-items-center tw-text-[11px] tw-font-bold tw-cursor-pointer tw-shadow-sm hover:tw-shadow-md tw-transition-shadow tw-duration-150 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-fg-info"
      >
        {initials}
      </button>

      {open && (
        <div className="tw-absolute tw-right-0 tw-top-10 tw-z-50 tw-min-w-[180px] tw-rounded-xl tw-bg-bg-primary tw-border tw-border-hairline tw-border-tertiary tw-shadow-xl tw-overflow-hidden">
          <button
            type="button"
            onClick={onChangePassword}
            className="tw-w-full tw-text-left tw-px-3 tw-py-2.5 tw-text-[13px] tw-text-fg-secondary hover:tw-bg-bg-secondary"
          >
            Change Password
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="tw-w-full tw-text-left tw-px-3 tw-py-2.5 tw-text-[13px] tw-text-fg-danger hover:tw-bg-bg-secondary"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
