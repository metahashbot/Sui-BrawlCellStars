import React, { useState, useEffect } from 'react'; // 确保导入 useEffect
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import { Brain, Zap, Trophy, CreditCard } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ConnectWalletModal from '../components/ConnectWalletModal';

// 导入 Sui 相关的 hook 和库
import { useSuiClient } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { useSignAndExecuteTransaction } from '@mysten/dapp-kit';
// 导入 SuiSignAndExecuteTransactionOutput 和 MoveObject 类型
import { SuiTransactionBlockResponse, SuiMoveObject } from '@mysten/sui/client';
import { SuiSignAndExecuteTransactionOutput } from '@mysten/wallet-standard';

// 修改 AIAgent 类型以匹配 Agar struct 字段，并保留可选的游戏统计数据
type AIAgent = {
  id: string; // Corresponds to Agar.id
  owner: string; // Corresponds to Agar.owner
  author: string; // Corresponds to Agar.author
  title: string; // Corresponds to Agar.title, maps to name in UI
  category: string; // Corresponds to Agar.category
  story: string; // Corresponds to Agar.story
  // Optional game stats, not directly from Agar struct
  level?: number;
  wins?: number;
  matches?: number;
  price?: number; // Price if listed for sale
};

// 从环境变量获取合约 Package ID
const CONTRACT_PACKAGE_ID = import.meta.env.VITE_SUI_CONTRACT_PACKAGE_ID;
// 定义 Agar 模块名和铸造函数名
const AGAR_MODULE_NAME = 'agar';
const MINT_FUNCTION_NAME = 'mint_agar'; // <-- 修正：匹配 agar.move 中的函数名
// Agar NFT 的 Struct Type
const AGAR_STRUCT_TYPE = `${CONTRACT_PACKAGE_ID}::${AGAR_MODULE_NAME}::Agar`;

