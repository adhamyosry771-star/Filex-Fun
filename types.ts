
export enum ViewState {
  HOME = 'HOME',
  ROOM = 'ROOM',
  LEADERBOARD = 'LEADERBOARD',
  PROFILE = 'PROFILE',
  STORE = 'STORE',
  WALLET = 'WALLET',
  MESSAGES = 'MESSAGES',
  VIP = 'VIP',
  ADMIN = 'ADMIN',
  GAMES = 'GAMES',
  SEARCH = 'SEARCH',
  PRIVATE_CHAT = 'PRIVATE_CHAT',
  AGENCY = 'AGENCY'
}

export type Language = 'ar' | 'en';

export interface Wallet {
  diamonds: number;
  coins: number;
}

export interface FriendRequest {
  uid: string;
  name: string;
  avatar: string;
  timestamp: number;
}

export interface User {
  uid?: string;
  id: string;
  name: string;
  avatar: string;
  level: number;
  diamondsSpent?: number;
  diamondsReceived?: number; // For Charm Level
  vip: boolean;
  vipLevel?: number;
  country?: string;
  age?: number;
  gender?: 'male' | 'female';
  wallet?: Wallet;
  equippedFrame?: string;
  equippedBubble?: string;
  ownedItems?: string[];
  friendsCount?: number;
  followersCount?: number;
  followingCount?: number;
  visitorsCount?: number;
  isAdmin?: boolean;
  adminRole?: 'super_admin' | 'admin' | null;
  isBanned?: boolean;
  banExpiresAt?: number; // Timestamp for when ban ends
  isPermanentBan?: boolean; // Flag for permanent ban
  isAgent?: boolean;
  agencyBalance?: number;
}

export interface Notification {
  id: string;
  type: 'system' | 'official';
  title: string;
  body: string;
  timestamp: number;
  read: boolean;
}

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  text: string;
  isSystem?: boolean;
  isGift?: boolean;
  giftType?: 'static' | 'animated'; // New field to identify gift type
  giftIcon?: string; // To render the animation
  timestamp: number;
  frameId?: string;
  bubbleId?: string;
  vipLevel?: number;
  adminRole?: 'super_admin' | 'admin' | null;
}

export interface PrivateMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: number;
  read: boolean;
}

export interface PrivateChatSummary {
  chatId: string;
  otherUserUid: string;
  otherUserName: string;
  otherUserAvatar: string;
  lastMessage: string;
  lastMessageTime: number;
  unreadCount: number;
}

export interface RoomSeat {
  index: number;
  userId: string | null;
  userName: string | null;
  userAvatar: string | null;
  isMuted: boolean;
  isLocked: boolean;
  giftCount: number;
  adminRole?: 'super_admin' | 'admin' | null;
}

export interface Contributor {
  userId: string;
  name: string;
  avatar: string;
  amount: number;
}

export interface Room {
  id: string;
  displayId: string;
  title: string;
  description?: string;
  hostName: string;
  hostAvatar: string;
  hostId: string;
  viewerCount: number;
  thumbnail: string; // Outer Cover
  backgroundImage?: string; // Inner Background
  tags: string[];
  isAiHost: boolean;
  seats: RoomSeat[]; 
  isBanned?: boolean;
  isHot?: boolean;
  isOfficial?: boolean;
  contributors?: Record<string, Contributor>;
  bannedUsers?: string[]; // Array of User IDs (UIDs) banned from this room
  admins?: string[]; // Array of User IDs (UIDs) who are room admins
}

export interface Banner {
  id: string;
  imageUrl: string;
  title?: string;
  link?: string;
  timestamp: number;
}

export interface Gift {
  id: string;
  name: string;
  icon: string;
  cost: number;
  type: 'static' | 'animated';
  animationClass?: string; // CSS class for animation
}

export interface StoreItem {
  id: string;
  type: 'frame' | 'bubble';
  name: { ar: string, en: string };
  price: number;
  currency: 'diamonds' | 'coins';
  previewClass: string;
}

export interface VipTier {
  level: number;
  name: { ar: string, en: string };
  color: string;
  textColor: string;
  badge: string;
  discount: number;
  price: number;
  features: { ar: string[], en: string[] };
}

export interface Game {
  id: string;
  name: { ar: string, en: string };
  icon: string;
  bgImage: string;
}
