import Head from 'next/head';
import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <>
      <Head>
        <title>Privacy Policy - Smart Business Assistant</title>
        <meta name="description" content="Privacy Policy for Smart Business Assistant" />
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
              Privacy Policy
            </h1>
            <p className="portal-text max-w-2xl">
              Last updated: August 2026
            </p>
          </div>
        </section>

        {/* Privacy Content */}
        <section className="py-16 px-5">
          <div className="max-w-4xl mx-auto">
            <div className="bg-[#111111] border border-white/10 rounded-lg p-8 space-y-8">
              <div>
                <h2 className="portal-heading text-xl mb-4">1. Information We Collect</h2>
                <p className="portal-text mb-4">
                  We collect information you provide directly to us, including:
                </p>
                <ul className="space-y-2 portal-text">
                  <li className="flex items-start gap-2">
                    <span className="text-[#F5A623]">•</span>
                    <span>Account information (name, email address)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#F5A623]">•</span>
                    <span>Business data (products, sales, inventory)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#F5A623]">•</span>
                    <span>CSV files uploaded for analysis</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#F5A623]">•</span>
                    <span>Chatbot interactions and queries</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#F5A623]">•</span>
                    <span>Usage data and preferences</span>
                  </li>
                </ul>
              </div>

              <div>
                <h2 className="portal-heading text-xl mb-4">2. How We Use Your Information</h2>
                <p className="portal-text mb-4">
                  We use your information to:
                </p>
                <ul className="space-y-2 portal-text">
                  <li className="flex items-start gap-2">
                    <span className="text-[#F5A623]">•</span>
                    <span>Provide and improve our services</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#F5A623]">•</span>
                    <span>Generate analytics and insights</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#F5A623]">•</span>
                    <span>Process AI predictions and recommendations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#F5A623]">•</span>
                    <span>Communicate with you about your account</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#F5A623]">•</span>
                    <span>Ensure security and prevent fraud</span>
                  </li>
                </ul>
              </div>

              <div>
                <h2 className="portal-heading text-xl mb-4">3. Data Security</h2>
                <p className="portal-text mb-4">
                  We implement industry-standard security measures to protect your data:
                </p>
                <ul className="space-y-2 portal-text">
                  <li className="flex items-start gap-2">
                    <span className="text-[#F5A623]">•</span>
                    <span>Encryption at rest and in transit</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#F5A623]">•</span>
                    <span>Secure authentication with JWT tokens</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#F5A623]">•</span>
                    <span>User data isolation (each user's data is separate)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#F5A623]">•</span>
                    <span>Regular security audits and updates</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#F5A623]">•</span>
                    <span>Access controls and authentication</span>
                  </li>
                </ul>
              </div>

              <div>
                <h2 className="portal-heading text-xl mb-4">4. Data Sharing</h2>
                <p className="portal-text mb-4">
                  We do not sell, rent, or share your personal data with third parties for marketing purposes. 
                  We may share data only in the following circumstances:
                </p>
                <ul className="space-y-2 portal-text">
                  <li className="flex items-start gap-2">
                    <span className="text-[#F5A623]">•</span>
                    <span>With your explicit consent</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#F5A623]">•</span>
                    <span>To comply with legal obligations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#F5A623]">•</span>
                    <span>To protect our rights and property</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#F5A623]">•</span>
                    <span>With service providers who assist our operations (under strict confidentiality)</span>
                  </li>
                </ul>
              </div>

              <div>
                <h2 className="portal-heading text-xl mb-4">5. Data Retention</h2>
                <p className="portal-text">
                  We retain your data for as long as your account is active or as needed to provide our services. 
                  You may request deletion of your account and all associated data at any time through your 
                  profile settings. Upon deletion, all data is permanently removed from our systems within 30 days.
                </p>
              </div>

              <div>
                <h2 className="portal-heading text-xl mb-4">6. Your Rights</h2>
                <p className="portal-text mb-4">
                  You have the right to:
                </p>
                <ul className="space-y-2 portal-text">
                  <li className="flex items-start gap-2">
                    <span className="text-[#F5A623]">•</span>
                    <span>Access your personal data</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#F5A623]">•</span>
                    <span>Correct inaccurate data</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#F5A623]">•</span>
                    <span>Delete your data</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#F5A623]">•</span>
                    <span>Export your data</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#F5A623]">•</span>
                    <span>Opt out of non-essential data processing</span>
                  </li>
                </ul>
              </div>

              <div>
                <h2 className="portal-heading text-xl mb-4">7. Cookies and Tracking</h2>
                <p className="portal-text">
                  We use cookies and similar technologies to improve user experience, analyze usage patterns, 
                  and maintain security. You can control cookie settings through your browser preferences.
                </p>
              </div>

              <div>
                <h2 className="portal-heading text-xl mb-4">8. Third-Party Services</h2>
                <p className="portal-text">
                  Our service may integrate with third-party AI services for data analysis and predictions. 
                  These services are bound by strict data protection agreements and do not retain your data 
                  beyond the duration of the analysis.
                </p>
              </div>

              <div>
                <h2 className="portal-heading text-xl mb-4">9. Children's Privacy</h2>
                <p className="portal-text">
                  Our service is not intended for children under 13. We do not knowingly collect personal 
                  information from children under 13. If we become aware of such collection, we will take 
                  steps to delete it.
                </p>
              </div>

              <div>
                <h2 className="portal-heading text-xl mb-4">10. International Data Transfers</h2>
                <p className="portal-text">
                  Your data may be processed and stored on servers located in various countries. We ensure 
                  appropriate safeguards are in place to protect your data in accordance with this privacy 
                  policy and applicable laws.
                </p>
              </div>

              <div>
                <h2 className="portal-heading text-xl mb-4">11. Changes to Privacy Policy</h2>
                <p className="portal-text">
                  We may update this privacy policy from time to time. We will notify users of significant 
                  changes via email or through the platform. Continued use of the service after changes 
                  constitutes acceptance of the new policy.
                </p>
              </div>

              <div>
                <h2 className="portal-heading text-xl mb-4">12. Contact</h2>
                <p className="portal-text">
                  For questions about this privacy policy or your data, please contact us at 
                  <Link href="/contact" className="text-[#F5A623] hover:underline">contact@smartbusiness.ai</Link>
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
              <Link href="/terms" className="portal-nav-link">Terms</Link>
              <Link href="/contact" className="portal-nav-link">Contact</Link>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
