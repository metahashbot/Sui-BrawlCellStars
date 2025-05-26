import React, { useRef, useEffect } from 'react';
import Header from '../components/Header';
import { useNavigate } from 'react-router-dom';
import { gameConfig } from '../config/gameConfig';
import { useGame } from '../context/GameContext'; // 导入 useGame hook

const GamePage: React.FC = () => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const navigate = useNavigate();
  // 从 Context 获取 setIframeWindow 和 spectateGameId
  const { setIframeWindow, spectateGameId } = useGame();

  useEffect(() => {
    // 将 iframe 的 window 引用传递给 Context
    if (iframeRef.current) {
      setIframeWindow(iframeRef.current.contentWindow);
    }

    // 添加消息监听器处理游戏中的导航请求
    const handleMessage = (event: MessageEvent) => {
      // 确保消息来自您的父窗口源，如果需要更严格的检查
      // if (event.origin !== 'http://localhost:3000') return; // 示例：检查源

      // 处理返回主页的指令
      if (event.data && event.data.action === 'back_to_home') {
        console.log('Received back_to_home from iframe, navigating to /');
        navigate('/');
      }
      // GameContext 中的 useEffect 已经处理了其他消息，如 'select_spectate_room' 和 'spectate_joined'
    };
    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [navigate, setIframeWindow]); // 添加 setIframeWindow 到依赖项

  // 示例：在 GamePage 中根据 spectateGameId 显示信息
  useEffect(() => {
    if (spectateGameId) {
      console.log('GamePage knows spectate started for game ID:', spectateGameId);
      // 可以在这里根据 spectateGameId 更新 UI 或执行其他操作
    } else {
        console.log('GamePage: Not currently spectating or spectate ended.');
    }
  }, [spectateGameId]);


  return (
    <div className="flex flex-col h-screen bg-gray-900">
      <Header minimal />
      <div className="flex-grow flex items-center justify-center">
        <iframe
          ref={iframeRef}
          src={gameConfig.getGameUrl('play')} // 或者根据需要调整模式
          title="Game Arena"
          width="100%"
          height="100%"
          style={{ border: 'none', flex: 1, minHeight: '80vh' }}
          allowFullScreen
        />
      </div>
      {/* 示例：显示观战的游戏ID */}
      {spectateGameId && (
          <div className="absolute bottom-4 left-4 text-white">
              正在观战房间: {spectateGameId}
          </div>
      )}
       {/* 示例：一个触发观战特定游戏的按钮 (如果需要从父窗口发起观战) */}
       {/* <button onClick={() => sendSpectateCommand()}>
           显示观战房间列表 (通过Context发送指令)
       </button> */}
    </div>
  );
};

export default GamePage;