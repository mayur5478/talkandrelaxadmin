import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getCookie } from "../cookie_helper/cookie";

// The agent runs in a separate backend service (talk-and-relax-agent), not the
// main API. Production is reached via the same nginx that proxies the main API
// (test-api.talkandrelax.com), at path /agent/ -> 127.0.0.1:3010 on the droplet.
// Override via REACT_APP_AGENT_URL in .env for local dev (e.g. http://localhost:3010).
const AGENT_URL =
  process.env.REACT_APP_AGENT_URL || "https://test-api.talkandrelax.com/agent";

export const agentApi = createApi({
  reducerPath: "agentApi",
  baseQuery: fetchBaseQuery({
    baseUrl: AGENT_URL,
    prepareHeaders: (headers) => {
      // Same admin token the rest of the portal uses; the agent backend
      // verifies it against the shared JWT secret.
      const token = getCookie("token") || localStorage.getItem("token");
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  endpoints: (builder) => ({
    // Runs the daily-briefing loop. force:true bypasses the 1-hour cache.
    brief: builder.mutation({
      query: ({ force = false } = {}) => ({
        url: "api/agent/brief",
        method: "POST",
        body: { force },
      }),
    }),
    // Tool-call audit log for the last N days.
    auditLog: builder.query({
      query: ({ days = 7 } = {}) => ({
        url: "api/agent/audit",
        method: "GET",
        params: { days },
      }),
    }),
  }),
});

export const { useBriefMutation, useAuditLogQuery } = agentApi;

/*
 * streamAgentChat — POST /api/agent/chat and parse the SSE stream.
 * RTK Query does not handle Server-Sent Events, so this uses fetch directly.
 *
 * @param {{role,content}[]} messages  Conversation history (ends with a user turn).
 * @param {(event:object)=>void} onEvent  Called for each SSE event.
 */
export async function streamAgentChat(messages, onEvent) {
  const token = getCookie("token") || localStorage.getItem("token");
  const res = await fetch(`${AGENT_URL}/api/agent/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ messages }),
  });

  if (!res.ok || !res.body) {
    let msg = `chat failed (${res.status})`;
    try {
      const j = await res.json();
      if (j && j.error) msg = j.error;
    } catch {
      /* response had no JSON body */
    }
    throw new Error(msg);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let sep;
    while ((sep = buffer.indexOf("\n\n")) !== -1) {
      const frame = buffer.slice(0, sep);
      buffer = buffer.slice(sep + 2);
      const dataLine = frame.split("\n").find((l) => l.startsWith("data:"));
      if (!dataLine) continue;
      try {
        onEvent(JSON.parse(dataLine.slice(5).trim()));
      } catch {
        /* ignore malformed frame */
      }
    }
  }
}
