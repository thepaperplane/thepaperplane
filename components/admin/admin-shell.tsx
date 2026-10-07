'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  BarChart3,
  Bot,
  Briefcase,
  Cable,
  CalendarClock,
  Workflow,
  MessageCircle,
  Building2,
  CheckSquare,
  FileText,
  Inbox,
  LayoutDashboard,
  LogOut,
  Mail,
  Megaphone,
  Menu,
  MonitorSmartphone,
  Newspaper,
  PenLine,
  Quote,
  ReceiptIndianRupee,
  Settings,
  ShieldCheck,
  Users,
  X,
  FileSignature,
  Tags,
} from 'lucide-react';
import { EDITOR_COOKIE } from '@/lib/console';
import { LogoMark } from '@/components/brand/logo';
import { browserClient } from '@/lib/supabase-browser';
import type { ProfileRow } from '@/lib/database.types';
import { cn } from '@/lib/utils';

type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
  exact?: boolean;
};

const NAV: { group: string; items: NavItem[] }[] = [
  {
    group: '',
    items: [{ href: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true }],
  },
  {
    group: 'Sales & clients',
    items: [
      { href: '/admin/enquiries', label: 'Leads & enquiries', icon: Inbox },
      { href: '/admin/clients', label: 'Clients', icon: Building2 },
      { href: '/admin/tasks', label: 'Tasks & deadlines', icon: CheckSquare },
      { href: '/admin/quotes', label: 'Quotations', icon: FileSignature },
      { href: '/admin/pricing', label: 'Pricing', icon: Tags },
      { href: '/admin/invoices', label: 'Invoices', icon: ReceiptIndianRupee },
      { href: '/admin/meetings', label: 'Meetings', icon: CalendarClock },
      { href: '/admin/whatsapp', label: 'WhatsApp assistant', icon: MessageCircle },
      { href: '/admin/assistant', label: 'Site assistant', icon: Bot },
      { href: '/admin/automations', label: 'Autopilot', icon: Workflow },
    ],
  },
  {
    group: 'Marketing',
    items: [
      { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
      { href: '/admin/marketing', label: 'Campaigns', icon: Megaphone },
      { href: '/admin/testimonials', label: 'Testimonials', icon: Quote },
      { href: '/admin/subscribers', label: 'Subscribers', icon: Mail },
    ],
  },
  {
    group: 'Website',
    items: [
      { href: '/admin/content', label: 'Pages & copy', icon: FileText },
      { href: '/admin/portfolio', label: 'Work', icon: MonitorSmartphone },
      { href: '/admin/careers', label: 'Careers', icon: Briefcase },
      { href: '/admin/news', label: 'News feeds', icon: Newspaper },
    ],
  },
  {
    group: 'Settings',
    items: [
      { href: '/admin/settings', label: 'Site settings', icon: Settings },
      { href: '/admin/integrations', label: 'Zoho & integrations', icon: Cable },
      { href: '/admin/security', label: 'Security', icon: ShieldCheck },
      { href: '/admin/team', label: 'Account', icon: Users },
    ],
  },
];

const ROLE_LABEL: Record<string, string> = {
  owner: 'Owner',
  admin: 'Administrator',
  editor: 'Editor',
  viewer: 'Viewer',
};

export function AdminShell({
  profile,
  children,
}: {
  profile: ProfileRow;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  async function signOut() {
    try {
      await browserClient().auth.signOut();
    } finally {
      document.cookie = `${EDITOR_COOKIE}=; Max-Age=0; path=/`;
      router.push('/admin/login');
      router.refresh();
    }
  }

  const initials =
    (profile.full_name ?? profile.email)
      .split(/[\s@.]+/)
      .filter(Boolean)
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'PP';

  return (
    <div className="bg-sunken min-h-dvh">
      {/* Top bar (mobile) */}
      <header className="bg-surface/90 sticky top-0 z-30 flex h-14 items-center justify-between border-b border-[var(--hairline)] px-4 backdrop-blur-xl lg:hidden">
        <Link href="/admin" className="flex items-center gap-2.5">
          <LogoMark className="h-7 w-10" />
          <span className="text-ink text-[0.9375rem] font-semibold">Admin</span>
        </Link>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          className="text-ink hover:bg-sunken flex h-10 w-10 items-center justify-center rounded-[var(--radius-sm)]"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      <div className="lg:flex">
        {/* Sidebar */}
        <aside
          className={cn(
            'bg-surface border-r border-[var(--hairline)] lg:sticky lg:top-0 lg:h-dvh lg:w-64 lg:shrink-0',
            open ? 'block' : 'hidden lg:block',
          )}
        >
          <div className="flex h-full flex-col">
            <div className="hidden items-center gap-2.5 px-5 py-5 lg:flex">
              <LogoMark className="h-8 w-[2.85rem]" />
              <div className="leading-none">
                <span className="text-ink block text-[0.9375rem] font-semibold">
                  The Paper Plane
                </span>
                <span className="text-ink-3 mt-0.5 block text-[0.6875rem]">Admin console</span>
              </div>
            </div>

            <div className="px-3 pb-2">
              <Link
                href="/"
                className="bg-ink text-ground flex h-10 items-center justify-center gap-2 rounded-[var(--radius-md)] text-[0.875rem] font-semibold"
              >
                <PenLine className="h-4 w-4" strokeWidth={2} />
                Edit website visually
              </Link>
            </div>

            <nav className="flex-1 overflow-y-auto px-3 py-3 lg:py-1" aria-label="Admin">
              {NAV.map(({ group, items }) => (
                <div key={group || 'top'} className="mb-3">
                  {group ? (
                    <p className="text-ink-3 px-3 pt-2 pb-1.5 text-[0.6875rem] font-semibold tracking-[0.08em] uppercase">
                      {group}
                    </p>
                  ) : null}
                  {items.map(({ href, label, icon: Icon, exact }) => {
                    const active = isActive(href, exact);
                    return (
                      <Link
                        key={href}
                        href={href}
                        onClick={() => setOpen(false)}
                        aria-current={active ? 'page' : undefined}
                        className={cn(
                          'flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2 text-[0.875rem] font-medium transition-colors',
                          active
                            ? 'bg-accent-wash text-accent'
                            : 'text-ink-2 hover:bg-sunken hover:text-ink',
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
                        {label}
                      </Link>
                    );
                  })}
                </div>
              ))}
            </nav>

            <div className="border-t border-[var(--hairline)] p-3">
              <div className="flex items-center gap-3 px-2 py-2">
                <span className="bg-accent-wash text-accent flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[0.75rem] font-semibold">
                  {initials}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-ink truncate text-[0.875rem] font-medium">
                    {profile.full_name ?? profile.email}
                  </p>
                  <p className="text-ink-3 truncate text-[0.75rem]">
                    {ROLE_LABEL[profile.role] ?? profile.role}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={signOut}
                className="text-ink-2 hover:bg-sunken hover:text-ink mt-1 flex w-full items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 text-[0.875rem] font-medium transition-colors"
              >
                <LogOut className="h-4 w-4" strokeWidth={2} />
                Sign out
              </button>

              <Link
                href="/"
                className="text-ink-3 hover:text-ink mt-1 block px-3 py-2 text-[0.8125rem] transition-colors"
              >
                ← Back to website
              </Link>
            </div>
          </div>
        </aside>

        {/* Content */}
        <main className="min-w-0 flex-1 px-5 py-6 sm:px-8 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
