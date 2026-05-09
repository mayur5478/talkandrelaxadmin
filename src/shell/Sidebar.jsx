import React, { useState, useEffect, useId } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ChevronRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/cn';
import { navGroups } from './nav-config';

/**
 * Sidebar — desktop pinned (260px), mobile drawer.
 *
 * Improvements over v1:
 *   - Width 260px to prevent item-label truncation
 *   - Section eyebrows are more legible (fg-secondary + uppercase tracking)
 *   - Framer Motion replaces CSS max-height hack for dropdowns
 *   - whileHover x-nudge on every item for tactile feedback
 *   - Stagger-in on mount so the nav feels alive
 */

/* ─── variants ────────────────────────────────────────────────────── */

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04, delayChildren: 0.05 } },
};

const itemVariants = {
  hidden:  { x: -12, opacity: 0 },
  visible: { x: 0,   opacity: 1, transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] } },
};

const dropdownVariants = {
  hidden:  { height: 0, opacity: 0 },
  visible: {
    height: 'auto',
    opacity: 1,
    transition: {
      height:  { duration: 0.26, ease: [0.16, 1, 0.3, 1] },
      opacity: { duration: 0.18, delay: 0.04 },
      staggerChildren: 0.035,
      delayChildren:   0.05,
    },
  },
  exit: {
    height:  0,
    opacity: 0,
    transition: {
      height:  { duration: 0.2,  ease: 'easeIn' },
      opacity: { duration: 0.12 },
    },
  },
};

const childVariants = {
  hidden:  { x: -8, opacity: 0 },
  visible: { x: 0,  opacity: 1, transition: { duration: 0.18, ease: 'easeOut' } },
  exit:    { x: -4, opacity: 0, transition: { duration: 0.1  } },
};

/* ─── component ───────────────────────────────────────────────────── */

export default function Sidebar({ open, onClose, badges = {} }) {
  return (
    <>
      {/* Mobile backdrop */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="backdrop"
            aria-hidden
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="tw-fixed tw-inset-0 tw-z-40 tw-bg-black/30 md:tw-hidden"
          />
        )}
      </AnimatePresence>

      <aside
        aria-label="Primary"
        className={cn(
          'tw-fixed tw-z-50 tw-inset-y-0 tw-left-0 tw-w-[280px]',
          'md:tw-static md:tw-z-0 md:tw-translate-x-0',
          'tw-bg-bg-primary tw-border-r tw-border-hairline tw-border-tertiary',
          'tw-flex tw-flex-col',
          'tw-transition-transform tw-duration-slow tw-ease-out-soft',
          open ? 'tw-translate-x-0' : '-tw-translate-x-full md:tw-translate-x-0',
        )}
      >
        <Brand onClose={onClose} />

        <nav className="tw-flex-1 tw-overflow-y-auto tw-px-3 tw-pb-6 tw-scrollbar-thin">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {navGroups.map((group) => (
              <NavGroup key={group.label} group={group} badges={badges} />
            ))}
          </motion.div>
        </nav>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.3 }}
          className="tw-px-4 tw-py-3 tw-border-t tw-border-hairline tw-border-tertiary tw-flex tw-items-center tw-justify-between"
        >
          <span className="tw-text-[11px] tw-font-semibold tw-text-fg-secondary tw-tracking-wide">
            Talk &amp; Relax
          </span>
          <span className="tw-text-[10px] tw-text-fg-tertiary tw-bg-bg-secondary tw-px-2 tw-py-[2px] tw-rounded-full">
            Admin v1
          </span>
        </motion.div>
      </aside>
    </>
  );
}

/* ─── Brand / header ──────────────────────────────────────────────── */

function Brand({ onClose }) {
  return (
    <div className="tw-flex tw-items-center tw-gap-3 tw-px-4 tw-pt-4 tw-pb-4 tw-border-b tw-border-hairline tw-border-tertiary">
      <div className="tw-w-8 tw-h-8 tw-rounded-lg tw-bg-gradient-to-br tw-from-[#6366f1] tw-to-[#8b5cf6] tw-text-white tw-grid tw-place-items-center tw-text-[13px] tw-font-bold tw-shrink-0 tw-shadow-[0_2px_8px_rgba(99,102,241,.40)]">
        T
      </div>
      <div className="tw-flex-1 tw-min-w-0">
        <div className="tw-text-[14px] tw-font-semibold tw-text-fg-primary tw-leading-tight">
          Talk &amp; Relax
        </div>
        <div className="tw-text-[11px] tw-text-fg-tertiary">Admin Panel</div>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close navigation"
        className="md:tw-hidden tw-w-7 tw-h-7 tw-grid tw-place-items-center tw-rounded-md tw-text-fg-secondary hover:tw-bg-bg-secondary focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-fg-info"
      >
        <X size={16} aria-hidden />
      </button>
    </div>
  );
}

