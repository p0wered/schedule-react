import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './assets/index.css';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root элемент не найден');

createRoot(rootElement).render(
  <StrictMode>
    <App/>
  </StrictMode>
);
