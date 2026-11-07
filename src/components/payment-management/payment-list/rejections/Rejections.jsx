import React, { useState, useEffect, useRef } from "react";
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

  const { data, error, isLoading, isFetching } = useGetSessionRejectionsQuery({
    page,
    limit: pageSize,
    fromDate: fromDate?.toISOString(),
    toDate: toDate?.toISOString(),
    search: search || undefined,
    type: typeFilter,
  });

  // RTK Query drops to `undefined` whenever the arguments change (new page, new
  // filter), which made the whole table collapse into a skeleton on every page
  // turn — the main reason this screen *felt* slow. Hold the last good page and
  // dim it while the next one loads instead.
  const lastGood = useRef(null);
  if (data) lastGood.current = data;
  const shown = data || lastGood.current;

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

  if (isLoading && !shown) return <TableSkeleton rows={8} cols={8} />;
  if (error && !shown) return <div className="tw-p-4 tw-text-fg-tertiary">Error fetching rejections: {error.message}</div>;

  const total = shown?.pagination?.total || 0;
  const rejections = shown?.data || [];

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
        {isFetching && <span className="tw-text-[12px] tw-text-fg-tertiary">updating…</span>}
      </div>

      <div className={`tw-overflow-x-auto tw-transition-opacity ${isFetching ? "tw-opacity-60" : ""}`}>
        <Table>
          <THead>
            <TR>
              <Th>Sr#</Th>
              <Th>When</Th>
              <Th>Call</Th>
              <Th>Outcome</Th>
              <Th>Why it failed</Th>
              <Th>Request ID</Th>
            </TR>
          </THead>
          <TBody>
            {rejections.length === 0 ? (
              <TR>
                <Td colSpan={6} className="tw-text-center tw-text-fg-tertiary">No rejections found</Td>
              </TR>
            ) : (
              rejections.map((r, index) => {
                const caller = r.caller || "user"; // older backend: assume user -> listener
                const callerIsUser = caller === "user";
                const callerName = callerIsUser ? r.userData?.fullName || "Unknown" : r.listenerData?.fullName || "Listener";
                const calleeName = callerIsUser ? r.listenerData?.fullName || "Listener" : r.userData?.fullName || "Unknown";
                const openCaller = () => (callerIsUser ? handleViewUser(r.userId) : handleViewListener(r.listenerId));
                const openCallee = () => (callerIsUser ? handleViewListener(r.listenerId) : handleViewUser(r.userId));
                const c = r.cause;
                return (
                  <TR key={r.id} isLast={index === rejections.length - 1}>
                    <Td>{(page - 1) * pageSize + index + 1}</Td>
                    <Td className="tw-whitespace-nowrap">{moment(r.rejectedAt).format("DD/MM/YYYY, hh:mm A")}</Td>
                    <Td>
                      <div className="tw-flex tw-items-center tw-gap-1.5 tw-flex-wrap">
                        <span onClick={openCaller} className="tw-text-fg-primary tw-font-medium tw-cursor-pointer hover:tw-underline">
                          {callerName}
                        </span>
                        <span className="tw-text-fg-tertiary" aria-label="called">→</span>
                        <span onClick={openCallee} className="tw-text-fg-primary tw-font-medium tw-cursor-pointer hover:tw-underline">
                          {calleeName}
                        </span>
                      </div>
                      <div className="tw-text-[11px] tw-text-fg-tertiary tw-mt-0.5">
                        {callerIsUser ? "user" : "listener"} called {callerIsUser ? "listener" : "user"} · {r.type}
                      </div>
                    </Td>
                    <Td>
                      <div className="tw-capitalize">{r.reason}</div>
                      <div className="tw-text-[11px] tw-text-fg-tertiary">
                        by {r.rejectedBy}{r.ringSeconds != null ? ` · rang ${r.ringSeconds}s` : ""}
                      </div>
                    </Td>
                    <Td className="tw-max-w-[340px]">
                      {c ? (
                        <>
                          <div className="tw-flex tw-items-center tw-gap-2 tw-flex-wrap">
                            <span className={`tw-text-[13px] tw-font-medium ${c.tech ? "tw-text-red-400" : "tw-text-fg-primary"}`}>
                              {c.label}
                            </span>
                            <span
                              title={c.evidence === "recorded" ? "Stated by the server/DB" : "Estimated from timing — not recorded as a fact"}
                              className={`tw-text-[10px] tw-uppercase tw-px-1.5 tw-py-0.5 tw-rounded-full ${c.evidence === "recorded" ? "tw-bg-green-500/10 tw-text-green-400" : "tw-bg-amber-500/10 tw-text-amber-400"}`}
                            >
                              {c.evidence === "recorded" ? "recorded" : "likely"}
                            </span>
                          </div>
                          {c.detail && <div className="tw-text-[12px] tw-text-fg-tertiary tw-mt-0.5">{c.detail}</div>}
                        </>
                      ) : (
                        <span>{r.reason}</span>
                      )}
                    </Td>
                    <Td className="tw-font-mono tw-text-[12px]">{r.requestId || "N/A"}</Td>
                  </TR>
                );
              })
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
