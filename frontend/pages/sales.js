import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { apiGet } from '../lib/api';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ComposedChart
} from 'recharts';
import { TrendingUp, TrendingDown, ShoppingCart, DollarSign, BarChart2 } from 'lucide-react';

const fmt = (n) => new Intl.NumberFormat('fr-FR').format(n);
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-ground-secondary border hairline rounded-xl p-3">
      <p className="portal-label mb-2 font-semibold">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="portal-text" style={{ color: p.color }}>
          {p.name}: <strong>{fmt(p.value)}</strong>
        </p>
      ))}
    </div>
  );
};

export default function SalesPage() {
  const [monthlySales, setMonthlySales] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSales = async () => {
      try {
        const [monthly, top] = await Promise.all([
          apiGet('/sales/monthly'),
          apiGet('/sales/top-products', { limit: 5 })
        ]);
        setMonthlySales(monthly?.data || []);
        setTopProducts(top?.data || []);
      } catch (error) {
        console.error('Failed to load sales data', error);
      } finally {
        setLoading(false);
      }
    };

    loadSales();
  }, []);

  const totalSales = (monthlySales || []).reduce((s, m) => s + Number(m.actual || 0), 0);
  const totalOrders = (monthlySales || []).reduce((s, m) => s + Number(m.orders || 0), 0);
  const avgMonthly = Math.round(totalSales / Math.max(monthlySales.length, 1));
  const bestMonth = (monthlySales || []).reduce((a, b) => (Number(a.actual || 0) > Number(b.actual || 0) ? a : b), { month: 'N/A', actual: 0 });
  const bestMonthVentes = bestMonth.actual || 0;

  if (loading) {
    return <Layout title="Sales Analytics"><div className="bg-ground-secondary border hairline rounded-xl text-center py-16 portal-text">Loading sales data…</div></Layout>;
  }

  return (
    <Layout title="Sales Analytics">
      {/* Summary KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Annual Revenue', value: totalSales, suffix: ' DA', icon: DollarSign, color: 'bg-amber', change: '+18.4%' },
          { label: 'Total Orders', value: totalOrders, icon: ShoppingCart, color: 'bg-teal', change: '+12.7%' },
          { label: 'Monthly Average', value: avgMonthly, suffix: ' DA', icon: BarChart2, color: 'bg-teal' },
          { label: 'Best Month', value: bestMonth.month, icon: TrendingUp, color: 'bg-amber', sub: `${fmt(bestMonthVentes)} DA` },
        ].map((kpi, i) => (
          <div key={i} className="bg-ground-secondary border hairline rounded-xl p-4 flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl ${kpi.color} flex items-center justify-center`}>
              <kpi.icon size={20} className="text-ground" />
            </div>
            <div>
              <p className="portal-label">{kpi.label}</p>
              <p className="portal-heading text-xl">{typeof kpi.value === 'number' ? fmt(kpi.value) : kpi.value}{kpi.suffix || ''}</p>
              {kpi.change && <p className="portal-label text-teal font-semibold">{kpi.change}</p>}
              {kpi.sub && <p className="portal-label text-muted">{kpi.sub}</p>}
            </div>
          </div>
        ))}
      </div>

      {/* Sales vs Objective */}
      <div className="bg-ground-secondary border hairline rounded-xl p-5 mb-6">
        <h3 className="portal-heading text-base mb-1">Sales vs Targets — 2026</h3>
        <p className="portal-label mb-5">Monthly comparison of actual sales against targets </p>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={monthlySales}>
            <defs>
              <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(237,231,220,0.13)" />
            <XAxis dataKey="month" tick={{ fill: '#9EA5A8', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#9EA5A8', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v / 1000}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '16px' }} />
            <Area type="monotone" dataKey="actual" name="Sales (DA)" stroke="#E8913C" strokeWidth={2.5} fill="url(#sg)" />
            <Line type="monotone" dataKey="target" name="Target (DA)" stroke="#2E6B72" strokeWidth={2} strokeDasharray="6 4" dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        {/* Monthly Orders */}
        <div className="bg-ground-secondary border hairline rounded-xl p-5">
          <h3 className="portal-heading text-base mb-1">Monthly Orders</h3>
          <p className="portal-label mb-5">Monthly order volume </p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlySales} barSize={22}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(237,231,220,0.13)" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: '#9EA5A8', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#9EA5A8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="orders" name="Orders" fill="#2E6B72" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Products by Revenue */}
        <div className="bg-ground-secondary border hairline rounded-xl p-5">
          <h3 className="portal-heading text-base mb-1">Top 5 Products by Revenue</h3>
          <p className="portal-label mb-4">Best performing products </p>
          <div className="space-y-3">
            {topProducts.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                  ${i === 0 ? 'bg-amber text-ground' : i === 1 ? 'bg-ink-secondary text-ground' : i === 2 ? 'bg-amber/70 text-ground' : 'bg-muted text-ink'}`}>
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="portal-label font-semibold text-ink truncate">{p.name}</span>
                    <span className="portal-label font-bold text-ink ml-2 flex-shrink-0">{fmt(p.revenue)} DA</span>
                  </div>
                  <div className="w-full bg-ground rounded-full h-1.5">
                    <div className="h-1.5 rounded-full bg-amber"
                      style={{ width: `${(p.revenue / topProducts[0].revenue) * 100}%` }} />
                  </div>
                </div>
                <span className={`portal-label font-semibold flex-shrink-0 ${p.trend >= 0 ? 'text-teal' : 'text-red-400'}`}>
                  {p.trend >= 0 ? '+' : ''}{p.trend}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed Monthly Table */}
      <div className="bg-ground-secondary border hairline rounded-xl p-5">
        <h3 className="portal-heading text-base mb-5">Detailed Monthly Summary</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b hairline">
                <th className="portal-dates-header">Month</th>
                <th className="portal-dates-header">Sales (DA)</th>
                <th className="portal-dates-header">Target (DA)</th>
                <th className="portal-dates-header">Orders</th>
                <th className="portal-dates-header">Variance</th>
                <th className="portal-dates-header">Performance</th>
              </tr>
            </thead>
            <tbody>
              {monthlySales.map((row) => {
                const ventes = Number(row.actual || 0);
                const objectif = Number(row.target || 0);
                const ecart = ventes - objectif;
                const perf = objectif ? ((ventes / objectif) * 100).toFixed(1) : '0.0';
                return (
                  <tr key={row.month} className="hover:bg-ground/50 transition-colors">
                    <td className="portal-dates-cell portal-dates-cell-primary">{row.month}</td>
                    <td className="portal-dates-cell font-semibold text-amber">{fmt(row.actual || 0)} DA</td>
                    <td className="portal-dates-cell text-muted">{fmt(row.target || 0)} DA</td>
                    <td className="portal-dates-cell text-teal">{row.orders}</td>
                    <td className={`portal-dates-cell font-semibold ${ecart >= 0 ? 'text-teal' : 'text-red-400'}`}>
                      {ecart >= 0 ? '+' : ''}{fmt(ecart)} DA
                    </td>
                    <td className="portal-dates-cell">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-ground rounded-full h-1.5">
                          <div className={`h-1.5 rounded-full ${parseFloat(perf) >= 100 ? 'bg-teal' : 'bg-amber'}`}
                            style={{ width: `${Math.min(parseFloat(perf), 100)}%` }} />
                        </div>
                        <span className={`portal-label font-bold ${parseFloat(perf) >= 100 ? 'text-teal' : 'text-amber'}`}>{perf}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
