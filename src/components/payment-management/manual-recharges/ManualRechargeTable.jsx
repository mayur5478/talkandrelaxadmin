import React, { useState, useEffect } from "react";
import { useGetManualAdjustmentsQuery } from "../../../services/recharge";
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
  Spinner,
} from "../../v2/ui";

const ManualRechargeTable = ({ searchTerm, fromDate, toDate, setExcelData }) => {
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { data, isLoading, isError } = useGetManualAdjustmentsQuery({
    page,
    pageSize,
  });

  useEffect(() => {
    if (data?.data) {
      setExcelData(data.data);
    }
  }, [data, setExcelData]);

  if (isLoading) {
    return <TableSkeleton rows={8} cols={7} />;
  }

  if (isError) {
    return (
      <div className="tw-text-center tw-py-8 tw-text-fg-tertiary">
        Error loading manual recharge records. Please try again later.
      </div>
    );
  }

  const adjustments = data?.data || [];
  const pagination = data?.pagination || { totalPages: 1 };

  const filteredData = adjustments.filter((item) => {
    const fullName = item?.userData?.fullName?.toLowerCase() || "";
    const reason = item?.reason?.toLowerCase() || "";
    const search = searchTerm.toLowerCase();

    const matchesSearch = fullName.includes(search) || reason.includes(search);

    let matchesDate = true;
    if (fromDate && toDate) {
      const itemDate = new Date(item.createdAt);
      matchesDate = itemDate >= new Date(fromDate) && itemDate <= new Date(toDate);
    }

    return matchesSearch && matchesDate;
  });

  return (
    <>
      <div className="tw-overflow-x-auto">
        <Table>
          <THead>
            <TR>
              <Th>User / Listener</Th>
              <Th>Role</Th>
              <Th>Amount</Th>
              <Th>Type</Th>
              <Th>Reason</Th>
              <Th>Processing Admin</Th>
              <Th>Date</Th>
            </TR>
          </THead>
          <TBody>
            {filteredData.length > 0 ? (
              filteredData.map((item, index) => (
                <TR key={item.id} isLast={index === filteredData.length - 1}>
                  <Td>
                    <div className="tw-font-medium tw-text-fg-primary">{item?.userData?.fullName || "N/A"}</div>
                    <div className="tw-text-[12px] tw-text-fg-tertiary">{item?.userData?.mobile_number || "No Phone"}</div>
                  </Td>
                  <Td>
                    <Pill tone={item?.userData?.role === 'listener' ? 'info' : 'neutral'}>
                      {item?.userData?.role || 'N/A'}
                    </Pill>
                  </Td>
                  <Td>
                    <span className={item.type === "credit" ? "tw-text-success tw-font-semibold" : "tw-text-danger tw-font-semibold"}>
                      {item.type === "credit" ? "+" : "-"} Rs.{item.amount || 0}
                    </span>
                  </Td>
                  <Td>
                    <Pill tone={item.type === "credit" ? "success" : "danger"}>
                      {item.type?.toUpperCase()}
                    </Pill>
                  </Td>
                  <Td>
                    <div className="tw-text-fg-secondary tw-max-w-[250px] tw-truncate" title={item.reason}>
                      {item.reason || "Manual adjustment"}
                    </div>
                  </Td>
                  <Td>
                    <span className="tw-text-fg-tertiary tw-text-[12px]">{item.admin_id || "System"}</span>
                  </Td>
                  <Td>
                    <div className="tw-text-fg-primary tw-text-[12px]">
                      {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "N/A"}
                    </div>
                    <div className="tw-text-fg-tertiary tw-text-[11px]">
                      {item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                    </div>
                  </Td>
                </TR>
              ))
            ) : (
              <TR>
                <Td colSpan={7} className="tw-text-center tw-text-fg-tertiary tw-py-8">
                  No records found matching your criteria.
                </Td>
              </TR>
            )}
          </TBody>
        </Table>
      </div>

      {pagination.totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={pagination.totalPages}
          totalRecords={pagination.totalRecords || filteredData.length}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSize={() => {}}
        />
      )}
    </>
  );
};

export default ManualRechargeTable;
