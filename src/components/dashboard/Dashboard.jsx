import React from "react";
import "./dashboard.scss";
import DashboardCards from "../common/dashboard-card/DashboardCards";
import { useDashboardQuery } from "../../services/auth";
import WalletList from "./WalletList";
import WalletModal from "./WalletModal";

const Dashboard = () => {
  const { data, isLoading, error } = useDashboardQuery();
  const [showUserModal, setShowUserModal] = React.useState(false);
  const [showListenerModal, setShowListenerModal] = React.useState(false);

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
           {platformStats.map((ele, ind) => <DashboardCards key={ind} {...ele} />)}
           {activeStatus.map((ele, ind) => <DashboardCards key={ind} {...ele} />)}
        </div>
      </section>

      {/* 2. Financial Metrics Grouped */}
      <div className="row g-4 mb-5">
        <div className="col-lg-6">
           <h5 className="category-title mb-3">Today's Performance</h5>
           <div className="dashboard-grid grid-2">
              {dailyFinancials.map((ele, ind) => <DashboardCards key={ind} {...ele} />)}
           </div>
        </div>
        <div className="col-lg-6">
           <h5 className="category-title mb-3">Monthly Financials</h5>
           <div className="dashboard-grid grid-2">
              {monthlyFinancials.map((ele, ind) => <DashboardCards key={ind} {...ele} />)}
           </div>
        </div>
      </div>

      {/* 3. Deep Insights & Wallets */}
      <div className="row g-4 mb-5">
         <div className="col-lg-8">
            <h5 className="category-title mb-3">Adjustments & Lifetime Volume</h5>
            <div className="dashboard-grid">
               {adjustmentsAndVolume.map((ele, ind) => <DashboardCards key={ind} {...ele} />)}
            </div>
         </div>
         <div className="col-lg-4">
            <h5 className="category-title mb-3">Global Wallets</h5>
            <div className="d-flex flex-column gap-3">
               {walletAggregates.map((ele, ind) => <DashboardCards key={ind} {...ele} />)}
            </div>
         </div>
      </div>


      {/* 4. Top Accounts & Active Sessions */}
      <div className="row g-4 mb-5">
          <div className="col-lg-6">
            <div className="category-header d-flex justify-content-between align-items-center mb-3">
               <h5 className="category-title mb-0">High-Value Users</h5>
               <div className="d-flex align-items-center gap-2">
                 <span className="badge bg-primary-subtle text-primary border-0 px-3">Top 10</span>
                 <button 
                  className="btn btn-sm btn-link text-decoration-none fw-bold p-0 ps-2" 
                  style={{ color: '#6366f1', fontSize: '13px' }}
                  onClick={() => setShowUserModal(true)}
                 >
                   View All →
                 </button>
               </div>
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
               <div className="d-flex align-items-center gap-2">
                 <span className="badge bg-success-subtle text-success border-0 px-3">Top 10</span>
                 <button 
                  className="btn btn-sm btn-link text-decoration-none fw-bold p-0 ps-2" 
                  style={{ color: '#10b981', fontSize: '13px' }}
                  onClick={() => setShowListenerModal(true)}
                 >
                   View All →
                 </button>
               </div>
            </div>
            <WalletList 
               title="Top Listener Wallets" 
               wallets={data?.top10ListenerWallets || []} 
               color="emerald"
            />
         </div>
      </div>

      {/* 5. Ongoing Sessions Overlay */}
      {data?.activeSessions?.length > 0 && (
        <section className="mb-5">
          <h5 className="category-title mb-3">Ongoing Sessions (Live)</h5>
          <div className="modern-card p-0 overflow-hidden shadow-sm border-0">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="bg-light">
                  <tr>
                    <th className="px-4 py-3 text-uppercase fw-bold text-muted small border-0">User Account</th>
                    <th className="px-4 py-3 text-uppercase fw-bold text-muted small border-0">Listener Agent</th>
                    <th className="px-4 py-3 text-uppercase fw-bold text-muted small border-0">Channel</th>
                    <th className="px-4 py-3 text-uppercase fw-bold text-muted small border-0">Live Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.activeSessions.map((s, i) => (
                    <tr key={i}>
                      <td className="px-4 py-3 fw-bold">{s.userName}</td>
                      <td className="px-4 py-3 fw-bold text-primary">{s.listenerName}</td>
                      <td className="px-4 py-3">
                        <span className={`badge border-0 px-3 ${s.type === 'chat' ? 'bg-info-subtle text-info' : 'bg-warning-subtle text-warning'}`}>
                          {s.type?.toUpperCase() || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="d-flex align-items-center gap-2 text-success fw-bold">
                           <div className="heartbeat-dot"></div>
                           <span>ACTIVE NOW</span>
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

      {/* 6. Today's Completed Sessions Overlay */}
      {data?.todaySessions?.length > 0 && (
        <section className="mb-4">
          <h5 className="category-title mb-3">Today's Completed Interactions</h5>
          <div className="modern-card p-0 overflow-hidden shadow-sm border-0 bg-white">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="" style={{ backgroundColor: '#f8fafc' }}>
                  <tr>
                    <th className="px-4 py-3 text-uppercase fw-bold text-muted small border-0">User</th>
                    <th className="px-4 py-3 text-uppercase fw-bold text-muted small border-0">Listener</th>
                    <th className="px-4 py-3 text-uppercase fw-bold text-muted small border-0">Method</th>
                    <th className="px-4 py-3 text-uppercase fw-bold text-muted small border-0">Duration</th>
                    <th className="px-4 py-3 text-uppercase fw-bold text-muted small border-0">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {data.todaySessions.map((s, i) => (
                    <tr key={i}>
                      <td className="px-4 py-3 fw-semibold">{s.userName}</td>
                      <td className="px-4 py-3 fw-semibold text-secondary">{s.listenerName}</td>
                      <td className="px-4 py-3">
                        <span className={`badge border-0 px-2 py-1 ${s.type === 'chat' ? 'bg-indigo-subtle text-indigo' : 'bg-orange-subtle text-orange'}`}>
                          {s.type?.toUpperCase() || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-monospace small">
                        {s.total_duration ? `${Math.round(s.total_duration)}m` : '00:00'}
                      </td>
                      <td className="px-4 py-3 text-muted small">
                        {new Date(s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* Wallet Detail Modals */}
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
    </div>
  );
};


export default Dashboard;
