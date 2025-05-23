import React, { useState, useEffect } from 'react'; // 确保导入 useEffect
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ConnectWalletModal from '../components/ConnectWalletModal';

// 导入新的组件
import MintAgentSection from '../components/MintAgentSection';
import OwnedAgentsSection from '../components/OwnedAgentsSection';
import AvailableAgentsSection from '../components/AvailableAgentsSection';


// 导入 Sui 相关的 hook 和库
import { useSuiClient } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { useSignAndExecuteTransaction } from '@mysten/dapp-kit';
// 导入 SuiSignAndExecuteTransactionOutput 和 MoveObject 类型
import { SuiTransactionBlockResponse, SuiMoveObject } from '@mysten/sui/client';
import { SuiSignAndExecuteTransactionOutput } from '@mysten/wallet-standard';

// 移除不再需要的 AIAgent 类型定义，因为它现在在组件内部定义
// type AIAgent = { ... };

// 从环境变量获取合约 Package ID
const CONTRACT_PACKAGE_ID = import.meta.env.VITE_SUI_CONTRACT_PACKAGE_ID;
// 定义 Agar 模块名和铸造函数名
const AGAR_MODULE_NAME = 'agar';
// 移除 MINT_FUNCTION_NAME，它现在在 MintAgentSection 中使用
// const MINT_FUNCTION_NAME = 'mint_agar';
// Agar NFT 的 Struct Type
const AGAR_STRUCT_TYPE = `${CONTRACT_PACKAGE_ID}::${AGAR_MODULE_NAME}::Agar`;

// 定义市场模块和 Kiosk 相关函数名
const MARKET_MODULE_NAME = 'agarsmarket';
const GET_OR_CREATE_KIOSK_FUNCTION_NAME = 'get_or_create_kiosk'; // 假设市场合约有这个函数

