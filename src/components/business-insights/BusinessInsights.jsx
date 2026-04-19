import React, { useState } from "react";
import ReactApexChart from "react-apexcharts";
import { useMonthlyInsightsQuery } from "../../services/auth";
import "./business-insights.scss";

const MONTH_COLORS = ["#6366f1", "#06b6d4", "#10b981", "#f59e0b", "#f43f5e"];

const fmt = (n) => `₹${Number(n).toLocaleString("en-IN")}`;

// Shared light chart base — all charts inherit this
const DC = {
  background: "transparent",
  foreColor: "#64748b",
  fontFamily: "Outfit, Inter, sans-serif",
  toolbar: { show: false },
  animations: { enabled: true, easing: "easeinout", speed: 600 },
};
const DARK_GRID = { borderColor: "#e9eef5", strokeDashArray: 3 };
const DARK_XAXIS = (categories) => ({
  categories,
  labels: { style: { colors: "#94a3b8", fontSize: "11px", fontFamily: "Outfit, Inter, sans-serif" } },
  axisBorder: { show: false },
  axisTicks: { show: false },
});
const DARK_YAXIS = (formatter) => ({
  labels: { style: { colors: "#94a3b8", fontSize: "11px", fontFamily: "Outfit, Inter, sans-serif" }, formatter },
});
const DARK_TOOLTIP = (formatter) => ({
  theme: "light",
  style: { fontFamily: "Outfit, Inter, sans-serif", fontSize: "12px" },
  y: { formatter },
});
const DARK_LEGEND = { labels: { colors: "#64748b" }, fontFamily: "Outfit, Inter, sans-serif", fontSize: "11px" };

function TrendChart({ title, series, categories, colors, yFormatter }) {
  const options = {
    chart: { ...DC, type: "bar" },
    plotOptions: { bar: { borderRadius: 5, columnWidth: "52%", borderRadiusApplication: "end" } },
    colors: colors || MONTH_COLORS,
    dataLabels: { enabled: false },
    xaxis: DARK_XAXIS(categories),
    yaxis: DARK_YAXIS(yFormatter || ((v) => v)),
    grid: DARK_GRID,
    tooltip: DARK_TOOLTIP(yFormatter || ((v) => v)),
    fill: { type: "gradient", gradient: { shade: "light", type: "vertical", shadeIntensity: 0.1, opacityFrom: 1, opacityTo: 0.88 } },
  };
  return (
    <div className="bi-chart-card">
      <div className="bi-chart-title">{title}</div>
      <ReactApexChart options={options} series={series} type="bar" height={220} />
    </div>
  );
}

function DonutChart({ title, labels, values, colors }) {
  const options = {
    chart: { ...DC, type: "donut" },
    labels,
    colors: colors || MONTH_COLORS,
    legend: { ...DARK_LEGEND, position: "bottom" },
    dataLabels: { enabled: true, formatter: (val) => `${val.toFixed(0)}%`, style: { fontSize: "11px", fontFamily: "Outfit, Inter, sans-serif", colors: ["#1e293b"] }, dropShadow: { enabled: false } },
    plotOptions: { pie: { donut: { size: "62%", labels: { show: false } } } },
    stroke: { width: 2, colors: ["#ffffff"] },
    tooltip: { theme: "light", style: { fontFamily: "Outfit, Inter, sans-serif", fontSize: "12px" } },
  };
  return (
    <div className="bi-chart-card">
      <div className="bi-chart-title">{title}</div>
      <ReactApexChart options={options} series={values} type="donut" height={220} />
    </div>
  );
}

const KPI_CONFIGS = {
  sales:    { color: "#10b981", rgb: "16,185,129", icon: "₹" },
  sessions: { color: "#6366f1", rgb: "99,102,241",  icon: "◎" },
  minutes:  { color: "#f59e0b", rgb: "245,158,11",  icon: "◷" },
  quality:  { color: "#06b6d4", rgb: "6,182,212",   icon: "◈" },
};

function StatCard({ label, value, sub, colorKey = "sales", positive }) {
  const cfg = KPI_CONFIGS[colorKey] || KPI_CONFIGS.sales;
  const isPos = positive === undefined ? null : positive;
  return (
    <div className="bi-stat-card" style={{ "--kpi-color": cfg.color, "--kpi-rgb": cfg.rgb }}>
      <span className="bi-stat-icon">{cfg.icon}</span>
      <div className="bi-stat-label">{label}</div>
      <div className="bi-stat-value">{value}</div>
      {sub && (
        <div className="bi-stat-sub" style={{ color: isPos === null ? cfg.color : isPos ? "#10b981" : "#f43f5e" }}>
          {isPos !== null && (isPos ? "▲ " : "▼ ")}{sub}
        </div>
      )}
    </div>
  );
}

function InsightBadge({ text, type }) {
  return <span className={`bi-badge bi-badge--${type}`}>{text}</span>;
}

function SectionHeader({ title, subtitle }) {
  return (
    <div className="bi-section-header mb-4" style={{ marginTop: "0.25rem" }}>
      <div>
        <h5 className="bi-section-title">{title}</h5>
        {subtitle && <p className="bi-section-subtitle" style={{ marginTop: "0.2rem", paddingLeft: "1.1rem" }}>{subtitle}</p>}
      </div>
    </div>
  );
}

const MONTH_NAMES_FULL = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const NOW = new Date();
const CUR_YEAR = NOW.getFullYear();
const CUR_MON  = NOW.getMonth() + 1; // 1-based
const YEAR_OPTIONS = Array.from({ length: CUR_YEAR - 2024 + 1 }, (_, i) => 2024 + i);

function toYYYYMM(year, mon) {
  return `${year}-${String(mon).padStart(2, "0")}`;
}
function parseYYYYMM(str) {
  const [y, m] = str.split("-");
  return { year: Number(y), mon: Number(m) };
}

