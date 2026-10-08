import React, { useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { Card, Button, Pill, ErrorBanner, Field, Input, Textarea, Modal, ModalBody, ModalFooter, Spinner, useToast } from "../v2/ui";
import {
  useGetConfigQuery, useSetConfigMutation, useResetConfigMutation, useCreateHeadMutation, useAddCounsellorMutation,
} from "../../services/counsellor";
import { isNotEnabled, errorMessage } from "./counsellorFormat";
import { NotEnabled, PageHeader } from "./CounsellorCommon";
import { getRole, ROLE_ADMIN, ROLE_COUNSELLOR_HEAD } from "../../utils/roles";

// Logical grouping by key name; anything unmatched lands in "Other".
const GROUPS = [
  ["Tiers", /tier/i],
  ["Head ladder", /head|ladder/i],
  ["Price band", /price|band|rate/i],
  ["Packages", /package|bundle/i],
  ["Policy", /policy|noshow|no_show|cancel|refund|grace|rating|quality|checkin/i],
];
export function groupOf(key) {
  const hit = GROUPS.find(([, re]) => re.test(key));
  return hit ? hit[0] : "Other";
}
export function groupKeys(keys) {
  const out = {};
  [...keys].sort().forEach((k) => { (out[groupOf(k)] = out[groupOf(k)] || []).push(k); });
  return [...GROUPS.map(([n]) => n), "Other"].filter((n) => out[n]).map((n) => [n, out[n]]);
}
const pretty = (v) => JSON.stringify(v, null, 2);
const short = (v) => { const s = JSON.stringify(v); return s && s.length > 70 ? `${s.slice(0, 70)}…` : s; };

function NumField({ label, value, onChange }) {
  return (
    <Field label={label} required>
      <Input inputMode="numeric" value={value} onChange={(e) => onChange(e.target.value)} />
    </Field>
  );
}

function CreateHeadModal({ onClose }) {
  const { toast } = useToast();
  const [create, { isLoading }] = useCreateHeadMutation();
  const [f, setF] = useState({ userId: "", adminAccountId: "", displayName: "", qualification: "", degree: "", image: "" });
  const [err, setErr] = useState("");
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v }));
  const valid = /^\d+$/.test(f.userId.trim()) && (f.adminAccountId.trim() === "" || /^\d+$/.test(f.adminAccountId.trim()));

  const submit = async () => {
    setErr("");
    const details = {};
    if (f.displayName.trim()) details.display_name = f.displayName.trim();
    if (f.qualification.trim()) details.qualification = f.qualification.trim();
    if (f.degree.trim()) details.degree = f.degree.trim();
    if (f.image.trim()) details.image = f.image.trim();
    const body = { userId: Number(f.userId) };
    if (f.adminAccountId.trim()) body.adminAccountId = Number(f.adminAccountId);
    if (Object.keys(details).length) body.details = details;
    try {
      const out = await create(body).unwrap();
      toast({ title: "Head of Counsellors created", description: `Referral code ${out.referralCode}`, tone: "success", duration: 8000 });
      onClose();
    } catch (e) { setErr(errorMessage(e, "Could not create the head")); }
  };

  return (
    <Modal open onClose={onClose} title="Create Head of Counsellors" description="Links a user and an admin login. The admin account's role must be counsellor_head.">
      <ModalBody className="tw-flex tw-flex-col tw-gap-3 tw-text-left tw-max-h-[65vh] tw-overflow-y-auto">
        {err ? <ErrorBanner title="Failed" message={err} /> : null}
        <NumField label="User ID" value={f.userId} onChange={set("userId")} />
        <Field label="Admin account ID" helper="The admins-table id this head signs in with"><Input inputMode="numeric" value={f.adminAccountId} onChange={(e) => set("adminAccountId")(e.target.value)} /></Field>
        <Field label="Display name"><Input value={f.displayName} onChange={(e) => set("displayName")(e.target.value)} /></Field>
        <Field label="Qualification"><Input value={f.qualification} onChange={(e) => set("qualification")(e.target.value)} /></Field>
        <Field label="Degree"><Input value={f.degree} onChange={(e) => set("degree")(e.target.value)} /></Field>
        <Field label="Image URL"><Input type="url" value={f.image} onChange={(e) => set("image")(e.target.value)} /></Field>
      </ModalBody>
      <ModalFooter>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={submit} loading={isLoading} disabled={isLoading || !valid}>Create head</Button>
      </ModalFooter>
    </Modal>
  );
}

