import React, { useEffect, useState } from "react";
import "./payout.scss";
import { useNavigate } from "react-router-dom";
import { usePayoutsListQuery } from "../../../../services/listener";
import {
  Table,
  THead,
  TBody,
  TR,
  Th,
  Td,
  TableSkeleton,
  IconButton,
  Pagination,
} from "../../../v2/ui";
import { Eye, PencilLine } from "lucide-react";

function Payout({ searchTerm, dateRange, setExcelData }) {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const { data, isLoading, isError } = usePayoutsListQuery({ page, limit, search: searchTerm });

  const handleNextPage = () => {
    if (data?.data?.page < data?.data?.totalPages) {
      setPage((prev) => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (page > 1) {
      setPage((prev) => prev - 1);
    }
  };

  const salarySlip = (id) => {
    navigate(`/dashboard/payment-management/salary-slip?id=${id}`);
  };

  const editSalary = (id) => {
    navigate(`/dashboard/payment-management/edit-salary?id=${id}`);
  };

  const handleView2 = (id) => {
    navigate(`/dashboard/listener-management/profile-view?id=${id}`);
  };

  if (isLoading) return <TableSkeleton rows={8} cols={7} />;
  if (isError) return <div className="tw-p-4 tw-text-fg-tertiary">Failed to load data</div>;

  return (
    <div className="tw-overflow-x-auto">
      <Table>
        <THead>
          <TR>
            <Th>Sr. No</Th>
            <Th>Transaction ID</Th>
            <Th>Listener Name</Th>
            <Th>Payout Amount</Th>
            <Th>Description</Th>
            <Th>Transaction Date</Th>
            <Th>Action</Th>
          </TR>
        </THead>
        <TBody>
          {data?.data?.payouts?.map((item, index) => (
            <TR key={item.id} isLast={index === data?.data?.payouts?.length - 1}>
              <Td>{(page - 1) * limit + index + 1}</Td>
              <Td className="tw-font-mono tw-text-[12px]">{item.transaction_id || "-"}</Td>
              <Td>
                <span
                  onClick={() => handleView2(item?.listener_id)}
                  className="tw-text-fg-primary tw-font-medium tw-cursor-pointer hover:tw-underline"
                >
                  {item.display_name || "-"}
                </span>
              </Td>
              <Td>{item.payout_amount || "-"}</Td>
              <Td>
                <div className="tw-text-[12px] tw-text-fg-secondary">
                  {`A salary of Rs. ${parseFloat(item?.net_payout_amount || 0).toFixed(2)} has been paid by the admin,`}
                  {` deducting Rs. ${(
                    parseFloat(item?.leave_penalty || 0) +
                    parseFloat(item?.missed_session_penalty || 0) +
                    parseFloat(item?.violation_penalty || 0)
                  ).toFixed(2)} penalty amount.`}
                </div>
              </Td>
              <Td>
                {item?.transaction_date ? new Date(item.transaction_date).toLocaleString() : "-"}
              </Td>
              <Td>
                <div className="tw-flex tw-items-center tw-gap-1">
                  <IconButton size="sm" aria-label="View Salary Slip" onClick={() => salarySlip(item?.id)}>
                    <Eye size={14} />
                  </IconButton>
                  <IconButton size="sm" aria-label="Edit Salary" onClick={() => editSalary(item?.id)}>
                    <PencilLine size={14} />
                  </IconButton>
                </div>
              </Td>
            </TR>
          ))}
        </TBody>
      </Table>
      <Pagination
        page={page}
        totalPages={data?.data?.totalPages}
        totalRecords={data?.data?.total}
        pageSize={limit}
        onPageChange={setPage}
        onPageSize={(v) => { setLimit(v); setPage(1); }}
      />
    </div>
  );
}

export default Payout;
