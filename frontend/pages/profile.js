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
    if (!form.name) { toast.error('Name is required'); return; }
    setLoading(true);
    try {
      const updated = await updateProfile({ name: form.name, company: form.company });
      setUser(updated);
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Layout title="My Profile">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Profile Header */}
        <div className="bg-ground-secondary border hairline rounded-xl p-6 flex items-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-amber flex items-center justify-center text-ground text-3xl font-bold">
            {user.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <h2 className="portal-heading text-2xl">{user.name}</h2>
            <p className="portal-text">{user.email}</p>
            {user.company && <p className="portal-label text-amber mt-1 font-medium">{user.company}</p>}
            <div className="flex gap-2 mt-2">
              <span className="portal-label bg-teal/10 text-teal px-2 py-1 rounded capitalize">{user.role}</span>
              <span className="portal-label bg-teal/10 text-teal px-2 py-1 rounded">Active Account</span>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <div className="bg-ground-secondary border hairline rounded-xl p-5">
          <h3 className="portal-heading text-base mb-5 flex items-center gap-2">
            <User size={18} className="text-amber" /> Personal Information
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block portal-label mb-2">Full Name</label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-ground border hairline rounded-xl px-4 py-2 pl-10 text-ink placeholder-muted focus:outline-none focus:border-amber transition-colors" placeholder="Your name" />
              </div>
            </div>
            <div>
              <label className="block portal-label mb-2">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                <input type="email" value={form.email} disabled
                  className="w-full bg-ground border hairline rounded-xl px-4 py-2 pl-10 text-ink opacity-50 cursor-not-allowed" />
              </div>
              <p className="portal-label text-muted mt-1">Email cannot be changed</p>
            </div>
            <div>
              <label className="block portal-label mb-2">Company Name</label>
              <div className="relative">
                <Building size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                <input type="text" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })}
                  className="w-full bg-ground border hairline rounded-xl px-4 py-2 pl-10 text-ink placeholder-muted focus:outline-none focus:border-amber transition-colors" placeholder="Your company" />
              </div>
            </div>
            <button onClick={handleSave} disabled={loading} className="portal-pill-btn">
              {loading ? <span className="animate-spin rounded-full h-4 w-4 border-2 border-amber border-t-transparent"></span> : <Save size={16} />}
              Save Changes
            </button>
          </div>
        </div>

        {/* Security */}
        <div className="bg-ground-secondary border hairline rounded-xl p-5">
          <h3 className="portal-heading text-base mb-5 flex items-center gap-2">
            <Shield size={18} className="text-teal" /> Security & Privacy
          </h3>
          <div className="space-y-3">
            {[
              { icon: Lock, title: 'Change Password', desc: 'Last changed 30 days ago', btn: 'Change' },
              { icon: Bell, title: 'Email Notifications', desc: 'Receive alerts and recommendations', btn: 'Configure' },
              { icon: Shield, title: 'Two-Factor Authentication', desc: 'Additional security not enabled', btn: 'Enable' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-ground/50 border hairline hover:border-amber/30 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-ground flex items-center justify-center">
                    <item.icon size={16} className="text-muted" />
                  </div>
                  <div>
                    <p className="portal-label font-semibold text-ink">{item.title}</p>
                    <p className="portal-label text-muted">{item.desc}</p>
                  </div>
                </div>
                <button className="w-full bg-ground border hairline rounded-xl px-4 py-2 portal-label text-ink-secondary hover:bg-ground/50 transition-colors py-1.5 px-3 text-xs">{item.btn}</button>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="bg-ground-secondary border hairline rounded-xl p-5">
          <h3 className="portal-heading text-base mb-4">Account Activity</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { label: 'Logins', value: '47' },
              { label: 'Analyses', value: '128' },
              { label: 'Active Days', value: '23' },
            ].map((s, i) => (
              <div key={i} className="p-3 rounded-xl bg-ground/50 border hairline">
                <p className="portal-heading text-2xl text-amber">{s.value}</p>
                <p className="portal-label mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
