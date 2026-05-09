/*
 * Dashboard — v2 dark design.
 *
 * Uses the v2 UI library (tw- Tailwind tokens) and Framer Motion stagger.
 * No Bootstrap classes. dashboard.scss is intentionally not imported here.
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users, UserCheck, Headphones, Activity,
  TrendingUp, DollarSign, CalendarDays, Wallet,
  Wrench, RefreshCw, Stethoscope, BarChart2,
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, Legend,
} from 'recharts';
import {
  useDashboardQuery,
  useGraphQuery,
  useCleanupLeakedUserImagesMutation,
  useBackfillLeavesMutation,
} from '../../services/auth';
import WalletList from './WalletList';
import WalletModal from './WalletModal';
import DiagnoseModal from '../common/diagnose-connection/DiagnoseModal';
import Swal from 'sweetalert2';
import {
  Card, CardHeader, CardTitle,
  Button,
  Pill,
  KpiPlain, KpiPromoted, DonutMini,
  ErrorBanner, Spinner,
  Table, THead, TBody, TR, Th, Td,
  TooltipPill,
} from '../v2/ui';

/* ───────────────────────── animation variants ──────────────────────── */

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

const item = {
  hidden: { y: 16, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.35 } },
};

/* ───────────────────────────── formatters ──────────────────────────── */

