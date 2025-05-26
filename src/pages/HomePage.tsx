import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import { Swords, Wallet, Trophy, PlusCircle, Bot } from 'lucide-react'; import GamePreview from '../components/GamePreview';
import ConnectWalletModal from '../components/ConnectWalletModal';
import Header from '../components/Header';
import Footer from '../components/Footer';

const HomePage: React.FC = () => {
  const [showWalletModal, setShowWalletModal] = useState(false);
  const { walletConnected, balance } = useWallet();
  const navigate = useNavigate();

  const handleQuickMatch = () => {
    if (!walletConnected) {
      setShowWalletModal(true);
    } else if (balance < 0.5) { // Assuming minimum balance is 0.5 SUI
      alert('Insufficient balance to join a match. Minimum required: 0.5 SUI');
    } else {
      navigate('/game');
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-grow py-8 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <section className="mb-16">
            <div className="flex flex-col lg:flex-row items-center gap-8">
              <div className="lg:w-1/2">
                <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
                  AI-Powered Battle Arena on SUI Blockchain
                </h1>
                <p className="text-lg text-gray-300 mb-8">
                  Join the ultimate battle where human players and AI agents fight for dominance. 
                  Grow your cell, consume resources, and climb the leaderboard!
                </p>
                <div className="flex flex-wrap gap-4">
                  <button 
                    onClick={handleQuickMatch}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-medium flex items-center gap-2 hover:opacity-90 transition-all transform hover:scale-105"
                  >
                    <Swords size={20} />
                    Quick Match
                  </button>
                  
                  <button 
                    onClick={() => navigate('/marketplace')}
                    className="px-6 py-3 bg-gray-800 border border-purple-500 rounded-lg font-medium flex items-center gap-2 hover:bg-gray-700 transition-all"
                  >
                    <PlusCircle size={20} />
                    Mint AI Agent
                  </button>
                </div>
              </div>
              
              <div className="lg:w-1/2 w-full aspect-video">
                <GamePreview />
              </div>
            </div>
          </section>
          
          <section className="mb-16">
            <h2 className="text-2xl font-bold mb-6 text-center">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-gray-800 p-6 rounded-xl">
                <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center mb-4">
                  <Swords size={24} />
                </div>
                <h3 className="text-xl font-semibold mb-2">Battle</h3>
                <p className="text-gray-300">
                In a 6-minute match, try to consume as many nearby cells or smaller player cells as possible to increase your score. When the match ends, the top-ranked players will receive victory points and a share of the prize pool.
                </p>
              </div>
              
              <div className="bg-gray-800 p-6 rounded-xl">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mb-4">
                  <Wallet size={24} />
                </div>
                <h3 className="text-xl font-semibold mb-2">Bet</h3>
                <p className="text-gray-300">
                Spectators outside the match can place bets on their favored player using Sui tokens. If the chosen player wins a top ranking at the end of the match, you’ll also receive a reward based on the corresponding odds.
                </p>
              </div>
              
              <div className="bg-gray-800 p-6 rounded-xl">
                <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mb-4">
                  <Bot size={24} /> {/* 将 Trophy 替换为 Bot */}
                </div>
                <h3 className="text-xl font-semibold mb-2">Agent</h3>
                <p className="text-gray-300">
                If you’ve got great skills but lack the time to participate in matches, why not mint an AI Agent to play on your behalf? Not only can it compete for you, but it will also improve over time through learning. High-performing AI Agents can even be listed for sale or rental on the NFT marketplace, earning you additional income.
                </p>
              </div>
            </div>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold mb-6 text-center">Live Matches</h2>
            <div className="bg-gray-800 rounded-xl p-6">
              <div className="overflow-hidden rounded-lg">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Match ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Players</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Time Left</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Total Bets</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-gray-800 divide-y divide-gray-700">
                    {[1, 2, 3].map((match) => (
                      <tr key={match} className="hover:bg-gray-750">
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{`#${10000 + match}`}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{`${Math.floor(Math.random() * 5) + 5}/10`}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{`${Math.floor(Math.random() * 5) + 1}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{`${(Math.random() * 100).toFixed(2)} SUI`}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button 
                            onClick={() => navigate('/betting')}
                            className="px-3 py-1 bg-purple-600 rounded text-sm hover:bg-purple-700"
                          >
                            Watch & Bet
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>
      </main>
      
      <Footer />
      
      {/* 修改这里，将 showWalletModal 状态作为 show 属性传递 */}
      <ConnectWalletModal
        show={showWalletModal} // 添加 show 属性
        onClose={() => setShowWalletModal(false)}
      />
    </div>
  );
};

export default HomePage;