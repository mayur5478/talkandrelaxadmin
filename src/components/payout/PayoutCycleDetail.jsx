import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Download, FileText, RefreshCw, ListTree } from "lucide-react";
import {
  Card, CardHeader, CardTitle, Button, Table, THead, TBody, TR, Th, Td, TableSkeleton, Pill, ErrorBanner,
  Modal, ModalBody, ModalFooter, Field, Input, Select,
} from "../v2/ui";
import {
  useGetCycleQuery, useGetLinesQuery, useGetLineTxnsQuery, useGetBatchLinesQuery, useGetBatchesQuery, useGetApprovedListenersQuery, useGetPayoutConfigQuery,
  usePrepareCycleMutation, useApproveCycleMutation, useApproveLineMutation, useGenerateFileMutation, useGeneratePartialFileMutation,
  useBankResultMutation, useSettleFailedLineMutation, useAdjustmentCycleMutation,
  useAddLineAdjustmentMutation, useHoldListenerMutation, useReleaseListenerMutation,
  downloadCycleFile, downloadBatchFile,
} from "../../services/payout";
import { formatRs, STATUS_LABEL, statusTone, holdLabel, nextActions, windowLabel, errorMessage } from "./payoutFormat";
import { NotEnabled } from "./PayoutCycles";
import Notice from "./Notice";

function Stat({ label, value, sub }) {
  return (
    <div className="tw-flex tw-flex-col tw-gap-0.5 tw-p-3 tw-rounded-lg tw-bg-bg-secondary">
      <span className="tw-text-small tw-text-fg-tertiary">{label}</span>
      <span className="tw-text-h3 tw-text-fg-primary tw-font-semibold">{value}</span>
      {sub ? <span className="tw-text-small tw-text-fg-tertiary">{sub}</span> : null}
    </div>
  );
}

