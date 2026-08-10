import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { apiGet } from '../lib/api';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Star, ThumbsUp, ThumbsDown, Minus, MessageSquare } from 'lucide-react';

const SentimentIcon = ({ s }) => {
  if (s === 'positif') return <ThumbsUp size={14} className="text-emerald-400" />;
  if (s === 'négatif') return <ThumbsDown size={14} className="text-red-400" />;
  return <Minus size={14} className="text-amber-400" />;
};

const SentimentBadge = ({ s }) => {
  const cls = s === 'positif' ? 'badge-green' : s === 'négatif' ? 'badge-red' : 'badge-yellow';
  return <span className={cls}>{s}</span>;
};

const Stars = ({ n }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map(i => (
      <Star key={i} size={12} className={i <= n ? 'text-amber-400 fill-amber-400' : 'text-slate-600'} />
    ))}
  </div>
);

const ScoreBar = ({ score }) => {
  const pct = Math.round(score * 100);
  const color = score >= 0.7 ? '#10b981' : score >= 0.4 ? '#f59e0b' : '#ef4444';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-dark-900 rounded-full h-1.5">
        <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-xs font-semibold w-8 text-right" style={{ color }}>{pct}%</span>
    </div>
  );
};

export default function ReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReviews = async () => {
      try {
        const data = await apiGet('/api/analysis/sentiment');
        setReviews(data.reviews || []);
        setStats(data.stats || []);
        setAverageRating(Number(data.averageRating || 0));
        setTotalReviews(Number(data.totalReviews || 0));
      } catch (error) {
        console.error('Failed to load reviews', error);
      } finally {
        setLoading(false);
      }
    };

    loadReviews();
  }, []);

  const pieData = [
    { name: 'Positif', value: Number((stats.find(s => s.sentiment === 'positif')?.percentage || 0)), color: '#10b981' },
    { name: 'Neutre', value: Number((stats.find(s => s.sentiment === 'neutre')?.percentage || 0)), color: '#f59e0b' },
    { name: 'Négatif', value: Number((stats.find(s => s.sentiment === 'négatif')?.percentage || 0)), color: '#ef4444' },
  ];

  const avgScore = Number((reviews.reduce((s, r) => s + Number(r.score || 0), 0) / Math.max(reviews.length, 1) * 100).toFixed(0));

  if (loading) {
    return <Layout title="Analyse des Avis Clients"><div className="card text-center py-16 text-slate-400">Chargement des avis…</div></Layout>;
  }

  return (
    <Layout title="Analyse des Avis Clients">
      {/* Stats Row */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <div className="card flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <Star size={20} className="text-white" />
          </div>
          <div>
            <p className="text-xs text-slate-400">Note Moyenne</p>
            <p className="text-2xl font-bold text-white">{averageRating.toFixed(1)}<span className="text-base text-slate-400">/5</span></p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <ThumbsUp size={20} className="text-white" />
          </div>
          <div>
            <p className="text-xs text-slate-400">Avis Positifs</p>
            <p className="text-2xl font-bold text-white">{stats.find(s => s.sentiment === 'positif')?.count || 0} <span className="text-sm text-emerald-400">({stats.find(s => s.sentiment === 'positif')?.percentage || 0}%)</span></p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center">
            <ThumbsDown size={20} className="text-white" />
          </div>
          <div>
            <p className="text-xs text-slate-400">Avis Négatifs</p>
            <p className="text-2xl font-bold text-white">{stats.find(s => s.sentiment === 'négatif')?.count || 0} <span className="text-sm text-red-400">({stats.find(s => s.sentiment === 'négatif')?.percentage || 0}%)</span></p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center">
            <MessageSquare size={20} className="text-white" />
          </div>
          <div>
            <p className="text-xs text-slate-400">Score Sentiment IA</p>
            <p className="text-2xl font-bold text-white">{avgScore}<span className="text-base text-slate-400">%</span></p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        {/* Sentiment Pie */}
        <div className="card flex flex-col items-center">
          <h3 className="text-base font-bold text-white mb-1 self-start">Distribution des Sentiments</h3>
          <p className="text-xs text-slate-400 mb-4 self-start">Analyse NLP automatique</p>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value">
                {pieData.map((e, i) => <Cell key={i} fill={e.color} stroke="transparent" />)}
              </Pie>
              <Tooltip formatter={(v, n) => [`${v}%`, n]} contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex gap-5 mt-2">
            {pieData.map(d => (
              <div key={d.name} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                <span className="text-xs text-slate-400">{d.name} <strong className="text-white">{d.value}%</strong></span>
              </div>
            ))}
          </div>
        </div>

        {/* Rating Distribution */}
        <div className="card xl:col-span-2">
          <h3 className="text-base font-bold text-white mb-1">Distribution des Notes</h3>
          <p className="text-xs text-slate-400 mb-5">Répartition des évaluations clients</p>
          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map(star => {
              const count = customerReviews.filter(r => r.rating === star).length;
              const pct = Math.round((count / customerReviews.length) * 100);
              return (
                <div key={star} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-14">
                    <Star size={12} className="text-amber-400 fill-amber-400" />
                    <span className="text-xs text-slate-300 font-semibold">{star}</span>
                  </div>
                  <div className="flex-1 bg-dark-900 rounded-full h-2.5">
                    <div className="h-2.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all"
                      style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-slate-400 w-10 text-right">{count} ({pct}%)</span>
                </div>
              );
            })}
          </div>
          <div className="mt-5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-3">
            <Star size={20} className="text-amber-400 fill-amber-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-white">Note globale : {averageRating.toFixed(1)}/5</p>
              <p className="text-xs text-slate-400">Basé sur {totalReviews} avis clients</p>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="card">
        <h3 className="text-base font-bold text-white mb-5">Tous les Avis Clients</h3>
        <div className="space-y-4">
          {reviews.map(review => (
            <div key={review.id} className="p-4 rounded-xl bg-dark-900/50 border border-slate-700/40 hover:border-slate-600/60 transition-all">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {review.customer_name?.[0] || 'C'}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{review.customer_name}</p>
                    <p className="text-xs text-slate-400">{review.product_name || 'Produit'}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <Stars n={review.rating} />
                  <SentimentBadge s={review.sentiment} />
                </div>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed mb-3 italic">"{review.comment}"</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <SentimentIcon s={review.sentiment} />
                  <span>{review.date}</span>
                </div>
                <div className="w-40">
                  <p className="text-xs text-slate-500 mb-1">Score IA : {Math.round(Number(review.score || 0) * 100)}%</p>
                  <ScoreBar score={review.score} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
