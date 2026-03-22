import React, { useState } from "react";
import { Button, Col, Form, Row } from "react-bootstrap";
import search from "../../assets/search.png";
import sort from "../../assets/sort.png";
import "./commission.scss";
import { details } from "./commissionCardDetails.js";
import frontIcon from "../../assets/front.png";
import backIcon from "../../assets/back.png";
import forwardIcon from "../../assets/forward.png";
import backwardIcon from "../../assets/backward.png";
import ExportExcel from "../../common/export-modal/ExportExcel";
import DashboardCards from "../../common/dashboard-card/DashboardCards.jsx";

function CommisionLiat() {
      const [modalShow, setModalShow] = useState(false);
  return (
    <div className="commission-main">
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
     
    </div>
    <Row className="row-class" >
{details ? details.map((ele) => (
  <Col sm={12} md={4} lg={4}><DashboardCards  title={ele.title}
  amount={ele.amount} 
  icon={ele.icon}
  growthClass={ele.growthClass}
  backgroundClass={ele.backgroundClass}
  type="gst" /></Col>
)) : ""

}
    </Row>
    <div className="table">
      <div className="table-headings">
        <div>
          <p className="heading-text">Sr. No</p>
        </div>
        <div>
          <p className="heading-text">
            Transaction ID <img className="sort" src={sort} alt={sort} />
          </p>
        </div>
        <div>
          <p className="heading-text">
            From name <img className="sort" src={sort} alt={sort} />
          </p>
        </div>
        <div>
          <p className="heading-text">
            To Name <img className="sort" src={sort} alt={sort} />
          </p>
        </div>
        <div>
          <p className="heading-text">
            Description 
          </p>
        </div>
        <div>
          <p className="heading-text">
            Paid By User <img className="sort" src={sort} alt={sort} />
          </p>
        </div>
        <div>
          <p className="heading-text">
            Received By Listener <img className="sort" src={sort} alt={sort} />
          </p>
        </div>
        <div>
          <p className="heading-text">
            Commission <img className="sort" src={sort} alt={sort} />
          </p>
        </div>
        <div>
          <p className="heading-text">
            Type <img className="sort" src={sort} alt={sort} />
          </p>
        </div>
        <div>
          <p className="heading-text">
          Status 
          </p>
        </div>

      </div>
      <div className="table-body">
        <div>
          <p className="heading-text">01</p>
        </div>
        <div>
          <p className="heading-text">pay_sdfs4dsds4ds</p>
        </div>
        <div>
          <p className="heading-text">Mohan Tonar</p>
        </div>
        <div>
          <p className="heading-text">Pritee Tony</p>
        </div>
        <div>
          <p className="heading-text">
          Listing Session with Gujrat bac for 1 Minutes.
          </p>
        </div>
        <div>
          <p className="heading-text">30.00</p>
        </div>
        <div>
          <p className="heading-text">12.00</p>
        </div>
        <div>
          <p className="heading-text ">08.00</p>
        </div>
        <div>
          <p className="heading-text">Call</p>
        </div>
        <div>
          <p className="heading-text green-text">Recieved</p>
        </div>
      </div>

      <div className="pagination">
        <div className="pagination-dropdown">
          <p>Items Per Pages:</p>{" "}
          <Form.Select aria-label="Default select example">
            <option></option>
            <option value="1">5</option>
            <option value="2">10</option>
            <option value="3">15</option>
            <option value="2">20</option>
            <option value="3">25</option>
            <option value="3">30</option>
          </Form.Select>{" "}
        </div>
        <div className="pagination-details">
          <div className="pagination-numbers">
            <p>1</p>-<p>10</p>
            <p>of</p>
            <p>90</p>
          </div>
          <div className="pagination-controls">
            <img src={backwardIcon} alt={backwardIcon} />
            <img src={backIcon} alt={backIcon} />
            <img src={frontIcon} alt={frontIcon} />
            <img src={forwardIcon} alt={forwardIcon} />
          </div>
        </div>
      </div>
    </div>
    <ExportExcel show={modalShow} onHide={() => setModalShow(false)} />
  </div>
  )
}

export default CommisionLiat