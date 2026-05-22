import React from 'react';

/*
 * MarkdownLite — a small, dependency-free renderer for the constrained
 * markdown the briefing agent produces: h1-h3 headings, bullet and numbered
 * lists, paragraphs, and inline **bold** / _italic_ / `code`.
 *
 * Deliberately not a full markdown parser. The briefing format is fixed by
 * the agent's system prompt, so a focused renderer is safer than pulling in
 * react-markdown (ESM/CRA friction) for this one surface.
 */

function renderInline(text, keyPrefix) {
  const parts = String(text).split(/(\*\*[^*]+\*\*|`[^`]+`|_[^_]+_)/g);
  return parts.map((p, i) => {
    const key = `${keyPrefix}-${i}`;
    if (/^\*\*[^*]+\*\*$/.test(p)) return <strong key={key}>{p.slice(2, -2)}</strong>;
    if (/^`[^`]+`$/.test(p)) {
      return (
        <code key={key} className="tw-px-1 tw-py-0.5 tw-rounded tw-bg-bg-secondary tw-text-[12px]">
          {p.slice(1, -1)}
        </code>
      );
    }
    if (/^_[^_]+_$/.test(p)) return <em key={key}>{p.slice(1, -1)}</em>;
    return <React.Fragment key={key}>{p}</React.Fragment>;
  });
}

export default function MarkdownLite({ text, className }) {
  const lines = String(text || '').replace(/\r\n/g, '\n').split('\n');
  const blocks = [];
  let list = null; // { ordered, items }

  const flushList = () => {
    if (list) {
      blocks.push(list);
      list = null;
    }
  };

  lines.forEach((raw) => {
    const line = raw.trimEnd();
    if (!line.trim()) {
      flushList();
      return;
    }
    const heading = line.match(/^(#{1,3})\s+(.*)$/);
    if (heading) {
      flushList();
      blocks.push({ type: 'h', level: heading[1].length, text: heading[2] });
      return;
    }
    const bullet = line.match(/^[-*]\s+(.*)$/);
    if (bullet) {
      if (!list || list.ordered) {
        flushList();
        list = { ordered: false, items: [] };
      }
      list.items.push(bullet[1]);
      return;
    }
    const numbered = line.match(/^\d+[.)]\s+(.*)$/);
    if (numbered) {
      if (!list || !list.ordered) {
        flushList();
        list = { ordered: true, items: [] };
      }
      list.items.push(numbered[1]);
      return;
    }
    flushList();
    blocks.push({ type: 'p', text: line.trim() });
  });
  flushList();

  return (
    <div className={className}>
      {blocks.map((b, i) => {
        if (b.type === 'h') {
          const size =
            b.level === 1 ? 'tw-text-[16px]' : b.level === 2 ? 'tw-text-[14px]' : 'tw-text-[13px]';
          return (
            <div
              key={i}
              className={`${size} tw-font-semibold tw-text-fg-primary tw-mt-4 first:tw-mt-0 tw-mb-1.5`}
            >
              {renderInline(b.text, `h${i}`)}
            </div>
          );
        }
        if (b.type === 'p') {
          return (
            <p key={i} className="tw-my-1.5 tw-text-[13px] tw-text-fg-secondary tw-leading-relaxed">
              {renderInline(b.text, `p${i}`)}
            </p>
          );
        }
        // list block
        const Tag = b.ordered ? 'ol' : 'ul';
        return (
          <Tag
            key={i}
            className={`tw-my-1.5 tw-pl-5 ${
              b.ordered ? 'tw-list-decimal' : 'tw-list-disc'
            } tw-text-[13px] tw-text-fg-secondary tw-leading-relaxed`}
          >
            {b.items.map((it, j) => (
              <li key={j} className="tw-mb-0.5">
                {renderInline(it, `l${i}-${j}`)}
              </li>
            ))}
          </Tag>
        );
      })}
    </div>
  );
}
