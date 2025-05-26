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
    },

    // 新增：获取游戏服务器的 Origin
    getGameOrigin: () => {
        try {
            const url = new URL(gameConfig.gameServerUrl);
            return url.origin;
        } catch (error) {
            console.error('[GameConfig] Error parsing gameServerUrl to get origin:', error);
            // 提供一个备用值或者根据你的错误处理策略返回
            // 对于本地开发，如果 gameServerUrl 无效，可能返回一个预期的本地 origin
            // 但更安全的是在 URL 无效时返回 null 或抛出错误，让调用者处理
            return import.meta.env.MODE === 'production' ? '' : 'http://localhost:3000'; // 示例备用
        }
    }
};

export default gameConfig;