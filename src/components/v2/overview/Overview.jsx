/*
 * Overview — v2 dashboard page.
 *
 * Visual reference: the SaaS Admin Dashboard preview HTML + the Shopzy
 * screenshot supplied by the user. The page is end-to-end rebuilt with
 * the v2 design tokens; nothing here imports from react-bootstrap.
 *
 * Data wiring strategy: the existing useDashboardQuery is used wherever
 * the legacy Dashboard already had a value for a given KPI, so the
 * authoritative numbers don't drift. Areas that don't yet have a backend
 * (the time-series chart, the recent-activity feed, the goals ring,
 * the recent-transactions table) use clearly-labelled placeholder data
 * with TODO markers — they're ready to be wired to real endpoints
 * without restructuring the JSX.
 */

import React, { useMemo, useState } from 'react';
import {
  ArrowUpRight, ArrowDownRight, Filter, Download, MoreHorizontal,
  CreditCard, Wallet, Users, TrendingUp, CheckCircle2, UserPlus,
  Package, AlertTriangle, ChevronDown,
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip as RTooltip, RadialBarChart, RadialBar, PolarAngleAxis,
  PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts';
import { useDashboardQuery } from '../../../services/auth';
import { cn } from '../../../lib/cn';

/* ───────────────────────────── helpers ───────────────────────────── */

const fmtINR = (n) =>
  '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtNum = (n) => Number(n || 0).toLocaleString('en-IN');

/* Find a metric in legacy dashboardDetails by partial title match. The
 * legacy API ships a flat "dashboardDetails" array of {title, value, …}
 * — this lets us pull a specific tile without depending on its index. */
function pickMetric(details = [], match) {
  const m = match.toLowerCase();
  return details.find((d) => (d.title || '').toLowerCase().includes(m));
}

/* ───────────────────────── inline primitives ──────────────────────── */

function Card({ className, children, promoted, ...rest }) {
  return (
    <div
      className={cn(
        'tw-bg-bg-primary tw-border tw-border-hairline tw-rounded-md',
        promoted ? 'tw-border-fg-info tw-border-2' : 'tw-border-tertiary',
        'tw-transition-shadow tw-duration-base tw-ease-out-soft hover:tw-shadow-sm',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

function Pill({ tone = 'neutral', children }) {
  const tones = {
    success: 'tw-bg-bg-success tw-text-fg-success',
    warning: 'tw-bg-bg-warning tw-text-fg-warning',
    danger:  'tw-bg-bg-danger  tw-text-fg-danger',
    neutral: 'tw-bg-bg-secondary tw-text-fg-secondary',
  };
  return (
    <span className={cn('tw-inline-block tw-px-2 tw-py-[2px] tw-rounded-sm tw-text-[11px] tw-font-medium', tones[tone])}>
      {children}
    </span>
  );
}

function Delta({ value }) {
  const up = Number(value) >= 0;
  return (
    <span
      className={cn(
        'tw-inline-flex tw-items-center tw-gap-1 tw-text-[11px] tw-font-medium tw-tabular-nums',
        up ? 'tw-text-fg-success' : 'tw-text-fg-danger',
      )}
    >
      {up ? <ArrowUpRight size={12} aria-hidden /> : <ArrowDownRight size={12} aria-hidden />}
      {up ? '+' : ''}{Number(value).toFixed(1)}%
    </span>
  );
}

function IconTile({ tone = 'info', children }) {
  const tones = {
    info:    'tw-bg-bg-info tw-text-fg-info',
    success: 'tw-bg-bg-success tw-text-fg-success',
    warning: 'tw-bg-bg-warning tw-text-fg-warning',
    danger:  'tw-bg-bg-danger tw-text-fg-danger',
  };
  return (
    <div className={cn('tw-w-7 tw-h-7 tw-rounded-sm tw-grid tw-place-items-center', tones[tone])}>
      {children}
    </div>
  );
}

/* ───────────────────────────── KPI cards ─────────────────────────── */

function KpiPlain({ icon, label, value, delta, sub, miniChart }) {
  return (
    <Card className="tw-p-3">
      <div className="tw-flex tw-items-start tw-justify-between tw-gap-3">
        <div className="tw-min-w-0">
          <div className="tw-flex tw-items-center tw-gap-2">
            <IconTile>{icon}</IconTile>
            {delta != null && <Delta value={delta} />}
          </div>
          <div className="tw-text-[12px] tw-text-fg-secondary tw-mt-3">{label}</div>
          <div className="tw-text-[20px] tw-font-medium tw-text-fg-primary tw-tabular-nums tw-mt-1 tw-truncate">
            {value}
          </div>
          {sub && <div className="tw-text-[11px] tw-text-fg-tertiary tw-mt-1">{sub}</div>}
        </div>
        {miniChart && <div className="tw-w-[72px] tw-h-[60px] tw-shrink-0">{miniChart}</div>}
      </div>
    </Card>
  );
}

function KpiPromoted({ icon, label, value, percent }) {
  return (
    <Card promoted className="tw-p-3 tw-relative">
      <div
        aria-hidden
        className="tw-absolute tw-top-2 tw-right-2 tw-text-[10px] tw-font-medium tw-text-fg-info tw-tabular-nums"
      >
        {percent}%
      </div>
      <div className="tw-w-7 tw-h-7 tw-rounded-sm tw-bg-bg-info tw-text-fg-info tw-grid tw-place-items-center">
        {icon}
      </div>
      <div className="tw-text-[20px] tw-font-medium tw-text-fg-primary tw-tabular-nums tw-mt-3 tw-truncate">
        {value}
      </div>
      <div className="tw-text-[12px] tw-text-fg-secondary tw-mt-1">{label}</div>
    </Card>
  );
}

/* Mini donut for the "Income" KPI */
function DonutMini({ percent = 65 }) {
  const data = [{ name: 'value', value: percent }];
  return (
    <ResponsiveContainer>
      <RadialBarChart innerRadius="64%" outerRadius="100%" startAngle={90} endAngle={-270} data={data}>
        <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
        <RadialBar background={{ fill: 'var(--color-background-secondary)' }} dataKey="value" cornerRadius={6} fill="var(--color-chart-2)" />
      </RadialBarChart>
    </ResponsiveContainer>
  );
}

/* Mini bars for the "Current balance" KPI */
function BarMini({ data }) {
  return (
    <ResponsiveContainer>
      <BarChart data={data}>
        <Bar dataKey="v" fill="var(--color-chart-1)" radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ─────────────────────────── revenue chart ───────────────────────── */

const CHART_RANGES = {
  '7d': 7, '30d': 30, '90d': 90,
};

function RevenuePanel() {
  const [range, setRange] = useState('30d');

  // TODO: replace with real time-series query from /admin/dashboard/revenue?range=…
  const series = useMemo(() => {
    const days = CHART_RANGES[range];
    const seed = days === 7 ? 800 : days === 30 ? 2000 : 6000;
    return Array.from({ length: days }, (_, i) => {
      const noise = Math.sin(i * 0.6) * 250 + (Math.random() - 0.5) * 200;
      return {
        d: i + 1,
        revenue: Math.max(0, seed * 0.5 + noise + i * 8),
      };
    });
  }, [range]);

  const peak = useMemo(() => series.reduce((m, p) => (p.revenue > m.revenue ? p : m), series[0] || { revenue: 0 }), [series]);

  return (
    <Card className="tw-p-4 tw-h-full">
      <div className="tw-flex tw-items-start tw-justify-between tw-mb-3">
        <div>
          <div className="tw-text-h3 tw-text-fg-primary">Revenue</div>
          <div className="tw-mt-1 tw-text-[11px] tw-text-fg-tertiary tw-tabular-nums">
            Peak {fmtINR(peak.revenue)} on day {peak.d}
          </div>
        </div>
        <Segmented value={range} onChange={setRange} options={['7d', '30d', '90d']} />
      </div>
      <div className="tw-h-[260px]">
        <ResponsiveContainer>
          <AreaChart data={series} margin={{ top: 4, right: 6, left: -12, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueFade" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.18} />
                <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--color-border-tertiary)" strokeDasharray="2 4" vertical={false} />
            <XAxis
              dataKey="d"
              tickLine={false}
              axisLine={false}
              tick={{ fill: 'var(--color-text-tertiary)', fontSize: 11 }}
              interval="preserveStartEnd"
            />
            <YAxis
              tickFormatter={(v) => '₹' + Math.round(v / 1000) + 'k'}
              tickLine={false}
              axisLine={false}
              tick={{ fill: 'var(--color-text-tertiary)', fontSize: 11 }}
              width={48}
            />
            <RTooltip content={<TooltipPill />} cursor={{ stroke: 'var(--color-text-info)', strokeDasharray: '3 3' }} />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="var(--color-chart-1)"
              strokeWidth={2}
              fill="url(#revenueFade)"
              activeDot={{ r: 4, stroke: 'var(--color-bg-primary)', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

function TooltipPill({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const v = payload[0].value;
  return (
    <div
      role="tooltip"
      className="tw-px-2 tw-py-1 tw-rounded-sm tw-text-[11px] tw-font-medium tw-tabular-nums tw-shadow-md"
      style={{ background: 'var(--color-tooltip-bg)', color: 'var(--color-tooltip-fg)' }}
    >
      {fmtINR(v)}
    </div>
  );
}

function Segmented({ value, onChange, options }) {
  return (
    <div role="tablist" aria-label="Time range" className="tw-inline-flex tw-bg-bg-secondary tw-rounded-sm tw-p-[2px] tw-gap-[2px]">
      {options.map((opt) => {
        const active = value === opt;
        return (
          <button
            key={opt}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt)}
            className={cn(
              'tw-text-[11px] tw-font-medium tw-px-2 tw-py-1 tw-rounded-sm tw-tabular-nums',
              'tw-transition-colors tw-duration-fast tw-ease-out-soft',
              'focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-fg-info',
              active ? 'tw-bg-bg-primary tw-text-fg-primary tw-shadow-xs' : 'tw-text-fg-secondary hover:tw-text-fg-primary',
            )}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

/* ──────────────────────── recent activity rail ────────────────────── */

const RECENT_ACTIVITY = [
  // TODO: wire to /admin/dashboard/activity
  { id: 1, type: 'paid',     title: 'Recharge ₹249 from Priya S.', sub: '₹249.00',          time: '2m',  icon: 'check',  tone: 'success' },
  { id: 2, type: 'signup',   title: 'New listener applied',         sub: 'Calvina Braganza', time: '14m', icon: 'user',   tone: 'info'    },
  { id: 3, type: 'session',  title: 'Long session ended',           sub: 'Maryam · 28 min',  time: '38m', icon: 'package',tone: 'info'    },
  { id: 4, type: 'rejected', title: 'Refund requested',             sub: 'Order #4789',      time: '1h',  icon: 'alert',  tone: 'warning' },
];

function ActivityPanel() {
  return (
    <Card className="tw-p-4 tw-h-full">
      <div className="tw-flex tw-items-center tw-justify-between tw-mb-2">
        <div className="tw-text-h3 tw-text-fg-primary">Recent activity</div>
        <button
          type="button"
          className="tw-text-[11px] tw-font-medium tw-text-fg-info hover:tw-underline focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-fg-info tw-rounded-sm"
        >
          View all
        </button>
      </div>
      <ul className="tw-divide-y tw-divide-tertiary">
        {RECENT_ACTIVITY.map((a) => (
          <li key={a.id} className="tw-flex tw-items-center tw-gap-3 tw-py-2">
            <IconTile tone={a.tone}>
              {a.icon === 'check'   && <CheckCircle2 size={14} aria-hidden />}
              {a.icon === 'user'    && <UserPlus     size={14} aria-hidden />}
              {a.icon === 'package' && <Package      size={14} aria-hidden />}
              {a.icon === 'alert'   && <AlertTriangle size={14} aria-hidden />}
            </IconTile>
            <div className="tw-flex-1 tw-min-w-0">
              <div className="tw-text-[12px] tw-font-medium tw-text-fg-primary tw-truncate">{a.title}</div>
              <div className="tw-text-[11px] tw-text-fg-tertiary tw-tabular-nums tw-truncate">{a.sub}</div>
            </div>
            <div className="tw-text-[11px] tw-text-fg-tertiary tw-tabular-nums tw-shrink-0">{a.time}</div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

/* ──────────────────────── recent transactions ─────────────────────── */

const RECENT_TXNS = [
  // TODO: wire to /admin/payment-list or similar
  { id: '#4821', name: 'Priya Sharma',  initials: 'PS', tone: 'info',    status: 'paid',    amount: 249.00,  delta: -15.65, date: 'May 6, 14:32' },
  { id: '#4820', name: 'Arjun Rao',     initials: 'AR', tone: 'info',    status: 'pending', amount: 89.50,   delta:  +5.2,  date: 'May 6, 13:18' },
  { id: '#4819', name: 'Neha Kapoor',   initials: 'NK', tone: 'success', status: 'paid',    amount: 1420.00, delta: +18.65, date: 'May 6, 11:02' },
  { id: '#4818', name: 'Rohan Joshi',   initials: 'RJ', tone: 'warning', status: 'failed',  amount: 59.00,   delta: -2.1,   date: 'May 6, 09:47' },
  { id: '#4817', name: 'Sara Desai',    initials: 'SD', tone: 'info',    status: 'paid',    amount: 320.75,  delta: +9.0,   date: 'May 5, 19:21' },
];

function TransactionsPanel() {
  return (
    <Card className="tw-p-0 tw-overflow-hidden">
      <div className="tw-flex tw-items-center tw-justify-between tw-px-4 tw-py-3 tw-border-b tw-border-hairline tw-border-tertiary">
        <div className="tw-text-h3 tw-text-fg-primary">Recent transactions</div>
        <div className="tw-flex tw-items-center tw-gap-2">
          <IconCircleButton ariaLabel="Filter"><Filter size={14} /></IconCircleButton>
          <IconCircleButton ariaLabel="Export"><Download size={14} /></IconCircleButton>
          <IconCircleButton ariaLabel="More"><MoreHorizontal size={14} /></IconCircleButton>
        </div>
      </div>
      <table className="tw-w-full tw-text-[12px]">
        <thead>
          <tr className="tw-text-eyebrow tw-text-fg-tertiary">
            <Th>Order</Th>
            <Th>Customer</Th>
            <Th>Status</Th>
            <Th align="right">Amount</Th>
            <Th align="right">Δ</Th>
            <Th>Date</Th>
          </tr>
        </thead>
        <tbody>
          {RECENT_TXNS.map((t, i) => (
            <tr
              key={t.id}
              className={cn(
                'tw-transition-colors tw-duration-fast hover:tw-bg-bg-secondary',
                i !== RECENT_TXNS.length - 1 && 'tw-border-b tw-border-hairline tw-border-tertiary',
              )}
            >
              <Td>{t.id}</Td>
              <Td>
                <div className="tw-flex tw-items-center tw-gap-2">
                  <MiniAvatar tone={t.tone}>{t.initials}</MiniAvatar>
                  <span className="tw-text-fg-primary">{t.name}</span>
                </div>
              </Td>
              <Td><Pill tone={t.status === 'paid' ? 'success' : t.status === 'pending' ? 'warning' : 'danger'}>{t.status[0].toUpperCase() + t.status.slice(1)}</Pill></Td>
              <Td align="right">{fmtINR(t.amount)}</Td>
              <Td align="right"><Delta value={t.delta} /></Td>
              <Td>{t.date}</Td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

function Th({ align = 'left', children }) {
  return (
    <th
      className={cn(
        'tw-text-eyebrow tw-text-fg-tertiary tw-font-medium tw-px-4 tw-py-2',
        align === 'right' ? 'tw-text-right' : 'tw-text-left',
      )}
    >
      {children}
    </th>
  );
}
function Td({ align = 'left', children }) {
  return (
    <td
      className={cn(
        'tw-px-4 tw-py-3 tw-text-fg-secondary tw-tabular-nums',
        align === 'right' ? 'tw-text-right' : 'tw-text-left',
      )}
    >
      {children}
    </td>
  );
}

function MiniAvatar({ tone = 'info', children }) {
  const tones = {
    info:    'tw-bg-bg-info tw-text-fg-info',
    success: 'tw-bg-bg-success tw-text-fg-success',
    warning: 'tw-bg-bg-warning tw-text-fg-warning',
    danger:  'tw-bg-bg-danger tw-text-fg-danger',
  };
  return (
    <div className={cn('tw-w-6 tw-h-6 tw-rounded-full tw-grid tw-place-items-center tw-text-[10px] tw-font-medium', tones[tone])}>
      {children}
    </div>
  );
}

function IconCircleButton({ ariaLabel, children }) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      className={cn(
        'tw-w-7 tw-h-7 tw-grid tw-place-items-center tw-rounded-sm',
        'tw-bg-bg-primary tw-border tw-border-hairline tw-border-tertiary tw-text-fg-secondary',
        'hover:tw-bg-bg-secondary hover:tw-text-fg-primary',
        'tw-transition-colors tw-duration-fast tw-ease-out-soft',
        'focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-fg-info',
      )}
    >
      {children}
    </button>
  );
}

/* ─────────────────────────── goals card ──────────────────────────── */

function GoalRing({ label, sub, percent, color }) {
  const data = [{ name: 'value', value: percent }];
  return (
    <div className="tw-flex tw-items-center tw-gap-3">
      <div className="tw-w-[58px] tw-h-[58px] tw-shrink-0 tw-relative">
        <ResponsiveContainer>
          <RadialBarChart innerRadius="70%" outerRadius="100%" startAngle={90} endAngle={-270} data={data}>
            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
            <RadialBar background={{ fill: 'var(--color-background-secondary)' }} dataKey="value" cornerRadius={6} fill={color} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="tw-absolute tw-inset-0 tw-grid tw-place-items-center tw-text-[11px] tw-font-medium tw-text-fg-primary tw-tabular-nums">
          {percent}%
        </div>
      </div>
      <div className="tw-min-w-0">
        <div className="tw-text-[12px] tw-font-medium tw-text-fg-primary tw-truncate">{label}</div>
        <div className="tw-text-[11px] tw-text-fg-tertiary tw-truncate">{sub}</div>
      </div>
    </div>
  );
}

function GoalsPanel() {
  // TODO: wire to /admin/dashboard/goals
  return (
    <Card className="tw-p-4 tw-h-full">
      <div className="tw-text-h3 tw-text-fg-primary tw-mb-3">Goals</div>
      <div className="tw-flex tw-flex-col tw-gap-3">
        <GoalRing label="Weekly target" sub="25% achieved" percent={25} color="var(--color-chart-2)" />
        <GoalRing label="Monthly target" sub="50% achieved" percent={50} color="var(--color-chart-1)" />
      </div>
    </Card>
  );
}

/* ───────────────────────── empty + error ────────────────────────── */

function EmptyState({ title, body }) {
  return (
    <div className="tw-py-10 tw-text-center">
      <div className="tw-text-h3 tw-text-fg-primary">{title}</div>
      <div className="tw-mt-1 tw-text-small tw-text-fg-tertiary">{body}</div>
    </div>
  );
}

function ErrorState({ message }) {
  return (
    <div className="tw-py-6 tw-px-4 tw-rounded-md tw-bg-bg-danger tw-text-fg-danger tw-text-small">
      Couldn't load dashboard data — {message || 'try again later'}.
    </div>
  );
}

/* ─────────────────────────────── page ────────────────────────────── */

export default function Overview() {
  const { data, isLoading, error } = useDashboardQuery();
  const details = data?.dashboardDetails || [];

  // Pull authoritative values where the legacy API has them.
  const totalRevenue   = pickMetric(details, 'total revenue')   || pickMetric(details, 'monthly revenue');
  const todayRevenue   = pickMetric(details, "today");
  const activeUsers    = pickMetric(details, 'active users');
  const totalListeners = pickMetric(details, 'listeners') || pickMetric(details, 'verified listener');

  // Mini-bar mock series for "Wallet balance" KPI
  const balanceSeries = useMemo(() =>
    [4, 7, 5, 9, 6, 8, 10].map((v, i) => ({ i, v })), []);

  return (
    <div className="tw-flex tw-flex-col tw-gap-4">
      {/* Page head */}
      <div className="tw-flex tw-items-end tw-justify-between tw-gap-4 tw-flex-wrap">
        <div>
          <h1 className="tw-text-h1 tw-text-fg-primary tw-m-0">Overview</h1>
          <p className="tw-text-small tw-text-fg-tertiary tw-mt-1 tw-mb-0">
            Here's what's happening on Talk and Relax today.
          </p>
        </div>
        <button
          type="button"
          className={cn(
            'tw-inline-flex tw-items-center tw-gap-2 tw-text-small tw-font-medium',
            'tw-bg-fg-info tw-text-white tw-px-3 tw-py-2 tw-rounded-md',
            'tw-shadow-xs hover:tw-opacity-90',
            'tw-transition-opacity tw-duration-fast tw-ease-out-soft',
            'focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-fg-info focus-visible:tw-ring-offset-2',
          )}
        >
          <TrendingUp size={14} aria-hidden />
          Generate report
        </button>
      </div>

      {error && <ErrorState message={error?.data?.message || error?.message} />}

      {/* KPI strip */}
      <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 lg:tw-grid-cols-4 tw-gap-3">
        <KpiPlain
          icon={<Wallet size={14} aria-hidden />}
          label="Total revenue"
          value={isLoading ? '—' : fmtINR(totalRevenue?.value ?? 0)}
          delta={12.4}
          sub="This month"
          miniChart={<DonutMini percent={65} />}
        />
        <KpiPlain
          icon={<CreditCard size={14} aria-hidden />}
          label="Wallet balance"
          value={isLoading ? '—' : fmtINR(activeUsers?.subValue ?? 0)}
          delta={3.6}
          sub="Across all users"
          miniChart={<BarMini data={balanceSeries} />}
        />
        <KpiPromoted
          icon={<Users size={14} aria-hidden />}
          label="Active sessions"
          value={isLoading ? '—' : fmtNum(activeUsers?.value ?? 0)}
          percent={68}
        />
        <KpiPromoted
          icon={<TrendingUp size={14} aria-hidden />}
          label={todayRevenue?.title || "Today's revenue"}
          value={isLoading ? '—' : fmtINR(todayRevenue?.value ?? 0)}
          percent={78}
        />
      </div>

      {/* Chart + activity */}
      <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-3 tw-gap-3">
        <div className="lg:tw-col-span-2">
          <RevenuePanel />
        </div>
        <ActivityPanel />
      </div>

      {/* Transactions + goals */}
      <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-3 tw-gap-3">
        <div className="lg:tw-col-span-2">
          {!isLoading && details.length === 0 ? (
            <Card className="tw-p-0">
              <EmptyState
                title="No data yet"
                body="Once orders start flowing, they'll show up here."
              />
            </Card>
          ) : (
            <TransactionsPanel />
          )}
        </div>
        <GoalsPanel />
      </div>
    </div>
  );
}
