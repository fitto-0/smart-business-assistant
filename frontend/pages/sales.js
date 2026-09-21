import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { apiGet, apiPost } from '../lib/api';
import { useLanguage } from '../lib/LanguageContext';
import {
 AreaChart, Area, BarChart, Bar, LineChart, Line,
 XAxis, YAxis, Tooltip,
 ResponsiveContainer, ComposedChart
} from 'recharts';
import { CHART, SERIES, axisProps, tooltipStyle, tooltipLabelStyle, tooltipCursor, barProps, EmberAreaFill, emberUrl } from '../lib/chartTheme';
import { fmt, fmtDA } from '../lib/format';
import PageHeader, { Ledger, Section, NoirTable, Status, Segmented, Empty } from '../components/PageHeader';
import { TrendingUp, TrendingDown, ShoppingCart, DollarSign, BarChart2, Plus, X } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
 if (!active || !payload?.length) return null;
 return (
 <div className="panel px-3 py-2.5 min-w-[160px]">
 <p className="micro-2 mb-2">{label}</p>
 {payload.map((p, i) => (
 <p key={i} className="flex items-baseline justify-between gap-4 font-mono text-[11px] tabular-nums">
 <span className="text-ink-3">{p.name}</span>
 <strong className="font-medium" style={{ color: p.color || CHART.ink }}>{fmt(p.value)}</strong>
 </p>
 ))}
 </div>
 );
};

