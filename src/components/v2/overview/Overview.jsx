/*
 * Overview — v2 dashboard page (refactored to consume the v2 UI library).
 *
 * Visual reference: SaaS Admin Dashboard preview HTML + Shopzy screenshot.
 * Every primitive imported here lives in src/components/v2/ui/. Inline
 * primitives (Card, Pill, Delta, Table, etc.) have been extracted; the
 * page is now mostly composition + the chart-specific markup.
 */

import React, { useMemo, useState } from 'react';
import {
  Filter, Download, MoreHorizontal,
  CreditCard, Wallet, Users, TrendingUp, CheckCircle2, UserPlus,
  Package, AlertTriangle,
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip as RTooltip,
} from 'recharts';
import { useDashboardQuery } from '../../../services/auth';
import {
  Card, CardHeader, CardTitle,
  Button, IconButton,
  Pill, Delta,
  IconTile, Avatar,
  Segmented,
  EmptyState, ErrorBanner,
  KpiPlain, KpiPromoted, DonutMini, BarMini, GoalRing,
  Table, THead, TBody, TR, Th, Td, TableSkeleton,
  TooltipPill,
  Tooltip,
} from '../ui';

/* ───────────────────────────── helpers ───────────────────────────── */

const fmtINR = (n) =>
  '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtNum = (n) => Number(n || 0).toLocaleString('en-IN');

function pickMetric(details = [], match) {
  const m = match.toLowerCase();
  return details.find((d) => (d.title || '').toLowerCase().includes(m));
}

/* ─────────────────────────── revenue chart ───────────────────────── */

const CHART_RANGES = { '7d': 7, '30d': 30, '90d': 90 };

