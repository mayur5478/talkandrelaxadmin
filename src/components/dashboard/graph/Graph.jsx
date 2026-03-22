import React, { useState, useMemo, useEffect } from "react";
import Chart from "react-apexcharts";
import "./graph.scss";
import { useGraphQuery } from "../../../services/auth";
import { Form } from "react-bootstrap";
import { debounce } from "lodash"; // Importing debounce function from lodash

const DUMMY_DATA = {
  labels: ["Jan", "Feb", "Mar", "Apr", "May"],
  users: [0, 0, 0, 0, 0],
  listeners: [0, 0, 0, 0, 0],
};

const Graph = () => {
  const [graphType, setGraphType] = useState("monthly");
  const { data, isLoading: graphLoading, isError } = useGraphQuery({ type: graphType });
  const [loaded, setLoaded] = useState(false); // State to track if data is loaded
  const [isLoadingForFiveSeconds, setIsLoadingForFiveSeconds] = useState(true); // To ensure 5 second loader

  // Debounce function to delay the type change
  const debouncedSetGraphType = debounce((newType) => {
    setGraphType(newType);
    setIsLoadingForFiveSeconds(true); 
  }); 

  // After 5 seconds, set loading to false to stop the loader
  useEffect(() => {
    if (isLoadingForFiveSeconds && !graphLoading && !isError) {
      const timer = setTimeout(() => {
        setIsLoadingForFiveSeconds(false); // End the loader after 5 seconds
        setLoaded(true); // Mark data as loaded
      }, 3000);
      
      return () => clearTimeout(timer); // Clean up the timer if component unmounts
    }
  }, [graphLoading, isError, isLoadingForFiveSeconds]);

  const safeData = useMemo(() => {
    if (
      data &&
      Array.isArray(data.labels) &&
      Array.isArray(data.users) &&
      Array.isArray(data.listeners) &&
      data.labels.length > 0 &&
      data.users.length === data.labels.length &&
      data.listeners.length === data.labels.length &&
      data.users.every((u) => typeof u === "number") &&
      data.listeners.every((l) => typeof l === "number")
    ) {
      return data;
    }
    return DUMMY_DATA;
  }, [data]);

  const options = {
    chart: { type: "line", zoom: { enabled: false }, toolbar: { show: false } },
    colors: ["#26BF94", "#535FFF"],
    dataLabels: { enabled: false },
    stroke: { width: [3, 2], curve: "smooth", dashArray: [0, 8] },
    fill: {
      type: "gradient",
      gradient: {
        shade: "dark",
        gradientToColors: ["#26BF94", "#535FFF"],
        shadeIntensity: 0.5,
        type: "horizontal",
        opacityFrom: 1,
        opacityTo: 1,
      },
    },
    legend: {
      position: "bottom",
      horizontalAlign: "center",
      markers: { width: 25, height: 25 },
    },
    xaxis: {
      categories: safeData.labels,
      labels: { rotate: -45, style: { fontSize: "12px", fontFamily: "inherit" } },
    },
    tooltip: {
      shared: true,
      intersect: false,
      y: [
        { title: { formatter: () => "Users" } },
        { title: { formatter: () => "Listeners" } },
      ],
    },
    grid: { borderColor: "#f1f1f1" },
    dropShadow: {
      enabled: true,
      color: "#000",
      top: 3,
      left: 3,
      blur: 4,
      opacity: 0.5,
    },
  };

  const series = [
    { name: "Users", data: safeData.users },
    { name: "Listeners", data: safeData.listeners },
  ];

  return (
    <div className="table">
      <div className="topbar">
        <p>Traffic Analysis:</p>
        <Form.Select
          aria-label="Select graph type"
          onChange={(e) => debouncedSetGraphType(e.target.value)} // Use debounced function for change
          value={graphType}
        >
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
          <option value="daily">Daily</option>
        </Form.Select>
      </div>
      <div id="chart" className="chart">
        {isLoadingForFiveSeconds ? (
          <p>Loading chart...</p> // Showing the loader for 5 seconds
        ) : graphLoading ? (
          <p>Loading chart...</p>
        ) : !loaded ? (
          <p>Waiting for data...</p>
        ) : (
          <Chart options={options} series={series} type="line" height={500} />
        )}
      </div>
    </div>
  );
};

export default Graph;
