import React, { useState, useEffect } from "react";
import "./rejections.scss";
import { useGetSessionRejectionsQuery } from "../../../../services/auth";
import moment from "moment";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import {
  Table,
  THead,
  TBody,
  TR,
  Th,
  Td,
  TableSkeleton,
  Pagination,
} from "../../../v2/ui";

function Rejections({ fromDate, toDate }) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const navigate = useNavigate();

  useEffect(() => {
    setPage(1);
  }, [fromDate, toDate, search, typeFilter]);

  const { data, error, isLoading } = useGetSessionRejectionsQuery({
    page,
    limit: pageSize,
    fromDate: fromDate?.toISOString(),
    toDate: toDate?.toISOString(),
    search: search || undefined,
    type: typeFilter,
  });

  const handleViewUser = (id) => {
    navigate(`/dashboard/user-management/profile-view?id=${id}`);
  };

  const handleViewListener = (id) => {
    navigate(`/dashboard/listener-management/profile-view?id=${id}`);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearch(searchInput.trim());
  };

  if (isLoading) return <TableSkeleton rows={8} cols={8} />;
  if (error) return <div className="tw-p-4 tw-text-fg-tertiary">Error fetching rejections: {error.message}</div>;

  const total = data?.pagination?.total || 0;
  const rejections = data?.data || [];

  return (
    <div className="tw-flex tw-flex-col tw-gap-3">
      {/* Filters */}
      <div className="tw-flex tw-items-center tw-gap-2 tw-flex-wrap">
        <form onSubmit={handleSearchSubmit} className="tw-flex tw-gap-2">
          <div className="tw-relative">
            <Search size={14} className="tw-absolute tw-left-3 tw-top-1/2 -tw-translate-y-1/2 tw-text-fg-tertiary" />
            <input
              type="text"
              placeholder="Search user or listener..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="tw-h-8 tw-pl-9 tw-pr-3 tw-text-[13px] tw-bg-bg-primary tw-text-fg-primary tw-border tw-border-hairline tw-border-tertiary tw-rounded-md tw-outline-none focus:tw-ring-2 focus:tw-ring-fg-info placeholder:tw-text-fg-tertiary tw-min-w-[220px]"
            />
          </div>
          <button type="submit" className="tw-h-8 tw-px-3 tw-text-[13px] tw-bg-bg-secondary tw-text-fg-primary tw-border tw-border-tertiary tw-rounded-md hover:tw-bg-bg-primary">
            Search
          </button>
          {search && (
            <button
              type="button"
              className="tw-h-8 tw-px-3 tw-text-[13px] tw-bg-bg-primary tw-text-fg-secondary tw-border tw-border-tertiary tw-rounded-md"
              onClick={() => { setSearch(""); setSearchInput(""); }}
            >
              Clear
            </button>
          )}
        </form>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="tw-h-8 tw-px-3 tw-text-[13px] tw-bg-bg-primary tw-text-fg-primary tw-border tw-border-tertiary tw-rounded-md tw-outline-none tw-min-w-[130px]"
        >
          <option value="all">All Types</option>
          <option value="audio">Audio</option>
          <option value="video">Video</option>
          <option value="chat">Chat</option>
        </select>
      </div>

      <div className="tw-overflow-x-auto">
        <Table>
          <THead>
            <TR>
              <Th>Sr#</Th>
              <Th>Date</Th>
              <Th>Type</Th>
              <Th>User</Th>
              <Th>Listener</Th>
              <Th>By</Th>
              <Th>Reason</Th>
              <Th>Request ID</Th>
            </TR>
          </THead>
          <TBody>
            {rejections.length === 0 ? (
              <TR>
                <Td colSpan={8} className="tw-text-center tw-text-fg-tertiary">No rejections found</Td>
              </TR>
            ) : (
              rejections.map((r, index) => (
                <TR key={r.id} isLast={index === rejections.length - 1}>
                  <Td>{(page - 1) * pageSize + index + 1}</Td>
                  <Td>{moment(r.rejectedAt).format("DD/MM/YYYY, hh:mm A")}</Td>
                  <Td>{r.type}</Td>
                  <Td>
                    <span
                      onClick={() => handleViewUser(r.userId)}
                      className="tw-text-fg-primary tw-font-medium tw-cursor-pointer hover:tw-underline"
                    >
                      {r.userData?.fullName || "Unknown"}
                    </span>
                  </Td>
                  <Td>
                    <span
                      onClick={() => handleViewListener(r.listenerId)}
                      className="tw-text-fg-primary tw-font-medium tw-cursor-pointer hover:tw-underline"
                    >
                      {r.listenerData?.fullName || "Listener"}
                    </span>
                  </Td>
                  <Td>{r.rejectedBy}</Td>
                  <Td>{r.reason}</Td>
                  <Td className="tw-font-mono tw-text-[12px]">{r.requestId || "N/A"}</Td>
                </TR>
              ))
            )}
          </TBody>
        </Table>
      </div>
      <Pagination
        page={page}
        totalPages={Math.ceil(total / pageSize)}
        totalRecords={total}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSize={(v) => { setPageSize(v); setPage(1); }}
      />
    </div>
  );
}

export default Rejections;
