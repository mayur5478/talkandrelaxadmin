import React, { useState, useRef, useEffect } from "react";
import "./push-notifications.scss";
import {
  useGetPushStatsQuery,
  useSendToUsersMutation,
  useSendToListenersMutation,
  useSendToAllMutation,
  useSearchRecipientsQuery,
  useSendToSelectedMutation,
  useGetPushHistoryQuery,
} from "../../services/notification";

// ─── Constants ────────────────────────────────────────────────────────────────
const BROADCAST_TARGETS = [
  { value: "users",     label: "Users Only" },
  { value: "listeners", label: "Listeners Only" },
  { value: "all",       label: "Users & Listeners" },
];

const SEARCH_ROLES = [
  { value: "all",      label: "All" },
  { value: "user",     label: "Users" },
  { value: "listener", label: "Listeners" },
];

const MODES = [
  { value: "broadcast", label: "Broadcast" },
  { value: "selective", label: "Selective" },
];

const defaultForm = { title: "", body: "" };

// ─── Helpers ──────────────────────────────────────────────────────────────────
function targetLabel(target) {
  if (target === "users")     return "Users";
  if (target === "listeners") return "Listeners";
  if (target === "selective") return "Selective";
  return "All";
}

function ResultBadge({ result }) {
  if (!result) return null;
  return (
    <div className="pn-result">
      <div className="pn-result__row">
        <span className="pn-result__label">Total reached</span>
        <span className="pn-result__value">{result.total}</span>
      </div>
      <div className="pn-result__row pn-result__row--success">
        <span className="pn-result__label">Sent successfully</span>
        <span className="pn-result__value">{result.sent}</span>
      </div>
      {result.failed > 0 && (
        <div className="pn-result__row pn-result__row--error">
          <span className="pn-result__label">Failed</span>
          <span className="pn-result__value">{result.failed}</span>
        </div>
      )}
      {result.skipped > 0 && (
        <div className="pn-result__row pn-result__row--warn">
          <span className="pn-result__label">Skipped (no token)</span>
          <span className="pn-result__value">{result.skipped}</span>
        </div>
      )}
    </div>
  );
}

// ─── Recipient search + chip selector ─────────────────────────────────────────
function RecipientSelector({ selected, onAdd, onRemove }) {
  const [searchRole, setSearchRole] = useState("all");
  const [query, setQuery]           = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [dropOpen, setDropOpen]     = useState(false);
  const wrapRef                     = useRef(null);
  const debounceRef                 = useRef(null);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedQ(query), 350);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const { data, isFetching } = useSearchRecipientsQuery(
    { q: debouncedQ, role: searchRole },
    { skip: debouncedQ.trim().length === 0 }
  );

  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setDropOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selectedIds  = new Set(selected.map((r) => r.id));
  const suggestions  = (data?.recipients || []).filter((r) => !selectedIds.has(r.id));

  const handleSelect = (recipient) => {
    onAdd(recipient);
    setQuery("");
    setDebouncedQ("");
    setDropOpen(false);
  };

  return (
    <div className="pn-recipient-selector">
      <div className="pn-search-role-tabs">
        {SEARCH_ROLES.map(({ value, label }) => (
          <button
            key={value}
            className={`pn-search-role-tab ${searchRole === value ? "pn-search-role-tab--active" : ""}`}
            onClick={() => { setSearchRole(value); setQuery(""); setDebouncedQ(""); }}
          >{label}</button>
        ))}
      </div>

      <div className="pn-search-wrap" ref={wrapRef}>
        <input
          className="pn-input pn-search-input"
          type="text"
          placeholder="Search by name or mobile number..."
          value={query}
          onChange={(e) => { setQuery(e.target.value); setDropOpen(true); }}
          onFocus={() => query && setDropOpen(true)}
          autoComplete="off"
        />
        {isFetching && <span className="pn-search-spinner">Searching…</span>}

        {dropOpen && debouncedQ.trim().length > 0 && (
          <ul className="pn-dropdown">
            {suggestions.length === 0 && !isFetching && (
              <li className="pn-dropdown__empty">No results found</li>
            )}
            {suggestions.map((r) => (
              <li key={r.id} className="pn-dropdown__item" onMouseDown={() => handleSelect(r)}>
                <span className="pn-dropdown__name">{r.fullName}</span>
                <span className="pn-dropdown__meta">{r.mobile_number}</span>
                <span className={`pn-badge pn-badge--${r.role === "user" ? "users" : "listeners"}`}>{r.role}</span>
                {!r.hasToken && <span className="pn-dropdown__no-token" title="No FCM token — may not deliver">⚠</span>}
              </li>
            ))}
          </ul>
        )}
      </div>

      {selected.length > 0 && (
        <div className="pn-chips">
          {selected.map((r) => (
            <span key={r.id} className={`pn-chip pn-chip--${r.role === "user" ? "user" : "listener"}`}>
              <span className="pn-chip__name">{r.fullName}</span>
              <span className="pn-chip__role">{r.role}</span>
              {!r.hasToken && <span className="pn-chip__warn" title="No FCM token">⚠</span>}
              <button className="pn-chip__remove" onClick={() => onRemove(r.id)}>×</button>
            </span>
          ))}
          <button className="pn-clear-all" onClick={() => selected.forEach((r) => onRemove(r.id))}>Clear all</button>
        </div>
      )}
      {selected.length === 0 && (
        <p className="pn-no-selected">No recipients selected yet. Search and click to add.</p>
      )}
    </div>
  );
}

