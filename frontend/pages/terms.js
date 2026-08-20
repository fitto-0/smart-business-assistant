import Head from 'next/head';
import Link from 'next/link';

export default function TermsPage() {
  return (
    <>
      <Head>
        <title>Terms of Service - Smart Business Assistant</title>
        <meta name="description" content="Terms of Service for Smart Business Assistant" />
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
            <p className="portal-label mb-4">Legal</p>
            <h1 className="portal-heading text-5xl lg:text-6xl mb-6">
              Terms of Service
            </h1>
            <p className="portal-text max-w-2xl">
              Last updated: August 2026
            </p>
          </div>
        </section>

        {/* Terms Content */}
        <section className="py-16 px-5">
          <div className="max-w-4xl mx-auto">
            <div className="bg-[#111111] border border-white/10 rounded-lg p-8 space-y-8">
              <div>
                <h2 className="portal-heading text-xl mb-4">1. Acceptance of Terms</h2>
                <p className="portal-text">
                  By accessing and using Smart Business Assistant, you accept and agree to be bound by the terms 
                  and provisions of this agreement. If you do not agree to abide by these terms, please do not use 
                  our service.
                </p>
              </div>

              <div>
                <h2 className="portal-heading text-xl mb-4">2. Description of Service</h2>
                <p className="portal-text mb-4">
                  Smart Business Assistant provides an AI-powered business intelligence platform that includes:
                </p>
                <ul className="space-y-2 portal-text">
                  <li className="flex items-start gap-2">
                    <span className="text-[#F5A623]">•</span>
                    <span>Sales analytics and reporting</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#F5A623]">•</span>
                    <span>Inventory management</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#F5A623]">•</span>
                    <span>AI-powered insights and predictions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#F5A623]">•</span>
                    <span>CSV data import and analysis</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#F5A623]">•</span>
                    <span>Chatbot assistance</span>
                  </li>
                </ul>
              </div>

              <div>
                <h2 className="portal-heading text-xl mb-4">3. User Accounts</h2>
                <p className="portal-text mb-4">
                  To use certain features of the service, you must register for an account. You agree to:
                </p>
                <ul className="space-y-2 portal-text">
                  <li className="flex items-start gap-2">
                    <span className="text-[#F5A623]">•</span>
                    <span>Provide accurate and complete information</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#F5A623]">•</span>
                    <span>Maintain the security of your password</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#F5A623]">•</span>
                    <span>Notify us of unauthorized access</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#F5A623]">•</span>
                    <span>Be responsible for all activities under your account</span>
                  </li>
                </ul>
              </div>

              <div>
                <h2 className="portal-heading text-xl mb-4">4. User Responsibilities</h2>
                <p className="portal-text mb-4">
                  You agree not to:
                </p>
                <ul className="space-y-2 portal-text">
                  <li className="flex items-start gap-2">
                    <span className="text-[#F5A623]">•</span>
                    <span>Use the service for illegal purposes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#F5A623]">•</span>
                    <span>Violate any applicable laws or regulations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#F5A623]">•</span>
                    <span>Upload malicious or harmful content</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#F5A623]">•</span>
                    <span>Attempt to gain unauthorized access</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#F5A623]">•</span>
                    <span>Interfere with the service's operation</span>
                  </li>
                </ul>
              </div>

              <div>
                <h2 className="portal-heading text-xl mb-4">5. Data and Content</h2>
                <p className="portal-text mb-4">
                  Regarding your data:
                </p>
                <ul className="space-y-2 portal-text">
                  <li className="flex items-start gap-2">
                    <span className="text-[#F5A623]">•</span>
                    <span>You retain ownership of all data you provide</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#F5A623]">•</span>
                    <span>Your data is isolated and not shared with other users</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#F5A623]">•</span>
                    <span>You can request deletion of your data at any time</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#F5A623]">•</span>
                    <span>We use data only to provide and improve our services</span>
                  </li>
                </ul>
              </div>

              <div>
                <h2 className="portal-heading text-xl mb-4">6. Service Availability</h2>
                <p className="portal-text">
                  We strive for high availability but do not guarantee uninterrupted service. We reserve 
                  the right to suspend or terminate the service for maintenance, updates, or other reasons 
                  with reasonable notice when possible.
                </p>
              </div>

              <div>
                <h2 className="portal-heading text-xl mb-4">7. Limitation of Liability</h2>
                <p className="portal-text">
                  Smart Business Assistant shall not be liable for any indirect, incidental, special, or 
                  consequential damages arising from the use or inability to use our service. Our total 
                  liability is limited to the amount you paid for the service, if any.
                </p>
              </div>

              <div>
                <h2 className="portal-heading text-xl mb-4">8. Termination</h2>
                <p className="portal-text">
                  We reserve the right to terminate or suspend your account at our sole discretion, with 
                  or without cause, with or without notice. You may also terminate your account at any time 
                  through your profile settings.
                </p>
              </div>

              <div>
                <h2 className="portal-heading text-xl mb-4">9. Changes to Terms</h2>
                <p className="portal-text">
                  We may modify these terms at any time. Continued use of the service after changes constitutes 
                  acceptance of the new terms. We will notify users of significant changes via email or through 
                  the platform.
                </p>
              </div>

              <div>
                <h2 className="portal-heading text-xl mb-4">10. Contact</h2>
                <p className="portal-text">
                  For questions about these terms, please contact us at <Link href="/contact" className="text-[#F5A623] hover:underline">contact@smartbusiness.ai</Link>
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
              <Link href="/privacy" className="portal-nav-link">Privacy</Link>
              <Link href="/contact" className="portal-nav-link">Contact</Link>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
