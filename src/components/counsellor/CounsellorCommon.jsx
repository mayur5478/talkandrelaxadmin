import React from "react";
import { HeartHandshake } from "lucide-react";
import { EmptyState, Pill } from "../v2/ui";
import { TIER_TONE } from "./counsellorFormat";

export function NotEnabled() {
  return (
    <EmptyState
      icon={<HeartHandshake size={20} />}
      title="Counsellor module is not enabled on this server"
      description="The counsellor feature flag is off on the backend, so none of these pages have data yet."
    />
  );
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="tw-flex tw-items-center tw-justify-between tw-flex-wrap tw-gap-3">
      <div>
        <h1 className="tw-text-h1 tw-text-fg-primary tw-m-0">{title}</h1>
        {subtitle ? <p className="tw-text-small tw-text-fg-tertiary tw-mt-1 tw-mb-0">{subtitle}</p> : null}
      </div>
      {actions ? <div className="tw-flex tw-gap-2 tw-flex-wrap">{actions}</div> : null}
    </div>
  );
}

export function TierBadge({ tier }) {
  if (!tier) return <span className="tw-text-fg-tertiary">—</span>;
  return <Pill tone={TIER_TONE[tier] || "neutral"}>{String(tier).charAt(0).toUpperCase() + String(tier).slice(1)}</Pill>;
}

// Tele-MANAS is India's national tele-mental-health line; risk complaints are safety escalations.
export const RISK_NOTE = "Safety escalation. If the user may be in danger, direct them to Tele-MANAS on 14416 (24x7, free).";
