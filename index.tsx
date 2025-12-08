import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Global Error Handler for Startup Crashes (e.g. Process not defined)
window.addEventListener('error', (e) => {
  const root = document.getElementById('root');
  if (root && root.innerHTML === "") {
    document.body.innerHTML = `
      <div style="font-family: sans-serif; background: #0f172a; color: #ef4444; height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px; text-align: center;">
        <h1 style="font-size: 24px; margin-bottom: 10px;">Startup Error</h1>
        <p style="color: #cbd5e1; max-width: 600px; line-height: 1.5;">${e.message}</p>
        <p style="margin-top: 20px; font-size: 14px; color: #94a3b8;">If you are on Netlify, ensure you set your API Key in environment variables.</p>
      </div>
    `;
  }
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);