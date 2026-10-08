import React, { useState } from "react";
import { ClipboardList } from "lucide-react";
import { Card, Table, THead, TBody, TR, Th, Td, TableSkeleton, Pill, Button, ErrorBanner, Modal, ModalBody, ModalFooter, Textarea, Field, Pagination, Spinner, useToast } from "../v2/ui";
import { useListCounsellorsQuery, useGetCheckinsQuery, useAddCheckinMutation } from "../../services/counsellor";
import { bpsToPct, formatDateTime, isNotEnabled, errorMessage } from "./counsellorFormat";
import { NotEnabled, PageHeader, TierBadge } from "./CounsellorCommon";

const FLAG_LABEL = { below_rating: "Below rating", no_show_strikes: "No-show strikes" };

function CheckinsModal({ counsellor, onClose }) {
  const { toast } = useToast();
  const { data, isLoading, error } = useGetCheckinsQuery(counsellor.id);
  const [add, { isLoading: adding }] = useAddCheckinMutation();
  const [notes, setNotes] = useState("");
  const [addError, setAddError] = useState("");
  const checkins = (data && data.checkins) || [];

  const submit = async () => {
    if (!notes.trim()) return;
    setAddError("");
    try {
      await add({ id: counsellor.id, notes: notes.trim() }).unwrap();
      setNotes("");
      toast({ title: "Check-in recorded", tone: "success" });
    } catch (e) {
      setAddError(errorMessage(e, "Could not add the check-in"));
    }
  };

  return (
    <Modal open onClose={onClose} size="lg" title={`Check-ins: ${counsellor.name || `#${counsellor.id}`}`} description="Periodic wellbeing and quality check-ins with this counsellor.">
      <ModalBody className="tw-flex tw-flex-col tw-gap-4 tw-text-left">
        {error ? <ErrorBanner title="Could not load check-ins" message={errorMessage(error)} /> : null}
        {addError ? <ErrorBanner title="Could not add" message={addError} /> : null}
        <div className="tw-max-h-[40vh] tw-overflow-y-auto tw-flex tw-flex-col tw-gap-2">
          {isLoading ? <div className="tw-py-4 tw-text-center"><Spinner /></div> : null}
          {!isLoading && !error && checkins.length === 0 ? <div className="tw-text-small tw-text-fg-tertiary">No check-ins yet.</div> : null}
          {checkins.map((c) => (
            <div key={c.id} className="tw-border tw-border-hairline tw-border-tertiary tw-rounded-lg tw-p-3">
              <div className="tw-text-small tw-text-fg-primary tw-whitespace-pre-wrap">{c.notes}</div>
              <div className="tw-text-[11px] tw-text-fg-tertiary tw-mt-1">
                {formatDateTime(c.createdAt)}{c.byId ? ` · by #${c.byId}` : ""}{c.nextDueAt ? ` · next due ${formatDateTime(c.nextDueAt)}` : ""}
              </div>
            </div>
          ))}
        </div>
        <Field label="Add a check-in note" required>
          <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
      </ModalBody>
      <ModalFooter>
        <Button variant="ghost" onClick={onClose}>Close</Button>
        <Button onClick={submit} loading={adding} disabled={adding || !notes.trim()}>Add check-in</Button>
      </ModalFooter>
    </Modal>
  );
}

export default function CounsellorNetwork() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [checkinFor, setCheckinFor] = useState(null);
  const { data, isLoading, error } = useListCounsellorsQuery({ status: "live", page, pageSize });

  if (isNotEnabled(error)) return <NotEnabled />;
  const items = (data && data.items) || [];
  const total = (data && data.total) || 0;

  return (
    <div className="tw-flex tw-flex-col tw-gap-4 tw-text-left">
      <PageHeader title="Counsellor network" subtitle="Live counsellors, their tier and revenue share, and quality signals." />
      {error ? <ErrorBanner title="Could not load the network" message={errorMessage(error)} /> : null}
      <Card flush>
        {isLoading ? <TableSkeleton rows={6} cols={9} /> : (
          <>
            <Table>
              <THead>
                <TR>
                  <Th>Name</Th><Th>Tier</Th><Th>Share</Th><Th>Rating</Th><Th>Paid minutes</Th><Th>No-show strikes</Th><Th>Quality</Th><Th>Recruited by</Th><Th>Check-ins</Th>
                </TR>
              </THead>
              <TBody>
                {items.length === 0 ? (
                  <TR><Td colSpan={9} className="tw-text-center tw-text-fg-tertiary">No live counsellors yet.</Td></TR>
                ) : items.map((c, i) => (
                  <TR key={c.id} isLast={i === items.length - 1} className={c.qualityFlag ? "tw-bg-fg-danger/[.06]" : undefined}>
                    <Td className="tw-text-fg-primary tw-font-medium">{c.name || `#${c.id}`}{c.isHead ? <span className="tw-ml-1 tw-text-fg-tertiary tw-font-normal">(Head)</span> : null}</Td>
                    <Td><TierBadge tier={c.tier} /></Td>
                    <Td>{bpsToPct(c.shareBps)}</Td>
                    <Td>{c.averageRating != null ? `${Number(c.averageRating).toFixed(2)} (${c.totalFeedbacks || 0})` : "—"}</Td>
                    <Td>{c.lifetimePaidMinutes ?? 0}</Td>
                    <Td className={c.noShowStrikes > 0 ? "tw-text-fg-danger tw-font-medium" : undefined}>{c.noShowStrikes ?? 0}</Td>
                    <Td>{c.qualityFlag ? <Pill tone="danger" dot>{FLAG_LABEL[c.qualityFlag] || c.qualityFlag}</Pill> : <span className="tw-text-fg-tertiary">OK</span>}</Td>
                    <Td>{c.recruitedBy ? `#${c.recruitedBy}` : "—"}</Td>
                    <Td><Button size="sm" variant="outline" onClick={() => setCheckinFor(c)}><ClipboardList size={12} aria-hidden />Check-ins</Button></Td>
                  </TR>
                ))}
              </TBody>
            </Table>
            <Pagination page={page} totalPages={Math.max(1, Math.ceil(total / pageSize))} totalRecords={total} pageSize={pageSize} onPageChange={setPage} onPageSize={(n) => { setPageSize(n === "all" ? 100 : n); setPage(1); }} pageSizeOptions={[10, 20, 50, 100]} />
          </>
        )}
      </Card>
      {checkinFor ? <CheckinsModal counsellor={checkinFor} onClose={() => setCheckinFor(null)} /> : null}
    </div>
  );
}
