// 游戏配置
export const gameConfig = {
    // 修复：使用正确的Railway URL
    gameServerUrl: import.meta.env.VITE_GAME_SERVER_URL ||
        (import.meta.env.MODE === 'production'
            ? 'https://sui-game-production.up.railway.app'
            : 'http://localhost:3000'),

    // 游戏模式URL
    getGameUrl: (mode: 'play' | 'betting') => {
        const url = `${gameConfig.gameServerUrl}/?mode=${mode}`;
        // 调试信息：在控制台打印当前使用的URL
        console.log(`[GameConfig] Mode: ${import.meta.env.MODE}, Server URL: ${gameConfig.gameServerUrl}, Game URL: ${url}`);
        return url;
    }
};

export default gameConfig; 