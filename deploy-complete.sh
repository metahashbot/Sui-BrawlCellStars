#!/bin/bash

echo "🚀 SUI Battle Arena 完整部署脚本"
echo "=================================="

# 检查必要文件
echo "✅ 检查配置文件..."
if [ ! -f "game/railway.json" ]; then
    echo "❌ Railway配置文件缺失"
    exit 1
fi

if [ ! -f "src/config/gameConfig.ts" ]; then
    echo "❌ 游戏配置文件缺失"
    exit 1
fi

echo "✅ 所有配置文件就绪"

# 构建测试
echo ""
echo "🔨 构建测试..."
cd game
npm run build > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ 游戏服务器构建成功"
else
    echo "❌ 游戏服务器构建失败"
    exit 1
fi

cd ..
npm run build > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ 主项目构建成功"
else
    echo "❌ 主项目构建失败"
    exit 1
fi

echo ""
echo "🎯 部署配置完成！"
echo ""
echo "📋 自动部署链接："
echo ""
echo "🎮 第一步：Railway 游戏服务器部署"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "点击此链接直接部署到Railway:"
echo "https://railway.app/template/sui-battle-arena?referralCode=taoxu"
echo ""
echo "或手动部署:"
echo "1. 访问: https://railway.app/new"
echo "2. 选择: Deploy from GitHub repo"
echo "3. 仓库: Joe-Goldbug/sui-battle-arena"
echo "4. Root Directory: game"
echo "5. Start Command: node bin/server/server.js"
echo ""

echo "🌐 第二步：Vercel 主项目部署"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "点击此链接直接部署到Vercel:"
echo "https://vercel.com/new/git/external?repository-url=https://github.com/Joe-Goldbug/sui-battle-arena"
echo ""
echo "或手动部署:"
echo "1. 访问: https://vercel.com/new"
echo "2. 导入: Joe-Goldbug/sui-battle-arena"
echo "3. Framework: Vite"
echo "4. 环境变量: VITE_GAME_SERVER_URL=[Railway-URL]"
echo ""

echo "🎊 预期的最终访问URL:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎮 游戏服务器: https://sui-battle-arena-production.up.railway.app"
echo "🌐 主应用网站: https://sui-battle-arena.vercel.app"
echo ""
echo "🎯 游戏页面:"
echo "• 玩家模式: https://sui-battle-arena.vercel.app/play"
echo "• 观战模式: https://sui-battle-arena.vercel.app/betting"
echo "• 首页: https://sui-battle-arena.vercel.app/"
echo ""

echo "⏱️ 预计部署时间: 5-8分钟"
echo "💰 费用: 免费（Railway和Vercel免费套餐）"
echo ""
echo "🚀 部署完成后，你将拥有完整的SUI Battle Arena游戏平台！" 