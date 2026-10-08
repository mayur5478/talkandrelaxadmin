import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Banknote, UserCog, Plus } from "lucide-react";
import { Card, Button, Table, THead, TBody, TR, Th, Td, TableSkeleton, Pill, ErrorBanner, EmptyState } from "../v2/ui";
import { useListCyclesQuery, usePrepareCycleMutation } from "../../services/payout";
import { STATUS_LABEL, statusTone, windowLabel, errorMessage } from "./payoutFormat";

export function NotEnabled() {
  return (
    <EmptyState
      icon={<Banknote size={20} />}
      title="Payouts are not switched on for this server yet"
      description="Set PAYOUT_ADMIN_ENABLED=true on the backend once the payout migrations have been applied."
    />
  );
}

export default function PayoutCycles() {
  const navigate = useNavigate();
  const { data, isLoading, error } = useListCyclesQuery();
  const [prepare, { isLoading: isPreparing }] = usePrepareCycleMutation();
  const [prepError, setPrepError] = useState("");

  const onPrepare = async () => {
    setPrepError("");
    try {
      const out = await prepare({ stateCode: "*" }).unwrap();
      navigate(`/dashboard/payout/cycle/${out.cycleId}`);
    } catch (e) {
      setPrepError(errorMessage(e, "Could not prepare the cycle"));
    }
  };

  if (error && errorMessage(error) === "NOT_ENABLED") return <NotEnabled />;
  const cycles = (data && data.cycles) || [];

  return (
    <div className="tw-flex tw-flex-col tw-gap-4 tw-text-left">
      <div className="tw-flex tw-items-center tw-justify-between tw-flex-wrap tw-gap-3">
        <div>
          <h1 className="tw-text-h1 tw-text-fg-primary tw-m-0">Payouts</h1>
          <p className="tw-text-small tw-text-fg-tertiary tw-mt-1 tw-mb-0">
            Listener payout cycles. Someone prepares, a different person approves, then the bank file is generated.
          </p>
        </div>
        <div className="tw-flex tw-gap-2">
          <Link to="/dashboard/payout/profiles">
            <Button variant="outline"><UserCog size={14} className="tw-mr-1" />Payout profiles</Button>
          </Link>
          <Button onClick={onPrepare} disabled={isPreparing}>
            <Plus size={14} className="tw-mr-1" />{isPreparing ? "Preparing…" : "Prepare latest cycle"}
          </Button>
        </div>
      </div>

      {prepError && <ErrorBanner title="Could not prepare the cycle" message={prepError} />}
      {error && errorMessage(error) !== "NOT_ENABLED" && <ErrorBanner title="Could not load cycles" message={errorMessage(error)} />}

      <Card flush>
        {isLoading ? (
          <TableSkeleton rows={6} cols={6} />
        ) : (
          <Table>
            <THead>
              <TR>
                <Th>Cycle</Th><Th>Window (IST)</Th><Th>Status</Th><Th>Version</Th><Th>Prepared by</Th><Th>Approved by</Th>
              </TR>
            </THead>
            <TBody>
              {cycles.length === 0 ? (
                <TR><Td colSpan={6} className="tw-text-center tw-text-fg-tertiary">No cycles yet. Press “Prepare latest cycle”.</Td></TR>
              ) : (
                cycles.map((c, i) => (
                  <TR key={c.id} isLast={i === cycles.length - 1} className="tw-cursor-pointer" onClick={() => navigate(`/dashboard/payout/cycle/${c.id}`)}>
                    <Td className="tw-text-fg-primary tw-font-medium">
                      {c.key}{c.adjustsCycleId ? <span className="tw-text-fg-tertiary"> (adjusts #{c.adjustsCycleId})</span> : null}
                    </Td>
                    <Td>{windowLabel(c.windowStartMs, c.windowEndMs)}</Td>
                    <Td><Pill tone={statusTone(c.status)} dot>{STATUS_LABEL[c.status] || c.status}</Pill></Td>
                    <Td>{c.currentVersion || "—"}</Td>
                    <Td>{c.preparedBy || "—"}</Td>
                    <Td>{c.approvedBy || "—"}</Td>
                  </TR>
                ))
              )}
            </TBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
