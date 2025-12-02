
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, Heart, Share2, Gift as GiftIcon, Users, Crown, Mic, MicOff, Lock, Unlock, Settings, Image as ImageIcon, X, Info, Minimize2, LogOut, BadgeCheck, Loader2, Upload, Shield, Trophy, Bot, Volume2, VolumeX, ArrowDownCircle, Ban, Trash2, UserCog, UserMinus, Zap, BarChart3, Gamepad2, Clock } from 'lucide-react';
import { Room, ChatMessage, Gift, Language, User, RoomSeat } from '../types';
import { GIFTS, STORE_ITEMS, ROOM_BACKGROUNDS, VIP_TIERS, ADMIN_ROLES } from '../constants';
import { listenToMessages, sendMessage, takeSeat, leaveSeat, updateRoomDetails, sendGiftTransaction, toggleSeatLock, toggleSeatMute, decrementViewerCount, listenToRoom, kickUserFromSeat, banUserFromRoom, unbanUserFromRoom, removeRoomAdmin, addRoomAdmin, searchUserByDisplayId, enterRoom, exitRoom, listenToRoomViewers } from '../services/firebaseService';
import { joinVoiceChannel, leaveVoiceChannel, toggleMicMute, publishMicrophone, unpublishMicrophone, toggleAllRemoteAudio, listenToVolume } from '../services/agoraService';
import { generateAiHostResponse } from '../services/geminiService';
import UserProfileModal from './UserProfileModal';
import RoomLeaderboard from './RoomLeaderboard';
import FullProfileView from './FullProfileView';

interface RoomViewProps {
  room: Room;
  currentUser: User;
  onAction: (action: 'minimize' | 'leave' | 'chat', data?: any) => void;
  language: Language;
}

