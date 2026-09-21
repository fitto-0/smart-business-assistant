import '../styles/globals.css';
import { Toaster } from 'react-hot-toast';
import { LanguageProvider } from '../lib/LanguageContext';
import { getUser } from '../lib/auth';
import Head from 'next/head';

export default function App({ Component, pageProps }) {
  const user = getUser();
  const userLanguage = user?.language || 'en';
  
  return (
    <>
      <Head>
        <link rel="icon" type="image/png" sizes="192x192" href="/favicon.png" />
        <link rel="apple-touch-icon" sizes="192x192" href="/favicon.png" />
      </Head>
      <LanguageProvider userLanguage={userLanguage}>
        <Component {...pageProps} />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#100C0B',
              color: '#EDE7DC',
              border: '1px solid rgb(242 236 228 / 0.10)',
              borderRadius: '2px',
              fontSize: '13px',
              padding: '10px 14px',
              boxShadow: 'none',
            },
            success: { iconTheme: { primary: '#7E9C6B', secondary: '#100C0B' } },
            error: { iconTheme: { primary: '#B3392B', secondary: '#100C0B' } },
          }}
        />
      </LanguageProvider>
    </>
  );
}
