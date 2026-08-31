import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import { useLanguage } from '../lib/LanguageContext';
import { Globe } from 'lucide-react';

export default function PrivacyPage() {
  const { t, language, setLanguage } = useLanguage();
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  return (
    <>
      <Head>
        <title>{t('privacy.title')} - Smart Business Assistant</title>
        <meta name="description" content={t('privacy.title')} />
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
            <p className="portal-label mb-4">{t('privacy.legal')}</p>
            <h1 className="portal-heading text-5xl lg:text-6xl mb-6">
              {t('privacy.title')}
            </h1>
            <p className="portal-text max-w-2xl">
              {t('privacy.lastUpdated')}
            </p>
          </div>
        </section>

        {/* Privacy Content */}
        <section className="py-16 px-5">
          <div className="max-w-4xl mx-auto">
            <div className="bg-[#111111] border border-white/10 rounded-lg p-8 space-y-8">
              <div>
                <h2 className="portal-heading text-xl mb-4">{t('privacy.infoCollect')}</h2>
                <p className="portal-text mb-4">
                  {t('privacy.collectDescription')}
                </p>
                <ul className="space-y-2 portal-text">
                  <li className="flex items-start gap-2">
                    <span className="text-[#F5A623]">•</span>
                    <span>{t('privacy.accountInfo')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#F5A623]">•</span>
                    <span>{t('privacy.businessData')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#F5A623]">•</span>
                    <span>{t('privacy.csvFiles')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#F5A623]">•</span>
                    <span>{t('privacy.chatbotInteractions')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#F5A623]">•</span>
                    <span>{t('privacy.usageData')}</span>
                  </li>
                </ul>
              </div>

              <div>
                <h2 className="portal-heading text-xl mb-4">{t('privacy.howUseInfo')}</h2>
                <p className="portal-text mb-4">
                  {t('privacy.useDescription')}
                </p>
                <ul className="space-y-2 portal-text">
                  <li className="flex items-start gap-2">
                    <span className="text-[#F5A623]">•</span>
                    <span>{t('privacy.provideServices')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#F5A623]">•</span>
                    <span>{t('privacy.generateAnalytics')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#F5A623]">•</span>
                    <span>{t('privacy.processPredictions')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#F5A623]">•</span>
                    <span>{t('privacy.communicateAccount')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#F5A623]">•</span>
                    <span>{t('privacy.ensureSecurity')}</span>
                  </li>
                </ul>
              </div>

              <div>
                <h2 className="portal-heading text-xl mb-4">{t('privacy.dataSecurity')}</h2>
                <p className="portal-text mb-4">
                  {t('privacy.securityDescription')}
                </p>
                <ul className="space-y-2 portal-text">
                  <li className="flex items-start gap-2">
                    <span className="text-[#F5A623]">•</span>
                    <span>{t('privacy.encryption')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#F5A623]">•</span>
                    <span>{t('privacy.secureAuth')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#F5A623]">•</span>
                    <span>{t('privacy.dataIsolation')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#F5A623]">•</span>
                    <span>{t('privacy.securityAudits')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#F5A623]">•</span>
                    <span>{t('privacy.accessControls')}</span>
                  </li>
                </ul>
              </div>

              <div>
                <h2 className="portal-heading text-xl mb-4">{t('privacy.dataSharing')}</h2>
                <p className="portal-text mb-4">
                  {t('privacy.sharingDescription')}
                </p>
                <ul className="space-y-2 portal-text">
                  <li className="flex items-start gap-2">
                    <span className="text-[#F5A623]">•</span>
                    <span>{t('privacy.explicitConsent')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#F5A623]">•</span>
                    <span>{t('privacy.legalObligations')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#F5A623]">•</span>
                    <span>{t('privacy.protectRights')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#F5A623]">•</span>
                    <span>{t('privacy.serviceProviders')}</span>
                  </li>
                </ul>
              </div>

              <div>
                <h2 className="portal-heading text-xl mb-4">{t('privacy.dataRetention')}</h2>
                <p className="portal-text">
                  {t('privacy.retentionDescription')}
                </p>
              </div>

              <div>
                <h2 className="portal-heading text-xl mb-4">{t('privacy.yourRights')}</h2>
                <p className="portal-text mb-4">
                  {t('privacy.rightsDescription')}
                </p>
                <ul className="space-y-2 portal-text">
                  <li className="flex items-start gap-2">
                    <span className="text-[#F5A623]">•</span>
                    <span>{t('privacy.accessData')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#F5A623]">•</span>
                    <span>{t('privacy.correctData')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#F5A623]">•</span>
                    <span>{t('privacy.deleteData')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#F5A623]">•</span>
                    <span>{t('privacy.exportData')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#F5A623]">•</span>
                    <span>{t('privacy.optOut')}</span>
                  </li>
                </ul>
              </div>

              <div>
                <h2 className="portal-heading text-xl mb-4">{t('privacy.cookies')}</h2>
                <p className="portal-text">
                  {t('privacy.cookiesDescription')}
                </p>
              </div>

              <div>
                <h2 className="portal-heading text-xl mb-4">{t('privacy.thirdParty')}</h2>
                <p className="portal-text">
                  {t('privacy.thirdPartyDescription')}
                </p>
              </div>

              <div>
                <h2 className="portal-heading text-xl mb-4">{t('privacy.childrenPrivacy')}</h2>
                <p className="portal-text">
                  {t('privacy.childrenDescription')}
                </p>
              </div>

              <div>
                <h2 className="portal-heading text-xl mb-4">{t('privacy.internationalTransfers')}</h2>
                <p className="portal-text">
                  {t('privacy.transfersDescription')}
                </p>
              </div>

              <div>
                <h2 className="portal-heading text-xl mb-4">{t('privacy.policyChanges')}</h2>
                <p className="portal-text">
                  {t('privacy.changesDescription')}
                </p>
              </div>

              <div>
                <h2 className="portal-heading text-xl mb-4">{t('privacy.contactSection')}</h2>
                <p className="portal-text">
                  {t('privacy.contactDescription')}{' '}
                  <Link href="/contact" className="text-[#F5A623] hover:underline">{t('privacy.contactEmail')}</Link>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="portal-footer-strip px-5 mt-16">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="portal-label">© 2026 Smart Business Assistant</p>
            <div className="flex gap-6">
              <Link href="/terms" className="portal-nav-link">{t('contact.terms')}</Link>
              <Link href="/contact" className="portal-nav-link">{t('contact.title')}</Link>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
