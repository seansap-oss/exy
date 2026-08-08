import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import Prototype from './Prototype';
import './index.css';
import './prototype.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Prototype />
  </StrictMode>,
);

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => undefined);
  });
}
