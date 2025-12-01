
import React, { useState } from 'react';
import { ArrowLeft, CreditCard, Wallet as WalletIcon, Loader2 } from 'lucide-react';
import { Language, User } from '../types';
import { VIP_TIERS } from '../constants';
import { exchangeCoinsToDiamonds } from '../services/firebaseService';

interface WalletViewProps {
  user: User;
  language: Language;
  onBack: () => void;
}

const WalletView: React.FC<WalletViewProps> = ({ user, language, onBack }) => {
  const [loading, setLoading] = useState(false);
  const vipTier = VIP_TIERS.find(t => t.level === (user.vipLevel || 0));

  const t = (key: string) => {
    const dict: Record<string, { ar: string, en: string }> = {
      wallet: { ar: 'المحفظة', en: 'My Wallet' },
      totalBalance: { ar: 'إجمالي الرصيد', en: 'Total Balance' },
      diamonds: { ar: 'الماس', en: 'Diamonds' },
      coins: { ar: 'كوينز', en: 'Coins' },
      recharge: { ar: 'شحن', en: 'Recharge' },
      exchange: { ar: 'تحويل', en: 'Exchange' },
      history: { ar: 'السجل', en: 'History' },
      vipPerk: { ar: `ميزة VIP: خصم ${vipTier?.discount}% على الشحن`, en: `VIP Perk: ${vipTier?.discount}% Off Recharge` },
      success: { ar: 'تم التحويل بنجاح!', en: 'Conversion Successful!' },
      noCoins: { ar: 'لا يوجد كوينز للتحويل', en: 'No coins to exchange' },
      enterAmount: { ar: 'أدخل كمية التحويل (كوينز)', en: 'Enter amount to exchange (Coins)' },
      invalidAmount: { ar: 'كمية غير صالحة', en: 'Invalid amount' }
    };
    return dict[key][language];
  };

  const handleExchange = async () => {
      const currentCoins = user.wallet?.coins || 0;
      if (currentCoins <= 0) {
          alert(t('noCoins'));
          return;
      }

      const input = prompt(t('enterAmount'));
      if (!input) return;

      const amount = parseInt(input);
      if (isNaN(amount) || amount <= 0 || amount > currentCoins) {
          alert(t('invalidAmount'));
          return;
      }

      setLoading(true);
      try {
          if (user.uid) {
              await exchangeCoinsToDiamonds(user.uid, amount);
              alert(t('success'));
          }
      } catch (e) {
          console.error(e);
          alert("Error converting");
      }
      setLoading(false);
  };

  return (
    <div className="h-full bg-gray-900 text-white flex flex-col">
       {/* Header */}
       <div className="p-4 bg-gray-800 shadow-md flex items-center justify-between">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-white/10">
          <ArrowLeft className="w-6 h-6 rtl:rotate-180" />
        </button>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <WalletIcon className="w-5 h-5 text-brand-400" />
          {t('wallet')}
        </h1>
        <div className="w-10"></div>
      </div>

      <div className="p-6 space-y-6 overflow-y-auto">
        
        {/* Diamonds Card */}
        <div className="bg-gradient-to-br from-indigo-900 to-blue-900 rounded-3xl p-6 relative overflow-hidden shadow-xl border border-blue-500/30">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <span className="text-9xl">💎</span>
            </div>
            <div className="relative z-10">
                <h3 className="text-blue-200 font-medium mb-1 flex items-center gap-2">
                    {t('diamonds')} <span className="bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded-full">Premium</span>
                </h3>
                <p className="text-4xl font-bold text-white tracking-wider">{user.wallet?.diamonds || 0}</p>
                <button className="mt-6 w-full bg-white text-blue-900 font-bold py-3 rounded-xl shadow-lg hover:bg-blue-50 transition">
                    {t('recharge')}
                </button>
            </div>
        </div>

        {/* Coins Card */}
        <div className="bg-gradient-to-br from-yellow-900 to-orange-900 rounded-3xl p-6 relative overflow-hidden shadow-xl border border-yellow-500/30">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <span className="text-9xl">🪙</span>
            </div>
            <div className="relative z-10">
                <h3 className="text-yellow-200 font-medium mb-1 flex items-center gap-2">
                    {t('coins')} <span className="bg-yellow-600 text-white text-[10px] px-2 py-0.5 rounded-full">Earned</span>
                </h3>
                <p className="text-4xl font-bold text-white tracking-wider">{user.wallet?.coins || 0}</p>
                <button 
                    onClick={handleExchange}
                    disabled={loading || (user.wallet?.coins || 0) <= 0}
                    className="mt-6 w-full bg-white/10 backdrop-blur border border-white/20 text-white font-bold py-3 rounded-xl shadow-lg hover:bg-white/20 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : t('exchange')}
                </button>
            </div>
        </div>

        {/* VIP Info */}
        {user.vip && (
            <div className={`bg-gradient-to-r from-brand-600 to-accent-600 p-4 rounded-xl flex items-center justify-between text-sm shadow-lg border border-white/10`}>
                <span className="font-bold">{t('vipPerk')}</span>
                <span className="bg-white/20 px-2 py-1 rounded font-bold flex items-center gap-1">
                    {vipTier?.badge} VIP {user.vipLevel}
                </span>
            </div>
        )}

      </div>
    </div>
  );
};

export default WalletView;
