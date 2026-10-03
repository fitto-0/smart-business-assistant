import Head from "next/head";
import Link from "next/link";
import { ArrowLeft, Home, Menu, MoveUpRight } from "lucide-react";

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

      <main className="not-found-page">
        <div className="not-found-frame">
          <header className="not-found-header">
            <Link href="/dashboard" className="not-found-menu">
              <Menu size={13} aria-hidden="true" />
              <span>Dashboard</span>
            </Link>
            <Link href="/" className="not-found-brand">
              Smart Business<span>.</span>
            </Link>
          </header>

          <section
            className="not-found-content"
            aria-labelledby="not-found-title"
          >
            <div className="not-found-orbit orbit-one" aria-hidden="true" />
            <div className="not-found-orbit orbit-two" aria-hidden="true" />
            <div className="not-found-code" aria-hidden="true">
              <span>4</span>
              <i>0</i>
              <span>4</span>
            </div>
            <div className="not-found-sticker sticker-top" aria-hidden="true">
              PAGE LOST
            </div>
            <div
              className="not-found-sticker sticker-bottom"
              aria-hidden="true"
            >
              NO SIGNAL
            </div>

            <div className="not-found-copy">
              <p className="not-found-kicker">Navigation interrupted</p>
              <h1 id="not-found-title">This page took a wrong turn.</h1>
              <p>
                We searched everywhere, but this address is not connected to the
                dashboard.
              </p>
              <Link href="/" className="not-found-home-link">
                <Home size={15} aria-hidden="true" />
                <span>Go back home</span>
                <MoveUpRight size={14} aria-hidden="true" />
              </Link>
            </div>
          </section>

          <footer className="not-found-footer">
            <span>Smart Business Assistant</span>
            <span className="not-found-footer-line" aria-hidden="true" />
            <span>404 / 2026</span>
          </footer>
        </div>

        <Link href="/contact" className="not-found-contact">
          <span>Need help?</span>
          <ArrowLeft size={14} aria-hidden="true" />
        </Link>
      </main>
    </>
  );
}
