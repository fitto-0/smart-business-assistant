import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import { useLanguage } from '../lib/LanguageContext';
import { ArrowRight, Mail, Phone, MapPin, Send, Globe } from 'lucide-react';

export default function ContactPage() {
  const { t, language, setLanguage } = useLanguage();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitSuccess(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
      
      setTimeout(() => setSubmitSuccess(false), 5000);
    }, 1500);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <>
      <Head>
        <title>{t('contact.title')} - Smart Business Assistant</title>
        <meta name="description" content={t('contact.description')} />
      </Head>

      <div className="min-h-screen bg-[#080808]">
        {/* Navigation */}
        <nav className="portal-nav">
          <div className="max-w-7xl mx-auto px-5 h-full flex items-center justify-between">
            <Link href="/" className="portal-wordmark">
              Smart Business
            </Link>
            <div className="flex items-center gap-6">
              {/* Language Selector */}
              <div className="relative">
                <button
                  onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                  className="p-2 rounded-lg border hairline hover:bg-ground-secondary transition-colors flex items-center gap-2"
                >
                  <Globe size={18} />
                  <span className="hidden sm:inline text-sm">{language.toUpperCase()}</span>
                </button>
                
                {showLanguageMenu && (
                  <div className="absolute right-0 top-full mt-2 bg-ground-secondary border hairline rounded-lg shadow-xl py-2 min-w-[140px] z-50">
                    <button
                      onClick={() => { setLanguage('en'); setShowLanguageMenu(false); }}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-ground transition-colors flex items-center gap-2 ${language === 'en' ? 'text-amber' : 'text-[#8A8A8A]'}`}
                    >
                      <span>🇬🇧</span>
                      <span>English</span>
                    </button>
                    <button
                      onClick={() => { setLanguage('fr'); setShowLanguageMenu(false); }}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-ground transition-colors flex items-center gap-2 ${language === 'fr' ? 'text-amber' : 'text-[#8A8A8A]'}`}
                    >
                      <span>🇫🇷</span>
                      <span>Français</span>
                    </button>
                    <button
                      onClick={() => { setLanguage('ar'); setShowLanguageMenu(false); }}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-ground transition-colors flex items-center gap-2 ${language === 'ar' ? 'text-amber' : 'text-[#8A8A8A]'}`}
                    >
                      <span>🇸🇦</span>
                      <span>العربية</span>
                    </button>
                  </div>
                )}
              </div>
              <Link href="/" className="portal-nav-link">
                {t('contact.home')}
              </Link>
              <Link href="/login" className="portal-pill-btn">
                {t('contact.login')}
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="pt-32 pb-16 px-5">
          <div className="max-w-7xl mx-auto">
            <p className="portal-label mb-4">{t('contact.title')}</p>
            <h1 className="portal-heading text-5xl lg:text-6xl mb-6">
              {t('contact.getInTouch')}
            </h1>
            <p className="portal-text max-w-2xl">
              {t('contact.description')}
            </p>
          </div>
        </section>

        {/* Contact Content */}
        <section className="py-16 px-5">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div>
              <div className="bg-[#111111] border border-white/10 rounded-lg p-8">
                <h2 className="portal-heading text-2xl mb-6">{t('contact.sendMessage')}</h2>

                {submitSuccess && (
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-6">
                    <p className="text-green-400 text-sm">{t('contact.messageSent')}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">{t('contact.name')}</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full bg-[#080808] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#F5A623] transition-colors"
                      placeholder={t('contact.yourName')}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">{t('contact.email')}</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full bg-[#080808] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#F5A623] transition-colors"
                      placeholder={t('contact.yourEmail')}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">{t('contact.subject')}</label>
                    <input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      className="w-full bg-[#080808] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#F5A623] transition-colors"
                      placeholder={t('contact.howCanHelp')}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">{t('contact.message')}</label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={5}
                      className="w-full bg-[#080808] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#F5A623] transition-colors resize-none"
                      placeholder={t('contact.tellUsMore')}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-[#F5A623] hover:bg-[#E8913C] text-[#080808] font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      t('contact.sending')
                    ) : (
                      <>
                        {t('contact.sendBtn')} <Send size={16} />
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-8">
              <div className="bg-[#111111] border border-white/10 rounded-lg p-8">
                <h2 className="portal-heading text-2xl mb-6">{t('contact.contactInfo')}</h2>

                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#F5A623]/10 flex items-center justify-center flex-shrink-0">
                      <Mail size={18} className="text-[#F5A623]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white mb-1">{t('contact.emailLabel')}</h3>
                      <p className="text-gray-400 text-sm">contact@smartbusiness.ai</p>
                      <p className="text-gray-400 text-sm">support@smartbusiness.ai</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#F5A623]/10 flex items-center justify-center flex-shrink-0">
                      <Phone size={18} className="text-[#F5A623]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white mb-1">{t('contact.phoneLabel')}</h3>
                      <p className="text-gray-400 text-sm">+1 (555) 123-4567</p>
                      <p className="text-gray-400 text-sm">Mon-Fri, 9am-6pm EST</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#F5A623]/10 flex items-center justify-center flex-shrink-0">
                      <MapPin size={18} className="text-[#F5A623]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white mb-1">{t('contact.officeLabel')}</h3>
                      <p className="text-gray-400 text-sm">123 Innovation Drive</p>
                      <p className="text-gray-400 text-sm">San Francisco, CA 94102</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[#111111] border border-white/10 rounded-lg p-8">
                <h2 className="portal-heading text-2xl mb-4">{t('contact.quickLinks')}</h2>
                <div className="space-y-3">
                  <Link href="/register" className="flex items-center justify-between text-gray-400 hover:text-white transition-colors group">
                    <span>{t('contact.createAccountLink')}</span>
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link href="/login" className="flex items-center justify-between text-gray-400 hover:text-white transition-colors group">
                    <span>{t('contact.loginDashboard')}</span>
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link href="/docs" className="flex items-center justify-between text-gray-400 hover:text-white transition-colors group">
                    <span>{t('contact.viewDocs')}</span>
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="portal-footer-strip px-5 mt-16">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="portal-label">© 2026 Smart Business Assistant</p>
            <div className="flex gap-6">
              <Link href="/privacy" className="portal-nav-link">{t('contact.privacy')}</Link>
              <Link href="/terms" className="portal-nav-link">{t('contact.terms')}</Link>
              <a href="#" className="portal-nav-link">{t('contact.title')}</a>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
