import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SuiClientProvider, WalletProvider } from "@mysten/dapp-kit";
import { networkConfig } from './config/networkConfig.tsx'

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
    <SuiClientProvider defaultNetwork="testnet" networks={networkConfig}>
      <WalletProvider autoConnect>
        <App />
      </WalletProvider>
    </SuiClientProvider>
    </QueryClientProvider>
  </StrictMode>
);