export default function SalesPage() {
 const { t } = useLanguage();
 const [monthlySales, setMonthlySales] = useState([]);
 const [topProducts, setTopProducts] = useState([]);
 const [loading, setLoading] = useState(true);
 const [showSaleModal, setShowSaleModal] = useState(false);
 const [products, setProducts] = useState([]);
 const [saleForm, setSaleForm] = useState({
 product_id: '',
 quantity: 1,
 unit_price: '',
 customer_name: '',
 payment_method: 'carte',
 date: new Date().toISOString().split('T')[0],
 notes: ''
 });
 const [submitting, setSubmitting] = useState(false);

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

 const loadProducts = async () => {
 try {
 const data = await apiGet('/products');
 setProducts(data.products || []);
 } catch (error) {
 console.error('Failed to load products', error);
 }
 };

 const openSaleModal = async () => {
 await loadProducts();
 setShowSaleModal(true);
 };

 const closeSaleModal = () => {
 setShowSaleModal(false);
 setSaleForm({
 product_id: '',
 quantity: 1,
 unit_price: '',
 customer_name: '',
 payment_method: 'carte',
 date: new Date().toISOString().split('T')[0],
 notes: ''
 });
 };

 const handleProductChange = (productId) => {
 const product = products.find(p => p.id === parseInt(productId));
 if (product) {
 setSaleForm({
 ...saleForm,
 product_id: productId,
 unit_price: product.price
 });
 }
 };

 const handleSubmitSale = async (e) => {
 e.preventDefault();
 setSubmitting(true);

 try {
 await apiPost('/sales', saleForm);
 closeSaleModal();
 
 // Reload sales data
 const [monthly, top] = await Promise.all([
 apiGet('/sales/monthly'),
 apiGet('/sales/top-products', { limit: 5 })
 ]);
 setMonthlySales(monthly?.data || []);
 setTopProducts(top?.data || []);
 
 alert(t('sales.saleRecorded'));
 } catch (error) {
 console.error('Failed to record sale', error);
 alert(t('sales.saleFailed'));
 } finally {
 setSubmitting(false);
 }
 };

 const totalSales = (monthlySales || []).reduce((s, m) => s + Number(m.actual || 0), 0);
 const totalOrders = (monthlySales || []).reduce((s, m) => s + Number(m.orders || 0), 0);
 const avgMonthly = Math.round(totalSales / Math.max(monthlySales.length, 1));
 const bestMonth = (monthlySales || []).reduce((a, b) => (Number(a.actual || 0) > Number(b.actual || 0) ? a : b), { month: 'N/A', actual: 0 });
 const bestMonthVentes = bestMonth.actual || 0;

 if (loading) {
 return <Layout title={t('sales.title')}><div className="panel px-4 py-16 text-center micro-2">{t('sales.loading')}</div></Layout>;
 }

 return (
 <Layout title={t('sales.title')}>
 <PageHeader
 index="02"
 eyebrow={t('sales.title')}
 title={t('sales.trackManageSales')}
 actions={(
 <button
 onClick={openSaleModal}
 className="btn-ember"
 >
 <Plus size={15} strokeWidth={2} />
 {t('sales.recordSale')}
 </button>
 )}
 />

 {/* Ledger strip — one divided band, tabular numerals */}
 <Ledger
 items={[
 { label: t('sales.totalAnnualRevenue'), value: `${fmt(totalSales)} DA` },
 { label: t('sales.totalOrders'), value: fmt(totalOrders) },
 { label: t('sales.monthlyAverage'), value: `${fmt(avgMonthly)} DA` },
 { label: `${t('sales.bestMonth')} — ${bestMonth.month}`, value: `${fmt(bestMonthVentes)} DA` },
 ]}
 />

 <div className="mt-6 space-y-6">
 {/* Sales vs Objective */}
 <Section
 eyebrow={t('sales.salesVsTargets')}
 title={t('sales.monthlyComparison')}
 >
 <div className="px-4 pt-4">
 <ResponsiveContainer width="100%" height={280}>
 <ComposedChart data={monthlySales} margin={{ top: 4, right: 4, bottom: 0, left: -8 }}>
 <EmberAreaFill id="salesArea" />
 <XAxis dataKey="month" {...axisProps} />
 <YAxis {...axisProps} width={48} tickFormatter={v => `${v / 1000}k`} />
 <Tooltip content={<CustomTooltip />} cursor={tooltipCursor} />
 <Area type="monotone" dataKey="actual" name={t('sales.sales')} stroke={CHART.ember} strokeWidth={2} fill={emberUrl('salesArea')} />
 <Line type="monotone" dataKey="target" name={t('sales.target')} stroke={CHART.olive} strokeWidth={1.5} strokeDasharray="6 4" dot={false} />
 </ComposedChart>
 </ResponsiveContainer>
 {/* inline series key — replaces Legend */}
 <div className="flex flex-wrap items-center gap-5 border-t border-line px-4 py-3">
 <span className="micro flex items-center gap-2"><span aria-hidden="true" className="w-[5px] h-[5px] bg-ember-500" />{t('sales.sales')}</span>
 <span className="micro flex items-center gap-2"><span aria-hidden="true" className="w-[5px] h-[5px] bg-olive" />{t('sales.target')}</span>
 </div>
 </div>
 </Section>

 <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
 {/* Monthly Orders */}
 <Section
 eyebrow={t('sales.monthlyOrders')}
 title={t('sales.monthlyOrderVolume')}
 >
 <div className="px-4 pt-4">
 <ResponsiveContainer width="100%" height={220}>
 <BarChart data={monthlySales} margin={{ top: 4, right: 4, bottom: 0, left: -8 }} {...barProps}>
 <XAxis dataKey="month" {...axisProps} />
 <YAxis {...axisProps} width={40} />
 <Tooltip content={<CustomTooltip />} cursor={{ fill: CHART.cursor }} />
 <Bar dataKey="orders" name={t('sales.orders')} fill={CHART.olive} radius={[2, 2, 0, 0]} barSize={12} />
 </BarChart>
 </ResponsiveContainer>
 </div>
 </Section>

 {/* Top Products by Revenue — ranked ledger rows */}
 <Section
 eyebrow={t('sales.top5Products')}
 title={t('sales.bestPerforming')}
 >
 <div className="divide-y divide-line">
 {topProducts.map((p, i) => (
 <div key={p.id} className="ledger-row flex items-center gap-4 !py-3">
 <span className="font-mono text-micro uppercase text-ink-3 tabular-nums w-6 shrink-0">
 {String(i + 1).padStart(2, "0")}
 </span>
 <div className="flex-1 min-w-0">
 <div className="flex items-baseline justify-between gap-3">
 <span className="text-[13px] text-ink truncate">{p.name}</span>
 <span className="font-mono text-[11px] tabular-nums text-ink shrink-0">{fmt(p.revenue)} DA</span>
 </div>
 <div className="mt-1.5 h-[3px] w-full bg-canvas">
 <div className="h-[3px] bg-ember-500/80"
 style={{ width: `${topProducts[0]?.revenue ? (p.revenue / topProducts[0].revenue) * 100 : 0}%` }} />
 </div>
 </div>
 <span className={`font-mono text-[11px] tabular-nums shrink-0 ${p.trend >= 0 ? 'text-olive' : 'text-clay'}`}>
 {p.trend >= 0 ? '+' : ''}{p.trend}%
 </span>
 </div>
 ))}
 </div>
 </Section>
 </div>
 </div>

 {/* Detailed Monthly Table */}
 <Section
 eyebrow={t('sales.detailedMonthlySummary')}
 title={t('sales.month')}
 className="mt-6"
 >
 <NoirTable
 columns={[
 { key: "month", label: t('sales.month') },
 { key: "actual", label: t('sales.actual'), numeric: true, render: (row) => <span className="text-ember-300">{fmt(row.actual || 0)} DA</span> },
 { key: "target", label: t('sales.targetSales'), numeric: true, render: (row) => fmt(row.target || 0) },
 { key: "orders", label: t('sales.ordersCount'), numeric: true, render: (row) => row.orders },
 {
 key: "gap", label: t('sales.revenue'), numeric: true,
 render: (row) => {
 const ecart = Number(row.actual || 0) - Number(row.target || 0);
 return <span className={ecart >= 0 ? 'text-olive' : 'text-clay'}>{ecart >= 0 ? '+' : ''}{fmt(ecart)} DA</span>;
 },
 },
 {
 key: "perf", label: t('sales.trend'), numeric: true,
 render: (row) => {
 const objectif = Number(row.target || 0);
 const perf = objectif ? ((Number(row.actual || 0) / objectif) * 100).toFixed(1) : '0.0';
 return <span className={parseFloat(perf) >= 100 ? 'text-olive' : 'text-ember-300'}>{perf}%</span>;
 },
 },
 ]}
 rows={monthlySales}
 rowKey="month"
 emptyLabel={t('sales.loading')}
 />
 </Section>

 {/* Sale Modal */}
 {showSaleModal && (
 <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
 <div className="bg-canvas border hairline rounded-xs p-6 w-full max-w-md">
 <div className="flex items-center justify-between mb-4">
 <h3 className="portal-heading text-xl">{t('sales.recordSale')}</h3>
 <button onClick={closeSaleModal} className="text-ink-3 hover:text-ink">
 <X size={20} />
 </button>
 </div>

 <form onSubmit={handleSubmitSale} className="space-y-4">
 <div>
 <label className="portal-label block mb-1">{t('sales.selectProduct')} *</label>
 <select
 value={saleForm.product_id}
 onChange={(e) => handleProductChange(e.target.value)}
 className="w-full bg-surface border hairline rounded-xs px-3 py-2 portal-text"
 required
 >
 <option value="">{t('sales.selectProduct')}</option>
 {products.map((p) => (
 <option key={p.id} value={p.id}>
 {p.name} - {fmt(p.price)} DA (Stock: {p.stock})
 </option>
 ))}
 </select>
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="portal-label block mb-1">{t('sales.quantity')} *</label>
 <input
 type="number"
 min="1"
 value={saleForm.quantity}
 onChange={(e) => setSaleForm({ ...saleForm, quantity: parseInt(e.target.value) })}
 className="w-full bg-surface border hairline rounded-xs px-3 py-2 portal-text"
 required
 />
 </div>

 <div>
 <label className="portal-label block mb-1">{t('sales.unitPrice')} (DA) *</label>
 <input
 type="number"
 min="0"
 step="0.01"
 value={saleForm.unit_price}
 onChange={(e) => setSaleForm({ ...saleForm, unit_price: parseFloat(e.target.value) })}
 className="w-full bg-surface border hairline rounded-xs px-3 py-2 portal-text"
 required
 />
 </div>
 </div>

 <div>
 <label className="portal-label block mb-1">{t('sales.date')} *</label>
 <input
 type="date"
 value={saleForm.date}
 onChange={(e) => setSaleForm({ ...saleForm, date: e.target.value })}
 className="w-full bg-surface border hairline rounded-xs px-3 py-2 portal-text"
 required
 />
 </div>

 <div>
 <label className="portal-label block mb-1">{t('sales.customerName')}</label>
 <input
 type="text"
 value={saleForm.customer_name}
 onChange={(e) => setSaleForm({ ...saleForm, customer_name: e.target.value })}
 className="w-full bg-surface border hairline rounded-xs px-3 py-2 portal-text"
 placeholder="Optional"
 />
 </div>

 <div>
 <label className="portal-label block mb-1">{t('sales.paymentMethod')}</label>
 <select
 value={saleForm.payment_method}
 onChange={(e) => setSaleForm({ ...saleForm, payment_method: e.target.value })}
 className="w-full bg-surface border hairline rounded-xs px-3 py-2 portal-text"
 >
 <option value="carte">{t('sales.card')}</option>
 <option value="espèces">{t('sales.cash')}</option>
 <option value="virement">{t('sales.transfer')}</option>
 <option value="chèque">Check</option>
 <option value="autre">Other</option>
 </select>
 </div>

 <div>
 <label className="portal-label block mb-1">{t('sales.notes')}</label>
 <textarea
 value={saleForm.notes}
 onChange={(e) => setSaleForm({ ...saleForm, notes: e.target.value })}
 className="w-full bg-surface border hairline rounded-xs px-3 py-2 portal-text"
 rows="2"
 placeholder="Optional notes"
 />
 </div>

 <div className="flex gap-3 pt-2">
 <button
 type="button"
 onClick={closeSaleModal}
 className="flex-1 bg-surface border hairline rounded-xs px-4 py-2 portal-label font-semibold hover:bg-canvas/50 transition-colors"
 >
 {t('sales.cancel')}
 </button>
 <button
 type="submit"
 disabled={submitting}
 className="flex-1 bg-ember-500 text-ground rounded-xs px-4 py-2 portal-label font-semibold hover:bg-ember-500/90 transition-colors disabled:opacity-50"
 >
 {submitting ? t('sales.record') + '...' : t('sales.recordSale')}
 </button>
 </div>
 </form>
 </div>
 </div>
 )}
 </Layout>
 );
}
