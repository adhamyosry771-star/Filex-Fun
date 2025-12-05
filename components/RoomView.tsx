import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, Heart, Share2, Gift as GiftIcon, Users, Crown, Mic, MicOff, Lock, Unlock, Settings, Image as ImageIcon, X, Info, Minimize2, LogOut, BadgeCheck, Loader2, Upload, Shield, Trophy, Bot, Volume2, VolumeX, ArrowDownCircle, Ban, Trash2, UserCog, UserMinus, Zap, BarChart3, Gamepad2, Clock, LayoutGrid, Flag, Music, Play, Pause, SkipForward, SkipBack, Hexagon, ListMusic, Plus, Check, Search, Circle, CheckCircle2, KeyRound } from 'lucide-react';
import { Room, ChatMessage, Gift, Language, User, RoomSeat } from '../types';
import { GIFTS, STORE_ITEMS, ROOM_BACKGROUNDS, VIP_TIERS, ADMIN_ROLES } from '../constants';
import { listenToMessages, sendMessage, takeSeat, leaveSeat, updateRoomDetails, sendGiftTransaction, toggleSeatLock, toggleSeatMute, decrementViewerCount, listenToRoom, kickUserFromSeat, banUserFromRoom, unbanUserFromRoom, removeRoomAdmin, addRoomAdmin, searchUserByDisplayId, enterRoom, exitRoom, listenToRoomViewers, getUserProfile } from '../services/firebaseService';
import { joinVoiceChannel, leaveVoiceChannel, toggleMicMute, publishMicrophone, unpublishMicrophone, toggleAllRemoteAudio, listenToVolume, playMusicFile, stopMusic, setMusicVolume, seekMusic, pauseMusic, resumeMusic, getMusicTrack } from '../services/agoraService';
import { generateAiHostResponse } from '../services/geminiService';
import { compressImage } from '../services/imageService';
import { saveSongToDB, getSongsFromDB, deleteSongFromDB, SavedSong } from '../services/musicStorageService';
import UserProfileModal from './UserProfileModal';
import RoomLeaderboard from './RoomLeaderboard';
import FullProfileView from './FullProfileView';

interface RoomViewProps {
  room: Room;
  currentUser: User;
  onAction: (action: 'minimize' | 'leave' | 'chat', data?: any) => void;
  language: Language;
}

interface Song {
    id: string;
    file: File | Blob;
    name: string;
    duration: number;
}

interface StagedFile {
    id: string;
    file: File;
    name: string;
    selected: boolean;
}

