import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Bench bridge is loaded only when requested via query param (behavior-preserving for normal users).
if (new URLSearchParams(window.location.search).has('__bench')) {
  import('@bench').then(({ installBenchBridge }) => installBenchBridge());
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
