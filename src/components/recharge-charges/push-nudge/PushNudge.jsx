import React from "react";
import { Send, Users, TrendingUp, RefreshCw } from "lucide-react";
import {
  Card,
  Button,
  Pill,
  KpiPlain,
  Table,
  THead,
  TBody,
  TR,
  Th,
  Td,
  TableSkeleton,
} from "../../v2/ui";
import { usePushNudgeSummaryQuery } from "../../../services/pushNudge";

const fmt = (d) =>
  d ? new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";

function PushNudge() {
  const { data, isLoading, isError, isFetching, refetch } = usePushNudgeSummaryQuery();

  const config = data?.config;
  const send = data?.groups?.send;
  const holdout = data?.groups?.holdout;
  const recent = data?.recent || [];

  const lift =
    send && holdout && send.users && holdout.users
      ? Number((send.conversion_pct - holdout.conversion_pct).toFixed(1))
      : null;

  return (
    <div className="tw-flex tw-flex-col tw-gap-4">
      <div className="tw-flex tw-items-center tw-justify-between tw-flex-wrap tw-gap-3">
        <div>
          <h1 className="tw-text-h1 tw-text-fg-primary tw-m-0">Push Nudge Results</h1>
          <p className="tw-text-small tw-text-fg-tertiary tw-mt-1 tw-mb-0">
            Automatic push sent ~{config?.delay_minutes ?? 120} min after signup to users who haven't recharged.
            {config
              ? config.holdout_percent > 0
                ? ` ${config.holdout_percent}% are held out (no push) to measure the real lift.`
                : " Everyone eligible gets the push (no holdout)."
              : ""}
          </p>
        </div>
        <div className="tw-flex tw-items-center tw-gap-2">
          {config && (
            <Pill tone={config.enabled ? "success" : "danger"} dot>
              {config.enabled ? "Enabled" : "Disabled"}
            </Pill>
          )}
          <Button size="sm" onClick={refetch} disabled={isFetching}>
            <RefreshCw size={14} /> Refresh
          </Button>
        </div>
      </div>

      {isError && (
        <Card className="tw-p-4 tw-text-fg-danger">Error loading push nudge results.</Card>
      )}

      <div className="tw-grid tw-gap-3 tw-grid-cols-1 sm:tw-grid-cols-2 lg:tw-grid-cols-4">
        <KpiPlain
          icon={<Send size={16} />}
          label="Pushed"
          value={send?.users ?? 0}
          sub={`${send?.delivered ?? 0} accepted by FCM`}
        />
        <KpiPlain
          icon={<Users size={16} />}
          label="Holdout (no push)"
          value={holdout?.users ?? 0}
          tone="info"
        />
        <KpiPlain
          icon={<TrendingUp size={16} />}
          label="Pushed → recharged"
          value={`${send?.conversion_pct ?? 0}%`}
          sub={`${send?.recharged_after ?? 0} of ${send?.users ?? 0}`}
          tone="success"
        />
        <KpiPlain
          icon={<TrendingUp size={16} />}
          label="Holdout → recharged"
          value={`${holdout?.conversion_pct ?? 0}%`}
          sub={
            lift == null
              ? "Need both groups for lift"
              : `Lift: ${lift > 0 ? "+" : ""}${lift} pts (small samples are noisy)`
          }
          tone="warning"
        />
      </div>

      <Card flush>
        {isLoading ? (
          <TableSkeleton rows={6} cols={6} />
        ) : (
          <Table>
            <THead>
              <TR>
                <Th>Time</Th>
                <Th>User</Th>
                <Th>Mobile</Th>
                <Th>Group</Th>
                <Th>Push</Th>
                <Th>Recharged after</Th>
              </TR>
            </THead>
            <TBody>
              {recent.length === 0 ? (
                <TR>
                  <Td colSpan={6} className="tw-text-center tw-text-fg-tertiary">
                    No users nudged yet.
                  </Td>
                </TR>
              ) : (
                recent.map((r) => (
                  <TR key={r.id}>
                    <Td>{fmt(r.sent_at)}</Td>
                    <Td>{r.name}</Td>
                    <Td>{r.mobile}</Td>
                    <Td>
                      <Pill tone={r.cohort === "send" ? "info" : "neutral"}>
                        {r.cohort === "send" ? "Pushed" : "Holdout"}
                      </Pill>
                    </Td>
                    <Td>
                      {r.cohort === "holdout" ? "—" : r.delivered ? <Pill tone="success">Accepted</Pill> : <Pill tone="danger">Failed</Pill>}
                    </Td>
                    <Td>{r.recharged_at ? <Pill tone="success">{fmt(r.recharged_at)}</Pill> : "—"}</Td>
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

export default PushNudge;
