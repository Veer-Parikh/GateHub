"use client";

// Dependency-free SVG column chart. Mark specs: bars ≤ 24px with a 4px rounded data-end and
// a square baseline, 2px surface gap between stacked segments, hairline recessive grid,
// per-column hover/focus tooltip, legend for 2+ series. Colors come from the validated
// --series-* tokens in globals.css (light and dark stepped separately).

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface Series {
  key: string;
  label: string;
  /** CSS color, normally `var(--series-n)` */
  color: string;
  values: number[];
}

const PAD = { top: 16, right: 8, bottom: 26, left: 40 };
const GAP = 2;
const RADIUS = 4;

function niceMax(max: number) {
  if (max <= 0) return 1;
  const exp = Math.pow(10, Math.floor(Math.log10(max)));
  const f = max / exp;
  const nice = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10;
  return nice * exp;
}

/** Column path with a rounded top (data end) and square bottom (baseline). */
function columnPath(x: number, y: number, w: number, h: number, rounded: boolean) {
  if (h <= 0) return "";
  const r = rounded ? Math.min(RADIUS, w / 2, h) : 0;
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
}

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

export function ColumnChart({
  categories,
  series,
  height = 220,
  format = (v) => v.toLocaleString("en-IN"),
  labelEvery = 1,
  capLabels = [],
  ariaLabel,
}: {
  categories: string[];
  series: Series[];
  height?: number;
  format?: (v: number) => string;
  /** Show every nth x-axis label (keeps dense axes legible) */
  labelEvery?: number;
  /** Indexes of columns that get a value label on the cap (label selectively) */
  capLabels?: number[];
  ariaLabel: string;
}) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);

  const totals = categories.map((_, i) => series.reduce((s, se) => s + (se.values[i] ?? 0), 0));
  const max = niceMax(Math.max(...totals, 0));
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * max);
  const innerW = Math.max(0, width - PAD.left - PAD.right);
  const innerH = height - PAD.top - PAD.bottom;
  const band = categories.length ? innerW / categories.length : 0;
  const barW = Math.max(2, Math.min(24, band * 0.62));
  const y = (v: number) => PAD.top + innerH - (v / max) * innerH;

  const tooltipX = hover === null ? 0 : PAD.left + band * hover + band / 2;
  const flip = tooltipX > width * 0.65;

  return (
    <div className="space-y-2">
      {series.length > 1 && (
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-600 dark:text-zinc-400" aria-label="Legend">
          {series.map((s) => (
            <li key={s.key} className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} />
              {s.label}
            </li>
          ))}
        </ul>
      )}
      <div ref={ref} className="relative w-full" style={{ height }} onPointerLeave={() => setHover(null)}>
        {width > 0 && (
          <svg width={width} height={height} role="img" aria-label={ariaLabel} className="overflow-visible">
            {ticks.map((t) => (
              <g key={t}>
                <line x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} stroke="var(--chart-grid)" strokeWidth={1} shapeRendering="crispEdges" />
                <text x={PAD.left - 8} y={y(t)} dy="0.32em" textAnchor="end" className="fill-zinc-500 text-[10px] tabular-nums dark:fill-zinc-400">
                  {format(t)}
                </text>
              </g>
            ))}

            {categories.map((c, i) => {
              const x = PAD.left + band * i + (band - barW) / 2;
              let acc = 0;
              const nonZero = series.filter((s) => (s.values[i] ?? 0) > 0);
              const top = nonZero[nonZero.length - 1];
              return (
                <g key={c} opacity={hover === null || hover === i ? 1 : 0.55} className="transition-opacity">
                  {series.map((s) => {
                    const v = s.values[i] ?? 0;
                    if (v <= 0) return null;
                    const y0 = y(acc + v);
                    const h = y(acc) - y0;
                    acc += v;
                    const isTop = s === top;
                    // 2px surface gap between stacked segments: trim the bottom of every segment above the baseline.
                    const gap = acc - v > 0 ? GAP : 0;
                    return <path key={s.key} d={columnPath(x, y0, barW, Math.max(0, h - gap), isTop)} fill={s.color} />;
                  })}
                  {capLabels.includes(i) && totals[i] > 0 && (
                    <text x={x + barW / 2} y={y(totals[i]) - 5} textAnchor="middle" className="fill-zinc-700 text-[10px] font-medium tabular-nums dark:fill-zinc-300">
                      {format(totals[i])}
                    </text>
                  )}
                  {i % labelEvery === 0 && (
                    <text x={x + barW / 2} y={height - 8} textAnchor="middle" className="fill-zinc-500 text-[10px] dark:fill-zinc-400">
                      {c}
                    </text>
                  )}
                  {/* Hit target: the whole column band, larger than the mark */}
                  <rect
                    x={PAD.left + band * i}
                    y={PAD.top}
                    width={band}
                    height={innerH}
                    fill="transparent"
                    tabIndex={0}
                    aria-label={`${c}: ${series.map((s) => `${s.label} ${format(s.values[i] ?? 0)}`).join(", ")}`}
                    onPointerEnter={() => setHover(i)}
                    onFocus={() => setHover(i)}
                    onBlur={() => setHover(null)}
                    className="cursor-default outline-none"
                  />
                </g>
              );
            })}
            <line x1={PAD.left} x2={width - PAD.right} y1={y(0)} y2={y(0)} stroke="currentColor" className="text-zinc-300 dark:text-zinc-700" shapeRendering="crispEdges" />
          </svg>
        )}

        {hover !== null && (
          <div
            className="pointer-events-none absolute top-0 z-10 min-w-36 rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs shadow-md dark:border-zinc-700 dark:bg-zinc-900"
            style={flip ? { right: width - tooltipX + 12 } : { left: tooltipX + 12 }}
          >
            <p className="mb-1 font-medium text-zinc-500 dark:text-zinc-400">{categories[hover]}</p>
            {[...series].reverse().map((s) => (
              <p key={s.key} className="flex items-center gap-2">
                <span className="h-0.5 w-3 rounded-full" style={{ background: s.color }} />
                <span className="font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">{format(s.values[hover] ?? 0)}</span>
                <span className="text-zinc-500 dark:text-zinc-400">{s.label}</span>
              </p>
            ))}
            {series.length > 1 && (
              <p className="mt-1 border-t border-zinc-100 pt-1 text-zinc-500 dark:border-zinc-800">
                Total <span className="font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">{format(totals[hover])}</span>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/** Chart card with a Chart / Table toggle — the table keeps every value reachable without hovering. */
export function ChartCard({
  title,
  description,
  chart,
  table,
  className,
}: {
  title: string;
  description?: string;
  chart: ReactNode;
  table: { columns: string[]; rows: (string | number)[][] };
  className?: string;
}) {
  const [view, setView] = useState<"chart" | "table">("chart");
  return (
    <section className={cn("rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900", className)}>
      <div className="flex items-start justify-between gap-3 border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold">{title}</h2>
          {description && <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{description}</p>}
        </div>
        <div className="flex shrink-0 rounded-md border border-zinc-200 p-0.5 text-[11px] dark:border-zinc-700">
          {(["chart", "table"] as const).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={view === v}
              onClick={() => setView(v)}
              className={cn("rounded px-2 py-0.5 capitalize", view === v ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900" : "text-zinc-500")}
            >
              {v}
            </button>
          ))}
        </div>
      </div>
      <div className="p-4">
        {view === "chart" ? (
          chart
        ) : (
          <div className="max-h-72 overflow-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-white dark:bg-zinc-900">
                <tr>
                  {table.columns.map((c, i) => (
                    <th key={c} className={cn("border-b border-zinc-200 py-1.5 font-medium text-zinc-500 dark:border-zinc-700", i ? "text-right" : "text-left")}>
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.rows.map((r) => (
                  <tr key={String(r[0])} className="border-b border-zinc-100 dark:border-zinc-800">
                    {r.map((cell, i) => (
                      <td key={i} className={cn("py-1.5", i ? "text-right tabular-nums" : "")}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
