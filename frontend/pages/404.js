import Head from "next/head";
import Link from "next/link";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFoundPage() {
  return (
    <>
      <Head>
        <title>Page not found | Smart Business Assistant</title>
        <meta
          name="description"
          content="The requested page could not be found."
        />
      </Head>

      <main className="min-h-screen bg-canvas flex items-center justify-center p-8">
        <div className="max-w-2xl w-full text-center">
          {/* Index number */}
          <p className="font-mono text-micro uppercase text-ink-3 mb-8">
            Error <span className="text-ember-500">404</span>
          </p>

          {/* Statement */}
          <h1 className="font-display font-medium text-section text-ink mb-6 leading-tight">
            This page took a wrong turn.
          </h1>

          <p className="text-ink-2 leading-relaxed max-w-md mx-auto mb-10">
            We searched everywhere, but this address is not connected to the
            dashboard.
          </p>

          {/* Action */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/" className="btn-paper px-8 py-3">
              <Home size={15} />
              Go back home
            </Link>
            <Link href="/contact" className="btn-outline px-8 py-3">
              <ArrowLeft size={15} />
              Need help?
            </Link>
          </div>

          {/* Footer line */}
          <div className="mt-16 flex items-center justify-center gap-6">
            <span className="micro text-ink-3">Smart Business Assistant</span>
            <div className="flex-1 h-px bg-line" />
            <span className="micro text-ink-3">404 / 2026</span>
          </div>
        </div>
      </main>
    </>
  );
}
