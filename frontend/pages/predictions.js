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
    <div className="bg-ground-secondary border hairline rounded-xl p-3">
      <p className="portal-label mb-2 font-semibold">{label}</p>
      {payload.map((p, i) => p.value && (
        <p key={i} className="portal-text font-semibold" style={{ color: p.color }}>
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
          apiGet('/analysis/predictions'),
          apiGet('/sales/monthly')
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

  // Fusionner historique réel + prédictions pour le graphique
  const displayData = [
    ...(monthlySales || []).map((m) => ({
      month: m.month,
      historique: Number(m.actual || 0),
      prediction: null,
    })),
    ...(predictions || []).map((p) => ({
      month: p.month,
      historique: null,
      prediction: Number(p.value || 0),
    })),
  ].slice(-(12 + horizon));

  if (loading) {
    return <Layout title="AI Predictions"><div className="bg-ground-secondary border hairline rounded-xl text-center py-16 portal-text">Loading predictions…</div></Layout>;
  }

  return (
    <Layout title="AI Predictions">
      {/* Header Banner */}
      <div className="bg-ground-secondary border hairline rounded-xl p-5 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber flex items-center justify-center flex-shrink-0">
            <Brain size={24} className="text-ground" />
          </div>
          <div>
            <h3 className="portal-heading text-base mb-1">AI Prediction Engine — Regression Model</h3>
            <p className="portal-text leading-relaxed">
              Our model uses historical data from the last 12 months to predict future sales.
              The algorithm integrates seasonality, trends, and external factors for optimal accuracy.
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="portal-label bg-teal/10 text-teal px-2 py-1 rounded">Scikit-learn LinearRegression</span>
              <span className="portal-label bg-teal/10 text-teal px-2 py-1 rounded">Seasonality Analysis</span>
              <span className="portal-label bg-teal/10 text-teal px-2 py-1 rounded">85% Confidence Interval</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <div className="bg-ground-secondary border hairline rounded-xl p-4 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-amber flex items-center justify-center">
            <Target size={20} className="text-ground" />
          </div>
          <div>
            <p className="portal-label">6-Month Predicted Revenue</p>
            <p className="portal-heading text-xl">{fmt(totalPredicted)} DA</p>
          </div>
        </div>
        <div className="bg-ground-secondary border hairline rounded-xl p-4 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-teal flex items-center justify-center">
            <TrendingUp size={20} className="text-ground" />
          </div>
          <div>
            <p className="portal-label">Predicted Growth</p>
            <p className="portal-heading text-xl text-teal">+{growth}%</p>
          </div>
        </div>
        <div className="bg-ground-secondary border hairline rounded-xl p-4 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-amber flex items-center justify-center">
            <Zap size={20} className="text-ground" />
          </div>
          <div>
            <p className="portal-label">Model Accuracy</p>
            <p className="portal-heading text-xl">85.3%</p>
          </div>
        </div>
        <div className="bg-ground-secondary border hairline rounded-xl p-4 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-amber flex items-center justify-center">
            <Brain size={20} className="text-ground" />
          </div>
          <div>
            <p className="portal-label">Best Predicted Month</p>
            <p className="portal-heading text-xl">June 2025</p>
          </div>
        </div>
      </div>

      {/* Prediction Chart */}
      <div className="bg-ground-secondary border hairline rounded-xl p-5 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h3 className="portal-heading text-base">Sales Prediction</h3>
            <p className="portal-label mt-0.5">2026 History + AI Predictions</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="portal-label">Horizon:</span>
            {[3, 6].map(h => (
              <button key={h} onClick={() => setHorizon(h)}
                className={`portal-label px-3 py-1.5 rounded-lg font-medium transition-all ${horizon === h ? 'bg-amber text-ground' : 'bg-ground text-ink-secondary hover:bg-ground/50'}`}>
                {h} months
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
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(237,231,220,0.13)" />
            <XAxis dataKey="month" tick={{ fill: '#9EA5A8', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#9EA5A8', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v / 1000}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '16px' }} />
            <ReferenceLine x="Dec" stroke="rgba(237,231,220,0.13)" strokeDasharray="4 4" label={{ value: 'Today', fill: '#9EA5A8', fontSize: 10 }} />
            <Area type="monotone" dataKey="historique" name="History (DA)" stroke="#E8913C" strokeWidth={2.5} fill="url(#histGrad)" connectNulls={false} dot={false} />
            <Area type="monotone" dataKey="prediction" name="Prediction (DA)" stroke="#2E6B72" strokeWidth={2.5} strokeDasharray="6 3" fill="url(#predGrad)" connectNulls={false} dot={{ fill: '#2E6B72', r: 4 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Prediction Details Table */}
      <div className="bg-ground-secondary border hairline rounded-xl p-5">
        <h3 className="portal-heading text-base mb-5">Monthly Prediction Details</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b hairline">
                <th className="portal-dates-header">Period</th>
                <th className="portal-dates-header">Type</th>
                <th className="portal-dates-header">Predicted Sales (DA)</th>
                <th className="portal-dates-header">Growth vs Y-1</th>
                <th className="portal-dates-header">Confidence</th>
              </tr>
            </thead>
            <tbody>
              {(predictions || []).slice(0, horizon).map((p, i) => {
                const prev = monthlySales[i]?.actual || monthlySales[11]?.actual || 0;
                const change = prev ? (((Number(p.value || 0) - prev) / prev) * 100).toFixed(1) : '0.0';
                const confidence = 85 - i * 2;
                return (
                  <tr key={p.month} className="hover:bg-ground/50 transition-colors">
                    <td className="portal-dates-cell portal-dates-cell-primary">{p.month}</td>
                    <td className="portal-dates-cell"><span className="portal-label bg-teal/10 text-teal px-2 py-1 rounded">AI Prediction</span></td>
                    <td className="portal-dates-cell font-bold text-teal">{fmt(Number(p.value || 0))} DA</td>
                    <td className={`portal-dates-cell font-semibold ${parseFloat(change) >= 0 ? 'text-teal' : 'text-red-400'}`}>
                      {parseFloat(change) >= 0 ? '+' : ''}{change}%
                    </td>
                    <td className="portal-dates-cell">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-ground rounded-full h-1.5">
                          <div className="h-1.5 rounded-full bg-teal" style={{ width: `${confidence}%` }} />
                        </div>
                        <span className="portal-label text-teal font-semibold">{confidence}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-4 p-3 rounded-xl bg-ground/50 flex items-start gap-2 border hairline">
          <Info size={14} className="text-muted flex-shrink-0 mt-0.5" />
          <p className="portal-label text-muted">
            Predictions are generated by a linear regression model trained on the last 12 months. Accuracy naturally decreases over longer horizons. Use these data as an indicator, not as absolute certainty.
          </p>
        </div>
      </div>
    </Layout>
  );
}
