import React, { useEffect, useState } from 'react';
import { Brain, Zap, Trophy, ShoppingCart,CreditCard } from 'lucide-react';
import { useSuiClient } from '@mysten/dapp-kit';
import { SuiMoveObject } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { SuiSignAndExecuteTransactionOutput } from '@mysten/wallet-standard';

type AIAgent = {
  id: string; // Corresponds to Agar.id
  owner: string; // Corresponds to Agar.owner (This will be the Kiosk ID for listed items)
  author: string; // Corresponds to Agar.author
  title: string; // Corresponds to Agar.title, maps to name in UI
  category: string; // Corresponds to Agar.category
  story: string; // Corresponds to Agar.story
  // Optional game stats, not directly from Agar struct
  level?: number;
  wins?: number;
  matches?: number;
  price?: number; // Price if listed for sale (in MIST)
};

// 从环境变量获取合约 Package ID
const CONTRACT_PACKAGE_ID = import.meta.env.VITE_SUI_CONTRACT_PACKAGE_ID;
// 定义 Agar NFT 的 Struct Type
const AGAR_STRUCT_TYPE = `${CONTRACT_PACKAGE_ID}::agar::Agar`;
// 定义市场模块和相关函数名
const MARKET_MODULE_NAME = 'agarsmarket';
const PURCHASE_FUNCTION_NAME = 'purchase_agar';

interface AvailableAgentsSectionProps {
  walletConnected: boolean;
  walletAddress: string | null;
  balance: number; // 用户 SUI 余额 (以 SUI 为单位)
  contractVerified: boolean;
  kioskId: string | null; // Kiosk 对象 ID (用于获取待售物品)
  refreshTrigger: number; // 用于触发刷新的依赖项
  onBuySuccess: () => void; // 购买成功后的回调
  setShowWalletModal: (show: boolean) => void; // 显示连接钱包 Modal
}

