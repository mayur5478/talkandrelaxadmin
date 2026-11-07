/*
 * Moderation — review queue for flags written by the Python moderation service.
 * Evidence arrives already redacted (no raw phone/email/UPI). Reviewing only
 * changes the flag's status; it never bans or messages anyone.
 */
import React, { useState } from "react";
import { ShieldAlert } from "lucide-react";
import { useGetModerationFlagsQuery, useReviewModerationFlagMutation } from "../../services/monitoring";
import TranscriptModal from "../common/transcript/TranscriptModal";
import CallTranscriptModal from "./CallTranscriptModal";
import { Button, EmptyState, Pill, Segmented, Table, TableSkeleton, TBody, TR, Td, THead, Th } from "../v2/ui";

const SEV = { 3: ["danger", "High"], 2: ["warning", "Medium"], 1: ["neutral", "Low"] };
const CAT_LABEL = {
  pii_phone: "Phone number", pii_email: "Email", pii_upi: "UPI ID", pii_govt_id: "Govt ID",
  offplatform_app: "Other app", offplatform_contact_share: "Moving off-app",
  offplatform_payment: "Off-app payment", competitor_app: "Competitor app", abuse: "Abuse", sexual: "Sexual",
  threat: "Threat", self_harm: "Self-harm (support)", possible_minor: "Possible minor (support)",
};

// One participant of the conversation. `sender` marks who wrote the flagged message (chat flags).
// Calls have no speaker split, so neither side is marked there.
function PersonLine({ label, name, id, sender }) {
  return (
    <div className="tw-flex tw-items-baseline tw-gap-1">
      <span className="tw-text-fg-tertiary tw-w-[52px] tw-shrink-0">{label}</span>
      <span className={sender ? "tw-font-semibold tw-text-fg-danger" : "tw-text-fg-primary"} title={id || ""}>
        {name || (id ? `ID ${String(id).slice(0, 8)}` : "—")}
      </span>
      {sender && <span className="tw-text-[10px] tw-text-fg-danger">wrote this</span>}
    </div>
  );
}

