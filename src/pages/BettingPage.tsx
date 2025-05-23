import React, { useRef, useEffect } from 'react';
import Header from '../components/Header';
import { useNavigate } from 'react-router-dom';
import { gameConfig } from '../config/gameConfig';
// 导入 BettingPanel 组件
import BettingPanel from '../components/BettingPanel';
// 导入 useBetting context
import { useBetting } from '../context/BettingContext';

const BettingPage: React.FC = () => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const navigate = useNavigate();
  // 获取 currentGameId 状态
  const { currentGameId } = useBetting();

  useEffect(() => {
    // 只有在没有当前游戏ID时，才发送 'spectate' 消息给 iframe
    // 这意味着 iframe 用于房间选择或观战
    if (!currentGameId && iframeRef.current) {
      const timer = setTimeout(() => {
        iframeRef.current?.contentWindow?.postMessage({ action: 'spectate' }, '*');
      }, 1000); // 延迟1秒，确保iframe加载完成

      return () => clearTimeout(timer);
    }
    // 如果有 currentGameId，则不发送 'spectate' 消息，iframe 可能显示游戏进行中
    // 或者您可能希望在有游戏ID时，iframe 显示不同的内容（例如游戏本身）
    // 这里我们假设没有 currentGameId 时 iframe 用于选择/观战
    // 如果有 currentGameId，iframe 可能显示游戏进行画面，而下注面板显示在旁边
    // 或者完全隐藏 iframe，只显示下注面板，这取决于您的设计
    // 当前代码逻辑是：没有 currentGameId 时，iframe 发送 spectate 消息
    // 有 currentGameId 时，不发送 spectate 消息，iframe 保持其默认行为或显示游戏画面
    // 并且下面的渲染逻辑会显示 BettingPanel
  }, [navigate, currentGameId]); // 添加 currentGameId 到依赖项

  // 添加消息监听器
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.action === 'back_to_home') {
        navigate('/');
      }
      // TODO: 您可能还需要监听来自 iframe 的消息，例如游戏开始，以便在前端设置 currentGameId
      // 例如： if (event.data && event.data.action === 'game_started' && event.data.gameId) {
      //           setCurrentGameId(event.data.gameId); // 需要从 BettingContext 获取 setCurrentGameId
      //        }
    };
    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [navigate]);

  return (
    <div className="flex flex-col h-screen bg-gray-900">
      <Header minimal />
      <div className="flex-grow flex"> {/* 使用 flex 布局来并排放置或切换 */}
        {/* 根据 currentGameId 决定显示 iframe 还是 BettingPanel */}
        {currentGameId ? (
          // 如果有 currentGameId，显示 BettingPanel
          // 您可能希望 iframe 在旁边显示游戏画面，或者完全隐藏 iframe
          // 这里假设 BettingPanel 占据主要区域
          <div className="flex-grow flex items-center justify-center">
             {/* 如果游戏进行时需要显示 iframe，可以在这里调整布局 */}
             {/* 例如： <div style={{ width: '70%' }}> <iframe ... /> </div> */}
             {/*       <div style={{ width: '30%' }}> <BettingPanel /> </div> */}
             {/* 或者如果只显示 BettingPanel： */}
             <BettingPanel /> {/* BettingPanel 内部已经处理了 gameId 的获取 */}
          </div>
        ) : (
          // 如果没有 currentGameId，显示 iframe 用于房间选择/观战
          <div className="flex-grow flex items-center justify-center">
            <iframe
              ref={iframeRef}
              src={gameConfig.getGameUrl('betting')} 
              title="Game Arena"
              width="100%"
              height="100%"
              style={{ border: 'none', flex: 1, minHeight: '80vh' }}
              allowFullScreen
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default BettingPage;