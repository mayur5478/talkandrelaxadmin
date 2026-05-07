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
 * KpiPlain — standard KPI card.
 *
 *   <KpiPlain
 *     icon={<Wallet size={14} />}
 *     label="Total revenue"
 *     value="₹48,290"
 *     delta={12.4}
 *     sub="This month"
 *     miniChart={<DonutMini percent={65} />}
 *   />
 */
export function KpiPlain({ icon, label, value, delta, sub, miniChart, tone = 'info' }) {
  return (
    <Card>
      <div className="tw-flex tw-items-start tw-justify-between tw-gap-3">
        <div className="tw-min-w-0">
          <div className="tw-flex tw-items-center tw-gap-2">
            <IconTile tone={tone}>{icon}</IconTile>
            {delta != null && <Delta value={delta} />}
          </div>
          <div className="tw-text-[12px] tw-text-fg-secondary tw-mt-3">{label}</div>
          <div className="tw-text-[20px] tw-font-medium tw-text-fg-primary tw-tabular-nums tw-mt-1 tw-truncate">
            {value}
          </div>
          {sub && <div className="tw-text-[11px] tw-text-fg-tertiary tw-mt-1">{sub}</div>}
        </div>
        {miniChart && <div className="tw-w-[72px] tw-h-[60px] tw-shrink-0">{miniChart}</div>}
      </div>
    </Card>
  );
}

/**
 * KpiPromoted — accent-bordered KPI with a corner percent gauge.
 * Use for the metrics you want to draw the eye to (e.g. today's
 * revenue, conversion rate).
 */
export function KpiPromoted({ icon, label, value, percent }) {
  return (
    <Card promoted className="tw-relative">
      {percent != null && (
        <div
          aria-hidden
          className="tw-absolute tw-top-2 tw-right-2 tw-text-[10px] tw-font-medium tw-text-fg-info tw-tabular-nums"
        >
          {percent}%
        </div>
      )}
      <div className="tw-w-7 tw-h-7 tw-rounded-sm tw-bg-bg-info tw-text-fg-info tw-grid tw-place-items-center">
        {icon}
      </div>
      <div className="tw-text-[20px] tw-font-medium tw-text-fg-primary tw-tabular-nums tw-mt-3 tw-truncate">
        {value}
      </div>
      <div className="tw-text-[12px] tw-text-fg-secondary tw-mt-1">{label}</div>
    </Card>
  );
}

/**
 * DonutMini — small radial chart for KPI corners (e.g. share-of-target).
 */
export function DonutMini({ percent = 65, color = 'var(--color-chart-2)' }) {
  const data = [{ name: 'value', value: percent }];
  return (
    <ResponsiveContainer>
      <RadialBarChart innerRadius="64%" outerRadius="100%" startAngle={90} endAngle={-270} data={data}>
        <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
        <RadialBar background={{ fill: 'var(--color-background-secondary)' }} dataKey="value" cornerRadius={6} fill={color} />
      </RadialBarChart>
    </ResponsiveContainer>
  );
}

/**
 * BarMini — small bar series for KPI corners.
 *   data = [{ v: 4 }, { v: 7 }, …]
 */
export function BarMini({ data, color = 'var(--color-chart-1)' }) {
  return (
    <ResponsiveContainer>
      <BarChart data={data}>
        <Bar dataKey="v" fill={color} radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/**
 * GoalRing — labeled radial progress, used in "Goals" / "Targets" panels.
 */
export function GoalRing({ label, sub, percent, color = 'var(--color-chart-1)' }) {
  const data = [{ name: 'value', value: percent }];
  return (
    <div className="tw-flex tw-items-center tw-gap-3">
      <div className="tw-w-[58px] tw-h-[58px] tw-shrink-0 tw-relative">
        <ResponsiveContainer>
          <RadialBarChart innerRadius="70%" outerRadius="100%" startAngle={90} endAngle={-270} data={data}>
            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
            <RadialBar background={{ fill: 'var(--color-background-secondary)' }} dataKey="value" cornerRadius={6} fill={color} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="tw-absolute tw-inset-0 tw-grid tw-place-items-center tw-text-[11px] tw-font-medium tw-text-fg-primary tw-tabular-nums">
          {percent}%
        </div>
      </div>
      <div className="tw-min-w-0">
        <div className="tw-text-[12px] tw-font-medium tw-text-fg-primary tw-truncate">{label}</div>
        <div className="tw-text-[11px] tw-text-fg-tertiary tw-truncate">{sub}</div>
      </div>
    </div>
  );
}
