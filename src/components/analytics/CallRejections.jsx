import React, { useState } from "react";
import Rejections from "../payment-management/payment-list/rejections/Rejections";
import MultiDatePicker from "../user-management/user-list/date-picker/MultiDatePicker";
import { Button } from "react-bootstrap";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

function CallRejections() {
  const [dateRange, setDateRange] = useState([]);
  
  return (
    <div className="call-rejections-page px-4 py-4">
      <div className="welcome-banner mb-4 p-4 rounded-4 bg-white shadow-sm d-flex flex-column flex-md-row justify-content-between align-items-center">
        <div>
          <h3 className="fw-bold mb-1">Call Rejections Monitor</h3>
          <p className="text-muted mb-0">Understand the reasons behind failed call and chat attempts.</p>
        </div>
        <div className="d-flex gap-3 mt-3 mt-md-0">
          <MultiDatePicker onChange={setDateRange} />
        </div>
      </div>

      <div className="modern-card p-0 overflow-auto shadow-sm">
        <div className="p-4" style={{ minHeight: '60vh' }}>
          <Rejections
            fromDate={dateRange[0]}
            toDate={dateRange[1]}
          />
        </div>
      </div>
    </div>
  );
}

export default CallRejections;
