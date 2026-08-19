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
  useRetryNotificationMutation,
  useCancelNotificationMutation,
  useDeleteNotificationMutation,
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

// Delivery channels. FCM = in-app push (needs a device token, so it misses
// logged-out users). WhatsApp/SMS reach by mobile number and require an
// approved template (content is fixed in the template, only variables vary).
const CHANNELS = [
  { value: "fcm",      label: "App Push (FCM)" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "sms",      label: "SMS" },
];

const defaultForm = { title: "", body: "", templateName: "", languageCode: "en" };

// Approved templates, per channel. `vars` order + length MUST match the
// {{1}},{{2}}… placeholders as approved in the provider console — the dropdown
// uses it to pre-size the variable inputs and label them. Add a row here when a
// new template is approved (WhatsApp Template Report / DLT dashboard).
const WHATSAPP_TEMPLATES = [
  {
    name: "feature_launch_announcement",
    label: "Feature launch announcement",
    languageCode: "en",
    vars: ["User name", "Feature name", "One-line detail"],
  },
  {
    name: "rate_change_notice",
    label: "Rate change notice",
    languageCode: "en",
    vars: ["User name", "What changed", "New rate", "Old rate", "Effective date"],
  },
  {
    name: "outage_fixed_login",
    label: "Outage fixed / login",
    languageCode: "en",
    vars: ["Brand / name"],
  },
  {
    name: "independence_day_offer_2026",
    label: "Independence Day offer (₹5/min)",
    languageCode: "en",
    vars: [], // static body, no variables
  },
];
const SMS_TEMPLATES = []; // none DLT-approved yet — SMS falls back to manual entry
const TEMPLATES_BY_CHANNEL = { whatsapp: WHATSAPP_TEMPLATES, sms: SMS_TEMPLATES };
const CUSTOM_TEMPLATE = "__custom__";

// Image upload constraints — must match backend (routes/admin/pushNotification/pushNotification.js)
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIMES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function targetLabel(target) {
  if (target === "users")     return "Users";
  if (target === "listeners") return "Listeners";
  if (target === "selective") return "Selective";
  return "All";
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
          <span className="pn-result__label">Skipped (unreachable)</span>
          <span className="pn-result__value">{result.skipped}</span>
        </div>
      )}
      {result.imageUrl && (
        <div className="pn-result__row">
          <span className="pn-result__label">Image attached</span>
          <a href={result.imageUrl} target="_blank" rel="noopener noreferrer" className="pn-result__value">view</a>
        </div>
      )}
    </div>
  );
}

