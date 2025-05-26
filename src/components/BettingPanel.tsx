import React, { useState, useEffect } from 'react';
import { useBetting } from '../context/BettingContext';
import { useWallet } from '../context/WalletContext';
import { useGame } from '../context/GameContext'; // gameState 仍然可以用于显示玩家信息
import { TrendingUp, CreditCard, ArrowUpRight } from 'lucide-react';

// 移除 BettingPanelProps 和 gameId prop
// interface BettingPanelProps {
//   gameId: string;
// }
// const BettingPanel: React.FC<BettingPanelProps> = ({ gameId }) => {
const BettingPanel: React.FC = () => {
  const { walletConnected, balance, getPrimaryCoinObjectId } = useWallet(); // 添加 getPrimaryCoinObjectId
  const { gameState } = useGame(); // gameState 用于显示玩家/AI信息
  const {
    bettingEnabled,
    bettingClosing,
    makeBet,
    loading, // betting context loading state
    fetchOdds,
    currentGameId, // 从 BettingContext 获取链上游戏ID
  } = useBetting();

  const [selectedEntityId, setSelectedEntityId] = useState<number | null>(null); // 对应合约的 player_id (1-8)
  const [betAmount, setBetAmount] = useState<number>(0.1);
  const [displayedOdds, setDisplayedOdds] = useState<number | null>(null);

  // Combine players and AI agents
  const allEntities = [
    ...gameState.players.map(player => ({
      ...player,
      isAI: false,
      // 确保 entity.id 是合约期望的 player_id (1-8)
      // 如果 gameState.players[n].id 不是 1-8, 你需要在这里映射
      // 例如，如果 gameState.players 是0索引的，则 id: player.id + 1
    })),
    ...gameState.aiAgents.map(agent => ({
      ...agent,
      isAI: true,
      // 同上，确保 entity.id 是合约期望的 player_id (1-8)
      // 假设 AI agent 的 ID 也需要映射到 1-8 范围内不与玩家冲突的 ID
    })),
  ];
  // 这是一个示例，你需要根据你的 gameState 结构调整 ID 映射
  // 确保 selectedEntityId 最终是 1-8 范围内的数字


  // Sort by score descending
  const sortedEntities = allEntities.sort((a, b) => b.score - a.score);


  // Calculate potential winnings (使用传入的赔率)
  const calculateWinnings = (amount: number, odds: number) => {
    return amount * odds;
  };

  useEffect(() => {
    const updateOdds = async () => {
      if (selectedEntityId !== null && currentGameId) { // 使用 context 的 currentGameId
        setDisplayedOdds(null);
        console.log(`BettingPanel: Fetching odds for player ${selectedEntityId} in chain game ${currentGameId}`);
        const odds = await fetchOdds(selectedEntityId);
        setDisplayedOdds(odds);
      } else {
        setDisplayedOdds(null);
      }
    };
    updateOdds();
  }, [selectedEntityId, currentGameId, fetchOdds]);

  const handleBet = async () => {
    if (!walletConnected || selectedEntityId === null || betAmount <= 0 || !currentGameId) {
        if (!currentGameId) alert("没有有效的链上游戏ID进行下注。");
        return;
    }

    if (betAmount > balance) {
      alert('余额不足以支付此次下注。');
      return;
    }

    if (displayedOdds === null) {
        alert('正在加载赔率，请稍后再试。');
        return;
    }

    // 获取用于下注的 Coin Object ID
    const coinObjectIdForBet = await getPrimaryCoinObjectId(); // 从 WalletContext 获取
    if (!coinObjectIdForBet) {
        alert("无法获取有效的SUI Coin对象进行下注。请确保钱包中有足够的SUI。");
        return;
    }
    console.log(`BettingPanel: Attempting to bet on player ${selectedEntityId} with amount ${betAmount} SUI using coin ${coinObjectIdForBet} in chain game ${currentGameId}`);

    // selectedEntityId 应该已经是合约期望的 player_id (1-8)
    const result = await makeBet(selectedEntityId, betAmount, coinObjectIdForBet);

    if (result?.success) {
        alert(`下注成功！交易摘要: ${result.digest}`);
        // 可以考虑刷新余额或做其他UI更新
        setBetAmount(0.1); // 重置下注金额
        setSelectedEntityId(null); // 清除选择
    } else if (result?.error) {
        alert(`下注失败: ${result.error}`);
    }
    // 如果 result 是 undefined，通常是前置检查失败，相关 alert 已在 makeBet 或此处处理
  };

  if (!bettingEnabled && !bettingClosing) {
    return (
      <div className="h-full flex flex-col">
        {/* ... header ... */}
        <div className="flex-grow flex items-center justify-center p-6">
          <div className="text-center">
            <div className="text-lg font-medium mb-2">下注即将开放</div>
            <p className="text-gray-400">
              比赛开始后即可下注。
            </p>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="h-full flex flex-col">
      {/* ... header ... */}
      <div className="p-4 border-b border-gray-700 bg-gray-800">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <TrendingUp size={18} className="text-green-400" />
            下注面板 (游戏ID: {currentGameId ? currentGameId.slice(0, 6) + "..." : "N/A"})
            {bettingClosing && <span className="text-sm text-red-400 ml-2">即将关闭</span>}
          </h2>
      </div>

      <div className="flex-grow overflow-y-auto p-4">
        {/* ... player selection ... */}
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-300 mb-2">选择下注对象</h3>
          <div className="grid grid-cols-1 gap-2">
            {sortedEntities.slice(0, 8).map((entity) => ( // 显示最多8个实体
              <button
                key={entity.id} // 确保 entity.id 是唯一的
                className={`p-3 rounded border ${
                  selectedEntityId === entity.id // entity.id 应该是合约的 player_id
                    ? 'bg-purple-900/40 border-purple-500'
                    : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                }`}
                onClick={() => setSelectedEntityId(entity.id)} // 设置合约的 player_id
              >
                {/* ... entity display ... */}
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
                      分数: {entity.score}
                    </div>
                  </div>

                  <div className="text-amber-400 font-medium">
                    {selectedEntityId === entity.id && displayedOdds !== null ? (
                      `${displayedOdds.toFixed(2)}x`
                    ) : selectedEntityId === entity.id && loading ? (
                      '加载中...'
                    ) : (
                      // 可以显示一个默认文本或不显示赔率直到加载完成
                      '-.--x'
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ... bet amount selection ... */}
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-300 mb-2">下注金额 (SUI)</h3>
          {/* ... amount buttons and slider ... */}
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
              max={Math.max(10, balance > 0 ? Math.floor(balance) : 10)} // 动态调整最大值
              step="0.1"
              value={betAmount}
              onChange={(e) => setBetAmount(parseFloat(e.target.value))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gray-700"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>0.1</span>
              <span>{Math.max(10, balance > 0 ? Math.floor(balance) : 10)} SUI</span>
            </div>
          </div>
        </div>


        {/* ... potential winnings display ... */}
         {selectedEntityId !== null && (
          <div className="mb-6 p-3 bg-gray-800 rounded border border-gray-700">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-400">你的下注:</span>
              <span>{betAmount.toFixed(1)} SUI</span>
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-400">赔率:</span>
              <span>{displayedOdds !== null ? displayedOdds.toFixed(2) : (loading ? '加载中...' : 'N/A')}x</span>
            </div>
            <div className="flex justify-between font-medium">
              <span className="text-gray-300">预计赢得:</span>
              <span className="text-green-400">
                {displayedOdds !== null ? calculateWinnings(betAmount, displayedOdds).toFixed(2) : '0.00'} SUI
              </span>
            </div>
          </div>
        )}

        {/* ... bet button ... */}
        <button
          className={`w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 ${
            walletConnected && selectedEntityId !== null && betAmount > 0 && betAmount <= balance && !loading && displayedOdds !== null && currentGameId
              ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90'
              : 'bg-gray-700 cursor-not-allowed'
          }`}
          onClick={handleBet}
          disabled={!walletConnected || selectedEntityId === null || betAmount <= 0 || betAmount > balance || loading || displayedOdds === null || !currentGameId}
        >
          {/* ... button content (loading/normal) ... */}
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              处理中...
            </>
          ) : (
            <>
              <CreditCard size={18} />
              确认下注
              <ArrowUpRight size={18} />
            </>
          )}
        </button>

        {/* ... error/info messages ... */}
        {!walletConnected && (
          <div className="text-center text-red-400 text-sm mt-2">
            请连接钱包以进行下注
          </div>
        )}
        {walletConnected && betAmount > balance && (
          <div className="text-center text-red-400 text-sm mt-2">
            余额不足
          </div>
        )}
         {walletConnected && selectedEntityId !== null && displayedOdds === null && !loading && currentGameId && (
          <div className="text-center text-yellow-400 text-sm mt-2">
            正在获取赔率...
          </div>
        )}
        {!currentGameId && walletConnected && (
            <div className="text-center text-yellow-400 text-sm mt-2">
                请先选择一个游戏房间开始观战。
            </div>
        )}

      </div>
    </div>
  );
};

export default BettingPanel;