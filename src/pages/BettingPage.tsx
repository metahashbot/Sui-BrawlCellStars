import React, { useRef, useEffect, useState } from 'react';
import Header from '../components/Header';
import { useNavigate } from 'react-router-dom';
import { gameConfig } from '../config/gameConfig';
import BettingPanel from '../components/BettingPanel';
import { useBetting } from '../context/BettingContext';
import { useWallet } from '../context/WalletContext'; // 导入 useWallet

const BettingPage: React.FC = () => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const navigate = useNavigate();
  const {
    currentGameId, // 链上游戏ID
    setCurrentGameId, // 设置链上游戏ID
    backendRoomId, // 后端房间ID (来自iframe)
    setBackendRoomId, // 设置后端房间ID
    createNewGame, // 创建链上游戏的方法
    loading: bettingLoading, // 从BettingContext获取加载状态
  } = useBetting();
  const { walletConnected, getPrimaryCoinObjectId } = useWallet(); // 获取钱包连接状态和获取Coin对象ID的方法

  const [showBettingPanel, setShowBettingPanel] = useState(true); // 默认显示下注面板
  const [iframeIsReady, setIframeIsReady] = useState(false);

  // Iframe onload handler
  useEffect(() => {
    const iframe = iframeRef.current;
    const handleLoad = () => {
      console.log('BettingPage: Iframe loaded'); // 添加日志
      setIframeIsReady(true);

      // 在 iframe 加载完成后，如果当前处于初始状态 (没有 backendRoomId 也没有 currentGameId)，
      // 则向 iframe 发送 'spectate' 消息以获取房间列表。
      // 再次检查 iframeRef.current 以确保安全。
      if (!backendRoomId && !currentGameId && iframeRef.current) {
          console.log('BettingPage: Iframe loaded, initial state, sending "spectate" for room list.');
          iframeRef.current.contentWindow?.postMessage({ action: 'spectate' }, '*');
      }
    };

    if (iframe) {
      iframe.addEventListener('load', handleLoad);
      // --- MODIFICATION START ---
      // 移除直接访问跨源 iframe document 的代码，这会导致 SecurityError
      // if (iframe.contentWindow && iframe.contentWindow.document.readyState === 'complete') {
      //   console.log('BettingPage: Iframe already complete'); // 添加日志
      //   handleLoad();
      // }
      // --- MODIFICATION END ---
    }
    // 将 backendRoomId 和 currentGameId 添加到依赖项，以便在它们变化时重新评估是否需要发送消息
    // 虽然主要目的是在加载时发送，但添加依赖项可以覆盖一些边缘情况
    return () => {
      if (iframe) {
        iframe.removeEventListener('load', handleLoad);
      }
    };
  }, [backendRoomId, currentGameId]);


  // 移除原有的用于发送 'spectate' 消息的 useEffect
  // useEffect(() => {
  //   console.log(`BettingPage: useEffect [iframeIsReady, backendRoomId, currentGameId] triggered. iframeIsReady: ${iframeIsReady}, backendRoomId: ${backendRoomId}, currentGameId: ${currentGameId}`); // 添加日志
  //   if (iframeIsReady && !backendRoomId && !currentGameId && iframeRef.current) {
  //     console.log('BettingPage: Iframe ready, no backendRoomId or currentGameId, sending "spectate" to iframe for room list.');
  //     iframeRef.current.contentWindow?.postMessage({ action: 'spectate' }, '*');
  //   }
  // }, [iframeIsReady, backendRoomId, currentGameId]); // 移除此 useEffect


  // 当后端房间ID设置后 (用户从iframe选择了房间), 并且还没有链上游戏ID时，创建链上游戏
  // 然后向 iframe 发送 start_spectating
  useEffect(() => {
    const initAndSpectate = async () => {
      console.log(`BettingPage: useEffect [backendRoomId, currentGameId, ...] triggered. backendRoomId: ${backendRoomId}, currentGameId: ${currentGameId}`); // 添加日志
      if (iframeIsReady && backendRoomId && !currentGameId && iframeRef.current) {
        if (!walletConnected) {
          alert("请先连接钱包以创建或加入下注游戏。");
          setBackendRoomId(null); // 重置，以便用户可以重新选择
          return;
        }
        console.log(`BettingPage: BackendRoomId set to ${backendRoomId}, no currentGameId (chain game). Attempting to create new chain game.`);

        // 1. 获取用于创建游戏资金池的 Coin Object ID
        const poolCoinId = await getPrimaryCoinObjectId(); // 假设 WalletContext 提供此方法
        if (!poolCoinId) {
          alert("无法获取有效的SUI Coin对象来创建游戏资金池。请确保钱包中有SUI。");
          setBackendRoomId(null); // 重置
          return;
        }
        console.log('BettingPage: Got poolCoinId:', poolCoinId); // 添加日志

        // 2. 调用 BettingContext 的 createNewGame 来创建链上游戏
        // createNewGame 内部会设置 BettingContext 的 currentGameId (链上ID)
        console.log('BettingPage: Calling createNewGame...'); // 添加日志
        const creationResult = await createNewGame(poolCoinId);
        console.log('BettingPage: createNewGame result:', creationResult); // 添加日志

        if (creationResult?.success && creationResult.gameId) {
          console.log(`BettingPage: Chain game created successfully (ID: ${creationResult.gameId}). Sending "start_spectating" to iframe for backend room ID: ${backendRoomId}.`);
          iframeRef.current?.contentWindow?.postMessage({ action: 'start_spectating', gameId: backendRoomId }, '*');
        } else {
          console.error('BettingPage: Failed to create chain game for backendRoomId:', backendRoomId, 'Error:', creationResult?.error);
          alert(`无法为房间 ${backendRoomId} 创建链上游戏: ${creationResult?.error || '未知错误'}`);
          // 清理状态，允许用户重试或选择其他房间
          setBackendRoomId(null);
          setCurrentGameId(null);
        }
      } else if (iframeIsReady && backendRoomId && currentGameId && iframeRef.current) {
        // 如果已经有后端房间ID和链上游戏ID (例如页面刷新或已创建)，直接发送观战
        console.log(`BettingPage: Has backendRoomId (${backendRoomId}) and currentGameId (${currentGameId}). Sending "start_spectating" to iframe.`);
        iframeRef.current?.contentWindow?.postMessage({ action: 'start_spectating', gameId: backendRoomId }, '*');
      }
    };
    initAndSpectate();
  }, [iframeIsReady, backendRoomId, currentGameId, walletConnected, createNewGame, getPrimaryCoinObjectId, setBackendRoomId, setCurrentGameId]);


  // 消息监听器
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== gameConfig.getGameOrigin()) { // 校验消息来源
          // console.warn('Message from unknown origin:', event.origin);
          return;
      }

      const data = event.data;
      console.log('BettingPage: Received message from iframe:', data); // 添加日志

      if (data && data.action === 'back_to_home') {
        console.log('BettingPage: Received "back_to_home", navigating to /');
        setCurrentGameId(null);
        setBackendRoomId(null);
        navigate('/');
      } else if (data && data.action === 'select_spectate_room' && data.gameId) {
        console.log('BettingPage: Received "select_spectate_room" from iframe, Backend Room ID:', data.gameId);
        // 用户从 iframe 选择了房间，设置 backendRoomId
        // 上面的 useEffect 会处理链上游戏的创建和发送 start_spectating
        if (backendRoomId !== data.gameId) { // 只有当选择的房间变化时才更新
            console.log(`BettingPage: Updating backendRoomId from ${backendRoomId} to ${data.gameId}`); // 添加日志
            setCurrentGameId(null); // 清除旧的链上游戏ID，因为房间变了
            setBackendRoomId(data.gameId);
        }
      } else if (data && data.action === 'spectate_joined' && data.gameId) {
        console.log('BettingPage: Received "spectate_joined" from iframe for Backend Room ID:', data.gameId);
        // iframe 确认已加入观战。
        // 如果此时 backendRoomId 与消息中的 gameId 不一致，或者 backendRoomId 未设置，则更新它。
        // 这可以处理直接通过 URL 进入观战或 iframe 内部逻辑导致加入不同房间的情况。
        if (backendRoomId !== data.gameId) {
            console.log(`BettingPage: iframe joined room ${data.gameId}, which differs from current backendRoomId ${backendRoomId}. Updating backendRoomId.`);
            setCurrentGameId(null); // 清除旧的链上游戏ID
            setBackendRoomId(data.gameId); // 上面的 useEffect 会处理后续逻辑
        }
        // 此时，如果 currentGameId (链上) 还没有，上面的 useEffect 会尝试创建。
        // 如果已经有了，说明一切正常。
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [navigate, setCurrentGameId, backendRoomId, setBackendRoomId]); // 依赖项调整

  return (
    <div className="flex flex-col h-screen bg-gray-900">
      <Header minimal />
      <div className="flex-grow flex flex-col">
        {/* 将 console.log 移出 JSX */}
        {backendRoomId && currentGameId ? (
          <>
            {console.log(`BettingPage: Rendering game and betting panel. backendRoomId: ${backendRoomId}, currentGameId: ${currentGameId}`)}
            <div className="p-2 text-center">
              <button
                className="px-4 py-2 rounded bg-purple-600 hover:bg-purple-700 text-white"
                onClick={() => setShowBettingPanel(!showBettingPanel)}
              >
                {showBettingPanel ? '隐藏下注面板' : '显示下注面板'}
              </button>
            </div>
            <div className="flex-grow flex">
              <div className="flex-grow" style={{ width: showBettingPanel ? '70%' : '100%', transition: 'width 0.3s ease-in-out' }}>
                <iframe
                  ref={iframeRef}
                  src={gameConfig.getGameUrl('betting')} // 假设此URL能响应start_spectating
                  title="Game Arena"
                  width="100%"
                  height="100%"
                  style={{ border: 'none' }}
                  allowFullScreen
                  key={backendRoomId} // 当 backendRoomId 改变时，强制 iframe 重新加载（如果需要）
                />
              </div>
              {showBettingPanel && (
                <div className="bg-gray-800 overflow-y-auto p-4" style={{ width: '30%', transition: 'width 0.3s ease-in-out' }}>
                  {/* BettingPanel 不再需要 gameId prop，它会从 context 获取 currentGameId (链上ID) */}
                  <BettingPanel />
                </div>
              )}
            </div>
          </>
        ) : (
          // 如果没有后端房间ID或没有链上游戏ID，显示 iframe (用于房间选择或加载状态)
          <div className="flex-grow">
            {bettingLoading && <div className="text-white text-center p-4">正在加载链上游戏数据...</div>}
            <iframe
              ref={iframeRef}
              src={gameConfig.getGameUrl('betting')} // 初始加载，用于显示房间列表
              title="Game Lobby"
              width="100%"
              height="100%"
              style={{ border: 'none' }}
              allowFullScreen
              key="lobby" // 给一个固定的key，或者不给
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default BettingPage;