import React, { useState } from "react";
import Rejections from "../payment-management/payment-list/rejections/Rejections";
import MultiDatePicker from "../user-management/user-list/date-picker/MultiDatePicker";
import { RejectionFocusStrip } from "./RejectionFocus";

function CallRejections() {
  const [dateRange, setDateRange] = useState([]);

  // The strip summarises a rolling window, so it tracks the selected range's
  // length rather than the exact dates — falls back to 7 days when unset.
  const focusDays = (() => {
    const [from, to] = dateRange;
    if (!from || !to) return 7;
    const d = Math.ceil((new Date(to) - new Date(from)) / 86400000) + 1;
    return Math.min(Math.max(d, 1), 90);
  })();

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

      <RejectionFocusStrip days={focusDays} />

      <Rejections
        fromDate={dateRange[0]}
        toDate={dateRange[1]}
      />
    </div>
  );
}

export default CallRejections;
