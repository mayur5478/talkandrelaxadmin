import React, { useEffect, useState } from "react";
import { useGiftListQuery } from "../../../../services/listener";
import "./gift.scss";
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

function Gift({ searchTerm }) {
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

  const {
    data: apiData,
    error,
    isLoading,
  } = useGiftListQuery({ page, limit: pageSize, search: debouncedSearch });

  const data = apiData?.data || {};
  const gifts = data.gifts || [];
  const total = data.total || 0;
  const totalPages = data.totalPages || 1;

  const navigate = useNavigate();
  const handleView = (id) => {
    navigate(`/dashboard/user-management/profile-view?id=${id}`);
  };
  const handleView2 = (id) => {
    navigate(`/dashboard/listener-management/profile-view?id=${id}`);
  };

  if (isLoading) return <TableSkeleton rows={8} cols={14} />;
  if (error) return <div className="tw-p-4 tw-text-fg-tertiary">Error: {error.message}</div>;
  if (gifts.length === 0) return <div className="tw-p-4 tw-text-fg-tertiary">No data found</div>;

  return (
    <div className="tw-overflow-x-auto">
      <Table>
        <THead>
          <TR>
            <Th>Sr. No</Th>
            <Th>Transaction ID</Th>
            <Th>Payment ID</Th>
            <Th>User</Th>
            <Th>Listener</Th>
            <Th>Gift Status</Th>
            <Th>Gift Amount</Th>
            <Th>GST (Rs.)</Th>
            <Th>Net Amount</Th>
            <Th>Country</Th>
            <Th>State</Th>
            <Th>Admin Commission</Th>
            <Th>Transaction Status</Th>
            <Th>Transaction Date</Th>
          </TR>
        </THead>
        <TBody>
          {gifts.map((gift, index) => (
            <TR key={gift.id} isLast={index === gifts.length - 1}>
              <Td>{(page - 1) * pageSize + index + 1}</Td>
              <Td className="tw-font-mono tw-text-[12px]">{gift.razorpay_order_id}</Td>
              <Td className="tw-font-mono tw-text-[12px]">{gift.razorpay_payment_id}</Td>
              <Td>
                <span
                  onClick={() => handleView(gift?.user_id)}
                  className="tw-text-fg-primary tw-font-medium tw-cursor-pointer hover:tw-underline"
                >
                  {gift.userName}
                </span>
              </Td>
              <Td>
                <span
                  onClick={() => handleView2(gift?.listener_id)}
                  className="tw-text-fg-primary tw-font-medium tw-cursor-pointer hover:tw-underline"
                >
                  {gift.listenerName}
                </span>
              </Td>
              <Td>
                {gift.status === "success" ? (
                  <Pill tone="success">Received</Pill>
                ) : (
                  <Pill tone="warning">Pending</Pill>
                )}
              </Td>
              <Td>{gift.amount}</Td>
              <Td>{gift.gst_amount}</Td>
              <Td>{gift.net_gift_amount}</Td>
              <Td>{gift.country}</Td>
              <Td>{gift.state}</Td>
              <Td>{gift.admin_commission}</Td>
              <Td>
                {gift.status === "success" ? (
                  <Pill tone="success">{gift.status}</Pill>
                ) : (
                  <Pill tone="warning">{gift.status}</Pill>
                )}
              </Td>
              <Td>{moment(gift.transaction_date).format("DD/MM/YYYY, hh:mm A")}</Td>
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

export default Gift;
