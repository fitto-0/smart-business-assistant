import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight, Book, Zap, Shield, Database, Cpu, BarChart3, ChevronRight, Search } from 'lucide-react';

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState('getting-started');
  const [searchQuery, setSearchQuery] = useState('');

  const sections = [
    { id: 'getting-started', title: 'Getting Started', icon: Book },
    { id: 'features', title: 'Features', icon: Zap },
    { id: 'sales', title: 'Sales Analytics', icon: BarChart3 },
    { id: 'inventory', title: 'Inventory Management', icon: Database },
    { id: 'ai', title: 'AI Features', icon: Cpu },
    { id: 'security', title: 'Security', icon: Shield },
  ];

  const content = {
    'getting-started': {
      title: 'Getting Started',
      content: (
        <div className="space-y-8">
          <div>
            <h3 className="portal-heading text-xl mb-4">Welcome to Smart Business Assistant</h3>
            <p className="portal-text">
              Smart Business Assistant is an AI-powered platform that helps you manage your business data, 
              analyze sales trends, and make data-driven decisions. This guide will help you get started 
              with the platform.
            </p>
          </div>

          <div>
            <h4 className="portal-heading text-lg mb-3">Creating an Account</h4>
            <ol className="space-y-3 portal-text">
              <li className="flex gap-3">
                <span className="text-[#F5A623] font-bold">1.</span>
                <span>Click the "Get Started" button on the landing page</span>
              </li>
              <li className="flex gap-3">
                <span className="text-[#F5A623] font-bold">2.</span>
                <span>Fill in your email, name, and create a password</span>
              </li>
              <li className="flex gap-3">
                <span className="text-[#F5A623] font-bold">3.</span>
                <span>Verify your email address</span>
              </li>
              <li className="flex gap-3">
                <span className="text-[#F5A623] font-bold">4.</span>
                <span>Log in to access your dashboard</span>
              </li>
            </ol>
          </div>

          <div>
            <h4 className="portal-heading text-lg mb-3">Dashboard Overview</h4>
            <p className="portal-text mb-4">
              After logging in, you'll see the main dashboard with:
            </p>
            <ul className="space-y-2 portal-text">
              <li className="flex items-start gap-2">
                <ChevronRight size={16} className="text-[#F5A623] mt-0.5 flex-shrink-0" />
                <span><strong>Sales Analytics:</strong> Revenue charts and KPIs</span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight size={16} className="text-[#F5A623] mt-0.5 flex-shrink-0" />
                <span><strong>Products:</strong> Inventory management and stock levels</span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight size={16} className="text-[#F5A623] mt-0.5 flex-shrink-0" />
                <span><strong>AI Chatbot:</strong> Ask questions about your business data</span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight size={16} className="text-[#F5A623] mt-0.5 flex-shrink-0" />
                <span><strong>CSV Import:</strong> Bulk import products from CSV files</span>
              </li>
            </ul>
          </div>
        </div>
      ),
    },
    'features': {
      title: 'Features',
      content: (
        <div className="space-y-8">
          <div>
            <h3 className="portal-heading text-xl mb-4">Platform Features</h3>
            <p className="portal-text">
              Smart Business Assistant offers a comprehensive suite of tools to help you manage 
              and grow your business.
            </p>
          </div>

          <div className="grid gap-6">
            <div className="bg-[#111111] border border-white/10 rounded-lg p-6">
              <h4 className="portal-heading text-lg mb-2">Sales Analytics</h4>
              <p className="portal-text">
                Track revenue, orders, and product performance in real-time with beautiful dashboards 
                and interactive charts.
              </p>
            </div>

            <div className="bg-[#111111] border border-white/10 rounded-lg p-6">
              <h4 className="portal-heading text-lg mb-2">Stock Management</h4>
              <p className="portal-text">
                Monitor inventory levels, receive low-stock warnings, and get restock alerts before 
                they impact your sales.
              </p>
            </div>

            <div className="bg-[#111111] border border-white/10 rounded-lg p-6">
              <h4 className="portal-heading text-lg mb-2">AI Predictions</h4>
              <p className="portal-text">
                Forecast future revenue with machine learning models trained on your historical data.
              </p>
            </div>

            <div className="bg-[#111111] border border-white/10 rounded-lg p-6">
              <h4 className="portal-heading text-lg mb-2">Review Sentiment</h4>
              <p className="portal-text">
                Understand what customers think with automatic NLP sentiment analysis of reviews 
                and feedback.
              </p>
            </div>

            <div className="bg-[#111111] border border-white/10 rounded-lg p-6">
              <h4 className="portal-heading text-lg mb-2">Anomaly Detection</h4>
              <p className="portal-text">
                Get alerted on stock ruptures and sales drops the moment they happen with real-time 
                monitoring.
              </p>
            </div>

            <div className="bg-[#111111] border border-white/10 rounded-lg p-6">
              <h4 className="portal-heading text-lg mb-2">Smart Recommendations</h4>
              <p className="portal-text">
                Receive actionable AI suggestions to boost sales and optimize your inventory based 
                on data patterns.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    'sales': {
      title: 'Sales Analytics',
      content: (
        <div className="space-y-8">
          <div>
            <h3 className="portal-heading text-xl mb-4">Sales Analytics</h3>
            <p className="portal-text">
              The Sales Analytics dashboard provides comprehensive insights into your business performance.
            </p>
          </div>

          <div>
            <h4 className="portal-heading text-lg mb-3">Key Metrics</h4>
            <ul className="space-y-2 portal-text">
              <li className="flex items-start gap-2">
                <ChevronRight size={16} className="text-[#F5A623] mt-0.5 flex-shrink-0" />
                <span><strong>Total Revenue:</strong> Overall sales revenue for selected period</span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight size={16} className="text-[#F5A623] mt-0.5 flex-shrink-0" />
                <span><strong>Total Orders:</strong> Number of orders processed</span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight size={16} className="text-[#F5A623] mt-0.5 flex-shrink-0" />
                <span><strong>Average Order Value:</strong> Average revenue per order</span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight size={16} className="text-[#F5A623] mt-0.5 flex-shrink-0" />
                <span><strong>Top Products:</strong> Best-selling products by revenue</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="portal-heading text-lg mb-3">Recording Sales</h4>
            <ol className="space-y-3 portal-text">
              <li className="flex gap-3">
                <span className="text-[#F5A623] font-bold">1.</span>
                <span>Navigate to the Sales page</span>
              </li>
              <li className="flex gap-3">
                <span className="text-[#F5A623] font-bold">2.</span>
                <span>Click "Record Sale" button</span>
              </li>
              <li className="flex gap-3">
                <span className="text-[#F5A623] font-bold">3.</span>
                <span>Select product from inventory</span>
              </li>
              <li className="flex gap-3">
                <span className="text-[#F5A623] font-bold">4.</span>
                <span>Enter quantity, price, and date</span>
              </li>
              <li className="flex gap-3">
                <span className="text-[#F5A623] font-bold">5.</span>
                <span>Click "Save" to record the transaction</span>
              </li>
            </ol>
          </div>

          <div>
            <h4 className="portal-heading text-lg mb-3">Time Periods</h4>
            <p className="portal-text mb-4">
              Filter your sales data by different time periods:
            </p>
            <ul className="space-y-2 portal-text">
              <li className="flex items-start gap-2">
                <ChevronRight size={16} className="text-[#F5A623] mt-0.5 flex-shrink-0" />
                <span><strong>Last 7 days:</strong> Recent sales trends</span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight size={16} className="text-[#F5A623] mt-0.5 flex-shrink-0" />
                <span><strong>Last 30 days:</strong> Monthly performance</span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight size={16} className="text-[#F5A623] mt-0.5 flex-shrink-0" />
                <span><strong>Last 90 days:</strong> Quarterly overview</span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight size={16} className="text-[#F5A623] mt-0.5 flex-shrink-0" />
                <span><strong>Custom range:</strong> Select specific dates</span>
              </li>
            </ul>
          </div>
        </div>
      ),
    },
    'inventory': {
      title: 'Inventory Management',
      content: (
        <div className="space-y-8">
          <div>
            <h3 className="portal-heading text-xl mb-4">Inventory Management</h3>
            <p className="portal-text">
              Manage your product inventory efficiently with our comprehensive inventory system.
            </p>
          </div>

          <div>
            <h4 className="portal-heading text-lg mb-3">Adding Products</h4>
            <ol className="space-y-3 portal-text">
              <li className="flex gap-3">
                <span className="text-[#F5A623] font-bold">1.</span>
                <span>Go to the Products page</span>
              </li>
              <li className="flex gap-3">
                <span className="text-[#F5A623] font-bold">2.</span>
                <span>Click "Add Product" button</span>
              </li>
              <li className="flex gap-3">
                <span className="text-[#F5A623] font-bold">3.</span>
                <span>Fill in product details (name, category, price, stock)</span>
              </li>
              <li className="flex gap-3">
                <span className="text-[#F5A623] font-bold">4.</span>
                <span>Click "Save" to add to inventory</span>
              </li>
            </ol>
          </div>

          <div>
            <h4 className="portal-heading text-lg mb-3">CSV Import</h4>
            <p className="portal-text mb-4">
              Bulk import products from CSV files to save time:
            </p>
            <ol className="space-y-3 portal-text">
              <li className="flex gap-3">
                <span className="text-[#F5A623] font-bold">1.</span>
                <span>Prepare CSV with columns: name, category, price, stock</span>
              </li>
              <li className="flex gap-3">
                <span className="text-[#F5A623] font-bold">2.</span>
                <span>Click "Import CSV" on Products page</span>
              </li>
              <li className="flex gap-3">
                <span className="text-[#F5A623] font-bold">3.</span>
                <span>Select your CSV file</span>
              </li>
              <li className="flex gap-3">
                <span className="text-[#F5A623] font-bold">4.</span>
                <span>Review AI analysis and import suggestions</span>
              </li>
              <li className="flex gap-3">
                <span className="text-[#F5A623] font-bold">5.</span>
                <span>Confirm import to add products</span>
              </li>
            </ol>
          </div>

          <div>
            <h4 className="portal-heading text-lg mb-3">Product Categories</h4>
            <p className="portal-text mb-4">
              Supported product categories:
            </p>
            <div className="grid grid-cols-2 gap-3">
              {['Electronics', 'Clothing', 'Food', 'Home', 'Sports', 'Other'].map((cat) => (
                <div key={cat} className="bg-[#111111] border border-white/10 rounded px-3 py-2 text-sm text-gray-400">
                  {cat}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="portal-heading text-lg mb-3">Stock Alerts</h4>
            <p className="portal-text">
              The system automatically alerts you when products are running low on stock. 
              Set minimum stock levels for each product to receive timely notifications.
            </p>
          </div>
        </div>
      ),
    },
    'ai': {
      title: 'AI Features',
      content: (
        <div className="space-y-8">
          <div>
            <h3 className="portal-heading text-xl mb-4">AI-Powered Features</h3>
            <p className="portal-text">
              Leverage artificial intelligence to gain deeper insights into your business data.
            </p>
          </div>

          <div>
            <h4 className="portal-heading text-lg mb-3">AI Chatbot</h4>
            <p className="portal-text mb-4">
              Ask questions about your business data in natural language:
            </p>
            <ul className="space-y-2 portal-text">
              <li className="flex items-start gap-2">
                <ChevronRight size={16} className="text-[#F5A623] mt-0.5 flex-shrink-0" />
                <span>"What are my top-selling products?"</span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight size={16} className="text-[#F5A623] mt-0.5 flex-shrink-0" />
                <span>"How much revenue did I make last month?"</span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight size={16} className="text-[#F5A623] mt-0.5 flex-shrink-0" />
                <span>"Which products are low on stock?"</span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight size={16} className="text-[#F5A623] mt-0.5 flex-shrink-0" />
                <span>"Predict next month's revenue"</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="portal-heading text-lg mb-3">CSV Analysis</h4>
            <p className="portal-text mb-4">
              When importing CSV files, our AI analyzes the data and provides:
            </p>
            <ul className="space-y-2 portal-text">
              <li className="flex items-start gap-2">
                <ChevronRight size={16} className="text-[#F5A623] mt-0.5 flex-shrink-0" />
                <span>Data quality assessment</span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight size={16} className="text-[#F5A623] mt-0.5 flex-shrink-0" />
                <span>Category suggestions</span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight size={16} className="text-[#F5A623] mt-0.5 flex-shrink-0" />
                <span>Price recommendations</span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight size={16} className="text-[#F5A623] mt-0.5 flex-shrink-0" />
                <span>Anomaly detection</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="portal-heading text-lg mb-3">Revenue Predictions</h4>
            <p className="portal-text">
              Our machine learning models analyze your historical sales data to forecast 
              future revenue trends. These predictions help you make informed business 
              decisions and plan accordingly.
            </p>
          </div>

          <div>
            <h4 className="portal-heading text-lg mb-3">Sentiment Analysis</h4>
            <p className="portal-text">
              Automatically analyze customer reviews and feedback to understand sentiment 
              trends. Identify areas for improvement and track customer satisfaction over time.
            </p>
          </div>
        </div>
      ),
    },
    'security': {
      title: 'Security',
      content: (
        <div className="space-y-8">
          <div>
            <h3 className="portal-heading text-xl mb-4">Security & Privacy</h3>
            <p className="portal-text">
              Your data security is our top priority. Learn about our security measures 
              and how we protect your information.
            </p>
          </div>

          <div>
            <h4 className="portal-heading text-lg mb-3">Data Protection</h4>
            <ul className="space-y-2 portal-text">
              <li className="flex items-start gap-2">
                <ChevronRight size={16} className="text-[#F5A623] mt-0.5 flex-shrink-0" />
                <span><strong>Encryption:</strong> All data is encrypted at rest and in transit</span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight size={16} className="text-[#F5A623] mt-0.5 flex-shrink-0" />
                <span><strong>Authentication:</strong> JWT-based secure authentication</span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight size={16} className="text-[#F5A623] mt-0.5 flex-shrink-0" />
                <span><strong>User Isolation:</strong> Each user's data is completely isolated</span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight size={16} className="text-[#F5A623] mt-0.5 flex-shrink-0" />
                <span><strong>Secure APIs:</strong> All API endpoints are protected</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="portal-heading text-lg mb-3">Account Security</h4>
            <p className="portal-text mb-4">
              Best practices for keeping your account secure:
            </p>
            <ul className="space-y-2 portal-text">
              <li className="flex items-start gap-2">
                <ChevronRight size={16} className="text-[#F5A623] mt-0.5 flex-shrink-0" />
                <span>Use a strong, unique password</span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight size={16} className="text-[#F5A623] mt-0.5 flex-shrink-0" />
                <span>Don't share your login credentials</span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight size={16} className="text-[#F5A623] mt-0.5 flex-shrink-0" />
                <span>Log out after each session</span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight size={16} className="text-[#F5A623] mt-0.5 flex-shrink-0" />
                <span>Keep your browser updated</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="portal-heading text-lg mb-3">Privacy Policy</h4>
            <p className="portal-text">
              We do not sell or share your data with third parties. Your business data 
              remains yours alone. We only use data to provide and improve our services.
            </p>
          </div>

          <div>
            <h4 className="portal-heading text-lg mb-3">Data Retention</h4>
            <p className="portal-text">
              You can delete your account and all associated data at any time through 
              the profile settings. Upon deletion, all data is permanently removed 
              from our systems.
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
        <title>Documentation - Smart Business Assistant</title>
        <meta name="description" content="Documentation for Smart Business Assistant" />
      </Head>

      <div className="min-h-screen bg-[#080808]">
        {/* Navigation */}
        <nav className="portal-nav">
          <div className="max-w-7xl mx-auto px-5 h-full flex items-center justify-between">
            <Link href="/" className="portal-wordmark">
              Smart Business
            </Link>
            <div className="flex items-center gap-6">
              <Link href="/" className="portal-nav-link">
                Home
              </Link>
              <Link href="/login" className="portal-pill-btn">
                Login
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="pt-32 pb-16 px-5">
          <div className="max-w-7xl mx-auto">
            <p className="portal-label mb-4">Documentation</p>
            <h1 className="portal-heading text-5xl lg:text-6xl mb-6">
              Learn how to use Smart Business Assistant
            </h1>
            <p className="portal-text max-w-2xl">
              Comprehensive guides to help you get the most out of our platform.
            </p>

            {/* Search */}
            <div className="mt-8 max-w-md">
              <div className="relative">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search documentation..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#111111] border border-white/10 rounded-lg pl-12 pr-4 py-3 text-white focus:outline-none focus:border-[#F5A623] transition-colors"
                />
              </div>
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
            <p className="portal-label"> 2026 Smart Business Assistant</p>
            <div className="flex gap-6">
              <Link href="/privacy" className="portal-nav-link">Privacy</Link>
              <Link href="/terms" className="portal-nav-link">Terms</Link>
              <Link href="/contact" className="portal-nav-link">Contact</Link>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
