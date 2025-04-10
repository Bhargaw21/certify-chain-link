
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { Web3Provider } from './context/Web3Context';
import { UserProvider } from './context/UserContext';
import { RealTimeProvider } from './context/RealTimeContext';
import { Toaster } from './components/ui/toaster';
import { BrowserRouter } from 'react-router-dom';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Web3Provider>
        <UserProvider>
          <RealTimeProvider>
            <App />
            <Toaster />
          </RealTimeProvider>
        </UserProvider>
      </Web3Provider>
    </BrowserRouter>
  </React.StrictMode>
);
