import React, { useRef, useEffect } from 'react';
import Header from '../components/Header';
import { useNavigate } from 'react-router-dom';
import { gameConfig } from '../config/gameConfig';

const GamePage: React.FC = () => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // 添加消息监听器处理游戏中的导航请求
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.action === 'back_to_home') {
        navigate('/');
      }
    };
    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [navigate]);

  return (
    <div className="flex flex-col h-screen bg-gray-900">
      <Header minimal />
      <div className="flex-grow flex items-center justify-center">
        <iframe
          ref={iframeRef}
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