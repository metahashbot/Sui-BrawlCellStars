import React, { useState } from 'react';
import { Brain, Zap, CreditCard } from 'lucide-react';
import { useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { SuiSignAndExecuteTransactionOutput } from '@mysten/wallet-standard';

// 从环境变量获取合约 Package ID
const CONTRACT_PACKAGE_ID = import.meta.env.VITE_SUI_CONTRACT_PACKAGE_ID;
// 定义 Agar 模块名和铸造函数名
const AGAR_MODULE_NAME = 'agar';
const MINT_FUNCTION_NAME = 'mint_agar';

interface MintAgentSectionProps {
  walletConnected: boolean;
  balance: number; // 假设 balance 是 SUI 余额
  contractVerified: boolean;
  setShowWalletModal: (show: boolean) => void;
  onMintSuccess: () => void; // 铸造成功后的回调，用于刷新列表等
}

const MintAgentSection: React.FC<MintAgentSectionProps> = ({
  walletConnected,
  balance,
  contractVerified,
  setShowWalletModal,
  onMintSuccess,
}) => {
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();

  // 新增状态：用于存储用户输入的 Agent 信息
  const [author, setAuthor] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [story, setStory] = useState('');
  const [isMinting, setIsMinting] = useState(false); // 新增加载状态

  const handleMintNewAgent = async () => {
    if (!walletConnected) {
      setShowWalletModal(true);
      return;
    }

    if (!contractVerified) {
      alert("合约未验证或部署失败，无法执行铸造交易。");
      return;
    }

    // 检查输入字段是否为空
    if (!author || !title || !category || !story) {
        alert("请填写所有 Agent 信息字段。");
        return;
    }

    const mintCost = 0.1; // 假设铸造需要 0.1 SUI，请根据你的合约逻辑调整
    // 注意：你的 Move 合约 mint_agar 函数目前没有处理 SUI 支付。
    // 如果需要支付，你需要在 Move 合约中添加支付逻辑，并在前端构建交易时包含支付。
    // 目前前端的余额检查仅是客户端提示，不影响链上交易执行（除非合约本身检查支付）。
    if (balance < mintCost) {
      alert(`Insufficient balance to mint a new AI agent. Minimum required: ${mintCost} SUI`);
      return;
    }

    setIsMinting(true);

    try {
      const txb = new Transaction();

      // 调用合约的 mint_agar Entry Function
      // 使用 txb.pure.string() 直接传递字符串，它会负责编码为 vector<u8>
      txb.moveCall({
        target: `${CONTRACT_PACKAGE_ID}::${AGAR_MODULE_NAME}::${MINT_FUNCTION_NAME}`,
        arguments: [
          txb.pure.string(author), // author (vector<u8>)
          txb.pure.string(title),  // title (vector<u8>)
          txb.pure.string(category), // category (vector<u8>)
          txb.pure.string(story),  // story (vector<u8>)
          // TxContext 是隐式传递的，不需要在这里作为参数传递
        ],
        // typeArguments: [], // 如果 mint_agar 函数有泛型参数，需要在这里指定
      });

      // 签名并执行交易
      signAndExecuteTransaction(
        {
          transaction: txb,
        },
        {
          onSuccess: (result: SuiSignAndExecuteTransactionOutput) => {
            console.log('铸造交易成功:', result);
            alert(`成功铸造新的 AI Agent: "${title}"！`);
            // 清空输入字段
            setAuthor('');
            setTitle('');
            setCategory('');
            setStory('');
            // 调用成功回调
            onMintSuccess();
          },
          onError: (error: Error) => {
            console.error('铸造交易失败:', error);
            alert(`铸造失败: ${error.message}。请查看控制台了解详情。`);
          },
          onSettled: () => { // 交易完成（成功或失败）后设置加载状态为 false
            setIsMinting(false);
          }
        }
      );

    } catch (error: unknown) {
      console.error('构建或执行铸造交易时出错:', error);
      let message = '发生错误，请稍后再试。';
      if (error instanceof Error) {
        message = `发生错误: ${error.message}。请稍后再试。`;
      }
      alert(message);
      setIsMinting(false); // 确保在 catch 块中也设置加载状态为 false
    }
  };

  const mintCost = 0.1; // 假设铸造需要 0.1 SUI
  const isMintButtonDisabled = !walletConnected || balance < mintCost || !contractVerified || isMinting || !author || !title || !category || !story;

  return (
    <section className="mb-12">

      <div className="flex flex-col md:flex-row items-center justify-center gap-6 p-8 bg-gradient-to-r from-purple-900/40 to-blue-900/40 rounded-xl border border-purple-500/30">
        <div className="text-center md:text-left flex-grow"> {/* 使用 flex-grow 让输入部分占据更多空间 */}
          <h2 className="text-2xl font-bold mb-4">Mint a New AI Agent</h2>
          {/* 输入字段 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label htmlFor="author" className="block text-sm font-medium text-gray-300 mb-1">Author</label>
              <input
                type="text"
                id="author"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                placeholder="Enter author name"
                disabled={isMinting}
              />
            </div>
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-1">Title</label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                placeholder="Enter agent title"
                disabled={isMinting}
              />
            </div>
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-1">Category</label>
              <input
                type="text"
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                placeholder="Enter category"
                disabled={isMinting}
              />
            </div>
            <div>
              <label htmlFor="story" className="block text-sm font-medium text-gray-300 mb-1">Story</label>
              <textarea
                id="story"
                value={story}
                onChange={(e) => setStory(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                placeholder="Enter agent story"
                disabled={isMinting}
              ></textarea>
            </div>
          </div>

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
              <span>{mintCost} SUI</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleMintNewAgent}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg font-medium flex items-center gap-2 hover:opacity-90 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isMintButtonDisabled}
        >
          {isMinting ? 'Minting...' :
           !walletConnected ? 'Connect Wallet to Mint' :
           !contractVerified ? 'Contract Not Verified' :
           (balance < mintCost ? 'Insufficient Balance to Mint' : 'Mint New Agent')}
        </button>
      </div>
    </section>
  );
};

export default MintAgentSection;