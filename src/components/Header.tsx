import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import { Wallet, User, LogOut } from 'lucide-react';

interface HeaderProps {
  minimal?: boolean;
}

const Header: React.FC<HeaderProps> = ({ minimal = false }) => {
  const { walletConnected, walletAddress, balance, connectWallet, disconnectWallet } = useWallet();
  const location = useLocation();

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const handleConnectWallet = async () => {
    try {
      await connectWallet();
    } catch (error) {
      console.error('Header: Connect wallet failed', error);
    }
  };

  const handleDisconnectWallet = () => {
    disconnectWallet();
  };

  if (minimal) {
    return (
      <header className="bg-gray-900 border-b border-gray-800 p-2">
        <div className="flex justify-between items-center">
          <Link to="/" className="flex items-center">
            <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
              SUI Battle Arena
            </span>
          </Link>
          
          <div className="flex items-center gap-2">
            {walletConnected ? (
              <div className="flex items-center">
                <div className="flex items-center bg-gray-800 rounded-lg overflow-hidden">
                  <div className="bg-gray-700 px-3 py-1 flex items-center gap-1">
                    <User size={14} className="text-cyan-400" />
                    <span className="text-sm">{truncateAddress(walletAddress)}</span>
                  </div>
                  <div className="px-3 py-1 text-sm text-green-400 font-medium">
                    {balance.toFixed(2)} SUI
                  </div>
                </div>
                <button 
                  onClick={handleDisconnectWallet}
                  className="ml-2 p-1 text-gray-400 hover:text-white rounded-full"
                  title="Disconnect Wallet"
                >
                  <LogOut size={14} />
                </button>
              </div>
            ) : (
              <button
                onClick={handleConnectWallet}
                className="px-3 py-1 bg-purple-600 rounded-lg text-sm flex items-center gap-1"
              >
                <Wallet size={14} />
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-gray-900 border-b border-gray-800 py-4 px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        <Link to="/" className="flex items-center">
          <span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
            SUI Battle Arena
          </span>
        </Link>
        
        <nav>
          <ul className="flex items-center gap-6">
            <li>
              <Link 
                to="/" 
                className={`text-sm font-medium ${location.pathname === '/' ? 'text-purple-400' : 'text-gray-300 hover:text-white'}`}
              >
                Home
              </Link>
            </li>
            <li>
              <Link 
                to="/game" 
                className={`text-sm font-medium ${location.pathname === '/game' ? 'text-purple-400' : 'text-gray-300 hover:text-white'}`}
              >
                Play
              </Link>
            </li>
            <li>
              <Link 
                to="/betting" 
                className={`text-sm font-medium ${location.pathname === '/betting' ? 'text-purple-400' : 'text-gray-300 hover:text-white'}`}
              >
                Betting
              </Link>
            </li>
            <li>
              <Link 
                to="/marketplace" 
                className={`text-sm font-medium ${location.pathname === '/marketplace' ? 'text-purple-400' : 'text-gray-300 hover:text-white'}`}
              >
                Marketplace
              </Link>
            </li>
          </ul>
        </nav>
        
        <div className="flex items-center gap-2">
          {walletConnected ? (
            <div className="flex items-center">
              <div className="flex items-center bg-gray-800 rounded-lg overflow-hidden">
                <div className="bg-gray-700 px-3 py-2 flex items-center gap-1">
                  <User size={16} className="text-cyan-400" />
                  <span className="text-sm font-medium">{truncateAddress(walletAddress)}</span>
                </div>
                <div className="px-3 py-2 text-sm text-green-400 font-medium">
                  {balance.toFixed(2)} SUI
                </div>
              </div>
              <button 
                onClick={handleDisconnectWallet}
                className="ml-2 p-2 text-gray-400 hover:text-white rounded-full"
                title="Disconnect Wallet"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button
              onClick={handleConnectWallet}
              className="px-4 py-2 bg-purple-600 rounded-lg font-medium flex items-center gap-2 hover:bg-purple-700 transition-colors"
            >
              <Wallet size={16} />
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;