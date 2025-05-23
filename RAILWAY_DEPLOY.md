# Railway部署说明

## Game项目部署到Railway

### 1. 准备Railway项目
1. 前往 [Railway](https://railway.app/) 并登录
2. 创建新项目 -> "Deploy from GitHub repo"
3. 选择这个仓库
4. **重要**: 在Service Settings中设置 **Root Directory** 为 `game`

### 2. Railway配置
在Railway项目的Service Settings中：

1. **Root Directory**: `game`
2. **Build Command**: 留空（使用package.json中的scripts）
3. **Start Command**: `node bin/server/server.js`
4. **Environment Variables**: 
   - `NODE_ENV=production`

### 3. 自动部署配置
Railway会自动：
- 运行 `npm install` 安装依赖
- 运行 `npm run build` 构建项目（这会执行gulp build）
- 使用start命令启动服务器

### 4. 部署后的URL
部署成功后，Railway会给你一个类似这样的URL：
```
https://your-project-name.up.railway.app
```

**重要**: 复制这个URL，我们需要在主项目中使用它。

### 5. 更新主项目的iframe URL

#### 方法1: 使用环境变量（推荐）
1. 在主项目根目录创建 `.env` 文件：
```bash
VITE_GAME_SERVER_URL=https://your-game-server.up.railway.app
```

2. 将 `env.example` 重命名为 `.env` 并填入你的Railway URL

#### 方法2: 直接修改配置文件
编辑 `src/config/gameConfig.ts` 文件，修改默认URL：
```typescript
gameServerUrl: import.meta.env.VITE_GAME_SERVER_URL || 'https://your-game-server.up.railway.app',
```

### 6. 验证部署
1. 访问Railway给出的URL，应该能看到游戏界面
2. 测试两个模式：
   - `https://your-game-server.up.railway.app/?mode=play` - 玩家模式
   - `https://your-game-server.up.railway.app/?mode=betting` - 观战/投注模式

## 主项目部署选项

### Vercel部署（推荐）
1. 连接GitHub仓库到Vercel
2. Framework Preset: `Vite`
3. Root Directory: `.` (根目录)
4. 环境变量设置:
   - `VITE_GAME_SERVER_URL` = 你的Railway游戏服务器URL
5. 部署

### 本地开发环境
开发时保持原来的方式：
- game项目: `cd game && npm start` (localhost:3000)
- 主项目: `npm run dev` (localhost:5173)

### 故障排除

#### Railway部署失败
1. 检查Root Directory是否设置为`game`
2. 检查package.json中的scripts是否正确
3. 查看部署日志中的错误信息

#### iframe加载失败
1. 检查游戏服务器URL是否正确
2. 检查Railway服务是否正在运行
3. 检查浏览器控制台的错误信息

#### WebSocket连接问题
Railway支持WebSocket，但需要确保：
1. 使用HTTPS URL
2. Socket.io配置正确（已在代码中配置好）

---

## 快速部署命令

### 部署到Railway（首次）
```bash
# 1. 推送代码到GitHub（如果还没有）
git add .
git commit -m "Ready for Railway deployment"
git push origin main

# 2. 登录Railway并创建项目
# 在Railway网站操作，选择GitHub repo，设置Root Directory为"game"

# 3. 复制部署URL并更新主项目配置
echo "VITE_GAME_SERVER_URL=你的Railway-URL" > .env
```

### 更新部署
```bash
# 只需要推送代码，Railway会自动重新部署
git add .
git commit -m "Update game server"
git push origin main
``` 