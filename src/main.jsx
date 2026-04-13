import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';
import { FilterProvider } from './context/FilterContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <FilterProvider>
        <App />
      </FilterProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
