import React, { useState } from "react";
import "./dashboard.scss";
import { Col, Row, Card, Badge } from "react-bootstrap";
import DashboardCards from "../common/dashboard-card/DashboardCards";
import Top10Wallets from "./Top10Wallets.jsx";
import { useDashboardQuery, useGetMeQuery } from "../../services/auth.js";
import ResetStateModal from "../common/reset-state/ResetStateModal.jsx";

function Dashboard() {
  const { data, isLoading, error } = useDashboardQuery();
  const {
    data: user,
    isLoading: isUserLoading,
  } = useGetMeQuery(null, {
    skip: !localStorage.getItem("token"),
  });
  
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetTarget, setResetTarget] = useState({ id: "", name: "" });

  const handleResetStateClick = (id, name) => {
    setResetTarget({ id, name });
    setShowResetModal(true);
  };

  if (isLoading) return <div className="p-5 text-center">Loading Dashboard...</div>;

  return (
    <div className="dashboard-main px-4 py-4">
      <div className="welcome-banner mb-5 p-4 rounded-4 bg-white shadow-sm d-flex justify-content-between align-items-center">
        <div>
          <h2 className="fw-bold mb-1" style={{ color: 'var(--text-main)', fontSize: '1.75rem' }}>
            Welcome back, <span className="text-primary">{user?.user?.first_name} {user?.user?.last_name}</span>!
          </h2>
          <p className="text-muted mb-0">Here's what's happening on the platform today.</p>
        </div>
        <div className="d-none d-md-block">
            <span className="badge bg-light text-primary border p-2 px-3 rounded-pill fw-normal">
              <span className="me-2 text-success">●</span> System Online
            </span>
        </div>
      </div>

      <Row className="g-4 mb-5">
        {data?.dashboardDetails?.map((ele, ind) => (
          <Col sm={12} md={6} lg={4} xl={3} key={ind}>
            <DashboardCards
              title={ele.title}
              amount={ele.amount}
              percentage={ele.percentage}
              icon={ele.icon}
              growth={ele.growth}
              growthClass={ele.growthClass}
              backgroundClass={ele.backgroundClass}
              type="dashboard"
            />
          </Col>
        ))}
      </Row>

      <Row className="mb-5">
        <Col lg={12}>
          <div className="modern-card p-4">
            <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom">
              <div>
                <h4 className="fw-bold mb-1">Live Active Sessions</h4>
                <p className="text-muted small mb-0">Real-time monitoring of ongoing calls and chats</p>
              </div>
              <Badge bg="success" className="p-2 px-3 rounded-pill heartbeat-badge">
                 {data?.activeSessions?.length || 0} LIVE
              </Badge>
            </div>
            
            <div className="modern-table-container">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Sr.</th>
                    <th>User</th>
                    <th>Listener</th>
                    <th>Service Type</th>
                    <th>Started At</th>
                    <th className="text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {(!data?.activeSessions || data?.activeSessions?.length === 0) && (
                    <tr>
                      <td colSpan="6" className="p-5 text-center text-muted">No active sessions right now.</td>
                    </tr>
                  )}
                  {data?.activeSessions?.map((session, index) => (
                    <tr key={session.id}>
                      <td>{index + 1}</td>
                      <td className="fw-medium">{session.userName}</td>
                      <td className="fw-medium">{session.listenerName}</td>
                      <td>
                        <Badge bg="light" className="text-capitalize text-dark border fw-normal p-2 px-3">
                          {session.type}
                        </Badge>
                      </td>
                      <td className="text-muted">
                        {new Date(session.start_time).toLocaleString('en-IN', { 
                          hour12: true, 
                          hour: '2-digit', 
                          minute: '2-digit',
                          day: '2-digit',
                          month: 'short'
                        })}
                      </td>
                      <td className="text-center">
                        <div 
                          className="reset-icon-bg p-2 rounded-3 d-inline-flex cursor-pointer"
                          onClick={() => handleResetStateClick(session.userId, session.userName)}
                          title="Reset Stuck State"
                        >
                           <img
                            src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%23ef4444' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M21 2v6h-6'%2F%3E%3Cpath d='M3 12a9 9 0 0 1 15-6.7L21 8'%2F%3E%3Cpath d='M3 22v-6h6'%2F%3E%3Cpath d='M21 12a9 9 0 0 1-15 6.7L3 16'%2F%3E%3C%2Fsvg%3E"
                            alt="Reset"
                            style={{ width: '18px', height: '18px' }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Col>
      </Row>

      <Row className="g-4">
        <Col xl={6}>
            <Top10Wallets />
        </Col>
        
        <Col xl={6}>
          <div className="modern-card p-4">
            <div className="mb-4 pb-2 border-bottom">
                <h4 className="fw-bold mb-1">Top Earning Listeners</h4>
                <p className="text-muted small mb-0">Highest wallet balances among providers</p>
            </div>
            <div className="modern-table-container">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Listener Details</th>
                    <th className="text-end">Wallet Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.top10ListenerWallets?.map((w, index) => (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>
                        <div className="d-flex flex-column">
                          <span className="fw-bold text-dark">{w.userName}</span>
                          <span className="text-muted small">{w.email}</span>
                        </div>
                      </td>
                      <td className="text-end">
                        <span className="fw-bold text-primary fs-5">₹{parseFloat(w.balance || 0).toLocaleString()}</span>
                      </td>
                    </tr>
                  ))}
                  {(!data?.top10ListenerWallets || data?.top10ListenerWallets?.length === 0) && (
                    <tr>
                      <td colSpan="3" className="text-center p-5 text-muted">No listener data available</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </Col>
      </Row>

      <ResetStateModal 
        show={showResetModal} 
        handleClose={() => setShowResetModal(false)}
        userId={resetTarget.id}
        userName={resetTarget.name}
        refetch={() => {
          window.location.reload();
        }}
      />
    </div>
  );
}

export default Dashboard;
