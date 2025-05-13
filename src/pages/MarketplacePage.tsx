import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import { Brain, Zap, Trophy, CreditCard } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ConnectWalletModal from '../components/ConnectWalletModal';

type AIAgent = {
  id: number;
  name: string;
  level: number;
  wins: number;
  matches: number;
  price: number;
};

const MarketplacePage: React.FC = () => {
  const navigate = useNavigate();
  const { walletConnected, balance } = useWallet();
  const [showWalletModal, setShowWalletModal] = useState(false);
  
  // Sample AI agents data
  const [aiAgents] = useState<AIAgent[]>([
    { id: 1, name: 'CellCrusher', level: 5, wins: 12, matches: 18, price: 2.5 },
    { id: 2, name: 'VoidEater', level: 3, wins: 8, matches: 15, price: 1.8 },
    { id: 3, name: 'QuantumBlob', level: 7, wins: 25, matches: 32, price: 4.2 },
    { id: 4, name: 'NexusCore', level: 2, wins: 3, matches: 8, price: 0.9 },
    { id: 5, name: 'SynthCell', level: 4, wins: 10, matches: 19, price: 2.1 },
    { id: 6, name: 'BinarySwarm', level: 6, wins: 18, matches: 24, price: 3.5 },
  ]);

  const handleMintNewAgent = () => {
    if (!walletConnected) {
      setShowWalletModal(true);
      return;
    }
    
    if (balance < 0.5) {
      alert('Insufficient balance to mint a new AI agent. Minimum required: 0.5 SUI');
      return;
    }
    
    // Mint logic would go here
    alert('Minting new AI agent... This would connect to SUI blockchain in production.');
  };

  const handleBuyAgent = (agent: AIAgent) => {
    if (!walletConnected) {
      setShowWalletModal(true);
      return;
    }
    
    if (balance < agent.price) {
      alert(`Insufficient balance to buy this AI agent. Required: ${agent.price} SUI`);
      return;
    }
    
    // Purchase logic would go here
    alert(`Purchasing ${agent.name} for ${agent.price} SUI... This would connect to SUI blockchain in production.`);
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
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg font-medium flex items-center gap-2 hover:opacity-90 transition-all transform hover:scale-105"
              >
                Mint New Agent
              </button>
            </div>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold mb-6">Available AI Agents</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {aiAgents.map((agent) => (
                <div key={agent.id} className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 transition-all hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/10">
                  <div className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 p-4">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <Brain className="text-cyan-400" size={20} />
                      {agent.name}
                    </h3>
                  </div>
                  
                  <div className="p-4">
                    <div className="mb-4">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-gray-400">Level</span>
                        <span className="text-sm font-medium">{agent.level}</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-cyan-500 h-2 rounded-full" 
                          style={{ width: `${(agent.level / 10) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-gray-700/50 p-3 rounded text-center">
                        <div className="flex items-center justify-center gap-1 text-yellow-400 mb-1">
                          <Trophy size={16} />
                          <span className="font-bold">{agent.wins}</span>
                        </div>
                        <div className="text-xs text-gray-400">Wins</div>
                      </div>
                      
                      <div className="bg-gray-700/50 p-3 rounded text-center">
                        <div className="flex items-center justify-center gap-1 text-blue-400 mb-1">
                          <Zap size={16} />
                          <span className="font-bold">{agent.matches}</span>
                        </div>
                        <div className="text-xs text-gray-400">Matches</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="text-xl font-bold text-green-400">{agent.price} SUI</div>
                      <button 
                        onClick={() => handleBuyAgent(agent)}
                        className="px-4 py-2 bg-purple-600 rounded font-medium hover:bg-purple-700 transition-colors"
                      >
                        Buy Now
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
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