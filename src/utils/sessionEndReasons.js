const END_REASON_DEFINITIONS = [
  {
    label: "User ended",
    tone: "info",
    patterns: [
      /^ended_by_user$/,
      /^user_manual_end$/,
      /^manual_user_end$/,
      /^manual_end$/,
      /^ended$/,
      /user.*end/,
      /user.*left/,
      /user.*hung/,
      /user.*press/,
      /on end session/,
      /from close dialog/,
    ],
  },
  {
    label: "Listener ended",
    tone: "warning",
    patterns: [
      /^ended_by_listener$/,
      /^listener_manual_end$/,
      /^manual_listener_end$/,
      /listener.*end/,
      /listener.*left/,
      /listener.*hung/,
      /from bloc user/,
      /block/,
    ],
  },
  {
    label: "Low balance",
    tone: "danger",
    patterns: [
      /^low_balance$/,
      /^insufficient_balance$/,
      /balance/,
      /wallet/,
      /insufficient/,
      /triggered.*balance/,
    ],
  },
  {
    label: "Network drop",
    tone: "warning",
    patterns: [
      /^ended_by_network$/,
      /^network_lost$/,
      /^network$/,
      /^network_disconnect$/,
      /^network_disconnection$/,
      /network/,
      /internet/,
      /disconnect/,
      /transport.?clos/,
      /ping.?timeout/,
      /grace/,
    ],
  },
  {
    label: "Client watchdog",
    tone: "warning",
    patterns: [
      /^ended_by_client_watchdog$/,
      /^client_watchdog$/,
      /^session_update_watchdog$/,
      /watchdog/,
      /billing timeout/,
      /room.*disconnect/,
      /zego.*disconnect/,
    ],
  },
  {
    label: "System guard",
    tone: "danger",
    patterns: [
      /^ended_by_system_guard$/,
      /^system_guard$/,
      /^system$/,
      /^server$/,
      /system.*guard/,
      /both participants inactive/,
    ],
  },
  {
    label: "Admin action",
    tone: "danger",
    patterns: [
      /^ended_by_admin$/,
      /^admin_force_end$/,
      /^force_end_by_admin$/,
      /force.?end/,
      /admin.?force/,
      /forced/,
      /admin.*reset/,
      /reset.*admin/,
      /global.?reset/,
      /admin/,
    ],
  },
  {
    label: "Stale session",
    tone: "neutral",
    patterns: [
      /^stale_session_timeout$/,
      /^ghost_session_sweep$/,
      /^janitor_sweep$/,
      /zombie/,
      /stale/,
      /janitor/,
      /ghost/,
      /abandoned/,
      /healed/,
    ],
  },
  {
    label: "Connection failed",
    tone: "warning",
    patterns: [
      /^room_join_failed$/,
      /^zego_join_failed$/,
      /^zego_not_confirmed$/,
      /^connection_failed$/,
      /zego/,
      /never.?confirm/,
      /not.?confirm/,
      /room join failed/,
    ],
  },
  {
    label: "Timed out",
    tone: "neutral",
    patterns: [
      /^timeout$/,
      /^timed_out$/,
      /timeout/,
      /time.?out/,
      /inactiv/,
    ],
  },
  {
    label: "Failed",
    tone: "danger",
    patterns: [
      /^failed$/,
      /^session_start_failed$/,
      /failed/,
      /could not start/,
    ],
  },
  {
    label: "Completed",
    tone: "success",
    patterns: [
      /^completed$/,
      /^success$/,
      /complet/,
      /success/,
    ],
  },
];

export function classifySessionEndReason(rawReason) {
  const raw = String(rawReason || "").trim();

  if (!raw) {
    return {
      raw,
      label: "",
      tone: "empty",
      isKnown: true,
    };
  }

  const normalized = raw.toLowerCase().replace(/\s+/g, " ");
  const match = END_REASON_DEFINITIONS.find((definition) =>
    definition.patterns.some((pattern) => pattern.test(normalized))
  );

  if (match) {
    return {
      raw,
      label: match.label,
      tone: match.tone,
      isKnown: true,
    };
  }

  return {
    raw,
    label: raw,
    tone: "unknown",
    isKnown: false,
  };
}

export function formatSessionEndReason(rawReason) {
  const classified = classifySessionEndReason(rawReason);
  return classified.label || "";
}
