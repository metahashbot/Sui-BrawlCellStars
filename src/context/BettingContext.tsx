import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import {
  placeBetOnContract,
  createGameOnContract,
  endGameOnContract,
  getOddsFromContract,
  // getPoolValueFromContract // 如果需要，也可以导入
} from '../services/bettingContract';
import { useWallet } from './WalletContext';
// 从 @mysten/sui.js/transactions 导入 TransactionBlock，确保类型一致性
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { SuiTransactionBlockResponse } from '@mysten/sui.js/client'; // 导入更具体的返回类型

// 定义更详细的游戏信息类型 - 暂时简化，只用 string | null
// export type CurrentGameInfo = {
//   chainGameId: string; // 链上游戏对象的ID
//   backendRoomId: string; // 游戏后端的房间ID
// } | null;

type BettingContextType = {
  bettingEnabled: boolean;
  bettingClosing: boolean;
  timeUntilBetting: number;
  // 调整 Promise 返回类型为更具体的 SuiTransactionBlockResponse 或根据你的钱包适配器调整
  makeBet: (playerId: number, amountSui: number, coinObjectId: string) => Promise<{ success: boolean; digest?: string; error?: any } | undefined>;
  createNewGame: (initialPoolCoinId: string) => Promise<{ success: boolean; digest?: string; gameId?: string; error?: any } | undefined>;
  finishGame: (winnerId: number) => Promise<{ success: boolean; digest?: string; error?: any } | undefined>;
  fetchOdds: (playerId: number) => Promise<number | null>;
  currentGameId: string | null;
  setCurrentGameId: (gameId: string | null) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  backendRoomId: string | null;
  setBackendRoomId: (roomId: string | null) => void;
};

const initialState: BettingContextType = {
  bettingEnabled: false,
  bettingClosing: false,
  timeUntilBetting: 60, // 示例时间
  // 移除模拟函数，将在 Provider 中实现
  makeBet: async () => undefined,
  createNewGame: async () => undefined,
  finishGame: async () => undefined,
  fetchOdds: async () => null,
  currentGameId: null,
  setCurrentGameId: () => {},
  loading: false,
  setLoading: () => {},
  backendRoomId: null,
  setBackendRoomId: () => {},
};

const BettingContext = createContext<BettingContextType>(initialState);

