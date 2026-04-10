import React from "react";
import "./dashboard.scss";
import DashboardCards from "../common/dashboard-card/DashboardCards";
import { useDashboardQuery, useCleanupLeakedUserImagesMutation, useBackfillLeavesMutation } from "../../services/auth";
import WalletList from "./WalletList";
import WalletModal from "./WalletModal";
import DiagnoseModal from "../common/diagnose-connection/DiagnoseModal";
import Swal from "sweetalert2";

const Dashboard = () => {
  const { data, isLoading, error } = useDashboardQuery();
  const [showUserModal, setShowUserModal] = React.useState(false);
  const [showListenerModal, setShowListenerModal] = React.useState(false);
  const [showDiagnose, setShowDiagnose] = React.useState(false);
  const [cleanupImages, { isLoading: isCleaning }] = useCleanupLeakedUserImagesMutation();
  const [backfillLeaves, { isLoading: isBackfilling }] = useBackfillLeavesMutation();

  const handleBackfillLeaves = async () => {
    const { value: formValues } = await Swal.fire({
      title: "Backfill Listener Leaves",
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
      confirmButtonText: "Run Backfill",
      preConfirm: () => ({
        fromDate: document.getElementById("swal-from").value,
        toDate: document.getElementById("swal-to").value,
      }),
    });
    if (!formValues) return;
    try {
      const res = await backfillLeaves(formValues).unwrap();
      const rows = (res.results || []).map(r => `<tr><td>${r.date}</td><td>${r.leavesCreated}</td></tr>`).join("");
      Swal.fire({
        title: "Backfill Complete",
        html: `<table class="table table-sm"><thead><tr><th>Date</th><th>Leaves Created</th></tr></thead><tbody>${rows}</tbody></table>`,
        icon: "success",
      });
    } catch (err) {
      Swal.fire("Error", err?.data?.message || "Backfill failed", "error");
    }
  };

  const handleCleanupImages = async () => {
    const confirm = await Swal.fire({
      title: "Clean up leaked user images?",
      text: "This removes real user photos that were previously stored in listener nickname records. Safe to run — it only clears images that match the user's actual profile photo.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, clean up",
    });
    if (!confirm.isConfirmed) return;
    try {
      const res = await cleanupImages().unwrap();
      Swal.fire("Done", res.message, "success");
    } catch (err) {
      Swal.fire("Error", err?.data?.message || "Cleanup failed", "error");
    }
  };

  if (isLoading) return <div className="p-4">Loading dashboard...</div>;
  if (error) return <div className="p-4 text-danger">Error loading dashboard data</div>;

  // Categorize metrics
  const platformStats = data?.dashboardDetails?.slice(0, 3) || [];
  const monthlyFinancials = data?.dashboardDetails?.slice(3, 8) || [];
  const dailyFinancials = data?.dashboardDetails?.slice(8, 12) || [];
  const adjustmentsAndVolume = data?.dashboardDetails?.slice(12, 15) || [];
  const walletAggregates = data?.dashboardDetails?.slice(15, 17) || [];
  const activeStatus = data?.dashboardDetails?.slice(17, 19) || [];

  return (
    <div className="dashboard-wrapper px-4 py-4">
      {/* Welcome Banner */}
      <div className="welcome-banner mb-4 p-4 rounded-4 bg-white shadow-sm border-0">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h2 className="fw-bold mb-1">Administrative Overview</h2>
            <p className="text-muted mb-0">Monitor platform health, financials, and user engagement at a glance.</p>
          </div>
          <div className="d-flex align-items-center gap-3">
            <button className="btn btn-sm btn-outline-secondary rounded-pill px-3" onClick={handleBackfillLeaves} disabled={isBackfilling}>
              {isBackfilling ? "Processing..." : "Backfill Leaves"}
            </button>
            <button className="btn btn-sm btn-outline-warning rounded-pill px-3" onClick={handleCleanupImages} disabled={isCleaning}>
              {isCleaning ? "Cleaning..." : "Clean User Images"}
            </button>
            <button className="btn btn-sm btn-outline-danger rounded-pill px-3" onClick={() => setShowDiagnose(true)}>
              Diagnose Connection
            </button>
            <div className="live-badge d-flex align-items-center gap-2 px-3 py-1 rounded-pill bg-light border">
               <div className="heartbeat-dot"></div>
               <span className="fw-semibold text-primary" style={{ fontSize: '14px' }}>LIVE MONITOR</span>
            </div>
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

      {/* 5. Active Users List */}
      {data?.activeUsersList?.length > 0 && (
        <section className="mb-5">
          <div className="category-header d-flex justify-content-between align-items-center mb-3">
            <h5 className="category-title mb-0">Active Users</h5>
            <span className="text-muted small">Recharged users first · Newest registrations sorted descending</span>
          </div>
          <div className="modern-card p-0 overflow-hidden shadow-sm border-0">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="bg-light">
                  <tr>
                    <th className="px-4 py-3 text-uppercase fw-bold text-muted small border-0">#</th>
                    <th className="px-4 py-3 text-uppercase fw-bold text-muted small border-0">Name</th>
                    <th className="px-4 py-3 text-uppercase fw-bold text-muted small border-0">Mobile</th>
                    <th className="px-4 py-3 text-uppercase fw-bold text-muted small border-0">Registered</th>
                    <th className="px-4 py-3 text-uppercase fw-bold text-muted small border-0">Recharges</th>
                    <th className="px-4 py-3 text-uppercase fw-bold text-muted small border-0">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.activeUsersList.map((u, i) => (
                    <tr key={u.id}>
                      <td className="px-4 py-3 text-muted">{i + 1}</td>
                      <td className="px-4 py-3 fw-bold">{u.fullName}</td>
                      <td className="px-4 py-3">{u.mobile_number}</td>
                      <td className="px-4 py-3 text-muted small">{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        {u.has_recharged ? (
                          <span className="badge bg-success-subtle text-success-emphasis border-0 px-3">{u.recharge_count} recharge{u.recharge_count !== 1 ? 's' : ''}</span>
                        ) : (
                          <span className="badge bg-secondary-subtle text-secondary border-0 px-3">No recharge</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {u.is_online ? (
                          <div className="d-flex align-items-center gap-2 text-success fw-semibold small">
                            <div className="heartbeat-dot"></div>Online
                          </div>
                        ) : (
                          <span className="text-muted small">Offline</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* 7. Ongoing Sessions Overlay */}
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
                        <span className={`badge rounded-pill px-3 border-0 ${s.type?.toLowerCase() === 'chat' ? 'bg-info-subtle text-info-emphasis' : 'bg-primary-subtle text-primary-emphasis'}`}>
                          {s.type || s.service_type || 'AUDIO'}
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

      <DiagnoseModal show={showDiagnose} onHide={() => setShowDiagnose(false)} />
    </div>
  );
};


export default Dashboard;