export default function Moderation() {
  const [status, setStatus] = useState("open");
  const [source, setSource] = useState("all");
  const [minSev, setMinSev] = useState("1");
  const [category, setCategory] = useState("all");
  const [page, setPage] = useState(1);
  const [viewing, setViewing] = useState(null); // the flag whose conversation is open

  const params = {
    status, page, severity: minSev,
    ...(source !== "all" ? { source } : {}),
    ...(category !== "all" ? { category } : {}),
  };
  const { data, isLoading, isFetching, error } = useGetModerationFlagsQuery(params);
  const [review, { isLoading: saving }] = useReviewModerationFlagMutation();

  const rows = data?.rows || [];
  const counts = data?.counts || { open: 0, confirmed: 0, dismissed: 0 };
  const pages = Math.max(1, Math.ceil((data?.total || 0) / (data?.limit || 50)));
  const reset = (fn) => (v) => { fn(v); setPage(1); };

  // Category dropdown: only categories that have flags under the other filters (with their counts).
  // An older backend sends no counts, so then every known category is listed without a number.
  const catCounts = data?.categories || {};
  const hasCatCounts = !!data?.categories;
  const catKeys = hasCatCounts
    ? [...Object.keys(CAT_LABEL), ...Object.keys(catCounts).filter((k) => !CAT_LABEL[k])]
        .filter((k) => catCounts[k] || k === category)
    : Object.keys(CAT_LABEL);
  const catTotal = Object.values(catCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="tw-space-y-4">
      <div>
        <h1 className="tw-text-xl tw-font-semibold tw-text-fg-primary">Moderation</h1>
        <p className="tw-text-sm tw-text-fg-tertiary">
          Flags from chats and calls. Evidence is redacted. Confirm or dismiss; nothing is auto-banned.
        </p>
      </div>

      <div className="tw-flex tw-flex-wrap tw-gap-3 tw-items-center">
        <Segmented ariaLabel="Status" value={status} onChange={reset(setStatus)} options={[
          { value: "open", label: `Open (${counts.open})` },
          { value: "confirmed", label: `Confirmed (${counts.confirmed})` },
          { value: "dismissed", label: `Dismissed (${counts.dismissed})` },
        ]} />
        <Segmented ariaLabel="Source" value={source} onChange={reset(setSource)}
          options={[{ value: "all", label: "All" }, { value: "chat", label: "Chat" }, { value: "call", label: "Call" }]} />
        <Segmented ariaLabel="Severity" value={minSev} onChange={reset(setMinSev)}
          options={[{ value: "1", label: "Any" }, { value: "2", label: "Medium+" }, { value: "3", label: "High" }]} />
        <select
          aria-label="Category"
          value={category}
          onChange={(e) => reset(setCategory)(e.target.value)}
          className="tw-h-8 tw-px-2 tw-rounded-sm tw-border tw-border-[var(--color-border-tertiary)] tw-bg-bg-secondary tw-text-fg-primary tw-text-[13px]"
        >
          <option value="all">{hasCatCounts ? `All categories (${catTotal})` : "All categories"}</option>
          {catKeys.map((k) => (
            <option key={k} value={k}>
              {CAT_LABEL[k] || k}{hasCatCounts ? ` (${catCounts[k] || 0})` : ""}
            </option>
          ))}
        </select>
      </div>

      {data?.notSetUp && (
        <div className="tw-p-3 tw-rounded tw-bg-fg-warning/10 tw-text-fg-warning tw-text-sm">
          Moderation tables don't exist yet. Run schema.sql from the moderation service.
        </div>
      )}
      {error && <div className="tw-text-fg-danger tw-text-sm">Failed to load flags.</div>}

      {isLoading ? (
        <TableSkeleton rows={6} cols={6} />
      ) : rows.length === 0 ? (
        <EmptyState icon={<ShieldAlert size={20} />} title="Nothing to review" description="No flags match these filters." />
      ) : (
        <Table className={isFetching ? "tw-opacity-70" : ""}>
          <THead>
            <TR><Th>Severity</Th><Th>Type</Th><Th>Source</Th><Th>Who</Th><Th>Evidence</Th><Th>When</Th><Th>Action</Th></TR>
          </THead>
          <TBody>
            {rows.map((f) => {
              const [tone, label] = SEV[f.severity] || SEV[1];
              return (
                <TR key={f.id}>
                  <Td><Pill tone={tone}>{label}</Pill></Td>
                  <Td>{CAT_LABEL[f.category] || f.category}</Td>
                  <Td>{f.source}</Td>
                  <Td className="tw-text-xs tw-min-w-[170px]">
                    <PersonLine label="User" name={f.user_name} id={f.user_id} sender={f.offender === "user"} />
                    <PersonLine label="Listener" name={f.listener_name} id={f.listener_id} sender={f.offender === "listener"} />
                    <div className="tw-text-fg-tertiary tw-mt-0.5" title={f.session_id}>session {String(f.session_id).slice(0, 8)}</div>
                  </Td>
                  <Td className="tw-max-w-[360px]">
                    <div className="tw-text-xs tw-text-fg-tertiary">{f.matched}</div>
                    <div className="tw-text-sm tw-break-words">{f.excerpt}</div>
                  </Td>
                  <Td className="tw-text-xs tw-whitespace-nowrap">{new Date(f.created_at).toLocaleString()}</Td>
                  <Td>
                    <div className="tw-flex tw-gap-1">
                      <Button size="xs" variant="ghost" onClick={() => setViewing(f)}>
                        {f.source === "call" ? "Transcript" : "Chat"}
                      </Button>
                      {status !== "confirmed" && (
                        <Button size="xs" variant="danger" disabled={saving}
                          onClick={() => review({ id: f.id, status: "confirmed" })}>Confirm</Button>
                      )}
                      {status !== "dismissed" && (
                        <Button size="xs" variant="ghost" disabled={saving}
                          onClick={() => review({ id: f.id, status: "dismissed" })}>Dismiss</Button>
                      )}
                      {status !== "open" && (
                        <Button size="xs" variant="ghost" disabled={saving}
                          onClick={() => review({ id: f.id, status: "open" })}>Reopen</Button>
                      )}
                    </div>
                  </Td>
                </TR>
              );
            })}
          </TBody>
        </Table>
      )}

      <TranscriptModal
        open={viewing?.source === "chat"}
        onClose={() => setViewing(null)}
        sessionId={viewing?.source === "chat" ? viewing.session_id : undefined}
        sessionMeta={{ service_type: "chat" }}
      />
      <CallTranscriptModal
        open={viewing?.source === "call"}
        onClose={() => setViewing(null)}
        sessionId={viewing?.source === "call" ? viewing.session_id : undefined}
      />

      {pages > 1 && (
        <div className="tw-flex tw-items-center tw-gap-2 tw-text-sm">
          <Button size="sm" variant="ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</Button>
          <span>Page {page} / {pages}</span>
          <Button size="sm" variant="ghost" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
}
