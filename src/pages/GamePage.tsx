import React from 'react';
import Header from '../components/Header';

const GamePage: React.FC = () => {
  return (
    <div className="flex flex-col h-screen bg-gray-900">
      <Header minimal />
      <div className="flex-grow flex items-center justify-center">
        <iframe
          src="http://localhost:3000/?mode=play"
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