const MarketplacePage: React.FC = () => {
  const navigate = useNavigate();
  const { walletConnected, balance, walletAddress } = useWallet();
  const suiClient = useSuiClient();
  // 修改: 使用更正后的 hook 名称
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();

  const [showWalletModal, setShowWalletModal] = useState(false);
  const [contractVerified, setContractVerified] = useState(false); // 新增状态：合约是否验证成功

  // const [aiAgents, setAiAgents] = useState<AIAgent[]>([ ... ]);

  // 新增状态：存储用户拥有的 AI Agent
  const [ownedAgents, setOwnedAgents] = useState<AIAgent[]>([]);
  const [isLoadingOwned, setIsLoadingOwned] = useState(false); // 新增加载状态

  // {{ edit_1 }}
  // 新增状态：用于触发重新获取用户拥有的 Agent 列表
  const [refreshOwnedTrigger, setRefreshOwnedTrigger] = useState(0);
  // {{ /edit_1 }}


  // --- 合约验证逻辑 ---
  useEffect(() => {
    const verifyContract = async () => {
      console.log('[MarketplacePage] verifyContract - CONTRACT_PACKAGE_ID:', CONTRACT_PACKAGE_ID);
      if (!suiClient || !CONTRACT_PACKAGE_ID) {
        console.warn("Sui Client or Contract Package ID not available for verification.");
        setContractVerified(false);
        return;
      }
      try {
        console.log(`Attempting to verify contract package: ${CONTRACT_PACKAGE_ID}`);
        const object = await suiClient.getObject({
          id: CONTRACT_PACKAGE_ID,
          options: { showType: true, showContent: true, showOwner: true, showPreviousTransaction: true }, // 获取更详细的信息以便调试
        });

        // 打印获取到的对象信息，无论成功与否
        console.log('[MarketplacePage] Object received from suiClient.getObject:', JSON.stringify(object, null, 2));

        // 检查对象是否存在且类型正确
        if (object.data && object.data.type === 'package') {
            console.log("Contract package verified successfully.");
            setContractVerified(true);
        } else {
            console.error("Object found but it is not a package or data is missing.");
            setContractVerified(false);
            alert("错误：合约 ID 似乎不是一个有效的 Package ID。请检查 .env.local 文件。");
        }

      } catch (error: unknown) { // 修改: 为 catch 块中的 error 添加类型
        console.error("Error during contract verification:", error);
        setContractVerified(false);
        // 最好检查 error 类型再展示
        let message = '错误：验证合约时发生异常。请检查控制台。';
        if (error instanceof Error) {
            message = `错误：验证合约时发生异常: ${error.message}`;
        }
        alert(message);
      }
    };

    verifyContract();
  }, [suiClient]); // 依赖 suiClient

  // --- 获取用户拥有的 Agar NFT 逻辑 ---
  useEffect(() => {
    const fetchOwnedAgents = async () => {
      if (!suiClient || !walletAddress || !contractVerified) {
        setOwnedAgents([]); // 清空列表如果钱包未连接或合约未验证
        return;
      }

      setIsLoadingOwned(true);
      console.log(`Fetching owned objects for address: ${walletAddress} with type ${AGAR_STRUCT_TYPE}`);

      try {
        // 使用 getOwnedObjects 获取用户拥有的所有对象
        const ownedObjects = await suiClient.getOwnedObjects({
          owner: walletAddress,
          filter: {
            StructType: AGAR_STRUCT_TYPE, // 按 Agar struct 类型过滤
          },
          options: {
            showContent: true, // 需要 content 来获取 struct 字段
            showType: true,
          },
        });

        console.log("Fetched owned objects:", ownedObjects);

        // 过滤出 Agar 对象并提取数据
        const agarAgents: AIAgent[] = ownedObjects.data
          .filter(obj => obj.data?.type === AGAR_STRUCT_TYPE && obj.data.content?.dataType === 'moveObject')
          .map(obj => {
            // 明确检查并断言 content 为 MoveObject 类型，然后访问 fields
            if (obj.data?.content && obj.data.content.dataType === 'moveObject') {
                const fields = (obj.data.content as SuiMoveObject).fields as any; // 断言为 MoveObject 并访问 fields
                if (fields) {
                  return {
                    id: obj.data!.objectId,
                    owner: fields.owner,
                    author: fields.author,
                    title: fields.title,
                    category: fields.category,
                    story: fields.story,
                    // 可以为 level, wins, matches, price 设置默认值或从其他地方获取
                    level: 1, // 示例默认值
                    wins: 0,
                    matches: 0,
                    price: 0, // 示例默认值
                  } as AIAgent; // 强制类型转换
                }
            }
            return null; // 过滤掉没有字段或类型不匹配的对象
          })
          .filter((agent): agent is AIAgent => agent !== null); // 移除 null 值

        console.log("Processed owned Agar agents:", agarAgents);
        setOwnedAgents(agarAgents);

      } catch (error) {
        console.error("Error fetching owned objects:", error);
        alert("获取您拥有的 AI Agent 时发生错误。请查看控制台。");
        setOwnedAgents([]); // 出错时清空列表
      } finally {
        setIsLoadingOwned(false);
      }
    };

    // {{ edit_2 }}
    // 添加 refreshOwnedTrigger 到依赖项数组
    fetchOwnedAgents();
  }, [suiClient, walletAddress, contractVerified, refreshOwnedTrigger]); // 依赖 suiClient, walletAddress, contractVerified, refreshOwnedTrigger
  // {{ /edit_2 }}


  const handleMintNewAgent = async () => {
    if (!walletConnected || !walletAddress) {
      setShowWalletModal(true);
      return;
    }

    if (!contractVerified) {
        alert("合约未验证或部署失败，无法执行铸造交易。");
        return;
    }

    const mintCost = 0.5; // 假设铸造需要 0.5 SUI，请根据你的合约逻辑调整
    // 注意：你的 Move 合约 mint_agar 函数目前没有处理 SUI 支付。
    // 如果需要支付，你需要在 Move 合约中添加支付逻辑，并在前端构建交易时包含支付。
    // 目前前端的余额检查仅是客户端提示，不影响链上交易执行（除非合约本身检查支付）。
    if (balance < mintCost) {
      alert(`Insufficient balance to mint a new AI agent. Minimum required: ${mintCost} SUI`);
      return;
    }

    try {
      // Move 函数 mint_agar 接收 author, title, category, story 作为 vector<u8> (string)
      // txb.pure 会自动处理 string 到 vector<u8> 的转换
      // author 字段是 Agar struct 的一部分，与 owner (tx_context::sender) 不同
      const authorName = "Anonymous Creator"; // 或者让用户输入作者名
      const title = `My New Agent ${Date.now()}`;
      const category = 'Standard';
      const story = 'Born from the digital ether.';

      const txb = new Transaction();

      // 调用合约的 mint_agar Entry Function
      // 使用 txb.pure.string() 直接传递字符串，它会负责编码为 vector<u8>
      txb.moveCall({
        target: `${CONTRACT_PACKAGE_ID}::${AGAR_MODULE_NAME}::${MINT_FUNCTION_NAME}`,
        arguments: [
          txb.pure.string(authorName), // author (vector<u8>)
          txb.pure.string(title),  // title (vector<u8>)
          txb.pure.string(category), // category (vector<u8>)
          txb.pure.string(story),  // story (vector<u8>)
          // TxContext 是隐式传递的，不需要在这里作为参数传递
        ],
        // typeArguments: [], // 如果 mint_agar 函数有泛型参数，需要在这里指定
      });

      // 签名并执行交易
      signAndExecuteTransaction( // 修改: 使用更正后的 hook 名称
        {
          transaction: txb, // 修改: 属性名改为 transaction
          // 移除 options 属性，因为它不属于 UseSignAndExecuteTransactionArgs 类型
          // options: { // 这些选项通常是 SuiTransactionBlockResponseOptions
          //   showEffects: true,
          //   showObjectChanges: true,
          // },
        },
        {
          // 修改 onSuccess 回调参数类型为 SuiSignAndExecuteTransactionOutput
          // {{ edit_3 }}
          onSuccess: (result: SuiSignAndExecuteTransactionOutput) => {
            console.log('铸造交易成功:', result);
            alert(`成功铸造新的 AI Agent: "${title}"！`);

            // 交易成功后，更新状态变量以触发重新获取用户拥有的 Agent 列表
            setRefreshOwnedTrigger(prev => prev + 1);
            // {{ /edit_3 }}

            console.log("Transaction digest:", result.digest); // SuiSignAndExecuteTransactionOutput 有 digest
          },
          onError: (error: Error) => { // 修改: 为 onError 回调中的 error 添加 Error 类型
            console.error('铸造交易失败:', error);
            alert(`铸造失败: ${error.message}。请查看控制台了解详情。`);
          },
        }
      );

    } catch (error: unknown) { // 修改: 为 catch 块中的 error 添加类型
      console.error('构建或执行铸造交易时出错:', error);
      let message = '发生错误，请稍后再试。';
      if (error instanceof Error) {
        message = `发生错误: ${error.message}。请稍后再试。`;
      }
      alert(message);
    }
  };

  // handleBuyAgent 函数 (保留或修改以调用市场合约的购买函数)
  const handleBuyAgent = (agent: AIAgent) => {
    if (!walletConnected) {
      setShowWalletModal(true);
      return;
    }

    if (!contractVerified) {
        alert("合约未验证或部署失败，无法执行购买交易。");
        return;
    }

    if (balance < agent.price!) { // 使用非空断言，因为这里是硬编码数据
      alert(`Insufficient balance to buy this AI agent. Required: ${agent.price} SUI`);
      return;
    }

    // Purchase logic would go here - This would involve a Sui transaction calling the market contract
    // 将 agent.name 改为 agent.title
    alert(`Purchasing ${agent.title} for ${agent.price} SUI... This would connect to SUI blockchain in production.`);
    // TODO: Implement actual purchase transaction using txb.moveCall to the market contract
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-grow py-8 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <section className="mb-12">
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-bold mb-4">AI Agent Marketplace</h1>
              <p className="text-gray-300 max-w-2xl mx-auto">
                Mint new AI agents or buy existing ones to compete in the arena. Train your agents by having them participate in matches to increase their value.
              </p>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-center gap-6 p-8 bg-gradient-to-r from-purple-900/40 to-blue-900/40 rounded-xl border border-purple-500/30">
              <div className="text-center md:text-left">
                <h2 className="text-2xl font-bold mb-2">Mint a New AI Agent</h2>
                <p className="text-gray-300 mb-4 max-w-md">
                  Create your own unique AI agent with baseline capabilities. Train it through battles to improve its skills and value.
                </p>
                <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                  <div className="flex items-center gap-2 bg-gray-800 px-3 py-1 rounded">
                    <Brain size={16} className="text-cyan-400" />
                    <span>Level 1 Start</span>
                  </div>
                  <div className="flex items-center gap-2 bg-gray-800 px-3 py-1 rounded">
                    <Zap size={16} className="text-yellow-400" />
                    <span>Basic Skills</span>
                  </div>
                  <div className="flex items-center gap-2 bg-gray-800 px-3 py-1 rounded">
                    <CreditCard size={16} className="text-green-400" />
                    <span>0.5 SUI</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleMintNewAgent}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg font-medium flex items-center gap-2 hover:opacity-90 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                // 禁用条件增加合约未验证
                disabled={!walletConnected || balance < 0.5 || !contractVerified}
              >
                 {!walletConnected ? 'Connect Wallet to Mint' : (!contractVerified ? 'Contract Not Verified' : (balance < 0.5 ? 'Insufficient Balance to Mint' : 'Mint New Agent'))}
              </button>
            </div>
          </section>

          <section className="mb-12"> {/* 添加 mb-12 增加间距 */}
            <h2 className="text-2xl font-bold mb-6">Available AI Agents (Hardcoded)</h2> {/* 标记为硬编码 */}
            {/* 如果合约未验证，显示提示 */}
            {!contractVerified && (
                <p className="text-yellow-500 text-center mb-6">
                    正在验证合约部署... 如果长时间未成功，请检查控制台错误或 .env.local 中的合约 ID。
                </p>
            )}
            {/* 暂时保留硬编码列表，或者可以移除 */}
            {/* 只有在合约验证成功后才渲染列表，或者根据需要调整 */}
            {contractVerified && (
                 <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {/* 这里可以放置硬编码的 aiAgents.map() 逻辑 */}
                 {/* 为了清晰，我们暂时移除硬编码列表的渲染，专注于显示拥有的 */}
                 {/* 如果需要显示待售列表，需要单独实现 */}
                 <p className="text-gray-400 text-center col-span-full">
                     待售 AI Agent 列表功能待实现。
                 </p>
                 </div>
            )}
          </section>

          {/* 添加用户拥有的 Agent 列表展示区域 */}
          <section>
            <h2 className="text-2xl font-bold mb-6">Your Owned AI Agents</h2>
            {!walletConnected && (
                <p className="text-gray-400 text-center">连接钱包以查看您拥有的 AI Agent。</p>
            )}
            {walletConnected && !contractVerified && (
                 <p className="text-yellow-500 text-center mb-6">
                    正在验证合约部署... 验证成功后将显示您拥有的 Agent。
                </p>
            )}
            {walletConnected && contractVerified && isLoadingOwned && (
                <p className="text-gray-400 text-center">正在加载您拥有的 AI Agent...</p>
            )}
             {walletConnected && contractVerified && !isLoadingOwned && ownedAgents.length === 0 && (
                <p className="text-gray-400 text-center">您还没有拥有任何 AI Agent。去铸造一个吧！</p>
            )}
            {walletConnected && contractVerified && !isLoadingOwned && ownedAgents.length > 0 && (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {ownedAgents.map((agent) => (
                        <div key={agent.id} className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 transition-all hover:border-green-500/50 hover:shadow-lg hover:shadow-green-500/10"> {/* 边框颜色区分 */}
                            <div className="bg-gradient-to-r from-green-900/40 to-teal-900/40 p-4"> {/* 背景颜色区分 */}
                                <h3 className="text-xl font-bold flex items-center gap-2">
                                    <Brain className="text-green-400" size={20} /> {/* 图标颜色区分 */}
                                    {agent.title} {/* 显示 title 作为名称 */}
                                </h3>
                            </div>

                            <div className="p-4 text-sm text-gray-300">
                                <p className="mb-2"><span className="font-semibold">ID:</span> {`${agent.id.substring(0, 6)}...${agent.id.substring(agent.id.length - 4)}`}</p>
                                <p className="mb-2"><span className="font-semibold">Owner:</span> {`${agent.owner.substring(0, 6)}...${agent.owner.substring(agent.owner.length - 4)}`}</p>
                                <p className="mb-2"><span className="font-semibold">Author:</span> {agent.author}</p>
                                <p className="mb-2"><span className="font-semibold">Category:</span> {agent.category}</p>
                                <p className="mb-4"><span className="font-semibold">Story:</span> {agent.story}</p>

                                {/* 可以选择显示游戏统计数据，如果它们存在 */}
                                {agent.level !== undefined && (
                                    <div className="mb-4">
                                        <div className="flex justify-between mb-1">
                                            <span className="text-sm text-gray-400">Level</span>
                                            <span className="text-sm font-medium">{agent.level}</span>
                                        </div>
                                        <div className="w-full bg-gray-700 rounded-full h-2">
                                            <div
                                            className="bg-green-500 h-2 rounded-full" // 进度条颜色区分
                                            style={{ width: `${((agent.level || 0) / 10) * 100}%` }} // 使用默认值防止除以零
                                            ></div>
                                        </div>
                                    </div>
                                )}

                                {/* 示例：显示 Wins 和 Matches，如果存在 */}
                                {(agent.wins !== undefined || agent.matches !== undefined) && (
                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        {agent.wins !== undefined && (
                                            <div className="bg-gray-700/50 p-3 rounded text-center">
                                                <div className="flex items-center justify-center gap-1 text-yellow-400 mb-1">
                                                    <Trophy size={16} />
                                                    <span className="font-bold">{agent.wins}</span>
                                                </div>
                                                <div className="text-xs text-gray-400">Wins</div>
                                            </div>
                                        )}
                                        {agent.matches !== undefined && (
                                            <div className="bg-gray-700/50 p-3 rounded text-center">
                                                <div className="flex items-center justify-center gap-1 text-blue-400 mb-1">
                                                    <Zap size={16} />
                                                    <span className="font-bold">{agent.matches}</span>
                                                </div>
                                                <div className="text-xs text-gray-400">Matches</div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* 如果需要，可以添加出售或转移按钮 */}
                                {/* <div className="flex justify-end">
                                    <button className="px-4 py-2 bg-blue-600 rounded font-medium hover:bg-blue-700 transition-colors">
                                        List for Sale
                                    </button>
                                </div> */}
                            </div>
                        </div>
                    ))}
                </div>
            )}
          </section>

          {/* TODO: 添加用户拥有的 Agent 列表展示区域 */}

        </div>
      </main>

      <Footer />

      {showWalletModal && (
        <ConnectWalletModal onClose={() => setShowWalletModal(false)} />
      )}
    </div>
  );
};

export default MarketplacePage;