import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx'; // Note the .jsx extension
import './index.css'; // Global CSS, if you have any

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);