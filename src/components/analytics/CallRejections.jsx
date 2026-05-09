import React, { useState } from "react";
import Rejections from "../payment-management/payment-list/rejections/Rejections";
import MultiDatePicker from "../user-management/user-list/date-picker/MultiDatePicker";

function CallRejections() {
  const [dateRange, setDateRange] = useState([]);

  return (
    <div className="tw-flex tw-flex-col tw-gap-4">
      {/* Page header */}
      <div className="tw-flex tw-items-center tw-justify-between tw-flex-wrap tw-gap-3">
        <div>
          <h1 className="tw-text-h1 tw-text-fg-primary tw-m-0">Call Rejections Monitor</h1>
          <p className="tw-text-small tw-text-fg-tertiary tw-mt-1 tw-mb-0">Understand the reasons behind failed call and chat attempts.</p>
        </div>
        <div className="tw-flex tw-items-center tw-gap-2">
          <MultiDatePicker onChange={setDateRange} />
        </div>
      </div>

      <Rejections
        fromDate={dateRange[0]}
        toDate={dateRange[1]}
      />
    </div>
  );
}

export default CallRejections;
