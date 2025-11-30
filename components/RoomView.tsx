
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, Heart, Share2, Gift as GiftIcon, Users, Crown, Mic, MicOff, Lock, Unlock, Settings, Image as ImageIcon, X, Info, Minimize2, LogOut, BadgeCheck, Loader2, Upload, Shield, Trophy, Bot, Volume2, VolumeX, Megaphone } from 'lucide-react';
import { Room, ChatMessage, Gift, Language, User, RoomSeat } from '../types';
import { GIFTS, STORE_ITEMS, ROOM_BACKGROUNDS, VIP_TIERS, ADMIN_ROLES } from '../constants';
import { listenToMessages, sendMessage, takeSeat, leaveSeat, updateRoomDetails, sendGiftTransaction, toggleSeatLock, toggleSeatMute, decrementViewerCount, listenToRoom } from '../services/firebaseService';
import { joinVoiceChannel, leaveVoiceChannel, toggleMicMute, publishMicrophone, unpublishMicrophone, toggleAllRemoteAudio } from '../services/agoraService';
import { generateAiHostResponse } from '../services/geminiService';
import UserProfileModal from './UserProfileModal';
import RoomLeaderboard from './RoomLeaderboard';

interface RoomViewProps {
  room: Room;
  currentUser: User;
  onAction: (action: 'minimize' | 'leave' | 'chat', data?: any) => void;
  language: Language;
}

