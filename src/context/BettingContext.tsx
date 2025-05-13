import React, { createContext, useState, useContext, useEffect } from 'react';
import { useWallet } from './WalletContext';

type Bet = {
  id: string;
  entityId: number;
  amount: number;
  odds: number;
  timestamp: number;
};

type BettingContextType = {
  bettingEnabled: boolean;
  bettingClosing: boolean;
  timeUntilBetting: number;
  bets: Bet[];
  makeBet: (entityId: number, amount: number, odds: number) => void;
};

const initialState: BettingContextType = {
  bettingEnabled: false,
  bettingClosing: false,
  timeUntilBetting: 60, // 60 seconds until betting opens
  bets: [],
  makeBet: () => {},
};

const BettingContext = createContext<BettingContextType>(initialState);

export const BettingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { walletConnected, balance } = useWallet();
  const [bettingEnabled, setBettingEnabled] = useState(false);
  const [bettingClosing, setBettingClosing] = useState(false);
  const [timeUntilBetting, setTimeUntilBetting] = useState(60); // 60 seconds until betting opens
  const [bets, setBets] = useState<Bet[]>([]);
  
  // Timer to handle betting states
  useEffect(() => {
    // Initially betting is closed for first minute
    const bettingTimer = setInterval(() => {
      setTimeUntilBetting(prev => {
        if (prev <= 1) {
          clearInterval(bettingTimer);
          setBettingEnabled(true);
          
          // Schedule betting closing
          setTimeout(() => {
            setBettingClosing(true);
            
            // Close betting after 30 seconds of warning
            setTimeout(() => {
              setBettingEnabled(false);
              setBettingClosing(false);
            }, 30000);
          }, 180000); // 3 minutes of betting time
          
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => {
      clearInterval(bettingTimer);
    };
  }, []);
  
  // Make a bet
  const makeBet = (entityId: number, amount: number, odds: number) => {
    if (!walletConnected || !bettingEnabled || amount <= 0 || amount > balance) {
      return;
    }
    
    // Add new bet
    const newBet: Bet = {
      id: Date.now().toString(),
      entityId,
      amount,
      odds,
      timestamp: Date.now(),
    };
    
    setBets(prev => [...prev, newBet]);
    
    // In a real app, we would make a transaction to the SUI blockchain
    console.log(`Bet placed on entity ${entityId}: ${amount} SUI at ${odds}x odds`);
  };
  
  return (
    <BettingContext.Provider
      value={{
        bettingEnabled,
        bettingClosing,
        timeUntilBetting,
        bets,
        makeBet,
      }}
    >
      {children}
    </BettingContext.Provider>
  );
};

export const useBetting = () => useContext(BettingContext);