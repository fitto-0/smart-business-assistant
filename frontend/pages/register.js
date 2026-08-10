import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { register } from '../lib/auth';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Zap, CheckCircle } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', company: '', password: '', confirm: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) { toast.error('Les mots de passe ne correspondent pas'); return; }
    if (form.password.length < 6) { toast.error('Le mot de passe doit contenir au moins 6 caractères'); return; }
    setLoading(true);
    try {
      await register(form.name, form.email, form.password, form.company);
      toast.success('Compte créé avec succès !');
      router.push('/');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md animate-slide-up">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-cyan-400 rounded-xl flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-lg font-bold text-white">Smart Business Assistant</h1>
        </div>

        <h2 className="text-3xl font-bold text-white mb-2">Créer un compte</h2>
        <p className="text-slate-400 mb-8">Commencez votre analyse commerciale intelligente</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Nom complet</label>
              <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className="input-field" placeholder="Jean Dupont" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Entreprise</label>
              <input type="text" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })}
                className="input-field" placeholder="Ma Boutique" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
              className="input-field" placeholder="votre@email.com" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Mot de passe</label>
            <div className="relative">
              <input type={showPwd ? 'text' : 'password'} value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                className="input-field pr-12" placeholder="Min. 6 caractères" required />
              <button type="button" onClick={() => setShowPwd(!showPwd)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200">
                {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Confirmer le mot de passe</label>
            <input type="password" value={form.confirm} onChange={e => setForm({ ...form, confirm: e.target.value })}
              className="input-field" placeholder="••••••••" required />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 text-base mt-2">
            {loading ? (
              <><span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span> Création...</>
            ) : <><CheckCircle size={18} /> Créer mon compte</>}
          </button>
        </form>

        <p className="mt-6 text-center text-slate-400 text-sm">
          Déjà un compte ?{' '}
          <Link href="/" className="text-primary-400 hover:text-primary-300 font-semibold">Se connecter</Link>
        </p>
      </div>
    </div>
  );
}
