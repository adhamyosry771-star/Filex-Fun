
import React, { useState, useEffect, useRef, memo } from 'react';
import { X, Gamepad2, Coins } from 'lucide-react';
import { User, Language, Room } from '../types';
import { updateWalletForGame } from '../services/firebaseService';

interface FruitWarGameProps {
  room: Room;
  currentUser: User;
  language: Language;
  onClose: () => void;
  onUpdateBalance: (newBalance: number) => void;
}

// --- CONSTANTS ---
const FRUITS = [
    { id: 0, icon: '🍊', multi: 5, color: 'bg-orange-500/20 border-orange-500/50', name: { en: 'Orange', ar: 'البرتقال' } },
    { id: 1, icon: '🍎', multi: 5, color: 'bg-red-500/20 border-red-500/50', name: { en: 'Apple', ar: 'التفاح' } },
    { id: 2, icon: '🍋', multi: 5, color: 'bg-yellow-400/20 border-yellow-400/50', name: { en: 'Lemon', ar: 'الليمون' } },
    { id: 3, icon: '🍑', multi: 5, color: 'bg-pink-400/20 border-pink-400/50', name: { en: 'Peach', ar: 'الخوخ' } },
    { id: 4, icon: '🍓', multi: 10, color: 'bg-rose-600/20 border-rose-600/50', name: { en: 'Strawberry', ar: 'الفراولة' } },
    { id: 5, icon: '🥭', multi: 15, color: 'bg-amber-500/20 border-amber-500/50', name: { en: 'Mango', ar: 'المانجو' } },
    { id: 6, icon: '🍉', multi: 25, color: 'bg-green-500/20 border-green-500/50', name: { en: 'Watermelon', ar: 'البطيخ' } },
    { id: 7, icon: '🍒', multi: 45, color: 'bg-red-700/20 border-red-700/50', name: { en: 'Cherry', ar: 'الكرز' } },
];

const CHIPS = [1000, 10000, 100000];

const GRID_MAP = [
    0, 1, 2,
    7, -1, 3, // -1 is Timer
    6, 5, 4
];

// --- MEMOIZED COMPONENTS FOR PERFORMANCE ---
const FruitItem = memo(({ fruitIdx, isActive, isWinner, myBet, onClick, gameState }: any) => {
    if (fruitIdx === -1) return null; // Handled by Timer component
    const fruit = FRUITS[fruitIdx];
    
    return (
        <div 
            onClick={() => onClick(fruitIdx)}
            className={`
                relative aspect-square rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all duration-75 border-2 overflow-hidden
                ${isWinner ? 'bg-yellow-500 border-yellow-300 scale-105 shadow-[0_0_20px_gold] z-10' : isActive ? 'border-4 border-cyan-400 bg-cyan-900/40 z-10 shadow-[0_0_20px_rgba(34,211,238,0.8)] scale-105' : 'bg-[#2a1d45] border-purple-500/30 hover:brightness-125'}
                ${gameState !== 'BETTING' ? 'cursor-not-allowed opacity-90' : 'active:scale-95'}
            `}
        >
            {/* Top Right: My Bet Badge */}
            {myBet > 0 && (
                <div className="absolute top-1 right-1 bg-yellow-500 text-black text-[8px] font-black px-1.5 rounded-md border border-white shadow-sm z-20 min-w-[20px] text-center leading-tight">
                    {myBet >= 1000 ? (myBet / 1000).toFixed(0) + 'k' : myBet}
                </div>
            )}

            {/* Center: Fruit Icon */}
            <div className="text-4xl filter drop-shadow-md mb-3 transform transition-transform duration-300">{fruit.icon}</div>
            
            {/* Bottom: Multiplier Badge */}
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 bg-black/60 px-2 py-0.5 rounded-full border border-white/10 w-[80%] flex justify-center">
                <span className="text-[10px] font-black text-white">x{fruit.multi}</span>
            </div>
        </div>
    );
});

const TimerCell = memo(({ timer, state }: { timer: number, state: string }) => (
    <div className="aspect-square rounded-xl bg-black/50 border-2 border-yellow-500/50 flex flex-col items-center justify-center relative overflow-hidden shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
        <div className="absolute inset-1 border border-dotted border-white/20 rounded-lg"></div>
        <span className={`text-4xl font-black font-mono tracking-widest drop-shadow-[0_0_10px_rgba(234,179,8,0.8)] ${timer <= 10 && state === 'BETTING' ? 'text-red-500 animate-pulse' : 'text-yellow-400'}`}>
            {timer < 10 ? `0${timer}` : timer}
        </span>
        <span className="text-[8px] text-white/50 uppercase tracking-widest mt-1">
            {state === 'BETTING' ? 'Betting' : 'Spinning'}
        </span>
    </div>
));

