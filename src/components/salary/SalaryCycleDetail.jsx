import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Download, FileText, CheckCircle2 } from "lucide-react";
import {
  Card, CardHeader, CardTitle, Button, Table, THead, TBody, TR, Th, Td, TableSkeleton, Pill, ErrorBanner,
  Modal, ModalBody, ModalFooter, Field, Input,
} from "../v2/ui";
import {
  useGetCycleLinesQuery, useSetLineAdjustmentMutation, usePayLineMutation, useFinalizeCycleMutation,
  downloadSlip, downloadCycleSlips,
} from "../../services/salary";
import { formatRs, monthLabel, errorMessage } from "./salaryFormat";
import { NotEnabled } from "./SalaryCycles";

export default function SalaryCycleDetail() {
  const { id } = useParams();
  const cycleId = Number(id);
  const { data, isLoading, error } = useGetCycleLinesQuery(cycleId);
  const [setAdjustment, { isLoading: adjusting }] = useSetLineAdjustmentMutation();
  const [payLine, { isLoading: paying }] = usePayLineMutation();
  const [finalizeCycle, { isLoading: finalizing }] = useFinalizeCycleMutation();

  const [adjustFor, setAdjustFor] = useState(null);
  const [adjustRs, setAdjustRs] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const [payFor, setPayFor] = useState(null);
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState({ tone: "", text: "" });

  if (error && errorMessage(error) === "NOT_ENABLED") return <NotEnabled />;
  const cycle = data && data.cycle;
  const lines = (data && data.lines) || [];

  const openAdjust = (l) => { setAdjustRs(l.adjustmentRs || ""); setAdjustReason(l.adjustmentReason || ""); setMsg({ tone: "", text: "" }); setAdjustFor(l); };
  const saveAdjustment = async () => {
    const l = adjustFor;
    try {
      await setAdjustment({ lineId: l.id, cycleId, adjustmentRs: adjustRs || "0", reason: adjustReason }).unwrap();
      setAdjustFor(null);
      setMsg({ tone: "success", text: `${l.employeeName}'s adjustment saved.` });
    } catch (e) { setMsg({ tone: "danger", text: errorMessage(e, "Could not save adjustment") }); }
  };

  const openPay = (l) => { setReference((l.payment && l.payment.reference) || ""); setNote((l.payment && l.payment.note) || ""); setMsg({ tone: "", text: "" }); setPayFor(l); };
  const savePayment = async () => {
    const l = payFor;
    setPayFor(null);
    try {
      const r = await payLine({ lineId: l.id, cycleId, reference: reference.trim(), note: note.trim() }).unwrap();
      setMsg({ tone: "success", text: r.status === "reference_updated" ? `${l.employeeName}'s payment record updated.` : `${l.employeeName} marked paid.` });
    } catch (e) { setMsg({ tone: "danger", text: errorMessage(e, "Could not record payment") }); }
  };

  const onFinalize = async () => {
    try { await finalizeCycle(cycleId).unwrap(); } catch (e) { setMsg({ tone: "danger", text: errorMessage(e, "Could not finalize cycle") }); }
  };

  return (
    <div className="tw-flex tw-flex-col tw-gap-4 tw-text-left">
      <div className="tw-flex tw-items-center tw-justify-between tw-flex-wrap tw-gap-3">
        <div>
          <Link to="/dashboard/staff-salary" className="tw-text-small tw-text-fg-tertiary tw-inline-flex tw-items-center tw-gap-1 tw-mb-1 hover:tw-underline">
            <ArrowLeft size={12} />Staff salary
          </Link>
          <h1 className="tw-text-h1 tw-text-fg-primary tw-m-0">{cycle ? monthLabel(cycle.month, cycle.year) : "…"}</h1>
          {cycle && <Pill tone={cycle.status === "finalized" ? "success" : "warning"} dot>{cycle.status}</Pill>}
        </div>
        <div className="tw-flex tw-gap-2">
          <Button variant="outline" onClick={() => downloadCycleSlips(cycleId).catch((e) => setMsg({ tone: "danger", text: errorMessage(e) }))}>
            <FileText size={14} className="tw-mr-1" />Download all slips
          </Button>
          {cycle && cycle.status === "draft" && (
            <Button onClick={onFinalize} disabled={finalizing}><CheckCircle2 size={14} className="tw-mr-1" />{finalizing ? "Finalizing…" : "Finalize cycle"}</Button>
          )}
        </div>
      </div>

      {msg.text && (msg.tone === "danger" ? <ErrorBanner title="Error" message={msg.text} /> : <div className="tw-text-small tw-text-fg-success">{msg.text}</div>)}
      {error && errorMessage(error) !== "NOT_ENABLED" && <ErrorBanner title="Could not load cycle" message={errorMessage(error)} />}

      <Card flush>
        <CardHeader><CardTitle>Salary lines ({lines.length}, {data ? formatRs(data.totalRs) : "—"})</CardTitle></CardHeader>
        {isLoading ? (
          <TableSkeleton rows={6} cols={7} />
        ) : (
          <Table>
            <THead><TR><Th>Employee</Th><Th>Base</Th><Th>Adjustment</Th><Th>Net pay</Th><Th>Status</Th><Th /><Th /></TR></THead>
            <TBody>
              {lines.length === 0 ? (
                <TR><Td colSpan={7} className="tw-text-center tw-text-fg-tertiary">No lines yet.</Td></TR>
              ) : (
                lines.map((l, i) => (
                  <TR key={l.id} isLast={i === lines.length - 1}>
                    <Td className="tw-text-fg-primary tw-font-medium">{l.employeeName}{l.employeeCode ? <span className="tw-text-fg-tertiary"> ({l.employeeCode})</span> : null}</Td>
                    <Td>{formatRs(l.baseRs)}</Td>
                    <Td className={l.adjustmentPaise > 0 ? "tw-text-fg-success" : l.adjustmentPaise < 0 ? "tw-text-fg-danger" : undefined}>
                      {l.adjustmentPaise ? `${l.adjustmentPaise > 0 ? "+" : "-"}${formatRs(l.adjustmentRs)}` : "—"}
                    </Td>
                    <Td className="tw-font-semibold">{formatRs(l.netRs)}</Td>
                    <Td>
                      {l.payment ? (
                        <div className="tw-flex tw-flex-col tw-gap-0.5">
                          <Pill tone="success">Paid</Pill>
                          <span className="tw-text-small tw-text-fg-tertiary">{l.payment.reference ? `UTR ${l.payment.reference}` : "Recorded (no UTR)"}</span>
                        </div>
                      ) : (
                        <Pill tone="warning">Pending</Pill>
                      )}
                    </Td>
                    <Td>
                      <div className="tw-flex tw-gap-2">
                        {l.status !== "paid" && <Button size="xs" variant="outline" onClick={() => openAdjust(l)}>Adjust</Button>}
                        <Button size="xs" variant="outline" onClick={() => openPay(l)}>{l.payment ? "Edit UTR" : "Record payment"}</Button>
                      </div>
                    </Td>
                    <Td>
                      <Button size="xs" variant="outline" onClick={() => downloadSlip(l.id).catch((e) => setMsg({ tone: "danger", text: errorMessage(e) }))}>
                        <Download size={12} className="tw-mr-1" />Slip
                      </Button>
                    </Td>
                  </TR>
                ))
              )}
            </TBody>
          </Table>
        )}
      </Card>

      <Modal open={Boolean(adjustFor)} onClose={() => setAdjustFor(null)} title={`Adjust — ${adjustFor ? adjustFor.employeeName : ""}`}
        description="Positive for a bonus, negative for a deduction. This is on top of the base monthly salary and only affects this cycle.">
        <ModalBody>
          <Field label="Adjustment (₹, negative for a deduction)"><Input value={adjustRs} onChange={(e) => setAdjustRs(e.target.value)} placeholder="e.g. 1000 or -500" /></Field>
          <Field label="Reason"><Input value={adjustReason} onChange={(e) => setAdjustReason(e.target.value)} placeholder="e.g. festival bonus" /></Field>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={() => setAdjustFor(null)}>Cancel</Button>
          <Button disabled={adjusting} onClick={saveAdjustment}>{adjusting ? "Saving…" : "Save"}</Button>
        </ModalFooter>
      </Modal>

      <Modal open={Boolean(payFor)} onClose={() => setPayFor(null)} title={`Record payment — ${payFor ? payFor.employeeName : ""}`}
        description="Mark this employee's salary as paid. The UTR/reference is optional and can be edited later.">
        <ModalBody>
          <Field label="UTR / reference (optional)"><Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="e.g. UTR or transaction number" /></Field>
          <Field label="Note (optional)"><Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. paid via bank transfer" /></Field>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={() => setPayFor(null)}>Cancel</Button>
          <Button disabled={paying} onClick={savePayment}>{paying ? "Saving…" : "Save"}</Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
