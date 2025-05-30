import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css'; // ou le fichier où tu mets Tailwind ou tes styles

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
