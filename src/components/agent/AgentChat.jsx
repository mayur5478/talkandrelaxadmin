import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { Card, CardTitle, Button, Input } from '../v2/ui';
import { streamAgentChat } from '../../services/agent';
import MarkdownLite from './MarkdownLite';
import ToolPill from './ToolPill';

/*
 * AgentChat — streaming chat with the agent. Tool calls render inline as
 * expandable pills as they happen; the answer streams in token by token.
 */
export default function AgentChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Apply a transform to the last (assistant) message.
  const updateLast = (fn) => {
    setMessages((prev) => {
      if (prev.length === 0) return prev;
      const next = [...prev];
      next[next.length - 1] = fn({ ...next[next.length - 1] });
      return next;
    });
  };

  const send = async () => {
    const text = input.trim();
    if (!text || streaming) return;

    const history = [...messages, { role: 'user', content: text }];
    setMessages([...history, { role: 'assistant', content: '', tools: [], streaming: true }]);
    setInput('');
    setStreaming(true);

    try {
      await streamAgentChat(
        history.map((m) => ({ role: m.role, content: m.content })),
        (ev) => {
          if (ev.type === 'text_delta') {
            updateLast((m) => ({ ...m, content: (m.content || '') + ev.text }));
          } else if (ev.type === 'tool_use') {
            updateLast((m) => ({
              ...m,
              tools: [...(m.tools || []), { id: ev.id, name: ev.name, input: ev.input, status: 'running' }],
            }));
          } else if (ev.type === 'tool_result') {
            updateLast((m) => ({
              ...m,
              tools: (m.tools || []).map((t) =>
                t.id === ev.id
                  ? {
                      ...t,
                      status: 'done',
                      duration_ms: ev.duration_ms,
                      output_preview: ev.output_preview,
                      error: ev.error,
                    }
                  : t,
              ),
            }));
          } else if (ev.type === 'error') {
            updateLast((m) => ({ ...m, error: ev.error }));
          }
        },
      );
    } catch (e) {
      updateLast((m) => ({ ...m, error: e.message }));
    } finally {
      updateLast((m) => ({ ...m, streaming: false }));
      setStreaming(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <Card flush>
      <div className="tw-px-4 tw-py-3 tw-border-b tw-border-hairline tw-border-tertiary">
        <CardTitle>Ask the agent</CardTitle>
      </div>

      <div
        ref={scrollRef}
        className="tw-max-h-[420px] tw-overflow-y-auto tw-px-4 tw-py-3 tw-flex tw-flex-col tw-gap-3"
      >
        {messages.length === 0 && (
          <div className="tw-text-[12px] tw-text-fg-tertiary tw-py-6 tw-text-center">
            Ask about users, sessions, retention, or feedback. The agent is read-only — it cannot
            change data or send anything.
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'tw-flex tw-justify-end' : 'tw-flex tw-justify-start'}>
            {m.role === 'user' ? (
              <div className="tw-max-w-[80%] tw-rounded-xl tw-bg-fg-info/[.10] tw-text-fg-primary tw-px-3 tw-py-2 tw-text-[13px] tw-whitespace-pre-wrap">
                {m.content}
              </div>
            ) : (
              <div className="tw-w-full tw-flex tw-flex-col tw-gap-1.5">
                {(m.tools || []).length > 0 && (
                  <div className="tw-flex tw-flex-col tw-gap-1">
                    {m.tools.map((t) => (
                      <ToolPill key={t.id} tool={t} />
                    ))}
                  </div>
                )}
                {m.content ? (
                  <MarkdownLite text={m.content} />
                ) : m.streaming && (m.tools || []).length === 0 ? (
                  <div className="tw-text-[12px] tw-text-fg-tertiary">Thinking…</div>
                ) : null}
                {m.error && <div className="tw-text-[12px] tw-text-fg-danger">{m.error}</div>}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="tw-flex tw-items-center tw-gap-2 tw-px-4 tw-py-3 tw-border-t tw-border-hairline tw-border-tertiary">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Ask the agent…"
          disabled={streaming}
          className="tw-flex-1"
        />
        <Button onClick={send} loading={streaming} disabled={!input.trim()}>
          <Send size={14} aria-hidden />
          Send
        </Button>
      </div>
    </Card>
  );
}
