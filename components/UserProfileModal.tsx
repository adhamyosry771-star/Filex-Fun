
import React, { useState, useEffect } from 'react';
import { X, User as UserIcon, MessageSquare, Gift, BadgeCheck, Loader2, Shield, MicOff, Ban, UserCog, UserMinus, Maximize2 } from 'lucide-react';
import { User, Language, RoomSeat } from '../types';
import { searchUserByDisplayId, getUserProfile } from '../services/firebaseService';
import { LEVEL_ICONS, CHARM_ICONS, ADMIN_ROLES } from '../constants';

interface UserProfileModalProps {
  user: User | RoomSeat; // Can be a partial user from seat
  currentUser: User;
  onClose: () => void;
  onMessage: () => void;
  onGift: () => void;
  onKickSeat?: () => void;
  onBanUser?: () => void;
  onMakeAdmin?: () => void;
  onRemoveAdmin?: () => void;
  onOpenFullProfile: (user: User) => void;
  language: Language;
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({ user, currentUser, onClose, onMessage, onGift, onKickSeat, onBanUser, onMakeAdmin, onRemoveAdmin, onOpenFullProfile, language }) => {
  const [fullProfile, setFullProfile] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const initialUserName = 'name' in user ? user.name : user.userName;
  const initialUserAvatar = 'avatar' in user ? user.avatar : user.userAvatar;
  const targetId = 'id' in user ? user.id : (user as RoomSeat).userId;

  const isOfficial = targetId === 'OFFECAL';

  useEffect(() => {
    const fetchFullProfile = async () => {
        setIsLoading(true);
        // If we already have the wallet/stats info in the passed prop, use it directly
        if ('wallet' in user && 'diamondsSpent' in user) {
            setFullProfile(user as User);
            setIsLoading(false);
            return;
        }

        if (targetId) {
            // Try fetch by Display ID (RoomSeat usually stores Display ID)
            let found = await searchUserByDisplayId(targetId);
            
            // If not found, try UID (just in case)
            if (!found) {
                found = await getUserProfile(targetId);
            }
            
            if (found) setFullProfile(found);
        }
        setIsLoading(false);
    };
    fetchFullProfile();
  }, [user, targetId]);

  // Use fetched profile if available, else fallback to initial props
  const displayUser = fullProfile || user;
  const displayName = 'name' in displayUser ? displayUser.name : (displayUser as any).userName || initialUserName;
  const displayAvatar = 'avatar' in displayUser ? displayUser.avatar : (displayUser as any).userAvatar || initialUserAvatar;
  const displayId = 'id' in displayUser ? displayUser.id : targetId;
  const adminRole = fullProfile ? fullProfile.adminRole : (user as any).adminRole;
  const isProfileMe = fullProfile ? fullProfile.uid === currentUser.uid : (currentUser.id === displayId);

  // Level Logic
  const getLevel = (amount: number = 0) => {
      let level = 1;
      for (let i = 1; i < 100; i++) {
          const threshold = Math.pow(i, 3) * 100; 
          if (amount >= threshold) level = i;
          else break;
      }
      return level;
  };

  const wealthLevel = getLevel(fullProfile?.diamondsSpent || 0);
  const charmLevel = getLevel(fullProfile?.diamondsReceived || 0);

  const wealthIcon = [...LEVEL_ICONS].reverse().find(i => wealthLevel >= i.min) || LEVEL_ICONS[0];
  const charmIcon = [...CHARM_ICONS].reverse().find(i => charmLevel >= i.min) || CHARM_ICONS[0];

  const t = (key: string) => {
    const dict: Record<string, { ar: string, en: string }> = {
      message: { ar: 'مراسلة', en: 'Message' },
      gift: { ar: 'إهداء', en: 'Send Gift' },
      profile: { ar: 'الملف الشخصي', en: 'Profile' },
      loading: { ar: 'جاري التحميل...', en: 'Loading...' },
      kickSeat: { ar: 'طرد من المايك', en: 'Kick Seat' },
      banRoom: { ar: 'حظر من الروم', en: 'Ban Room' },
      makeAdmin: { ar: 'تعيين مشرف', en: 'Make Admin' },
      removeAdmin: { ar: 'إزالة مشرف', en: 'Remove Admin' }
    };
    return dict[key][language];
  };

  const handleAvatarClick = () => {
      if (fullProfile) {
          onOpenFullProfile(fullProfile);
      } else {
          // If profile not fully loaded yet, construct a temporary one
          // This ensures the view opens even if data is partial
          const tempUser: any = {
              ...user,
              id: displayId,
              name: displayName,
              avatar: displayAvatar,
              // Fallback fields
              receivedGifts: {} 
          };
          onOpenFullProfile(tempUser as User);
      }
  };

  return (
    <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in zoom-in-95">
      <div className="w-full max-w-sm bg-gray-900 border border-gray-700 rounded-3xl overflow-hidden shadow-2xl relative">
        
        {/* Close Button */}
        <button onClick={onClose} className="absolute top-4 right-4 z-20 p-2 bg-black/30 rounded-full text-white hover:bg-black/50">
          <X className="w-5 h-5" />
        </button>

        {/* Cover / Header */}
        <div className="h-32 bg-gradient-to-r from-brand-600 to-accent-600 relative"></div>

        {/* Avatar & Info */}
        <div className="px-6 pb-6 -mt-12 flex flex-col items-center">
            <div 
                className="w-24 h-24 rounded-full p-1 bg-gray-900 relative cursor-pointer group"
                onClick={handleAvatarClick}
            >
                <img src={displayAvatar || ''} className="w-full h-full rounded-full object-cover border-4 border-gray-900 transition group-hover:opacity-80" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-300">
                    <Maximize2 className="w-8 h-8 text-white drop-shadow-md" />
                </div>
                {isOfficial && (
                     <div className="absolute bottom-0 right-0 bg-white rounded-full p-1 shadow-md">
                        <BadgeCheck className="w-5 h-5 text-blue-500 fill-blue-100" />
                     </div>
                )}
            </div>
            
            <h2 className="text-xl font-bold text-white mt-3 flex items-center gap-2">
                {displayName}
                {isOfficial && <BadgeCheck className="w-5 h-5 text-blue-500 fill-white" />}
            </h2>
            <p className="text-gray-400 text-sm font-mono mt-1">ID: {displayId}</p>

            {/* Badges / Levels Container */}
            <div className="flex flex-col items-center gap-2 mt-3 w-full">
                {isLoading ? (
                    <div className="flex items-center gap-2 text-gray-500 text-xs">
                        <Loader2 className="w-3 h-3 animate-spin"/> {t('loading')}
                    </div>
                ) : (
                    <>
                        {/* Row 1: Wealth & Charm */}
                        <div className="flex gap-2">
                            {/* Wealth Badge */}
                            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-white shadow-md ${wealthIcon.color}`}>
                                <span>{wealthIcon.icon}</span>
                                <span>Lv.{wealthLevel}</span>
                            </div>

                            {/* Charm Badge */}
                            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-white shadow-md ${charmIcon.color}`}>
                                <span>{charmIcon.icon}</span>
                                <span>Lv.{charmLevel}</span>
                            </div>
                        </div>

                        {/* Row 2: Admin Badge (If exists) */}
                        {adminRole && (
                            <div className={`px-3 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1 ${ADMIN_ROLES[adminRole].class}`}>
                                <Shield className="w-3 h-3" />
                                {ADMIN_ROLES[adminRole].name[language]}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Actions */}
            {!isProfileMe && (
                <div className="w-full mt-8 space-y-3">
                    <div className="flex gap-3">
                        <button 
                            onClick={onMessage}
                            className="flex-1 py-3 bg-brand-600 rounded-xl text-white font-bold flex items-center justify-center gap-2 hover:bg-brand-500 transition shadow-lg shadow-brand-500/20"
                        >
                            <MessageSquare className="w-5 h-5" />
                            {t('message')}
                        </button>
                        <button 
                            onClick={onGift}
                            className="flex-1 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl text-white font-bold flex items-center justify-center gap-2 hover:opacity-90 transition shadow-lg shadow-orange-500/20"
                        >
                            <Gift className="w-5 h-5" />
                            {t('gift')}
                        </button>
                    </div>

                    {/* Admin Assignment */}
                    {(onMakeAdmin || onRemoveAdmin) && (
                        <div className="pt-2">
                            {onRemoveAdmin ? (
                                <button onClick={onRemoveAdmin} className="w-full py-2 bg-red-900/50 border border-red-500/50 text-red-300 rounded-xl text-xs font-bold hover:bg-red-900 flex items-center justify-center gap-2">
                                    <UserMinus className="w-4 h-4"/> {t('removeAdmin')}
                                </button>
                            ) : (
                                <button onClick={onMakeAdmin} className="w-full py-2 bg-blue-900/50 border border-blue-500/50 text-blue-300 rounded-xl text-xs font-bold hover:bg-blue-900 flex items-center justify-center gap-2">
                                    <UserCog className="w-4 h-4"/> {t('makeAdmin')}
                                </button>
                            )}
                        </div>
                    )}

                    {/* Host/Admin Actions (Kick/Ban) */}
                    {(onKickSeat || onBanUser) && (
                        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-700">
                            {onKickSeat && (
                                <button 
                                    onClick={onKickSeat} 
                                    className="py-2 rounded-xl border border-red-500 text-red-500 font-bold text-xs flex items-center justify-center gap-1 hover:bg-red-500/10"
                                >
                                    <MicOff className="w-4 h-4" /> {t('kickSeat')}
                                </button>
                            )}
                            {onBanUser && (
                                <button 
                                    onClick={onBanUser} 
                                    className="py-2 rounded-xl bg-red-600 text-white font-bold text-xs flex items-center justify-center gap-1 hover:bg-red-700 col-span-1"
                                    style={{ gridColumn: !onKickSeat ? 'span 2' : 'auto' }}
                                >
                                    <Ban className="w-4 h-4" /> {t('banRoom')}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default UserProfileModal;
