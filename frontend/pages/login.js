import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { login, isAuthenticated } from '../lib/auth';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Zap, ArrowRight, ShieldCheck, TrendingUp, Brain } from 'lucide-react';

const highlights = [
  { icon: TrendingUp, text: 'Analyse des ventes en temps réel' },
  { icon: Brain, text: 'Prédictions IA avancées' },
  { icon: ShieldCheck, text: 'Détection d’anomalies automatique' },
];

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: 'demo@smartbusiness.com', password: 'demo123' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated()) router.push('/dashboard');
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Connexion réussie ! Bienvenue 👋');
      router.push('/dashboard');
    } catch (err) {
      toast.error(err.message || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell flex items-center justify-center p-4 sm:p-8 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute -top-32 -right-32 w-96 h-96 blob opacity-40" />
      <div className="absolute -bottom-40 -left-32 w-[28rem] h-[28rem] blob opacity-30" />

      <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-0 relative animate-slide-up">
        {/* Left brand panel (desktop) */}
        <div className="hidden lg:flex flex-col justify-between p-12 rounded-l-3xl border border-white/10 bg-white/[0.03]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/30">
              <Zap size={20} className="text-white" />
            </div>
            <div>
              <p className="font-extrabold text-sm">Smart Business</p>
              <p className="text-[10px] uppercase tracking-widest text-white/50">Assistant IA</p>
            </div>
          </div>

          <div>
            <h2 className="text-3xl font-extrabold leading-tight mb-3">
              Welcome back to your <span className="text-gradient-warm">intelligent</span> dashboard
            </h2>
            <p className="text-white/50 text-sm leading-relaxed mb-8">
              Sales analytics, AI predictions and anomaly detection — all in one secure place.
            </p>
            <div className="space-y-3">
              {highlights.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3 text-sm text-white/70">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-400/20 flex items-center justify-center">
                    <Icon size={15} className="text-orange-400" />
                  </div>
                  {text}
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-white/35">© 2024 Smart Business Assistant</p>
        </div>

        {/* Login card */}
        <div className="auth-card p-8 sm:p-10 lg:rounded-l-none">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/30">
              <Zap size={20} className="text-white" />
            </div>
            <div>
              <p className="font-extrabold text-sm">Smart Business</p>
              <p className="text-[10px] uppercase tracking-widest text-white/50">Assistant IA</p>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold mb-2">Bon retour 👋</h1>
          <p className="text-white/50 text-sm mb-8">Connectez-vous à votre tableau de bord</p>

          {/* Demo badge */}
          <div className="flex items-center gap-2.5 rounded-xl border border-orange-400/25 bg-orange-400/10 px-4 py-3 mb-7">
            <Zap size={14} className="text-orange-400 flex-shrink-0" />
            <p className="text-xs text-orange-200/90">
              <strong>Compte démo :</strong> demo@smartbusiness.com / demo123
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Adresse Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="input-field !bg-black/40 !border-white/10 focus:!ring-orange-500"
                placeholder="votre@email.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Mot de Passe</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="input-field !bg-black/40 !border-white/10 focus:!ring-orange-500 pr-12"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition"
                  aria-label="Afficher le mot de passe"
                >
                  {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-accent w-full justify-center !py-3 text-base">
              {loading ? (
                <>
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                  Connexion...
                </>
              ) : (
                <>
                  Se Connecter <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <p className="mt-7 text-center text-sm text-white/50">
            Pas encore de compte ?{' '}
            <Link href="/register" className="text-orange-400 hover:text-orange-300 font-semibold transition-colors">
              Créer un compte
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
