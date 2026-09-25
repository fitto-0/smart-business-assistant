/**
 * Chart theme — palette: soft beige + forest green.
 * Single accent ramp + muted semantics. No rainbows, no grid noise.
 */
export const CHART = {
  grid: "rgb(28 53 45 / 0.08)",
  cursor: "rgb(28 53 45 / 0.15)",
  tick: "#5A6A62",
  ink: "#1C352D",
  ember: "#1C352D",
  emberSoft: "#4F7A66",
  cream: "#E1EAE2",
  dim: "#7F8A7A",
  olive: "#7E9C6B",
  clay: "#B3392B",
  sand: "#D9A05B",
  steel: "#8A968C",
};

/** Series order — accent first, max 4. */
export const SERIES = [CHART.ember, CHART.cream, CHART.dim, CHART.olive];

export const axisProps = {
  tickLine: false,
  axisLine: false,
  tickMargin: 12,
  tick: {
    fontSize: 12,
    fontWeight: 500,
    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
    fill: "#5A6A62",
  },
};

export const tooltipStyle = {
  backgroundColor: "rgba(248, 240, 229, 0.96)",
  border: "1px solid rgb(28 53 45 / 0.14)",
  borderRadius: "2px",
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
  fontSize: 12.5,
  fontWeight: 500,
  color: "#1C352D",
  padding: "8px 12px",
};

export const tooltipLabelStyle = {
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
  fontSize: 12,
  fontWeight: 500,
  textTransform: "uppercase",
  letterSpacing: "0.12em",
  color: "#5A6A62",
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
