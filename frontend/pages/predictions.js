import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { apiGet } from '../lib/api';
import { ComposedChart, Area, XAxis, YAxis, CartesianGrid,
 Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { Info } from 'lucide-react';

const fmt = (n) => new Intl.NumberFormat('fr-FR').format(n);

const CustomTooltip = ({ active, payload, label }) => {
 if (!active || !payload?.length) return null;
 return (
 <div className="bg-surface border hairline rounded-xs p-3">
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

 const totalPredicted = (predictions || []).slice(0, horizon).reduce((s, p) => s + Number(p.value || 0), 0);
 const lastYearTotal = (monthlySales || []).reduce((s, m) => s + Number(m.actual || 0), 0);
 const growth = lastYearTotal ? (((totalPredicted - lastYearTotal) / lastYearTotal) * 100).toFixed(1) : '0.0';
 const bestMonth = (predictions || []).slice(0, horizon).reduce(
  (best, p) => (Number(p.value || 0) > Number(best?.value || 0) ? p : best),
  null,
 )?.month || '—';

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
 return <Layout title="AI Predictions"><div className="bg-surface border hairline rounded-xs text-center py-16 portal-text">Loading predictions…</div></Layout>;
 }

 return (
 <Layout title="AI Predictions">
 {/* Header */}
 <div className="border-b border-line pb-4 mb-6">
  <p className="micro">Prediction engine</p>
  <h3 className="text-[17px] font-medium text-ink mt-1">Forecast model</h3>
  <p className="text-[13px] leading-[1.65] text-ink-2 mt-1.5 max-w-prose">
  Built on the last 12 months of your sales. The model accounts for
  seasonality and trend, and predicts each upcoming month from that
  history.
  </p>
  <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1">
  {["Linear regression", "Seasonality analysis", "12-month history"].map((chip) => (
  <li key={chip} className="micro-2 normal-case tracking-normal">✓ {chip}</li>
  ))}
  </ul>
 </div>

 {/* KPIs */}
 <div className="grid grid-cols-2 xl:grid-cols-4 gap-px bg-line border border-line mb-6">
 <div className="bg-surface p-4">
  <p className="micro">Predicted revenue ({horizon} months)</p>
 <p className="stat-value mt-1">{fmt(totalPredicted)} <span className="text-[0.5em] text-ink-3">DA</span></p>
 </div>
 <div className="bg-surface p-4">
 <p className="micro">Predicted growth</p>
 <p className={`stat-value mt-1 ${parseFloat(growth) >= 0 ? 'text-olive' : 'text-clay'}`}>
 {parseFloat(growth) >= 0 ? '+' : ''}{growth}%
 </p>
 </div>
 <div className="bg-surface p-4">
 <p className="micro">Forecast horizon</p>
 <p className="stat-value mt-1">{horizon} <span className="text-[0.5em] text-ink-3">months</span></p>
 </div>
 <div className="bg-surface p-4">
 <p className="micro">Best predicted month</p>
 <p className="stat-value mt-1">{bestMonth}</p>
 </div>
 </div>

 {/* Prediction Chart */}
 <div className="bg-surface border hairline rounded-xs p-5 mb-6">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
 <div>
 <h3 className="portal-heading text-base">Sales Prediction</h3>
 <p className="portal-label mt-0.5">History + forecast</p>
 </div>
 <div className="flex items-center gap-2">
 <span className="portal-label">Horizon:</span>
 {[3, 6].map(h => (
 <button key={h} onClick={() => setHorizon(h)}
 className={`portal-label px-3 py-1.5 rounded-xs font-medium transition-colors ${horizon === h ? 'bg-ember-500 text-ground' : 'bg-canvas text-ink-2 hover:bg-canvas/50'}`}>
 {h} months
 </button>
 ))}
 </div>
 </div>
 <ResponsiveContainer width="100%" height={320}>
 <ComposedChart data={displayData}>
 <defs>
 <linearGradient id="histGrad" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor="#E2703A" stopOpacity={0.22} />
 <stop offset="95%" stopColor="#E2703A" stopOpacity={0} />
 </linearGradient>
 <linearGradient id="predGrad" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor="#7E9C6B" stopOpacity={0.18} />
 <stop offset="95%" stopColor="#7E9C6B" stopOpacity={0} />
 </linearGradient>
 </defs>
 <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgb(242 236 228 / 0.06)" />
 <XAxis dataKey="month" tick={{ fill: '#847B74', fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }} axisLine={false} tickLine={false} tickMargin={12} />
 <YAxis tick={{ fill: '#847B74', fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }} axisLine={false} tickLine={false} tickFormatter={v => `${v / 1000}k`} width={44} />
 <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgb(242 236 228 / 0.15)' }} />
 <ReferenceLine x="Dec" stroke="rgb(242 236 228 / 0.15)" strokeDasharray="4 4" label={{ value: 'Today', fill: '#847B74', fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }} />
 <Area type="monotone" dataKey="historique" name="History (DA)" stroke="#E2703A" strokeWidth={2.5} fill="url(#histGrad)" connectNulls={false} dot={false} />
 <Area type="monotone" dataKey="prediction" name="Prediction (DA)" stroke="#7E9C6B" strokeWidth={2.5} strokeDasharray="6 3" fill="url(#predGrad)" connectNulls={false} dot={{ fill: '#7E9C6B', r: 4 }} />
 </ComposedChart>
 </ResponsiveContainer>
 </div>

 {/* Prediction Details Table */}
 <div className="bg-surface border hairline rounded-xs p-5">
 <h3 className="portal-heading text-base mb-5">Monthly Prediction Details</h3>
 <div className="overflow-x-auto">
 <table className="w-full">
 <thead>
 <tr className="border-b hairline">
 <th className="portal-dates-header">Period</th>
 <th className="portal-dates-header">Type</th>
 <th className="portal-dates-header">Predicted Sales (DA)</th>
 <th className="portal-dates-header">Growth vs Y-1</th>
 <th className="portal-dates-header">Data basis</th>
 </tr>
 </thead>
 <tbody>
 {(predictions || []).slice(0, horizon).map((p, i) => {
 const prev = monthlySales[i]?.actual || monthlySales[11]?.actual || 0;
 const change = prev ? (((Number(p.value || 0) - prev) / prev) * 100).toFixed(1) : '0.0';
 return (
 <tr key={p.month} className="hover:bg-canvas/50 transition-colors">
 <td className="portal-dates-cell portal-dates-cell-primary">{p.month}</td>
 <td className="portal-dates-cell"><span className="portal-label bg-olive/10 text-olive px-2 py-1 rounded">AI Prediction</span></td>
 <td className="portal-dates-cell font-bold text-olive">{fmt(Number(p.value || 0))} DA</td>
 <td className={`portal-dates-cell font-semibold ${parseFloat(change) >= 0 ? 'text-olive' : 'text-clay'}`}>
 {parseFloat(change) >= 0 ? '+' : ''}{change}%
 </td>
 <td className="portal-dates-cell portal-label">Monthly PostgreSQL aggregates</td>
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>
 <div className="mt-4 p-3 rounded-xs bg-canvas/50 flex items-start gap-2 border hairline">
 <Info size={14} className="text-ink-3 flex-shrink-0 mt-0.5" />
 <p className="portal-label text-ink-3">
 Predictions are generated by a linear regression model trained on the last 12 months. Accuracy naturally decreases over longer horizons. Use these data as an indicator, not as absolute certainty.
 </p>
 </div>
 </div>
 </Layout>
 );
}
