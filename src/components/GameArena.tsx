import React, { useEffect, useRef, useState } from 'react';
import { useGame } from '../context/GameContext';

interface GameArenaProps {
  spectatorMode?: boolean;
  spectatingPlayerId?: number;
}

const GameArena: React.FC<GameArenaProps> = ({ 
  spectatorMode = false, 
  spectatingPlayerId 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { gameState, playerState, movePlayer, sprintPlayer } = useGame();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isSprinting, setIsSprinting] = useState(false);
  
  // Set up canvas and game rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas size
    const setCanvasSize = () => {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
    };
    
    setCanvasSize();
    window.addEventListener('resize', setCanvasSize);
    
    // Game loop
    let animationId: number;
    
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw background grid
      ctx.strokeStyle = 'rgba(75, 85, 99, 0.2)';
      ctx.lineWidth = 1;
      const gridSize = 30;
      
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
      
      // Draw arena border
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(139, 92, 246, 0.3)';
      ctx.lineWidth = 2;
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = Math.min(canvas.width, canvas.height) * 0.45;
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.stroke();
      
      // Draw resources
      gameState.resources.forEach(resource => {
        ctx.beginPath();
        ctx.fillStyle = resource.color;
        ctx.arc(resource.x, resource.y, resource.radius, 0, Math.PI * 2);
        ctx.fill();
      });
      
      // Draw other players and AI agents
      [...gameState.players, ...gameState.aiAgents].forEach(entity => {
        ctx.beginPath();
        ctx.fillStyle = entity.color;
        ctx.arc(entity.x, entity.y, entity.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Add glow effect
        ctx.beginPath();
        ctx.arc(entity.x, entity.y, entity.radius, 0, Math.PI * 2);
        ctx.strokeStyle = entity.color;
        ctx.lineWidth = 2;
        ctx.shadowColor = entity.color;
        ctx.shadowBlur = 10;
        ctx.stroke();
        ctx.shadowBlur = 0;
        
        // Draw player name
        ctx.font = '12px Arial';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.fillText(entity.name, entity.x, entity.y - entity.radius - 5);
      });
      
      // Draw player
      if (!playerState.isDead) {
        ctx.beginPath();
        ctx.fillStyle = playerState.color;
        ctx.arc(playerState.x, playerState.y, playerState.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Add glow effect for player
        ctx.beginPath();
        ctx.arc(playerState.x, playerState.y, playerState.radius, 0, Math.PI * 2);
        ctx.strokeStyle = playerState.color;
        ctx.lineWidth = 2;
        ctx.shadowColor = playerState.color;
        ctx.shadowBlur = 15;
        ctx.stroke();
        ctx.shadowBlur = 0;
        
        // Draw player name
        ctx.font = '12px Arial';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.fillText('You', playerState.x, playerState.y - playerState.radius - 5);
        
        // Draw direction line
        if (!spectatorMode) {
          ctx.beginPath();
          ctx.moveTo(playerState.x, playerState.y);
          ctx.lineTo(mousePosition.x, mousePosition.y);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
      
      // Draw sprint cooldown indicator
      if (!spectatorMode && !playerState.isDead) {
        const cooldownBarWidth = 100;
        const cooldownBarHeight = 10;
        const cooldownX = 20;
        const cooldownY = canvas.height - 30;
        
        // Cooldown background
        ctx.fillStyle = 'rgba(31, 41, 55, 0.7)';
        ctx.fillRect(cooldownX, cooldownY, cooldownBarWidth, cooldownBarHeight);
        
        // Cooldown fill
        const fillWidth = (playerState.sprintCooldown / 100) * cooldownBarWidth;
        ctx.fillStyle = isSprinting ? 'rgba(239, 68, 68, 0.7)' : 'rgba(139, 92, 246, 0.7)';
        ctx.fillRect(cooldownX, cooldownY, fillWidth, cooldownBarHeight);
        
        // Cooldown text
        ctx.font = '12px Arial';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'left';
        ctx.fillText('Sprint', cooldownX, cooldownY - 5);
      }
      
      animationId = requestAnimationFrame(render);
    };
    
    render();
    
    return () => {
      window.removeEventListener('resize', setCanvasSize);
      cancelAnimationFrame(animationId);
    };
  }, [gameState, playerState, mousePosition, isSprinting, spectatorMode, spectatingPlayerId]);
  
  // Handle mouse movement for player direction
  useEffect(() => {
    if (spectatorMode) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      setMousePosition({ x, y });
      
      if (!playerState.isDead) {
        const dirX = x - playerState.x;
        const dirY = y - playerState.y;
        const length = Math.sqrt(dirX * dirX + dirY * dirY);
        
        if (length > 0) {
          const normalizedX = dirX / length;
          const normalizedY = dirY / length;
          movePlayer(normalizedX, normalizedY);
        }
      }
    };
    
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('mousemove', handleMouseMove);
    }
    
    return () => {
      if (canvas) {
        canvas.removeEventListener('mousemove', handleMouseMove);
      }
    };
  }, [playerState, movePlayer, spectatorMode]);
  
  // Handle keyboard for sprint
  useEffect(() => {
    if (spectatorMode) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !playerState.isDead && playerState.sprintCooldown >= 100) {
        setIsSprinting(true);
        sprintPlayer(true);
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSprinting(false);
        sprintPlayer(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [playerState, sprintPlayer, spectatorMode]);
  
  return (
    <canvas 
      ref={canvasRef}
      className="w-full h-full bg-gray-900"
      style={{ cursor: spectatorMode ? 'default' : 'none' }}
    />
  );
};

export default GameArena;