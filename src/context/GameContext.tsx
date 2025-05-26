import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// 定义父级应用与 iframe 之间通信的消息类型
type IframeMessage = {
  action: string;
  gameId?: string; // 添加 gameId 属性，可能存在
  gameState?: GameState; // 添加 gameState 属性
  [key: string]: any; // 允许其他属性
};

// 定义实体类型 (与 BettingPanel.tsx 中的期望结构对齐)
export interface Entity {
  id: number; // 在 BettingPanel 中，这个 id 最终需要映射到合约的 player_id (1-8)
  name: string;
  color: string;
  score: number;
  // isAI 属性将在 GameContext 中根据来源（players/aiAgents）设置，或由 iframe 直接提供
}

export interface Player extends Entity {
  // Player 特有属性 (如果需要)
}

export interface AIAgent extends Entity {
  // AI Agent 特有属性 (如果需要)
}

// 定义游戏状态类型
export type GameState = {
  players: Player[];
  aiAgents: AIAgent[];
};

// 定义 Context 的类型
type GameContextType = {
  // 用于设置 iframe 的 window 引用
  setIframeWindow: (iframeWindow: Window | null) => void;
  // 发送观战指令给 iframe (用于显示房间列表)
  sendSpectateCommand: () => void;
  // 存储从 iframe 接收到的观战游戏ID (成功加入后)
  spectateGameId: string | null;
  gameState: GameState; // 添加 gameState
  // 其他可能需要共享的状态或方法...
};

// 初始状态
const initialContextState: GameContextType = {
  setIframeWindow: () => {},
  sendSpectateCommand: () => {},
  spectateGameId: null,
  gameState: { players: [], aiAgents: [] }, // 初始化 gameState
};

// 创建 Context
const GameContext = createContext<GameContextType>(initialContextState);

// Provider 组件
export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 存储 iframe 的 window 引用
  const [iframeWindow, setIframeWindow] = useState<Window | null>(null);
  // 存储从 iframe 接收到的观战游戏ID (成功加入后)
  const [spectateGameId, setSpectateGameId] = useState<string | null>(null);
  // 存储从 iframe 接收到的用户选择的房间ID (用于触发发送 start_spectating)
  const [selectedSpectateRoomId, setSelectedSpectateRoomId] = useState<string | null>(null);
  const [gameState, setGameState] = useState<GameState>(initialContextState.gameState); // 添加 gameState 状态

  // 发送消息给 iframe
  const sendMessageToIframe = useCallback((message: IframeMessage) => {
    if (iframeWindow) {
      // 使用 '*' 作为 targetOrigin 是不安全的，实际应用中应指定 iframe 的确切源
      // 示例：const targetOrigin = 'http://localhost:3000';
      iframeWindow.postMessage(message, '*');
      console.log('Sent message to iframe:', message);
    } else {
      console.warn('Iframe window not available to send message:', message);
    }
  }, [iframeWindow]);

  // 发送观战指令 (用于显示房间列表)
  const sendSpectateCommand = useCallback(() => {
    sendMessageToIframe({ action: 'spectate' });
  }, [sendMessageToIframe]);

  // 监听来自 iframe 的消息
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // 确保消息来自预期的源，这里简化为不检查源
      // if (event.origin !== 'http://localhost:3000') return; // 示例：检查源

      const message: IframeMessage = event.data;
      console.log('Received message from iframe:', message);

      // 根据消息类型处理
      if (message.action === 'back_to_home') {
        // 收到返回主页指令，可以在这里触发导航
        // 注意：导航通常在 GamePage.tsx 中处理，这里仅作示例
        console.log('Received back_to_home from iframe');
        // 如果需要在 Context 中处理导航，需要将 navigate 函数传递进来或使用其他方式
      } else if (message.action === 'select_spectate_room') {
        // 收到用户选择观战房间的消息
        if (message.gameId) {
          console.log('Received select_spectate_room from iframe, gameId:', message.gameId);
          // 更新状态，这将触发下面的 useEffect 发送 start_spectating 指令
          setSelectedSpectateRoomId(message.gameId);
        }
      } else if (message.action === 'spectate_joined') {
        // 收到观战成功加入房间的消息
        if (message.gameId) {
          console.log('Received spectate_joined from iframe, gameId:', message.gameId);
          // 更新观战游戏ID状态
          setSpectateGameId(message.gameId);
        }
      } else if (message.action === 'game_state_update') { // 新增：处理游戏状态更新
        if (message.gameState) {
          console.log('Received game_state_update from iframe:', message.gameState);
          setGameState(message.gameState);
        }
      }
      // 可以添加更多消息处理逻辑
    };

    // 添加消息监听器
    window.addEventListener('message', handleMessage);

    // 清理监听器
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []); // 依赖项为空数组，只在组件挂载和卸载时执行

  // 当 selectedSpectateRoomId 状态改变时，发送 start_spectating 指令给 iframe
  useEffect(() => {
    if (selectedSpectateRoomId && iframeWindow) {
      console.log('Sending start_spectating to iframe for gameId:', selectedSpectateRoomId);
      sendMessageToIframe({ action: 'start_spectating', gameId: selectedSpectateRoomId });
      // 发送后清除 selectedSpectateRoomId，避免重复发送
      setSelectedSpectateRoomId(null);
    }
  }, [selectedSpectateRoomId, iframeWindow, sendMessageToIframe]);


  const contextValue: GameContextType = {
    setIframeWindow,
    sendSpectateCommand,
    spectateGameId,
    gameState, // 提供 gameState
  };

  return (
    <GameContext.Provider value={contextValue}>
      {children}
    </GameContext.Provider>
  );
};

// Custom hook
export const useGame = () => useContext(GameContext);