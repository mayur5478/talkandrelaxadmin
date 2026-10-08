import React, { useState } from "react";
import { ExternalLink } from "lucide-react";
import { Modal, ModalBody, ModalFooter, Button, Pill, Field, Input, Textarea, ErrorBanner, Spinner, useToast } from "../v2/ui";
import {
  useGetCounsellorQuery, useUpdateCounsellorMutation, useSetCheckMutation, useGoLiveMutation, useRemoveCounsellorMutation,
} from "../../services/counsellor";
import {
  CHECK_TYPES, CHECK_LABEL, RUBRIC_KEYS, STATUS_LABEL, statusTone, checkTone, formatPaise, formatDateTime,
  rupeesToPaise, parseList, errorMessage,
} from "./counsellorFormat";
import { TierBadge } from "./CounsellorCommon";

const isUrl = (s) => /^https?:\/\//i.test(String(s || ""));

function Row({ label, children }) {
  return (
    <div className="tw-flex tw-gap-3 tw-text-small">
      <div className="tw-w-36 tw-shrink-0 tw-text-fg-tertiary">{label}</div>
      <div className="tw-text-fg-primary tw-min-w-0 tw-break-words">{children === undefined || children === null || children === "" ? "—" : children}</div>
    </div>
  );
}

function CheckCard({ counsellor, check, onError }) {
  const { toast } = useToast();
  const [setCheck, { isLoading }] = useSetCheckMutation();
  const [notes, setNotes] = useState(check.notes || "");
  const [rubric, setRubric] = useState(() => {
    const s = check.score || {};
    return { empathy: s.empathy ?? "", boundaries: s.boundaries ?? "", language: s.language ?? "" };
  });
  const type = check.type;
  const isDemo = type === "demo";
  const rubricNums = RUBRIC_KEYS.map((k) => Number(rubric[k]));
  const rubricValid = rubricNums.every((n) => Number.isInteger(n) && n >= 1 && n <= 5);
  const rubricTouched = RUBRIC_KEYS.some((k) => rubric[k] !== "");
  const trainingBlocked = type === "training" && !counsellor.trainingAcceptedAt;

  const submit = async (status) => {
    onError("");
    const body = { id: counsellor.id, type, status };
    if (notes.trim()) body.notes = notes.trim();
    if (isDemo && rubricValid && status !== "pending") {
      body.score = { empathy: rubricNums[0], boundaries: rubricNums[1], language: rubricNums[2] };
    }
    try {
      await setCheck(body).unwrap();
      toast({ title: `${CHECK_LABEL[type]} marked ${status}`, tone: status === "passed" ? "success" : "neutral" });
    } catch (e) {
      onError(errorMessage(e, "Could not update the check"));
    }
  };

  return (
    <div className="tw-border tw-border-hairline tw-border-tertiary tw-rounded-lg tw-p-3 tw-flex tw-flex-col tw-gap-2">
      <div className="tw-flex tw-items-center tw-justify-between tw-gap-2 tw-flex-wrap">
        <div className="tw-font-medium tw-text-fg-primary">{CHECK_LABEL[type]}</div>
        <Pill tone={checkTone(check.status)} dot>{check.status || "pending"}</Pill>
      </div>
      {check.reviewedAt ? (
        <div className="tw-text-[11px] tw-text-fg-tertiary">Reviewed {formatDateTime(check.reviewedAt)}{check.reviewerId ? ` by #${check.reviewerId}` : ""}</div>
      ) : null}

      {isDemo ? (
        <div>
          <div className="tw-text-[12px] tw-text-fg-secondary tw-mb-1">Rubric (1 to 5 each, required to pass)</div>
          <div className="tw-grid tw-grid-cols-3 tw-gap-2">
            {RUBRIC_KEYS.map((k) => (
              <Field key={k} label={k.charAt(0).toUpperCase() + k.slice(1)}>
                <Input type="number" min={1} max={5} step={1} value={rubric[k]} onChange={(e) => setRubric((r) => ({ ...r, [k]: e.target.value }))} />
              </Field>
            ))}
          </div>
          {rubricTouched && !rubricValid ? <div className="tw-text-[11px] tw-text-fg-danger tw-mt-1">Each score must be a whole number from 1 to 5.</div> : null}
        </div>
      ) : null}

      {type === "training" ? (
        <div className="tw-text-[12px] tw-text-fg-secondary">
          Training accepted: {counsellor.trainingAcceptedAt ? formatDateTime(counsellor.trainingAcceptedAt) : "not yet. The counsellor must accept training in the app before this can pass."}
        </div>
      ) : null}

      <Textarea rows={2} placeholder="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} aria-label={`${CHECK_LABEL[type]} notes`} />
      <div className="tw-flex tw-gap-2 tw-flex-wrap">
        <Button size="sm" disabled={isLoading || trainingBlocked || (isDemo && !rubricValid)} onClick={() => submit("passed")}>Pass</Button>
        <Button size="sm" variant="danger" disabled={isLoading} onClick={() => submit("failed")}>Fail</Button>
        <Button size="sm" variant="outline" disabled={isLoading || !check.status || check.status === "pending"} onClick={() => submit("pending")}>Reset</Button>
      </div>
    </div>
  );
}

