import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  ComposedChart, Bar, Line,
  BarChart, Area,
  XAxis, YAxis, CartesianGrid,
  Tooltip as RTooltip, Legend, ReferenceLine,
} from "recharts";
import {
  Card, CardHeader, CardTitle,
  EmptyState, ErrorBanner, Spinner,
  KpiPlain, Pill,
  Table, THead, TBody, TR, Th, Td,
} from "../v2/ui/index.js";
import { useMoneyDriversQuery } from "../../services/auth";

// ── Shared bits (same look as the other Business Insights tabs) ──────────────
const TOOLTIP_STYLE = { background: "var(--color-background-primary)", border: "1px solid var(--color-border-tertiary)", borderRadius: 8, fontSize: 12 };
const AXIS_TICK = { fill: "var(--color-text-tertiary)", fontSize: 11 };
const C1 = "var(--color-chart-1)", C2 = "var(--color-chart-2)", C3 = "var(--color-chart-3)", C4 = "var(--color-chart-4)", C5 = "var(--color-chart-5)";
const selectCls = "tw-bg-bg-secondary tw-text-fg-primary tw-text-[12px] tw-border tw-border-tertiary tw-rounded-md tw-px-2 tw-py-1 tw-outline-none focus:tw-ring-2 focus:tw-ring-fg-info";
const fadeUp = { hidden: { y: 16, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { duration: 0.3 } } };

const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const monthLabel = (ym) => { const [y, m] = String(ym).split("-"); return `${MON[Number(m) - 1] || m} ${String(y).slice(2)}`; };
const inr = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const num = (n) => Number(n || 0).toLocaleString("en-IN");
const pctChange = (cur, prev) => (prev ? Number((((cur - prev) / prev) * 100).toFixed(1)) : undefined);

const CGrid = () => <CartesianGrid stroke="var(--color-border-tertiary)" strokeDasharray="2 4" vertical={false} />;
const CX = ({ k = "name" }) => <XAxis dataKey={k} tick={AXIS_TICK} tickLine={false} axisLine={false} />;
const CY = ({ fn, id }) => <YAxis yAxisId={id} tick={AXIS_TICK} tickLine={false} axisLine={false} tickFormatter={fn} />;
const Tip = ({ fn }) => <RTooltip contentStyle={TOOLTIP_STYLE} formatter={fn} />;
const Leg = () => <Legend wrapperStyle={{ fontSize: 11, color: "var(--color-text-secondary)" }} />;

function Section({ title, hint, children }) {
  return (
    <motion.div variants={fadeUp} initial="hidden" animate="visible">
      <Card>
        <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
        {hint && <div className="tw-text-[11px] tw-text-fg-tertiary tw-mb-3 tw-px-1">{hint}</div>}
        {children}
      </Card>
    </motion.div>
  );
}

function SimpleTable({ cols, rows, empty = "No data" }) {
  if (!rows.length) return <div className="tw-text-[12px] tw-text-fg-tertiary tw-p-3">{empty}</div>;
  return (
    <div className="tw-overflow-auto">
      <Table>
        <THead>
          <TR>{cols.map((c, i) => <Th key={i} align={i === 0 ? "left" : "right"}>{c.label}</Th>)}</TR>
        </THead>
        <TBody>
          {rows.map((r, ri) => (
            <TR key={ri} isLast={ri === rows.length - 1}>
              {cols.map((c, ci) => <Td key={ci} align={ci === 0 ? "left" : "right"} className={ci === 0 ? "tw-font-medium tw-text-fg-primary" : ""}>{c.render ? c.render(r) : r[c.key]}</Td>)}
            </TR>
          ))}
        </TBody>
      </Table>
    </div>
  );
}