function AddCounsellorModal({ onClose }) {
  const { toast } = useToast();
  const [add, { isLoading }] = useAddCounsellorMutation();
  const [f, setF] = useState({ userId: "", qualification: "", degree: "", experience: "", image: "", referralCode: "" });
  const [err, setErr] = useState("");
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const valid = /^\d+$/.test(f.userId.trim()) && (f.experience.trim() === "" || /^\d+(\.\d+)?$/.test(f.experience.trim()));

  const submit = async () => {
    setErr("");
    const details = {};
    if (f.qualification.trim()) details.qualification = f.qualification.trim();
    if (f.degree.trim()) details.degree = f.degree.trim();
    if (f.experience.trim()) details.experience_years = Number(f.experience);
    if (f.image.trim()) details.image = f.image.trim();
    const body = { userId: Number(f.userId), details };
    if (f.referralCode.trim()) body.referralCode = f.referralCode.trim();
    try {
      const out = await add(body).unwrap();
      toast({ title: "Counsellor added", description: `Counsellor #${out.id}. Find them under Applications & Vetting.`, tone: "success" });
      onClose();
    } catch (e) { setErr(errorMessage(e, "Could not add the counsellor")); }
  };

  return (
    <Modal open onClose={onClose} title="Add counsellor" description="Adds an existing user as a counsellor applicant. Vetting still applies.">
      <ModalBody className="tw-flex tw-flex-col tw-gap-3 tw-text-left tw-max-h-[65vh] tw-overflow-y-auto">
        {err ? <ErrorBanner title="Failed" message={err} /> : null}
        <Field label="User ID" required><Input inputMode="numeric" value={f.userId} onChange={set("userId")} /></Field>
        <Field label="Qualification"><Input value={f.qualification} onChange={set("qualification")} /></Field>
        <Field label="Degree"><Input value={f.degree} onChange={set("degree")} /></Field>
        <Field label="Experience (years)"><Input inputMode="decimal" value={f.experience} onChange={set("experience")} /></Field>
        <Field label="Image URL"><Input type="url" value={f.image} onChange={set("image")} /></Field>
        <Field label="Referral code" helper="Optional. Credits the recruiting counsellor"><Input value={f.referralCode} onChange={set("referralCode")} /></Field>
      </ModalBody>
      <ModalFooter>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={submit} loading={isLoading} disabled={isLoading || !valid}>Add counsellor</Button>
      </ModalFooter>
    </Modal>
  );
}

