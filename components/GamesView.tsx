
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Play, X, Gamepad2, Coins, RotateCw, Lock } from 'lucide-react';
import { Language, User } from '../types';
import { GAMES } from '../constants';
import { updateWalletForGame } from '../services/firebaseService';

interface GamesViewProps {
  language: Language;
  onBack: () => void;
  user: User;
}

interface Fruit {
    id: number;
    icon: string;
    multi: number;
    color: string;
}

const FRUITS: Fruit[] = [
    { id: 0, icon: '🍊', multi: 5, color: 'bg-orange-500' },
    { id: 1, icon: '🍎', multi: 5, color: 'bg-red-500' },
    { id: 2, icon: '🍋', multi: 5, color: 'bg-yellow-400' },
    { id: 3, icon: '🍑', multi: 5, color: 'bg-pink-400' },
    { id: 4, icon: '🍓', multi: 10, color: 'bg-rose-600' },
    { id: 5, icon: '🥭', multi: 15, color: 'bg-amber-500' },
    { id: 6, icon: '🍉', multi: 25, color: 'bg-green-500' },
    { id: 7, icon: '🍒', multi: 45, color: 'bg-red-700' },
];

const CHIPS = [100, 1000, 10000, 100000];

const GamesView: React.FC<GamesViewProps> = ({ language, onBack, user }) => {
  const [activeGame, setActiveGame] = useState<string | null>(null);
  
  // Fruit Game State
  const [bets, setBets] = useState<Record<number, number>>({});
  const [selectedChip, setSelectedChip] = useState(100);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [lastWin, setLastWin] = useState<number | null>(null);
  const [message, setMessage] = useState('');

  const t = (key: string) => {
    const dict: Record<string, { ar: string, en: string }> = {
      hub: { ar: 'مركز الألعاب', en: 'Games Hub' },
      play: { ar: 'لعب الآن', en: 'Play Now' },
      fruitWar: { ar: 'حرب الفواكه', en: 'Fruit War' },
      start: { ar: 'بدء اللعب', en: 'START' },
      balance: { ar: 'الرصيد', en: 'Balance' },
      win: { ar: 'مبروك! ربحت', en: 'You Won' },
      tryAgain: { ar: 'حظ أوفر', en: 'Try Again' },
      bet: { ar: 'الرهان', en: 'Total Bet' },
      clear: { ar: 'مسح', en: 'Clear' },
      insufficient: { ar: 'رصيد غير كاف', en: 'Insufficient Funds' },
      selectBet: { ar: 'اختر الرهان', en: 'Select Bet' },
      maintenance: { ar: 'عفواً، اللعبة في الصيانة حالياً 🛠️', en: 'Sorry, game is under maintenance 🛠️' },
      closed: { ar: 'مغلق للصيانة', en: 'Maintenance' }
    };
    return dict[key][language];
  };

  const handlePlaceBet = (fruitId: number) => {
      if (isSpinning) return;
      const currentTotalBet = Object.values(bets).reduce((a: number, b: number) => a + b, 0);
      
      // Check local check first, server will validate later too
      if ((user.wallet?.diamonds || 0) < currentTotalBet + selectedChip) {
          setMessage(t('insufficient'));
          setTimeout(() => setMessage(''), 2000);
          return;
      }

      setBets(prev => ({
          ...prev,
          [fruitId]: (prev[fruitId] || 0) + selectedChip
      }));
  };

  const handleClearBets = () => {
      if (isSpinning) return;
      setBets({});
      setMessage('');
      setLastWin(null);
  };

  const spin = async () => {
      const totalBet = Object.values(bets).reduce((a: number, b: number) => a + b, 0);
      if (totalBet === 0 || isSpinning) return;
      if ((user.wallet?.diamonds || 0) < totalBet) {
          setMessage(t('insufficient'));
          return;
      }

      setIsSpinning(true);
      setMessage('');
      setLastWin(null);

      try {
          // 1. Deduct Bet Immediately
          if (user.uid) {
              await updateWalletForGame(user.uid, -totalBet);
          }

          // 2. Animation Logic
          let round = 0;
          let currentIdx = highlightIndex;
          const maxRounds = 3; // Full circles before slowing down
          const winnerIndex = Math.floor(Math.random() * 8); // Determine winner
          
          const runAnimation = (speed: number) => {
              setTimeout(async () => {
                  currentIdx = (currentIdx + 1) % 8;
                  setHighlightIndex(currentIdx);

                  if (round < maxRounds * 8 + winnerIndex) {
                      round++;
                      // Speed curve: Fast then slow
                      let nextSpeed = speed;
                      if (round < 10) nextSpeed = 100;
                      else if (round > (maxRounds * 8 - 5)) nextSpeed += 50; // Slow down at end
                      else nextSpeed = 50; // Max speed

                      runAnimation(nextSpeed);
                  } else {
                      // 3. Animation Stopped on Winner
                      setIsSpinning(false);
                      const winnings = (bets[winnerIndex] || 0) * FRUITS[winnerIndex].multi;
                      
                      if (winnings > 0) {
                          setMessage(`${t('win')} 💎 ${winnings.toLocaleString()}`);
                          setLastWin(winnings);
                          if (user.uid) {
                              await updateWalletForGame(user.uid, winnings);
                          }
                      } else {
                          setMessage(t('tryAgain'));
                      }
                      
                      // Clear bets for next round? Or keep them? Usually casinos keep them or clear. 
                      // Let's clear to prevent accidental double betting.
                      setBets({});
                  }
              }, speed);
          };

          runAnimation(100);

      } catch (e) {
          console.error(e);
          setIsSpinning(false);
          setMessage("Error");
      }
  };

  return (
    <div className="h-full bg-gray-900 text-white flex flex-col relative overflow-hidden font-sans">
      {/* Header */}
      <div className="p-4 flex items-center justify-between bg-gray-800 shadow-sm z-10 shrink-0">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-white/10 transition">
            <ArrowLeft className="w-6 h-6 rtl:rotate-180 text-white" />
        </button>
        <h1 className="text-xl font-bold flex items-center gap-2">
            <Gamepad2 className="w-6 h-6 text-brand-500" />
            {t('hub')}
        </h1>
        <div className="w-10"></div>
      </div>

      {/* Game Grid / Menu */}
      {!activeGame ? (
          <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 gap-4 relative z-10">
            {/* Fruit War Entry Card - DISABLED / MAINTENANCE MODE */}
            <div 
                onClick={() => alert(t('maintenance'))}
                className="group relative h-48 rounded-3xl overflow-hidden cursor-not-allowed border-2 border-white/10 shadow-2xl grayscale opacity-80"
            >
                <img src="https://images.unsplash.com/photo-1610832958506-aa56368176cf?q=80&w=800&auto=format&fit=crop" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/60"></div>
                <div className="absolute bottom-0 left-0 right-0 p-5">
                    <div className="flex justify-between items-end">
                        <div>
                            <div className="text-4xl mb-2 filter drop-shadow-lg opacity-50">🎰 🍒 🍊</div>
                            <h3 className="text-2xl font-black text-gray-300 drop-shadow-md">{t('fruitWar')}</h3>
                        </div>
                        <button className="bg-gray-700 text-gray-400 px-6 py-2 rounded-full font-bold text-sm shadow-lg flex items-center gap-2 cursor-not-allowed border border-gray-600">
                            <Lock className="w-4 h-4" /> {t('closed')}
                        </button>
                    </div>
                </div>
            </div>
            {/* Other games from constant could be mapped here */}
          </div>
      ) : activeGame === 'fruit_war' ? (
          <div className="flex-1 flex flex-col relative bg-[#1a1b2e]">
              {/* Game Header */}
              <div className="p-3 bg-[#131420] flex justify-between items-center shadow-md shrink-0">
                  <button onClick={() => setActiveGame(null)} className="p-2 bg-white/5 rounded-full hover:bg-white/10"><X className="w-5 h-5"/></button>
                  <div className="flex flex-col items-center">
                      <span className="text-[10px] text-gray-400">{t('balance')}</span>
                      <div className="flex items-center gap-1 bg-black/40 px-3 py-1 rounded-full border border-white/5">
                          <span className="text-cyan-400 font-bold">💎 {user.wallet?.diamonds?.toLocaleString() || 0}</span>
                      </div>
                  </div>
                  <div className="w-9"></div>
              </div>

              {/* Game Board */}
              <div className="flex-1 flex flex-col items-center justify-center p-4 relative">
                  {/* Result Message Overlay */}
                  {message && (
                      <div className={`absolute top-10 left-0 right-0 z-20 flex justify-center pointer-events-none animate-in fade-in slide-in-from-top-5`}>
                          <div className={`px-6 py-2 rounded-full font-bold shadow-2xl border-2 ${lastWin ? 'bg-yellow-500 text-black border-yellow-200' : 'bg-red-500/90 text-white border-red-400'}`}>
                              {message}
                          </div>
                      </div>
                  )}

                  {/* Fruit Grid */}
                  <div className="grid grid-cols-4 gap-3 w-full max-w-md aspect-[4/3] mb-4">
                      {FRUITS.map((fruit, idx) => {
                          const isActive = highlightIndex === idx;
                          const myBet = bets[idx] || 0;
                          
                          return (
                              <div 
                                key={fruit.id}
                                onClick={() => handlePlaceBet(idx)}
                                className={`
                                    relative rounded-xl flex flex-col items-center justify-center border-2 transition-all duration-150 cursor-pointer select-none
                                    ${fruit.color} 
                                    ${isActive ? 'brightness-125 scale-105 shadow-[0_0_20px_white] z-10 border-white' : 'brightness-75 border-white/10 hover:brightness-90'}
                                    ${isSpinning ? 'cursor-not-allowed' : 'active:scale-95'}
                                `}
                              >
                                  <div className="text-3xl drop-shadow-md mb-1">{fruit.icon}</div>
                                  <div className="bg-black/40 px-2 py-0.5 rounded text-[10px] font-bold text-white">x{fruit.multi}</div>
                                  
                                  {/* Bet Badge */}
                                  {myBet > 0 && (
                                      <div className="absolute -top-2 -right-2 bg-yellow-500 text-black text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-white shadow-sm z-20 min-w-[20px] text-center">
                                          {myBet >= 1000 ? (myBet/1000) + 'k' : myBet}
                                      </div>
                                  )}
                              </div>
                          )
                      })}
                  </div>

                  {/* Total Bet Display */}
                  <div className="w-full max-w-md flex justify-between items-center mb-4 px-2">
                      <div className="text-xs text-gray-400">
                          {t('bet')}: <span className="text-white font-bold">{Object.values(bets).reduce((a: number, b: number) => a + b, 0).toLocaleString()}</span>
                      </div>
                      <button onClick={handleClearBets} disabled={isSpinning} className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50">{t('clear')}</button>
                  </div>

                  {/* Controls */}
                  <div className="w-full max-w-md bg-[#25273c] rounded-t-3xl p-5 pb-8 shadow-[0_-5px_20px_rgba(0,0,0,0.3)] border-t border-white/5">
                      <p className="text-center text-[10px] text-gray-500 mb-3 uppercase tracking-widest">{t('selectBet')}</p>
                      
                      <div className="flex justify-center gap-3 mb-6">
                          {CHIPS.map(amount => (
                              <button 
                                key={amount}
                                onClick={() => setSelectedChip(amount)}
                                disabled={isSpinning}
                                className={`
                                    w-14 h-14 rounded-full flex items-center justify-center font-bold text-[10px] shadow-lg border-4 transition-transform active:scale-90
                                    ${selectedChip === amount ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-[#25273c]' : 'opacity-80 hover:opacity-100'}
                                    ${amount === 100 ? 'bg-blue-500 border-blue-400 text-white' : ''}
                                    ${amount === 1000 ? 'bg-purple-500 border-purple-400 text-white' : ''}
                                    ${amount === 10000 ? 'bg-orange-500 border-orange-400 text-white' : ''}
                                    ${amount === 100000 ? 'bg-red-600 border-red-500 text-white' : ''}
                                `}
                              >
                                  {amount >= 1000 ? (amount/1000) + 'k' : amount}
                              </button>
                          ))}
                      </div>

                      <button 
                        onClick={spin}
                        disabled={isSpinning || Object.keys(bets).length === 0}
                        className={`
                            w-full py-4 rounded-2xl font-black text-xl tracking-widest shadow-xl transition-all
                            ${isSpinning || Object.keys(bets).length === 0 ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gradient-to-r from-yellow-500 to-orange-600 text-white hover:scale-[1.02] active:scale-95 shadow-orange-500/20'}
                        `}
                      >
                          {isSpinning ? <RotateCw className="w-6 h-6 animate-spin mx-auto"/> : t('start')}
                      </button>
                  </div>
              </div>
          </div>
      ) : (
          <div />
      )}
    </div>
  );
};

export default GamesView;
