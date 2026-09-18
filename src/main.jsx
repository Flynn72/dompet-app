import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import * as Sentry from '@sentry/react';
import App from './App.jsx';
import ErrorFallback from './components/ErrorFallback.jsx';
import './styles/global.css';

// Sentry hanya diaktifkan kalau DSN di-set (env var VITE_SENTRY_DSN di Vercel).
// Tanpa DSN, Sentry.init() di-skip total — supaya dev lokal / preview tanpa env var
// tidak muncul warning/error di console gara-gara DSN kosong.
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: import.meta.env.MODE, // 'production' / 'development'
    // Cuma error monitoring dulu (sesuai kebutuhan), bukan performance tracing —
    // tracesSampleRate 0 supaya tidak makan kuota Sentry gratis untuk hal yang belum diminta.
    // Boleh dinaikkan (mis. 0.1) nanti kalau mau lihat performance trace juga.
    tracesSampleRate: 0,
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Sentry.ErrorBoundary fallback={<ErrorFallback />}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Sentry.ErrorBoundary>
  </React.StrictMode>
);
