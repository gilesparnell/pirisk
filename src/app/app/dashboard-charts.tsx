"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { DayData, AgeBucket } from "./chart-data";

/* ── Weekly Hours Bar Chart ── */

export function WeeklyHoursChart({ data }: { data: DayData[] }) {
  const hasData = data.some((d) => d.hours > 0);

  return (
    <div className="rounded-2xl bg-white border border-gray-200 p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Weekly Hours</h3>
      {!hasData ? (
        <p className="text-sm text-gray-400 py-16 text-center">
          No hours logged this week
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data}>
            <XAxis dataKey="day" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
            <Tooltip
              formatter={(value) => [`${Number(value).toFixed(1)}h`, "Hours"]}
              contentStyle={{ borderRadius: 8, fontSize: 13 }}
            />
            <Bar dataKey="hours" fill="#0d9488" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

/* ── Revenue by Client Horizontal Bar Chart ── */

export function RevenueByClientChart({
  data,
}: {
  data: { name: string; amount: number }[];
}) {
  const hasData = data.length > 0 && data.some((d) => d.amount > 0);

  return (
    <div className="rounded-2xl bg-white border border-gray-200 p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">
        Revenue by Client
      </h3>
      {!hasData ? (
        <p className="text-sm text-gray-400 py-16 text-center">
          No billable revenue this week
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data} layout="vertical">
            <XAxis
              type="number"
              tick={{ fontSize: 12 }}
              tickFormatter={(v: number) => `$${v.toLocaleString()}`}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 12 }}
              width={120}
            />
            <Tooltip
              formatter={(value) => [
                `$${Number(value).toLocaleString("en-AU", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
                "Revenue",
              ]}
              contentStyle={{ borderRadius: 8, fontSize: 13 }}
            />
            <Bar dataKey="amount" fill="#0d9488" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

/* ── Aged Receivables Bar Chart ── */

const BUCKET_COLORS: Record<string, string> = {
  Current: "#0d9488",
  "1-30": "#f59e0b",
  "31-60": "#f97316",
  "60+": "#ef4444",
};

export function AgedReceivablesChart({ data }: { data: AgeBucket[] }) {
  const hasData = data.some((d) => d.amount > 0);

  return (
    <div className="rounded-2xl bg-white border border-gray-200 p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">
        Aged Receivables
      </h3>
      {!hasData ? (
        <p className="text-sm text-gray-400 py-16 text-center">
          No outstanding receivables
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data}>
            <XAxis dataKey="bucket" tick={{ fontSize: 12 }} />
            <YAxis
              tick={{ fontSize: 12 }}
              tickFormatter={(v: number) => `$${v.toLocaleString()}`}
            />
            <Tooltip
              formatter={(value) => [
                `$${Number(value).toLocaleString("en-AU", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
                "Outstanding",
              ]}
              contentStyle={{ borderRadius: 8, fontSize: 13 }}
            />
            <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
              {data.map((entry) => (
                <Cell
                  key={entry.bucket}
                  fill={BUCKET_COLORS[entry.bucket] ?? "#0d9488"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
