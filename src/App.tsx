import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import GamePage from './pages/GamePage';
import BettingPage from './pages/BettingPage';
import MarketplacePage from './pages/MarketplacePage';
import NotFoundPage from './pages/NotFoundPage';
import { GameProvider } from './context/GameContext';
import { WalletProvider } from './context/WalletContext';
import { BettingProvider } from './context/BettingContext';

function App() {
  return (
    <Router>
      <WalletProvider>
        <GameProvider>
          <BettingProvider>
            <div className="min-h-screen bg-gray-900 text-white">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/game" element={<GamePage />} />
                <Route path="/betting" element={<BettingPage />} />
                <Route path="/marketplace" element={<MarketplacePage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </div>
          </BettingProvider>
        </GameProvider>
      </WalletProvider>
    </Router>
  );
}

export default App;