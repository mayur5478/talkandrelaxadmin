import React, { useMemo, useState } from "react";
import {
  useStartCampaignMutation,
  useListCampaignsQuery,
  useGetCampaignQuery,
  useGetCampaignDeliveryQuery,
  useCancelCampaignMutation,
} from "../../services/campaign";

// Approved WhatsApp templates (keep in sync with backend KNOWN_TEMPLATES and the
// Push Notifications dropdown). `vars` = ordered {{n}} labels; [] = static body.
const WHATSAPP_TEMPLATES = [
  { name: "independence_day_offer_2026", label: "Independence Day offer (₹5/min)", vars: [] },
  { name: "feature_launch_announcement", label: "Feature launch announcement", vars: ["User name", "Feature name", "One-line detail"] },
  { name: "rate_change_notice", label: "Rate change notice", vars: ["User name", "What changed", "New rate", "Old rate", "Effective date"] },
  { name: "outage_fixed_login", label: "Outage fixed / login", vars: ["Brand / name"] },
];

const CHANNELS = [
  { value: "whatsapp", label: "WhatsApp" },
  { value: "sms", label: "SMS (HSP DLT)" },
];
const ROLES = [
  { value: "user", label: "Users" },
  { value: "listener", label: "Listeners" },
];

const box = { border: "1px solid #e3e0ee", borderRadius: 10, padding: 16, marginBottom: 16, background: "#fff" };
const label = { display: "block", fontWeight: 600, marginBottom: 6, fontSize: 13 };
const input = { width: "100%", padding: "8px 10px", border: "1px solid #d4d0e2", borderRadius: 8, marginBottom: 12, fontSize: 14 };
const btn = { padding: "10px 18px", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 };

function StatusPill({ status }) {
  const colors = {
    queued: "#8a7", running: "#2b7", completed: "#2b7",
    failed: "#c33", cancelled: "#999",
  };
  return (
    <span style={{ background: colors[status] || "#888", color: "#fff", padding: "2px 10px", borderRadius: 12, fontSize: 12, fontWeight: 600 }}>
      {status}
    </span>
  );
}

// Real delivery (from the status webhook), polled while the campaign is open.
function DeliveryBreakdown({ id, active }) {
  const { data } = useGetCampaignDeliveryQuery(id, { pollingInterval: active ? 5000 : 0, skip: !id });
  if (!data || !data.total) {
    return <p style={{ fontSize: 12, color: "#888", marginTop: 8 }}>No delivery callbacks yet (webhook updates as WhatsApp reports back).</p>;
  }
  const s = data.byStatus || {};
  const e = data.byError || {};
  const chip = (bg) => ({ background: bg, color: "#fff", borderRadius: 10, padding: "2px 9px", fontSize: 12, marginRight: 6, display: "inline-block", marginTop: 4 });
  return (
    <div style={{ marginTop: 10 }}>
      <strong style={{ fontSize: 12 }}>Real delivery ({data.total} reported):</strong>
      <div style={{ marginTop: 4 }}>
        {s.delivered ? <span style={chip("#2b7")}>delivered {s.delivered}</span> : null}
        {s.read ? <span style={chip("#1a8")}>read {s.read}</span> : null}
        {s.sent ? <span style={chip("#59f")}>sent {s.sent}</span> : null}
        {s.accepted ? <span style={chip("#999")}>accepted {s.accepted}</span> : null}
        {s.failed ? <span style={chip("#c33")}>failed {s.failed}</span> : null}
      </div>
      {Object.keys(e).length > 0 && (
        <div style={{ fontSize: 12, color: "#a33", marginTop: 6 }}>
          Errors: {Object.entries(e).map(([code, n]) => `${code}×${n}`).join(", ")}
          {e["131049"] ? " — 131049 = recipient marketing cap / engagement drop" : ""}
        </div>
      )}
    </div>
  );
}

