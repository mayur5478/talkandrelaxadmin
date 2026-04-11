import React, { useState } from "react";
import ReactApexChart from "react-apexcharts";
import { useMonthlyInsightsQuery } from "../../services/auth";
import "./business-insights.scss";

const MONTH_COLORS = ["#6366f1", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"];

const fmt = (n) => `₹${Number(n).toLocaleString("en-IN")}`;

function TrendChart({ title, series, categories, colors, yFormatter }) {
  const options = {
    chart: { type: "bar", toolbar: { show: false }, fontFamily: "inherit" },
    plotOptions: { bar: { borderRadius: 6, columnWidth: "55%" } },
    colors: colors || MONTH_COLORS,
    dataLabels: { enabled: false },
    xaxis: { categories, labels: { style: { fontSize: "12px" } } },
    yaxis: { labels: { formatter: yFormatter || ((v) => v) } },
    grid: { borderColor: "#f1f5f9" },
    tooltip: { y: { formatter: yFormatter || ((v) => v) } },
  };
  return (
    <div className="bi-chart-card">
      <h6 className="bi-chart-title">{title}</h6>
      <ReactApexChart options={options} series={series} type="bar" height={220} />
    </div>
  );
}

function LineChart({ title, series, categories, yFormatter }) {
  const options = {
    chart: { type: "line", toolbar: { show: false }, fontFamily: "inherit" },
    stroke: { curve: "smooth", width: 3 },
    colors: ["#6366f1", "#10b981", "#f59e0b"],
    markers: { size: 5 },
    dataLabels: { enabled: false },
    xaxis: { categories, labels: { style: { fontSize: "12px" } } },
    yaxis: { labels: { formatter: yFormatter || ((v) => v) } },
    grid: { borderColor: "#f1f5f9" },
    legend: { position: "top" },
    tooltip: { y: { formatter: yFormatter || ((v) => v) } },
  };
  return (
    <div className="bi-chart-card">
      <h6 className="bi-chart-title">{title}</h6>
      <ReactApexChart options={options} series={series} type="line" height={220} />
    </div>
  );
}

function DonutChart({ title, labels, values, colors }) {
  const options = {
    chart: { type: "donut", fontFamily: "inherit" },
    labels,
    colors: colors || ["#6366f1", "#06b6d4", "#10b981", "#f59e0b"],
    legend: { position: "bottom", fontSize: "12px" },
    dataLabels: { formatter: (val) => `${val.toFixed(1)}%` },
    plotOptions: { pie: { donut: { size: "60%" } } },
  };
  return (
    <div className="bi-chart-card">
      <h6 className="bi-chart-title">{title}</h6>
      <ReactApexChart options={options} series={values} type="donut" height={220} />
    </div>
  );
}

function StatCard({ label, value, sub, color }) {
  return (
    <div className="bi-stat-card" style={{ borderLeft: `4px solid ${color || "#6366f1"}` }}>
      <div className="bi-stat-label">{label}</div>
      <div className="bi-stat-value">{value}</div>
      {sub && <div className="bi-stat-sub">{sub}</div>}
    </div>
  );
}

function InsightBadge({ text, type }) {
  return <span className={`bi-badge bi-badge--${type}`}>{text}</span>;
}

function SectionHeader({ title, subtitle }) {
  return (
    <div className="bi-section-header">
      <h5 className="bi-section-title">{title}</h5>
      {subtitle && <p className="bi-section-subtitle">{subtitle}</p>}
    </div>
  );
}

export default function BusinessInsights() {
  const { data, isLoading, error } = useMonthlyInsightsQuery();
  const [activeTab, setActiveTab] = useState("overview");
  const individuals = data?.individuals || {};
  const callAttempts = data?.callAttempts || [];
  const monthlySales = data?.monthlySales || [];

  if (isLoading) return <div className="bi-loading">Loading insights...</div>;
  if (error) return <div className="bi-error">Failed to load data. Please try again.</div>;

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
    chart: { type: "bar", stacked: true, toolbar: { show: false }, fontFamily: "inherit" },
    plotOptions: { bar: { borderRadius: 4, columnWidth: "55%" } },
    colors: ["#6366f1", "#10b981", "#f59e0b"],
    xaxis: { categories: names, labels: { style: { fontSize: "12px" } } },
    yaxis: { labels: { formatter: (v) => `${v}/d` } },
    legend: { position: "top" },
    dataLabels: { enabled: false },
    grid: { borderColor: "#f1f5f9" },
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
    <div className="bi-wrapper px-4 py-4">
      {/* Header */}
      <div className="bi-header mb-4">
        <h4 className="bi-main-title">Business Insights</h4>
        <p className="bi-main-subtitle">Monthly trend analysis · Dec 2025 – Apr 2026</p>
      </div>

      {/* KPI Strip */}
      <div className="bi-kpi-strip mb-4">
        <StatCard
          label={`${latest.name} Avg Daily Sales`}
          value={fmt(latest.avgDailyNetSales)}
          sub={salesChange !== null ? `${salesChange > 0 ? "+" : ""}${salesChange}% vs ${prev.name}` : ""}
          color={salesChange > 0 ? "#10b981" : "#ef4444"}
        />
        <StatCard
          label={`${latest.name} Avg Daily Sessions`}
          value={`${latest.avgDailySessions}/day`}
          sub={sessChange !== null ? `${sessChange > 0 ? "+" : ""}${sessChange}% vs ${prev.name}` : ""}
          color={sessChange > 0 ? "#10b981" : "#ef4444"}
        />
        <StatCard
          label={`${latest.name} Avg Daily Minutes`}
          value={`${latest.avgDailyMinutes} min`}
          sub={minsChange !== null ? `${minsChange > 0 ? "+" : ""}${minsChange}% vs ${prev.name}` : ""}
          color={minsChange > 0 ? "#10b981" : "#f59e0b"}
        />
        <StatCard
          label={`${latest.name} Avg Min/Session`}
          value={`${latest.avgMinPerSession} min`}
          sub={`${latest.uniqueActiveUsers} active users`}
          color="#6366f1"
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
                chart: { type: "line", toolbar: { show: false }, fontFamily: "inherit" },
                stroke: { curve: "smooth", width: [3, 3, 3] },
                colors: ["#6366f1", "#10b981", "#f59e0b"],
                markers: { size: 6 },
                dataLabels: { enabled: false },
                xaxis: { categories: names },
                yaxis: [
                  { title: { text: "₹ Sales" }, labels: { formatter: (v) => `₹${v.toLocaleString()}` } },
                  { opposite: true, title: { text: "Sessions / Minutes" } },
                ],
                legend: { position: "top" },
                grid: { borderColor: "#f1f5f9" },
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
                xaxis: { categories: names },
                yaxis: { labels: { formatter: (v) => `₹${v.toLocaleString()}` } },
                legend: { position: "top" },
                dataLabels: { enabled: false },
                grid: { borderColor: "#f1f5f9" },
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
                  chart: { type: "bar", toolbar: { show: false }, fontFamily: "inherit" },
                  plotOptions: { bar: { borderRadius: 6, columnWidth: "50%", distributed: true } },
                  colors: MONTH_COLORS,
                  dataLabels: { enabled: true, formatter: (v) => `₹${(v/1000).toFixed(0)}k` },
                  xaxis: { categories: monthlySales.map(m => m.name) },
                  yaxis: { labels: { formatter: (v) => `₹${(v/1000).toFixed(0)}k` } },
                  legend: { show: false },
                  grid: { borderColor: "#f1f5f9" },
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
                  chart: { type: "bar", toolbar: { show: false }, fontFamily: "inherit" },
                  plotOptions: { bar: { borderRadius: 6, columnWidth: "50%", distributed: true } },
                  colors: ["#10b981","#10b981","#10b981","#10b981","#10b981"],
                  dataLabels: { enabled: true, formatter: (v) => `₹${(v/1000).toFixed(0)}k` },
                  xaxis: { categories: monthlySales.map(m => m.name) },
                  yaxis: { labels: { formatter: (v) => `₹${(v/1000).toFixed(0)}k` } },
                  legend: { show: false },
                  grid: { borderColor: "#f1f5f9" },
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
          <SectionHeader title="Revenue Quality" subtitle="Session revenue vs recharge — ratio > 100% means users are burning saved wallets" />
          <div className="bi-chart-grid mb-4">
            <div className="bi-chart-card">
              <h6 className="bi-chart-title">Session Revenue vs Net Recharge (Avg/Day)</h6>
              <ReactApexChart
                options={{
                  chart: { type: "bar", toolbar: { show: false }, fontFamily: "inherit" },
                  plotOptions: { bar: { borderRadius: 6, columnWidth: "50%", groupPadding: 0.2 } },
                  colors: ["#6366f1", "#10b981"],
                  xaxis: { categories: names },
                  yaxis: { labels: { formatter: (v) => `₹${v.toLocaleString()}` } },
                  legend: { position: "top" },
                  dataLabels: { enabled: false },
                  grid: { borderColor: "#f1f5f9" },
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
                  chart: { type: "line", toolbar: { show: false }, fontFamily: "inherit" },
                  stroke: { curve: "smooth", width: 3 },
                  colors: ["#ef4444"],
                  markers: { size: 6 },
                  annotations: { yaxis: [{ y: 100, borderColor: "#6366f1", label: { text: "Break-even (100%)", style: { color: "#6366f1" } } }] },
                  xaxis: { categories: names },
                  yaxis: { labels: { formatter: (v) => `${v}%` } },
                  dataLabels: { enabled: true, formatter: (v) => `${v}%` },
                  grid: { borderColor: "#f1f5f9" },
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
                  chart: { type: "bar", toolbar: { show: false }, fontFamily: "inherit" },
                  plotOptions: { bar: { borderRadius: 4, columnWidth: "55%" } },
                  colors: ["#6366f1", "#10b981", "#ef4444"],
                  xaxis: { categories: callAttempts.map(m => m.name) },
                  yaxis: { labels: { formatter: v => `${v}` } },
                  legend: { position: "top" },
                  dataLabels: { enabled: false },
                  grid: { borderColor: "#f1f5f9" },
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
                  chart: { type: "line", toolbar: { show: false }, fontFamily: "inherit" },
                  stroke: { curve: "smooth", width: 3 },
                  colors: ["#10b981"],
                  markers: { size: 6 },
                  dataLabels: { enabled: true, formatter: v => `${v}%` },
                  xaxis: { categories: callAttempts.map(m => m.name) },
                  yaxis: { min: 0, max: 100, labels: { formatter: v => `${v}%` } },
                  grid: { borderColor: "#f1f5f9" },
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
                      legend: { position: "bottom", fontSize: "11px" },
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
                      chart: { type: "bar", toolbar: { show: false }, fontFamily: "inherit" },
                      plotOptions: { bar: { borderRadius: 6, horizontal: true } },
                      colors: ["#6366f1"],
                      dataLabels: { enabled: true },
                      xaxis: { categories: (m.rejByType || []).map(r => r.type) },
                      grid: { borderColor: "#f1f5f9" },
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
                      legend: { position: "bottom" },
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