// ─── History panel ────────────────────────────────────────────────────────────
function HistoryPanel() {
  const [historyPage, setHistoryPage] = useState(1);
  const { data, isLoading, isFetching } = useGetPushHistoryQuery({ page: historyPage, pageSize: 10 });

  const history    = data?.history || [];
  const pagination = data?.pagination || {};

  return (
    <div className="pn-card pn-history-card">
      <h3 className="pn-card__title">
        Notification History
        {isFetching && <span className="pn-history-refreshing"> · refreshing…</span>}
      </h3>

      {isLoading ? (
        <p className="pn-stats-loading">Loading history…</p>
      ) : history.length === 0 ? (
        <p className="pn-no-selected">No notifications sent yet.</p>
      ) : (
        <>
          <ul className="pn-history-list">
            {history.map((item) => (
              <li key={item.id} className="pn-history-item">
                <div className="pn-history-item__header">
                  <span className={`pn-badge pn-badge--${item.target}`}>{targetLabel(item.target)}</span>
                  <span className="pn-history-item__time">
                    {new Date(item.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="pn-history-item__title">{item.title}</p>
                <p className="pn-history-item__body">{item.body}</p>
                {item.recipient_preview && (
                  <p className="pn-history-item__recipients">→ {item.recipient_preview}</p>
                )}
                <p className="pn-history-item__meta">
                  Sent {item.sent_count}/{item.total_recipients}
                  {item.failed_count > 0 && <span className="pn-meta-fail"> · {item.failed_count} failed</span>}
                  {item.skipped_count > 0 && <span className="pn-meta-skip"> · {item.skipped_count} skipped</span>}
                  {item.sent_by && <span className="pn-meta-by"> · by {item.sent_by}</span>}
                </p>
              </li>
            ))}
          </ul>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="pn-pagination">
              <button
                className="pn-page-btn"
                disabled={historyPage <= 1}
                onClick={() => setHistoryPage((p) => p - 1)}
              >‹ Prev</button>
              <span className="pn-page-info">{historyPage} / {pagination.totalPages}</span>
              <button
                className="pn-page-btn"
                disabled={historyPage >= pagination.totalPages}
                onClick={() => setHistoryPage((p) => p + 1)}
              >Next ›</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
function PushNotifications() {
  const [mode, setMode]   = useState("broadcast");
  const [target, setTarget]           = useState("users");
  const [selectedRecipients, setSelectedRecipients] = useState([]);
  const [form, setForm]               = useState(defaultForm);
  const [lastResult, setLastResult]   = useState(null);
  const [errorMsg, setErrorMsg]       = useState("");

  const { data: stats, isLoading: statsLoading } = useGetPushStatsQuery();
  const [sendToUsers,     { isLoading: sendingUsers }]     = useSendToUsersMutation();
  const [sendToListeners, { isLoading: sendingListeners }] = useSendToListenersMutation();
  const [sendToAll,       { isLoading: sendingAll }]       = useSendToAllMutation();
  const [sendToSelected,  { isLoading: sendingSelected }]  = useSendToSelectedMutation();

  const isSending = sendingUsers || sendingListeners || sendingAll || sendingSelected;

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrorMsg("");
    setLastResult(null);
  };

  const broadcastCount = () => {
    if (!stats) return "—";
    if (target === "users") return stats.userCount;
    if (target === "listeners") return stats.listenerCount;
    return stats.totalCount;
  };

  const addRecipient = (r) => {
    setSelectedRecipients((prev) => prev.find((p) => p.id === r.id) ? prev : [...prev, r]);
    setLastResult(null);
    setErrorMsg("");
  };
  const removeRecipient = (id) => setSelectedRecipients((prev) => prev.filter((r) => r.id !== id));

  const handleSend = async () => {
    if (!form.title.trim() || !form.body.trim()) { setErrorMsg("Please fill in both title and message."); return; }
    if (mode === "selective" && selectedRecipients.length === 0) { setErrorMsg("Please select at least one recipient."); return; }
    setErrorMsg("");
    setLastResult(null);

    try {
      const payload = { title: form.title.trim(), body: form.body.trim() };
      let res;
      if (mode === "selective") {
        res = await sendToSelected({ ...payload, userIds: selectedRecipients.map((r) => r.id) }).unwrap();
      } else {
        if (target === "users")          res = await sendToUsers(payload).unwrap();
        else if (target === "listeners") res = await sendToListeners(payload).unwrap();
        else                             res = await sendToAll(payload).unwrap();
      }
      setLastResult(res);
      setForm(defaultForm);
      if (mode === "selective") setSelectedRecipients([]);
    } catch (err) {
      setErrorMsg(err?.data?.message || "Failed to send notification. Please try again.");
    }
  };

  const canSend = !isSending && form.title.trim() && form.body.trim() && (mode === "broadcast" || selectedRecipients.length > 0);

  return (
    <div className="pn-page">
      <div className="pn-header">
        <h2 className="pn-header__title">Push Notifications</h2>
        <p className="pn-header__subtitle">Broadcast to all users/listeners, or hand-pick specific recipients.</p>
      </div>

      <div className="pn-layout">
        {/* ── Compose card ── */}
        <div className="pn-card">
          <div className="pn-mode-tabs">
            {MODES.map(({ value, label }) => (
              <button
                key={value}
                className={`pn-mode-tab ${mode === value ? "pn-mode-tab--active" : ""}`}
                onClick={() => { setMode(value); setLastResult(null); setErrorMsg(""); }}
                disabled={isSending}
              >{label}</button>
            ))}
          </div>

          {mode === "broadcast" && (
            <div className="pn-field">
              <label className="pn-label">Send To</label>
              <div className="pn-target-group">
                {BROADCAST_TARGETS.map(({ value, label }) => (
                  <button
                    key={value}
                    className={`pn-target-btn ${target === value ? "pn-target-btn--active" : ""}`}
                    onClick={() => { setTarget(value); setLastResult(null); setErrorMsg(""); }}
                    disabled={isSending}
                  >{label}</button>
                ))}
              </div>
              {!statsLoading && stats && (
                <p className="pn-audience-count">{broadcastCount()} device{broadcastCount() !== 1 ? "s" : ""} will receive this</p>
              )}
            </div>
          )}

          {mode === "selective" && (
            <div className="pn-field">
              <label className="pn-label">
                Select Recipients
                {selectedRecipients.length > 0 && <span className="pn-selected-count"> ({selectedRecipients.length} selected)</span>}
              </label>
              <RecipientSelector selected={selectedRecipients} onAdd={addRecipient} onRemove={removeRecipient} />
            </div>
          )}

          <div className="pn-field">
            <label className="pn-label" htmlFor="pn-title">Notification Title</label>
            <input id="pn-title" className="pn-input" type="text" name="title" placeholder="e.g. New Feature Available!" value={form.title} onChange={handleChange} maxLength={100} disabled={isSending} />
            <span className="pn-char-count">{form.title.length}/100</span>
          </div>

          <div className="pn-field">
            <label className="pn-label" htmlFor="pn-body">Message</label>
            <textarea id="pn-body" className="pn-textarea" name="body" placeholder="e.g. Check out the latest updates in your app..." value={form.body} onChange={handleChange} maxLength={300} rows={4} disabled={isSending} />
            <span className="pn-char-count">{form.body.length}/300</span>
          </div>

          {errorMsg   && <p className="pn-error">{errorMsg}</p>}
          {lastResult && <ResultBadge result={lastResult} />}

          <button className="pn-send-btn" onClick={handleSend} disabled={!canSend}>
            {isSending ? "Sending…" : "Send Notification"}
          </button>
        </div>

        {/* ── Right sidebar ── */}
        <div className="pn-sidebar">
          {/* Stats */}
          <div className="pn-card pn-stats-card">
            <h3 className="pn-card__title">Device Stats</h3>
            {statsLoading ? <p className="pn-stats-loading">Loading…</p> : (
              <>
                <div className="pn-stat">
                  <span className="pn-stat__label">Users with notifications</span>
                  <span className="pn-stat__value pn-stat__value--blue">{stats?.userCount ?? "—"}</span>
                </div>
                <div className="pn-stat">
                  <span className="pn-stat__label">Listeners with notifications</span>
                  <span className="pn-stat__value pn-stat__value--green">{stats?.listenerCount ?? "—"}</span>
                </div>
                <div className="pn-stat pn-stat--total">
                  <span className="pn-stat__label">Total reachable devices</span>
                  <span className="pn-stat__value">{stats?.totalCount ?? "—"}</span>
                </div>
              </>
            )}
          </div>

          {/* Persistent history from DB */}
          <HistoryPanel />
        </div>
      </div>
    </div>
  );
}

export default PushNotifications;
