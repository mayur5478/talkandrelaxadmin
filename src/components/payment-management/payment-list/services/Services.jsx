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
import { classifySessionEndReason } from "../../../../utils/sessionEndReasons";

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
const END_REASON_BADGE_META = {
  danger:  [ShieldOff,    "tw-text-fg-danger   tw-bg-fg-danger/10   tw-border-fg-danger/20"],
  warning: [WifiOff,      "tw-text-fg-warning  tw-bg-fg-warning/10  tw-border-fg-warning/20"],
  info:    [UserX,        "tw-text-fg-info     tw-bg-fg-info/10     tw-border-fg-info/20"],
  success: [CheckCircle2, "tw-text-fg-success  tw-bg-fg-success/10  tw-border-fg-success/20"],
  neutral: [Clock,        "tw-text-fg-tertiary tw-bg-bg-secondary   tw-border-tertiary"],
  unknown: [AlertCircle,  "tw-text-fg-secondary tw-bg-bg-secondary  tw-border-tertiary"],
};

const END_REASON_ICON_OVERRIDES = {
  "Listener ended": HeadphonesIcon,
  "Low balance": Wallet,
  "Client watchdog": AlertCircle,
  "Connection failed": WifiOff,
  "Failed": AlertCircle,
};

function EndReasonBadge({ raw }) {
  if (!raw) return <span className="tw-text-[11px] tw-text-fg-tertiary">-</span>;

  const reason = classifySessionEndReason(raw);
  const badgeMeta = END_REASON_BADGE_META[reason.tone] || END_REASON_BADGE_META.unknown;
  const Icon = END_REASON_ICON_OVERRIDES[reason.label] || badgeMeta[0];
  const colourCls = badgeMeta[1];

  return (
    <span
      title={reason.raw}
      className={`tw-inline-flex tw-items-center tw-gap-1 tw-px-2 tw-py-0.5 tw-rounded-full tw-border tw-border-hairline tw-text-[11px] tw-font-medium tw-whitespace-nowrap ${colourCls}`}
    >
      <Icon size={10} aria-hidden className="tw-shrink-0" />
      {reason.label}
    </span>
  );
}

function Services({ searchUser, searchListener, dateRange, setExcelSessionData, onRefetch }) {
  const [page,     setPage]     = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [nowTs,    setNowTs]    = useState(() => Date.now());
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
    if (data?.data) setExcelSessionData(data.data);
  }, [data]);
  useEffect(() => {
    const timer = setInterval(() => setNowTs(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  const getDisplayDuration = (session) => {
    const apiDuration = Number(session?.totalDuration || 0);
    if (session?.transaction_status !== "active") return apiDuration;

    const startedAt = moment(session?.createdAt);
    if (!startedAt.isValid()) return apiDuration;

    // Live rows may have stale DB duration until close; derive a realtime fallback from start time.
    const elapsedMinutes = Math.max(1, Math.floor((nowTs - startedAt.valueOf()) / 60000));
    return Math.max(apiDuration, elapsedMinutes);
  };

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
                <Td align="right" className="tw-tabular-nums">{getDisplayDuration(s)}</Td>

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
