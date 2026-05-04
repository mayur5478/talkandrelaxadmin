import React, { useState, useRef, useEffect } from "react";
import "./push-notifications.scss";
import {
  useGetPushStatsQuery,
  useSendToUsersMutation,
  useSendToListenersMutation,
  useSendToAllMutation,
  useSearchRecipientsQuery,
  useSendToSelectedMutation,
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

// ─── Small helpers ─────────────────────────────────────────────────────────────
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
  const [searchRole, setSearchRole]   = useState("all");
  const [query, setQuery]             = useState("");
  const [debouncedQ, setDebouncedQ]   = useState("");
  const [dropOpen, setDropOpen]       = useState(false);
  const wrapRef                       = useRef(null);
  const debounceRef                   = useRef(null);

  // Debounce the query so we don't fire a request on every keystroke
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedQ(query), 350);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const { data, isFetching } = useSearchRecipientsQuery(
    { q: debouncedQ, role: searchRole },
    { skip: debouncedQ.trim().length === 0 }
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setDropOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selectedIds = new Set(selected.map((r) => r.id));
  const suggestions = (data?.recipients || []).filter((r) => !selectedIds.has(r.id));

  const handleSelect = (recipient) => {
    onAdd(recipient);
    setQuery("");
    setDebouncedQ("");
    setDropOpen(false);
  };

  return (
    <div className="pn-recipient-selector">
      {/* Role filter tabs */}
      <div className="pn-search-role-tabs">
        {SEARCH_ROLES.map(({ value, label }) => (
          <button
            key={value}
            className={`pn-search-role-tab ${searchRole === value ? "pn-search-role-tab--active" : ""}`}
            onClick={() => { setSearchRole(value); setQuery(""); setDebouncedQ(""); }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Search input + dropdown */}
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
              <li
                key={r.id}
                className="pn-dropdown__item"
                onMouseDown={() => handleSelect(r)}
              >
                <span className="pn-dropdown__name">{r.fullName}</span>
                <span className="pn-dropdown__meta">{r.mobile_number}</span>
                <span className={`pn-badge pn-badge--${r.role === "user" ? "users" : "listeners"}`}>
                  {r.role}
                </span>
                {!r.hasToken && (
                  <span className="pn-dropdown__no-token" title="No FCM token — notification may not deliver">⚠</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Selected chips */}
      {selected.length > 0 && (
        <div className="pn-chips">
          {selected.map((r) => (
            <span key={r.id} className={`pn-chip pn-chip--${r.role === "user" ? "user" : "listener"}`}>
              <span className="pn-chip__name">{r.fullName}</span>
              <span className="pn-chip__role">{r.role}</span>
              {!r.hasToken && <span className="pn-chip__warn" title="No FCM token">⚠</span>}
              <button className="pn-chip__remove" onClick={() => onRemove(r.id)} title="Remove">×</button>
            </span>
          ))}
          <button className="pn-clear-all" onClick={() => selected.forEach((r) => onRemove(r.id))}>
            Clear all
          </button>
        </div>
      )}

      {selected.length === 0 && (
        <p className="pn-no-selected">No recipients selected yet. Search and click to add.</p>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
function PushNotifications() {
  const [mode, setMode]               = useState("broadcast");   // broadcast | selective
  const [target, setTarget]           = useState("users");        // broadcast target
  const [selectedRecipients, setSelectedRecipients] = useState([]);

  const [form, setForm]               = useState(defaultForm);
  const [lastResult, setLastResult]   = useState(null);
  const [errorMsg, setErrorMsg]       = useState("");
  const [history, setHistory]         = useState([]);

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
    setSelectedRecipients((prev) => {
      if (prev.find((p) => p.id === r.id)) return prev;
      return [...prev, r];
    });
    setLastResult(null);
    setErrorMsg("");
  };

  const removeRecipient = (id) => {
    setSelectedRecipients((prev) => prev.filter((r) => r.id !== id));
  };

  const handleSend = async () => {
    if (!form.title.trim() || !form.body.trim()) {
      setErrorMsg("Please fill in both title and message.");
      return;
    }
    if (mode === "selective" && selectedRecipients.length === 0) {
      setErrorMsg("Please select at least one recipient.");
      return;
    }
    setErrorMsg("");
    setLastResult(null);

    try {
      const payload = { title: form.title.trim(), body: form.body.trim() };
      let res;

      if (mode === "selective") {
        res = await sendToSelected({
          ...payload,
          userIds: selectedRecipients.map((r) => r.id),
        }).unwrap();
      } else {
        if (target === "users")          res = await sendToUsers(payload).unwrap();
        else if (target === "listeners") res = await sendToListeners(payload).unwrap();
        else                             res = await sendToAll(payload).unwrap();
      }

      setLastResult(res);
      setHistory((prev) => [
        {
          id: Date.now(),
          mode,
          target: mode === "selective" ? "selective" : target,
          recipientNames: mode === "selective"
            ? selectedRecipients.map((r) => r.fullName).slice(0, 3).join(", ") +
              (selectedRecipients.length > 3 ? ` +${selectedRecipients.length - 3} more` : "")
            : null,
          title: form.title,
          body: form.body,
          sentAt: new Date().toLocaleString(),
          result: res,
        },
        ...prev.slice(0, 9),
      ]);
      setForm(defaultForm);
      if (mode === "selective") setSelectedRecipients([]);
    } catch (err) {
      setErrorMsg(err?.data?.message || "Failed to send notification. Please try again.");
    }
  };

  const canSend =
    !isSending &&
    form.title.trim() &&
    form.body.trim() &&
    (mode === "broadcast" || selectedRecipients.length > 0);

  return (
    <div className="pn-page">
      {/* Header */}
      <div className="pn-header">
        <h2 className="pn-header__title">Push Notifications</h2>
        <p className="pn-header__subtitle">
          Broadcast to all users/listeners, or hand-pick specific recipients.
        </p>
      </div>

      <div className="pn-layout">
        {/* Compose card */}
        <div className="pn-card">
          {/* Mode tabs */}
          <div className="pn-mode-tabs">
            {MODES.map(({ value, label }) => (
              <button
                key={value}
                className={`pn-mode-tab ${mode === value ? "pn-mode-tab--active" : ""}`}
                onClick={() => { setMode(value); setLastResult(null); setErrorMsg(""); }}
                disabled={isSending}
              >
                {label}
              </button>
            ))}
          </div>

          {/* ── Broadcast audience ── */}
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
                  >
                    {label}
                  </button>
                ))}
              </div>
              {!statsLoading && stats && (
                <p className="pn-audience-count">
                  {broadcastCount()} device{broadcastCount() !== 1 ? "s" : ""} will receive this
                </p>
              )}
            </div>
          )}

          {/* ── Selective recipient picker ── */}
          {mode === "selective" && (
            <div className="pn-field">
              <label className="pn-label">
                Select Recipients
                {selectedRecipients.length > 0 && (
                  <span className="pn-selected-count"> ({selectedRecipients.length} selected)</span>
                )}
              </label>
              <RecipientSelector
                selected={selectedRecipients}
                onAdd={addRecipient}
                onRemove={removeRecipient}
              />
            </div>
          )}

          {/* Title */}
          <div className="pn-field">
            <label className="pn-label" htmlFor="pn-title">Notification Title</label>
            <input
              id="pn-title"
              className="pn-input"
              type="text"
              name="title"
              placeholder="e.g. New Feature Available!"
              value={form.title}
              onChange={handleChange}
              maxLength={100}
              disabled={isSending}
            />
            <span className="pn-char-count">{form.title.length}/100</span>
          </div>

          {/* Body */}
          <div className="pn-field">
            <label className="pn-label" htmlFor="pn-body">Message</label>
            <textarea
              id="pn-body"
              className="pn-textarea"
              name="body"
              placeholder="e.g. Check out the latest updates in your app..."
              value={form.body}
              onChange={handleChange}
              maxLength={300}
              rows={4}
              disabled={isSending}
            />
            <span className="pn-char-count">{form.body.length}/300</span>
          </div>

          {errorMsg  && <p className="pn-error">{errorMsg}</p>}
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
            {statsLoading ? (
              <p className="pn-stats-loading">Loading…</p>
            ) : (
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

          {/* History */}
          {history.length > 0 && (
            <div className="pn-card pn-history-card">
              <h3 className="pn-card__title">Recent Sends</h3>
              <ul className="pn-history-list">
                {history.map((item) => (
                  <li key={item.id} className="pn-history-item">
                    <div className="pn-history-item__header">
                      <span className={`pn-badge pn-badge--${item.target}`}>
                        {item.target === "users"     ? "Users"
                          : item.target === "listeners" ? "Listeners"
                          : item.target === "selective" ? "Selective"
                          : "All"}
                      </span>
                      <span className="pn-history-item__time">{item.sentAt}</span>
                    </div>
                    <p className="pn-history-item__title">{item.title}</p>
                    {item.recipientNames && (
                      <p className="pn-history-item__recipients">→ {item.recipientNames}</p>
                    )}
                    <p className="pn-history-item__meta">
                      Sent {item.result.sent}/{item.result.total}
                      {item.result.failed > 0 && ` · ${item.result.failed} failed`}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PushNotifications;
