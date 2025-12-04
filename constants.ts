import { Room, User, Gift, StoreItem, VipTier, Game } from './types';

export const CURRENT_USER: User = {
  uid: 'guest',
  id: 'u1',
  name: 'FlexMaster',
  avatar: 'https://picsum.photos/seed/me/200/200',
  level: 12,
  diamondsSpent: 154000,
  diamondsReceived: 50000,
  vip: true,
  vipLevel: 1,
  wallet: {
    diamonds: 2500000,
    coins: 0
  },
  equippedFrame: 'frame_1',
  equippedBubble: 'bubble_default',
  ownedItems: ['frame_1', 'bubble_default'],
  friendsCount: 45,
  followersCount: 1250,
  followingCount: 120,
  visitorsCount: 3400
};

export const COUNTRIES = [
    // Arab Countries
    { code: 'EG', flag: '🇪🇬', name: { ar: 'مصر', en: 'Egypt' } },
    { code: 'SA', flag: '🇸🇦', name: { ar: 'السعودية', en: 'Saudi Arabia' } },
    { code: 'AE', flag: '🇦🇪', name: { ar: 'الإمارات', en: 'UAE' } },
    { code: 'KW', flag: '🇰🇼', name: { ar: 'الكويت', en: 'Kuwait' } },
    { code: 'QA', flag: '🇶🇦', name: { ar: 'قطر', en: 'Qatar' } },
    { code: 'BH', flag: '🇧🇭', name: { ar: 'البحرين', en: 'Bahrain' } },
    { code: 'OM', flag: '🇴🇲', name: { ar: 'سلطنة عمان', en: 'Oman' } },
    { code: 'IQ', flag: '🇮🇶', name: { ar: 'العراق', en: 'Iraq' } },
    { code: 'JO', flag: '🇯🇴', name: { ar: 'الأردن', en: 'Jordan' } },
    { code: 'LB', flag: '🇱🇧', name: { ar: 'لبنان', en: 'Lebanon' } },
    { code: 'PS', flag: '🇵🇸', name: { ar: 'فلسطين', en: 'Palestine' } },
    { code: 'SY', flag: '🇸🇾', name: { ar: 'سوريا', en: 'Syria' } },
    { code: 'YE', flag: '🇾🇪', name: { ar: 'اليمن', en: 'Yemen' } },
    { code: 'SD', flag: '🇸🇩', name: { ar: 'السودان', en: 'Sudan' } },
    { code: 'LY', flag: '🇱🇾', name: { ar: 'ليبيا', en: 'Libya' } },
    { code: 'TN', flag: '🇹🇳', name: { ar: 'تونس', en: 'Tunisia' } },
    { code: 'DZ', flag: '🇩🇿', name: { ar: 'الجزائر', en: 'Algeria' } },
    { code: 'MA', flag: '🇲🇦', name: { ar: 'المغرب', en: 'Morocco' } },
    { code: 'MR', flag: '🇲🇷', name: { ar: 'موريتانيا', en: 'Mauritania' } },
    { code: 'SO', flag: '🇸🇴', name: { ar: 'الصومال', en: 'Somalia' } },
    { code: 'DJ', flag: '🇩🇯', name: { ar: 'جيبوتي', en: 'Djibouti' } },
    { code: 'KM', flag: '🇰🇲', name: { ar: 'جزر القمر', en: 'Comoros' } },
    
    // Major World Countries
    { code: 'US', flag: '🇺🇸', name: { ar: 'الولايات المتحدة', en: 'USA' } },
    { code: 'GB', flag: '🇬🇧', name: { ar: 'المملكة المتحدة', en: 'UK' } },
    { code: 'FR', flag: '🇫🇷', name: { ar: 'فرنسا', en: 'France' } },
    { code: 'DE', flag: '🇩🇪', name: { ar: 'ألمانيا', en: 'Germany' } },
    { code: 'IT', flag: '🇮🇹', name: { ar: 'إيطاليا', en: 'Italy' } },
    { code: 'ES', flag: '🇪🇸', name: { ar: 'إسبانيا', en: 'Spain' } },
    { code: 'TR', flag: '🇹🇷', name: { ar: 'تركيا', en: 'Turkey' } },
    { code: 'RU', flag: '🇷🇺', name: { ar: 'روسيا', en: 'Russia' } },
    { code: 'CN', flag: '🇨🇳', name: { ar: 'الصين', en: 'China' } },
    { code: 'JP', flag: '🇯🇵', name: { ar: 'اليابان', en: 'Japan' } },
    { code: 'KR', flag: '🇰🇷', name: { ar: 'كوريا الجنوبية', en: 'South Korea' } },
    { code: 'IN', flag: '🇮🇳', name: { ar: 'الهند', en: 'India' } },
    { code: 'PK', flag: '🇵🇰', name: { ar: 'باكستان', en: 'Pakistan' } },
    { code: 'ID', flag: '🇮🇩', name: { ar: 'إندونيسيا', en: 'Indonesia' } },
    { code: 'BR', flag: '🇧🇷', name: { ar: 'البرازيل', en: 'Brazil' } },
    { code: 'CA', flag: '🇨🇦', name: { ar: 'كندا', en: 'Canada' } },
    { code: 'AU', flag: '🇦🇺', name: { ar: 'أستراليا', en: 'Australia' } },
    { code: 'WW', flag: '🌍', name: { ar: 'أخرى', en: 'Other' } },
];