export default function CounsellorConfig() {
  const { toast } = useToast();
  const role = getRole();
  const { data, isLoading, error } = useGetConfigQuery(undefined, { skip: role === ROLE_COUNSELLOR_HEAD });
  const [setConfig, { isLoading: saving }] = useSetConfigMutation();
  const [resetConfig, { isLoading: resetting }] = useResetConfigMutation();
  const [selected, setSelected] = useState(null);
  const [draft, setDraft] = useState("");
  const [formError, setFormError] = useState("");
  const [modal, setModal] = useState(null); // "head" | "add" | null

  const config = (data && data.config) || {};
  const overridden = useMemo(() => new Set((data && data.overridden) || []), [data]);
  const defaults = (data && data.defaults) || {};
  const groups = useMemo(() => groupKeys(Object.keys(config)), [config]);

  // Head of Counsellors must never see this page (the route guard also blocks it).
  if (role === ROLE_COUNSELLOR_HEAD) return <Navigate to="/dashboard/counsellors/applications" replace />;
  if (isNotEnabled(error)) return <NotEnabled />;

  const choose = (k) => { setSelected(k); setDraft(pretty(config[k])); setFormError(""); };

  let parsed; let parseError = "";
  try { parsed = JSON.parse(draft); } catch (e) { parseError = "Not valid JSON: " + e.message; }

  const save = async () => {
    setFormError("");
    try {
      await setConfig({ key: selected, value: parsed }).unwrap();
      toast({ title: `Saved ${selected}`, tone: "success" });
    } catch (e) { setFormError(errorMessage(e, "Could not save")); }
  };
  const reset = async () => {
    setFormError("");
    try {
      await resetConfig(selected).unwrap();
      toast({ title: `${selected} reset to default`, tone: "neutral" });
      setSelected(null);
    } catch (e) { setFormError(errorMessage(e, "Could not reset")); }
  };

  return (
    <div className="tw-flex tw-flex-col tw-gap-4 tw-text-left">
      <PageHeader
        title="Counsellor config"
        subtitle="Effective values the server is using. Overridden keys differ from the built-in default."
        actions={role === ROLE_ADMIN ? (
          <>
            <Button variant="outline" onClick={() => setModal("add")}>Add counsellor</Button>
            <Button onClick={() => setModal("head")}>Create Head of Counsellors</Button>
          </>
        ) : null}
      />
      {error ? <ErrorBanner title="Could not load config" message={errorMessage(error)} /> : null}
      {isLoading ? <div className="tw-py-6 tw-text-center"><Spinner /></div> : (
        <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-2 tw-gap-4">
          <div className="tw-flex tw-flex-col tw-gap-3">
            {groups.length === 0 ? <Card>No config keys returned.</Card> : groups.map(([name, keys]) => (
              <Card key={name} flush>
                <div className="tw-px-4 tw-py-2 tw-text-[12px] tw-font-semibold tw-uppercase tw-tracking-wide tw-text-fg-tertiary tw-border-b tw-border-hairline tw-border-tertiary">{name}</div>
                <ul className="tw-list-none tw-m-0 tw-p-0">
                  {keys.map((k) => (
                    <li key={k}>
                      <button
                        type="button"
                        onClick={() => choose(k)}
                        className={`tw-w-full tw-text-left tw-bg-transparent tw-border-0 tw-px-4 tw-py-2 tw-flex tw-items-start tw-gap-2 hover:tw-bg-bg-secondary ${selected === k ? "tw-bg-bg-secondary" : ""}`}
                      >
                        <div className="tw-min-w-0 tw-flex-1">
                          <div className="tw-text-small tw-font-medium tw-text-fg-primary tw-break-all">{k}</div>
                          <div className="tw-text-[11px] tw-text-fg-tertiary tw-break-all">{short(config[k])}</div>
                        </div>
                        {overridden.has(k) ? <Pill tone="warning">Overridden</Pill> : <Pill tone="neutral">Default</Pill>}
                      </button>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>

          <Card className="tw-self-start tw-flex tw-flex-col tw-gap-3">
            {!selected ? (
              <div className="tw-text-small tw-text-fg-tertiary">Select a key to view or edit its value.</div>
            ) : (
              <>
                <div className="tw-flex tw-items-center tw-gap-2 tw-flex-wrap">
                  <h3 className="tw-text-h3 tw-text-fg-primary tw-m-0 tw-break-all">{selected}</h3>
                  {overridden.has(selected) ? <Pill tone="warning">Overridden</Pill> : <Pill tone="neutral">Default</Pill>}
                </div>
                {formError ? <ErrorBanner title="Failed" message={formError} /> : null}
                <Field label="Value (JSON)" error={parseError || undefined}>
                  <Textarea rows={12} spellCheck={false} className="tw-font-mono" value={draft} onChange={(e) => setDraft(e.target.value)} />
                </Field>
                {overridden.has(selected) && defaults[selected] !== undefined ? (
                  <div className="tw-text-[11px] tw-text-fg-tertiary tw-break-all">Default: {short(defaults[selected])}</div>
                ) : null}
                <div className="tw-flex tw-gap-2 tw-flex-wrap">
                  <Button onClick={save} loading={saving} disabled={saving || !!parseError}>Save override</Button>
                  <Button variant="outline" onClick={reset} loading={resetting} disabled={resetting || !overridden.has(selected)}>Reset to default</Button>
                </div>
              </>
            )}
          </Card>
        </div>
      )}
      {modal === "head" ? <CreateHeadModal onClose={() => setModal(null)} /> : null}
      {modal === "add" ? <AddCounsellorModal onClose={() => setModal(null)} /> : null}
    </div>
  );
}