const MarketplacePage: React.FC = () => {
  const navigate = useNavigate();
  const { walletConnected, balance, walletAddress } = useWallet();
  const suiClient = useSuiClient();
  // 移除 signAndExecuteTransaction hook，它现在在组件内部使用
  // const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();

  const [showWalletModal, setShowWalletModal] = useState(false);
  const [contractVerified, setContractVerified] = useState(false); // 新增状态：合约是否验证成功

  // 移除 aiAgents 和 ownedAgents 状态，它们现在在组件内部管理
  // const [aiAgents, setAiAgents] = useState<AIAgent[]>([ ... ]);
  // const [ownedAgents, setOwnedAgents] = useState<AIAgent[]>([]);
  // 移除 isLoadingOwned 状态
  // const [isLoadingOwned, setIsLoadingOwned] = useState(false);

  // 新增状态：存储用户的 Kiosk ID 和 KioskOwnerCap ID
  const [kioskId, setKioskId] = useState<string | null>(null);
  const [kioskOwnerCapId, setKioskOwnerCapId] = useState<string | null>(null);
  const [isLoadingKiosk, setIsLoadingKiosk] = useState(false); // 新增加载状态

  // 用于触发重新获取 Agent 列表的状态
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // 新增函数：触发列表刷新
  const handleRefreshLists = () => {
    console.log('[MarketplacePage] Triggering lists refresh...');
    setRefreshTrigger(prev => prev + 1);
  };

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

  // --- 获取或创建用户 Kiosk 逻辑 ---
  useEffect(() => {
    const fetchOrCreateKiosk = async () => {
      // 只有在钱包连接、有地址且合约验证成功时才执行
      if (!suiClient || !walletAddress || !contractVerified) {
        setKioskId(null);
        setKioskOwnerCapId(null);
        return;
      }

      setIsLoadingKiosk(true);
      console.log(`Attempting to get or create Kiosk for address: ${walletAddress}`);

      try {
        const txb = new Transaction();

        // 调用市场合约的 get_or_create_kiosk Entry Function
        // 假设这个函数返回 (Kiosk, KioskOwnerCap)
        const [kiosk, kioskOwnerCap] = txb.moveCall({
          target: `${CONTRACT_PACKAGE_ID}::${MARKET_MODULE_NAME}::${GET_OR_CREATE_KIOSK_FUNCTION_NAME}`,
          arguments: [], // 假设不需要参数，或者只需要 TxContext (隐式)
          typeArguments: [], // 假设没有泛型参数
        });

        // Transfer KioskOwnerCap to the sender
        txb.transferObjects([kioskOwnerCap], walletAddress);

        // 签名并执行交易
        // 注意：这里使用 signAndExecuteTransaction，因为它会修改链上状态（可能创建 Kiosk）
        // 如果只想查询 Kiosk ID 而不创建，需要使用 suiClient.getOwnedObjects 查找 Kiosk 和 KioskOwnerCap
        // 这里的实现是“获取或创建”，所以需要交易
        // 使用 useSignAndExecuteTransaction hook 来执行交易
        // 注意：useSignAndExecuteTransaction 是一个 hook，不能直接在 useEffect 中 await 调用 mutate 函数
        // 需要将交易逻辑移到 useEffect 外部，或者在 useEffect 内部使用一个 async 函数并在其中调用 mutate
        // 或者，更常见的方式是先尝试查询，如果不存在再触发创建交易（通常通过用户交互触发）
        // 考虑到这里的需求是“获取或创建”，并且 KioskOwnerCap 需要转移给用户，使用交易是合理的。
        // 但直接在 useEffect 中触发交易可能不是最佳实践，因为它会在组件加载时自动触发。
        // 一个更好的方法是：
        // 1. 在 useEffect 中尝试查询用户已有的 KioskOwnerCap。
        // 2. 如果找到 KioskOwnerCap，提取 Kiosk ID 并设置状态。
        // 3. 如果没找到，显示一个按钮让用户手动“创建市场”。
        // 4. 用户点击按钮后，执行创建 Kiosk 的交易。

        // 暂时保留在 useEffect 中尝试获取或创建的逻辑，但请注意这可能不是最终的最佳用户体验。
        // 更好的方式是先查询，如果不存在再提示用户创建。

        // 尝试查询用户已有的 KioskOwnerCap
        const ownedObjects = await suiClient.getOwnedObjects({
            owner: walletAddress,
            filter: {
                StructType: '0x2::kiosk::KioskOwnerCap', // 查找 KioskOwnerCap 类型
            },
            options: {
                showContent: true,
            }
        });

        const existingCap = ownedObjects.data.find(obj => obj.data?.content?.dataType === 'moveObject');

        if (existingCap && existingCap.data?.content?.dataType === 'moveObject') {
            const fields = (existingCap.data.content as SuiMoveObject).fields as any;
            const existingKioskId = fields.for; // KioskOwnerCap 的 'for' 字段指向 Kiosk ID
            const existingKioskOwnerCapId = existingCap.data.objectId;
            console.log(`Found existing Kiosk ID: ${existingKioskId}, KioskOwnerCap ID: ${existingKioskOwnerCapId}`);
            setKioskId(existingKioskId);
            setKioskOwnerCapId(existingKioskOwnerCapId);
        } else {
            console.log("No existing KioskOwnerCap found, attempting to create Kiosk...");
            // 如果没有找到已有的 KioskOwnerCap，则执行创建 Kiosk 的交易
            // 注意：这里直接在 useEffect 中触发交易，可能会在页面加载时自动弹出钱包确认。
            // 更好的做法是让用户手动触发创建。为了简化，我们先保留这个自动触发的逻辑。

            // 使用 useSignAndExecuteTransaction hook 的 mutate 函数来执行交易
            // 由于 mutate 是异步的，我们需要在 useEffect 内部定义一个 async 函数来调用它
            // 或者将 Kiosk 创建逻辑移到 useEffect 外部，通过用户交互触发
            // 为了让 useEffect 能够等待交易结果，我们暂时将交易执行逻辑放在这里
            // **警告：直接在 useEffect 中执行交易可能导致意外行为，特别是在组件重新渲染时。**
            // **生产环境中应避免此模式，改为通过用户交互触发交易。**

            // 临时方案：在 useEffect 中执行创建交易
            // 需要一个临时的 signAndExecuteTransaction 实例，或者将 Kiosk 状态管理移到 WalletContext 或其他地方
            // 考虑到 useSignAndExecuteTransaction 是 hook，不能在 useEffect 条件判断后直接调用
            // 我们需要将 Kiosk 状态和获取/创建逻辑提升到 WalletContext 或使用一个独立的 hook
            // 或者，我们可以在 useEffect 中只负责查询，如果查询不到，就设置一个状态 `userNeedsKioskCreation: true`
            // 然后在 UI 中根据这个状态显示一个“创建市场”按钮。

            // **修改策略：** useEffect 只负责查询已有的 Kiosk。如果不存在，设置状态提示用户创建。
            // 创建 Kiosk 的交易逻辑放在一个单独的函数中，通过按钮触发。

            // 移除直接在 useEffect 中执行创建交易的逻辑
            // const result = await suiClient.signAndExecuteTransaction({ ... });
            // ... 处理 result ...

            // 设置状态提示用户需要创建 Kiosk (如果需要的话，这里暂时不实现按钮，只记录找不到)
             console.warn("User does not have a Kiosk. Creation needs to be triggered manually.");
             // 可以设置一个状态如 `setNeedsKioskCreation(true)` 并在 UI 中显示按钮
        }


      } catch (error: unknown) {
        console.error('Error getting or creating Kiosk:', error);
        let message = '获取或创建市场 Kiosk 时发生错误。';
        if (error instanceof Error) {
            message = `获取或创建市场 Kiosk 时发生错误: ${error.message}`;
        }
        alert(message);
        setKioskId(null);
        setKioskOwnerCapId(null);
      } finally {
        setIsLoadingKiosk(false);
      }
    };

    // 只有在钱包连接、有地址且合约验证成功时才尝试获取 Kiosk
    if (walletConnected && walletAddress && contractVerified) {
        fetchOrCreateKiosk();
    } else {
        // 如果条件不满足，清空 Kiosk 状态
        setKioskId(null);
        setKioskOwnerCapId(null);
    }

  }, [suiClient, walletAddress, walletConnected, contractVerified]); // 依赖项

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow py-8 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          {/* 添加页面的主标题和描述 */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">AI Agent Marketplace</h1>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Mint new AI agents or buy existing ones to compete in the arena. Train your agents by having them participate in matches to increase their value.
            </p>
          </div>

          {/* 铸造 Agent 部分 */}
          <MintAgentSection
            walletConnected={walletConnected}
            balance={balance}
            contractVerified={contractVerified}
            setShowWalletModal={setShowWalletModal}
            onMintSuccess={handleRefreshLists}
          />

          {/* 拥有的 Agent 部分 */}
          <OwnedAgentsSection
            walletConnected={walletConnected}
            walletAddress={walletAddress}
            contractVerified={contractVerified}
            kioskId={kioskId}
            kioskOwnerCapId={kioskOwnerCapId}
            refreshTrigger={refreshTrigger} 
            onListSuccess={handleRefreshLists} // 上架成功后也刷新列表
          />

          {/* 市场上待售的 Agent 部分 */}
          <AvailableAgentsSection
            walletConnected={walletConnected}
            walletAddress={walletAddress}
            balance={balance}
            contractVerified={contractVerified}
            kioskId={kioskId}
            refreshTrigger={refreshTrigger} 
            onBuySuccess={handleRefreshLists}
            setShowWalletModal={setShowWalletModal}
          />
        </div>
      </main>
      <Footer />
      <ConnectWalletModal
        show={showWalletModal}
        onClose={() => setShowWalletModal(false)}
      />
    </div>
  );
};

export default MarketplacePage;