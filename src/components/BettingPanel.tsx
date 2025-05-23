import React, { useState, useEffect } from 'react'; 
import { useBetting } from '../context/BettingContext';
import { useWallet } from '../context/WalletContext';
import { useGame } from '../context/GameContext';
import { TrendingUp, CreditCard, ArrowUpRight } from 'lucide-react';

const BettingPanel: React.FC = () => {
  const { walletConnected, balance } = useWallet();
  const { gameState } = useGame();
  const {
    bettingEnabled,
    bettingClosing,
    makeBet,
    loading,
    fetchOdds, // 从Context获取 fetchOdds 函数
    currentGameId, // 从Context获取当前游戏ID
  } = useBetting();

  const [selectedEntityId, setSelectedEntityId] = useState<number | null>(null);
  const [betAmount, setBetAmount] = useState<number>(0.1);
  const [displayedOdds, setDisplayedOdds] = useState<number | null>(null); // 新增状态来存储从合约获取的赔率

  // Combine players and AI agents
  const allEntities = [
    ...gameState.players.map(player => ({
      ...player,
      isAI: false,
      // odds: 1 + (10 / (player.score + 1)), // 移除或注释掉本地计算的赔率
    })),
    ...gameState.aiAgents.map(agent => ({
      ...agent,
      isAI: true,
      // odds: 1 + (10 / (agent.score + 1)), // 移除或注释掉本地计算的赔率
    })),
  ];

  // Sort by score descending
  const sortedEntities = allEntities.sort((a, b) => b.score - a.score);

  // Calculate potential winnings (使用传入的赔率)
  const calculateWinnings = (amount: number, odds: number) => {
    return amount * odds;
  };

  // 当 selectedEntityId 或 currentGameId 变化时，从合约获取赔率
  useEffect(() => {
    const updateOdds = async () => {
      if (selectedEntityId !== null && currentGameId) {
        // TODO: 确保 selectedEntityId 映射到合约期望的 1-8 范围
        // 例如： const contractPlayerId = mapEntityIdToContractPlayerId(selectedEntityId);
        // 在调用 fetchOdds 之前，可能需要根据您的游戏状态 entity.id 找到对应的合约 player_id
        // 假设这里的 selectedEntityId 就是合约期望的 player_id (1-8)
        setDisplayedOdds(null); // 在加载新赔率前清空
        const odds = await fetchOdds(selectedEntityId); // 调用从合约获取赔率的函数
        setDisplayedOdds(odds);
      } else {
        setDisplayedOdds(null); // 如果没有选择实体或没有游戏ID，则清空赔率
      }
    };
    updateOdds();
  }, [selectedEntityId, currentGameId, fetchOdds]); // 添加 fetchOdds 到依赖项

  const handleBet = async () => {
    if (!walletConnected || !selectedEntityId || betAmount <= 0) return;

    if (betAmount > balance) {
      alert('Insufficient balance for this bet');
      return;
    }

    if (displayedOdds === null) {
        alert('Waiting for odds to load. Please try again.');
        return;
    }

    const selectedEntity = allEntities.find(entity => entity.id === selectedEntityId);
    if (!selectedEntity) return;

    // TODO: 获取一个有效的 coinObjectId 用于下注
    // 这部分逻辑非常重要，您需要根据您的钱包集成来正确实现
    // 例如，如果您的 useWallet hook 提供了获取用户 SUI coins 的方法：
    // const suiCoins = await getSuiCoins(); // 假设 useWallet 提供了这个函数
    // if (!suiCoins || suiCoins.length === 0) {
    //   alert('没有可用的SUI代币进行下注');
    //   return;
    // }
    // // 选择一个合适的 coin，例如第一个，或者面额大于下注金额的
    // // 注意：这里可能需要更复杂的逻辑来处理多个小额币对象
    // const amountMist = Math.floor(betAmount * 1_000_000_000);
    // const coinToUse = suiCoins.find(coin => Number(coin.balance) >= amountMist);
    // if (!coinToUse) {
    //    alert('没有足够面额的SUI代币进行下注');
    //    return;
    // }
    // const coinObjectIdForBet = coinToUse.coinObjectId;

    // ---- 临时的 coinObjectId，您必须替换它 ----
    const coinObjectIdForBet = "0xYOUR_COIN_OBJECT_ID_FOR_BETS"; // <--- 替换这里！！！
    if (coinObjectIdForBet === "0xYOUR_COIN_OBJECT_ID_FOR_BETS") {
        alert("请在 BettingPanel.tsx 中配置一个有效的 coinObjectIdForBet 来进行测试！");
        return;
    }
    // ---- 临时的 coinObjectId 结束 ----

    // 注意：selectedEntity.id 应该是合约期望的 playerId (1-8)
    // 如果您的 entity.id 不是这个范围，需要进行映射
    // 例如： const contractPlayerId = mapEntityIdToContractPlayerId(selectedEntity.id);
    const result = await makeBet(selectedEntity.id, betAmount, coinObjectIdForBet);

    // 根据 makeBet 的返回结果提供用户反馈
    if (result?.success) {
        alert(`下注成功！交易摘要: ${result.digest}`);
        // TODO: 成功后的其他操作，例如刷新余额，清空下注金额等
    } else if (result?.error) {
        alert(`下注失败: ${result.error}`);
    } else {
        // makeBet 返回 undefined，通常是因为前置检查失败
        // 相关的提示已经在 makeBet 内部处理了
    }
  };

  if (!bettingEnabled && !bettingClosing) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-4 border-b border-gray-700 bg-gray-800">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <TrendingUp size={18} className="text-green-400" />
            Betting
          </h2>
        </div>

        <div className="flex-grow flex items-center justify-center p-6">
          <div className="text-center">
            <div className="text-lg font-medium mb-2">Betting will open soon</div>
            <p className="text-gray-400">
              Once the match progresses, you'll be able to place bets on players.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-700 bg-gray-800">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <TrendingUp size={18} className="text-green-400" />
          Betting {bettingClosing && <span className="text-sm text-red-400 ml-2">Closing Soon</span>}
        </h2>
      </div>

      <div className="flex-grow overflow-y-auto p-4">
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-300 mb-2">Select Player to Bet On</h3>
          <div className="grid grid-cols-1 gap-2">
            {sortedEntities.slice(0, 5).map((entity) => (
              <button
                key={entity.id}
                className={`p-3 rounded border ${
                  selectedEntityId === entity.id
                    ? 'bg-purple-900/40 border-purple-500'
                    : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                }`}
                onClick={() => setSelectedEntityId(entity.id)}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: entity.color }}
                  ></div>

                  <div className="flex-grow">
                    <div className="flex items-center gap-1">
                      <span className="font-medium">{entity.name}</span>
                      {entity.isAI && (
                        <span className="text-xs px-1.5 py-0.5 bg-purple-800 rounded text-purple-200">
                          AI
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400">
                      Score: {entity.score}
                    </div>
                  </div>

                  {/* 显示从合约获取的赔率，如果可用 */}
                  <div className="text-amber-400 font-medium">
                    {selectedEntityId === entity.id && displayedOdds !== null ? (
                      `${displayedOdds.toFixed(2)}x`
                    ) : (
                      // 如果赔率未加载，可以显示本地计算的赔率作为加载或备用，或者显示加载状态
                      // 这里暂时显示本地计算的赔率作为备用
                      `${(1 + (10 / (entity.score + 1))).toFixed(2)}x`
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-300 mb-2">Bet Amount (SUI)</h3>
          <div className="flex gap-2">
            {[0.1, 0.5, 1, 5].map(amount => (
              <button
                key={amount}
                className={`px-3 py-1.5 rounded ${
                  betAmount === amount
                    ? 'bg-purple-600'
                    : 'bg-gray-700 hover:bg-gray-650'
                }`}
                onClick={() => setBetAmount(amount)}
              >
                {amount}
              </button>
            ))}
          </div>

          <div className="mt-3">
            <input
              type="range"
              min="0.1"
              max="10"
              step="0.1"
              value={betAmount}
              onChange={(e) => setBetAmount(parseFloat(e.target.value))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gray-700"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>0.1</span>
              <span>10 SUI</span>
            </div>
          </div>
        </div>

        {selectedEntityId && (
          <div className="mb-6 p-3 bg-gray-800 rounded border border-gray-700">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-400">Your bet:</span>
              <span>{betAmount} SUI</span>
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-400">Odds:</span>
              {/* 显示从合约获取的赔率 */}
              <span>{displayedOdds !== null ? displayedOdds.toFixed(2) : 'Loading...'}x</span>
            </div>
            <div className="flex justify-between font-medium">
              <span className="text-gray-300">Potential win:</span>
              <span className="text-green-400">
                {/* 使用从合约获取的赔率计算潜在奖金 */}
                {calculateWinnings(
                  betAmount,
                  displayedOdds || 1 // 如果赔率未加载，使用1作为默认值
                ).toFixed(2)} SUI
              </span>
            </div>
          </div>
        )}

        <button
          className={`w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 ${
            walletConnected && selectedEntityId && betAmount > 0 && betAmount <= balance && !loading && displayedOdds !== null // 添加 !loading 和 displayedOdds !== null
              ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90'
              : 'bg-gray-700 cursor-not-allowed'
          }`}
          onClick={handleBet}
          disabled={!walletConnected || !selectedEntityId || betAmount <= 0 || betAmount > balance || loading || displayedOdds === null} // 添加 loading 和 displayedOdds === null 到 disabled
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </>
          ) : (
            <>
              <CreditCard size={18} />
              Place Bet
              <ArrowUpRight size={18} />
            </>
          )}
        </button>

        {!walletConnected && (
          <div className="text-center text-red-400 text-sm mt-2">
            Connect wallet to place bets
          </div>
        )}
        {walletConnected && betAmount > balance && (
          <div className="text-center text-red-400 text-sm mt-2">
            Insufficient balance
          </div>
        )}
         {walletConnected && selectedEntityId && displayedOdds === null && !loading && (
          <div className="text-center text-yellow-400 text-sm mt-2">
            Fetching odds...
          </div>
        )}
      </div>
    </div>
  );
};

export default BettingPanel;