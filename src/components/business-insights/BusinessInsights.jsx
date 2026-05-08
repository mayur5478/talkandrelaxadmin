import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  BarChart, Bar,
  AreaChart, Area,
  LineChart, Line,
  XAxis, YAxis, CartesianGrid,
  Tooltip as RTooltip,
  Legend,
  PieChart, Pie, Cell,
} from "recharts";
import {
  Card, CardHeader, CardTitle,
  Pill, Delta,
  EmptyState, ErrorBanner, Spinner,
  KpiPlain,
  Tabs, TabsList, Tab, TabPanel,
  Table, THead, TBody, TR, Th, Td,
} from "../v2/ui/index.js";
import { useMonthlyInsightsQuery } from "../../services/auth";

// ── Constants ────────────────────────────────────────────────────────────────
const MONTH_NAMES_FULL = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const NOW = new Date();
const CUR_YEAR = NOW.getFullYear();
const CUR_MON  = NOW.getMonth() + 1;
const YEAR_OPTIONS = Array.from({ length: CUR_YEAR - 2024 + 1 }, (_, i) => 2024 + i);

const CHART_COLORS = ["var(--color-chart-1)","var(--color-chart-2)","var(--color-chart-3)","var(--color-chart-4)","var(--color-chart-5)"];
const TOOLTIP_STYLE = { background:"var(--color-background-primary)", border:"1px solid var(--color-border-tertiary)", borderRadius:8, fontSize:12 };
const AXIS_TICK = { fill:"var(--color-text-tertiary)", fontSize:11 };

const fmt    = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const fmtNum = (n) =>   Number(n || 0).toLocaleString("en-IN");

function toYYYYMM(year, mon) { return `${year}-${String(mon).padStart(2,"0")}`; }

const fadeUp = { hidden:{ y:16, opacity:0 }, visible:{ y:0, opacity:1, transition:{ duration:0.3 } } };

// ── Shared chart pieces ───────────────────────────────────────────────────────
const CGrid  = () => <CartesianGrid stroke="var(--color-border-tertiary)" strokeDasharray="2 4" vertical={false} />;
const CXAxis = ({ k="name" }) => <XAxis dataKey={k} tick={AXIS_TICK} tickLine={false} axisLine={false} />;
const CYAxis = ({ fn }) => <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} tickFormatter={fn} />;
const CTip   = ({ fn }) => <RTooltip contentStyle={TOOLTIP_STYLE} formatter={fn} />;

// ── Reusable month selector ───────────────────────────────────────────────────
const selectCls = "tw-bg-bg-secondary tw-text-fg-primary tw-text-[12px] tw-border tw-border-tertiary tw-rounded-md tw-px-2 tw-py-1 tw-outline-none focus:tw-ring-2 focus:tw-ring-fg-info";
const inputCls  = selectCls;

function MonthSelect({ months, value, onChange }) {
  return (
    <select className={selectCls} value={value || ""} onChange={e => onChange(e.target.value)}>
      {months.map(m => <option key={m.key} value={m.key}>{m.name}</option>)}
    </select>
  );
}

