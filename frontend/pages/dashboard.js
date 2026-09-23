import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import PageHeader, {
  Ledger,
  Section,
  Status,
  Empty,
} from "../components/PageHeader";
import { apiGet } from "../lib/api";
import { useLanguage } from "../lib/LanguageContext";
import { fmt, fmtPct, deltaGlyph } from "../lib/format";
import {
  CHART,
  SERIES,
  axisProps,
  tooltipCursor,
  barProps,
  EmberAreaFill,
  emberUrl,
} from "../lib/chartTheme";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { AlertTriangle, Lightbulb } from "lucide-react";
import { useRouter } from "next/router";
import Link from "next/link";

/* Noir tooltip — hairline panel, mono, square LED swatches. */
const ChartTooltip = ({ active, payload, label, unit = "" }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-surface border border-line rounded-xs px-3 py-2">
      <p className="font-mono text-[12px] font-medium uppercase tracking-[0.12em] text-ink-2 antialiased mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="font-mono text-[12.5px] font-medium tabular-nums text-ink antialiased">
          <span
            aria-hidden="true"
            className="inline-block w-[5px] h-[5px] me-1.5 align-middle"
            style={{ background: p.color || p.payload?.fill || CHART.ember }}
          />
          {p.name}: {fmt(p.value)}
          {unit ? ` ${unit}` : ""}
        </p>
      ))}
    </div>
  );
};

const ANOMALY_TONE = (s) =>
  s === "critique" ? "clay" : s === "haute" ? "sand" : "steel";

