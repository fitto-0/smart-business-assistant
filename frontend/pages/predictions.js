import { useCallback, useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { apiGet } from '../lib/api';
import { ComposedChart, Area, XAxis, YAxis, CartesianGrid,
 Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { Info, AlertTriangle } from 'lucide-react';

const fmt = (n) => new Intl.NumberFormat('fr-FR').format(Math.round(Number(n) || 0));

const HORIZONS = [3, 6, 12];

const CustomTooltip = ({ active, payload, label }) => {
 if (!active || !payload?.length) return null;
 return (
 <div className="bg-surface border hairline rounded-xs p-3">
 <p className="portal-label mb-2 font-semibold">{label}</p>
 {payload.map((p, i) => p.value != null && (
 <p key={i} className="portal-text font-semibold" style={{ color: p.color }}>
 {p.name}: {fmt(p.value)} MAD
 </p>
 ))}
 </div>
 );
};

export default function PredictionsPage() {
 const [horizon, setHorizon] = useState(6);
 const [predictions, setPredictions] = useState([]);
 const [history, setHistory] = useState([]);
 const [meta, setMeta] = useState({ metrics: null, model: '', based_on_points: 0 });
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState('');

 const loadPredictions = useCallback(async (h) => {
 setLoading(true);
 setError('');
 try {
 const res = await apiGet('/analysis/predictions', { horizon: h });
 setPredictions(res?.predictions || []);
 setHistory(res?.history || []);
 setMeta({
 metrics: res?.metrics || null,
 model: res?.model || '',
 based_on_points: res?.based_on_points || 0,
 });
 } catch (err) {
 console.error('Failed to load predictions', err);
 setError(err.message || 'Failed to load predictions');
 setPredictions([]);
 setHistory([]);
 } finally {
 setLoading(false);
 }
 }, []);

 useEffect(() => {
 loadPredictions(horizon);
 }, [horizon, loadPredictions]);

 const sliced = (predictions || []).slice(0, horizon);
 const totalPredicted = sliced.reduce((s, p) => s + Number(p.value || 0), 0);
 // Compare against the same-length recent history (apples to apples)
 const recentHistory = (history || []).slice(-horizon);
 const recentTotal = recentHistory.reduce((s, m) => s + Number(m.total || 0), 0);
 const growth = recentTotal ? (((totalPredicted - recentTotal) / recentTotal) * 100).toFixed(1) : '0.0';
 const bestMonth = sliced.reduce(
 (best, p) => (Number(p.value || 0) > Number(best?.value || 0) ? p : best),
 null,
 )?.month || '—';

 const historyByMonth = Object.fromEntries((history || []).map((m) => [m.month, Number(m.total || 0)]));
 const prevYearMonth = (ym) => {
 const [y, m] = String(ym).split('-');
 if (!y || !m) return null;
 return `${Number(y) - 1}-${m}`;
 };

 // Real history (what the model trained on) + forecast, boundary in between
 const displayData = [
 ...(history || []).map((m) => ({
 month: m.month,
 historique: Number(m.total || 0),
 prediction: null,
 })),
 ...sliced.map((p) => ({
 month: p.month,
 historique: null,
 prediction: Number(p.value || 0),
 })),
 ];
 const forecastStart = sliced[0]?.month;

 if (loading) {
 return <Layout title="AI Predictions"><div className="bg-surface border hairline rounded-xs text-center py-16 portal-text">Loading predictions…</div></Layout>;
 }

 if (error) {
 const needsData = /6 months|Not enough/i.test(error);
 return (
 <Layout title="AI Predictions">
 <div className="bg-surface border hairline rounded-xs text-center py-16 px-6">
 <AlertTriangle size={32} className="mx-auto mb-4 text-ember-500" />
 <p className="font-display text-xl font-medium text-ink mb-2">
 {needsData ? 'Not enough sales history yet' : 'Forecast unavailable'}
 </p>
 <p className="text-[14px] text-ink-2 max-w-prose mx-auto">
 {needsData
 ? `The model needs at least 6 months of recorded sales (currently ${meta.based_on_points || 0}). Record more sales and come back.`
 : /unavailable|503|AI service/i.test(error)
 ? 'The AI service is unreachable. Make sure it is running, then retry.'
 : error}
 </p>
 <button onClick={() => loadPredictions(horizon)} className="btn-ember mt-6">
 Retry
 </button>
 </div>
 </Layout>
 );
 }

 return (
 <Layout title="AI Predictions">
 {/* Header */}
 <div className="border-b border-line pb-4 mb-6">
 <p className="micro">Prediction engine</p>
 <h3 className="text-[17px] font-medium text-ink mt-1">Forecast model</h3>
 <p className="text-[13px] leading-[1.65] text-ink-2 mt-1.5 max-w-prose">
 Built on the last {meta.based_on_points || 12} months of your sales. The model accounts for
 seasonality and trend, and predicts each upcoming month from that
 history.
 </p>
 <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1">
 {["Polynomial regression", "Seasonality analysis", `${meta.based_on_points || 12}-month history`].map((chip) => (
 <li key={chip} className="micro-2 normal-case tracking-normal">✓ {chip}</li>
 ))}
 </ul>
 </div>

 {/* KPIs */}
 <div className="grid grid-cols-2 xl:grid-cols-4 gap-px bg-line border border-line mb-6">
 <div className="bg-surface p-4">
 <p className="micro">Predicted revenue ({horizon} months)</p>
 <p className="stat-value mt-1">{fmt(totalPredicted)} <span className="text-[0.5em] text-ink-3">MAD</span></p>
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
 {HORIZONS.map(h => (
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
 <stop offset="5%" stopColor="#1C352D" stopOpacity={0.22} />
 <stop offset="95%" stopColor="#1C352D" stopOpacity={0} />
 </linearGradient>
 <linearGradient id="predGrad" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor="#7E9C6B" stopOpacity={0.18} />
 <stop offset="95%" stopColor="#7E9C6B" stopOpacity={0} />
 </linearGradient>
 </defs>
 <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgb(28 53 45 / 0.10)" />
 <XAxis dataKey="month" tick={{ fill: '#5A6A62', fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }} axisLine={false} tickLine={false} tickMargin={12} />
 <YAxis tick={{ fill: '#5A6A62', fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }} axisLine={false} tickLine={false} tickFormatter={v => `${v / 1000}k`} width={44} />
 <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgb(28 53 45 / 0.18)' }} />
 {forecastStart && (
 <ReferenceLine x={forecastStart} stroke="rgb(28 53 45 / 0.18)" strokeDasharray="4 4" label={{ value: 'Forecast', fill: '#5A6A62', fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }} />
 )}
 <Area type="monotone" dataKey="historique" name="History (MAD)" stroke="#1C352D" strokeWidth={2.5} fill="url(#histGrad)" connectNulls={false} dot={false} />
 <Area type="monotone" dataKey="prediction" name="Prediction (MAD)" stroke="#7E9C6B" strokeWidth={2.5} strokeDasharray="6 3" fill="url(#predGrad)" connectNulls={false} dot={{ fill: '#7E9C6B', r: 4 }} />
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
 <th className="portal-dates-header">Predicted Sales (MAD)</th>
 <th className="portal-dates-header">Growth vs Y-1</th>
 <th className="portal-dates-header">Data basis</th>
 </tr>
 </thead>
 <tbody>
 {sliced.map((p) => {
 const prevKey = prevYearMonth(p.month);
 const prev = prevKey ? historyByMonth[prevKey] : undefined;
 const change = prev ? (((Number(p.value || 0) - prev) / prev) * 100).toFixed(1) : null;
 return (
 <tr key={p.month} className="hover:bg-canvas/50 transition-colors">
 <td className="portal-dates-cell portal-dates-cell-primary">{p.month}</td>
 <td className="portal-dates-cell"><span className="portal-label bg-olive/10 text-olive px-2 py-1 rounded">AI Prediction</span></td>
 <td className="portal-dates-cell font-bold text-olive">{fmt(Number(p.value || 0))} MAD</td>
 <td className={`portal-dates-cell font-semibold ${change == null ? 'text-ink-3' : parseFloat(change) >= 0 ? 'text-olive' : 'text-clay'}`}>
 {change == null ? '—' : `${parseFloat(change) >= 0 ? '+' : ''}${change}%`}
 </td>
 <td className="portal-dates-cell portal-label">Monthly PostgreSQL aggregates</td>
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>
 {meta.metrics && (
 <div className="mt-4 p-3 rounded-xs bg-canvas/50 flex flex-wrap items-center gap-x-6 gap-y-1 border hairline">
 <span className="portal-label text-ink-2">Model: {meta.model || 'Polynomial regression'}</span>
 {meta.metrics.mae != null && <span className="portal-label text-ink-2">MAE {fmt(meta.metrics.mae)} MAD</span>}
 {meta.metrics.rmse != null && <span className="portal-label text-ink-2">RMSE {fmt(meta.metrics.rmse)} MAD</span>}
 {meta.metrics.r2 != null && <span className="portal-label text-ink-2">R² {meta.metrics.r2}</span>}
 <span className="portal-label text-ink-2">Trained on {meta.based_on_points} months</span>
 </div>
 )}
 <div className="mt-4 p-3 rounded-xs bg-canvas/50 flex items-start gap-2 border hairline">
 <Info size={14} className="text-ink-3 flex-shrink-0 mt-0.5" />
 <p className="portal-label text-ink-3">
 Predictions are generated by a polynomial regression model trained on the last {meta.based_on_points || 12} months. Accuracy naturally decreases over longer horizons. Use these data as an indicator, not as absolute certainty.
 </p>
 </div>
 </div>
 </Layout>
 );
}