// --- MAIN GAME COMPONENT ---
export const FruitWarGame: React.FC<FruitWarGameProps> = ({ room, currentUser, language, onClose, onUpdateBalance }) => {
    const [fwBets, setFwBets] = useState<Record<number, number>>({});
    const [fwChip, setFwChip] = useState(1000);
    const [fwHighlight, setFwHighlight] = useState(0);
    const [fwState, setFwState] = useState<'BETTING' | 'SPINNING' | 'RESULT'>('BETTING');
    const [fwTimer, setFwTimer] = useState(30);
    const [fwHistory, setFwHistory] = useState<number[]>([]);
    const [fwWinner, setFwWinner] = useState<number | null>(null);
    const [fwResultData, setFwResultData] = useState<{winAmount: number, isWinner: boolean} | null>(null);
    
    // Local Visual Balance for Instant Feedback
    const [visualBalance, setVisualBalance] = useState(currentUser.wallet?.diamonds || 0);

    // BATCHING REFS
    const pendingBetDeduction = useRef(0);
    const fwBetsRef = useRef<Record<number, number>>({});

    // Sync Ref
    useEffect(() => { fwBetsRef.current = fwBets; }, [fwBets]);

    const t = (key: string) => {
        const dict: Record<string, { ar: string, en: string }> = {
            fruitWar: { ar: 'حرب الفواكه', en: 'Fruit War' },
            win: { ar: 'مبروك! ربحت', en: 'You Won' },
            bet: { ar: 'الرهان', en: 'Total Bet' },
            dailyProfit: { ar: 'الربح اليومي', en: 'Daily Profit' },
            lastRound: { ar: 'الجولات السابقة', en: 'Last Rounds' },
            winnerIs: { ar: 'الفاكهة الفائزة هي', en: 'The Winner Is' },
            noWin: { ar: 'للأسف لم تحصل على شيء', en: 'No winnings this time' },
            luck: { ar: 'حظ أوفر في المرة القادمة', en: 'Better luck next time' },
            congrats: { ar: 'مبروك كسبت', en: 'Congrats! You won' },
            maxBets: { ar: 'يمكنك الرهان على 6 فواكه فقط كحد أقصى!', en: 'Max 6 fruits allowed!' },
            noFunds: { ar: 'لا يوجد رصيد كافٍ', en: 'Insufficient Balance' }
        };
        return dict[key]?.[language] || key;
    };

    // --- BATCH FLUSHING LOGIC ---
    const flushPendingBets = async () => {
        if (pendingBetDeduction.current > 0) {
            const amountToDeduct = pendingBetDeduction.current;
            pendingBetDeduction.current = 0; // Reset immediately to prevent double deduction
            try {
                // Deduct from DB (amount is passed as negative to subtract)
                if (currentUser.uid) {
                    await updateWalletForGame(currentUser.uid, -amountToDeduct);
                }
            } catch (e) {
                console.error("Failed to sync bets to server", e);
                // Optional: We could rollback, but for games it's better to keep moving
                // or show an error. Here we assume success or user will retry.
            }
        }
    };

    // Flush bets periodically (every 2 seconds) to avoid spamming Firestore
    useEffect(() => {
        const interval = setInterval(flushPendingBets, 2000);
        return () => {
            clearInterval(interval);
            flushPendingBets(); // Force flush on unmount
        };
    }, []);

    // --- GAME LOOP ---
    useEffect(() => {
        let interval: any;
        interval = setInterval(() => {
            setFwTimer(prev => {
                if (prev <= 0) {
                    if (fwState === 'BETTING') {
                        // FORCE FLUSH BEFORE SPIN
                        flushPendingBets();
                        
                        setFwState('SPINNING');
                        startFruitSpin();
                        return 0; 
                    } else if (fwState === 'RESULT') {
                        setFwState('BETTING');
                        setFwWinner(null);
                        setFwBets({});
                        setFwResultData(null);
                        return 30; // New Betting Round
                    }
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [fwState]); // Depend on state to switch logic

    const startFruitSpin = () => {
        let currentIdx = fwHighlight;
        
        // --- RIGGING LOGIC ---
        const mode = room.gameMode || 'FAIR';
        const luck = room.gameLuck !== undefined ? room.gameLuck : 50;
        let winnerIndex = -1;

        const userBets = fwBetsRef.current;
        const betIndices = Object.keys(userBets).map(Number);
        const allIndices = [0, 1, 2, 3, 4, 5, 6, 7];
        const safeIndices = allIndices.filter(i => !betIndices.includes(i));
        const winningIndices = betIndices;

        if (mode === 'DRAIN') {
            if (betIndices.length > 0 && safeIndices.length > 0 && Math.random() < 0.9) {
                winnerIndex = safeIndices[Math.floor(Math.random() * safeIndices.length)];
            } else {
                winnerIndex = Math.floor(Math.random() * 8);
            }
        } else if (mode === 'HOOK') {
            const currentDailyProfit = currentUser.dailyProfit || 0;
            const threshold = room.hookThreshold || 50000;
            if (currentDailyProfit >= threshold) {
                if (betIndices.length > 0 && safeIndices.length > 0) winnerIndex = safeIndices[Math.floor(Math.random() * safeIndices.length)];
                else winnerIndex = Math.floor(Math.random() * 8);
            } else {
                if (betIndices.length > 0 && Math.random() < 0.8) winnerIndex = winningIndices[Math.floor(Math.random() * winningIndices.length)];
                else winnerIndex = Math.floor(Math.random() * 8);
            }
        } else {
            // FAIR
            const roll = Math.random() * 100;
            if (betIndices.length > 0 && roll > luck && safeIndices.length > 0) {
                winnerIndex = safeIndices[Math.floor(Math.random() * safeIndices.length)];
            } else {
                winnerIndex = Math.floor(Math.random() * 8);
            }
        }
        if (winnerIndex === -1) winnerIndex = Math.floor(Math.random() * 8);

        // Animation
        const rounds = 4;
        const totalSteps = (rounds * 8) + ((winnerIndex - currentIdx + 8) % 8);
        let step = 0;
        
        const runStep = () => {
            if (step >= totalSteps) {
                setFwState('RESULT');
                setFwWinner(winnerIndex);
                setFwTimer(5);

                const betAmount = fwBetsRef.current[winnerIndex] || 0;
                let winAmount = 0;
                
                if (betAmount > 0) {
                    winAmount = betAmount * FRUITS[winnerIndex].multi;
                    if (currentUser.uid) {
                        updateWalletForGame(currentUser.uid, winAmount);
                    }
                    setVisualBalance(prev => {
                        const newVal = prev + winAmount;
                        onUpdateBalance(newVal); // Sync parent
                        return newVal;
                    });
                }
                
                setFwResultData({ winAmount, isWinner: winAmount > 0 });
                setFwHistory(prev => [winnerIndex, ...prev].slice(0, 10));
                return;
            }

            step++;
            currentIdx = (currentIdx + 1) % 8;
            setFwHighlight(currentIdx);

            let delay = 50; 
            if (totalSteps - step < 5) delay = 300; 
            else if (totalSteps - step < 10) delay = 150;
            else if (totalSteps - step < 20) delay = 80;
            
            setTimeout(runStep, delay);
        };

        runStep();
    };

    const handleFruitBet = (fruitId: number) => {
        if (fwState !== 'BETTING') return;
        
        if (visualBalance < fwChip) {
            alert(t('noFunds'));
            return;
        }
        
        const currentBetFruits = Object.keys(fwBets);
        if (!fwBets[fruitId] && currentBetFruits.length >= 6) {
            alert(t('maxBets'));
            return;
        }

        // 1. Instant Visual Update
        setVisualBalance(prev => {
            const newVal = prev - fwChip;
            onUpdateBalance(newVal); // Sync parent UI instantly
            return newVal;
        });

        setFwBets(prev => ({
            ...prev,
            [fruitId]: (prev[fruitId] || 0) + fwChip
        }));

        // 2. Queue Deduction
        pendingBetDeduction.current += fwChip;
    };

    const formatNumber = (num: number) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(0) + 'k';
        return num.toString();
    };

    return (
        <div className="absolute inset-0 z-[100] flex flex-col justify-end bg-black/60 backdrop-blur-sm animate-in slide-in-from-bottom-10" onClick={onClose}>
            <div className="bg-[#2a1d45] border-t border-purple-500/30 rounded-t-3xl p-4 shadow-2xl relative w-full overflow-hidden" onClick={e => e.stopPropagation()}>
                
                {/* Header */}
                <div className="flex flex-col gap-2 mb-2 px-1 w-full">
                    <div className="flex justify-between items-center w-full">
                         <div className="text-white font-black text-lg drop-shadow-lg flex items-center gap-2">
                            <Gamepad2 className="w-5 h-5 text-purple-400"/>
                            {fwState === 'RESULT' ? t('win') : t('fruitWar')}
                        </div>
                        <button onClick={onClose} className="p-1.5 bg-white/10 rounded-full hover:bg-white/20 text-white transition">
                            <X className="w-4 h-4"/>
                        </button>
                    </div>

                    <div className="flex justify-center w-full">
                        <div className="flex items-center gap-2 bg-black/30 rounded-full px-4 py-1.5 border border-white/10 shadow-inner">
                            <div className="w-5 h-5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-[10px] font-bold text-white">💎</div>
                            <span className="text-yellow-400 font-bold font-mono text-sm tracking-wider">
                                {visualBalance.toLocaleString()}
                            </span>
                        </div>
                    </div>
                </div>

                {/* RESULT OVERLAY */}
                {fwState === 'RESULT' && fwResultData && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm animate-in fade-in zoom-in duration-300 rounded-t-3xl">
                        <div className="bg-gradient-to-b from-purple-900 to-black border border-yellow-500/50 p-6 rounded-3xl shadow-2xl text-center max-w-[80%] flex flex-col items-center">
                            <h2 className="text-yellow-400 font-bold text-lg mb-2">{t('winnerIs')}</h2>
                            <div className="text-6xl mb-4 filter drop-shadow-[0_0_20px_rgba(255,255,255,0.5)] animate-bounce">
                                {FRUITS[fwWinner!].icon}
                            </div>
                            <h3 className="text-white font-bold text-xl mb-4">{FRUITS[fwWinner!].name[language]}</h3>
                            <div className="w-full h-px bg-white/20 mb-4"></div>
                            {fwResultData.isWinner ? (
                                <div className="animate-pulse">
                                    <p className="text-green-400 font-bold text-sm mb-1">{t('congrats')}</p>
                                    <p className="text-yellow-300 font-black text-2xl drop-shadow-md">
                                        {fwResultData.winAmount.toLocaleString()} 💎
                                    </p>
                                </div>
                            ) : (
                                <div>
                                    <p className="text-gray-400 font-bold text-sm">{t('noWin')}</p>
                                    <p className="text-gray-500 text-xs mt-1">{t('luck')}</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* 3x3 Grid */}
                <div className="grid grid-cols-3 gap-2 p-2 relative bg-[#1a1128] rounded-2xl border border-purple-500/20 shadow-inner mb-3">
                    {GRID_MAP.map((fruitIdx) => {
                        if (fruitIdx === -1) {
                            return <TimerCell key="timer" timer={fwTimer} state={fwState} />;
                        }
                        return (
                            <FruitItem 
                                key={fruitIdx}
                                fruitIdx={fruitIdx}
                                isActive={fwHighlight === fruitIdx}
                                isWinner={fwWinner === fruitIdx && fwState === 'RESULT'}
                                myBet={fwBets[fruitIdx] || 0}
                                onClick={handleFruitBet}
                                gameState={fwState}
                            />
                        );
                    })}
                </div>

                {/* Controls */}
                <div className="bg-[#1a1128] rounded-xl p-2 mb-2 border border-purple-500/20">
                    <div className="flex justify-between items-center mb-2 px-2">
                        <span className="text-[10px] text-gray-400 uppercase tracking-widest">{t('lastRound')}</span>
                        <div className="flex gap-1">
                            {fwHistory.map((h, i) => (
                                <div key={i} className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-xs border border-white/10 shadow-sm">
                                    {FRUITS[h].icon}
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <div className="flex justify-around items-center gap-2">
                        {CHIPS.map(amount => (
                            <button 
                                key={amount}
                                onClick={() => setFwChip(amount)}
                                disabled={fwState !== 'BETTING'}
                                className={`
                                    relative w-14 h-14 rounded-full flex flex-col items-center justify-center font-black text-[10px] border-4 transition-transform active:scale-90 shadow-lg
                                    ${fwChip === amount ? 'scale-110 -translate-y-1 z-10 ring-2 ring-white ring-offset-2 ring-offset-[#2a1d45]' : 'opacity-80 hover:opacity-100'}
                                    ${amount === 1000 ? 'bg-cyan-600 border-cyan-400 text-white' : ''}
                                    ${amount === 10000 ? 'bg-purple-600 border-purple-400 text-white' : ''}
                                    ${amount === 100000 ? 'bg-orange-600 border-orange-400 text-white' : ''}
                                `}
                            >
                                <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/20 to-transparent"></div>
                                <span>{formatNumber(amount)}</span>
                                <Coins className="w-3 h-3 text-white/80"/>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Info Bar */}
                <div className="flex justify-between items-center px-4 py-3 bg-black/40 rounded-xl border border-white/5 shadow-md">
                    <div className="flex flex-col items-center w-1/2 border-r border-white/10">
                        <span className="text-[10px] text-gray-400 mb-0.5">{t('bet')}</span>
                        <span className="text-yellow-400 font-black text-lg tracking-wider">{formatNumber((Object.values(fwBets) as number[]).reduce((a: number, b: number) => a + b, 0))}</span>
                    </div>
                    <div className="flex flex-col items-center w-1/2">
                        <span className="text-[10px] text-gray-400 mb-0.5">{t('dailyProfit')}</span>
                        <span className="text-green-400 font-black text-lg tracking-wider">{(currentUser.dailyProfit || 0).toLocaleString()}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
