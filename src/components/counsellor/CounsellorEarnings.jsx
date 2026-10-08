import React from "react";
import { Card, Table, THead, TBody, TR, Th, Td, TableSkeleton, Pill, ErrorBanner } from "../v2/ui";
import { useGetSummaryQuery } from "../../services/counsellor";
import { formatPaise, bpsToPct, isNotEnabled, errorMessage } from "./counsellorFormat";
import { NotEnabled, PageHeader } from "./CounsellorCommon";

const KIND_LABEL = { override: "Override", bonus: "Bonus" };
const STATUS_TONE = { accrued: "warning", paid: "success" };

function Stat({ label, value, sub }) {
  return (
    <Card>
      <div className="tw-text-small tw-text-fg-tertiary">{label}</div>
      <div className="tw-text-h1 tw-text-fg-primary tw-mt-1 tw-tabular-nums">{value}</div>
      {sub ? <div className="tw-text-[11px] tw-text-fg-tertiary tw-mt-1">{sub}</div> : null}
    </Card>
  );
}

export default function CounsellorEarnings() {
  const { data, isLoading, error } = useGetSummaryQuery();

  if (isNotEnabled(error)) return <NotEnabled />;
  const accruals = (data && data.accruals) || [];
  const sum = (pred) => accruals.filter(pred).reduce((t, a) => t + (Number(a.totalPaise) || 0), 0);

  return (
    <div className="tw-flex tw-flex-col tw-gap-4 tw-text-left">
      <PageHeader title="Earnings" subtitle="Commission accrued for the Head of Counsellors: overrides on recruited counsellors and bonuses." />
      {error ? <ErrorBanner title="Could not load the summary" message={errorMessage(error)} /> : null}
      {isLoading ? <TableSkeleton rows={3} cols={4} /> : (
        <>
          <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 lg:tw-grid-cols-4 tw-gap-3">
            <Stat label="Head share" value={bpsToPct(data && data.headShareBps)} />
            <Stat label="Accrued (unpaid)" value={formatPaise(sum((a) => a.status === "accrued"))} />
            <Stat label="Paid" value={formatPaise(sum((a) => a.status === "paid"))} />
            <Stat label="Total" value={formatPaise(sum(() => true))} />
          </div>
          <Card flush>
            <Table>
              <THead>
                <TR><Th>Kind</Th><Th>Status</Th><Th>Entries</Th><Th>Total</Th></TR>
              </THead>
              <TBody>
                {accruals.length === 0 ? (
                  <TR><Td colSpan={4} className="tw-text-center tw-text-fg-tertiary">No commission accrued yet.</Td></TR>
                ) : accruals.map((a, i) => (
                  <TR key={`${a.kind}-${a.status}`} isLast={i === accruals.length - 1}>
                    <Td className="tw-text-fg-primary tw-font-medium">{KIND_LABEL[a.kind] || a.kind}</Td>
                    <Td><Pill tone={STATUS_TONE[a.status] || "neutral"} dot>{a.status}</Pill></Td>
                    <Td>{a.count}</Td>
                    <Td className="tw-tabular-nums">{formatPaise(a.totalPaise)}</Td>
                  </TR>
                ))}
              </TBody>
            </Table>
          </Card>
        </>
      )}
    </div>
  );
}
