import React, { useState } from 'react';
import { ThemeProvider } from './ThemeProvider';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import CommandMenu from './CommandMenu';
import { ToastProvider } from '../components/v2/ui/toast';

/**
 * Top-level shell for every authenticated v2 page.
 *
 * Layout
 *   ┌──────────────────────────────────────────┐
 *   │ Sidebar │ Topbar                         │
 *   │ (220px) ├────────────────────────────────┤
 *   │         │ Content (children)             │
 *   │         │                                │
 *   └──────────────────────────────────────────┘
 *
 * - Below md the sidebar is hidden; tap the menu icon in the topbar to
 *   slide it in from the left.
 * - ⌘K / Ctrl-K opens the command palette from anywhere.
 * - The shell wraps the legacy Routes block in Main.jsx without changing
 *   any route or any business logic.
 */
export default function AppShell({ user, badges, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <ThemeProvider>
      <ToastProvider>
        <div className="appshell-v2 tw-min-h-screen tw-bg-bg-tertiary dark:tw-bg-[#080a0e] tw-text-fg-secondary">
          <div className="tw-flex tw-min-h-screen">
            <Sidebar
              open={sidebarOpen}
              onClose={() => setSidebarOpen(false)}
              badges={badges}
            />
            <div className="tw-flex tw-flex-col tw-flex-1 tw-min-w-0">
              <Topbar
                onMenuClick={() => setSidebarOpen(true)}
                onSearchOpen={() => setSearchOpen(true)}
                user={user}
              />
              <main
                id="main-content"
                tabIndex={-1}
                className="tw-flex-1 tw-min-w-0 tw-p-4 md:tw-p-6"
              >
                {children}
              </main>
            </div>
          </div>
          <CommandMenu open={searchOpen} onOpenChange={setSearchOpen} />
        </div>
      </ToastProvider>
    </ThemeProvider>
  );
}
