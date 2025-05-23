import React from 'react';
import Header from '../components/Header';
import { gameConfig } from '../config/gameConfig';

const GamePage: React.FC = () => {
  return (
    <div className="flex flex-col h-screen bg-gray-900">
      <Header minimal />
      <div className="flex-grow flex items-center justify-center">
        <iframe
          src={gameConfig.getGameUrl('play')}
          title="Game Arena"
          width="100%"
          height="100%"
          style={{ border: 'none', flex: 1, minHeight: '80vh' }}
          allowFullScreen
        />
      </div>
    </div>
  );
};

export default GamePage;