export const LEVEL_ICONS = [
    { min: 0, icon: '🛡️', color: 'bg-gray-500' },
    { min: 10, icon: '⚔️', color: 'bg-blue-500' },
    { min: 20, icon: '💎', color: 'bg-cyan-500' },
    { min: 30, icon: '👑', color: 'bg-purple-500' },
    { min: 40, icon: '🌟', color: 'bg-yellow-500' },
    { min: 50, icon: '🔥', color: 'bg-orange-500' },
    { min: 60, icon: '🦁', color: 'bg-red-500' },
    { min: 70, icon: '🐲', color: 'bg-red-700' },
    { min: 80, icon: '⚡', color: 'bg-amber-400' },
    { min: 90, icon: '🔱', color: 'bg-rose-600' },
    { min: 100, icon: '🪐', color: 'bg-indigo-600' },
];

export const CHARM_ICONS = [
    { min: 0, icon: '💙', color: 'bg-blue-400' },
    { min: 10, icon: '💖', color: 'bg-pink-400' },
    { min: 20, icon: '🌹', color: 'bg-rose-500' },
    { min: 30, icon: '🦋', color: 'bg-purple-400' },
    { min: 40, icon: '🦄', color: 'bg-fuchsia-500' },
    { min: 50, icon: '🌈', color: 'bg-sky-400' },
    { min: 60, icon: '🎸', color: 'bg-red-500' },
    { min: 70, icon: '🎤', color: 'bg-indigo-500' },
    { min: 80, icon: '💃', color: 'bg-pink-600' },
    { min: 90, icon: '🧞', color: 'bg-violet-600' },
    { min: 100, icon: '🧜‍♀️', color: 'bg-cyan-500' },
];

export const ROOM_BACKGROUNDS = [
  'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
];

export const GAMES: Game[] = [
    {
        id: 'lucky_wheel',
        name: { ar: 'عجلة الحظ', en: 'Lucky Wheel' },
        icon: '🎡',
        bgImage: 'https://images.unsplash.com/photo-1596838132731-3301c3fd4317?q=80&w=300&auto=format&fit=crop'
    },
    {
        id: 'slots_classic',
        name: { ar: 'سلوتس كلاسيك', en: 'Classic Slots' },
        icon: '🎰',
        bgImage: 'https://images.unsplash.com/photo-1605806616949-1e87b487bc2a?q=80&w=300&auto=format&fit=crop'
    },
    {
        id: 'poker_texas',
        name: { ar: 'بوكر تكساس', en: 'Texas Poker' },
        icon: '🃏',
        bgImage: 'https://images.unsplash.com/photo-1511193311914-0346f16efe90?q=80&w=300&auto=format&fit=crop'
    },
    {
        id: 'roulette_royal',
        name: { ar: 'الروليت الملكي', en: 'Royal Roulette' },
        icon: '🎱',
        bgImage: 'https://images.unsplash.com/photo-1606167668584-78701c57f13d?q=80&w=300&auto=format&fit=crop'
    }
];

export const ADMIN_ROLES = {
  super_admin: {
    name: { ar: 'سوبر أدمن', en: 'Super Admin' },
    class: 'bg-red-950/90 text-red-500 border border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.6)] animate-pulse'
  },
  admin: {
    name: { ar: 'أدمن', en: 'Admin' },
    class: 'bg-yellow-950/90 text-yellow-500 border border-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.6)]'
  },
  official_manager: {
    name: { ar: 'المدير الرسمي', en: 'Official Manager' },
    class: 'bg-slate-900/90 text-cyan-400 border border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.7)] font-black tracking-wide'
  },
  me_manager: {
    name: { ar: 'مدير الشرق الأوسط', en: 'ME Manager' },
    class: 'bg-slate-900/90 text-emerald-400 border border-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.7)] font-black tracking-wide'
  }
};