function RevenuePanel() {
  const [range, setRange] = useState('30d');

  // TODO: replace with real time-series query from /admin/dashboard/revenue?range=…
  const series = useMemo(() => {
    const days = CHART_RANGES[range];
    const seed = days === 7 ? 800 : days === 30 ? 2000 : 6000;
    return Array.from({ length: days }, (_, i) => {
      const noise = Math.sin(i * 0.6) * 250 + (Math.random() - 0.5) * 200;
      return { d: i + 1, revenue: Math.max(0, seed * 0.5 + noise + i * 8) };
    });
  }, [range]);

  const peak = useMemo(
    () => series.reduce((m, p) => (p.revenue > m.revenue ? p : m), series[0] || { revenue: 0 }),
    [series],
  );

  return (
    <Card className="tw-h-full tw-p-4">
      <CardHeader
        action={<Segmented value={range} onChange={setRange} options={['7d', '30d', '90d']} />}
      >
        <CardTitle>Revenue</CardTitle>
        <div className="tw-mt-1 tw-text-[11px] tw-text-fg-tertiary tw-tabular-nums">
          Peak {fmtINR(peak.revenue)} on day {peak.d}
        </div>
      </CardHeader>

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
              dataKey="d" tickLine={false} axisLine={false}
              tick={{ fill: 'var(--color-text-tertiary)', fontSize: 11 }}
              interval="preserveStartEnd"
            />
            <YAxis
              tickFormatter={(v) => '₹' + Math.round(v / 1000) + 'k'}
              tickLine={false} axisLine={false}
              tick={{ fill: 'var(--color-text-tertiary)', fontSize: 11 }}
              width={48}
            />
            <RTooltip content={<TooltipPill formatter={fmtINR} />} cursor={{ stroke: 'var(--color-text-info)', strokeDasharray: '3 3' }} />
            <Area
              type="monotone" dataKey="revenue"
              stroke="var(--color-chart-1)" strokeWidth={2} fill="url(#revenueFade)"
              activeDot={{ r: 4, stroke: 'var(--color-bg-primary)', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

/* ──────────────────────── recent activity rail ────────────────────── */

const RECENT_ACTIVITY = [
  // TODO: wire to /admin/dashboard/activity
  { id: 1, title: 'Recharge ₹249 from Priya S.',  sub: '₹249.00',          time: '2m',  icon: <CheckCircle2 size={14} />,    tone: 'success' },
  { id: 2, title: 'New listener applied',         sub: 'Calvina Braganza', time: '14m', icon: <UserPlus size={14} />,        tone: 'info'    },
  { id: 3, title: 'Long session ended',           sub: 'Maryam · 28 min',  time: '38m', icon: <Package size={14} />,         tone: 'info'    },
  { id: 4, title: 'Refund requested',             sub: 'Order #4789',      time: '1h',  icon: <AlertTriangle size={14} />,   tone: 'warning' },
];

function ActivityPanel() {
  return (
    <Card className="tw-h-full tw-p-4">
      <CardHeader
        action={
          <Button variant="link" size="sm" className="tw-px-1">View all</Button>
        }
      >
        <CardTitle>Recent activity</CardTitle>
      </CardHeader>
      <ul className="tw-divide-y tw-divide-tertiary">
        {RECENT_ACTIVITY.map((a) => (
          <li key={a.id} className="tw-flex tw-items-center tw-gap-3 tw-py-2">
            <IconTile tone={a.tone}>{a.icon}</IconTile>
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
  // TODO: wire to /admin/payment-list
  { id: '#4821', name: 'Priya Sharma',  initials: 'PS', tone: 'info',    status: 'paid',    amount: 249.00,  delta: -15.65, date: 'May 6, 14:32' },
  { id: '#4820', name: 'Arjun Rao',     initials: 'AR', tone: 'info',    status: 'pending', amount: 89.50,   delta:  +5.2,  date: 'May 6, 13:18' },
  { id: '#4819', name: 'Neha Kapoor',   initials: 'NK', tone: 'success', status: 'paid',    amount: 1420.00, delta: +18.65, date: 'May 6, 11:02' },
  { id: '#4818', name: 'Rohan Joshi',   initials: 'RJ', tone: 'warning', status: 'failed',  amount: 59.00,   delta: -2.1,   date: 'May 6, 09:47' },
  { id: '#4817', name: 'Sara Desai',    initials: 'SD', tone: 'info',    status: 'paid',    amount: 320.75,  delta: +9.0,   date: 'May 5, 19:21' },
];

const STATUS_TONE = { paid: 'success', pending: 'warning', failed: 'danger' };

function TransactionsPanel({ loading }) {
  const [sort, setSort] = useState({ key: 'date', dir: 'desc' });

  // Hook order must be stable — keep useMemo BEFORE any early return.
  const rows = useMemo(() => {
    if (!sort.key || !sort.dir) return RECENT_TXNS;
    const sorted = [...RECENT_TXNS].sort((a, b) => {
      const av = a[sort.key]; const bv = b[sort.key];
      if (av < bv) return sort.dir === 'asc' ? -1 : 1;
      if (av > bv) return sort.dir === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [sort]);

  if (loading) {
    return (
      <Card flush>
        <div className="tw-px-4 tw-py-3 tw-border-b tw-border-hairline tw-border-tertiary">
          <CardTitle>Recent transactions</CardTitle>
        </div>
        <TableSkeleton rows={5} cols={6} />
      </Card>
    );
  }

  return (
    <Card flush>
      <div className="tw-flex tw-items-center tw-justify-between tw-px-4 tw-py-3 tw-border-b tw-border-hairline tw-border-tertiary">
        <CardTitle>Recent transactions</CardTitle>
        <div className="tw-flex tw-items-center tw-gap-2">
          <Tooltip label="Filter"><IconButton aria-label="Filter" size="sm"><Filter size={14} /></IconButton></Tooltip>
          <Tooltip label="Export CSV"><IconButton aria-label="Export" size="sm"><Download size={14} /></IconButton></Tooltip>
          <Tooltip label="More"><IconButton aria-label="More" size="sm"><MoreHorizontal size={14} /></IconButton></Tooltip>
        </div>
      </div>

      <Table>
        <THead>
          <TR>
            <Th sortable sortKey="id"     sort={sort} onSort={setSort}>Order</Th>
            <Th sortable sortKey="name"   sort={sort} onSort={setSort}>Customer</Th>
            <Th sortable sortKey="status" sort={sort} onSort={setSort}>Status</Th>
            <Th sortable sortKey="amount" sort={sort} onSort={setSort} align="right">Amount</Th>
            <Th sortable sortKey="delta"  sort={sort} onSort={setSort} align="right">Δ</Th>
            <Th sortable sortKey="date"   sort={sort} onSort={setSort}>Date</Th>
          </TR>
        </THead>
        <TBody>
          {rows.map((t, i) => (
            <TR key={t.id} isLast={i === rows.length - 1}>
              <Td>{t.id}</Td>
              <Td>
                <div className="tw-flex tw-items-center tw-gap-2">
                  <Avatar name={t.name} tone={t.tone} size="sm" />
                  <span className="tw-text-fg-primary">{t.name}</span>
                </div>
              </Td>
              <Td><Pill tone={STATUS_TONE[t.status]}>{t.status[0].toUpperCase() + t.status.slice(1)}</Pill></Td>
              <Td align="right">{fmtINR(t.amount)}</Td>
              <Td align="right"><Delta value={t.delta} /></Td>
              <Td>{t.date}</Td>
            </TR>
          ))}
        </TBody>
      </Table>
    </Card>
  );
}

/* ─────────────────────────── goals card ──────────────────────────── */

function GoalsPanel() {
  // TODO: wire to /admin/dashboard/goals
  return (
    <Card className="tw-h-full tw-p-4">
      <CardHeader>
        <CardTitle>Goals</CardTitle>
      </CardHeader>
      <div className="tw-flex tw-flex-col tw-gap-3">
        <GoalRing label="Weekly target"  sub="25% achieved" percent={25} color="var(--color-chart-2)" />
        <GoalRing label="Monthly target" sub="50% achieved" percent={50} color="var(--color-chart-1)" />
      </div>
    </Card>
  );
}

/* ─────────────────────────────── page ────────────────────────────── */

export default function Overview() {
  const { data, isLoading, error } = useDashboardQuery();
  const details = data?.dashboardDetails || [];

  const totalRevenue   = pickMetric(details, 'total revenue')   || pickMetric(details, 'monthly revenue');
  const todayRevenue   = pickMetric(details, "today");
  const activeUsers    = pickMetric(details, 'active users');

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
        <Button>
          <TrendingUp size={14} aria-hidden />
          Generate report
        </Button>
      </div>

      {error && <ErrorBanner message={error?.data?.message || error?.message} />}

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
            <Card flush>
              <EmptyState title="No data yet" description="Once orders start flowing, they'll show up here." />
            </Card>
          ) : (
            <TransactionsPanel loading={isLoading} />
          )}
        </div>
        <GoalsPanel />
      </div>
    </div>
  );
}
