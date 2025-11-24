
import React, { useState } from 'react';
import { ArrowLeft, Crown, Check, Star, Shield, Zap } from 'lucide-react';
import { Language, User } from '../types';
import { VIP_TIERS } from '../constants';

interface VipViewProps {
  user: User;
  language: Language;
  onBack: () => void;
  onUpdateUser: (updatedUser: User) => void;
}

const VipView: React.FC<VipViewProps> = ({ user, language, onBack, onUpdateUser }) => {
  const t = (key: string) => {
    const dict: Record<string, { ar: string, en: string }> = {
      title: { ar: 'نادي النخبة VIP', en: 'VIP Elite Club' },
      subtitle: { ar: 'تميز عن الآخرين بامتيازات حصرية', en: 'Stand out with exclusive privileges' },
      current: { ar: 'الحالي', en: 'Current' },
      buy: { ar: 'شراء العضوية', en: 'Purchase Membership' },
      price: { ar: 'السعر', en: 'Price' },
      diamonds: { ar: 'ماسة', en: 'Diamonds' },
      features: { ar: 'مميزات الحزمة', en: 'Package Features' },
      insufficient: { ar: 'رصيد غير كاف', en: 'Insufficient Balance' },
      congrats: { ar: 'تمت الترقية بنجاح!', en: 'Upgrade Successful!' },
      locked: { ar: 'مقفل', en: 'Locked' }
    };
    return dict[key][language];
  };

  const handleBuyVip = (level: number) => {
    const tier = VIP_TIERS.find(t => t.level === level);
    if (!tier) return;

    if (user.vipLevel && user.vipLevel >= level) {
        return; // Already owns higher or equal
    }

    if ((user.wallet?.diamonds || 0) >= tier.price) {
        // Success
        const updatedUser = { 
            ...user, 
            vip: true,
            vipLevel: level,
            wallet: {
                ...user.wallet!,
                diamonds: (user.wallet?.diamonds || 0) - tier.price
            }
        };
        onUpdateUser(updatedUser);
        alert(t('congrats'));
    } else {
        alert(t('insufficient'));
    }
  };

  return (
    <div className="h-full bg-brand-950 text-white flex flex-col relative overflow-hidden font-sans">
      {/* Vibrant Background Elements */}
      <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-accent-500/20 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-brand-500/20 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Header */}
      <div className="p-5 z-10 flex items-center justify-between">
        <button onClick={onBack} className="p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 backdrop-blur transition">
          <ArrowLeft className="w-6 h-6 rtl:rotate-180 text-white" />
        </button>
        <div className="text-center">
            <h1 className="text-xl font-bold tracking-wide flex items-center justify-center gap-2">
                <Crown className="w-5 h-5 fill-yellow-400 text-yellow-500" />
                {t('title')}
            </h1>
        </div>
        <div className="w-10"></div> {/* Spacer */}
      </div>

      {/* Main Scroll Area */}
      <div className="flex-1 overflow-y-auto pb-10 z-10 px-4">
        <div className="text-center mb-8">
            <p className="text-brand-200 text-sm font-light">{t('subtitle')}</p>
        </div>

        <div className="space-y-6 max-w-lg mx-auto">
            {VIP_TIERS.filter(t => t.level > 0).map((tier) => {
                const isOwned = (user.vipLevel || 0) >= tier.level;
                const isNext = (user.vipLevel || 0) + 1 === tier.level;
                const isLocked = (user.vipLevel || 0) + 1 < tier.level;

                return (
                    <div 
                        key={tier.level}
                        className={`relative rounded-3xl overflow-hidden transition-all duration-500 group ${isOwned ? 'opacity-80 scale-95' : 'opacity-100'}`}
                    >
                        {/* Card Visual */}
                        <div className={`absolute inset-0 ${tier.color} opacity-90`}></div>
                        {/* Shimmer effect for unowned tiers */}
                        {!isOwned && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_3s_infinite]"></div>}

                        <div className="relative p-6 border border-white/10 rounded-3xl">
                            {/* Top Row */}
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-black/20 flex items-center justify-center border border-white/10 shadow-inner">
                                        <span className="text-2xl filter drop-shadow-lg">{tier.badge}</span>
                                    </div>
                                    <div>
                                        <h3 className={`text-2xl font-black ${tier.textColor} tracking-wider uppercase`}>
                                            {tier.name[language]}
                                        </h3>
                                        <span className="text-[10px] text-white/80 uppercase tracking-[0.2em] font-bold">Level {tier.level}</span>
                                    </div>
                                </div>
                                {isOwned && (
                                    <div className="bg-white/20 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-white flex items-center gap-1">
                                        <Check className="w-3 h-3" /> {t('current')}
                                    </div>
                                )}
                            </div>

                            {/* Features List */}
                            <div className="mb-6 space-y-2">
                                <p className="text-xs text-white/60 uppercase font-bold mb-2 border-b border-white/10 pb-1 inline-block">
                                    {t('features')}
                                </p>
                                <ul className="space-y-1.5">
                                    {tier.features[language].map((feat, i) => (
                                        <li key={i} className="text-sm text-white/90 flex items-center gap-2">
                                            <Star className="w-3 h-3 text-yellow-300 fill-yellow-300" />
                                            {feat}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Price & Action */}
                            <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
                                <div>
                                    <p className="text-[10px] text-white/60 uppercase">{t('price')}</p>
                                    <div className="flex items-center gap-1 text-yellow-300 font-bold text-lg">
                                        <span>💎</span>
                                        <span>{tier.price.toLocaleString()}</span>
                                    </div>
                                </div>

                                <button 
                                    disabled={isOwned || isLocked}
                                    onClick={() => handleBuyVip(tier.level)}
                                    className={`px-6 py-3 rounded-xl font-bold text-sm shadow-lg transition flex items-center gap-2
                                        ${isOwned 
                                            ? 'bg-white/10 text-white/40 cursor-default' 
                                            : isLocked
                                                ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                                                : 'bg-white text-black hover:scale-105 hover:shadow-xl'
                                        }
                                    `}
                                >
                                    {isOwned 
                                        ? t('current') 
                                        : isLocked 
                                            ? <span className="flex items-center gap-1"><Shield className="w-3 h-3"/> {t('locked')}</span> 
                                            : <span className="flex items-center gap-1"><Zap className="w-3 h-3 fill-black"/> {t('buy')}</span>
                                    }
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
      </div>
    </div>
  );
};

export default VipView;
