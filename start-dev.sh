#!/bin/bash

echo "🚀 启动SUI Battle Arena开发环境..."

# 检查是否在正确的目录
if [ ! -f "package.json" ]; then
    echo "❌ 请在项目根目录运行此脚本"
    exit 1
fi

# 启动game服务器
echo "📡 启动游戏服务器 (localhost:3000)..."
cd game
npm install
npm start &
GAME_PID=$!
cd ..

# 等待game服务器启动
echo "⏳ 等待游戏服务器启动..."
sleep 5

# 启动主项目
echo "🎮 启动主项目 (localhost:5173)..."
npm install
npm run dev &
MAIN_PID=$!

echo "✅ 开发环境已启动!"
echo "📱 主项目: http://localhost:5173"
echo "🎯 游戏服务器: http://localhost:3000"
echo ""
echo "按 Ctrl+C 停止所有服务..."

# 清理函数
cleanup() {
    echo ""
    echo "🛑 停止所有服务..."
    kill $GAME_PID 2>/dev/null
    kill $MAIN_PID 2>/dev/null
    exit 0
}

# 捕获Ctrl+C信号
trap cleanup SIGINT

# 等待
wait 