// ── The "what must be true for the target" maths (client side, instant) ──────
function targetPlan(eq, target) {
  const f = eq.rsPerDay ? target / eq.rsPerDay : 1;
  const row = (label, now, unit, digits = 1) => ({ label, now, need: Number((now * f).toFixed(digits)), change: Math.round((f - 1) * 100), unit });
  const g = Math.cbrt(f);
  return {
    f,
    levers: [
      row("Sessions per day", eq.sessionsPerDay, "sessions"),
      row("Minutes per session", eq.minPerSession, "min"),
      row("Paying users per day", eq.usersPerDay, "users"),
      row("Sessions per user per day", eq.sessionsPerUser, "sessions"),
      row("₹ per minute (price / video mix)", eq.rsPerMin, "₹"),
      row("Active listeners per day (same load each)", eq.listenersPerDay, "listeners"),
    ],
    combined: {
      growth: Math.round((g - 1) * 100),
      users: Number((eq.usersPerDay * g).toFixed(1)),
      sessionsPerUser: Number((eq.sessionsPerUser * g).toFixed(1)),
      minPerSession: Number((eq.minPerSession * g).toFixed(1)),
      sessions: Math.round(eq.usersPerDay * g * eq.sessionsPerUser * g),
      listeners: Math.round((eq.usersPerDay * g * eq.sessionsPerUser * g) / (eq.sessionsPerListener || 1)),
    },
  };
}

