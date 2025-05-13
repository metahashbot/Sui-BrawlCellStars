import React from 'react';
import { useGame } from '../context/GameContext';
import { Trophy, Zap, CircleUser } from 'lucide-react';

interface LeaderboardProps {
  onPlayerSelect?: (playerId: number) => void;
  spectatingPlayerId?: number;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ 
  onPlayerSelect,
  spectatingPlayerId
}) => {
  const { gameState, playerState } = useGame();
  
  // Combine players and AI agents
  const allEntities = [
    ...gameState.players.map(player => ({
      ...player,
      isAI: false,
    })),
    ...gameState.aiAgents.map(agent => ({
      ...agent,
      isAI: true,
    })),
  ];
  
  // Add player if not dead
  if (!playerState.isDead) {
    allEntities.push({
      ...playerState,
      name: 'You',
      isAI: false,
      isPlayer: true,
    });
  }
  
  // Sort by score descending
  const sortedEntities = allEntities.sort((a, b) => b.score - a.score);
  
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-700 bg-gray-800">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <Trophy size={18} className="text-yellow-400" />
          Leaderboard
        </h2>
      </div>
      
      <div className="flex-grow overflow-y-auto">
        <div className="divide-y divide-gray-700">
          {sortedEntities.map((entity, index) => (
            <div 
              key={entity.id}
              className={`p-3 flex items-center gap-3 ${onPlayerSelect ? 'cursor-pointer hover:bg-gray-750' : ''} ${spectatingPlayerId === entity.id ? 'bg-gray-750' : ''}`}
              onClick={() => onPlayerSelect && onPlayerSelect(entity.id)}
            >
              <div className={`w-6 h-6 flex items-center justify-center rounded-full ${index < 3 ? 'bg-yellow-600' : 'bg-gray-700'}`}>
                {index + 1}
              </div>
              
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: entity.color }}
              >
                {entity.isAI ? (
                  <Zap size={16} className="text-white" />
                ) : (
                  <CircleUser size={16} className="text-white" />
                )}
              </div>
              
              <div className="flex-grow">
                <div className="flex items-center gap-1">
                  <span className={`font-medium ${entity.isPlayer ? 'text-cyan-400' : ''}`}>
                    {entity.name}
                  </span>
                  {entity.isAI && (
                    <span className="text-xs px-1.5 py-0.5 bg-purple-800 rounded text-purple-200">
                      AI
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-400">
                  Mass: {entity.mass.toFixed(0)}
                </div>
              </div>
              
              <div className="text-lg font-bold text-amber-400">
                {entity.score}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;