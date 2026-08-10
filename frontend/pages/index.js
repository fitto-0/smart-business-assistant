import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { login, isAuthenticated } from '../lib/auth';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Zap, TrendingUp, Brain, Shield } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: 'demo@smartbusiness.com', password: 'demo123' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated()) router.push('/dashboard');
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Connexion réussie ! Bienvenue 👋');
      router.push('/dashboard');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: TrendingUp, text: 'Analyse des ventes en temps réel' },
    { icon: Brain, text: 'Prédictions IA avancées' },
    { icon: Shield, text: 'Détection d\'anomalies automatique' },
    { icon: Zap, text: 'Recommandations intelligentes' },
  ];

  return (
    <div className="min-h-screen bg-dark-900 flex">
      {/* Left Panel */}
      <div className="hidden lg:flex flex-col w-1/2 bg-gradient-to-br from-primary-900 via-dark-900 to-slate-900 p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM2MzY2ZjEiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djZoLTZ2LTZoNnptMC0xMnY2aC02di02aDZ6bS0xMiAxMnY2aC02di02aDZ6bTAtMTJ2NmgtNnYtNmg2eiIvPjwvZz48L2c+PC9zdmc+')] opacity-30"></div>

        {/* Logo */}
        <div className="flex items-center gap-3 mb-16 relative">
          <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-cyan-400 rounded-2xl flex items-center justify-center shadow-2xl">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white">Smart Business</h1>
            <p className="text-xs text-primary-300">Assistant IA Commercial</p>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center relative">
          <h2 className="text-4xl font-extrabold text-white mb-4 leading-tight">
            Transformez vos données en<br />
            <span className="bg-gradient-to-r from-primary-400 to-cyan-400 bg-clip-text text-transparent">décisions intelligentes</span>
          </h2>
          <p className="text-slate-300 text-lg mb-10 leading-relaxed">
            Analysez vos ventes, prédisez l'avenir et optimisez votre business grâce à l'intelligence artificielle.
          </p>
          <div className="space-y-4">
            {features.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary-500/20 flex items-center justify-center flex-shrink-0">
                  <Icon size={16} className="text-primary-400" />
                </div>
                <span className="text-slate-300 text-sm">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-6 text-sm text-slate-400 relative mt-8">
          <span>Sécurisé</span>
          <span>•</span>
          <span>Rapide</span>
          <span>•</span>
          <span>Intelligent</span>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md animate-slide-up">
          {/* Mobile Logo */}
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-cyan-400 rounded-xl flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg font-bold text-white">Smart Business Assistant</h1>
          </div>

          <h2 className="text-3xl font-bold text-white mb-2">Bon retour 👋</h2>
          <p className="text-slate-400 mb-8">Connectez-vous à votre tableau de bord</p>

          {/* Demo Badge */}
          <div className="bg-primary-500/10 border border-primary-500/30 rounded-xl p-3 mb-6 flex items-center gap-2">
            <Zap size={14} className="text-primary-400 flex-shrink-0" />
            <p className="text-xs text-primary-300">
              <strong>Compte démo :</strong> demo@smartbusiness.com / demo123
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Adresse Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="input-field"
                placeholder="votre@email.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Mot de Passe</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  className="input-field pr-12"
                  placeholder="••••••••"
                  required
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200">
                  {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="btn-primary w-full justify-center py-3 text-base shadow-lg shadow-primary-500/20">
              {loading ? (
                <><span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span> Connexion...</>
              ) : 'Se Connecter'}
            </button>
          </form>

          <p className="mt-6 text-center text-slate-400 text-sm">
            Pas encore de compte ?{' '}
            <Link href="/register" className="text-primary-400 hover:text-primary-300 font-semibold">Créer un compte</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