function EditForm({ c, onError }) {
  const { toast } = useToast();
  const [update, { isLoading }] = useUpdateCounsellorMutation();
  const [f, setF] = useState({
    displayName: "", about: "", image: "", rate: c.ratePaisePerMin != null ? String(c.ratePaisePerMin / 100) : "",
    modes: "", sessionMinutes: "", qualification: c.qualification || "", degree: c.degree || "", rci: c.rciNumber || "",
  });
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const rateInvalid = f.rate !== "" && rupeesToPaise(f.rate) === null;

  const save = async (e) => {
    e.preventDefault();
    onError("");
    // Only send what the admin filled in or changed; the list payload does not echo name/about/image/modes back.
    const body = { id: c.id };
    if (f.rate !== "") body.ratePaisePerMin = rupeesToPaise(f.rate);
    if (f.displayName.trim()) body.display_name = f.displayName.trim();
    if (f.about.trim()) body.about = f.about.trim();
    if (f.image.trim()) { body.image = f.image.trim(); body.display_image = f.image.trim(); }
    const modes = parseList(f.modes);
    if (modes.length) body.modes = modes;
    const mins = parseList(f.sessionMinutes, true);
    if (mins.length) body.sessionMinutes = mins;
    if (f.qualification.trim() && f.qualification.trim() !== (c.qualification || "")) body.qualification = f.qualification.trim();
    if (f.degree.trim() && f.degree.trim() !== (c.degree || "")) body.degree = f.degree.trim();
    if (f.rci.trim() && f.rci.trim() !== (c.rciNumber || "")) body.rci_number = f.rci.trim();
    if (Object.keys(body).length === 1) { onError("Nothing to save."); return; }
    try {
      await update(body).unwrap();
      toast({ title: "Counsellor updated", tone: "success" });
      setF((s) => ({ ...s, displayName: "", about: "", image: "", modes: "", sessionMinutes: "" }));
    } catch (err) {
      onError(errorMessage(err, "Could not save changes"));
    }
  };

  return (
    <form onSubmit={save} className="tw-flex tw-flex-col tw-gap-3">
      <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 tw-gap-3">
        <Field label="Rate (₹ per minute)" error={rateInvalid ? "Enter rupees, up to 2 decimals" : undefined}>
          <Input inputMode="decimal" value={f.rate} onChange={set("rate")} />
        </Field>
        <Field label="Display name" helper="Leave blank to keep the current one">
          <Input value={f.displayName} onChange={set("displayName")} />
        </Field>
        <Field label="Modes" helper="Comma separated, e.g. chat, voice, video. Blank keeps current">
          <Input value={f.modes} onChange={set("modes")} />
        </Field>
        <Field label="Session minutes" helper="Comma separated, e.g. 30, 45, 60. Blank keeps current">
          <Input value={f.sessionMinutes} onChange={set("sessionMinutes")} />
        </Field>
        <Field label="Image URL" className="sm:tw-col-span-2">
          <Input type="url" placeholder="https://" value={f.image} onChange={set("image")} />
        </Field>
        <Field label="Qualification"><Input value={f.qualification} onChange={set("qualification")} /></Field>
        <Field label="Degree"><Input value={f.degree} onChange={set("degree")} /></Field>
        <Field label="RCI number"><Input value={f.rci} onChange={set("rci")} /></Field>
      </div>
      <Field label="About" helper="Leave blank to keep the current text">
        <Textarea rows={3} value={f.about} onChange={set("about")} />
      </Field>
      <div><Button type="submit" loading={isLoading} disabled={isLoading || rateInvalid}>Save changes</Button></div>
    </form>
  );
}