const fmtINR = (n) =>
  '₹' + Number(n || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const fmtNum = (n) => Number(n || 0).toLocaleString('en-IN');

const AXIS_TICK = { fill: 'var(--color-text-tertiary)', fontSize: 11 };

/* ─────────────────────── traffic / growth chart ─────────────────────── */

function TrafficPanel() {
  const [graphType, setGraphType] = useState('monthly');
  const { data, isLoading } = useGraphQuery({ type: graphType });

  const chartData = React.useMemo(() => {
    if (
      data &&
      Array.isArray(data.labels) &&
      Array.isArray(data.users) &&
      data.labels.length > 0
    ) {
      return data.labels.map((label, i) => ({
        name: label,
        Users: data.users[i] ?? 0,
        Listeners: data.listeners?.[i] ?? 0,
      }));
    }
    return [];
  }, [data]);

  return (
    <Card className="tw-h-full tw-p-4">
      <CardHeader
        action={
          <select
            value={graphType}
            onChange={(e) => setGraphType(e.target.value)}
            className="tw-bg-bg-secondary tw-text-fg-secondary tw-text-[12px] tw-border tw-border-hairline tw-border-tertiary tw-rounded-md tw-px-2 tw-py-1 tw-outline-none focus:tw-ring-2 focus:tw-ring-fg-info"
          >
            <option value="daily">Daily</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        }
      >
        <div className="tw-flex tw-items-center tw-gap-2">
          <BarChart2 size={14} aria-hidden className="tw-text-fg-tertiary" />
          <CardTitle>Traffic Analysis — Users &amp; Listeners</CardTitle>
        </div>
        <div className="tw-mt-1 tw-text-[11px] tw-text-fg-tertiary tw-capitalize">
          {graphType} view
        </div>
      </CardHeader>

      <div className="tw-h-[260px]">
        {isLoading ? (
          <div className="tw-flex tw-items-center tw-justify-center tw-h-full tw-gap-2 tw-text-fg-tertiary tw-text-[12px]">
            <Spinner size={14} />
            Loading chart…
          </div>
        ) : chartData.length === 0 ? (
          <div className="tw-flex tw-items-center tw-justify-center tw-h-full tw-text-fg-tertiary tw-text-[12px]">
            No graph data available.
          </div>
        ) : (
          <ResponsiveContainer>
            <LineChart data={chartData} margin={{ top: 4, right: 6, left: -12, bottom: 0 }}>
              <CartesianGrid
                stroke="var(--color-border-tertiary)"
                strokeDasharray="2 4"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                tickLine={false}
                axisLine={false}
                tick={AXIS_TICK}
                interval="preserveStartEnd"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={AXIS_TICK}
                width={40}
              />
              <RTooltip
                contentStyle={{
                  background: 'var(--color-background-primary)',
                  border: '1px solid var(--color-border-tertiary)',
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: 11, color: 'var(--color-text-secondary)' }}
              />
              <Line
                type="monotone"
                dataKey="Users"
                stroke="var(--color-chart-1)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="Listeners"
                stroke="var(--color-chart-3)"
                strokeWidth={2}
                strokeDasharray="5 3"
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}

/* ───────────────────── financial metric row ────────────────────────── */

function MetricRow({ label, value }) {
  const isEmpty = !value || value === '—';
  return (
    <div className="tw-flex tw-items-center tw-justify-between tw-gap-4 tw-py-3 tw-border-b tw-border-hairline tw-border-tertiary last:tw-border-0 tw-group">
      <span className="tw-text-[12px] tw-text-fg-tertiary tw-leading-tight">{label}</span>
      <span
        className={
          isEmpty
            ? 'tw-text-[13px] tw-text-fg-tertiary tw-tabular-nums'
            : 'tw-text-[20px] tw-font-bold tw-tabular-nums tw-tracking-tight ' +
              (String(value).startsWith('₹')
                ? 'tw-text-fg-success'
                : 'tw-text-fg-primary')
        }
      >
        {value ?? '—'}
      </span>
    </div>
  );
}

/* Helper: extract numeric value from a dashboard detail item.
   The API returns either { amount } or { value } depending on item type.
   Some items are counts (no ₹), others are currency amounts.         */
function detailVal(item) {
  return item?.amount ?? item?.value ?? null;
}
function fmtDetailVal(item) {
  const v = detailVal(item);
  // treat null / empty / literal "null" as missing; keep zero (₹0.00 is valid)
  if (v == null || v === '' || v === 'null') return '—';
  const n = Number(v);
  if (isNaN(n)) return String(v);
  return fmtINR(n);
}
function fmtDetailCount(item) {
  const v = detailVal(item);
  if (v == null || v === '' || v === 'null') return '—';
  return fmtNum(v);
}

/* ───────────────────────────────── page ────────────────────────────── */

const Dashboard = () => {
  const { data, isLoading, error } = useDashboardQuery();
  const [showUserModal, setShowUserModal] = React.useState(false);
  const [showListenerModal, setShowListenerModal] = React.useState(false);
  const [showDiagnose, setShowDiagnose] = React.useState(false);
  const [cleanupImages, { isLoading: isCleaning }] = useCleanupLeakedUserImagesMutation();
  const [backfillLeaves, { isLoading: isBackfilling }] = useBackfillLeavesMutation();

  /* ── Swal actions (unchanged logic) ── */

  const handleBackfillLeaves = async () => {
    const { value: formValues } = await Swal.fire({
      title: 'Backfill Listener Leaves',
      html: `
        <div style="text-align:left;font-size:14px;margin-bottom:8px">
          Generate leave records for listeners who worked less than 3 hours on each day in the selected range.
        </div>
        <label style="font-size:13px;font-weight:600">From date</label>
        <input id="swal-from" type="date" class="swal2-input" style="margin:4px 0 10px">
        <label style="font-size:13px;font-weight:600">To date</label>
        <input id="swal-to" type="date" class="swal2-input" style="margin:4px 0">
      `,
      showCancelButton: true,
      confirmButtonText: 'Run Backfill',
      preConfirm: () => ({
        fromDate: document.getElementById('swal-from').value,
        toDate: document.getElementById('swal-to').value,
      }),
    });
    if (!formValues) return;
    try {
      const res = await backfillLeaves(formValues).unwrap();
      const rows = (res.results || [])
        .map((r) => `<tr><td>${r.date}</td><td>${r.leavesCreated}</td></tr>`)
        .join('');
      Swal.fire({
        title: 'Backfill Complete',
        html: `<table class="table table-sm"><thead><tr><th>Date</th><th>Leaves Created</th></tr></thead><tbody>${rows}</tbody></table>`,
        icon: 'success',
      });
    } catch (err) {
      Swal.fire('Error', err?.data?.message || 'Backfill failed', 'error');
    }
  };

  const handleCleanupImages = async () => {
    const confirm = await Swal.fire({
      title: 'Clean up leaked user images?',
      text: 'This removes real user photos that were previously stored in listener nickname records. Safe to run — it only clears images that match the user\'s actual profile photo.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, clean up',
    });
    if (!confirm.isConfirmed) return;
    try {
      const res = await cleanupImages().unwrap();
      Swal.fire('Done', res.message, 'success');
    } catch (err) {
      Swal.fire('Error', err?.data?.message || 'Cleanup failed', 'error');
    }
  };

  /* ── loading / error states ── */

  if (isLoading) {
    return (
      <div className="tw-flex tw-items-center tw-justify-center tw-py-20 tw-gap-3">
        <Spinner size={18} />
        <span className="tw-text-fg-secondary tw-text-small">Loading dashboard…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tw-p-6">
        <ErrorBanner
          title="Failed to load dashboard"
          message={error?.data?.message || error?.message}
        />
      </div>
    );
  }

  /* ── data slices ── */

  const details = data?.dashboardDetails || [];

  // indices 0–2: platform stats
  const totalUsers      = details[0];
  const activeUsers     = details[1];
  const totalListeners  = details[2];

  // indices 3–7: monthly financials
  const monthlyFinancials = details.slice(3, 8);

  // indices 8–11: daily financials
  const dailyFinancials = details.slice(8, 12);

  // indices 12–14: adjustments & volume
  const adjustmentsVolume = details.slice(12, 15).filter(Boolean);

  // indices 15–16: wallet aggregates
  const walletAggregates = details.slice(15, 17).filter(Boolean);

  // indices 17–18: active / online status
  const onlineUsers     = details[17];
  const activeStatus    = details[18];

  /* ── render ── */

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="visible"
      className="tw-flex tw-flex-col tw-gap-4"
    >
      {/* ── Page header ── */}
      <motion.div variants={item}>
        <div className="tw-flex tw-flex-col sm:tw-flex-row sm:tw-items-center tw-justify-between tw-gap-3">
          <div>
            <h1 className="tw-text-h1 tw-text-fg-primary tw-m-0">Dashboard</h1>
            <p className="tw-text-small tw-text-fg-tertiary tw-mt-1 tw-mb-0">
              Monitor platform health, financials, and user engagement at a glance.
            </p>
          </div>

          <div className="tw-flex tw-items-center tw-gap-2 tw-flex-wrap sm:tw-flex-nowrap">
            {/* Backfill Leaves */}
            <button
              type="button"
              onClick={handleBackfillLeaves}
              disabled={isBackfilling}
              className="tw-inline-flex tw-items-center tw-gap-1.5 tw-px-3 tw-h-8 tw-rounded-md tw-text-[12px] tw-font-medium tw-border-0 tw-bg-bg-secondary tw-text-fg-secondary hover:tw-bg-bg-tertiary hover:tw-text-fg-primary tw-transition-colors tw-duration-fast disabled:tw-opacity-50 disabled:tw-cursor-not-allowed tw-cursor-pointer"
            >
              <RefreshCw size={12} aria-hidden className={isBackfilling ? 'tw-animate-spin' : ''} />
              {isBackfilling ? 'Processing…' : 'Backfill Leaves'}
            </button>

            {/* Clean User Images */}
            <button
              type="button"
              onClick={handleCleanupImages}
              disabled={isCleaning}
              className="tw-inline-flex tw-items-center tw-gap-1.5 tw-px-3 tw-h-8 tw-rounded-md tw-text-[12px] tw-font-medium tw-border-0 tw-bg-bg-secondary tw-text-fg-secondary hover:tw-bg-bg-tertiary hover:tw-text-fg-primary tw-transition-colors tw-duration-fast disabled:tw-opacity-50 disabled:tw-cursor-not-allowed tw-cursor-pointer"
            >
              <Wrench size={12} aria-hidden className={isCleaning ? 'tw-animate-spin' : ''} />
              {isCleaning ? 'Cleaning…' : 'Clean Images'}
            </button>

            {/* Diagnose Connection */}
            <button
              type="button"
              onClick={() => setShowDiagnose(true)}
              className="tw-inline-flex tw-items-center tw-gap-1.5 tw-px-3 tw-h-8 tw-rounded-md tw-text-[12px] tw-font-medium tw-border-0 tw-bg-bg-info tw-text-fg-info hover:tw-opacity-80 tw-transition-opacity tw-duration-fast tw-cursor-pointer"
            >
              <Stethoscope size={12} aria-hidden />
              Diagnose
            </button>

            {/* Live badge */}
            <div className="tw-inline-flex tw-items-center tw-gap-2 tw-px-3 tw-h-8 tw-rounded-md tw-bg-bg-success">
              <span
                aria-hidden
                className="tw-w-2 tw-h-2 tw-rounded-full tw-bg-fg-success tw-shrink-0"
                style={{ animation: 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite' }}
              />
              <span className="tw-text-[12px] tw-font-bold tw-text-fg-success tw-tracking-wide">
                LIVE
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── KPI strip — 5 cards ── */}
      <motion.div
        variants={item}
        className="tw-grid tw-gap-3 tw-grid-cols-2 sm:tw-grid-cols-3 lg:tw-grid-cols-5"
      >
        <KpiPlain
          icon={<Users size={14} aria-hidden />}
          label={totalUsers?.title || 'Total Registered Users'}
          value={fmtDetailCount(totalUsers)}
          miniChart={<DonutMini percent={72} />}
          tone="info"
        />

        <KpiPlain
          icon={<UserCheck size={14} aria-hidden />}
          label={activeUsers?.title || 'Active Users'}
          value={fmtDetailCount(activeUsers)}
          miniChart={<DonutMini percent={55} color="var(--color-chart-3)" />}
          tone="success"
        />

        <KpiPromoted
          icon={<Headphones size={14} aria-hidden />}
          label={totalListeners?.title || 'Total Listeners'}
          value={fmtDetailCount(totalListeners)}
          percent={68}
        />

        <KpiPromoted
          icon={<Activity size={14} aria-hidden />}
          label={onlineUsers?.title || 'Online Users'}
          value={fmtDetailCount(onlineUsers)}
          percent={40}
        />

        {/* Online Listeners — 5th card */}
        <KpiPromoted
          icon={
            <span className="tw-relative tw-flex tw-items-center tw-justify-center">
              <Headphones size={14} aria-hidden />
              <span
                className="tw-absolute -tw-top-1 -tw-right-1 tw-w-2 tw-h-2 tw-rounded-full tw-bg-fg-success"
                style={{ animation: 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite' }}
              />
            </span>
          }
          label={activeStatus?.title || 'Online Listeners'}
          value={fmtDetailCount(activeStatus)}
          percent={null}
          tone="success"
        />
      </motion.div>

      {/* ── Financial breakdown — 3 equal-height columns ── */}
      <motion.div
        variants={item}
        className="tw-grid tw-gap-3 tw-grid-cols-1 md:tw-grid-cols-2 lg:tw-grid-cols-3 tw-items-stretch"
      >
        {/* Col 1 — Today's Performance */}
        <Card className="tw-p-5 tw-flex tw-flex-col tw-h-full">
          <CardHeader>
            <CardTitle>Today's Performance</CardTitle>
          </CardHeader>
          <div className="tw-flex-1 tw-flex tw-flex-col tw-justify-between">
            {dailyFinancials.length > 0 ? (
              dailyFinancials.map((m, i) => (
                <MetricRow key={i} label={m?.title || '—'} value={fmtDetailVal(m)} />
              ))
            ) : (
              <p className="tw-text-[12px] tw-text-fg-tertiary">No data available.</p>
            )}
          </div>
        </Card>

        {/* Col 2 — Monthly Financials */}
        <Card className="tw-p-5 tw-flex tw-flex-col tw-h-full">
          <CardHeader>
            <div className="tw-flex tw-items-center tw-gap-2">
              <CalendarDays size={14} aria-hidden className="tw-text-fg-tertiary" />
              <CardTitle>Monthly Financials</CardTitle>
            </div>
          </CardHeader>
          <div className="tw-flex-1 tw-flex tw-flex-col tw-justify-between">
            {monthlyFinancials.length > 0 ? (
              monthlyFinancials.map((m, i) => (
                <MetricRow key={i} label={m?.title || '—'} value={fmtDetailVal(m)} />
              ))
            ) : (
              <p className="tw-text-[12px] tw-text-fg-tertiary">No data available.</p>
            )}
          </div>
        </Card>

        {/* Col 3 — Adjustments & Volume + Wallet Aggregates combined */}
        <Card className="tw-p-5 tw-flex tw-flex-col tw-h-full">
          {/* Section: Adjustments & Volume */}
          {adjustmentsVolume.length > 0 && (
            <>
              <CardHeader>
                <div className="tw-flex tw-items-center tw-gap-2">
                  <TrendingUp size={14} aria-hidden className="tw-text-fg-info" />
                  <CardTitle>Adjustments &amp; Volume</CardTitle>
                </div>
              </CardHeader>
              <div>
                {adjustmentsVolume.map((m, i) => (
                  <MetricRow key={i} label={m?.title || '—'} value={fmtDetailVal(m)} />
                ))}
              </div>
            </>
          )}

          {/* Divider */}
          {adjustmentsVolume.length > 0 && walletAggregates.length > 0 && (
            <div className="tw-border-t tw-border-hairline tw-border-tertiary tw-my-4" />
          )}

          {/* Section: Wallet Aggregates */}
          {walletAggregates.length > 0 && (
            <>
              <div className="tw-flex tw-items-center tw-gap-2 tw-mb-1">
                <Wallet size={14} aria-hidden className="tw-text-fg-success" />
                <span className="tw-text-[13px] tw-font-semibold tw-text-fg-primary">Wallet Aggregates</span>
              </div>
              <div className="tw-flex-1 tw-flex tw-flex-col tw-justify-between">
                {walletAggregates.map((m, i) => (
                  <MetricRow key={i} label={m?.title || '—'} value={fmtDetailVal(m)} />
                ))}
              </div>
            </>
          )}
        </Card>
      </motion.div>

      {/* ── Top Wallets ── */}
      <motion.div
        variants={item}
        className="tw-grid tw-gap-3 tw-grid-cols-1 lg:tw-grid-cols-2"
      >
        {/* High-Value Users */}
        <Card className="tw-p-4">
          <CardHeader
            action={
              <Button
                variant="link"
                size="sm"
                className="tw-px-1"
                onClick={() => setShowUserModal(true)}
              >
                View All
              </Button>
            }
          >
            <div className="tw-flex tw-items-center tw-gap-2">
              <Wallet size={14} aria-hidden className="tw-text-fg-info" />
              <CardTitle>High-Value Users</CardTitle>
            </div>
            <div className="tw-mt-1 tw-text-[11px] tw-text-fg-tertiary">Top 10 user wallets</div>
          </CardHeader>
          <WalletList
            title="Top User Wallets"
            wallets={data?.top10UserWallets || []}
            color="indigo"
          />
        </Card>

        {/* Top Earners (Listeners) */}
        <Card className="tw-p-4">
          <CardHeader
            action={
              <Button
                variant="link"
                size="sm"
                className="tw-px-1"
                onClick={() => setShowListenerModal(true)}
              >
                View All
              </Button>
            }
          >
            <div className="tw-flex tw-items-center tw-gap-2">
              <DollarSign size={14} aria-hidden className="tw-text-fg-success" />
              <CardTitle>Top Earners (Listeners)</CardTitle>
            </div>
            <div className="tw-mt-1 tw-text-[11px] tw-text-fg-tertiary">Top 10 listener wallets</div>
          </CardHeader>
          <WalletList
            title="Top Listener Wallets"
            wallets={data?.top10ListenerWallets || []}
            color="emerald"
          />
        </Card>
      </motion.div>

      {/* ── Active Sessions (conditional) ── */}
      {data?.activeSessions?.length > 0 && (
        <motion.div variants={item}>
          <Card flush>
            <div className="tw-flex tw-items-center tw-justify-between tw-px-4 tw-py-3 tw-border-b tw-border-hairline tw-border-tertiary">
              <div className="tw-flex tw-items-center tw-gap-2">
                <span
                  aria-hidden
                  className="tw-w-2 tw-h-2 tw-rounded-full tw-bg-fg-success tw-shrink-0"
                  style={{ animation: 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite' }}
                />
                <CardTitle>Ongoing Sessions</CardTitle>
              </div>
              <Pill tone="success">{data.activeSessions.length} live</Pill>
            </div>

            <Table>
              <THead>
                <TR>
                  <Th>User</Th>
                  <Th>Listener</Th>
                  <Th>Channel</Th>
                  <Th>Status</Th>
                </TR>
              </THead>
              <TBody>
                {data.activeSessions.map((s, i) => (
                  <TR key={i} isLast={i === data.activeSessions.length - 1}>
                    <Td className="tw-text-fg-primary tw-font-medium">{s.userName}</Td>
                    <Td className="tw-text-fg-info">{s.listenerName}</Td>
                    <Td>
                      <Pill tone={s.type?.toLowerCase() === 'chat' ? 'info' : 'neutral'}>
                        {s.type || s.service_type || 'AUDIO'}
                      </Pill>
                    </Td>
                    <Td>
                      <div className="tw-flex tw-items-center tw-gap-2">
                        <span
                          aria-hidden
                          className="tw-w-2 tw-h-2 tw-rounded-full tw-bg-fg-success tw-shrink-0"
                          style={{ animation: 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite' }}
                        />
                        <span className="tw-text-[12px] tw-font-semibold tw-text-fg-success">
                          ACTIVE NOW
                        </span>
                      </div>
                    </Td>
                  </TR>
                ))}
              </TBody>
            </Table>
          </Card>
        </motion.div>
      )}

      {/* ── Modals ── */}
      <WalletModal
        show={showUserModal}
        handleClose={() => setShowUserModal(false)}
        title="High-Value Users (Full List)"
        type="user"
      />

      <WalletModal
        show={showListenerModal}
        handleClose={() => setShowListenerModal(false)}
        title="Top Earners (Full List)"
        type="listener"
      />

      <DiagnoseModal show={showDiagnose} onHide={() => setShowDiagnose(false)} />
    </motion.div>
  );
};

export default Dashboard;
