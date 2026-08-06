import { useState } from 'react';
import Layout from '../components/Layout';
import { recommendations as allRecs } from '../data/mockData';
import toast from 'react-hot-toast';
import { Lightbulb, CheckCircle, Package, Tag, Star, BarChart2, Filter } from 'lucide-react';

const PRIORITY_CONFIG = {
  critique: { label: 'Critique', cls: 'badge-red', border: 'border-red-500/30 bg-red-500/5' },
  haute: { label: 'Haute', cls: 'badge-yellow', border: 'border-amber-500/30 bg-amber-500/5' },
  moyenne: { label: 'Moyenne', cls: 'badge-blue', border: 'border-blue-500/30 bg-blue-500/5' },
  basse: { label: 'Basse', cls: 'bg-slate-500/20 text-slate-400 text-xs font-semibold px-2.5 py-1 rounded-full', border: 'border-slate-600/40' },
};

const CATEGORY_CONFIG = {
  stock: { icon: Package, color: 'bg-primary-500/20 text-primary-400' },
  promotion: { icon: Tag, color: 'bg-emerald-500/20 text-emerald-400' },
  service_client: { icon: Star, color: 'bg-amber-500/20 text-amber-400' },
  analyse: { icon: BarChart2, color: 'bg-cyan-500/20 text-cyan-400' },
};

export default function RecommendationsPage() {
  const [recs, setRecs] = useState(allRecs.map(r => ({ ...r, done: false })));
  const [filter, setFilter] = useState('tous');

  const markDone = (id) => {
    setRecs(recs.map(r => r.id === id ? { ...r, done: !r.done } : r));
    const rec = recs.find(r => r.id === id);
    toast.success(rec.done ? 'Action remise en attente' : 'Action marquée comme effectuée ! 🎉');
  };

  const filtered = filter === 'tous' ? recs : recs.filter(r =>
    filter === 'done' ? r.done : filter === 'pending' ? !r.done : r.category === filter || r.priority === filter
  );

  const done = recs.filter(r => r.done).length;
  const critiques = recs.filter(r => r.priority === 'critique' && !r.done).length;
  const hautes = recs.filter(r => r.priority === 'haute' && !r.done).length;

  return (
    <Layout title="Recommandations IA">
      {/* Header */}
      <div className="card mb-6 bg-gradient-to-r from-amber-900/30 via-dark-800 to-orange-900/20 border-amber-700/30">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-lg">
            <Lightbulb size={24} className="text-white" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white mb-1">Recommandations Générées par l'IA</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Ces recommandations sont automatiquement générées en analysant vos données de ventes, stocks et avis clients.
              Suivez-les pour optimiser vos performances commerciales.
            </p>
            <div className="flex items-center gap-3 mt-3">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-xs text-slate-400">{done}/{recs.length} actions effectuées</span>
              </div>
              <div className="flex-1 max-w-32 bg-dark-900 rounded-full h-2">
                <div className="h-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all"
                  style={{ width: `${(done / recs.length) * 100}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Recommandations', value: recs.length, color: 'from-primary-500 to-indigo-600' },
          { label: 'Critiques en Attente', value: critiques, color: 'from-red-500 to-rose-600' },
          { label: 'Haute Priorité', value: hautes, color: 'from-amber-500 to-orange-600' },
          { label: 'Actions Effectuées', value: done, color: 'from-emerald-500 to-teal-600' },
        ].map((s, i) => (
          <div key={i} className="card flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center`}>
              <Lightbulb size={20} className="text-white" />
            </div>
            <div>
              <p className="text-xs text-slate-400">{s.label}</p>
              <p className="text-2xl font-bold text-white">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={14} className="text-slate-400" />
          {[
            { key: 'tous', label: 'Toutes' },
            { key: 'critique', label: '🔴 Critique' },
            { key: 'haute', label: '🟡 Haute' },
            { key: 'stock', label: '📦 Stock' },
            { key: 'promotion', label: '🏷️ Promotion' },
            { key: 'service_client', label: '⭐ Service Client' },
            { key: 'pending', label: 'En Attente' },
            { key: 'done', label: '✅ Effectuées' },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${filter === f.key ? 'bg-primary-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div className="space-y-4">
        {filtered.map(rec => {
          const prio = PRIORITY_CONFIG[rec.priority];
          const cat = CATEGORY_CONFIG[rec.category];
          const CatIcon = cat?.icon || Lightbulb;
          return (
            <div key={rec.id}
              className={`card border transition-all duration-300 ${rec.done ? 'opacity-60 border-slate-700/30' : prio.border} hover:shadow-lg animate-slide-up`}>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <span className="text-3xl flex-shrink-0">{rec.icon}</span>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className={`text-sm font-bold ${rec.done ? 'line-through text-slate-500' : 'text-white'}`}>
                        {rec.title}
                      </h3>
                      <span className={prio.cls}>{prio.label}</span>
                      <div className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${cat?.color}`}>
                        <CatIcon size={11} />
                        <span className="capitalize">{rec.category.replace('_', ' ')}</span>
                      </div>
                    </div>
                    <p className="text-sm text-slate-400 mb-3 leading-relaxed">{rec.description}</p>
                    <div className="flex flex-wrap gap-3">
                      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-dark-900/60 border border-slate-700/40">
                        <span className="text-xs text-slate-400">Action :</span>
                        <span className="text-xs font-medium text-slate-200">{rec.action}</span>
                      </div>
                      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <span className="text-xs text-slate-400">Impact :</span>
                        <span className="text-xs font-bold text-emerald-400">{rec.impact}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <button onClick={() => markDone(rec.id)}
                    className={`flex items-center gap-2 text-xs px-4 py-2 rounded-xl font-semibold transition-all ${
                      rec.done
                        ? 'bg-emerald-500/20 text-emerald-400 hover:bg-red-500/20 hover:text-red-400'
                        : 'bg-slate-700 text-slate-300 hover:bg-emerald-500/20 hover:text-emerald-400'
                    }`}>
                    <CheckCircle size={14} />
                    {rec.done ? 'Effectuée ✓' : 'Marquer fait'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="card text-center py-16">
            <CheckCircle size={48} className="mx-auto mb-3 text-emerald-400 opacity-60" />
            <p className="text-slate-300 font-semibold">Aucune recommandation dans cette catégorie</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
