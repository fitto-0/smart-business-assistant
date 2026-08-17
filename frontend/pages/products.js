import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { apiGet, apiPost, apiPut, apiDelete } from '../lib/api';
import toast from 'react-hot-toast';
import { Plus, Search, Edit2, Trash2, Package, TrendingUp, TrendingDown, X, Save, Upload, FileText, Check } from 'lucide-react';

const fmt = (n) => new Intl.NumberFormat('fr-FR').format(n);

const STATUS_LABELS = {
  actif: { label: 'Active', cls: 'text-teal' },
  stock_faible: { label: 'Low Stock', cls: 'text-amber' },
  rupture: { label: 'Out of Stock', cls: 'text-red-400' },
};

const CATEGORIES = ['All', 'Electronics', 'Clothing', 'Food', 'Home', 'Sports'];

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [form, setForm] = useState({ name: '', category: 'Electronics', price: '', stock: '' });
  const [loading, setLoading] = useState(true);
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [csvAnalyzing, setCsvAnalyzing] = useState(false);
  const [csvAnalysis, setCsvAnalysis] = useState(null);
  const [csvUploading, setCsvUploading] = useState(false);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await apiGet('/products');
        setProducts(data.products || []);
      } catch (error) {
        toast.error(error.message || 'Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  const filtered = (products || []).filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === 'All' || p.category === catFilter;
    return matchSearch && matchCat;
  });

  const openAdd = () => {
    setEditProduct(null);
    setForm({ name: '', category: 'Electronics', price: '', stock: '' });
    setShowModal(true);
  };

  const openEdit = (p) => {
    setEditProduct(p);
    setForm({ name: p.name, category: p.category, price: p.price, stock: p.stock });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.price || form.stock === '') { toast.error('Please fill in all fields'); return; }

    try {
      const payload = { name: form.name, category: form.category, price: parseFloat(form.price), stock: parseInt(form.stock, 10) };
      if (editProduct) {
        const updated = await apiPut(`/products/${editProduct.id}`, payload);
        setProducts((current) => current.map((p) => p.id === updated.id ? updated : p));
        toast.success('Product updated successfully');
      } else {
        const created = await apiPost('/products', payload);
        setProducts((current) => [created, ...current]);
        toast.success('Product added successfully');
      }
      setShowModal(false);
    } catch (error) {
      toast.error(error.message || 'Failed to save');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await apiDelete(`/products/${id}`);
      setProducts((current) => current.filter((p) => p.id !== id));
      toast.success('Product deleted');
    } catch (error) {
      toast.error(error.message || 'Failed to delete');
    }
  };

  const handleCsvFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.name.endsWith('.csv')) {
      setCsvFile(file);
      setCsvAnalysis(null);
    } else {
      toast.error('Please select a CSV file');
    }
  };

  const analyzeCsv = async () => {
    if (!csvFile) return;

    setCsvAnalyzing(true);
    const formData = new FormData();
    formData.append('file', csvFile);

    try {
      const response = await apiPost('/csv/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (response.success) {
        setCsvAnalysis(response);
        toast.success(`Analyzed ${response.total} products`);
      } else {
        toast.error(response.error || 'Failed to analyze CSV');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to analyze CSV');
    } finally {
      setCsvAnalyzing(false);
    }
  };

  const importCsvProducts = async () => {
    if (!csvAnalysis || !csvAnalysis.products) return;

    setCsvUploading(true);
    try {
      for (const product of csvAnalysis.products) {
        await apiPost('/products', product);
      }
      toast.success(`Imported ${csvAnalysis.products.length} products`);
      setShowCsvModal(false);
      setCsvFile(null);
      setCsvAnalysis(null);
      
      // Reload products
      const data = await apiGet('/products');
      setProducts(data.products || []);
    } catch (error) {
      toast.error('Failed to import products');
    } finally {
      setCsvUploading(false);
    }
  };

  const totalProducts = products.length;
  const inStock = products.filter(p => p.status === 'actif').length;
  const lowStock = products.filter(p => p.status === 'stock_faible').length;
  const outStock = products.filter(p => p.status === 'rupture').length;

  return (
    <Layout title="Products & Stock">
      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Products', value: totalProducts, color: 'bg-amber' },
          { label: 'In Stock', value: inStock, color: 'bg-teal' },
          { label: 'Low Stock', value: lowStock, color: 'bg-amber' },
          { label: 'Out of Stock', value: outStock, color: 'bg-red-400' },
        ].map((s, i) => (
          <div key={i} className="bg-ground-secondary border hairline rounded-xl p-4 flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl ${s.color} flex items-center justify-center`}>
              <Package size={20} className="text-ground" />
            </div>
            <div>
              <p className="portal-label">{s.label}</p>
              <p className="portal-heading text-2xl">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="bg-ground-secondary border hairline rounded-xl p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            <div className="relative flex-1 max-w-xs">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search product..." className="w-full bg-ground border hairline rounded-xl px-4 py-2 pl-9 text-ink placeholder-muted focus:outline-none focus:border-amber transition-colors" />
            </div>
            <div className="flex gap-2 flex-wrap">
              {CATEGORIES.map(c => (
                <button key={c} onClick={() => setCatFilter(c)}
                  className={`portal-label px-3 py-1.5 rounded-lg font-medium transition-all ${catFilter === c ? 'bg-amber text-ground' : 'bg-ground text-ink-secondary hover:bg-ground/50'}`}>
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={() => setShowCsvModal(true)} className="portal-pill-btn">
              <Upload size={16} /> Import CSV
            </button>
            <button onClick={openAdd} className="portal-pill-btn">
              <Plus size={16} /> Add Product
            </button>
          </div>
        </div>
      </div>

      {loading && <div className="bg-ground-secondary border hairline rounded-xl text-center py-8 portal-text">Loading products…</div>}

      {/* Products Table */}
      <div className="bg-ground-secondary border hairline rounded-xl p-5">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b hairline">
                <th className="portal-dates-header">Product</th>
                <th className="portal-dates-header">Category</th>
                <th className="portal-dates-header">Price</th>
                <th className="portal-dates-header">Stock</th>
                <th className="portal-dates-header">Sold</th>
                <th className="portal-dates-header">Revenue</th>
                <th className="portal-dates-header">Trend</th>
                <th className="portal-dates-header">Status</th>
                <th className="portal-dates-header">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const st = STATUS_LABELS[p.status];
                return (
                  <tr key={p.id} className="hover:bg-ground/50 transition-colors">
                    <td className="portal-dates-cell portal-dates-cell-primary">{p.name}</td>
                    <td className="portal-dates-cell">
                      <span className="portal-label bg-teal/10 text-teal px-2 py-1 rounded">{p.category}</span>
                    </td>
                    <td className="portal-dates-cell font-medium text-ink">{fmt(p.price)} DA</td>
                    <td className={`portal-dates-cell font-semibold ${p.stock === 0 ? 'text-red-400' : p.stock <= 10 ? 'text-amber' : 'text-teal'}`}>
                      {p.stock === 0 ? '⚠ Out of Stock' : p.stock}
                    </td>
                    <td className="portal-dates-cell text-ink-secondary">{p.sold}</td>
                    <td className="portal-dates-cell font-semibold text-amber">{fmt(p.revenue)} DA</td>
                    <td className="portal-dates-cell">
                      <div className={`flex items-center gap-1 font-semibold portal-label ${p.trend >= 0 ? 'text-teal' : 'text-red-400'}`}>
                        {p.trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        {p.trend >= 0 ? '+' : ''}{p.trend}%
                      </div>
                    </td>
                    <td className="portal-dates-cell"><span className={st.cls}>{st.label}</span></td>
                    <td className="portal-dates-cell">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-amber/20 text-amber transition-colors">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg hover:bg-red-400/20 text-red-400 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12 portal-text">
              <Package size={40} className="mx-auto mb-3 opacity-30" />
              <p>No products found</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-ground-secondary border hairline rounded-2xl p-6 w-full max-w-md shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between mb-5">
              <h3 className="portal-heading text-lg">{editProduct ? 'Edit Product' : 'New Product'}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-ground text-muted">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block portal-label mb-1.5">Product Name</label>
                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-ground border hairline rounded-xl px-4 py-2 text-ink placeholder-muted focus:outline-none focus:border-amber transition-colors" placeholder="Ex: iPhone 15 Pro" />
              </div>
              <div>
                <label className="block portal-label mb-1.5">Category</label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full bg-ground border hairline rounded-xl px-4 py-2 text-ink focus:outline-none focus:border-amber transition-colors">
                  {CATEGORIES.slice(1).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block portal-label mb-1.5">Price (DA)</label>
                  <input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })}
                    className="w-full bg-ground border hairline rounded-xl px-4 py-2 text-ink placeholder-muted focus:outline-none focus:border-amber transition-colors" placeholder="0" min="0" />
                </div>
                <div>
                  <label className="block portal-label mb-1.5">Stock (units)</label>
                  <input type="number" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })}
                    className="w-full bg-ground border hairline rounded-xl px-4 py-2 text-ink placeholder-muted focus:outline-none focus:border-amber transition-colors" placeholder="0" min="0" />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="w-full bg-ground border hairline rounded-xl px-4 py-2 portal-label text-ink-secondary hover:bg-ground/50 transition-colors justify-center">Cancel</button>
              <button onClick={handleSave} className="portal-pill-btn flex-1 justify-center">
                <Save size={16} /> Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {showCsvModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-ground-secondary border hairline rounded-2xl p-6 w-full max-w-lg shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between mb-5">
              <h3 className="portal-heading text-lg">Import Products from CSV</h3>
              <button onClick={() => setShowCsvModal(false)} className="p-2 rounded-lg hover:bg-ground text-muted">
                <X size={18} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block portal-label mb-1.5">Select CSV File</label>
                <div className="relative">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleCsvFileChange}
                    className="w-full bg-ground border hairline rounded-xl px-4 py-3 text-ink file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-amber file:text-ground hover:file:bg-amber/80"
                  />
                </div>
                <p className="portal-label text-muted mt-2 text-xs">
                  Required columns: name, category, price, stock. Optional: sold, revenue, description
                </p>
              </div>

              {csvAnalysis && (
                <div className="bg-ground border hairline rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Check size={18} className="text-teal" />
                    <span className="portal-heading text-sm text-teal">Analysis Complete</span>
                  </div>
                  <div className="space-y-2 portal-text text-sm">
                    <p><span className="text-muted">Total products:</span> {csvAnalysis.total}</p>
                    <p><span className="text-muted">Detected columns:</span> {Object.keys(csvAnalysis.column_mapping).join(', ')}</p>
                    {csvAnalysis.preview && csvAnalysis.preview.length > 0 && (
                      <div className="mt-3">
                        <p className="text-muted mb-2">Preview (first 3):</p>
                        <div className="space-y-1">
                          {csvAnalysis.preview.map((p, i) => (
                            <div key={i} className="bg-ground-secondary p-2 rounded text-xs">
                              {p.name} - {p.category} - {p.price} DA
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowCsvModal(false)} className="w-full bg-ground border hairline rounded-xl px-4 py-2 portal-label text-ink-secondary hover:bg-ground/50 transition-colors justify-center">
                  Cancel
                </button>
                {!csvAnalysis ? (
                  <button
                    onClick={analyzeCsv}
                    disabled={!csvFile || csvAnalyzing}
                    className="portal-pill-btn flex-1 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {csvAnalyzing ? 'Analyzing...' : <><FileText size={16} /> Analyze CSV</>}
                  </button>
                ) : (
                  <button
                    onClick={importCsvProducts}
                    disabled={csvUploading}
                    className="portal-pill-btn flex-1 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {csvUploading ? 'Importing...' : <><Upload size={16} /> Import Products</>}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
