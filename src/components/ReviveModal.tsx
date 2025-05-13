import React from 'react';
import { useWallet } from '../context/WalletContext';
import { XCircle, Repeat, ArrowLeft } from 'lucide-react';

interface ReviveModalProps {
  onRevive: () => void;
  onClose: () => void;
}

const ReviveModal: React.FC<ReviveModalProps> = ({ onRevive, onClose }) => {
  const { walletConnected, balance } = useWallet();
  const reviveCost = 0.5; // SUI cost
  
  const handleRevive = () => {
    if (!walletConnected || balance < reviveCost) return;
    onRevive();
  };
  
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-md w-full border border-gray-700 shadow-xl overflow-hidden">
        <div className="bg-red-900/30 border-b border-red-500/30 p-4 text-center">
          <h2 className="text-xl font-bold">You Were Consumed!</h2>
        </div>
        
        <div className="p-6">
          <p className="text-gray-300 mb-6 text-center">
            Your cell has been consumed by another player. Would you like to revive and continue playing?
          </p>
          
          <div className="bg-gray-700/50 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Revive Cost:</span>
              <span className="text-amber-400 font-bold">0.5 SUI</span>
            </div>
            
            <div className="flex justify-between items-center mt-2">
              <span className="text-gray-300">Your Balance:</span>
              <span className={`font-bold ${balance >= reviveCost ? 'text-green-400' : 'text-red-400'}`}>
                {balance.toFixed(2)} SUI
              </span>
            </div>
            
            {!walletConnected && (
              <div className="mt-3 text-red-400 text-sm">
                You need to connect your wallet first.
              </div>
            )}
            
            {walletConnected && balance < reviveCost && (
              <div className="mt-3 text-red-400 text-sm">
                Insufficient balance to revive.
              </div>
            )}
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-gray-700 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-gray-600 transition-colors"
            >
              <ArrowLeft size={18} />
              Exit Game
            </button>
            
            <button
              onClick={handleRevive}
              disabled={!walletConnected || balance < reviveCost}
              className={`flex-1 py-3 rounded-lg font-medium flex items-center justify-center gap-2 ${
                walletConnected && balance >= reviveCost
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90'
                  : 'bg-gray-700 cursor-not-allowed'
              }`}
            >
              <Repeat size={18} />
              Revive Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviveModal;