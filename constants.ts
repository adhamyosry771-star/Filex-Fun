
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
  
  // Animated Gifts
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
  // --- Original Frames ---
  { id: 'frame_1', type: 'frame', name: { ar: 'إطار ذهبي', en: 'Golden Frame' }, price: 500, currency: 'diamonds', previewClass: 'border-4 border-yellow-400 shadow-[0_0_10px_gold]' },
  { id: 'frame_2', type: 'frame', name: { ar: 'إطار نيون', en: 'Neon Frame' }, price: 1000, currency: 'diamonds', previewClass: 'border-4 border-purple-500 shadow-[0_0_15px_purple]' },
  { id: 'frame_3', type: 'frame', name: { ar: 'إطار ناري', en: 'Fire Frame' }, price: 2000, currency: 'diamonds', previewClass: 'border-4 border-red-500 shadow-[0_0_15px_red] animate-pulse' },
  { id: 'frame_4', type: 'frame', name: { ar: 'إطار ملكي', en: 'Royal Frame' }, price: 5000, currency: 'diamonds', previewClass: 'border-4 border-blue-600 shadow-[0_0_20px_blue]' },
  { id: 'frame_5', type: 'frame', name: { ar: 'إطار الطبيعة', en: 'Nature Frame' }, price: 300, currency: 'coins', previewClass: 'border-4 border-green-500' },

  // --- NEW: Neon & Tech Frames (10) ---
  { id: 'frame_6', type: 'frame', name: { ar: 'نيون أزرق', en: 'Blue Neon' }, price: 800, currency: 'diamonds', previewClass: 'border-4 border-cyan-400 shadow-[0_0_10px_cyan]' },
  { id: 'frame_7', type: 'frame', name: { ar: 'نيون وردي', en: 'Pink Neon' }, price: 800, currency: 'diamonds', previewClass: 'border-4 border-pink-500 shadow-[0_0_10px_pink]' },
  { id: 'frame_8', type: 'frame', name: { ar: 'نيون أخضر', en: 'Green Neon' }, price: 800, currency: 'diamonds', previewClass: 'border-4 border-lime-400 shadow-[0_0_10px_lime]' },
  { id: 'frame_9', type: 'frame', name: { ar: 'سايبر بانك', en: 'Cyberpunk' }, price: 1500, currency: 'diamonds', previewClass: 'border-4 border-yellow-300 border-dashed animate-spin-slow' },
  { id: 'frame_10', type: 'frame', name: { ar: 'جليتش', en: 'Glitch' }, price: 2000, currency: 'diamonds', previewClass: 'border-4 border-r-red-500 border-l-blue-500 border-t-green-500 border-b-yellow-500 animate-pulse' },
  { id: 'frame_11', type: 'frame', name: { ar: 'خاتم الطاقة', en: 'Energy Ring' }, price: 1200, currency: 'diamonds', previewClass: 'ring-4 ring-offset-2 ring-blue-500 rounded-full' },
  { id: 'frame_12', type: 'frame', name: { ar: 'نبض أحمر', en: 'Red Pulse' }, price: 1000, currency: 'diamonds', previewClass: 'border-2 border-red-600 animate-[ping_1s_infinite]' },
  { id: 'frame_13', type: 'frame', name: { ar: 'ليزر', en: 'Laser' }, price: 2500, currency: 'diamonds', previewClass: 'border-2 border-white shadow-[0_0_20px_white]' },
  { id: 'frame_14', type: 'frame', name: { ar: 'مصفوفة', en: 'Matrix' }, price: 1800, currency: 'diamonds', previewClass: 'border-4 border-green-500 border-dotted' },
  { id: 'frame_15', type: 'frame', name: { ar: 'فضاء', en: 'Space' }, price: 3000, currency: 'diamonds', previewClass: 'bg-gradient-to-tr from-purple-900 to-black border-2 border-indigo-500 p-1' },

  // --- NEW: Elemental & Nature Frames (10) ---
  { id: 'frame_16', type: 'frame', name: { ar: 'محيط', en: 'Ocean' }, price: 600, currency: 'coins', previewClass: 'border-4 border-blue-400 bg-blue-900/30' },
  { id: 'frame_17', type: 'frame', name: { ar: 'غابة', en: 'Forest' }, price: 600, currency: 'coins', previewClass: 'border-4 border-green-700 border-double' },
  { id: 'frame_18', type: 'frame', name: { ar: 'بركان', en: 'Volcano' }, price: 2200, currency: 'diamonds', previewClass: 'border-4 border-orange-600 shadow-[0_0_15px_orange]' },
  { id: 'frame_19', type: 'frame', name: { ar: 'جليد', en: 'Ice' }, price: 1500, currency: 'diamonds', previewClass: 'border-4 border-cyan-200 bg-white/10 backdrop-blur' },
  { id: 'frame_20', type: 'frame', name: { ar: 'رعد', en: 'Thunder' }, price: 2500, currency: 'diamonds', previewClass: 'border-4 border-yellow-200 animate-pulse shadow-[0_0_10px_yellow]' },
  { id: 'frame_21', type: 'frame', name: { ar: 'صحراء', en: 'Desert' }, price: 500, currency: 'coins', previewClass: 'border-4 border-amber-600' },
  { id: 'frame_22', type: 'frame', name: { ar: 'سماء', en: 'Sky' }, price: 800, currency: 'coins', previewClass: 'border-4 border-sky-300' },
  { id: 'frame_23', type: 'frame', name: { ar: 'زهور', en: 'Floral' }, price: 1000, currency: 'coins', previewClass: 'border-4 border-pink-300 border-dashed' },
  { id: 'frame_24', type: 'frame', name: { ar: 'قمر', en: 'Moon' }, price: 1500, currency: 'diamonds', previewClass: 'border-2 border-gray-300 shadow-[0_0_15px_gray] bg-gray-800' },
  { id: 'frame_25', type: 'frame', name: { ar: 'شمس', en: 'Sun' }, price: 1500, currency: 'diamonds', previewClass: 'border-4 border-orange-400 shadow-[0_0_20px_orange]' },

  // --- NEW: Luxury & Premium Frames (10) ---
  { id: 'frame_26', type: 'frame', name: { ar: 'بلاتينيوم', en: 'Platinum' }, price: 5000, currency: 'diamonds', previewClass: 'border-[6px] border-gray-300 shadow-[0_0_10px_white]' },
  { id: 'frame_27', type: 'frame', name: { ar: 'ألماس أسود', en: 'Black Diamond' }, price: 7000, currency: 'diamonds', previewClass: 'border-4 border-gray-900 shadow-[0_0_15px_black]' },
  { id: 'frame_28', type: 'frame', name: { ar: 'ياقوت', en: 'Ruby' }, price: 4000, currency: 'diamonds', previewClass: 'border-4 border-red-700 shadow-[0_0_10px_red]' },
  { id: 'frame_29', type: 'frame', name: { ar: 'زمرد', en: 'Emerald' }, price: 4000, currency: 'diamonds', previewClass: 'border-4 border-emerald-600 shadow-[0_0_10px_green]' },
  { id: 'frame_30', type: 'frame', name: { ar: 'تاج', en: 'Crown' }, price: 8000, currency: 'diamonds', previewClass: 'border-t-[6px] border-yellow-500 border-b-2 border-x-2 rounded-t-xl' },
  { id: 'frame_31', type: 'frame', name: { ar: 'قوس قزح', en: 'Rainbow' }, price: 3000, currency: 'diamonds', previewClass: 'bg-gradient-to-r from-red-500 via-green-500 to-blue-500 p-1' },
  { id: 'frame_32', type: 'frame', name: { ar: 'ملاك', en: 'Angel' }, price: 3500, currency: 'diamonds', previewClass: 'border-4 border-white shadow-[0_0_20px_white] ring-2 ring-white/50' },
  { id: 'frame_33', type: 'frame', name: { ar: 'شيطان', en: 'Devil' }, price: 3500, currency: 'diamonds', previewClass: 'border-4 border-red-900 shadow-[0_0_15px_red]' },
  { id: 'frame_34', type: 'frame', name: { ar: 'ملكي فاخر', en: 'Royal Lux' }, price: 10000, currency: 'diamonds', previewClass: 'border-[5px] border-purple-800 shadow-[0_0_25px_purple]' },
  { id: 'frame_35', type: 'frame', name: { ar: 'أسطوري', en: 'Legendary' }, price: 20000, currency: 'diamonds', previewClass: 'bg-gradient-to-br from-gold-400 via-white to-gold-400 p-1.5 animate-pulse' },

  // --- NEW: Fun & Cute Frames (10) ---
  { id: 'frame_36', type: 'frame', name: { ar: 'حلوى', en: 'Candy' }, price: 500, currency: 'coins', previewClass: 'border-4 border-pink-400 border-dashed' },
  { id: 'frame_37', type: 'frame', name: { ar: 'فقاعات', en: 'Bubbles' }, price: 500, currency: 'coins', previewClass: 'border-4 border-blue-200 rounded-full' },
  { id: 'frame_38', type: 'frame', name: { ar: 'قطة', en: 'Cat' }, price: 1000, currency: 'coins', previewClass: 'border-4 border-orange-300' },
  { id: 'frame_39', type: 'frame', name: { ar: 'حب', en: 'Love' }, price: 1200, currency: 'diamonds', previewClass: 'border-4 border-red-400 shadow-[0_0_10px_pink]' },
  { id: 'frame_40', type: 'frame', name: { ar: 'نجمة', en: 'Star' }, price: 1500, currency: 'coins', previewClass: 'border-4 border-yellow-300' },
  { id: 'frame_41', type: 'frame', name: { ar: 'بكسل', en: 'Pixel' }, price: 800, currency: 'coins', previewClass: 'border-[6px] border-green-500 border-none outline outline-4 outline-green-500' },
  { id: 'frame_42', type: 'frame', name: { ar: 'شبح', en: 'Ghost' }, price: 1000, currency: 'coins', previewClass: 'border-4 border-gray-300 opacity-70' },
  { id: 'frame_43', type: 'frame', name: { ar: 'كرتون', en: 'Cartoon' }, price: 600, currency: 'coins', previewClass: 'border-[5px] border-black' },
  { id: 'frame_44', type: 'frame', name: { ar: 'مدرسة', en: 'School' }, price: 400, currency: 'coins', previewClass: 'border-4 border-blue-800' },
  { id: 'frame_45', type: 'frame', name: { ar: 'احتفال', en: 'Party' }, price: 2000, currency: 'diamonds', previewClass: 'border-4 border-pink-500 border-dotted animate-spin' },

  // --- NEW: Animated & Special Frames (10) ---
  { id: 'frame_46', type: 'frame', name: { ar: 'دوران سريع', en: 'Fast Spin' }, price: 3000, currency: 'diamonds', previewClass: 'border-t-4 border-blue-500 rounded-full animate-spin' },
  { id: 'frame_47', type: 'frame', name: { ar: 'نبض بطيء', en: 'Slow Pulse' }, price: 2000, currency: 'diamonds', previewClass: 'border-4 border-purple-600 animate-[pulse_3s_infinite]' },
  { id: 'frame_48', type: 'frame', name: { ar: 'توهج', en: 'Glow' }, price: 2500, currency: 'diamonds', previewClass: 'shadow-[0_0_30px_white] border-2 border-white' },
  { id: 'frame_49', type: 'frame', name: { ar: 'خطر', en: 'Danger' }, price: 1500, currency: 'diamonds', previewClass: 'border-4 border-red-600 border-dashed animate-pulse' },
  { id: 'frame_50', type: 'frame', name: { ar: 'تجميد', en: 'Freeze' }, price: 2000, currency: 'diamonds', previewClass: 'border-4 border-cyan-300 bg-cyan-100/20' },
  { id: 'frame_51', type: 'frame', name: { ar: 'تخفي', en: 'Stealth' }, price: 5000, currency: 'diamonds', previewClass: 'border border-gray-800 bg-black opacity-80' },
  { id: 'frame_52', type: 'frame', name: { ar: 'مشع', en: 'Radioactive' }, price: 2500, currency: 'diamonds', previewClass: 'border-4 border-green-400 shadow-[0_0_15px_lime] animate-pulse' },
  { id: 'frame_53', type: 'frame', name: { ar: 'مزدوج', en: 'Double' }, price: 1800, currency: 'diamonds', previewClass: 'border-4 border-double border-pink-500' },
  { id: 'frame_54', type: 'frame', name: { ar: 'ذهبي لامع', en: 'Shiny Gold' }, price: 4000, currency: 'diamonds', previewClass: 'bg-gradient-to-b from-yellow-300 to-yellow-600 p-[4px]' },
  { id: 'frame_55', type: 'frame', name: { ar: 'فضي لامع', en: 'Shiny Silver' }, price: 3000, currency: 'diamonds', previewClass: 'bg-gradient-to-b from-gray-300 to-gray-500 p-[4px]' },


  // --- Original Bubbles ---
  { id: 'bubble_1', type: 'bubble', name: { ar: 'فقاعة زرقاء', en: 'Blue Bubble' }, price: 200, currency: 'coins', previewClass: 'bg-blue-600 text-white rounded-tr-none' },
  { id: 'bubble_2', type: 'bubble', name: { ar: 'فقاعة وردية', en: 'Pink Bubble' }, price: 500, currency: 'coins', previewClass: 'bg-pink-500 text-white rounded-tr-none' },
  { id: 'bubble_3', type: 'bubble', name: { ar: 'فقاعة ذهبية', en: 'Gold Bubble' }, price: 100, currency: 'diamonds', previewClass: 'bg-yellow-600 text-black rounded-tr-none font-bold' },

  // --- NEW: Gradient Bubbles (10) ---
  { id: 'bubble_4', type: 'bubble', name: { ar: 'غروب الشمس', en: 'Sunset' }, price: 300, currency: 'coins', previewClass: 'bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-tr-none' },
  { id: 'bubble_5', type: 'bubble', name: { ar: 'محيط', en: 'Ocean' }, price: 300, currency: 'coins', previewClass: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-tr-none' },
  { id: 'bubble_6', type: 'bubble', name: { ar: 'طبيعة', en: 'Nature' }, price: 300, currency: 'coins', previewClass: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-tr-none' },
  { id: 'bubble_7', type: 'bubble', name: { ar: 'توت', en: 'Berry' }, price: 300, currency: 'coins', previewClass: 'bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-tr-none' },
  { id: 'bubble_8', type: 'bubble', name: { ar: 'نار', en: 'Fire' }, price: 400, currency: 'coins', previewClass: 'bg-gradient-to-r from-red-600 to-orange-500 text-white rounded-tr-none' },
  { id: 'bubble_9', type: 'bubble', name: { ar: 'ليلي', en: 'Night' }, price: 400, currency: 'coins', previewClass: 'bg-gradient-to-r from-gray-900 to-blue-900 text-white rounded-tr-none' },
  { id: 'bubble_10', type: 'bubble', name: { ar: 'ملكي', en: 'Royal' }, price: 500, currency: 'coins', previewClass: 'bg-gradient-to-r from-yellow-700 to-yellow-500 text-white rounded-tr-none' },
  { id: 'bubble_11', type: 'bubble', name: { ar: 'فضاء', en: 'Space' }, price: 500, currency: 'coins', previewClass: 'bg-gradient-to-r from-indigo-900 to-purple-900 text-white rounded-tr-none' },
  { id: 'bubble_12', type: 'bubble', name: { ar: 'ثلج', en: 'Snow' }, price: 400, currency: 'coins', previewClass: 'bg-gradient-to-r from-white to-gray-200 text-black rounded-tr-none' },
  { id: 'bubble_13', type: 'bubble', name: { ar: 'ظلام', en: 'Dark' }, price: 400, currency: 'coins', previewClass: 'bg-gradient-to-r from-gray-800 to-black text-white rounded-tr-none' },

  // --- NEW: Solid Color Bubbles (10) ---
  { id: 'bubble_14', type: 'bubble', name: { ar: 'أحمر', en: 'Red' }, price: 100, currency: 'coins', previewClass: 'bg-red-600 text-white rounded-tr-none' },
  { id: 'bubble_15', type: 'bubble', name: { ar: 'أخضر', en: 'Green' }, price: 100, currency: 'coins', previewClass: 'bg-green-600 text-white rounded-tr-none' },
  { id: 'bubble_16', type: 'bubble', name: { ar: 'برتقالي', en: 'Orange' }, price: 100, currency: 'coins', previewClass: 'bg-orange-500 text-white rounded-tr-none' },
  { id: 'bubble_17', type: 'bubble', name: { ar: 'بنفسجي', en: 'Purple' }, price: 100, currency: 'coins', previewClass: 'bg-purple-600 text-white rounded-tr-none' },
  { id: 'bubble_18', type: 'bubble', name: { ar: 'سماوي', en: 'Cyan' }, price: 100, currency: 'coins', previewClass: 'bg-cyan-500 text-black rounded-tr-none' },
  { id: 'bubble_19', type: 'bubble', name: { ar: 'رمادي', en: 'Gray' }, price: 50, currency: 'coins', previewClass: 'bg-gray-500 text-white rounded-tr-none' },
  { id: 'bubble_20', type: 'bubble', name: { ar: 'بني', en: 'Brown' }, price: 50, currency: 'coins', previewClass: 'bg-amber-800 text-white rounded-tr-none' },
  { id: 'bubble_21', type: 'bubble', name: { ar: 'أسود', en: 'Black' }, price: 150, currency: 'coins', previewClass: 'bg-black text-white rounded-tr-none border border-gray-700' },
  { id: 'bubble_22', type: 'bubble', name: { ar: 'أبيض', en: 'White' }, price: 150, currency: 'coins', previewClass: 'bg-white text-black rounded-tr-none border border-gray-300' },
  { id: 'bubble_23', type: 'bubble', name: { ar: 'ليموني', en: 'Lime' }, price: 100, currency: 'coins', previewClass: 'bg-lime-500 text-black rounded-tr-none' },

  // --- NEW: Special & Bordered Bubbles (15) ---
  { id: 'bubble_24', type: 'bubble', name: { ar: 'نيون أزرق', en: 'Neon Blue' }, price: 1000, currency: 'diamonds', previewClass: 'bg-black border border-cyan-400 text-cyan-400 shadow-[0_0_5px_cyan] rounded-tr-none' },
  { id: 'bubble_25', type: 'bubble', name: { ar: 'نيون وردي', en: 'Neon Pink' }, price: 1000, currency: 'diamonds', previewClass: 'bg-black border border-pink-500 text-pink-500 shadow-[0_0_5px_pink] rounded-tr-none' },
  { id: 'bubble_26', type: 'bubble', name: { ar: 'ذهبي لامع', en: 'Shiny Gold' }, price: 2000, currency: 'diamonds', previewClass: 'bg-gradient-to-b from-yellow-300 to-yellow-600 text-black font-bold border border-white/50 rounded-tr-none' },
  { id: 'bubble_27', type: 'bubble', name: { ar: 'شفاف', en: 'Glass' }, price: 500, currency: 'diamonds', previewClass: 'bg-white/10 backdrop-blur border border-white/20 text-white rounded-tr-none' },
  { id: 'bubble_28', type: 'bubble', name: { ar: 'حدود حمراء', en: 'Red Border' }, price: 200, currency: 'coins', previewClass: 'bg-white border-2 border-red-500 text-red-600 rounded-tr-none' },
  { id: 'bubble_29', type: 'bubble', name: { ar: 'حدود زرقاء', en: 'Blue Border' }, price: 200, currency: 'coins', previewClass: 'bg-white border-2 border-blue-500 text-blue-600 rounded-tr-none' },
  { id: 'bubble_30', type: 'bubble', name: { ar: 'منقط', en: 'Dotted' }, price: 300, currency: 'coins', previewClass: 'bg-gray-800 border-2 border-dotted border-white text-white rounded-tr-none' },
  { id: 'bubble_31', type: 'bubble', name: { ar: 'مخطط', en: 'Striped' }, price: 400, currency: 'coins', previewClass: 'bg-[repeating-linear-gradient(45deg,rgba(0,0,0,0.1),rgba(0,0,0,0.1)_10px,transparent_10px,transparent_20px)] bg-blue-500 text-white rounded-tr-none' },
  { id: 'bubble_32', type: 'bubble', name: { ar: 'توهج', en: 'Glow' }, price: 800, currency: 'diamonds', previewClass: 'bg-white text-black shadow-[0_0_15px_white] rounded-tr-none' },
  { id: 'bubble_33', type: 'bubble', name: { ar: 'شبح', en: 'Ghost' }, price: 600, currency: 'diamonds', previewClass: 'bg-gray-700/50 text-gray-200 border border-gray-500 rounded-tr-none' },
  { id: 'bubble_34', type: 'bubble', name: { ar: 'مصفوفة', en: 'Matrix' }, price: 900, currency: 'diamonds', previewClass: 'bg-black text-green-500 font-mono border border-green-800 rounded-tr-none' },
  { id: 'bubble_35', type: 'bubble', name: { ar: 'رعب', en: 'Horror' }, price: 700, currency: 'diamonds', previewClass: 'bg-red-950 text-red-500 font-serif border border-red-900 rounded-tr-none' },
  { id: 'bubble_36', type: 'bubble', name: { ar: 'رسمي', en: 'Formal' }, price: 500, currency: 'coins', previewClass: 'bg-slate-800 text-slate-200 font-serif border-l-4 border-slate-400 rounded-none' },
  { id: 'bubble_37', type: 'bubble', name: { ar: 'مربع', en: 'Square' }, price: 200, currency: 'coins', previewClass: 'bg-indigo-600 text-white rounded-none' },
  { id: 'bubble_38', type: 'bubble', name: { ar: 'دائري', en: 'Round' }, price: 300, currency: 'coins', previewClass: 'bg-teal-600 text-white rounded-3xl' },
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