export const VIP_TIERS: VipTier[] = [
  { level: 1, name: { ar: 'برونزي', en: 'Bronze' }, color: 'bg-amber-700', textColor: 'text-amber-200', badge: '🥉', discount: 2, price: 1000000, features: { ar: ['شارة VIP 1', 'دخول مميز'], en: ['VIP 1 Badge', 'Special Entry'] } },
  { level: 2, name: { ar: 'فضي', en: 'Silver' }, color: 'bg-gray-400', textColor: 'text-gray-100', badge: '🥈', discount: 5, price: 5000000, features: { ar: ['شارة VIP 2', 'خصم 5%'], en: ['VIP 2 Badge', '5% Discount'] } },
  { level: 3, name: { ar: 'ذهبي', en: 'Gold' }, color: 'bg-yellow-600', textColor: 'text-yellow-100', badge: '🥇', discount: 8, price: 10000000, features: { ar: ['شارة VIP 3', 'خصم 8%'], en: ['VIP 3 Badge', '8% Discount'] } },
  { level: 4, name: { ar: 'بلاتينيوم', en: 'Platinum' }, color: 'bg-cyan-600', textColor: 'text-cyan-100', badge: '💠', discount: 10, price: 20000000, features: { ar: ['شارة VIP 4', 'خصم 10%'], en: ['VIP 4 Badge', '10% Discount'] } },
  { level: 5, name: { ar: 'ماسي', en: 'Diamond' }, color: 'bg-blue-600', textColor: 'text-blue-100', badge: '💎', discount: 15, price: 50000000, features: { ar: ['شارة VIP 5', 'دخول مخفي'], en: ['VIP 5 Badge', 'Hidden Entry'] } },
  { level: 6, name: { ar: 'ملك', en: 'King' }, color: 'bg-purple-600', textColor: 'text-purple-100', badge: '👑', discount: 20, price: 100000000, features: { ar: ['شارة الملك', 'طرد المستخدمين'], en: ['King Badge', 'Kick Users'] } },
  { level: 7, name: { ar: 'أسطورة', en: 'Legend' }, color: 'bg-pink-600', textColor: 'text-pink-100', badge: '🦄', discount: 25, price: 250000000, features: { ar: ['شارة الأسطورة', 'حظر المستخدمين'], en: ['Legend Badge', 'Ban Users'] } },
  { level: 8, name: { ar: 'إمبراطور', en: 'Emperor' }, color: 'bg-gradient-to-r from-red-600 to-red-900', textColor: 'text-red-500 font-black animate-pulse drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]', badge: '🔱', discount: 30, price: 500000000, features: { ar: ['اسم أحمر متوهج', 'سلطة مطلقة', 'هدايا حصرية'], en: ['Red Glowing Name', 'Absolute Power', 'Exclusive Gifts'] } },
];

export const GIFTS: Gift[] = [
  { id: 'rose', name: 'Rose', icon: '🌹', cost: 1, type: 'static' },
  { id: 'coffee', name: 'Coffee', icon: '☕', cost: 2, type: 'static' },
  { id: 'heart', name: 'Heart', icon: '❤️', cost: 5, type: 'static' },
  { id: 'kiss', name: 'Kiss', icon: '💋', cost: 10, type: 'static' },
  { id: 'chocolate', name: 'Chocolate', icon: '🍫', cost: 15, type: 'static' },
  { id: 'mic', name: 'Mic', icon: '🎤', cost: 20, type: 'static' },
  { id: 'perfume', name: 'Perfume', icon: '🧴', cost: 30, type: 'static' },
  { id: 'diamond', name: 'Diamond', icon: '💎', cost: 50, type: 'static' },
  { id: 'ring', name: 'Ring', icon: '💍', cost: 66, type: 'static' },
  { id: 'crown', name: 'Crown', icon: '👑', cost: 99, type: 'static' },
  { id: 'trophy', name: 'Trophy', icon: '🏆', cost: 150, type: 'static' },
  { id: 'bag', name: 'Luxury Bag', icon: '👜', cost: 200, type: 'static' },
  { id: 'watch', name: 'Gold Watch', icon: '⌚', cost: 300, type: 'static' },
  { id: 'safe', name: 'Vault', icon: '🏦', cost: 400, type: 'static' },
  { id: 'car', name: 'Sports Car', icon: '🏎️', cost: 500, type: 'animated', animationClass: 'animate-slide-across' },
  { id: 'motorcycle', name: 'Super Bike', icon: '🏍️', cost: 800, type: 'animated', animationClass: 'animate-slide-across' },
  { id: 'rocket', name: 'Rocket', icon: '🚀', cost: 1000, type: 'animated', animationClass: 'animate-fly-up' },
  { id: 'yacht', name: 'Yacht', icon: '🛥️', cost: 2000, type: 'animated', animationClass: 'animate-bounce-in' },
  { id: 'lion', name: 'Golden Lion', icon: '🦁', cost: 3000, type: 'animated', animationClass: 'animate-bounce-in' },
  { id: 'dragon', name: 'Dragon', icon: '🐉', cost: 5000, type: 'animated', animationClass: 'animate-dragon-breath' },
  { id: 'jet', name: 'Private Jet', icon: '✈️', cost: 10000, type: 'animated', animationClass: 'animate-fly-up' },
  { id: 'castle', name: 'Magic Castle', icon: '🏰', cost: 20000, type: 'animated', animationClass: 'animate-pulse' },
  { id: 'pegasus', name: 'Pegasus', icon: '🦄', cost: 50000, type: 'animated', animationClass: 'animate-float' },
  { id: 'island', name: 'Private Island', icon: '🏝️', cost: 100000, type: 'animated', animationClass: 'animate-pulse-slow' },
  { id: 'spaceship', name: 'Starship', icon: '🛸', cost: 250000, type: 'animated', animationClass: 'animate-float-random' },
  { id: 'phoenix_god', name: 'Phoenix God', icon: '🦅', cost: 500000, type: 'animated', animationClass: 'animate-pulse-fast' },
  { id: 'universe', name: 'Flex Universe', icon: '🌌', cost: 1000000, type: 'animated', animationClass: 'animate-spin-slow' },
];

