import React, { createContext, useState, useContext, useEffect, useCallback } from 'react'; // 导入 useCallback
import { useWallet } from './WalletContext';
import { placeBetOnContract, createGameOnContract, endGameOnContract, getOddsFromContract } from '../services/bettingContract';
import { SuiTransactionBlock } from '@mysten/sui.js/client'; // 将 TransactionBlock 更改为 SuiTransactionBlock



type BettingContextType = {
  bettingEnabled: boolean;
  bettingClosing: boolean;
  timeUntilBetting: number;
  makeBet: (playerId: number, amountSui: number, coinObjectId: string) => Promise<{ success: boolean; digest?: string; error?: any } | undefined>;
  createNewGame: (initialPoolCoinId: string) => Promise<{ success: boolean; digest?: string; gameId?: string; error?: any } | undefined>;
  finishGame: (winnerId: number) => Promise<{ success: boolean; digest?: string; error?: any } | undefined>;
  fetchOdds: (playerId: number) => Promise<number | null>;
  currentGameId: string | null;
  loading: boolean;
};

// 更新 initialState
const initialState: BettingContextType = {
  bettingEnabled: false,
  bettingClosing: false,
  timeUntilBetting: 60, // 60 seconds until betting opens
  makeBet: async () => undefined,
  createNewGame: async () => undefined,
  finishGame: async () => undefined,
  fetchOdds: async () => null,
  currentGameId: null,
  loading: false,
};

const BettingContext = createContext<BettingContextType>(initialState);

