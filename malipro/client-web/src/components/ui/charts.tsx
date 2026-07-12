"use client";

import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import type { SeriesPoint } from "@/types";
import { formatCompact } from "@/lib/utils";

const AXIS = { fontSize: 11, fill: "rgb(var(--muted))" };
const GRID = "rgb(var(--line))";
const BRAND = "rgb(var(--brand))";
const GOLD = "rgb(var(--gold-dark))";

const PIE_COLORS = [
  "rgb(var(--brand))",
  "rgb(var(--gold-dark))",
  "#2E7D32",
  "#1976D2",
  "#6A1B9A",
  "#00838F",
  "#F9A825",
];

function ChartTooltip({ active, payload, label, formatter }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-line bg-surface px-3 py-2 text-xs shadow-lifted">
      <p className="mb-1 font-semibold text-ink">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-muted">
          <span style={{ color: p.color }}>●</span> {formatter ? formatter(p.value) : p.value}
        </p>
      ))}
    </div>
  );
}

export function AreaTrend({ data, height = 240 }: { data: SeriesPoint[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <defs>
          <linearGradient id="mp-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={BRAND} stopOpacity={0.35} />
            <stop offset="100%" stopColor={BRAND} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke={GRID} strokeDasharray="3 3" />
        <XAxis dataKey="label" tick={AXIS} axisLine={false} tickLine={false} />
        <YAxis tick={AXIS} axisLine={false} tickLine={false} tickFormatter={formatCompact} width={44} />
        <Tooltip content={<ChartTooltip formatter={(v: number) => `${formatCompact(v)} FCFA`} />} />
        <Area type="monotone" dataKey="value" stroke={BRAND} strokeWidth={2.5} fill="url(#mp-area)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function BarSeries({ data, height = 240 }: { data: SeriesPoint[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke={GRID} strokeDasharray="3 3" />
        <XAxis dataKey="label" tick={AXIS} axisLine={false} tickLine={false} interval="preserveStartEnd" />
        <YAxis tick={AXIS} axisLine={false} tickLine={false} tickFormatter={formatCompact} width={40} />
        <Tooltip cursor={{ fill: "rgb(var(--brand) / 0.06)" }} content={<ChartTooltip />} />
        <Bar dataKey="value" fill={BRAND} radius={[6, 6, 0, 0]} maxBarSize={26} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function LineDuo({ data, height = 240 }: { data: SeriesPoint[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke={GRID} strokeDasharray="3 3" />
        <XAxis dataKey="label" tick={AXIS} axisLine={false} tickLine={false} />
        <YAxis tick={AXIS} axisLine={false} tickLine={false} width={40} />
        <Tooltip content={<ChartTooltip />} />
        <Line type="monotone" dataKey="value" stroke={BRAND} strokeWidth={2.5} dot={false} />
        <Line type="monotone" dataKey="secondary" stroke={GOLD} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function DonutChart({ data, height = 240 }: { data: SeriesPoint[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="label" innerRadius="58%" outerRadius="82%" paddingAngle={2} stroke="none">
          {data.map((_, i) => (
            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<ChartTooltip />} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export { PIE_COLORS };
