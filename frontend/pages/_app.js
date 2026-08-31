import '../styles/globals.css';
import { Toaster } from 'react-hot-toast';
import { LanguageProvider } from '../lib/LanguageContext';
import { getUser } from '../lib/auth';

export default function App({ Component, pageProps }) {
  const user = getUser();
  const userLanguage = user?.language || 'en';
  
  return (
    <LanguageProvider userLanguage={userLanguage}>
      <Component {...pageProps} />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1e293b',
            color: '#f1f5f9',
            border: '1px solid #334155',
            borderRadius: '12px',
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#1e293b' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#1e293b' } },
        }}
      />
    </LanguageProvider>
  );
}
