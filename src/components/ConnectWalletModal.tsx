import React, { useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { XCircle, Wallet, ExternalLink } from 'lucide-react';

interface ConnectWalletModalProps {
  onClose: () => void;
  // 添加 show 属性
  show: boolean;
}

// 修改组件以接收 show 属性
const ConnectWalletModal: React.FC<ConnectWalletModalProps> = ({ onClose, show }) => {
  const { connectWallet, connecting: walletConnecting } = useWallet();
  // 移除本地的 connecting 状态，只依赖 useWallet 提供的 walletConnecting
  // const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    console.log('[ConnectWalletModal] handleConnect called'); // 添加日志
    try {
      setError(null);
      // 移除设置本地 connecting 状态的逻辑
      // setConnecting(true);
      console.log('[ConnectWalletModal] Calling connectWallet from context'); // 添加日志
      await connectWallet();
      console.log('[ConnectWalletModal] connectWallet finished, closing modal'); // 添加日志
      // 移除清除本地 connecting 状态的逻辑
      // setConnecting(false);
      onClose();
    } catch (err) {
      console.error('[ConnectWalletModal] Failed to connect wallet:', err); // 添加日志
      let errorMessage = 'Failed to connect wallet. Please ensure you have a SUI wallet installed and refresh the page to try again.';
      if (err instanceof Error) {
            // 如果是 Error 实例，使用其 message
            errorMessage = `Connection failed: ${err.message}`;
        } else if (typeof err === 'string') {
            // 如果是字符串，直接使用
            errorMessage = `Connection failed: ${err}`;
        }
      setError(errorMessage);
      // 移除清除本地 connecting 状态的逻辑
      // setConnecting(false);
    }
  };

  // 根据 show 属性条件渲染模态框
  if (!show) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-md w-full border border-gray-700 shadow-xl">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Connect Wallet</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <XCircle size={20} />
            </button>
          </div>

          <p className="text-gray-300 mb-6">
            Connect your SUI wallet to participate in games, place bets, and manage your AI agents.
          </p>

          <div className="bg-gray-700/50 rounded-lg p-4 mb-6">
            <h3 className="font-medium mb-2">Requirements</h3>
            <ul className="text-sm text-gray-300 space-y-2">
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center text-xs">✓</span>
                SUI wallet installed
              </li>
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center text-xs">✓</span>
                Minimum 0.5 SUI balance required for gameplay
              </li>
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center text-xs">✓</span>
                Transaction approval required for betting
              </li>
            </ul>
          </div>

          {error && (
            <div className="bg-red-500/20 text-red-400 p-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleConnect}
            disabled={walletConnecting} // 只依赖 useWallet 提供的 walletConnecting 状态
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-70"
          >
            {walletConnecting ? ( // 只依赖 useWallet 提供的 walletConnecting 状态
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Connecting...
              </>
            ) : (
              <>
                <Wallet size={18} />
                Connect SUI Wallet
              </>
            )}
          </button>

          <div className="text-center mt-4">
            <a 
              href="https://sui.io/wallet" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1 justify-center"
            >
              Don't have a SUI wallet?
              <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConnectWalletModal;