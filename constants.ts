
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
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1519681393798-3828fb4090bb?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1534067783741-514d4dddb79e?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1614850523060-8da1d56ae167?q=80&w=600&auto=format&fit=crop',
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
    },
    {
        id: 'blackjack_pro',
        name: { ar: 'بلاك جاك', en: 'Blackjack Pro' },
        icon: '♠️',
        bgImage: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=300&auto=format&fit=crop'
    },
    {
        id: 'horse_racing',
        name: { ar: 'سباق الخيل', en: 'Horse Racing' },
        icon: '🏇',
        bgImage: 'https://images.unsplash.com/photo-1552084705-2d33400a44d0?q=80&w=300&auto=format&fit=crop'
    },
    {
        id: 'dice_duel',
        name: { ar: 'حرب النرد', en: 'Dice Duel' },
        icon: '🎲',
        bgImage: 'https://images.unsplash.com/photo-1522069213448-443a614da9b6?q=80&w=300&auto=format&fit=crop'
    },
    {
        id: 'crypto_crash',
        name: { ar: 'تحطم الكريبتو', en: 'Crypto Crash' },
        icon: '📉',
        bgImage: 'https://images.unsplash.com/photo-1621504450168-38f6854cb186?q=80&w=300&auto=format&fit=crop'
    },
    {
        id: 'fruit_splash',
        name: { ar: 'فواكه الحظ', en: 'Fruit Splash' },
        icon: '🍒',
        bgImage: 'https://images.unsplash.com/photo-1519999482648-25049ddd37b1?q=80&w=300&auto=format&fit=crop'
    },
    {
        id: 'lucky_7',
        name: { ar: 'الرقم 7', en: 'Lucky 7' },
        icon: '7️⃣',
        bgImage: 'https://images.unsplash.com/photo-1605806616949-1e87b487bc2a?q=80&w=300&auto=format&fit=crop'
    },
    {
        id: 'bingo_bash',
        name: { ar: 'بينجو', en: 'Bingo Bash' },
        icon: '🎱',
        bgImage: 'https://images.unsplash.com/photo-1533230948925-502a5538e146?q=80&w=300&auto=format&fit=crop'
    },
    {
        id: 'scratch_cards',
        name: { ar: 'كروت الخدش', en: 'Scratch Cards' },
        icon: '🎫',
        bgImage: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?q=80&w=300&auto=format&fit=crop'
    },
    {
        id: 'lotto_win',
        name: { ar: 'لوتو', en: 'Lotto Win' },
        icon: '🔢',
        bgImage: 'https://images.unsplash.com/photo-1518688248740-75979c5a9094?q=80&w=300&auto=format&fit=crop'
    },
    {
        id: 'guess_high',
        name: { ar: 'أعلى أم أقل', en: 'High Low' },
        icon: '⬆️',
        bgImage: 'https://images.unsplash.com/photo-1600325492264-77c87c943141?q=80&w=300&auto=format&fit=crop'
    },
    {
        id: 'minesweeper',
        name: { ar: 'كاسحة الألغام', en: 'Minesweeper' },
        icon: '💣',
        bgImage: 'https://images.unsplash.com/photo-1599583236049-741c8882583e?q=80&w=300&auto=format&fit=crop'
    },
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
  { id: 'rose', name: 'Rose', icon: '🌹', cost: 1 },
  { id: 'heart', name: 'Heart', icon: '❤️', cost: 5 },
  { id: 'chocolate', name: 'Chocolate', icon: '🍫', cost: 10 },
  { id: 'star', name: 'Star', icon: '⭐', cost: 20 },
  { id: 'diamond', name: 'Diamond', icon: '💎', cost: 50 },
  { id: 'crown', name: 'Crown', icon: '👑', cost: 100 },
  { id: 'car', name: 'Sports Car', icon: '🏎️', cost: 500 },
  { id: 'castle', name: 'Castle', icon: '🏰', cost: 1000 },
  { id: 'dragon', name: 'Dragon', icon: '🐉', cost: 5000 },
  { id: 'rocket', name: 'Rocket', icon: '🚀', cost: 10000 },
  { id: 'planet', name: 'Planet', icon: '🪐', cost: 20000 },
  { id: 'yacht', name: 'Luxury Yacht', icon: '🛥️', cost: 5000 },
  { id: 'plane', name: 'Private Jet', icon: '✈️', cost: 8000 },
  { id: 'lion', name: 'Golden Lion', icon: '🦁', cost: 15000 },
  { id: 'phoenix', name: 'Phoenix', icon: '🦅', cost: 25000 },
  { id: 'ring', name: 'Diamond Ring', icon: '💍', cost: 2000 },
  { id: 'trophy', name: 'Gold Trophy', icon: '🏆', cost: 3000 },
  { id: 'island', name: 'Private Island', icon: '🏝️', cost: 50000 },
  { id: 'universe', name: 'Universe', icon: '🌌', cost: 100000 },
  { id: 'koenigsegg', name: 'Koenigsegg', icon: '🏎️', cost: 75000 },
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
