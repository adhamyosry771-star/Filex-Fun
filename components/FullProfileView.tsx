
import React, { useEffect, useState } from 'react';
import { X, Copy, Crown, Shield, Gift as GiftIcon, Loader2, BadgeCheck, Globe, Calendar, Mars, Venus } from 'lucide-react';
import { User, Language, Gift } from '../types';
import { listenToUserProfile, recordProfileVisit } from '../services/firebaseService';
import { GIFTS, VIP_TIERS, ADMIN_ROLES, LEVEL_ICONS, CHARM_ICONS, STORE_ITEMS } from '../constants';
import { auth } from '../firebaseConfig';

interface FullProfileViewProps {
  user: User; // Basic info to start with (at least ID/UID)
  onClose: () => void;
  language: Language;
}

const FullProfileView: React.FC<FullProfileViewProps> = ({ user: initialUser, onClose, language }) => {
  const [user, setUser] = useState<User>(initialUser);
  const [loading, setLoading] = useState(true);

  // Listen to live updates for this user to show real-time gift counts
  useEffect(() => {
      if (initialUser.uid) {
          const unsub = listenToUserProfile(initialUser.uid, (updated) => {
              if (updated) setUser(updated);
              setLoading(false);
          });
          return () => unsub();
      } else {
          setLoading(false);
      }
  }, [initialUser.uid]);

  // Record Visit Logic
  useEffect(() => {
      const currentUserUid = auth.currentUser?.uid;
      if (currentUserUid && initialUser.uid && currentUserUid !== initialUser.uid) {
          const visitor: User = {
              uid: currentUserUid,
              id: 'visitor', // Placeholder, service will update if needed or ignored
              name: auth.currentUser?.displayName || 'Visitor',
              avatar: auth.currentUser?.photoURL || '',
              level: 0,
              vip: false,
              wallet: { diamonds: 0, coins: 0 }
          };
          recordProfileVisit(initialUser.uid, visitor);
      }
  }, [initialUser.uid]);

  const t = (key: string) => {
      const dict: Record<string, { ar: string, en: string }> = {
          badges: { ar: 'الشارات & الألقاب', en: 'Badges & Titles' },
          giftWall: { ar: 'حائط الهدايا', en: 'Gift Wall' },
          noGifts: { ar: 'لم يتم استلام هدايا بعد', en: 'No gifts received yet' },
          id: { ar: 'ID', en: 'ID' },
          copy: { ar: 'نسخ', en: 'Copy' }
      };
      return dict[key][language];
  };

  const getLevel = (amount: number = 0) => {
      let level = 1;
      for (let i = 1; i <= 500; i++) {
          const threshold = Math.pow(i, 3) * 1000; 
          if (amount >= threshold) level = i;
          else break;
      }
      return level;
  };

  const wealthLvl = getLevel(user.diamondsSpent || 0);
  const charmLvl = getLevel(user.diamondsReceived || 0);
  
  const wealthBadge = [...LEVEL_ICONS].reverse().find(i => wealthLvl >= i.min) || LEVEL_ICONS[0];
  const charmBadge = [...CHARM_ICONS].reverse().find(i => charmLvl >= i.min) || CHARM_ICONS[0];
  
  const vipInfo = user.vipLevel ? VIP_TIERS.find(t => t.level === user.vipLevel) : null;
  const adminRole = user.adminRole ? ADMIN_ROLES[user.adminRole] : null;
  const frameClass = STORE_ITEMS.find(i => i.id === user.equippedFrame)?.previewClass || '';

  // Visual Logic matches "Me" tab style
  const isEmperor = user.vipLevel === 8 || user.isAdmin;
  const isOfficial = user.id === 'OFFECAL' || user.isAdmin;
  const isCustomId = isNaN(Number(user.id));

  // Prepare Gift Data
  const receivedGiftsData = Object.entries(user.receivedGifts || {})
    .map(([giftId, count]) => {
      const giftDef = GIFTS.find(g => g.id === giftId);
      // Explicitly cast count to number to resolve 'unknown' type errors
      return giftDef ? { ...giftDef, count: Number(count) } : null;
    })
    .filter((g): g is (Gift & { count: number }) => g !== null)
    .sort((a, b) => b.count - a.count);

  return (
    <div dir={language === 'ar' ? 'rtl' : 'ltr'} className="absolute inset-0 z-[100] bg-black/95 backdrop-blur-3xl animate-in slide-in-from-bottom-10 overflow-hidden flex flex-col font-sans">
        
        {/* Header / Close */}
        <div className="absolute top-0 left-0 right-0 z-50 p-4 flex justify-between items-center pointer-events-none">
            <div className="w-10"></div>
            <button onClick={onClose} className="p-2 bg-black/40 rounded-full hover:bg-black/60 transition backdrop-blur-md border border-white/10 pointer-events-auto">
                <X className="w-6 h-6 text-white" />
            </button>
        </div>

        {/* Content Scrollable Area */}
        <div className="flex-1 overflow-y-auto">
            
            {/* Top Profile Section */}
            <div className="relative pt-16 pb-6 px-4 flex flex-col items-center">
                {/* Background Glow Effect */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-80 bg-gradient-to-b from-brand-900/40 via-brand-900/10 to-transparent pointer-events-none"></div>
                
                {/* Avatar */}
                <div className="relative mb-4 z-10 animate-in zoom-in duration-300">
                    <div className={`w-32 h-32 rounded-full p-[3px] relative ${frameClass}`}>
                        <img src={user.avatar} className="w-full h-full rounded-full object-cover border-4 border-gray-900 shadow-2xl" />
                    </div>
                    {user.vipLevel && user.vipLevel > 0 && (
                        <div className="absolute -bottom-1 -right-1 bg-gradient-to-br from-yellow-400 to-orange-600 p-1.5 rounded-full border-4 border-black shadow-lg">
                            <Crown className="w-4 h-4 text-white fill-white" />
                        </div>
                    )}
                </div>

                {/* Name & Official Badge */}
                <div className="flex items-center gap-2 mb-2 z-10">
                    <h1 className={`text-2xl font-black tracking-wide drop-shadow-md ${isEmperor ? 'text-red-500 animate-pulse drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]' : 'text-white'}`}>
                        {user.name}
                    </h1>
                    {isOfficial && <BadgeCheck className="w-6 h-6 text-blue-500 fill-white" />}
                </div>

                {/* ID Pill */}
                <div className="z-10 mb-4">
                    <span className={`px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 shadow-lg ${isCustomId ? 'bg-gradient-to-r from-yellow-600 to-yellow-400 text-black border border-yellow-200' : 'bg-white/10 text-gray-300 border border-white/10 backdrop-blur-md'}`}>
                        <span className="opacity-70">{t('id')}:</span> 
                        <span className="tracking-wider">{user.id}</span>
                        <Copy className={`w-3 h-3 cursor-pointer ${isCustomId ? 'text-black/70' : 'text-gray-400'}`} onClick={() => alert('Copied!')}/>
                    </span>
                </div>

                {/* Bio */}
                {user.bio && (
                    <div className="z-10 mb-6 max-w-sm">
                        <p className="text-gray-300 text-sm text-center italic bg-white/5 px-4 py-2 rounded-xl border border-white/10">"{user.bio}"</p>
                    </div>
                )}

                {/* Levels Row (Wealth & Charm) */}
                <div className="flex items-center gap-3 mb-6 z-10">
                    {/* Wealth Badge */}
                    <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-white shadow-md border border-white/10 ${wealthBadge.color}`}>
                        <span>{wealthBadge.icon}</span>
                        <span>Lv.{wealthLvl}</span>
                    </div>

                    {/* Charm Badge */}
                    <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-white shadow-md border border-white/10 ${charmBadge.color}`}>
                        <span>{charmBadge.icon}</span>
                        <span>Lv.{charmLvl}</span>
                    </div>
                </div>

                {/* Age and Country Badges (New Section) */}
                {(user.country || user.age) && (
                     <div className="flex items-center justify-center gap-3 mb-6 z-10 animate-in fade-in slide-in-from-bottom-2">
                         {user.country && (
                             <div className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2 text-xs font-bold text-white/90 shadow-sm border border-white/10">
                                 {/\p{Emoji}/u.test(user.country) ? '' : <Globe className="w-3.5 h-3.5 text-blue-400" />}
                                 <span>{user.country}</span>
                             </div>
                         )}
                         
                         {user.age && (
                             <div className={`bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2 text-xs font-bold text-white/90 shadow-sm border border-white/10 ${user.gender === 'female' ? 'border-pink-500/30' : 'border-blue-500/30'}`}>
                                 {user.gender === 'female' ? <Venus className="w-3.5 h-3.5 text-pink-400" /> : user.gender === 'male' ? <Mars className="w-3.5 h-3.5 text-blue-400" /> : <Calendar className="w-3.5 h-3.5 text-gray-400" />}
                                 <span>{user.age}</span>
                             </div>
                         )}
                     </div>
                )}

                {/* Badges Drawer (Admin / VIP Only) */}
                {(adminRole || vipInfo) && (
                    <div className="w-full max-w-sm mb-6 z-10">
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-3 flex justify-center gap-3 backdrop-blur-md shadow-inner">
                            {adminRole && (
                                <div className={`px-3 py-1.5 rounded-xl border ${adminRole.class} flex items-center gap-1.5 shadow-lg`}>
                                    <Shield className="w-4 h-4" />
                                    <span className="font-bold text-xs">{adminRole.name[language]}</span>
                                </div>
                            )}
                            {vipInfo && (
                                <div className={`px-3 py-1.5 rounded-xl ${vipInfo.color} text-white flex items-center gap-1.5 shadow-lg border border-white/20`}>
                                    <span className="text-sm">{vipInfo.badge}</span>
                                    <span className="font-bold text-xs uppercase tracking-wide">VIP {vipInfo.level}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Gift Wall Section */}
            <div className="px-4 pb-10">
                <div className="bg-gray-900/60 border border-white/5 rounded-[2rem] p-5 backdrop-blur-md shadow-xl min-h-[300px]">
                    <h3 className="text-white/80 text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-white/5 pb-2">
                        <GiftIcon className="w-4 h-4 text-brand-400" /> {t('giftWall')}
                        <span className="text-[10px] text-gray-500 bg-black/30 px-2 py-0.5 rounded-full ml-auto">
                            Total: {receivedGiftsData.reduce((acc, curr) => acc + curr.count, 0)}
                        </span>
                    </h3>
                    
                    {loading ? (
                        <div className="flex justify-center items-center h-40 text-gray-500 gap-2"><Loader2 className="w-5 h-5 animate-spin"/> Loading...</div>
                    ) : receivedGiftsData.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 text-gray-600">
                            <GiftIcon className="w-12 h-12 mb-3 opacity-20" />
                            <span className="text-xs">{t('noGifts')}</span>
                        </div>
                    ) : (
                        <div className="grid grid-cols-4 gap-3 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                            {receivedGiftsData.map((gift) => (
                                <div key={gift.id} className="aspect-[4/5] bg-black/40 rounded-xl border border-white/5 flex flex-col items-center justify-center p-2 relative group hover:border-brand-500/30 transition">
                                    <div className="text-3xl drop-shadow-md mb-2 transform group-hover:scale-110 transition duration-300">
                                        {gift.icon}
                                    </div>
                                    <div className="w-full text-center">
                                        <div className="text-[10px] font-black text-brand-200 bg-brand-900/50 rounded-full px-1.5 py-0.5 inline-block border border-brand-500/20">
                                            x{gift.count > 999 ? (gift.count / 1000).toFixed(1) + 'k' : gift.count}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};

export default FullProfileView;