export const RoomView: React.FC<RoomViewProps> = ({ room: initialRoom, currentUser, onAction, language }) => {
  const [room, setRoom] = useState<Room>(initialRoom);
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  
  // Gift Panel State
  const [showGiftPanel, setShowGiftPanel] = useState(false);
  const [giftTab, setGiftTab] = useState<'static' | 'animated'>('static');
  const [selectedGift, setSelectedGift] = useState<Gift | null>(null);
  const [giftTargets, setGiftTargets] = useState<string[]>(['all']); 
  const [giftMultiplier, setGiftMultiplier] = useState<number>(1);
  const [isSendingGift, setIsSendingGift] = useState(false);

  // Animation State
  const [activeAnimations, setActiveAnimations] = useState<{id: string, icon: string, class: string}[]>([]);

  // Join Notification State
  const [joinNotification, setJoinNotification] = useState<{name: string, id: string} | null>(null);

  const [showRoomSettings, setShowRoomSettings] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [showUserList, setShowUserList] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  
  // --- Music Player State ---
  const [showMusicMiniPlayer, setShowMusicMiniPlayer] = useState(false);
  const [showMusicPlaylist, setShowMusicPlaylist] = useState(false);
  const [showImportView, setShowImportView] = useState(false);
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
  const [importSearch, setImportSearch] = useState('');
  const [playlist, setPlaylist] = useState<Song[]>([]);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [musicVolume, setMusicVolumeState] = useState(70);
  const [musicProgress, setMusicProgress] = useState(0);
  const [musicDuration, setMusicDuration] = useState(0);
  
  const [selectedUser, setSelectedUser] = useState<RoomSeat | null>(null);
  const [fullProfileUser, setFullProfileUser] = useState<User | null>(null);

  const [seatToConfirm, setSeatToConfirm] = useState<number | null>(null);
  const [loadingSeatIndex, setLoadingSeatIndex] = useState<number | null>(null);
  // Ref to track loading seat index inside closures (listeners)
  const loadingSeatRef = useRef<number | null>(null);

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

  // Lock Room State
  const [showLockSetupModal, setShowLockSetupModal] = useState(false);
  const [newRoomPassword, setNewRoomPassword] = useState('');

  // Settings Lists Data
  const [adminProfiles, setAdminProfiles] = useState<User[]>([]);
  const [bannedProfiles, setBannedProfiles] = useState<User[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);

  // New: Active Viewer List State
  const [viewers, setViewers] = useState<User[]>([]);
  const viewersRef = useRef<User[]>([]);

  const [speakingUsers, setSpeakingUsers] = useState<Set<string>>(new Set());

  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const joinTimestamp = useRef(Date.now());
  const hasSentJoinMsg = useRef(false);

  const currentUserRef = useRef(currentUser);
  useEffect(() => { currentUserRef.current = currentUser; }, [currentUser]);

  // Load Saved Music on Mount
  useEffect(() => {
      const loadMusic = async () => {
          const savedSongs = await getSongsFromDB();
          if (savedSongs.length > 0) {
              setPlaylist(savedSongs);
          }
      };
      loadMusic();
  }, []);

  // Music Timer
  useEffect(() => {
      let interval: any;
      if (isMusicPlaying) {
          interval = setInterval(() => {
              const track = getMusicTrack();
              if (track) {
                  setMusicProgress(track.getCurrentTime());
                  if (track.duration && track.duration !== musicDuration) {
                      setMusicDuration(track.duration);
                  }
                  if (track.duration > 0 && track.getCurrentTime() >= track.duration) {
                      setIsMusicPlaying(false);
                  }
              }
          }, 1000);
      }
      return () => clearInterval(interval);
  }, [isMusicPlaying, musicDuration]);

  // Settings Tab Data Fetcher
  useEffect(() => {
      const fetchSettingsData = async () => {
          if (!showRoomSettings) return;
          
          if (settingsTab === 'admins') {
              setLoadingProfiles(true);
              const profiles: User[] = [];
              if (room.admins && room.admins.length > 0) {
                  for (const uid of room.admins) {
                      // Try find in viewers first for speed
                      let user = viewers.find(v => v.uid === uid);
                      if (!user) {
                          user = await getUserProfile(uid) || undefined;
                      }
                      if (user) profiles.push(user);
                  }
              }
              setAdminProfiles(profiles);
              setLoadingProfiles(false);
          }

          if (settingsTab === 'banned') {
              setLoadingProfiles(true);
              const profiles: User[] = [];
              if (room.bannedUsers && Object.keys(room.bannedUsers).length > 0) {
                  for (const uid of Object.keys(room.bannedUsers)) {
                      let user = await getUserProfile(uid);
                      if (user) profiles.push(user);
                  }
              }
              setBannedProfiles(profiles);
              setLoadingProfiles(false);
          }
      };

      fetchSettingsData();
  }, [settingsTab, showRoomSettings, room.admins, room.bannedUsers, viewers]);

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

  // --- LIFECYCLE MANAGEMENT: ENTRY, EXIT, VOICE ---
  useEffect(() => {
      const uid = currentUser.uid;
      const agoraUid = currentUser.uid || currentUser.id;

      // 1. Join Agora Voice
      if (agoraUid) {
          joinVoiceChannel(room.id, agoraUid);
      }

      // 2. Firebase Enter (Update Real-Time Viewer Count)
      if (uid) {
          enterRoom(room.id, currentUser);
      }

      return () => {
          if (uid) {
              exitRoom(room.id, uid);
          }
          leaveVoiceChannel();
          stopMusic();
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

  // --- STRICT SERVER SYNC LISTENER ---
  useEffect(() => {
      const unsubscribe = listenToRoom(initialRoom.id, (updatedRoom) => {
          if (updatedRoom) {
              // Ensure we don't clear loading state until the server confirms the change
              // or confirms it failed (by showing another user or empty when we expected us)
              if (loadingSeatRef.current !== null) {
                  const targetIdx = loadingSeatRef.current;
                  const targetSeat = updatedRoom.seats[targetIdx];
                  
                  // Case 1: Success - Server says we are in the seat
                  if (targetSeat && targetSeat.userId === currentUser.id) {
                      setLoadingSeatIndex(null);
                      loadingSeatRef.current = null;
                  }
                  // Case 2: Failure - Server says someone else is in the seat (Race condition lost)
                  else if (targetSeat && targetSeat.userId && targetSeat.userId !== currentUser.id) {
                      setLoadingSeatIndex(null);
                      loadingSeatRef.current = null;
                  }
                  // Case 3: Still waiting - Seat is empty or same as before, keep spinning...
              }

              // Update Room State strictly from Server
              setRoom(updatedRoom);

              if (!showRoomSettings) {
                  setEditTitle(updatedRoom.title);
                  setEditDesc(updatedRoom.description || '');
                  setIsAiEnabled(updatedRoom.isAiHost || false);
              }

              const myUid = currentUser.uid!;
              if (updatedRoom.bannedUsers && updatedRoom.bannedUsers[myUid]) {
                  const expiry = updatedRoom.bannedUsers[myUid];
                  if (expiry === -1 || expiry > Date.now()) {
                      let banMsg = language === 'ar' ? 'لقد تم طردك من الغرفة.' : 'You have been kicked/banned from the room.';
                      alert(banMsg);
                      onAction('leave');
                  }
              }

          } else {
              onAction('leave');
          }
      });
      return () => unsubscribe();
  }, [initialRoom.id, onAction, showRoomSettings, currentUser.uid, currentUser.id]);

  // Safety fallback for loading state
  useEffect(() => {
      const myCurrentSeat = room.seats.find(s => s.userId === currentUser.id);
      if (myCurrentSeat && loadingSeatRef.current === myCurrentSeat.index) {
          setLoadingSeatIndex(null);
          loadingSeatRef.current = null;
      }
  }, [room.seats, currentUser.id]);

  const mySeatIndex = mySeat?.index;
  const mySeatMuted = mySeat?.isMuted;
  const amISeated = !!mySeat;

  useEffect(() => {
      if (amISeated) {
          publishMicrophone(!!mySeatMuted).catch(err => {
              console.warn("Mic publish info:", err);
          });
      } else {
          // Only unpublish if we are definitely not seated and not loading a seat
          if (loadingSeatIndex === null) {
              unpublishMicrophone().catch(err => console.warn("Mic unpublish info:", err));
          }
      }
  }, [amISeated, mySeatMuted, loadingSeatIndex, mySeatIndex]);

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

  useEffect(() => {
      return () => {
          stopMusic();
      };
  }, []);

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
              // Add Optimistic AI Message
              setMessages(prev => [...prev, aiMsg]);
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
      confirmBan: { ar: 'تأكيد الطرد', en: 'Confirm Ban' },
      menu: { ar: 'القائمة', en: 'Menu' },
      report: { ar: 'إبلاغ', en: 'Report' },
      share: { ar: 'مشاركة', en: 'Share' },
      music: { ar: 'الموسيقى', en: 'Music' },
      chooseMusic: { ar: 'اختر موسيقى', en: 'Choose Music' },
      uploadMusic: { ar: 'رفع الموسيقى', en: 'Upload Music' },
      musicVolume: { ar: 'مستوى الصوت', en: 'Volume' },
      localMusic: { ar: 'الموسيقى المحلية', en: 'Local Music' },
      playlist: { ar: 'قائمة الموسيقى', en: 'Playlist' },
      addMusic: { ar: 'إضافة موسيقى', en: 'Add Music' },
      edit: { ar: 'تعديل', en: 'Edit' },
      noMusic: { ar: 'لا توجد موسيقى. اضف من جهازك', en: 'No music. Add from device' },
      all: { ar: 'الكل', en: 'All' },
      multiplier: { ar: 'الكمية', en: 'Quantity' },
      selectTarget: { ar: 'اختر مستلم', en: 'Select Target' },
      importTitle: { ar: 'استيراد الموسيقى', en: 'Import Music' },
      selectFiles: { ar: 'اختر ملفات من الجهاز', en: 'Select Files from Device' },
      searchMusic: { ar: 'بحث عن اغنية...', en: 'Search song...' },
      selectAll: { ar: 'تحديد الكل', en: 'Select All' },
      confirmImport: { ar: 'تأكيد وإضافة', en: 'Confirm & Add' },
      importDesc: { ar: 'اختر الملفات التي تريد إضافتها لقائمة التشغيل الخاصة بك', en: 'Select files to add to your playlist' },
      lockRoom: { ar: 'قفل الروم', en: 'Lock Room' },
      unlockRoom: { ar: 'فتح الروم', en: 'Unlock Room' },
      setPassword: { ar: 'تعيين كلمة مرور للروم', en: 'Set Room Password' },
      passPlaceholder: { ar: '6 أرقام (مثال: 123456)', en: '6 Digits (e.g., 123456)' },
      confirm: { ar: 'تأكيد', en: 'Confirm' }
    };
    return dict[key]?.[language] || key;
  };

  // ... (Import Logic methods remain same) ...
  const handleInitialFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
          const newStaged: StagedFile[] = [];
          for (let i = 0; i < files.length; i++) {
              const file = files[i];
              newStaged.push({
                  id: Math.random().toString(36).substr(2, 9),
                  file: file,
                  name: file.name.replace(/\.[^/.]+$/, ""),
                  selected: true
              });
          }
          setStagedFiles(prev => [...prev, ...newStaged]);
          e.target.value = '';
      }
  };

  const toggleStagedFile = (id: string) => {
      setStagedFiles(prev => prev.map(f => f.id === id ? { ...f, selected: !f.selected } : f));
  };

  const selectAllStaged = () => {
      const allSelected = stagedFiles.every(f => f.selected);
      setStagedFiles(prev => prev.map(f => ({ ...f, selected: !allSelected })));
  };

  const confirmImport = async () => {
      const selected = stagedFiles.filter(f => f.selected);
      if (selected.length === 0) return;

      const newSongs: Song[] = [];
      for (const staged of selected) {
          const song = {
              id: staged.id,
              file: staged.file,
              name: staged.name,
              duration: 0
          };
          newSongs.push(song);
          await saveSongToDB(song);
      }
      
      setPlaylist(prev => [...prev, ...newSongs]);
      if (!currentSong && newSongs.length > 0) {
          playSong(newSongs[0]);
      }
      
      setStagedFiles([]);
      setShowImportView(false);
      setShowMusicPlaylist(true);
  };

  const handleDeleteSong = async (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (!confirm("Remove this song?")) return;
      await deleteSongFromDB(id);
      setPlaylist(prev => prev.filter(s => s.id !== id));
      if (currentSong?.id === id) {
          stopMusic();
          setIsMusicPlaying(false);
          setCurrentSong(null);
      }
  };

  const playSong = async (song: Song) => {
      try {
          setCurrentSong(song);
          await playMusicFile(song.file as File);
          setIsMusicPlaying(true);
          setMusicVolumeState(70);
          setMusicVolume(70);
      } catch (error) {
          console.error("Music play error", error);
          alert("Error playing music file");
      }
  };

  const toggleMusicPlay = () => {
      if (isMusicPlaying) {
          pauseMusic();
          setIsMusicPlaying(false);
      } else {
          resumeMusic();
          setIsMusicPlaying(true);
      }
  };

  const handleMusicSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseFloat(e.target.value);
      setMusicProgress(val);
      seekMusic(val);
  };

  const handleMusicVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseInt(e.target.value);
      setMusicVolumeState(val);
      setMusicVolume(val);
  };

  const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
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
    
    // OPTIMISTIC UPDATE: Add message immediately to state
    setMessages(prev => [userMsg, ...prev]);
    setInputValue('');
    
    try { await sendMessage(room.id, userMsg); } catch (e) { }
  };

  const toggleGiftTarget = (uid: string) => {
      if (uid === 'all') {
          setGiftTargets(['all']);
          return;
      }
      
      let newTargets = [...giftTargets];
      if (newTargets.includes('all')) newTargets = [];

      if (newTargets.includes(uid)) {
          newTargets = newTargets.filter(id => id !== uid);
      } else {
          newTargets.push(uid);
      }

      if (newTargets.length === 0) setGiftTargets(['all']);
      else setGiftTargets(newTargets);
  };

  const executeSendGift = async () => {
    if (!selectedGift) {
        alert(t('selectGift'));
        return;
    }
    if (isSendingGift) return;
    if (giftTargets.length === 0) {
        alert(t('selectTarget'));
        return;
    }
    
    if (!currentUser.uid || currentUser.uid === 'guest') {
        alert("Please login first");
        return;
    }

    const multiplier = giftMultiplier;
    
    const targets = giftTargets.includes('all') 
        ? activeSeats 
        : activeSeats.filter(s => s.userId && giftTargets.includes(s.userId));

    if (targets.length === 0 && !giftTargets.includes('all')) {
        alert("Selected users are no longer on mic");
        return;
    }

    const totalCost = selectedGift.cost * multiplier * (giftTargets.includes('all') ? activeSeats.length : targets.length);

    const userBalance = currentUser.wallet?.diamonds || 0;
    if (userBalance < totalCost) {
        alert(t('noFunds'));
        return;
    }

    setIsSendingGift(true);

    try {
        const promises = targets.map(seat => 
            sendGiftTransaction(room.id, currentUser.uid!, seat.index, selectedGift.cost * multiplier, selectedGift.id)
        );
        await Promise.all(promises);
        
        let targetName = '';
        if (giftTargets.includes('all')) {
            targetName = t('everyone');
        } else if (targets.length === 1) {
            targetName = targets[0].userName || 'User';
        } else {
            targetName = `${targets.length} Users`;
        }

        const giftMsg: ChatMessage = {
          id: Date.now().toString(),
          userId: currentUser.id,
          userName: currentUser.name,
          userAvatar: currentUser.avatar || 'https://picsum.photos/200',
          text: `Sent ${selectedGift.name} x${multiplier} to ${targetName} 🎁`,
          isGift: true,
          giftType: selectedGift.type,
          giftIcon: selectedGift.icon,
          timestamp: Date.now(),
          frameId: currentUser.equippedFrame || null,
          bubbleId: currentUser.equippedBubble || null,
          vipLevel: currentUser.vipLevel || 0,
          adminRole: currentUser.adminRole || null
        };
        
        // Optimistic
        setMessages(prev => [giftMsg, ...prev]);
        await sendMessage(room.id, giftMsg);
        
        if (selectedGift.type === 'animated') {
            triggerAnimation(selectedGift.icon, selectedGift.animationClass);
        } else {
            triggerFloatingHeart();
        }

        setShowGiftPanel(false);

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
      loadingSeatRef.current = index; // Set Ref for listener to check
      
      try { 
          await takeSeat(room.id, index, currentUser);
          
          // Safety Timeout: If server doesn't respond in 5s, reset loading
          setTimeout(() => {
              if (loadingSeatRef.current === index) {
                  setLoadingSeatIndex(null);
                  loadingSeatRef.current = null;
              }
          }, 5000);

      } catch (e) { 
          console.error("Take seat failed", e);
          alert(language === 'ar' ? "فشل صعود المايك (قد يكون مأخوذ)" : "Failed to take seat (might be taken)");
          setLoadingSeatIndex(null); 
          loadingSeatRef.current = null;
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
      unpublishMicrophone();
      
      if (isSeatedRef.current && currentUserRef.current) {
          leaveSeat(room.id, currentUserRef.current).catch(err => console.warn(err));
      }

      onAction('leave');
  };

  const handleToggleMyMute = async () => {
      if (!mySeat) return;
      const nextMutedState = !mySeat.isMuted;
      // Optimistic Mute toggle is fine as it doesn't affect seat occupancy
      setRoom(prev => {
          const newSeats = prev.seats.map(s => s.userId === currentUser.id ? { ...s, isMuted: nextMutedState } : s);
          return { ...prev, seats: newSeats };
      });
      toggleMicMute(nextMutedState);
      try { await toggleSeatMute(room.id, mySeat.index, nextMutedState); } catch (e) {}
  };

  const handleLeaveSeat = async () => {
      if (!mySeat) return;
      // Optimistic leave is fine
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

  const handleBgUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'inner' | 'outer') => {
      const file = e.target.files?.[0];
      if (file) {
          const isGif = file.type === 'image/gif';
          // Lower limit for raw file before even attempting compression
          const MAX_RAW_SIZE = 5 * 1024 * 1024; 

          if (file.size > MAX_RAW_SIZE) {
               alert(language === 'ar' ? "الملف كبير جداً. الحد الأقصى 5 ميجا." : "File too large. Max 5MB.");
               return;
          }

          try {
              const isOuter = type === 'outer';
              // Use improved compression: 1280px, 0.7 quality
              const compressed = await compressImage(file, 1280, 0.7, isGif);
              
              if (compressed.length > 950000) { 
                  alert(language === 'ar' ? "الصورة بعد المعالجة لا تزال كبيرة جداً. حاول استخدام صورة أصغر أو ثابتة." : "Processed image is still too large for database. Please try a smaller/static image.");
                  return;
              }

              if (isOuter) {
                  await handleUpdateRoom({ thumbnail: compressed });
              } else {
                  await handleUpdateRoom({ backgroundImage: compressed });
              }
              alert(language === 'ar' ? "تم تحديث الخلفية بنجاح" : "Background updated successfully");
          } catch (error: any) {
              console.error("Image processing/upload failed", error);
              if (error.code === 'resource-exhausted' || error.message?.includes('too large') || error.toString().includes('too large')) {
                   alert(language === 'ar' ? "فشل الحفظ: حجم البيانات كبير جداً (تجاوز الحد المسموح)." : "Save failed: Data too large (exceeded limit).");
              } else {
                   alert(language === 'ar' ? "فشل معالجة الصورة." : "Failed to process image.");
              }
          }
      }
  };

  const handleKickSeat = (seatIndex: number) => {
      // Keep optimistic update for kicking, as it's an admin action
      setRoom(prev => {
          const newSeats = [...prev.seats];
          if (newSeats[seatIndex]) newSeats[seatIndex] = { ...newSeats[seatIndex], userId: null, userName: null, userAvatar: null, giftCount: 0, adminRole: null, isMuted: false, frameId: null };
          return { ...prev, seats: newSeats };
      });
      kickUserFromSeat(room.id, seatIndex);
      setSelectedUser(null);
  };

  const handleBanRequest = (userId: string) => {
      if (userId === currentUser.id) return;
      setUserToBan(userId);
      setSelectedUser(null);
      setShowBanDurationModal(true);
  };

  const executeBan = async (durationInMinutes: number) => {
      if (!userToBan) return;
      const uid = userToBan;
      
      const targetSeat = seats.find(s => s.userId === uid || (s as any).uid === uid);
      if (targetSeat) handleKickSeat(targetSeat.index);

      const expiry = durationInMinutes === -1 ? -1 : Date.now() + (durationInMinutes * 60 * 1000);
      setRoom(prev => ({ 
          ...prev, 
          bannedUsers: { ...prev.bannedUsers, [uid]: expiry }
      }));

      await banUserFromRoom(room.id, uid, durationInMinutes);
      setShowBanDurationModal(false);
      setUserToBan(null);
  };

  const handleUnbanUser = async (userId: string) => {
      await unbanUserFromRoom(room.id, userId);
      setBannedProfiles(prev => prev.filter(u => u.uid !== userId));
  };

  const handleMakeAdmin = async (userUid: string, userName: string) => { 
      await addRoomAdmin(room.id, userUid); 
      setSelectedUser(null); 
      const msg: ChatMessage = {
          id: Date.now().toString(),
          userId: 'SYSTEM',
          userName: 'System',
          userAvatar: '',
          text: `🎉 تهانينا أصبح ${userName} مسؤول عن الغرفة`,
          timestamp: Date.now(),
          isSystem: true
      };
      await sendMessage(room.id, msg);
  };

  const handleRemoveAdmin = async (userId: string) => { 
      await removeRoomAdmin(room.id, userId); 
      setSelectedUser(null); 
      setAdminProfiles(prev => prev.filter(u => u.uid !== userId));
  };

  const toggleRoomLock = async () => {
      if (room.isLocked) {
          await updateRoomDetails(room.id, { isLocked: false, password: null });
          setRoom(prev => ({ ...prev, isLocked: false }));
      } else {
          setShowLockSetupModal(true);
          setNewRoomPassword('');
      }
  };

  const confirmLock = async () => {
      if (newRoomPassword.length !== 6 || isNaN(Number(newRoomPassword))) {
          alert(language === 'ar' ? 'كلمة المرور يجب أن تكون 6 أرقام' : 'Password must be 6 digits');
          return;
      }
      await updateRoomDetails(room.id, { isLocked: true, password: newRoomPassword });
      setRoom(prev => ({ ...prev, isLocked: true }));
      setShowLockSetupModal(false);
  };

  const getFrameClass = (id?: string | null) => {
      if (!id) return 'border border-white/20';
      return STORE_ITEMS.find(i => i.id === id)?.previewClass || 'border border-white/20';
  };

  const getBubbleClass = (id?: string | null) => {
      if (!id) return 'bg-white/10 text-white rounded-2xl';
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
  const filteredStagedFiles = stagedFiles.filter(f => f.name.toLowerCase().includes(importSearch.toLowerCase()));

  return (
    <div className="relative h-[100dvh] w-full bg-black flex flex-col overflow-hidden">
      
      {/* FULL SCREEN BACKGROUND - High Clarity */}
      <div className="absolute inset-0 z-0 bg-gray-900 overflow-hidden">
        <img 
          src={room.backgroundImage || room.thumbnail} 
          className="w-full h-full object-cover object-center transition-opacity duration-700" 
          alt="Room Background"
        />
        {/* Subtle Gradient Overlay for Text Readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 z-0 pointer-events-none"></div>
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
                        {room.isLocked && <Lock className="w-3 h-3 text-white/70" />}
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

      <div className="relative z-10 w-full px-2 pt-1 pb-1 shrink-0 flex flex-col items-center">
          <div className="flex justify-center mb-2 shrink-0">
             {seats.slice(0, 1).map((seat) => {
                 const isSpeaking = (seat.userId && speakingUsers.has(seat.userId)) || (isMusicPlaying && seat.userId === room.hostId);
                 return (
                 <div key={seat.index} className="flex flex-col items-center relative group">
                    <div onClick={() => handleSeatClick(seat.index, seat.userId)} className={`w-16 h-16 rounded-full relative bg-black/40 backdrop-blur overflow-visible cursor-pointer transition transform active:scale-95 p-[3px] ${seat.userId ? getFrameClass(seat.frameId) : 'border-2 border-white/20 border-dashed'}`}>
                         {loadingSeatIndex === seat.index ? <Loader2 className="w-6 h-6 text-brand-500 animate-spin absolute inset-0 m-auto" /> : seat.userId ? (
                             <>
                                <img src={seat.userAvatar!} className="w-full h-full rounded-full object-cover relative z-10" />
                                {/* Beautiful Sound Wave for Host */}
                                {!seat.isMuted && isSpeaking && (
                                    <>
                                        <div className="absolute inset-0 rounded-full border-4 border-brand-400 opacity-60 animate-[ping_1.5s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
                                        <div className="absolute inset-0 rounded-full border-4 border-brand-300 opacity-40 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
                                    </>
                                )}
                                {seat.isMuted && <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center z-20"><MicOff className="w-4 h-4 text-red-500"/></div>}
                                <div className="absolute -top-3 -right-1 bg-yellow-500 p-1 rounded-full z-20"><Crown className="w-2.5 h-2.5 text-black" /></div>
                             </>
                         ) : <div className="text-gray-400 text-[10px] text-center w-full h-full flex items-center justify-center">{t('host')}</div>}
                    </div>
                    {seat.userId && (
                        <div className="mt-1 w-[70px] bg-white/10 rounded-full px-2 py-0.5 overflow-hidden">
                            <div className="text-[9px] text-white/90 font-medium whitespace-nowrap animate-marquee">{seat.userName}</div>
                        </div>
                    )}
                    <div className="mt-0.5 bg-black/50 backdrop-blur px-2 py-0.5 rounded-full text-[8px] text-yellow-300 border border-yellow-500/30 flex items-center gap-1"><GiftIcon className="w-2 h-2" /> {seat.giftCount}</div>
                 </div>
                 )
             })}
          </div>
          
          <div className="grid grid-cols-5 gap-y-3 gap-x-2 justify-items-center w-full max-w-sm shrink-0">
             {seats.slice(1).map((seat) => {
                 const isSpeaking = seat.userId && speakingUsers.has(seat.userId);
                 return (
                 <div key={seat.index} className="flex flex-col items-center w-full relative">
                    <div onClick={() => handleSeatClick(seat.index, seat.userId)} className={`w-12 h-12 rounded-full relative bg-black/30 backdrop-blur p-[2px] ${seat.userId ? getFrameClass(seat.frameId) : 'border border-white/10 border-dashed'} flex items-center justify-center`}>
                        {loadingSeatIndex === seat.index ? <Loader2 className="w-5 h-5 text-brand-500 animate-spin" /> : seat.userId ? (
                            <>
                                <img src={seat.userAvatar!} className="w-full h-full rounded-full object-cover relative z-10" />
                                {/* Beautiful Sound Wave for Users */}
                                {!seat.isMuted && isSpeaking && (
                                    <>
                                        <div className="absolute inset-0 rounded-full border-2 border-green-400 opacity-60 animate-[ping_1.5s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
                                        <div className="absolute inset-0 rounded-full border-2 border-green-300 opacity-40 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
                                    </>
                                )}
                                {seat.isMuted && <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center z-20"><MicOff className="w-3 h-3 text-red-500"/></div>}
                            </>
                        ) : (seat.isLocked ? <Lock className="w-3 h-3 text-red-400/70" /> : <span className="text-white/20 text-[9px] font-bold">{seat.index}</span>)}
                    </div>
                    {seat.userId ? (
                        <div className="mt-1 w-[55px] bg-white/10 rounded-full px-2 py-0.5 overflow-hidden">
                            <div className="text-[8px] text-white/90 font-medium whitespace-nowrap animate-marquee">{seat.userName}</div>
                        </div>
                    ) : (
                        <div className="mt-1 text-[8px] text-white/50">{seat.isLocked ? t('lock') : ''}</div>
                    )}
                    <div className="mt-0.5 text-[7px] text-yellow-500 font-mono flex items-center gap-0.5">{seat.giftCount > 0 && <><GiftIcon className="w-2 h-2"/> {seat.giftCount}</>}</div>
                 </div>
                 )
             })}
          </div>

          <div className="mt-2 w-full max-w-sm p-1.5 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-bottom-2 shrink-0">
              <div className="flex items-center gap-2">
                 <div className="p-1 bg-brand-500/20 rounded-full text-brand-400 border border-brand-500/30">
                    <BarChart3 className="w-3 h-3" />
                 </div>
                 <span className="text-[10px] font-bold text-white/90">
                    {activeSeats.length} {t('onMic')}
                 </span>
              </div>
              
              <div className="flex -space-x-1.5 rtl:space-x-reverse">
                 {activeSeats.slice(0, 3).map((seat) => (
                    <img key={seat.index} src={seat.userAvatar!} className="w-6 h-6 rounded-full border border-gray-900 object-cover" />
                 ))}
                 {activeSeats.length > 3 && (
                    <div className="w-6 h-6 rounded-full bg-gray-800 border border-gray-900 flex items-center justify-center text-[8px] font-bold text-white">
                       +{activeSeats.length - 3}
                    </div>
                 )}
              </div>
          </div>
      </div>

      <div className="relative z-20 flex-1 flex flex-col min-h-0 bg-gradient-to-t from-black via-black/80 to-transparent w-full">
          <div className="px-4 py-2 mx-4 mt-1 bg-brand-900/60 backdrop-blur border-l-4 border-brand-500 rounded-r-lg mb-2 shadow-sm animate-in fade-in flex flex-col gap-1 shrink-0">
              <div className="flex items-start gap-2 border-b border-white/10 pb-1 mb-1">
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
                  const isYellowMsg = msg.text.startsWith('🎉 تهانينا');

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
                      <div key={msg.id} className="flex items-start gap-2 animate-in slide-in-from-bottom-2">
                          <div className={`relative w-8 h-8 shrink-0 p-[2px] rounded-full ${isAi ? 'border-2 border-brand-400 shadow-lg' : getFrameClass(msg.frameId)}`}>
                              {msg.userAvatar ? <img src={msg.userAvatar} className="w-full h-full rounded-full object-cover" /> : <div className="w-full h-full bg-gray-600 rounded-full"></div>}
                              {isOfficial && <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-[1px]"><BadgeCheck className="w-3 h-3 text-blue-500 fill-blue-100" /></div>}
                              {isAi && <div className="absolute -bottom-1 -right-1 bg-black rounded-full p-[2px]"><Bot className="w-3 h-3 text-brand-400" /></div>}
                          </div>
                          <div className="flex flex-col items-start max-w-[80%]">
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
                              <div className={`px-3 py-1.5 text-xs leading-relaxed text-white shadow-sm break-words border border-white/5 backdrop-blur-md ${bubbleClass} rounded-tr-none ${isYellowMsg ? 'text-yellow-300 font-bold border-yellow-500/50 bg-yellow-900/20' : ''}`}>{msg.text}</div>
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
              <button onClick={() => setShowOptionsMenu(true)} className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20"><LayoutGrid className="w-5 h-5" /></button>
          </div>
      </div>

      {/* Options Menu, Music Player, Import View, Gift Panel, Modals... (unchanged structure, just ensured they are rendered) */}
      {showOptionsMenu && (
          <div className="absolute inset-0 z-[70] flex flex-col justify-end bg-black/60 backdrop-blur-sm animate-in slide-in-from-bottom-10" onClick={() => setShowOptionsMenu(false)}>
              <div className="bg-gray-900/30 backdrop-blur-3xl border-t border-white/20 rounded-t-3xl p-5 shadow-2xl" onClick={e => e.stopPropagation()}>
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="text-white font-bold">{t('menu')}</h3>
                      <button onClick={() => setShowOptionsMenu(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5"/></button>
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                      <div onClick={() => { setShowOptionsMenu(false); setShowMusicMiniPlayer(true); }} className="flex flex-col items-center gap-2 cursor-pointer group">
                          <div className="p-3 bg-pink-600/20 text-pink-400 rounded-2xl group-hover:bg-pink-600/30 transition"><Music className="w-6 h-6"/></div>
                          <span className="text-xs text-gray-300 font-medium">{t('music')}</span>
                      </div>

                      <div onClick={() => {}} className="flex flex-col items-center gap-2 cursor-pointer group">
                          <div className="p-3 bg-blue-600/20 text-blue-400 rounded-2xl group-hover:bg-blue-600/30 transition"><Share2 className="w-6 h-6"/></div>
                          <span className="text-xs text-gray-300 font-medium">{t('share')}</span>
                      </div>
                      
                      {canManageRoom && (
                          <div onClick={() => { setShowOptionsMenu(false); setShowRoomSettings(true); }} className="flex flex-col items-center gap-2 cursor-pointer group">
                              <div className="p-3 bg-purple-600/20 text-purple-400 rounded-2xl group-hover:bg-purple-600/30 transition"><Settings className="w-6 h-6"/></div>
                              <span className="text-xs text-gray-300 font-medium">{t('roomSettings')}</span>
                          </div>
                      )}

                      <div onClick={() => { onAction('minimize'); setShowOptionsMenu(false); }} className="flex flex-col items-center gap-2 cursor-pointer group">
                          <div className="p-3 bg-gray-600/20 text-gray-300 rounded-2xl group-hover:bg-gray-600/30 transition"><Minimize2 className="w-6 h-6"/></div>
                          <span className="text-xs text-gray-300 font-medium">{t('minimize')}</span>
                      </div>

                      <div onClick={() => { setShowOptionsMenu(false); setShowExitModal(true); }} className="flex flex-col items-center gap-2 cursor-pointer group">
                          <div className="p-3 bg-red-600/20 text-red-400 rounded-2xl group-hover:bg-red-600/30 transition"><LogOut className="w-6 h-6"/></div>
                          <span className="text-xs text-gray-300 font-medium">{t('leave')}</span>
                      </div>

                      <div onClick={() => {}} className="flex flex-col items-center gap-2 cursor-pointer group">
                          <div className="p-3 bg-orange-600/20 text-orange-400 rounded-2xl group-hover:bg-orange-600/30 transition"><Flag className="w-6 h-6"/></div>
                          <span className="text-xs text-gray-300 font-medium">{t('report')}</span>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {showMusicMiniPlayer && (
          <div className="absolute inset-0 z-[80] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in">
              <div className="w-80 bg-gray-900/30 backdrop-blur-2xl border border-white/20 rounded-[2rem] p-6 shadow-2xl flex flex-col items-center relative overflow-hidden ring-1 ring-white/10">
                  <button onClick={() => setShowMusicMiniPlayer(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white z-20">
                      <X className="w-6 h-6"/>
                  </button>
                  <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-gold-400 mb-6 tracking-wide">
                      {t('music')}
                  </h2>
                  <div className="relative w-48 h-48 mb-6 flex items-center justify-center">
                      <div className={`absolute inset-0 rounded-full bg-gray-900/80 border-4 border-gray-700/50 shadow-xl flex items-center justify-center overflow-hidden ${isMusicPlaying ? 'animate-spin-slow' : ''}`}>
                          <div className="absolute inset-2 rounded-full border border-gray-700/30"></div>
                          <div className="absolute inset-6 rounded-full border border-gray-700/30"></div>
                          <div className="absolute inset-10 rounded-full border border-gray-700/30"></div>
                          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-brand-600/80 to-purple-800/80 flex items-center justify-center shadow-inner relative z-10 border-2 border-gray-800/50">
                              <Hexagon className="w-8 h-8 text-white fill-white/20" strokeWidth={1.5} />
                          </div>
                      </div>
                  </div>
                  <div className="w-full text-center mb-4">
                      <h3 className="text-white font-bold text-sm truncate px-2 drop-shadow-md">
                          {currentSong ? currentSong.name : t('chooseMusic')}
                      </h3>
                      <p className="text-brand-300 text-[10px] font-mono mt-1">
                          {formatTime(musicProgress)} / {formatTime(musicDuration)}
                      </p>
                  </div>
                  <input type="range" min="0" max={musicDuration || 100} value={musicProgress} onChange={handleMusicSeek} className="w-full h-1 bg-white/20 rounded-full appearance-none cursor-pointer mb-6 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-gold-500 [&::-webkit-slider-thumb]:rounded-full"/>
                  <div className="flex items-center justify-center gap-6 mb-6 w-full relative">
                      <button className="text-gray-300 hover:text-white transition transform active:scale-95"><SkipBack className="w-6 h-6 fill-current"/></button>
                      <button onClick={toggleMusicPlay} className="w-12 h-12 bg-gradient-to-br from-brand-500 to-purple-600 rounded-full text-white flex items-center justify-center shadow-lg shadow-brand-500/30 hover:scale-105 transition transform active:scale-95 border border-white/10" disabled={!currentSong}>{isMusicPlaying ? <Pause className="w-6 h-6 fill-current"/> : <Play className="w-6 h-6 fill-current ml-1"/>}</button>
                      <button className="text-gray-300 hover:text-white transition transform active:scale-95"><SkipForward className="w-6 h-6 fill-current"/></button>
                  </div>
                  <button onClick={() => setShowMusicPlaylist(true)} className="absolute bottom-4 left-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition border border-white/5" title={t('playlist')}><ListMusic className="w-5 h-5" /></button>
                  <div className="absolute bottom-4 right-4 w-20 flex items-center gap-1">
                      <Volume2 className="w-4 h-4 text-gray-300"/>
                      <input type="range" min="0" max="100" value={musicVolume} onChange={handleMusicVolumeChange} className="flex-1 h-1 bg-white/30 rounded-full appearance-none cursor-pointer"/>
                  </div>
              </div>
          </div>
      )}

      {showImportView && (
          <div className="absolute inset-0 z-[100] bg-gray-900/30 backdrop-blur-3xl flex flex-col animate-in slide-in-from-bottom-20">
              {/* Import View Content */}
              <div className="p-4 bg-gray-800/50 backdrop-blur border-b border-white/10 flex items-center gap-3">
                  <button onClick={() => { setShowImportView(false); setStagedFiles([]); }} className="p-2 rounded-full hover:bg-white/10 text-white">
                      <ArrowLeft className="w-6 h-6 rtl:rotate-180" />
                  </button>
                  <h1 className="text-lg font-bold text-white flex items-center gap-2">
                      <Upload className="w-5 h-5 text-brand-400"/> {t('importTitle')}
                  </h1>
              </div>
              <div className="flex-1 p-4 overflow-y-auto">
                  {stagedFiles.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center space-y-6">
                          <div className="p-6 bg-white/5 rounded-full border-2 border-dashed border-white/20">
                              <Music className="w-12 h-12 text-gray-500" />
                          </div>
                          <div className="text-center">
                              <h3 className="text-white font-bold text-lg mb-2">{t('selectFiles')}</h3>
                              <p className="text-gray-400 text-sm max-w-xs">{t('importDesc')}</p>
                          </div>
                          <label className="bg-brand-600 hover:bg-brand-500 text-white px-8 py-3 rounded-full font-bold shadow-lg shadow-brand-500/20 cursor-pointer transition transform active:scale-95 flex items-center gap-2">
                              <input type="file" accept="audio/*" multiple className="hidden" onChange={handleInitialFileSelect}/>
                              <Plus className="w-5 h-5" /> {t('selectFiles')}
                          </label>
                      </div>
                  ) : (
                      <div className="flex flex-col h-full">
                          <div className="relative mb-4">
                              <Search className="absolute top-3 left-4 text-gray-500 w-4 h-4 rtl:right-4 rtl:left-auto" />
                              <input type="text" placeholder={t('searchMusic')} value={importSearch} onChange={(e) => setImportSearch(e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-xl py-2.5 px-10 text-white text-sm focus:border-brand-500 outline-none"/>
                          </div>
                          <div className="flex justify-between items-center mb-2 px-1">
                              <span className="text-xs text-gray-400 font-medium">{stagedFiles.length} songs found</span>
                              <button onClick={selectAllStaged} className="text-brand-400 text-xs font-bold hover:text-brand-300">{t('selectAll')}</button>
                          </div>
                          <div className="space-y-2 pb-20">
                              {filteredStagedFiles.map((file) => (
                                  <div key={file.id} onClick={() => toggleStagedFile(file.id)} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${file.selected ? 'bg-brand-900/30 border-brand-500/50' : 'bg-white/5 border-transparent hover:bg-white/10'}`}>
                                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${file.selected ? 'bg-brand-500 text-white' : 'bg-gray-800 text-gray-500'}`}><Music className="w-5 h-5" /></div>
                                      <div className="flex-1 min-w-0">
                                          <div className={`text-sm font-bold truncate ${file.selected ? 'text-brand-200' : 'text-white'}`}>{file.name}</div>
                                          <div className="text-[10px] text-gray-500">Local File</div>
                                      </div>
                                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${file.selected ? 'border-brand-500 bg-brand-500' : 'border-gray-500'}`}>{file.selected && <Check className="w-3 h-3 text-white" />}</div>
                                  </div>
                              ))}
                          </div>
                      </div>
                  )}
              </div>
              {stagedFiles.length > 0 && (
                  <div className="p-4 bg-gray-900/90 backdrop-blur border-t border-white/10 absolute bottom-0 left-0 right-0 z-10">
                      <button onClick={confirmImport} className="w-full py-3 bg-gradient-to-r from-brand-600 to-purple-600 text-white rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition">
                          <CheckCircle2 className="w-5 h-5" /> {t('confirmImport')} ({stagedFiles.filter(f => f.selected).length})
                      </button>
                  </div>
              )}
          </div>
      )}

      {showMusicPlaylist && (
          <div className="absolute inset-0 z-[90] bg-gray-900 flex flex-col animate-in slide-in-from-right font-sans">
              <div className="p-4 bg-gray-800/80 backdrop-blur shadow-md flex items-center gap-3 border-b border-white/5">
                  <button onClick={() => setShowMusicPlaylist(false)} className="p-2 rounded-full hover:bg-white/10 text-white">
                      <ArrowLeft className="w-6 h-6 rtl:rotate-180" />
                  </button>
                  <h1 className="text-lg font-bold text-white flex items-center gap-2">
                      <ListMusic className="w-5 h-5 text-brand-400"/> {t('playlist')}
                  </h1>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {playlist.length === 0 ? (
                      <div className="flex flex-col items-center justify-center mt-20 opacity-50">
                          <Music className="w-16 h-16 text-gray-600 mb-4"/>
                          <p className="text-gray-400 text-sm">{t('noMusic') || "No music added yet"}</p>
                      </div>
                  ) : (
                      playlist.map((song) => (
                          <div key={song.id} className={`flex items-center justify-between p-3 rounded-xl border transition ${currentSong?.id === song.id ? 'bg-brand-900/30 border-brand-500/50' : 'bg-gray-800/50 border-gray-700 hover:border-gray-500'}`}>
                              <div className="flex items-center gap-3 overflow-hidden cursor-pointer flex-1" onClick={() => { playSong(song); setShowMusicPlaylist(false); }}>
                                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${currentSong?.id === song.id ? 'bg-brand-500 text-white' : 'bg-gray-700 text-gray-400'}`}><Music className="w-5 h-5" /></div>
                                  <div className="flex flex-col min-w-0">
                                      <span className={`text-sm font-bold truncate ${currentSong?.id === song.id ? 'text-brand-300' : 'text-white'}`}>{song.name}</span>
                                      <span className="text-[10px] text-gray-500">{t('localMusic')}</span>
                                  </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {currentSong?.id === song.id && isMusicPlaying && (
                                    <div className="flex gap-0.5 items-end h-4 mr-2">
                                        <div className="w-1 bg-brand-400 animate-[music-wave_0.6s_ease-in-out_infinite] h-2"></div>
                                        <div className="w-1 bg-brand-400 animate-[music-wave_0.8s_ease-in-out_infinite] h-4"></div>
                                        <div className="w-1 bg-brand-400 animate-[music-wave_1.0s_ease-in-out_infinite] h-3"></div>
                                    </div>
                                )}
                                <button onClick={(e) => handleDeleteSong(song.id, e)} className="p-2 text-red-400 hover:text-red-300 rounded-full hover:bg-red-900/20"><Trash2 className="w-4 h-4" /></button>
                              </div>
                          </div>
                      ))
                  )}
              </div>
              <div className="p-4 bg-gray-900 border-t border-white/5 pb-8">
                  <button onClick={() => { setShowMusicPlaylist(false); setShowImportView(true); }} className="w-full py-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-md flex items-center justify-center gap-2 cursor-pointer transition active:scale-95 group">
                      <div className="p-2 bg-brand-600 rounded-full group-hover:bg-brand-500 transition shadow-lg shadow-brand-500/20"><Plus className="w-6 h-6 text-white"/></div>
                      <span className="text-white font-bold text-sm tracking-wide">{t('addMusic')}</span>
                  </button>
              </div>
          </div>
      )}

      {showGiftPanel && (
          <div className="absolute inset-0 z-50 flex flex-col justify-end bg-black/50 backdrop-blur-sm animate-in slide-in-from-bottom-10">
              <div className="bg-gray-900/30 backdrop-blur-3xl border-t border-white/20 rounded-t-3xl p-4 shadow-2xl h-[60vh] flex flex-col">
                  <div className="flex gap-4 overflow-x-auto p-2 mb-2 border-b border-white/5 no-scrollbar min-h-[60px] items-center flex-row">
                        <div onClick={() => toggleGiftTarget('all')} className={`flex flex-col items-center gap-1 cursor-pointer shrink-0 transition-transform active:scale-95 ${giftTargets.includes('all') ? 'opacity-100 scale-105' : 'opacity-60'}`}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${giftTargets.includes('all') ? 'border-brand-500 bg-brand-500/20 text-white' : 'border-gray-600 bg-gray-800 text-gray-400'}`}><Users className="w-5 h-5" /></div>
                            <span className={`text-[9px] font-bold ${giftTargets.includes('all') ? 'text-brand-400' : 'text-gray-400'}`}>{t('all')}</span>
                        </div>
                        {activeSeats.map(seat => (
                            <div key={seat.index} onClick={() => toggleGiftTarget(seat.userId!)} className={`flex flex-col items-center gap-1 cursor-pointer shrink-0 transition-transform active:scale-95 relative ${giftTargets.includes(seat.userId!) ? 'opacity-100 scale-105' : 'opacity-60'}`}>
                                <div className={`w-10 h-10 rounded-full p-[2px] relative ${giftTargets.includes(seat.userId!) ? 'border-2 border-brand-500' : 'border border-gray-600'}`}>
                                    <img src={seat.userAvatar!} className="w-full h-full rounded-full object-cover" />
                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-black/80 rounded-full flex items-center justify-center text-[8px] text-white border border-gray-600 font-bold">{seat.index}</div>
                                    {giftTargets.includes(seat.userId!) && (<div className="absolute inset-0 bg-brand-500/30 rounded-full flex items-center justify-center"><Check className="w-5 h-5 text-white drop-shadow-md"/></div>)}
                                </div>
                                <span className={`text-[9px] max-w-[60px] truncate ${giftTargets.includes(seat.userId!) ? 'text-brand-400 font-bold' : 'text-gray-400'}`}>{seat.userName}</span>
                            </div>
                        ))}
                  </div>
                  <div className="flex justify-between items-center mb-2">
                      <div className="flex gap-2">
                          <button onClick={() => setGiftTab('static')} className={`px-4 py-1.5 rounded-full text-xs font-bold transition ${giftTab === 'static' ? 'bg-white text-black' : 'bg-gray-800/50 text-gray-400'}`}>{t('static')}</button>
                          <button onClick={() => setGiftTab('animated')} className={`px-4 py-1.5 rounded-full text-xs font-bold transition ${giftTab === 'animated' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg' : 'bg-gray-800/50 text-gray-400'}`}>{t('animated')}</button>
                      </div>
                      <button onClick={() => setShowGiftPanel(false)}><X className="w-5 h-5 text-gray-500" /></button>
                  </div>
                  <div className="flex-1 overflow-y-auto grid grid-cols-4 gap-3 pb-2 content-start custom-scrollbar">
                      {filteredGifts.map(gift => (
                          <button key={gift.id} onClick={() => setSelectedGift(gift)} disabled={isSendingGift} className={`flex flex-col items-center p-2 rounded-xl border transition relative group ${selectedGift?.id === gift.id ? 'border-brand-500 bg-brand-500/10' : 'border-transparent hover:bg-white/5'} ${isSendingGift ? 'opacity-50 cursor-not-allowed' : ''}`}>
                              <span className={`text-4xl mb-1 filter drop-shadow-md transition ${selectedGift?.id === gift.id ? 'scale-110' : 'group-hover:scale-105'}`}>{gift.icon}</span>
                              <span className="text-[10px] text-gray-300 font-medium truncate w-full text-center">{gift.name}</span>
                              <div className="flex items-center gap-0.5 mt-1 bg-black/30 px-1.5 py-0.5 rounded text-[9px]"><span className="text-yellow-500">💎</span><span className="text-yellow-100 font-bold">{gift.cost}</span></div>
                          </button>
                      ))}
                  </div>
                  <div className="pt-3 border-t border-white/5 flex gap-2 items-center">
                      <div className="flex items-center gap-2 bg-black/40 rounded-full px-3 py-2 border border-white/10 flex-1 min-w-0 relative group">
                          <span className="text-gray-400 text-xs whitespace-nowrap">{t('multiplier')}:</span>
                          <div className="relative flex-1">
                              <select value={giftMultiplier} onChange={(e) => setGiftMultiplier(Number(e.target.value))} className="appearance-none bg-transparent text-white text-xs font-bold w-full outline-none text-center cursor-pointer">
                                  {[1, 7, 17, 77, 777].map(num => (<option key={num} value={num} className="bg-gray-900 text-white">x{num}</option>))}
                              </select>
                              <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none"><ArrowDownCircle className="w-3 h-3 text-brand-400"/></div>
                          </div>
                      </div>
                      <div className="flex items-center gap-1 bg-black/40 px-3 py-2 rounded-full border border-white/10 shrink-0">
                          <span className="text-xs text-yellow-500">💎</span>
                          <span className="text-xs font-bold text-white">{currentUser.wallet?.diamonds || 0}</span>
                      </div>
                      <button onClick={executeSendGift} disabled={isSendingGift || !selectedGift} className="bg-gradient-to-r from-brand-600 to-accent-600 text-white font-bold py-2 px-6 rounded-full shadow-lg hover:shadow-brand-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition transform active:scale-95 flex items-center gap-2 shrink-0">
                          {isSendingGift ? <Loader2 className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4 rtl:rotate-180"/>} {t('send')}
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
                      setGiftTargets([selectedUser.userId || 'all']);
                      setSelectedUser(null);
                      setShowGiftPanel(true);
                  }}
                  onKickSeat={canBanTarget && selectedUser.userId ? () => handleKickSeat(selectedUser.index) : undefined}
                  onBanUser={canBanTarget && selectedUser.userId ? () => handleBanRequest(selectedUser.userId!) : undefined}
                  onMakeAdmin={isHost && !isTargetAdmin && !isTargetMe ? () => handleMakeAdmin(targetUid, selectedUser.userName!) : undefined}
                  onRemoveAdmin={isHost && isTargetAdmin && !isTargetMe ? () => handleRemoveAdmin(targetUid) : undefined}
                  onLeaveSeat={(isTargetMe && mySeat) ? () => { handleLeaveSeat(); setSelectedUser(null); } : undefined}
                  onOpenFullProfile={(user) => {
                      setFullProfileUser(user);
                      setSelectedUser(null);
                  }}
              />
          );
      })()}

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
                                          {viewer.id === 'OFFECAL' && <BadgeCheck className="w-3 h-3 text-blue-500 fill-blue-100" />}
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
                              
                              <div onClick={toggleRoomLock} className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${room.isLocked ? 'bg-red-500/10 border-red-500/30' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}>
                                  <div className="flex items-center gap-2">
                                      <div className={`p-2 rounded-lg ${room.isLocked ? 'bg-red-500/20 text-red-400' : 'bg-gray-700 text-gray-400'}`}>
                                          {room.isLocked ? <Lock className="w-5 h-5"/> : <Unlock className="w-5 h-5"/>}
                                      </div>
                                      <div>
                                          <h4 className={`text-sm font-bold ${room.isLocked ? 'text-red-400' : 'text-white'}`}>{room.isLocked ? t('unlockRoom') : t('lockRoom')}</h4>
                                          <p className="text-[10px] text-gray-400">{room.isLocked ? 'Room is currently locked' : 'Set a password for entry'}</p>
                                      </div>
                                  </div>
                                  <div className={`w-4 h-4 rounded-full border-2 ${room.isLocked ? 'bg-red-500 border-red-500' : 'border-gray-500'}`}></div>
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
                              {loadingProfiles ? <div className="text-center text-gray-500"><Loader2 className="w-6 h-6 animate-spin mx-auto"/></div> : bannedProfiles.length === 0 ? <div className="text-gray-500 text-center text-xs py-10">No banned users</div> : bannedProfiles.map((user) => (
                                  <div key={user.uid} className="flex justify-between items-center bg-gray-800 p-2 rounded-lg border border-gray-700">
                                      <div className="flex items-center gap-2">
                                          <img src={user.avatar} className="w-8 h-8 rounded-full object-cover border border-gray-600" />
                                          <div className="flex flex-col">
                                              <span className="text-white text-xs font-bold">{user.name}</span>
                                              <span className="text-[9px] text-gray-400 font-mono">{user.id}</span>
                                          </div>
                                      </div>
                                      <button onClick={() => handleUnbanUser(user.uid!)} className="text-[10px] bg-green-600/20 text-green-400 px-3 py-1.5 rounded border border-green-600/50 font-bold">{t('unban')}</button>
                                  </div>
                              ))}
                          </div>
                      )}
                      {settingsTab === 'admins' && isHost && (
                          <div className="space-y-2">
                              <h4 className="text-xs text-gray-400 font-bold mb-2 uppercase">{t('adminList')}</h4>
                              {loadingProfiles ? <div className="text-center text-gray-500"><Loader2 className="w-6 h-6 animate-spin mx-auto"/></div> : adminProfiles.length === 0 ? <div className="text-gray-500 text-center text-xs py-10">No admins appointed</div> : adminProfiles.map(user => (
                                  <div key={user.uid} className="flex justify-between items-center bg-gray-800 p-2 rounded-lg border border-blue-900/50">
                                      <div className="flex items-center gap-2">
                                          <img src={user.avatar} className="w-8 h-8 rounded-full object-cover border border-blue-500" />
                                          <div className="flex flex-col">
                                              <span className="text-white text-xs font-bold">{user.name}</span>
                                              <span className="text-[9px] text-gray-400 font-mono">{user.id}</span>
                                          </div>
                                      </div>
                                      <button onClick={() => handleRemoveAdmin(user.uid!)} className="text-[10px] bg-red-600/20 text-red-400 px-3 py-1.5 rounded border border-red-600/50 font-bold">{t('remove')}</button>
                                  </div>
                              ))}
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

      {showLockSetupModal && (
          <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
              <div className="bg-gray-900 border border-gray-700 rounded-3xl w-full max-w-xs shadow-2xl p-6 relative text-center">
                  <h3 className="text-white font-bold text-lg mb-4 flex items-center justify-center gap-2">
                      <KeyRound className="w-5 h-5 text-brand-400"/>
                      {t('setPassword')}
                  </h3>
                  <input 
                      type="number" 
                      placeholder={t('passPlaceholder')}
                      value={newRoomPassword}
                      onChange={(e) => { if(e.target.value.length <= 6) setNewRoomPassword(e.target.value); }}
                      className="w-full bg-black/50 border border-gray-600 rounded-xl py-3 px-4 text-center text-white tracking-widest text-lg focus:border-brand-500 outline-none mb-4"
                  />
                  <div className="flex gap-2">
                      <button onClick={() => setShowLockSetupModal(false)} className="flex-1 py-2 rounded-xl bg-gray-800 text-gray-400">{t('cancel')}</button>
                      <button onClick={confirmLock} className="flex-1 py-2 rounded-xl bg-brand-600 text-white font-bold">{t('confirm')}</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default RoomView;