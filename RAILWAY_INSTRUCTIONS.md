# 🚀 Railway 部署操作指南

## ✅ 准备工作已完成

所有配置文件已经准备好并推送到GitHub，现在请按照以下步骤在Railway上部署游戏服务器：

## 📋 第一步：在Railway部署game项目

### 1. 访问Railway
- 打开浏览器，访问：https://railway.app/
- 使用GitHub账号登录

### 2. 创建新项目
- 点击 "New Project"
- 选择 "Deploy from GitHub repo"
- 找到并选择 `sui-battle-arena` 仓库

### 3. 配置服务
**⚠️ 重要：必须正确配置以下设置**

1. **选择服务类型**：选择创建新服务
2. **Root Directory**：在Service Settings中设置为 `game`
3. **Build Command**：留空（Railway会自动使用package.json中的build脚本）
4. **Start Command**：设置为 `node bin/server/server.js`

### 4. 环境变量
在Variables标签页添加：
- `NODE_ENV` = `production`

### 5. 部署
点击Deploy，等待部署完成（大约2-5分钟）

## 📋 第二步：获取部署URL

部署成功后：
1. 在Railway项目页面，复制服务的公开URL
2. URL格式类似：`https://your-project-name-production.up.railway.app`

## 📋 第三步：更新本地配置

### 方法1：更新.env文件（推荐）
```bash
# 在项目根目录执行，替换为你的实际Railway URL
echo "VITE_GAME_SERVER_URL=https://your-railway-url.up.railway.app" > .env
```

### 方法2：直接修改配置文件
编辑 `src/config/gameConfig.ts`，修改默认URL：
```typescript
gameServerUrl: import.meta.env.VITE_GAME_SERVER_URL || 'https://your-railway-url.up.railway.app',
```

## 📋 第四步：测试部署

### 1. 测试游戏服务器
访问以下URL确认正常工作：
- 基础URL：`https://your-railway-url.up.railway.app`
- 玩家模式：`https://your-railway-url.up.railway.app/?mode=play`
- 观战模式：`https://your-railway-url.up.railway.app/?mode=betting`

### 2. 测试本地主项目
```bash
# 在项目根目录执行
npm run dev
```
访问 http://localhost:5173，点击Play和Betting页面，确认iframe正确加载Railway的游戏服务器。

## 📋 第五步：部署主项目到Vercel

### 1. 访问Vercel
- 打开：https://vercel.com/
- 使用GitHub账号登录

### 2. 导入项目
- 点击 "New Project"
- 选择 `sui-battle-arena` 仓库
- Framework Preset：选择 `Vite`
- Root Directory：保持 `.`（根目录）

### 3. 环境变量
在Environment Variables部分添加：
- Name: `VITE_GAME_SERVER_URL`
- Value: `https://your-railway-url.up.railway.app`（你的Railway URL）

### 4. 部署
点击Deploy，等待部署完成

## ✅ 完成！

部署成功后你将拥有：
- 🎮 **游戏服务器**：Railway上的实时多人游戏
- 🌐 **主应用**：Vercel上的React应用，包含游戏iframe

## 🔍 验证部署

访问你的Vercel应用URL：
1. 首页应该正常显示
2. Play页面应该显示游戏界面（Railway iframe）
3. Betting页面应该显示观战界面（Railway iframe）

## 🚨 遇到问题？

### Railway部署失败
1. 检查Root Directory是否设置为`game`
2. 查看Deployments标签页的构建日志
3. 确认package.json中的scripts正确

### iframe加载失败
1. 检查Railway服务是否正在运行
2. 确认VITE_GAME_SERVER_URL环境变量正确
3. 检查浏览器控制台的错误信息

### WebSocket连接问题
1. 确保使用HTTPS URL（Railway自动提供）
2. 检查防火墙设置

---

## 📞 需要帮助？

如果遇到任何问题，请提供：
1. Railway部署日志
2. 浏览器控制台错误信息
3. 具体的错误描述

**预期完成时间**：10-15分钟
**技术要求**：GitHub账号、Railway账号、Vercel账号 