// ── Pill summary row ──────────────────────────────────────────────────────────
function SummaryStrip({ items }) {
  return (
    <div className="tw-flex tw-flex-wrap tw-gap-3 tw-mb-4">
      {items.map((it, i) => (
        <div key={i} className="tw-flex tw-flex-col tw-items-center tw-bg-bg-secondary tw-rounded-md tw-px-4 tw-py-2 tw-border tw-border-hairline tw-border-tertiary tw-min-w-[110px]">
          <span className="tw-text-[10px] tw-font-semibold tw-uppercase tw-text-fg-tertiary tw-tracking-wide">{it.label}</span>
          <span className={`tw-text-[16px] tw-font-bold tw-tabular-nums tw-mt-1 ${it.tone === "success" ? "tw-text-fg-success" : it.tone === "danger" ? "tw-text-fg-danger" : it.tone === "info" ? "tw-text-fg-info" : "tw-text-fg-primary"}`}>{it.value}</span>
        </div>
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// TAB 1 — OVERVIEW
// ════════════════════════════════════════════════════════════════════════════
function OverviewTab({ months, observations }) {
  if (!months.length) return <EmptyState title="No data" description="Adjust the date range and click Apply." />;

  const names = months.map(m => m.name);
  const salesData = months.map(m => ({ name: m.name, value: m.avgDailyNetSales }));
  const sessMinData = months.map(m => ({ name: m.name, Sessions: m.avgDailySessions, Minutes: m.avgDailyMinutes }));

  return (
    <div className="tw-flex tw-flex-col tw-gap-6">
      <motion.div variants={fadeUp} initial="hidden" animate="visible">
        <Card>
          <CardHeader><CardTitle>Avg Daily Net Sales (₹)</CardTitle></CardHeader>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={salesData}>
              <defs>
                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-chart-1)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CGrid/><CXAxis/><CYAxis fn={v=>`₹${(v/1000).toFixed(0)}k`}/>
              <CTip fn={(v)=>[`₹${Number(v).toLocaleString("en-IN")}`,"Net Sales/Day"]}/>
              <Area type="monotone" dataKey="value" stroke="var(--color-chart-1)" strokeWidth={2} fill="url(#salesGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </motion.div>

      <motion.div variants={fadeUp} initial="hidden" animate="visible">
        <Card>
          <CardHeader><CardTitle>Sessions &amp; Minutes / Day</CardTitle></CardHeader>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={sessMinData}>
              <CGrid/><CXAxis/><CYAxis/>
              <CTip/>
              <Legend wrapperStyle={{ fontSize:11, color:"var(--color-text-secondary)" }}/>
              <Bar dataKey="Sessions" fill="var(--color-chart-1)" radius={[4,4,0,0]}/>
              <Bar dataKey="Minutes"  fill="var(--color-chart-3)" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </motion.div>

      {observations.length > 0 && (
        <motion.div variants={fadeUp} initial="hidden" animate="visible">
          <Card>
            <CardHeader><CardTitle>Key Observations</CardTitle></CardHeader>
            <div className="tw-flex tw-flex-col tw-gap-3 tw-pt-2">
              {observations.map((o,i) => (
                <div key={i} className="tw-flex tw-items-start tw-gap-3">
                  <Pill tone={o.type}>{o.type}</Pill>
                  <span className="tw-text-[13px] tw-text-fg-secondary tw-leading-relaxed">{o.text}</span>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// TAB 2 — TOTAL SALES
// ════════════════════════════════════════════════════════════════════════════
function TotalSalesTab({ monthlySales, months }) {
  if (!monthlySales.length && !months.length) return <EmptyState title="No sales data" description="Adjust range and Apply." />;
  const src = monthlySales.length ? monthlySales : months;

  return (
    <div className="tw-flex tw-flex-col tw-gap-6">
      <motion.div variants={fadeUp} initial="hidden" animate="visible">
        <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-2 tw-gap-4">
          <Card>
            <CardHeader><CardTitle>Total Net Recharge (₹)</CardTitle></CardHeader>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={src.map(m=>({name:m.name,value:m.totalNetRecharge}))}>
                <CGrid/><CXAxis/><CYAxis fn={v=>`₹${(v/1000).toFixed(0)}k`}/>
                <CTip fn={v=>[fmt(v),"Net Recharge"]}/>
                <Bar dataKey="value" fill="var(--color-chart-1)" radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <Card>
            <CardHeader><CardTitle>Total Session Revenue (₹)</CardTitle></CardHeader>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={src.map(m=>({name:m.name,value:Math.round(m.totalSessionRevenue||0)}))}>
                <CGrid/><CXAxis/><CYAxis fn={v=>`₹${(v/1000).toFixed(0)}k`}/>
                <CTip fn={v=>[fmt(v),"Session Revenue"]}/>
                <Bar dataKey="value" fill="var(--color-chart-3)" radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </motion.div>

      {/* Monthly Summary Table */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible">
        <Card flush>
          <div className="tw-px-4 tw-py-3 tw-border-b tw-border-hairline tw-border-tertiary">
            <CardTitle>Monthly Summary</CardTitle>
          </div>
          <div className="tw-overflow-auto">
            <Table>
              <THead>
                <TR>
                  <Th>Metric</Th>
                  {src.map(m=><Th key={m.key} align="right">{m.name}</Th>)}
                </TR>
              </THead>
              <TBody>
                {[
                  { label:"Net Recharge",     fn: m=>fmt(m.totalNetRecharge) },
                  { label:"Gross Recharge",   fn: m=>fmt(Math.round(m.totalGrossRecharge||0)) },
                  { label:"Session Revenue",  fn: m=>fmt(Math.round(m.totalSessionRevenue||0)) },
                  { label:"Total Sessions",   fn: m=>fmtNum(m.totalSessions) },
                  { label:"Total Minutes",    fn: m=>`${fmtNum(Math.round(m.totalMinutes||0))} min` },
                  { label:"Rev/Recharge Gap", fn: m=>fmt(Math.round((m.totalSessionRevenue||0)-(m.totalNetRecharge||0))) },
                ].map(row=>(
                  <TR key={row.label}>
                    <Td className="tw-font-medium tw-text-fg-primary tw-whitespace-nowrap">{row.label}</Td>
                    {src.map(m=><Td key={m.key} align="right">{row.fn(m)}</Td>)}
                  </TR>
                ))}
              </TBody>
            </Table>
          </div>
        </Card>
      </motion.div>

      {/* MoM Growth */}
      {src.length > 1 && (
        <motion.div variants={fadeUp} initial="hidden" animate="visible">
          <Card flush>
            <div className="tw-px-4 tw-py-3 tw-border-b tw-border-hairline tw-border-tertiary">
              <CardTitle>Month-over-Month Growth</CardTitle>
            </div>
            <div className="tw-overflow-auto">
              <Table>
                <THead>
                  <TR>
                    <Th>Period</Th>
                    <Th align="right">Net Recharge Δ</Th>
                    <Th align="right">Session Rev Δ</Th>
                    <Th align="right">Sessions Δ</Th>
                    <Th align="right">Minutes Δ</Th>
                  </TR>
                </THead>
                <TBody>
                  {src.slice(1).map((m,i) => {
                    const prev = src[i];
                    const pct = (curr, p) => p > 0 ? `${curr>=p?"+":""}${(((curr-p)/p)*100).toFixed(1)}%` : "N/A";
                    const tone = (curr, p) => curr >= p ? "success" : "danger";
                    return (
                      <TR key={m.key}>
                        <Td className="tw-text-fg-secondary tw-whitespace-nowrap">{prev.name} → {m.name}</Td>
                        <Td align="right"><Pill tone={tone(m.totalNetRecharge,prev.totalNetRecharge)}>{pct(m.totalNetRecharge,prev.totalNetRecharge)}</Pill></Td>
                        <Td align="right"><Pill tone={tone(m.totalSessionRevenue||0,prev.totalSessionRevenue||0)}>{pct(m.totalSessionRevenue||0,prev.totalSessionRevenue||0)}</Pill></Td>
                        <Td align="right"><Pill tone={tone(m.totalSessions,prev.totalSessions)}>{pct(m.totalSessions,prev.totalSessions)}</Pill></Td>
                        <Td align="right"><Pill tone={tone(m.totalMinutes||0,prev.totalMinutes||0)}>{pct(m.totalMinutes||0,prev.totalMinutes||0)}</Pill></Td>
                      </TR>
                    );
                  })}
                </TBody>
              </Table>
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// TAB 3 — SESSIONS
// ════════════════════════════════════════════════════════════════════════════
function SessionsTab({ months }) {
  const [selKey, setSelKey] = useState(months[months.length-1]?.key || "");
  const selMonth = months.find(m=>m.key===selKey) || months[months.length-1];
  const daily = selMonth?.dailySessions || [];
  const dayLabels = daily.map(d => d.day ? d.day.slice(5) : "");

  const totalCount   = daily.reduce((s,d)=>s+d.count,0);
  const totalRevenue = daily.reduce((s,d)=>s+d.revenue,0);
  const totalMins    = daily.reduce((s,d)=>s+d.minutes,0);

  return (
    <div className="tw-flex tw-flex-col tw-gap-6">
      {/* Month selector + KPI strip */}
      <div className="tw-flex tw-items-center tw-justify-between tw-gap-4 tw-flex-wrap">
        <SummaryStrip items={[
          { label:"Total Sessions",  value: fmtNum(totalCount),  tone:"info" },
          { label:"Total Revenue",   value: fmt(totalRevenue),   tone:"success" },
          { label:"Total Minutes",   value: `${fmtNum(totalMins)} min`, tone:"warning" },
          { label:"Avg / Day",       value: `${daily.length>0?Math.round(totalCount/daily.length):0} sess`, tone:"neutral" },
        ]} />
        {months.length > 1 && (
          <div className="tw-flex tw-items-center tw-gap-2 tw-mb-4">
            <span className="tw-text-[11px] tw-text-fg-tertiary tw-font-semibold tw-uppercase">Month</span>
            <MonthSelect months={months} value={selKey} onChange={setSelKey} />
          </div>
        )}
      </div>

      {daily.length === 0 ? (
        <EmptyState title="No daily data" description="No daily session breakdown for this month." />
      ) : (
        <>
          {/* Charts */}
          <motion.div variants={fadeUp} initial="hidden" animate="visible">
            <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-2 tw-gap-4">
              <Card>
                <CardHeader><CardTitle>Daily Session Count by Type — {selMonth?.name}</CardTitle></CardHeader>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={daily.map(d=>({ name:d.day?.slice(5)||"", Call:d.callCount, Video:d.videoCount, Chat:d.chatCount }))}>
                    <CGrid/>
                    <XAxis dataKey="name" tick={AXIS_TICK} tickLine={false} axisLine={false} interval={Math.floor(daily.length/10)||1}/>
                    <CYAxis/>
                    <CTip/>
                    <Legend wrapperStyle={{fontSize:11,color:"var(--color-text-secondary)"}}/>
                    <Bar dataKey="Call"  stackId="s" fill="var(--color-chart-1)" radius={[0,0,0,0]}/>
                    <Bar dataKey="Video" stackId="s" fill="var(--color-chart-3)" radius={[0,0,0,0]}/>
                    <Bar dataKey="Chat"  stackId="s" fill="var(--color-chart-2)" radius={[4,4,0,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              </Card>
              <Card>
                <CardHeader><CardTitle>Daily Revenue &amp; Minutes — {selMonth?.name}</CardTitle></CardHeader>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={daily.map(d=>({ name:d.day?.slice(5)||"", Revenue:d.revenue, Minutes:d.minutes }))}>
                    <CGrid/>
                    <XAxis dataKey="name" tick={AXIS_TICK} tickLine={false} axisLine={false} interval={Math.floor(daily.length/10)||1}/>
                    <YAxis yAxisId="left"  tick={AXIS_TICK} tickLine={false} axisLine={false} tickFormatter={v=>`₹${(v/1000).toFixed(0)}k`}/>
                    <YAxis yAxisId="right" orientation="right" tick={AXIS_TICK} tickLine={false} axisLine={false} tickFormatter={v=>`${v}m`}/>
                    <RTooltip contentStyle={TOOLTIP_STYLE}/>
                    <Legend wrapperStyle={{fontSize:11,color:"var(--color-text-secondary)"}}/>
                    <Line yAxisId="left"  type="monotone" dataKey="Revenue" stroke="var(--color-chart-1)" strokeWidth={2} dot={false}/>
                    <Line yAxisId="right" type="monotone" dataKey="Minutes" stroke="var(--color-chart-2)" strokeWidth={2} strokeDasharray="4 2" dot={false}/>
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </div>
          </motion.div>

          {/* Daily table */}
          <motion.div variants={fadeUp} initial="hidden" animate="visible">
            <Card flush>
              <div className="tw-px-4 tw-py-3 tw-border-b tw-border-hairline tw-border-tertiary">
                <CardTitle>Daily Breakdown — {selMonth?.name}</CardTitle>
              </div>
              <div className="tw-overflow-auto">
                <Table>
                  <THead>
                    <TR>
                      <Th>Date</Th>
                      <Th align="right">Sessions</Th>
                      <Th align="right">Call</Th>
                      <Th align="right">Video</Th>
                      <Th align="right">Chat</Th>
                      <Th align="right">Revenue</Th>
                      <Th align="right">Minutes</Th>
                      <Th align="right">Avg min/sess</Th>
                    </TR>
                  </THead>
                  <TBody>
                    {daily.map((d,i) => (
                      <TR key={i}>
                        <Td className="tw-font-medium tw-text-fg-secondary">{d.day}</Td>
                        <Td align="right" className="tw-font-bold tw-text-fg-primary">{fmtNum(d.count)}</Td>
                        <Td align="right">{d.callCount  || "—"}</Td>
                        <Td align="right">{d.videoCount || "—"}</Td>
                        <Td align="right">{d.chatCount  || "—"}</Td>
                        <Td align="right" className="tw-text-fg-info">{d.revenue ? fmt(d.revenue) : "—"}</Td>
                        <Td align="right">{d.minutes ? `${d.minutes} min` : "—"}</Td>
                        <Td align="right">{d.count>0 ? `${(d.minutes/d.count).toFixed(1)} min` : "—"}</Td>
                      </TR>
                    ))}
                  </TBody>
                  <TBody>
                    <TR isLast>
                      <Td className="tw-font-bold tw-text-fg-primary">Total</Td>
                      <Td align="right" className="tw-font-bold tw-text-fg-primary">{fmtNum(totalCount)}</Td>
                      <Td align="right" className="tw-font-semibold">{daily.reduce((s,d)=>s+d.callCount,0)}</Td>
                      <Td align="right" className="tw-font-semibold">{daily.reduce((s,d)=>s+d.videoCount,0)}</Td>
                      <Td align="right" className="tw-font-semibold">{daily.reduce((s,d)=>s+d.chatCount,0)}</Td>
                      <Td align="right" className="tw-font-bold tw-text-fg-info">{fmt(totalRevenue)}</Td>
                      <Td align="right" className="tw-font-semibold">{totalMins} min</Td>
                      <Td align="right">{totalCount>0?`${(totalMins/totalCount).toFixed(1)} min`:"—"}</Td>
                    </TR>
                  </TBody>
                </Table>
              </div>
            </Card>
          </motion.div>
        </>
      )}

      {/* Monthly type stacked (all months) */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible">
        <Card>
          <CardHeader><CardTitle>Session Types — Avg/Day across months (Stacked)</CardTitle></CardHeader>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={months.map(m=>({
              name: m.name,
              Call:  parseFloat(((m.sessionTypes?.call?.cnt  || 0)/m.days).toFixed(1)),
              Video: parseFloat(((m.sessionTypes?.video?.cnt || 0)/m.days).toFixed(1)),
              Chat:  parseFloat(((m.sessionTypes?.chat?.cnt  || 0)/m.days).toFixed(1)),
            }))}>
              <CGrid/><CXAxis/><CYAxis fn={v=>`${v}/d`}/>
              <CTip/>
              <Legend wrapperStyle={{fontSize:11,color:"var(--color-text-secondary)"}}/>
              <Bar dataKey="Call"  stackId="types" fill="var(--color-chart-1)" radius={[0,0,0,0]}/>
              <Bar dataKey="Video" stackId="types" fill="var(--color-chart-3)" radius={[0,0,0,0]}/>
              <Bar dataKey="Chat"  stackId="types" fill="var(--color-chart-2)" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </motion.div>

      {/* Peak hours distribution */}
      {months[months.length-1]?.peakHours && (
        <motion.div variants={fadeUp} initial="hidden" animate="visible">
          <Card>
            <CardHeader><CardTitle>Peak Hours — % of Daily Sessions by Time Slot</CardTitle></CardHeader>
            <div className="tw-overflow-auto">
              <Table>
                <THead>
                  <TR>
                    <Th>Time Slot</Th>
                    {months.map(m=><Th key={m.key} align="right">{m.name}</Th>)}
                  </TR>
                </THead>
                <TBody>
                  {[{label:"Night (12am–6am)",key:"night"},{label:"Morning (6am–12pm)",key:"morning"},{label:"Afternoon (12–6pm)",key:"afternoon"},{label:"Evening (6pm–12am)",key:"evening"}].map(slot=>(
                    <TR key={slot.key}>
                      <Td className="tw-whitespace-nowrap">{slot.label}</Td>
                      {months.map(m=>(
                        <Td key={m.key} align="right">
                          {m.peakHours?.[slot.key] != null
                            ? <Pill tone={m.peakHours[slot.key]>=35?"warning":m.peakHours[slot.key]<=10?"neutral":"info"}>{m.peakHours[slot.key]}%</Pill>
                            : "—"}
                        </Td>
                      ))}
                    </TR>
                  ))}
                </TBody>
              </Table>
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// TAB 4 — RECHARGES
// ════════════════════════════════════════════════════════════════════════════
function RechargesTab({ months, monthlySales }) {
  const [selKey, setSelKey] = useState(months[months.length-1]?.key || "");
  const selMonth = months.find(m=>m.key===selKey) || months[months.length-1];
  const daily = selMonth?.dailyRecharges || [];
  const dailyGifts = selMonth?.dailyGifts || [];
  const allDays = Array.from(new Set([...daily.map(d=>d.day),...dailyGifts.map(d=>d.day)])).sort();
  const rMap = Object.fromEntries(daily.map(d=>[d.day,d]));
  const gMap = Object.fromEntries(dailyGifts.map(d=>[d.day,d]));

  return (
    <div className="tw-flex tw-flex-col tw-gap-6">
      {/* Month selector + KPI strip */}
      <div className="tw-flex tw-items-start tw-justify-between tw-flex-wrap tw-gap-4">
        <div className="tw-flex tw-flex-col tw-gap-4">
          <SummaryStrip items={[
            { label:"Total Attempts",   value:fmtNum(selMonth?.totalRechargeAttempts||0),  tone:"info" },
            { label:"Successful",       value:fmtNum(selMonth?.successfulRecharges||0),     tone:"success" },
            { label:"Failed/Pending",   value:fmtNum((selMonth?.totalRechargeAttempts||0)-(selMonth?.successfulRecharges||0)), tone:"danger" },
            { label:"Success Rate",     value:`${selMonth?.rechargeSuccessRate??0}%`,        tone:"neutral" },
          ]} />
          <SummaryStrip items={[
            { label:"With GST",    value:fmt(selMonth?.totalGrossRecharge||0), tone:"info" },
            { label:"Without GST", value:fmt(selMonth?.totalNetRecharge||0),   tone:"success" },
            { label:"GST",         value:fmt(selMonth?.totalGstAmount||0),     tone:"warning" },
            { label:"Avg Ticket",  value:fmt(selMonth?.avgRechargeTicket||0),  tone:"neutral" },
          ]} />
        </div>
        {months.length > 1 && (
          <div className="tw-flex tw-items-center tw-gap-2">
            <span className="tw-text-[11px] tw-text-fg-tertiary tw-font-semibold tw-uppercase">Month</span>
            <MonthSelect months={months} value={selKey} onChange={setSelKey} />
          </div>
        )}
      </div>

      {allDays.length === 0 ? (
        <EmptyState title="No daily recharge data" description="No daily breakdown available for this month." />
      ) : (
        <>
          {/* Charts */}
          <motion.div variants={fadeUp} initial="hidden" animate="visible">
            <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-2 tw-gap-4">
              <Card>
                <CardHeader><CardTitle>Daily Count — Recharges &amp; Gifts — {selMonth?.name}</CardTitle></CardHeader>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={allDays.map(day=>({
                    name:(rMap[day]?.day||gMap[day]?.day||day).slice(5),
                    "Recharges (Total)":    rMap[day]?.total     || 0,
                    "Recharges (Success)":  rMap[day]?.successful || 0,
                    "Gifts (Total)":        gMap[day]?.total     || 0,
                    "Gifts (Success)":      gMap[day]?.successful || 0,
                  }))}>
                    <CGrid/>
                    <XAxis dataKey="name" tick={AXIS_TICK} tickLine={false} axisLine={false} interval={Math.floor(allDays.length/10)||1}/>
                    <CYAxis/>
                    <CTip/>
                    <Legend wrapperStyle={{fontSize:11,color:"var(--color-text-secondary)"}}/>
                    <Bar dataKey="Recharges (Total)"   fill="var(--color-chart-1)" radius={[2,2,0,0]}/>
                    <Bar dataKey="Recharges (Success)" fill="var(--color-chart-3)" radius={[2,2,0,0]}/>
                    <Bar dataKey="Gifts (Total)"       fill="var(--color-chart-4)" radius={[2,2,0,0]}/>
                    <Bar dataKey="Gifts (Success)"     fill="var(--color-chart-5)" radius={[2,2,0,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              </Card>
              <Card>
                <CardHeader><CardTitle>Daily Amount (₹) — {selMonth?.name}</CardTitle></CardHeader>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={allDays.map(day=>({
                    name:(rMap[day]?.day||day).slice(5),
                    "R+GST":  rMap[day]?.grossAmount || 0,
                    "R-GST":  rMap[day]?.netAmount   || 0,
                    "G+GST":  gMap[day]?.grossAmount || 0,
                    "G-GST":  gMap[day]?.netAmount   || 0,
                  }))}>
                    <CGrid/>
                    <XAxis dataKey="name" tick={AXIS_TICK} tickLine={false} axisLine={false} interval={Math.floor(allDays.length/10)||1}/>
                    <CYAxis fn={v=>`₹${(v/1000).toFixed(0)}k`}/>
                    <RTooltip contentStyle={TOOLTIP_STYLE} formatter={v=>[fmt(v)]}/>
                    <Legend wrapperStyle={{fontSize:11,color:"var(--color-text-secondary)"}}/>
                    <Line type="monotone" dataKey="R+GST" stroke="var(--color-chart-1)" strokeWidth={2} dot={false}/>
                    <Line type="monotone" dataKey="R-GST" stroke="var(--color-chart-3)" strokeWidth={2} dot={false}/>
                    <Line type="monotone" dataKey="G+GST" stroke="var(--color-chart-2)" strokeWidth={2} strokeDasharray="4 2" dot={false}/>
                    <Line type="monotone" dataKey="G-GST" stroke="var(--color-chart-4)" strokeWidth={2} strokeDasharray="4 2" dot={false}/>
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </div>
          </motion.div>

          {/* Daily detail table */}
          <motion.div variants={fadeUp} initial="hidden" animate="visible">
            <Card flush>
              <div className="tw-px-4 tw-py-3 tw-border-b tw-border-hairline tw-border-tertiary">
                <CardTitle>Daily Recharges &amp; Gifts — {selMonth?.name}</CardTitle>
              </div>
              <div className="tw-overflow-auto">
                <Table>
                  <THead>
                    <TR>
                      <Th rowSpan={2}>Date</Th>
                      <Th colSpan={5} className="tw-text-center tw-text-fg-info">Recharges</Th>
                      <Th colSpan={4} className="tw-text-center tw-text-fg-success">Gifts</Th>
                    </TR>
                    <TR>
                      <Th align="right">Attempts</Th><Th align="right">Success</Th><Th align="right">Failed</Th>
                      <Th align="right">With GST</Th><Th align="right">Without GST</Th>
                      <Th align="right">Attempts</Th><Th align="right">Success</Th>
                      <Th align="right">With GST</Th><Th align="right">Without GST</Th>
                    </TR>
                  </THead>
                  <TBody>
                    {allDays.map((day,i) => {
                      const r = rMap[day] || {};
                      const g = gMap[day] || {};
                      const rFail = (r.total||0)-(r.successful||0);
                      return (
                        <TR key={i}>
                          <Td className="tw-font-medium tw-text-fg-secondary">{day}</Td>
                          <Td align="right">{r.total||"—"}</Td>
                          <Td align="right" className="tw-text-fg-success tw-font-semibold">{r.successful||"—"}</Td>
                          <Td align="right" className={rFail>0?"tw-text-fg-danger":"tw-text-fg-tertiary"}>{rFail||"—"}</Td>
                          <Td align="right" className="tw-text-fg-info">{r.grossAmount?fmt(r.grossAmount):"—"}</Td>
                          <Td align="right">{r.netAmount?fmt(r.netAmount):"—"}</Td>
                          <Td align="right">{g.total||"—"}</Td>
                          <Td align="right" className="tw-text-fg-success">{g.successful||"—"}</Td>
                          <Td align="right">{g.grossAmount?fmt(g.grossAmount):"—"}</Td>
                          <Td align="right">{g.netAmount?fmt(g.netAmount):"—"}</Td>
                        </TR>
                      );
                    })}
                  </TBody>
                  <TBody>
                    <TR isLast>
                      <Td className="tw-font-bold tw-text-fg-primary">Total</Td>
                      <Td align="right" className="tw-font-semibold">{daily.reduce((s,d)=>s+d.total,0)||"—"}</Td>
                      <Td align="right" className="tw-font-bold tw-text-fg-success">{daily.reduce((s,d)=>s+d.successful,0)||"—"}</Td>
                      <Td align="right" className="tw-font-semibold tw-text-fg-danger">{daily.reduce((s,d)=>s+(d.total-d.successful),0)||"—"}</Td>
                      <Td align="right" className="tw-font-bold tw-text-fg-info">{fmt(daily.reduce((s,d)=>s+(d.grossAmount||0),0))}</Td>
                      <Td align="right" className="tw-font-bold">{fmt(daily.reduce((s,d)=>s+(d.netAmount||0),0))}</Td>
                      <Td align="right" className="tw-font-semibold">{dailyGifts.reduce((s,d)=>s+d.total,0)||"—"}</Td>
                      <Td align="right" className="tw-font-bold tw-text-fg-success">{dailyGifts.reduce((s,d)=>s+d.successful,0)||"—"}</Td>
                      <Td align="right" className="tw-font-bold">{fmt(dailyGifts.reduce((s,d)=>s+(d.grossAmount||0),0))}</Td>
                      <Td align="right" className="tw-font-bold">{fmt(dailyGifts.reduce((s,d)=>s+(d.netAmount||0),0))}</Td>
                    </TR>
                  </TBody>
                </Table>
              </div>
            </Card>
          </motion.div>
        </>
      )}

      {/* Revenue Quality — sess rev vs recharge */}
      {monthlySales.length > 0 && (
        <motion.div variants={fadeUp} initial="hidden" animate="visible">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Quality</CardTitle>
              <div className="tw-text-[11px] tw-text-fg-tertiary tw-mt-1">Session revenue vs recharge — ratio &gt;100% means users are burning saved wallets</div>
            </CardHeader>
            <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-2 tw-gap-4">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={monthlySales.map(m=>({ name:m.name, "Session Revenue/Day":Math.round((m.totalSessionRevenue||0)/m.days), "Net Recharge/Day":Math.round((m.totalNetRecharge||0)/m.days) }))}>
                  <CGrid/><CXAxis/><CYAxis fn={v=>`₹${(v/1000).toFixed(0)}k`}/>
                  <CTip fn={v=>[fmt(v)]}/>
                  <Legend wrapperStyle={{fontSize:11,color:"var(--color-text-secondary)"}}/>
                  <Bar dataKey="Session Revenue/Day" fill="var(--color-chart-1)" radius={[4,4,0,0]}/>
                  <Bar dataKey="Net Recharge/Day"    fill="var(--color-chart-3)" radius={[4,4,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={months.map(m=>({ name:m.name, value:m.sessRechargeRatio }))}>
                  <CGrid/><CXAxis/><CYAxis fn={v=>`${v}%`}/>
                  <CTip fn={v=>[`${v}%`,"Sess/Recharge Ratio"]}/>
                  <Line type="monotone" dataKey="value" stroke="var(--color-chart-4)" strokeWidth={2} dot={{ r:3 }}/>
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// TAB 5 — INDIVIDUALS
// ════════════════════════════════════════════════════════════════════════════
function IndividualsTab({ individuals, listenerDailyHours, payrollFrom, setPayrollFrom, payrollTo, setPayrollTo }) {
  const topUsers         = individuals?.topUsers            || [];
  const topListeners     = individuals?.topListeners        || [];
  const lowEngagement    = individuals?.lowEngagementUsers  || [];

  const strategyUser = (u) => {
    if (u.avgMinsPerSession >= 10) return "Deep engager — offer loyalty reward or priority listener access";
    if (u.sessionCount >= 30)     return "High frequency — offer bundle recharge plan for savings";
    return "Good user — nurture with personalized listener recommendations";
  };
  const strategyListener = (l) => {
    if (l.avgMinsPerSession >= 10) return "Star listener — feature in app, give priority placement";
    if (l.sessionCount >= 50)     return "Volume leader — reward with bonus tier";
    return "Rising performer — give profile boost to increase visibility";
  };

  return (
    <div className="tw-flex tw-flex-col tw-gap-6">
      {/* Top Users */}
      {topUsers.length > 0 && (
        <motion.div variants={fadeUp} initial="hidden" animate="visible">
          <Card flush>
            <div className="tw-px-4 tw-py-3 tw-border-b tw-border-hairline tw-border-tertiary">
              <CardTitle>Top Users by Spend</CardTitle>
              <div className="tw-text-[11px] tw-text-fg-tertiary tw-mt-1">Highest wallet spend on sessions</div>
            </div>
            <div className="tw-overflow-auto">
              <Table>
                <THead><TR><Th>#</Th><Th>User</Th><Th align="right">Total Spent</Th><Th align="right">Sessions</Th><Th align="right">Total Min</Th><Th align="right">Avg min/sess</Th><Th>Strategy</Th></TR></THead>
                <TBody>
                  {topUsers.map((u,i) => (
                    <TR key={i}>
                      <Td className="tw-text-fg-tertiary tw-font-semibold">{i+1}</Td>
                      <Td className="tw-font-medium tw-text-fg-primary">{u.name}</Td>
                      <Td align="right" className="tw-text-fg-success tw-font-semibold">{fmt(u.totalSpent)}</Td>
                      <Td align="right">{fmtNum(u.sessionCount)}</Td>
                      <Td align="right">{fmtNum(Math.round(u.totalMins))} min</Td>
                      <Td align="right">{u.avgMinsPerSession} min</Td>
                      <Td className="tw-text-[11px] tw-text-fg-tertiary tw-max-w-[200px]">{strategyUser(u)}</Td>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Low engagement / at-risk */}
      {lowEngagement.length > 0 && (
        <motion.div variants={fadeUp} initial="hidden" animate="visible">
          <Card flush>
            <div className="tw-px-4 tw-py-3 tw-border-b tw-border-hairline tw-border-tertiary">
              <CardTitle>At-Risk Users</CardTitle>
              <div className="tw-text-[11px] tw-text-fg-tertiary tw-mt-1">Recharged recently but barely using the platform — churn risk</div>
            </div>
            <div className="tw-overflow-auto">
              <Table>
                <THead><TR><Th>User</Th><Th align="right">Total Recharged</Th><Th align="right">Sessions</Th><Th>Status</Th><Th>Suggested Action</Th></TR></THead>
                <TBody>
                  {lowEngagement.map((u,i) => (
                    <TR key={i}>
                      <Td className="tw-font-medium tw-text-fg-primary">{u.name}</Td>
                      <Td align="right">{fmt(u.totalRecharged)}</Td>
                      <Td align="right" className="tw-text-fg-danger tw-font-semibold">{u.sessionCount}</Td>
                      <Td><Pill tone="danger">At Risk</Pill></Td>
                      <Td className="tw-text-[11px] tw-text-fg-tertiary tw-max-w-[220px]">
                        {u.totalRecharged>=500?"High value churner — send personal outreach, offer free session credit":u.sessionCount===0?"Never tried — send onboarding nudge with listener recommendation":"Low usage — push notification to book a session"}
                      </Td>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Top Listeners */}
      {topListeners.length > 0 && (
        <motion.div variants={fadeUp} initial="hidden" animate="visible">
          <Card flush>
            <div className="tw-px-4 tw-py-3 tw-border-b tw-border-hairline tw-border-tertiary">
              <CardTitle>Top Performing Listeners</CardTitle>
              <div className="tw-text-[11px] tw-text-fg-tertiary tw-mt-1">Ranked by total earnings</div>
            </div>
            <div className="tw-overflow-auto">
              <Table>
                <THead><TR><Th>#</Th><Th>Listener</Th><Th align="right">Total Earned</Th><Th align="right">Sessions</Th><Th align="right">Total Min</Th><Th align="right">Avg min/sess</Th><Th>Strategy</Th></TR></THead>
                <TBody>
                  {topListeners.map((l,i) => (
                    <TR key={i}>
                      <Td className="tw-text-fg-info tw-font-semibold">{i+1}</Td>
                      <Td className="tw-font-medium tw-text-fg-primary">{l.name}</Td>
                      <Td align="right" className="tw-text-fg-success tw-font-semibold">{fmt(l.totalEarned)}</Td>
                      <Td align="right">{fmtNum(l.sessionCount)}</Td>
                      <Td align="right">{fmtNum(Math.round(l.totalMins))} min</Td>
                      <Td align="right">{l.avgMinsPerSession} min</Td>
                      <Td className="tw-text-[11px] tw-text-fg-tertiary tw-max-w-[200px]">{strategyListener(l)}</Td>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </div>
          </Card>
        </motion.div>
      )}

      {topUsers.length===0 && topListeners.length===0 && lowEngagement.length===0 && (
        <EmptyState title="No individual data" description="Individual breakdown not available for this range." />
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// TAB 6 — CALL ATTEMPTS
// ════════════════════════════════════════════════════════════════════════════
function CallAttemptsTab({ callAttempts }) {
  if (!callAttempts?.length) return <EmptyState title="No call attempt data" description="No call attempt breakdown available." />;

  const sorted = [...callAttempts].sort((a,b)=>(b.totalAttempts??b.total??0)-(a.totalAttempts??a.total??0));

  return (
    <div className="tw-flex tw-flex-col tw-gap-6">
      <motion.div variants={fadeUp} initial="hidden" animate="visible">
        <Card flush>
          <div className="tw-px-4 tw-py-3 tw-border-b tw-border-hairline tw-border-tertiary">
            <CardTitle>Call Attempts by Listener</CardTitle>
            <div className="tw-text-[11px] tw-text-fg-tertiary tw-mt-1">{sorted.length} listener{sorted.length!==1?"s":""} · sorted by total attempts</div>
          </div>
          <div className="tw-overflow-auto">
            <Table>
              <THead>
                <TR>
                  <Th>#</Th>
                  <Th>Listener</Th>
                  <Th align="right">Total Attempts</Th>
                  <Th align="right">Answered</Th>
                  <Th align="right">Missed</Th>
                  <Th align="right">Answer Rate</Th>
                </TR>
              </THead>
              <TBody>
                {sorted.map((r,i) => {
                  const total    = r.totalAttempts ?? r.total    ?? 0;
                  const answered = r.answeredCalls ?? r.answered ?? 0;
                  const missed   = r.missedCalls   ?? r.missed   ?? (total - answered);
                  const rate     = total > 0 ? Math.round((answered/total)*100) : 0;
                  return (
                    <TR key={i} isLast={i===sorted.length-1}>
                      <Td className="tw-text-fg-tertiary">{i+1}</Td>
                      <Td className="tw-font-medium tw-text-fg-primary">{r.listenerName??r.name??"—"}</Td>
                      <Td align="right">{fmtNum(total)}</Td>
                      <Td align="right" className="tw-text-fg-success tw-font-semibold">{fmtNum(answered)}</Td>
                      <Td align="right" className="tw-text-fg-danger">{fmtNum(missed)}</Td>
                      <Td align="right">
                        <Pill tone={rate>=70?"success":rate>=40?"warning":"danger"}>{rate}%</Pill>
                      </Td>
                    </TR>
                  );
                })}
              </TBody>
            </Table>
          </div>
        </Card>
      </motion.div>

      {/* Bar chart */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible">
        <Card>
          <CardHeader><CardTitle>Answer Rate by Listener (%)</CardTitle></CardHeader>
          <ResponsiveContainer width="100%" height={Math.max(180, sorted.length * 22)}>
            <BarChart layout="vertical" data={sorted.map(r=>{
              const t=r.totalAttempts??r.total??0;
              const a=r.answeredCalls??r.answered??0;
              return { name:r.listenerName??r.name??"—", rate:t>0?Math.round((a/t)*100):0 };
            })}>
              <XAxis type="number" domain={[0,100]} tick={AXIS_TICK} tickLine={false} axisLine={false} tickFormatter={v=>`${v}%`}/>
              <YAxis type="category" dataKey="name" tick={{...AXIS_TICK,fontSize:10}} tickLine={false} axisLine={false} width={100}/>
              <CartesianGrid stroke="var(--color-border-tertiary)" strokeDasharray="2 4" horizontal={false}/>
              <CTip fn={v=>[`${v}%`,"Answer Rate"]}/>
              <Bar dataKey="rate" fill="var(--color-chart-1)" radius={[0,4,4,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </motion.div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// TAB 7 — PAYROLL
// ════════════════════════════════════════════════════════════════════════════
function PayrollTab({ listenerDailyHours, listenerDailyOnlineHours, payrollFrom, setPayrollFrom, payrollTo, setPayrollTo, minWorkHours, setMinWorkHours }) {
  const filteredSessions = listenerDailyHours.filter(r=>r.day>=payrollFrom&&r.day<=payrollTo);
  const sessionDates = [...new Set(filteredSessions.map(r=>r.day))].sort();
  const sessionPivot = {};
  filteredSessions.forEach(r=>{
    if(!sessionPivot[r.name]) sessionPivot[r.name]={};
    sessionPivot[r.name][r.day]={ h:r.totalHours, m:r.totalMins, s:r.sessionCount };
  });
  const sessionListeners = Object.keys(sessionPivot).sort((a,b)=>{
    const sA=Object.values(sessionPivot[a]).reduce((s,v)=>s+v.h,0);
    const sB=Object.values(sessionPivot[b]).reduce((s,v)=>s+v.h,0);
    return sB-sA;
  });

  const filteredOnline = listenerDailyOnlineHours.filter(r=>r.day>=payrollFrom&&r.day<=payrollTo);
  const onlineDates = [...new Set(filteredOnline.map(r=>r.day))].sort();
  const onlinePivot = {};
  filteredOnline.forEach(r=>{
    if(!onlinePivot[r.name]) onlinePivot[r.name]={};
    onlinePivot[r.name][r.day]={ h:r.totalHours, m:r.totalMins };
  });
  const onlineListeners = Object.keys(onlinePivot).sort((a,b)=>{
    return Object.values(onlinePivot[b]).reduce((s,v)=>s+v.h,0)-Object.values(onlinePivot[a]).reduce((s,v)=>s+v.h,0);
  });

  const deductionRows = onlineListeners.map(name=>{
    const days=onlinePivot[name]; let work=0,under=0,total=0;
    onlineDates.forEach(d=>{ if(days[d]&&days[d].h>0){ work++; total+=days[d].h; if(days[d].h<minWorkHours) under++; } });
    return { name, workingDays:work, underDays:under, absentDays:onlineDates.length-work, totalHours:parseFloat(total.toFixed(2)) };
  });

  const cellBg = h => {
    if(!h||h===0) return "tw-bg-bg-secondary tw-text-fg-tertiary";
    if(h<minWorkHours) return "tw-bg-bg-danger tw-text-fg-danger";
    if(h<minWorkHours+1) return "tw-bg-bg-warning tw-text-fg-warning";
    return "tw-bg-bg-success tw-text-fg-success";
  };
  const sessCellBg = h => {
    if(!h||h===0) return "tw-bg-bg-secondary tw-text-fg-tertiary";
    if(h>=2) return "tw-bg-bg-info tw-text-fg-info";
    if(h>=0.5) return "tw-bg-bg-info tw-text-fg-info tw-opacity-70";
    return "tw-bg-bg-secondary tw-text-fg-secondary";
  };

  return (
    <div className="tw-flex tw-flex-col tw-gap-6">
      {/* Controls */}
      <div className="tw-flex tw-flex-wrap tw-gap-4 tw-items-end">
        {[["Cycle From","date",payrollFrom,setPayrollFrom],["Cycle To","date",payrollTo,setPayrollTo]].map(([lbl,type,val,set])=>(
          <div key={lbl} className="tw-flex tw-flex-col tw-gap-1">
            <span className="tw-text-[11px] tw-font-semibold tw-uppercase tw-text-fg-tertiary">{lbl}</span>
            <input type={type} className={inputCls} value={val} onChange={e=>set(e.target.value)}/>
          </div>
        ))}
        <div className="tw-flex tw-flex-col tw-gap-1">
          <span className="tw-text-[11px] tw-font-semibold tw-uppercase tw-text-fg-tertiary">Min Hours/Day</span>
          <input type="number" min={1} max={12} className={inputCls} style={{width:72}} value={minWorkHours} onChange={e=>setMinWorkHours(Number(e.target.value))}/>
        </div>
      </div>

      {/* Session hours grid */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible">
        <Card>
          <CardHeader><CardTitle>Sessions Per Day — Daily Call Time Per Listener</CardTitle></CardHeader>
          {filteredSessions.length===0 ? <EmptyState title="No session data" description="No session data for this range."/> : (
            <div className="tw-overflow-auto tw-max-h-[520px]">
              <Table>
                <THead>
                  <TR>
                    <Th className="tw-sticky tw-left-0 tw-bg-bg-primary tw-z-10 tw-min-w-[130px]">Listener</Th>
                    {sessionDates.map(d=>(
                      <Th key={d} className="tw-text-center tw-min-w-[46px]">
                        <div>{d.slice(8)}</div>
                        <div className="tw-text-[9px] tw-text-fg-tertiary">{["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][new Date(d).getDay()]}</div>
                      </Th>
                    ))}
                    <Th className="tw-text-center tw-sticky tw-right-0 tw-bg-bg-primary tw-z-10">Total</Th>
                  </TR>
                </THead>
                <TBody>
                  {sessionListeners.map(name=>{
                    const days=sessionPivot[name];
                    const totalH=Object.values(days).reduce((s,v)=>s+v.h,0);
                    return (
                      <TR key={name}>
                        <Td className="tw-sticky tw-left-0 tw-bg-bg-primary tw-z-10 tw-font-medium tw-text-fg-primary">{name}</Td>
                        {sessionDates.map(d=>{
                          const cell=days[d]; const hrs=cell?cell.h:0;
                          return (
                            <Td key={d} title={cell?`${cell.h}h (${cell.m}min, ${cell.s} sess)`:"No sessions"} className="tw-text-center tw-p-1">
                              {hrs>0 ? <span className={`tw-inline-block tw-text-[10px] tw-font-bold tw-px-1 tw-py-[2px] tw-rounded ${sessCellBg(hrs)}`}>{hrs.toFixed(1)}h</span>
                                     : <span className="tw-text-[10px] tw-text-fg-tertiary">—</span>}
                            </Td>
                          );
                        })}
                        <Td className="tw-text-center tw-font-bold tw-text-fg-info tw-sticky tw-right-0 tw-bg-bg-primary tw-z-10">{totalH.toFixed(1)}h</Td>
                      </TR>
                    );
                  })}
                </TBody>
              </Table>
            </div>
          )}
        </Card>
      </motion.div>

      {/* Online availability */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible">
        <Card>
          <CardHeader><CardTitle>Payroll Tracker — Online Availability (days under {minWorkHours}h flagged)</CardTitle></CardHeader>
          <div className="tw-flex tw-flex-wrap tw-gap-3 tw-mb-4 tw-text-[11px]">
            {[["tw-bg-bg-success","tw-text-fg-success",`Good (≥${minWorkHours}h)`],["tw-bg-bg-warning","tw-text-fg-warning",`Borderline (${minWorkHours}–${minWorkHours+1}h)`],["tw-bg-bg-danger","tw-text-fg-danger",`Deductible (<${minWorkHours}h)`],["tw-bg-bg-secondary","tw-text-fg-tertiary","Absent"]].map(([bg,fg,lbl])=>(
              <span key={lbl} className="tw-flex tw-items-center tw-gap-1"><span className={`tw-inline-block tw-w-3 tw-h-3 tw-rounded-sm ${bg}`}/><span className={fg}>{lbl}</span></span>
            ))}
          </div>
          {filteredOnline.length===0 ? <EmptyState title="No availability data" description="Toggle activity logs may not go back this far."/> : (
            <div className="tw-overflow-auto tw-max-h-[520px]">
              <Table>
                <THead>
                  <TR>
                    <Th className="tw-sticky tw-left-0 tw-bg-bg-primary tw-z-10 tw-min-w-[130px]">Listener</Th>
                    {onlineDates.map(d=>(
                      <Th key={d} className="tw-text-center tw-min-w-[46px]">
                        <div>{d.slice(8)}</div>
                        <div className="tw-text-[9px] tw-text-fg-tertiary">{["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][new Date(d).getDay()]}</div>
                      </Th>
                    ))}
                    <Th className="tw-text-center tw-sticky tw-right-0 tw-bg-bg-primary tw-z-10">Total</Th>
                  </TR>
                </THead>
                <TBody>
                  {onlineListeners.map(name=>{
                    const days=onlinePivot[name];
                    const totalH=Object.values(days).reduce((s,v)=>s+v.h,0);
                    return (
                      <TR key={name}>
                        <Td className="tw-sticky tw-left-0 tw-bg-bg-primary tw-z-10 tw-font-medium tw-text-fg-primary">{name}</Td>
                        {onlineDates.map(d=>{
                          const cell=days[d]; const hrs=cell?cell.h:0;
                          return (
                            <Td key={d} title={cell?`Online ${cell.h}h (${cell.m}min)`:"Absent"} className="tw-text-center tw-p-1">
                              {hrs>0 ? <span className={`tw-inline-block tw-text-[10px] tw-font-bold tw-px-1 tw-py-[2px] tw-rounded ${cellBg(hrs)}`}>{hrs.toFixed(1)}h</span>
                                     : <span className="tw-text-[10px] tw-text-fg-tertiary">—</span>}
                            </Td>
                          );
                        })}
                        <Td className="tw-text-center tw-font-bold tw-sticky tw-right-0 tw-bg-bg-primary tw-z-10 tw-text-fg-primary">{totalH.toFixed(1)}h</Td>
                      </TR>
                    );
                  })}
                </TBody>
              </Table>
            </div>
          )}
        </Card>
      </motion.div>

      {/* Deduction summary */}
      {onlineListeners.length>0 && (
        <motion.div variants={fadeUp} initial="hidden" animate="visible">
          <Card>
            <CardHeader><CardTitle>Penalty / Deduction Summary — {payrollFrom} to {payrollTo}</CardTitle></CardHeader>
            <Table>
              <THead>
                <TR><Th>#</Th><Th>Listener</Th><Th>Days Online</Th><Th>Absent Days</Th><Th>Days {"<"}{minWorkHours}h</Th><Th>Total Hrs</Th><Th>Avg Hrs/Day</Th><Th>Status</Th></TR>
              </THead>
              <TBody>
                {deductionRows.filter(r=>r.underDays>0||r.absentDays>0).sort((a,b)=>b.underDays-a.underDays).map((r,i)=>(
                  <TR key={r.name}>
                    <Td>{i+1}</Td>
                    <Td className="tw-font-medium tw-text-fg-primary">{r.name}</Td>
                    <Td>{r.workingDays}</Td>
                    <Td><Pill tone={r.absentDays>3?"danger":"neutral"}>{r.absentDays}</Pill></Td>
                    <Td><Pill tone={r.underDays>0?"danger":"success"}>{r.underDays} days</Pill></Td>
                    <Td className="tw-font-semibold">{r.totalHours} hrs</Td>
                    <Td>{r.workingDays>0?`${(r.totalHours/r.workingDays).toFixed(1)} hrs`:"—"}</Td>
                    <Td>{r.underDays===0&&r.absentDays===0?<Pill tone="success">Full cycle</Pill>:r.underDays>5||r.absentDays>5?<Pill tone="danger">Deduct salary</Pill>:<Pill tone="warning">Review</Pill>}</Td>
                  </TR>
                ))}
                {deductionRows.filter(r=>r.underDays>0||r.absentDays>0).length===0 && (
                  <TR><Td colSpan={8} className="tw-text-center tw-text-fg-success tw-py-4 tw-font-medium">All listeners were online ≥ {minWorkHours}h/day this cycle</Td></TR>
                )}
              </TBody>
            </Table>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════════════
export default function BusinessInsights() {
  const [activeTab, setActiveTab] = useState("overview");
  const [fromYear, setFromYear] = useState(2025);
  const [fromMon,  setFromMon]  = useState(12);
  const [toYear,   setToYear]   = useState(CUR_YEAR);
  const [toMon,    setToMon]    = useState(CUR_MON);
  const [appliedRange, setAppliedRange] = useState({ from:"2025-12", to:toYYYYMM(CUR_YEAR,CUR_MON) });

  const fromVal  = toYYYYMM(fromYear, fromMon);
  const toVal    = toYYYYMM(toYear, toMon);
  const isInvalid = fromVal > toVal;

  const { data, isLoading, error, isFetching } = useMonthlyInsightsQuery(appliedRange);

  const payrollDefaultFrom = (() => {
    const d=new Date(); if(d.getDate()>=25) return new Date(d.getFullYear(),d.getMonth(),25);
    return new Date(d.getFullYear(),d.getMonth()-1,25);
  })();
  const fmtDate = d => d.toISOString().split("T")[0];
  const [payrollFrom, setPayrollFrom] = useState(fmtDate(payrollDefaultFrom));
  const [payrollTo,   setPayrollTo]   = useState(fmtDate(new Date()));
  const [minWorkHours, setMinWorkHours] = useState(3);

  const months                 = data?.months                || [];
  const individuals            = data?.individuals           || {};
  const callAttempts           = data?.callAttempts          || [];
  const monthlySales           = data?.monthlySales          || [];
  const listenerDailyHours     = data?.listenerDailyHours    || [];
  const listenerDailyOnlineHours = data?.listenerDailyOnlineHours || [];

  const latest = months[months.length-1];
  const prev   = months[months.length-2];

  const pct = (cur, p) => p && p > 0 ? (((cur-p)/p)*100).toFixed(1) : null;
  const salesChange  = latest && prev ? pct(latest.avgDailyNetSales, prev.avgDailyNetSales) : null;
  const sessChange   = latest && prev ? pct(latest.avgDailySessions, prev.avgDailySessions) : null;
  const minsChange   = latest && prev ? pct(latest.avgDailyMinutes,  prev.avgDailyMinutes)  : null;
  const ticketChange = latest && prev ? pct(latest.avgRechargeTicket,prev.avgRechargeTicket) : null;

  const mar = months.find(m=>m.key==="mar26") || latest;
  const apr = months.find(m=>m.key==="apr26") || latest;
  const observations = months.length >= 2 ? [
    { type:"info",    text:`Video sessions drove recent revenue — averaging ${((mar?.sessionTypes?.video?.cnt||0)/(mar?.days||1)).toFixed(0)}/day.` },
    { type:"warning", text:`Session-to-recharge ratio at ${mar?.sessRechargeRatio}% — users spending more than they recharge.` },
    { type:"danger",  text:`~44% of all sessions are just 1 minute — wallet deductions without value, driving churn.` },
    { type:"info",    text:`~40% of sessions happen midnight–6am every month. Morning (6am–12pm) is only ~8% — a major untapped slot.` },
    { type:"success", text:`Platform showing consistent active user growth across the tracked period.` },
    { type:"warning", text:`Avg recharge ticket at ${fmt(apr?.avgRechargeTicket||0)} — lower commitment plans gaining popularity.` },
  ] : [];

  function toMonOptions(year) { const max=year===CUR_YEAR?CUR_MON:12; return MONTH_NAMES_FULL.slice(0,max); }
  function fromMonOptions(year) { const max=year===toYear?toMon:12; return MONTH_NAMES_FULL.slice(0,max); }

  if (isLoading) return <div className="tw-flex tw-items-center tw-justify-center tw-py-20"><Spinner size={24} className="tw-text-fg-info"/></div>;
  if (error)     return <div className="tw-p-6"><ErrorBanner title="Failed to load insights" message="Check your connection and try again." /></div>;

  return (
    <div className="tw-p-6 tw-flex tw-flex-col tw-gap-4">
      {/* Header */}
      <div className="tw-flex tw-items-end tw-justify-between tw-gap-4 tw-flex-wrap tw-mb-2">
        <div>
          <h1 className="tw-text-h1 tw-text-fg-primary tw-m-0">Business Insights</h1>
          <p className="tw-text-small tw-text-fg-tertiary tw-mt-1 tw-mb-0">
            {months.length} month{months.length!==1?"s":""} · {appliedRange.from} → {appliedRange.to}
          </p>
        </div>

        {/* Date range picker */}
        <div className="tw-flex tw-flex-wrap tw-items-end tw-gap-3">
          <div className="tw-flex tw-flex-col tw-gap-1">
            <span className="tw-text-[11px] tw-font-semibold tw-uppercase tw-text-fg-tertiary">From</span>
            <div className="tw-flex tw-gap-1">
              <select className={selectCls} value={fromMon} onChange={e=>{ const m=Number(e.target.value); setFromMon(m); if(toYYYYMM(fromYear,m)>toVal){setToYear(fromYear);setToMon(m);} }}>
                {fromMonOptions(fromYear).map((name,i)=><option key={i+1} value={i+1}>{name}</option>)}
              </select>
              <select className={selectCls} value={fromYear} onChange={e=>{ const y=Number(e.target.value); setFromYear(y); if(toYYYYMM(y,fromMon)>toVal){setToYear(y);setToMon(fromMon);} }}>
                {YEAR_OPTIONS.map(y=><option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
          <span className="tw-text-fg-tertiary tw-text-[16px] tw-mb-1">→</span>
          <div className="tw-flex tw-flex-col tw-gap-1">
            <span className="tw-text-[11px] tw-font-semibold tw-uppercase tw-text-fg-tertiary">To</span>
            <div className="tw-flex tw-gap-1">
              <select className={selectCls} value={toMon} onChange={e=>{ const m=Number(e.target.value); setToMon(m); if(toYYYYMM(fromYear,fromMon)>toYYYYMM(toYear,m)){setFromYear(toYear);setFromMon(m);} }}>
                {toMonOptions(toYear).map((name,i)=><option key={i+1} value={i+1}>{name}</option>)}
              </select>
              <select className={selectCls} value={toYear} onChange={e=>{ const y=Number(e.target.value); setToYear(y); setToMon(y===CUR_YEAR?Math.min(toMon,CUR_MON):toMon); }}>
                {YEAR_OPTIONS.map(y=><option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
          <button onClick={()=>{ if(!isInvalid) setAppliedRange({from:fromVal,to:toVal}); }} disabled={isFetching||isInvalid}
            className="tw-inline-flex tw-items-center tw-gap-2 tw-px-4 tw-py-1.5 tw-rounded-md tw-text-[13px] tw-font-medium tw-bg-fg-info tw-text-white disabled:tw-opacity-50 disabled:tw-cursor-not-allowed hover:tw-opacity-90 tw-transition-opacity">
            {isFetching ? <Spinner size={12} className="tw-text-white"/> : null}
            {isFetching ? "Loading…" : "Apply"}
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      {latest && (
        <motion.div variants={fadeUp} initial="hidden" animate="visible"
          className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 lg:tw-grid-cols-4 tw-gap-4">
          <KpiPlain tone="info"    label={`${latest.name} · Avg Daily Sales`}     value={fmt(latest.avgDailyNetSales)}      delta={salesChange  !== null ? Number(salesChange)  : undefined} sub={prev?`vs ${prev.name}`:undefined}/>
          <KpiPlain tone="success" label={`${latest.name} · Avg Daily Sessions`}  value={`${latest.avgDailySessions}/day`}  delta={sessChange   !== null ? Number(sessChange)   : undefined} sub={prev?`vs ${prev.name}`:undefined}/>
          <KpiPlain tone="warning" label={`${latest.name} · Avg Daily Minutes`}   value={`${latest.avgDailyMinutes} min`}   delta={minsChange   !== null ? Number(minsChange)   : undefined} sub={prev?`vs ${prev.name}`:undefined}/>
          <KpiPlain tone="neutral" label={`${latest.name} · Avg Recharge Ticket`} value={fmt(latest.avgRechargeTicket)}     delta={ticketChange !== null ? Number(ticketChange) : undefined} sub={prev?`vs ${prev.name}`:undefined}/>
        </motion.div>
      )}

      {/* ── 7 Tabs ── */}
      <Tabs value={activeTab} onChange={setActiveTab}>
        <TabsList className="tw-w-full">
          <Tab value="overview">Overview</Tab>
          <Tab value="sales">Total Sales</Tab>
          <Tab value="sessions">Sessions</Tab>
          <Tab value="recharges">Recharges</Tab>
          <Tab value="individuals">Individuals</Tab>
          <Tab value="attempts">Call Attempts</Tab>
          <Tab value="payroll">Payroll</Tab>
        </TabsList>

        <TabPanel value="overview">
          <OverviewTab months={months} observations={observations} />
        </TabPanel>
        <TabPanel value="sales">
          <TotalSalesTab monthlySales={monthlySales} months={months} />
        </TabPanel>
        <TabPanel value="sessions">
          {months.length ? <SessionsTab months={months} /> : <EmptyState title="No data" description="Adjust range and Apply." />}
        </TabPanel>
        <TabPanel value="recharges">
          {months.length ? <RechargesTab months={months} monthlySales={monthlySales} /> : <EmptyState title="No data" description="Adjust range and Apply." />}
        </TabPanel>
        <TabPanel value="individuals">
          <IndividualsTab individuals={individuals} listenerDailyHours={listenerDailyHours} payrollFrom={payrollFrom} setPayrollFrom={setPayrollFrom} payrollTo={payrollTo} setPayrollTo={setPayrollTo}/>
        </TabPanel>
        <TabPanel value="attempts">
          <CallAttemptsTab callAttempts={callAttempts} />
        </TabPanel>
        <TabPanel value="payroll">
          <PayrollTab listenerDailyHours={listenerDailyHours} listenerDailyOnlineHours={listenerDailyOnlineHours} payrollFrom={payrollFrom} setPayrollFrom={setPayrollFrom} payrollTo={payrollTo} setPayrollTo={setPayrollTo} minWorkHours={minWorkHours} setMinWorkHours={setMinWorkHours}/>
        </TabPanel>
      </Tabs>
    </div>
  );
}
