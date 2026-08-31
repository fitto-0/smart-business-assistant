import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import { useLanguage } from '../lib/LanguageContext';
import { ArrowRight, Book, Zap, Shield, Database, Cpu, BarChart3, ChevronRight, Search, Globe } from 'lucide-react';

export default function DocsPage() {
  const { t, language, setLanguage } = useLanguage();
  const [activeSection, setActiveSection] = useState('getting-started');
  const [searchQuery, setSearchQuery] = useState('');
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);

  const sections = [
    { id: 'getting-started', title: t('docs.gettingStarted'), icon: Book },
    { id: 'features', title: t('docs.features'), icon: Zap },
    { id: 'sales', title: t('docs.salesAnalytics'), icon: BarChart3 },
    { id: 'inventory', title: t('docs.inventory'), icon: Database },
    { id: 'ai', title: t('docs.aiFeatures'), icon: Cpu },
    { id: 'security', title: t('docs.security'), icon: Shield },
  ];

  const content = {
    'getting-started': {
      title: t('docs.gettingStarted'),
      content: (
        <div className="space-y-8">
          <div>
            <h3 className="portal-heading text-xl mb-4">{t('docs.welcome')}</h3>
            <p className="portal-text">
              {t('docs.welcomeDescription')}
            </p>
          </div>

          <div>
            <h4 className="portal-heading text-lg mb-3">{t('docs.creatingAccount')}</h4>
            <ol className="space-y-3 portal-text">
              <li className="flex gap-3">
                <span className="text-[#F5A623] font-bold">1.</span>
                <span>{t('docs.step1')}</span>
              </li>
              <li className="flex gap-3">
                <span className="text-[#F5A623] font-bold">2.</span>
                <span>{t('docs.step2')}</span>
              </li>
              <li className="flex gap-3">
                <span className="text-[#F5A623] font-bold">3.</span>
                <span>{t('docs.step3')}</span>
              </li>
              <li className="flex gap-3">
                <span className="text-[#F5A623] font-bold">4.</span>
                <span>{t('docs.step4')}</span>
              </li>
            </ol>
          </div>

          <div>
            <h4 className="portal-heading text-lg mb-3">{t('docs.dashboardOverview')}</h4>
            <p className="portal-text mb-4">
              {t('docs.dashboardDescription')}
            </p>
            <ul className="space-y-2 portal-text">
              <li className="flex items-start gap-2">
                <ChevronRight size={16} className="text-[#F5A623] mt-0.5 flex-shrink-0" />
                <span><strong>{t('docs.salesAnalyticsFeature')}</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight size={16} className="text-[#F5A623] mt-0.5 flex-shrink-0" />
                <span><strong>{t('docs.productsFeature')}</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight size={16} className="text-[#F5A623] mt-0.5 flex-shrink-0" />
                <span><strong>{t('docs.aiChatbot')}</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight size={16} className="text-[#F5A623] mt-0.5 flex-shrink-0" />
                <span><strong>{t('docs.csvImport')}</strong></span>
              </li>
            </ul>
          </div>
        </div>
      ),
    },
    'features': {
      title: t('docs.features'),
      content: (
        <div className="space-y-8">
          <div>
            <h3 className="portal-heading text-xl mb-4">{t('docs.platformFeatures')}</h3>
            <p className="portal-text">
              {t('docs.featuresDescription')}
            </p>
          </div>

          <div className="grid gap-6">
            <div className="bg-[#111111] border border-white/10 rounded-lg p-6">
              <h4 className="portal-heading text-lg mb-2">{t('docs.salesAnalytics')}</h4>
              <p className="portal-text">
                {t('docs.salesAnalyticsDesc')}
              </p>
            </div>

            <div className="bg-[#111111] border border-white/10 rounded-lg p-6">
              <h4 className="portal-heading text-lg mb-2">{t('docs.stockManagement')}</h4>
              <p className="portal-text">
                {t('docs.stockManagementDesc')}
              </p>
            </div>

            <div className="bg-[#111111] border border-white/10 rounded-lg p-6">
              <h4 className="portal-heading text-lg mb-2">{t('docs.aiPredictionsFeature')}</h4>
              <p className="portal-text">
                {t('docs.aiPredictionsDesc')}
              </p>
            </div>

            <div className="bg-[#111111] border border-white/10 rounded-lg p-6">
              <h4 className="portal-heading text-lg mb-2">{t('docs.reviewSentiment')}</h4>
              <p className="portal-text">
                {t('docs.reviewSentimentDesc')}
              </p>
            </div>

            <div className="bg-[#111111] border border-white/10 rounded-lg p-6">
              <h4 className="portal-heading text-lg mb-2">{t('docs.anomalyDetectionFeature')}</h4>
              <p className="portal-text">
                {t('docs.anomalyDetectionDesc')}
              </p>
            </div>

            <div className="bg-[#111111] border border-white/10 rounded-lg p-6">
              <h4 className="portal-heading text-lg mb-2">{t('docs.smartRecommendations')}</h4>
              <p className="portal-text">
                {t('docs.smartRecommendationsDesc')}
              </p>
            </div>
          </div>
        </div>
      ),
    },
    'sales': {
      title: t('docs.salesAnalytics'),
      content: (
        <div className="space-y-8">
          <div>
            <h3 className="portal-heading text-xl mb-4">{t('docs.salesAnalytics')}</h3>
            <p className="portal-text">
              {t('docs.salesAnalyticsDesc')}
            </p>
          </div>

          <div>
            <h4 className="portal-heading text-lg mb-3">{t('docs.keyMetrics')}</h4>
            <ul className="space-y-2 portal-text">
              <li className="flex items-start gap-2">
                <ChevronRight size={16} className="text-[#F5A623] mt-0.5 flex-shrink-0" />
                <span><strong>{t('docs.totalRevenue')}</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight size={16} className="text-[#F5A623] mt-0.5 flex-shrink-0" />
                <span><strong>{t('docs.totalOrders')}</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight size={16} className="text-[#F5A623] mt-0.5 flex-shrink-0" />
                <span><strong>{t('docs.avgOrderValue')}</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight size={16} className="text-[#F5A623] mt-0.5 flex-shrink-0" />
                <span><strong>{t('docs.topProducts')}</strong></span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="portal-heading text-lg mb-3">{t('docs.recordingSales')}</h4>
            <ol className="space-y-3 portal-text">
              <li className="flex gap-3">
                <span className="text-[#F5A623] font-bold">1.</span>
                <span>{t('docs.navigateSales')}</span>
              </li>
              <li className="flex gap-3">
                <span className="text-[#F5A623] font-bold">2.</span>
                <span>{t('docs.clickRecordSale')}</span>
              </li>
              <li className="flex gap-3">
                <span className="text-[#F5A623] font-bold">3.</span>
                <span>{t('docs.selectProduct')}</span>
              </li>
              <li className="flex gap-3">
                <span className="text-[#F5A623] font-bold">4.</span>
                <span>{t('docs.enterDetails')}</span>
              </li>
              <li className="flex gap-3">
                <span className="text-[#F5A623] font-bold">5.</span>
                <span>{t('docs.clickSave')}</span>
              </li>
            </ol>
          </div>

          <div>
            <h4 className="portal-heading text-lg mb-3">{t('docs.timePeriods')}</h4>
            <p className="portal-text mb-4">
              {t('docs.filterPeriods')}
            </p>
            <ul className="space-y-2 portal-text">
              <li className="flex items-start gap-2">
                <ChevronRight size={16} className="text-[#F5A623] mt-0.5 flex-shrink-0" />
                <span><strong>{t('docs.last7Days')}</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight size={16} className="text-[#F5A623] mt-0.5 flex-shrink-0" />
                <span><strong>{t('docs.last30Days')}</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight size={16} className="text-[#F5A623] mt-0.5 flex-shrink-0" />
                <span><strong>{t('docs.last90Days')}</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight size={16} className="text-[#F5A623] mt-0.5 flex-shrink-0" />
                <span><strong>{t('docs.customRange')}</strong></span>
              </li>
            </ul>
          </div>
        </div>
      ),
    },
    'inventory': {
      title: t('docs.inventory'),
      content: (
        <div className="space-y-8">
          <div>
            <h3 className="portal-heading text-xl mb-4">{t('docs.inventoryManagement')}</h3>
            <p className="portal-text">
              {t('docs.inventoryDescription')}
            </p>
          </div>

          <div>
            <h4 className="portal-heading text-lg mb-3">{t('docs.addingProducts')}</h4>
            <ol className="space-y-3 portal-text">
              <li className="flex gap-3">
                <span className="text-[#F5A623] font-bold">1.</span>
                <span>{t('docs.goToProducts')}</span>
              </li>
              <li className="flex gap-3">
                <span className="text-[#F5A623] font-bold">2.</span>
                <span>Click "Add Product" button</span>
              </li>
              <li className="flex gap-3">
                <span className="text-[#F5A623] font-bold">3.</span>
                <span>Fill in product details (name, price, stock, category)</span>
              </li>
              <li className="flex gap-3">
                <span className="text-[#F5A623] font-bold">4.</span>
                <span>Click "Save" to add the product</span>
              </li>
            </ol>
          </div>

          <div>
            <h4 className="portal-heading text-lg mb-3">{t('docs.csvImport')}</h4>
            <p className="portal-text mb-4">
              {t('docs.csvImportDesc')}:
            </p>
            <ol className="space-y-3 portal-text">
              <li className="flex gap-3">
                <span className="text-[#F5A623] font-bold">1.</span>
                <span>{t('docs.csvStep1')}</span>
              </li>
              <li className="flex gap-3">
                <span className="text-[#F5A623] font-bold">2.</span>
                <span>{t('docs.csvStep2')}</span>
              </li>
              <li className="flex gap-3">
                <span className="text-[#F5A623] font-bold">3.</span>
                <span>{t('docs.csvStep3')}</span>
              </li>
              <li className="flex gap-3">
                <span className="text-[#F5A623] font-bold">4.</span>
                <span>{t('docs.csvStep4')}</span>
              </li>
              <li className="flex gap-3">
                <span className="text-[#F5A623] font-bold">5.</span>
                <span>{t('docs.csvStep5')}</span>
              </li>
            </ol>
          </div>

          <div>
            <h4 className="portal-heading text-lg mb-3">{t('docs.stockAlerts')}</h4>
            <p className="portal-text">
              {t('docs.stockAlertsDesc')}
            </p>
          </div>
        </div>
      ),
    },
    'ai': {
      title: t('docs.aiFeatures'),
      content: (
        <div className="space-y-8">
          <div>
            <h3 className="portal-heading text-xl mb-4">{t('docs.aiPoweredFeatures')}</h3>
            <p className="portal-text">
              {t('docs.aiIntro')}
            </p>
          </div>

          <div>
            <h4 className="portal-heading text-lg mb-3">{t('docs.aiChatbot')}</h4>
            <p className="portal-text mb-4">
              {t('docs.aiChatbotDesc')}:
            </p>
            <ul className="space-y-2 portal-text">
              <li className="flex items-start gap-2">
                <ChevronRight size={16} className="text-[#F5A623] mt-0.5 flex-shrink-0" />
                <span>"{t('docs.example1')}"</span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight size={16} className="text-[#F5A623] mt-0.5 flex-shrink-0" />
                <span>"{t('docs.example2')}"</span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight size={16} className="text-[#F5A623] mt-0.5 flex-shrink-0" />
                <span>"{t('docs.example3')}"</span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight size={16} className="text-[#F5A623] mt-0.5 flex-shrink-0" />
                <span>"{t('docs.example4')}"</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="portal-heading text-lg mb-3">{t('docs.csvAnalysis')}</h4>
            <p className="portal-text mb-4">
              {t('docs.csvAnalysisDesc')}:
            </p>
            <ul className="space-y-2 portal-text">
              <li className="flex items-start gap-2">
                <ChevronRight size={16} className="text-[#F5A623] mt-0.5 flex-shrink-0" />
                <span>{t('docs.dataQuality')}</span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight size={16} className="text-[#F5A623] mt-0.5 flex-shrink-0" />
                <span>{t('docs.categorySuggestions')}</span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight size={16} className="text-[#F5A623] mt-0.5 flex-shrink-0" />
                <span>{t('docs.priceRecommendations')}</span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight size={16} className="text-[#F5A623] mt-0.5 flex-shrink-0" />
                <span>{t('docs.anomalyDetection')}</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="portal-heading text-lg mb-3">{t('docs.revenuePredictions')}</h4>
            <p className="portal-text">
              {t('docs.revenuePredictionsDesc')}
            </p>
          </div>

          <div>
            <h4 className="portal-heading text-lg mb-3">{t('docs.sentimentAnalysis')}</h4>
            <p className="portal-text">
              {t('docs.sentimentAnalysisDesc')}
            </p>
          </div>
        </div>
      ),
    },
    'security': {
      title: t('docs.security'),
      content: (
        <div className="space-y-8">
          <div>
            <h3 className="portal-heading text-xl mb-4">{t('docs.securityPrivacy')}</h3>
            <p className="portal-text">
              {t('docs.securityIntro')}
            </p>
          </div>

          <div>
            <h4 className="portal-heading text-lg mb-3">{t('docs.dataProtection')}</h4>
            <ul className="space-y-2 portal-text">
              <li className="flex items-start gap-2">
                <ChevronRight size={16} className="text-[#F5A623] mt-0.5 flex-shrink-0" />
                <span><strong>{t('docs.encryption')}:</strong> {t('docs.encryptionDesc')}</span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight size={16} className="text-[#F5A623] mt-0.5 flex-shrink-0" />
                <span><strong>{t('docs.authentication')}:</strong> {t('docs.authenticationDesc')}</span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight size={16} className="text-[#F5A623] mt-0.5 flex-shrink-0" />
                <span><strong>{t('docs.userIsolation')}:</strong> {t('docs.userIsolationDesc')}</span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight size={16} className="text-[#F5A623] mt-0.5 flex-shrink-0" />
                <span><strong>{t('docs.secureApis')}:</strong> {t('docs.secureApisDesc')}</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="portal-heading text-lg mb-3">{t('docs.accountSecurity')}</h4>
            <p className="portal-text mb-4">
              {t('docs.accountSecurityDesc')}:
            </p>
            <ul className="space-y-2 portal-text">
              <li className="flex items-start gap-2">
                <ChevronRight size={16} className="text-[#F5A623] mt-0.5 flex-shrink-0" />
                <span>{t('docs.securityTip1')}</span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight size={16} className="text-[#F5A623] mt-0.5 flex-shrink-0" />
                <span>{t('docs.securityTip2')}</span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight size={16} className="text-[#F5A623] mt-0.5 flex-shrink-0" />
                <span>{t('docs.securityTip3')}</span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight size={16} className="text-[#F5A623] mt-0.5 flex-shrink-0" />
                <span>{t('docs.securityTip4')}</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="portal-heading text-lg mb-3">{t('docs.privacyPolicy')}</h4>
            <p className="portal-text">
              {t('docs.privacyPolicyDesc')}
            </p>
          </div>

          <div>
            <h4 className="portal-heading text-lg mb-3">{t('docs.dataRetention')}</h4>
            <p className="portal-text">
              {t('docs.dataRetentionDesc')}
            </p>
          </div>
        </div>
      ),
    },
  };

  const filteredSections = sections.filter(section =>
    section.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <Head>
        <title>{t('docs.title')} - Smart Business Assistant</title>
        <meta name="description" content={t('docs.title')} />
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
            <p className="portal-label mb-4">{t('docs.title')}</p>
            <h1 className="portal-heading text-5xl lg:text-6xl mb-6">
              {t('docs.title')}
            </h1>
            <p className="portal-text max-w-2xl">
              {t('docs.welcomeDescription')}
            </p>
          </div>
        </section>

        {/* Search */}
        <section className="px-5 pb-8">
          <div className="max-w-7xl mx-auto">
            <div className="relative">
              <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={t('docs.searchDocs')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#111111] border border-white/10 rounded-lg pl-12 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-[#F5A623] transition-colors"
              />
            </div>
          </div>
        </section>

        {/* Documentation Content */}
        <section className="py-16 px-5">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-4 gap-8">
            {/* Sidebar Navigation */}
            <div className="lg:col-span-1">
              <div className="bg-[#111111] border border-white/10 rounded-lg p-4 sticky top-24">
                <h3 className="portal-heading text-sm mb-4">Sections</h3>
                <nav className="space-y-1">
                  {(searchQuery ? filteredSections : sections).map((section) => {
                    const Icon = section.icon;
                    return (
                      <button
                        key={section.id}
                        onClick={() => setActiveSection(section.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                          activeSection === section.id
                            ? 'bg-[#F5A623]/10 text-[#F5A623]'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <Icon size={16} />
                        <span className="text-sm">{section.title}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              <div className="bg-[#111111] border border-white/10 rounded-lg p-8">
                {content[activeSection]?.content}
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
              <Link href="/contact" className="portal-nav-link">{t('contact.title')}</Link>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
