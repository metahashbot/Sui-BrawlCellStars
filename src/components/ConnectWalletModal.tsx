import React, { useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { XCircle, Wallet, ExternalLink } from 'lucide-react';

interface ConnectWalletModalProps {
  onClose: () => void;
}

const ConnectWalletModal: React.FC<ConnectWalletModalProps> = ({ onClose }) => {
  const { connectWallet, connecting: walletConnecting } = useWallet();
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleConnect = async () => {
    try {
      setError(null);
      setConnecting(true);
      console.log('Starting wallet connection');
      await connectWallet();
      console.log('Wallet connected successfully, closing modal');
      setConnecting(false);
      onClose();
    } catch (err) {
      console.error('Failed to connect wallet:', err);
      setError('Failed to connect wallet. Please ensure you have a SUI wallet installed and refresh the page to try again.');
      setConnecting(false);
    }
  };
  
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
            disabled={connecting || walletConnecting}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-70"
          >
            {connecting || walletConnecting ? (
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