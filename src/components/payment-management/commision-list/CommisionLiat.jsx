import React, { useState } from "react";
import "./commission.scss";
import { Card, Button, Table, THead, TBody, TR, Th, Td, Pagination } from "../../v2/ui";
import { Search } from "lucide-react";
import { details } from "./commissionCardDetails.js";
import ExportExcel from "../../common/export-modal/ExportExcel";

function CommisionLiat() {
  const [modalShow, setModalShow] = useState(false);
  return (
    <div className="tw-flex tw-flex-col tw-gap-4">
      {/* Page header */}
      <div className="tw-flex tw-items-center tw-justify-between tw-flex-wrap tw-gap-3">
        <div>
          <h1 className="tw-text-h1 tw-text-fg-primary tw-m-0">Commission List</h1>
          <p className="tw-text-small tw-text-fg-tertiary tw-mt-1 tw-mb-0">Platform commission from sessions</p>
        </div>
        <div className="tw-flex tw-items-center tw-gap-2">
          <Button variant="secondary" size="sm" onClick={() => setModalShow(true)}>
            Export Excel
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="tw-flex tw-items-center tw-gap-2 tw-flex-wrap">
        <div className="tw-relative tw-flex-1 tw-min-w-[200px] tw-max-w-xs">
          <Search size={14} className="tw-absolute tw-left-3 tw-top-1/2 -tw-translate-y-1/2 tw-text-fg-tertiary" />
          <input
            type="text"
            placeholder="Search User"
            className="tw-w-full tw-h-8 tw-pl-9 tw-pr-3 tw-text-[13px] tw-bg-bg-primary tw-text-fg-primary tw-border tw-border-hairline tw-border-tertiary tw-rounded-md tw-outline-none focus:tw-ring-2 focus:tw-ring-fg-info placeholder:tw-text-fg-tertiary"
          />
        </div>
      </div>

      {/* Summary cards */}
      {details && details.length > 0 && (
        <div className="tw-grid tw-grid-cols-1 tw-gap-3 md:tw-grid-cols-3">
          {details.map((ele, i) => (
            <Card key={i}>
              <div className="tw-flex tw-items-center tw-justify-between">
                <div>
                  <p className="tw-text-small tw-text-fg-tertiary tw-mb-1">{ele.title}</p>
                  <p className="tw-text-fg-primary tw-font-semibold tw-text-lg tw-m-0">{ele.amount}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Table card */}
      <Card flush>
        <Table>
          <THead>
            <TR>
              <Th>Sr. No</Th>
              <Th>Transaction ID</Th>
              <Th>From Name</Th>
              <Th>To Name</Th>
              <Th>Description</Th>
              <Th>Paid By User</Th>
              <Th>Received By Listener</Th>
              <Th>Commission</Th>
              <Th>Type</Th>
              <Th>Status</Th>
            </TR>
          </THead>
          <TBody>
            <TR isLast>
              <Td>01</Td>
              <Td>pay_sdfs4dsds4ds</Td>
              <Td className="tw-text-fg-primary tw-font-medium">Mohan Tonar</Td>
              <Td className="tw-text-fg-primary tw-font-medium">Pritee Tony</Td>
              <Td>Listing Session with Gujrat bac for 1 Minutes.</Td>
              <Td>30.00</Td>
              <Td>12.00</Td>
              <Td>08.00</Td>
              <Td>Call</Td>
              <Td><span className="tw-text-success">Received</span></Td>
            </TR>
          </TBody>
        </Table>
        <Pagination page={1} totalPages={1} totalRecords={1} pageSize={10} onPageChange={() => {}} onPageSize={() => {}} />
      </Card>

      <ExportExcel show={modalShow} onHide={() => setModalShow(false)} />
    </div>
  );
}

export default CommisionLiat;
