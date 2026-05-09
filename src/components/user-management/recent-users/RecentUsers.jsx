import React, { useState, useEffect } from "react";
import {
  Card,
  Button,
  IconButton,
  Table,
  THead,
  TBody,
  TR,
  Th,
  Td,
  TableSkeleton,
  Pagination,
} from "../../v2/ui";
import { Search, Eye } from "lucide-react";
import DatePicker from "../user-list/date-picker/DatePicker";
import "./recentUsers.scss";
import { useRecentUserListQuery } from "../../../services/user";
import moment from "moment";
import { useNavigate } from "react-router-dom";
import ResetStateModal from "../../common/reset-state/ResetStateModal";

function RecentUsers() {
  const [searchParams, setSearchParams] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetTarget, setResetTarget] = useState({ id: "", name: "" });

  const handleResetStateClick = (id, name) => {
    setResetTarget({ id, name });
    setShowResetModal(true);
  };

  const { data, error, isLoading } = useRecentUserListQuery({
    page,
    pageSize,
    searchParams: searchParams ? searchParams : "",
    date: selectedDate ? selectedDate.toISOString().split("T")[0] : "",
  });
  const navigate = useNavigate();
  useEffect(() => {
    if (error) {
      console.error("Error fetching data:", error);
    }
  }, [error]);

  const handleSearchChange = (e) => {
    setSearchParams(e.target.value);
    setPage(1);
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    setPage(1);
  };

  const handleView = (id) => {
    navigate(`/dashboard/user-management/profile-view?id=${id}`);
  };

  return (
    <div className="tw-flex tw-flex-col tw-gap-4">
      {/* Page header */}
      <div className="tw-flex tw-items-center tw-justify-between tw-flex-wrap tw-gap-3">
        <div>
          <h1 className="tw-text-h1 tw-text-fg-primary tw-m-0">Recent Users</h1>
          <p className="tw-text-small tw-text-fg-tertiary tw-mt-1 tw-mb-0">Users with recent recharge activity</p>
        </div>
        <div className="tw-flex tw-items-center tw-gap-2">
          <DatePicker onChange={handleDateChange} />
        </div>
      </div>

      {/* Toolbar */}
      <div className="tw-flex tw-items-center tw-gap-2 tw-flex-wrap">
        <div className="tw-relative tw-flex-1 tw-min-w-[200px] tw-max-w-xs">
          <Search size={14} className="tw-absolute tw-left-3 tw-top-1/2 -tw-translate-y-1/2 tw-text-fg-tertiary" />
          <input
            type="text"
            placeholder="Search User"
            value={searchParams}
            onChange={handleSearchChange}
            className="tw-w-full tw-h-8 tw-pl-9 tw-pr-3 tw-text-[13px] tw-bg-bg-primary tw-text-fg-primary tw-border tw-border-hairline tw-border-tertiary tw-rounded-md tw-outline-none focus:tw-ring-2 focus:tw-ring-fg-info placeholder:tw-text-fg-tertiary"
          />
        </div>
      </div>

      {/* Table card */}
      <Card flush>
        {isLoading ? (
          <TableSkeleton rows={8} cols={7} />
        ) : (
          <>
            <Table>
              <THead>
                <TR>
                  <Th>Sr. No</Th>
                  <Th>Full Name</Th>
                  <Th>Wallet Balance</Th>
                  <Th>Recharge Amount</Th>
                  <Th>Gift Amount</Th>
                  <Th>Recharge Date</Th>
                  <Th>Action</Th>
                </TR>
              </THead>
              <TBody>
                {error ? (
                  <TR>
                    <Td colSpan={7} className="tw-text-center tw-text-fg-tertiary">Error fetching data</Td>
                  </TR>
                ) : (
                  data?.data?.users?.map((user, index) => (
                    <TR key={user?.id} isLast={index === (data?.data?.users?.length - 1)}>
                      <Td>{(page - 1) * pageSize + index + 1}</Td>
                      <Td className="tw-text-fg-primary tw-font-medium">{user.fullName}</Td>
                      <Td>{user.wallet_balance}</Td>
                      <Td>{user.totalRechargeAmount || 0.0}</Td>
                      <Td>{user.totalGiftAmount || 0.0}</Td>
                      <Td>
                        {user.firstRechargeDate === null
                          ? "-"
                          : moment(user.firstRechargeDate).format("DD/MM/YYYY, hh:mm A")}
                      </Td>
                      <Td>
                        <div className="tw-flex tw-items-center tw-gap-1">
                          <IconButton size="sm" aria-label="View" onClick={() => handleView(user?.id)}>
                            <Eye size={14} />
                          </IconButton>
                        </div>
                      </Td>
                    </TR>
                  ))
                )}
              </TBody>
            </Table>
            <Pagination
              page={page}
              totalPages={data?.data?.pagination?.totalPages}
              totalRecords={data?.data?.pagination?.totalRecords}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSize={(v) => { setPageSize(v); setPage(1); }}
            />
          </>
        )}
      </Card>
    </div>
  );
}

export default RecentUsers;
