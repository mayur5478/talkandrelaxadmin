import React, { useState } from 'react'
import { Button, Tab, Tabs } from 'react-bootstrap'
import search from "../../assets/search.png";
import "./penalty.scss"
import Leave from './Leave';
import MissedSession from './MissedSession';
import Policy from './Policy';



function PenaltyManage() {
    const [modalShow, setModalShow] = useState(false);
    const [key, setKey] = useState('Leave Penalty');
  return (
    <div className="penalty-main">
    {/* Top Section */}
    <div className="top-section">
      <div className="left-section">
      <Tabs
          id="controlled-tab-example"
          activeKey={key}
          onSelect={(k) => setKey(k)} // Set the selected tab key
          className="tabs"
        >
          <Tab eventKey="Leave Penalty" title="Leave Penalty"></Tab>
          <Tab eventKey="Missed Session Penalty" title="Missed Session Penalty"></Tab>
          <Tab eventKey="Policy Break Penalty" title="Policy Break Penalty"></Tab>
        </Tabs>
      </div>

    
    </div>

    {/* Tab Content in Table Section */}
    <div className="table">
      {key === "Leave Penalty" && (
        <div className="tab-content">
    <Leave/>
        </div>
      )}
      {key === "Missed Session Penalty" && (
        <div className="tab-content">
       <MissedSession/>
        </div>
      )}
      {key === "Policy Break Penalty" && (
        <div className="tab-content">
       <Policy/>
        </div>
      )}
    </div>
  </div>
  )
}

export default PenaltyManage