// Live progress card — polls the campaign row every 3s until it settles.
function ActiveCampaign({ id, onDone }) {
  const { data } = useGetCampaignQuery(id, { pollingInterval: 3000, skip: !id });
  const [cancelCampaign, { isLoading: cancelling }] = useCancelCampaignMutation();
  const c = data?.campaign;
  if (!c) return <div style={box}>Starting campaign…</div>;

  const done = c.accepted + c.rejected;
  const pct = c.total_recipients ? Math.round((done / c.total_recipients) * 100) : 0;
  const settled = ["completed", "failed", "cancelled"].includes(c.status);

  return (
    <div style={box}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <strong>Campaign {c.channel.toUpperCase()} · {c.template_name || "SMS"}</strong>
        <StatusPill status={c.status} />
      </div>
      <div style={{ background: "#eee", borderRadius: 6, overflow: "hidden", height: 14, marginBottom: 8 }}>
        <div style={{ width: `${pct}%`, background: "#6a4cff", height: "100%", transition: "width .4s" }} />
      </div>
      <div style={{ fontSize: 13, marginBottom: 8 }}>
        {done}/{c.total_recipients} processed · accepted {c.accepted} · rejected {c.rejected} ({pct}%)
      </div>
      {Array.isArray(c.error_sample) && c.error_sample.length > 0 && (
        <details style={{ fontSize: 12, color: "#a33" }}>
          <summary>First errors</summary>
          <ul>{c.error_sample.map((e, i) => <li key={i}>{e.to}: {e.error}</li>)}</ul>
        </details>
      )}
      {!settled ? (
        <button style={{ ...btn, background: "#c33", color: "#fff" }} disabled={cancelling} onClick={() => cancelCampaign(id)}>
          {cancelling ? "Cancelling…" : "Cancel"}
        </button>
      ) : (
        <button style={{ ...btn, background: "#6a4cff", color: "#fff" }} onClick={onDone}>Done</button>
      )}
      {c.channel === "whatsapp" && <DeliveryBreakdown id={id} active={!settled} />}
      <p style={{ fontSize: 11, color: "#888", marginTop: 8 }}>
        "accepted" = provider took it. Real delivery above comes from the WhatsApp status webhook.
      </p>
    </div>
  );
}

