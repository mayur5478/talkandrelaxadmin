import React, { useEffect, useState } from "react";
import moment from "moment";
import { ShieldOff, Trash2, MicOff, Clock, RefreshCw, Download } from "lucide-react";
import { useLazyGetSessionRecordingQuery } from "../../../services/monitoring";
import { Modal, ModalBody, Spinner, ErrorBanner } from "../../v2/ui";

/**
 * RecordingModal — audio playback for one call session, the sibling of
 * TranscriptModal on the Service History drill-down.
 *
 * The backend mints a SHORT-LIVED presigned URL (5 min default), so this uses a
 * LAZY query and refetches on every open. A cached URL would 403 mid-playback.
 *
 * `controlsList="nodownload"` hides the download button. That is a nudge, not a
 * control — anyone with devtools can read the src. The real limits are the short
 * TTL, the admin-only route, and the server-side access log.
 */
export default function RecordingModal({ open, onClose, sessionId, sessionMeta }) {
  const [fetchRecording, { data, error, isFetching }] = useLazyGetSessionRecordingQuery();

  // Separate hook instance so minting the download URL doesn't replace the
  // playback data (which would swap the <audio> src mid-listen).
  const [fetchDownload, { isFetching: downloading }] = useLazyGetSessionRecordingQuery();
  const [dlError, setDlError] = useState(null);

  useEffect(() => {
    if (open && sessionId) fetchRecording(sessionId);
    setDlError(null);
  }, [open, sessionId, fetchRecording]);

  const onDownload = async () => {
    setDlError(null);
    try {
      const res = await fetchDownload({ id: sessionId, download: true }).unwrap();
      const a = document.createElement("a");
      a.href = res.data.url; // Content-Disposition: attachment, so the browser saves it
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      setDlError(e?.data?.message || "Download failed.");
    }
  };

  const s = sessionMeta;
  const rec = data?.data;
  const status = error?.status;
  const msg = error?.data?.message;
  const recStatus = error?.data?.recording_status;

  const fmt = (d) => (d ? moment(d).format("DD/MM/YY, hh:mm A") : "—");

  // Each failure means something different to an admin, so they get distinct
  // states rather than one generic "could not load". 'started'/'stopped' both
  // mean a recording genuinely exists and is still being captured/uploaded —
  // that reads very differently from "never recorded" and shouldn't share the
  // same dead-end icon.
  const disabled = status === 403;
  const purged = status === 410;
  const processing = status === 404 && (recStatus === "started" || recStatus === "stopped");
  const missing = status === 404 && !processing;

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="Call recording"
      // Field names come from the Service History row shape (username /
      // listenerName / createdAt), NOT the session record. Duration is left to
      // the API response below, which is the billing-accurate value.
      description={
        s
          ? [
              [s.username, s.listenerName].filter(Boolean).join(" ↔ "),
              s.createdAt ? moment(s.createdAt).format("DD/MM/YY, hh:mm A") : null,
              s.service_type,
            ]
              .filter(Boolean)
              .join(" · ")
          : "Loading session…"
      }
    >
      <ModalBody className="tw-flex tw-flex-col tw-gap-3">
        {disabled ? (
          <div className="tw-flex tw-flex-col tw-items-center tw-gap-2 tw-py-12 tw-text-center">
            <ShieldOff size={22} className="tw-text-fg-tertiary" aria-hidden />
            <p className="tw-text-[13px] tw-text-fg-secondary tw-m-0">Call recording is turned off.</p>
            <p className="tw-text-[12px] tw-text-fg-tertiary tw-m-0">
              Set <code>CALL_RECORDING_ENABLED=true</code> on the backend to enable it.
            </p>
          </div>
        ) : purged ? (
          <div className="tw-flex tw-flex-col tw-items-center tw-gap-2 tw-py-12 tw-text-center">
            <Trash2 size={22} className="tw-text-fg-tertiary" aria-hidden />
            <p className="tw-text-[13px] tw-text-fg-secondary tw-m-0">
              This recording was deleted under the retention policy.
            </p>
            <p className="tw-text-[12px] tw-text-fg-tertiary tw-m-0">
              Audio is removed automatically once its retention window ends.
            </p>
          </div>
        ) : processing ? (
          <div className="tw-flex tw-flex-col tw-items-center tw-gap-3 tw-py-12 tw-text-center">
            <Clock size={22} className="tw-text-fg-tertiary" aria-hidden />
            <p className="tw-text-[13px] tw-text-fg-secondary tw-m-0">
              {msg || "Recording is processing — check back in a minute."}
            </p>
            <button
              type="button"
              onClick={() => fetchRecording(sessionId)}
              className="tw-flex tw-items-center tw-gap-1.5 tw-bg-transparent tw-border tw-border-hairline tw-border-tertiary tw-rounded-md tw-px-3 tw-py-1.5 tw-text-[12px] tw-text-fg-secondary hover:tw-bg-bg-secondary tw-transition-colors tw-duration-fast tw-cursor-pointer"
            >
              <RefreshCw size={12} aria-hidden /> Check again
            </button>
          </div>
        ) : missing ? (
          <div className="tw-flex tw-flex-col tw-items-center tw-gap-2 tw-py-12 tw-text-center">
            <MicOff size={22} className="tw-text-fg-tertiary" aria-hidden />
            <p className="tw-text-[13px] tw-text-fg-secondary tw-m-0">
              {msg || "No recording exists for this session."}
            </p>
          </div>
        ) : isFetching ? (
          <div className="tw-flex tw-items-center tw-justify-center tw-gap-2 tw-py-16 tw-text-fg-tertiary tw-text-[13px]">
            <Spinner size={18} className="tw-text-fg-info" /> Loading recording…
          </div>
        ) : error ? (
          <ErrorBanner
            title="Failed to load recording"
            message={
              [error?.data?.message, error?.data?.error].filter(Boolean).join(" — ") ||
              "Please try again."
            }
          />
        ) : rec?.url ? (
          <>
            {/* key forces a fresh <audio> element when a new signed URL arrives */}
            <audio
              key={rec.url}
              src={rec.url}
              controls
              controlsList="nodownload"
              className="tw-w-full"
            >
              Your browser cannot play this audio.
            </audio>

            <dl className="tw-grid tw-grid-cols-2 tw-gap-x-4 tw-gap-y-1 tw-text-[12px] tw-text-fg-secondary tw-mt-2 tw-mb-0">
              <dt className="tw-font-medium">Type</dt>
              <dd className="tw-m-0">{rec.type || "—"}</dd>
              <dt className="tw-font-medium">Started</dt>
              <dd className="tw-m-0">{fmt(rec.start_time)}</dd>
              <dt className="tw-font-medium">Ended</dt>
              <dd className="tw-m-0">{fmt(rec.end_time)}</dd>
              <dt className="tw-font-medium">Billed minutes</dt>
              <dd className="tw-m-0">{rec.total_duration ?? "—"}</dd>
              <dt className="tw-font-medium">Deleted on</dt>
              <dd className="tw-m-0">{fmt(rec.purge_at)}</dd>
            </dl>

            <div className="tw-flex tw-items-center tw-gap-3 tw-mt-2">
              <button
                type="button"
                onClick={onDownload}
                disabled={downloading}
                className="tw-flex tw-items-center tw-gap-1.5 tw-bg-transparent tw-border tw-border-hairline tw-border-tertiary tw-rounded-md tw-px-3 tw-py-1.5 tw-text-[12px] tw-text-fg-secondary hover:tw-bg-bg-secondary tw-transition-colors tw-duration-fast tw-cursor-pointer disabled:tw-opacity-50"
              >
                <Download size={12} aria-hidden /> {downloading ? "Preparing…" : "Download"}
              </button>
              {dlError && <span className="tw-text-[12px] tw-text-fg-danger">{dlError}</span>}
            </div>

            <p className="tw-text-[12px] tw-text-fg-tertiary tw-border-t tw-border-hairline tw-border-tertiary tw-pt-3 tw-mt-2 tw-mb-0">
              This playback link expires in {Math.round((rec.expires_in || 300) / 60)} minutes.
              Playback and downloads are logged with your admin identity.
            </p>
          </>
        ) : (
          <div className="tw-text-center tw-py-12 tw-text-fg-tertiary tw-text-[13px]">
            Nothing to play.
          </div>
        )}
      </ModalBody>
    </Modal>
  );
}
