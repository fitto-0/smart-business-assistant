/** Ember Noir — shared number formatting (fr-FR ledger style). */
export const fmt = (n) => {
  const v = Number(n);
  if (!Number.isFinite(v)) return "—";
  return new Intl.NumberFormat("fr-FR").format(v);
};

export const fmtDA = (n) => `${fmt(n)} DA`;

export const fmtPct = (n, digits = 1) => {
  const v = Number(n);
  if (!Number.isFinite(v)) return "—";
  const sign = v > 0 ? "+" : "";
  return `${sign}${v.toFixed(digits)}%`;
};

/** Mono delta glyph — ▲ up / ▼ down (no emoji, no icon dependency). */
export const deltaGlyph = (v) => (Number(v) >= 0 ? "▲" : "▼");