export default function Campaigns() {
  const [channel, setChannel] = useState("whatsapp");
  const [templateName, setTemplateName] = useState(WHATSAPP_TEMPLATES[0].name);
  const [vars, setVars] = useState([]);
  const [languageCode, setLanguageCode] = useState("en");
  const [smsText, setSmsText] = useState("");
  const [dltTemplateId, setDltTemplateId] = useState("");
  const [targetRole, setTargetRole] = useState("user");
  const [limit, setLimit] = useState("");
  const [concurrency, setConcurrency] = useState(4);
  const [gapMs, setGapMs] = useState(200);
  const [activeId, setActiveId] = useState(null);
  const [err, setErr] = useState("");

  const [startCampaign, { isLoading: starting }] = useStartCampaignMutation();
  const { data: listData, refetch } = useListCampaignsQuery({ limit: 25 });

  const activeTpl = useMemo(() => WHATSAPP_TEMPLATES.find((t) => t.name === templateName), [templateName]);

  const onPickTemplate = (name) => {
    setTemplateName(name);
    const tpl = WHATSAPP_TEMPLATES.find((t) => t.name === name);
    setVars(tpl ? tpl.vars.map(() => "") : []);
  };

  const start = async () => {
    setErr("");
    try {
      const payload = {
        channel,
        targetRole,
        concurrency: Number(concurrency) || 4,
        gapMs: Number(gapMs) || 200,
      };
      if (limit) payload.limit = Number(limit);
      if (channel === "whatsapp") {
        payload.templateName = templateName;
        payload.languageCode = languageCode || "en";
        payload.templateParams = vars.map((v) => v.trim());
        if ((activeTpl?.vars.length || 0) !== payload.templateParams.filter(Boolean).length && activeTpl?.vars.length) {
          setErr(`Fill all ${activeTpl.vars.length} template variable(s).`);
          return;
        }
      } else {
        if (!smsText.trim()) { setErr("SMS text required (must match the DLT-approved template)."); return; }
        payload.smsText = smsText.trim();
        payload.dltTemplateId = dltTemplateId.trim() || undefined;
      }
      const res = await startCampaign(payload).unwrap();
      setActiveId(res.campaignId);
      refetch();
    } catch (e) {
      setErr(e?.data?.message || "Failed to start campaign.");
    }
  };

  return (
    <div style={{ padding: 20, maxWidth: 900 }}>
      <h2 style={{ marginBottom: 4 }}>Campaigns</h2>
      <p style={{ color: "#777", marginBottom: 16, fontSize: 13 }}>
        Broadcast an approved WhatsApp template or a DLT SMS to your audience. Runs in the background — you can leave this page.
      </p>

      {activeId && <ActiveCampaign id={activeId} onDone={() => { setActiveId(null); refetch(); }} />}

      <div style={box}>
        <label style={label}>Channel</label>
        <select style={input} value={channel} onChange={(e) => setChannel(e.target.value)}>
          {CHANNELS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>

        {channel === "whatsapp" ? (
          <>
            <label style={label}>Approved template</label>
            <select style={input} value={templateName} onChange={(e) => onPickTemplate(e.target.value)}>
              {WHATSAPP_TEMPLATES.map((t) => <option key={t.name} value={t.name}>{t.label} ({t.name})</option>)}
            </select>
            {activeTpl?.vars.map((vLabel, i) => (
              <input
                key={i}
                style={input}
                placeholder={`{{${i + 1}}} — ${vLabel}`}
                value={vars[i] || ""}
                onChange={(e) => setVars((p) => p.map((x, idx) => (idx === i ? e.target.value : x)))}
              />
            ))}
            {activeTpl && activeTpl.vars.length === 0 && (
              <p style={{ fontSize: 12, color: "#888", marginTop: -6, marginBottom: 12 }}>Static template — no variables.</p>
            )}
            <label style={label}>Language code</label>
            <input style={{ ...input, maxWidth: 140 }} value={languageCode} onChange={(e) => setLanguageCode(e.target.value)} />
          </>
        ) : (
          <>
            <label style={label}>SMS text (must match DLT-approved template exactly)</label>
            <textarea style={{ ...input, minHeight: 90 }} value={smsText} onChange={(e) => setSmsText(e.target.value)} placeholder="₹5/MIN FREEDOM ALERT! ..." />
            <label style={label}>DLT template id (HSP DLTTemplateId)</label>
            <input style={input} value={dltTemplateId} onChange={(e) => setDltTemplateId(e.target.value)} placeholder="e.g. 1207xxxxxxxxxxxxx" />
          </>
        )}

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 140 }}>
            <label style={label}>Audience</label>
            <select style={input} value={targetRole} onChange={(e) => setTargetRole(e.target.value)}>
              {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <div style={{ width: 120 }}>
            <label style={label}>Limit (optional)</label>
            <input style={input} type="number" value={limit} onChange={(e) => setLimit(e.target.value)} placeholder="all" />
          </div>
          <div style={{ width: 120 }}>
            <label style={label}>Concurrency</label>
            <input style={input} type="number" value={concurrency} onChange={(e) => setConcurrency(e.target.value)} />
          </div>
          <div style={{ width: 120 }}>
            <label style={label}>Gap (ms)</label>
            <input style={input} type="number" value={gapMs} onChange={(e) => setGapMs(e.target.value)} />
          </div>
        </div>

        {err && <p style={{ color: "#c33", fontSize: 13, marginBottom: 10 }}>{err}</p>}
        <button style={{ ...btn, background: "#6a4cff", color: "#fff" }} disabled={starting} onClick={start}>
          {starting ? "Starting…" : "Start campaign"}
        </button>
      </div>

      <h3 style={{ margin: "18px 0 8px" }}>Recent campaigns</h3>
      <div style={{ ...box, padding: 0, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#f4f2fb", textAlign: "left" }}>
              <th style={{ padding: 10 }}>When</th>
              <th style={{ padding: 10 }}>Channel</th>
              <th style={{ padding: 10 }}>Template</th>
              <th style={{ padding: 10 }}>Audience</th>
              <th style={{ padding: 10 }}>Total</th>
              <th style={{ padding: 10 }}>Accepted</th>
              <th style={{ padding: 10 }}>Rejected</th>
              <th style={{ padding: 10 }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {(listData?.campaigns || []).map((c) => (
              <tr key={c.id} style={{ borderTop: "1px solid #eee", cursor: "pointer" }} onClick={() => setActiveId(c.id)}>
                <td style={{ padding: 10 }}>{c.createdAt ? new Date(c.createdAt).toLocaleString() : "—"}</td>
                <td style={{ padding: 10 }}>{c.channel}</td>
                <td style={{ padding: 10 }}>{c.template_name || "SMS"}</td>
                <td style={{ padding: 10 }}>{c.target_role}</td>
                <td style={{ padding: 10 }}>{c.total_recipients}</td>
                <td style={{ padding: 10 }}>{c.accepted}</td>
                <td style={{ padding: 10 }}>{c.rejected}</td>
                <td style={{ padding: 10 }}><StatusPill status={c.status} /></td>
              </tr>
            ))}
            {(!listData?.campaigns || listData.campaigns.length === 0) && (
              <tr><td colSpan={8} style={{ padding: 16, color: "#999" }}>No campaigns yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
