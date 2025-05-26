import React, { createContext, useContext } from 'react';
import {
  useCurrentAccount,
  useConnectWallet,
  useDisconnectWallet,
  useSignAndExecuteTransaction,
} from '@mysten/dapp-kit';
import { useSuiClient } from '@mysten/dapp-kit';
import { useWallets } from '@mysten/dapp-kit';
import { useState, useEffect, useCallback } from 'react'; // 引入 useCallback
import { SuiTransactionBlock } from '@mysten/sui.js/client';
import { SuiClient } from '@mysten/sui/client';

// Wallet context type
export type WalletContextType = {
  walletConnected: boolean;
  connecting: boolean;
  walletAddress: string;
  balance: number;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  address: string | null;
  signAndExecuteTransactionBlock: ((txb: SuiTransactionBlock) => Promise<any>) | undefined;
  suiClient: SuiClient | undefined;
  getPrimaryCoinObjectId: () => Promise<string | null>; // 添加 getPrimaryCoinObjectId 类型
};

const initialState: WalletContextType = {
  walletConnected: false,
  connecting: false,
  walletAddress: '',
  balance: 0,
  connectWallet: async () => {},
  disconnectWallet: () => {},
  address: null,
  signAndExecuteTransactionBlock: undefined,
  suiClient: undefined,
  getPrimaryCoinObjectId: async () => null, // 添加 getPrimaryCoinObjectId 初始值
};

const WalletContext = createContext<WalletContextType>(initialState);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const account = useCurrentAccount();
  const { mutateAsync: connect, isPending: connecting } = useConnectWallet();
  const { mutate: disconnect } = useDisconnectWallet();
  const suiClient = useSuiClient();
  const { mutateAsync: signAndExecuteTransactionBlock } = useSignAndExecuteTransaction();
  const [balance, setBalance] = useState(0);

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

  const connectWallet = async () => {
    try {
      const wallet = wallets[0];
      console.log('Connecting wallet:', wallet.name);
      await connect({ wallet });
      console.log('Wallet connected successfully');
    } catch (error) {
      console.error('Failed to connect wallet in context:', error);
      // Re-throw the error so the caller (modal) can catch it
      throw error;
    }
  };
  
  const disconnectWallet = () => {
    try {
      disconnect();
      console.log('Wallet disconnected');
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
    }
  };

  // Function to get a primary SUI coin object ID for transactions
  const getPrimaryCoinObjectId = useCallback(async (): Promise<string | null> => {
    if (!account?.address || !suiClient) {
      console.warn('WalletContext: Cannot get primary coin object ID. Wallet not connected or suiClient not available.');
      return null;
    }
    try {
      // Fetch SUI coin objects for the current account
      // We'll take the first one for simplicity, assuming it can be used for gas.
      // For more complex scenarios, you might want to find a coin with sufficient balance.
      const coinsResponse = await suiClient.getCoins({
        owner: account.address,
        coinType: '0x2::sui::SUI', // Standard SUI coin type
        limit: 1, // We only need one coin object ID
      });

      if (coinsResponse.data.length > 0) {
        return coinsResponse.data[0].coinObjectId;
      } else {
        console.warn('WalletContext: No SUI coin objects found for the connected wallet.');
        return null;
      }
    } catch (error) {
      console.error('WalletContext: Error fetching primary coin object ID:', error);
      return null;
    }
  }, [account?.address, suiClient]); // Dependencies for useCallback

  return (
    <WalletContext.Provider
      value={{
        walletConnected: !!account,
        connecting,
        walletAddress: account?.address || '',
        balance,
        connectWallet,
        disconnectWallet,
        address: account?.address || null,
        signAndExecuteTransactionBlock: signAndExecuteTransactionBlock as any,
        suiClient: suiClient as SuiClient,
        getPrimaryCoinObjectId, // 提供 getPrimaryCoinObjectId 函数
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => useContext(WalletContext);