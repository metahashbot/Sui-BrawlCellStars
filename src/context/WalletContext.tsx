import React, { createContext, useContext } from 'react';
import {
  useCurrentAccount,
  useConnectWallet,
  useDisconnectWallet,
  useSignAndExecuteTransaction, 
} from '@mysten/dapp-kit';
import { useSuiClient } from '@mysten/dapp-kit';
import { useWallets } from '@mysten/dapp-kit';
import { useState, useEffect } from 'react';
import { SuiTransactionBlock } from '@mysten/sui.js/client';
import { SuiClient } from '@mysten/sui/client'; // 尝试从 @mysten/sui 导入 SuiClient

// Wallet context type
export type WalletContextType = {
  walletConnected: boolean;
  connecting: boolean;
  walletAddress: string;
  balance: number;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  address: string | null;
  // 将属性名从 signAndExecuteTransaction 更改为 signAndExecuteTransactionBlock
  signAndExecuteTransactionBlock: ((txb: SuiTransactionBlock) => Promise<any>) | undefined;
  suiClient: SuiClient | undefined; // 添加 suiClient 类型
};

const initialState: WalletContextType = {
  walletConnected: false,
  connecting: false,
  walletAddress: '',
  balance: 0,
  connectWallet: async () => {},
  disconnectWallet: () => {},
  address: null, // 添加 address 初始值
  // 将属性名从 signAndExecuteTransaction 更改为 signAndExecuteTransactionBlock
  signAndExecuteTransactionBlock: undefined, // 添加 signAndExecuteTransaction初始值
  suiClient: undefined, // 添加 suiClient 初始值
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
  // Get signAndExecuteTransaction hook
  // 这里获取的 hook 名称是 mutateAsync，我们将其别名为 signAndExecuteTransactionBlock
  const { mutateAsync: signAndExecuteTransactionBlock } = useSignAndExecuteTransaction();
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
      console.log('Connecting wallet:', wallet.name);
      await connect({ wallet });
      console.log('Wallet connected successfully');
    } catch (error) {
      console.error('Failed to connect wallet in context:', error);
      // Re-throw the error so the caller (modal) can catch it
      throw error;
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
        address: account?.address || null, // 提供 address
        // 提供 signAndExecuteTransactionBlock
        signAndExecuteTransactionBlock: signAndExecuteTransactionBlock as any,
        suiClient: suiClient as SuiClient, // 提供 suiClient 并断言类型以解决类型错误
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => useContext(WalletContext);