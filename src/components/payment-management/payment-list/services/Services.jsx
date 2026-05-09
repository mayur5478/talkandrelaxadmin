import React, { useEffect, useState } from "react";
import {
  ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight,
  Trash2, XCircle,
  UserX, HeadphonesIcon, Clock, ShieldOff, WifiOff,
  Wallet, AlertCircle, CheckCircle2,
} from "lucide-react";
import { motion } from "framer-motion";
import { useSessionListQuery } from "../../../../services/listener";
import moment from "moment";
import { useNavigate } from "react-router-dom";
import ForceEndModal from "../../../common/force-end/ForceEndModal.jsx";
import {
  Table, THead, TBody, TR, Th, Td,
  Pill, Spinner, ErrorBanner,
} from "../../../v2/ui";

const selectCls =
  "tw-bg-bg-secondary tw-text-fg-primary tw-text-[12px] " +
  "tw-border tw-border-hairline tw-border-tertiary tw-rounded-md " +
  "tw-px-2 tw-py-1 tw-outline-none focus:tw-ring-2 focus:tw-ring-fg-info";

function statusTone(s) {
  if (s === "active")    return "success";
  if (s === "completed") return "info";
  if (s === "failed")    return "danger";
  return "neutral";
}

/* ─── End-reason mapping ────────────────────────────────────────────── */
// Built from actual DB values (verified 2026-05-09):
//   "ended" (12546), "Zombie session…" (1266), "It got triggered by balance" (773),
//   "Network disconnection — grace period expired" (436), "failed" (205), etc.
// Order matters — first match wins.
const END_REASON_MAP = [
  // Admin-initiated — check BEFORE generic matches
  [/force.?end|admin.?force|forced/i,                                      "Force ended",       ShieldOff,     "tw-text-fg-danger   tw-bg-fg-danger/10   tw-border-fg-danger/20"],
  [/admin.*reset|reset.*admin|global.?reset/i,                            "Admin reset",       ShieldOff,     "tw-text-fg-danger   tw-bg-fg-danger/10   tw-border-fg-danger/20"],
  [/admin/i,                                                               "Admin action",      ShieldOff,     "tw-text-fg-danger   tw-bg-fg-danger/10   tw-border-fg-danger/20"],

  // Balance / payment
  [/balance|wallet|insufficient|triggered.*balance|balance.*trigger/i,    "Low balance",       Wallet,        "tw-text-fg-danger   tw-bg-fg-danger/10   tw-border-fg-danger/20"],

  // Zombie / stale / janitor / ghost — before "network" so "Zombie" doesn't fall through
  [/zombie|stale|janitor|ghost|abandoned|healed/i,                        "Stale session",     Clock,         "tw-text-fg-tertiary tw-bg-bg-secondary   tw-border-tertiary"],

  // Network drops
  [/network|internet|disconnect|transport.?clos|ping.?timeout|grace/i,    "Network drop",      WifiOff,       "tw-text-fg-warning  tw-bg-fg-warning/10  tw-border-fg-warning/20"],

  // User / listener explicitly ended — "User pressed End", "user ended", etc.
  [/user.*end|user.*left|user.*hung|user.*press/i,                        "User ended",        UserX,         "tw-text-fg-info     tw-bg-fg-info/10     tw-border-fg-info/20"],
  [/listener.*end|listener.*left|listener.*hung/i,                        "Listener ended",    HeadphonesIcon,"tw-text-fg-warning  tw-bg-fg-warning/10  tw-border-fg-warning/20"],

  // Zego / connection never confirmed
  [/zego|never.?confirm|not.?confirm/i,                                   "Connection failed", WifiOff,       "tw-text-fg-warning  tw-bg-fg-warning/10  tw-border-fg-warning/20"],

  // Inactivity / timeout
  [/timeout|time.?out|inactiv/i,                                          "Timed out",         Clock,         "tw-text-fg-tertiary tw-bg-bg-secondary   tw-border-tertiary"],

  // Failed (billing / session start failure)
  [/^failed$/i,                                                           "Failed",            AlertCircle,   "tw-text-fg-danger   tw-bg-fg-danger/10   tw-border-fg-danger/20"],

  // Normal end — "ended", "Manual end", "completed", "success"
  [/^ended$|manual|complet|success/i,                                     "Completed",         CheckCircle2,  "tw-text-fg-success  tw-bg-fg-success/10  tw-border-fg-success/20"],
];

function EndReasonBadge({ raw }) {
  if (!raw) return <span className="tw-text-[11px] tw-text-fg-tertiary">—</span>;

  const match = END_REASON_MAP.find(([rx]) => rx.test(raw));
  if (match) {
    const [, label, Icon, colourCls] = match;
    return (
      <span
        title={raw}
        className={`tw-inline-flex tw-items-center tw-gap-1 tw-px-2 tw-py-0.5 tw-rounded-full tw-border tw-border-hairline tw-text-[11px] tw-font-medium tw-whitespace-nowrap ${colourCls}`}
      >
        <Icon size={10} aria-hidden className="tw-shrink-0" />
        {label}
      </span>
    );
  }

  // Unknown reason — show raw text truncated with full text on hover
  return (
    <span
      title={raw}
      className="tw-inline-flex tw-items-center tw-gap-1 tw-px-2 tw-py-0.5 tw-rounded-full tw-border tw-border-hairline tw-border-tertiary tw-text-[11px] tw-font-medium tw-text-fg-secondary tw-bg-bg-secondary tw-max-w-[150px] tw-truncate"
    >
      <AlertCircle size={10} aria-hidden className="tw-shrink-0 tw-text-fg-tertiary" />
      {raw}
    </span>
  );
}

