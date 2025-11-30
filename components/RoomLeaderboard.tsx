
import React from 'react';
import { X, Trophy, Star } from 'lucide-react';
import { Contributor, Language } from '../types';

interface RoomLeaderboardProps {
  contributors: Contributor[];
  onClose: () => void;
  language: Language;
}

const RoomLeaderboard: React.FC<RoomLeaderboardProps> = ({ contributors, onClose, language }) => {
  // Sort contributors by amount (highest first)
  const sortedContributors = [...contributors].sort((a, b) => b.amount - a.amount);
  const top3 = sortedContributors.slice(0, 3);
  const rest = sortedContributors.slice(3);

  const t = (key: string) => {
      const dict: Record<string, {ar: string, en: string}> = {
          title: { ar: 'كأس الروم', en: 'Room Cup' },
          top: { ar: 'أفضل الداعمين', en: 'Top Contributors' },
          noData: { ar: 'لا يوجد داعمين بعد', en: 'No contributors yet' },
          join: { ar: 'كن أول الداعمين! 🎁', en: 'Be the first to support! 🎁' },
          all: { ar: 'قائمة الداعمين', en: 'All Supporters' }
      };
      return dict[key][language] || dict[key]['en'];
  };

  return (
    <div dir={language === 'ar' ? 'rtl' : 'ltr'} className="absolute inset-0 z-[60] flex flex-col bg-gray-900/95 backdrop-blur-xl animate-in slide-in-from-bottom-10">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex justify-between items-center bg-gradient-to-r from-gold-600/20 to-transparent">
        <h2 className="text-xl font-black text-gold-400 flex items-center gap-2 uppercase tracking-widest">
          <Trophy className="w-6 h-6" />
          {t('title')}
        </h2>
        <button onClick={onClose} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition">
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Podium Section (Top 3) */}
      <div className="flex justify-center items-end gap-4 pt-10 pb-8 px-4 relative min-h-[220px]">
        {/* Rank 2 */}
        {top3[1] && (
          <div className="flex flex-col items-center animate-in slide-in-from-left duration-700">
            <div className="relative mb-2">
               <img src={top3[1].avatar} className="w-16 h-16 rounded-full border-2 border-gray-300 object-cover" />
               <div className="absolute -bottom-2 -right-2 bg-gray-300 text-gray-900 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs border-2 border-gray-900">2</div>
            </div>
            <span className="text-xs font-bold text-gray-300 truncate max-w-[80px]">{top3[1].name}</span>
            <span className="text-[10px] text-gold-400 font-mono">💎 {top3[1].amount.toLocaleString()}</span>
            <div className="w-16 h-24 bg-gradient-to-t from-gray-600/50 to-gray-400/20 rounded-t-lg mt-2 border-t-4 border-gray-400"></div>
          </div>
        )}

        {/* Rank 1 */}
        {top3[0] ? (
          <div className="flex flex-col items-center z-10 -mb-2 animate-in zoom-in duration-500">
            <div className="relative mb-2">
               <img src={top3[0].avatar} className="w-24 h-24 rounded-full border-4 border-gold-400 object-cover shadow-[0_0_20px_rgba(250,204,21,0.5)]" />
               <div className="absolute -bottom-3 -right-1 bg-gold-500 text-black w-8 h-8 rounded-full flex items-center justify-center font-black text-sm border-2 border-gray-900 shadow-lg">1</div>
            </div>
            <span className="text-sm font-black text-gold-300 truncate max-w-[100px]">{top3[0].name}</span>
            <span className="text-xs text-white font-bold bg-gold-600/20 px-2 py-0.5 rounded-full border border-gold-500/30">💎 {top3[0].amount.toLocaleString()}</span>
            <div className="w-24 h-32 bg-gradient-to-t from-gold-600/50 to-gold-400/20 rounded-t-lg mt-2 border-t-4 border-gold-500 shadow-[0_0_30px_rgba(234,179,8,0.2)] flex items-center justify-center">
                <Trophy className="w-12 h-12 text-gold-200 opacity-50" />
            </div>
          </div>
        ) : (
            <div className="text-gray-500 text-sm absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">{t('noData')}</div>
        )}

        {/* Rank 3 */}
        {top3[2] && (
          <div className="flex flex-col items-center animate-in slide-in-from-right duration-700">
            <div className="relative mb-2">
               <img src={top3[2].avatar} className="w-16 h-16 rounded-full border-2 border-orange-700 object-cover" />
               <div className="absolute -bottom-2 -right-2 bg-orange-700 text-white w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs border-2 border-gray-900">3</div>
            </div>
            <span className="text-xs font-bold text-orange-300 truncate max-w-[80px]">{top3[2].name}</span>
            <span className="text-[10px] text-gold-400 font-mono">💎 {top3[2].amount.toLocaleString()}</span>
            <div className="w-16 h-20 bg-gradient-to-t from-orange-800/50 to-orange-600/20 rounded-t-lg mt-2 border-t-4 border-orange-700"></div>
          </div>
        )}
      </div>

      {/* List Section (Rest) */}
      <div className="flex-1 bg-gray-950 rounded-t-[2rem] p-6 overflow-y-auto space-y-4 border-t border-white/5">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{t('all')}</h3>
          {rest.length > 0 ? rest.map((user, idx) => (
              <div key={user.userId} className="flex items-center justify-between bg-white/5 p-3 rounded-xl hover:bg-white/10 transition border border-transparent hover:border-white/10">
                  <div className="flex items-center gap-4">
                      <span className="text-gray-500 font-mono w-6 text-center font-bold">{idx + 4}</span>
                      <img src={user.avatar} className="w-10 h-10 rounded-full object-cover" />
                      <div>
                          <h4 className="font-bold text-white text-sm">{user.name}</h4>
                          <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-yellow-600" />
                              <span className="text-[10px] text-gray-400">Lv.{Math.floor(user.amount / 1000) + 1}</span>
                          </div>
                      </div>
                  </div>
                  <div className="text-gold-400 font-bold font-mono text-sm">
                      {user.amount.toLocaleString()} 💎
                  </div>
              </div>
          )) : (
              <div className="text-center text-gray-600 mt-10 text-sm">
                  {t('join')}
              </div>
          )}
      </div>
    </div>
  );
};

export default RoomLeaderboard;
