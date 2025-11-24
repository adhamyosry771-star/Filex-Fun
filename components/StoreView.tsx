import React, { useState } from 'react';
import { ArrowLeft, Check, Lock, ShoppingBag } from 'lucide-react';
import { Language, User, StoreItem } from '../types';
import { STORE_ITEMS } from '../constants';

interface StoreViewProps {
  user: User;
  language: Language;
  onBack: () => void;
  onUpdateUser: (updatedUser: User) => void;
}

const StoreView: React.FC<StoreViewProps> = ({ user, language, onBack, onUpdateUser }) => {
  const [activeTab, setActiveTab] = useState<'frame' | 'bubble'>('frame');

  const t = (key: string) => {
    const dict: Record<string, { ar: string, en: string }> = {
      store: { ar: 'المتجر', en: 'Store' },
      frames: { ar: 'إطارات', en: 'Frames' },
      bubbles: { ar: 'فقاعات', en: 'Bubbles' },
      buy: { ar: 'شراء', en: 'Buy' },
      equip: { ar: 'تجهيز', en: 'Equip' },
      equipped: { ar: 'مستخدم', en: 'Equipped' },
      balance: { ar: 'رصيدك:', en: 'Balance:' },
      noFunds: { ar: 'رصيد غير كاف', en: 'Insufficient Funds' }
    };
    return dict[key][language];
  };

  const filteredItems = STORE_ITEMS.filter(item => item.type === activeTab);

  const handleAction = (item: StoreItem) => {
    const isOwned = user.ownedItems?.includes(item.id);

    if (isOwned) {
      // Equip Logic
      const updatedUser = { ...user };
      if (item.type === 'frame') updatedUser.equippedFrame = item.id;
      if (item.type === 'bubble') updatedUser.equippedBubble = item.id;
      onUpdateUser(updatedUser);
    } else {
      // Buy Logic
      const cost = item.price;
      const currency = item.currency;
      const currentBalance = currency === 'diamonds' ? (user.wallet?.diamonds || 0) : (user.wallet?.coins || 0);

      if (currentBalance >= cost) {
        const updatedUser = { ...user };
        updatedUser.wallet = {
          ...updatedUser.wallet!,
          [currency]: currentBalance - cost
        };
        updatedUser.ownedItems = [...(updatedUser.ownedItems || []), item.id];
        
        // Auto equip after buy
        if (item.type === 'frame') updatedUser.equippedFrame = item.id;
        if (item.type === 'bubble') updatedUser.equippedBubble = item.id;

        onUpdateUser(updatedUser);
        alert(language === 'ar' ? 'تم الشراء بنجاح!' : 'Purchase successful!');
      } else {
        alert(t('noFunds'));
      }
    }
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
      <div className="flex p-4 gap-2">
        <button 
          onClick={() => setActiveTab('frame')}
          className={`flex-1 py-2 rounded-xl font-bold transition ${activeTab === 'frame' ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/30' : 'bg-gray-800 text-gray-400'}`}
        >
          {t('frames')}
        </button>
        <button 
          onClick={() => setActiveTab('bubble')}
          className={`flex-1 py-2 rounded-xl font-bold transition ${activeTab === 'bubble' ? 'bg-accent-600 text-white shadow-lg shadow-accent-600/30' : 'bg-gray-800 text-gray-400'}`}
        >
          {t('bubbles')}
        </button>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-2 gap-4">
          {filteredItems.map(item => {
            const isOwned = user.ownedItems?.includes(item.id);
            const isEquipped = item.type === 'frame' ? user.equippedFrame === item.id : user.equippedBubble === item.id;

            return (
              <div key={item.id} className="bg-gray-800 rounded-2xl p-4 flex flex-col items-center relative border border-gray-700 hover:border-brand-500 transition">
                {isEquipped && (
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
                          Text...
                       </div>
                   )}
                </div>

                <h3 className="font-bold text-sm mb-1">{item.name[language]}</h3>
                
                {!isOwned && (
                    <div className="text-xs font-mono mb-3 flex items-center gap-1">
                        {item.currency === 'diamonds' ? '💎' : '🪙'}
                        <span className={item.currency === 'diamonds' ? 'text-cyan-300' : 'text-yellow-300'}>
                            {item.price}
                        </span>
                    </div>
                )}

                <button 
                  onClick={() => handleAction(item)}
                  className={`w-full py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition ${
                      isEquipped 
                      ? 'bg-gray-700 text-gray-400 cursor-default'
                      : isOwned 
                        ? 'bg-green-600 text-white hover:bg-green-500' 
                        : 'bg-gradient-to-r from-brand-600 to-accent-600 text-white hover:shadow-lg'
                  }`}
                >
                  {isEquipped ? <Check className="w-3 h-3" /> : (isOwned ? t('equip') : t('buy'))}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default StoreView;