import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { Zap } from 'lucide-react';

const GameControls: React.FC = () => {
  const { playerState, sprintPlayer } = useGame();
  const [showControls, setShowControls] = useState(true);
  const [hideTimeout, setHideTimeout] = useState<number | null>(null);
  
  // Hide controls after a delay
  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setShowControls(false);
    }, 5000);
    
    setHideTimeout(timeout);
    
    return () => {
      if (hideTimeout) {
        clearTimeout(hideTimeout);
      }
    };
  }, []);
  
  // Show controls on mouse movement
  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true);
      
      if (hideTimeout) {
        clearTimeout(hideTimeout);
      }
      
      const timeout = window.setTimeout(() => {
        setShowControls(false);
      }, 5000);
      
      setHideTimeout(timeout);
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      
      if (hideTimeout) {
        clearTimeout(hideTimeout);
      }
    };
  }, [hideTimeout]);
  
  // Handle sprint button
  const handleSprintMouseDown = () => {
    if (!playerState.isDead && playerState.sprintCooldown >= 100) {
      sprintPlayer(true);
    }
  };
  
  const handleSprintMouseUp = () => {
    sprintPlayer(false);
  };
  
  return (
    <div 
      className={`absolute bottom-4 left-1/2 transform -translate-x-1/2 transition-opacity duration-500 ${showControls ? 'opacity-100' : 'opacity-0'}`}
    >
      <div className="flex gap-4 items-center bg-gray-900/80 backdrop-blur-sm p-3 rounded-lg border border-gray-700">
        <div className="text-center">
          <div className="text-sm font-medium mb-1">Movement</div>
          <div className="text-xs text-gray-400">Move mouse to control direction</div>
        </div>
        
        <div className="h-8 w-px bg-gray-700"></div>
        
        <button
          className={`px-4 py-2 rounded flex items-center gap-2 ${
            playerState.sprintCooldown >= 100 
              ? 'bg-purple-600 hover:bg-purple-700' 
              : 'bg-gray-700 cursor-not-allowed'
          }`}
          onMouseDown={handleSprintMouseDown}
          onMouseUp={handleSprintMouseUp}
          onMouseLeave={handleSprintMouseUp}
          disabled={playerState.sprintCooldown < 100}
        >
          <Zap size={16} />
          Sprint [SPACE]
        </button>
        
        <div className="h-8 w-px bg-gray-700"></div>
        
        <div className="text-center">
          <div className="text-sm font-medium mb-1">Score</div>
          <div className="text-lg font-bold text-amber-400">{playerState.score}</div>
        </div>
      </div>
    </div>
  );
};

export default GameControls;