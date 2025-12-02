
import React, { useState, useEffect } from 'react';
import { Home, Trophy, User as UserIcon, Users, PlusCircle, Copy, MessageSquare, Loader2, ChevronRight, Crown, ShoppingBag, Wallet as WalletIcon, Settings, Gem, Coins, Edit3, Zap, X, Trash2, Shield, Info, Smartphone, Star, Gamepad2, BadgeCheck, Database } from 'lucide-react';
import HomeView from './components/HomeView';
import { RoomView } from './components/RoomView';
import LoginView from './components/LoginView';
import InfoView from './components/InfoView';
import StoreView from './components/StoreView';
import WalletView from './components/WalletView';
import MessagesView from './components/MessagesView';
import VipView from './components/VipView';
import GamesView from './components/GamesView';
import AvatarSelector from './components/AvatarSelector';
import MiniRoomPlayer from './components/MiniRoomPlayer';
import AdminDashboard from './components/AdminDashboard';
import SearchView from './components/SearchView';
import PrivateChatView from './components/PrivateChatView';
import AgencyView from './components/AgencyView';
import { ViewState, Room, User, Language, PrivateChatSummary } from './types';
import { auth } from './firebaseConfig';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { getUserProfile, createUserProfile, logoutUser, listenToRooms, updateUserProfile, listenToUserProfile, listenToChatList, initiatePrivateChat, searchUserByDisplayId, incrementViewerCount, adminUpdateUser, listenToUnreadNotifications, listenToFriendRequests } from './services/firebaseService';
import { CURRENT_USER, STORE_ITEMS, VIP_TIERS, ADMIN_ROLES, LEVEL_ICONS, CHARM_ICONS } from './constants';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.HOME);
  const [activeRoom, setActiveRoom] = useState<Room | null>(null);
  const [minimizedRoom, setMinimizedRoom] = useState<Room | null>(null);
  const [language, setLanguage] = useState<Language>('ar');
  const [rooms, setRooms] = useState<Room[]>([]);
  
  const [authUser, setAuthUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  
  const [showAvatarEdit, setShowAvatarEdit] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSupport, setShowSupport] = useState(false);

  const [activeChat, setActiveChat] = useState<PrivateChatSummary | null>(null);
  
  const [unreadChatsCount, setUnreadChatsCount] = useState(0);
  const [unreadNotifsCount, setUnreadNotifsCount] = useState(0);
  const [unreadRequestsCount, setUnreadRequestsCount] = useState(0);
  
  const totalUnread = unreadChatsCount + unreadNotifsCount + unreadRequestsCount;

  useEffect(() => {
    if (isGuest) {
        setIsLoading(false);
        return; 
    }

    let profileUnsubscribe: (() => void) | null = null;
    let chatsUnsubscribe: (() => void) | null = null;
    let notifsUnsubscribe: (() => void) | null = null;
    let requestsUnsubscribe: (() => void) | null = null;

    const authUnsubscribe = onAuthStateChanged(auth, async (user) => {
      setIsLoading(true);
      
      if (profileUnsubscribe) { profileUnsubscribe(); profileUnsubscribe = null; }
      if (chatsUnsubscribe) { chatsUnsubscribe(); chatsUnsubscribe = null; }
      if (notifsUnsubscribe) { notifsUnsubscribe(); notifsUnsubscribe = null; }
      if (requestsUnsubscribe) { requestsUnsubscribe(); requestsUnsubscribe = null; }

      if (user) {
        setAuthUser(user);
        
        profileUnsubscribe = listenToUserProfile(user.uid, async (profile) => {
            if (profile) {
                 if (profile.isBanned) {
                    if (!profile.isPermanentBan && profile.banExpiresAt && profile.banExpiresAt < Date.now()) {
                        await adminUpdateUser(user.uid, { isBanned: false, banExpiresAt: 0, isPermanentBan: false });
                    } else {
                        const dateStr = profile.banExpiresAt ? new Date(profile.banExpiresAt).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US') : '';
                        const banMsg = profile.isPermanentBan 
                            ? (language === 'ar' ? "⛔ تم حظر حسابك بشكل دائم من قبل الإدارة." : "⛔ Your account has been permanently banned.")
                            : (language === 'ar' ? `⚠️ حسابك محظور مؤقتاً.\nسيتم رفع الحظر في: ${dateStr}` : `⚠️ Account Suspended.\nBan expires on: ${dateStr}`);
                        
                        alert(banMsg);
                        logoutUser();
                        setAuthUser(null);
                        setUserProfile(null);
                        setIsLoading(false);
                        return;
                    }
                }
                setUserProfile(profile);
                setIsOnboarding(false);
            } else {
                setUserProfile(null);
                setIsOnboarding(true);
            }
            setIsLoading(false);
        });

        chatsUnsubscribe = listenToChatList(user.uid, (chats) => {
            const count = chats.reduce((acc, chat) => acc + (chat.unreadCount || 0), 0);
            setUnreadChatsCount(count);
        });

        notifsUnsubscribe = listenToUnreadNotifications(user.uid, (count) => {
            setUnreadNotifsCount(count);
        });

        requestsUnsubscribe = listenToFriendRequests(user.uid, (reqs) => {
            setUnreadRequestsCount(reqs.length);
        });

      } else {
        setAuthUser(null);
        setUserProfile(null);
        setIsOnboarding(false);
        setIsLoading(false);
        setUnreadChatsCount(0);
        setUnreadNotifsCount(0);
        setUnreadRequestsCount(0);
      }
    });

    return () => {
        authUnsubscribe();
        if (profileUnsubscribe) profileUnsubscribe();
        if (chatsUnsubscribe) chatsUnsubscribe();
        if (notifsUnsubscribe) notifsUnsubscribe();
        if (requestsUnsubscribe) requestsUnsubscribe();
    };
  }, [isGuest, language]);

  useEffect(() => {
    const unsubscribe = listenToRooms((updatedRooms) => {
        setRooms(updatedRooms);
    });
    return () => {
        if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleInfoComplete = async (data: { name: string; country: string; age: string; gender: 'male' | 'female', avatar: string }) => {
    if (!authUser) return;
    setIsLoading(true);
    try {
        await createUserProfile(authUser.uid, {
            name: data.name,
            country: data.country,
            age: parseInt(data.age),
            gender: data.gender,
            avatar: data.avatar || authUser.photoURL || 'https://picsum.photos/seed/new/200/200'
        });
    } catch (e) {
        setUserProfile(CURRENT_USER);
        setIsOnboarding(false);
    } finally {
        setIsLoading(false);
    }
  };

  const handleUpdateAvatar = async (newUrl: string) => {
      if (authUser && userProfile) {
          const updated = { ...userProfile, avatar: newUrl };
          setUserProfile(updated);
          try {
             if (!isGuest) {
                 await updateUserProfile(authUser.uid, { avatar: newUrl });
             }
          } catch (e: any) {
          }
      }
  };

  const handleGuestLogin = () => {
      setIsGuest(true);
      setUserProfile(CURRENT_USER);
      setIsLoading(false);
  };

  const handleJoinRoom = async (room: Room) => {
    if (userProfile && userProfile.uid && room.bannedUsers && room.bannedUsers[userProfile.uid]) {
        const expiry = room.bannedUsers[userProfile.uid];
        if (expiry === -1 || expiry > Date.now()) {
            alert(language === 'ar' ? 'لقد تم طردك من الغرفة' : 'You are banned from entering this room');
            return;
        }
    }
    setActiveRoom(room);
    setMinimizedRoom(null); 
    setCurrentView(ViewState.ROOM);
    await incrementViewerCount(room.id);
  };

  const handleRoomAction = async (action: 'minimize' | 'leave' | 'chat', data?: any) => {
      if (action === 'chat' && data) {
          await handleStartPrivateChat(data);
          setMinimizedRoom(activeRoom); 
      } else if (action === 'minimize') {
          setMinimizedRoom(activeRoom);
          setCurrentView(ViewState.HOME);
      } else {
          setActiveRoom(null);
          setMinimizedRoom(null);
          setCurrentView(ViewState.HOME);
      }
  };

  const handleStartPrivateChat = async (targetDisplayId: string) => {
      if (!userProfile?.uid) return;
      
      const targetUser = await searchUserByDisplayId(targetDisplayId);
      if (!targetUser || !targetUser.uid) {
          alert("User not found for chat");
          return;
      }
      
      const chatSummary = await initiatePrivateChat(userProfile.uid, targetUser.uid, targetUser);
      if (chatSummary) {
          setActiveChat(chatSummary);
          setCurrentView(ViewState.PRIVATE_CHAT);
      }
  };

  const handleMaximizeRoom = () => {
      if (activeRoom) {
          setMinimizedRoom(null);
          setCurrentView(ViewState.ROOM);
      } else if (minimizedRoom) {
          setActiveRoom(minimizedRoom);
          setMinimizedRoom(null);
          setCurrentView(ViewState.ROOM);
      }
  };

  const handleLogout = async () => {
    if (isGuest) {
        setIsGuest(false);
        setUserProfile(null);
        setAuthUser(null);
    } else {
        await logoutUser();
    }
    setCurrentView(ViewState.HOME);
  };

  const handleClearCache = () => {
      const msg = language === 'ar' ? 'تم مسح الذاكرة المؤقتة بنجاح' : 'Cache cleared successfully';
      alert(msg);
  };

  const handleOpenChat = (chat: PrivateChatSummary) => {
      setActiveChat(chat);
      setCurrentView(ViewState.PRIVATE_CHAT);
  };

  const t = (key: string) => {
    const dict: Record<string, { ar: string, en: string }> = {
        home: { ar: 'الرئيسية', en: 'Home' },
        rank: { ar: 'ترتيب', en: 'Rank' },
        msgs: { ar: 'رسائل', en: 'Msgs' },
        me: { ar: 'أنا', en: 'Me' },
        wallet: { ar: 'المحفظة', en: 'Wallet' },
        store: { ar: 'المتجر', en: 'Store' },
        games: { ar: 'ألعاب', en: 'Games' },
        signOut: { ar: 'تسجيل خروج', en: 'Sign Out' },
        id: { ar: 'المعرف', en: 'ID' },
        lvl: { ar: 'مستوى', en: 'LVL' },
        vipLevel: { ar: 'مستوى VIP', en: 'VIP Level' },
        privilege: { ar: 'امتيازات', en: 'Privileges' },
        upgrade: { ar: 'ترقية', en: 'Upgrade' },
        friends: { ar: 'الأصدقاء', en: 'Friends' },
        followers: { ar: 'المتابعين', en: 'Followers' },
        following: { ar: 'المتابعة', en: 'Following' },
        visitors: { ar: 'الزوار', en: 'Visitors' },
        currentLevel: { ar: 'المستوى الحالي', en: 'Current Level' },
        nextLevel: { ar: 'المستوى التالي', en: 'Next Level' },
        expNeeded: { ar: 'تحتاج لإنفاق', en: 'Need to spend' },
        diamonds: { ar: 'ماسة', en: 'Diamonds' },
        reach: { ar: 'للوصول', en: 'to reach' },
        settings: { ar: 'الإعدادات', en: 'Settings' },
        support: { ar: 'مساعدة و دعم', en: 'Help & Support' },
        invite: { ar: 'دعوة أصدقاء', en: 'Invite Friends' },
        appVersion: { ar: 'إصدار التطبيق', en: 'App Version' },
        clearCache: { ar: 'مسح الذاكرة المؤقتة', en: 'Clear Cache' },
        privacy: { ar: 'إعدادات الخصوصية', en: 'Privacy Settings' },
        supportMsg: { ar: 'من فضلك توجه إلى روم خدمة العملاء الرسميه', en: 'Please go to the official Customer Service room.' },
        ok: { ar: 'حسناً', en: 'OK' },
        admin: { ar: 'لوحة التحكم', en: 'Admin Panel' },
        agency: { ar: 'لوحة الوكالة', en: 'Agency Dashboard' }
    };
    return dict[key][language];
  };

  const getLevelInfo = (diamondsSpent: number = 0) => {
      let level = 1;
      let requiredForNext = 100; 

      for (let i = 1; i < 100; i++) {
          const threshold = Math.pow(i, 3) * 100; 
          if (diamondsSpent >= threshold) {
              level = i;
          } else {
              requiredForNext = threshold;
              break;
          }
      }
      
      const prevThreshold = level === 1 ? 0 : Math.pow(level - 1, 3) * 100;
      const progress = ((diamondsSpent - prevThreshold) / (requiredForNext - prevThreshold)) * 100;
      
      return { level, progress: Math.min(Math.max(progress, 0), 100), remaining: requiredForNext - diamondsSpent };
  };

  const getIconByLevel = (level: number, type: 'wealth' | 'charm') => {
      const icons = type === 'wealth' ? LEVEL_ICONS : CHARM_ICONS;
      const iconObj = [...icons].reverse().find(i => level >= i.min);
      return iconObj || icons[0];
  };

  const renderContent = () => {
    switch (currentView) {
      case ViewState.HOME:
        return <HomeView rooms={rooms} onJoinRoom={handleJoinRoom} language={language} userProfile={userProfile} onSearch={() => setCurrentView(ViewState.SEARCH)} />;
      
      case ViewState.ROOM:
        return null;
      
      case ViewState.SEARCH:
        return userProfile ? <SearchView language={language} onBack={() => setCurrentView(ViewState.HOME)} currentUser={userProfile} /> : <div />;
      
      case ViewState.GAMES:
        return userProfile ? <GamesView language={language} onBack={() => setCurrentView(ViewState.HOME)} user={userProfile} /> : <div />;

      case ViewState.MESSAGES:
        return <MessagesView language={language} onOpenChat={handleOpenChat} />;

      case ViewState.PRIVATE_CHAT:
        if (!activeChat || !userProfile) return <div />;
        return <PrivateChatView language={language} onBack={() => setCurrentView(ViewState.MESSAGES)} currentUser={userProfile} chatSummary={activeChat} />;

      case ViewState.AGENCY:
        return userProfile ? (
            <AgencyView
                user={userProfile}
                language={language}
                onBack={() => setCurrentView(ViewState.PROFILE)}
            />
        ) : <div />;

      case ViewState.STORE:
        return userProfile ? (
            <StoreView 
                user={userProfile} 
                language={language} 
                onBack={() => setCurrentView(ViewState.PROFILE)}
                onUpdateUser={(updated) => setUserProfile(updated)}
            />
        ) : <div />;

      case ViewState.WALLET:
        return userProfile ? (
            <WalletView 
                user={userProfile} 
                language={language} 
                onBack={() => setCurrentView(ViewState.PROFILE)}
            />
        ) : <div />;

      case ViewState.VIP:
        return userProfile ? (
            <VipView 
                user={userProfile} 
                language={language} 
                onBack={() => setCurrentView(ViewState.PROFILE)}
                onUpdateUser={(updated) => setUserProfile(updated)}
            />
        ) : <div />;

      case ViewState.ADMIN:
        if (userProfile?.id === 'OFFECAL') {
            return <AdminDashboard onBack={() => setCurrentView(ViewState.PROFILE)} language={language} />;
        }
        return <div />;
      
      case ViewState.PROFILE:
        if (!userProfile) return <div></div>;
        
        const frameItem = STORE_ITEMS.find(i => i.id === userProfile.equippedFrame);
        const frameClass = frameItem?.previewClass || '';
        const vipLvl = userProfile.vipLevel || 0;
        const vipInfo = VIP_TIERS.find(t => t.level === vipLvl);
        const isEmperor = vipLvl === 8 || userProfile.isAdmin;
        const isOfficial = userProfile.id === 'OFFECAL' || userProfile.isAdmin;
        const isCustomId = isNaN(Number(userProfile.id));
        const adminRole = userProfile.adminRole;

        const wealthInfo = getLevelInfo(userProfile.diamondsSpent || 0);
        const charmInfo = getLevelInfo(userProfile.diamondsReceived || 0);

        const wealthIcon = getIconByLevel(wealthInfo.level, 'wealth');
        const charmIcon = getIconByLevel(charmInfo.level, 'charm');

        const isOwner = userProfile.id === 'OFFECAL';

        return (
          <div className="h-full bg-gray-900 text-white overflow-y-auto pb-24 relative font-sans">
            <div className="relative pt-10 pb-12 px-4 flex flex-col items-center glass-card rounded-b-[3rem] mb-4 border-b border-white/5">
                 <button 
                    onClick={() => setShowSettings(true)}
                    className="absolute top-4 right-4 text-white p-2 rounded-full hover:bg-white/10"
                 >
                    <Settings className="w-6 h-6 text-brand-300" />
                 </button>
                 
                 <div onClick={() => setShowAvatarEdit(true)} className="relative mb-3 group cursor-pointer z-10">
                    <div className={`w-32 h-32 rounded-full relative p-[3px] ${frameClass}`}>
                        <img src={userProfile.avatar} className="w-full h-full rounded-full object-cover border-4 border-gray-900" alt="Profile" />
                    </div>
                    <div className="absolute bottom-1 right-1 bg-brand-600 rounded-full p-1.5 shadow-lg border-2 border-gray-900">
                        <Edit3 className="w-4 h-4 text-white" />
                    </div>
                 </div>
                 
                 <h2 className={`text-2xl font-black flex items-center gap-2 mt-2 ${isEmperor ? 'text-red-500 animate-pulse drop-shadow-[0_0_10px_rgba(239,68,68,0.8)] tracking-wide' : 'text-white'}`}>
                    {userProfile.name}
                    {isOfficial && <BadgeCheck className="w-5 h-5 text-blue-500 fill-white" />}
                 </h2>

                 <div className="flex items-center gap-2 mt-1">
                    {adminRole && (
                       <div className={`text-[10px] font-bold px-3 py-0.5 rounded-full border ${ADMIN_ROLES[adminRole].class}`}>
                           {ADMIN_ROLES[adminRole].name[language]}
                       </div>
                    )}
                    {vipLvl > 0 && (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold shadow ${vipInfo?.color} text-white`}>
                            {vipInfo?.badge} VIP {vipLvl}
                        </span>
                    )}
                 </div>
                 
                 <div className="flex flex-wrap justify-center items-center gap-3 mt-4">
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold text-white shadow-md ${wealthIcon.color}`}>
                        <span>{wealthIcon.icon}</span>
                        <span>Lv.{wealthInfo.level}</span>
                    </div>

                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold text-white shadow-md ${charmIcon.color}`}>
                        <span>{charmIcon.icon}</span>
                        <span>Lv.{charmInfo.level}</span>
                    </div>

                    <span className={`px-3 py-1 rounded-full text-xs flex items-center gap-1 border ${isCustomId ? 'bg-gradient-to-r from-yellow-600 to-yellow-400 text-black font-black border-yellow-200' : 'bg-black/40 border-white/10 text-brand-300'}`}>
                        {t('id')}: {userProfile.id} <Copy className="w-3 h-3 cursor-pointer" />
                    </span>
                 </div>
            </div>

            <div className="flex justify-around items-center w-full px-4 py-4 glass mb-4">
                {[
                    { label: t('friends'), count: userProfile.friendsCount || 0 },
                    { label: t('followers'), count: userProfile.followersCount || 0 },
                    { label: t('following'), count: userProfile.followingCount || 0 },
                    { label: t('visitors'), count: userProfile.visitorsCount || 0 },
                ].map((stat, idx) => (
                    <div key={idx} className="flex flex-col items-center cursor-pointer hover:opacity-80 transition group">
                        <span className="text-lg font-bold text-white group-hover:text-brand-400 transition">{stat.count}</span>
                        <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">{stat.label}</span>
                    </div>
                ))}
            </div>

            <div className="px-4 space-y-4">
                
                <div className="glass-card rounded-2xl p-5 relative overflow-hidden bg-gray-800">
                    <div className="flex justify-between items-end mb-2 relative z-10">
                         <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-600 to-brand-800 flex items-center justify-center text-white font-black text-lg shadow-inner border border-white/10">
                                {wealthIcon.icon}
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-white">{t('currentLevel')} {wealthInfo.level}</h3>
                                <p className="text-[10px] text-gray-400">
                                    {t('expNeeded')} <span className="text-brand-400 font-bold">{wealthInfo.remaining.toLocaleString()}</span> {t('diamonds')}
                                </p>
                            </div>
                         </div>
                    </div>
                    <div className="h-2.5 w-full bg-black/50 rounded-full overflow-hidden border border-white/5 relative z-10">
                        <div className="h-full bg-gradient-to-r from-brand-500 via-accent-500 to-brand-300 transition-all duration-1000" style={{ width: `${wealthInfo.progress}%` }}></div>
                    </div>
                </div>

                <div 
                    onClick={() => setCurrentView(ViewState.VIP)}
                    className={`w-full rounded-2xl p-5 ${vipInfo?.color || 'bg-gray-800'} shadow-lg relative overflow-hidden group border border-white/10 cursor-pointer transition hover:scale-[1.02]`}
                >
                    <div className="relative z-10 flex justify-between items-start">
                        <div>
                             <h3 className={`font-black text-2xl italic ${vipInfo?.textColor || 'text-white'} flex items-center gap-2 drop-shadow-md`}>
                                <Crown className={`w-6 h-6 ${vipLvl > 0 ? 'fill-current' : ''}`} />
                                {vipInfo?.name[language] || 'VIP CLUB'}
                             </h3>
                             <p className="text-white/70 text-xs mt-1 font-medium">
                                {vipLvl > 0 ? `${t('privilege')} Unlocked` : 'Join the Elite'}
                             </p>
                        </div>
                        <div className="glass px-3 py-1.5 rounded-full text-white text-[10px] font-bold">
                            {t('upgrade')}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div onClick={() => setCurrentView(ViewState.WALLET)} className="glass-card rounded-2xl p-4 flex flex-col justify-between hover:border-brand-500/50 transition cursor-pointer relative overflow-hidden group">
                        <div className="flex items-center gap-2 mb-4 z-10">
                            <div className="p-2 bg-brand-500/20 rounded-lg text-brand-400"><WalletIcon className="w-5 h-5" /></div>
                            <span className="font-bold text-sm text-white">{t('wallet')}</span>
                        </div>
                        <div className="space-y-2 z-10">
                            <div className="flex items-center justify-between text-xs bg-black/30 p-2 rounded-lg">
                                <span className="text-brand-400">💎</span>
                                <span className="font-bold text-white">{userProfile.wallet?.diamonds?.toLocaleString() || 0}</span>
                            </div>
                        </div>
                    </div>
                    <div onClick={() => setCurrentView(ViewState.STORE)} className="glass-card rounded-2xl p-4 flex flex-col justify-between hover:border-accent-500/50 transition cursor-pointer relative overflow-hidden group">
                        <div className="flex items-center gap-2 mb-4 z-10">
                            <div className="p-2 bg-accent-500/20 rounded-lg text-accent-400"><ShoppingBag className="w-5 h-5" /></div>
                            <span className="font-bold text-sm text-white">{t('store')}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-2 pl-2 z-10">
                             <span className="text-xs text-gray-400">New Items</span>
                        </div>
                    </div>
                </div>

                <div className="glass-card rounded-2xl overflow-hidden mb-6 bg-gray-800/50">
                    {isOwner && (
                        <div onClick={() => setCurrentView(ViewState.ADMIN)} className="p-4 border-b border-white/5 flex justify-between items-center bg-red-900/10 hover:bg-red-900/20 transition cursor-pointer group">
                            <div className="flex items-center gap-3"><Shield className="w-5 h-5 text-red-500 transition group-hover:scale-110" /><span className="text-sm font-bold text-red-400">{t('admin')}</span></div>
                            <ChevronRight className="w-4 h-4 text-red-500 rtl:rotate-180" />
                        </div>
                    )}
                    {userProfile.isAgent && (
                        <div onClick={() => setCurrentView(ViewState.AGENCY)} className="p-4 border-b border-white/5 flex justify-between items-center bg-blue-900/10 hover:bg-blue-900/20 transition cursor-pointer group">
                            <div className="flex items-center gap-3"><Database className="w-5 h-5 text-blue-500 transition group-hover:scale-110" /><span className="text-sm font-bold text-blue-400">{t('agency')}</span></div>
                            <ChevronRight className="w-4 h-4 text-blue-500 rtl:rotate-180" />
                        </div>
                    )}
                    <div className="p-4 border-b border-white/5 flex justify-between items-center hover:bg-white/5 transition cursor-pointer group">
                        <div className="flex items-center gap-3"><Users className="w-5 h-5 text-accent-400 transition group-hover:scale-110" /><span className="text-sm font-medium text-gray-200">{t('invite')}</span></div>
                        <ChevronRight className="w-4 h-4 text-gray-600 rtl:rotate-180" />
                    </div>
                    <div onClick={() => setShowSupport(true)} className="p-4 border-b border-white/5 flex justify-between items-center hover:bg-white/5 transition cursor-pointer group">
                        <div className="flex items-center gap-3"><MessageSquare className="w-5 h-5 text-blue-400 transition group-hover:scale-110" /><span className="text-sm font-medium text-gray-200">{t('support')}</span></div>
                        <ChevronRight className="w-4 h-4 text-gray-600 rtl:rotate-180" />
                    </div>
                    <div onClick={() => setShowSettings(true)} className="p-4 border-b border-white/5 flex justify-between items-center hover:bg-white/5 transition cursor-pointer group">
                        <div className="flex items-center gap-3"><Settings className="w-5 h-5 text-brand-400 transition group-hover:scale-110" /><span className="text-sm font-medium text-gray-200">{t('settings')}</span></div>
                        <ChevronRight className="w-4 h-4 text-gray-600 rtl:rotate-180" />
                    </div>
                    <div onClick={handleLogout} className="p-4 flex justify-center items-center hover:bg-red-900/10 transition cursor-pointer mt-2 border-t border-white/5">
                         <span className="text-sm font-bold text-red-500 hover:text-red-400 transition">{t('signOut')}</span>
                    </div>
                </div>
            </div>

            {showAvatarEdit && <AvatarSelector currentAvatar={userProfile.avatar} language={language} onSelect={handleUpdateAvatar} onClose={() => setShowAvatarEdit(false)} />}
            
            {showSettings && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="w-full max-w-sm glass-card rounded-3xl overflow-hidden shadow-2xl">
                        <div className="p-4 border-b border-white/10 flex justify-between items-center">
                            <h3 className="text-white font-bold">{t('settings')}</h3>
                            <button onClick={() => setShowSettings(false)} className="text-gray-400"><X className="w-5 h-5"/></button>
                        </div>
                        <div className="p-4 space-y-4">
                            <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                                <span className="text-sm text-gray-300">{t('appVersion')}</span>
                                <span className="text-xs text-gray-500 font-mono">v1.2.0</span>
                            </div>
                             <div onClick={handleClearCache} className="flex items-center justify-between p-3 bg-white/5 rounded-xl cursor-pointer hover:bg-white/10">
                                <div className="flex items-center gap-3"><Trash2 className="w-5 h-5 text-red-400"/><span className="text-sm text-gray-200">{t('clearCache')}</span></div>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl cursor-pointer hover:bg-white/10">
                                <div className="flex items-center gap-3"><Shield className="w-5 h-5 text-blue-400"/><span className="text-sm text-gray-200">{t('privacy')}</span></div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {showSupport && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="w-full max-w-sm glass-card rounded-3xl p-6 text-center">
                        <Smartphone className="w-8 h-8 text-brand-400 mx-auto mb-4" />
                        <p className="text-gray-300 mb-6">{t('supportMsg')}</p>
                        <button onClick={() => setShowSupport(false)} className="w-full bg-brand-600 text-white font-bold py-3 rounded-xl">{t('ok')}</button>
                    </div>
                </div>
            )}
          </div>
        );

      default:
        return <HomeView rooms={rooms} onJoinRoom={handleJoinRoom} language={language} userProfile={userProfile} onSearch={() => setCurrentView(ViewState.SEARCH)} />;
    }
  };

  if (isLoading) return <div className="w-full h-[100dvh] bg-gray-900 flex items-center justify-center"><Loader2 className="w-10 h-10 text-brand-500 animate-spin" /></div>;
  if (!authUser && !isGuest) return <LoginView language={language} setLanguage={setLanguage} onGuestLogin={handleGuestLogin} />;
  if (isOnboarding && !isGuest) return <InfoView onComplete={handleInfoComplete} language={language} />;

  return (
    <div dir={language === 'ar' ? 'rtl' : 'ltr'} className={`w-full h-[100dvh] bg-gray-900 overflow-hidden flex flex-col font-sans relative`}>
      <main className="flex-1 overflow-hidden relative z-10">
        {activeRoom && (
            <div className={`absolute inset-0 w-full h-full z-20 ${currentView === ViewState.ROOM ? 'block' : 'hidden'}`}>
                <RoomView 
                    room={activeRoom} 
                    currentUser={userProfile || CURRENT_USER}
                    onAction={handleRoomAction} 
                    language={language} 
                />
            </div>
        )}
        
        <div className={`w-full h-full ${currentView === ViewState.ROOM ? 'hidden' : 'block'}`}>
            {renderContent()}
        </div>

        {((activeRoom && currentView !== ViewState.ROOM) || (minimizedRoom && !activeRoom)) && (
            <MiniRoomPlayer 
                room={activeRoom || minimizedRoom!} 
                onMaximize={handleMaximizeRoom} 
                onClose={() => { setActiveRoom(null); setMinimizedRoom(null); }} 
            />
        )}
      </main>
      
      {currentView !== ViewState.ROOM && currentView !== ViewState.PRIVATE_CHAT && currentView !== ViewState.STORE && currentView !== ViewState.WALLET && currentView !== ViewState.VIP && currentView !== ViewState.ADMIN && currentView !== ViewState.GAMES && currentView !== ViewState.SEARCH && currentView !== ViewState.AGENCY && (
        <nav className="h-[80px] bg-gray-900 border-t border-white/5 flex justify-around items-center px-2 pb-2 z-50 relative safe-pb">
          <button onClick={() => setCurrentView(ViewState.HOME)} className={`flex flex-col items-center p-2 rounded-lg transition ${currentView === ViewState.HOME ? 'text-brand-500' : 'text-gray-500'}`}><Home className="w-6 h-6" /><span className="text-[10px] mt-1 font-bold">{t('home')}</span></button>
          
          <button onClick={() => setCurrentView(ViewState.GAMES)} className={`flex flex-col items-center p-2 rounded-lg transition ${currentView === ViewState.GAMES ? 'text-accent-500' : 'text-gray-500'}`}><Gamepad2 className="w-6 h-6" /><span className="text-[10px] mt-1 font-bold">{t('games')}</span></button>
          
          <div className="relative -top-6">
              <button className="w-16 h-16 bg-gradient-to-br from-brand-500 to-accent-500 rounded-full flex items-center justify-center shadow-lg border-4 border-gray-900 hover:scale-105 transition">
                  <PlusCircle className="w-8 h-8 text-white" />
              </button>
          </div>
          
          <button onClick={() => setCurrentView(ViewState.MESSAGES)} className={`flex flex-col items-center p-2 rounded-lg transition ${currentView === ViewState.MESSAGES ? 'text-brand-500' : 'text-gray-500'} relative`}>
              <MessageSquare className="w-6 h-6" />
              <span className="text-[10px] mt-1 font-bold">{t('msgs')}</span>
              {totalUnread > 0 && (
                  <div className="absolute top-1 right-3 min-w-[16px] h-[16px] bg-red-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-gray-900 animate-pulse z-20 px-1">
                      {totalUnread > 99 ? '99+' : totalUnread}
                  </div>
              )}
          </button>
          <button onClick={() => setCurrentView(ViewState.PROFILE)} className={`flex flex-col items-center p-2 rounded-lg transition ${currentView === ViewState.PROFILE ? 'text-brand-500' : 'text-gray-500'}`}><UserIcon className="w-6 h-6" /><span className="text-[10px] mt-1 font-bold">{t('me')}</span></button>
        </nav>
      )}
    </div>
  );
};

export default App;
