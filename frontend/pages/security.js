import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { apiGet, apiPost, apiPut, apiDelete } from "../lib/api";
import { useLanguage } from "../lib/LanguageContext";
import {
  Shield,
  Lock,
  Smartphone,
  Globe,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  AlertTriangle,
  CheckCircle,
  Copy,
} from "lucide-react";
import toast from "react-hot-toast";

export default function Security() {
  const { t } = useLanguage();
  const [twoFA, setTwoFA] = useState({ enabled: false });
  const [ipWhitelist, setIpWhitelist] = useState({ ip_addresses: [], status: 'inactive' });
  const [newIp, setNewIp] = useState('');
  const [securityEvents, setSecurityEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrCodeData, setQrCodeData] = useState(null);
  const [verifyToken, setVerifyToken] = useState('');

  useEffect(() => {
    loadSecurityData();
  }, []);

  const loadSecurityData = async () => {
    try {
      const [twoFaStatus, whitelist, events] = await Promise.all([
        apiGet('/security/2fa/status'),
        apiGet('/security/ip-whitelist'),
        apiGet('/security/events'),
      ]);

      setTwoFA(twoFaStatus);
      setIpWhitelist(whitelist);
      setSecurityEvents(events.events || []);
    } catch (error) {
      console.error('Failed to load security data', error);
    } finally {
      setLoading(false);
    }
  };

  const setup2FA = async () => {
    try {
      const result = await apiPost('/security/2fa/setup');
      setQrCodeData(result);
      setShowQRCode(true);
      toast.success('2FA setup initiated');
    } catch (error) {
      toast.error('Failed to setup 2FA');
    }
  };

  const enable2FA = async () => {
    try {
      await apiPost('/security/2fa/enable', { token: verifyToken });
      setTwoFA({ enabled: true });
      setShowQRCode(false);
      setVerifyToken('');
      toast.success('2FA enabled successfully');
    } catch (error) {
      toast.error('Failed to enable 2FA. Please check the token.');
    }
  };

  const disable2FA = async () => {
    try {
      await apiPost('/security/2fa/disable', { token: verifyToken });
      setTwoFA({ enabled: false });
      setVerifyToken('');
      toast.success('2FA disabled');
    } catch (error) {
      toast.error('Failed to disable 2FA');
    }
  };

  const addIpToWhitelist = async () => {
    if (!newIp) return;

    try {
      await apiPost('/security/ip-whitelist', { ip: newIp });
      setIpWhitelist(prev => ({
        ...prev,
        ip_addresses: [...prev.ip_addresses, newIp],
      }));
      setNewIp('');
      toast.success('IP added to whitelist');
    } catch (error) {
      toast.error('Failed to add IP to whitelist');
    }
  };

  const removeIpFromWhitelist = async (ip) => {
    try {
      await apiDelete(`/security/ip-whitelist/${encodeURIComponent(ip)}`);
      setIpWhitelist(prev => ({
        ...prev,
        ip_addresses: prev.ip_addresses.filter(addr => addr !== ip),
      }));
      toast.success('IP removed from whitelist');
    } catch (error) {
      toast.error('Failed to remove IP from whitelist');
    }
  };

  const toggleWhitelistStatus = async () => {
    const newStatus = ipWhitelist.status === 'active' ? 'inactive' : 'active';
    try {
      await apiPut('/security/ip-whitelist/status', { status: newStatus });
      setIpWhitelist(prev => ({ ...prev, status: newStatus }));
      toast.success(`IP whitelist ${newStatus}`);
    } catch (error) {
      toast.error('Failed to update whitelist status');
    }
  };

  if (loading) {
    return (
      <Layout title="Security Settings">
        <div className="bg-ground-secondary border hairline rounded-xl text-center py-16 portal-text">
          Loading...
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Security Settings">
      <div className="space-y-6">
        {/* 2FA Section */}
        <div className="bg-ground-secondary border hairline rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-amber/15 flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-amber" />
            </div>
            <div>
              <h3 className="portal-heading text-lg">Two-Factor Authentication</h3>
              <p className="portal-label text-muted">Add an extra layer of security</p>
            </div>
          </div>

          {twoFA.enabled ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-teal">
                <CheckCircle size={20} />
                <span className="portal-label font-semibold">2FA is enabled</span>
              </div>
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Enter 6-digit token to disable"
                  value={verifyToken}
                  onChange={(e) => setVerifyToken(e.target.value)}
                  maxLength={6}
                  className="flex-1 bg-ground border hairline rounded-lg px-4 py-2 portal-text focus:outline-none focus:border-amber"
                />
                <button
                  onClick={disable2FA}
                  disabled={verifyToken.length !== 6}
                  className="px-4 py-2 bg-red-400/20 text-red-400 rounded-lg portal-label font-semibold hover:bg-red-400/30 disabled:opacity-50"
                >
                  Disable 2FA
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={setup2FA}
              className="px-4 py-2 bg-amber text-ground rounded-lg portal-label font-semibold hover:bg-amber/90"
            >
              Enable 2FA
            </button>
          )}

          {showQRCode && qrCodeData && (
            <div className="mt-6 p-4 bg-ground rounded-xl border hairline">
              <p className="portal-label mb-3">Scan this QR code with your authenticator app:</p>
              {qrCodeData.qrCode && (
                <img src={qrCodeData.qrCode} alt="QR Code" className="w-48 h-48 mx-auto" />
              )}
              <p className="portal-label text-muted mt-3 text-center">Secret: {qrCodeData.secret}</p>
              <div className="flex gap-3 mt-4">
                <input
                  type="text"
                  placeholder="Enter 6-digit token to verify"
                  value={verifyToken}
                  onChange={(e) => setVerifyToken(e.target.value)}
                  maxLength={6}
                  className="flex-1 bg-ground-secondary border hairline rounded-lg px-4 py-2 portal-text focus:outline-none focus:border-amber"
                />
                <button
                  onClick={enable2FA}
                  disabled={verifyToken.length !== 6}
                  className="px-4 py-2 bg-teal text-ground rounded-lg portal-label font-semibold hover:bg-teal/90 disabled:opacity-50"
                >
                  Verify & Enable
                </button>
              </div>
              <button
                onClick={() => { setShowQRCode(false); setQrCodeData(null); }}
                className="mt-3 portal-label text-muted hover:text-ink"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* IP Whitelist Section */}
        <div className="bg-ground-secondary border hairline rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal/15 flex items-center justify-center">
                <Globe className="w-5 h-5 text-teal" />
              </div>
              <div>
                <h3 className="portal-heading text-lg">IP Whitelist</h3>
                <p className="portal-label text-muted">Restrict access by IP address</p>
              </div>
            </div>
            <button
              onClick={toggleWhitelistStatus}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border hairline portal-label hover:border-amber"
            >
              {ipWhitelist.status === 'active' ? (
                <>
                  <ToggleRight className="w-5 h-5 text-teal" />
                  <span className="text-teal">Active</span>
                </>
              ) : (
                <>
                  <ToggleLeft className="w-5 h-5 text-muted" />
                  <span className="text-muted">Inactive</span>
                </>
              )}
            </button>
          </div>

          <div className="flex gap-3 mb-4">
            <input
              type="text"
              placeholder="Add IP address (e.g., 192.168.1.1)"
              value={newIp}
              onChange={(e) => setNewIp(e.target.value)}
              className="flex-1 bg-ground border hairline rounded-lg px-4 py-2 portal-text focus:outline-none focus:border-amber"
            />
            <button
              onClick={addIpToWhitelist}
              disabled={!newIp}
              className="px-4 py-2 bg-amber text-ground rounded-lg portal-label font-semibold hover:bg-amber/90 disabled:opacity-50 flex items-center gap-2"
            >
              <Plus size={18} />
              Add
            </button>
          </div>

          <div className="space-y-2">
            {ipWhitelist.ip_addresses.length === 0 ? (
              <p className="portal-label text-muted py-4 text-center">No IPs whitelisted</p>
            ) : (
              ipWhitelist.ip_addresses.map((ip) => (
                <div
                  key={ip}
                  className="flex items-center justify-between p-3 bg-ground rounded-lg border hairline"
                >
                  <span className="portal-label">{ip}</span>
                  <button
                    onClick={() => removeIpFromWhitelist(ip)}
                    className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Security Events Section */}
        <div className="bg-ground-secondary border hairline rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-red-400/15 flex items-center justify-center">
              <Shield className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h3 className="portal-heading text-lg">Security Events</h3>
              <p className="portal-label text-muted">Recent security activity</p>
            </div>
          </div>

          <div className="space-y-3">
            {securityEvents.length === 0 ? (
              <p className="portal-label text-muted py-4 text-center">No security events recorded</p>
            ) : (
              securityEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-start gap-3 p-3 bg-ground rounded-lg border hairline"
                >
                  <AlertTriangle size={16} className="text-amber mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="portal-label font-semibold">{event.event_type}</p>
                    <p className="portal-label text-muted text-sm mt-1">
                      {event.ip_address && `IP: ${event.ip_address}`}
                      {event.ip_address && event.user_agent && ' • '}
                      {event.created_at && new Date(event.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
