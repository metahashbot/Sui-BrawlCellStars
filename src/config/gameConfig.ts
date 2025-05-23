// 游戏配置
export const gameConfig = {
    // 开发环境使用localhost，生产环境使用Railway URL
    gameServerUrl: import.meta.env.VITE_GAME_SERVER_URL || 'http://localhost:3000',

    // 游戏模式URL
    getGameUrl: (mode: 'play' | 'betting') => {
        return `${gameConfig.gameServerUrl}/?mode=${mode}`;
    }
};

export default gameConfig; 