export default function CounsellorDetail({ id, onClose }) {
  const { toast } = useToast();
  const { data, isLoading, error } = useGetCounsellorQuery(id, { skip: !id });
  const [goLive, { isLoading: goingLive }] = useGoLiveMutation();
  const [removeC, { isLoading: removing }] = useRemoveCounsellorMutation();
  const [actionError, setActionError] = useState("");
  const [liveName, setLiveName] = useState("");
  const [removeOpen, setRemoveOpen] = useState(false);
  const [reason, setReason] = useState("");

  const c = data && data.counsellor;
  const checks = CHECK_TYPES.map((t) => (c && (c.checks || []).find((x) => x.type === t)) || { type: t, status: "pending" });
  const allPassed = checks.every((x) => x.status === "passed");
  const canGoLive = c && allPassed && c.status !== "live" && c.status !== "removed";

  const onGoLive = async () => {
    setActionError("");
    try {
      const out = await goLive({ id: c.id, displayName: liveName.trim() }).unwrap();
      toast({ title: "Counsellor is live", description: `Tier ${out.tier}, share ${(out.shareBps / 100).toFixed(0)}%`, tone: "success" });
    } catch (e) {
      setActionError(errorMessage(e, "Could not go live"));
    }
  };

  const onRemove = async () => {
    if (!reason.trim()) return;
    setActionError("");
    try {
      const out = await removeC({ id: c.id, reason: reason.trim() }).unwrap();
      toast({ title: "Counsellor removed", description: `${out.cancelledBookings ?? 0} booking(s) cancelled`, tone: "neutral" });
      setRemoveOpen(false);
      setReason("");
    } catch (e) {
      setActionError(errorMessage(e, "Could not remove"));
      setRemoveOpen(false);
    }
  };

  return (
    <>
      <Modal open={!!id} onClose={onClose} size="xl" title={c ? c.name || `Counsellor #${c.id}` : "Counsellor"} description={c ? `#${c.id} · user ${c.userId}` : undefined}>
        <ModalBody className="tw-max-h-[70vh] tw-overflow-y-auto tw-flex tw-flex-col tw-gap-5 tw-text-left">
          {isLoading ? <div className="tw-py-6 tw-text-center"><Spinner /></div> : null}
          {error ? <ErrorBanner title="Could not load the counsellor" message={errorMessage(error)} /> : null}
          {actionError ? <ErrorBanner title="Action failed" message={actionError} /> : null}

          {c ? (
            <>
              <section className="tw-flex tw-flex-col tw-gap-1.5">
                <div className="tw-flex tw-items-center tw-gap-2 tw-flex-wrap tw-mb-1">
                  <Pill tone={statusTone(c.status)} dot>{STATUS_LABEL[c.status] || c.status}</Pill>
                  {c.tier ? <TierBadge tier={c.tier} /> : null}
                  {c.isHead ? <Pill tone="info">Head</Pill> : null}
                </div>
                {isUrl(c.displayImage || c.image) ? (
                  <img src={c.displayImage || c.image} alt="" className="tw-w-20 tw-h-20 tw-rounded-lg tw-object-cover tw-mb-1" />
                ) : null}
                <Row label="Mobile">{c.mobile}</Row>
                <Row label="Email">{c.email}</Row>
                <Row label="Qualification">{c.qualification}</Row>
                <Row label="Degree">{c.degree}</Row>
                <Row label="RCI number">{c.rciNumber}</Row>
                <Row label="Experience">{c.experienceYears != null ? `${c.experienceYears} years` : null}</Row>
                <Row label="Specialisations">{(c.specialisations || []).join(", ")}</Row>
                <Row label="Reference">{[c.referenceName, c.referenceContact].filter(Boolean).join(" · ")}</Row>
                <Row label="Rate">{c.ratePaisePerMin != null ? `${formatPaise(c.ratePaisePerMin)} / min` : null}</Row>
                <Row label="Recruited by">{c.recruitedBy ? `#${c.recruitedBy}` : null}</Row>
                <Row label="Referral code">{c.referralCode}</Row>
                <Row label="Applied">{formatDateTime(c.createdAt)}</Row>
                {c.removedAt ? <Row label="Removed">{`${formatDateTime(c.removedAt)}${c.removalReason ? `: ${c.removalReason}` : ""}`}</Row> : null}
                <Row label="Certificates">
                  {(c.certificates || []).length ? (
                    <div className="tw-flex tw-flex-col tw-gap-1">
                      {c.certificates.map((cert, i) => {
                        const href = typeof cert === "string" ? cert : cert && (cert.url || cert.link);
                        const label = (cert && cert.name) || `Certificate ${i + 1}`;
                        return isUrl(href) ? (
                          <a key={i} href={href} target="_blank" rel="noopener noreferrer" className="tw-text-fg-info tw-inline-flex tw-items-center tw-gap-1">
                            {label} <ExternalLink size={12} aria-hidden />
                          </a>
                        ) : <span key={i}>{typeof cert === "string" ? cert : label}</span>;
                      })}
                    </div>
                  ) : null}
                </Row>
              </section>

              <section className="tw-flex tw-flex-col tw-gap-2">
                <h3 className="tw-text-h3 tw-text-fg-primary tw-m-0">Vetting checks</h3>
                <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-3">
                  {checks.map((ck) => (
                    <CheckCard key={`${c.id}-${ck.type}-${ck.reviewedAt || ""}-${ck.status}`} counsellor={c} check={ck} onError={setActionError} />
                  ))}
                </div>
              </section>

              {c.status !== "live" && c.status !== "removed" ? (
                <section className="tw-flex tw-flex-col tw-gap-2">
                  <h3 className="tw-text-h3 tw-text-fg-primary tw-m-0">Go live</h3>
                  <Field label="Display name (optional)" helper={allPassed ? "All five checks passed." : "All five checks must pass first. The server enforces this."}>
                    <Input value={liveName} onChange={(e) => setLiveName(e.target.value)} />
                  </Field>
                  <div><Button onClick={onGoLive} loading={goingLive} disabled={!canGoLive || goingLive}>Go live</Button></div>
                </section>
              ) : null}

              <section className="tw-flex tw-flex-col tw-gap-2">
                <h3 className="tw-text-h3 tw-text-fg-primary tw-m-0">Edit profile</h3>
                <EditForm key={`${c.id}-${c.ratePaisePerMin}`} c={c} onError={setActionError} />
              </section>
            </>
          ) : null}
        </ModalBody>
        <ModalFooter>
          {c && c.status !== "removed" ? <Button variant="danger" onClick={() => setRemoveOpen(true)}>Remove</Button> : null}
          <Button variant="ghost" onClick={onClose}>Close</Button>
        </ModalFooter>
      </Modal>

      <Modal open={removeOpen} onClose={() => setRemoveOpen(false)} title="Remove counsellor" description="Future bookings are cancelled. A reason is required and is kept on record.">
        <ModalBody>
          <Field label="Reason" required>
            <Textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
          </Field>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setRemoveOpen(false)}>Cancel</Button>
          <Button variant="danger" onClick={onRemove} loading={removing} disabled={removing || !reason.trim()}>Remove</Button>
        </ModalFooter>
      </Modal>
    </>
  );
}