export const RoomView: React.FC<RoomViewProps> = ({ room: initialRoom, currentUser, onAction, language }) => {
  // Use local state to track room updates in real-time (seats, contributors, etc.)
  const [room, setRoom] = useState<Room>(initialRoom);
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [showGiftPanel, setShowGiftPanel] = useState(false);
  const [showRoomSettings, setShowRoomSettings] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [showUserList, setShowUserList] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  
  const [selectedUser, setSelectedUser] = useState<RoomSeat | null>(null);
  const [seatToConfirm, setSeatToConfirm] = useState<number | null>(null);
  const [loadingSeatIndex, setLoadingSeatIndex] = useState<number | null>(null);
  const [giftTarget, setGiftTarget] = useState<'all' | 'me' | string>('all'); 
  const [floatingHearts, setFloatingHearts] = useState<{id: number, left: number}[]>([]);
  
  const [editTitle, setEditTitle] = useState(room.title);
  const [editDesc, setEditDesc] = useState(room.description || '');
  
  // Audio State
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);

  // AI Host Toggle
  const [isAiEnabled, setIsAiEnabled] = useState(room.isAiHost || false);

  // Loading States
  const [isSendingGift, setIsSendingGift] = useState(false);

  // Entry Effect
  const [entryMessage, setEntryMessage] = useState<string | null>(null);

  const [joinTimestamp] = useState<number>(Date.now());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Refs for stable callbacks
  const currentUserRef = useRef(currentUser);
  useEffect(() => { currentUserRef.current = currentUser; }, [currentUser]);

  const isHost = room.hostId === currentUser.id;
  const seats = room.seats || Array(11).fill(null).map((_, i) => ({ index: i, userId: null, giftCount: 0 }));

  // --- LISTEN TO ROOM UPDATES (REAL-TIME LEADERBOARD & SEATS) ---
  useEffect(() => {
      const unsubscribe = listenToRoom(initialRoom.id, (updatedRoom) => {
          if (updatedRoom) {
              setRoom(updatedRoom);
              // Sync local edit states if needed, or keep them independent while editing
              if (!showRoomSettings) {
                  setEditTitle(updatedRoom.title);
                  setEditDesc(updatedRoom.description || '');
                  setIsAiEnabled(updatedRoom.isAiHost || false);
              }
          } else {
              // Room deleted
              onAction('leave');
          }
      });
      return () => unsubscribe();
  }, [initialRoom.id, onAction, showRoomSettings]);


  // --- AGORA AUDIO LOGIC (REAL VOICE INTEGRATION) ---
  
  // 1. Join Room as Audience (Listener) on mount
  useEffect(() => {
      const uid = currentUserRef.current.uid || currentUserRef.current.id;
      // Connect to Agora immediately to hear others
      if (uid) {
          joinVoiceChannel(room.id, uid);
      }
      
      // Cleanup on unmount (leave room)
      return () => {
          leaveVoiceChannel();
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room.id]); 

  // 2. Handle Seat Changes (Switch between Audience <-> Speaker)
  useEffect(() => {
      const mySeat = seats.find(s => s.userId === currentUser.id);
      
      if (mySeat) {
          // User is in a seat -> Become Speaker
          publishMicrophone(mySeat.isMuted);
          
          if (loadingSeatIndex === mySeat.index) {
              setLoadingSeatIndex(null);
          }
      } else {
          // User is NOT in a seat -> Become Audience (Stop publishing, keep listening)
          unpublishMicrophone();
      }
  }, [seats, currentUser.id, loadingSeatIndex]);

  // 3. Handle Local Mute State updates from seat
  useEffect(() => {
      const mySeat = seats.find(s => s.userId === currentUser.id);
      if (mySeat) {
          toggleMicMute(mySeat.isMuted);
      }
  }, [seats, currentUser.id]);

  // --- AI HOST LOGIC ---
  useEffect(() => {
      if (!isHost || !isAiEnabled || messages.length === 0) return;

      const lastMsg = messages[messages.length - 1];
      const isRecent = Date.now() - lastMsg.timestamp < 10000; 
      if (!isRecent || lastMsg.userId === 'AI_HOST' || lastMsg.userId === currentUser.id) return;

      const triggerAiResponse = async () => {
          try {
              await new Promise(r => setTimeout(r, 2000));
              const aiText = await generateAiHostResponse(
                  lastMsg.text,
                  room.title + (room.description ? `: ${room.description}` : ''),
                  lastMsg.userName
              );

              const aiMsg: ChatMessage = {
                  id: Date.now().toString(),
                  userId: 'AI_HOST',
                  userName: 'AI Assistant 🤖',
                  userAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Felix',
                  text: aiText,
                  timestamp: Date.now(),
                  vipLevel: 0
              };
              await sendMessage(room.id, aiMsg);
          } catch (e) { console.error("AI Host Error:", e); }
      };
      triggerAiResponse();
  }, [messages, isHost, isAiEnabled, room.id, currentUser.id]);


  const t = (key: string) => {
    const dict: Record<string, { ar: string, en: string }> = {
      placeholder: { ar: 'اكتب رسالة...', en: 'Type a message...' },
      pinned: { ar: 'أهلاً بك في فليكس فن! يرجى الالتزام بالاحترام المتبادل.', en: 'Welcome to Flex Fun!' },
      appRules: { 
          ar: 'مرحباً في Flex Fun! 🛡️ يرجى الالتزام بالاحترام المتبادل. ممنوع السب، الشتم، أو الكلام المسيء. نحن مجتمع راقٍ للمتعة والتواصل. 🌟', 
          en: 'Welcome to Flex Fun! 🛡️ Please maintain mutual respect. No insults, cursing, or abusive language. We are a classy community for fun & connection. 🌟' 
      },
      roomInfo: { ar: 'وصف الغرفة:', en: 'Room Info:' },
      sendTo: { ar: 'إرسال إلى:', en: 'Send to:' },
      everyone: { ar: 'الجميع', en: 'Everyone' },
      me: { ar: 'نفسي', en: 'Myself' },
      noFunds: { ar: 'لا يوجد رصيد كافٍ', en: 'Insufficient Balance' },
      host: { ar: 'المضيف', en: 'Host' },
      exitTitle: { ar: 'مغادرة الغرفة', en: 'Exit Room' },
      minimize: { ar: 'تصغير (احتفاظ)', en: 'Minimize' },
      leave: { ar: 'خروج نهائي', en: 'Leave Room' },
      confirmSeat: { ar: 'هل تريد الصعود للمايك؟', en: 'Take this seat?' },
      yes: { ar: 'نعم', en: 'Yes' },
      cancel: { ar: 'إلغاء', en: 'Cancel' },
      lockedMsg: { ar: 'هذا المقعد مغلق من قبل المضيف', en: 'This seat is locked by the host' },
      lock: { ar: 'قفل', en: 'Lock' },
      unlock: { ar: 'فتح القفل', en: 'Unlock' },
      loginReq: { ar: 'يرجى تسجيل الدخول أولاً', en: 'Please login first' },
      roomSettings: { ar: 'إعدادات الغرفة', en: 'Room Settings' },
      roomDesc: { ar: 'وصف الغرفة / القوانين', en: 'Room Rules / Description' },
      save: { ar: 'حفظ', en: 'Save' },
      roomTitle: { ar: 'اسم الغرفة', en: 'Room Title' },
      banned: { ar: 'تم حظر هذه الغرفة من قبل الإدارة', en: 'Room Banned by Admin' },
      welcome: { ar: 'مرحباً بك في الغرفة!', en: 'Welcome to the room!' },
      activeUsers: { ar: 'المتصلين الآن', en: 'Online Users' },
      uploadBg: { ar: 'رفع خلفية', en: 'Upload Background' },
      aiHost: { ar: 'المضيف الذكي', en: 'AI Host' },
      aiHostDesc: { ar: 'تفعيل الرد التلقائي الذكي على الرسائل', en: 'Enable smart AI auto-reply to chat' }
    };
    return dict[key][language];
  };

  useEffect(() => {
     if (room.isBanned) {
         alert(t('banned'));
         onAction('leave');
     }
  }, [room.isBanned]);

  useEffect(() => {
      setEntryMessage(`${t('welcome')} ${currentUser.name}`);
      const timer = setTimeout(() => setEntryMessage(null), 3000);
      return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
     if (!room || !room.id) return;
     const unsubscribe = listenToMessages(room.id, (realTimeMsgs) => {
         const newMsgs = realTimeMsgs.filter(m => m.timestamp > joinTimestamp);
         setMessages(newMsgs);
     });
     return () => {
         if (unsubscribe) unsubscribe();
     };
  }, [room?.id, joinTimestamp]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar || 'https://picsum.photos/200', 
      text: inputValue,
      timestamp: Date.now(),
      frameId: currentUser.equippedFrame || null, 
      bubbleId: currentUser.equippedBubble || null,
      vipLevel: currentUser.vipLevel || 0,
      adminRole: currentUser.adminRole || null
    };
    setInputValue('');
    try {
        await sendMessage(room.id, userMsg);
    } catch (e: any) { }
  };

  const handleSendGift = async (gift: Gift) => {
    if (isSendingGift) return;
    
    if (!currentUser.uid || currentUser.uid === 'guest') {
        alert(t('loginReq'));
        return;
    }

    const userBalance = currentUser.wallet?.diamonds || 0;
    if (userBalance < gift.cost) {
        alert(t('noFunds'));
        return;
    }

    setIsSendingGift(true);

    let targetName = t('everyone');
    let targetSeatIndex = 0; 

    if (giftTarget === 'me') {
        targetName = t('me');
        const mySeat = seats.find(s => s.userId === currentUser.id);
        if (mySeat) targetSeatIndex = mySeat.index;
    } else if (giftTarget !== 'all') {
        const targetSeat = seats.find(s => s.userId === giftTarget);
        if (targetSeat) {
            targetName = targetSeat.userName || 'User';
            targetSeatIndex = targetSeat.index;
        }
    }

    try {
        // Here we pass currentUser to record them as a contributor
        await sendGiftTransaction(room.id, currentUser.uid, targetSeatIndex, gift.cost);
        
        const giftMsg: ChatMessage = {
          id: Date.now().toString(),
          userId: currentUser.id,
          userName: currentUser.name,
          userAvatar: currentUser.avatar || 'https://picsum.photos/200',
          text: `Sent ${gift.name} ${gift.icon} to ${targetName} x1`,
          isGift: true,
          timestamp: Date.now(),
          frameId: currentUser.equippedFrame || null,
          vipLevel: currentUser.vipLevel || 0,
          adminRole: currentUser.adminRole || null
        };
        setShowGiftPanel(false);
        triggerFloatingHeart();
        await sendMessage(room.id, giftMsg);

    } catch (e: any) {
        const msg = typeof e === 'string' ? e : (e.message || '');
        if (msg === "Insufficient funds" || msg.includes("Insufficient funds")) {
            alert(t('noFunds'));
        }
    } finally {
        setIsSendingGift(false);
    }
  };

  const triggerFloatingHeart = () => {
    const id = Date.now();
    const left = Math.random() * 60 + 20;
    setFloatingHearts(prev => [...prev, { id, left }]);
    setTimeout(() => {
      setFloatingHearts(prev => prev.filter(h => h.id !== id));
    }, 2000);
  };

  const handleSeatClick = async (index: number, currentSeatUserId: string | null) => {
      const seat = seats.find(s => s.index === index);
      const isLocked = seat?.isLocked;

      if (currentSeatUserId) {
          if (seat) setSelectedUser(seat);
          return;
      }
      
      if (isLocked && !isHost) {
          alert(t('lockedMsg'));
          return;
      }
      setSeatToConfirm(index);
  };

  const confirmTakeSeat = async () => {
      if (seatToConfirm === null) return;
      const index = seatToConfirm;
      setSeatToConfirm(null); 
      setLoadingSeatIndex(index); 

      try {
          await takeSeat(room.id, index, currentUser);
      } catch (e: any) {
          setLoadingSeatIndex(null); 
          const msg = typeof e === 'string' ? e : (e.message || '');
          if (msg === 'Seat is locked') alert(t('lockedMsg'));
          else alert("Failed to take seat. Please try again.");
      }
  };

  const handleToggleLock = async () => {
      if (seatToConfirm !== null && isHost) {
          const seat = seats.find(s => s.index === seatToConfirm);
          if (seat) {
              await toggleSeatLock(room.id, seatToConfirm, !seat.isLocked);
              setSeatToConfirm(null);
          }
      }
  };

  const handleUpdateRoom = async (bg: string) => {
      await updateRoomDetails(room.id, { 
          title: editTitle, 
          thumbnail: bg, 
          description: editDesc,
          isAiHost: isAiEnabled 
      });
      setShowRoomSettings(false);
  };

  const handleLeaveRoomAction = async () => {
      await leaveSeat(room.id, currentUser);
      leaveVoiceChannel();
      await decrementViewerCount(room.id);
      onAction('leave');
  };

  const handleToggleMyMute = async () => {
      const mySeat = seats.find(s => s.userId === currentUser.id);
      if (mySeat) {
          await toggleSeatMute(room.id, mySeat.index, !mySeat.isMuted);
      }
  };

  const handleToggleSpeaker = () => {
      const newState = !isSpeakerMuted;
      setIsSpeakerMuted(newState);
      toggleAllRemoteAudio(newState);
  };

  const handleCustomBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
             if (typeof reader.result === 'string') {
                 handleUpdateRoom(reader.result);
             }
          };
          reader.readAsDataURL(file);
      }
  };

  const getFrameClass = (id?: string | null) => {
      if (!id) return 'border border-white/20';
      return STORE_ITEMS.find(i => i.id === id)?.previewClass || 'border border-white/20';
  };

  const getVipTextStyle = (level: number) => {
      const tier = VIP_TIERS.find(t => t.level === level);
      return tier ? tier.textColor : 'text-white';
  };

  const getAdminBadge = (role?: 'super_admin' | 'admin' | null) => {
      if (role === 'super_admin') return <div className="absolute -top-3 left-0 bg-red-600/90 text-[8px] px-1.5 py-0.5 rounded text-white font-bold border border-red-500 shadow-lg animate-pulse z-20">SUPER ADMIN</div>;
      if (role === 'admin') return <div className="absolute -top-3 left-0 bg-yellow-600/90 text-[8px] px-1.5 py-0.5 rounded text-white font-bold border border-yellow-500 shadow-lg z-20">ADMIN</div>;
      return null;
  };

  return (
    <div className="relative h-[100dvh] w-full bg-black flex flex-col overflow-hidden">
      
      {/* 1. ROOM BACKGROUND */}
      <div className="absolute inset-0 z-0">
        <img src={room.thumbnail} alt="Room" className="w-full h-full object-cover transition-opacity duration-700" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-black/90"></div>
      </div>

      {/* Entry Effect Overlay */}
      {entryMessage && (
          <div className="absolute top-24 left-0 right-0 z-40 flex justify-center animate-in fade-in slide-in-from-left duration-700 pointer-events-none">
              <div className="bg-gradient-to-r from-brand-600/80 to-accent-600/80 backdrop-blur-md px-6 py-2 rounded-full border border-white/20 shadow-lg flex items-center gap-2">
                   <span className="text-white font-bold text-sm">{entryMessage}</span>
                   <span className="text-xl">🚀</span>
              </div>
          </div>
      )}

      {/* 2. HEADER */}
      <div className="relative z-50 pt-safe-top px-4 pb-2 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-3">
            <button onClick={() => setShowExitModal(true)} className="p-2 bg-white/10 rounded-full hover:bg-white/20 backdrop-blur transition border border-white/5">
                <ArrowLeft className="w-5 h-5 rtl:rotate-180 text-white" />
            </button>
            <div className="flex items-center gap-2 bg-black/30 backdrop-blur px-2 py-1 rounded-xl border border-white/10">
                <div className="w-8 h-8 rounded-lg overflow-hidden border border-white/20 shadow-md">
                   <img src={room.thumbnail} className="w-full h-full object-cover" />
                </div>
                <div className="text-white drop-shadow-md pr-2">
                    <h2 className="font-bold text-xs truncate max-w-[100px]">{room.title}</h2>
                    <div className="text-[9px] text-gray-200 flex items-center gap-1">ID: {room.displayId || room.id.slice(-6)}</div>
                </div>
            </div>
        </div>
        <div className="flex gap-2">
            <button 
              onClick={() => setShowLeaderboard(true)} 
              className="bg-gradient-to-r from-yellow-600 to-yellow-400 backdrop-blur px-3 py-1.5 rounded-full text-xs font-black text-black flex items-center gap-1 border border-yellow-300 hover:scale-105 transition shadow-lg shadow-yellow-500/30"
            >
                <Trophy className="w-3 h-3 fill-black" />
                الكأس
            </button>

            {isHost && (
                <button onClick={() => setShowRoomSettings(true)} className="p-2 bg-white/10 rounded-full text-white backdrop-blur hover:bg-white/20 transition"><Settings className="w-4 h-4" /></button>
            )}
            <button onClick={() => setShowUserList(true)} className="bg-white/10 backdrop-blur px-3 py-1.5 rounded-full text-xs font-bold text-white flex items-center gap-1 border border-white/10 hover:bg-white/20 transition">
                <Users className="w-3 h-3" /> {room.viewerCount}
            </button>
        </div>
      </div>

      {/* 3. MIC GRID */}
      <div className="relative z-10 w-full px-2 pt-2 pb-2 flex-1 flex flex-col">
          {/* Host Seat (Index 0) */}
          <div className="flex justify-center mb-4">
             {seats.slice(0, 1).map((seat) => (
                 <div key={seat.index} className="flex flex-col items-center relative group">
                    <div onClick={() => handleSeatClick(seat.index, seat.userId)} className={`w-16 h-16 rounded-full border-2 ${seat.userId ? 'border-brand-500' : 'border-white/20 border-dashed'} flex items-center justify-center relative bg-black/40 backdrop-blur overflow-visible cursor-pointer transition transform hover:scale-105`}>
                         {getAdminBadge(seat.adminRole)}
                         {loadingSeatIndex === seat.index ? (
                             <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
                         ) : seat.userId ? (
                             <>
                                <img src={seat.userAvatar!} className="w-full h-full rounded-full object-cover" />
                                {!seat.isMuted && <div className="absolute inset-0 rounded-full border-2 border-brand-400 animate-ping opacity-50"></div>}
                                {seat.isMuted && <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center"><MicOff className="w-5 h-5 text-red-500"/></div>}
                                <div className="absolute -top-3 -right-1 bg-gradient-to-br from-yellow-300 to-yellow-600 p-1 rounded-full shadow-lg border border-white/20"><Crown className="w-3 h-3 text-white fill-white" /></div>
                             </>
                         ) : (<div className="text-gray-400 text-[10px] text-center">{t('host')}</div>)}
                    </div>
                    {/* Name Pill */}
                    {seat.userId && (
                        <div className="mt-1 max-w-[70px] truncate text-[9px] text-white/90 bg-white/10 border border-white/5 backdrop-blur-md px-2 py-0.5 rounded-full shadow-sm text-center flex justify-center items-center gap-1">
                            {seat.userId === 'OFFECAL' && <BadgeCheck className="w-3 h-3 text-blue-500 fill-white" />}
                            {seat.userName}
                        </div>
                    )}
                    {/* Gift Counter */}
                    <div className="mt-0.5 bg-black/50 backdrop-blur px-2 py-0.5 rounded-full text-[8px] text-yellow-300 border border-yellow-500/30 flex items-center gap-1">
                        <GiftIcon className="w-2 h-2" /> {seat.giftCount}
                    </div>
                 </div>
             ))}
          </div>

          {/* Guest Seats (1-10) */}
          <div className="grid grid-cols-5 gap-y-4 gap-x-2 justify-items-center">
             {seats.slice(1).map((seat) => (
                 <div key={seat.index} className="flex flex-col items-center w-full relative">
                    <div onClick={() => handleSeatClick(seat.index, seat.userId)} className={`w-12 h-12 rounded-full border ${seat.userId ? 'border-brand-400' : 'border-white/10 border-dashed'} flex items-center justify-center relative bg-black/30 backdrop-blur overflow-visible cursor-pointer transition transform hover:scale-105`}>
                        {getAdminBadge(seat.adminRole)}
                        {loadingSeatIndex === seat.index ? (
                             <Loader2 className="w-6 h-6 text-brand-500 animate-spin" />
                        ) : seat.userId ? (
                            <>
                                <img src={seat.userAvatar!} className="w-full h-full rounded-full object-cover" />
                                {!seat.isMuted && <div className="absolute inset-0 rounded-full border border-green-400 animate-ping opacity-40"></div>}
                                {seat.isMuted && <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center"><MicOff className="w-4 h-4 text-red-500"/></div>}
                            </>
                        ) : (
                            seat.isLocked ? <Lock className="w-4 h-4 text-red-400/70 animate-pulse animate-in zoom-in duration-300" key="locked" /> : <span className="text-white/20 text-[10px] font-bold" key="unlocked">{seat.index}</span>
                        )}
                    </div>
                    {/* Username Pill */}
                    <div className="mt-1 max-w-[55px] truncate text-[8px] text-white/90 bg-white/10 border border-white/5 backdrop-blur-md px-2 py-0.5 rounded-full shadow-sm text-center flex justify-center items-center gap-0.5">
                         {seat.userId === 'OFFECAL' && <BadgeCheck className="w-2 h-2 text-blue-500 fill-white" />}
                        {seat.userId ? seat.userName : (seat.isLocked ? t('lock') : '')}
                    </div>
                    {/* Gift Counter */}
                    <div className="mt-0.5 text-[7px] text-yellow-500 font-mono flex items-center gap-0.5">
                        {seat.giftCount > 0 && <><GiftIcon className="w-2 h-2"/> {seat.giftCount}</>}
                    </div>
                 </div>
             ))}
          </div>
      </div>

      {/* 4. CHAT AREA */}
      <div className="relative z-20 flex-1 flex flex-col min-h-[45%] bg-gradient-to-t from-black via-black/80 to-transparent">
          
          <div className="px-4 py-3 mx-4 mt-2 bg-brand-900/60 backdrop-blur border-l-4 border-brand-500 rounded-r-lg mb-2 shadow-sm animate-in fade-in flex flex-col gap-1">
              {/* System Pinned Message */}
              <div className="flex items-start gap-2 border-b border-white/10 pb-2 mb-1">
                  <Shield className="w-3 h-3 text-gold-400 mt-0.5 shrink-0" />
                  <p className="text-[10px] text-gold-100 font-bold leading-tight">
                      {t('appRules')}
                  </p>
              </div>
              {/* Room Description */}
              <div className="flex items-start gap-2">
                  <Info className="w-3 h-3 text-brand-400 mt-0.5 shrink-0" />
                  <p className="text-[10px] text-white/90 leading-tight line-clamp-2">
                      {room.description || t('pinned')}
                  </p>
              </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 space-y-2 scrollbar-hide pb-2 mask-image-gradient">
              {messages.map((msg) => {
                  const isMe = msg.userId === currentUser.id;
                  const isOfficial = msg.userId === 'OFFECAL' || (msg.userId === room.hostId && room.hostId === 'OFFECAL');
                  const isAi = msg.userId === 'AI_HOST';

                  if (msg.isGift) {
                      return (
                          <div key={msg.id} className="flex justify-center my-2 animate-pulse">
                              <div className="bg-gradient-to-r from-yellow-600/60 to-orange-600/60 text-white text-xs px-4 py-1.5 rounded-full border border-yellow-500/50 shadow-lg backdrop-blur font-bold flex items-center gap-2">
                                  <GiftIcon className="w-3 h-3 text-yellow-300" />
                                  <span className="text-yellow-200">{msg.userName}</span>
                                  <span>{msg.text.replace(/Sent .* to .* x1/, 'sent a gift')}</span>
                              </div>
                          </div>
                      );
                  }

                  return (
                      <div key={msg.id} className={`flex items-start gap-2 ${isMe ? 'flex-row-reverse' : ''} animate-in slide-in-from-bottom-2`}>
                          <div className={`relative w-8 h-8 shrink-0 p-[2px] rounded-full ${isAi ? 'border-2 border-brand-400 shadow-lg' : getFrameClass(msg.frameId)}`}>
                              <img src={msg.userAvatar} className="w-full h-full rounded-full object-cover" />
                              {isOfficial && <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-[1px]"><BadgeCheck className="w-3 h-3 text-blue-500 fill-blue-100" /></div>}
                              {isAi && <div className="absolute -bottom-1 -right-1 bg-black rounded-full p-[2px]"><Bot className="w-3 h-3 text-brand-400" /></div>}
                          </div>

                          <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[80%]`}>
                              <div className="flex items-center gap-1 mb-0.5 px-1 flex-wrap">
                                   {(msg.vipLevel || 0) > 0 && (
                                       <span className="bg-gradient-to-r from-gold-400 to-orange-500 text-black text-[8px] font-black px-1 rounded flex items-center shadow-sm">
                                           V{msg.vipLevel}
                                       </span>
                                   )}
                                   {msg.adminRole && (
                                       <span className={`text-[8px] px-1 rounded border flex items-center gap-0.5 ${msg.adminRole === 'super_admin' ? 'border-red-500 text-red-400 bg-red-900/30' : 'border-yellow-500 text-yellow-400 bg-yellow-900/30'}`}>
                                           <Shield className="w-2 h-2" /> {msg.adminRole === 'super_admin' ? 'SUPER ADMIN' : 'ADMIN'}
                                       </span>
                                   )}
                                   <span className={`text-[10px] font-bold flex items-center gap-1 ${getVipTextStyle(msg.vipLevel || 0)}`}>
                                       {msg.userName}
                                       {isOfficial && <BadgeCheck className="w-3 h-3 text-blue-500 fill-white inline" />}
                                       {isAi && <span className="text-[8px] bg-brand-600 text-white px-1 rounded">BOT</span>}
                                   </span>
                              </div>
                              <div className={`px-3 py-1.5 rounded-2xl text-xs leading-relaxed text-white shadow-sm break-words border border-white/5 backdrop-blur-md ${isMe ? 'bg-brand-600/60 rounded-tr-none' : 'bg-white/10 rounded-tl-none'}`}>
                                  {msg.text}
                              </div>
                          </div>
                      </div>
                  );
              })}
              <div ref={messagesEndRef} />
          </div>

          {floatingHearts.map((h) => (
              <Heart key={h.id} className="absolute bottom-20 w-6 h-6 text-pink-500 fill-pink-500 animate-float pointer-events-none z-50 drop-shadow-lg" style={{ left: `${h.left}%` }}/>
          ))}

          <div className="p-3 bg-black/60 backdrop-blur-md border-t border-white/10 flex items-center gap-3">
              <button 
                onClick={handleToggleMyMute}
                className={`p-2 rounded-full shadow-lg transition ${seats.find(s => s.userId === currentUser.id)?.isMuted ? 'bg-red-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
              >
                  {seats.find(s => s.userId === currentUser.id)?.isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
              
              {/* Speaker Toggle Button */}
              <button 
                onClick={handleToggleSpeaker}
                className={`p-2 rounded-full shadow-lg transition ${isSpeakerMuted ? 'bg-gray-700 text-gray-400' : 'bg-white/10 text-brand-400 hover:bg-white/20'}`}
              >
                  {isSpeakerMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>

              <button onClick={() => setShowGiftPanel(true)} disabled={isSendingGift} className="p-2 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-500/20 hover:scale-105 transition disabled:opacity-50"><GiftIcon className="w-5 h-5" /></button>
              <div className="flex-1 relative">
                  <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} placeholder={t('placeholder')} className={`w-full bg-white/10 border border-white/10 rounded-full py-2.5 px-4 text-sm text-white focus:border-brand-500 outline-none placeholder-gray-400 ${language === 'ar' ? 'text-right' : 'text-left'}`}/>
                  <button onClick={handleSendMessage} disabled={!inputValue.trim()} className="absolute right-2 top-1.5 p-1.5 bg-brand-600 rounded-full text-white disabled:opacity-0 transition hover:bg-brand-500 rtl:right-auto rtl:left-2"><Send className="w-3.5 h-3.5 rtl:rotate-180" /></button>
              </div>
              <button className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20"><Share2 className="w-5 h-5" /></button>
          </div>
      </div>

      {/* SETTINGS MODAL */}
      {showRoomSettings && isHost && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
              <div className="w-full max-w-sm bg-gray-900 border border-gray-700 rounded-2xl p-6 shadow-2xl">
                  <h3 className="text-white font-bold mb-4 text-lg border-b border-gray-700 pb-2">{t('roomSettings')}</h3>
                  <div className="space-y-4">
                      {/* AI Host Toggle */}
                      <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
                          <div className="flex items-center gap-2">
                              <div className="p-2 bg-brand-500/20 rounded-lg text-brand-400"><Bot className="w-5 h-5"/></div>
                              <div>
                                  <h4 className="text-sm font-bold text-white">{t('aiHost')}</h4>
                                  <p className="text-[10px] text-gray-400">{t('aiHostDesc')}</p>
                              </div>
                          </div>
                          <button 
                            onClick={() => setIsAiEnabled(!isAiEnabled)} 
                            className={`w-10 h-6 rounded-full p-1 transition ${isAiEnabled ? 'bg-brand-600' : 'bg-gray-700'}`}
                          >
                              <div className={`w-4 h-4 bg-white rounded-full transition-transform ${isAiEnabled ? 'translate-x-4' : 'translate-x-0'}`}></div>
                          </button>
                      </div>

                      <div>
                          <label className="text-xs text-gray-400 mb-1 block">{t('roomTitle')}</label>
                          <input 
                              type="text" 
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              className="w-full bg-black/40 border border-gray-700 rounded-xl p-3 text-white text-sm focus:border-brand-500 outline-none"
                          />
                      </div>
                      <div>
                          <label className="text-xs text-gray-400 mb-1 block">{t('roomDesc')}</label>
                          <textarea 
                              rows={3}
                              value={editDesc}
                              onChange={(e) => setEditDesc(e.target.value)}
                              className="w-full bg-black/40 border border-gray-700 rounded-xl p-3 text-white text-sm focus:border-brand-500 outline-none resize-none"
                              placeholder="Set rules or a welcome message..."
                          ></textarea>
                      </div>
                      <div>
                          <label className="text-xs text-gray-400 mb-2 block">Backgrounds</label>
                          <div className="grid grid-cols-4 gap-2">
                              {ROOM_BACKGROUNDS.slice(0, 4).map((bg, i) => (
                                  <button key={i} onClick={() => handleUpdateRoom(bg)} className="aspect-square rounded-lg border border-transparent hover:border-brand-500 overflow-hidden"><img src={bg} className="w-full h-full object-cover" /></button>
                              ))}
                              <label className="aspect-square rounded-lg border-2 border-dashed border-gray-600 flex flex-col items-center justify-center cursor-pointer hover:border-brand-500">
                                  <input type="file" className="hidden" accept="image/*" onChange={handleCustomBgUpload} />
                                  <Upload className="w-5 h-5 text-gray-500" />
                                  <span className="text-[7px] text-gray-500 mt-1">{t('uploadBg')}</span>
                              </label>
                          </div>
                      </div>
                  </div>
                  <div className="flex gap-3 mt-6">
                       <button onClick={() => setShowRoomSettings(false)} className="flex-1 py-3 bg-gray-800 text-gray-400 rounded-xl font-bold">{t('cancel')}</button>
                       <button onClick={() => handleUpdateRoom(room.thumbnail)} className="flex-1 py-3 bg-brand-600 text-white rounded-xl font-bold">{t('save')}</button>
                  </div>
              </div>
          </div>
      )}

      {showExitModal && (
          <div className="absolute inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in">
              <div className="w-full max-w-sm bg-gray-900 border border-gray-700 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl">
                   <h3 className="text-white font-bold text-lg mb-6 text-center">{t('exitTitle')}</h3>
                   <div className="space-y-3">
                       <button onClick={() => onAction('minimize')} className="w-full py-4 rounded-xl bg-gray-800 text-white font-bold flex items-center justify-center gap-3 hover:bg-gray-700 transition"><Minimize2 className="w-5 h-5 text-blue-400" />{t('minimize')}</button>
                       <button onClick={handleLeaveRoomAction} className="w-full py-4 rounded-xl bg-red-900/20 text-red-500 border border-red-900/50 font-bold flex items-center justify-center gap-3 hover:bg-red-900/30 transition"><LogOut className="w-5 h-5" />{t('leave')}</button>
                       <button onClick={() => setShowExitModal(false)} className="w-full py-3 text-gray-500 font-medium text-sm mt-2">{t('cancel')}</button>
                   </div>
              </div>
          </div>
      )}

      {/* GIFT PANEL AND USER LIST MODALS REMAIN UNCHANGED FOR BREVITY BUT ARE INCLUDED IN FULL FILE */}
      {showGiftPanel && (
          <div className="absolute inset-0 z-50 flex flex-col justify-end bg-black/50 backdrop-blur-sm animate-in slide-in-from-bottom-10">
              <div className="bg-gray-900 border-t border-gray-700 rounded-t-3xl p-4 shadow-2xl">
                  <div className="flex justify-between items-center mb-4 border-b border-gray-800 pb-2">
                      <div className="flex items-center gap-2">
                          <span className="text-gray-400 text-xs">{t('sendTo')}</span>
                          <select value={giftTarget} onChange={(e) => setGiftTarget(e.target.value)} className="bg-black border border-gray-700 text-white text-xs rounded px-2 py-1 outline-none focus:border-brand-500 max-w-[120px]">
                              <option value="all">{t('everyone')}</option>
                              <option value="me">{t('me')}</option>
                              {seats.filter(s => s.userId).map(s => (<option key={s.index} value={s.userId!}>{s.userName}</option>))}
                          </select>
                      </div>
                      <div className="flex items-center gap-1 bg-gray-800 px-3 py-1 rounded-full border border-gray-700"><span className="text-xs text-yellow-500">💎</span><span className="text-xs font-bold text-white">{currentUser.wallet?.diamonds || 0}</span></div>
                      <button onClick={() => setShowGiftPanel(false)}><X className="w-5 h-5 text-gray-500" /></button>
                  </div>
                  <div className="h-60 overflow-y-auto grid grid-cols-4 gap-3 pb-4">
                      {GIFTS.map(gift => (
                          <button 
                            key={gift.id} 
                            onClick={() => handleSendGift(gift)} 
                            disabled={isSendingGift}
                            className={`flex flex-col items-center p-2 rounded-xl border border-transparent transition relative group ${isSendingGift ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/5 hover:border-brand-500/50'}`}
                          >
                              <span className="text-3xl mb-1 filter drop-shadow-md group-hover:scale-110 transition">{gift.icon}</span>
                              <span className="text-[10px] text-gray-300 font-medium truncate w-full text-center">{gift.name}</span>
                              <div className="flex items-center gap-0.5 mt-1 bg-black/30 px-1.5 py-0.5 rounded text-[9px]"><span className="text-yellow-500">💎</span><span className="text-yellow-100 font-bold">{gift.cost}</span></div>
                          </button>
                      ))}
                  </div>
                  {isSendingGift && (
                      <div className="absolute inset-0 bg-black/50 rounded-t-3xl flex items-center justify-center z-50">
                          <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
                      </div>
                  )}
              </div>
          </div>
      )}

      {selectedUser && (
          <UserProfileModal 
              user={selectedUser}
              currentUser={currentUser}
              language={language}
              onClose={() => setSelectedUser(null)}
              onMessage={() => {
                  if (selectedUser.userId) {
                     onAction('chat', selectedUser.userId);
                     setSelectedUser(null);
                  }
              }}
              onGift={() => {
                  setGiftTarget(selectedUser.userId || 'all');
                  setSelectedUser(null);
                  setShowGiftPanel(true);
              }}
          />
      )}

      {showLeaderboard && (
          <RoomLeaderboard 
              contributors={room.contributors ? Object.values(room.contributors) : []} 
              onClose={() => setShowLeaderboard(false)}
              language={language}
          />
      )}

      {showUserList && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
              <div className="w-full max-w-sm bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden max-h-[60vh] flex flex-col">
                  <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-800/50">
                      <h3 className="font-bold text-white flex items-center gap-2">
                          <Users className="w-4 h-4 text-brand-400"/> {t('activeUsers')} ({seats.filter(s => s.userId).length})
                      </h3>
                      <button onClick={() => setShowUserList(false)}><X className="w-5 h-5 text-gray-500" /></button>
                  </div>
                  <div className="overflow-y-auto p-2 space-y-2 flex-1">
                      {seats.filter(s => s.userId).map(seat => (
                          <div key={seat.index} className="flex items-center gap-3 p-2 bg-gray-800/30 rounded-xl border border-transparent hover:border-gray-700">
                              <img src={seat.userAvatar!} className="w-10 h-10 rounded-full object-cover border border-gray-600" />
                              <div className="flex-1">
                                  <div className="flex items-center gap-1">
                                      <span className="text-sm text-white font-bold">{seat.userName}</span>
                                      {seat.userId === 'OFFECAL' && <BadgeCheck className="w-3 h-3 text-blue-500 fill-white" />}
                                  </div>
                                  <span className="text-[10px] text-gray-500">Seat #{seat.index} {seat.index === 0 ? '(Host)' : ''}</span>
                              </div>
                              {seat.giftCount > 0 && (
                                  <div className="text-yellow-500 text-xs font-mono font-bold flex items-center gap-1">
                                      <GiftIcon className="w-3 h-3" /> {seat.giftCount}
                                  </div>
                              )}
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      )}

      {seatToConfirm !== null && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6 animate-in fade-in">
              <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-xs p-5 shadow-2xl text-center">
                  <div className="w-16 h-16 bg-brand-900/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-brand-500/30"><Mic className="w-8 h-8 text-brand-400" /></div>
                  <h3 className="text-white font-bold mb-6">{t('confirmSeat')}</h3>
                  {isHost && (
                      <button onClick={handleToggleLock} className="w-full mb-3 py-3 rounded-xl bg-gray-800 text-gray-300 font-bold border border-gray-600 flex items-center justify-center gap-2">
                          {seats.find(s => s.index === seatToConfirm)?.isLocked ? <Unlock className="w-4 h-4"/> : <Lock className="w-4 h-4"/>}
                          {seats.find(s => s.index === seatToConfirm)?.isLocked ? t('unlock') : t('lock')}
                      </button>
                  )}
                  <div className="flex gap-3">
                      <button onClick={() => setSeatToConfirm(null)} className="flex-1 py-3 rounded-xl bg-gray-800 text-gray-400 font-bold hover:bg-gray-700">{t('cancel')}</button>
                      <button 
                        onClick={confirmTakeSeat} 
                        className="flex-1 py-3 rounded-xl bg-brand-600 text-white font-bold hover:bg-brand-500"
                      >
                        {t('yes')}
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
