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
            <button
              className="not-found-menu"
              type="button"
              aria-label="Open menu"
            >
              <Menu size={12} />
              <span>Menu</span>
            </button>
            <Link href="/" className="not-found-brand">
              Smart Business<span>.</span>
            </Link>
          </header>

          <section
            className="not-found-content"
            aria-labelledby="not-found-title"
          >
            <div className="not-found-orbit orbit-one" />
            <div className="not-found-orbit orbit-two" />
            <div className="not-found-code" aria-hidden="true">
              <span>4</span>
              <i>0</i>
              <span>4</span>
            </div>
            <div className="not-found-sticker sticker-top">PAGE LOST</div>
            <div className="not-found-sticker sticker-bottom">NO SIGNAL</div>

            <div className="not-found-copy">
              <p className="not-found-kicker">Navigation interrupted</p>
              <h1 id="not-found-title">This page took a wrong turn.</h1>
              <p>
                We searched everywhere, but this address is not connected to the
                dashboard.
              </p>
              <Link href="/" className="not-found-home-link">
                <Home size={14} />
                Go back home
                <MoveUpRight size={13} />
              </Link>
            </div>
          </section>

          <footer className="not-found-footer">
            <span>Smart Business Assistant</span>
            <span className="not-found-footer-line" />
            <span>404 / 2026</span>
          </footer>
        </div>

        <Link href="/contact" className="not-found-contact">
          <span>Need help?</span>
          <ArrowLeft size={13} />
        </Link>
      </main>
    </>
  );
}
