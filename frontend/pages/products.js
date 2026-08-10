import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { apiGet, apiPost, apiPut, apiDelete } from '../lib/api';
import toast from 'react-hot-toast';
import { Plus, Search, Edit2, Trash2, Package, TrendingUp, TrendingDown, X, Save } from 'lucide-react';

const fmt = (n) => new Intl.NumberFormat('fr-FR').format(n);

const STATUS_LABELS = {
  actif: { label: 'Actif', cls: 'badge-green' },
  stock_faible: { label: 'Stock Faible', cls: 'badge-yellow' },
  rupture: { label: 'Rupture', cls: 'badge-red' },
};

const CATEGORIES = ['Toutes', 'Électronique', 'Vêtements', 'Alimentation', 'Maison', 'Sport'];

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('Toutes');
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [form, setForm] = useState({ name: '', category: 'Électronique', price: '', stock: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await apiGet('/api/products');
        setProducts(data.products || []);
      } catch (error) {
        toast.error(error.message || 'Impossible de charger les produits');
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  const filtered = (products || []).filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === 'Toutes' || p.category === catFilter;
    return matchSearch && matchCat;
  });

  const openAdd = () => {
    setEditProduct(null);
    setForm({ name: '', category: 'Électronique', price: '', stock: '' });
    setShowModal(true);
  };

  const openEdit = (p) => {
    setEditProduct(p);
    setForm({ name: p.name, category: p.category, price: p.price, stock: p.stock });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.price || form.stock === '') { toast.error('Veuillez remplir tous les champs'); return; }

    try {
      const payload = { name: form.name, category: form.category, price: parseFloat(form.price), stock: parseInt(form.stock, 10) };
      if (editProduct) {
        const updated = await apiPut(`/api/products/${editProduct.id}`, payload);
        setProducts((current) => current.map((p) => p.id === updated.id ? updated : p));
        toast.success('Produit modifié avec succès');
      } else {
        const created = await apiPost('/api/products', payload);
        setProducts((current) => [created, ...current]);
        toast.success('Produit ajouté avec succès');
      }
      setShowModal(false);
    } catch (error) {
      toast.error(error.message || 'Échec de l’enregistrement');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce produit ?')) return;
    try {
      await apiDelete(`/api/products/${id}`);
      setProducts((current) => current.filter((p) => p.id !== id));
      toast.success('Produit supprimé');
    } catch (error) {
      toast.error(error.message || 'Échec de la suppression');
    }
  };

  const totalProducts = products.length;
  const inStock = products.filter(p => p.status === 'actif').length;
  const lowStock = products.filter(p => p.status === 'stock_faible').length;
  const outStock = products.filter(p => p.status === 'rupture').length;

  return (
    <Layout title="Produits & Stock">
      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Produits', value: totalProducts, color: 'from-primary-500 to-indigo-600' },
          { label: 'En Stock', value: inStock, color: 'from-emerald-500 to-teal-600' },
          { label: 'Stock Faible', value: lowStock, color: 'from-amber-500 to-orange-600' },
          { label: 'Rupture', value: outStock, color: 'from-red-500 to-rose-600' },
        ].map((s, i) => (
          <div key={i} className="card flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center`}>
              <Package size={20} className="text-white" />
            </div>
            <div>
              <p className="text-xs text-slate-400">{s.label}</p>
              <p className="text-2xl font-bold text-white">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            <div className="relative flex-1 max-w-xs">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher un produit..." className="input-field pl-9 py-2" />
            </div>
            <div className="flex gap-2 flex-wrap">
              {CATEGORIES.map(c => (
                <button key={c} onClick={() => setCatFilter(c)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${catFilter === c ? 'bg-primary-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
                  {c}
                </button>
              ))}
            </div>
          </div>
          <button onClick={openAdd} className="btn-primary flex-shrink-0">
            <Plus size={16} /> Ajouter Produit
          </button>
        </div>
      </div>

      {loading && <div className="card text-center py-8 text-slate-400">Chargement des produits…</div>}

      {/* Products Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="table-header">Produit</th>
                <th className="table-header">Catégorie</th>
                <th className="table-header">Prix</th>
                <th className="table-header">Stock</th>
                <th className="table-header">Vendus</th>
                <th className="table-header">Revenus</th>
                <th className="table-header">Tendance</th>
                <th className="table-header">Statut</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const st = STATUS_LABELS[p.status];
                return (
                  <tr key={p.id} className="hover:bg-slate-700/20 transition-colors">
                    <td className="table-cell font-semibold text-white">{p.name}</td>
                    <td className="table-cell">
                      <span className="badge-blue">{p.category}</span>
                    </td>
                    <td className="table-cell font-medium text-slate-200">{fmt(p.price)} DA</td>
                    <td className={`table-cell font-semibold ${p.stock === 0 ? 'text-red-400' : p.stock <= 10 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {p.stock === 0 ? '⚠ Épuisé' : p.stock}
                    </td>
                    <td className="table-cell text-slate-300">{p.sold}</td>
                    <td className="table-cell font-semibold text-primary-300">{fmt(p.revenue)} DA</td>
                    <td className="table-cell">
                      <div className={`flex items-center gap-1 font-semibold text-xs ${p.trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {p.trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        {p.trend >= 0 ? '+' : ''}{p.trend}%
                      </div>
                    </td>
                    <td className="table-cell"><span className={st.cls}>{st.label}</span></td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-primary-500/20 text-primary-400 transition-colors">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors">
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
            <div className="text-center py-12 text-slate-500">
              <Package size={40} className="mx-auto mb-3 opacity-30" />
              <p>Aucun produit trouvé</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-dark-800 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-white">{editProduct ? 'Modifier Produit' : 'Nouveau Produit'}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-slate-700 text-slate-400">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Nom du Produit</label>
                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  className="input-field" placeholder="Ex: iPhone 15 Pro" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Catégorie</label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="input-field">
                  {CATEGORIES.slice(1).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Prix (DA)</label>
                  <input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })}
                    className="input-field" placeholder="0" min="0" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Stock (unités)</label>
                  <input type="number" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })}
                    className="input-field" placeholder="0" min="0" />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="btn-secondary flex-1 justify-center">Annuler</button>
              <button onClick={handleSave} className="btn-primary flex-1 justify-center">
                <Save size={16} /> Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
