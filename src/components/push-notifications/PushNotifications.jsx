import React, { useState } from "react";
import "./push-notifications.scss";
import {
  useGetPushStatsQuery,
  useSendToUsersMutation,
  useSendToListenersMutation,
  useSendToAllMutation,
} from "../../services/notification";

const TARGETS = [
  { value: "users", label: "Users Only" },
  { value: "listeners", label: "Listeners Only" },
  { value: "all", label: "Users & Listeners" },
];

const defaultForm = { title: "", body: "" };

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

function PushNotifications() {
  const [target, setTarget] = useState("users");
  const [form, setForm] = useState(defaultForm);
  const [lastResult, setLastResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [history, setHistory] = useState([]);

  const { data: stats, isLoading: statsLoading } = useGetPushStatsQuery();

  const [sendToUsers, { isLoading: sendingUsers }] = useSendToUsersMutation();
  const [sendToListeners, { isLoading: sendingListeners }] = useSendToListenersMutation();
  const [sendToAll, { isLoading: sendingAll }] = useSendToAllMutation();

  const isSending = sendingUsers || sendingListeners || sendingAll;

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrorMsg("");
    setLastResult(null);
  };

  const recipientCount = () => {
    if (!stats) return "—";
    if (target === "users") return stats.userCount;
    if (target === "listeners") return stats.listenerCount;
    return stats.totalCount;
  };

  const handleSend = async () => {
    if (!form.title.trim() || !form.body.trim()) {
      setErrorMsg("Please fill in both title and message.");
      return;
    }
    setErrorMsg("");
    setLastResult(null);

    try {
      const payload = { title: form.title.trim(), body: form.body.trim() };
      let res;
      if (target === "users") res = await sendToUsers(payload).unwrap();
      else if (target === "listeners") res = await sendToListeners(payload).unwrap();
      else res = await sendToAll(payload).unwrap();

      setLastResult(res);
      setHistory((prev) => [
        {
          id: Date.now(),
          target,
          title: form.title,
          body: form.body,
          sentAt: new Date().toLocaleString(),
          result: res,
        },
        ...prev.slice(0, 9), // keep last 10 entries
      ]);
      setForm(defaultForm);
    } catch (err) {
      setErrorMsg(err?.data?.message || "Failed to send notification. Please try again.");
    }
  };

  return (
    <div className="pn-page">
      {/* Header */}
      <div className="pn-header">
        <h2 className="pn-header__title">Push Notifications</h2>
        <p className="pn-header__subtitle">
          Broadcast notifications directly to app users and/or listeners.
        </p>
      </div>

      <div className="pn-layout">
        {/* Compose card */}
        <div className="pn-card">
          <h3 className="pn-card__title">Compose Notification</h3>

          {/* Audience selector */}
          <div className="pn-field">
            <label className="pn-label">Send To</label>
            <div className="pn-target-group">
              {TARGETS.map(({ value, label }) => (
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
                {recipientCount()} device{recipientCount() !== 1 ? "s" : ""} will receive this
              </p>
            )}
          </div>

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

          {/* Error */}
          {errorMsg && <p className="pn-error">{errorMsg}</p>}

          {/* Result */}
          {lastResult && <ResultBadge result={lastResult} />}

          {/* Send button */}
          <button
            className="pn-send-btn"
            onClick={handleSend}
            disabled={isSending || !form.title.trim() || !form.body.trim()}
          >
            {isSending ? "Sending..." : "Send Notification"}
          </button>
        </div>

        {/* Stats card */}
        <div className="pn-sidebar">
          <div className="pn-card pn-stats-card">
            <h3 className="pn-card__title">Device Stats</h3>
            {statsLoading ? (
              <p className="pn-stats-loading">Loading...</p>
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
                        {item.target === "users" ? "Users" : item.target === "listeners" ? "Listeners" : "All"}
                      </span>
                      <span className="pn-history-item__time">{item.sentAt}</span>
                    </div>
                    <p className="pn-history-item__title">{item.title}</p>
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
