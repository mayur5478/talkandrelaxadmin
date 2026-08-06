import React, { useEffect, useState } from "react";
import moment from "moment";
import { useGetAppFeedbackQuery } from "../../services/appFeedback";
import { Table, THead, TBody, TR, Th, Td, TableSkeleton, Pagination } from "../v2/ui";

const SOURCE_OPTIONS = [
  { value: "all", label: "All sources" },
  { value: "topup", label: "Topup" },
  { value: "n_sessions", label: "N sessions" },
  { value: "call_end", label: "Call end" },
  { value: "chat_end", label: "Chat end" },
  { value: "listener_rating", label: "Listener rating" },
];

export default function AppFeedback() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sourceFilter, setSourceFilter] = useState("all");

  useEffect(() => {
    setPage(1);
  }, [sourceFilter, pageSize]);

  const { data, error, isLoading } = useGetAppFeedbackQuery({
    page,
    limit: pageSize,
    source_trigger: sourceFilter,
  });

  const total = data?.pagination?.total || 0;
  const rows = data?.feedback || [];

  return (
    <div className="tw-p-4">
      <div className="tw-flex tw-items-center tw-justify-between tw-mb-4">
        <h1 className="tw-text-xl tw-font-semibold tw-text-fg-primary">App Feedback</h1>
        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="tw-h-8 tw-px-3 tw-text-[13px] tw-bg-bg-primary tw-text-fg-primary tw-border tw-border-tertiary tw-rounded-md tw-outline-none tw-min-w-[150px]"
        >
          {SOURCE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <TableSkeleton rows={8} cols={6} />
      ) : error ? (
        <div className="tw-p-4 tw-text-fg-tertiary">
          Error fetching feedback: {error?.message || "unknown error"}
        </div>
      ) : (
        <>
          <div className="tw-overflow-x-auto">
            <Table>
              <THead>
                <TR>
                  <Th>Sr#</Th>
                  <Th>Date</Th>
                  <Th>Source</Th>
                  <Th>Message</Th>
                  <Th>User</Th>
                  <Th>App / Platform</Th>
                </TR>
              </THead>
              <TBody>
                {rows.length === 0 ? (
                  <TR>
                    <Td colSpan={6} className="tw-text-center tw-text-fg-tertiary">
                      No feedback found
                    </Td>
                  </TR>
                ) : (
                  rows.map((r, index) => (
                    <TR key={r.id} isLast={index === rows.length - 1}>
                      <Td>{(page - 1) * pageSize + index + 1}</Td>
                      <Td>{moment(r.createdAt).format("DD/MM/YYYY, hh:mm A")}</Td>
                      <Td>{r.source_trigger || "—"}</Td>
                      <Td className="tw-max-w-[420px] tw-whitespace-pre-wrap">{r.message}</Td>
                      <Td>{r.userId || "—"}</Td>
                      <Td>{[r.app_version, r.platform].filter(Boolean).join(" / ") || "—"}</Td>
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
            onPageSize={(v) => {
              setPageSize(v);
              setPage(1);
            }}
          />
        </>
      )}
    </div>
  );
}
