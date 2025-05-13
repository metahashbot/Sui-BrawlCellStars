import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import { useGame } from '../context/GameContext';
import GameArena from '../components/GameArena';
import Leaderboard from '../components/Leaderboard';
import GameControls from '../components/GameControls';
import Header from '../components/Header';
import ReviveModal from '../components/ReviveModal';

const GamePage: React.FC = () => {
  const navigate = useNavigate();
  const { walletConnected } = useWallet();
  const { gameState, playerState, startGame, endGame } = useGame();
  const [showReviveModal, setShowReviveModal] = useState(false);
  const [timeLeft, setTimeLeft] = useState(360); // 6 minutes in seconds

  useEffect(() => {
    if (!walletConnected) {
      navigate('/');
      return;
    }

    // Initialize the game
    startGame();

    // Cleanup when component unmounts
    return () => {
      endGame();
    };
  }, [walletConnected, navigate, startGame, endGame]);

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

  useEffect(() => {
    // Check if player has been consumed
    if (playerState.isDead && !showReviveModal) {
      setShowReviveModal(true);
    }
  }, [playerState.isDead, showReviveModal]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleRevive = () => {
    // Logic to revive player
    setShowReviveModal(false);
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
              Your Score: <span className="text-green-400">{playerState.score}</span>
            </div>
          </div>
          
          <div className="flex-grow relative overflow-hidden">
            <GameArena />
            <GameControls />
          </div>
        </div>
        
        <div className="lg:w-1/4 bg-gray-800 overflow-y-auto">
          <Leaderboard />
        </div>
      </div>
      
      {showReviveModal && (
        <ReviveModal onRevive={handleRevive} onClose={() => navigate('/')} />
      )}
    </div>
  );
};

export default GamePage;