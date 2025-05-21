import React, { useEffect, useState } from 'react';
import { Brain, Zap, Trophy } from 'lucide-react';
import { useSuiClient } from '@mysten/dapp-kit';
import { SuiMoveObject } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { useSignAndExecuteTransaction } from '@mysten/dapp-kit';
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
// 定义 Agar NFT 的 Struct Type
const AGAR_STRUCT_TYPE = `${CONTRACT_PACKAGE_ID}::agar::Agar`;
// 定义市场模块和相关函数名
const MARKET_MODULE_NAME = 'agarsmarket';
const PLACE_FUNCTION_NAME = 'place_agar';
const LIST_FUNCTION_NAME = 'list_agar';

interface OwnedAgentsSectionProps {
  walletConnected: boolean;
  walletAddress: string | null;
  contractVerified: boolean;
  kioskId: string | null; // Kiosk 对象 ID
  kioskOwnerCapId: string | null; // KioskOwnerCap 对象 ID
  refreshTrigger: number; // 用于触发刷新的依赖项
  onListSuccess: () => void; // 上架成功后的回调
}

const OwnedAgentsSection: React.FC<OwnedAgentsSectionProps> = ({
  walletConnected,
  walletAddress,
  contractVerified,
  kioskId,
  kioskOwnerCapId,
  refreshTrigger,
  onListSuccess,
}) => {
  const suiClient = useSuiClient();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();

  const [ownedAgents, setOwnedAgents] = useState<AIAgent[]>([]);
  const [isLoadingOwned, setIsLoadingOwned] = useState(false);
  const [listingAgentId, setListingAgentId] = useState<string | null>(null); // 正在上架的 Agent ID
  const [priceInput, setPriceInput] = useState<{ [key: string]: string }>({}); // 用于存储每个 Agent 的价格输入

  // --- 获取用户拥有的 Agar NFT 逻辑 ---
  useEffect(() => {
    const fetchOwnedAgents = async () => {
      // 只有在钱包连接、有地址、合约验证成功时才获取数据
      if (!suiClient || !walletAddress || !contractVerified) {
        setOwnedAgents([]);
        if (!contractVerified && walletConnected) {
             setIsLoadingOwned(false);
        }
        return;
      }

      // 移除对 !kioskId 的检查，因为获取用户直接拥有的对象不依赖于 Kiosk
      /*
      if (!kioskId) {
        return; // 如果 kioskId 未就绪，则不执行获取
      }
      */

      setIsLoadingOwned(true);
      // 控制台日志可以暂时保留 kioskId，但逻辑上不应依赖它来获取直接拥有的对象
      console.log(`[OwnedAgentsSection] Fetching owned objects for address: ${walletAddress} with type ${AGAR_STRUCT_TYPE}. Kiosk ID (if available for listing): ${kioskId}`);

      try {
        const ownedObjects = await suiClient.getOwnedObjects({
          owner: walletAddress,
          filter: {
            StructType: AGAR_STRUCT_TYPE,
          },
          options: {
            showContent: true,
            showType: true,
          },
        });

        console.log("[OwnedAgentsSection] Fetched owned objects:", ownedObjects);

        const agarAgents: AIAgent[] = ownedObjects.data
          .filter(obj => obj.data?.type === AGAR_STRUCT_TYPE && obj.data.content?.dataType === 'moveObject')
          .map(obj => {
            if (obj.data?.content && obj.data.content.dataType === 'moveObject') {
                const fields = (obj.data.content as SuiMoveObject).fields as any;
                if (fields) {
                  return {
                    id: obj.data!.objectId,
                    owner: fields.owner, // 确保 owner 字段存在且正确
                    author: fields.author,
                    title: fields.title,
                    category: fields.category,
                    story: fields.story,
                    level: 1, // 默认值或从其他地方获取
                    wins: 0,  // 默认值或从其他地方获取
                    matches: 0, // 默认值或从其他地方获取
                    price: 0, // 默认值
                  } as AIAgent;
                }
            }
            return null;
          })
          .filter((agent): agent is AIAgent => agent !== null);

        console.log("[OwnedAgentsSection] Processed owned Agar agents:", agarAgents);
        setOwnedAgents(agarAgents);

      } catch (error) {
        console.error("[OwnedAgentsSection] Error fetching owned objects:", error);
        alert("获取您拥有的 AI Agent 时发生错误。请查看控制台。");
        setOwnedAgents([]);
      } finally {
        setIsLoadingOwned(false);
      }
    };

    fetchOwnedAgents();
  }, [suiClient, walletAddress, contractVerified, refreshTrigger]); // 从依赖项中移除 kioskId，因为获取列表不直接依赖它

  // --- 上架 Agent 逻辑 ---
  const handleListAgent = async (agent: AIAgent) => {
    // 上架逻辑仍然需要 kioskId 和 kioskOwnerCapId
    if (!walletConnected || !walletAddress || !kioskId || !kioskOwnerCapId) {
        alert("请先连接钱包并确保市场 Kiosk 已创建。");
        return;
    }
    if (!contractVerified) {
        alert("合约未验证或部署失败，无法执行上架交易。");
        return;
    }

    const priceStr = priceInput[agent.id];
    if (!priceStr || isNaN(Number(priceStr)) || Number(priceStr) <= 0) {
        alert("请输入有效的上架价格 (大于 0)。");
        return;
    }
    // 将价格转换为 MIST (SUI 的最小单位)，假设输入的是 SUI 单位
    // 1 SUI = 1,000,000,000 MIST (10^9)
    // Move 合约中的价格通常是最小单位
    const priceInMIST = BigInt(Math.floor(parseFloat(priceStr) * 1_000_000_000));
    if (priceInMIST === 0n) {
         alert("请输入有效的上架价格 (大于 0)。");
         return;
    }


    setListingAgentId(agent.id); // 设置正在上架的 Agent ID

    try {
        const txb = new Transaction();

        // 1. 将 Agar 放入 Kiosk (place_agar)
        // 需要 Kiosk 对象 (by ID), KioskOwnerCap 对象 (by ID), Agar 对象 (by ID)
        // 注意：place_agar 接收的是 Agar 对象本身，而不是 ID。
        // 在 Sui Transaction Block 中，可以通过 `txb.object(agent.id)` 引用一个对象。
        txb.moveCall({
            target: `${CONTRACT_PACKAGE_ID}::${MARKET_MODULE_NAME}::${PLACE_FUNCTION_NAME}`,
            arguments: [
                txb.object(kioskId), // Kiosk 对象
                txb.object(kioskOwnerCapId), // KioskOwnerCap 对象
                txb.object(agent.id), // Agar 对象
            ],
            typeArguments: [AGAR_STRUCT_TYPE], // Agar 的类型
        });

        // 2. 设置 Agar 的价格 (list_agar)
        // 需要 Kiosk 对象 (by ID), KioskOwnerCap 对象 (by ID), Agar 对象 ID, 价格
        txb.moveCall({
            target: `${CONTRACT_PACKAGE_ID}::${MARKET_MODULE_NAME}::${LIST_FUNCTION_NAME}`,
            arguments: [
                txb.object(kioskId), // Kiosk 对象
                txb.object(kioskOwnerCapId), // KioskOwnerCap 对象
                txb.object(agent.id), // Agar 对象 (修改为 txb.object)
                txb.pure.u64(priceInMIST), // 价格 (u64) - 使用 txb.pure.u64() 明确指定类型
            ],
            typeArguments: [AGAR_STRUCT_TYPE], // Agar 的类型
        });

        // 签名并执行交易
        signAndExecuteTransaction(
            { transaction: txb },
            {
                onSuccess: (result: SuiSignAndExecuteTransactionOutput) => {
                    console.log('上架交易成功:', result);
                    alert(`成功将 Agent "${agent.title}" 上架，价格 ${priceStr} SUI！`);
                    // 清空价格输入
                    setPriceInput(prev => {
                        const newState = { ...prev };
                        delete newState[agent.id];
                        return newState;
                    });
                    // 触发刷新拥有的 Agent 列表和待售 Agent 列表
                    onListSuccess();
                },
                onError: (error: Error) => {
                    console.error('上架交易失败:', error);
                    alert(`上架失败: ${error.message}。请查看控制台了解详情。`);
                },
                onSettled: () => {
                    setListingAgentId(null); // 交易完成
                }
            }
        );

    } catch (error: unknown) {
        console.error('构建或执行上架交易时出错:', error);
        let message = '发生错误，请稍后再试。';
        if (error instanceof Error) {
            message = `发生错误: ${error.message}。请稍后再试。`;
        }
        alert(message);
        setListingAgentId(null); // 确保在 catch 块中也设置加载状态为 false
    }
  };


  return (
    <section className="mb-12">
      <h2 className="text-2xl font-bold mb-6">Your Owned AI Agents</h2>
      {!walletConnected && (
          <p className="text-gray-400 text-center">连接钱包以查看您拥有的 AI Agent。</p>
      )}
      {walletConnected && !contractVerified && (
           <p className="text-yellow-500 text-center mb-6">
              正在验证合约部署... 验证成功后将显示您拥有的 Agent。
          </p>
      )}
      {/* 修改这里的条件：Kiosk 相关的消息只在尝试上架或查看市场时更相关，
          对于显示拥有的列表，主要依赖 walletConnected 和 contractVerified */}
      {walletConnected && contractVerified && isLoadingOwned && (
          <p className="text-gray-400 text-center">正在加载您拥有的 AI Agent...</p>
      )}
      {/* Kiosk 未就绪的消息可以移到上架按钮附近，或者在 MarketplacePage 更高层级显示 */}
      {walletConnected && contractVerified && (!kioskId || !kioskOwnerCapId) && (
           <p className="text-yellow-500 text-center mb-2 text-sm">
              (市场 Kiosk 尚未就绪，您暂时无法上架 Agent。)
          </p>
      )}
       {walletConnected && contractVerified && !isLoadingOwned && ownedAgents.length === 0 && (
          <p className="text-gray-400 text-center">您还没有拥有任何 AI Agent。去铸造一个吧！</p>
      )}
      {walletConnected && contractVerified && !isLoadingOwned && ownedAgents.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ownedAgents.map((agent) => (
                  <div key={agent.id} className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 transition-all hover:border-green-500/50 hover:shadow-lg hover:shadow-green-500/10">
                      <div className="bg-gradient-to-r from-green-900/40 to-teal-900/40 p-4">
                          <h3 className="text-xl font-bold flex items-center gap-2">
                              <Brain className="text-green-400" size={20} />
                              {agent.title}
                          </h3>
                      </div>

                      <div className="p-4 text-sm text-gray-300">
                          <p className="mb-2"><span className="font-semibold">ID:</span> {`${agent.id.substring(0, 6)}...${agent.id.substring(agent.id.length - 4)}`}</p>
                          <p className="mb-2"><span className="font-semibold">Owner:</span> {`${agent.owner.substring(0, 6)}...${agent.owner.substring(agent.owner.length - 4)}`}</p>
                          <p className="mb-2"><span className="font-semibold">Author:</span> {agent.author}</p>
                          <p className="mb-2"><span className="font-semibold">Category:</span> {agent.category}</p>
                          <p className="mb-4"><span className="font-semibold">Story:</span> {agent.story}</p>

                          {agent.level !== undefined && (
                              <div className="mb-4">
                                  <div className="flex justify-between mb-1">
                                      <span className="text-sm text-gray-400">Level</span>
                                      <span className="text-sm font-medium">{agent.level}</span>
                                  </div>
                                  <div className="w-full bg-gray-700 rounded-full h-2">
                                      <div
                                      className="bg-green-500 h-2 rounded-full"
                                      style={{ width: `${((agent.level || 0) / 10) * 100}%` }}
                                      ></div>
                                  </div>
                              </div>
                          )}

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

                          {/* 上架输入和按钮 */}
                          <div className="flex items-center gap-2 mt-4">
                              <input
                                  type="number"
                                  step="0.001" // 允许小数输入
                                  min="0.000000001" // 最小单位 MIST 对应的 SUI
                                  value={priceInput[agent.id] || ''}
                                  onChange={(e) => setPriceInput({ ...priceInput, [agent.id]: e.target.value })}
                                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500 text-sm"
                                  placeholder="Price in SUI"
                                  disabled={listingAgentId === agent.id}
                              />
                              <button
                                  onClick={() => handleListAgent(agent)}
                                  className="px-4 py-2 bg-blue-600 rounded font-medium hover:bg-blue-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                  disabled={listingAgentId === agent.id || !priceInput[agent.id] || isNaN(Number(priceInput[agent.id])) || Number(priceInput[agent.id]) <= 0}
                              >
                                  {listingAgentId === agent.id ? 'Listing...' : 'List for Sale'}
                              </button>
                          </div>
                      </div>
                  </div>
              ))}
          </div>
      )}
    </section>
  );
};

export default OwnedAgentsSection;