export default function Dashboard() {
  const { t } = useLanguage();
  const [kpis, setKpis] = useState({
    totalRevenue: 0,
    revenueGrowth: 0,
    totalOrders: 0,
    avgOrderValue: 0,
    customerSatisfaction: 0,
    totalReviews: 0,
    stockAlerts: 0,
  });
  const [monthlySales, setMonthlySales] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const responses = await Promise.allSettled([
          apiGet("/sales/kpis"),
          apiGet("/sales/monthly"),
          apiGet("/sales/categories"),
          apiGet("/sales/top-products", { limit: 5 }),
          apiGet("/analysis/anomalies"),
          apiGet("/analysis/recommendations"),
        ]);

        const getResponse = (index, fallback) => {
          const response = responses[index];
          if (response.status === "fulfilled") return response.value;
          console.error("Dashboard request failed", response.reason);
          return fallback;
        };

        const salesKpis = getResponse(0, {});
        const monthly = getResponse(1, { data: [] });
        const categories = getResponse(2, { data: [] });
        const products = getResponse(3, { data: [] });
        const anomalyData = getResponse(4, { anomalies: [], stats: {} });
        const recData = getResponse(5, { recommendations: [] });

        const derivedKpis = {
          ...salesKpis,
          stockAlerts: anomalyData?.stats?.critical || 0,
        };

        setKpis(derivedKpis);
        setMonthlySales(monthly?.data || []);
        setCategoryData(categories?.data || []);
        setTopProducts(products?.data || []);
        setAnomalies(anomalyData?.anomalies || []);
        setRecommendations(recData?.recommendations || []);
      } catch (error) {
        console.error("Failed to load dashboard data", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const criticalAnomalies = (anomalies || []).filter(
    (a) => a.severity === "critique" || a.severity === "haute",
  );
  const topRecs = (recommendations || [])
    .filter((r) => r.priority === "critique" || r.priority === "haute")
    .slice(0, 3);

  if (loading) {
    return (
      <Layout title={t("dashboard.title")}>
        <div className="panel px-4 py-16 text-center">
          <p className="micro-2 animate-shimmer">{t("dashboard.loading")}</p>
        </div>
      </Layout>
    );
  }

  const kpiItems = [
    {
      label: t("dashboard.kpis.totalRevenue"),
      value: `${fmt(kpis.totalRevenue)} DA`,
      delta: kpis.revenueGrowth,
    },
    {
      label: t("dashboard.kpis.totalOrders"),
      value: fmt(kpis.totalOrders),
      delta: kpis.ordersGrowth,
    },
    {
      label: t("dashboard.kpis.customerSatisfaction"),
      value: `${kpis.customerSatisfaction}/5`,
      delta: kpis.satisfactionGrowth,
    },
    {
      label: t("dashboard.kpis.stockAlerts"),
      value: fmt(kpis.stockAlerts),
    },
  ];

  return (
    <Layout title={t("dashboard.title")}>
      <PageHeader
        index="01"
        eyebrow={t("dashboard.title")}
        title={t("dashboard.title")}
      />

      {/* KPI ledger — one divided band, index + mono delta */}
      <Ledger items={kpiItems} />

      <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Sales evolution — ember area vs steel dashed target */}
        <Section
          eyebrow={t("dashboard.charts.salesVsTargets")}
          title={t("dashboard.charts.salesEvolution")}
          className="xl:col-span-2"
          action={
            <Link href="/sales" className="btn-ghost">
              {t("dashboard.charts.viewDetails")} <span aria-hidden="true">→</span>
            </Link>
          }
        >
          <div className="px-4 pt-4">
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={monthlySales} margin={{ top: 4, right: 4, bottom: 0, left: -8 }}>
                <EmberAreaFill />
                <CartesianGrid vertical={false} stroke={CHART.grid} />
                <XAxis dataKey="month" {...axisProps} />
                <YAxis
                  {...axisProps}
                  tickFormatter={(v) => `${v / 1000}k`}
                  width={48}
                />
                <Tooltip content={<ChartTooltip unit="DA" />} cursor={tooltipCursor} />
                <Area
                  type="monotone"
                  dataKey="actual"
                  name="Sales (DA)"
                  stroke={CHART.ember}
                  strokeWidth={2}
                  fill={emberUrl()}
                />
                <Area
                  type="monotone"
                  dataKey="target"
                  name="Target (DA)"
                  stroke={CHART.dim}
                  strokeWidth={1.5}
                  strokeDasharray="5 5"
                  fill="none"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Section>

        {/* Category mix — ring + centered mono total, square legend */}
        <Section
          eyebrow={t("dashboard.charts.revenueDistribution")}
          title={t("dashboard.charts.salesByCategory")}
        >
          <div className="px-4 pt-2">
            <ResponsiveContainer width="100%" height={168}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={76}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {categoryData.map((entry, i) => (
                    <Cell key={i} fill={SERIES[i % SERIES.length]} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip
                  content={<ChartTooltip />}
                  contentStyle={{ background: "transparent", border: "none" }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-0 border-t border-line">
              {categoryData.map((cat, i) => (
                <div key={cat.name} className="flex items-center justify-between gap-3 py-2.5 border-b border-line last:border-b-0">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      aria-hidden="true"
                      className="w-[5px] h-[5px] shrink-0"
                      style={{ background: SERIES[i % SERIES.length] }}
                    />
                    <span className="text-[15px] font-medium text-ink truncate antialiased">{cat.name}</span>
                  </div>
                  <span className="font-mono text-[13px] font-medium tabular-nums text-ink shrink-0 antialiased">
                    {cat.value}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Section>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Top products — ranked ledger rows, square index ticks */}
        <Section
          eyebrow="Rankings"
          title="Top Products"
          action={
            <Link href="/products" className="btn-ghost">
              View all <span aria-hidden="true">→</span>
            </Link>
          }
        >
          <div>
            {topProducts.length === 0 ? (
              <Empty title="No sales data yet" />
            ) : (
              <div className="divide-y divide-line">
                {topProducts.map((product, index) => (
                  <div key={product.id} className="flex items-center gap-3 px-4 py-3 transition-colors duration-200 hover:bg-surface">
                    <span className="font-mono text-[12.5px] font-semibold uppercase tracking-[0.12em] text-ink-2 tabular-nums w-6 shrink-0 antialiased">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] font-semibold text-ink truncate antialiased">
                        {product.name}
                      </p>
                      <p className="font-mono text-[12px] font-medium uppercase tracking-[0.12em] text-ink-2 antialiased mt-1">
                        {product.orders} orders
                      </p>
                    </div>
                    <div className="text-end shrink-0">
                      <p className="font-mono text-[14px] font-semibold tabular-nums text-ink antialiased">
                        {fmt(product.revenue)} DA
                      </p>
                      <p
                        className={`font-mono text-[12.5px] font-medium tabular-nums mt-0.5 antialiased ${product.trend >= 0 ? "text-olive" : "text-clay"}`}
                      >
                        {deltaGlyph(product.trend)} {Math.abs(Number(product.trend))}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Section>

        {/* Anomalies — hairline panel, square LED, mono severity */}
        <Section
          eyebrow="Signals"
          title={t("dashboard.anomalies.detectedAnomalies")}
          action={
            <Link href="/anomalies" className="btn-ghost">
              {t("dashboard.anomalies.viewAll")} <span aria-hidden="true">→</span>
            </Link>
          }
        >
          <div className="divide-y divide-line">
            {criticalAnomalies.slice(0, 4).map((a) => (
              <div key={a.id} className="flex items-start gap-3 px-4 py-3 transition-colors duration-200 hover:bg-surface">
                <span
                  aria-hidden="true"
                  className={`w-[5px] h-[5px] mt-1.5 shrink-0 ${a.severity === "critique" ? "bg-clay" : "bg-sand"}`}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-semibold text-ink truncate antialiased">
                    {a.product_name || a.product || "Anomaly"}
                  </p>
                  <p className="text-[13.5px] font-medium text-ink-2 mt-0.5 line-clamp-2 leading-relaxed antialiased">
                    {a.description}
                  </p>
                </div>
                <Status tone={ANOMALY_TONE(a.severity)} className="shrink-0">
                  {a.severity}
                </Status>
              </div>
            ))}
            {criticalAnomalies.length === 0 && (
              <Empty title="No anomalies" hint="Ledger is quiet." />
            )}
          </div>
        </Section>

        {/* Recommendations — numbered rows, olive impact delta */}
        <Section
          eyebrow="Actions"
          title={t("dashboard.recommendations.aiRecommendations")}
          action={
            <Link href="/recommendations" className="btn-ghost">
              {t("dashboard.recommendations.viewAll")} <span aria-hidden="true">→</span>
            </Link>
          }
        >
          <div className="divide-y divide-line">
            {topRecs.map((r, i) => (
              <div key={r.id} className="flex items-start gap-3 px-4 py-3 transition-colors duration-200 hover:bg-surface">
                <span className="font-mono text-[12.5px] font-semibold uppercase tracking-[0.12em] text-ink-2 tabular-nums w-6 shrink-0 mt-0.5 antialiased">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0">
                  <p className="text-[15px] font-semibold text-ink leading-snug antialiased">
                    {r.title}
                  </p>
                  <p className="font-mono text-[12.5px] font-medium tabular-nums text-olive mt-1 antialiased">
                    {r.impact}
                  </p>
                </div>
              </div>
            ))}
            {topRecs.length === 0 && (
              <Empty title="No recommendations" hint="Check back after the next sync." />
            )}
          </div>
        </Section>
      </div>
    </Layout>
  );
}
