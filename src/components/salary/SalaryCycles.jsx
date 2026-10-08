import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Wallet, Plus } from "lucide-react";
import { Card, Button, Table, THead, TBody, TR, Th, Td, TableSkeleton, Pill, ErrorBanner, Select, EmptyState } from "../v2/ui";
import { useListCyclesQuery, usePrepareCycleMutation } from "../../services/salary";
import { monthLabel, errorMessage } from "./salaryFormat";

export function NotEnabled() {
  return (
    <EmptyState
      icon={<Wallet size={20} />}
      title="Staff salary is not switched on for this server yet"
      description="Set SALARY_ADMIN_ENABLED=true on the backend once apply_employee_salary_tables.js has been applied."
    />
  );
}

const now = new Date();
const MONTHS = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: monthLabel(i + 1, now.getFullYear()).split(" ")[0] }));

export default function SalaryCycles() {
  const navigate = useNavigate();
  const { data, isLoading, error } = useListCyclesQuery();
  const [prepare, { isLoading: isPreparing }] = usePrepareCycleMutation();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [prepError, setPrepError] = useState("");

  const onGenerate = async () => {
    setPrepError("");
    try {
      const out = await prepare({ month: Number(month), year: Number(year) }).unwrap();
      navigate(`/dashboard/staff-salary/cycle/${out.cycleId}`);
    } catch (e) { setPrepError(errorMessage(e, "Could not generate the cycle")); }
  };

  if (error && errorMessage(error) === "NOT_ENABLED") return <NotEnabled />;
  const cycles = (data && data.cycles) || [];

  return (
    <div className="tw-flex tw-flex-col tw-gap-4 tw-text-left">
      <div className="tw-flex tw-items-center tw-justify-between tw-flex-wrap tw-gap-3">
        <div>
          <h1 className="tw-text-h1 tw-text-fg-primary tw-m-0">Staff salary</h1>
          <p className="tw-text-small tw-text-fg-tertiary tw-mt-1 tw-mb-0">Monthly salary cycles for fixed-salary staff. Generate, adjust, pay, and print slips.</p>
        </div>
        <div className="tw-flex tw-items-center tw-gap-2">
          <Select value={month} onChange={(e) => setMonth(e.target.value)}>
            {MONTHS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </Select>
          <input type="number" value={year} onChange={(e) => setYear(e.target.value)}
            className="tw-w-20 tw-h-8 tw-px-2 tw-text-[13px] tw-bg-bg-primary tw-text-fg-primary tw-border tw-border-hairline tw-border-tertiary tw-rounded-md tw-outline-none" />
          <Button onClick={onGenerate} disabled={isPreparing}>
            <Plus size={14} className="tw-mr-1" />{isPreparing ? "Generating…" : "Generate cycle"}
          </Button>
        </div>
      </div>

      {prepError && <ErrorBanner title="Could not generate the cycle" message={prepError} />}
      {error && errorMessage(error) !== "NOT_ENABLED" && <ErrorBanner title="Could not load cycles" message={errorMessage(error)} />}

      <Card flush>
        {isLoading ? (
          <TableSkeleton rows={6} cols={4} />
        ) : (
          <Table>
            <THead><TR><Th>Period</Th><Th>Status</Th><Th>Prepared by</Th><Th>Finalized by</Th></TR></THead>
            <TBody>
              {cycles.length === 0 ? (
                <TR><Td colSpan={4} className="tw-text-center tw-text-fg-tertiary">No cycles yet. Pick a month and press "Generate cycle".</Td></TR>
              ) : (
                cycles.map((c, i) => (
                  <TR key={c.id} isLast={i === cycles.length - 1} className="tw-cursor-pointer" onClick={() => navigate(`/dashboard/staff-salary/cycle/${c.id}`)}>
                    <Td className="tw-text-fg-primary tw-font-medium">{monthLabel(c.month, c.year)}</Td>
                    <Td><Pill tone={c.status === "finalized" ? "success" : "warning"} dot>{c.status}</Pill></Td>
                    <Td>{c.preparedBy || "—"}</Td>
                    <Td>{c.finalizedBy || "—"}</Td>
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
