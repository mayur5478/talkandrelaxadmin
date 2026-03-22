import React, { useState, useRef } from "react";
import Flatpickr from "react-flatpickr";
import calendar from "../../../assets/datepicker.png";
import "flatpickr/dist/flatpickr.css";

function DatePicker({ onChange }) {
  const [selectedDate, setSelectedDate] = useState(null);
  const flatpickrRef = useRef(null);

  const openDatePicker = () => {
    if (flatpickrRef.current) {
      flatpickrRef.current.open();
    }
  };

  const handleDateSelection = (date) => {
    const localDate = new Date(date[0].getTime() - date[0].getTimezoneOffset() * 60000); // Convert to local timezone
    setSelectedDate(localDate);
    if (onChange) {
      onChange(localDate); // Pass the local date to the parent component
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
        value={selectedDate}
        onChange={handleDateSelection}
        options={{
          dateFormat: "Y-m-d", // Format date as YYYY-MM-DD
          enableTime: false,
        }}
        onReady={(selectedDates, dateStr, instance) => {
          flatpickrRef.current = instance;
        }}
        className="custom-datepicker"
      />
    </div>
  );
}

export default DatePicker;
