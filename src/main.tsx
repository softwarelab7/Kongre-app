import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { initAtRestVault } from './utils/atRestVault.ts';
import { isDesktopApp } from './utils/platform.ts';
import './index.css';
import './kongre-autolock.css';

// Inicializar la bóveda criptográfica de claves no extraíbles antes de montar React (tope de 2.5s)
await initAtRestVault(2500).catch((err) => {
  console.warn('[atRestVault] Arranque con almacenamiento de respaldo:', err);
});

const isDesktop = isDesktopApp();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
      {!isDesktop && (
        <>
          <Analytics />
          <SpeedInsights />
        </>
      )}
    </ErrorBoundary>
  </StrictMode>,
);