export const BettingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { walletConnected, address, signAndExecuteTransactionBlock } = useWallet();
  const [bettingEnabled, setBettingEnabled] = useState(initialState.bettingEnabled);
  const [bettingClosing, setBettingClosing] = useState(initialState.bettingClosing);
  const [timeUntilBetting, setTimeUntilBetting] = useState(initialState.timeUntilBetting);
  const [currentGameId, setCurrentGameIdInternal] = useState<string | null>(initialState.currentGameId); // 链上游戏ID
  const [backendRoomId, setBackendRoomIdInternal] = useState<string | null>(initialState.backendRoomId); // 后端房间ID
  const [loading, setLoading] = useState(initialState.loading);

  // 包装 setCurrentGameId 以便在 Context 外部使用
  const setCurrentGameId = useCallback((gameId: string | null) => {
    setCurrentGameIdInternal(gameId);
  }, []);

  const setBackendRoomId = useCallback((roomId: string | null) => {
    setBackendRoomIdInternal(roomId);
  }, []);


  // Timer to handle betting states (可以保留用于UI)
  useEffect(() => {
    // ... timer logic ...
    // 示例：简单启用下注
    setBettingEnabled(true);
    const timer = setInterval(() => {
      setTimeUntilBetting(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const createNewGame = useCallback(async (initialPoolCoinId: string) => {
    if (!walletConnected || !signAndExecuteTransactionBlock) {
      alert('请先连接钱包。');
      return { success: false, error: '钱包未连接' };
    }
    if (!initialPoolCoinId) {
        alert('需要提供用于创建游戏资金池的Coin对象ID。');
        return { success: false, error: '缺少Coin对象ID' };
    }

    setLoading(true);
    try {
      console.log(`调用合约创建新游戏, Coin ID: ${initialPoolCoinId}`);
      // 类型断言：先转为 unknown，再转为期望的类型
      const result = await createGameOnContract(
        initialPoolCoinId,
        signAndExecuteTransactionBlock as unknown as (txb: TransactionBlock) => Promise<SuiTransactionBlockResponse>
      );
      if (result.success && result.gameId) {
        setCurrentGameIdInternal(result.gameId); // 存储链上游戏ID
        console.log('合约游戏创建成功, 链上 Game ID:', result.gameId);
        // backendRoomId 应该由 BettingPage 在选择房间时设置
        // alert(`新游戏已在链上创建！链上游戏ID: ${result.gameId}`);
        return { success: true, gameId: result.gameId, digest: result.digest };
      } else {
        console.error('合约游戏创建失败:', result.error);
        alert(`创建游戏失败: ${result.error || '未知错误'}`);
        return { success: false, error: result.error, digest: result.digest };
      }
    } catch (error) {
      console.error('创建新游戏异常:', error);
      alert(`创建游戏异常: ${error}`);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }, [walletConnected, signAndExecuteTransactionBlock]);

  const makeBet = useCallback(async (playerId: number, amountSui: number, coinObjectId: string) => {
    if (!walletConnected || !signAndExecuteTransactionBlock) {
      alert('请先连接钱包。');
      return undefined;
    }
    if (!currentGameId) {
      alert('当前没有有效的链上游戏ID。');
      return undefined;
    }
    if (!coinObjectId) {
        alert('需要提供用于下注的Coin对象ID。');
        return undefined;
    }

    setLoading(true);
    const amountMist = Math.floor(amountSui * 1_000_000_000); // SUI to MIST
    try {
      console.log(`调用合约下注: PlayerID=${playerId}, Amount=${amountSui} SUI (${amountMist} MIST), ChainGameID=${currentGameId}, CoinID=${coinObjectId}`);
      // 类型断言：先转为 unknown，再转为期望的类型
      const result = await placeBetOnContract(
        currentGameId,
        playerId,
        amountMist,
        coinObjectId,
        signAndExecuteTransactionBlock as unknown as (txb: TransactionBlock) => Promise<SuiTransactionBlockResponse>
      );
      if (result.success) {
        // alert(`下注成功！交易摘要: ${result.digest}`);
        console.log('下注成功, Digest:', result.digest);
      } else {
        alert(`下注失败: ${result.error || '未知错误'}`);
        console.error('下注失败:', result.error);
      }
      return result;
    } catch (error) {
      alert(`下注异常: ${error}`);
      console.error('下注异常:', error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }, [walletConnected, signAndExecuteTransactionBlock, currentGameId]);

  const finishGame = useCallback(async (winnerId: number) => {
    if (!walletConnected || !signAndExecuteTransactionBlock) {
      alert('请先连接钱包。');
      return { success: false, error: '钱包未连接' };
    }
    if (!currentGameId) {
      alert('当前没有有效的链上游戏ID来结束。');
      return { success: false, error: '无有效游戏ID' };
    }
    setLoading(true);
    try {
      console.log(`调用合约结束游戏: WinnerID=${winnerId}, ChainGameID=${currentGameId}`);
      // 类型断言：先转为 unknown，再转为期望的类型
      const result = await endGameOnContract(
        currentGameId,
        winnerId,
        signAndExecuteTransactionBlock as unknown as (txb: TransactionBlock) => Promise<SuiTransactionBlockResponse>
      );
      if (result.success) {
        alert(`游戏 ${currentGameId} 已在链上结束，获胜者: ${winnerId}。交易摘要: ${result.digest}`);
        setCurrentGameIdInternal(null); // 清除链上游戏ID
        setBackendRoomIdInternal(null); // 清除后端房间ID
      } else {
        alert(`结束游戏失败: ${result.error || '未知错误'}`);
      }
      return result;
    } catch (error) {
      alert(`结束游戏异常: ${error}`);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }, [walletConnected, signAndExecuteTransactionBlock, currentGameId]);

  const fetchOdds = useCallback(async (playerId: number) => {
    if (!currentGameId) {
      console.warn('FetchOdds：没有当前链上游戏ID');
      return null;
    }
    setLoading(true);
    try {
      console.log(`调用合约获取赔率: PlayerID=${playerId}, ChainGameID=${currentGameId}`);
      const odds = await getOddsFromContract(currentGameId, playerId);
      console.log(`获取到玩家 ${playerId} 的赔率: ${odds}`);
      return odds;
    } catch (error) {
      console.error('获取赔率异常:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentGameId]);


  // 监听 iframe 游戏结束消息
  useEffect(() => {
    const handleGameMessage = (event: MessageEvent) => {
      if (event.data && event.data.action === 'game_ended' && event.data.winnerId !== undefined && currentGameId && backendRoomId === event.data.gameId) {
        // 确保是当前后端房间的游戏结束了
        console.log('从 iframe 接收到游戏结束消息, 获胜者ID:', event.data.winnerId, '针对后端房间ID:', event.data.gameId);
        finishGame(event.data.winnerId);
      }
    };
    window.addEventListener('message', handleGameMessage);
    return () => window.removeEventListener('message', handleGameMessage);
  }, [finishGame, currentGameId, backendRoomId]);


  return (
    <BettingContext.Provider
      value={{
        bettingEnabled,
        bettingClosing,
        timeUntilBetting,
        makeBet,
        createNewGame,
        finishGame,
        fetchOdds,
        currentGameId, // 链上游戏ID
        setCurrentGameId, // 允许外部设置链上游戏ID
        loading,
        setLoading,
        backendRoomId, // 后端房间ID
        setBackendRoomId, // 允许外部设置后端房间ID
      }}
    >
      {children}
    </BettingContext.Provider>
  );
};

export const useBetting = () => useContext(BettingContext);