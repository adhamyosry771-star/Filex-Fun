import React from 'react';
import { X, User as UserIcon, MessageSquare, Gift, BadgeCheck } from 'lucide-react';
import { User, Language, RoomSeat } from '../types';

interface UserProfileModalProps {
  user: User | RoomSeat; // Can be a partial user from seat
  currentUser: User;
  onClose: () => void;
  onMessage: () => void;
  onGift: () => void;
  language: Language;
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({ user, currentUser, onClose, onMessage, onGift, language }) => {
  const isMe = 'uid' in user && user.uid === currentUser.uid;
  const isOfficial = ('id' in user && user.id === 'OFFECAL') || ('userId' in user && user.userId === 'OFFECAL');
  
  const userName = 'name' in user ? user.name : user.userName;
  const userAvatar = 'avatar' in user ? user.avatar : user.userAvatar;
  const userId = 'id' in user ? user.id : (user as RoomSeat).userId; // Seat uses 'userId' which is the displayID or UID depending on logic, but usually displayID in this app version

  const t = (key: string) => {
    const dict: Record<string, { ar: string, en: string }> = {
      message: { ar: 'مراسلة', en: 'Message' },
      gift: { ar: 'إهداء', en: 'Send Gift' },
      profile: { ar: 'الملف الشخصي', en: 'Profile' }
    };
    return dict[key][language];
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
            <div className="w-24 h-24 rounded-full p-1 bg-gray-900 relative">
                <img src={userAvatar || ''} className="w-full h-full rounded-full object-cover border-4 border-gray-900" />
                {isOfficial && (
                     <div className="absolute bottom-0 right-0 bg-white rounded-full p-1 shadow-md">
                        <BadgeCheck className="w-5 h-5 text-blue-500 fill-blue-100" />
                     </div>
                )}
            </div>
            
            <h2 className="text-xl font-bold text-white mt-3 flex items-center gap-2">
                {userName}
                {isOfficial && <BadgeCheck className="w-5 h-5 text-blue-500 fill-white" />}
            </h2>
            <p className="text-gray-400 text-sm font-mono mt-1">ID: {userId}</p>

            {/* Actions */}
            {!isMe && (
                <div className="flex w-full gap-3 mt-8">
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
            )}
        </div>
      </div>
    </div>
  );
};

export default UserProfileModal;