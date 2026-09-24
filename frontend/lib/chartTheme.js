/**
 * Ember Noir — shared chart theme (recharts).
 * Single accent ramp + muted semantics. No rainbows, no grid noise.
 */
export const CHART = {
  grid: "rgb(242 236 228 / 0.06)",
  cursor: "rgb(242 236 228 / 0.15)",
  tick: "#A79F95",
  ink: "#EDE7DC",
  ember: "#E2703A",
  emberSoft: "#F0A85C",
  cream: "#F7E3C4",
  dim: "#A79F95",
  olive: "#7E9C6B",
  clay: "#B3392B",
  sand: "#D9A05B",
  steel: "#8A9AA8",
};

/** Series order — ember first, max 4. */
export const SERIES = [CHART.ember, CHART.cream, CHART.dim, CHART.olive];

export const axisProps = {
  tickLine: false,
  axisLine: false,
  tickMargin: 12,
  tick: {
    fontSize: 12,
    fontWeight: 500,
    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
    fill: "#A79F95",
  },
};

export const tooltipStyle = {
  backgroundColor: "#100C0B",
  border: "1px solid rgb(242 236 228 / 0.10)",
  borderRadius: "2px",
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
  fontSize: 12.5,
  fontWeight: 500,
  color: "#EDE7DC",
  padding: "8px 12px",
};

export const tooltipLabelStyle = {
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
  fontSize: 12,
  fontWeight: 500,
  textTransform: "uppercase",
  letterSpacing: "0.12em",
  color: "#A79F95",
  marginBottom: 4,
};

export const tooltipCursor = { stroke: CHART.cursor, strokeWidth: 1 };

export const barProps = { barSize: 12, radius: [2, 2, 0, 0] };

export const areaGradientId = "emberAreaFill";

/** Ember area fill — 18% → 0%. Render inside the chart. */
export function EmberAreaFill({ id = areaGradientId } = {}) {
  return (
    <defs>
      <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={CHART.ember} stopOpacity={0.18} />
        <stop offset="100%" stopColor={CHART.ember} stopOpacity={0} />
      </linearGradient>
    </defs>
  );
}

export function emberUrl(id = areaGradientId) {
  return `url(#${id})`;
}
