import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// Types
type Entity = {
  id: number;
  name: string;
  x: number;
  y: number;
  radius: number;
  mass: number;
  score: number;
  color: string;
};

type Player = Entity;

type AIAgent = Entity;

type Resource = {
  id: number;
  x: number;
  y: number;
  radius: number;
  mass: number;
  color: string;
};

type GameState = {
  players: Player[];
  aiAgents: AIAgent[];
  resources: Resource[];
  isGameActive: boolean;
};

type PlayerState = Entity & {
  isDead: boolean;
  sprintCooldown: number;
};

type GameContextType = {
  gameState: GameState;
  playerState: PlayerState;
  startGame: () => void;
  endGame: () => void;
  movePlayer: (dirX: number, dirY: number) => void;
  sprintPlayer: (isSprinting: boolean) => void;
};

// Initial states
const initialGameState: GameState = {
  players: [],
  aiAgents: [],
  resources: [],
  isGameActive: false,
};

const initialPlayerState: PlayerState = {
  id: 0,
  name: 'Player',
  x: 0,
  y: 0,
  radius: 20,
  mass: 10,
  score: 0,
  color: '#818cf8',
  isDead: false,
  sprintCooldown: 100,
};

// Create context
const GameContext = createContext<GameContextType>({
  gameState: initialGameState,
  playerState: initialPlayerState,
  startGame: () => {},
  endGame: () => {},
  movePlayer: () => {},
  sprintPlayer: () => {},
});

// Random colors
const playerColors = ['#818cf8', '#38bdf8', '#a78bfa', '#60a5fa', '#34d399'];
const aiColors = ['#fb7185', '#f472b6', '#e879f9', '#f87171', '#fbbf24'];
const resourceColors = ['#4ade80', '#34d399', '#2dd4bf', '#facc15', '#a3e635'];

