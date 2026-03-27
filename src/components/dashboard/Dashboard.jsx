import React, { useState } from "react";
import "./dashboard.scss";
import { details } from "./dashboardCardsDetails.js";
import { Col, Form, Row } from "react-bootstrap";
import DashboardCards from "../common/dashboard-card/DashboardCards";
import Graph from "./graph/Graph.jsx";
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

      {/* Circle Sections */}
      <Row>
        <Col sm={12} md={6} lg={6}>
          <div className="table">
            <div className="topbar space">
              <p>Traffic Via Website</p>
              <Form.Select
                className="traffic-dropdown"
                aria-label="Default select example"
              >
                <option>Sort By</option>
                <option value="1">Monthly</option>
                <option value="2">Yearly</option>
                <option value="3">Daily</option>
              </Form.Select>
            </div>
            <div className="circle-graph">
              <p>In the system, 62% Traffic via Website in one week.</p>
              <Circle percentage={75} color="#2AA33D" />
            </div>
          </div>
        </Col>

        <Col sm={12} md={6} lg={6}>
          <div className="table">
            <div className="topbar space">
              <p>Traffic Via Application</p>
              <Form.Select
                className="traffic-dropdown"
                aria-label="Default select example"
              >
                <option>Sort By</option>
                <option value="1">Monthly</option>
                <option value="2">Yearly</option>
                <option value="3">Daily</option>
              </Form.Select>
            </div>
            <div className="circle-graph">
              <p>In the system, 62% Traffic via Application in one week.</p>
              <Circle percentage={75} color="#843C96" />
            </div>
          </div>
        </Col>
      </Row>

      {/* Graph Section */}
     
        <Graph />
     
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
