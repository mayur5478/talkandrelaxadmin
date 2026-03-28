import React from "react";
import "./dashboard.scss";
import DashboardCards from "../common/dashboard-card/DashboardCards";
import { useDashboardQuery } from "../../services/auth";
import WalletList from "./WalletList";

const Dashboard = () => {
  const { data, isLoading, error } = useDashboardQuery();

  if (isLoading) return <div className="p-4">Loading dashboard...</div>;
  if (error) return <div className="p-4 text-danger">Error loading dashboard data</div>;

  // Categorize metrics
  const platformStats = data?.dashboardDetails?.slice(0, 3) || [];
  const monthlyFinancials = data?.dashboardDetails?.slice(3, 6) || [];
  const dailyFinancials = data?.dashboardDetails?.slice(6, 9) || [];
  const adjustmentsAndVolume = data?.dashboardDetails?.slice(9, 12) || [];
  const walletAggregates = data?.dashboardDetails?.slice(12, 14) || [];
  const activeStatus = data?.dashboardDetails?.slice(14, 16) || [];

  return (
    <div className="dashboard-wrapper px-4 py-4">
      {/* Welcome Banner */}
      <div className="welcome-banner mb-4 p-4 rounded-4 bg-white shadow-sm border-0">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h2 className="fw-bold mb-1">Administrative Overview</h2>
            <p className="text-muted mb-0">Monitor platform health, financials, and user engagement at a glance.</p>
          </div>
          <div className="live-badge d-flex align-items-center gap-2 px-3 py-1 rounded-pill bg-light border">
             <div className="heartbeat-dot"></div>
             <span className="fw-semibold text-primary" style={{ fontSize: '14px' }}>LIVE MONITOR</span>
          </div>
        </div>
      </div>

      {/* 1. Platform & User Stats */}
      <section className="mb-5">
        <h5 className="category-title mb-3">Platform Overview</h5>
        <div className="dashboard-grid">
           {platformStats.map((ele, ind) => <DashboardCards key={ind} details={ele} />)}
           {activeStatus.map((ele, ind) => <DashboardCards key={ind} details={ele} />)}
        </div>
      </section>

      {/* 2. Financial Metrics Grouped */}
      <div className="row g-4 mb-5">
        <div className="col-lg-6">
           <h5 className="category-title mb-3">Today's Performance</h5>
           <div className="dashboard-grid grid-2">
              {dailyFinancials.map((ele, ind) => <DashboardCards key={ind} details={ele} />)}
           </div>
        </div>
        <div className="col-lg-6">
           <h5 className="category-title mb-3">Monthly Financials</h5>
           <div className="dashboard-grid grid-2">
              {monthlyFinancials.map((ele, ind) => <DashboardCards key={ind} details={ele} />)}
           </div>
        </div>
      </div>

      {/* 3. Deep Insights & Wallets */}
      <div className="row g-4 mb-5">
         <div className="col-lg-8">
            <h5 className="category-title mb-3">Adjustments & Lifetime Volume</h5>
            <div className="dashboard-grid">
               {adjustmentsAndVolume.map((ele, ind) => <DashboardCards key={ind} details={ele} />)}
            </div>
         </div>
         <div className="col-lg-4">
            <h5 className="category-title mb-3">Global Wallets</h5>
            <div className="d-flex flex-column gap-3">
               {walletAggregates.map((ele, ind) => <DashboardCards key={ind} details={ele} />)}
            </div>
         </div>
      </div>

      {/* 4. Top Accounts & Active Sessions */}
      <div className="row g-4 mb-5">
         <div className="col-lg-6">
            <div className="category-header d-flex justify-content-between align-items-center mb-3">
               <h5 className="category-title mb-0">High-Value Users</h5>
               <span className="badge bg-primary-subtle text-primary border-0 px-3">Top 10 Wallets</span>
            </div>
            <WalletList 
               title="Top User Wallets" 
               wallets={data?.top10UserWallets || []} 
               color="indigo"
            />
         </div>
         <div className="col-lg-6">
            <div className="category-header d-flex justify-content-between align-items-center mb-3">
               <h5 className="category-title mb-0">Top Earners (Listeners)</h5>
               <span className="badge bg-success-subtle text-success border-0 px-3">Top 10 Wallets</span>
            </div>
            <WalletList 
               title="Top Listener Wallets" 
               wallets={data?.top10ListenerWallets || []} 
               color="emerald"
            />
         </div>
      </div>

      {/* 5. Active Sessions Overlay */}
      {data?.activeSessions?.length > 0 && (
        <section>
          <h5 className="category-title mb-3">Ongoing Sessions (Live)</h5>
          <div className="modern-card p-0 overflow-hidden shadow-sm">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="bg-light">
                  <tr>
                    <th className="px-4 py-3 text-uppercase fw-bold text-muted small border-0">User</th>
                    <th className="px-4 py-3 text-uppercase fw-bold text-muted small border-0">Listener</th>
                    <th className="px-4 py-3 text-uppercase fw-bold text-muted small border-0">Type</th>
                    <th className="px-4 py-3 text-uppercase fw-bold text-muted small border-0">Started</th>
                    <th className="px-4 py-3 text-uppercase fw-bold text-muted small border-0">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.activeSessions.map((s, i) => (
                    <tr key={i}>
                      <td className="px-4 py-3 fw-semibold">{s.userName}</td>
                      <td className="px-4 py-3 fw-semibold text-primary">{s.listenerName}</td>
                      <td className="px-4 py-3">
                        <span className={`badge border-0 px-3 ${s.service_type === 'chat' ? 'bg-info-subtle text-info' : 'bg-warning-subtle text-warning'}`}>
                          {s.service_type.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted">{new Date(s.createdAt).toLocaleTimeString()}</td>
                      <td className="px-4 py-3">
                        <div className="d-flex align-items-center gap-2">
                           <div className="heartbeat-dot"></div>
                           <span className="text-secondary fw-500">In Call</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Dashboard;