// ─── Image upload picker (preview + remove) ──────────────────────────────────
function ImagePicker({ image, onPick, onClear, disabled }) {
  const inputRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    if (!image) { setPreviewUrl(null); return; }
    const url = URL.createObjectURL(image);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  const handleFile = (file) => {
    if (!file) return;
    if (!ALLOWED_MIMES.includes(file.type.toLowerCase())) {
      alert(`Unsupported image type: ${file.type}. Only JPEG, PNG, WebP allowed.`);
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      alert(`Image too large (${formatBytes(file.size)}). Max 5 MB.`);
      return;
    }
    onPick(file);
  };

  return (
    <div className="pn-field">
      <label className="pn-label">Image (optional)</label>
      {!image ? (
        <div className="pn-image-picker pn-image-picker--empty">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            style={{ display: "none" }}
            onChange={(e) => handleFile(e.target.files?.[0])}
            disabled={disabled}
          />
          <button
            type="button"
            className="pn-image-picker__btn"
            onClick={() => inputRef.current?.click()}
            disabled={disabled}
          >
            + Attach image
          </button>
          <span className="pn-image-picker__hint">JPEG, PNG, or WebP · max 5 MB</span>
        </div>
      ) : (
        <div className="pn-image-picker pn-image-picker--filled">
          {previewUrl && (
            <img src={previewUrl} alt="Preview" className="pn-image-picker__preview" />
          )}
          <div className="pn-image-picker__info">
            <span className="pn-image-picker__filename">{image.name}</span>
            <span className="pn-image-picker__size">{formatBytes(image.size)}</span>
          </div>
          <button
            type="button"
            className="pn-image-picker__remove"
            onClick={onClear}
            disabled={disabled}
            title="Remove image"
          >
            ×
          </button>
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
  const [historyPage, setHistoryPage]   = useState(1);
  const [retryingId,  setRetryingId]    = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [deletingId,  setDeletingId]    = useState(null);
  const [retryResult, setRetryResult]   = useState({});   // { [id]: { sent, failed, total } }
  const [retryError,  setRetryError]    = useState({});   // { [id]: errorMsg }
  const [actionMsg,   setActionMsg]     = useState({});   // { [id]: { type: 'ok'|'err', text } }

  const { data, isLoading, isFetching } = useGetPushHistoryQuery({ page: historyPage, pageSize: 10 });
  const [retryNotification]             = useRetryNotificationMutation();
  const [cancelNotification]            = useCancelNotificationMutation();
  const [deleteNotification]            = useDeleteNotificationMutation();

  const history    = data?.history || [];
  const pagination = data?.pagination || {};

  const handleRetry = async (item) => {
    setRetryingId(item.id);
    setRetryResult((prev) => ({ ...prev, [item.id]: null }));
    setRetryError((prev)  => ({ ...prev, [item.id]: null }));
    try {
      const res = await retryNotification(item.id).unwrap();
      setRetryResult((prev) => ({ ...prev, [item.id]: res }));
    } catch (err) {
      setRetryError((prev) => ({ ...prev, [item.id]: err?.data?.message || "Retry failed." }));
    } finally {
      setRetryingId(null);
    }
  };

  const handleCancel = async (item) => {
    const reason = window.prompt(
      `Cancel this notification? It will no longer be retryable.\n\n` +
      `Title: ${item.title}\n` +
      `Sent to: ${item.recipient_preview || targetLabel(item.target)}\n\n` +
      `Reason (optional):`,
      ""
    );
    if (reason === null) return; // user clicked Cancel on the prompt

    setCancellingId(item.id);
    setActionMsg((prev) => ({ ...prev, [item.id]: null }));
    try {
      await cancelNotification({ id: item.id, reason: reason.trim() || null }).unwrap();
      setActionMsg((prev) => ({ ...prev, [item.id]: { type: "ok", text: "✓ Cancelled — cannot be retried." } }));
    } catch (err) {
      setActionMsg((prev) => ({ ...prev, [item.id]: { type: "err", text: err?.data?.message || "Cancel failed." } }));
    } finally {
      setCancellingId(null);
    }
  };

  const handleDelete = async (item) => {
    const ok = window.confirm(
      `Permanently DELETE this log entry? This removes it from history entirely.\n\n` +
      `Title: ${item.title}\n` +
      `Sent: ${new Date(item.createdAt).toLocaleString()}\n\n` +
      `Use Cancel instead if you want to keep the audit trail.`
    );
    if (!ok) return;

    setDeletingId(item.id);
    setActionMsg((prev) => ({ ...prev, [item.id]: null }));
    try {
      await deleteNotification(item.id).unwrap();
      // No success message needed — entry will disappear from list on refetch
    } catch (err) {
      setActionMsg((prev) => ({ ...prev, [item.id]: { type: "err", text: err?.data?.message || "Delete failed." } }));
    } finally {
      setDeletingId(null);
    }
  };

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
            {history.map((item) => {
              const isCancelled = !!item.is_cancelled;
              return (
                <li
                  key={item.id}
                  className={`pn-history-item ${isCancelled ? "pn-history-item--cancelled" : ""}`}
                >
                  <div className="pn-history-item__header">
                    <span className={`pn-badge pn-badge--${item.target}`}>{targetLabel(item.target)}</span>
                    <span className="pn-badge" style={{ textTransform: "uppercase" }}>{item.channel || "fcm"}</span>
                    {isCancelled && (
                      <span className="pn-badge pn-badge--cancelled" title="No further retries allowed">
                        ✕ Cancelled
                      </span>
                    )}
                    <span className="pn-history-item__time">
                      {new Date(item.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <p className="pn-history-item__title">{item.title}</p>
                  <p className="pn-history-item__body">{item.body}</p>

                  {item.image_url && (
                    <a
                      href={item.image_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="pn-history-item__image-link"
                      title="Open full image"
                    >
                      <img
                        src={item.image_url}
                        alt="Notification attachment"
                        className="pn-history-item__image"
                        loading="lazy"
                      />
                    </a>
                  )}

                  {item.recipient_preview && (
                    <p className="pn-history-item__recipients">→ {item.recipient_preview}</p>
                  )}
                  <p className="pn-history-item__meta">
                    Sent {item.sent_count}/{item.total_recipients}
                    {item.failed_count  > 0 && <span className="pn-meta-fail"> · {item.failed_count} failed</span>}
                    {item.skipped_count > 0 && <span className="pn-meta-skip"> · {item.skipped_count} skipped</span>}
                    {item.sent_by && <span className="pn-meta-by"> · by {item.sent_by}</span>}
                  </p>

                  {/* Cancellation details */}
                  {isCancelled && (
                    <p className="pn-history-item__cancel-info">
                      Cancelled by <strong>{item.cancelled_by || "unknown"}</strong>
                      {item.cancelled_at && ` on ${new Date(item.cancelled_at).toLocaleString()}`}
                      {item.cancel_reason && (
                        <>
                          <br />
                          <span className="pn-history-item__cancel-reason">Reason: {item.cancel_reason}</span>
                        </>
                      )}
                    </p>
                  )}

                  {/* Action buttons */}
                  <div className="pn-history-actions">
                    {!isCancelled && (
                      <button
                        className="pn-retry-btn"
                        onClick={() => handleRetry(item)}
                        disabled={retryingId === item.id || cancellingId === item.id || deletingId === item.id}
                      >
                        {retryingId === item.id ? "Retrying…" : "↺ Retry"}
                      </button>
                    )}

                    {!isCancelled && (
                      <button
                        className="pn-cancel-btn"
                        onClick={() => handleCancel(item)}
                        disabled={retryingId === item.id || cancellingId === item.id || deletingId === item.id}
                        title="Mark as cancelled — prevents retry"
                      >
                        {cancellingId === item.id ? "Cancelling…" : "🚫 Cancel"}
                      </button>
                    )}

                    <button
                      className="pn-delete-btn"
                      onClick={() => handleDelete(item)}
                      disabled={retryingId === item.id || cancellingId === item.id || deletingId === item.id}
                      title="Permanently remove from history"
                    >
                      {deletingId === item.id ? "Deleting…" : "🗑 Delete"}
                    </button>
                  </div>

                  {/* Inline retry result */}
                  {retryResult[item.id] && (
                    <p className="pn-retry-result pn-retry-result--ok">
                      ✓ Retry sent {retryResult[item.id].sent}/{retryResult[item.id].total}
                      {retryResult[item.id].failed > 0 && ` · ${retryResult[item.id].failed} failed`}
                    </p>
                  )}
                  {retryError[item.id] && (
                    <p className="pn-retry-result pn-retry-result--err">✗ {retryError[item.id]}</p>
                  )}
                  {actionMsg[item.id] && (
                    <p className={`pn-retry-result pn-retry-result--${actionMsg[item.id].type}`}>
                      {actionMsg[item.id].text}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="pn-pagination">
              <button className="pn-page-btn" disabled={historyPage <= 1} onClick={() => setHistoryPage((p) => p - 1)}>‹ Prev</button>
              <span className="pn-page-info">{historyPage} / {pagination.totalPages}</span>
              <button className="pn-page-btn" disabled={historyPage >= pagination.totalPages} onClick={() => setHistoryPage((p) => p + 1)}>Next ›</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
function PushNotifications() {
  const [mode, setMode]               = useState("broadcast");
  const [channel, setChannel]         = useState("fcm");
  const [target, setTarget]           = useState("users");
  const [selectedRecipients, setSelectedRecipients] = useState([]);
  const [form, setForm]               = useState(defaultForm);
  const [templateParams, setTemplateParams] = useState([]); // string[] for {{1}},{{2}}…
  const [customTpl, setCustomTpl] = useState(false); // true = free-text template entry
  const [image, setImage]             = useState(null); // File | null
  const [lastResult, setLastResult]   = useState(null);
  const [errorMsg, setErrorMsg]       = useState("");

  const { data: stats, isLoading: statsLoading } = useGetPushStatsQuery();
  const [sendToUsers,     { isLoading: sendingUsers }]     = useSendToUsersMutation();
  const [sendToListeners, { isLoading: sendingListeners }] = useSendToListenersMutation();
  const [sendToAll,       { isLoading: sendingAll }]       = useSendToAllMutation();
  const [sendToSelected,  { isLoading: sendingSelected }]  = useSendToSelectedMutation();

  const isSending = sendingUsers || sendingListeners || sendingAll || sendingSelected;
  const isFcm = channel === "fcm";

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrorMsg("");
    setLastResult(null);
  };

  const resetAfterChannelChange = (next) => {
    setChannel(next);
    setLastResult(null);
    setErrorMsg("");
    // Template registry differs per channel — clear any prior selection.
    setForm((prev) => ({ ...prev, templateName: "" }));
    setTemplateParams([]);
    setCustomTpl(false);
  };

  // Templates available for the current channel, and the one currently picked.
  const channelTemplates = TEMPLATES_BY_CHANNEL[channel] || [];
  const activeTemplate = channelTemplates.find((t) => t.name === form.templateName) || null;

  // Pick a template from the dropdown: pre-fill name, language, and size the
  // variable inputs to its placeholder count. "__custom__" reveals free-text.
  const onTemplateSelect = (e) => {
    const v = e.target.value;
    setErrorMsg("");
    setLastResult(null);
    if (v === CUSTOM_TEMPLATE) {
      setCustomTpl(true);
      setForm((prev) => ({ ...prev, templateName: "" }));
      setTemplateParams([]);
      return;
    }
    setCustomTpl(false);
    const tpl = channelTemplates.find((t) => t.name === v) || null;
    setForm((prev) => ({ ...prev, templateName: v, languageCode: tpl?.languageCode || prev.languageCode }));
    setTemplateParams(tpl ? tpl.vars.map(() => "") : []);
  };

  // Template variable editing (WhatsApp/SMS).
  const addParam    = () => setTemplateParams((p) => [...p, ""]);
  const updateParam = (i, v) => setTemplateParams((p) => p.map((x, idx) => (idx === i ? v : x)));
  const removeParam = (i) => setTemplateParams((p) => p.filter((_, idx) => idx !== i));

  // Reachable audience count depends on the channel: FCM counts device tokens,
  // WhatsApp/SMS count mobile numbers (stats.mobile.*).
  const broadcastCount = () => {
    if (!stats) return "—";
    const src = isFcm ? stats : (stats.mobile || {});
    if (target === "users") return src.userCount ?? "—";
    if (target === "listeners") return src.listenerCount ?? "—";
    return src.totalCount ?? "—";
  };

  const addRecipient = (r) => {
    setSelectedRecipients((prev) => prev.find((p) => p.id === r.id) ? prev : [...prev, r]);
    setLastResult(null);
    setErrorMsg("");
  };
  const removeRecipient = (id) => setSelectedRecipients((prev) => prev.filter((r) => r.id !== id));

  const handleSend = async () => {
    // Per-channel validation.
    if (isFcm) {
      if (!form.title.trim() || !form.body.trim()) { setErrorMsg("Please fill in both title and message."); return; }
    } else if (!form.templateName.trim()) {
      setErrorMsg("Please enter the approved template name."); return;
    }
    if (mode === "selective" && selectedRecipients.length === 0) { setErrorMsg("Please select at least one recipient."); return; }
    setErrorMsg("");
    setLastResult(null);

    try {
      const cleanParams = templateParams.map((p) => p.trim()).filter((p) => p.length > 0);
      const payload = isFcm
        ? {
            channel,
            title: form.title.trim(),
            body:  form.body.trim(),
            ...(image ? { image } : {}),
          }
        : {
            channel,
            templateName: form.templateName.trim(),
            languageCode: (form.languageCode || "en").trim() || "en",
            ...(cleanParams.length ? { templateParams: cleanParams } : {}),
            // WhatsApp media-template header image (optional; SMS ignores it).
            ...(channel === "whatsapp" && image ? { image } : {}),
          };

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
      setTemplateParams([]);
      setImage(null);
      if (mode === "selective") setSelectedRecipients([]);
    } catch (err) {
      setErrorMsg(err?.data?.message || "Failed to send notification. Please try again.");
    }
  };

  const contentReady = isFcm ? (form.title.trim() && form.body.trim()) : form.templateName.trim();
  const canSend = !isSending && contentReady && (mode === "broadcast" || selectedRecipients.length > 0);

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

          {/* Delivery channel */}
          <div className="pn-field">
            <label className="pn-label">Channel</label>
            <div className="pn-target-group">
              {CHANNELS.map(({ value, label }) => (
                <button
                  key={value}
                  className={`pn-target-btn ${channel === value ? "pn-target-btn--active" : ""}`}
                  onClick={() => resetAfterChannelChange(value)}
                  disabled={isSending}
                >{label}</button>
              ))}
            </div>
            {!isFcm && (
              <p className="pn-audience-count">
                {channel === "whatsapp" ? "WhatsApp" : "SMS"} reaches users by mobile number — only an approved template can be sent.
              </p>
            )}
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
                <p className="pn-audience-count">{broadcastCount()} recipient{broadcastCount() !== 1 ? "s" : ""} will receive this</p>
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

          {isFcm ? (
            <>
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

              {/* Optional image attachment (FCM notification image) */}
              <ImagePicker
                image={image}
                onPick={(f) => { setImage(f); setLastResult(null); setErrorMsg(""); }}
                onClear={() => setImage(null)}
                disabled={isSending}
              />
            </>
          ) : (
            <>
              <div className="pn-field">
                <label className="pn-label" htmlFor="pn-template">Approved Template</label>
                {channelTemplates.length > 0 && (
                  <select
                    id="pn-template"
                    className="pn-input"
                    value={customTpl ? CUSTOM_TEMPLATE : form.templateName}
                    onChange={onTemplateSelect}
                    disabled={isSending}
                  >
                    <option value="">Select a template…</option>
                    {channelTemplates.map((t) => (
                      <option key={t.name} value={t.name}>{t.label} ({t.name})</option>
                    ))}
                    <option value={CUSTOM_TEMPLATE}>Other (enter manually)…</option>
                  </select>
                )}
                {(customTpl || channelTemplates.length === 0) && (
                  <input
                    id="pn-template-custom"
                    className="pn-input"
                    type="text"
                    name="templateName"
                    placeholder="e.g. outage_fixed_login"
                    value={form.templateName}
                    onChange={handleChange}
                    disabled={isSending}
                    autoComplete="off"
                    style={channelTemplates.length > 0 ? { marginTop: 8 } : undefined}
                  />
                )}
                <span className="pn-char-count">Must exactly match a template approved in your {channel === "whatsapp" ? "WhatsApp (SmartPing)" : "DLT / 2Factor"} account.</span>
              </div>

              <div className="pn-field">
                <label className="pn-label" htmlFor="pn-lang">Template Language Code</label>
                <input id="pn-lang" className="pn-input" type="text" name="languageCode" placeholder="en" value={form.languageCode} onChange={handleChange} disabled={isSending} style={{ maxWidth: 140 }} />
              </div>

              <div className="pn-field">
                <label className="pn-label">
                  Template Variables
                  <span className="pn-selected-count"> (fill {"{{1}}"}, {"{{2}}"}… in order)</span>
                </label>
                {templateParams.length === 0 && (
                  <p className="pn-no-selected">No variables. Add one for each placeholder in the template.</p>
                )}
                {templateParams.map((val, i) => (
                  <div key={i} className="pn-search-wrap" style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                    <input
                      className="pn-input"
                      type="text"
                      placeholder={activeTemplate?.vars?.[i] ? `{{${i + 1}}} — ${activeTemplate.vars[i]}` : `Variable {{${i + 1}}}`}
                      value={val}
                      onChange={(e) => { updateParam(i, e.target.value); setErrorMsg(""); setLastResult(null); }}
                      disabled={isSending}
                    />
                    <button type="button" className="pn-chip__remove" onClick={() => removeParam(i)} disabled={isSending} title="Remove variable">×</button>
                  </div>
                ))}
                <button type="button" className="pn-image-picker__btn" onClick={addParam} disabled={isSending}>+ Add variable</button>
              </div>

              {channel === "whatsapp" && (
                <ImagePicker
                  image={image}
                  onPick={(f) => { setImage(f); setLastResult(null); setErrorMsg(""); }}
                  onClear={() => setImage(null)}
                  disabled={isSending}
                />
              )}
            </>
          )}

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
            <h3 className="pn-card__title">Reachability</h3>
            {statsLoading ? <p className="pn-stats-loading">Loading…</p> : (
              <>
                <div className="pn-stat">
                  <span className="pn-stat__label">Users with app push (FCM)</span>
                  <span className="pn-stat__value pn-stat__value--blue">{stats?.userCount ?? "—"}</span>
                </div>
                <div className="pn-stat">
                  <span className="pn-stat__label">Listeners with app push (FCM)</span>
                  <span className="pn-stat__value pn-stat__value--green">{stats?.listenerCount ?? "—"}</span>
                </div>
                <div className="pn-stat pn-stat--total">
                  <span className="pn-stat__label">Total FCM-reachable</span>
                  <span className="pn-stat__value">{stats?.totalCount ?? "—"}</span>
                </div>
                <div className="pn-stat" style={{ marginTop: 12 }}>
                  <span className="pn-stat__label">Users with a mobile no. (WhatsApp/SMS)</span>
                  <span className="pn-stat__value pn-stat__value--blue">{stats?.mobile?.userCount ?? "—"}</span>
                </div>
                <div className="pn-stat">
                  <span className="pn-stat__label">Listeners with a mobile no. (WhatsApp/SMS)</span>
                  <span className="pn-stat__value pn-stat__value--green">{stats?.mobile?.listenerCount ?? "—"}</span>
                </div>
                <div className="pn-stat pn-stat--total">
                  <span className="pn-stat__label">Total mobile-reachable</span>
                  <span className="pn-stat__value">{stats?.mobile?.totalCount ?? "—"}</span>
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