export default function BusinessInsights() {
  const [activeTab, setActiveTab] = useState("overview");
  const [rechargeMonthKey, setRechargeMonthKey] = useState(null); // null = latest
  const [sessionMonthKey, setSessionMonthKey] = useState(null);   // null = latest

  const [fromYear, setFromYear] = useState(2025);
  const [fromMon,  setFromMon]  = useState(12);
  const [toYear,   setToYear]   = useState(CUR_YEAR);
  const [toMon,    setToMon]    = useState(CUR_MON);

  const [appliedRange, setAppliedRange] = useState({
    from: "2025-12",
    to: toYYYYMM(CUR_YEAR, CUR_MON),
  });

  const fromVal = toYYYYMM(fromYear, fromMon);
  const toVal   = toYYYYMM(toYear, toMon);
  const isInvalid = fromVal > toVal;

  const { data, isLoading, error, isFetching } = useMonthlyInsightsQuery(appliedRange);

  const handleApply = () => {
    if (isInvalid) return;
    setAppliedRange({ from: fromVal, to: toVal });
  };

  // Month options capped so "to" can't exceed current month in current year
  function toMonOptions(year) {
    const max = year === CUR_YEAR ? CUR_MON : 12;
    return MONTH_NAMES_FULL.slice(0, max);
  }
  // From month options: if same year as "to", cap at toMon
  function fromMonOptions(year) {
    const max = year === toYear ? toMon : 12;
    return MONTH_NAMES_FULL.slice(0, max);
  }
  // ── Payroll cycle date state (25→25) ──
  const payrollDefaultFrom = (() => {
    const d = new Date();
    if (d.getDate() >= 25) return new Date(d.getFullYear(), d.getMonth(), 25);
    const prev = new Date(d.getFullYear(), d.getMonth() - 1, 25);
    return prev;
  })();
  const payrollDefaultTo = new Date(); // today
  const fmtDate = (d) => d.toISOString().split("T")[0];
  const [payrollFrom, setPayrollFrom] = useState(fmtDate(payrollDefaultFrom));
  const [payrollTo,   setPayrollTo]   = useState(fmtDate(payrollDefaultTo));
  const [minWorkHours, setMinWorkHours] = useState(3); // deduction threshold in hours

  const individuals = data?.individuals || {};
  const callAttempts = data?.callAttempts || [];
  const monthlySales = data?.monthlySales || [];
  const listenerHours = data?.listenerHours || [];
  const listenerDailyHours = data?.listenerDailyHours || [];

  if (isLoading) return <div className="bi-wrapper"><div className="bi-loading">Loading insights</div></div>;
  if (error) return <div className="bi-wrapper"><div className="bi-error">Failed to load — check connection</div></div>;

  const months = data?.months || [];
  const names = months.map((m) => m.name);

  // ── Summary numbers for overview cards ──
  const latest = months[months.length - 1];
  const prev = months[months.length - 2];
  const salesChange = prev ? (((latest.avgDailyNetSales - prev.avgDailyNetSales) / prev.avgDailyNetSales) * 100).toFixed(1) : null;
  const sessChange = prev ? (((latest.avgDailySessions - prev.avgDailySessions) / prev.avgDailySessions) * 100).toFixed(1) : null;
  const minsChange = prev ? (((latest.avgDailyMinutes - prev.avgDailyMinutes) / prev.avgDailyMinutes) * 100).toFixed(1) : null;

  // ── Chart data ──
  const salesSeries = [{ name: "Avg Daily Net Sales", data: months.map((m) => m.avgDailyNetSales) }];
  const sessionSeries = [{ name: "Avg Daily Sessions", data: months.map((m) => m.avgDailySessions) }];
  const minutesSeries = [{ name: "Avg Daily Minutes", data: months.map((m) => m.avgDailyMinutes) }];

  const multiLineSeries = [
    { name: "Net Sales/Day", data: months.map((m) => m.avgDailyNetSales) },
    { name: "Sessions/Day", data: months.map((m) => m.avgDailySessions) },
    { name: "Minutes/Day", data: months.map((m) => m.avgDailyMinutes) },
  ];

  // Session type stacked
  const callSeries = [{ name: "Call", data: months.map((m) => parseFloat((m.sessionTypes?.call?.cnt / m.days).toFixed(1))) }];
  const videoSeries = [{ name: "Video", data: months.map((m) => parseFloat((m.sessionTypes?.video?.cnt / m.days).toFixed(1))) }];
  const chatSeries = [{ name: "Chat", data: months.map((m) => parseFloat((m.sessionTypes?.chat?.cnt / m.days).toFixed(1))) }];

  const typeStackedOptions = {
    chart: { ...DC, type: "bar", stacked: true },
    plotOptions: { bar: { borderRadius: 4, columnWidth: "52%", borderRadiusApplication: "end" } },
    colors: ["#6366f1", "#10b981", "#f59e0b"],
    xaxis: DARK_XAXIS(names),
    yaxis: DARK_YAXIS((v) => `${v}/d`),
    legend: { ...DARK_LEGEND, position: "top" },
    dataLabels: { enabled: false },
    grid: DARK_GRID,
    fill: { opacity: 0.9 },
    tooltip: { theme: "light", style: { fontFamily: "Outfit, Inter, sans-serif", fontSize: "12px" } },
  };

  // Revenue ratio
  const ratioSeries = [{ name: "Session Rev / Recharge %", data: months.map((m) => m.sessRechargeRatio) }];

  // Ticket size
  const ticketSeries = [{ name: "Avg Recharge Ticket (₹)", data: months.map((m) => m.avgRechargeTicket) }];

  // Duration buckets for the selected month (latest)
  const durationLabels = ["1 min (wasted)", "2–5 min", "6–15 min", "15+ min (deep)"];

  // Peak hours (latest full month = Mar)
  const mar = months.find((m) => m.key === "mar26") || latest;
  const apr = months.find((m) => m.key === "apr26") || latest;

  const peakLabels = ["Night (12am–6am)", "Morning (6am–12pm)", "Afternoon (12–6pm)", "Evening (6pm–12am)"];
  function peakValues(m) {
    return [m.peakHours?.night, m.peakHours?.morning, m.peakHours?.afternoon, m.peakHours?.evening];
  }

  // Observations
  const observations = [
    {
      type: "info",
      text: `Video sessions drove March revenue — averaging ${(mar.sessionTypes?.video?.cnt / mar.days).toFixed(0)}/day vs ${(months[0].sessionTypes?.video?.cnt / months[0].days).toFixed(0)}/day in Dec (+${(((mar.sessionTypes?.video?.cnt / mar.days) / (months[0].sessionTypes?.video?.cnt / months[0].days)) * 100 - 100).toFixed(0)}%).`,
    },
    {
      type: "warning",
      text: `March session-to-recharge ratio hit 168% — users spent ₹1.68 for every ₹1 recharged, draining saved wallets.`,
    },
    {
      type: "danger",
      text: `~44% of all sessions are just 1 minute — these deduct wallet balance without delivering value, driving churn.`,
    },
    {
      type: "info",
      text: `~40% of sessions happen between midnight–6am every month. Morning (6am–12pm) is only ~8% — a major untapped slot.`,
    },
    {
      type: "success",
      text: `Unique active users grew from 118 in Dec to 210 in March — consistent platform growth.`,
    },
    {
      type: "warning",
      text: `April's avg recharge ticket dropped to ₹${apr.avgRechargeTicket} (lowest ever). The ₹118 plan is now the #1 choice — users are less committed.`,
    },
  ];

  return (
    <div className="bi-wrapper">
      {/* Header */}
      <div className="bi-header">
        <div className="bi-header-top">
          <div>
            <div className="bi-eyebrow">Business Intelligence</div>
            <h4 className="bi-main-title">Performance Insights</h4>
            <p className="bi-main-subtitle">
              Showing {parseYYYYMM(appliedRange.from).mon && MONTH_NAMES_FULL[parseYYYYMM(appliedRange.from).mon - 1]} {parseYYYYMM(appliedRange.from).year} → {MONTH_NAMES_FULL[parseYYYYMM(appliedRange.to).mon - 1]} {parseYYYYMM(appliedRange.to).year} &nbsp;·&nbsp; {months.length} month{months.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="bi-range-picker">
            <div className="bi-range-group">
              <label className="bi-range-label">From</label>
              <div className="bi-range-selects">
                <select
                  className="bi-range-select"
                  value={fromMon}
                  onChange={e => {
                    const m = Number(e.target.value);
                    setFromMon(m);
                    if (toYYYYMM(fromYear, m) > toVal) { setToYear(fromYear); setToMon(m); }
                  }}
                >
                  {fromMonOptions(fromYear).map((name, i) => (
                    <option key={i+1} value={i+1}>{name}</option>
                  ))}
                </select>
                <select
                  className="bi-range-select"
                  value={fromYear}
                  onChange={e => {
                    const y = Number(e.target.value);
                    setFromYear(y);
                    if (toYYYYMM(y, fromMon) > toVal) { setToYear(y); setToMon(fromMon); }
                  }}
                >
                  {YEAR_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
            <span className="bi-range-sep">→</span>
            <div className="bi-range-group">
              <label className="bi-range-label">To</label>
              <div className="bi-range-selects">
                <select
                  className="bi-range-select"
                  value={toMon}
                  onChange={e => {
                    const m = Number(e.target.value);
                    setToMon(m);
                    if (toYYYYMM(fromYear, fromMon) > toYYYYMM(toYear, m)) { setFromYear(toYear); setFromMon(m); }
                  }}
                >
                  {toMonOptions(toYear).map((name, i) => (
                    <option key={i+1} value={i+1}>{name}</option>
                  ))}
                </select>
                <select
                  className="bi-range-select"
                  value={toYear}
                  onChange={e => {
                    const y = Number(e.target.value);
                    setToYear(y);
                    const newToMon = y === CUR_YEAR ? Math.min(toMon, CUR_MON) : toMon;
                    setToMon(newToMon);
                  }}
                >
                  {YEAR_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
            <button
              className={`bi-apply-btn ${isFetching ? "bi-apply-btn--loading" : ""}`}
              onClick={handleApply}
              disabled={isFetching || isInvalid}
            >
              {isFetching ? "Loading…" : "Apply"}
            </button>
          </div>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="bi-kpi-strip">
        <StatCard
          colorKey="sales"
          label={`${latest.name} · Avg Daily Sales`}
          value={fmt(latest.avgDailyNetSales)}
          sub={salesChange !== null ? `${Math.abs(salesChange)}% vs ${prev.name}` : ""}
          positive={salesChange > 0}
        />
        <StatCard
          colorKey="sessions"
          label={`${latest.name} · Avg Daily Sessions`}
          value={`${latest.avgDailySessions}/day`}
          sub={sessChange !== null ? `${Math.abs(sessChange)}% vs ${prev.name}` : ""}
          positive={sessChange > 0}
        />
        <StatCard
          colorKey="minutes"
          label={`${latest.name} · Avg Daily Minutes`}
          value={`${latest.avgDailyMinutes} min`}
          sub={minsChange !== null ? `${Math.abs(minsChange)}% vs ${prev.name}` : ""}
          positive={minsChange > 0}
        />
        <StatCard
          colorKey="quality"
          label={`${latest.name} · Avg Min / Session`}
          value={`${latest.avgMinPerSession} min`}
          sub={`${latest.uniqueActiveUsers} active users`}
        />
      </div>

      {/* Tabs */}
      <div className="bi-tabs mb-4">
        {["overview", "sales", "sessions", "recharges", "individuals", "attempts", "deep"].map((t) => (
          <button
            key={t}
            className={`bi-tab ${activeTab === t ? "bi-tab--active" : ""}`}
            onClick={() => setActiveTab(t)}
          >
            {t === "overview" && "Overview"}
            {t === "sales" && "Total Sales"}
            {t === "sessions" && "Sessions"}
            {t === "recharges" && "Recharges"}
            {t === "individuals" && "Individuals"}
            {t === "attempts" && "Call Attempts"}
            {t === "deep" && "Deep Insights"}
          </button>
        ))}
      </div>

      {/* ─── OVERVIEW TAB ─── */}
      {activeTab === "overview" && (
        <>
          <SectionHeader title="Monthly Trends" subtitle="Average daily metrics across all 5 months" />
          <div className="bi-chart-grid mb-4">
            <TrendChart title="Avg Daily Net Sales (₹)" series={salesSeries} categories={names} yFormatter={(v) => `₹${v.toLocaleString()}`} />
            <TrendChart title="Avg Daily Sessions" series={sessionSeries} categories={names} yFormatter={(v) => `${v}`} colors={["#10b981"]} />
            <TrendChart title="Avg Daily Minutes" series={minutesSeries} categories={names} yFormatter={(v) => `${v} min`} colors={["#f59e0b"]} />
          </div>

          <SectionHeader title="Combined Trend" subtitle="Overlay of all three key metrics" />
          <div className="bi-chart-card mb-4">
            <h6 className="bi-chart-title">Sales / Sessions / Minutes — Month-over-Month</h6>
            <ReactApexChart
              options={{
                chart: { ...DC, type: "line" },
                stroke: { curve: "smooth", width: [3, 3, 3] },
                colors: ["#6366f1", "#10b981", "#f59e0b"],
                markers: { size: 6 },
                dataLabels: { enabled: false },
                xaxis: DARK_XAXIS(names),
                yaxis: [
                  { title: { text: "₹ Sales", style: { color: "#94a3b8", fontFamily: "Outfit, Inter, sans-serif", fontSize: "11px" } }, labels: { style: { colors: "#94a3b8", fontFamily: "Outfit, Inter, sans-serif" }, formatter: (v) => `₹${v.toLocaleString()}` } },
                  { opposite: true, title: { text: "Sessions / Minutes", style: { color: "#94a3b8", fontFamily: "Outfit, Inter, sans-serif", fontSize: "11px" } }, labels: { style: { colors: "#94a3b8", fontFamily: "Outfit, Inter, sans-serif" } } },
                ],
                legend: { ...DARK_LEGEND, position: "top" },
                grid: DARK_GRID,
              }}
              series={[
                { name: "Net Sales/Day (₹)", data: months.map((m) => m.avgDailyNetSales) },
                { name: "Sessions/Day", data: months.map((m) => m.avgDailySessions) },
                { name: "Minutes/Day", data: months.map((m) => m.avgDailyMinutes) },
              ]}
              type="line"
              height={260}
            />
          </div>

          <SectionHeader title="Key Observations" />
          <div className="bi-observations mb-4">
            {observations.map((o, i) => (
              <div key={i} className={`bi-observation bi-observation--${o.type}`}>
                <span className="bi-obs-dot" />
                <span>{o.text}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ─── SESSIONS TAB ─── */}
      {activeTab === "sessions" && (
        <>
          {/* ── DAILY SESSION DETAILS ── */}
          {(() => {
            const selMonth = months.find(m => m.key === sessionMonthKey) || latest;
            const daily = selMonth?.dailySessions || [];
            const dayLabels = daily.map(d => d.day ? d.day.slice(5) : "");
            const totalCount = daily.reduce((s, d) => s + d.count, 0);
            const totalRevenue = daily.reduce((s, d) => s + d.revenue, 0);
            const totalMins = daily.reduce((s, d) => s + d.minutes, 0);
            return (
              <>
                <div className="bi-section-header mb-2" style={{ marginTop: "0.25rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
                  <div>
                    <h5 className="bi-section-title">Daily Session Details</h5>
                    <p className="bi-section-subtitle" style={{ marginTop: "0.2rem", paddingLeft: "1.1rem" }}>Session count, revenue and minutes per day</p>
                  </div>
                  <select
                    className="bi-range-select"
                    value={sessionMonthKey || latest?.key || ""}
                    onChange={e => setSessionMonthKey(e.target.value)}
                    style={{ alignSelf: "flex-end" }}
                  >
                    {months.map(m => <option key={m.key} value={m.key}>{m.name}</option>)}
                  </select>
                </div>

                {/* Summary pills */}
                <div className="bi-recharge-summary mb-4">
                  <div className="bi-recharge-pill bi-recharge-pill--total">
                    <span className="bi-rp-label">Total Sessions</span>
                    <span className="bi-rp-val">{totalCount.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="bi-recharge-pill bi-recharge-pill--gross">
                    <span className="bi-rp-label">Total Revenue</span>
                    <span className="bi-rp-val">{fmt(totalRevenue)}</span>
                  </div>
                  <div className="bi-recharge-pill bi-recharge-pill--net">
                    <span className="bi-rp-label">Total Minutes</span>
                    <span className="bi-rp-val">{totalMins.toLocaleString("en-IN")} min</span>
                  </div>
                  <div className="bi-recharge-pill bi-recharge-pill--rate">
                    <span className="bi-rp-label">Avg/Day</span>
                    <span className="bi-rp-val">{daily.length > 0 ? Math.round(totalCount / daily.length) : 0} sessions</span>
                  </div>
                </div>

                <div className="bi-chart-grid bi-chart-grid--2 mb-4">
                  <div className="bi-chart-card">
                    <h6 className="bi-chart-title">Daily Session Count by Type — {selMonth?.name}</h6>
                    <ReactApexChart
                      options={{
                        chart: { ...DC, type: "bar", stacked: true },
                        plotOptions: { bar: { borderRadius: 3, columnWidth: "65%" } },
                        colors: ["#6366f1", "#10b981", "#f59e0b"],
                        xaxis: { ...DARK_XAXIS(dayLabels), tickAmount: Math.min(dayLabels.length, 10) },
                        yaxis: DARK_YAXIS(v => `${v}`),
                        legend: { ...DARK_LEGEND, position: "top" },
                        dataLabels: { enabled: false },
                        grid: DARK_GRID,
                      }}
                      series={[
                        { name: "Call", data: daily.map(d => d.callCount) },
                        { name: "Video", data: daily.map(d => d.videoCount) },
                        { name: "Chat", data: daily.map(d => d.chatCount) },
                      ]}
                      type="bar" height={240}
                    />
                  </div>
                  <div className="bi-chart-card">
                    <h6 className="bi-chart-title">Daily Revenue &amp; Minutes — {selMonth?.name}</h6>
                    <ReactApexChart
                      options={{
                        chart: { ...DC, type: "line" },
                        stroke: { curve: "smooth", width: [3, 2] },
                        colors: ["#6366f1", "#f59e0b"],
                        xaxis: { ...DARK_XAXIS(dayLabels), tickAmount: Math.min(dayLabels.length, 10) },
                        yaxis: [
                          { labels: { style: { colors: "#94a3b8" }, formatter: v => `₹${v.toLocaleString()}` } },
                          { opposite: true, labels: { style: { colors: "#94a3b8" }, formatter: v => `${v}m` } },
                        ],
                        legend: { ...DARK_LEGEND, position: "top" },
                        dataLabels: { enabled: false },
                        grid: DARK_GRID,
                        markers: { size: 3 },
                      }}
                      series={[
                        { name: "Revenue (₹)", data: daily.map(d => d.revenue) },
                        { name: "Minutes", data: daily.map(d => d.minutes) },
                      ]}
                      type="line" height={240}
                    />
                  </div>
                </div>

                {/* Daily table */}
                <div className="bi-table-card mb-4" style={{ overflowX: "auto" }}>
                  <table className="bi-table">
                    <thead>
                      <tr>
                        <th>Date</th><th>Sessions</th><th>Call</th><th>Video</th><th>Chat</th><th>Revenue</th><th>Minutes</th><th>Avg min/sess</th>
                      </tr>
                    </thead>
                    <tbody>
                      {daily.map((d, i) => (
                        <tr key={i}>
                          <td className="bi-cell--label">{d.day}</td>
                          <td><strong>{d.count}</strong></td>
                          <td>{d.callCount || "—"}</td>
                          <td>{d.videoCount || "—"}</td>
                          <td>{d.chatCount || "—"}</td>
                          <td style={{ color: "#6366f1" }}>{d.revenue ? fmt(d.revenue) : "—"}</td>
                          <td>{d.minutes ? `${d.minutes} min` : "—"}</td>
                          <td>{d.count > 0 ? `${(d.minutes / d.count).toFixed(1)} min` : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td className="bi-cell--label">Total</td>
                        <td><strong>{totalCount}</strong></td>
                        <td>{daily.reduce((s,d)=>s+d.callCount,0)}</td>
                        <td>{daily.reduce((s,d)=>s+d.videoCount,0)}</td>
                        <td>{daily.reduce((s,d)=>s+d.chatCount,0)}</td>
                        <td><strong style={{ color: "#6366f1" }}>{fmt(totalRevenue)}</strong></td>
                        <td><strong>{totalMins} min</strong></td>
                        <td>{totalCount > 0 ? `${(totalMins/totalCount).toFixed(1)} min` : "—"}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </>
            );
          })()}

          <SectionHeader title="Session Type Breakdown" subtitle="Avg sessions per day by type (Call · Video · Chat)" />
          <div className="bi-chart-card mb-4">
            <h6 className="bi-chart-title">Session Types — Avg/Day (Stacked)</h6>
            <ReactApexChart
              options={typeStackedOptions}
              series={[
                { name: "Call", data: months.map((m) => parseFloat((m.sessionTypes?.call?.cnt / m.days).toFixed(1))) },
                { name: "Video", data: months.map((m) => parseFloat((m.sessionTypes?.video?.cnt / m.days).toFixed(1))) },
                { name: "Chat", data: months.map((m) => parseFloat((m.sessionTypes?.chat?.cnt / m.days).toFixed(1))) },
              ]}
              type="bar"
              height={240}
            />
          </div>

          <SectionHeader title="Session Type Revenue" subtitle="Avg daily revenue by type (₹)" />
          <div className="bi-chart-card mb-4">
            <h6 className="bi-chart-title">Revenue/Day by Type (₹)</h6>
            <ReactApexChart
              options={{
                chart: { type: "bar", stacked: true, toolbar: { show: false }, fontFamily: "inherit" },
                plotOptions: { bar: { borderRadius: 4, columnWidth: "55%" } },
                colors: ["#6366f1", "#10b981", "#f59e0b"],
                xaxis: DARK_XAXIS(names),
                yaxis: DARK_YAXIS((v) => `₹${v.toLocaleString()}`),
                legend: { ...DARK_LEGEND, position: "top" },
                dataLabels: { enabled: false },
                grid: DARK_GRID,
              }}
              series={[
                { name: "Call Rev", data: months.map((m) => Math.round(m.sessionTypes?.call?.rev / m.days)) },
                { name: "Video Rev", data: months.map((m) => Math.round(m.sessionTypes?.video?.rev / m.days)) },
                { name: "Chat Rev", data: months.map((m) => Math.round(m.sessionTypes?.chat?.rev / m.days)) },
              ]}
              type="bar"
              height={240}
            />
          </div>

          <SectionHeader title="Session Duration Quality" subtitle="% of sessions by length — shorter = wasted wallet spend" />
          <div className="bi-chart-grid bi-chart-grid--2 mb-4">
            {months.slice(1).map((m) => (
              <DonutChart
                key={m.key}
                title={m.name}
                labels={durationLabels}
                values={[m.durationBuckets?.["1min"] || 0, m.durationBuckets?.["2to5"] || 0, m.durationBuckets?.["6to15"] || 0, m.durationBuckets?.["15plus"] || 0]}
                colors={["#ef4444", "#f59e0b", "#10b981", "#6366f1"]}
              />
            ))}
          </div>

          <SectionHeader title="Peak Hour Distribution" subtitle="When do sessions happen? (% of daily sessions by time slot)" />
          <div className="bi-table-card mb-4">
            <table className="bi-table">
              <thead>
                <tr>
                  <th>Time Slot</th>
                  {months.slice(1).map((m) => <th key={m.key}>{m.name}</th>)}
                </tr>
              </thead>
              <tbody>
                {[
                  { label: "Night (12am–6am)", key: "night" },
                  { label: "Morning (6am–12pm)", key: "morning" },
                  { label: "Afternoon (12–6pm)", key: "afternoon" },
                  { label: "Evening (6pm–12am)", key: "evening" },
                ].map((slot) => (
                  <tr key={slot.key}>
                    <td>{slot.label}</td>
                    {months.slice(1).map((m) => (
                      <td key={m.key} className={m.peakHours?.[slot.key] >= 35 ? "bi-cell--hot" : m.peakHours?.[slot.key] <= 10 ? "bi-cell--cold" : ""}>
                        {m.peakHours?.[slot.key]}%
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <SectionHeader title="User Engagement" subtitle="Unique active users and sessions per user" />
          <div className="bi-chart-grid mb-4">
            <TrendChart
              title="Unique Active Users"
              series={[{ name: "Active Users", data: months.map((m) => m.uniqueActiveUsers) }]}
              categories={names}
              colors={["#6366f1"]}
            />
            <TrendChart
              title="Sessions per User"
              series={[{ name: "Sessions/User", data: months.map((m) => m.sessionsPerUser) }]}
              categories={names}
              colors={["#10b981"]}
            />
          </div>
        </>
      )}

      {/* ─── TOTAL SALES TAB ─── */}
      {activeTab === "sales" && (
        <>
          <SectionHeader title="Total Sales by Month" subtitle="Absolute totals — not daily averages" />
          <div className="bi-chart-grid mb-4">
            <div className="bi-chart-card">
              <h6 className="bi-chart-title">Total Net Recharge (₹)</h6>
              <ReactApexChart
                options={{
                  chart: { ...DC, type: "bar" },
                  plotOptions: { bar: { borderRadius: 6, columnWidth: "50%", distributed: true } },
                  colors: MONTH_COLORS,
                  dataLabels: { enabled: true, formatter: (v) => `₹${(v/1000).toFixed(0)}k` },
                  xaxis: DARK_XAXIS(monthlySales.map(m => m.name)),
                  yaxis: DARK_YAXIS((v) => `₹${(v/1000).toFixed(0)}k`),
                  legend: { show: false },
                  grid: DARK_GRID,
                  tooltip: { y: { formatter: (v) => `₹${Number(v).toLocaleString("en-IN")}` } },
                }}
                series={[{ name: "Net Recharge", data: monthlySales.map(m => m.totalNetRecharge) }]}
                type="bar" height={260}
              />
            </div>
            <div className="bi-chart-card">
              <h6 className="bi-chart-title">Total Session Revenue (₹)</h6>
              <ReactApexChart
                options={{
                  chart: { ...DC, type: "bar" },
                  plotOptions: { bar: { borderRadius: 6, columnWidth: "50%", distributed: true } },
                  colors: ["#10b981","#10b981","#10b981","#10b981","#10b981"],
                  dataLabels: { enabled: true, formatter: (v) => `₹${(v/1000).toFixed(0)}k` },
                  xaxis: DARK_XAXIS(monthlySales.map(m => m.name)),
                  yaxis: DARK_YAXIS((v) => `₹${(v/1000).toFixed(0)}k`),
                  legend: { show: false },
                  grid: DARK_GRID,
                  tooltip: { y: { formatter: (v) => `₹${Number(v).toLocaleString("en-IN")}` } },
                }}
                series={[{ name: "Session Revenue", data: monthlySales.map(m => Math.round(m.totalSessionRevenue)) }]}
                type="bar" height={260}
              />
            </div>
          </div>

          <SectionHeader title="Monthly Summary Table" subtitle="All totals side-by-side" />
          <div className="bi-table-card mb-4">
            <table className="bi-table">
              <thead>
                <tr>
                  <th>Metric</th>
                  {monthlySales.map(m => <th key={m.key}>{m.name}</th>)}
                </tr>
              </thead>
              <tbody>
                {[
                  { label: "Total Net Recharge", fn: m => fmt(m.totalNetRecharge) },
                  { label: "Total Gross Recharge", fn: m => fmt(Math.round(m.totalGrossRecharge)) },
                  { label: "Total Session Revenue", fn: m => fmt(Math.round(m.totalSessionRevenue)) },
                  { label: "Total Sessions", fn: m => Number(m.totalSessions).toLocaleString("en-IN") },
                  { label: "Total Minutes", fn: m => `${Number(Math.round(m.totalMinutes)).toLocaleString("en-IN")} min` },
                  { label: "Rev / Recharge Gap", fn: m => fmt(Math.round(m.totalSessionRevenue - m.totalNetRecharge)) },
                ].map(row => (
                  <tr key={row.label}>
                    <td className="bi-cell--label">{row.label}</td>
                    {monthlySales.map(m => <td key={m.key}>{row.fn(m)}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <SectionHeader title="Month-over-Month Growth" />
          <div className="bi-table-card mb-4">
            <table className="bi-table">
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Net Recharge Δ</th>
                  <th>Session Rev Δ</th>
                  <th>Sessions Δ</th>
                  <th>Minutes Δ</th>
                </tr>
              </thead>
              <tbody>
                {monthlySales.slice(1).map((m, i) => {
                  const prev = monthlySales[i];
                  const pct = (curr, p) => p > 0 ? `${curr >= p ? "+" : ""}${(((curr - p) / p) * 100).toFixed(1)}%` : "N/A";
                  const cls = (curr, p) => curr >= p ? "bi-cell--hot" : "bi-cell--neg";
                  return (
                    <tr key={m.key}>
                      <td className="bi-cell--label">{prev.name} → {m.name}</td>
                      <td className={cls(m.totalNetRecharge, prev.totalNetRecharge)}>{pct(m.totalNetRecharge, prev.totalNetRecharge)}</td>
                      <td className={cls(m.totalSessionRevenue, prev.totalSessionRevenue)}>{pct(m.totalSessionRevenue, prev.totalSessionRevenue)}</td>
                      <td className={cls(m.totalSessions, prev.totalSessions)}>{pct(m.totalSessions, prev.totalSessions)}</td>
                      <td className={cls(m.totalMinutes, prev.totalMinutes)}>{pct(m.totalMinutes, prev.totalMinutes)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ─── RECHARGES TAB ─── */}
      {activeTab === "recharges" && (
        <>
          {/* Daily recharge + gifts breakdown with month selector */}
          {(() => {
            const selMonth = months.find(m => m.key === rechargeMonthKey) || latest;
            const daily = selMonth?.dailyRecharges || [];
            const dailyGifts = selMonth?.dailyGifts || [];
            // Build a merged map keyed by day
            const allDays = Array.from(new Set([...daily.map(d => d.day), ...dailyGifts.map(d => d.day)])).sort();
            const rechargeMap = Object.fromEntries(daily.map(d => [d.day, d]));
            const giftMap = Object.fromEntries(dailyGifts.map(d => [d.day, d]));
            const dayLabels = daily.map(d => d.day ? d.day.slice(5) : ""); // MM-DD for chart
            return (
              <>
                <div className="bi-section-header mb-2" style={{ marginTop: "0.25rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
                  <div>
                    <h5 className="bi-section-title">Daily Recharges &amp; Gifts</h5>
                    <p className="bi-section-subtitle" style={{ marginTop: "0.2rem", paddingLeft: "1.1rem" }}>Successful payments per day — recharges and gifts</p>
                  </div>
                  <select
                    className="bi-range-select"
                    value={rechargeMonthKey || latest?.key || ""}
                    onChange={e => setRechargeMonthKey(e.target.value)}
                    style={{ alignSelf: "flex-end" }}
                  >
                    {months.map(m => <option key={m.key} value={m.key}>{m.name}</option>)}
                  </select>
                </div>

                {/* Summary pills */}
                <div className="bi-recharge-summary mb-4">
                  <div className="bi-recharge-pill bi-recharge-pill--total">
                    <span className="bi-rp-label">Total Attempts</span>
                    <span className="bi-rp-val">{(selMonth?.totalRechargeAttempts || 0).toLocaleString()}</span>
                  </div>
                  <div className="bi-recharge-pill bi-recharge-pill--success">
                    <span className="bi-rp-label">Successful</span>
                    <span className="bi-rp-val">{(selMonth?.successfulRecharges || 0).toLocaleString()}</span>
                  </div>
                  <div className="bi-recharge-pill bi-recharge-pill--failed">
                    <span className="bi-rp-label">Failed / Pending</span>
                    <span className="bi-rp-val">{((selMonth?.totalRechargeAttempts || 0) - (selMonth?.successfulRecharges || 0)).toLocaleString()}</span>
                  </div>
                  <div className="bi-recharge-pill bi-recharge-pill--rate">
                    <span className="bi-rp-label">Success Rate</span>
                    <span className="bi-rp-val">{selMonth?.rechargeSuccessRate ?? "—"}%</span>
                  </div>
                </div>

                {/* Monthly totals — Recharges */}
                <p className="bi-range-label mb-1" style={{ paddingLeft: "0.1rem", marginBottom: "0.4rem" }}>Recharges</p>
                <div className="bi-recharge-summary mb-3">
                  <div className="bi-recharge-pill bi-recharge-pill--gross">
                    <span className="bi-rp-label">Total with GST</span>
                    <span className="bi-rp-val">{fmt(selMonth?.totalGrossRecharge || 0)}</span>
                  </div>
                  <div className="bi-recharge-pill bi-recharge-pill--net">
                    <span className="bi-rp-label">Total without GST</span>
                    <span className="bi-rp-val">{fmt(selMonth?.totalNetRecharge || 0)}</span>
                  </div>
                  <div className="bi-recharge-pill bi-recharge-pill--gst">
                    <span className="bi-rp-label">GST Collected</span>
                    <span className="bi-rp-val">{fmt(selMonth?.totalGstAmount || 0)}</span>
                  </div>
                  <div className="bi-recharge-pill bi-recharge-pill--total">
                    <span className="bi-rp-label">Avg Ticket (excl. GST)</span>
                    <span className="bi-rp-val">{fmt(selMonth?.avgRechargeTicket || 0)}</span>
                  </div>
                </div>

                {/* Monthly totals — Gifts */}
                <p className="bi-range-label mb-1" style={{ paddingLeft: "0.1rem", marginBottom: "0.4rem" }}>Gifts</p>
                <div className="bi-recharge-summary mb-4">
                  <div className="bi-recharge-pill bi-recharge-pill--gross">
                    <span className="bi-rp-label">Total with GST</span>
                    <span className="bi-rp-val">{fmt(selMonth?.totalGiftGross || 0)}</span>
                  </div>
                  <div className="bi-recharge-pill bi-recharge-pill--net">
                    <span className="bi-rp-label">Total without GST</span>
                    <span className="bi-rp-val">{fmt(selMonth?.totalGiftNet || 0)}</span>
                  </div>
                  <div className="bi-recharge-pill bi-recharge-pill--gst">
                    <span className="bi-rp-label">GST Collected</span>
                    <span className="bi-rp-val">{fmt(selMonth?.totalGiftGst || 0)}</span>
                  </div>
                  <div className="bi-recharge-pill bi-recharge-pill--total">
                    <span className="bi-rp-label">Successful Gifts</span>
                    <span className="bi-rp-val">{(dailyGifts.reduce((s, d) => s + d.successful, 0)).toLocaleString()}</span>
                  </div>
                </div>

                <div className="bi-chart-grid bi-chart-grid--2 mb-4">
                  <div className="bi-chart-card">
                    <h6 className="bi-chart-title">Daily Count — Recharges &amp; Gifts — {selMonth?.name}</h6>
                    <ReactApexChart
                      options={{
                        chart: { ...DC, type: "bar" },
                        plotOptions: { bar: { borderRadius: 3, columnWidth: "65%" } },
                        colors: ["#6366f1", "#a5b4fc", "#10b981", "#6ee7b7"],
                        xaxis: { ...DARK_XAXIS(dayLabels), tickAmount: Math.min(dayLabels.length, 10) },
                        yaxis: DARK_YAXIS(v => `${v}`),
                        legend: { ...DARK_LEGEND, position: "top" },
                        dataLabels: { enabled: false },
                        grid: DARK_GRID,
                        tooltip: DARK_TOOLTIP(v => `${v}`),
                      }}
                      series={[
                        { name: "Recharges (Attempts)", data: daily.map(d => d.total) },
                        { name: "Recharges (Successful)", data: daily.map(d => d.successful) },
                        { name: "Gifts (Attempts)", data: allDays.map(day => (giftMap[day]?.total || 0)) },
                        { name: "Gifts (Successful)", data: allDays.map(day => (giftMap[day]?.successful || 0)) },
                      ]}
                      type="bar" height={240}
                    />
                  </div>
                  <div className="bi-chart-card">
                    <h6 className="bi-chart-title">Daily Amount (₹) — Recharges &amp; Gifts — {selMonth?.name}</h6>
                    <ReactApexChart
                      options={{
                        chart: { ...DC, type: "line" },
                        stroke: { curve: "smooth", width: [2, 2, 2, 2] },
                        colors: ["#6366f1", "#a5b4fc", "#10b981", "#6ee7b7"],
                        xaxis: { ...DARK_XAXIS(dayLabels), tickAmount: Math.min(dayLabels.length, 10) },
                        yaxis: DARK_YAXIS(v => `₹${v.toLocaleString()}`),
                        legend: { ...DARK_LEGEND, position: "top" },
                        dataLabels: { enabled: false },
                        grid: DARK_GRID,
                        tooltip: DARK_TOOLTIP(v => `₹${Number(v).toLocaleString("en-IN")}`),
                        markers: { size: 3 },
                      }}
                      series={[
                        { name: "Recharge with GST", data: daily.map(d => d.grossAmount) },
                        { name: "Recharge without GST", data: daily.map(d => d.netAmount) },
                        { name: "Gift with GST", data: allDays.map(day => (giftMap[day]?.grossAmount || 0)) },
                        { name: "Gift without GST", data: allDays.map(day => (giftMap[day]?.netAmount || 0)) },
                      ]}
                      type="line" height={240}
                    />
                  </div>
                </div>

                {/* Daily table — recharges + gifts merged by day */}
                <div className="bi-table-card mb-4" style={{ overflowX: "auto" }}>
                  <table className="bi-table">
                    <thead>
                      <tr>
                        <th rowSpan={2}>Date</th>
                        <th colSpan={5} style={{ textAlign: "center", borderBottom: "1px solid #e9eef5", color: "#6366f1" }}>Recharges</th>
                        <th colSpan={4} style={{ textAlign: "center", borderBottom: "1px solid #e9eef5", color: "#10b981" }}>Gifts</th>
                      </tr>
                      <tr>
                        <th>Attempts</th><th>Success</th><th>Failed</th><th>With GST</th><th>Without GST</th>
                        <th>Attempts</th><th>Success</th><th>With GST</th><th>Without GST</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allDays.map((day, i) => {
                        const r = rechargeMap[day] || { total: 0, successful: 0, grossAmount: 0, netAmount: 0 };
                        const g = giftMap[day] || { total: 0, successful: 0, grossAmount: 0, netAmount: 0 };
                        const rFailed = r.total - r.successful;
                        return (
                          <tr key={i}>
                            <td className="bi-cell--label">{day}</td>
                            <td>{r.total || "—"}</td>
                            <td className="bi-cell--hot">{r.successful || "—"}</td>
                            <td className={rFailed > 0 ? "bi-cell--neg" : "bi-cell--muted"}>{rFailed || "—"}</td>
                            <td style={{ color: "#6366f1" }}>{r.grossAmount ? fmt(r.grossAmount) : "—"}</td>
                            <td>{r.netAmount ? fmt(r.netAmount) : "—"}</td>
                            <td>{g.total || "—"}</td>
                            <td className="bi-cell--hot" style={{ color: "#059669" }}>{g.successful || "—"}</td>
                            <td style={{ color: "#10b981" }}>{g.grossAmount ? fmt(g.grossAmount) : "—"}</td>
                            <td>{g.netAmount ? fmt(g.netAmount) : "—"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td className="bi-cell--label">Total</td>
                        <td>{daily.reduce((s, d) => s + d.total, 0)}</td>
                        <td className="bi-cell--hot">{daily.reduce((s, d) => s + d.successful, 0)}</td>
                        <td>{daily.reduce((s, d) => s + (d.total - d.successful), 0) || "—"}</td>
                        <td><strong style={{ color: "#6366f1" }}>{fmt(daily.reduce((s, d) => s + d.grossAmount, 0))}</strong></td>
                        <td><strong>{fmt(daily.reduce((s, d) => s + d.netAmount, 0))}</strong></td>
                        <td>{dailyGifts.reduce((s, d) => s + d.total, 0)}</td>
                        <td className="bi-cell--hot">{dailyGifts.reduce((s, d) => s + d.successful, 0)}</td>
                        <td><strong style={{ color: "#10b981" }}>{fmt(dailyGifts.reduce((s, d) => s + d.grossAmount, 0))}</strong></td>
                        <td><strong>{fmt(dailyGifts.reduce((s, d) => s + d.netAmount, 0))}</strong></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </>
            );
          })()}

          <SectionHeader title="Revenue Quality" subtitle="Session revenue vs recharge — ratio > 100% means users are burning saved wallets" />
          <div className="bi-chart-grid mb-4">
            <div className="bi-chart-card">
              <h6 className="bi-chart-title">Session Revenue vs Net Recharge (Avg/Day)</h6>
              <ReactApexChart
                options={{
                  chart: { ...DC, type: "bar" },
                  plotOptions: { bar: { borderRadius: 6, columnWidth: "50%", groupPadding: 0.2 } },
                  colors: ["#6366f1", "#10b981"],
                  xaxis: DARK_XAXIS(names),
                  yaxis: DARK_YAXIS((v) => `₹${v.toLocaleString()}`),
                  legend: { ...DARK_LEGEND, position: "top" },
                  dataLabels: { enabled: false },
                  grid: DARK_GRID,
                }}
                series={[
                  { name: "Session Revenue/Day", data: months.map((m) => m.avgSessionRevenue) },
                  { name: "Net Recharge/Day", data: months.map((m) => m.avgDailyNetSales) },
                ]}
                type="bar"
                height={240}
              />
            </div>
            <div className="bi-chart-card">
              <h6 className="bi-chart-title">Session Rev / Recharge Ratio (%)</h6>
              <ReactApexChart
                options={{
                  chart: { ...DC, type: "line" },
                  stroke: { curve: "smooth", width: 3 },
                  colors: ["#ef4444"],
                  markers: { size: 6 },
                  annotations: { yaxis: [{ y: 100, borderColor: "#6366f1", label: { text: "Break-even (100%)", style: { color: "#6366f1" } } }] },
                  xaxis: DARK_XAXIS(names),
                  yaxis: DARK_YAXIS((v) => `${v}%`),
                  dataLabels: { enabled: true, formatter: (v) => `${v}%` },
                  grid: DARK_GRID,
                }}
                series={[{ name: "Ratio", data: months.map((m) => m.sessRechargeRatio) }]}
                type="line"
                height={240}
              />
            </div>
          </div>

          <SectionHeader title="Recharge Behaviour" subtitle="Transaction volume, unique users, and ticket size trends" />
          <div className="bi-chart-grid mb-4">
            <TrendChart
              title="Avg Recharges per Day"
              series={[{ name: "Recharges/Day", data: months.map((m) => m.rechargesPerDay) }]}
              categories={names}
              colors={["#06b6d4"]}
            />
            <TrendChart
              title="Unique Recharging Users"
              series={[{ name: "Unique Users", data: months.map((m) => m.uniqueRechargingUsers) }]}
              categories={names}
              colors={["#6366f1"]}
            />
            <TrendChart
              title="Avg Recharge Ticket Size (₹)"
              series={[{ name: "Ticket Size", data: months.map((m) => m.avgRechargeTicket) }]}
              categories={names}
              yFormatter={(v) => `₹${v}`}
              colors={["#f59e0b"]}
            />
          </div>

          <SectionHeader title="Top Recharge Plans" subtitle="Most popular recharge amounts by month" />
          <div className="bi-table-card mb-4">
            <table className="bi-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  {months.slice(1).map((m) => <th key={m.key} colSpan={2}>{m.name}</th>)}
                </tr>
                <tr>
                  <th></th>
                  {months.slice(1).map((m) => (
                    <React.Fragment key={m.key}>
                      <th>Plan</th>
                      <th>Count</th>
                    </React.Fragment>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[0, 1, 2, 3, 4].map((rank) => (
                  <tr key={rank}>
                    <td>#{rank + 1}</td>
                    {months.slice(1).map((m) => {
                      const plan = m.topPlans?.[rank];
                      return (
                        <React.Fragment key={m.key}>
                          <td>{plan ? `₹${plan.amount}` : "—"}</td>
                          <td>{plan ? plan.count : "—"}</td>
                        </React.Fragment>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ─── INDIVIDUALS TAB ─── */}
      {activeTab === "individuals" && (
        <>
          {/* Top Users */}
          <SectionHeader title="Top Users by Spend" subtitle="Feb 10 – present · Highest wallet spend on sessions" />
          <div className="bi-table-card mb-4">
            <table className="bi-table">
              <thead>
                <tr><th>#</th><th>User</th><th>Total Spent</th><th>Sessions</th><th>Total Min</th><th>Avg Min/Sess</th><th>Strategy</th></tr>
              </thead>
              <tbody>
                {(individuals.topUsers || []).map((u, i) => (
                  <tr key={i}>
                    <td><span className="bi-rank">{i + 1}</span></td>
                    <td className="bi-cell--label">{u.name}</td>
                    <td className="bi-cell--hot">{fmt(u.totalSpent)}</td>
                    <td>{u.sessionCount}</td>
                    <td>{Number(Math.round(u.totalMins)).toLocaleString()} min</td>
                    <td>{u.avgMinsPerSession} min</td>
                    <td className="bi-cell--strategy">
                      {u.avgMinsPerSession >= 10
                        ? "Deep engager — offer loyalty reward or priority listener access"
                        : u.sessionCount >= 30
                        ? "High frequency — offer bundle recharge plan for savings"
                        : "Good user — nurture with personalized listener recommendations"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Low Engagement Users */}
          <SectionHeader title="At-Risk Users" subtitle="Recharged recently but barely using the platform (< 5 sessions) — churn risk" />
          <div className="bi-table-card mb-4">
            <table className="bi-table">
              <thead>
                <tr><th>User</th><th>Total Recharged</th><th>Sessions</th><th>Status</th><th>Suggested Action</th></tr>
              </thead>
              <tbody>
                {(individuals.lowEngagementUsers || []).map((u, i) => (
                  <tr key={i}>
                    <td className="bi-cell--label">{u.name}</td>
                    <td>{fmt(u.totalRecharged)}</td>
                    <td className="bi-cell--neg">{u.sessionCount}</td>
                    <td><InsightBadge text="At Risk" type="danger" /></td>
                    <td className="bi-cell--strategy">
                      {u.totalRecharged >= 500
                        ? "High value churner — send personal outreach, offer free session credit"
                        : u.sessionCount === 0
                        ? "Never tried — send onboarding nudge with listener recommendation"
                        : "Low usage — push notification to book a session, highlight new listeners"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Top Listeners */}
          <SectionHeader title="Top Performing Listeners" subtitle="Feb 10 – present · Ranked by total earnings" />
          <div className="bi-table-card mb-4">
            <table className="bi-table">
              <thead>
                <tr><th>#</th><th>Listener</th><th>Total Earned</th><th>Sessions</th><th>Total Min</th><th>Avg Min/Sess</th><th>Strategy</th></tr>
              </thead>
              <tbody>
                {(individuals.topListeners || []).map((l, i) => (
                  <tr key={i}>
                    <td><span className="bi-rank bi-rank--green">{i + 1}</span></td>
                    <td className="bi-cell--label">{l.name}</td>
                    <td className="bi-cell--hot">{fmt(l.totalEarned)}</td>
                    <td>{l.sessionCount}</td>
                    <td>{Number(Math.round(l.totalMins)).toLocaleString()} min</td>
                    <td>{l.avgMinsPerSession} min</td>
                    <td className="bi-cell--strategy">
                      {l.avgMinsPerSession >= 10
                        ? "Star listener — feature in app, give priority placement"
                        : l.sessionCount >= 50
                        ? "Volume leader — reward with bonus tier, encourage longer sessions"
                        : "Rising performer — give profile boost to increase visibility"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Listener Active Hours */}
          <SectionHeader
            title="Listener Active Hours"
            subtitle={`Total session minutes per listener for selected range (${MONTH_NAMES_FULL[parseYYYYMM(appliedRange.from).mon - 1]} ${parseYYYYMM(appliedRange.from).year} → ${MONTH_NAMES_FULL[parseYYYYMM(appliedRange.to).mon - 1]} ${parseYYYYMM(appliedRange.to).year})`}
          />
          {listenerHours.length > 0 ? (
            <>
              <div className="bi-chart-card mb-4">
                <h6 className="bi-chart-title">Active Hours per Listener</h6>
                <ReactApexChart
                  options={{
                    chart: { ...DC, type: "bar" },
                    plotOptions: { bar: { borderRadius: 4, horizontal: true, barHeight: "65%" } },
                    colors: ["#6366f1"],
                    dataLabels: { enabled: true, formatter: v => `${v}h`, style: { fontSize: "11px", colors: ["#1e293b"] } },
                    xaxis: { ...DARK_XAXIS(listenerHours.map(l => l.name)), labels: { formatter: v => `${v}h` } },
                    yaxis: { labels: { style: { colors: "#94a3b8", fontSize: "11px" } } },
                    grid: DARK_GRID,
                    tooltip: { theme: "light", y: { formatter: v => `${v} hrs` } },
                  }}
                  series={[{ name: "Active Hours", data: listenerHours.map(l => l.totalHours) }]}
                  type="bar"
                  height={Math.max(240, listenerHours.length * 32)}
                />
              </div>
              <div className="bi-table-card mb-4" style={{ overflowX: "auto" }}>
                <table className="bi-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Listener</th>
                      <th>Total Hours</th>
                      <th>Total Minutes</th>
                      <th>Sessions</th>
                      <th>Avg min/Session</th>
                      <th>Call Min</th>
                      <th>Video Min</th>
                      <th>Chat Min</th>
                      <th>Total Earned</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listenerHours.map((l, i) => (
                      <tr key={i}>
                        <td><span className="bi-rank bi-rank--green">{i + 1}</span></td>
                        <td className="bi-cell--label">{l.name}</td>
                        <td className="bi-cell--hot" style={{ fontWeight: 600 }}>{l.totalHours} hrs</td>
                        <td>{l.totalMins.toLocaleString("en-IN")} min</td>
                        <td>{l.sessionCount}</td>
                        <td>{l.avgMinsPerSession} min</td>
                        <td style={{ color: "#6366f1" }}>{l.callMins ? `${l.callMins} min` : "—"}</td>
                        <td style={{ color: "#10b981" }}>{l.videoMins ? `${l.videoMins} min` : "—"}</td>
                        <td style={{ color: "#f59e0b" }}>{l.chatMins ? `${l.chatMins} min` : "—"}</td>
                        <td>{fmt(l.totalEarned)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={2} className="bi-cell--label">Total</td>
                      <td className="bi-cell--hot"><strong>{(listenerHours.reduce((s,l)=>s+l.totalHours,0)).toFixed(2)} hrs</strong></td>
                      <td><strong>{listenerHours.reduce((s,l)=>s+l.totalMins,0).toLocaleString("en-IN")} min</strong></td>
                      <td><strong>{listenerHours.reduce((s,l)=>s+l.sessionCount,0)}</strong></td>
                      <td>—</td>
                      <td style={{ color: "#6366f1" }}>{listenerHours.reduce((s,l)=>s+l.callMins,0)} min</td>
                      <td style={{ color: "#10b981" }}>{listenerHours.reduce((s,l)=>s+l.videoMins,0)} min</td>
                      <td style={{ color: "#f59e0b" }}>{listenerHours.reduce((s,l)=>s+l.chatMins,0)} min</td>
                      <td><strong>{fmt(listenerHours.reduce((s,l)=>s+l.totalEarned,0))}</strong></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
          ) : (
            <div className="bi-table-card mb-4" style={{ padding: "1.5rem", color: "#94a3b8", textAlign: "center" }}>No listener session data for this range.</div>
          )}

          {/* ── PAYROLL TRACKER ── */}
          {(() => {
            // Filter listenerDailyHours to the selected payroll range
            const filtered = listenerDailyHours.filter(r => r.day >= payrollFrom && r.day <= payrollTo);

            // Build sorted date list for columns
            const dateSet = new Set(filtered.map(r => r.day));
            const dates = Array.from(dateSet).sort();

            // Build pivot: { listenerName -> { day -> {totalHours, totalMins, sessionCount} } }
            const pivot = {};
            filtered.forEach(r => {
              if (!pivot[r.name]) pivot[r.name] = {};
              pivot[r.name][r.day] = { h: r.totalHours, m: r.totalMins, s: r.sessionCount };
            });

            // Sort listeners by total hours descending
            const listenerNames = Object.keys(pivot).sort((a, b) => {
              const sumA = Object.values(pivot[a]).reduce((s, v) => s + v.h, 0);
              const sumB = Object.values(pivot[b]).reduce((s, v) => s + v.h, 0);
              return sumB - sumA;
            });

            // Build deduction summary per listener
            const deductionRows = listenerNames.map(name => {
              const days = pivot[name];
              let workingDays = 0, underDays = 0, totalHours = 0;
              dates.forEach(d => {
                if (days[d] && days[d].h > 0) {
                  workingDays++;
                  totalHours += days[d].h;
                  if (days[d].h < minWorkHours) underDays++;
                }
              });
              return { name, workingDays, underDays, absentDays: dates.length - workingDays, totalHours: parseFloat(totalHours.toFixed(2)) };
            });

            const cellColor = (hrs) => {
              if (!hrs || hrs === 0) return { bg: "#f8fafc", color: "#cbd5e1" };
              if (hrs < minWorkHours) return { bg: "#fff1f2", color: "#e11d48" };
              if (hrs < minWorkHours + 1) return { bg: "#fffbeb", color: "#d97706" };
              return { bg: "#f0fdf4", color: "#15803d" };
            };

            return (
              <>
                {/* Header + controls */}
                <div className="bi-section-header mb-2" style={{ marginTop: "2rem", display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
                  <div>
                    <h5 className="bi-section-title">Payroll Tracker — Daily Listener Hours</h5>
                    <p className="bi-section-subtitle" style={{ marginTop: "0.2rem", paddingLeft: "1.1rem" }}>
                      25→25 salary cycle · Days under {minWorkHours}h threshold are flagged for deduction
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                      <span style={{ fontSize: "10px", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase" }}>Cycle From</span>
                      <input type="date" value={payrollFrom} onChange={e => setPayrollFrom(e.target.value)}
                        style={{ border: "1px solid #e2e8f0", borderRadius: "6px", padding: "4px 8px", fontSize: "12px", color: "#334155", background: "#fff" }} />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                      <span style={{ fontSize: "10px", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase" }}>Cycle To</span>
                      <input type="date" value={payrollTo} onChange={e => setPayrollTo(e.target.value)}
                        style={{ border: "1px solid #e2e8f0", borderRadius: "6px", padding: "4px 8px", fontSize: "12px", color: "#334155", background: "#fff" }} />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                      <span style={{ fontSize: "10px", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase" }}>Min Hours/Day</span>
                      <input type="number" min={1} max={12} value={minWorkHours} onChange={e => setMinWorkHours(Number(e.target.value))}
                        style={{ border: "1px solid #e2e8f0", borderRadius: "6px", padding: "4px 8px", fontSize: "12px", color: "#334155", background: "#fff", width: "64px" }} />
                    </div>
                  </div>
                </div>

                {/* Legend */}
                <div style={{ display: "flex", gap: "1rem", marginBottom: "0.75rem", fontSize: "11px", flexWrap: "wrap" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><span style={{ display: "inline-block", width: 12, height: 12, borderRadius: 3, background: "#f0fdf4", border: "1px solid #15803d" }}></span><span style={{ color: "#15803d" }}>≥ {minWorkHours}h (good)</span></span>
                  <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><span style={{ display: "inline-block", width: 12, height: 12, borderRadius: 3, background: "#fffbeb", border: "1px solid #d97706" }}></span><span style={{ color: "#d97706" }}>{minWorkHours}–{minWorkHours + 1}h (borderline)</span></span>
                  <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><span style={{ display: "inline-block", width: 12, height: 12, borderRadius: 3, background: "#fff1f2", border: "1px solid #e11d48" }}></span><span style={{ color: "#e11d48" }}>&lt; {minWorkHours}h (deductible)</span></span>
                  <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><span style={{ display: "inline-block", width: 12, height: 12, borderRadius: 3, background: "#f8fafc", border: "1px solid #cbd5e1" }}></span><span style={{ color: "#94a3b8" }}>Absent</span></span>
                </div>

                {filtered.length === 0 ? (
                  <div className="bi-table-card mb-4" style={{ padding: "1.5rem", color: "#94a3b8", textAlign: "center" }}>
                    No session data for this payroll range. Make sure the main date range above covers this period.
                  </div>
                ) : (
                  <>
                    {/* Pivot heatmap table */}
                    <div className="bi-table-card mb-4" style={{ overflowX: "auto", maxHeight: "520px", overflowY: "auto" }}>
                      <table style={{ borderCollapse: "collapse", fontSize: "11px", minWidth: "max-content", width: "100%" }}>
                        <thead style={{ position: "sticky", top: 0, zIndex: 2, background: "#f8fafc" }}>
                          <tr>
                            <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 700, color: "#475569", borderBottom: "2px solid #e2e8f0", position: "sticky", left: 0, background: "#f8fafc", zIndex: 3, minWidth: "130px" }}>Listener</th>
                            {dates.map(d => (
                              <th key={d} style={{ padding: "6px 4px", textAlign: "center", fontWeight: 600, color: "#94a3b8", borderBottom: "2px solid #e2e8f0", minWidth: "46px" }}>
                                <div>{d.slice(8)}</div>
                                <div style={{ fontSize: "9px", color: "#cbd5e1" }}>{["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][new Date(d).getDay()]}</div>
                              </th>
                            ))}
                            <th style={{ padding: "8px 8px", textAlign: "center", fontWeight: 700, color: "#475569", borderBottom: "2px solid #e2e8f0", minWidth: "70px", position: "sticky", right: 0, background: "#f8fafc", zIndex: 3 }}>Total Hrs</th>
                          </tr>
                        </thead>
                        <tbody>
                          {listenerNames.map((name, ri) => {
                            const days = pivot[name];
                            const totalH = Object.values(days).reduce((s, v) => s + v.h, 0);
                            return (
                              <tr key={name} style={{ background: ri % 2 === 0 ? "#fff" : "#fafafa" }}>
                                <td style={{ padding: "5px 12px", fontWeight: 600, color: "#334155", borderBottom: "1px solid #f1f5f9", position: "sticky", left: 0, background: ri % 2 === 0 ? "#fff" : "#fafafa", zIndex: 1 }}>
                                  {name}
                                </td>
                                {dates.map(d => {
                                  const cell = days[d];
                                  const hrs = cell ? cell.h : 0;
                                  const c = cellColor(hrs);
                                  return (
                                    <td key={d} title={cell ? `${cell.h}h (${cell.m} min, ${cell.s} sessions)` : "Absent"}
                                      style={{ padding: "4px 3px", textAlign: "center", borderBottom: "1px solid #f1f5f9", background: c.bg }}>
                                      {hrs > 0 ? (
                                        <span style={{ display: "inline-block", color: c.color, fontWeight: 700, fontSize: "10px", padding: "2px 4px", borderRadius: "4px" }}>
                                          {hrs >= 10 ? hrs.toFixed(1) : hrs.toFixed(1)}h
                                        </span>
                                      ) : (
                                        <span style={{ color: "#e2e8f0", fontSize: "10px" }}>—</span>
                                      )}
                                    </td>
                                  );
                                })}
                                <td style={{ padding: "5px 8px", textAlign: "center", fontWeight: 700, color: totalH >= (minWorkHours * dates.filter(d => pivot[name][d] && pivot[name][d].h > 0).length * 0.7) ? "#15803d" : "#e11d48", borderBottom: "1px solid #f1f5f9", position: "sticky", right: 0, background: ri % 2 === 0 ? "#fff" : "#fafafa" }}>
                                  {totalH.toFixed(1)}h
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Deduction Summary table */}
                    <SectionHeader title="Deduction Summary" subtitle={`Listeners with days below ${minWorkHours}h threshold in ${payrollFrom} → ${payrollTo}`} />
                    <div className="bi-table-card mb-4" style={{ overflowX: "auto" }}>
                      <table className="bi-table">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Listener</th>
                            <th>Working Days</th>
                            <th>Absent Days</th>
                            <th style={{ color: "#e11d48" }}>Days &lt; {minWorkHours}h</th>
                            <th>Total Hours</th>
                            <th>Avg Hrs/Day</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {deductionRows.filter(r => r.underDays > 0 || r.absentDays > 0).sort((a, b) => b.underDays - a.underDays).map((r, i) => (
                            <tr key={i}>
                              <td><span className="bi-rank bi-rank--green">{i + 1}</span></td>
                              <td className="bi-cell--label">{r.name}</td>
                              <td>{r.workingDays}</td>
                              <td style={{ color: r.absentDays > 3 ? "#e11d48" : "#94a3b8" }}>{r.absentDays}</td>
                              <td>
                                <span style={{ background: r.underDays > 0 ? "#fff1f2" : "#f0fdf4", color: r.underDays > 0 ? "#e11d48" : "#15803d", padding: "2px 8px", borderRadius: "12px", fontWeight: 700, fontSize: "11px" }}>
                                  {r.underDays} days
                                </span>
                              </td>
                              <td style={{ fontWeight: 600 }}>{r.totalHours} hrs</td>
                              <td>{r.workingDays > 0 ? (r.totalHours / r.workingDays).toFixed(1) : "—"} hrs</td>
                              <td>
                                {r.underDays === 0 && r.absentDays === 0
                                  ? <span style={{ color: "#15803d", fontWeight: 600 }}>✓ Full month</span>
                                  : r.underDays > 5 || r.absentDays > 5
                                  ? <span style={{ color: "#e11d48", fontWeight: 600 }}>⚠ Deduct salary</span>
                                  : <span style={{ color: "#d97706", fontWeight: 600 }}>⚡ Review</span>}
                              </td>
                            </tr>
                          ))}
                          {deductionRows.filter(r => r.underDays > 0 || r.absentDays > 0).length === 0 && (
                            <tr><td colSpan={8} style={{ textAlign: "center", color: "#15803d", padding: "1rem", fontWeight: 600 }}>✓ All listeners met the {minWorkHours}h/day target this cycle</td></tr>
                          )}
                        </tbody>
                        <tfoot>
                          <tr>
                            <td colSpan={2} className="bi-cell--label"><strong>Totals ({listenerNames.length} listeners)</strong></td>
                            <td>—</td>
                            <td>—</td>
                            <td className="bi-cell--neg"><strong>{deductionRows.reduce((s, r) => s + r.underDays, 0)} total low days</strong></td>
                            <td><strong>{deductionRows.reduce((s, r) => s + r.totalHours, 0).toFixed(1)} hrs</strong></td>
                            <td>—</td>
                            <td>—</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </>
                )}
              </>
            );
          })()}

          {/* High Rejection Listeners */}
          <SectionHeader title="Under-Performing Listeners" subtitle="High rejection rate — hurting user experience and platform revenue" />
          <div className="bi-table-card mb-4">
            <table className="bi-table">
              <thead>
                <tr><th>Listener</th><th>Rejections</th><th>Accepted</th><th>Rejection Rate</th><th>Status</th><th>Action</th></tr>
              </thead>
              <tbody>
                {(individuals.highRejectionListeners || []).map((l, i) => (
                  <tr key={i}>
                    <td className="bi-cell--label">{l.name}</td>
                    <td className="bi-cell--neg">{l.rejections}</td>
                    <td>{l.accepted}</td>
                    <td>
                      <span className={`bi-badge ${l.rejRate >= 70 ? "bi-badge--danger" : l.rejRate >= 40 ? "bi-badge--warning" : "bi-badge--info"}`}>
                        {l.rejRate}%
                      </span>
                    </td>
                    <td>
                      {l.rejRate >= 70
                        ? <InsightBadge text="Critical" type="danger" />
                        : l.rejRate >= 40
                        ? <InsightBadge text="Warning" type="warning" />
                        : <InsightBadge text="Monitor" type="info" />}
                    </td>
                    <td className="bi-cell--strategy">
                      {l.rejRate >= 70
                        ? "Put on notice — auto-deprioritize in matching if rate stays high"
                        : l.rejRate >= 40
                        ? "Send warning message — track for 1 week and review"
                        : "Monitor — check if rejections are system (busy) or manual"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ─── CALL ATTEMPTS TAB ─── */}
      {activeTab === "attempts" && (
        <>
          <SectionHeader title="Call Attempt Volume" subtitle="Total attempts (completed + rejected) per month" />
          <div className="bi-chart-grid mb-4">
            <div className="bi-chart-card">
              <h6 className="bi-chart-title">Total Attempts vs Completed vs Rejected</h6>
              <ReactApexChart
                options={{
                  chart: { ...DC, type: "bar" },
                  plotOptions: { bar: { borderRadius: 4, columnWidth: "55%" } },
                  colors: ["#6366f1", "#10b981", "#ef4444"],
                  xaxis: DARK_XAXIS(callAttempts.map(m => m.name)),
                  yaxis: DARK_YAXIS((v) => `${v}`),
                  legend: { ...DARK_LEGEND, position: "top" },
                  dataLabels: { enabled: false },
                  grid: DARK_GRID,
                }}
                series={[
                  { name: "Total Attempts", data: callAttempts.map(m => m.totalAttempts) },
                  { name: "Completed", data: callAttempts.map(m => m.totalCompleted) },
                  { name: "Rejected", data: callAttempts.map(m => m.totalRejected) },
                ]}
                type="bar" height={260}
              />
            </div>
            <div className="bi-chart-card">
              <h6 className="bi-chart-title">Success Rate % by Month</h6>
              <ReactApexChart
                options={{
                  chart: { ...DC, type: "line" },
                  stroke: { curve: "smooth", width: 3 },
                  colors: ["#10b981"],
                  markers: { size: 6 },
                  dataLabels: { enabled: true, formatter: v => `${v}%` },
                  xaxis: DARK_XAXIS(callAttempts.map(m => m.name)),
                  yaxis: { min: 0, max: 100, ...DARK_YAXIS((v) => `${v}%`) },
                  grid: DARK_GRID,
                  annotations: { yaxis: [{ y: 50, borderColor: "#f59e0b", label: { text: "50% baseline", style: { color: "#f59e0b" } } }] },
                }}
                series={[{ name: "Success Rate", data: callAttempts.map(m => m.successRate) }]}
                type="line" height={260}
              />
            </div>
          </div>

          <SectionHeader title="Daily Averages" />
          <div className="bi-table-card mb-4">
            <table className="bi-table">
              <thead>
                <tr><th>Metric</th>{callAttempts.map(m => <th key={m.key}>{m.name}</th>)}</tr>
              </thead>
              <tbody>
                {[
                  { label: "Avg Daily Attempts", fn: m => m.avgDailyAttempts },
                  { label: "Avg Daily Completed", fn: m => (m.totalCompleted / m.days).toFixed(1) },
                  { label: "Avg Daily Rejections", fn: m => m.avgDailyRejections },
                  { label: "Success Rate", fn: m => `${m.successRate}%` },
                  { label: "Rejection Rate", fn: m => `${(100 - m.successRate).toFixed(1)}%` },
                ].map(row => (
                  <tr key={row.label}>
                    <td className="bi-cell--label">{row.label}</td>
                    {callAttempts.map(m => <td key={m.key}>{row.fn(m)}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <SectionHeader title="Rejection Breakdown" subtitle="Why calls fail — for the most recent months" />
          <div className="bi-chart-grid bi-chart-grid--2 mb-4">
            {callAttempts.slice(1).map(m => {
              const reasons = m.rejByReason || [];
              if (!reasons.length) return null;
              return (
                <div key={m.key} className="bi-chart-card">
                  <h6 className="bi-chart-title">{m.name} — Rejection Reasons</h6>
                  <ReactApexChart
                    options={{
                      chart: { type: "donut", fontFamily: "inherit" },
                      labels: reasons.map(r => r.reason),
                      colors: ["#ef4444","#f59e0b","#6366f1","#06b6d4","#10b981","#ec4899"],
                      legend: { ...DARK_LEGEND, position: "bottom" },
                      dataLabels: { formatter: (v) => `${v.toFixed(0)}%` },
                      plotOptions: { pie: { donut: { size: "55%" } } },
                    }}
                    series={reasons.map(r => r.count)}
                    type="donut" height={220}
                  />
                </div>
              );
            })}
          </div>

          <SectionHeader title="Rejections by Type & Who Rejected" subtitle="Latest month breakdown" />
          <div className="bi-chart-grid mb-4">
            {callAttempts.slice(-1).map(m => (
              <React.Fragment key={m.key}>
                <div className="bi-chart-card">
                  <h6 className="bi-chart-title">{m.name} — Rejection by Session Type</h6>
                  <ReactApexChart
                    options={{
                      chart: { ...DC, type: "bar" },
                      plotOptions: { bar: { borderRadius: 6, horizontal: true } },
                      colors: ["#6366f1"],
                      dataLabels: { enabled: true },
                      xaxis: DARK_XAXIS((m.rejByType || []).map(r => r.type)),
                      grid: DARK_GRID,
                    }}
                    series={[{ name: "Rejections", data: (m.rejByType || []).map(r => r.count) }]}
                    type="bar" height={200}
                  />
                </div>
                <div className="bi-chart-card">
                  <h6 className="bi-chart-title">{m.name} — Who Rejected</h6>
                  <ReactApexChart
                    options={{
                      chart: { type: "donut", fontFamily: "inherit" },
                      labels: (m.rejByWho || []).map(r => r.who),
                      colors: ["#ef4444","#f59e0b","#6366f1","#10b981"],
                      legend: { ...DARK_LEGEND, position: "bottom" },
                      dataLabels: { formatter: v => `${v.toFixed(0)}%` },
                      plotOptions: { pie: { donut: { size: "55%" } } },
                    }}
                    series={(m.rejByWho || []).map(r => r.count)}
                    type="donut" height={200}
                  />
                </div>
              </React.Fragment>
            ))}
          </div>
        </>
      )}

      {/* ─── DEEP INSIGHTS TAB ─── */}
      {activeTab === "deep" && (
        <>
          <SectionHeader title="Full Monthly Summary Table" subtitle="All key metrics side-by-side" />
          <div className="bi-table-card mb-4" style={{ overflowX: "auto" }}>
            <table className="bi-table">
              <thead>
                <tr>
                  <th>Metric</th>
                  {months.map((m) => <th key={m.key}>{m.name}</th>)}
                </tr>
              </thead>
              <tbody>
                {[
                  { label: "Days tracked", fn: (m) => m.days },
                  { label: "Avg Daily Net Sales", fn: (m) => fmt(m.avgDailyNetSales) },
                  { label: "Avg Daily Gross Sales", fn: (m) => fmt(m.avgDailyGrossSales) },
                  { label: "Total Net Recharge", fn: (m) => fmt(m.totalNetRecharge) },
                  { label: "Avg Daily Sessions", fn: (m) => m.avgDailySessions },
                  { label: "Total Sessions", fn: (m) => m.totalSessions.toLocaleString() },
                  { label: "Avg Daily Minutes", fn: (m) => `${m.avgDailyMinutes} min` },
                  { label: "Avg Min / Session", fn: (m) => `${m.avgMinPerSession} min` },
                  { label: "Avg Session Rev/Day", fn: (m) => fmt(m.avgSessionRevenue) },
                  { label: "Sess Rev / Recharge %", fn: (m) => `${m.sessRechargeRatio}%` },
                  { label: "Recharges/Day", fn: (m) => m.rechargesPerDay },
                  { label: "Unique Recharging Users", fn: (m) => m.uniqueRechargingUsers },
                  { label: "Avg Ticket Size", fn: (m) => fmt(m.avgRechargeTicket) },
                  { label: "Unique Active Users", fn: (m) => m.uniqueActiveUsers },
                  { label: "Sessions / User", fn: (m) => m.sessionsPerUser },
                  { label: "1-min Sessions %", fn: (m) => `${m.durationBuckets?.["1min"]}%` },
                  { label: "15+ min Sessions %", fn: (m) => `${m.durationBuckets?.["15plus"]}%` },
                  { label: "Night sessions %", fn: (m) => `${m.peakHours?.night}%` },
                  { label: "Morning sessions %", fn: (m) => `${m.peakHours?.morning}%` },
                ].map((row) => (
                  <tr key={row.label}>
                    <td className="bi-cell--label">{row.label}</td>
                    {months.map((m) => <td key={m.key}>{row.fn(m)}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <SectionHeader title="Root Cause Analysis" subtitle="Why metrics changed — and what to do" />
          <div className="bi-analysis-grid mb-4">
            {[
              {
                title: "Jan Sales Spike (+36%)",
                color: "#10b981",
                points: [
                  "Sessions jumped from 220/day → 376/day",
                  "All session types grew simultaneously",
                  "Unique active users rose from 118 → 153",
                  "Likely: marketing push or word-of-mouth",
                ],
                action: "Identify what drove this and repeat it. Referral programs or campaigns.",
              },
              {
                title: "Feb Sales Peak (₹17,445/day)",
                color: "#6366f1",
                points: [
                  "Video sessions at 137/day (highest alongside Jan)",
                  "Chat at 89/day — all-time high",
                  "Unique users hit 169 (2nd highest ever)",
                  "High recharge ticket of ₹392",
                ],
                action: "This is the benchmark. Target ₹17,000+ daily as the floor.",
              },
              {
                title: "March Sales Dip (-25%)",
                color: "#ef4444",
                points: [
                  "Session revenue was highest ever (₹21,969/day)",
                  "But recharges dropped to ₹13,097/day",
                  "Sess/Recharge ratio hit 168% — wallet burndown",
                  "Ticket size dropped to ₹344",
                ],
                action: "Add low-balance push notifications. Prompt recharge after every session.",
              },
              {
                title: "April Recovery (+21% vs Mar)",
                color: "#f59e0b",
                points: [
                  "Sales recovering to ₹15,855/day",
                  "But sessions/user collapsed to 25.8 (was 76 in Jan)",
                  "₹118 plan is now #1 — smallest commitment",
                  "Only 110 unique recharging users",
                ],
                action: "Re-engage lapsed users. Offer session credits for returning users.",
              },
              {
                title: "1-Min Session Crisis",
                color: "#ef4444",
                points: [
                  "44% of all sessions are just 1 minute",
                  "Was 35% in Dec — getting worse as volume grows",
                  "Users pay but get no value — drives churn",
                  "Reversal bug may still be partially active",
                ],
                action: "Auto-refund sub-2-min sessions. Verify reversal logic is fully fixed.",
              },
              {
                title: "Morning Slot Opportunity",
                color: "#06b6d4",
                points: [
                  "Morning (6am–12pm) = only 7–9% of sessions",
                  "Night slot = 40% consistently",
                  "Morning users are likely professionals",
                  "Listeners not online during morning hours",
                ],
                action: "Incentivize listeners to be online 6am–12pm. Morning-only promotions.",
              },
            ].map((item, i) => (
              <div key={i} className="bi-analysis-card" style={{ borderTop: `3px solid ${item.color}` }}>
                <h6 className="bi-analysis-title" style={{ color: item.color }}>{item.title}</h6>
                <ul className="bi-analysis-points">
                  {item.points.map((p, j) => <li key={j}>{p}</li>)}
                </ul>
                <div className="bi-analysis-action">
                  <span className="bi-action-label">Action:</span> {item.action}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
