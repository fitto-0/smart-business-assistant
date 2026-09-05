import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { apiGet } from "../lib/api";
import { useLanguage } from "../lib/LanguageContext";
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
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Star,
  Package,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

const fmt = (n) => new Intl.NumberFormat("fr-FR").format(n);

const StatCard = ({
  icon: Icon,
  label,
  value,
  change,
  color,
  prefix = "",
  suffix = "",
}) => (
  <div className="bg-ground-secondary border hairline rounded-xl p-4 flex items-start gap-4 hover:border-amber/30 transition-all duration-300">
    <div
      className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center flex-shrink-0`}
    >
      <Icon className="w-6 h-6 text-ground" />
    </div>
    <div className="flex-1">
      <p className="portal-label">{label}</p>
      <p className="portal-heading text-2xl mt-0.5">
        {prefix}
        {typeof value === "number" ? fmt(value) : value}
        {suffix}
      </p>
      {change !== undefined && (
        <div
          className={`flex items-center gap-1 mt-1 portal-label font-semibold ${change >= 0 ? "text-teal" : "text-red-400"}`}
        >
          {change >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {change >= 0 ? "+" : ""}
          {change}% this month
        </div>
      )}
    </div>
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-ground-secondary border hairline rounded-xl p-3">
        <p className="portal-label mb-1">{label}</p>
        {payload.map((p, i) => (
          <p
            key={i}
            className="portal-text font-semibold"
            style={{ color: p.color }}
          >
            {p.name}: {fmt(p.value)}{" "}
            {p.name.toLowerCase().includes("sales") ||
            p.name.toLowerCase().includes("target") ||
            p.name.toLowerCase().includes("revenue")
              ? "DA"
              : ""}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

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
      <Layout title={t('dashboard.title')}>
        <div className="bg-ground-secondary border hairline rounded-xl text-center py-16 portal-text">
          {t('dashboard.loading')}
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={t('dashboard.title')}>
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={TrendingUp}
          label={t('dashboard.kpis.totalRevenue')}
          value={kpis.totalRevenue}
          change={kpis.revenueGrowth}
          color="bg-amber"
          suffix=" DA"
        />
        <StatCard
          icon={ShoppingCart}
          label={t('dashboard.kpis.totalOrders')}
          value={kpis.totalOrders}
          change={kpis.ordersGrowth}
          color="bg-teal"
        />
        <StatCard
          icon={Star}
          label={t('dashboard.kpis.customerSatisfaction')}
          value={kpis.customerSatisfaction}
          change={kpis.satisfactionGrowth}
          color="bg-amber"
          suffix="/5"
        />
        <StatCard
          icon={Package}
          label={t('dashboard.kpis.stockAlerts')}
          value={kpis.stockAlerts}
          color="bg-red-400"
          suffix=" alerts"
        />
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
        {/* Sales Chart */}
        <div className="bg-ground-secondary border hairline rounded-xl p-5 xl:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="portal-heading text-base">{t('dashboard.charts.salesEvolution')}</h3>
              <p className="portal-label mt-0.5">{t('dashboard.charts.salesVsTargets')}</p>
            </div>
            <Link
              href="/sales"
              className="portal-label text-amber hover:text-amber/80 flex items-center gap-1"
            >
              {t('dashboard.charts.viewDetails')} <ArrowRight size={12} />
            </Link>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={monthlySales}>
              <defs>
                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="objGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(237,231,220,0.13)"
              />
              <XAxis
                dataKey="month"
                tick={{ fill: "#9EA5A8", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#9EA5A8", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${v / 1000}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ paddingTop: "16px", fontSize: "12px" }} />
              <Area
                type="monotone"
                dataKey="actual"
                name="Sales (DA)"
                stroke="#E8913C"
                strokeWidth={2.5}
                fill="url(#salesGrad)"
              />
              <Area
                type="monotone"
                dataKey="target"
                name="Target (DA)"
                stroke="#2E6B72"
                strokeWidth={2}
                strokeDasharray="5 5"
                fill="url(#objGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Category Pie */}
        <div className="bg-ground-secondary border hairline rounded-xl p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="portal-heading text-base">{t('dashboard.charts.salesByCategory')}</h3>
              <p className="portal-label mt-0.5">{t('dashboard.charts.revenueDistribution')}</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={75}
                paddingAngle={4}
                dataKey="value"
              >
                {categoryData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip
                formatter={(v, n, p) => [
                  `${v}% — ${fmt(p.payload.amount)} DA`,
                  p.payload.name,
                ]}
                contentStyle={{
                  background: "#101317",
                  border: "1px solid rgba(237,231,220,0.13)",
                  borderRadius: "12px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-3">
            {categoryData.map((cat) => (
              <div key={cat.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ background: cat.color }}
                  />
                  <span className="portal-label">{cat.name}</span>
                </div>
                <span className="portal-label font-semibold text-ink">
                  {cat.value}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Top Products */}
        <div className="bg-ground-secondary border hairline rounded-xl p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="portal-heading text-base">Top Products</h3>
              <p className="portal-label mt-0.5">Best performing products</p>
            </div>
            <Link href="/products" className="portal-label text-amber hover:text-amber/80 flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="space-y-3">
            {topProducts.length === 0 ? (
              <p className="portal-label text-muted py-8 text-center">No sales data yet</p>
            ) : (
              topProducts.map((product, index) => (
                <div key={product.id} className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg bg-amber/15 text-amber flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="portal-label font-semibold text-ink truncate">{product.name}</p>
                    <p className="portal-label text-muted">{product.orders} orders</p>
                  </div>
                  <div className="text-right">
                    <p className="portal-label font-semibold text-ink">{fmt(product.revenue)} DA</p>
                    <p className={`portal-label font-semibold ${product.trend >= 0 ? "text-teal" : "text-red-400"}`}>
                      {product.trend >= 0 ? "+" : ""}{product.trend}%
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Anomalies */}
        <div className="bg-ground-secondary border hairline rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="portal-heading text-base flex items-center gap-2">
              <AlertTriangle size={16} className="text-red-400" /> {t('dashboard.anomalies.detectedAnomalies')}
            </h3>
            <Link
              href="/anomalies"
              className="portal-label text-amber hover:text-amber/80 flex items-center gap-1"
            >
              {t('dashboard.anomalies.viewAll')} <ArrowRight size={12} />
            </Link>
          </div>
          <div className="space-y-2.5">
            {criticalAnomalies.slice(0, 4).map((a) => (
              <div
                key={a.id}
                className="flex items-start gap-3 p-2.5 rounded-xl bg-ground/50 border hairline"
              >
                <div
                  className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${a.severity === "critique" ? "bg-red-400" : "bg-amber"}`}
                />
                <div>
                  <p className="portal-label font-semibold text-ink">
                    {a.product_name || a.product || "Anomaly"}
                  </p>
                  <p className="portal-label text-muted mt-0.5">
                    {a.description}
                  </p>
                </div>
                <span
                  className={`ml-auto portal-label flex-shrink-0 ${a.severity === "critique" ? "text-red-400" : "text-amber"}`}
                >
                  {a.severity}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Recommendations */}
        <div className="bg-ground-secondary border hairline rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="portal-heading text-base flex items-center gap-2">
              <Lightbulb size={16} className="text-amber" /> {t('dashboard.recommendations.aiRecommendations')}
            </h3>
            <Link
              href="/recommendations"
              className="portal-label text-amber hover:text-amber/80 flex items-center gap-1"
            >
              {t('dashboard.recommendations.viewAll')} <ArrowRight size={12} />
            </Link>
          </div>
          <div className="space-y-2.5">
            {topRecs.map((r) => (
              <div
                key={r.id}
                className="flex items-start gap-3 p-2.5 rounded-xl bg-ground/50 border hairline"
              >
                <span className="text-lg flex-shrink-0">{r.icon || "💡"}</span>
                <div>
                  <p className="portal-label font-semibold text-ink leading-tight">
                    {r.title}
                  </p>
                  <p className="portal-label text-teal font-medium mt-1">
                    {r.impact}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
