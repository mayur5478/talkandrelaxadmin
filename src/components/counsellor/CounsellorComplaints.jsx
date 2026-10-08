import React, { useState } from "react";
import { Card, Table, THead, TBody, TR, Th, Td, TableSkeleton, Pill, Button, ErrorBanner, Segmented, Modal, ModalBody, ModalFooter, Field, Textarea, useToast } from "../v2/ui";
import { useListComplaintsQuery, useResolveComplaintMutation } from "../../services/counsellor";
import { formatDateTime, isNotEnabled, errorMessage } from "./counsellorFormat";
import { NotEnabled, PageHeader, RISK_NOTE } from "./CounsellorCommon";

export default function CounsellorComplaints() {
  const { toast } = useToast();
  const [status, setStatus] = useState("open");
  const { data, isLoading, error } = useListComplaintsQuery({ status });
  const [resolve, { isLoading: resolving }] = useResolveComplaintMutation();
  const [target, setTarget] = useState(null);
  const [text, setText] = useState("");
  const [resolveError, setResolveError] = useState("");

  if (isNotEnabled(error)) return <NotEnabled />;
  const complaints = (data && data.complaints) || [];

  const close = () => { setTarget(null); setText(""); setResolveError(""); };
  const submit = async () => {
    if (!text.trim()) return;
    setResolveError("");
    try {
      await resolve({ id: target.id, resolution: text.trim() }).unwrap();
      toast({ title: "Complaint resolved", tone: "success" });
      close();
    } catch (e) {
      setResolveError(errorMessage(e, "Could not resolve the complaint"));
    }
  };

  return (
    <div className="tw-flex tw-flex-col tw-gap-4 tw-text-left">
      <PageHeader title="Complaints" subtitle="Feedback, support and safety escalations about counsellors. Overdue items are highlighted." />
      <div>
        <Segmented value={status} onChange={setStatus} ariaLabel="Complaint status" options={[{ value: "open", label: "Open" }, { value: "resolved", label: "Resolved" }]} />
      </div>
      {error ? <ErrorBanner title="Could not load complaints" message={errorMessage(error)} /> : null}
      <Card flush>
        {isLoading ? <TableSkeleton rows={5} cols={6} /> : (
          <Table>
            <THead>
              <TR><Th>Source</Th><Th>Counsellor</Th><Th>Booking</Th><Th>Complaint</Th><Th>Due</Th><Th>Action</Th></TR>
            </THead>
            <TBody>
              {complaints.length === 0 ? (
                <TR><Td colSpan={6} className="tw-text-center tw-text-fg-tertiary">No {status} complaints.</Td></TR>
              ) : complaints.map((c, i) => {
                const risk = c.source === "risk";
                const overdue = c.status !== "resolved" && !!c.overdue;
                return (
                  <TR key={c.id} isLast={i === complaints.length - 1} className={overdue || risk ? "tw-bg-fg-danger/[.06]" : undefined}>
                    <Td>
                      {risk ? <Pill tone="danger" dot>Risk</Pill> : <Pill tone="neutral">{c.source || "—"}</Pill>}
                    </Td>
                    <Td>#{c.counsellorId}</Td>
                    <Td>{c.bookingId ? `#${c.bookingId}` : "—"}</Td>
                    <Td className="tw-max-w-md">
                      <div className="tw-whitespace-pre-wrap tw-break-words tw-text-fg-primary">{c.text}</div>
                      {risk ? <div className="tw-text-[11px] tw-text-fg-danger tw-mt-1">{RISK_NOTE}</div> : null}
                      {c.status === "resolved" && c.resolution ? <div className="tw-text-[11px] tw-text-fg-tertiary tw-mt-1">Resolved {formatDateTime(c.resolvedAt)}: {c.resolution}</div> : null}
                    </Td>
                    <Td>
                      {formatDateTime(c.dueAt)}
                      {overdue ? <div><Pill tone="danger" className="tw-mt-1">Overdue</Pill></div> : null}
                    </Td>
                    <Td>{c.status === "resolved" ? <Pill tone="success" dot>Resolved</Pill> : <Button size="sm" variant="outline" onClick={() => setTarget(c)}>Resolve</Button>}</Td>
                  </TR>
                );
              })}
            </TBody>
          </Table>
        )}
      </Card>

      <Modal open={!!target} onClose={close} title="Resolve complaint" description={target ? `Complaint #${target.id}` : undefined}>
        <ModalBody className="tw-flex tw-flex-col tw-gap-3 tw-text-left">
          {target && target.source === "risk" ? <ErrorBanner title="Risk escalation" message={RISK_NOTE} /> : null}
          {resolveError ? <ErrorBanner title="Could not resolve" message={resolveError} /> : null}
          <Field label="Resolution" required helper="Describe what was done. This is kept on record.">
            <Textarea rows={4} value={text} onChange={(e) => setText(e.target.value)} />
          </Field>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={close}>Cancel</Button>
          <Button onClick={submit} loading={resolving} disabled={resolving || !text.trim()}>Resolve</Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
