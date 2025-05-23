# SUI Battle Arena 部署指南

## 项目结构

```
sui-battle-arena/
├── src/                    # React主项目源码
├── game/                   # agar.io游戏子项目 (submodule)
├── contracts/              # 智能合约
├── RAILWAY_DEPLOY.md       # Railway详细部署说明
├── start-dev.sh           # 开发环境快速启动脚本
└── env.example            # 环境变量示例
```

## 🚀 快速开始

### 开发环境
```bash
# 一键启动开发环境
./start-dev.sh

# 或手动启动：
# 1. 启动游戏服务器
cd game && npm install && npm start

# 2. 启动主项目（新终端）
npm install && npm run dev
```

访问：
- 主项目：http://localhost:5173
- 游戏服务器：http://localhost:3000

## 🏗️ 生产部署

### 1. 部署游戏服务器到Railway

**重要：game项目必须部署到Railway**

1. **创建Railway项目**
   - 登录 [Railway](https://railway.app/)
   - Deploy from GitHub repo
   - 选择此仓库
   - 在Service Settings设置 **Root Directory** 为 `game`

2. **配置Railway**
   - Build Command: 留空
   - Start Command: `node bin/server/server.js`
   - Environment Variables: `NODE_ENV=production`

3. **获取部署URL**
   - 复制Railway给出的URL，如：`https://your-project.up.railway.app`

### 2. 部署主项目（推荐Vercel）

1. **配置环境变量**
   ```bash
   # 创建.env文件
   echo "VITE_GAME_SERVER_URL=https://your-railway-url.up.railway.app" > .env
   ```

2. **部署到Vercel**
   - 连接GitHub仓库到Vercel
   - Framework Preset: `Vite`
   - Root Directory: `.` (根目录)
   - 环境变量：`VITE_GAME_SERVER_URL` = Railway URL
   - 部署

## 🎮 iframe集成

游戏通过iframe嵌入主项目：

- **GamePage** (`/play`): 玩家游戏模式
  - iframe URL: `{gameServerUrl}/?mode=play`
  
- **BettingPage** (`/betting`): 观战/投注模式
  - iframe URL: `{gameServerUrl}/?mode=betting`

配置文件：`src/config/gameConfig.ts`

## 🔧 配置说明

### 环境变量
```bash
# .env
VITE_GAME_SERVER_URL=https://your-game-server.up.railway.app
```

### 游戏服务器配置
- 端口：自动使用Railway的PORT环境变量
- WebSocket：支持Socket.io实时通信
- 模式支持：play（玩家）、betting（观战）

## 📱 功能特性

### 主项目 (React + Sui)
- 🏠 首页：游戏介绍和导航
- 🎮 游戏页面：嵌入play模式iframe
- 💰 投注页面：嵌入betting模式iframe，支持观战
- 🛒 市场页面：NFT交易等

### 游戏服务器 (Node.js)
- 🎯 实时多人agar.io游戏
- 🤖 AI玩家支持
- 👥 房间匹配系统
- 📊 排行榜系统
- 💬 聊天功能

## 🚨 故障排除

### Railway部署失败
1. 确认Root Directory设置为`game`
2. 检查package.json和gulpfile.js
3. 查看部署日志

### iframe加载问题
1. 检查VITE_GAME_SERVER_URL是否正确
2. 确认Railway服务在运行
3. 检查浏览器控制台错误

### WebSocket连接问题
1. 确保使用HTTPS URL
2. 检查防火墙设置
3. 确认Socket.io版本兼容

## 🔄 更新部署

```bash
# 推送代码到GitHub，Railway和Vercel会自动重新部署
git add .
git commit -m "Update deployment"
git push origin main
```

## 📚 相关文档

- [Railway详细部署说明](./RAILWAY_DEPLOY.md)
- [Game项目README](./game/README.md)
- [环境变量示例](./env.example)

---

**注意**：首次部署后，请确保更新`.env`文件中的`VITE_GAME_SERVER_URL`为实际的Railway部署URL。 