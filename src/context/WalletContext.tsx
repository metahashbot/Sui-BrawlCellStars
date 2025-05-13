import React, { createContext, useContext } from 'react';
import { useCurrentAccount, useConnectWallet, useDisconnectWallet } from '@mysten/dapp-kit';
import { useSuiClientQuery } from '@mysten/dapp-kit';
import { useWallets } from '@mysten/dapp-kit';

// 钱包上下文类型
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
  // 获取当前账户
  const account = useCurrentAccount();
  // 钱包连接 hook
  const { mutateAsync: connect, isPending: connecting } = useConnectWallet();
  // 钱包断开 hook
  const { mutate: disconnect } = useDisconnectWallet();

  // 查询余额
  const { data: coins } = useSuiClientQuery(
    'getAllCoins',
    {
      owner: account?.address || '',
    },
    {
      enabled: !!account?.address,
    }
  );

  // 计算 SUI 余额（单位转换）
  const balance = coins?.data?.reduce((sum: number, coin: any) => sum + Number(coin.balance) / 1e9, 0) || 0;
  const wallets = useWallets();

  // 连接钱包
  const connectWallet = async () => {
    const wallet = wallets[0];
    if (!wallet) {
      alert('未检测到 Sui 钱包插件，请先安装钱包。');
      return;
    }
    await connect({ wallet });
  };
  // 断开钱包
  const disconnectWallet = () => {
    disconnect();
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