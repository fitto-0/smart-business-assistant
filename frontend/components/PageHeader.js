import { fmt, fmtPct, deltaGlyph } from "../lib/format";

/**
 * Noir data-surface kit — ledger strip, hairline tables, status LEDs,
 * section shells, segmented control. One import per page in Phase 2.
 * RTL-safe: logical properties only (ms-/me-/ps-/pe-/text-start/text-end).
 */

/* ---------- status LED: 5px square dot + mono uppercase label ---------- */
const LED_TONE = {
  olive: "bg-olive",
  clay: "bg-clay",
  sand: "bg-sand",
  steel: "bg-steel",
  ember: "bg-ember-500",
  mute: "bg-line",
};

export function Status({ tone = "steel", children, className = "" }) {
  const dot = LED_TONE[tone] || LED_TONE.steel;
  return (
    <span className={`status ${className}`}>
      <span aria-hidden="true" className={`w-[5px] h-[5px] shrink-0 ${dot}`} />
      <span className="truncate">{children}</span>
    </span>
  );
}

/* ---------- ledger KPI strip: one divided band, not floating cards ---------- */
export function Ledger({ items }) {
  return (
    <section aria-label="Key figures" className="border-y border-line divide-y divide-line">
      {items.map((item, i) => (
        <div
          key={item.label || i}
          className="ledger-row flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1"
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="font-mono text-[12.5px] font-semibold uppercase tracking-[0.12em] text-ink-2 tabular-nums antialiased">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="font-mono text-[12.5px] font-medium uppercase tracking-[0.12em] text-ink truncate antialiased">{item.label}</span>
          </div>
          <div className="flex items-baseline gap-3">
            {item.delta != null && item.delta !== "" && (
              <span
                className={`font-mono text-[13px] font-medium tabular-nums antialiased ${
                  Number(item.delta) >= 0 ? "text-olive" : "text-clay"
                }`}
              >
                {deltaGlyph(item.delta)} {fmtPct(item.delta)}
              </span>
            )}
            <span className="stat-value">{item.value}</span>
          </div>
        </div>
      ))}
    </section>
  );
}

/* ---------- section shell: micro eyebrow + title + hairline panel ---------- */
export function Section({ eyebrow, title, action = null, children, className = "" }) {
  return (
    <section className={className}>
      {(eyebrow || title || action) && (
        <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
          <div className="min-w-0">
            {eyebrow && <p className="font-mono text-[12.5px] font-medium uppercase tracking-[0.14em] text-ink-2 antialiased mb-1.5">{eyebrow}</p>}
            {title && (
              <h2 className="font-display text-[22px] font-semibold tracking-[-0.02em] text-ink antialiased">
                {title}
              </h2>
            )}
          </div>
          {action && <div className="flex items-center gap-2 shrink-0">{action}</div>}
        </div>
      )}
      <div className="panel">{children}</div>
    </section>
  );
}

/* ---------- hairline table: mono header, single row separators ---------- */
export function NoirTable({ columns, rows, emptyLabel = "No rows", rowKey = null }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-start border-collapse">
        <thead>
          <tr className="bg-surface">
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={`px-4 py-2.5 font-mono text-[12px] font-medium uppercase tracking-[0.12em] text-ink-2 antialiased whitespace-nowrap ${
                  col.numeric ? "text-end" : "text-start"
                }`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((row, i) => (
            <tr
              key={rowKey ? row[rowKey] : i}
              className="transition-colors duration-200 hover:bg-surface"
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={`px-4 py-3 text-[14.5px] font-medium antialiased ${
                    col.numeric
                      ? "text-end font-mono tabular-nums text-ink"
                      : "text-start text-ink"
                  }`}
                >
                  {col.render ? col.render(row, i) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && (
        <p className="micro px-4 py-8 text-center">{emptyLabel}</p>
      )}
    </div>
  );
}

/* ---------- segmented control: hairline strip, ember underline ---------- */
export function Segmented({ options, value, onChange, ariaLabel = "View" }) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="inline-flex items-center border border-line rounded-xs overflow-hidden"
    >
      {options.map((opt, i) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={`px-3 py-1.5 font-mono text-[12.5px] font-medium uppercase tracking-label antialiased transition-colors duration-200 border-s border-line first:border-s-0 ${
              active ? "bg-surface-2 text-ink" : "text-ink-2 hover:text-ink"
            } ${i === 0 ? "border-s-0" : ""}`}
            style={active ? { boxShadow: "inset 0 -1px 0 #E2703A" } : undefined}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/* ---------- empty state: ruled, quiet, mono ---------- */
export function Empty({ title = "Nothing here", hint = null }) {
  return (
    <div className="px-4 py-10 text-center">
      <div aria-hidden="true" className="rule mx-auto max-w-[120px] mb-4" />
      <p className="font-mono text-[12.5px] font-medium uppercase tracking-[0.14em] text-ink antialiased">{title}</p>
      {hint && <p className="mt-2 text-[14px] text-ink-2 antialiased">{hint}</p>}
    </div>
  );
}

export { fmt };

/* ---------- page furniture: index eyebrow + title + rule ---------- */
export default function PageHeader({
  index,
  eyebrow,
  title,
  description,
  actions = null,
  meta = null,
}) {
  return (
    <div className="mb-6 sm:mb-8">
      {(eyebrow || index) && (
        <div className="flex items-center gap-3 mb-3">
          {index && (
            <span className="font-mono text-[12.5px] font-semibold uppercase tracking-[0.12em] text-ember-500 tabular-nums antialiased">
              {index}
            </span>
          )}
          {index && eyebrow && (
            <span aria-hidden="true" className="h-px w-6 bg-line" />
          )}
          {eyebrow && <span className="breadcrumb !text-[12.5px]">{eyebrow}</span>}
          {meta && (
            <>
              <span aria-hidden="true" className="h-px w-6 bg-line" />
              <span className="font-mono text-[12.5px] font-medium uppercase tracking-[0.12em] text-ink-2 antialiased">
                {meta}
              </span>
            </>
          )}
        </div>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0 max-w-[42rem]">
          {title && <h1 className="page-title">{title}</h1>}
          {description && (
            <p className="mt-3 text-[16px] font-medium leading-[1.65] text-ink antialiased max-w-[38rem]">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {actions}
          </div>
        )}
      </div>
      <div aria-hidden="true" className="rule mt-5" />
    </div>
  );
}