const AvailableAgentsSection: React.FC<AvailableAgentsSectionProps> = ({
  walletConnected,
  walletAddress,
  balance,
  contractVerified,
  kioskId,
  refreshTrigger,
  onBuySuccess,
  setShowWalletModal,
}) => {
  const suiClient = useSuiClient();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();

  const [availableAgents, setAvailableAgents] = useState<AIAgent[]>([]);
  const [isLoadingAvailable, setIsLoadingAvailable] = useState(false);
  const [purchasingAgentId, setPurchasingAgentId] = useState<string | null>(null); // 正在购买的 Agent ID

  // --- 获取市场上待售的 Agar NFT 逻辑 ---
  useEffect(() => {
    const fetchAvailableAgents = async () => {
      if (!suiClient || !contractVerified || !kioskId) {
        setAvailableAgents([]);
        return;
      }

      setIsLoadingAvailable(true);
      console.log(`[AvailableAgentsSection] Fetching listed objects in Kiosk: ${kioskId}`);

      try {
        const kioskContents = await suiClient.getDynamicFields({ parentId: kioskId });
        console.log("[AvailableAgentsSection] Fetched dynamic fields from Kiosk:", kioskContents);

        const listedItemDetailsPromises = kioskContents.data
          .filter(df => df.objectType.startsWith('0x2::kiosk::Listing<')) // Filter for Listing objects
          .map(async (df) => {
            // df.objectId is the ID of the Listing object
            // df.name.value is the ID of the listed item (Agar NFT)
            const listingObjectId = df.objectId;
            const listedItemObjectId = df.name.value as string; // Assuming name.value is the item ID

            // Fetch the Listing object content to get the price
            const listingObject = await suiClient.getObject({
              id: listingObjectId,
              options: { showContent: true },
            });

            let price: number | undefined = undefined;
            if (listingObject.data?.content?.dataType === 'moveObject') {
              const fields = (listingObject.data.content as SuiMoveObject).fields as any;
              if (fields && fields.value) { // 'value' field in Listing holds the price
                price = parseInt(fields.value, 10);
              }
            }

            // Fetch the actual Agar NFT object details
            const agarObject = await suiClient.getObject({
              id: listedItemObjectId,
              options: { showContent: true, showType: true },
            });

            if (agarObject.data?.type === AGAR_STRUCT_TYPE && agarObject.data.content?.dataType === 'moveObject' && price !== undefined) {
              const agarFields = (agarObject.data.content as SuiMoveObject).fields as any;
              return {
                id: agarObject.data!.objectId,
                owner: kioskId, // For listed items, owner is effectively the Kiosk
                author: agarFields.author,
                title: agarFields.title,
                category: agarFields.category,
                story: agarFields.story,
                price: price, // Price in MIST from the Listing object
                // Optional fields
                level: 1,
                wins: 0,
                matches: 0,
              } as AIAgent;
            }
            return null;
          });

        const resolvedAgents = (await Promise.all(listedItemDetailsPromises)).filter((agent): agent is AIAgent => agent !== null);

        console.log("[AvailableAgentsSection] Processed listed Agar agents:", resolvedAgents);
        setAvailableAgents(resolvedAgents);

      } catch (error) {
        console.error("[AvailableAgentsSection] Error fetching available objects from Kiosk:", error);
        alert("获取市场上待售的 AI Agent 时发生错误。请查看控制台。");
        setAvailableAgents([]);
      } finally {
        setIsLoadingAvailable(false);
      }
    };

    fetchAvailableAgents();
  }, [suiClient, contractVerified, kioskId, refreshTrigger]);

  // --- 购买 Agent 逻辑 ---
  const handleBuyAgent = async (agent: AIAgent) => {
    if (!walletConnected || !walletAddress) {
      setShowWalletModal(true);
      return;
    }
    if (!contractVerified) {
        alert("合约未验证或部署失败，无法执行购买交易。");
        return;
    }
    if (!kioskId) {
        alert("市场 Kiosk 未加载，无法购买。");
        return;
    }
    if (agent.price === undefined || agent.price <= 0) {
         alert("该 Agent 未设置有效价格或价格为零，无法购买。");
         return;
    }

    const balanceInMIST = BigInt(Math.floor(balance * 1_000_000_000));
    const priceInMIST = BigInt(agent.price);

    if (balanceInMIST < priceInMIST) {
      alert(`余额不足以购买此 AI Agent。所需: ${agent.price / 1_000_000_000} SUI`);
      return;
    }

    setPurchasingAgentId(agent.id);

    try {
        const txb = new Transaction();
        const [paymentCoin] = txb.splitCoins(txb.gas, [priceInMIST]);

        // The purchase_agar function in your agarsmarket.move returns (T0, TransferRequest<T0>)
        // T0 is the Agar object, TransferRequest is for royalty payments if applicable.
        const purchaseResult = txb.moveCall({
            target: `${CONTRACT_PACKAGE_ID}::${MARKET_MODULE_NAME}::${PURCHASE_FUNCTION_NAME}`,
            arguments: [
                txb.object(kioskId),      // Kiosk object
                txb.object(agent.id),     // ID of the Agar object to purchase
                paymentCoin,              // Coin for payment
            ],
            typeArguments: [AGAR_STRUCT_TYPE],
        });

        // If your agarsrules::pay function is needed, you'd chain it here.
        // Your agarsrules.move shows a pay function:
        // public fun pay<T0>(arg0: &mut 0x2::transfer_policy::TransferPolicy<T0>, arg1: &mut 0x2::transfer_policy::TransferRequest<T0>, arg2: &mut 0x2::coin::Coin<0x2::sui::SUI>, arg3: &mut 0x2::tx_context::TxContext)
        // This implies you need a TransferPolicy object for the Agar NFT.
        // Let's assume for now the purchase directly transfers or handles policy internally if no explicit policy is set up for each Agar.
        // If a TransferPolicy and calling `pay` is mandatory:
        // 1. You need to know the TransferPolicy ID associated with this Agar type or instance.
        // 2. The `purchase_agar` returns the Agar object (purchaseResult[0]) and TransferRequest (purchaseResult[1]).
        // 3. You would then call `agarsrules::pay` with the TransferPolicy, the TransferRequest, and potentially another coin for fees.

        // For simplicity, if `purchase_agar` handles the transfer and royalty (if any) without needing an explicit `pay` call from the client:
        // The purchased Agar (purchaseResult[0]) might need to be explicitly transferred to the buyer if `purchase_agar` doesn't do it.
        // However, `kiosk::purchase` typically transfers the item to the sender of the transaction.

        // Let's assume `kiosk::purchase` (called by your `purchase_agar`) handles the transfer of the Agar NFT to the buyer.
        // No further `txb.transferObjects` should be needed for the Agar NFT itself.

        signAndExecuteTransaction(
            { transaction: txb },
            {
                onSuccess: (result: SuiSignAndExecuteTransactionOutput) => {
                    console.log('购买交易成功:', result);
                    alert(`成功购买 Agent "${agent.title}"！`);
                    onBuySuccess(); // This will trigger refresh of both owned and available lists
                },
                onError: (error: Error) => {
                    console.error('购买交易失败:', error);
                    alert(`购买失败: ${error.message}。请查看控制台了解详情。`);
                },
                onSettled: () => {
                    setPurchasingAgentId(null); // 交易完成
                }
            }
        );

    } catch (error: unknown) {
        console.error('构建或执行购买交易时出错:', error);
        let message = '发生错误，请稍后再试。';
        if (error instanceof Error) {
            message = `发生错误: ${error.message}。请稍后再试。`;
        }
        alert(message);
        setPurchasingAgentId(null); // 确保在 catch 块中也设置加载状态为 false
    }
  };


  return (
    <section className="mb-12">
      <h2 className="text-2xl font-bold mb-6">Available AI Agents</h2>
      {!walletConnected && (
          <p className="text-gray-400 text-center">连接钱包以查看市场上待售的 AI Agent。</p>
      )}
      {walletConnected && !contractVerified && (
           <p className="text-yellow-500 text-center mb-6">
              正在验证合约部署... 验证成功后将显示待售 Agent。
          </p>
      )}
       {walletConnected && contractVerified && !kioskId && (
           <p className="text-yellow-500 text-center mb-6">
              正在获取或创建市场 Kiosk...
          </p>
      )}
      {walletConnected && contractVerified && kioskId && isLoadingAvailable && (
          <p className="text-gray-400 text-center">正在加载市场上待售的 AI Agent...</p>
      )}
       {walletConnected && contractVerified && kioskId && !isLoadingAvailable && availableAgents.length === 0 && (
          <p className="text-gray-400 text-center">目前市场上没有待售的 AI Agent。</p>
      )}
      {walletConnected && contractVerified && kioskId && !isLoadingAvailable && availableAgents.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableAgents.map((agent) => (
                  <div key={agent.id} className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 transition-all hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10"> {/* 边框颜色区分 */}
                      <div className="bg-gradient-to-r from-blue-900/40 to-cyan-900/40 p-4"> {/* 背景颜色区分 */}
                          <h3 className="text-xl font-bold flex items-center gap-2">
                              <Brain className="text-blue-400" size={20} /> {/* 图标颜色区分 */}
                              {agent.title}
                          </h3>
                      </div>

                      <div className="p-4 text-sm text-gray-300">
                          <p className="mb-2"><span className="font-semibold">ID:</span> {`${agent.id.substring(0, 6)}...${agent.id.length > 10 ? agent.id.substring(agent.id.length - 4) : ''}`}</p> {/* 避免 ID 过短时截取错误 */}
                          {/* 待售物品的 owner 是 Kiosk ID，可以不显示或显示 Kiosk ID */}
                          {/* <p className="mb-2"><span className="font-semibold">Owner (Kiosk):</span> {`${agent.owner.substring(0, 6)}...${agent.owner.substring(agent.owner.length - 4)}`}</p> */}
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
                                      className="bg-blue-500 h-2 rounded-full" // 进度条颜色区分
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

                          {/* 购买按钮和价格 */}
                          <div className="flex items-center justify-between mt-4">
                              <div className="flex items-center gap-1 text-lg font-bold text-green-400">
                                  <CreditCard size={20} />
                                  {/* 将 MIST 转换为 SUI 显示 */}
                                  <span>{agent.price !== undefined ? (agent.price / 1_000_000_000).toFixed(9).replace(/\.?0+$/, '') : 'N/A'} SUI</span>
                              </div>
                              <button
                                  onClick={() => handleBuyAgent(agent)}
                                  className="px-4 py-2 bg-green-600 rounded font-medium flex items-center gap-2 hover:bg-green-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                  disabled={purchasingAgentId === agent.id || !walletConnected || balance < (agent.price || 0) / 1_000_000_000 || !contractVerified || !kioskId || agent.price === undefined || agent.price <= 0}
                              >
                                  {purchasingAgentId === agent.id ? 'Buying...' : 'Buy Now'}
                                  <ShoppingCart size={16} />
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

export default AvailableAgentsSection;