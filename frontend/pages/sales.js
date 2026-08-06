import Layout from '../components/Layout';
import { monthlySales, categoryData, products } from '../data/mockData';
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
    <div className="bg-dark-800 border border-slate-700 rounded-xl p-3 shadow-xl">
      <p className="text-xs text-slate-400 mb-2 font-semibold">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-sm" style={{ color: p.color }}>
          {p.name}: <strong>{fmt(p.value)}</strong>
        </p>
      ))}
    </div>
  );
};

export default function SalesPage() {
  const totalSales = monthlySales.reduce((s, m) => s + m.ventes, 0);
  const totalOrders = monthlySales.reduce((s, m) => s + m.commandes, 0);
  const avgMonthly = Math.round(totalSales / 12);
  const bestMonth = monthlySales.reduce((a, b) => a.ventes > b.ventes ? a : b);

  const topProducts = [...products].sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  return (
    <Layout title="Analyse des Ventes">
      {/* Summary KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'CA Annuel Total', value: totalSales, suffix: ' DA', icon: DollarSign, color: 'from-primary-500 to-indigo-600', change: '+18.4%' },
          { label: 'Total Commandes', value: totalOrders, icon: ShoppingCart, color: 'from-cyan-500 to-blue-600', change: '+12.7%' },
          { label: 'Moyenne Mensuelle', value: avgMonthly, suffix: ' DA', icon: BarChart2, color: 'from-emerald-500 to-teal-600' },
          { label: 'Meilleur Mois', value: bestMonth.month, icon: TrendingUp, color: 'from-amber-500 to-orange-600', sub: `${fmt(bestMonth.ventes)} DA` },
        ].map((kpi, i) => (
          <div key={i} className="card flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${kpi.color} flex items-center justify-center shadow-lg`}>
              <kpi.icon size={20} className="text-white" />
            </div>
            <div>
              <p className="text-xs text-slate-400">{kpi.label}</p>
              <p className="text-xl font-bold text-white">{typeof kpi.value === 'number' ? fmt(kpi.value) : kpi.value}{kpi.suffix || ''}</p>
              {kpi.change && <p className="text-xs text-emerald-400 font-semibold">{kpi.change}</p>}
              {kpi.sub && <p className="text-xs text-slate-400">{kpi.sub}</p>}
            </div>
          </div>
        ))}
      </div>

      {/* Sales vs Objective */}
      <div className="card mb-6">
        <h3 className="text-base font-bold text-white mb-1">Ventes vs Objectifs — 2024</h3>
        <p className="text-xs text-slate-400 mb-5">Comparaison mensuelle des ventes réelles par rapport aux objectifs fixés</p>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={monthlySales}>
            <defs>
              <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v / 1000}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '16px' }} />
            <Area type="monotone" dataKey="ventes" name="Ventes (DA)" stroke="#6366f1" strokeWidth={2.5} fill="url(#sg)" />
            <Line type="monotone" dataKey="objectif" name="Objectif (DA)" stroke="#06b6d4" strokeWidth={2} strokeDasharray="6 4" dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        {/* Monthly Orders */}
        <div className="card">
          <h3 className="text-base font-bold text-white mb-1">Nombre de Commandes par Mois</h3>
          <p className="text-xs text-slate-400 mb-5">Volume des commandes mensuelles</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlySales} barSize={22}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="commandes" name="Commandes" fill="#06b6d4" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Products by Revenue */}
        <div className="card">
          <h3 className="text-base font-bold text-white mb-1">Top 5 Produits par Revenus</h3>
          <p className="text-xs text-slate-400 mb-4">Produits les plus performants</p>
          <div className="space-y-3">
            {topProducts.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                  ${i === 0 ? 'bg-amber-500 text-white' : i === 1 ? 'bg-slate-400 text-white' : i === 2 ? 'bg-orange-700 text-white' : 'bg-slate-700 text-slate-300'}`}>
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-slate-200 truncate">{p.name}</span>
                    <span className="text-xs font-bold text-white ml-2 flex-shrink-0">{fmt(p.revenue)} DA</span>
                  </div>
                  <div className="w-full bg-dark-900 rounded-full h-1.5">
                    <div className="h-1.5 rounded-full bg-gradient-to-r from-primary-500 to-cyan-500"
                      style={{ width: `${(p.revenue / topProducts[0].revenue) * 100}%` }} />
                  </div>
                </div>
                <span className={`text-xs font-semibold flex-shrink-0 ${p.trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {p.trend >= 0 ? '+' : ''}{p.trend}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed Monthly Table */}
      <div className="card">
        <h3 className="text-base font-bold text-white mb-5">Récapitulatif Mensuel Détaillé</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="table-header">Mois</th>
                <th className="table-header">Ventes (DA)</th>
                <th className="table-header">Objectif (DA)</th>
                <th className="table-header">Commandes</th>
                <th className="table-header">Écart</th>
                <th className="table-header">Performance</th>
              </tr>
            </thead>
            <tbody>
              {monthlySales.map((row) => {
                const ecart = row.ventes - row.objectif;
                const perf = ((row.ventes / row.objectif) * 100).toFixed(1);
                return (
                  <tr key={row.month} className="hover:bg-slate-700/20 transition-colors">
                    <td className="table-cell font-semibold text-white">{row.month}</td>
                    <td className="table-cell font-semibold text-primary-300">{fmt(row.ventes)} DA</td>
                    <td className="table-cell text-slate-400">{fmt(row.objectif)} DA</td>
                    <td className="table-cell text-cyan-300">{row.commandes}</td>
                    <td className={`table-cell font-semibold ${ecart >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {ecart >= 0 ? '+' : ''}{fmt(ecart)} DA
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-dark-900 rounded-full h-1.5">
                          <div className={`h-1.5 rounded-full ${parseFloat(perf) >= 100 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                            style={{ width: `${Math.min(parseFloat(perf), 100)}%` }} />
                        </div>
                        <span className={`text-xs font-bold ${parseFloat(perf) >= 100 ? 'text-emerald-400' : 'text-amber-400'}`}>{perf}%</span>
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
