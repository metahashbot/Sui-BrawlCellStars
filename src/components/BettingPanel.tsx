import React, { useState } from 'react';
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
    makeBet
  } = useBetting();
  
  const [selectedEntityId, setSelectedEntityId] = useState<number | null>(null);
  const [betAmount, setBetAmount] = useState<number>(0.1);
  
  // Combine players and AI agents
  const allEntities = [
    ...gameState.players.map(player => ({
      ...player,
      isAI: false,
      odds: 1 + (10 / (player.score + 1)), // Higher score = lower odds
    })),
    ...gameState.aiAgents.map(agent => ({
      ...agent,
      isAI: true,
      odds: 1 + (10 / (agent.score + 1)),
    })),
  ];
  
  // Sort by score descending
  const sortedEntities = allEntities.sort((a, b) => b.score - a.score);
  
  // Calculate potential winnings
  const calculateWinnings = (amount: number, odds: number) => {
    return amount * odds;
  };
  
  const handleBet = () => {
    if (!walletConnected || !selectedEntityId || betAmount <= 0) return;
    
    if (betAmount > balance) {
      alert('Insufficient balance for this bet');
      return;
    }
    
    const selectedEntity = allEntities.find(entity => entity.id === selectedEntityId);
    if (!selectedEntity) return;
    
    makeBet(selectedEntityId, betAmount, selectedEntity.odds);
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
                  
                  <div className="text-amber-400 font-medium">
                    {entity.odds.toFixed(2)}x
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
              <span>{allEntities.find(e => e.id === selectedEntityId)?.odds.toFixed(2)}x</span>
            </div>
            <div className="flex justify-between font-medium">
              <span className="text-gray-300">Potential win:</span>
              <span className="text-green-400">
                {calculateWinnings(
                  betAmount, 
                  allEntities.find(e => e.id === selectedEntityId)?.odds || 1
                ).toFixed(2)} SUI
              </span>
            </div>
          </div>
        )}
        
        <button
          className={`w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 ${
            walletConnected && selectedEntityId && betAmount > 0 && betAmount <= balance
              ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90'
              : 'bg-gray-700 cursor-not-allowed'
          }`}
          onClick={handleBet}
          disabled={!walletConnected || !selectedEntityId || betAmount <= 0 || betAmount > balance}
        >
          <CreditCard size={18} />
          Place Bet
          <ArrowUpRight size={18} />
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
      </div>
    </div>
  );
};

export default BettingPanel;