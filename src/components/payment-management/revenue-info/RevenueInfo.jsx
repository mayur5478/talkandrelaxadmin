import React, { useEffect, useState } from "react";
import { Button, Col, Row } from "react-bootstrap";

import search from "../../assets/search.png";
import "./revenue.scss";
import DatePicker from "../../user-management/user-list/date-picker/DatePicker";
import ExportExcel from "../../common/export-modal/ExportExcel";
import DashboardCards from "../../common/dashboard-card/DashboardCards.jsx";
import salesOrange from "../../assets/sales-orange.png";
import greenAmount from "../../assets/green-amount.png";
import headphone from "../../assets/blue-headphone.png";
import buildings from "../../assets/buildings.png";
import { useRevenueQuery } from "../../../services/listener.js";
function RevenueInfo() {
  const [modalShow, setModalShow] = useState(false);

  const { data, error, isLoading } = useRevenueQuery();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error fetching revenue data: {error.message}</div>;

  const {
    recharge_gst,
    gift_gst,
    total_gst,
    recharge_revenue,
    gift_revenue,
    total_revenue,
  } = data;

  const updatedDetails = [
    {
      title: "Total GST",
      amount: total_gst,
      icon: salesOrange,
      growthClass: "text-green",
      backgroundClass: "orange",
    },
    {
      title: "Total Gift GST",
      amount: gift_gst,
      icon: greenAmount,
      growthClass: "text-green",
      backgroundClass: "green",
    },
    {
      title: "Total Recharge GST",
      amount: recharge_gst,
      icon: headphone,
      growthClass: "text-green",
      backgroundClass: "blue",
    },
    {
      title: "Total Company Revenue",
      amount: total_revenue,
      icon: buildings,
      growthClass: "text-green",
      backgroundClass: "purple",
    },
  ];

  return (
    <div className="revenue-main">
      <div className="top-section">
        <div className="left-section">
          <Button onClick={() => setModalShow(true)}>Excel</Button>
          <div className="search-bar">
            <input
              type="text"
              className="search-input"
              placeholder="Search User"
            />
            <img src={search} alt="Search" className="search-icon" />
          </div>
        </div>
        <div className="right-section">
          <DatePicker />
        </div>
      </div>
      <Row className="row-class">
        {updatedDetails.map((ele, index) => (
          <Col sm={12} md={6} lg={6} key={index}>
            <DashboardCards
              title={ele.title}
              amount={ele.amount}
              icon={ele.icon}
              growthClass={ele.growthClass}
              backgroundClass={ele.backgroundClass}
              type="revenue"
            />
          </Col>
        ))}
      </Row>

      <ExportExcel show={modalShow} onHide={() => setModalShow(false)} />
    </div>
  );
}

export default RevenueInfo;
