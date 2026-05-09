import React from 'react';
import {
  ResponsiveContainer, RadialBarChart, RadialBar, PolarAngleAxis,
  BarChart, Bar,
} from 'recharts';
import { cn } from '../../../lib/cn';
import { Card } from './card';
import { IconTile } from './tile';
import { Delta } from './pill';

/**
 * KpiPlain — standard metric card.
 */
export function KpiPlain({ icon, label, value, delta, sub, miniChart, tone = 'info' }) {
  return (
    <Card className="tw-p-4">
      <div className="tw-flex tw-items-start tw-justify-between tw-gap-2">
        <div className="tw-min-w-0 tw-flex-1">
          <div className="tw-flex tw-items-center tw-gap-2 tw-mb-3">
            <IconTile tone={tone}>{icon}</IconTile>
            {delta != null && <Delta value={delta} />}
          </div>
          <div className="tw-text-[11px] tw-font-semibold tw-uppercase tw-tracking-[0.06em] tw-text-fg-tertiary">
            {label}
          </div>
          <div className="tw-text-[24px] tw-font-bold tw-text-fg-primary tw-tabular-nums tw-mt-1 tw-truncate tw-leading-none">
            {value}
          </div>
          {sub && (
            <div className="tw-text-[11px] tw-text-fg-tertiary tw-mt-1.5">{sub}</div>
          )}
        </div>
        {miniChart && (
          <div className="tw-w-[60px] tw-h-[52px] tw-shrink-0 tw-opacity-80">{miniChart}</div>
        )}
      </div>
    </Card>
  );
}

/**
 * KpiPromoted — accent-gradient card for the most important metrics.
 */
export function KpiPromoted({ icon, label, value, percent, tone = 'info' }) {
  const gradientId = `kpi-grad-${Math.random().toString(36).slice(2, 7)}`;
  return (
    <Card
      promoted
      className={cn(
        'tw-p-4 tw-relative tw-overflow-hidden',
        'before:tw-content-[""] before:tw-absolute before:tw-inset-0',
        'before:tw-bg-gradient-to-br before:tw-from-fg-info/[.06] before:tw-to-transparent',
        'before:tw-pointer-events-none',
      )}
    >
      {percent != null && (
        <div className="tw-absolute tw-top-3 tw-right-3 tw-flex tw-items-center tw-gap-1">
          <span className="tw-text-[11px] tw-font-bold tw-text-fg-info tw-tabular-nums">
            {percent}%
          </span>
          <div
            className="tw-w-7 tw-h-7 tw-shrink-0"
            aria-hidden
          >
            <svg viewBox="0 0 28 28" className="tw-rotate-[-90deg]">
              <circle cx="14" cy="14" r="11" fill="none" stroke="var(--color-background-secondary)" strokeWidth="3" />
              <circle
                cx="14" cy="14" r="11"
                fill="none"
                stroke="var(--color-text-info)"
                strokeWidth="3"
                strokeDasharray={`${(percent / 100) * 69.1} 69.1`}
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
      )}
      <div className="tw-w-8 tw-h-8 tw-rounded-lg tw-bg-fg-info/[.12] tw-text-fg-info tw-grid tw-place-items-center tw-mb-3">
        {icon}
      </div>
      <div className="tw-text-[11px] tw-font-semibold tw-uppercase tw-tracking-[0.06em] tw-text-fg-tertiary">
        {label}
      </div>
      <div className="tw-text-[24px] tw-font-bold tw-text-fg-primary tw-tabular-nums tw-mt-1 tw-leading-none tw-truncate">
        {value}
      </div>
    </Card>
  );
}

export function DonutMini({ percent = 65, color = 'var(--color-chart-2)' }) {
  const data = [{ name: 'value', value: percent }];
  return (
    <ResponsiveContainer>
      <RadialBarChart innerRadius="60%" outerRadius="100%" startAngle={90} endAngle={-270} data={data}>
        <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
        <RadialBar
          background={{ fill: 'var(--color-background-secondary)' }}
          dataKey="value"
          cornerRadius={8}
          fill={color}
        />
      </RadialBarChart>
    </ResponsiveContainer>
  );
}

export function BarMini({ data, color = 'var(--color-chart-1)' }) {
  return (
    <ResponsiveContainer>
      <BarChart data={data} barCategoryGap="20%">
        <Bar dataKey="v" fill={color} radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function GoalRing({ label, sub, percent, color = 'var(--color-chart-1)' }) {
  const data = [{ name: 'value', value: percent }];
  return (
    <div className="tw-flex tw-items-center tw-gap-3">
      <div className="tw-w-14 tw-h-14 tw-shrink-0 tw-relative">
        <ResponsiveContainer>
          <RadialBarChart innerRadius="68%" outerRadius="100%" startAngle={90} endAngle={-270} data={data}>
            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
            <RadialBar
              background={{ fill: 'var(--color-background-secondary)' }}
              dataKey="value"
              cornerRadius={8}
              fill={color}
            />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="tw-absolute tw-inset-0 tw-grid tw-place-items-center tw-text-[11px] tw-font-bold tw-text-fg-primary tw-tabular-nums">
          {percent}%
        </div>
      </div>
      <div className="tw-min-w-0">
        <div className="tw-text-[13px] tw-font-semibold tw-text-fg-primary tw-truncate">{label}</div>
        <div className="tw-text-[11px] tw-text-fg-tertiary tw-truncate tw-mt-0.5">{sub}</div>
      </div>
    </div>
  );
}
