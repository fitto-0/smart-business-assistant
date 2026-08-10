import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { apiGet } from '../lib/api';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { TrendingUp, TrendingDown, ShoppingCart, Star, Package, AlertTriangle, Lightbulb, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const fmt = (n) => new Intl.NumberFormat('fr-FR').format(n);

const StatCard = ({ icon: Icon, label, value, change, color, prefix = '', suffix = '' }) => (
  <div className="stat-card animate-slide-up">
    <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center flex-shrink-0 shadow-lg`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <div className="flex-1">
      <p className="text-xs text-slate-400 font-medium">{label}</p>
      <p className="text-2xl font-bold text-white mt-0.5">{prefix}{typeof value === 'number' ? fmt(value) : value}{suffix}</p>
      {change !== undefined && (
        <div className={`flex items-center gap-1 mt-1 text-xs font-semibold ${change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {change >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {change >= 0 ? '+' : ''}{change}% ce mois
        </div>
      )}
    </div>
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-dark-800 border border-slate-700 rounded-xl p-3 shadow-xl">
        <p className="text-xs text-slate-400 mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} className="text-sm font-semibold" style={{ color: p.color }}>
            {p.name}: {fmt(p.value)} {p.name.toLowerCase().includes('ventes') || p.name.toLowerCase().includes('objectif') || p.name.toLowerCase().includes('revenus') ? 'DA' : ''}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const [kpis, setKpis] = useState({ totalRevenue: 0, revenueGrowth: 0, totalOrders: 0, avgOrderValue: 0, customerSatisfaction: 0, totalReviews: 0, stockAlerts: 0 });
  const [monthlySales, setMonthlySales] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [weeklyRevenue, setWeeklyRevenue] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [salesKpis, monthly, categories, weekly, anomalyData, recData] = await Promise.all([
          apiGet('/sales/kpis'),
          apiGet('/sales/monthly'),
          apiGet('/sales/categories'),
          apiGet('/sales/recent', { limit: 7 }),
          apiGet('/analysis/anomalies'),
          apiGet('/analysis/recommendations')
        ]);

        const derivedKpis = {
          ...salesKpis,
          stockAlerts: anomalyData?.stats?.critical || 0,
        };

        setKpis(derivedKpis);
        setMonthlySales(monthly?.data || []);
        setCategoryData(categories?.data || []);
        setWeeklyRevenue((weekly?.data || []).slice(0, 7).map((item) => ({
          jour: new Date(item.date).toLocaleDateString('fr-FR', { weekday: 'short' }),
          revenus: Number(item.total_amount || 0),
        })));
        setAnomalies(anomalyData?.anomalies || []);
        setRecommendations(recData?.recommendations || []);
      } catch (error) {
        console.error('Failed to load dashboard data', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const criticalAnomalies = (anomalies || []).filter(a => a.severity === 'critique' || a.severity === 'haute');
  const topRecs = (recommendations || []).filter(r => r.priority === 'critique' || r.priority === 'haute').slice(0, 3);

  if (loading) {
    return (
      <Layout title="Tableau de Bord">
        <div className="card text-center py-16 text-slate-400">Chargement des données…</div>
      </Layout>
    );
  }

  return (
    <Layout title="Tableau de Bord">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard icon={TrendingUp} label="Chiffre d'Affaires" value={kpis.totalRevenue} change={kpis.revenueGrowth} color="bg-gradient-to-br from-primary-500 to-indigo-600" suffix=" DA" />
        <StatCard icon={ShoppingCart} label="Total Commandes" value={kpis.totalOrders} change={kpis.ordersGrowth} color="bg-gradient-to-br from-cyan-500 to-blue-600" />
        <StatCard icon={Star} label="Satisfaction Client" value={kpis.customerSatisfaction} change={kpis.satisfactionGrowth} color="bg-gradient-to-br from-amber-500 to-orange-600" suffix="/5" />
        <StatCard icon={Package} label="Alertes Stock" value={kpis.stockAlerts} color="bg-gradient-to-br from-red-500 to-rose-600" suffix=" alertes" />
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
        {/* Sales Chart */}
        <div className="card xl:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-bold text-white">Évolution des Ventes</h3>
              <p className="text-xs text-slate-400 mt-0.5">Ventes vs Objectifs 2024</p>
            </div>
            <Link href="/sales" className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1">
              Voir détails <ArrowRight size={12} />
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
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v/1000}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ paddingTop: '16px', fontSize: '12px' }} />
              <Area type="monotone" dataKey="actual" name="Ventes (DA)" stroke="#6366f1" strokeWidth={2.5} fill="url(#salesGrad)" />
              <Area type="monotone" dataKey="target" name="Objectif (DA)" stroke="#06b6d4" strokeWidth={2} strokeDasharray="5 5" fill="url(#objGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Category Pie */}
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-bold text-white">Ventes par Catégorie</h3>
              <p className="text-xs text-slate-400 mt-0.5">Distribution des revenus</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={categoryData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={4} dataKey="value">
                {categoryData.map((entry, i) => <Cell key={i} fill={entry.color} stroke="transparent" />)}
              </Pie>
              <Tooltip formatter={(v, n, p) => [`${v}% — ${fmt(p.payload.amount)} DA`, p.payload.name]} contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-3">
            {categoryData.map(cat => (
              <div key={cat.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: cat.color }} />
                  <span className="text-xs text-slate-400">{cat.name}</span>
                </div>
                <span className="text-xs font-semibold text-slate-300">{cat.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Weekly Revenue */}
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-bold text-white">Revenus Hebdomadaires</h3>
              <p className="text-xs text-slate-400 mt-0.5">Cette semaine</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={weeklyRevenue} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="jour" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v/1000}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="revenus" name="Revenus (DA)" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Anomalies */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <AlertTriangle size={16} className="text-red-400" /> Anomalies Détectées
            </h3>
            <Link href="/anomalies" className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1">
              Tout voir <ArrowRight size={12} />
            </Link>
          </div>
          <div className="space-y-2.5">
            {criticalAnomalies.slice(0, 4).map(a => (
              <div key={a.id} className="flex items-start gap-3 p-2.5 rounded-xl bg-dark-900/50 border border-slate-700/30">
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${a.severity === 'critique' ? 'bg-red-500' : 'bg-amber-500'}`} />
                <div>
                  <p className="text-xs font-semibold text-slate-200">{a.product_name || a.product || 'Anomalie'}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{a.description}</p>
                </div>
                <span className={`ml-auto text-xs flex-shrink-0 ${a.severity === 'critique' ? 'badge-red' : 'badge-yellow'}`}>
                  {a.severity}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Recommendations */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Lightbulb size={16} className="text-amber-400" /> Recommandations IA
            </h3>
            <Link href="/recommendations" className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1">
              Tout voir <ArrowRight size={12} />
            </Link>
          </div>
          <div className="space-y-2.5">
            {topRecs.map(r => (
              <div key={r.id} className="flex items-start gap-3 p-2.5 rounded-xl bg-dark-900/50 border border-slate-700/30">
                <span className="text-lg flex-shrink-0">{r.icon || '💡'}</span>
                <div>
                  <p className="text-xs font-semibold text-slate-200 leading-tight">{r.title}</p>
                  <p className="text-xs text-emerald-400 font-medium mt-1">{r.impact}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