export const BettingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { walletConnected, address, signAndExecuteTransactionBlock, suiClient } = useWallet();
  const [bettingEnabled, setBettingEnabled] = useState(false);
  const [bettingClosing, setBettingClosing] = useState(false);
  const [timeUntilBetting, setTimeUntilBetting] = useState(60);
  const [currentGameId, setCurrentGameId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Timer to handle betting states (保留或根据实际游戏流程调整)
  useEffect(() => {
    // Initially betting is closed for first minute
    const bettingTimer = setInterval(() => {
      setTimeUntilBetting(prev => {
        if (prev <= 1) {
          clearInterval(bettingTimer);
          setBettingEnabled(true);

          // Schedule betting closing
          setTimeout(() => {
            setBettingClosing(true);

            // Close betting after 30 seconds of warning
            setTimeout(() => {
              setBettingEnabled(false);
              setBettingClosing(false);
            }, 30000);
          }, 180000); // 3 minutes of betting time

          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(bettingTimer);
    };
  }, []);

  // 示例：结束游戏 (使用 useCallback 包装)
  const finishGame = useCallback(async (winnerId: number) => {
    if (!signAndExecuteTransactionBlock) {
      alert('请先连接钱包');
      return undefined;
    }
    if (!currentGameId) {
      alert('没有当前游戏ID来结束游戏');
      return undefined;
    }
    setLoading(true);
    console.log('尝试结束游戏...');
    try {
        const result = await endGameOnContract(
            currentGameId,
            winnerId,
            signAndExecuteTransactionBlock as any // 强制类型转换
        );
        if (result.success) {
            alert(`游戏结束成功！交易摘要: ${result.digest}`);
            setCurrentGameId(null); // 游戏结束后清除当前游戏ID
            // TODO: 可能需要触发事件或更新状态来通知 UI 游戏已结束
        } else {
            alert(`结束游戏失败: ${result.error}`);
        }
        return result;
    } catch (error) {
        console.error('结束游戏过程中发生错误:', error);
        alert(`结束游戏过程中发生错误: ${error}`);
        return { success: false, error };
    } finally {
        setLoading(false);
    }
  }, [currentGameId, signAndExecuteTransactionBlock]); // 添加依赖项

  // 监听来自 iframe 的游戏结束消息 (示例)
  useEffect(() => {
    const handleGameMessage = (event: MessageEvent) => {
      // 确保消息来自您的 iframe 源，如果需要更严格的检查
      // if (event.origin !== 'http://localhost:3000') return;

      if (event.data && event.data.action === 'game_ended' && event.data.winnerId) {
        console.log('从 iframe 接收到游戏结束消息, 获胜者ID:', event.data.winnerId);
        // 调用合约的 endGame 函数
        finishGame(event.data.winnerId);
      }
    };

    window.addEventListener('message', handleGameMessage);

    return () => {
      window.removeEventListener('message', handleGameMessage);
    };
  }, [finishGame]); // finishGame 现在是稳定的，可以作为依赖项

  // 示例：创建一个新游戏 (使用 useCallback 包装)
  const createNewGame = useCallback(async (initialPoolCoinId: string) => {
    if (!signAndExecuteTransactionBlock) {
      alert('请先连接钱包');
      return undefined;
    }
    setLoading(true);
    console.log('尝试创建新游戏...');
    try {
        const result = await createGameOnContract(initialPoolCoinId, signAndExecuteTransactionBlock as any);
        if (result.success && result.gameId) {
          setCurrentGameId(result.gameId);
          alert(`新游戏创建成功！游戏ID: ${result.gameId}`);
          // TODO: 可能需要将 gameId 保存到全局状态或通知其他部分
        } else {
          alert(`创建游戏失败: ${result.error}`);
        }
        return result;
    } catch (error) {
        console.error('创建游戏过程中发生错误:', error);
        alert(`创建游戏过程中发生错误: ${error}`);
        return { success: false, error };
    } finally {
        setLoading(false);
    }
  }, [signAndExecuteTransactionBlock]); // 添加依赖项

  // Make a bet (使用 useCallback 包装)
  const makeBet = useCallback(async (playerId: number, amountSui: number, coinObjectId: string) => {
    if (!walletConnected || !address) {
      alert('请先连接钱包');
      return undefined;
    }
    if (!signAndExecuteTransactionBlock) {
      alert('钱包未提供签名函数');
      return undefined;
    }
    if (!currentGameId) {
      alert('当前没有有效的游戏ID，请先创建或加入游戏');
      return undefined;
    }

    // 将 SUI 转换为 MIST (1 SUI = 10^9 MIST)
    const amountMist = Math.floor(amountSui * 1_000_000_000);

    console.log(`准备下注: 玩家ID=${playerId}, 金额=${amountSui} SUI (${amountMist} MIST), 游戏ID=${currentGameId}, 代币ID=${coinObjectId}`);

    // TODO: 在实际应用中，您需要一种方式来获取用于下注的 coinObjectId
    // 这通常由钱包提供，或者您需要从用户拥有的代币中选择一个
    // 这里的 coinObjectId 参数是临时的，您需要替换为实际逻辑

    setLoading(true);
    try {
      const result = await placeBetOnContract(
        currentGameId,
        playerId,
        amountMist,
        coinObjectId, // 这个 coinObjectId 应该是用户钱包中可用的 SUI 代币对象
        signAndExecuteTransactionBlock as any // 强制类型转换，确保类型匹配
      );

      if (result.success) {
        // alert(`下注成功！交易摘要: ${result.digest}`); // 成功提示可以在 UI 组件中处理
        // TODO: 更新UI，例如显示下注成功信息，或者刷新余额等
        // 可以在这里触发一个事件或更新状态来通知 BettingPanel
        // 例如，可以重新获取用户余额
      } else {
        // alert(`下注失败: ${result.error}`); // 失败提示可以在 UI 组件中处理
      }
      return result; // 返回结果
    } catch (error) {
      console.error('下注过程中发生错误:', error);
      // alert(`下注过程中发生错误: ${error}`); // 错误提示可以在 UI 组件中处理
      return { success: false, error }; // 返回错误
    } finally {
      setLoading(false);
    }
  }, [walletConnected, address, signAndExecuteTransactionBlock, currentGameId]); // 添加依赖项

  // 定义 fetchOdds 函数 (使用 useCallback 包装)
  const fetchOdds = useCallback(async (playerId: number) => {
    if (!suiClient || !currentGameId) {
        console.warn('无法获取赔率：Sui客户端或游戏ID不可用');
        return null;
    }
    // TODO: 确保 playerId 映射到合约期望的 1-8 范围
    // 例如： const contractPlayerId = mapEntityIdToContractPlayerId(playerId);
    console.log(`尝试获取玩家 ${playerId} 在游戏 ${currentGameId} 的赔率...`);
    try {
        // 移除 suiClient 参数，只传递 currentGameId 和 playerId
        const odds = await getOddsFromContract(currentGameId, playerId);
        console.log(`获取到赔率: ${odds}`);
        return odds;
    } catch (error) {
        console.error(`获取赔率失败 (玩家ID: ${playerId}, 游戏ID: ${currentGameId}):`, error);
        // alert(`获取赔率失败: ${error}`); // 可以在 UI 组件中处理错误提示
        return null;
    }
  }, [suiClient, currentGameId]); // 添加依赖项

  return (
    <BettingContext.Provider
      value={{
        bettingEnabled,
        bettingClosing,
        timeUntilBetting,
        makeBet,
        createNewGame,
        finishGame,
        fetchOdds, // 现在 fetchOdds 已经定义
        currentGameId,
        loading,
      }}
    >
      {children}
    </BettingContext.Provider>
  );
};

export const useBetting = () => useContext(BettingContext);