/* ─── Nav group (section with eyebrow label) ──────────────────────── */

function NavGroup({ group, badges }) {
  return (
    <div className="tw-pt-4">
      {/* Section label — prominent: accent border + tinted bg pill */}
      <div className="tw-px-2 tw-pb-2 tw-pt-1">
        <div className="tw-flex tw-items-center tw-gap-2 tw-pl-2 tw-border-l-2 tw-border-fg-info">
          <span className="tw-text-[11px] tw-font-bold tw-tracking-[0.08em] tw-uppercase tw-text-fg-info tw-select-none">
            {group.label}
          </span>
          <div className="tw-flex-1 tw-h-px tw-bg-bg-info tw-opacity-60" />
        </div>
      </div>

      <ul className="tw-flex tw-flex-col tw-gap-[2px] tw-list-none tw-pl-0 tw-m-0" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {group.items.map((item) =>
          item.children ? (
            <motion.li key={item.title} variants={itemVariants} className="tw-list-none">
              <NavParent item={item} badges={badges} />
            </motion.li>
          ) : (
            <motion.li key={item.path} variants={itemVariants} className="tw-list-none">
              <NavLeaf item={item} badges={badges} />
            </motion.li>
          ),
        )}
      </ul>
    </div>
  );
}

/* ─── Leaf (plain link) ───────────────────────────────────────────── */

function NavLeaf({ item, indent = false, badges }) {
  const Icon = item.icon;
  const badge = badges[item.path];

  return (
    <NavLink
      to={item.path}
      end
      className={({ isActive }) =>
        cn(
          'tw-relative tw-flex tw-items-center tw-gap-3 tw-px-4 tw-py-2 tw-rounded-md tw-no-underline',
          'tw-text-[13px] tw-text-fg-secondary',
          'tw-transition-colors tw-duration-fast tw-ease-out-soft',
          'hover:tw-bg-bg-secondary hover:tw-text-fg-primary',
          'focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-fg-info focus-visible:tw-ring-offset-0',
          indent && 'tw-pl-10',
          isActive &&
            'tw-bg-bg-info tw-text-fg-info tw-font-medium before:tw-content-[""] before:tw-absolute before:tw-left-0 before:tw-top-1 before:tw-bottom-1 before:tw-w-[3px] before:tw-rounded-r before:tw-bg-fg-info',
        )
      }
    >
      {Icon && !indent && <Icon size={15} aria-hidden className="tw-shrink-0 tw-opacity-75" />}
      <span className="tw-flex-1 tw-truncate tw-text-left">{item.title}</span>
      {badge != null && (
        <span className="tw-text-[10px] tw-leading-none tw-px-1.5 tw-py-[2px] tw-rounded-full tw-bg-bg-secondary tw-text-fg-secondary tw-font-medium tw-tabular-nums tw-shrink-0">
          {badge}
        </span>
      )}
    </NavLink>
  );
}

/* ─── Parent (collapsible dropdown) ──────────────────────────────── */

function NavParent({ item, badges }) {
  const id = useId();
  const { pathname } = useLocation();
  const hasActive = item.children.some(
    (c) => pathname === c.path || pathname.startsWith(c.path + '/'),
  );
  const [open, setOpen] = useState(hasActive);

  useEffect(() => {
    if (hasActive) setOpen(true);
  }, [hasActive]);

  const Icon = item.icon;

  return (
    <>
      <motion.button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'tw-w-full tw-flex tw-items-center tw-gap-3 tw-px-4 tw-py-2 tw-rounded-md',
          'tw-text-[13px] tw-text-fg-secondary',
          'tw-bg-transparent tw-border-0 tw-outline-none tw-appearance-none',
          'tw-transition-colors tw-duration-fast tw-ease-out-soft',
          'hover:tw-bg-bg-secondary hover:tw-text-fg-primary',
          'focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-fg-info',
          hasActive && 'tw-text-fg-primary',
        )}
      >
        {Icon && <Icon size={15} aria-hidden className="tw-shrink-0 tw-opacity-75" />}
        <span className="tw-flex-1 tw-truncate tw-text-left">{item.title}</span>
        <motion.span
          animate={{ rotate: open ? 90 : 0 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="tw-shrink-0"
        >
          <ChevronRight size={14} aria-hidden />
        </motion.span>
      </motion.button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.ul
            id={id}
            key="children"
            variants={dropdownVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{ overflow: 'hidden', listStyle: 'none', padding: 0, margin: 0 }}
            className="tw-mt-[1px] tw-list-none tw-pl-0 tw-m-0"
          >
            {item.children.map((child) => (
              <motion.li key={child.path} variants={childVariants} className="tw-list-none">
                <NavLeaf item={child} indent badges={badges} />
              </motion.li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </>
  );
}
