import React, { useMemo, useState } from "react";
import moment from "moment";
import {
  Download, Image as ImageIcon, Mic, Search, ShieldOff, Trash2,
} from "lucide-react";
import { useGetSessionTranscriptQuery } from "../../../services/monitoring";
import {
  Modal, ModalBody, ModalFooter,
  Button, Spinner, ErrorBanner, Pill,
} from "../../v2/ui";

/**
 * TranscriptModal — read-only view of a chat session's messages, opened from
 * the Service History table.
 *
 * The backend surface is admin-only AND flag-gated (CHAT_TRANSCRIPT_ENABLED).
 * When the flag is off it answers 403 with { disabled: true }; that case gets
 * an explanation here rather than a generic failure banner, because it is a
 * configuration state, not an error.
 *
 * Calls have no stored transcript — there is no recording or speech-to-text
 * pipeline — so a call row says so instead of showing an empty thread.
 */
function Bubble({ m, side }) {
  const isUser = side === "user";
  const bubbleCls = isUser
    ? "tw-bg-bg-secondary tw-text-fg-primary tw-border-tertiary"
    : "tw-bg-fg-info/10 tw-text-fg-primary tw-border-fg-info/20";

  return (
    <div className={`tw-flex tw-w-full ${isUser ? "tw-justify-start" : "tw-justify-end"}`}>
      <div className="tw-max-w-[78%] tw-flex tw-flex-col tw-gap-1">
        <div className={`tw-text-[10px] tw-text-fg-tertiary ${isUser ? "" : "tw-text-right"}`}>
          {m.sender_name || (isUser ? "User" : "Listener")}
        </div>

        <div className={`tw-rounded-lg tw-border tw-border-hairline tw-px-3 tw-py-2 ${bubbleCls}`}>
          {m.reply_to_text && (
            <div className="tw-border-l-2 tw-border-fg-tertiary tw-pl-2 tw-mb-1.5 tw-text-[11px] tw-text-fg-tertiary tw-italic">
              {m.reply_to_text}
            </div>
          )}

          {m.is_deleted ? (
            <span className="tw-flex tw-items-center tw-gap-1.5 tw-text-[12px] tw-italic tw-text-fg-tertiary">
              <Trash2 size={11} aria-hidden />
              Deleted{m.deleted_by ? ` by ${m.deleted_by}` : ""}
            </span>
          ) : m.message_type === "image" ? (
            <div className="tw-flex tw-flex-col tw-gap-1.5">
              <a
                href={m.media_url}
                target="_blank"
                rel="noreferrer"
                className="tw-flex tw-items-center tw-gap-1.5 tw-text-[12px] tw-text-fg-info hover:tw-underline"
              >
                <ImageIcon size={12} aria-hidden /> Photo
              </a>
              {m.media_url && (
                <img
                  src={m.media_url}
                  alt=""
                  loading="lazy"
                  className="tw-max-w-[220px] tw-rounded-md tw-border tw-border-hairline tw-border-tertiary"
                />
              )}
              {m.message && (
                <span className="tw-text-[13px] tw-whitespace-pre-wrap tw-break-words">{m.message}</span>
              )}
            </div>
          ) : m.message_type === "audio" ? (
            <div className="tw-flex tw-flex-col tw-gap-1.5">
              <span className="tw-flex tw-items-center tw-gap-1.5 tw-text-[12px] tw-text-fg-secondary">
                <Mic size={12} aria-hidden /> Voice note
              </span>
              {m.media_url && <audio controls src={m.media_url} className="tw-max-w-[220px]" />}
            </div>
          ) : (
            <span className="tw-text-[13px] tw-whitespace-pre-wrap tw-break-words">
              {m.message || <em className="tw-text-fg-tertiary">(empty)</em>}
            </span>
          )}

          <div
            className={`tw-flex tw-items-center tw-gap-2 tw-mt-1 tw-text-[10px] tw-text-fg-tertiary ${isUser ? "" : "tw-justify-end"}`}
          >
            <span>{moment(m.createdAt).format("DD/MM/YY, hh:mm:ss A")}</span>
            {m.is_read ? <span>Read</span> : m.is_delivered ? <span>Delivered</span> : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TranscriptModal({ open, onClose, sessionId, sessionMeta }) {
  const [query, setQuery] = useState("");

  const { data, error, isFetching } = useGetSessionTranscriptQuery(
    { id: sessionId, page: 1, limit: 500 },
    { skip: !open || !sessionId },
  );

  const disabled = error?.status === 403 && error?.data?.disabled;

  const messages = useMemo(() => {
    const all = data?.messages || [];
    const q = query.trim().toLowerCase();
    if (!q) return all;
    return all.filter((m) => (m.message || "").toLowerCase().includes(q));
  }, [data, query]);

  const sessionType = String(sessionMeta?.service_type || data?.session?.type || "").toLowerCase();
  const isCall = sessionType !== "chat";

  const downloadTxt = () => {
    const s = data?.session;
    const header = [
      `Session: ${s?.id}`,
      `Type: ${s?.type}`,
      `User: ${s?.user_name}`,
      `Listener: ${s?.listener_name}`,
      `Started: ${s?.start_time ? moment(s.start_time).format("DD/MM/YYYY, hh:mm A") : "-"}`,
      `Ended: ${s?.end_time ? moment(s.end_time).format("DD/MM/YYYY, hh:mm A") : "-"}`,
      "",
      "",
    ].join("\n");

    const body = (data?.messages || [])
      .map((m) => {
        const who = m.sender_name || m.sent_by || "?";
        const when = moment(m.createdAt).format("DD/MM/YY HH:mm:ss");
        const text = m.is_deleted
          ? "[deleted]"
          : m.message_type === "text"
            ? m.message || ""
            : `[${m.message_type}] ${m.media_url || ""} ${m.message || ""}`.trim();
        return `[${when}] ${who}: ${text}`;
      })
      .join("\n");

    const blob = new Blob([header + body], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transcript_${sessionId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const s = data?.session;

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      title="Chat transcript"
      description={
        s
          ? `${s.user_name} ↔ ${s.listener_name} · ${s.start_time ? moment(s.start_time).format("DD/MM/YY, hh:mm A") : "-"} · ${Math.round(Number(s.total_duration || 0) / 60)} min`
          : "Loading session…"
      }
    >
      <ModalBody className="tw-flex tw-flex-col tw-gap-3">
        {!disabled && !isCall && (
          <div className="tw-relative">
            <Search
              size={14}
              className="tw-absolute tw-left-3 tw-top-1/2 -tw-translate-y-1/2 tw-text-fg-tertiary tw-pointer-events-none"
              aria-hidden
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search within this transcript…"
              className="tw-w-full tw-bg-bg-secondary tw-text-fg-primary tw-text-[13px] tw-border tw-border-hairline tw-border-tertiary tw-rounded-md tw-pl-9 tw-pr-3 tw-py-2 tw-outline-none focus:tw-ring-2 focus:tw-ring-fg-info placeholder:tw-text-fg-tertiary"
            />
          </div>
        )}

        {disabled ? (
          <div className="tw-flex tw-flex-col tw-items-center tw-gap-2 tw-py-12 tw-text-center">
            <ShieldOff size={22} className="tw-text-fg-tertiary" aria-hidden />
            <p className="tw-text-[13px] tw-text-fg-secondary tw-m-0">Transcript viewing is turned off.</p>
            <p className="tw-text-[12px] tw-text-fg-tertiary tw-m-0">
              Set <code>CHAT_TRANSCRIPT_ENABLED=true</code> on the backend to enable it.
            </p>
          </div>
        ) : isFetching ? (
          <div className="tw-flex tw-items-center tw-justify-center tw-gap-2 tw-py-16 tw-text-fg-tertiary tw-text-[13px]">
            <Spinner size={18} className="tw-text-fg-info" /> Loading transcript…
          </div>
        ) : error ? (
          <ErrorBanner
            title="Failed to load transcript"
            message={error?.data?.message || "Please try again."}
          />
        ) : isCall ? (
          <div className="tw-flex tw-flex-col tw-items-center tw-gap-2 tw-py-12 tw-text-center">
            <p className="tw-text-[13px] tw-text-fg-secondary tw-m-0">Calls have no stored transcript.</p>
            <p className="tw-text-[12px] tw-text-fg-tertiary tw-m-0">
              Voice and video sessions are not recorded, so there is nothing to transcribe.
            </p>
          </div>
        ) : messages.length === 0 ? (
          <div className="tw-text-center tw-py-12 tw-text-fg-tertiary tw-text-[13px]">
            {query ? "No messages match that search." : "No messages in this session."}
          </div>
        ) : (
          <>
            {data?.matched_by === "time_window" && (
              <div className="tw-text-[11px] tw-text-fg-warning tw-bg-fg-warning/10 tw-border tw-border-hairline tw-border-fg-warning/20 tw-rounded-md tw-px-3 tw-py-2">
                No messages carry this session&apos;s id. Showing the same pair&apos;s messages inside the
                session window instead — treat this as approximate.
              </div>
            )}
            <div className="tw-flex tw-flex-col tw-gap-3 tw-max-h-[52vh] tw-overflow-y-auto tw-pr-1">
              {messages.map((m) => (
                <Bubble key={m.id} m={m} side={m.sent_by === "listener" ? "listener" : "user"} />
              ))}
            </div>
          </>
        )}
      </ModalBody>

      <ModalFooter>
        {!disabled && !isCall && data?.total > 0 && (
          <>
            <Pill tone="neutral" className="tw-mr-auto">
              {data.total} message{data.total === 1 ? "" : "s"}
              {data.total > (data.messages?.length || 0) ? ` (showing ${data.messages.length})` : ""}
            </Pill>
            <Button variant="outline" size="sm" onClick={downloadTxt} className="tw-flex tw-items-center tw-gap-2">
              <Download size={13} aria-hidden /> Download .txt
            </Button>
          </>
        )}
        <Button variant="ghost" size="sm" onClick={onClose}>
          Close
        </Button>
      </ModalFooter>
    </Modal>
  );
}
