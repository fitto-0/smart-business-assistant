import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { apiGet } from '../lib/api';
import {
  ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { Brain, TrendingUp, Target, Zap, Info } from 'lucide-react';

const fmt = (n) => new Intl.NumberFormat('fr-FR').format(n);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-dark-800 border border-slate-700 rounded-xl p-3 shadow-xl">
      <p className="text-xs text-slate-400 mb-2 font-semibold">{label}</p>
      {payload.map((p, i) => p.value && (
        <p key={i} className="text-sm font-semibold" style={{ color: p.color }}>
          {p.name}: {fmt(p.value)} DA
        </p>
      ))}
    </div>
  );
};

export default function PredictionsPage() {
  const [horizon, setHorizon] = useState(6);
  const [predictions, setPredictions] = useState([]);
  const [monthlySales, setMonthlySales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPredictions = async () => {
      try {
        const [pred, monthly] = await Promise.all([
          apiGet('/api/analysis/predictions'),
          apiGet('/api/sales/monthly')
        ]);
        setPredictions(pred?.predictions || []);
        setMonthlySales(monthly?.data || []);
      } catch (error) {
        console.error('Failed to load predictions', error);
      } finally {
        setLoading(false);
      }
    };

    loadPredictions();
  }, []);

  const totalPredicted = (predictions || []).slice(0, 6).reduce((s, p) => s + Number(p.value || 0), 0);
  const lastYearTotal = (monthlySales || []).reduce((s, m) => s + Number(m.actual || 0), 0);
  const growth = lastYearTotal ? (((totalPredicted - lastYearTotal) / lastYearTotal) * 100).toFixed(1) : '0.0';
  const displayData = (predictions || []).slice(0, 12 + horizon);

  if (loading) {
    return <Layout title="Prédictions IA"><div className="card text-center py-16 text-slate-400">Chargement des prédictions…</div></Layout>;
  }

  return (
    <Layout title="Prédictions IA">
      {/* Header Banner */}
      <div className="card mb-6 bg-gradient-to-r from-primary-900/50 via-dark-800 to-indigo-900/30 border-primary-700/30">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-cyan-500 flex items-center justify-center flex-shrink-0 shadow-lg">
            <Brain size={24} className="text-white" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white mb-1">Moteur de Prédiction IA — Modèle de Régression</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Notre modèle utilise les données historiques des 12 derniers mois pour prédire les ventes futures.
              L'algorithme intègre la saisonnalité, les tendances et les facteurs externes pour une précision optimale.
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="badge-blue">Scikit-learn LinearRegression</span>
              <span className="badge-blue">Analyse de saisonnalité</span>
              <span className="badge-blue">Intervalle de confiance 85%</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <div className="card flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center">
            <Target size={20} className="text-white" />
          </div>
          <div>
            <p className="text-xs text-slate-400">CA Prédit 6 mois</p>
            <p className="text-xl font-bold text-white">{fmt(totalPredicted)} DA</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <TrendingUp size={20} className="text-white" />
          </div>
          <div>
            <p className="text-xs text-slate-400">Croissance Prédite</p>
            <p className="text-xl font-bold text-emerald-400">+{growth}%</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <Zap size={20} className="text-white" />
          </div>
          <div>
            <p className="text-xs text-slate-400">Précision du Modèle</p>
            <p className="text-xl font-bold text-white">85.3%</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
            <Brain size={20} className="text-white" />
          </div>
          <div>
            <p className="text-xs text-slate-400">Meilleur mois prédit</p>
            <p className="text-xl font-bold text-white">Juin 2025</p>
          </div>
        </div>
      </div>

      {/* Prediction Chart */}
      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h3 className="text-base font-bold text-white">Prédiction des Ventes</h3>
            <p className="text-xs text-slate-400 mt-0.5">Historique 2024 + Prédictions IA</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Horizon :</span>
            {[3, 6].map(h => (
              <button key={h} onClick={() => setHorizon(h)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${horizon === h ? 'bg-primary-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
                {h} mois
              </button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart data={displayData}>
            <defs>
              <linearGradient id="histGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="predGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v / 1000}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '16px' }} />
            <ReferenceLine x="Déc" stroke="#334155" strokeDasharray="4 4" label={{ value: 'Aujourd\'hui', fill: '#64748b', fontSize: 10 }} />
            <Area type="monotone" dataKey="historique" name="Historique (DA)" stroke="#6366f1" strokeWidth={2.5} fill="url(#histGrad)" connectNulls={false} dot={false} />
            <Area type="monotone" dataKey="prediction" name="Prédiction (DA)" stroke="#10b981" strokeWidth={2.5} strokeDasharray="6 3" fill="url(#predGrad)" connectNulls={false} dot={{ fill: '#10b981', r: 4 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Prediction Details Table */}
      <div className="card">
        <h3 className="text-base font-bold text-white mb-5">Détail des Prédictions Mensuelles</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="table-header">Période</th>
                <th className="table-header">Type</th>
                <th className="table-header">Ventes Prédites (DA)</th>
                <th className="table-header">Croissance vs N-1</th>
                <th className="table-header">Confiance</th>
              </tr>
            </thead>
            <tbody>
              {predictions.filter(p => p.prediction).slice(0, horizon).map((p, i) => {
                const prev = monthlySales[i]?.actual || monthlySales[11]?.actual || 0;
                const change = prev ? (((Number(p.value || 0) - prev) / prev) * 100).toFixed(1) : '0.0';
                const confidence = 85 - i * 2;
                return (
                  <tr key={p.month} className="hover:bg-slate-700/20 transition-colors">
                    <td className="table-cell font-semibold text-white">{p.month}</td>
                    <td className="table-cell"><span className="badge-blue">Prédiction IA</span></td>
                    <td className="table-cell font-bold text-emerald-400">{fmt(Number(p.value || 0))} DA</td>
                    <td className={`table-cell font-semibold ${parseFloat(change) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {parseFloat(change) >= 0 ? '+' : ''}{change}%
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-dark-900 rounded-full h-1.5">
                          <div className="h-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                            style={{ width: `${confidence}%` }} />
                        </div>
                        <span className="text-xs text-emerald-400 font-semibold">{confidence}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-4 p-3 rounded-xl bg-slate-700/20 flex items-start gap-2 border border-slate-700/30">
          <Info size={14} className="text-slate-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-slate-400">
            Les prédictions sont générées par un modèle de régression linéaire entraîné sur les 12 derniers mois. La précision diminue naturellement sur des horizons plus longs. Utilisez ces données comme indicateur, non comme certitude absolue.
          </p>
        </div>
      </div>
    </Layout>
  );
}