function Services({ searchUser, searchListener, dateRange, setExcelSessionData, onRefetch }) {
  const [page,     setPage]     = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showForceEndModal, setShowForceEndModal] = useState(false);
  const [forceEndTarget,    setForceEndTarget]    = useState({ id: "", name: "", userId: "" });
  const navigate = useNavigate();

  const { data, error, isLoading, refetch } = useSessionListQuery({
    page,
    limit: pageSize,
    searchUser:     searchUser?.trim()     || "",
    searchListener: searchListener?.trim() || "",
    fromDate: dateRange[0]?.toISOString(),
    toDate:   dateRange[1]?.toISOString(),
  });

  useEffect(() => { if (onRefetch) onRefetch.current = refetch; }, [refetch, onRefetch]);
  useEffect(() => {
    if (data?.data) {
      setExcelSessionData(data.data);
      if (data.data[0]) console.log('[Sessions] end_reason sample:', data.data[0].end_reason, '| all keys:', Object.keys(data.data[0]));
    }
  }, [data]);

  if (isLoading) return (
    <div className="tw-flex tw-items-center tw-justify-center tw-gap-2 tw-py-16 tw-text-fg-tertiary tw-text-[13px]">
      <Spinner size={18} className="tw-text-fg-info" /> Loading sessions…
    </div>
  );
  if (error) return (
    <div className="tw-p-4">
      <ErrorBanner title="Failed to load sessions" message={error?.message || "Please try again."} />
    </div>
  );

  const sessions = data?.data || [];
  const total    = data?.total || 0;
  const totalPages = pageSize === "all" ? 1 : Math.ceil(total / Number(pageSize));
  const from = pageSize === "all" ? 1 : (page - 1) * Number(pageSize) + 1;
  const to   = pageSize === "all" ? total : Math.min(page * Number(pageSize), total);

  return (
    <div className="tw-flex tw-flex-col">
      {/* Table */}
      <div className="tw-overflow-x-auto">
        <Table>
          <THead>
            <TR>
              <Th className="tw-pl-4 tw-w-10">#</Th>
              <Th>Date</Th>
              <Th>Status</Th>
              <Th>Type</Th>
              <Th>User</Th>
              <Th>Listener</Th>
              <Th align="right">Min</Th>
              <Th align="right">Total Amt</Th>
              <Th align="right">Net Amt</Th>
              <Th align="right">Admin Amt</Th>
              <Th align="right">U. Wallet</Th>
              <Th>End Reason</Th>
              <Th className="tw-text-center tw-pr-4">Action</Th>
            </TR>
          </THead>
          <TBody>
            {sessions.length === 0 ? (
              <TR isLast>
                <Td colSpan={12} className="tw-text-center tw-py-12 tw-text-fg-tertiary">
                  No sessions found.
                </Td>
              </TR>
            ) : sessions.map((s, index) => (
              <TR key={s.id} isLast={index === sessions.length - 1}>
                {/* # */}
                <Td className="tw-pl-4 tw-text-fg-tertiary tw-tabular-nums">
                  {pageSize !== "all" ? (page - 1) * Number(pageSize) + index + 1 : index + 1}
                </Td>

                {/* Date */}
                <Td className="tw-whitespace-nowrap tw-text-[11px]">
                  {moment(s.createdAt).format("DD/MM/YY, hh:mm A")}
                </Td>

                {/* Status */}
                <Td>
                  {s.transaction_status === "active" ? (
                    <span className="tw-flex tw-items-center tw-gap-1.5 tw-text-[12px] tw-font-semibold tw-text-fg-success">
                      <span
                        className="tw-w-2 tw-h-2 tw-rounded-full tw-bg-fg-success tw-shrink-0"
                        style={{ animation: "pulse 2s cubic-bezier(.4,0,.6,1) infinite" }}
                      />
                      LIVE
                    </span>
                  ) : (
                    <Pill tone={statusTone(s.transaction_status)} className="tw-capitalize">
                      {s.transaction_status}
                    </Pill>
                  )}
                </Td>

                {/* Type */}
                <Td className="tw-capitalize">{s.service_type}</Td>

                {/* User */}
                <Td>
                  <button
                    type="button"
                    onClick={() => navigate(`/dashboard/user-management/profile-view?id=${s.userId}`)}
                    className="tw-bg-transparent tw-border-0 tw-p-0 tw-text-fg-info tw-text-[12px] tw-font-medium hover:tw-underline tw-cursor-pointer tw-text-left"
                  >
                    {s.username}
                  </button>
                </Td>

                {/* Listener */}
                <Td>
                  <button
                    type="button"
                    onClick={() => navigate(`/dashboard/listener-management/profile-view?id=${s.listenerId}`)}
                    className="tw-bg-transparent tw-border-0 tw-p-0 tw-text-fg-info tw-text-[12px] tw-font-medium hover:tw-underline tw-cursor-pointer tw-text-left"
                  >
                    {s.listenerName}
                  </button>
                </Td>

                {/* Duration */}
                <Td align="right" className="tw-tabular-nums">{s.totalDuration}</Td>

                {/* Total Amount */}
                <Td align="right" className="tw-tabular-nums tw-font-medium tw-text-fg-primary">
                  ₹{parseFloat(s.total_amount || 0).toFixed(2)}
                </Td>

                {/* Net Amt (listener_credit) */}
                <Td align="right" className="tw-tabular-nums">
                  ₹{parseFloat(s.listener_credit || 0).toFixed(2)}
                </Td>

                {/* Admin Amt */}
                <Td align="right" className="tw-tabular-nums">
                  ₹{parseFloat(s.admin_credit || 0).toFixed(2)}
                </Td>

                {/* User wallet balance */}
                <Td align="right" className="tw-tabular-nums tw-font-semibold tw-text-fg-success">
                  ₹{parseFloat(s.user_wallet_balance || 0).toFixed(2)}
                </Td>

                {/* End Reason — backend Sessions.reason aliased as end_reason */}
                <Td>
                  <EndReasonBadge raw={s.end_reason || null} />
                </Td>

                {/* Actions */}
                <Td className="tw-pr-4">
                  <div className="tw-flex tw-items-center tw-justify-center tw-gap-2">
                    <button
                      type="button"
                      className="tw-bg-transparent tw-border-0 tw-p-1 tw-rounded-md tw-text-fg-tertiary hover:tw-text-fg-danger hover:tw-bg-bg-danger tw-transition-colors tw-duration-fast tw-cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 size={14} aria-hidden />
                    </button>
                    {s.transaction_status === "active" && (
                      <button
                        type="button"
                        onClick={() => {
                          setForceEndTarget({ id: s.id, name: s.username, userId: s.userId });
                          setShowForceEndModal(true);
                        }}
                        className="tw-bg-transparent tw-border-0 tw-p-1 tw-rounded-md tw-text-fg-warning hover:tw-bg-bg-warning tw-transition-colors tw-duration-fast tw-cursor-pointer"
                        title="Force End Session"
                      >
                        <XCircle size={14} aria-hidden />
                      </button>
                    )}
                  </div>
                </Td>
              </TR>
            ))}
          </TBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="tw-flex tw-items-center tw-justify-between tw-px-4 tw-py-3 tw-border-t tw-border-hairline tw-border-tertiary tw-gap-4 tw-flex-wrap">
        {/* Page size */}
        <div className="tw-flex tw-items-center tw-gap-2">
          <span className="tw-text-[12px] tw-text-fg-tertiary">Rows:</span>
          <select
            className={selectCls}
            value={pageSize}
            onChange={(e) => { setPageSize(e.target.value); setPage(1); }}
          >
            {["5","10","25","50","100","200","all"].map(v => (
              <option key={v} value={v}>{v === "all" ? "All" : v}</option>
            ))}
          </select>
        </div>

        {/* Count + nav */}
        <div className="tw-flex tw-items-center tw-gap-3">
          <span className="tw-text-[12px] tw-text-fg-tertiary tw-tabular-nums">
            {from}–{to} of {total}
          </span>
          <div className="tw-flex tw-items-center tw-gap-1">
            {[
              { icon: ChevronsLeft,  label: "First",    fn: () => setPage(1),                    disabled: page <= 1 },
              { icon: ChevronLeft,   label: "Prev",     fn: () => setPage(p => Math.max(p-1,1)),  disabled: page <= 1 },
              { icon: ChevronRight,  label: "Next",     fn: () => setPage(p => Math.min(p+1,totalPages)), disabled: page >= totalPages },
              { icon: ChevronsRight, label: "Last",     fn: () => setPage(totalPages),             disabled: page >= totalPages },
            ].map(({ icon: Icon, label, fn, disabled }) => (
              <button
                key={label}
                type="button"
                aria-label={label}
                onClick={fn}
                disabled={disabled}
                className="tw-bg-transparent tw-border-0 tw-p-1 tw-rounded-md tw-text-fg-secondary hover:tw-bg-bg-secondary disabled:tw-opacity-30 disabled:tw-cursor-not-allowed tw-transition-colors tw-duration-fast tw-cursor-pointer"
              >
                <Icon size={15} aria-hidden />
              </button>
            ))}
          </div>
        </div>
      </div>

      <ForceEndModal
        show={showForceEndModal}
        handleClose={() => setShowForceEndModal(false)}
        userId={forceEndTarget.userId}
        userName={forceEndTarget.name}
        refetch={refetch}
      />
    </div>
  );
}

export default Services;
