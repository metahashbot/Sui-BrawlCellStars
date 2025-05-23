#!/bin/bash

echo "🔍 验证 SUI Battle Arena 部署状态..."

# 检查.env文件
if [ -f ".env" ]; then
    echo "✅ .env 文件存在"
    GAME_URL=$(grep VITE_GAME_SERVER_URL .env | cut -d '=' -f2)
    if [ -z "$GAME_URL" ]; then
        echo "⚠️  .env文件中的VITE_GAME_SERVER_URL为空"
        echo "   请更新为你的Railway URL"
    else
        echo "✅ 游戏服务器URL已配置: $GAME_URL"
        
        # 测试游戏服务器连通性
        echo "🔗 测试游戏服务器连通性..."
        if curl -s --head "$GAME_URL" | head -n 1 | grep -q "200 OK"; then
            echo "✅ 游戏服务器响应正常"
        else
            echo "❌ 游戏服务器无响应，请检查Railway部署状态"
        fi
    fi
else
    echo "❌ .env 文件不存在"
    echo "   请创建.env文件并添加VITE_GAME_SERVER_URL"
fi

echo ""
echo "📋 验证清单："
echo "□ Railway游戏服务器已部署"
echo "□ 复制Railway URL到.env文件"
echo "□ 本地测试主项目（npm run dev）"
echo "□ Vercel主项目已部署"
echo "□ 两个iframe页面正常工作"

echo ""
echo "🚀 如果所有步骤完成，你的SUI Battle Arena就可以正常使用了！" 