export const STORE_ITEMS: StoreItem[] = [
  { id: 'frame_1', type: 'frame', name: { ar: 'إطار ذهبي', en: 'Golden Frame' }, price: 500, currency: 'diamonds', previewClass: 'border-4 border-yellow-400 shadow-[0_0_10px_gold]' },
  { id: 'frame_2', type: 'frame', name: { ar: 'إطار نيون', en: 'Neon Frame' }, price: 1000, currency: 'diamonds', previewClass: 'border-4 border-purple-500 shadow-[0_0_15px_purple]' },
  { id: 'frame_3', type: 'frame', name: { ar: 'إطار ناري', en: 'Fire Frame' }, price: 2000, currency: 'diamonds', previewClass: 'border-4 border-red-500 shadow-[0_0_15px_red] animate-pulse' },
  { id: 'frame_4', type: 'frame', name: { ar: 'إطار ملكي', en: 'Royal Frame' }, price: 5000, currency: 'diamonds', previewClass: 'border-4 border-blue-600 shadow-[0_0_20px_blue]' },
  { id: 'frame_5', type: 'frame', name: { ar: 'إطار الطبيعة', en: 'Nature Frame' }, price: 300, currency: 'coins', previewClass: 'border-4 border-green-500' },
  { id: 'frame_6', type: 'frame', name: { ar: 'نيون أزرق', en: 'Blue Neon' }, price: 800, currency: 'diamonds', previewClass: 'border-4 border-cyan-400 shadow-[0_0_10px_cyan]' },
  { id: 'frame_7', type: 'frame', name: { ar: 'نيون وردي', en: 'Pink Neon' }, price: 800, currency: 'diamonds', previewClass: 'border-4 border-pink-500 shadow-[0_0_10px_pink]' },
  { id: 'frame_8', type: 'frame', name: { ar: 'نيون أخضر', en: 'Green Neon' }, price: 800, currency: 'diamonds', previewClass: 'border-4 border-lime-400 shadow-[0_0_10px_lime]' },
  { id: 'frame_9', type: 'frame', name: { ar: 'سايبر بانك', en: 'Cyberpunk' }, price: 1500, currency: 'diamonds', previewClass: 'border-4 border-yellow-300 border-dashed animate-spin-slow' },
  { id: 'frame_10', type: 'frame', name: { ar: 'جليتش', en: 'Glitch' }, price: 2000, currency: 'diamonds', previewClass: 'border-4 border-r-red-500 border-l-blue-500 border-t-green-500 border-b-yellow-500 animate-pulse' },
  { id: 'bubble_1', type: 'bubble', name: { ar: 'فقاعة زرقاء', en: 'Blue Bubble' }, price: 200, currency: 'coins', previewClass: 'bg-blue-600 text-white rounded-tr-none' },
  { id: 'bubble_2', type: 'bubble', name: { ar: 'فقاعة وردية', en: 'Pink Bubble' }, price: 500, currency: 'coins', previewClass: 'bg-pink-500 text-white rounded-tr-none' },
  { id: 'bubble_3', type: 'bubble', name: { ar: 'فقاعة ذهبية', en: 'Gold Bubble' }, price: 100, currency: 'diamonds', previewClass: 'bg-yellow-600 text-black rounded-tr-none font-bold' },
  { id: 'bubble_4', type: 'bubble', name: { ar: 'غروب الشمس', en: 'Sunset' }, price: 300, currency: 'coins', previewClass: 'bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-tr-none' },
  { id: 'bubble_5', type: 'bubble', name: { ar: 'محيط', en: 'Ocean' }, price: 300, currency: 'coins', previewClass: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-tr-none' },
];

export const DEFAULT_AVATARS = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Zack',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Bella',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Robot1',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Robot2',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1527980965255-d3b416303d12?q=80&w=200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=200&auto=format&fit=crop',
];