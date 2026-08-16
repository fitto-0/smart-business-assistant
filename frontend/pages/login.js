import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { login, isAuthenticated } from '../lib/auth';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Zap, ArrowRight, ShieldCheck, TrendingUp, Brain } from 'lucide-react';

const highlights = [
  { icon: TrendingUp, text: 'Real-time sales analytics' },
  { icon: Brain, text: 'Advanced AI predictions' },
  { icon: ShieldCheck, text: 'Automatic anomaly detection' },
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
      toast.success('Login successful! Welcome 👋');
      router.push('/dashboard');
    } catch (err) {
      toast.error(err.message || 'Login error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ground flex items-center justify-center p-4 sm:p-8 relative overflow-hidden">
      <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-0 relative animate-slide-up">
        {/* Left brand panel (desktop) */}
        <div className="hidden lg:flex flex-col justify-between p-12 rounded-l-3xl border hairline bg-ground-secondary">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber flex items-center justify-center shadow-lg">
              <Zap size={20} className="text-ground" />
            </div>
            <div>
              <p className="portal-heading text-ink text-sm">Smart Business</p>
              <p className="portal-label text-muted">AI Assistant</p>
            </div>
          </div>

          <div>
            <h2 className="portal-heading text-3xl leading-tight mb-3">
              Welcome back to your <span className="text-amber">intelligent</span> dashboard
            </h2>
            <p className="portal-text mb-8">
              Sales analytics, AI predictions and anomaly detection — all in one secure place.
            </p>
            <div className="space-y-3">
              {highlights.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3 portal-text">
                  <div className="w-8 h-8 rounded-lg bg-amber/10 border hairline flex items-center justify-center">
                    <Icon size={15} className="text-amber" />
                  </div>
                  {text}
                </div>
              ))}
            </div>
          </div>

          <p className="portal-label text-muted">© 2024 Smart Business Assistant</p>
        </div>

        {/* Login card */}
        <div className="p-8 sm:p-10 lg:rounded-l-none bg-ground border hairline lg:border-l-0 lg:rounded-r-3xl">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-amber flex items-center justify-center shadow-lg">
              <Zap size={20} className="text-ground" />
            </div>
            <div>
              <p className="portal-heading text-ink text-sm">Smart Business</p>
              <p className="portal-label text-muted">AI Assistant</p>
            </div>
          </div>

          <h1 className="portal-heading text-2xl sm:text-3xl mb-2">Welcome back 👋</h1>
          <p className="portal-text mb-8">Sign in to your dashboard</p>

          {/* Demo badge */}
          <div className="flex items-center gap-2.5 rounded-xl border hairline bg-amber/10 px-4 py-3 mb-7">
            <Zap size={14} className="text-amber flex-shrink-0" />
            <p className="portal-label text-ink-secondary">
              <strong>Demo account:</strong> demo@smartbusiness.com / demo123
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block portal-label mb-2">Email Address</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full bg-ground-secondary border hairline rounded-xl px-4 py-3 text-ink placeholder-muted focus:outline-none focus:border-amber transition-colors"
                placeholder="your@email.com"
                required
              />
            </div>
            <div>
              <label className="block portal-label mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full bg-ground-secondary border hairline rounded-xl px-4 py-3 text-ink placeholder-muted focus:outline-none focus:border-amber transition-colors pr-12"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-ink transition"
                  aria-label="Show password"
                >
                  {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="portal-pill-btn w-full justify-center !py-3 text-base">
              {loading ? (
                <>
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-amber border-t-transparent"></span>
                  Signing in...
                </>
              ) : (
                <>
                  Sign In <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <p className="mt-7 text-center portal-text">
            Don't have an account?{' '}
            <Link href="/register" className="text-amber hover:text-amber/80 font-semibold transition-colors">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
