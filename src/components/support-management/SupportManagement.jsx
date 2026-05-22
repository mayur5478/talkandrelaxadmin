import React, { useState, useEffect, useRef } from "react";
import "./support-management.scss";
import {
  useGetSupportTicketsQuery,
  useGetSupportTicketQuery,
  useGetSupportStatsQuery,
  useSendSupportMessageMutation,
  useUpdateSupportTicketMutation,
  useMarkSupportReadMutation,
} from "../../services/support";
import useSupportSocket from "./useSupportSocket";

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];
const ROLE_FILTERS = [
  { value: "all", label: "All roles" },
  { value: "user", label: "Users" },
  { value: "listener", label: "Listeners" },
];
const PRIORITY_FILTERS = [
  { value: "all", label: "All priorities" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];
const STATUS_VALUES = ["open", "in_progress", "resolved", "closed"];
const PRIORITY_VALUES = ["low", "medium", "high"];
const STATUS_LABEL = {
  open: "Open",
  in_progress: "In progress",
  resolved: "Resolved",
  closed: "Closed",
};
const PAGE_SIZE = 20;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB — matches backend multer limit
const ALLOWED_MIMES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function relativeTime(value) {
  if (!value) return "";
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return "";
  const diff = Date.now() - then;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return new Date(value).toLocaleDateString();
}

function clockTime(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString([], {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Stat cards ───────────────────────────────────────────────────────────────
function StatCards({ stats, loading }) {
  const cards = [
    { key: "open", label: "Open", tone: "open" },
    { key: "in_progress", label: "In progress", tone: "progress" },
    { key: "resolved", label: "Resolved", tone: "resolved" },
    { key: "total", label: "Total tickets", tone: "total" },
  ];
  return (
    <div className="sm-stats">
      {cards.map((c) => (
        <div key={c.key} className={`sm-stat sm-stat--${c.tone}`}>
          <span className="sm-stat__value">
            {loading ? "—" : stats?.[c.key] ?? 0}
          </span>
          <span className="sm-stat__label">{c.label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Ticket list row ──────────────────────────────────────────────────────────
function TicketRow({ ticket, active, onClick }) {
  return (
    <button
      className={`sm-ticket ${active ? "sm-ticket--active" : ""}`}
      onClick={onClick}
    >
      <div className="sm-ticket__top">
        <span className="sm-ticket__subject" title={ticket.subject}>
          {ticket.subject}
        </span>
        {ticket.unreadForAdmin > 0 && (
          <span className="sm-ticket__unread">{ticket.unreadForAdmin}</span>
        )}
      </div>
      <div className="sm-ticket__meta">
        <span className={`sm-badge sm-badge--role-${ticket.requesterRole}`}>
          {ticket.requesterRole}
        </span>
        <span className={`sm-badge sm-badge--status-${ticket.status}`}>
          {STATUS_LABEL[ticket.status] || ticket.status}
        </span>
        <span className={`sm-dot sm-dot--${ticket.priority}`} title={`${ticket.priority} priority`} />
      </div>
      <div className="sm-ticket__preview">
        {ticket.requester?.fullName || "Unknown"} ·{" "}
        {ticket.lastMessage || "No messages yet"}
      </div>
      <div className="sm-ticket__time">{relativeTime(ticket.lastMessageAt)}</div>
    </button>
  );
}

// ─── Message bubble ───────────────────────────────────────────────────────────
function MessageBubble({ message }) {
  const fromAdmin = message.senderRole === "admin";
  return (
    <div className={`sm-msg ${fromAdmin ? "sm-msg--admin" : "sm-msg--requester"}`}>
      <div className="sm-msg__bubble">
        {message.messageType === "image" && message.attachmentUrl && (
          <a
            href={message.attachmentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="sm-msg__image-link"
          >
            <img
              src={message.attachmentUrl}
              alt="Attachment"
              className="sm-msg__image"
              loading="lazy"
            />
          </a>
        )}
        {message.message && <p className="sm-msg__text">{message.message}</p>}
        <span className="sm-msg__time">{clockTime(message.createdAt)}</span>
      </div>
    </div>
  );
}

// ─── Conversation panel ───────────────────────────────────────────────────────
function Conversation({ ticketId }) {
  const { data, isLoading, isError } = useGetSupportTicketQuery(ticketId, {
    skip: !ticketId,
  });
  const [sendMessage, { isLoading: sending }] = useSendSupportMessageMutation();
  const [updateTicket, { isLoading: updating }] = useUpdateSupportTicketMutation();
  const [markRead] = useMarkSupportReadMutation();

  const [replyText, setReplyText] = useState("");
  const [replyImage, setReplyImage] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const scrollRef = useRef(null);
  const fileRef = useRef(null);

  const ticket = data?.ticket;
  const messages = data?.messages || [];

  // Clear the requester's unread counter once the conversation is opened.
  useEffect(() => {
    if (ticketId) markRead(ticketId);
  }, [ticketId, markRead]);

  // Keep the latest message in view.
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length, ticketId]);

  // Reset composer when switching tickets.
  useEffect(() => {
    setReplyText("");
    setReplyImage(null);
    setErrorMsg("");
  }, [ticketId]);

  const handlePickImage = (file) => {
    if (!file) return;
    if (!ALLOWED_MIMES.includes(file.type.toLowerCase())) {
      setErrorMsg("Unsupported image type. Use JPEG, PNG or WebP.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setErrorMsg("Image too large. Maximum size is 10 MB.");
      return;
    }
    setErrorMsg("");
    setReplyImage(file);
  };

  const handleSend = async () => {
    if (!replyText.trim() && !replyImage) return;
    const formData = new FormData();
    if (replyText.trim()) formData.append("message", replyText.trim());
    if (replyImage) formData.append("attachment", replyImage);
    try {
      await sendMessage({ ticketId, formData }).unwrap();
      setReplyText("");
      setReplyImage(null);
      setErrorMsg("");
    } catch (err) {
      setErrorMsg(err?.data?.message || "Failed to send message.");
    }
  };

  const handleChangeStatus = async (status) => {
    try {
      await updateTicket({ ticketId, status }).unwrap();
    } catch (err) {
      setErrorMsg(err?.data?.message || "Failed to update status.");
    }
  };

  const handleChangePriority = async (priority) => {
    try {
      await updateTicket({ ticketId, priority }).unwrap();
    } catch (err) {
      setErrorMsg(err?.data?.message || "Failed to update priority.");
    }
  };

  if (!ticketId) {
    return (
      <div className="sm-conversation sm-conversation--empty">
        <p>Select a ticket to view the conversation.</p>
      </div>
    );
  }
  if (isLoading) {
    return (
      <div className="sm-conversation sm-conversation--empty">
        <p>Loading conversation…</p>
      </div>
    );
  }
  if (isError || !ticket) {
    return (
      <div className="sm-conversation sm-conversation--empty">
        <p>Could not load this ticket.</p>
      </div>
    );
  }

  const isClosed = ticket.status === "closed";

  return (
    <div className="sm-conversation">
      {/* Header */}
      <div className="sm-conv-header">
        <div className="sm-conv-header__main">
          <h3 className="sm-conv-header__subject">{ticket.subject}</h3>
          <p className="sm-conv-header__sub">
            <span className={`sm-badge sm-badge--role-${ticket.requesterRole}`}>
              {ticket.requesterRole}
            </span>
            {ticket.requester?.fullName || "Unknown"}
            {ticket.requester?.mobileNumber
              ? ` · ${ticket.requester.countryCode || ""}${ticket.requester.mobileNumber}`
              : ""}
            {ticket.category ? ` · ${ticket.category}` : ""}
          </p>
        </div>
        <div className="sm-conv-header__controls">
          <label className="sm-control">
            <span>Status</span>
            <select
              value={ticket.status}
              disabled={updating}
              onChange={(e) => handleChangeStatus(e.target.value)}
            >
              {STATUS_VALUES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </label>
          <label className="sm-control">
            <span>Priority</span>
            <select
              value={ticket.priority}
              disabled={updating}
              onChange={(e) => handleChangePriority(e.target.value)}
            >
              {PRIORITY_VALUES.map((p) => (
                <option key={p} value={p}>
                  {p[0].toUpperCase() + p.slice(1)}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {/* Messages */}
      <div className="sm-conv-messages" ref={scrollRef}>
        {messages.length === 0 ? (
          <p className="sm-conv-messages__empty">No messages yet.</p>
        ) : (
          messages.map((m) => <MessageBubble key={m.id} message={m} />)
        )}
      </div>

      {/* Composer */}
      <div className="sm-composer">
        {errorMsg && <p className="sm-composer__error">{errorMsg}</p>}
        {replyImage && (
          <div className="sm-composer__attachment">
            <span>📎 {replyImage.name}</span>
            <button type="button" onClick={() => setReplyImage(null)}>
              ×
            </button>
          </div>
        )}
        {isClosed ? (
          <p className="sm-composer__closed">
            This ticket is closed. Re-open it to continue the conversation.
          </p>
        ) : (
          <div className="sm-composer__row">
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: "none" }}
              onChange={(e) => {
                handlePickImage(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              className="sm-composer__attach"
              title="Attach image"
              onClick={() => fileRef.current?.click()}
              disabled={sending}
            >
              📎
            </button>
            <textarea
              className="sm-composer__input"
              placeholder="Write a reply…"
              value={replyText}
              rows={2}
              disabled={sending}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <button
              type="button"
              className="sm-composer__send"
              onClick={handleSend}
              disabled={sending || (!replyText.trim() && !replyImage)}
            >
              {sending ? "Sending…" : "Send"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
function SupportManagement() {
  const [filters, setFilters] = useState({
    status: "all",
    requester_role: "all",
    priority: "all",
  });
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedTicketId, setSelectedTicketId] = useState(null);

  // Debounce the search box.
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data: statsData, isLoading: statsLoading } = useGetSupportStatsQuery();
  const { data: listData, isLoading: listLoading, isFetching } =
    useGetSupportTicketsQuery({
      page,
      limit: PAGE_SIZE,
      ...filters,
      search,
    });

  // Real-time: refetch tags whenever a ticket/message event arrives.
  useSupportSocket(selectedTicketId);

  const tickets = listData?.tickets || [];
  const pagination = listData?.pagination || {};

  const setFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  return (
    <div className="sm-page">
      <div className="sm-header">
        <h2 className="sm-header__title">Support Tickets</h2>
        <p className="sm-header__subtitle">
          Resolve user and listener support requests in real time.
        </p>
      </div>

      <StatCards stats={statsData?.stats} loading={statsLoading} />

      <div className="sm-layout">
        {/* ── Left: filters + ticket list ── */}
        <div className="sm-list-panel">
          <div className="sm-filters">
            <input
              className="sm-search"
              type="text"
              placeholder="Search by subject…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <div className="sm-filter-row">
              <select
                value={filters.status}
                onChange={(e) => setFilter("status", e.target.value)}
              >
                {STATUS_FILTERS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <select
                value={filters.requester_role}
                onChange={(e) => setFilter("requester_role", e.target.value)}
              >
                {ROLE_FILTERS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <select
                value={filters.priority}
                onChange={(e) => setFilter("priority", e.target.value)}
              >
                {PRIORITY_FILTERS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="sm-ticket-list">
            {listLoading ? (
              <p className="sm-list-empty">Loading tickets…</p>
            ) : tickets.length === 0 ? (
              <p className="sm-list-empty">No tickets match these filters.</p>
            ) : (
              tickets.map((t) => (
                <TicketRow
                  key={t.id}
                  ticket={t}
                  active={t.id === selectedTicketId}
                  onClick={() => setSelectedTicketId(t.id)}
                />
              ))
            )}
          </div>

          {pagination.totalPages > 1 && (
            <div className="sm-pagination">
              <button
                disabled={page <= 1 || isFetching}
                onClick={() => setPage((p) => p - 1)}
              >
                ‹ Prev
              </button>
              <span>
                {page} / {pagination.totalPages}
              </span>
              <button
                disabled={page >= pagination.totalPages || isFetching}
                onClick={() => setPage((p) => p + 1)}
              >
                Next ›
              </button>
            </div>
          )}
        </div>

        {/* ── Right: conversation ── */}
        <Conversation ticketId={selectedTicketId} />
      </div>
    </div>
  );
}

export default SupportManagement;