// Every number on a line is traceable to a call (or an adjustment) behind it.
function CallsModal({ id, listenerId, onClose }) {
  const { data, isLoading, error } = useGetLineTxnsQuery({ id, listenerId }, { skip: !listenerId });
  const txns = (data && data.txns) || [];
  const unpaid = data && data.unpaid;
  return (
    <Modal open={Boolean(listenerId)} onClose={onClose} title="Calls behind this line" description={listenerId} size="xl">
      <ModalBody>
        {error ? <ErrorBanner message={errorMessage(error)} /> : isLoading ? <TableSkeleton rows={5} cols={7} /> : (
          <div style={{ maxHeight: "60vh", overflow: "auto" }}>
            <div className="tw-text-small tw-text-fg-tertiary tw-mb-2">{txns.length} entr{txns.length === 1 ? "y" : "ies"}{txns.length >= 200 ? " (showing the first 200)" : ""}</div>
          <Table>
            <THead>
              <TR><Th>Type</Th><Th>When</Th><Th>Duration</Th><Th>Minutes</Th><Th>Billed to user</Th><Th>Listener share</Th><Th>Notes</Th></TR>
            </THead>
            <TBody>
              {txns.length === 0 ? (
                <TR><Td colSpan={7} className="tw-text-center tw-text-fg-tertiary">No entries</Td></TR>
              ) : txns.map((t, i) => (
                <TR key={t.txnId} isLast={i === txns.length - 1}>
                  <Td>{t.serviceType || t.txnType}</Td>
                  <Td>{t.callEndedAtMs ? new Date(t.callEndedAtMs).toLocaleString() : t.occurredAtMs ? new Date(t.occurredAtMs).toLocaleString() : "—"}</Td>
                  <Td>{t.wallSeconds != null ? `${t.wallSeconds}s` : "—"}</Td>
                  <Td>{t.billableMinutes != null ? t.billableMinutes : "—"}</Td>
                  <Td>{formatRs(t.grossBilledRs)}</Td>
                  <Td>{formatRs(t.amountRs)}</Td>
                  <Td className="tw-text-fg-tertiary"><div style={{ minWidth: 200, whiteSpace: "normal", wordBreak: "break-word" }}>{[t.payableReason, t.reason, t.flags, t.dataQuality === "backfilled_inferred" ? "inferred from history" : null].filter(Boolean).join(" · ") || "—"}</div></Td>
                </TR>
              ))}
            </TBody>
          </Table>

          {unpaid && unpaid.count > 0 && (
            <div className="tw-mt-6">
              <div className="tw-font-semibold tw-text-fg-primary">Not paid to the listener (60 seconds or less)</div>
              <div className="tw-text-small tw-text-fg-tertiary tw-mb-2">
                {unpaid.count} call{unpaid.count === 1 ? "" : "s"} · {formatRs(unpaid.grossBilledRs)} billed to users · ₹0.00 to the listener
                {unpaid.count > unpaid.calls.length ? ` (showing the first ${unpaid.calls.length})` : ""}
              </div>
              <Table>
                <THead><TR><Th>Type</Th><Th>When</Th><Th>Duration</Th><Th>Billed to user</Th><Th>Listener share</Th></TR></THead>
                <TBody>
                  {unpaid.calls.map((c, i) => (
                    <TR key={c.sessionId} isLast={i === unpaid.calls.length - 1}>
                      <Td>{c.serviceType}</Td>
                      <Td>{c.callEndedAtMs ? new Date(c.callEndedAtMs).toLocaleString() : "—"}</Td>
                      <Td>{c.wallSeconds != null ? `${c.wallSeconds}s` : "—"}</Td>
                      <Td>{formatRs(c.grossBilledRs)}</Td>
                      <Td>{formatRs("0")}</Td>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </div>
          )}
          </div>
        )}
      </ModalBody>
      <ModalFooter><Button variant="outline" onClick={onClose}>Close</Button></ModalFooter>
    </Modal>
  );
}

export default function PayoutCycleDetail() {
  const { id } = useParams();
  const { data, isLoading, error } = useGetCycleQuery(id);
  const cycle = data && data.cycle;
  const [heldFilter, setHeldFilter] = useState("");
  const [nameFilter, setNameFilter] = useState("");
  const { data: linesData, isLoading: linesLoading } = useGetLinesQuery({ id, held: heldFilter }, { skip: !cycle });
  const { data: batchesData } = useGetBatchesQuery(id, { skip: !cycle });
  const { data: approvedData } = useGetApprovedListenersQuery(id, { skip: !cycle });
  // Under independent per-listener approval the cycle can stay pending_approval indefinitely while
  // listeners are being paid one at a time -- so "any batch exists yet" must also reveal this table, not
  // just the final whole-cycle status (which a solo-approval cycle may never reach).
  const showBatch = cycle && (["file_generated", "paid", "reconciled"].includes(cycle.status) || (batchesData && batchesData.batches && batchesData.batches.length > 0));
  const { data: batchData } = useGetBatchLinesQuery(id, { skip: !showBatch });
  const { data: cfg } = useGetPayoutConfigQuery();

  const [prepare, { isLoading: recomputing }] = usePrepareCycleMutation();
  const [approve, { isLoading: approving }] = useApproveCycleMutation();
  const [approveLine, { isLoading: approvingLine }] = useApproveLineMutation();
  const [approvingLineFor, setApprovingLineFor] = useState(null); // listenerId of the row mid-request
  const [generate, { isLoading: generating }] = useGenerateFileMutation();
  const [generatePartial, { isLoading: generatingPartial }] = useGeneratePartialFileMutation();
  const [bankResult, { isLoading: recording }] = useBankResultMutation();
  const [settleFailedLine, { isLoading: settling }] = useSettleFailedLineMutation();
  const [settleFor, setSettleFor] = useState(null); // the approved-listener row being recorded/edited
  const [settleReference, setSettleReference] = useState("");
  const [settleNote, setSettleNote] = useState("");
  const [adjust, { isLoading: adjusting }] = useAdjustmentCycleMutation();
  const [addLineAdj, { isLoading: savingAdj }] = useAddLineAdjustmentMutation();
  const [holdListener, { isLoading: holding }] = useHoldListenerMutation();
  const [releaseListener, { isLoading: releasing }] = useReleaseListenerMutation();
  const [adjFor, setAdjFor] = useState(null);   // a line being adjusted
  const [holdFor, setHoldFor] = useState(null); // a line being held
  const [adjAmount, setAdjAmount] = useState("");
  const [adjReason, setAdjReason] = useState("");

  const [modal, setModal] = useState(null);           // 'approve' | 'file' | { result: line }
  const [callsFor, setCallsFor] = useState(null);
  const [template, setTemplate] = useState("neft_csv_v2");
  const [outcome, setOutcome] = useState("paid");
  const [reference, setReference] = useState("");
  const [reason, setReason] = useState("");
  const [msg, setMsg] = useState({ tone: "", text: "" });

  if (error && errorMessage(error) === "NOT_ENABLED") return <NotEnabled />;
  if (error) return <ErrorBanner title="Could not load this cycle" message={errorMessage(error)} />;
  if (isLoading || !cycle) return <TableSkeleton rows={6} cols={6} />;

  const s = data.summary;
  const actions = nextActions(cycle.status);
  const allLines = (linesData && linesData.lines) || [];
  const q = nameFilter.trim().toLowerCase();
  const lines = q ? allLines.filter((l) => (l.name || "").toLowerCase().includes(q) || l.listenerId.toLowerCase().includes(q)) : allLines;
  const batchLines = (batchData && batchData.lines) || [];
  const batches = (batchesData && batchesData.batches) || [];
  const approvedListeners = (approvedData && approvedData.listeners) || [];
  // cycle-wide count from the server, NOT a client-side scan of allLines: a listener already approved
  // whose line has since dropped out of the current version (nothing left to recompute for them) must
  // still count here, or this undercounts real unfiled money.
  const approvedLineCount = (linesData && linesData.pendingApprovedCount) || 0;
  const editable = cycle.status === "pending_approval";
  const cols = editable ? 10 : 9;
  const run = async (fn, okText) => {
    setMsg({ tone: "", text: "" });
    try { await fn(); setModal(null); setMsg({ tone: "success", text: okText }); } catch (e) { setMsg({ tone: "danger", text: errorMessage(e) }); setModal(null); }
  };

  return (
    <div className="tw-flex tw-flex-col tw-gap-4 tw-text-left">
      <Link to="/dashboard/payout" className="tw-inline-flex tw-items-center tw-gap-1 tw-text-small tw-text-fg-tertiary"><ArrowLeft size={14} />All cycles</Link>

      <div className="tw-flex tw-items-start tw-justify-between tw-flex-wrap tw-gap-3">
        <div>
          <h1 className="tw-text-h1 tw-text-fg-primary tw-m-0">{cycle.key}</h1>
          <p className="tw-text-small tw-text-fg-tertiary tw-mt-1 tw-mb-0">
            Window {windowLabel(cycle.windowStartMs, cycle.windowEndMs)} (IST) · version {cycle.currentVersion} · prepared by {cycle.preparedBy || "—"}{cycle.approvedBy ? ` · approved by ${cycle.approvedBy}` : ""}
          </p>
        </div>
        <Pill tone={statusTone(cycle.status)} dot>{STATUS_LABEL[cycle.status] || cycle.status}</Pill>
      </div>

      {msg.text && <Notice tone={msg.tone === "success" ? "success" : "danger"} title={msg.tone === "success" ? "Done" : "Not done"}>{msg.text}</Notice>}
      {data.warnings.map((w) => <Notice key={w} tone="warning" title="Heads up">{w}</Notice>)}

      <div className="tw-grid tw-gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))" }}>
        <Stat label="Gross billed to users" value={formatRs(s.totals.grossBilledRs)} sub="TDS is calculated on this" />
        <Stat label="Listener earnings" value={formatRs(s.totals.earningsRs)} />
        <Stat label="TDS withheld" value={formatRs(s.totals.tdsRs)} />
        <Stat label="Net payable" value={formatRs(s.totals.netPayableRs)} sub={`${s.totals.payableLines} listener(s)`} />
        <Stat label="Held" value={s.totals.heldLines} sub={Object.entries(s.heldByReason).map(([k, v]) => `${v} × ${holdLabel(k)}`).join(" · ") || "none"} />
      </div>

      <div className="tw-flex tw-gap-2 tw-flex-wrap">
        {actions.includes("recompute") && <Button variant="outline" disabled={recomputing} onClick={() => run(() => prepare({ stateCode: cycle.stateCode }).unwrap(), "Recomputed as a new version.")}><RefreshCw size={14} className="tw-mr-1" />Recompute</Button>}
        {actions.includes("approve") && <Button onClick={() => setModal("approve")}><CheckCircle2 size={14} className="tw-mr-1" />Approve…</Button>}
        {actions.includes("generateFile") && <Button onClick={() => setModal("file")}><FileText size={14} className="tw-mr-1" />Generate bank file…</Button>}
        {actions.includes("download") && <Button variant="outline" onClick={() => run(async () => { const r = await downloadCycleFile(id); setMsg({ tone: "success", text: `Downloaded ${r.name}` }); }, "File downloaded.")}><Download size={14} className="tw-mr-1" />Download bank file</Button>}
        {actions.includes("adjust") && <Button variant="outline" disabled={adjusting} onClick={() => run(() => adjust(id).unwrap(), "Adjustment cycle created. Find it in the cycle list.")}>Start adjustment cycle</Button>}
        {editable && approvedLineCount > 0 && (
          <Button
            variant="outline"
            disabled={generatingPartial}
            onClick={async () => {
              setMsg({ tone: "", text: "" });
              try {
                const r = await generatePartial({ id, templateCode: template }).unwrap();
                setMsg(r.status === "nothing_to_file"
                  ? { tone: "success", text: "Every approved listener is already in a bank file. Nothing new to generate." }
                  : { tone: "success", text: `Bank file generated for ${r.lineCount} approved listener(s). Download it below.` });
              } catch (e) { setMsg({ tone: "danger", text: errorMessage(e) }); }
            }}
          >
            <FileText size={14} className="tw-mr-1" />Generate file for approved ({approvedLineCount})…
          </Button>
        )}
      </div>

      {s.moved.length > 0 && (
        <Card flush>
          <CardHeader><CardTitle>Moved more than {s.movePct}% since the previous cycle</CardTitle></CardHeader>
          <Table>
            <THead><TR><Th>Listener</Th><Th>Before</Th><Th>Now</Th><Th>Change</Th><Th>Why</Th></TR></THead>
            <TBody>
              {s.moved.map((m, i) => (
                <TR key={m.listenerId} isLast={i === s.moved.length - 1}>
                  <Td>{m.name || `${m.listenerId.slice(0, 10)}…`}</Td><Td>{formatRs(m.previousNetRs)}</Td><Td>{formatRs(m.netRs)}</Td>
                  <Td>{m.changePct === null ? "new" : `${m.changePct}%`}</Td><Td className="tw-text-fg-tertiary">{m.explanation}</Td>
                </TR>
              ))}
            </TBody>
          </Table>
        </Card>
      )}

      <Card flush>
        <CardHeader
          action={
            <div className="tw-flex tw-gap-2">
              <Input value={nameFilter} onChange={(e) => setNameFilter(e.target.value)} placeholder="Search by name…" aria-label="Search listeners" style={{ width: 200 }} />
              <Select value={heldFilter} onChange={(e) => setHeldFilter(e.target.value)} aria-label="Filter lines">
                <option value="">All lines</option><option value="false">Payable only</option><option value="true">Held only</option>
              </Select>
            </div>
          }
        ><CardTitle>Listeners</CardTitle></CardHeader>
        {linesLoading ? <TableSkeleton rows={6} cols={cols} /> : (
          <Table>
            <THead><TR><Th>Listener</Th><Th>Gross billed</Th><Th>Earnings</Th><Th>Adjustments</Th><Th>TDS</Th><Th>Net payable</Th><Th>Wallet</Th><Th>Status</Th><Th>Calls</Th>{editable && <Th>Edit</Th>}</TR></THead>
            <TBody>
              {lines.length === 0 ? <TR><Td colSpan={cols} className="tw-text-center tw-text-fg-tertiary">{q ? "No listener matches that search" : "No lines"}</Td></TR> : lines.map((l, i) => (
                <TR key={l.id} isLast={i === lines.length - 1}>
                  <Td>
                    <Link to={`/dashboard/listener-management/profile-view?id=${encodeURIComponent(l.listenerId)}`} target="_blank" rel="noopener noreferrer" className="tw-text-fg-primary tw-font-medium tw-underline-offset-2 hover:tw-underline">
                      {l.name || l.listenerId.slice(0, 10)}
                    </Link>
                  </Td>
                  <Td>{formatRs(l.grossBilledRs)}</Td><Td>{formatRs(l.earningsRs)}</Td><Td>{formatRs(l.adjustmentRs)}</Td>
                  <Td>{formatRs(l.tdsRs)}{l.tdsPaise ? <span className="tw-text-fg-tertiary"> ({l.tdsRateBps / 100}%{l.panStatus !== "valid" ? ", no verified PAN" : ""})</span> : null}</Td>
                  <Td className="tw-font-semibold">{formatRs(l.netPayableRs)}</Td>
                  <Td className="tw-text-fg-tertiary" title="Current balance in the listener's wallet (old system), for reference. Payouts come from the ledger.">{l.walletRs == null ? "—" : formatRs(l.walletRs)}</Td>
                  <Td>
                    {l.independentlyApproved
                      ? <Pill tone="success" dot title={`Approved by ${l.approvedBy}${l.approvedAtMs ? ` on ${new Date(l.approvedAtMs).toLocaleString()}` : ""}`}>Approved{l.holdReason === "NO_BANK_DETAILS" ? " (no bank details yet)" : ""}</Pill>
                      : l.holdReason ? <Pill tone="warning">{holdLabel(l.holdReason)}</Pill>
                        : <Pill tone="success">Will be paid</Pill>}
                  </Td>
                  <Td><Button size="xs" variant="ghost" onClick={() => setCallsFor(l.listenerId)}><ListTree size={12} className="tw-mr-1" />{l.txnCount}</Button></Td>
                  {editable && (
                    <Td>
                      <div className="tw-flex tw-gap-1">
                        {(!l.holdReason || l.holdReason === "NO_BANK_DETAILS") && !l.independentlyApproved && (
                          <Button
                            size="xs"
                            disabled={approvingLine && approvingLineFor === l.listenerId}
                            title={l.holdReason === "NO_BANK_DETAILS" ? "Locks in the amount and TDS now; pays automatically once bank details are added" : undefined}
                            onClick={async () => {
                              setApprovingLineFor(l.listenerId); setMsg({ tone: "", text: "" });
                              try {
                                await approveLine({ id, listenerId: l.listenerId }).unwrap();
                                setMsg({ tone: "success", text: `${l.name || l.listenerId.slice(0, 10)} approved. The rest of the cycle is unaffected.` });
                              } catch (e) { setMsg({ tone: "danger", text: errorMessage(e) }); }
                              finally { setApprovingLineFor(null); }
                            }}
                          >
                            {approvingLine && approvingLineFor === l.listenerId ? "Approving…" : "Approve"}
                          </Button>
                        )}
                        <Button size="xs" variant="outline" onClick={() => { setAdjAmount(""); setAdjReason(""); setAdjFor(l); }}>Adjust</Button>
                        {l.holdReason === "MANUAL_HOLD"
                          ? <Button size="xs" variant="outline" disabled={releasing} onClick={() => run(() => releaseListener({ id, listenerId: l.listenerId }).unwrap(), "Hold released. Cycle recomputed; you cannot approve it yourself.")}>Release</Button>
                          : !l.independentlyApproved && <Button size="xs" variant="outline" onClick={() => { setAdjReason(""); setHoldFor(l); }}>Hold</Button>}
                      </div>
                    </Td>
                  )}
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>

      {approvedListeners.length > 0 && (
        <Card flush>
          <CardHeader><CardTitle>Approved listeners ({approvedListeners.length}, {formatRs(approvedData.totalRs)})</CardTitle></CardHeader>
          <Table>
            <THead><TR><Th>Listener</Th><Th>Net payable</Th><Th>Approved by</Th><Th>When</Th><Th>Status</Th><Th /></TR></THead>
            <TBody>
              {approvedListeners.map((l, i) => (
                <TR key={`${l.listenerId}-${l.approvedAtMs}`} isLast={i === approvedListeners.length - 1}>
                  <Td>
                    <Link to={`/dashboard/listener-management/profile-view?id=${encodeURIComponent(l.listenerId)}`} target="_blank" rel="noopener noreferrer" className="tw-text-fg-primary tw-font-medium hover:tw-underline">
                      {l.name || l.listenerId.slice(0, 10)}
                    </Link>
                  </Td>
                  <Td className="tw-font-semibold">{formatRs(l.netPayableRs)}</Td>
                  <Td className="tw-text-fg-tertiary">{l.approvedBy}</Td>
                  <Td className="tw-text-fg-tertiary">{l.approvedAtMs ? new Date(l.approvedAtMs).toLocaleString() : "—"}</Td>
                  <Td>
                    {l.settlement ? (
                      <div className="tw-flex tw-flex-col tw-gap-0.5">
                        <Pill tone="success">Paid</Pill>
                        <span className="tw-text-small tw-text-fg-tertiary">
                          {l.settlement.reference ? `UTR ${l.settlement.reference}` : "Recorded (no UTR)"}
                        </span>
                      </div>
                    ) : l.status === "awaiting_file" ? <Pill tone="warning">Awaiting file</Pill>
                      : l.status === "pending" ? <Pill tone="warning">Pending at bank</Pill>
                        : l.status === "paid" ? <Pill tone="success">Paid</Pill>
                          : <Pill tone="danger">Failed{l.failureReason ? ` — ${l.failureReason}` : ""}</Pill>}
                  </Td>
                  <Td>
                    {l.status === "failed" && l.batchLineId && (
                      <Button
                        size="xs" variant="outline"
                        title="Use when this listener was already paid outside this system (e.g. the old manual salary process) and only their bank record is missing here. Undoes the wallet credit and stops this amount from reappearing in a future cycle."
                        onClick={() => { setSettleReference((l.settlement && l.settlement.reference) || ""); setSettleNote((l.settlement && l.settlement.note) || ""); setSettleFor(l); }}
                      >
                        {l.settlement ? "Edit UTR" : "Record payment"}
                      </Button>
                    )}
                  </Td>
                </TR>
              ))}
            </TBody>
          </Table>
        </Card>
      )}

      {batches.length > 0 && (
        <Card flush>
          <CardHeader><CardTitle>Bank files</CardTitle></CardHeader>
          <Table>
            <THead><TR><Th>File</Th><Th>Kind</Th><Th>Listeners</Th><Th>Total</Th><Th>Generated by</Th><Th>When</Th><Th /></TR></THead>
            <TBody>
              {batches.map((b, i) => (
                <TR key={b.id} isLast={i === batches.length - 1}>
                  <Td className="tw-text-fg-tertiary">{b.fileName}</Td>
                  <Td><Pill tone={b.isPartial ? "warning" : "success"}>{b.isPartial ? "Partial" : "Final"}</Pill></Td>
                  <Td>{b.lineCount}</Td><Td>{formatRs(b.totalRs)}</Td><Td>{b.generatedBy}</Td>
                  <Td>{b.createdAtMs ? new Date(b.createdAtMs).toLocaleString() : "—"}</Td>
                  <Td><Button size="xs" variant="outline" onClick={() => run(() => downloadBatchFile(id, b.id), `Downloaded ${b.fileName}.`)}><Download size={12} className="tw-mr-1" />Download</Button></Td>
                </TR>
              ))}
            </TBody>
          </Table>
        </Card>
      )}

      {showBatch && (
        <Card flush>
          <CardHeader><CardTitle>Bank transfers</CardTitle></CardHeader>
          <Table>
            <THead><TR><Th>Listener</Th><Th>Amount</Th><Th>Status</Th><Th>Reference / reason</Th><Th /></TR></THead>
            <TBody>
              {batchLines.map((b, i) => (
                <TR key={b.id} isLast={i === batchLines.length - 1}>
                  <Td>{b.name || `${b.listenerId.slice(0, 10)}…`}</Td><Td>{formatRs(b.amountRs)}</Td>
                  <Td><Pill tone={b.status === "paid" ? "success" : b.status === "failed" ? "danger" : "warning"} dot>{b.status}</Pill></Td>
                  <Td className="tw-text-fg-tertiary">{b.bankReference || b.failureReason || "—"}</Td>
                  <Td>{b.status === "pending" ? <Button size="xs" variant="outline" onClick={() => { setOutcome("paid"); setReference(""); setReason(""); setModal({ result: b }); }}>Record result</Button> : null}</Td>
                </TR>
              ))}
            </TBody>
          </Table>
        </Card>
      )}

      <Modal open={modal === "approve"} onClose={() => setModal(null)} title="Approve this cycle?" description="Approval cannot be undone. The lines below are frozen; any correction becomes a new adjustment cycle.">
        <ModalBody>
          <p className="tw-m-0 tw-text-fg-primary">Net payable <b>{formatRs(s.totals.netPayableRs)}</b> to {s.totals.payableLines} listener(s); TDS <b>{formatRs(s.totals.tdsRs)}</b> will be withheld.
            {s.totals.heldLines ? ` ${s.totals.heldLines} held line(s) will not be paid.` : ""}</p>
          {s.moved.length > 0 && <p className="tw-mt-2 tw-mb-0 tw-text-fg-tertiary">{s.moved.length} listener(s) moved more than {s.movePct}%. Did you read why?</p>}
          <p className="tw-mt-2 tw-mb-0 tw-text-fg-tertiary">You cannot approve a cycle that you prepared yourself.</p>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={() => setModal(null)}>Cancel</Button>
          <Button disabled={approving} onClick={() => run(() => approve(id).unwrap(), "Cycle approved.")}>{approving ? "Approving…" : "Approve"}</Button>
        </ModalFooter>
      </Modal>

      <Modal open={modal === "file"} onClose={() => setModal(null)} title="Generate the bank file" description="Layout comes from the selected template. A listener whose bank details went missing is not dropped: their money goes back to their balance.">
        <ModalBody>
          <Field label="Bank template">
            <Select value={template} onChange={(e) => setTemplate(e.target.value)}>
              {((cfg && cfg.templates) || [{ code: "neft_csv_v2", name: "Generic NEFT bulk CSV" }]).map((t) => <option key={t.code} value={t.code}>{t.name || t.code}</option>)}
            </Select>
          </Field>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={() => setModal(null)}>Cancel</Button>
          <Button disabled={generating} onClick={() => run(() => generate({ id, templateCode: template }).unwrap(), "Bank file generated. Download it below.")}>{generating ? "Generating…" : "Generate"}</Button>
        </ModalFooter>
      </Modal>

      <Modal open={Boolean(modal && modal.result)} onClose={() => setModal(null)} title="Record the bank result" description={modal && modal.result ? `${formatRs(modal.result.amountRs)} to ${modal.result.listenerId}` : ""}>
        <ModalBody>
          <Field label="Result">
            <Select value={outcome} onChange={(e) => setOutcome(e.target.value)}><option value="paid">Paid</option><option value="failed">Failed</option></Select>
          </Field>
          {outcome === "paid"
            ? <Field label="Bank reference (UTR)" required><Input value={reference} onChange={(e) => setReference(e.target.value)} /></Field>
            : <Field label="Failure reason" required helper="The money returns to the listener’s balance and is offered again in the next cycle."><Input value={reason} onChange={(e) => setReason(e.target.value)} /></Field>}
          <p className="tw-mt-2 tw-mb-0 tw-text-fg-tertiary">A recorded result is final.</p>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={() => setModal(null)}>Cancel</Button>
          <Button disabled={recording || (outcome === "paid" ? !reference.trim() : !reason.trim())}
            onClick={() => run(() => bankResult({ lineId: modal.result.id, outcome, reference: reference.trim(), reason: reason.trim() }).unwrap(), "Result recorded.")}>Save</Button>
        </ModalFooter>
      </Modal>

      <Modal open={Boolean(adjFor)} onClose={() => setAdjFor(null)} title={`Adjust ${adjFor ? (adjFor.name || adjFor.listenerId.slice(0, 10)) : ""}`}
        description="Add a credit (positive) or a deduction (negative) to this listener in this cycle. It is recorded in the ledger with your name and reason. The cycle is recomputed, and you then cannot approve it yourself.">
        <ModalBody>
          <Field label="Amount in rupees" required helper="e.g. 250 to add ₹250, or -120.50 to deduct ₹120.50. Max ₹1,00,000 per entry.">
            <Input value={adjAmount} onChange={(e) => setAdjAmount(e.target.value)} inputMode="decimal" />
          </Field>
          <Field label="Reason" required helper="Shown in the audit trail. At least 5 characters.">
            <Input value={adjReason} onChange={(e) => setAdjReason(e.target.value)} />
          </Field>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={() => setAdjFor(null)}>Cancel</Button>
          <Button disabled={savingAdj || !/^-?\d+(\.\d{1,2})?$/.test(adjAmount.trim()) || Number(adjAmount) === 0 || adjReason.trim().length < 5}
            onClick={() => { const l = adjFor; setAdjFor(null); run(() => addLineAdj({ id, listenerId: l.listenerId, amountRs: adjAmount.trim(), reason: adjReason.trim() }).unwrap(), "Adjustment saved and the cycle recomputed."); }}>
            {savingAdj ? "Saving…" : "Save adjustment"}
          </Button>
        </ModalFooter>
      </Modal>

      <Modal open={Boolean(holdFor)} onClose={() => setHoldFor(null)} title={`Hold ${holdFor ? (holdFor.name || holdFor.listenerId.slice(0, 10)) : ""}`}
        description="A held listener is not paid and not taxed in this cycle. Their earnings stay unpaid and are picked up by the next cycle. You can release the hold until the cycle is approved.">
        <ModalBody>
          <Field label="Reason" required><Input value={adjReason} onChange={(e) => setAdjReason(e.target.value)} /></Field>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={() => setHoldFor(null)}>Cancel</Button>
          <Button disabled={holding || adjReason.trim().length < 3}
            onClick={() => { const l = holdFor; setHoldFor(null); run(() => holdListener({ id, listenerId: l.listenerId, reason: adjReason.trim() }).unwrap(), "Listener held and the cycle recomputed."); }}>
            {holding ? "Holding…" : "Hold listener"}
          </Button>
        </ModalFooter>
      </Modal>

      <CallsModal id={id} listenerId={callsFor} onClose={() => setCallsFor(null)} />

      <Modal open={Boolean(settleFor)} onClose={() => setSettleFor(null)} title={`Record payment — ${settleFor ? (settleFor.name || settleFor.listenerId.slice(0, 10)) : ""}`}
        description="Use only when this listener was already paid outside this system (e.g. the old manual salary process) and this cycle only lacks their bank record. This undoes the automatic wallet credit and stops the amount from reappearing in a future cycle. The UTR/reference is optional and can be edited later.">
        <ModalBody>
          <Field label="UTR / reference (optional)"><Input value={settleReference} onChange={(e) => setSettleReference(e.target.value)} placeholder="e.g. UTR or transaction number" /></Field>
          <Field label="Note (optional)"><Input value={settleNote} onChange={(e) => setSettleNote(e.target.value)} placeholder="e.g. paid via old salary sheet, Aug 2026" /></Field>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={() => setSettleFor(null)}>Cancel</Button>
          <Button disabled={settling}
            onClick={async () => {
              const l = settleFor; const reference = settleReference.trim(); const note = settleNote.trim();
              setSettleFor(null); setMsg({ tone: "", text: "" });
              try {
                const r = await settleFailedLine({ batchLineId: l.batchLineId, reference, note }).unwrap();
                setMsg({ tone: "success", text: r.status === "reference_updated" ? `${l.name || l.listenerId.slice(0, 10)}'s payment record updated.` : `${l.name || l.listenerId.slice(0, 10)} recorded as already paid. Wallet credit reversed; will not reappear next cycle.` });
              } catch (e) { setMsg({ tone: "danger", text: errorMessage(e) }); }
            }}>
            {settling ? "Saving…" : "Save"}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
