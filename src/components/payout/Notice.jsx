import React from "react";
import { CheckCircle2, AlertTriangle, AlertCircle } from "lucide-react";

// Inline message with the right colour for what it says: success is green, a heads-up is amber, a failure is red.
const STYLE = {
  success: { cls: "tw-bg-bg-success tw-text-fg-success", Icon: CheckCircle2 },
  warning: { cls: "tw-bg-bg-warning tw-text-fg-warning", Icon: AlertTriangle },
  danger: { cls: "tw-bg-bg-danger tw-text-fg-danger", Icon: AlertCircle },
};

export default function Notice({ tone = "warning", title, children }) {
  const { cls, Icon } = STYLE[tone] || STYLE.warning;
  return (
    <div role="alert" className={`tw-flex tw-items-start tw-gap-2 tw-p-3 tw-rounded-lg tw-text-left ${cls}`}>
      <Icon size={16} className="tw-mt-0.5 tw-shrink-0" aria-hidden />
      <div>
        {title ? <div className="tw-font-semibold">{title}</div> : null}
        <div className="tw-text-small">{children}</div>
      </div>
    </div>
  );
}
