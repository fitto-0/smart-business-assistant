import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { getUser, updateProfile } from '../lib/auth';
import toast from 'react-hot-toast';
import { User, Mail, Building, Save, Shield, Bell, Lock } from 'lucide-react';

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ name: '', company: '', email: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const u = getUser();
    if (u) { setUser(u); setForm({ name: u.name, company: u.company || '', email: u.email }); }
  }, []);

  const handleSave = async () => {
    if (!form.name) { toast.error('Le nom est requis'); return; }
    setLoading(true);
    try {
      const updated = await updateProfile({ name: form.name, company: form.company });
      setUser(updated);
      toast.success('Profil mis à jour avec succès !');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Layout title="Mon Profil">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Profile Header */}
        <div className="card flex items-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold shadow-xl">
            {user.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">{user.name}</h2>
            <p className="text-slate-400">{user.email}</p>
            {user.company && <p className="text-sm text-primary-400 mt-1 font-medium">{user.company}</p>}
            <div className="flex gap-2 mt-2">
              <span className="badge-blue capitalize">{user.role}</span>
              <span className="badge-green">Compte Actif</span>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <div className="card">
          <h3 className="text-base font-bold text-white mb-5 flex items-center gap-2">
            <User size={18} className="text-primary-400" /> Informations Personnelles
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Nom Complet</label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  className="input-field pl-10" placeholder="Votre nom" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Adresse Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="email" value={form.email} disabled
                  className="input-field pl-10 opacity-50 cursor-not-allowed" />
              </div>
              <p className="text-xs text-slate-500 mt-1">L'email ne peut pas être modifié</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Nom de l'Entreprise</label>
              <div className="relative">
                <Building size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })}
                  className="input-field pl-10" placeholder="Votre entreprise" />
              </div>
            </div>
            <button onClick={handleSave} disabled={loading} className="btn-primary">
              {loading ? <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span> : <Save size={16} />}
              Enregistrer les modifications
            </button>
          </div>
        </div>

        {/* Security */}
        <div className="card">
          <h3 className="text-base font-bold text-white mb-5 flex items-center gap-2">
            <Shield size={18} className="text-emerald-400" /> Sécurité & Confidentialité
          </h3>
          <div className="space-y-3">
            {[
              { icon: Lock, title: 'Changer le mot de passe', desc: 'Dernière modification il y a 30 jours', btn: 'Modifier' },
              { icon: Bell, title: 'Notifications par email', desc: 'Recevoir les alertes et recommandations', btn: 'Configurer' },
              { icon: Shield, title: 'Authentification à deux facteurs', desc: 'Sécurité supplémentaire non activée', btn: 'Activer' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-dark-900/50 border border-slate-700/40 hover:border-slate-600/60 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-700/50 flex items-center justify-center">
                    <item.icon size={16} className="text-slate-300" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{item.title}</p>
                    <p className="text-xs text-slate-500">{item.desc}</p>
                  </div>
                </div>
                <button className="btn-secondary py-1.5 px-3 text-xs">{item.btn}</button>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="card">
          <h3 className="text-base font-bold text-white mb-4">Activité du Compte</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { label: 'Connexions', value: '47' },
              { label: 'Analyses', value: '128' },
              { label: 'Jours actifs', value: '23' },
            ].map((s, i) => (
              <div key={i} className="p-3 rounded-xl bg-dark-900/50 border border-slate-700/40">
                <p className="text-2xl font-bold text-primary-400">{s.value}</p>
                <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
