
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Check, Lock, ShoppingBag, Clock, Package } from 'lucide-react';
import { Language, User, StoreItem } from '../types';
import { STORE_ITEMS } from '../constants';
import { purchaseStoreItem, updateUserProfile } from '../services/firebaseService';

interface StoreViewProps {
  user: User;
  language: Language;
  onBack: () => void;
  onUpdateUser: (updatedUser: User) => void;
}

const StoreView: React.FC<StoreViewProps> = ({ user, language, onBack, onUpdateUser }) => {
  const [activeTab, setActiveTab] = useState<'frame' | 'bubble' | 'inventory'>('frame');
  const [loading, setLoading] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
      const timer = setInterval(() => setCurrentTime(Date.now()), 60000); // Update every minute
      return () => clearInterval(timer);
  }, []);

  const t = (key: string) => {
    const dict: Record<string, { ar: string, en: string }> = {
      store: { ar: 'المتجر', en: 'Store' },
      frames: { ar: 'إطارات', en: 'Frames' },
      bubbles: { ar: 'فقاعات', en: 'Bubbles' },
      myItems: { ar: 'مقتنياتي', en: 'My Items' },
      buy: { ar: 'شراء (7 أيام)', en: 'Buy (7 Days)' },
      equip: { ar: 'تجهيز', en: 'Equip' },
      equipped: { ar: 'مستخدم', en: 'Equipped' },
      balance: { ar: 'رصيدك:', en: 'Balance:' },
      noFunds: { ar: 'رصيد غير كاف', en: 'Insufficient Funds' },
      expired: { ar: 'منتهي', en: 'Expired' },
      expiresIn: { ar: 'ينتهي في', en: 'Expires in' },
      days: { ar: 'يوم', en: 'd' },
      hours: { ar: 'ساعة', en: 'h' },
      extend: { ar: 'تمديد', en: 'Extend' },
      noItems: { ar: 'لا تملك أي عناصر بعد', en: 'No items owned yet' }
    };
    return dict[key][language];
  };

  const getTimeRemaining = (expiry: number) => {
      const diff = expiry - currentTime;
      if (diff <= 0) return t('expired');
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      if (days > 0) return `${days}${t('days')} ${hours}${t('hours')}`;
      return `${hours}${t('hours')}`; // Less than a day
  };

  const handlePurchase = async (item: StoreItem) => {
      if (!user.uid) return;
      setLoading(item.id);
      try {
          await purchaseStoreItem(user.uid, item, user);
          alert(language === 'ar' ? 'تم الشراء بنجاح!' : 'Purchase successful!');
          // Ideally user updates via real-time listener in App.tsx
      } catch (e: any) {
          alert(t('noFunds'));
      }
      setLoading(null);
  };

  const handleEquip = async (itemId: string, type: 'frame' | 'bubble') => {
      if (!user.uid) return;
      setLoading(itemId);
      try {
          const updates: Partial<User> = {};
          if (type === 'frame') updates.equippedFrame = itemId;
          if (type === 'bubble') updates.equippedBubble = itemId;
          
          await updateUserProfile(user.uid, updates);
          
          // Optimistic update
          onUpdateUser({ ...user, ...updates });
      } catch (e) {
          alert("Failed to equip");
      }
      setLoading(null);
  };

  const renderStoreGrid = (type: 'frame' | 'bubble') => {
      const items = STORE_ITEMS.filter(item => item.type === type);
      return (
        <div className="grid grid-cols-2 gap-4">
          {items.map(item => {
            const expiry = user.inventory?.[item.id] || 0;
            const isOwned = expiry > currentTime;
            const isEquipped = type === 'frame' ? user.equippedFrame === item.id : user.equippedBubble === item.id;

            return (
              <div key={item.id} className="bg-gray-800 rounded-2xl p-4 flex flex-col items-center relative border border-gray-700 hover:border-brand-500 transition">
                {isEquipped && isOwned && (
                  <div className="absolute top-2 right-2 bg-green-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow">
                    {t('equipped')}
                  </div>
                )}
                
                {/* Preview Area */}
                <div className="w-20 h-20 mb-3 flex items-center justify-center relative">
                   {item.type === 'frame' ? (
                       <div className={`w-16 h-16 rounded-full overflow-hidden relative p-1 ${item.previewClass}`}>
                          <img src={user.avatar} className="w-full h-full rounded-full object-cover" alt="preview" />
                       </div>
                   ) : (
                       <div className={`px-3 py-2 text-xs text-white rounded-lg ${item.previewClass}`}>
                          Hi!
                       </div>
                   )}
                </div>

                <h3 className="font-bold text-sm mb-1">{item.name[language]}</h3>
                
                <div className="text-xs font-mono mb-3 flex items-center gap-1">
                    {item.currency === 'diamonds' ? '💎' : '🪙'}
                    <span className={item.currency === 'diamonds' ? 'text-cyan-300' : 'text-yellow-300'}>
                        {item.price}
                    </span>
                </div>

                {isOwned ? (
                    <div className="w-full flex flex-col gap-2">
                        <div className="text-[10px] text-gray-400 text-center flex items-center justify-center gap-1">
                            <Clock className="w-3 h-3"/> {getTimeRemaining(expiry)}
                        </div>
                        {isEquipped ? (
                             <button disabled className="w-full py-2 rounded-lg text-xs font-bold bg-gray-700 text-gray-400 cursor-default flex items-center justify-center gap-1"><Check className="w-3 h-3"/> {t('equipped')}</button>
                        ) : (
                             <button onClick={() => handleEquip(item.id, item.type)} disabled={loading === item.id} className="w-full py-2 rounded-lg text-xs font-bold bg-green-600 text-white hover:bg-green-500 flex items-center justify-center gap-1">{loading === item.id ? '...' : t('equip')}</button>
                        )}
                        <button onClick={() => handlePurchase(item)} disabled={loading === item.id} className="w-full py-1.5 rounded-lg text-[10px] font-bold bg-blue-600/20 text-blue-300 border border-blue-600/50 hover:bg-blue-600/30">{loading === item.id ? '...' : t('extend')}</button>
                    </div>
                ) : (
                    <button 
                      onClick={() => handlePurchase(item)}
                      disabled={loading === item.id}
                      className="w-full py-2 rounded-lg text-xs font-bold bg-gradient-to-r from-brand-600 to-accent-600 text-white hover:shadow-lg transition flex items-center justify-center"
                    >
                      {loading === item.id ? '...' : t('buy')}
                    </button>
                )}
              </div>
            );
          })}
        </div>
      );
  };

  const renderInventory = () => {
      const inventoryIds = Object.keys(user.inventory || {});
      const myItems = STORE_ITEMS.filter(item => inventoryIds.includes(item.id));
      const validItems = myItems.filter(item => (user.inventory?.[item.id] || 0) > currentTime);

      if (validItems.length === 0) {
          return <div className="text-center text-gray-500 mt-20 flex flex-col items-center"><Package className="w-12 h-12 mb-2 opacity-50"/>{t('noItems')}</div>;
      }

      return (
          <div className="grid grid-cols-2 gap-4">
              {validItems.map(item => {
                  const expiry = user.inventory?.[item.id] || 0;
                  const isEquipped = item.type === 'frame' ? user.equippedFrame === item.id : user.equippedBubble === item.id;
                  
                  return (
                      <div key={item.id} className="bg-gray-800 rounded-2xl p-4 flex flex-col items-center relative border border-gray-700">
                          {isEquipped && <div className="absolute top-2 right-2 bg-green-500 w-2 h-2 rounded-full shadow-lg animate-pulse"></div>}
                          
                          <div className="w-16 h-16 mb-2 flex items-center justify-center relative">
                              {item.type === 'frame' ? (
                                  <div className={`w-14 h-14 rounded-full overflow-hidden p-1 ${item.previewClass}`}>
                                      <img src={user.avatar} className="w-full h-full rounded-full object-cover"/>
                                  </div>
                              ) : (
                                  <div className={`px-2 py-1 text-[10px] text-white rounded ${item.previewClass}`}>Hi</div>
                              )}
                          </div>
                          
                          <h4 className="font-bold text-xs text-white mb-1">{item.name[language]}</h4>
                          <div className="text-[10px] text-orange-300 font-mono bg-orange-900/20 px-2 py-0.5 rounded mb-2 flex items-center gap-1">
                              <Clock className="w-3 h-3"/> {getTimeRemaining(expiry)}
                          </div>

                          {isEquipped ? (
                              <button disabled className="w-full py-1.5 rounded-lg text-xs font-bold bg-gray-700 text-gray-400">{t('equipped')}</button>
                          ) : (
                              <button onClick={() => handleEquip(item.id, item.type)} disabled={loading === item.id} className="w-full py-1.5 rounded-lg text-xs font-bold bg-green-600 text-white">{loading === item.id ? '...' : t('equip')}</button>
                          )}
                      </div>
                  );
              })}
          </div>
      );
  };

  return (
    <div className="h-full bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <div className="p-4 bg-gray-800 shadow-md flex items-center justify-between">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-white/10">
          <ArrowLeft className="w-6 h-6 rtl:rotate-180" />
        </button>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-brand-400" />
          {t('store')}
        </h1>
        <div className="w-10"></div>
      </div>

      {/* Balance Bar */}
      <div className="bg-gray-800/50 p-3 flex justify-around text-sm font-bold border-b border-gray-700">
        <div className="flex items-center gap-1 text-cyan-400">
           <span>💎</span>
           <span>{user.wallet?.diamonds || 0}</span>
        </div>
        <div className="flex items-center gap-1 text-yellow-400">
           <span>🪙</span>
           <span>{user.wallet?.coins || 0}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex p-4 gap-2 bg-gray-900 sticky top-0 z-10">
        <button 
          onClick={() => setActiveTab('frame')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${activeTab === 'frame' ? 'bg-brand-600 text-white shadow-lg' : 'bg-gray-800 text-gray-400'}`}
        >
          {t('frames')}
        </button>
        <button 
          onClick={() => setActiveTab('bubble')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${activeTab === 'bubble' ? 'bg-accent-600 text-white shadow-lg' : 'bg-gray-800 text-gray-400'}`}
        >
          {t('bubbles')}
        </button>
        <button 
          onClick={() => setActiveTab('inventory')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${activeTab === 'inventory' ? 'bg-orange-600 text-white shadow-lg' : 'bg-gray-800 text-gray-400'}`}
        >
          {t('myItems')}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 pb-20">
          {activeTab === 'inventory' ? renderInventory() : renderStoreGrid(activeTab)}
      </div>
    </div>
  );
};

export default StoreView;
