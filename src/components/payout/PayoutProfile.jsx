import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Search, X } from "lucide-react";
import { Card, Button, ErrorBanner, Field, Input, Select, Checkbox } from "../v2/ui";
import { useGetPayoutProfileQuery, useSavePayoutProfileMutation, useSearchListenersQuery } from "../../services/payout";
import { errorMessage } from "./payoutFormat";
import { NotEnabled } from "./PayoutCycles";
import Notice from "./Notice";

const EMPTY = { pan: "", panStatus: "", entityType: "", stateCode: "", holderName: "", accountNumber: "", ifsc: "", upiId: "", bankVerified: false };

// Type a name or mobile number, pick from the dropdown — no more copying raw listener ids around.
function ListenerSearch({ onPick }) {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 250);
    return () => clearTimeout(t);
  }, [query]);

  const { data, isFetching } = useSearchListenersQuery(debounced, { skip: debounced.length < 2 });
  const results = (data && data.results) || [];

  useEffect(() => {
    const onClickOutside = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const pick = (r) => {
    onPick(r);
    setQuery(`${r.name || "Unnamed"} · ${r.mobile || r.id.slice(0, 10)}`);
    setOpen(false);
  };

  return (
    <div ref={boxRef} className="tw-relative tw-flex-1">
      <div className="tw-relative">
        <Search size={14} className="tw-absolute tw-left-3 tw-top-1/2 tw--translate-y-1/2 tw-text-fg-tertiary" />
        <Input
          className="tw-pl-8 tw-pr-8"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); onPick(null); }}
          onFocus={() => query.trim().length >= 2 && setOpen(true)}
          placeholder="Search by name or mobile number"
        />
        {query && (
          <button type="button" aria-label="Clear" className="tw-absolute tw-right-2 tw-top-1/2 tw--translate-y-1/2 tw-text-fg-tertiary" onClick={() => { setQuery(""); setOpen(false); onPick(null); }}>
            <X size={14} />
          </button>
        )}
      </div>
      {open && debounced.length >= 2 && (
        <div className="tw-absolute tw-z-10 tw-mt-1.5 tw-w-full tw-max-h-80 tw-overflow-y-auto tw-rounded-xl tw-border tw-border-hairline tw-border-tertiary tw-bg-bg-primary tw-shadow-lg tw-py-1">
          {isFetching ? (
            <div className="tw-px-4 tw-py-3 tw-text-small tw-text-fg-tertiary">Searching…</div>
          ) : results.length === 0 ? (
            <div className="tw-px-4 tw-py-3 tw-text-small tw-text-fg-tertiary">No listener matches “{debounced}”.</div>
          ) : (
            results.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => pick(r)}
                title={r.id}
                className="tw-w-full tw-text-left tw-px-4 tw-py-2.5 tw-flex tw-items-center tw-justify-between tw-gap-3 hover:tw-bg-bg-secondary tw-transition-colors"
              >
                <span className="tw-min-w-0 tw-flex tw-flex-col tw-gap-0.5">
                  <span className="tw-text-fg-primary tw-font-medium tw-truncate">{r.name || "Unnamed listener"}</span>
                  <span className="tw-text-small tw-text-fg-tertiary tw-truncate">{r.mobile || "no mobile on file"}</span>
                </span>
                <span className="tw-text-tiny tw-text-fg-tertiary tw-shrink-0 tw-font-mono">{r.id.slice(0, 8)}…</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// Listener payout details: PAN status, entity type, state and bank account. Needed before anyone can be paid,
// and before TDS and the per-state cycle can be right. Saving adds a new version; history is never overwritten.
export default function PayoutProfile() {
  const [lookup, setLookup] = useState("");
  const [pickedName, setPickedName] = useState("");
  const [manualId, setManualId] = useState("");
  const [showManual, setShowManual] = useState(false);
  const [f, setF] = useState(EMPTY);
  const [msg, setMsg] = useState({ tone: "", text: "" });
  const { data, error, isFetching } = useGetPayoutProfileQuery(lookup, { skip: !lookup });
  const [save, { isLoading }] = useSavePayoutProfileMutation();
  const p = data && data.profile;
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  if (error && errorMessage(error) === "NOT_ENABLED") return <NotEnabled />;

  const onSave = async () => {
    setMsg({ tone: "", text: "" });
    const body = { listenerId: lookup };
    for (const [k, v] of Object.entries(f)) if (v !== "" && v !== false) body[k] = v;
    if (Object.keys(body).length === 1) return setMsg({ tone: "danger", text: "Change at least one field." });
    try { await save(body).unwrap(); setF(EMPTY); setMsg({ tone: "success", text: "Saved as a new version." }); } catch (e) { setMsg({ tone: "danger", text: errorMessage(e) }); }
  };

  return (
    <div className="tw-flex tw-flex-col tw-gap-4 tw-text-left">
      <Link to="/dashboard/payout" className="tw-inline-flex tw-items-center tw-gap-1 tw-text-small tw-text-fg-tertiary"><ArrowLeft size={14} />All cycles</Link>
      <div>
        <h1 className="tw-text-h1 tw-text-fg-primary tw-m-0">Payout profiles</h1>
        <p className="tw-text-small tw-text-fg-tertiary tw-mt-1 tw-mb-0">PAN, state and bank details used for payouts and TDS. The PAN is stored encrypted; only its last four characters are ever shown.</p>
      </div>

      <Card>
        <div className="tw-flex tw-gap-2 tw-items-start tw-flex-wrap">
          <ListenerSearch onPick={(r) => { setLookup(r ? r.id : ""); setPickedName(r ? r.name : ""); setMsg({ tone: "", text: "" }); }} />
        </div>
        <button type="button" className="tw-mt-2 tw-text-small tw-text-fg-tertiary tw-underline" onClick={() => setShowManual((x) => !x)}>
          {showManual ? "Hide" : "Have the listener id already? Paste it directly"}
        </button>
        {showManual && (
          <div className="tw-flex tw-gap-2 tw-items-end tw-mt-2">
            <Field label="Listener id" className="tw-flex-1"><Input value={manualId} onChange={(e) => setManualId(e.target.value.trim())} placeholder="listener id from the listener profile page" /></Field>
            <Button variant="outline" disabled={!manualId} onClick={() => { setLookup(manualId); setPickedName(""); setMsg({ tone: "", text: "" }); }}>Load</Button>
          </div>
        )}
      </Card>

      {msg.text && <Notice tone={msg.tone === "success" ? "success" : "danger"} title={msg.tone === "success" ? "Done" : "Not saved"}>{msg.text}</Notice>}
      {error && errorMessage(error) !== "NOT_ENABLED" && <ErrorBanner title="Could not load" message={errorMessage(error)} />}

      {lookup && !isFetching && (
        <>
          <Card>
            <h2 className="tw-text-h3 tw-m-0 tw-mb-2">On file{pickedName ? ` — ${pickedName}` : ""}</h2>
            {!p ? <p className="tw-m-0 tw-text-fg-tertiary">Nothing yet for this listener. Until bank details are added, their payout is held.</p> : (
              <dl className="tw-grid tw-gap-x-6 tw-gap-y-1 tw-m-0" style={{ gridTemplateColumns: "max-content 1fr" }}>
                <dt>PAN</dt><dd>{p.panLast4 ? `••••••${p.panLast4}` : "not provided"} ({p.panStatus})</dd>
                <dt>Entity type</dt><dd>{p.entityType}</dd>
                <dt>State</dt><dd>{p.stateCode || "not set"}</dd>
                <dt>Account holder</dt><dd>{p.holderName || "—"}</dd>
                <dt>Account</dt><dd>{p.accountMasked || "—"} {p.ifsc || ""}</dd>
                <dt>UPI</dt><dd>{p.upiId || "—"}</dd>
                <dt>Last changed by</dt><dd>{p.changedBy}</dd>
              </dl>
            )}
          </Card>

          <Card>
            <h2 className="tw-text-h3 tw-m-0 tw-mb-2">Change (leave a field empty to keep it)</h2>
            <div className="tw-grid tw-gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
              <Field label="PAN (new)" helper="Format ABCDE1234F"><Input value={f.pan} onChange={set("pan")} maxLength={10} /></Field>
              <Field label="PAN status" helper="“valid” means you checked the PAN card image"><Select value={f.panStatus} onChange={set("panStatus")}><option value="">Keep</option><option value="unknown">Unknown</option><option value="provided">Provided, not checked</option><option value="valid">Valid (checked)</option></Select></Field>
              <Field label="Entity type"><Select value={f.entityType} onChange={set("entityType")}><option value="">Keep</option><option value="individual">Individual</option><option value="huf">HUF</option><option value="company">Company</option><option value="firm">Firm</option><option value="other">Other</option></Select></Field>
              <Field label="State code" helper="Two letters, e.g. KA"><Input value={f.stateCode} onChange={set("stateCode")} maxLength={2} /></Field>
              <Field label="Account holder name"><Input value={f.holderName} onChange={set("holderName")} /></Field>
              <Field label="Account number" helper="6-18 digits; keep leading zeros"><Input value={f.accountNumber} onChange={set("accountNumber")} /></Field>
              <Field label="IFSC"><Input value={f.ifsc} onChange={set("ifsc")} maxLength={11} /></Field>
              <Field label="UPI id"><Input value={f.upiId} onChange={set("upiId")} /></Field>
            </div>
            <div className="tw-mt-3"><Checkbox id="bv" label="I have verified this bank account" checked={f.bankVerified} onChange={set("bankVerified")} /></div>
            <div className="tw-mt-3"><Button disabled={isLoading} onClick={onSave}>{isLoading ? "Saving…" : "Save"}</Button></div>
          </Card>
        </>
      )}
    </div>
  );
}
