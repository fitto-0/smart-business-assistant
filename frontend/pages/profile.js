import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { getUser, updateProfile, changePassword, toggleEmailNotifications, toggleTwoFactorAuth, setupTwoFactorAuth, verifyTwoFactorAuth, disableTwoFactorAuth } from '../lib/auth';
import { apiGet } from '../lib/api';
import { useLanguage } from '../lib/LanguageContext';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';
import { User, Mail, Building, Save, Shield, Bell, Lock, X, Globe } from 'lucide-react';

export default function ProfilePage() {
  const { language, setLanguage, t } = useLanguage();
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ name: '', company: '', email: '' });
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ logins: 0, analyses: 0, activeDays: 0 });
  const [security, setSecurity] = useState({
    daysSincePasswordChange: 0,
    emailNotificationsEnabled: true,
    twoFactorEnabled: false
  });
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [twoFactorStep, setTwoFactorStep] = useState('setup'); // 'setup' or 'verify'
  const [qrCode, setQrCode] = useState(null);
  const [twoFactorToken, setTwoFactorToken] = useState('');
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);
  const [showDisable2FAModal, setShowDisable2FAModal] = useState(false);
  const [disable2FAPassword, setDisable2FAPassword] = useState('');

  useEffect(() => {
    const u = getUser();
    if (u) { setUser(u); setForm({ name: u.name, company: u.company || '', email: u.email }); }
    
    // Fetch user stats
    const fetchStats = async () => {
      try {
        console.log('Fetching stats...');
        console.log('Current cookies:', document.cookie);
        const token = Cookies.get('sba_token');
        console.log('Direct token check:', token ? 'exists' : 'missing');

        const data = await apiGet('/auth/stats');
        console.log('Stats received:', data);
        setStats(data);
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      }
    };

    // Fetch security info
    const fetchSecurity = async () => {
      try {
        const data = await apiGet('/auth/security');
        console.log('Security received:', data);
        setSecurity(data);
      } catch (err) {
        console.error('Failed to fetch security:', err);
      }
    };

    fetchStats();
    fetchSecurity();
  }, []);

  const handleSave = async () => {
    if (!form.name) { toast.error(t('profile.nameRequired')); return; }
    setLoading(true);
    try {
      const updated = await updateProfile({ name: form.name, company: form.company, language });
      setUser(updated);
      toast.success(t('profile.profileUpdated'));
    } catch (err) {
      toast.error(err.message || t('profile.profileUpdateFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!passwordForm.oldPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast.error(t('profile.allFieldsRequired'));
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error(t('profile.passwordsDoNotMatch'));
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error(t('profile.passwordMinLength'));
      return;
    }

    setPasswordLoading(true);
    try {
      await changePassword(passwordForm.oldPassword, passwordForm.newPassword);
      toast.success(t('profile.passwordChanged'));
      setShowPasswordModal(false);
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      // Refresh security data
      const securityData = await apiGet('/auth/security');
      setSecurity(securityData);
    } catch (err) {
      toast.error(err.message || t('profile.passwordChangeFailed'));
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleToggleNotifications = async () => {
    try {
      const response = await toggleEmailNotifications(!security.emailNotificationsEnabled);
      setSecurity({ ...security, emailNotificationsEnabled: response.emailNotificationsEnabled });
      toast.success(response.message || t('profile.notificationsToggled'));
    } catch (err) {
      toast.error(err.message || t('profile.notificationsToggleFailed'));
    }
  };

  const handleToggle2FA = async () => {
    if (security.twoFactorEnabled) {
      // Show disable modal
      setShowDisable2FAModal(true);
    } else {
      // Start setup flow
      setTwoFactorStep('setup');
      setShow2FAModal(true);
      setQrCode(null);
      setTwoFactorToken('');
      try {
        const response = await setupTwoFactorAuth();
        setQrCode(response.qrCode);
      } catch (err) {
        toast.error(err.message || t('profile.setup2FAFailed'));
        setShow2FAModal(false);
      }
    }
  };

  const handleVerify2FA = async () => {
    if (!twoFactorToken || twoFactorToken.length !== 6) {
      toast.error(t('profile.validCodeRequired'));
      return;
    }

    setTwoFactorLoading(true);
    try {
      const response = await verifyTwoFactorAuth(twoFactorToken);
      toast.success(response.message || t('profile.setup2FASuccess'));
      setShow2FAModal(false);
      setSecurity({ ...security, twoFactorEnabled: true });
      setTwoFactorToken('');
    } catch (err) {
      toast.error(err.message || t('profile.invalidCode'));
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!disable2FAPassword) {
      toast.error(t('profile.passwordRequired'));
      return;
    }

    try {
      const response = await disableTwoFactorAuth(disable2FAPassword);
      toast.success(response.message || t('profile.disable2FASuccess'));
      setShowDisable2FAModal(false);
      setSecurity({ ...security, twoFactorEnabled: false });
      setDisable2FAPassword('');
    } catch (err) {
      toast.error(err.message || t('profile.disable2FAFailed'));
    }
  };

  if (!user) return null;

  return (
    <Layout title={t('profile.title')}>
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
              <span className="portal-label bg-teal/10 text-teal px-2 py-1 rounded">{t('profile.activeAccount')}</span>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <div className="bg-ground-secondary border hairline rounded-xl p-5">
          <h3 className="portal-heading text-base mb-5 flex items-center gap-2">
            <User size={18} className="text-amber" /> {t('profile.personalInfo')}
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block portal-label mb-2">{t('profile.fullName')}</label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-ground border hairline rounded-xl px-4 py-2 pl-10 text-ink placeholder-muted focus:outline-none focus:border-amber transition-colors" placeholder={t('profile.yourName')} />
              </div>
            </div>
            <div>
              <label className="block portal-label mb-2">{t('profile.emailAddress')}</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                <input type="email" value={form.email} disabled
                  className="w-full bg-ground border hairline rounded-xl px-4 py-2 pl-10 text-ink opacity-50 cursor-not-allowed" />
              </div>
              <p className="portal-label text-muted mt-1">{t('profile.emailCannotChange')}</p>
            </div>
            <div>
              <label className="block portal-label mb-2">{t('profile.companyName')}</label>
              <div className="relative">
                <Building size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                <input type="text" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })}
                  className="w-full bg-ground border hairline rounded-xl px-4 py-2 pl-10 text-ink placeholder-muted focus:outline-none focus:border-amber transition-colors" placeholder={t('profile.yourCompany')} />
              </div>
            </div>
            <button onClick={handleSave} disabled={loading} className="portal-pill-btn">
              {loading ? <span className="animate-spin rounded-full h-4 w-4 border-2 border-amber border-t-transparent"></span> : <Save size={16} />}
              {t('profile.saveChanges')}
            </button>
          </div>
        </div>

        {/* Security */}
        <div className="bg-ground-secondary border hairline rounded-xl p-5">
          <h3 className="portal-heading text-base mb-5 flex items-center gap-2">
            <Shield size={18} className="text-teal" /> {t('profile.security')}
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 rounded-xl bg-ground/50 border hairline hover:border-amber/30 transition-all">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-ground flex items-center justify-center">
                  <Lock size={16} className="text-muted" />
                </div>
                <div>
                  <p className="portal-label font-semibold text-ink">{t('profile.changePassword')}</p>
                  <p className="portal-label text-muted">
                    Last changed {security.daysSincePasswordChange === 0 ? 'today' : `${security.daysSincePasswordChange} days ago`}
                  </p>
                </div>
              </div>
              <button onClick={() => setShowPasswordModal(true)} className="w-full bg-ground border hairline rounded-xl px-3 py-1.5 portal-label text-ink-secondary hover:bg-ground/50 transition-colors text-xs">{t('common.edit')}</button>
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl bg-ground/50 border hairline hover:border-amber/30 transition-all">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-ground flex items-center justify-center">
                  <Bell size={16} className="text-muted" />
                </div>
                <div>
                  <p className="portal-label font-semibold text-ink">{t('profile.emailNotifications')}</p>
                  <p className="portal-label text-muted">
                    {security.emailNotificationsEnabled ? t('profile.twoFactorEnabled') : t('profile.twoFactorDisabled')}
                  </p>
                </div>
              </div>
              <button onClick={handleToggleNotifications} className="w-full bg-ground border hairline rounded-xl px-3 py-1.5 portal-label text-ink-secondary hover:bg-ground/50 transition-colors text-xs">
                {security.emailNotificationsEnabled ? t('common.disable') : t('common.enable')}
              </button>
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl bg-ground/50 border hairline hover:border-amber/30 transition-all">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-ground flex items-center justify-center">
                  <Shield size={16} className="text-muted" />
                </div>
                <div>
                  <p className="portal-label font-semibold text-ink">{t('profile.twoFactorAuth')}</p>
                  <p className="portal-label text-muted">
                    {security.twoFactorEnabled ? t('profile.twoFactorEnabled') : t('profile.twoFactorDisabled')}
                  </p>
                </div>
              </div>
              <button onClick={handleToggle2FA} className="w-full bg-ground border hairline rounded-xl px-3 py-1.5 portal-label text-ink-secondary hover:bg-ground/50 transition-colors text-xs">
                {security.twoFactorEnabled ? t('profile.disable2FA') : t('profile.enable2FA')}
              </button>
            </div>
          </div>
        </div>

        {/* Language Preference */}
        <div className="bg-ground-secondary border hairline rounded-xl p-5">
          <h3 className="portal-heading text-base mb-5 flex items-center gap-2">
            <Globe size={18} className="text-amber" /> {t('profile.languagePreference')}
          </h3>
          <div className="space-y-3">
            <button
              onClick={() => setLanguage('en')}
              className={`w-full flex items-center gap-3 p-4 rounded-xl border hairline transition-all ${language === 'en' ? 'bg-amber/10 border-amber' : 'bg-ground/50 hover:bg-ground'}`}
            >
              <span className="text-2xl">🇺🇸</span>
              <div className="flex-1 text-left">
                <p className="portal-label font-semibold text-ink">{t('profile.english')}</p>
                <p className="portal-label text-muted">English</p>
              </div>
              {language === 'en' && <div className="w-4 h-4 rounded-full bg-amber" />}
            </button>
            <button
              onClick={() => setLanguage('fr')}
              className={`w-full flex items-center gap-3 p-4 rounded-xl border hairline transition-all ${language === 'fr' ? 'bg-amber/10 border-amber' : 'bg-ground/50 hover:bg-ground'}`}
            >
              <span className="text-2xl">🇫🇷</span>
              <div className="flex-1 text-left">
                <p className="portal-label font-semibold text-ink">{t('profile.french')}</p>
                <p className="portal-label text-muted">Français</p>
              </div>
              {language === 'fr' && <div className="w-4 h-4 rounded-full bg-amber" />}
            </button>
            <button
              onClick={() => setLanguage('ar')}
              className={`w-full flex items-center gap-3 p-4 rounded-xl border hairline transition-all ${language === 'ar' ? 'bg-amber/10 border-amber' : 'bg-ground/50 hover:bg-ground'}`}
            >
              <span className="text-2xl">🇲🇦</span>
              <div className="flex-1 text-right">
                <p className="portal-label font-semibold text-ink">{t('profile.arabic')}</p>
                <p className="portal-label text-muted">العربية</p>
              </div>
              {language === 'ar' && <div className="w-4 h-4 rounded-full bg-amber" />}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-ground-secondary border hairline rounded-xl p-5">
          <h3 className="portal-heading text-base mb-4">{t('profile.yourStats')}</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 rounded-xl bg-ground/50 border hairline">
              <p className="portal-heading text-2xl text-amber">{stats.logins}</p>
              <p className="portal-label mt-0.5">{t('profile.totalLogins')}</p>
            </div>
            <div className="p-3 rounded-xl bg-ground/50 border hairline">
              <p className="portal-heading text-2xl text-amber">{stats.analyses}</p>
              <p className="portal-label mt-0.5">{t('profile.totalAnalyses')}</p>
            </div>
            <div className="p-3 rounded-xl bg-ground/50 border hairline">
              <p className="portal-heading text-2xl text-amber">{stats.activeDays}</p>
              <p className="portal-label mt-0.5">{t('profile.activeDays')}</p>
            </div>
          </div>
        </div>

        {/* Password Change Modal */}
        {showPasswordModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-ground-secondary border hairline rounded-xl p-6 w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-5">
                <h3 className="portal-heading text-lg">{t('profile.changePassword')}</h3>
                <button onClick={() => setShowPasswordModal(false)} className="text-muted hover:text-ink">
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block portal-label mb-2">{t('profile.oldPassword')}</label>
                  <input
                    type="password"
                    value={passwordForm.oldPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                    className="w-full bg-ground border hairline rounded-xl px-4 py-2 text-ink placeholder-muted focus:outline-none focus:border-amber transition-colors"
                    placeholder={t('profile.oldPassword')}
                  />
                </div>
                <div>
                  <label className="block portal-label mb-2">{t('profile.newPassword')}</label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="w-full bg-ground border hairline rounded-xl px-4 py-2 text-ink placeholder-muted focus:outline-none focus:border-amber transition-colors"
                    placeholder={t('profile.newPassword')}
                  />
                </div>
                <div>
                  <label className="block portal-label mb-2">{t('profile.confirmPassword')}</label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="w-full bg-ground border hairline rounded-xl px-4 py-2 text-ink placeholder-muted focus:outline-none focus:border-amber transition-colors"
                    placeholder={t('profile.confirmPassword')}
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowPasswordModal(false)}
                    className="flex-1 bg-ground border hairline rounded-xl px-4 py-2 portal-label text-ink hover:bg-ground/50 transition-colors"
                  >
                    {t('profile.cancel')}
                  </button>
                  <button
                    onClick={handlePasswordChange}
                    disabled={passwordLoading}
                    className="flex-1 portal-pill-btn"
                  >
                    {passwordLoading ? (
                      <span className="animate-spin rounded-full h-4 w-4 border-2 border-amber border-t-transparent"></span>
                    ) : (
                      t('profile.changePassword')
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2FA Setup Modal */}
        {show2FAModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-ground-secondary border hairline rounded-xl p-6 w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-5">
                <h3 className="portal-heading text-lg">{t('profile.setup2FA')}</h3>
                <button onClick={() => setShow2FAModal(false)} className="text-muted hover:text-ink">
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-4">
                {twoFactorStep === 'setup' && qrCode && (
                  <>
                    <div className="text-center">
                      <p className="portal-label mb-4">{t('profile.scanQR')}</p>
                      <div className="inline-block p-4 bg-white rounded-xl">
                        <img src={qrCode} alt="QR Code" className="w-48 h-48" />
                      </div>
                    </div>
                    <button
                      onClick={() => setTwoFactorStep('verify')}
                      className="w-full portal-pill-btn"
                    >
                      {t('profile.verifyCode')}
                    </button>
                  </>
                )}
                {twoFactorStep === 'verify' && (
                  <>
                    <p className="portal-label text-center">{t('profile.enterCode')}</p>
                    <div>
                      <input
                        type="text"
                        value={twoFactorToken}
                        onChange={(e) => setTwoFactorToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="w-full bg-ground border hairline rounded-xl px-4 py-3 text-ink text-center text-2xl tracking-widest placeholder-muted focus:outline-none focus:border-amber transition-colors"
                        placeholder="000000"
                        maxLength={6}
                      />
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={() => setTwoFactorStep('setup')}
                        className="flex-1 bg-ground border hairline rounded-xl px-4 py-2 portal-label text-ink hover:bg-ground/50 transition-colors"
                      >
                        {t('common.back')}
                      </button>
                      <button
                        onClick={handleVerify2FA}
                        disabled={twoFactorLoading}
                        className="flex-1 portal-pill-btn"
                      >
                        {twoFactorLoading ? (
                          <span className="animate-spin rounded-full h-4 w-4 border-2 border-amber border-t-transparent"></span>
                        ) : (
                          t('profile.verifyCode')
                        )}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Disable 2FA Modal */}
        {showDisable2FAModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-ground-secondary border hairline rounded-xl p-6 w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-5">
                <h3 className="portal-heading text-lg">Disable Two-Factor Authentication</h3>
                <button onClick={() => setShowDisable2FAModal(false)} className="text-muted hover:text-ink">
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-4">
                <p className="portal-label text-muted">Enter your password to disable 2FA</p>
                <div>
                  <label className="block portal-label mb-2">Password</label>
                  <input
                    type="password"
                    value={disable2FAPassword}
                    onChange={(e) => setDisable2FAPassword(e.target.value)}
                    className="w-full bg-ground border hairline rounded-xl px-4 py-2 text-ink placeholder-muted focus:outline-none focus:border-amber transition-colors"
                    placeholder="Enter your password"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowDisable2FAModal(false)}
                    className="flex-1 bg-ground border hairline rounded-xl px-4 py-2 portal-label text-ink hover:bg-ground/50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDisable2FA}
                    className="flex-1 portal-pill-btn"
                  >
                    Disable 2FA
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
