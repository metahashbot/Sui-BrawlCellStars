import React, { useEffect, useRef } from 'react';

const GamePreview: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas size
    const setCanvasSize = () => {
      const container = canvas.parentElement;
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
      }
    };
    
    setCanvasSize();
    window.addEventListener('resize', setCanvasSize);
    
    // Create cells
    type Cell = {
      x: number;
      y: number;
      radius: number;
      dx: number;
      dy: number;
      color: string;
      type: 'player' | 'ai' | 'resource';
    };
    
    const createRandomCells = (count: number, type: 'player' | 'ai' | 'resource'): Cell[] => {
      const cells: Cell[] = [];
      
      const colors = {
        player: ['#38bdf8', '#818cf8', '#a78bfa'],
        ai: ['#fb7185', '#f472b6', '#e879f9'],
        resource: ['#4ade80', '#34d399', '#2dd4bf'],
      };
      
      for (let i = 0; i < count; i++) {
        const typeColors = colors[type];
        const color = typeColors[Math.floor(Math.random() * typeColors.length)];
        
        const radius = type === 'resource' 
          ? 2 + Math.random() * 3 
          : 10 + Math.random() * 15;
          
        cells.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius,
          dx: (Math.random() - 0.5) * 2,
          dy: (Math.random() - 0.5) * 2,
          color,
          type,
        });
      }
      
      return cells;
    };
    
    const players = createRandomCells(3, 'player');
    const aiAgents = createRandomCells(5, 'ai');
    const resources = createRandomCells(30, 'resource');
    
    const allCells = [...players, ...aiAgents, ...resources];
    
    // Animation
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw arena border
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(139, 92, 246, 0.3)';
      ctx.lineWidth = 2;
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = Math.min(canvas.width, canvas.height) * 0.45;
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.stroke();
      
      // Draw grid
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
      
      // Draw and update cells
      allCells.forEach(cell => {
        // Calculate distance from center
        const distFromCenter = Math.sqrt(
          Math.pow(cell.x - centerX, 2) + Math.pow(cell.y - centerY, 2)
        );
        
        // Move cells
        cell.x += cell.dx;
        cell.y += cell.dy;
        
        // Bounce off arena border
        if (distFromCenter > radius - cell.radius) {
          const angle = Math.atan2(cell.y - centerY, cell.x - centerX);
          const newX = centerX + (radius - cell.radius) * Math.cos(angle);
          const newY = centerY + (radius - cell.radius) * Math.sin(angle);
          
          cell.x = newX;
          cell.y = newY;
          
          // Reflect the velocity vector
          const normalX = Math.cos(angle);
          const normalY = Math.sin(angle);
          const dot = cell.dx * normalX + cell.dy * normalY;
          
          cell.dx = cell.dx - 2 * dot * normalX;
          cell.dy = cell.dy - 2 * dot * normalY;
        }
        
        // Draw cell
        ctx.beginPath();
        ctx.fillStyle = cell.color;
        ctx.arc(cell.x, cell.y, cell.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Add glow effect for players and AI
        if (cell.type !== 'resource') {
          ctx.beginPath();
          ctx.arc(cell.x, cell.y, cell.radius, 0, Math.PI * 2);
          ctx.strokeStyle = cell.color;
          ctx.lineWidth = 2;
          ctx.shadowColor = cell.color;
          ctx.shadowBlur = 10;
          ctx.stroke();
          ctx.shadowBlur = 0;
        }
      });
      
      requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      window.removeEventListener('resize', setCanvasSize);
    };
  }, []);
  
  return (
    <div className="w-full h-full rounded-xl overflow-hidden border border-gray-700 bg-gray-800 shadow-lg">
      <canvas 
        ref={canvasRef}
        className="w-full h-full"
      />
    </div>
  );
};

export default GamePreview;