export const RoomView: React.FC<RoomViewProps> = ({ room: initialRoom, currentUser, onAction, language }) => {
  const [room, setRoom] = useState<Room>(initialRoom);
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  
  // Gift Panel State
  const [showGiftPanel, setShowGiftPanel] = useState(false);
  const [giftTab, setGiftTab] = useState<'static' | 'animated'>('static');
  const [selectedGift, setSelectedGift] = useState<Gift | null>(null);
  const [giftTarget, setGiftTarget] = useState<'all' | 'me' | string>('all'); 
  const [isSendingGift, setIsSendingGift] = useState(false);

  // Animation State
  const [activeAnimations, setActiveAnimations] = useState<{id: string, icon: string, class: string}[]>([]);

  // Join Notification State
  const [joinNotification, setJoinNotification] = useState<{name: string, id: string} | null>(null);

  const [showRoomSettings, setShowRoomSettings] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [showUserList, setShowUserList] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  
  const [selectedUser, setSelectedUser] = useState<RoomSeat | null>(null);
  const [fullProfileUser, setFullProfileUser] = useState<User | null>(null);

  const [seatToConfirm, setSeatToConfirm] = useState<number | null>(null);
  const [loadingSeatIndex, setLoadingSeatIndex] = useState<number | null>(null);
  const [floatingHearts, setFloatingHearts] = useState<{id: number, left: number}[]>([]);
  
  const [editTitle, setEditTitle] = useState(room.title);
  const [editDesc, setEditDesc] = useState(room.description || '');
  
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [isAiEnabled, setIsAiEnabled] = useState(room.isAiHost || false);

  const [settingsTab, setSettingsTab] = useState<'info' | 'background' | 'banned' | 'admins'>('info');
  const [bgType, setBgType] = useState<'inner' | 'outer'>('inner');

  // Ban Duration Modal State
  const [showBanDurationModal, setShowBanDurationModal] = useState(false);
  const [userToBan, setUserToBan] = useState<string | null>(null);

  // New: Active Viewer List State
  const [viewers, setViewers] = useState<User[]>([]);
  const viewersRef = useRef<User[]>([]);

  const [speakingUsers, setSpeakingUsers] = useState<Set<string>>(new Set());

  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const joinTimestamp = useRef(Date.now());
  const hasSentJoinMsg = useRef(false);

  const pendingKickSeats = useRef<Set<number>>(new Set());
  const pendingBannedUsers = useRef<Set<string>>(new Set());

  const currentUserRef = useRef(currentUser);
  useEffect(() => { currentUserRef.current = currentUser; }, [currentUser]);

  const isHost = room.hostId === currentUser.id;
  const isRoomAdmin = room.admins?.includes(currentUser.uid!);
  const canManageRoom = isHost || isRoomAdmin;

  const seats: RoomSeat[] = Array(11).fill(null).map((_, i) => {
      return (room.seats && room.seats[i]) ? room.seats[i] : { 
          index: i, 
          userId: null, 
          userName: null, 
          userAvatar: null, 
          isMuted: false, 
          isLocked: false, 
          giftCount: 0,
          frameId: null,
          adminRole: null
      };
  });

  const mySeat = seats.find(s => s.userId === currentUser.id);
  
  const isSeatedRef = useRef(false);
  useEffect(() => {
      isSeatedRef.current = !!mySeat;
  }, [mySeat]);

  const activeSeats = seats.filter(s => s.userId);

  useEffect(() => {
      const uid = currentUser.uid || currentUser.id;
      if (uid) {
          joinVoiceChannel(room.id, uid);
      }

      if (currentUser.uid) {
          enterRoom(room.id, currentUser);
      }

      return () => {
      };
  }, [room.id]);

  useEffect(() => {
      const unsub = listenToRoomViewers(room.id, (v) => {
          setViewers(v);
          viewersRef.current = v;
      });
      return () => unsub();
  }, [room.id]);

  useEffect(() => {
      listenToVolume((volumes) => {
          const speaking = new Set<string>();
          volumes.forEach(v => {
              if (v.level > 5) {
                  let authUid = String(v.uid);
                  if (v.uid === 0 && currentUserRef.current.uid) {
                      authUid = currentUserRef.current.uid;
                  }
                  
                  const viewer = viewersRef.current.find(u => u.uid === authUid);
                  if (viewer) {
                      speaking.add(viewer.id);
                  } else if (authUid === currentUserRef.current.uid) {
                      speaking.add(currentUserRef.current.id);
                  } else {
                      speaking.add(authUid);
                  }
              }
          });
          setSpeakingUsers(speaking);
      });
      return () => listenToVolume(() => {});
  }, []);

  useEffect(() => {
      if (hasSentJoinMsg.current || !room.id || !currentUser.uid) return;
      hasSentJoinMsg.current = true;

      const sendJoin = async () => {
          try {
              const msg: ChatMessage = {
                  id: Date.now().toString(),
                  userId: currentUser.id,
                  userName: currentUser.name,
                  userAvatar: currentUser.avatar,
                  text: 'JOINED_ROOM',
                  timestamp: Date.now(),
                  isJoin: true,
                  vipLevel: currentUser.vipLevel,
                  adminRole: currentUser.adminRole
              };
              await sendMessage(room.id, msg);
          } catch(e) {
              console.error("Join msg failed", e);
          }
      };
      sendJoin();
  }, [room.id, currentUser.uid]);

  useEffect(() => {
      const unsubscribe = listenToRoom(initialRoom.id, (updatedRoom) => {
          if (updatedRoom) {
              setRoom(prevRoom => {
                  const existingSeats = updatedRoom.seats || [];
                  const adjustedSeats = Array(11).fill(null).map((_, i) => existingSeats[i] || { 
                      index: i, 
                      userId: null, 
                      giftCount: 0,
                      isMuted: false, 
                      isLocked: false 
                  });

                  const newSeats = adjustedSeats.map(serverSeat => {
                      if (pendingKickSeats.current.has(serverSeat.index)) {
                          if (!serverSeat.userId) {
                              pendingKickSeats.current.delete(serverSeat.index);
                              return serverSeat;
                          }
                          return { ...serverSeat, userId: null, userName: null, userAvatar: null, giftCount: 0, adminRole: null, isMuted: false, frameId: null };
                      }
                      return serverSeat;
                  });

                  return { ...updatedRoom, seats: newSeats };
              });

              if (!showRoomSettings) {
                  setEditTitle(updatedRoom.title);
                  setEditDesc(updatedRoom.description || '');
                  setIsAiEnabled(updatedRoom.isAiHost || false);
              }

              // Check if I am banned
              const myUid = currentUser.uid!;
              if (updatedRoom.bannedUsers && updatedRoom.bannedUsers[myUid]) {
                  const expiry = updatedRoom.bannedUsers[myUid];
                  if (expiry === -1 || expiry > Date.now()) {
                      alert(language === 'ar' ? 'لقد تم طردك من الغرفة' : 'You have been kicked/banned from the room');
                      onAction('leave');
                  }
              }

          } else {
              onAction('leave');
          }
      });
      return () => unsubscribe();
  }, [initialRoom.id, onAction, showRoomSettings, currentUser.uid]);

  const mySeatIndex = mySeat?.index;
  const mySeatMuted = mySeat?.isMuted;
  const amISeated = !!mySeat;

  useEffect(() => {
      if (amISeated) {
          publishMicrophone(!!mySeatMuted).catch(err => {
              console.warn("Mic publish info:", err);
          });
          if (loadingSeatIndex === mySeatIndex) setLoadingSeatIndex(null);
      } else {
          if (loadingSeatIndex === null) {
              unpublishMicrophone().catch(err => console.warn("Mic unpublish info:", err));
          }
      }
  }, [amISeated, mySeatMuted, loadingSeatIndex]);

  useEffect(() => {
     if (!room || !room.id) return;
     joinTimestamp.current = Date.now();

     const unsubscribe = listenToMessages(room.id, (realTimeMsgs) => {
         const displayMessages = realTimeMsgs.filter(msg => 
             msg.timestamp >= joinTimestamp.current && !msg.isJoin
         );
         setMessages(displayMessages);

         const latestMsg = realTimeMsgs[realTimeMsgs.length - 1];
         const now = Date.now();

         if (latestMsg && (now - latestMsg.timestamp < 3000)) {
             if (latestMsg.isJoin && (!joinNotification || joinNotification.id !== latestMsg.id)) {
                 setJoinNotification({ name: latestMsg.userName, id: latestMsg.id });
                 setTimeout(() => setJoinNotification(null), 3000);
             }

             if (latestMsg.isGift && latestMsg.giftType === 'animated' && latestMsg.giftIcon) {
                 triggerAnimation(latestMsg.giftIcon, latestMsg.text.includes('Rocket') ? 'animate-fly-up' : 'animate-bounce-in');
             }
         }
     });
     return () => {
         if (unsubscribe) unsubscribe();
     };
  }, [room?.id]);

  const triggerAnimation = (icon: string, animationClass: string = 'animate-bounce-in') => {
      const id = Math.random().toString(36).substr(2, 9);
      setActiveAnimations(prev => [...prev, { id, icon, class: animationClass }]);
      setTimeout(() => {
          setActiveAnimations(prev => prev.filter(a => a.id !== id));
      }, 3000);
  };

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
          ar: 'مرحباً في Flex Fun! يرجى الالتزام بالاحترام المتبادل ممنوع السب، الشتم، او الكلام المسئ.', 
          en: 'Welcome to Flex Fun! Please maintain mutual respect. No insults, cursing, or abusive language.' 
      },
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
      roomSettings: { ar: 'إعدادات الغرفة', en: 'Room Settings' },
      roomDesc: { ar: 'وصف الغرفة / القوانين', en: 'Room Rules / Description' },
      save: { ar: 'حفظ', en: 'Save' },
      roomTitle: { ar: 'اسم الغرفة', en: 'Room Title' },
      activeUsers: { ar: 'المتصلين الآن', en: 'Online Users' },
      uploadBg: { ar: 'رفع صورة', en: 'Upload Image' },
      aiHost: { ar: 'المضيف الذكي', en: 'AI Host' },
      aiHostDesc: { ar: 'تفعيل الرد التلقائي الذكي على الرسائل', en: 'Enable smart AI auto-reply to chat' },
      cup: { ar: 'الكأس', en: 'Cup' },
      innerBg: { ar: 'خلفية الغرفة (الداخل)', en: 'Inner Background' },
      outerBg: { ar: 'غلاف الغرفة (خارج)', en: 'Outer Cover' },
      general: { ar: 'عام', en: 'General' },
      backgrounds: { ar: 'الخلفيات', en: 'Backgrounds' },
      banned: { ar: 'المحظورين', en: 'Banned Users' },
      admins: { ar: 'المشرفين', en: 'Admins' },
      leaveSeat: { ar: 'نزول', en: 'Leave Seat' },
      unban: { ar: 'فك الحظر', en: 'Unban' },
      kickSeat: { ar: 'طرد من المايك', en: 'Kick from Seat' },
      banRoom: { ar: 'طرد من الروم', en: 'Ban from Room' },
      makeAdmin: { ar: 'تعيين مشرف', en: 'Make Admin' },
      removeAdmin: { ar: 'إزالة مشرف', en: 'Remove Admin' },
      adminList: { ar: 'قائمة المشرفين', en: 'Admin List' },
      remove: { ar: 'إزالة', en: 'Remove' },
      onMic: { ar: 'على المايك', en: 'On Mic' },
      send: { ar: 'إرسال', en: 'Send' },
      sendTo: { ar: 'إرسال إلى:', en: 'Send to:' },
      everyone: { ar: 'الجميع', en: 'Everyone' },
      me: { ar: 'نفسي', en: 'Myself' },
      noFunds: { ar: 'لا يوجد رصيد كافٍ', en: 'Insufficient Balance' },
      static: { ar: 'كلاسيك', en: 'Classic' },
      animated: { ar: 'متحركة', en: 'Animated' },
      selectGift: { ar: 'اختر هدية', en: 'Select Gift' },
      welcome: { ar: 'مرحبا ب', en: 'Welcome' },
      entered: { ar: 'لقد دخل الغرفة', en: 'has entered the room' },
      banDuration: { ar: 'مدة الطرد', en: 'Ban Duration' },
      hour: { ar: 'ساعة', en: 'Hour' },
      day: { ar: 'يوم', en: 'Day' },
      week: { ar: 'اسبوع', en: 'Week' },
      permanent: { ar: 'دائم', en: 'Permanent' },
      confirmBan: { ar: 'تأكيد الطرد', en: 'Confirm Ban' }
    };
    return dict[key]?.[language] || key;
  };

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
    try { await sendMessage(room.id, userMsg); } catch (e) { }
  };

  const executeSendGift = async () => {
    if (!selectedGift) {
        alert(t('selectGift'));
        return;
    }
    if (isSendingGift) return;
    
    if (!currentUser.uid || currentUser.uid === 'guest') {
        alert("Please login first");
        return;
    }

    const userBalance = currentUser.wallet?.diamonds || 0;
    if (userBalance < selectedGift.cost) {
        alert(t('noFunds'));
        return;
    }

    setIsSendingGift(true);

    let targetName = t('everyone');
    let targetSeatIndex = 0; 

    if (giftTarget === 'me') {
        targetName = t('me');
        if (mySeat) targetSeatIndex = mySeat.index;
    } else if (giftTarget !== 'all') {
        const targetSeat = seats.find(s => s.userId === giftTarget);
        if (targetSeat) {
            targetName = targetSeat.userName || 'User';
            targetSeatIndex = targetSeat.index;
        }
    }

    try {
        await sendGiftTransaction(room.id, currentUser.uid, targetSeatIndex, selectedGift.cost, selectedGift.id);
        
        const giftMsg: ChatMessage = {
          id: Date.now().toString(),
          userId: currentUser.id,
          userName: currentUser.name,
          userAvatar: currentUser.avatar || 'https://picsum.photos/200',
          text: `Sent ${selectedGift.name} ${selectedGift.icon} to ${targetName} x1`,
          isGift: true,
          giftType: selectedGift.type,
          giftIcon: selectedGift.icon,
          timestamp: Date.now(),
          frameId: currentUser.equippedFrame || null,
          bubbleId: currentUser.equippedBubble || null,
          vipLevel: currentUser.vipLevel || 0,
          adminRole: currentUser.adminRole || null
        };
        
        if (selectedGift.type === 'animated') {
            triggerAnimation(selectedGift.icon, selectedGift.animationClass);
        } else {
            triggerFloatingHeart();
        }

        setShowGiftPanel(false);
        await sendMessage(room.id, giftMsg);

    } catch (e: any) {
        const msg = typeof e === 'string' ? e : (e.message || '');
        if (msg.includes("Insufficient funds")) alert(t('noFunds'));
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
      if (isLocked && !canManageRoom) {
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
      } catch (e) { 
          setLoadingSeatIndex(null); 
      }
  };

  const handleToggleLock = async () => {
      if (seatToConfirm !== null && canManageRoom) {
          const seat = seats.find(s => s.index === seatToConfirm);
          if (seat) {
              await toggleSeatLock(room.id, seatToConfirm, !seat.isLocked);
              setSeatToConfirm(null);
          }
      }
  };

  const handleUpdateRoom = async (updates: Partial<Room>) => await updateRoomDetails(room.id, updates);
  
  const handleSaveSettings = async () => {
      await updateRoomDetails(room.id, { title: editTitle, description: editDesc, isAiHost: isAiEnabled });
      setShowRoomSettings(false);
  };

  const handleLeaveRoomAction = () => {
      onAction('leave');
      const performCleanup = async () => {
          try {
              if (isSeatedRef.current && currentUserRef.current) {
                  await leaveSeat(room.id, currentUserRef.current);
              }
              if (currentUserRef.current.uid) {
                  await exitRoom(room.id, currentUserRef.current.uid);
              }
          } catch (e) {
              console.error("Background cleanup error:", e);
          }
          unpublishMicrophone();
          leaveVoiceChannel();
      };
      performCleanup();
  };

  const handleToggleMyMute = async () => {
      if (!mySeat) return;
      const nextMutedState = !mySeat.isMuted;
      setRoom(prev => {
          const newSeats = prev.seats.map(s => s.userId === currentUser.id ? { ...s, isMuted: nextMutedState } : s);
          return { ...prev, seats: newSeats };
      });
      toggleMicMute(nextMutedState);
      try { await toggleSeatMute(room.id, mySeat.index, nextMutedState); } catch (e) {}
  };

  const handleLeaveSeat = async () => {
      if (!mySeat) return;
      setRoom(prev => {
          const newSeats = prev.seats.map(s => s.index === mySeat.index ? { ...s, userId: null, userName: null, userAvatar: null, giftCount: 0, adminRole: null, isMuted: false, frameId: null } : s);
          return { ...prev, seats: newSeats };
      });
      unpublishMicrophone().catch(err => console.warn("Unpublish err", err));
      try {
          await leaveSeat(room.id, currentUser);
      } catch (e) {
          console.error("Error leaving seat:", e);
      }
  };

  const handleToggleSpeaker = () => {
      const newState = !isSpeakerMuted;
      setIsSpeakerMuted(newState);
      toggleAllRemoteAudio(newState);
  };

  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'inner' | 'outer') => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
             if (typeof reader.result === 'string') {
                 type === 'inner' ? handleUpdateRoom({ backgroundImage: reader.result }) : handleUpdateRoom({ thumbnail: reader.result });
             }
          };
          reader.readAsDataURL(file);
      }
  };

  const handleKickSeat = (seatIndex: number) => {
      pendingKickSeats.current.add(seatIndex);
      setRoom(prev => {
          const newSeats = [...prev.seats];
          if (newSeats[seatIndex]) newSeats[seatIndex] = { ...newSeats[seatIndex], userId: null, userName: null, userAvatar: null, giftCount: 0, adminRole: null, isMuted: false, frameId: null };
          return { ...prev, seats: newSeats };
      });
      kickUserFromSeat(room.id, seatIndex);
      setSelectedUser(null);
  };

  // Triggered when user clicks "Ban" on profile modal
  const handleBanRequest = (userId: string) => {
      if (userId === currentUser.id) return;
      // Resolve UID from displayId if needed, assume userToBan uses UID
      // For simplicity in this logic, we pass DisplayID but in real scenario we need UID.
      // Assuming userId passed here is UID because selectedUser logic tries to resolve it.
      setUserToBan(userId);
      setSelectedUser(null);
      setShowBanDurationModal(true);
  };

  const executeBan = async (durationInMinutes: number) => {
      if (!userToBan) return;
      const uid = userToBan;
      pendingBannedUsers.current.add(uid);
      
      // Remove from seat if seated
      const targetSeat = seats.find(s => s.userId === uid || (s as any).uid === uid);
      if (targetSeat) handleKickSeat(targetSeat.index);

      // Optimistic update
      const expiry = durationInMinutes === -1 ? -1 : Date.now() + (durationInMinutes * 60 * 1000);
      setRoom(prev => ({ 
          ...prev, 
          bannedUsers: { ...prev.bannedUsers, [uid]: expiry }
      }));

      await banUserFromRoom(room.id, uid, durationInMinutes);
      setShowBanDurationModal(false);
      setUserToBan(null);
  };

  const handleUnbanUser = async (userId: string) => await unbanUserFromRoom(room.id, userId);
  const handleMakeAdmin = async (userId: string) => { await addRoomAdmin(room.id, userId); setSelectedUser(null); };
  const handleRemoveAdmin = async (userId: string) => { await removeRoomAdmin(room.id, userId); setSelectedUser(null); };

  const getFrameClass = (id?: string | null) => {
      if (!id) return 'border border-white/20';
      return STORE_ITEMS.find(i => i.id === id)?.previewClass || 'border border-white/20';
  };

  const getBubbleClass = (id?: string | null) => {
      if (!id) return 'bg-white/10 text-white rounded-2xl'; // Default bubble
      const item = STORE_ITEMS.find(i => i.id === id);
      return item ? `${item.previewClass} rounded-2xl` : 'bg-white/10 text-white rounded-2xl';
  };

  const getVipTextStyle = (level: number) => {
      const tier = VIP_TIERS.find(t => t.level === level);
      return tier ? tier.textColor : 'text-white';
  };

  const filteredGifts = GIFTS.filter(g => g.type === giftTab);

  const handleViewerClick = (user: User) => {
      const tempUser: any = {
          userId: user.id,
          userName: user.name,
          userAvatar: user.avatar,
          ...user
      };
      setSelectedUser(tempUser);
  };

  const selectedUserId = selectedUser?.userId;

  return (
    <div className="relative h-[100dvh] w-full bg-black flex flex-col overflow-hidden">
      
      <div className="absolute inset-0 z-0">
        <img src={room.backgroundImage || room.thumbnail} className="w-full h-full object-cover transition-opacity duration-700" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-black/90"></div>
      </div>

      {activeAnimations.map(anim => (
          <div key={anim.id} className="absolute inset-0 z-[100] flex items-center justify-center pointer-events-none">
              <div className={`text-9xl filter drop-shadow-[0_0_30px_rgba(255,255,255,0.8)] ${anim.class}`}>
                  {anim.icon}
              </div>
          </div>
      ))}

      <div className="relative z-50 pt-safe-top px-3 pb-2 flex items-center justify-between gap-2 bg-gradient-to-b from-black/80 to-transparent w-full shrink-0 h-[60px]">
        <div className="flex items-center gap-2 min-w-0 flex-1">
            <button onClick={() => setShowExitModal(true)} className="shrink-0 p-2 bg-white/10 rounded-full hover:bg-white/20 backdrop-blur border border-white/5">
                <ArrowLeft className="w-5 h-5 rtl:rotate-180 text-white" />
            </button>
            <div className="flex items-center gap-2 bg-black/30 backdrop-blur px-2 py-1 rounded-xl border border-white/10 min-w-0 max-w-full">
                <img src={room.thumbnail} className="w-8 h-8 rounded-lg object-cover" />
                <div className="text-white drop-shadow-md pr-1 min-w-0 flex flex-col justify-center">
                    <div className="flex items-center gap-1">
                        <h2 className="font-bold text-xs truncate leading-tight">{room.title}</h2>
                        {room.isActivities && <Gamepad2 className="w-3 h-3 text-red-500 fill-white" />}
                    </div>
                    <div className="text-[9px] text-gray-200 truncate">ID: {room.displayId || room.id.slice(-6)}</div>
                </div>
            </div>
        </div>
        <div className="flex gap-1.5 shrink-0 items-center">
            {canManageRoom && <button onClick={() => setShowRoomSettings(true)} className="p-1.5 bg-white/10 rounded-full text-white"><Settings className="w-4 h-4" /></button>}
            <button onClick={() => setShowUserList(true)} className="bg-white/10 backdrop-blur px-2 py-1.5 rounded-full text-[10px] font-bold text-white flex items-center gap-1"><Users className="w-3 h-3" /> {viewers.length}</button>
        </div>
      </div>

      <button 
        onClick={() => setShowLeaderboard(true)} 
        className="absolute top-[65px] z-40 rtl:right-3 ltr:left-3 bg-yellow-500/20 backdrop-blur px-2 py-1.5 rounded-full text-[10px] font-black text-yellow-400 border border-yellow-500/50 flex gap-1 shadow-lg"
      >
        <Trophy className="w-3 h-3"/> {t('cup')}
      </button>

      <div className="relative z-10 w-full px-2 pt-2 pb-2 shrink-0 flex flex-col items-center">
          <div className="flex justify-center mb-4 shrink-0">
             {seats.slice(0, 1).map((seat) => {
                 const isSpeaking = seat.userId && speakingUsers.has(seat.userId);
                 return (
                 <div key={seat.index} className="flex flex-col items-center relative group">
                    <div onClick={() => handleSeatClick(seat.index, seat.userId)} className={`w-20 h-20 rounded-full relative bg-black/40 backdrop-blur overflow-visible cursor-pointer transition transform hover:scale-105 p-[3px] ${seat.userId ? getFrameClass(seat.frameId) : 'border-2 border-white/20 border-dashed'}`}>
                         {loadingSeatIndex === seat.index ? <Loader2 className="w-8 h-8 text-brand-500 animate-spin absolute inset-0 m-auto" /> : seat.userId ? (
                             <><img src={seat.userAvatar!} className="w-full h-full rounded-full object-cover" />{!seat.isMuted && isSpeaking && <div className="absolute inset-0 rounded-full border-2 border-brand-400 animate-ping opacity-50"></div>}{seat.isMuted && <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center"><MicOff className="w-5 h-5 text-red-500"/></div>}<div className="absolute -top-3 -right-1 bg-yellow-500 p-1 rounded-full"><Crown className="w-3 h-3 text-black" /></div></>
                         ) : <div className="text-gray-400 text-[10px] text-center w-full h-full flex items-center justify-center">{t('host')}</div>}
                    </div>
                    {seat.userId && <div className="mt-1 max-w-[70px] truncate text-[9px] text-white/90 bg-white/10 px-2 py-0.5 rounded-full">{seat.userName}</div>}
                    <div className="mt-0.5 bg-black/50 backdrop-blur px-2 py-0.5 rounded-full text-[8px] text-yellow-300 border border-yellow-500/30 flex items-center gap-1"><GiftIcon className="w-2 h-2" /> {seat.giftCount}</div>
                 </div>
                 )
             })}
          </div>
          
          <div className="grid grid-cols-5 gap-y-4 gap-x-2 justify-items-center w-full max-w-md shrink-0">
             {seats.slice(1).map((seat) => {
                 const isSpeaking = seat.userId && speakingUsers.has(seat.userId);
                 return (
                 <div key={seat.index} className="flex flex-col items-center w-full relative">
                    <div onClick={() => handleSeatClick(seat.index, seat.userId)} className={`w-14 h-14 rounded-full relative bg-black/30 backdrop-blur p-[2px] ${seat.userId ? getFrameClass(seat.frameId) : 'border border-white/10 border-dashed'} flex items-center justify-center`}>
                        {loadingSeatIndex === seat.index ? <Loader2 className="w-6 h-6 text-brand-500 animate-spin" /> : seat.userId ? (
                            <><img src={seat.userAvatar!} className="w-full h-full rounded-full object-cover" />{!seat.isMuted && isSpeaking && <div className="absolute inset-0 rounded-full border border-green-400 animate-ping opacity-40"></div>}{seat.isMuted && <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center"><MicOff className="w-4 h-4 text-red-500"/></div>}</>
                        ) : (seat.isLocked ? <Lock className="w-4 h-4 text-red-400/70" /> : <span className="text-white/20 text-[10px] font-bold">{seat.index}</span>)}
                    </div>
                    <div className="mt-1 max-w-[65px] truncate text-[8px] text-white/90 bg-white/10 px-2 py-0.5 rounded-full">{seat.userId ? seat.userName : (seat.isLocked ? t('lock') : '')}</div>
                    <div className="mt-0.5 text-[7px] text-yellow-500 font-mono flex items-center gap-0.5">{seat.giftCount > 0 && <><GiftIcon className="w-2 h-2"/> {seat.giftCount}</>}</div>
                 </div>
                 )
             })}
          </div>

          <div className="mt-3 w-full max-w-sm p-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-bottom-2 shrink-0">
              <div className="flex items-center gap-2">
                 <div className="p-1.5 bg-brand-500/20 rounded-full text-brand-400 border border-brand-500/30">
                    <BarChart3 className="w-4 h-4" />
                 </div>
                 <span className="text-xs font-bold text-white/90">
                    {activeSeats.length} {t('onMic')}
                 </span>
              </div>
              
              <div className="flex -space-x-2 rtl:space-x-reverse">
                 {activeSeats.slice(0, 3).map((seat) => (
                    <img key={seat.index} src={seat.userAvatar!} className="w-8 h-8 rounded-full border-2 border-gray-900 object-cover" />
                 ))}
                 {activeSeats.length > 3 && (
                    <div className="w-8 h-8 rounded-full bg-gray-800 border-2 border-gray-900 flex items-center justify-center text-[10px] font-bold text-white">
                       +{activeSeats.length - 3}
                    </div>
                 )}
              </div>
          </div>
      </div>

      <div className="relative z-20 flex-1 flex flex-col min-h-0 bg-gradient-to-t from-black via-black/80 to-transparent w-full">
          <div className="px-4 py-3 mx-4 mt-2 bg-brand-900/60 backdrop-blur border-l-4 border-brand-500 rounded-r-lg mb-2 shadow-sm animate-in fade-in flex flex-col gap-1 shrink-0">
              <div className="flex items-start gap-2 border-b border-white/10 pb-2 mb-1">
                  <Shield className="w-3 h-3 text-gold-400 mt-0.5 shrink-0" />
                  <p className="text-[10px] text-gold-100 font-bold leading-tight">{t('appRules')}</p>
              </div>
              <div className="flex items-start gap-2">
                  <Info className="w-3 h-3 text-brand-400 mt-0.5 shrink-0" />
                  <p className="text-[10px] text-white/90 leading-tight line-clamp-2">{room.description || t('pinned')}</p>
              </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 space-y-2 scrollbar-hide pb-2 mask-image-gradient relative w-full">
              {messages.map((msg) => {
                  const isMe = msg.userId === currentUser.id;
                  const isOfficial = msg.userId === 'OFFECAL' || (msg.userId === room.hostId && room.hostId === 'OFFECAL');
                  const isAi = msg.userId === 'AI_HOST';

                  if (msg.isGift) {
                      return (
                          <div key={msg.id} className="flex justify-center my-2 animate-pulse">
                              <div className={`bg-gradient-to-r ${msg.giftType === 'animated' ? 'from-purple-600/80 to-pink-600/80 border-purple-400' : 'from-yellow-600/60 to-orange-600/60 border-yellow-500/50'} text-white text-xs px-4 py-1.5 rounded-full border shadow-lg backdrop-blur font-bold flex items-center gap-2`}>
                                  <GiftIcon className="w-3 h-3 text-white" />
                                  <span className="text-yellow-200">{msg.userName}</span>
                                  <span>{msg.text.replace(/Sent .* to .* x1/, 'sent a gift')}</span>
                                  {msg.giftIcon && <span>{msg.giftIcon}</span>}
                              </div>
                          </div>
                      );
                  }

                  const bubbleClass = getBubbleClass(msg.bubbleId);

                  return (
                      <div key={msg.id} className={`flex items-start gap-2 ${isMe ? 'flex-row-reverse' : ''} animate-in slide-in-from-bottom-2`}>
                          <div className={`relative w-8 h-8 shrink-0 p-[2px] rounded-full ${isAi ? 'border-2 border-brand-400 shadow-lg' : getFrameClass(msg.frameId)}`}>
                              <img src={msg.userAvatar} className="w-full h-full rounded-full object-cover" />
                              {isOfficial && <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-[1px]"><BadgeCheck className="w-3 h-3 text-blue-500 fill-blue-100" /></div>}
                              {isAi && <div className="absolute -bottom-1 -right-1 bg-black rounded-full p-[2px]"><Bot className="w-3 h-3 text-brand-400" /></div>}
                          </div>
                          <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[80%]`}>
                              <div className="flex items-center gap-1 mb-0.5 px-1 flex-wrap">
                                   {(msg.vipLevel || 0) > 0 && <span className="bg-gradient-to-r from-gold-400 to-orange-500 text-black text-[8px] font-black px-1 rounded">V{msg.vipLevel}</span>}
                                   
                                   {msg.adminRole && ADMIN_ROLES[msg.adminRole] && (
                                       <span className={`text-[8px] px-1.5 py-0.5 rounded border flex items-center gap-0.5 ${ADMIN_ROLES[msg.adminRole].class}`}>
                                           <Shield className="w-2 h-2" /> 
                                           {ADMIN_ROLES[msg.adminRole].name[language]}
                                       </span>
                                   )}

                                   <span className={`text-[10px] font-bold flex items-center gap-1 ${getVipTextStyle(msg.vipLevel || 0)}`}>{msg.userName}{isOfficial && <BadgeCheck className="w-3 h-3 text-blue-500 fill-blue-100 inline" />}{isAi && <span className="text-[8px] bg-brand-600 text-white px-1 rounded">BOT</span>}</span>
                              </div>
                              <div className={`px-3 py-1.5 text-xs leading-relaxed text-white shadow-sm break-words border border-white/5 backdrop-blur-md ${bubbleClass} ${isMe ? 'rounded-tr-none' : 'rounded-tl-none'}`}>{msg.text}</div>
                          </div>
                      </div>
                  );
              })}
              
              {joinNotification && (
                  <div className="sticky bottom-2 left-0 right-0 flex justify-center z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
                      <div className="bg-black/60 backdrop-blur-md border border-white/10 px-4 py-1.5 rounded-full shadow-xl flex items-center gap-2">
                          <span className="text-yellow-400 font-black text-xs drop-shadow-sm">{t('welcome')} {joinNotification.name}</span>
                          <span className="text-white text-[10px] font-medium">{t('entered')}</span>
                      </div>
                  </div>
              )}
              
              <div ref={messagesEndRef} />
          </div>

          {floatingHearts.map((h) => (<Heart key={h.id} className="absolute bottom-20 w-6 h-6 text-pink-500 fill-pink-500 animate-float pointer-events-none z-50 drop-shadow-lg" style={{ left: `${h.left}%` }}/>))}

          <div className="p-3 bg-black/60 backdrop-blur-md border-t border-white/10 flex items-center gap-3 shrink-0">
              <button onClick={handleToggleMyMute} className={`p-2 rounded-full shadow-lg transition duration-75 active:scale-95 ${mySeat?.isMuted ? 'bg-red-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}>{mySeat?.isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}</button>
              <button onClick={handleToggleSpeaker} className={`p-2 rounded-full shadow-lg transition ${isSpeakerMuted ? 'bg-gray-700 text-gray-400' : 'bg-white/10 text-brand-400 hover:bg-white/20'}`}>{isSpeakerMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}</button>
              <button onClick={() => setShowGiftPanel(true)} disabled={isSendingGift} className="p-2 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-500/20 hover:scale-105 transition disabled:opacity-50"><GiftIcon className="w-5 h-5" /></button>
              <div className="flex-1 relative">
                  <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} placeholder={t('placeholder')} className={`w-full bg-white/10 border border-white/10 rounded-full py-2.5 px-4 text-sm text-white focus:border-brand-500 outline-none placeholder-gray-400 ${language === 'ar' ? 'text-right' : 'text-left'}`}/>
                  <button onClick={handleSendMessage} disabled={!inputValue.trim()} className="absolute right-2 top-1.5 p-1.5 bg-brand-600 rounded-full text-white disabled:opacity-0 transition hover:bg-brand-500 rtl:right-auto rtl:left-2"><Send className="w-3.5 h-3.5 rtl:rotate-180" /></button>
              </div>
              {mySeat ? <button onClick={handleLeaveSeat} className="p-2 rounded-full bg-red-500/20 text-red-500 hover:bg-red-500/30 border border-red-500/50 transition"><ArrowDownCircle className="w-5 h-5" /></button> : <button className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20"><Share2 className="w-5 h-5" /></button>}
          </div>
      </div>

      {showGiftPanel && (
          <div className="absolute inset-0 z-50 flex flex-col justify-end bg-black/50 backdrop-blur-sm animate-in slide-in-from-bottom-10">
              <div className="bg-gray-900 border-t border-gray-700 rounded-t-3xl p-4 shadow-2xl h-[50vh] flex flex-col">
                  <div className="flex justify-between items-center mb-2">
                      <div className="flex gap-2">
                          <button onClick={() => setGiftTab('static')} className={`px-4 py-1.5 rounded-full text-xs font-bold transition ${giftTab === 'static' ? 'bg-white text-black' : 'bg-gray-800 text-gray-400'}`}>{t('static')}</button>
                          <button onClick={() => setGiftTab('animated')} className={`px-4 py-1.5 rounded-full text-xs font-bold transition ${giftTab === 'animated' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg' : 'bg-gray-800 text-gray-400'}`}>{t('animated')}</button>
                      </div>
                      <div className="flex items-center gap-1 bg-gray-800 px-3 py-1 rounded-full border border-gray-700"><span className="text-xs text-yellow-500">💎</span><span className="text-xs font-bold text-white">{currentUser.wallet?.diamonds || 0}</span></div>
                      <button onClick={() => setShowGiftPanel(false)}><X className="w-5 h-5 text-gray-500" /></button>
                  </div>

                  <div className="flex-1 overflow-y-auto grid grid-cols-4 gap-3 pb-2 content-start">
                      {filteredGifts.map(gift => (
                          <button 
                            key={gift.id} 
                            onClick={() => setSelectedGift(gift)} 
                            disabled={isSendingGift}
                            className={`flex flex-col items-center p-2 rounded-xl border transition relative group ${
                                selectedGift?.id === gift.id 
                                    ? 'border-brand-500 bg-brand-500/10' 
                                    : 'border-transparent hover:bg-white/5'
                            } ${isSendingGift ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                              <span className={`text-4xl mb-1 filter drop-shadow-md transition ${selectedGift?.id === gift.id ? 'scale-110' : 'group-hover:scale-105'}`}>{gift.icon}</span>
                              <span className="text-[10px] text-gray-300 font-medium truncate w-full text-center">{gift.name}</span>
                              <div className="flex items-center gap-0.5 mt-1 bg-black/30 px-1.5 py-0.5 rounded text-[9px]"><span className="text-yellow-500">💎</span><span className="text-yellow-100 font-bold">{gift.cost}</span></div>
                          </button>
                      ))}
                  </div>

                  <div className="pt-3 border-t border-white/5 flex gap-3 items-center">
                      <div className="flex items-center gap-2 bg-black/40 rounded-full px-3 py-2 border border-white/10 flex-1">
                          <span className="text-gray-400 text-xs whitespace-nowrap">{t('sendTo')}</span>
                          <select value={giftTarget} onChange={(e) => setGiftTarget(e.target.value)} className="bg-transparent text-white text-xs outline-none w-full">
                              <option value="all" className="bg-gray-900">{t('everyone')}</option>
                              <option value="me" className="bg-gray-900">{t('me')}</option>
                              {seats.filter(s => s.userId).map(s => (<option key={s.index} value={s.userId!} className="bg-gray-900">{s.userName}</option>))}
                          </select>
                      </div>
                      <button 
                        onClick={executeSendGift}
                        disabled={isSendingGift || !selectedGift}
                        className="bg-gradient-to-r from-brand-600 to-accent-600 text-white font-bold py-2 px-8 rounded-full shadow-lg hover:shadow-brand-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition transform active:scale-95 flex items-center gap-2"
                      >
                          {isSendingGift ? <Loader2 className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4 rtl:rotate-180"/>}
                          {t('send')}
                      </button>
                  </div>
              </div>
          </div>
      )}

      {selectedUser && (() => {
          const targetId = selectedUser.userId || (selectedUser as any).id;
          const targetUid = (selectedUser as any).uid || targetId; 
          
          const isTargetAdmin = room.admins?.includes(targetUid);
          const isTargetHost = targetId === room.hostId;
          const isTargetMe = targetId === currentUser.id;

          const canBanTarget = (isHost && !isTargetMe) || (isRoomAdmin && !isTargetHost && !isTargetAdmin && !isTargetMe);

          return (
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
                  onKickSeat={canBanTarget && selectedUser.userId ? () => handleKickSeat(selectedUser.index) : undefined}
                  onBanUser={canBanTarget && selectedUser.userId ? () => handleBanRequest(selectedUser.userId!) : undefined}
                  onMakeAdmin={isHost && !isTargetAdmin && !isTargetMe ? () => handleMakeAdmin(targetUid) : undefined}
                  onRemoveAdmin={isHost && isTargetAdmin && !isTargetMe ? () => handleRemoveAdmin(targetUid) : undefined}
                  onOpenFullProfile={(user) => {
                      setFullProfileUser(user);
                      setSelectedUser(null);
                  }}
              />
          );
      })()}

      {/* BAN DURATION MODAL */}
      {showBanDurationModal && (
          <div className="absolute inset-0 z-[70] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in zoom-in-95">
              <div className="bg-gray-900 border border-red-500 rounded-2xl w-full max-w-xs p-5 shadow-2xl">
                  <h3 className="text-red-500 font-bold mb-4 flex items-center gap-2">
                      <Ban className="w-5 h-5"/> {t('banDuration')}
                  </h3>
                  <div className="space-y-2 mb-6">
                      <button onClick={() => executeBan(60)} className="w-full bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-xl font-bold border border-gray-700">1 {t('hour')}</button>
                      <button onClick={() => executeBan(1440)} className="w-full bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-xl font-bold border border-gray-700">24 {t('hours') || t('day')}</button>
                      <button onClick={() => executeBan(10080)} className="w-full bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-xl font-bold border border-gray-700">7 {t('days') || t('week')}</button>
                      <button onClick={() => executeBan(-1)} className="w-full bg-red-900/30 hover:bg-red-900/50 text-red-400 py-3 rounded-xl font-bold border border-red-900/50">{t('permanent')}</button>
                  </div>
                  <button onClick={() => setShowBanDurationModal(false)} className="w-full text-gray-500 text-sm">{t('cancel')}</button>
              </div>
          </div>
      )}

      {fullProfileUser && (
          <FullProfileView 
              user={fullProfileUser}
              onClose={() => setFullProfileUser(null)}
              language={language}
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
                          <Users className="w-4 h-4 text-brand-400"/> {t('activeUsers')} ({viewers.length})
                      </h3>
                      <button onClick={() => setShowUserList(false)}><X className="w-5 h-5 text-gray-500" /></button>
                  </div>
                  <div className="overflow-y-auto p-2 space-y-2 flex-1">
                      {viewers.length === 0 ? <div className="text-center text-gray-500 py-4">No users found</div> : viewers.map(viewer => {
                          const seat = seats.find(s => s.userId === viewer.id);
                          return (
                              <div key={viewer.uid || viewer.id} onClick={() => handleViewerClick(viewer)} className="flex items-center gap-3 p-2 bg-gray-800/30 rounded-xl border border-transparent hover:border-gray-700 cursor-pointer">
                                  <img src={viewer.avatar} className="w-10 h-10 rounded-full object-cover border border-gray-600" />
                                  <div className="flex-1">
                                      <div className="flex items-center gap-1">
                                          <span className="text-sm text-white font-bold">{viewer.name}</span>
                                          {viewer.id === 'OFFECAL' && <BadgeCheck className="w-3 h-3 text-blue-500 fill-white" />}
                                      </div>
                                      <span className="text-[10px] text-gray-500">ID: {viewer.id}</span>
                                  </div>
                                  {seat ? (
                                      <div className="bg-brand-600/20 text-brand-400 text-[9px] px-2 py-0.5 rounded border border-brand-600/50">
                                          {seat.index === 0 ? 'Host' : `Seat ${seat.index}`}
                                      </div>
                                  ) : (
                                      <div className="text-gray-600 text-[9px]">Audience</div>
                                  )}
                              </div>
                          );
                      })}
                  </div>
              </div>
          </div>
      )}

      {showRoomSettings && canManageRoom && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
              <div className="w-full max-w-sm bg-gray-900 border border-gray-700 rounded-2xl flex flex-col shadow-2xl overflow-hidden max-h-[85vh]">
                  <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-800/50">
                      <h3 className="text-white font-bold">{t('roomSettings')}</h3>
                      <button onClick={() => setShowRoomSettings(false)}><X className="w-5 h-5 text-gray-400" /></button>
                  </div>
                  <div className="flex p-2 gap-2 bg-gray-900 border-b border-gray-800 overflow-x-auto scrollbar-hide">
                      <button onClick={() => setSettingsTab('info')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap ${settingsTab === 'info' ? 'bg-brand-600 text-white' : 'text-gray-400 hover:bg-white/5'}`}>{t('general')}</button>
                      <button onClick={() => setSettingsTab('background')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap ${settingsTab === 'background' ? 'bg-brand-600 text-white' : 'text-gray-400 hover:bg-white/5'}`}>{t('backgrounds')}</button>
                      {isHost && <button onClick={() => setSettingsTab('banned')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap ${settingsTab === 'banned' ? 'bg-red-600 text-white' : 'text-gray-400 hover:bg-white/5'}`}>{t('banned')}</button>}
                      {isHost && <button onClick={() => setSettingsTab('admins')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap ${settingsTab === 'admins' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-white/5'}`}>{t('admins')}</button>}
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {settingsTab === 'info' && (
                          <div className="space-y-4">
                              <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
                                  <div className="flex items-center gap-2"><div className="p-2 bg-brand-500/20 rounded-lg text-brand-400"><Bot className="w-5 h-5"/></div><div><h4 className="text-sm font-bold text-white">{t('aiHost')}</h4><p className="text-[10px] text-gray-400">{t('aiHostDesc')}</p></div></div>
                                  <button onClick={() => setIsAiEnabled(!isAiEnabled)} className={`w-10 h-6 rounded-full p-1 transition ${isAiEnabled ? 'bg-brand-600' : 'bg-gray-700'}`}><div className={`w-4 h-4 bg-white rounded-full transition-transform ${isAiEnabled ? 'translate-x-4' : 'translate-x-0'}`}></div></button>
                              </div>
                              <div><label className="text-xs text-gray-400 mb-1 block">{t('roomTitle')}</label><input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full bg-black/40 border border-gray-700 rounded-xl p-3 text-white text-sm focus:border-brand-500 outline-none"/></div>
                              <div><label className="text-xs text-gray-400 mb-1 block">{t('roomDesc')}</label><textarea rows={3} value={editDesc} onChange={(e) => setEditDesc(e.target.value)} className="w-full bg-black/40 border border-gray-700 rounded-xl p-3 text-white text-sm focus:border-brand-500 outline-none resize-none" placeholder="Set rules..."></textarea></div>
                          </div>
                      )}
                      {settingsTab === 'background' && (
                          <div className="space-y-4">
                              <div className="flex bg-black/40 rounded-lg p-1 border border-white/10"><button onClick={() => setBgType('inner')} className={`flex-1 py-1.5 rounded text-[10px] font-bold transition ${bgType === 'inner' ? 'bg-gray-700 text-white' : 'text-gray-400'}`}>{t('innerBg')}</button><button onClick={() => setBgType('outer')} className={`flex-1 py-1.5 rounded text-[10px] font-bold transition ${bgType === 'outer' ? 'bg-gray-700 text-white' : 'text-gray-400'}`}>{t('outerBg')}</button></div>
                              <div className="flex gap-3 overflow-x-auto pb-4 pt-2 px-1 scrollbar-hide">
                                  <label className="shrink-0 w-24 h-24 rounded-xl border-2 border-dashed border-gray-600 flex flex-col items-center justify-center cursor-pointer hover:border-brand-500 bg-white/5 transition group">
                                      <input type="file" className="hidden" accept="image/*" onChange={(e) => handleBgUpload(e, bgType)} />
                                      <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center group-hover:bg-brand-500 transition mb-1"><Upload className="w-4 h-4 text-white" /></div><span className="text-[9px] text-gray-400 font-bold">{t('uploadBg')}</span>
                                  </label>
                                  {ROOM_BACKGROUNDS.map((bg, i) => (<button key={i} onClick={() => { bgType === 'inner' ? handleUpdateRoom({ backgroundImage: bg }) : handleUpdateRoom({ thumbnail: bg }); }} className={`shrink-0 w-24 h-24 rounded-xl border-2 overflow-hidden relative group transition-all hover:scale-105 ${(bgType === 'inner' && room.backgroundImage === bg) || (bgType === 'outer' && room.thumbnail === bg) ? 'border-brand-500 ring-2 ring-brand-500/30' : 'border-transparent border-white/10'}`}><img src={bg} className="w-full h-full object-cover" />{((bgType === 'inner' && room.backgroundImage === bg) || (bgType === 'outer' && room.thumbnail === bg)) && (<div className="absolute inset-0 bg-brand-500/40 flex items-center justify-center backdrop-blur-[1px]"><div className="bg-white rounded-full p-1 shadow-lg"><BadgeCheck className="w-5 h-5 text-brand-600 fill-white" /></div></div>)}</button>))}
                              </div>
                          </div>
                      )}
                      {settingsTab === 'banned' && isHost && (
                          <div className="space-y-2">
                              {!room.bannedUsers || Object.keys(room.bannedUsers).length === 0 ? <div className="text-gray-500 text-center text-xs py-10">No banned users</div> : Object.entries(room.bannedUsers).map(([uid, expiry]) => (
                                  <div key={uid} className="flex justify-between items-center bg-gray-800 p-2 rounded-lg border border-gray-700">
                                      <div className="flex items-center gap-2">
                                          <Ban className="w-4 h-4 text-red-500" />
                                          <div className="flex flex-col">
                                              <span className="text-white text-xs font-mono">{uid}</span>
                                              <span className="text-[9px] text-gray-400">
                                                  {expiry === -1 ? t('permanent') : new Date(expiry as number).toLocaleString()}
                                              </span>
                                          </div>
                                      </div>
                                      <button onClick={() => handleUnbanUser(uid)} className="text-[10px] bg-green-600/20 text-green-400 px-2 py-1 rounded border border-green-600/50">{t('unban')}</button>
                                  </div>
                              ))}
                          </div>
                      )}
                      {settingsTab === 'admins' && isHost && (
                          <div className="space-y-2">
                              <h4 className="text-xs text-gray-400 font-bold mb-2 uppercase">{t('adminList')}</h4>
                              {!room.admins || room.admins.length === 0 ? <div className="text-gray-500 text-center text-xs py-10">No admins appointed</div> : room.admins.map(uid => (<div key={uid} className="flex justify-between items-center bg-gray-800 p-2 rounded-lg border border-blue-900/50"><div className="flex items-center gap-2"><Shield className="w-4 h-4 text-blue-500" /><span className="text-white text-xs font-mono">{uid}</span></div><button onClick={() => handleRemoveAdmin(uid)} className="text-[10px] bg-red-600/20 text-red-400 px-2 py-1 rounded border border-red-600/50">{t('remove')}</button></div>))}
                          </div>
                      )}
                  </div>
                  <div className="p-4 border-t border-gray-800 flex gap-3 bg-gray-900">
                       <button onClick={() => setShowRoomSettings(false)} className="flex-1 py-3 bg-gray-800 text-gray-400 rounded-xl font-bold text-sm hover:bg-gray-700">{t('cancel')}</button>
                       <button onClick={handleSaveSettings} className="flex-1 py-3 bg-brand-600 text-white rounded-xl font-bold text-sm hover:bg-brand-500">{t('save')}</button>
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

      {seatToConfirm !== null && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6 animate-in fade-in">
              <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-xs p-5 shadow-2xl text-center">
                  <div className="w-16 h-16 bg-brand-900/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-brand-500/30"><Mic className="w-8 h-8 text-brand-400" /></div>
                  <h3 className="text-white font-bold mb-6">{t('confirmSeat')}</h3>
                  {canManageRoom && (
                      <button onClick={handleToggleLock} className="w-full mb-3 py-3 rounded-xl bg-gray-800 text-gray-300 font-bold border border-gray-600 flex items-center justify-center gap-2">
                          {seats.find(s => s.index === seatToConfirm)?.isLocked ? <Unlock className="w-4 h-4"/> : <Lock className="w-4 h-4"/>}
                          {seats.find(s => s.index === seatToConfirm)?.isLocked ? t('unlock') : t('lock')}
                      </button>
                  )}
                  <div className="flex gap-3">
                      <button onClick={() => setSeatToConfirm(null)} className="flex-1 py-3 rounded-xl bg-gray-800 text-gray-400 font-bold hover:bg-gray-700">{t('cancel')}</button>
                      <button onClick={confirmTakeSeat} className="flex-1 py-3 rounded-xl bg-brand-600 text-white font-bold hover:bg-brand-500">{t('yes')}</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default RoomView;
