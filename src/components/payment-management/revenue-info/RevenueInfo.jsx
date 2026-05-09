import React, { useEffect, useState } from "react";
import "./revenue.scss";
import { Card, Button } from "../../v2/ui";
import DatePicker from "../../user-management/user-list/date-picker/DatePicker";
import ExportExcel from "../../common/export-modal/ExportExcel";
import salesOrange from "../../assets/sales-orange.png";
import greenAmount from "../../assets/green-amount.png";
import headphone from "../../assets/blue-headphone.png";
import buildings from "../../assets/buildings.png";
import { useRevenueQuery } from "../../../services/listener.js";

function RevenueInfo() {
  const [modalShow, setModalShow] = useState(false);

  const { data, error, isLoading } = useRevenueQuery();

  if (isLoading) return (
    <div className="tw-flex tw-items-center tw-justify-center tw-py-12">
      <div className="tw-text-fg-tertiary">Loading...</div>
    </div>
  );
  if (error) return (
    <div className="tw-flex tw-items-center tw-justify-center tw-py-12">
      <div className="tw-text-fg-tertiary">Error fetching revenue data: {error.message}</div>
    </div>
  );

  const {
    recharge_gst,
    gift_gst,
    total_gst,
    recharge_revenue,
    gift_revenue,
    total_revenue,
  } = data;

  const updatedDetails = [
    {
      title: "Total GST",
      amount: total_gst,
      icon: salesOrange,
    },
    {
      title: "Total Gift GST",
      amount: gift_gst,
      icon: greenAmount,
    },
    {
      title: "Total Recharge GST",
      amount: recharge_gst,
      icon: headphone,
    },
    {
      title: "Total Company Revenue",
      amount: total_revenue,
      icon: buildings,
    },
  ];

  return (
    <div className="tw-flex tw-flex-col tw-gap-4">
      {/* Page header */}
      <div className="tw-flex tw-items-center tw-justify-between tw-flex-wrap tw-gap-3">
        <div>
          <h1 className="tw-text-h1 tw-text-fg-primary tw-m-0">Revenue Info</h1>
          <p className="tw-text-small tw-text-fg-tertiary tw-mt-1 tw-mb-0">Platform revenue and GST overview</p>
        </div>
        <div className="tw-flex tw-items-center tw-gap-2">
          <Button variant="secondary" size="sm" onClick={() => setModalShow(true)}>
            Export Excel
          </Button>
          <DatePicker />
        </div>
      </div>

      {/* KPI cards */}
      <div className="tw-grid tw-grid-cols-1 tw-gap-4 md:tw-grid-cols-2">
        {updatedDetails.map((ele, index) => (
          <Card key={index}>
            <div className="tw-flex tw-items-center tw-gap-4">
              <div className="tw-flex tw-items-center tw-justify-center tw-w-12 tw-h-12 tw-rounded-xl tw-bg-bg-secondary tw-flex-shrink-0">
                <img src={ele.icon} alt={ele.title} className="tw-w-6 tw-h-6" />
              </div>
              <div>
                <p className="tw-text-small tw-text-fg-tertiary tw-mb-1 tw-m-0">{ele.title}</p>
                <p className="tw-text-fg-primary tw-font-semibold tw-text-xl tw-m-0">
                  Rs. {ele.amount ?? 0}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <ExportExcel show={modalShow} onHide={() => setModalShow(false)} />
    </div>
  );
}

export default RevenueInfo;
