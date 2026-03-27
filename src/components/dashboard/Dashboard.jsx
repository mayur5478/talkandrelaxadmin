import React, { useState } from "react";
import "./dashboard.scss";
import { details } from "./dashboardCardsDetails.js";
import { Col, Form, Row } from "react-bootstrap";
import DashboardCards from "../common/dashboard-card/DashboardCards";

import Circle from "./circle/Circle.jsx";
import Top10Wallets from "./Top10Wallets.jsx";
import { useDashboardQuery, useGetMeQuery } from "../../services/auth.js";

function Dashboard() {
  const { data, isLoading, error } = useDashboardQuery();
const {
    data: user,
    refetch,
    isLoading: isUserLoading,
    error: userError,
  } = useGetMeQuery(null, {
    skip: !localStorage.getItem("token"),
  });


  return (
    <div className="dashboard-main">
      <h6 className="heading">Welcome back, {user?.user?.first_name} {user?.user?.last_name}!</h6>
      <Row cols="auto" className="rows-class">
        {data?.dashboardDetails?.map((ele, ind) => (
          <Col sm={12} md={3} lg={3} key={ind}>
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

      {/* Active Sessions Section */}
      <h6 className="heading mt-4">Active Sessions</h6>
      <div className="table active-sessions-table mb-4 shadow-sm" style={{ backgroundColor: 'white', borderRadius: '12px', padding: '15px' }}>
        <div className="table-headings" style={{ display: 'flex', borderBottom: '1px solid #f0f0f0', paddingBottom: '10px' }}>
          <div style={{ width: '5%' }}><p className="heading-text font-weight-bold mb-0">Sr.</p></div>
          <div style={{ width: '25%' }}><p className="heading-text font-weight-bold mb-0">User</p></div>
          <div style={{ width: '25%' }}><p className="heading-text font-weight-bold mb-0">Listener</p></div>
          <div style={{ width: '15%' }}><p className="heading-text font-weight-bold mb-0">Type</p></div>
          <div style={{ width: '30%' }}><p className="heading-text font-weight-bold mb-0">Started At</p></div>
        </div>
        
        {(!data?.activeSessions || data?.activeSessions?.length === 0) && (
          <p className="p-4 text-center text-muted mb-0">No active sessions right now.</p>
        )}
        
        {data?.activeSessions?.map((session, index) => (
          <div className="table-body py-2" key={session.id} style={{ display: 'flex', borderBottom: '1px solid #fafafa', alignItems: 'center' }}>
            <div style={{ width: '5%' }}><p className="heading-text mb-0">{index + 1}</p></div>
            <div style={{ width: '25%' }}><p className="heading-text mb-0">{session.userName}</p></div>
            <div style={{ width: '25%' }}><p className="heading-text mb-0">{session.listenerName}</p></div>
            <div style={{ width: '15%' }}><p className="heading-text mb-0" style={{ textTransform: 'capitalize' }}>{session.type}</p></div>
            <div style={{ width: '30%' }}>
              <p className="heading-text mb-0 text-muted" style={{ fontSize: '13px' }}>
                {new Date(session.start_time).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true, day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Top 10 Wallet Holders Section */}
      <Row className="mt-4">
        <Col sm={12}>
          <Top10Wallets />
        </Col>
      </Row>
    </div>
  );
}

export default Dashboard;
