import React from "react";
import "./circle.scss";

const Circle = ({ percentage,color }) => {
  const radius = 47; 
  const strokeWidth = 5;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="circular-progress">
      <svg width="120" height="120">
       
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="#e6e6e6" 
          strokeWidth={strokeWidth}
        />
       
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={color} 
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.5s ease" }}
        />
     
        <text
          x="50"
          y="50"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="24px"
          fill="#000"
          fontWeight="700"
        >
          {percentage}%
        </text>
      </svg>
    </div>
  );
};

export default Circle;