// Provider component
export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [gameState, setGameState] = useState<GameState>(initialGameState);
  const [playerState, setPlayerState] = useState<PlayerState>(initialPlayerState);
  
  // Generate random position within arena
  const getRandomPosition = useCallback(() => {
    const radius = 4500; // Arena radius
    const angle = Math.random() * Math.PI * 2; // Random angle
    const distance = Math.random() * radius; // Random distance from center
    
    return {
      x: 5000 + Math.cos(angle) * distance, // Center x + offset
      y: 5000 + Math.sin(angle) * distance, // Center y + offset
    };
  }, []);
  
  // Initialize game
  const startGame = useCallback(() => {
    // Create players
    const players: Player[] = Array.from({ length: 4 }, (_, i) => {
      const position = getRandomPosition();
      return {
        id: i + 1,
        name: `Player ${i + 1}`,
        x: position.x,
        y: position.y,
        radius: 20,
        mass: 10,
        score: 0,
        color: playerColors[i % playerColors.length],
      };
    });
    
    // Create AI agents
    const aiAgents: AIAgent[] = Array.from({ length: 5 }, (_, i) => {
      const position = getRandomPosition();
      return {
        id: i + 100,
        name: `AI-${i + 1}`,
        x: position.x,
        y: position.y,
        radius: 20,
        mass: 10,
        score: 0,
        color: aiColors[i % aiColors.length],
      };
    });
    
    // Create resources
    const resources: Resource[] = Array.from({ length: 200 }, (_, i) => {
      const position = getRandomPosition();
      return {
        id: i + 1000,
        x: position.x,
        y: position.y,
        radius: 5,
        mass: 1,
        color: resourceColors[i % resourceColors.length],
      };
    });
    
    // Create larger resource clusters
    const largeResources: Resource[] = Array.from({ length: 10 }, (_, i) => {
      const position = getRandomPosition();
      return {
        id: i + 2000,
        x: position.x,
        y: position.y,
        radius: 15,
        mass: 10,
        color: resourceColors[(i + 2) % resourceColors.length],
      };
    });
    
    // Initialize player
    const playerPosition = getRandomPosition();
    setPlayerState({
      ...initialPlayerState,
      id: 999,
      x: playerPosition.x,
      y: playerPosition.y,
      color: playerColors[Math.floor(Math.random() * playerColors.length)],
    });
    
    // Set game state
    setGameState({
      players,
      aiAgents,
      resources: [...resources, ...largeResources],
      isGameActive: true,
    });
  }, [getRandomPosition]);
  
  // End game
  const endGame = useCallback(() => {
    setGameState({
      ...initialGameState,
      isGameActive: false,
    });
    setPlayerState({
      ...initialPlayerState,
      isDead: true,
    });
  }, []);
  
  // Move player
  const movePlayer = useCallback((dirX: number, dirY: number) => {
    if (!gameState.isGameActive || playerState.isDead) return;
    
    setPlayerState(prev => {
      // Calculate speed based on mass (larger = slower)
      const speed = 5 * (1 / Math.sqrt(prev.mass));
      
      return {
        ...prev,
        x: prev.x + dirX * speed,
        y: prev.y + dirY * speed,
      };
    });
  }, [gameState.isGameActive, playerState.isDead]);
  
  // Sprint player
  const sprintPlayer = useCallback((isSprinting: boolean) => {
    if (!gameState.isGameActive || playerState.isDead || playerState.sprintCooldown < 100) return;
    
    if (isSprinting) {
      // Start sprint - reduce cooldown
      setPlayerState(prev => ({
        ...prev,
        sprintCooldown: 0,
      }));
    }
  }, [gameState.isGameActive, playerState.isDead, playerState.sprintCooldown]);
  
  // Game loop
  useEffect(() => {
    if (!gameState.isGameActive) return;
    
    const gameLoop = setInterval(() => {
      // Update AI movement
      setGameState(prev => {
        const updatedAI = prev.aiAgents.map(agent => {
          // Simple AI behavior - move randomly
          const angle = Math.random() * Math.PI * 2;
          const speed = 2 * (1 / Math.sqrt(agent.mass));
          
          return {
            ...agent,
            x: agent.x + Math.cos(angle) * speed,
            y: agent.y + Math.sin(angle) * speed,
          };
        });
        
        return {
          ...prev,
          aiAgents: updatedAI,
        };
      });
      
      // Update sprint cooldown
      setPlayerState(prev => ({
        ...prev,
        sprintCooldown: Math.min(100, prev.sprintCooldown + 0.5),
      }));
      
      // Check for resource consumption
      setGameState(prev => {
        if (playerState.isDead) return prev;
        
        let updatedResources = [...prev.resources];
        let updatedPlayerState = { ...playerState };
        
        // Check if player consumes resources
        updatedResources = updatedResources.filter(resource => {
          const dx = playerState.x - resource.x;
          const dy = playerState.y - resource.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < playerState.radius) {
            // Player consumes resource
            updatedPlayerState.mass += resource.mass;
            updatedPlayerState.score += resource.mass;
            updatedPlayerState.radius = Math.sqrt(updatedPlayerState.mass) * 6;
            return false;
          }
          
          return true;
        });
        
        // Update player state
        setPlayerState(updatedPlayerState);
        
        // Respawn resources if too few
        if (updatedResources.length < 150) {
          const newResourcesCount = 10;
          const newResources = Array.from({ length: newResourcesCount }, (_, i) => {
            const position = getRandomPosition();
            return {
              id: prev.resources.length + i + 3000,
              x: position.x,
              y: position.y,
              radius: 5,
              mass: 1,
              color: resourceColors[i % resourceColors.length],
            };
          });
          
          updatedResources = [...updatedResources, ...newResources];
        }
        
        return {
          ...prev,
          resources: updatedResources,
        };
      });
    }, 50);
    
    return () => clearInterval(gameLoop);
  }, [gameState.isGameActive, playerState, getRandomPosition]);
  
  const contextValue: GameContextType = {
    gameState,
    playerState,
    startGame,
    endGame,
    movePlayer,
    sprintPlayer,
  };
  
  return (
    <GameContext.Provider value={contextValue}>
      {children}
    </GameContext.Provider>
  );
};

// Custom hook
export const useGame = () => useContext(GameContext);