import React, { useState, useEffect } from 'react';
import { Shield, Trash2, Ban, Search, Gift, Crown, ArrowLeft, RefreshCw, CheckCircle, Megaphone, Edit3, Send, Home, XCircle, Flame, Image as ImageIcon, Plus, X, Database, Clock, Gamepad2, BadgeCheck, Coins, Trophy, Ghost, Lock, Unlock, Percent, AlertTriangle, MessageCircle, Film, Play } from 'lucide-react';
import { getAllUsers, adminUpdateUser, deleteAllRooms, sendSystemNotification, broadcastOfficialMessage, searchUserByDisplayId, getRoomsByHostId, adminBanRoom, deleteRoom, toggleRoomHotStatus, toggleRoomActivitiesStatus, addBanner, deleteBanner, listenToBanners, syncRoomIdsWithUserIds, toggleRoomOfficialStatus, resetAllUsersCoins, resetAllRoomCups, resetAllGhostUsers, updateRoomGameConfig, resetAllChats, deleteUserProfile, addStoreItem, getStoreItems, deleteStoreItem } from '../services/firebaseService';
import { Language, User, Room, Banner, StoreItem } from '../types';
import { VIP_TIERS, ADMIN_ROLES } from '../constants';

interface AdminDashboardProps {
  onBack: () => void;
  language: Language;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack, language }) => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'agencies' | 'system' | 'official' | 'banners' | 'entrances'>('users');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Search Results
  const [searchedUser, setSearchedUser] = useState<User | null>(null);
  const [searchedRooms, setSearchedRooms] = useState<Room[]>([]); 

  // Banners
  const [banners, setBanners] = useState<Banner[]>([]);
  const [newBannerImage, setNewBannerImage] = useState('');
  const [newBannerTitle, setNewBannerTitle] = useState('');

  // Entrances
  const [entranceEffects, setEntranceEffects] = useState<StoreItem[]>([]);
  const [newEntranceVideo, setNewEntranceVideo] = useState('');
  const [newEntranceName, setNewEntranceName] = useState('');

  // Modals / Inputs
  const [showVipModal, setShowVipModal] = useState<string | null>(null);
  const [showGiftModal, setShowGiftModal] = useState<string | null>(null);
  const [giftAmount, setGiftAmount] = useState('');
  
  const [showIdModal, setShowIdModal] = useState<string | null>(null);
  const [newCustomId, setNewCustomId] = useState('');

  // Ban Modal
  const [showBanModal, setShowBanModal] = useState<string | null>(null);
  const [banDuration, setBanDuration] = useState<number>(-1); // -1 Permanent, 1, 3, 7, 30 days

  const [officialTitle, setOfficialTitle] = useState('');
  const [officialBody, setOfficialBody] = useState('');

  useEffect(() => {
    fetchUsers();
    const unsubBanners = listenToBanners((data) => setBanners(data));
    return () => unsubBanners();
  }, []);

  useEffect(() => {
      if (activeTab === 'entrances') {
          loadEntrances();
      }
  }, [activeTab]);

  const loadEntrances = async () => {
      setLoading(true);
      const items = await getStoreItems();
      setEntranceEffects(items.filter(i => i.type === 'entrance'));
      setLoading(false);
  };

  const fetchUsers = async () => {
    setLoading(true);
    const data = await getAllUsers();
    setUsers(data);
    setLoading(false);
  };

  const handleSearch = async () => {
      if(!searchTerm) return;
      setLoading(true);
      setSearchedUser(null);
      setSearchedRooms([]);

      // Search User
      const user = await searchUserByDisplayId(searchTerm);
      if (user) {
          setSearchedUser(user);
          // If user found, find ALL their rooms
          if (user.uid) {
              const rooms = await getRoomsByHostId(user.uid);
              // Initialize room objects with defaults if fields are missing to ensure controlled inputs
              const cleanRooms = rooms.map(r => ({
                  ...r,
                  gameLuck: r.gameLuck !== undefined ? r.gameLuck : 50,
                  gameMode: r.gameMode || 'FAIR',
                  hookThreshold: r.hookThreshold || 50000
              }));
              setSearchedRooms(cleanRooms);
          }
      }
      setLoading(false);
  };

  // Helper to update local room state for inputs
  const handleLocalRoomChange = (roomId: string, field: keyof Room, value: any) => {
      setSearchedRooms(prev => prev.map(r => 
          r.id === roomId ? { ...r, [field]: value } : r
      ));
  };

  const initiateBanAction = (user: User) => {
      if (user.isBanned) {
          confirmBanUser(user.uid!, false);
      } else {
          setShowBanModal(user.uid!);
          setBanDuration(-1);
      }
  };

  const confirmBanUser = async (uid: string, shouldBan: boolean) => {
      setActionLoading(uid);
      try {
          const updateData: Partial<User> = { isBanned: shouldBan };
          
          if (shouldBan) {
              updateData.isPermanentBan = banDuration === -1;
              if (banDuration !== -1) {
                  const expiryDate = new Date();
                  expiryDate.setDate(expiryDate.getDate() + banDuration);
                  updateData.banExpiresAt = expiryDate.getTime();
              } else {
                  updateData.banExpiresAt = 0;
              }
          } else {
              updateData.isPermanentBan = false;
              updateData.banExpiresAt = 0;
          }

          await adminUpdateUser(uid, updateData);
          if (searchedUser && searchedUser.uid === uid) {
              setSearchedUser({...searchedUser, ...updateData});
          }
          await fetchUsers();
          if (shouldBan) alert("تم حظر المستخدم بنجاح");
          else alert("تم فك الحظر بنجاح");
      } catch (e) {
          alert("فشل تحديث حالة الحظر");
      }
      setActionLoading(null);
      setShowBanModal(null);
  };

  const handleSetAdminRole = async (uid: string, role: 'super_admin' | 'admin' | 'official_manager' | 'me_manager' | null) => {
      setActionLoading(uid);
      try {
          await adminUpdateUser(uid, { 
              adminRole: role,
              isAdmin: role !== null
          });
          const roleName = role ? ADMIN_ROLES[role].name.ar : 'مستخدم عادي';
          await sendSystemNotification(uid, "تحديث الصلاحيات", `تم تحديث صلاحياتك إلى: ${roleName}`);
          
          if (searchedUser && searchedUser.uid === uid) {
              setSearchedUser({...searchedUser, adminRole: role, isAdmin: role !== null});
          }
          await fetchUsers();
          alert("تم تحديث الرتبة");
      } catch (e) {
          alert("فشل التحديث");
      }
      setActionLoading(null);
  };

  const handleToggleRoomCreation = async (uid: string, currentStatus: boolean) => {
      setActionLoading(uid);
      try {
          await adminUpdateUser(uid, { canCreateRoom: !currentStatus });
          if (!currentStatus) {
              await sendSystemNotification(uid, "System", "مبرك لقد تم فتح ميزة انشاء الغرفه");
          }
          if (searchedUser && searchedUser.uid === uid) {
              setSearchedUser({...searchedUser, canCreateRoom: !currentStatus});
          }
          await fetchUsers();
          alert(!currentStatus ? "تم تفعيل خاصية إنشاء الغرف" : "تم إلغاء خاصية إنشاء الغرف");
      } catch (e) {
          alert("فشل التحديث");
      }
      setActionLoading(null);
  };

  const handleDeleteUser = async (uid: string) => {
      if (!confirm("هل أنت متأكد من حذف هذا المستخدم نهائياً؟")) return;
      setActionLoading(uid);
      try {
          await deleteUserProfile(uid);
          if (searchedUser && searchedUser.uid === uid) {
              setSearchedUser(null);
              setSearchedRooms([]);
          }
          await fetchUsers();
          alert("تم حذف المستخدم بنجاح.");
      } catch (e) {
          alert("فشل حذف المستخدم.");
      }
      setActionLoading(null);
  };

  const handleBanRoom = async (roomId: string, currentStatus: boolean) => {
      if (!roomId) return;
      setActionLoading('room_ban_' + roomId);
      try {
          await adminBanRoom(roomId, !currentStatus);
          setSearchedRooms(prev => prev.map(r => r.id === roomId ? { ...r, isBanned: !currentStatus } : r));
          alert(currentStatus ? "تم فك حظر الغرفة" : "تم حظر الغرفة");
      } catch (e) { alert("فشل حظر الغرفة"); }
      setActionLoading(null);
  };

  const handleToggleHot = async (roomId: string, currentStatus: boolean) => {
      if (!roomId) return;
      setActionLoading('room_hot_' + roomId);
      try {
          await toggleRoomHotStatus(roomId, !currentStatus);
          setSearchedRooms(prev => prev.map(r => r.id === roomId ? { ...r, isHot: !currentStatus } : r));
          alert(currentStatus ? "تم إزالة HOT" : "تم تعيين كـ HOT");
      } catch (e) { alert("فشل التحديث"); }
      setActionLoading(null);
  };

  const handleToggleActivities = async (roomId: string, currentStatus: boolean) => {
      if (!roomId) return;
      setActionLoading('room_activities_' + roomId);
      try {
          await toggleRoomActivitiesStatus(roomId, !currentStatus);
          setSearchedRooms(prev => prev.map(r => r.id === roomId ? { ...r, isActivities: !currentStatus } : r));
          alert(currentStatus ? "تم إزالة شارة الأنشطة" : "تم إضافة شارة الأنشطة");
      } catch (e) { alert("فشل التحديث"); }
      setActionLoading(null);
  };

  const handleToggleOfficial = async (roomId: string, currentStatus: boolean) => {
      if (!roomId) return;
      setActionLoading('room_official_' + roomId);
      try {
          await toggleRoomOfficialStatus(roomId, !currentStatus);
          setSearchedRooms(prev => prev.map(r => r.id === roomId ? { ...r, isOfficial: !currentStatus } : r));
          alert(currentStatus ? "تم إزالة الشارة الرسمية" : "تم منح الشارة الرسمية");
      } catch (e) { alert("فشل التحديث"); }
      setActionLoading(null);
  };

  const handleUpdateRoomGameConfig = async (room: Room) => {
      if (!room.id) return;
      setActionLoading('room_luck_' + room.id);
      try {
          // Use values directly from the room object in state
          await updateRoomGameConfig(room.id, room.gameLuck || 50, room.gameMode || 'FAIR', room.hookThreshold || 50000);
          alert(`تم تحديث إعدادات اللعبة بنجاح!`);
      } catch (e) { alert("فشل التحديث"); }
      setActionLoading(null);
  };

  const handleDeleteSingleRoom = async (roomId: string) => {
      if (!confirm("هل أنت متأكد من حذف هذه الغرفة نهائياً؟")) return;
      setActionLoading('room_del_' + roomId);
      try {
          await deleteRoom(roomId);
          setSearchedRooms(prev => prev.filter(r => r.id !== roomId));
          alert("تم حذف الغرفة");
      } catch (e) { alert("فشل الحذف"); }
      setActionLoading(null);
  };

  const handleGiftSubmit = async () => {
      if (!showGiftModal || !giftAmount || isNaN(parseInt(giftAmount))) return;
      const uid = showGiftModal;
      const val = parseInt(giftAmount);
      
      setActionLoading(uid);
      try {
          const user = users.find(u => u.uid === uid) || searchedUser;
          const current = user?.wallet?.diamonds || 0;
          const newBalance = current + val;
          await adminUpdateUser(uid, { wallet: { diamonds: newBalance, coins: user?.wallet?.coins || 0 }});
          await sendSystemNotification(uid, "عملية شحن ناجحة", `تم شحن رصيدك بمقدار ${val} ماسة من قبل الإدارة.`);
          if (searchedUser && searchedUser.uid === uid) {
              setSearchedUser({...searchedUser, wallet: { ...searchedUser.wallet!, diamonds: newBalance }});
          }
          await fetchUsers();
          alert(`تم إرسال ${val} ماسة بنجاح.`);
          setShowGiftModal(null);
          setGiftAmount('');
      } catch (e) { alert("فشل الشحن"); }
      setActionLoading(null);
  };

  const handleAssignAgent = async (uid: string) => {
      if (!confirm("تعيين هذا المستخدم كوكيل شحن؟ سيتم إضافة 200,000,000 ماسة لرصيد الوكالة.")) return;
      setActionLoading(uid);
      try {
          await adminUpdateUser(uid, { isAgent: true, agencyBalance: 200000000 });
          await sendSystemNotification(uid, "مبروك!", "تم تعيينك كوكيل شحن معتمد. تم إضافة 200 مليون ماسة لرصيد وكالتك.");
          if (searchedUser && searchedUser.uid === uid) {
              setSearchedUser({...searchedUser, isAgent: true, agencyBalance: 200000000});
          }
          await fetchUsers();
          alert("تم التعيين بنجاح");
      } catch (e) { alert("فشل التعيين"); }
      setActionLoading(null);
  };

  const handleRevokeAgent = async (uid: string) => {
      if (!confirm("سحب الوكالة من هذا المستخدم؟")) return;
      setActionLoading(uid);
      try {
          await adminUpdateUser(uid, { isAgent: false, agencyBalance: 0 });
          await sendSystemNotification(uid, "تنبيه", "تم سحب صلاحيات وكالة الشحن منك.");
          if (searchedUser && searchedUser.uid === uid) {
              setSearchedUser({...searchedUser, isAgent: false, agencyBalance: 0});
          }
          await fetchUsers();
          alert("تم السحب بنجاح");
      } catch (e) { alert("فشل السحب"); }
      setActionLoading(null);
  };

  const handleRechargeAgency = async (uid: string) => {
      const amountStr = prompt("أدخل كمية الشحن للوكالة:");
      if (!amountStr) return;
      const amount = parseInt(amountStr);
      if (isNaN(amount)) return;
      setActionLoading(uid);
      try {
          const user = users.find(u => u.uid === uid) || searchedUser;
          const current = user?.agencyBalance || 0;
          await adminUpdateUser(uid, { agencyBalance: current + amount });
          await sendSystemNotification(uid, "شحن الوكالة", `تم إضافة ${amount} لرصيد وكالتك.`);
          if (searchedUser && searchedUser.uid === uid) {
              setSearchedUser({...searchedUser, agencyBalance: current + amount});
          }
          await fetchUsers();
          alert("تم شحن الوكالة");
      } catch (e) { alert("فشل الشحن"); }
      setActionLoading(null);
  };

  const handleSelectVip = async (level: number) => {
      if (!showVipModal) return;
      const uid = showVipModal;
      setActionLoading(uid);
      try {
          await adminUpdateUser(uid, { vip: level > 0, vipLevel: level });
          await sendSystemNotification(uid, "ترقية VIP", `تهانينا! تم ترقية حسابك إلى VIP المستوى ${level}.`);
          if (searchedUser && searchedUser.uid === uid) {
              setSearchedUser({...searchedUser, vipLevel: level, vip: level > 0});
          }
          await fetchUsers();
          setShowVipModal(null);
      } catch (e) { alert("فشل التحديث"); }
      setActionLoading(null);
  };

  const handleUpdateId = async () => {
      if (!showIdModal || !newCustomId) return;
      const uid = showIdModal;
      setActionLoading(uid);
      try {
          await adminUpdateUser(uid, { id: newCustomId });
          await sendSystemNotification(uid, "تحديث المعرف", `تم تغيير المعرف الخاص بك إلى: ${newCustomId}`);
          if (searchedUser && searchedUser.uid === uid) {
              setSearchedUser({...searchedUser, id: newCustomId});
          }
          await fetchUsers();
          alert("تم تحديث المعرف بنجاح");
          setShowIdModal(null);
          setNewCustomId('');
      } catch (e) { alert("فشل التحديث"); }
      setActionLoading(null);
  };

  const handleBroadcast = async () => {
      if (!officialTitle || !officialBody) return;
      if (!confirm("إرسال هذه الرسالة لجميع المستخدمين؟")) return;
      setActionLoading('broadcast');
      try {
          await broadcastOfficialMessage(officialTitle, officialBody);
          alert("تم الإرسال بنجاح!");
          setOfficialTitle('');
          setOfficialBody('');
      } catch (e) { alert("فشل الإرسال"); }
      setActionLoading(null);
  };

  const handleDeleteRooms = async () => {
      if (!confirm("⚠️ تحذير: حذف جميع الرومات؟")) return;
      setActionLoading('system');
      try {
          await deleteAllRooms();
          alert("تم تنظيف الرومات.");
      } catch (e) { alert("فشل"); }
      setActionLoading(null);
  };

  const handleResetAllCups = async () => {
      if (!confirm("⚠️ هل أنت متأكد من تصفير الكأس لجميع الرومات؟")) return;
      setActionLoading('reset_cups');
      try {
          await resetAllRoomCups();
          alert("تم تصفير الكؤوس بنجاح!");
      } catch (e) { alert("فشل العملية"); }
      setActionLoading(null);
  };

  const handleSyncRoomIds = async () => {
      if (!confirm("⚠️ هذا الإجراء سيقوم بتغيير ID جميع الرومات الموجودة لتطابق ID أصحابها. هل أنت متأكد؟")) return;
      setActionLoading('sync_ids');
      try {
          await syncRoomIdsWithUserIds();
          alert("تم توحيد المعرفات بنجاح!");
      } catch (e) { alert("حدث خطأ أثناء التحديث"); }
      setActionLoading(null);
  };

  const handleResetAllCoins = async () => {
      if (!confirm("⚠️ تحذير خطير: هل أنت متأكد تماماً من تصفير رصيد الكوينز لجميع المستخدمين؟")) return;
      setActionLoading('reset_coins');
      try {
          await resetAllUsersCoins();
          alert("تم تصفير كوينز الجميع بنجاح!");
      } catch (e) { alert("حدث خطأ أثناء التصفير"); }
      setActionLoading(null);
  };

  const handleResetGhostUsers = async () => {
      if (!confirm("هل أنت متأكد من تنظيف جميع الحسابات المعلقة؟")) return;
      setActionLoading('reset_ghosts');
      try {
          await resetAllGhostUsers();
          alert("تم تنظيف الحسابات المعلقة بنجاح!");
      } catch (e) { alert("حدث خطأ أثناء التنظيف"); }
      setActionLoading(null);
  };

  const handleResetChats = async () => {
      if (!confirm("⚠️ تحذير: هل أنت متأكد من حذف جميع المحادثات الخاصة؟")) return;
      setActionLoading('reset_chats');
      try {
          await resetAllChats();
          alert("تم تصفير جميع المحادثات بنجاح!");
      } catch (e) { alert("حدث خطأ أثناء التصفير"); }
      setActionLoading(null);
  };

  const handleAddBanner = async () => {
      if (!newBannerImage) return;
      setActionLoading('add_banner');
      try {
          await addBanner(newBannerImage, newBannerTitle);
          setNewBannerImage('');
          setNewBannerTitle('');
          alert("تم إضافة البنر");
      } catch (e) { alert("فشل إضافة البنر"); }
      setActionLoading(null);
  };

  const handleDeleteBanner = async (id: string) => {
      if(!confirm("حذف هذا البنر؟")) return;
      try { await deleteBanner(id); } catch (e) { alert("فشل الحذف"); }
  };

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
              const canvas = document.createElement('canvas');
              const MAX_WIDTH = 700; const MAX_HEIGHT = 400; 
              let width = img.width; let height = img.height;
              if (width > height) { if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; } } else { if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; } }
              canvas.width = width; canvas.height = height;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                  ctx.drawImage(img, 0, 0, width, height);
                  const dataUrl = canvas.toDataURL('image/jpeg', 0.5);
                  setNewBannerImage(dataUrl);
              }
          };
          if (typeof event.target?.result === 'string') { img.src = event.target.result; }
      };
      reader.readAsDataURL(file);
  };

  // --- ENTRANCE EFFECTS LOGIC ---
  const handleEntranceVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) { 
          alert("حجم الفيديو كبير جداً. الحد الأقصى 5 ميجابايت.");
          return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
          if (typeof event.target?.result === 'string') {
              setNewEntranceVideo(event.target.result);
          }
      };
      reader.readAsDataURL(file);
  };

  const handleAddEntrance = async () => {
      if (!newEntranceVideo || !newEntranceName) return;
      setActionLoading('add_entrance');
      try {
          const newItem: StoreItem = {
              id: `entrance_${Date.now()}`,
              type: 'entrance',
              name: { ar: newEntranceName, en: newEntranceName },
              price: 0, 
              currency: 'diamonds',
              previewClass: 'bg-black',
              videoUrl: newEntranceVideo
          };
          await addStoreItem(newItem);
          setNewEntranceVideo('');
          setNewEntranceName('');
          loadEntrances();
          alert("تم إضافة الدخولية بنجاح");
      } catch (e) {
          alert("فشل الإضافة");
      }
      setActionLoading(null);
  };

  const handleDeleteEntrance = async (id: string) => {
      if(!confirm("حذف هذه الدخولية؟")) return;
      try {
          await deleteStoreItem(id);
          loadEntrances();
      } catch (e) {
          alert("فشل الحذف");
      }
  };

  const agents = users.filter(u => u.isAgent);

  return (
    <div dir="rtl" className="h-full bg-black text-gold-400 flex flex-col font-sans relative">
      <div className="p-4 bg-gray-900 border-b border-gold-500/30 flex flex-col gap-4 shadow-lg relative overflow-hidden shrink-0">
        <div className="absolute inset-0 bg-gradient-to-l from-gold-500/10 to-transparent pointer-events-none"></div>
        <div className="flex items-center justify-between relative z-10 w-full">
            <button onClick={onBack} className="p-2 rounded-full hover:bg-white/10 text-gold-400">
                <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold flex items-center gap-2 text-gold-100 mx-auto">
                <Shield className="w-6 h-6 text-gold-500" />
                لوحة التحكم
            </h1>
            <div className="w-9"></div>
        </div>
        <div className="flex gap-2 relative z-10 overflow-x-auto w-full scrollbar-hide justify-center">
            <button onClick={() => setActiveTab('users')} className={`px-3 py-1 rounded border border-gold-500/30 text-[10px] font-bold whitespace-nowrap ${activeTab === 'users' ? 'bg-gold-500 text-black' : 'text-gold-500'}`}>المستخدمين</button>
            <button onClick={() => setActiveTab('agencies')} className={`px-3 py-1 rounded border border-gold-500/30 text-[10px] font-bold whitespace-nowrap ${activeTab === 'agencies' ? 'bg-blue-500 text-white' : 'text-blue-500'}`}>الوكالات</button>
            <button onClick={() => setActiveTab('banners')} className={`px-3 py-1 rounded border border-gold-500/30 text-[10px] font-bold whitespace-nowrap ${activeTab === 'banners' ? 'bg-purple-600 text-white' : 'text-purple-500'}`}>البنرات</button>
            <button onClick={() => setActiveTab('entrances')} className={`px-3 py-1 rounded border border-gold-500/30 text-[10px] font-bold whitespace-nowrap ${activeTab === 'entrances' ? 'bg-pink-600 text-white' : 'text-pink-500'}`}>دخوليات</button>
            <button onClick={() => setActiveTab('official')} className={`px-3 py-1 rounded border border-gold-500/30 text-[10px] font-bold whitespace-nowrap ${activeTab === 'official' ? 'bg-green-600 text-white' : 'text-green-500'}`}>رسائل</button>
            <button onClick={() => setActiveTab('system')} className={`px-3 py-1 rounded border border-gold-500/30 text-[10px] font-bold whitespace-nowrap ${activeTab === 'system' ? 'bg-red-600 text-white' : 'text-red-500'}`}>النظام</button>
        </div>
      </div>

      {activeTab === 'users' && (
          <div className="flex-1 overflow-hidden flex flex-col">
              <div className="p-4 bg-gray-900/50">
                  <div className="relative flex gap-2">
                      <div className="relative flex-1">
                          <Search className="absolute right-3 top-2.5 w-4 h-4 text-gray-500" />
                          <input type="text" placeholder="بحث عن ID المستخدم..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-black border border-gray-700 rounded-lg py-2 pr-10 pl-4 text-white text-sm focus:border-gold-500 outline-none"/>
                      </div>
                      <button onClick={handleSearch} className="bg-gold-600 text-black px-4 rounded-lg font-bold text-sm hover:bg-gold-500">بحث</button>
                  </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                  {(searchedUser || searchedRooms.length > 0) && (
                      <div className="bg-gray-800/50 border border-gold-500/30 rounded-xl p-4 mb-4">
                          <h3 className="text-gold-300 font-bold mb-3 border-b border-gray-700 pb-2">نتائج البحث</h3>
                          
                          {/* User Card */}
                          {searchedUser ? (
                              <div className={`bg-black p-4 rounded-xl border ${searchedUser.isBanned ? 'border-red-600' : 'border-gray-700'}`}>
                                  <div className="flex items-center gap-3 mb-3">
                                      <img src={searchedUser.avatar} className="w-12 h-12 rounded-full border-2 border-gold-500" />
                                      <div>
                                          <div className="font-bold text-white text-lg">{searchedUser.name}</div>
                                          <div className="text-xs text-gray-500">ID: {searchedUser.id}</div>
                                          <div className="text-[10px] text-gray-400">{searchedUser.email || 'No Email'}</div>
                                      </div>
                                      {searchedUser.isBanned && <span className="mr-auto bg-red-600 text-white text-[10px] px-2 py-1 rounded font-bold">محظور</span>}
                                      {searchedUser.isAgent && <span className="mr-auto bg-blue-600 text-white text-[10px] px-2 py-1 rounded font-bold flex items-center gap-1"><Database className="w-3 h-3"/> وكيل</span>}
                                  </div>
                                  <div className="grid grid-cols-2 gap-2">
                                      <button onClick={() => setShowGiftModal(searchedUser.uid!)} className="bg-blue-900/30 text-blue-400 py-1.5 rounded text-xs flex items-center justify-center gap-1"><Gift className="w-3 h-3"/> شحن</button>
                                      <button onClick={() => setShowVipModal(searchedUser.uid!)} className="bg-yellow-900/30 text-yellow-400 py-1.5 rounded text-xs flex items-center justify-center gap-1"><Crown className="w-3 h-3"/> VIP</button>
                                      <button onClick={() => setShowIdModal(searchedUser.uid!)} className="bg-purple-900/30 text-purple-400 py-1.5 rounded text-xs flex items-center justify-center gap-1"><Edit3 className="w-3 h-3"/> ID</button>
                                      <button onClick={() => initiateBanAction(searchedUser)} disabled={searchedUser.id === 'OFFECAL'} className={`py-1.5 rounded text-xs flex items-center justify-center gap-1 ${searchedUser.isBanned ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                                          {searchedUser.isBanned ? 'فك الحظر' : 'حظر الحساب'}
                                      </button>
                                  </div>
                                  {/* ... Other user actions ... */}
                                  <div className="mt-2 pt-2 border-t border-gray-800">
                                      <button onClick={() => handleToggleRoomCreation(searchedUser.uid!, searchedUser.canCreateRoom || false)} className={`w-full py-2 rounded text-xs font-bold flex items-center justify-center gap-2 border transition ${searchedUser.canCreateRoom ? 'bg-red-900/20 text-red-400 border-red-500' : 'bg-green-900/20 text-green-400 border-green-500'}`}>
                                          {searchedUser.canCreateRoom ? <><Lock className="w-3 h-3"/> إلغاء ميزة إنشاء الغرف</> : <><Unlock className="w-3 h-3"/> تفعيل ميزة إنشاء الغرف</>}
                                      </button>
                                  </div>
                                  {/* Agency Controls */}
                                  <div className="mt-2 pt-2 border-t border-gray-800">
                                      {searchedUser.isAgent ? (
                                          <div className="space-y-2">
                                              <div className="flex justify-between text-xs text-blue-300"><span>رصيد الوكالة:</span><span className="font-bold">{searchedUser.agencyBalance?.toLocaleString()} 💎</span></div>
                                              <div className="flex gap-2">
                                                  <button onClick={() => handleRechargeAgency(searchedUser.uid!)} className="flex-1 bg-blue-600/20 text-blue-400 border border-blue-600 py-1 rounded text-xs">شحن وكالة</button>
                                                  <button onClick={() => handleRevokeAgent(searchedUser.uid!)} className="flex-1 bg-red-600/20 text-red-400 border border-red-600 py-1 rounded text-xs">سحب وكالة</button>
                                              </div>
                                          </div>
                                      ) : (
                                          <button onClick={() => handleAssignAgent(searchedUser.uid!)} className="w-full bg-blue-600 text-white py-1.5 rounded text-xs font-bold flex items-center justify-center gap-2"><Database className="w-3 h-3" /> تعيين كوكيل شحن</button>
                                      )}
                                  </div>
                                  {/* Role Management */}
                                  <div className="mt-2 pt-2 border-t border-gray-800 grid grid-cols-2 gap-1">
                                       <button onClick={() => handleSetAdminRole(searchedUser.uid!, 'super_admin')} className="bg-red-500/10 text-red-500 border border-red-500/30 text-[10px] py-1 rounded hover:bg-red-500/20">Super Admin</button>
                                       <button onClick={() => handleSetAdminRole(searchedUser.uid!, 'admin')} className="bg-yellow-500/10 text-yellow-500 border border-yellow-500/30 text-[10px] py-1 rounded hover:bg-yellow-500/20">Admin</button>
                                       <button onClick={() => handleSetAdminRole(searchedUser.uid!, 'official_manager')} className="bg-cyan-500/10 text-cyan-500 border border-cyan-500/30 text-[10px] py-1 rounded hover:bg-cyan-500/20">المدير الرسمي</button>
                                       <button onClick={() => handleSetAdminRole(searchedUser.uid!, 'me_manager')} className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 text-[10px] py-1 rounded hover:bg-emerald-500/20">مدير الشرق</button>
                                       <button onClick={() => handleSetAdminRole(searchedUser.uid!, null)} className="col-span-2 bg-gray-700 text-gray-400 text-[10px] py-1 rounded hover:bg-gray-600">إزالة الرتبة</button>
                                       <button onClick={() => handleDeleteUser(searchedUser.uid!)} className="col-span-2 bg-red-950 text-red-500 border border-red-900 text-[10px] py-1 rounded hover:bg-red-900 flex items-center justify-center gap-1 mt-1"><Trash2 className="w-3 h-3"/> حذف المستخدم نهائياً</button>
                                  </div>
                              </div>
                          ) : <div className="text-gray-500 p-4">لم يتم العثور على مستخدم</div>}

                          {/* Rooms List with Specific Inputs */}
                          <div className="space-y-2">
                              <h4 className="text-gold-400 font-bold text-sm">غرف المستخدم ({searchedRooms.length})</h4>
                              {searchedRooms.length > 0 ? searchedRooms.map(room => (
                                  <div key={room.id} className={`bg-black p-4 rounded-xl border ${room.isBanned ? 'border-red-600' : 'border-gray-700'}`}>
                                      <div className="flex items-center gap-3 mb-3">
                                          <img src={room.thumbnail} className="w-12 h-12 rounded-lg object-cover" />
                                          <div>
                                              <div className="font-bold text-white text-sm">{room.title}</div>
                                              <div className="text-xs text-gray-500">Host ID: {room.displayId}</div>
                                          </div>
                                      </div>
                                      
                                      {/* Room Game RIGGING Controls - BOUND TO ROOM OBJECT */}
                                      <div className="mb-2 p-2 bg-gray-900 rounded border border-gray-800 space-y-2">
                                          <div className="flex justify-between items-center text-[10px] text-gray-400">
                                              <span>نظام اللعب:</span>
                                              <select 
                                                  value={room.gameMode || 'FAIR'} 
                                                  onChange={(e) => handleLocalRoomChange(room.id, 'gameMode', e.target.value)}
                                                  className="bg-gray-800 text-white border border-gray-600 rounded px-1 outline-none"
                                              >
                                                  <option value="FAIR">عشوائي (Fair)</option>
                                                  <option value="DRAIN">استنزاف (Loss)</option>
                                                  <option value="HOOK">طُعم (Smart)</option>
                                              </select>
                                          </div>

                                          {room.gameMode === 'HOOK' && (
                                              <div className="flex justify-between items-center text-[10px] text-gray-400">
                                                  <span>سقف الطُعم:</span>
                                                  <input 
                                                      type="number" 
                                                      value={room.hookThreshold || 50000}
                                                      onChange={(e) => handleLocalRoomChange(room.id, 'hookThreshold', parseInt(e.target.value))}
                                                      className="w-20 bg-gray-800 text-white border border-gray-600 rounded px-1 outline-none text-center"
                                                  />
                                              </div>
                                          )}

                                          <div className="flex justify-between text-[10px] text-gray-400">
                                              <span>نسبة الحظ العشوائي</span>
                                              <span>{room.gameLuck}%</span>
                                          </div>
                                          <input 
                                              type="range" 
                                              min="0" 
                                              max="100" 
                                              value={room.gameLuck} 
                                              onChange={(e) => handleLocalRoomChange(room.id, 'gameLuck', parseInt(e.target.value))}
                                              className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                                          />
                                          
                                          <button onClick={() => handleUpdateRoomGameConfig(room)} className="w-full bg-purple-600/30 text-purple-400 text-[10px] py-1.5 rounded border border-purple-600/50 flex items-center justify-center gap-1 hover:bg-purple-600/50 font-bold">
                                              <AlertTriangle className="w-3 h-3"/> تحديث خوارزميات اللعب
                                          </button>
                                      </div>

                                      <div className="grid grid-cols-2 gap-2">
                                           <button onClick={() => handleBanRoom(room.id, room.isBanned || false)} className={`py-1.5 rounded text-xs flex items-center justify-center gap-1 ${room.isBanned ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                                              {room.isBanned ? 'فك حظر الغرفة' : 'حظر الغرفة'}
                                          </button>
                                          <button onClick={() => handleToggleHot(room.id, room.isHot || false)} className={`py-1.5 rounded text-xs flex items-center justify-center gap-1 ${room.isHot ? 'bg-orange-600/20 text-orange-500 border border-orange-600' : 'bg-gray-800 text-gray-400'}`}>
                                              {room.isHot ? 'إزالة HOT' : 'تعيين كـ HOT'}
                                          </button>
                                          <button onClick={() => handleToggleActivities(room.id, room.isActivities || false)} className={`py-1.5 rounded text-xs flex items-center justify-center gap-1 ${room.isActivities ? 'bg-red-600/20 text-red-500 border border-red-600' : 'bg-gray-800 text-gray-400'}`}>
                                              <Gamepad2 className="w-3 h-3"/> {room.isActivities ? 'إزالة شارة الأنشطة' : 'إضافة شارة الأنشطة'}
                                          </button>
                                           <button onClick={() => handleToggleOfficial(room.id, room.isOfficial || false)} className={`py-1.5 rounded text-xs flex items-center justify-center gap-1 ${room.isOfficial ? 'bg-blue-600/20 text-blue-500 border border-blue-600' : 'bg-gray-800 text-gray-400'}`}>
                                              <BadgeCheck className="w-3 h-3"/> {room.isOfficial ? 'إزالة الرسمية' : 'تعيين رسمي'}
                                          </button>
                                          <button onClick={() => handleDeleteSingleRoom(room.id)} className="col-span-2 bg-red-900/50 text-red-500 border border-red-900 py-1.5 rounded text-xs flex items-center justify-center gap-1">
                                              حذف الغرفة
                                          </button>
                                      </div>
                                  </div>
                              )) : <div className="text-gray-500 p-4 border border-gray-800 rounded-xl flex flex-col items-center justify-center"><Home className="w-8 h-8 mb-2 opacity-50"/>هذا المستخدم لا يملك غرف</div>}
                          </div>
                      </div>
                  )}

                  <h3 className="text-white font-bold mb-2">جميع المستخدمين ({users.length})</h3>
                  {loading ? (
                      <div className="text-center py-10 text-gray-500"><RefreshCw className="w-8 h-8 animate-spin mx-auto"/> جاري التحميل...</div>
                  ) : users.slice(0, 50).map(user => (
                      <div key={user.uid} className={`bg-gray-900 border ${user.isBanned ? 'border-red-900' : 'border-gray-800'} rounded-lg p-3 flex flex-col gap-2`}>
                          <div className="flex justify-between items-center">
                              <div className="flex items-center gap-3">
                                  <div className="relative">
                                      <img src={user.avatar} className="w-10 h-10 rounded-full border border-gray-600" />
                                      {user.isBanned && <div className="absolute inset-0 bg-black/80 flex items-center justify-center rounded-full"><Ban className="w-4 h-4 text-red-500"/></div>}
                                  </div>
                                  <div>
                                      <div className="flex items-center gap-2">
                                          <span className={`font-bold text-sm ${user.isAdmin ? 'text-red-400' : 'text-white'}`}>{user.name}</span>
                                          {user.vip && <span className="text-[9px] bg-gold-500 text-black px-1 rounded font-bold">V{user.vipLevel}</span>}
                                          {user.adminRole && (
                                              <span className={`text-[8px] px-1.5 py-0.5 rounded border ${
                                                  user.adminRole === 'super_admin' ? 'border-red-500 text-red-500' : 
                                                  user.adminRole === 'admin' ? 'border-yellow-500 text-yellow-500' :
                                                  user.adminRole === 'official_manager' ? 'border-cyan-500 text-cyan-500' :
                                                  'border-emerald-500 text-emerald-500'
                                              }`}>
                                                  {ADMIN_ROLES[user.adminRole]?.name?.ar || user.adminRole}
                                              </span>
                                          )}
                                          {user.isAgent && <span className="text-[8px] bg-blue-600 text-white px-1 rounded font-bold">وكيل</span>}
                                      </div>
                                      <div className="text-[10px] text-gray-500 font-mono">ID: {user.id}</div>
                                      <div className="text-[10px] text-gray-400">{user.email || 'No Email'}</div>
                                      <div className="text-[10px] text-cyan-400 font-bold">💎 {user.wallet?.diamonds || 0}</div>
                                  </div>
                              </div>
                              <div className="flex items-center gap-1">
                                  <button onClick={() => setShowGiftModal(user.uid)} className="p-1.5 bg-blue-900/30 text-blue-400 rounded"><Gift className="w-4 h-4" /></button>
                                  <button onClick={() => setShowVipModal(user.uid)} className="p-1.5 bg-yellow-900/30 text-yellow-400 rounded"><Crown className="w-4 h-4" /></button>
                                  <button onClick={() => setShowIdModal(user.uid)} className="p-1.5 bg-purple-900/30 text-purple-400 rounded"><Edit3 className="w-4 h-4" /></button>
                                  <button onClick={() => initiateBanAction(user)} disabled={user.isAdmin} className={`p-1.5 rounded ${user.isBanned ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                                      {user.isBanned ? <CheckCircle className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                                  </button>
                                  <button onClick={() => handleDeleteUser(user.uid)} disabled={user.isAdmin} className="p-1.5 rounded bg-red-950/50 text-red-500 hover:bg-red-900"><Trash2 className="w-4 h-4"/></button>
                              </div>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {/* ... (Other tabs and modals remain largely the same, just keeping consistency) ... */}
      {activeTab === 'entrances' && (
          <div className="flex-1 p-6 flex flex-col overflow-y-auto">
              <div className="bg-gray-900 p-4 rounded-xl border border-gray-800 mb-4">
                  <h3 className="font-bold text-pink-400 mb-2 flex items-center gap-2"><Film className="w-5 h-5"/> إضافة دخولية فيديو</h3>
                  <div className="flex flex-col gap-2">
                      <label className="bg-black border border-gray-700 p-3 rounded-lg text-gray-400 flex items-center justify-center cursor-pointer hover:border-pink-500 transition border-dashed border-2">
                          <input type="file" className="hidden" accept="video/mp4,video/webm" onChange={handleEntranceVideoUpload} />
                          <div className="flex items-center gap-2 text-xs">
                              {newEntranceVideo ? <CheckCircle className="w-5 h-5 text-green-500"/> : <Plus className="w-5 h-5"/>} 
                              {newEntranceVideo ? 'تم اختيار الفيديو' : 'رفع فيديو (Max 5MB)'}
                          </div>
                      </label>
                      <input type="text" placeholder="اسم الدخولية" value={newEntranceName} onChange={(e) => setNewEntranceName(e.target.value)} className="bg-black border border-gray-700 p-2 rounded text-white text-sm focus:border-pink-500 outline-none"/>
                      <button onClick={handleAddEntrance} disabled={!newEntranceVideo || !newEntranceName || actionLoading === 'add_entrance'} className="bg-pink-600 text-white py-2 rounded font-bold flex items-center justify-center gap-2 hover:bg-pink-500 transition">
                          {actionLoading === 'add_entrance' ? 'جاري الرفع...' : 'حفظ الدخولية'}
                      </button>
                  </div>
              </div>
              <h3 className="font-bold text-white mb-2">الدخوليات المتوفرة</h3>
              <div className="space-y-2">
                  {entranceEffects.map(item => (
                      <div key={item.id} className="bg-gray-800 rounded-xl p-3 flex items-center justify-between border border-gray-700">
                          <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center overflow-hidden border border-white/10 relative">
                                  {item.videoUrl ? (<video src={item.videoUrl} className="w-full h-full object-cover" muted loop autoPlay />) : <Film className="w-5 h-5 text-gray-600"/>}
                              </div>
                              <span className="text-sm font-bold text-white">{item.name.ar}</span>
                          </div>
                          <button onClick={() => handleDeleteEntrance(item.id)} className="p-2 bg-red-500/20 text-red-500 rounded hover:bg-red-500/30 transition"><Trash2 className="w-4 h-4"/></button>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {/* ... (Ban, Gift, VIP, ID Modals) ... */}
      {showBanModal && (<div className="absolute inset-0 z-50 bg-black/90 backdrop-blur flex items-center justify-center p-4"><div className="bg-gray-900 border border-red-500 rounded-xl p-5 w-full max-w-sm shadow-2xl text-right"><h3 className="text-red-500 font-bold mb-4 flex items-center gap-2"><Ban className="w-5 h-5"/> حظر المستخدم</h3><div className="space-y-2 mb-6"><p className="text-gray-400 text-sm mb-2">اختر مدة الحظر:</p>{[1, 3, 7, 30].map(days => (<button key={days} onClick={() => setBanDuration(days)} className={`w-full p-2 rounded text-sm font-bold border transition ${banDuration === days ? 'bg-red-600 text-white border-red-600' : 'bg-black border-gray-700 text-gray-300'}`}>{days} يوم</button>))}<button onClick={() => setBanDuration(-1)} className={`w-full p-2 rounded text-sm font-bold border transition ${banDuration === -1 ? 'bg-red-900 text-white border-red-600' : 'bg-black border-gray-700 text-red-400'}`}>حظر دائم ⛔</button></div><div className="flex gap-2"><button onClick={() => confirmBanUser(showBanModal, true)} className="flex-1 bg-red-600 text-white py-2 rounded font-bold">تأكيد الحظر</button><button onClick={() => setShowBanModal(null)} className="flex-1 bg-gray-700 text-white py-2 rounded">إلغاء</button></div></div></div>)}
      {showGiftModal && (<div className="absolute inset-0 z-50 bg-black/80 backdrop-blur flex items-center justify-center p-4"><div className="bg-gray-900 border border-blue-500 rounded-xl p-5 w-full max-w-xs shadow-2xl text-right"><h3 className="text-blue-400 font-bold mb-4">وكالة الشحن</h3><input type="number" value={giftAmount} onChange={(e) => setGiftAmount(e.target.value)} placeholder="الكمية" className="w-full bg-black p-2 rounded mb-4 text-white border border-gray-700 text-right"/><div className="flex gap-2"><button onClick={() => handleGiftSubmit()} className="flex-1 bg-blue-600 text-white py-2 rounded font-bold">إرسال</button><button onClick={() => setShowGiftModal(null)} className="flex-1 bg-gray-700 text-white py-2 rounded">إلغاء</button></div></div></div>)}
      {showVipModal && (<div className="absolute inset-0 z-50 bg-black/80 backdrop-blur flex items-center justify-center p-4"><div className="bg-gray-900 border border-gold-500 rounded-xl p-4 w-full max-w-sm max-h-[80vh] flex flex-col shadow-2xl text-right"><h3 className="text-gold-400 font-bold mb-4">تعيين مستوى VIP</h3><div className="overflow-y-auto grid grid-cols-2 gap-2"><button onClick={() => handleSelectVip(0)} className="col-span-2 p-2 border border-red-500 text-red-400 rounded">إزالة VIP</button>{VIP_TIERS.filter(t => t.level > 0).map(t => (<button key={t.level} onClick={() => handleSelectVip(t.level)} className="p-2 border border-gray-700 rounded hover:bg-gray-800 text-white text-xs">{t.badge} {t.name[language]} (L{t.level})</button>))}</div><button onClick={() => setShowVipModal(null)} className="mt-4 w-full bg-gray-700 text-white py-2 rounded">إغلاق</button></div></div>)}
      {showIdModal && (<div className="absolute inset-0 z-50 bg-black/80 backdrop-blur flex items-center justify-center p-4"><div className="bg-gray-900 border border-purple-500 rounded-xl p-5 w-full max-w-xs shadow-2xl text-right"><h3 className="text-purple-400 font-bold mb-4">تعيين معرف مميز</h3><input type="text" value={newCustomId} onChange={(e) => setNewCustomId(e.target.value)} placeholder="المعرف الجديد (مثال: KING)" className="w-full bg-black p-2 rounded mb-4 text-white border border-gray-700 text-right"/><div className="flex gap-2"><button onClick={() => handleUpdateId()} className="flex-1 bg-purple-600 text-white py-2 rounded font-bold">تحديث</button><button onClick={() => setShowIdModal(null)} className="flex-1 bg-gray-700 text-white py-2 rounded">إلغاء</button></div></div></div>)}
    </div>
  );
};

export default AdminDashboard;