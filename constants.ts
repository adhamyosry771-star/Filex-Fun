
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
    coins: 50000
  },
  equippedFrame: 'frame_1',
  equippedBubble: 'bubble_default',
  ownedItems: ['frame_1', 'bubble_default'],
  friendsCount: 45,
  followersCount: 1250,
  followingCount: 120,
  visitorsCount: 3400
};

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
  'https://images.unsplash.com/photo-1566008885218-40bdb64a663e?q=80&w=800&auto=format&fit=crop', 
  'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=800&auto=format&fit=crop', 
  'https://images.unsplash.com/photo-1580273916550-e323be2ae537?q=80&w=800&auto=format&fit=crop', 
  'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?q=80&w=800&auto=format&fit=crop', 
  'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?q=80&w=800&auto=format&fit=crop', 
  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=800&auto=format&fit=crop', 
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800&auto=format&fit=crop', 
  'https://images.unsplash.com/photo-1519681393798-3828fb4090bb?q=80&w=800&auto=format&fit=crop', 
  'https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?q=80&w=800&auto=format&fit=crop', 
  'https://images.unsplash.com/photo-1528722828814-77b9b8a90204?q=80&w=800&auto=format&fit=crop', 
  'https://images.unsplash.com/photo-1534067783741-514d4dddb79e?q=80&w=800&auto=format&fit=crop', 
  'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=800&auto=format&fit=crop', 
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
    class: 'bg-red-600/20 text-red-500 border border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)] animate-pulse'
  },
  admin: {
    name: { ar: 'أدمن', en: 'Admin' },
    class: 'bg-yellow-600/20 text-yellow-500 border border-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]'
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
  // Static Gifts
  { id: 'rose', name: 'Rose', icon: '🌹', cost: 1, type: 'static' },
  { id: 'heart', name: 'Heart', icon: '❤️', cost: 5, type: 'static' },
  { id: 'chocolate', name: 'Chocolate', icon: '🍫', cost: 10, type: 'static' },
  { id: 'star', name: 'Star', icon: '⭐', cost: 20, type: 'static' },
  { id: 'diamond', name: 'Diamond', icon: '💎', cost: 50, type: 'static' },
  { id: 'crown', name: 'Crown', icon: '👑', cost: 100, type: 'static' },
  
  // Animated Gifts (Simulated with icons + CSS classes)
  { id: 'car', name: 'Sports Car', icon: '🏎️', cost: 500, type: 'animated', animationClass: 'animate-slide-across' },
  { id: 'rocket', name: 'Rocket', icon: '🚀', cost: 1000, type: 'animated', animationClass: 'animate-fly-up' },
  { id: 'dragon', name: 'Dragon', icon: '🐉', cost: 5000, type: 'animated', animationClass: 'animate-dragon-breath' },
  { id: 'planet', name: 'Planet', icon: '🪐', cost: 2000, type: 'animated', animationClass: 'animate-spin-slow' },
  { id: 'lion', name: 'Golden Lion', icon: '🦁', cost: 3000, type: 'animated', animationClass: 'animate-bounce-in' },
  { id: 'phoenix', name: 'Phoenix', icon: '🦅', cost: 4000, type: 'animated', animationClass: 'animate-pulse-fast' },
  { id: 'volcano', name: 'Volcano', icon: '🌋', cost: 6000, type: 'animated', animationClass: 'animate-shake' },
  { id: 'ufo', name: 'UFO', icon: '🛸', cost: 8000, type: 'animated', animationClass: 'animate-float-random' },
];

export const STORE_ITEMS: StoreItem[] = [
  { id: 'frame_1', type: 'frame', name: { ar: 'إطار ذهبي', en: 'Golden Frame' }, price: 500, currency: 'diamonds', previewClass: 'border-4 border-yellow-400 shadow-[0_0_10px_gold]' },
  { id: 'frame_2', type: 'frame', name: { ar: 'إطار نيون', en: 'Neon Frame' }, price: 1000, currency: 'diamonds', previewClass: 'border-4 border-purple-500 shadow-[0_0_15px_purple]' },
  { id: 'frame_3', type: 'frame', name: { ar: 'إطار ناري', en: 'Fire Frame' }, price: 2000, currency: 'diamonds', previewClass: 'border-4 border-red-500 shadow-[0_0_15px_red] animate-pulse' },
  { id: 'frame_4', type: 'frame', name: { ar: 'إطار ملكي', en: 'Royal Frame' }, price: 5000, currency: 'diamonds', previewClass: 'border-4 border-blue-600 shadow-[0_0_20px_blue]' },
  { id: 'frame_5', type: 'frame', name: { ar: 'إطار الطبيعة', en: 'Nature Frame' }, price: 300, currency: 'coins', previewClass: 'border-4 border-green-500' },
  { id: 'bubble_1', type: 'bubble', name: { ar: 'فقاعة زرقاء', en: 'Blue Bubble' }, price: 200, currency: 'coins', previewClass: 'bg-blue-600 text-white rounded-tr-none' },
  { id: 'bubble_2', type: 'bubble', name: { ar: 'فقاعة وردية', en: 'Pink Bubble' }, price: 500, currency: 'coins', previewClass: 'bg-pink-500 text-white rounded-tr-none' },
  { id: 'bubble_3', type: 'bubble', name: { ar: 'فقاعة ذهبية', en: 'Gold Bubble' }, price: 100, currency: 'diamonds', previewClass: 'bg-yellow-600 text-black rounded-tr-none font-bold' },
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
