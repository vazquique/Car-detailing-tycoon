import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/russo-one/latin-400.css';
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-500.css';
import '@fontsource/inter/latin-700.css';
import './styles/global.css';
import { App } from './App';
import { boot } from './boot';

boot();

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
