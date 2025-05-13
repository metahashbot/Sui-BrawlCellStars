import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import { useBetting } from '../context/BettingContext';
import GameArena from '../components/GameArena';
import Leaderboard from '../components/Leaderboard';
import BettingPanel from '../components/BettingPanel';
import Header from '../components/Header';

const BettingPage: React.FC = () => {
  const navigate = useNavigate();
  const { walletConnected } = useWallet();
  const { bettingEnabled, timeUntilBetting, bettingClosing } = useBetting();
  const [timeLeft, setTimeLeft] = useState(360); // 6 minutes in seconds
  const [spectatingPlayerId, setSpectatingPlayerId] = useState(1); // Default to top player

  useEffect(() => {
    if (!walletConnected) {
      navigate('/');
    }
  }, [walletConnected, navigate]);

  useEffect(() => {
    // Set up the game timer
    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900">
      <Header minimal />
      
      <div className="flex flex-col lg:flex-row flex-grow overflow-hidden">
        <div className="lg:w-3/4 h-full flex flex-col">
          <div className="px-4 py-2 bg-gray-800 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="text-sm font-medium">
                Match ID: <span className="text-cyan-400">#10245</span>
              </div>
              <div className="text-sm font-medium">
                Time: <span className="text-amber-400">{formatTime(timeLeft)}</span>
              </div>
            </div>
            <div className="text-sm font-medium">
              {!bettingEnabled && !bettingClosing && (
                <span className="text-yellow-400">
                  Betting opens in {formatTime(timeUntilBetting)}
                </span>
              )}
              {bettingEnabled && (
                <span className="text-green-400">Betting Open</span>
              )}
              {bettingClosing && (
                <span className="text-red-400">Betting Closing Soon</span>
              )}
            </div>
          </div>
          
          <div className="flex-grow relative overflow-hidden">
            <GameArena spectatorMode spectatingPlayerId={spectatingPlayerId} />
          </div>
        </div>
        
        <div className="lg:w-1/4 flex flex-col h-full">
          <div className="h-1/2 bg-gray-800 overflow-y-auto">
            <Leaderboard onPlayerSelect={setSpectatingPlayerId} spectatingPlayerId={spectatingPlayerId} />
          </div>
          <div className="h-1/2 bg-gray-800 border-t border-gray-700 overflow-y-auto">
            <BettingPanel />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BettingPage;