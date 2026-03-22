import React, { useState, useRef } from "react";
import Flatpickr from "react-flatpickr";
import calendar from "../../../assets/datepicker.png";
import "flatpickr/dist/flatpickr.css";

function MultiDatePicker({ onChange }) {
  const [selectedRange, setSelectedRange] = useState([]);
  const flatpickrRef = useRef(null);

  const openDatePicker = () => {
    if (flatpickrRef.current) {
      flatpickrRef.current.open();
    }
  };

  const handleDateSelection = (dates) => {
    const adjustedDates = dates.map((date) =>
      new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    );
    setSelectedRange(adjustedDates);
    if (onChange) {
      onChange(adjustedDates); // [fromDate, toDate]
    }
  };

  return (
    <div className="datepicker-container">
      <img
        src={calendar}
        alt="Calendar Icon"
        className="calendar-icon"
        onClick={openDatePicker}
      />
      <Flatpickr
        value={selectedRange}
        onChange={handleDateSelection}
        options={{
          mode: "range", // Enable range selection
          dateFormat: "Y-m-d",
        }}
        onReady={(selectedDates, dateStr, instance) => {
          flatpickrRef.current = instance;
        }}
        className="custom-datepicker"
        placeholder="Select date range"
      />
    </div>
  );
}

export default MultiDatePicker;