// ════════════════════════════════════════════════════════════════════════════
export default function MoneyDriversTab() {
  const [months, setMonths] = useState(4);
  const [target, setTarget] = useState(10000);
  const { data, isLoading, isFetching, error, refetch } = useMoneyDriversQuery({ months });

  const m = data?.monthly || [];
  const latest = m[m.length - 1], prev = m[m.length - 2];
  const eq = data?.equation;
  const plan = useMemo(() => (eq ? targetPlan(eq, Number(target) || 0) : null), [eq, target]);

  if (isLoading) return <div className="tw-flex tw-items-center tw-justify-center tw-py-20"><Spinner size={24} className="tw-text-fg-info" /></div>;
  if (error) return <div className="tw-p-6"><ErrorBanner title="Failed to load money drivers" message="This needs an admin login and the latest backend. Check and retry." /></div>;
  if (!m.length) return <EmptyState title="No billed sessions" description="Nothing to analyse in this window." />;

  const label = (row) => monthLabel(row.month) + (row.days < 28 && row === latest ? ` (${row.days}d)` : "");
  const monthChart = m.map((r) => ({ name: label(r), rs: r.rsPerDay, users: r.usersPerDay, rsPerUser: r.rsPerUserDay, rsPerListener: r.rsPerListenerDay, minPerSession: r.minPerSession, sessionsPerUser: r.sessionsPerUserDay }));
  const dailyChart = (data.daily || []).map((r) => ({ name: r.day.slice(5), rs: r.rs, minPerSession: r.minPerSession }));
  const tierChart = (data.users.tiers || []).map((r) => ({ name: monthLabel(r.month), Heavy: r.heavyRsPerDay, Mid: r.midRsPerDay, Light: r.lightRsPerDay }));
  const wfChart = (arr) => arr.map((r) => ({ name: `${monthLabel(r.from)} → ${monthLabel(r.to)}`, "New": r.new, "Reactivated": r.reactivated, "Spending more": r.up, "Spending less": r.down, "Lost": r.lost, net: r.change }));
  const bucketChart = (data.buckets || []).map((b) => ({ name: b.bucket, "% of sessions": b.pctSessions, "% of revenue": b.pctRevenue }));
  const tgt = Number(target) || 0;
  const ucon = data.users.concentration, lcon = data.listeners.concentration;
  const heat = (v, max) => ({ background: `color-mix(in srgb, var(--color-chart-1) ${Math.min(55, Math.round((v / (max || 1)) * 55))}%, transparent)` });

  return (
    <div className="tw-flex tw-flex-col tw-gap-6">
      {/* Controls */}
      <div className="tw-flex tw-flex-wrap tw-items-end tw-justify-between tw-gap-3">
        <div className="tw-text-[12px] tw-text-fg-tertiary tw-max-w-[640px]">
          <b className="tw-text-fg-primary">Billed talk-time</b> (not recharges). Today is excluded. Per-day figures are normalised by the days seen in each month, so the current partial month is comparable.
          {data.generatedAt && <span> Updated {new Date(data.generatedAt).toLocaleTimeString()}{data.cached ? " (cached ≤5 min)" : ""}.</span>}
        </div>
        <div className="tw-flex tw-items-end tw-gap-3">
          <label className="tw-flex tw-flex-col tw-gap-1">
            <span className="tw-text-[11px] tw-font-semibold tw-uppercase tw-text-fg-tertiary">Window</span>
            <select className={selectCls} value={months} onChange={(e) => setMonths(Number(e.target.value))}>
              {[3, 4, 6, 9, 12].map((n) => <option key={n} value={n}>{n} months</option>)}
            </select>
          </label>
          <label className="tw-flex tw-flex-col tw-gap-1">
            <span className="tw-text-[11px] tw-font-semibold tw-uppercase tw-text-fg-tertiary">Target ₹/day</span>
            <input className={selectCls + " tw-w-[100px]"} type="number" min="0" step="500" value={target} onChange={(e) => setTarget(e.target.value)} />
          </label>
          <button onClick={() => refetch()} disabled={isFetching}
            className="tw-inline-flex tw-items-center tw-gap-2 tw-px-3 tw-py-1.5 tw-rounded-md tw-text-[12px] tw-font-medium tw-bg-fg-info tw-text-white disabled:tw-opacity-50 hover:tw-opacity-90">
            {isFetching ? <Spinner size={12} className="tw-text-white" /> : null}{isFetching ? "Loading…" : "Refresh"}
          </button>
        </div>
      </div>

      {/* KPI strip: latest month vs previous */}
      <div className="tw-grid tw-grid-cols-2 lg:tw-grid-cols-5 tw-gap-4">
        <KpiPlain tone="info" label={`${monthLabel(latest.month)} · ₹ / day`} value={inr(latest.rsPerDay)} delta={prev ? pctChange(latest.rsPerDay, prev.rsPerDay) : undefined} sub={prev ? `vs ${monthLabel(prev.month)}` : undefined} />
        <KpiPlain tone="success" label="Paying users / day" value={latest.usersPerDay} delta={prev ? pctChange(latest.usersPerDay, prev.usersPerDay) : undefined} sub={prev ? `vs ${monthLabel(prev.month)}` : undefined} />
        <KpiPlain tone="warning" label="₹ per user-day" value={inr(latest.rsPerUserDay)} delta={prev ? pctChange(latest.rsPerUserDay, prev.rsPerUserDay) : undefined} sub={prev ? `vs ${monthLabel(prev.month)}` : undefined} />
        <KpiPlain tone="neutral" label="Minutes / session" value={latest.minPerSession} delta={prev ? pctChange(latest.minPerSession, prev.minPerSession) : undefined} sub={prev ? `vs ${monthLabel(prev.month)}` : undefined} />
        <KpiPlain tone="info" label="Listeners earning / day" value={latest.listenersPerDay} delta={prev ? pctChange(latest.listenersPerDay, prev.listenersPerDay) : undefined} sub={prev ? `vs ${monthLabel(prev.month)}` : undefined} />
      </div>

      {/* The equation */}
      <Section title="The equation (last 14 days)" hint="₹/day = paying users/day × sessions per user × minutes per session × ₹ per minute. Move any one and the money moves.">
        <div className="tw-grid tw-grid-cols-2 md:tw-grid-cols-5 tw-gap-3 tw-items-center tw-text-center">
          {[
            ["Paying users / day", eq.usersPerDay], ["× Sessions / user", eq.sessionsPerUser], ["× Minutes / session", eq.minPerSession], ["× ₹ / minute", eq.rsPerMin], ["= ₹ / day", inr(eq.rsPerDay)],
          ].map(([l, v], i) => (
            <div key={i} className="tw-bg-bg-secondary tw-rounded-lg tw-px-3 tw-py-3 tw-border tw-border-hairline tw-border-tertiary">
              <div className="tw-text-[10px] tw-font-semibold tw-uppercase tw-text-fg-tertiary">{l}</div>
              <div className="tw-text-[20px] tw-font-bold tw-text-fg-primary tw-tabular-nums tw-mt-1">{v}</div>
            </div>
          ))}
        </div>
        <div className="tw-text-[11px] tw-text-fg-tertiary tw-mt-2">{eq.sessionsPerDay} sessions/day · {eq.listenersPerDay} listeners/day · {eq.sessionsPerListener} sessions per listener-day</div>
      </Section>

      <Section title="₹/day and paying users by month" hint="Users flat while ₹/day falls = people spend less each, not fewer people.">
        <ResponsiveContainer width="100%" height={240}>
          <ComposedChart data={monthChart}>
            <CGrid /><CX /><CY id="l" fn={(v) => `₹${(v / 1000).toFixed(0)}k`} />
            <YAxis yAxisId="r" orientation="right" tick={AXIS_TICK} tickLine={false} axisLine={false} />
            <Tip /><Leg />
            <Bar yAxisId="l" dataKey="rs" name="₹/day" fill={C1} radius={[4, 4, 0, 0]} />
            <Line yAxisId="r" type="monotone" dataKey="users" name="Paying users/day" stroke={C3} strokeWidth={2} dot />
          </ComposedChart>
        </ResponsiveContainer>
      </Section>

      <Section title="Money per user and per listener (₹ per day active)" hint="₹ per user-day falling is the main thing to fix.">
        <ResponsiveContainer width="100%" height={220}>
          <ComposedChart data={monthChart}>
            <CGrid /><CX /><CY id="l" fn={(v) => `₹${v}`} />
            <YAxis yAxisId="r" orientation="right" tick={AXIS_TICK} tickLine={false} axisLine={false} />
            <Tip /><Leg />
            <Line yAxisId="l" type="monotone" dataKey="rsPerUser" name="₹ per user-day" stroke={C1} strokeWidth={2} dot />
            <Line yAxisId="l" type="monotone" dataKey="rsPerListener" name="₹ per listener-day" stroke={C2} strokeWidth={2} dot />
            <Line yAxisId="r" type="monotone" dataKey="minPerSession" name="Min / session" stroke={C4} strokeWidth={2} strokeDasharray="4 3" dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </Section>

      <Section title="Last 30 days: ₹/day and minutes per session" hint="Spikes in ₹ with a spike in minutes = a few very long sessions, not more people.">
        <ResponsiveContainer width="100%" height={230}>
          <ComposedChart data={dailyChart}>
            <CGrid /><CX /><CY id="l" fn={(v) => `₹${(v / 1000).toFixed(0)}k`} />
            <YAxis yAxisId="r" orientation="right" tick={AXIS_TICK} tickLine={false} axisLine={false} />
            <Tip /><Leg />
            {tgt > 0 && <ReferenceLine yAxisId="l" y={tgt} stroke={C5} strokeDasharray="4 4" label={{ value: `Target ${inr(tgt)}`, fill: "var(--color-text-tertiary)", fontSize: 10, position: "insideTopRight" }} />}
            <Area yAxisId="l" type="monotone" dataKey="rs" name="₹/day" stroke={C1} fill={C1} fillOpacity={0.18} strokeWidth={2} />
            <Line yAxisId="r" type="monotone" dataKey="minPerSession" name="Min / session" stroke={C4} strokeWidth={2} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </Section>

      {plan && (
        <Section title={`What must be true for ${inr(tgt)}/day`} hint={`Needs ${plan.f >= 1 ? "+" : ""}${Math.round((plan.f - 1) * 100)}% on today's ${inr(eq.rsPerDay)}. Each lever alone, or spread across three:`}>
          <SimpleTable
            cols={[
              { label: "Lever (all others fixed)", render: (r) => r.label },
              { label: "Now", render: (r) => r.now },
              { label: "Needed alone", render: (r) => <b>{r.need}</b> },
              { label: "Change", render: (r) => <Pill tone={r.change > 0 ? "warning" : "success"}>{r.change > 0 ? "+" : ""}{r.change}%</Pill> },
            ]}
            rows={plan.levers}
          />
          <div className="tw-text-[12px] tw-text-fg-secondary tw-mt-3 tw-px-1">
            <b>Combined plan:</b> grow users, frequency and minutes each by ~{plan.combined.growth}% → <b>{plan.combined.users}</b> paying users/day × <b>{plan.combined.sessionsPerUser}</b> sessions × <b>{plan.combined.minPerSession}</b> min ≈ {plan.combined.sessions} sessions/day, needing about {plan.combined.listeners} active listeners/day.
          </div>
        </Section>
      )}

      <Section title="Who pays: ₹/day by user tier" hint="Heavy ≥ ₹2,000 per 30 days · Mid ₹500–1,999 · Light < ₹500 (each month normalised to 30 days).">
        <ResponsiveContainer width="100%" height={230}>
          <BarChart data={tierChart}>
            <CGrid /><CX /><YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
            <Tip fn={(v) => inr(v)} /><Leg />
            <Bar dataKey="Heavy" stackId="a" fill={C1} />
            <Bar dataKey="Mid" stackId="a" fill={C3} />
            <Bar dataKey="Light" stackId="a" fill={C2} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <SimpleTable
          cols={[
            { label: "Month", render: (r) => monthLabel(r.month) },
            { label: "Heavy users", render: (r) => r.heavyUsers },
            { label: "Heavy % of money", render: (r) => `${r.heavyPctMoney}%` },
            { label: "Mid users", render: (r) => r.midUsers },
            { label: "Light users", render: (r) => r.lightUsers },
            { label: "Light % of money", render: (r) => `${r.lightPctMoney}%` },
          ]}
          rows={data.users.tiers}
        />
      </Section>

      <Section title="How concentrated is the money?" hint="Share of the month's money from the biggest few. High = one departure hurts.">
        <div className="tw-grid tw-grid-cols-1 xl:tw-grid-cols-2 tw-gap-6">
          <div>
            <div className="tw-text-[12px] tw-font-semibold tw-text-fg-primary tw-mb-2">Users</div>
            <SimpleTable cols={[
              { label: "Month", render: (r) => monthLabel(r.month) }, { label: "Active", render: (r) => r.activeUsers },
              { label: "Avg ₹/30d", render: (r) => inr(r.avgRsPer30d) }, { label: "Median ₹/30d", render: (r) => inr(r.medianRsPer30d) },
              { label: "Top 3", render: (r) => `${r.top3Pct}%` }, { label: "Top 10", render: (r) => `${r.top10Pct}%` }, { label: "Top 25", render: (r) => `${r.top25Pct}%` },
            ]} rows={ucon} />
          </div>
          <div>
            <div className="tw-text-[12px] tw-font-semibold tw-text-fg-primary tw-mb-2">Listeners</div>
            <SimpleTable cols={[
              { label: "Month", render: (r) => monthLabel(r.month) }, { label: "Active", render: (r) => r.activeListeners },
              { label: "Avg ₹/30d", render: (r) => inr(r.avgRsPer30d) }, { label: "Median ₹/30d", render: (r) => inr(r.medianRsPer30d) },
              { label: "Top 3", render: (r) => `${r.top3Pct}%` }, { label: "Top 10", render: (r) => `${r.top10Pct}%` }, { label: "Top 25", render: (r) => `${r.top25Pct}%` },
            ]} rows={lcon} />
          </div>
        </div>
      </Section>

      <Section title="Top listeners: ₹/day in each month" hint="Darker = earning more. Fading or vanished rows are the listeners to retain or replace.">
        {(() => {
          const max = Math.max(1, ...data.listeners.top.flatMap((l) => Object.values(l.perMonth)));
          return (
            <div className="tw-overflow-auto">
              <Table>
                <THead>
                  <TR>
                    <Th>Listener</Th><Th align="right">Share</Th>
                    {data.months.map((mm) => <Th key={mm} align="right">{monthLabel(mm)}</Th>)}
                  </TR>
                </THead>
                <TBody>
                  {data.listeners.top.map((l, i) => (
                    <TR key={i} isLast={i === data.listeners.top.length - 1}>
                      <Td className="tw-font-medium tw-text-fg-primary">{l.name}</Td>
                      <Td align="right">{l.sharePct}%</Td>
                      {data.months.map((mm) => <Td key={mm} align="right" style={heat(l.perMonth[mm], max)}>{l.perMonth[mm] ? inr(l.perMonth[mm]) : "—"}</Td>)}
                    </TR>
                  ))}
                </TBody>
              </Table>
            </div>
          );
        })()}
      </Section>

      <Section title="Why did ₹/day change? Users" hint="₹/day added or lost between consecutive months, by type of user. Net line = total change.">
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={wfChart(data.users.waterfall)} stackOffset="sign">
            <CGrid /><CX /><YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v}`} />
            <Tip fn={(v) => inr(v)} /><Leg /><ReferenceLine y={0} stroke="var(--color-border-secondary)" />
            <Bar dataKey="New" stackId="w" fill={C1} /><Bar dataKey="Reactivated" stackId="w" fill={C2} /><Bar dataKey="Spending more" stackId="w" fill={C3} />
            <Bar dataKey="Spending less" stackId="w" fill={C4} /><Bar dataKey="Lost" stackId="w" fill={C5} />
          </BarChart>
        </ResponsiveContainer>
      </Section>

      <Section title="Why did ₹/day change? Listeners" hint="Same view for listeners: new listeners, reactivated, earning more/less, and those who stopped.">
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={wfChart(data.listeners.waterfall)} stackOffset="sign">
            <CGrid /><CX /><YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v}`} />
            <Tip fn={(v) => inr(v)} /><Leg /><ReferenceLine y={0} stroke="var(--color-border-secondary)" />
            <Bar dataKey="New" stackId="w" fill={C1} /><Bar dataKey="Reactivated" stackId="w" fill={C2} /><Bar dataKey="Spending more" name="Earning more" stackId="w" fill={C3} />
            <Bar dataKey="Spending less" name="Earning less" stackId="w" fill={C4} /><Bar dataKey="Lost" stackId="w" fill={C5} />
          </BarChart>
        </ResponsiveContainer>
      </Section>

      <Section title="New vs returning vs reactivated users" hint="New = first ever session that month. Returning = also active last month. First month in the window has no 'returning' by definition.">
        <SimpleTable
          cols={[
            { label: "Month", render: (r) => monthLabel(r.month) },
            { label: "New users", render: (r) => r.newUsers }, { label: "New ₹/day", render: (r) => inr(r.newRsPerDay) },
            { label: "Returning", render: (r) => r.returningUsers }, { label: "Returning ₹/day", render: (r) => inr(r.returningRsPerDay) },
            { label: "Reactivated", render: (r) => r.reactivatedUsers }, { label: "Reactivated ₹/day", render: (r) => inr(r.reactivatedRsPerDay) },
          ]}
          rows={data.users.origin.filter((r) => !r.firstMonth)}
        />
      </Section>

      <Section title="Where the money lives: session length (last 14 days)" hint="Lots of very short sessions earn little; the long ones earn most.">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={bucketChart}>
            <CGrid /><CX /><YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
            <Tip fn={(v) => `${v}%`} /><Leg />
            <Bar dataKey="% of sessions" fill={C2} radius={[4, 4, 0, 0]} /><Bar dataKey="% of revenue" fill={C1} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <div className="tw-grid tw-grid-cols-1 xl:tw-grid-cols-2 tw-gap-6 tw-mt-4">
          <SimpleTable cols={[
            { label: "Type" , render: (r) => r.type }, { label: "Sessions", render: (r) => num(r.sessions) }, { label: "% revenue", render: (r) => `${r.pctRevenue}%` },
            { label: "Min / session", render: (r) => r.minPerSession }, { label: "₹ / min", render: (r) => r.rsPerMin },
          ]} rows={data.byType} />
          <SimpleTable cols={[
            { label: "How sessions end", render: (r) => r.reason }, { label: "Sessions", render: (r) => num(r.sessions) }, { label: "%", render: (r) => `${r.pct}%` },
            { label: "Avg min", render: (r) => r.avgMin }, { label: "₹", render: (r) => inr(r.rs) },
          ]} rows={data.endReasons} />
        </div>
      </Section>

      <Section title="Which signup month the money comes from (₹/day)" hint="Each row is a signup cohort. Rows shrinking to the right = churn. Recent rows small = new users not turning into talkers.">
        {(() => {
          const max = Math.max(1, ...data.cohorts.flatMap((c) => Object.values(c.perMonth)));
          return (
            <div className="tw-overflow-auto">
              <Table>
                <THead>
                  <TR><Th>Signup cohort</Th>{data.months.map((mm) => <Th key={mm} align="right">{monthLabel(mm)}</Th>)}</TR>
                </THead>
                <TBody>
                  {data.cohorts.map((c, i) => (
                    <TR key={i} isLast={i === data.cohorts.length - 1}>
                      <Td className="tw-font-medium tw-text-fg-primary">{c.cohort.startsWith("before ") ? `Before ${monthLabel(c.cohort.slice(7))}` : c.cohort === "unknown" ? "Unknown" : monthLabel(c.cohort)}</Td>
                      {data.months.map((mm) => <Td key={mm} align="right" style={heat(c.perMonth[mm], max)}>{c.perMonth[mm] ? inr(c.perMonth[mm]) : "—"}</Td>)}
                    </TR>
                  ))}
                </TBody>
              </Table>
            </div>
          );
        })()}
      </Section>
    </div>
  );
}
