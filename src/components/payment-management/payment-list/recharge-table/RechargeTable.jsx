import React, { useEffect, useState } from "react";
import { useRechargeListQuery } from "../../../../services/listener";
import "./recharge.scss";
import moment from "moment";
import { useNavigate } from "react-router-dom";
import {
  Table,
  THead,
  TBody,
  TR,
  Th,
  Td,
  TableSkeleton,
  Pill,
  Pagination,
} from "../../../v2/ui";

function RechargeTable({ searchTerm, dateRange, setExcelData }) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const { data, error, isLoading } = useRechargeListQuery({
    page,
    limit: pageSize,
    search: debouncedSearch,
    fromDate: dateRange?.[0]?.toISOString(),
    toDate: dateRange?.[1]?.toISOString(),
  });
  useEffect(() => {
    if (data?.data?.recharges) {
      setExcelData(data.data.recharges);
    }
  }, [data]);

  const total = data?.data?.total || 0;
  const totalPages = data?.data?.totalPages || 1;

  const navigate = useNavigate();
  const handleView = (id) => {
    navigate(`/dashboard/user-management/profile-view?id=${id}`);
  };
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) setPage(newPage);
  };

  if (isLoading) return <TableSkeleton rows={8} cols={11} />;
  if (error) return <div className="tw-p-4 tw-text-fg-tertiary">Error fetching recharge data: {error.message}</div>;

  return (
    <div className="tw-overflow-x-auto">
      <Table>
        <THead>
          <TR>
            <Th>Sr. No</Th>
            <Th>Transaction ID</Th>
            <Th>Payment ID</Th>
            <Th>Name</Th>
            <Th>Recharge Amount</Th>
            <Th>Net Recharge</Th>
            <Th>GST (Rs.)</Th>
            <Th>Country</Th>
            <Th>State</Th>
            <Th>Transaction Status</Th>
            <Th>Transaction Date</Th>
          </TR>
        </THead>
        <TBody>
          {data?.data?.recharges.map((recharge, index) => (
            <TR key={recharge.id} isLast={index === data.data.recharges.length - 1}>
              <Td>
                {page && pageSize !== "all"
                  ? (page - 1) * pageSize + index + 1
                  : index + 1}
              </Td>
              <Td className="tw-font-mono tw-text-[12px]">{recharge.transaction_id}</Td>
              <Td className="tw-font-mono tw-text-[12px]">{recharge.razorpay_payment_id || 'N/A'}</Td>
              <Td>
                <span
                  onClick={() => handleView(recharge?.user_id)}
                  className="tw-text-fg-primary tw-font-medium tw-cursor-pointer hover:tw-underline"
                >
                  {recharge.name}
                </span>
              </Td>
              <Td className="tw-font-medium">Rs.{recharge.recharge_amount}</Td>
              <Td>Rs.{recharge.net_recharge}</Td>
              <Td className="tw-text-fg-secondary">Rs.{recharge.gst_amount}</Td>
              <Td>{recharge.country}</Td>
              <Td>{recharge.state}</Td>
              <Td>
                {recharge.status === "pending" || recharge.status === "failed" ? (
                  <Pill tone="danger">{recharge.status?.toUpperCase()}</Pill>
                ) : (
                  <Pill tone="success">{recharge.status?.toUpperCase()}</Pill>
                )}
              </Td>
              <Td>
                <div className="tw-text-fg-primary tw-text-[12px]">
                  {moment(recharge.transaction_date).format("DD/MM/YYYY")}
                </div>
                <div className="tw-text-fg-tertiary tw-text-[11px]">
                  {moment(recharge.transaction_date).format("hh:mm A")}
                </div>
              </Td>
            </TR>
          ))}
        </TBody>
      </Table>
      <Pagination
        page={page}
        totalPages={totalPages}
        totalRecords={total}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSize={(v) => { setPageSize(v); setPage(1); }}
      />
    </div>
  );
}

export default RechargeTable;
