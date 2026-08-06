import { useState } from 'react';
import Layout from '../components/Layout';
import { anomalies as initialAnomalies } from '../data/mockData';
import toast from 'react-hot-toast';
import { AlertTriangle, CheckCircle, Clock, XCircle, TrendingDown, Package, Star, RefreshCw } from 'lucide-react';

const SEVERITY_CONFIG = {
  critique: { label: 'Critique', cls: 'badge-red', dot: 'bg-red-500', border: 'border-red-500/30 bg-red-500/5' },
  haute: { label: 'Haute', cls: 'badge-yellow', dot: 'bg-amber-500', border: 'border-amber-500/30 bg-amber-500/5' },
  moyenne: { label: 'Moyenne', cls: 'badge-blue', dot: 'bg-blue-500', border: 'border-blue-500/30 bg-blue-500/5' },
};

const STATUS_CONFIG = {
  non_résolu: { label: 'Non Résolu', icon: XCircle, cls: 'text-red-400' },
  en_cours: { label: 'En Cours', icon: Clock, cls: 'text-amber-400' },
  résolu: { label: 'Résolu', icon: CheckCircle, cls: 'text-emerald-400' },
};

const TYPE_ICONS = {
  baisse_ventes: TrendingDown,
  rupture_stock: Package,
  stock_faible: Package,
  avis_négatifs: Star,
};

export default function AnomaliesPage() {
  const [anomalies, setAnomalies] = useState(initialAnomalies);
  const [filter, setFilter] = useState('tous');

  const markResolved = (id) => {
    setAnomalies(anomalies.map(a => a.id === id ? { ...a, status: 'résolu' } : a));
    toast.success('Anomalie marquée comme résolue ✓');
  };
  const markInProgress = (id) => {
    setAnomalies(anomalies.map(a => a.id === id ? { ...a, status: 'en_cours' } : a));
    toast.success('Anomalie mise en cours de traitement');
  };

  const filtered = filter === 'tous' ? anomalies : anomalies.filter(a =>
    filter === 'non_résolu' ? a.status === 'non_résolu' :
    filter === 'en_cours' ? a.status === 'en_cours' :
    filter === 'résolu' ? a.status === 'résolu' :
    a.severity === filter
  );

  const critiques = anomalies.filter(a => a.severity === 'critique').length;
  const hautes = anomalies.filter(a => a.severity === 'haute').length;
  const nonResolus = anomalies.filter(a => a.status === 'non_résolu').length;
  const resolus = anomalies.filter(a => a.status === 'résolu').length;

  return (
    <Layout title="Détection d'Anomalies">
      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Anomalies Critiques', value: critiques, color: 'from-red-500 to-rose-600', icon: AlertTriangle },
          { label: 'Priorité Haute', value: hautes, color: 'from-amber-500 to-orange-600', icon: AlertTriangle },
          { label: 'Non Résolues', value: nonResolus, color: 'from-orange-500 to-red-600', icon: XCircle },
          { label: 'Résolues', value: resolus, color: 'from-emerald-500 to-teal-600', icon: CheckCircle },
        ].map((s, i) => (
          <div key={i} className="card flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center`}>
              <s.icon size={20} className="text-white" />
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
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'tous', label: 'Toutes' },
            { key: 'critique', label: '🔴 Critique' },
            { key: 'haute', label: '🟡 Haute' },
            { key: 'moyenne', label: '🔵 Moyenne' },
            { key: 'non_résolu', label: 'Non Résolues' },
            { key: 'en_cours', label: 'En Cours' },
            { key: 'résolu', label: 'Résolues' },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${filter === f.key ? 'bg-primary-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Anomalies List */}
      <div className="space-y-4">
        {filtered.length === 0 && (
          <div className="card text-center py-16">
            <CheckCircle size={48} className="mx-auto mb-3 text-emerald-400 opacity-60" />
            <p className="text-slate-300 font-semibold">Aucune anomalie dans cette catégorie</p>
            <p className="text-xs text-slate-500 mt-1">Tout semble être en ordre !</p>
          </div>
        )}
        {filtered.map(a => {
          const sev = SEVERITY_CONFIG[a.severity];
          const sta = STATUS_CONFIG[a.status];
          const TypeIcon = TYPE_ICONS[a.type] || AlertTriangle;
          return (
            <div key={a.id} className={`card border ${sev.border} transition-all hover:shadow-lg animate-slide-up`}>
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div className={`w-12 h-12 rounded-xl ${a.severity === 'critique' ? 'bg-red-500/20' : a.severity === 'haute' ? 'bg-amber-500/20' : 'bg-blue-500/20'} flex items-center justify-center flex-shrink-0`}>
                  <TypeIcon size={22} className={a.severity === 'critique' ? 'text-red-400' : a.severity === 'haute' ? 'text-amber-400' : 'text-blue-400'} />
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h3 className="text-sm font-bold text-white">{a.product}</h3>
                    <span className={sev.cls}>{sev.label}</span>
                    <div className={`flex items-center gap-1 ${sta.cls}`}>
                      <sta.icon size={12} />
                      <span className="text-xs font-medium">{sta.label}</span>
                    </div>
                  </div>
                  <p className="text-sm text-slate-300 mb-1">{a.description}</p>
                  <p className="text-xs text-slate-500">Détecté le {a.detected}</p>
                </div>
                <div className="flex sm:flex-col gap-2 flex-shrink-0">
                  {a.status !== 'résolu' && (
                    <>
                      {a.status === 'non_résolu' && (
                        <button onClick={() => markInProgress(a.id)}
                          className="text-xs px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition-all font-medium flex items-center gap-1">
                          <Clock size={12} /> En cours
                        </button>
                      )}
                      <button onClick={() => markResolved(a.id)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-all font-medium flex items-center gap-1">
                        <CheckCircle size={12} /> Résoudre
                      </button>
                    </>
                  )}
                  {a.status === 'résolu' && (
                    <span className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 font-medium flex items-center gap-1">
                      <CheckCircle size={12} /> Résolu
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Layout>
  );
}
