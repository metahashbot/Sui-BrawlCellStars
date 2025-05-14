import React, { createContext, useContext } from 'react';
import { useCurrentAccount, useConnectWallet, useDisconnectWallet } from '@mysten/dapp-kit';
import { useSuiClient } from '@mysten/dapp-kit';
import { useWallets } from '@mysten/dapp-kit';
import { useState, useEffect } from 'react';

// Wallet context type
export type WalletContextType = {
  walletConnected: boolean;
  connecting: boolean;
  walletAddress: string;
  balance: number;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
};

const initialState: WalletContextType = {
  walletConnected: false,
  connecting: false,
  walletAddress: '',
  balance: 0,
  connectWallet: async () => {},
  disconnectWallet: () => {},
};

const WalletContext = createContext<WalletContextType>(initialState);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Get current account
  const account = useCurrentAccount();
  // Wallet connection hook
  const { mutateAsync: connect, isPending: connecting } = useConnectWallet();
  // Wallet disconnection hook
  const { mutate: disconnect } = useDisconnectWallet();
  // Get SUI client
  const suiClient = useSuiClient();
  // State management
  const [balance, setBalance] = useState(0);

  // Get wallet balance
  useEffect(() => {
    const fetchBalance = async () => {
      if (account?.address) {
        try {
          const { totalBalance } = await suiClient.getBalance({
            owner: account.address,
            coinType: "0x2::sui::SUI", // Using string constant instead of SUI_TYPE_ARG
          });
          
          // Convert to SUI units (1 SUI = 10^9 MIST)
          setBalance(Number(totalBalance) / 1e9);
        } catch (error) {
          console.error('Failed to fetch balance:', error);
          setBalance(0);
        }
      } else {
        setBalance(0);
      }
    };

    fetchBalance();
    
    // Set interval to refresh balance
    const intervalId = setInterval(fetchBalance, 10000); // Refresh every 10 seconds
    
    return () => clearInterval(intervalId);
  }, [account, suiClient]);

  const wallets = useWallets();

  // Connect wallet
  const connectWallet = async () => {
    try {
      const wallet = wallets[0];
      if (!wallet) {
        alert('No Sui wallet detected. Please install a wallet extension first.');
        return;
      }
      console.log('Connecting wallet:', wallet.name);
      await connect({ wallet });
      console.log('Wallet connected successfully');
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      alert('Failed to connect wallet. Please try again.');
    }
  };
  
  // Disconnect wallet
  const disconnectWallet = () => {
    try {
      disconnect();
      console.log('Wallet disconnected');
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
    }
  };

  return (
    <WalletContext.Provider
      value={{
        walletConnected: !!account,
        connecting,
        walletAddress: account?.address || '',
        balance,
        connectWallet,
        disconnectWallet,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => useContext(WalletContext);