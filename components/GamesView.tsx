
import React, { useState } from 'react';
import { ArrowLeft, Play, X, Gamepad2 } from 'lucide-react';
import { Language, User } from '../types';
import { GAMES } from '../constants';

interface GamesViewProps {
  language: Language;
  onBack: () => void;
  user: User;
}

const GamesView: React.FC<GamesViewProps> = ({ language, onBack, user }) => {
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinDeg, setSpinDeg] = useState(0);
  const [reward, setReward] = useState<string | null>(null);

  const t = (key: string) => {
    const dict: Record<string, { ar: string, en: string }> = {
      hub: { ar: 'مركز الألعاب', en: 'Games Hub' },
      play: { ar: 'لعب الآن', en: 'Play Now' },
      wheelTitle: { ar: 'عجلة الحظ', en: 'Lucky Wheel' },
      spin: { ar: 'تدوير (100 💎)', en: 'Spin (100 💎)' },
      win: { ar: 'مبروك! ربحت', en: 'Congrats! You won' },
      close: { ar: 'إغلاق', en: 'Close' },
      tryAgain: { ar: 'حاول مرة أخرى', en: 'Try Again' }
    };
    return dict[key][language];
  };

  const handleSpin = () => {
    if (isSpinning) return;
    
    // Logic check for funds would go here
    setIsSpinning(true);
    setReward(null);

    // Random degree + multiple spins
    const randomDeg = Math.floor(Math.random() * 360) + 3600;
    setSpinDeg(randomDeg);

    setTimeout(() => {
        setIsSpinning(false);
        const rewards = ['500 🪙', '50 💎', '10 💎', 'Empty 🌑', 'Jackpot 🏆', '1000 🪙'];
        setReward(rewards[Math.floor(Math.random() * rewards.length)]);
    }, 5000); // 5s spin duration matches CSS
  };

  return (
    <div className="h-full bg-gray-900 text-white flex flex-col relative overflow-hidden font-sans">
      {/* Header */}
      <div className="p-4 flex items-center justify-between bg-gray-800 shadow-sm z-10">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-white/10 transition">
            <ArrowLeft className="w-6 h-6 rtl:rotate-180 text-white" />
        </button>
        <h1 className="text-xl font-bold flex items-center gap-2">
            <Gamepad2 className="w-6 h-6 text-brand-500" />
            {t('hub')}
        </h1>
        <div className="w-10"></div>
      </div>

      {/* Game Grid */}
      <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 gap-4 relative z-10">
        {GAMES.map(game => (
            <div 
                key={game.id}
                onClick={() => setActiveGame(game.id)}
                className="group relative h-40 rounded-2xl overflow-hidden cursor-pointer border border-white/5 hover:border-brand-500 transition-all duration-300 shadow-lg"
            >
                <img src={game.bgImage} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
                
                <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                    <div>
                        <div className="text-3xl mb-1">{game.icon}</div>
                        <h3 className="text-lg font-bold text-white">{game.name[language]}</h3>
                    </div>
                    <button className="bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-full font-bold text-xs shadow-lg flex items-center gap-2">
                        <Play className="w-3 h-3 fill-white" /> {t('play')}
                    </button>
                </div>
            </div>
        ))}
      </div>

      {/* ACTIVE GAME MODAL (Lucky Wheel) */}
      {activeGame === 'lucky_wheel' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
              <div className="relative w-full max-w-sm bg-gray-800 rounded-3xl border border-white/10 shadow-2xl flex flex-col items-center justify-center overflow-hidden p-6">
                  
                  {/* Close Button */}
                  <button onClick={() => setActiveGame(null)} className="absolute top-4 right-4 p-2 bg-white/5 rounded-full hover:bg-white/10 z-20">
                      <X className="w-5 h-5 text-gray-400" />
                  </button>

                  <h2 className="text-xl font-bold text-white mb-6 z-10">{t('wheelTitle')}</h2>

                  {/* The Wheel */}
                  <div className="relative w-64 h-64 z-10 mb-6">
                      <div 
                        className="w-full h-full rounded-full border-4 border-brand-500 shadow-lg relative overflow-hidden transition-transform duration-[5000ms] cubic-bezier(0.25, 0.1, 0.25, 1)"
                        style={{ transform: `rotate(${spinDeg}deg)` }}
                      >
                          {/* Wheel Segments */}
                          <div className="absolute inset-0 bg-[conic-gradient(from_0deg,#ec4899_0deg_60deg,#8b5cf6_60deg_120deg,#ec4899_120deg_180deg,#8b5cf6_180deg_240deg,#ec4899_240deg_300deg,#8b5cf6_300deg_360deg)]"></div>
                          <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-3 h-3 bg-white rounded-full shadow"></div>
                          </div>
                      </div>
                      {/* Pointer */}
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[20px] border-t-white drop-shadow-md z-20"></div>
                  </div>

                  {/* Reward Display */}
                  <div className="h-12 flex items-center justify-center z-10 mb-4 w-full">
                      {reward ? (
                          <div className="animate-in zoom-in bg-green-500 text-white px-6 py-2 rounded-xl font-bold shadow-lg w-full text-center">
                              {t('win')} {reward}!
                          </div>
                      ) : (
                          <div className="text-gray-500 text-sm">Spin to win prizes!</div>
                      )}
                  </div>

                  <button 
                    onClick={handleSpin}
                    disabled={isSpinning}
                    className="w-full py-4 bg-gradient-to-r from-brand-600 to-accent-600 text-white font-bold text-lg rounded-xl shadow-lg hover:opacity-90 active:scale-95 transition disabled:opacity-50 disabled:scale-100 z-10"
                  >
                      {isSpinning ? '...' : t('spin')}
                  </button>
              </div>
          </div>
      )}
    </div>
  );
};

export default GamesView;
