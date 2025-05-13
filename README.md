# SUI Battle Arena

SUI Battle Arena 是一款基于 SUI 区块链的 AI 对战游戏。玩家可以连接自己的 SUI 钱包，参与游戏，并体验基于区块链技术的独特游戏机制。

## ✨ 功能特性

*   **SUI 钱包集成**:
    *   使用 [@mysten/dapp-kit](https://www.npmjs.com/package/@mysten/dapp-kit) 连接和断开 SUI 钱包。
    *   查询并显示账户的 SUI 余额。
*   **游戏预览**:
    *   一个动态的 Canvas 画布，用于展示游戏中的细胞（玩家、AI、资源）的实时动画效果。
    *   细胞会在竞技场内移动、碰撞边界并反弹。
*   **复活机制**:
    *   玩家在游戏中被“吞噬”后，可以选择消耗少量 SUI 来复活。
    *   <mcfile name="ReviveModal.tsx" path="d:\sui_cli\AI-Battle\project\src\components\ReviveModal.tsx"></mcfile> 组件处理复活逻辑和 UI 展示。
*   **投注系统 (概念)**:
    *   <mcfile name="BettingContext.tsx" path="d:\sui_cli\AI-Battle\project\src\context\BettingContext.tsx"></mcfile> 中包含投注逻辑的初步实现。
    *   目前投注信息记录在前端，并提示未来可以集成 SUI 区块链交易。
*   **响应式设计**:
    *   游戏预览画布和部分 UI 元素会根据浏览器窗口大小进行调整。

## 🛠️ 技术栈

*   **前端框架**: [React](https://reactjs.org/)
*   **语言**: [TypeScript](https://www.typescriptlang.org/)
*   **构建工具**: [Vite](https://vitejs.dev/)
*   **SUI DApp 开发**: [@mysten/dapp-kit](https://www.npmjs.com/package/@mysten/dapp-kit)
*   **状态管理**: React Context API (例如 <mcfile name="WalletContext.tsx" path="d:\sui_cli\AI-Battle\project\src\context\WalletContext.tsx"></mcfile>, <mcfile name="BettingContext.tsx" path="d:\sui_cli\AI-Battle\project\src\context\BettingContext.tsx"></mcfile>)
*   **样式**: [Tailwind CSS](https://tailwindcss.com/)
*   **图标**: [Lucide React](https://lucide.dev/)
*   **路由**: [React Router DOM](https://reactrouter.com/)

## 📁 项目结构
project/
├── .gitignore
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
├── src/
│   ├── App.tsx             # 应用主组件
│   ├── main.tsx            # 应用入口文件
│   ├── index.css           # 全局样式 (Tailwind)
│   ├── vite-env.d.ts       # Vite 环境变量类型定义
│   ├── components/         # UI 组件
│   │   ├── GamePreview.tsx   # 游戏预览画布
│   │   └── ReviveModal.tsx   # 复活弹窗组件
│   ├── context/            # React Context
│   │   ├── WalletContext.tsx # 钱包状态管理
│   │   ├── BettingContext.tsx# 投注状态管理 (概念)
│   │   └── GameContext.tsx   # 游戏状态管理 (概念)
│   ├── pages/              # 页面组件
│   │   ├── BettingPage.tsx # 投注页面
│   │   └── GamePage.tsx    # 游戏主页面
│   └── config/             # 配置文件 (例如网络配置)
└── README.md


## 🚀 快速开始

1.  **克隆仓库** (如果适用)
    ```bash
    git clone <repository-url>
    cd project
    ```

2.  **安装依赖**
    推荐使用 `npm`。请确保您的开发环境中已安装 Node.js 和 npm。
    ```bash
    npm install
    ```

3.  **运行开发服务器**
    此命令会启动 Vite 开发服务器，通常在 `http://localhost:5173` (具体端口请查看终端输出)。
    ```bash
    npm run dev
    ```

4.  **浏览器插件**
    为了与 SUI 区块链交互，请确保您的浏览器安装了兼容的 SUI 钱包插件 (例如 Sui Wallet, Suiet Wallet)。

## 📜 可用脚本

在项目目录中，您可以运行以下脚本 (定义于 <mcfile name="package.json" path="d:\sui_cli\AI-Battle\project\package.json"></mcfile>):

*   `npm run dev`:
    启动开发服务器。

*   `npm run build`:
    将项目构建为生产环境的静态文件，输出到 `dist` 目录。

*   `npm run lint`:
    使用 ESLint 检查代码规范。

*   `npm run preview`:
    在本地预览生产构建的成果。

## 🔑 核心组件与上下文

*   **<mcfile name="WalletContext.tsx" path="d:\sui_cli\AI-Battle\project\src\context\WalletContext.tsx"></mcfile>**:
    *   `WalletProvider`: 包裹应用的组件，提供钱包相关的状态和操作。
    *   <mcsymbol name="useWallet" filename="WalletContext.tsx" path="d:\sui_cli\AI-Battle\project\src\context\WalletContext.tsx" startline="55" type="function"></mcsymbol>: Hook，用于在组件中访问钱包状态 (连接状态、地址、余额) 和方法 (连接、断开)。

*   **<mcfile name="GamePreview.tsx" path="d:\sui_cli\AI-Battle\project\src\components\GamePreview.tsx"></mcfile>**:
    *   一个 React 函数组件，使用 `<canvas>` 元素渲染游戏世界的动态预览。
    *   <mcsymbol name="useEffect" filename="GamePreview.tsx" path="d:\sui_cli\AI-Battle\project\src\components\GamePreview.tsx" startline="6" type="function"></mcsymbol> Hook 用于初始化画布、创建游戏细胞 (<mcsymbol name="createRandomCells" filename="GamePreview.tsx" path="d:\sui_cli\AI-Battle\project\src\components\GamePreview.tsx" startline="36" type="function"></mcsymbol>) 并启动动画循环 (<mcsymbol name="animate" filename="GamePreview.tsx" path="d:\sui_cli\AI-Battle\project\src\components\GamePreview.tsx" startline="74" type="function"></mcsymbol>)。

*   **<mcfile name="ReviveModal.tsx" path="d:\sui_cli\AI-Battle\project\src\components\ReviveModal.tsx"></mcfile>**:
    *   当玩家需要复活时显示的模态框。
    *   <mcsymbol name="ReviveModal" filename="ReviveModal.tsx" path="d:\sui_cli\AI-Battle\project\src\components\ReviveModal.tsx" startline="10" type="function"></mcsymbol> 组件接收 <mcsymbol name="onRevive" filename="ReviveModal.tsx" path="d:\sui_cli\AI-Battle\project\src\components\ReviveModal.tsx" startline="6" type="function"></mcsymbol> 和 <mcsymbol name="onClose" filename="ReviveModal.tsx" path="d:\sui_cli\AI-Battle\project\src\components\ReviveModal.tsx" startline="7" type="function"></mcsymbol> 回调函数。
    *   它会检查用户的 SUI 余额是否足够支付复活费用。

## 💡 未来展望

*   **完整的区块链集成**: 将 <mcfile name="BettingContext.tsx" path="d:\sui_cli\AI-Battle\project\src\context\BettingContext.tsx"></mcfile> 中的投注逻辑与 SUI 智能合约交互。
*   **游戏逻辑上链**: 将核心游戏逻辑（如细胞状态、战斗结果）迁移到 SUI 智能合约，实现真正的去中心化游戏。
*   **AI 行为增强**: 提升 <mcfile name="GamePreview.tsx" path="d:\sui_cli\AI-Battle\project\src\components\GamePreview.tsx"></mcfile> 中 AI 细胞的行为逻辑。
*   **排行榜**: 实现基于玩家表现的排行榜系统。
*   **NFT 集成**: 引入 NFT 作为游戏内资产或角色。

---

希望这份 README 对您有所帮助！