import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { apiGet, apiPost } from '../lib/api';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ComposedChart
} from 'recharts';
import { TrendingUp, TrendingDown, ShoppingCart, DollarSign, BarChart2, Plus, X } from 'lucide-react';

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
      
      alert('Sale recorded successfully!');
    } catch (error) {
      console.error('Failed to record sale', error);
      alert('Failed to record sale');
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
    return <Layout title="Sales Analytics"><div className="bg-ground-secondary border hairline rounded-xl text-center py-16 portal-text">Loading sales data…</div></Layout>;
  }

  return (
    <Layout title="Sales Analytics">
      {/* Header with Add Sale Button */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="portal-heading text-2xl">Sales Analytics</h2>
          <p className="portal-label text-muted">Track and manage your sales</p>
        </div>
        <button
          onClick={openSaleModal}
          className="bg-amber text-ground px-4 py-2 rounded-xl portal-label font-semibold flex items-center gap-2 hover:bg-amber/90 transition-colors"
        >
          <Plus size={18} />
          Record Sale
        </button>
      </div>

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

      {/* Sale Modal */}
      {showSaleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-ground border hairline rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="portal-heading text-xl">Record Sale</h3>
              <button onClick={closeSaleModal} className="text-muted hover:text-ink">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitSale} className="space-y-4">
              <div>
                <label className="portal-label block mb-1">Product *</label>
                <select
                  value={saleForm.product_id}
                  onChange={(e) => handleProductChange(e.target.value)}
                  className="w-full bg-ground-secondary border hairline rounded-lg px-3 py-2 portal-text"
                  required
                >
                  <option value="">Select a product</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} - {fmt(p.price)} DA (Stock: {p.stock})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="portal-label block mb-1">Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    value={saleForm.quantity}
                    onChange={(e) => setSaleForm({ ...saleForm, quantity: parseInt(e.target.value) })}
                    className="w-full bg-ground-secondary border hairline rounded-lg px-3 py-2 portal-text"
                    required
                  />
                </div>

                <div>
                  <label className="portal-label block mb-1">Unit Price (DA) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={saleForm.unit_price}
                    onChange={(e) => setSaleForm({ ...saleForm, unit_price: parseFloat(e.target.value) })}
                    className="w-full bg-ground-secondary border hairline rounded-lg px-3 py-2 portal-text"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="portal-label block mb-1">Date *</label>
                <input
                  type="date"
                  value={saleForm.date}
                  onChange={(e) => setSaleForm({ ...saleForm, date: e.target.value })}
                  className="w-full bg-ground-secondary border hairline rounded-lg px-3 py-2 portal-text"
                  required
                />
              </div>

              <div>
                <label className="portal-label block mb-1">Customer Name</label>
                <input
                  type="text"
                  value={saleForm.customer_name}
                  onChange={(e) => setSaleForm({ ...saleForm, customer_name: e.target.value })}
                  className="w-full bg-ground-secondary border hairline rounded-lg px-3 py-2 portal-text"
                  placeholder="Optional"
                />
              </div>

              <div>
                <label className="portal-label block mb-1">Payment Method</label>
                <select
                  value={saleForm.payment_method}
                  onChange={(e) => setSaleForm({ ...saleForm, payment_method: e.target.value })}
                  className="w-full bg-ground-secondary border hairline rounded-lg px-3 py-2 portal-text"
                >
                  <option value="carte">Card</option>
                  <option value="espèces">Cash</option>
                  <option value="virement">Transfer</option>
                  <option value="chèque">Check</option>
                  <option value="autre">Other</option>
                </select>
              </div>

              <div>
                <label className="portal-label block mb-1">Notes</label>
                <textarea
                  value={saleForm.notes}
                  onChange={(e) => setSaleForm({ ...saleForm, notes: e.target.value })}
                  className="w-full bg-ground-secondary border hairline rounded-lg px-3 py-2 portal-text"
                  rows="2"
                  placeholder="Optional notes"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeSaleModal}
                  className="flex-1 bg-ground-secondary border hairline rounded-lg px-4 py-2 portal-label font-semibold hover:bg-ground/50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-amber text-ground rounded-lg px-4 py-2 portal-label font-semibold hover:bg-amber/90 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Recording...' : 'Record Sale'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
