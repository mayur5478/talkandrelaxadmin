import React, { useState } from "react";
import { Button, Form, Tab, Tabs } from "react-bootstrap";
import "./reportBlock.scss";
import search from "../../assets/search.png";
import ListenerBLock from "./ListenerBLock";
import UserBlock from "./UserBlock";
function ReportBlock() {
  const [key, setKey] = useState("Listener");
  const [searchTerm, setSearchTerm] = useState("");
  console.log("key",key);
  
  return (
    <div className="report-block-main">
      <div className="top-section">
        <div className="left-section">
          <div className="search-bar">
            <input
              type="text"
              className="search-input"
              placeholder="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <img src={search} alt="Search" className="search-icon" />
          </div>
        </div>

        <div className="right-section">
          {/* Tabs in Top Section */}
          <Tabs
            id="controlled-tab-example"
            activeKey={key}
            onSelect={(k) => setKey(k)} // Set the selected tab key
            className="tabs"
          >
            <Tab eventKey="Listener" title="Listener" ></Tab>
            <Tab eventKey="User" title="User" ></Tab>
          </Tabs>
        </div>
      </div>

      {key === "Listener" && (
        <div className="tab-content">
          <ListenerBLock search={searchTerm} />
        </div>
      )}
      {key === "User" && (
        <div className="tab-content">
          <UserBlock search={searchTerm} /> {/* Pass search term to Gift */}
        </div>
      )}
    </div>
  );
}

export default ReportBlock;
