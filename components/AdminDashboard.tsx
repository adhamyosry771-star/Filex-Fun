
import React, { useState, useEffect } from 'react';
import { Shield, Trash2, Ban, Search, Gift, Crown, ArrowLeft, RefreshCw, CheckCircle, Megaphone, Edit3, Send, Home, XCircle, Flame, Image as ImageIcon, Plus, X, Database, Clock, Gamepad2, BadgeCheck, Coins, Trophy, Ghost } from 'lucide-react';
import { getAllUsers, adminUpdateUser, deleteAllRooms, sendSystemNotification, broadcastOfficialMessage, searchUserByDisplayId, getRoomsByHostId, adminBanRoom, deleteRoom, toggleRoomHotStatus, toggleRoomActivitiesStatus, addBanner, deleteBanner, listenToBanners, syncRoomIdsWithUserIds, toggleRoomOfficialStatus, resetAllUsersCoins, resetAllRoomCups, resetAllGhostUsers } from '../services/firebaseService';
import { Language, User, Room, Banner } from '../types';
import { VIP_TIERS, ADMIN_ROLES } from '../constants';

interface AdminDashboardProps {
  onBack: () => void;
  language: Language;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack, language }) => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'agencies' | 'system' | 'official' | 'banners'>('users');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Search Results
  const [searchedUser, setSearchedUser] = useState<User | null>(null);
  const [searchedRooms, setSearchedRooms] = useState<Room[]>([]); // Changed to Array

  // Banners
  const [banners, setBanners] = useState<Banner[]>([]);
  const [newBannerImage, setNewBannerImage] = useState('');
  const [newBannerTitle, setNewBannerTitle] = useState('');

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
              setSearchedRooms(rooms);
          }
      }
      setLoading(false);
  };

  // Pre-step to open modal or unban immediately
  const initiateBanAction = (user: User) => {
      if (user.isBanned) {
          // Unban directly
          confirmBanUser(user.uid!, false);
      } else {
          // Open Ban Modal
          setShowBanModal(user.uid!);
          setBanDuration(-1); // Default to permanent
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
          
          // Update local state
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

  const handleBanRoom = async (roomId: string, currentStatus: boolean) => {
      if (!roomId) return;
      setActionLoading('room_ban_' + roomId);
      try {
          await adminBanRoom(roomId, !currentStatus);
          setSearchedRooms(prev => prev.map(r => r.id === roomId ? { ...r, isBanned: !currentStatus } : r));
          alert(currentStatus ? "تم فك حظر الغرفة" : "تم حظر الغرفة");
      } catch (e) {
          alert("فشل حظر الغرفة");
      }
      setActionLoading(null);
  };

  const handleToggleHot = async (roomId: string, currentStatus: boolean) => {
      if (!roomId) return;
      setActionLoading('room_hot_' + roomId);
      try {
          await toggleRoomHotStatus(roomId, !currentStatus);
          setSearchedRooms(prev => prev.map(r => r.id === roomId ? { ...r, isHot: !currentStatus } : r));
          alert(currentStatus ? "تم إزالة HOT" : "تم تعيين كـ HOT");
      } catch (e) {
          alert("فشل التحديث");
      }
      setActionLoading(null);
  };

  const handleToggleActivities = async (roomId: string, currentStatus: boolean) => {
      if (!roomId) return;
      setActionLoading('room_activities_' + roomId);
      try {
          await toggleRoomActivitiesStatus(roomId, !currentStatus);
          setSearchedRooms(prev => prev.map(r => r.id === roomId ? { ...r, isActivities: !currentStatus } : r));
          alert(currentStatus ? "تم إزالة شارة الأنشطة" : "تم إضافة شارة الأنشطة");
      } catch (e) {
          alert("فشل التحديث");
      }
      setActionLoading(null);
  };

  const handleToggleOfficial = async (roomId: string, currentStatus: boolean) => {
      if (!roomId) return;
      setActionLoading('room_official_' + roomId);
      try {
          await toggleRoomOfficialStatus(roomId, !currentStatus);
          setSearchedRooms(prev => prev.map(r => r.id === roomId ? { ...r, isOfficial: !currentStatus } : r));
          alert(currentStatus ? "تم إزالة الشارة الرسمية" : "تم منح الشارة الرسمية");
      } catch (e) {
          alert("فشل التحديث");
      }
      setActionLoading(null);
  };

  const handleDeleteSingleRoom = async (roomId: string) => {
      if (!confirm("هل أنت متأكد من حذف هذه الغرفة نهائياً؟")) return;
      setActionLoading('room_del_' + roomId);
      try {
          await deleteRoom(roomId);
          setSearchedRooms(prev => prev.filter(r => r.id !== roomId));
          alert("تم حذف الغرفة");
      } catch (e) {
          alert("فشل الحذف");
      }
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
          
          await adminUpdateUser(uid, { 
              wallet: { 
                  diamonds: newBalance,
                  coins: user?.wallet?.coins || 0
              }
          });
          
          // Send System Notification
          await sendSystemNotification(uid, "عملية شحن ناجحة", `تم شحن رصيدك بمقدار ${val} ماسة من قبل الإدارة.`);

          if (searchedUser && searchedUser.uid === uid) {
              setSearchedUser({
                  ...searchedUser, 
                  wallet: { ...searchedUser.wallet!, diamonds: newBalance }
              });
          }
          await fetchUsers();
          alert(`تم إرسال ${val} ماسة بنجاح.`);
          setShowGiftModal(null);
          setGiftAmount('');
      } catch (e) {
          alert("فشل الشحن");
      }
      setActionLoading(null);
  };

  // --- AGENCY LOGIC ---
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
          await adminUpdateUser(uid, { 
              vip: level > 0,
              vipLevel: level
          });
          await sendSystemNotification(uid, "ترقية VIP", `تهانينا! تم ترقية حسابك إلى VIP المستوى ${level}.`);

          if (searchedUser && searchedUser.uid === uid) {
              setSearchedUser({...searchedUser, vipLevel: level, vip: level > 0});
          }
          await fetchUsers();
          setShowVipModal(null);
      } catch (e) {
          alert("فشل التحديث");
      }
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
      } catch (e) {
          alert("فشل التحديث");
      }
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
      } catch (e) {
          alert("فشل الإرسال");
      }
      setActionLoading(null);
  };

  const handleDeleteRooms = async () => {
      if (!confirm("⚠️ تحذير: حذف جميع الرومات؟")) return;
      setActionLoading('system');
      try {
          await deleteAllRooms();
          alert("تم تنظيف الرومات.");
      } catch (e) {
          alert("فشل");
      }
      setActionLoading(null);
  };

  const handleResetAllCups = async () => {
      if (!confirm("⚠️ هل أنت متأكد من تصفير الكأس لجميع الرومات؟ هذا سيحذف جميع المساهمات الحالية.")) return;
      setActionLoading('reset_cups');
      try {
          await resetAllRoomCups();
          alert("تم تصفير الكؤوس بنجاح!");
      } catch (e) {
          alert("فشل العملية");
      }
      setActionLoading(null);
  };

  const handleSyncRoomIds = async () => {
      if (!confirm("⚠️ هذا الإجراء سيقوم بتغيير ID جميع الرومات الموجودة لتطابق ID أصحابها. هل أنت متأكد؟")) return;
      setActionLoading('sync_ids');
      try {
          await syncRoomIdsWithUserIds();
          alert("تم توحيد المعرفات بنجاح!");
      } catch (e) {
          alert("حدث خطأ أثناء التحديث");
      }
      setActionLoading(null);
  };

  const handleResetAllCoins = async () => {
      if (!confirm("⚠️ تحذير خطير: هل أنت متأكد تماماً من تصفير رصيد الكوينز لجميع المستخدمين في التطبيق؟ هذا الإجراء لا يمكن التراجع عنه.")) return;
      setActionLoading('reset_coins');
      try {
          await resetAllUsersCoins();
          alert("تم تصفير كوينز الجميع بنجاح!");
      } catch (e) {
          alert("حدث خطأ أثناء التصفير");
      }
      setActionLoading(null);
  };

  const handleResetGhostUsers = async () => {
      if (!confirm("هل أنت متأكد من تنظيف جميع الحسابات المعلقة؟ سيتم إخراج جميع المستخدمين من المايكات وتصفير عداد المتصلين في كل الرومات.")) return;
      setActionLoading('reset_ghosts');
      try {
          await resetAllGhostUsers();
          alert("تم تنظيف الحسابات المعلقة بنجاح!");
      } catch (e) {
          alert("حدث خطأ أثناء التنظيف");
      }
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
      } catch (e) {
          alert("فشل إضافة البنر. قد يكون حجم الصورة كبيراً جداً.");
      }
      setActionLoading(null);
  };

  const handleDeleteBanner = async (id: string) => {
      if(!confirm("حذف هذا البنر؟")) return;
      try {
          await deleteBanner(id);
      } catch (e) {
          alert("فشل الحذف");
      }
  };

  // Improved Image Uploader with Aggressive Compression
  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
              const canvas = document.createElement('canvas');
              // Aggressive resizing to fit within Firestore 1MB limit
              const MAX_WIDTH = 700;
              const MAX_HEIGHT = 400; 
              let width = img.width;
              let height = img.height;

              // Calculate aspect ratio to keep image not distorted
              if (width > height) {
                  if (width > MAX_WIDTH) {
                      height *= MAX_WIDTH / width;
                      width = MAX_WIDTH;
                  }
              } else {
                  if (height > MAX_HEIGHT) {
                      width *= MAX_HEIGHT / height;
                      height = MAX_HEIGHT;
                  }
              }

              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext('2d');
              
              if (ctx) {
                  ctx.drawImage(img, 0, 0, width, height);
                  // Compress to JPEG with 0.5 quality (Aggressive compression)
                  // This typically results in files < 100KB, well within Firestore limits
                  const dataUrl = canvas.toDataURL('image/jpeg', 0.5);
                  
                  // Set image directly without error alerts
                  setNewBannerImage(dataUrl);
              }
          };
          if (typeof event.target?.result === 'string') {
              img.src = event.target.result;
          }
      };
      reader.readAsDataURL(file);
  };

  // Filter Agents
  const agents = users.filter(u => u.isAgent);

  return (
    <div dir="rtl" className="h-full bg-black text-gold-400 flex flex-col font-sans relative">
      {/* Header */}
      <div className="p-4 bg-gray-900 border-b border-gold-500/30 flex items-center gap-4 shadow-lg relative overflow-hidden shrink-0">
        <div className="absolute inset-0 bg-gradient-to-l from-gold-500/10 to-transparent pointer-events-none"></div>
        <div className="flex items-center gap-3 relative z-10 shrink-0">
            <button onClick={onBack} className="p-2 rounded-full hover:bg-white/10 text-gold-400">
                <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold flex items-center gap-2 text-gold-100 whitespace-nowrap">
                <Shield className="w-6 h-6 text-gold-500" />
                لوحة التحكم
            </h1>
        </div>
        <div className="flex gap-2 relative z-10 overflow-x-auto flex-1 scrollbar-hide">
            <button 
                onClick={() => setActiveTab('users')}
                className={`px-3 py-1 rounded border border-gold-500/30 text-[10px] font-bold whitespace-nowrap ${activeTab === 'users' ? 'bg-gold-500 text-black' : 'text-gold-500'}`}
            >
                المستخدمين
            </button>
            <button 
                onClick={() => setActiveTab('agencies')}
                className={`px-3 py-1 rounded border border-gold-500/30 text-[10px] font-bold whitespace-nowrap ${activeTab === 'agencies' ? 'bg-blue-500 text-white' : 'text-blue-500'}`}
            >
                الوكالات
            </button>
            <button 
                onClick={() => setActiveTab('banners')}
                className={`px-3 py-1 rounded border border-gold-500/30 text-[10px] font-bold whitespace-nowrap ${activeTab === 'banners' ? 'bg-purple-600 text-white' : 'text-purple-500'}`}
            >
                البنرات
            </button>
            <button 
                onClick={() => setActiveTab('official')}
                className={`px-3 py-1 rounded border border-gold-500/30 text-[10px] font-bold whitespace-nowrap ${activeTab === 'official' ? 'bg-green-600 text-white' : 'text-green-500'}`}
            >
                رسائل
            </button>
            <button 
                onClick={() => setActiveTab('system')}
                className={`px-3 py-1 rounded border border-gold-500/30 text-[10px] font-bold whitespace-nowrap ${activeTab === 'system' ? 'bg-red-600 text-white' : 'text-red-500'}`}
            >
                النظام
            </button>
        </div>
      </div>

      {activeTab === 'users' && (
          <div className="flex-1 overflow-hidden flex flex-col">
              <div className="p-4 bg-gray-900/50">
                  <div className="relative flex gap-2">
                      <div className="relative flex-1">
                          <Search className="absolute right-3 top-2.5 w-4 h-4 text-gray-500" />
                          <input 
                            type="text" 
                            placeholder="بحث عن ID المستخدم..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-black border border-gray-700 rounded-lg py-2 pr-10 pl-4 text-white text-sm focus:border-gold-500 outline-none"
                          />
                      </div>
                      <button onClick={handleSearch} className="bg-gold-600 text-black px-4 rounded-lg font-bold text-sm hover:bg-gold-500">
                          بحث
                      </button>
                  </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                  
                  {/* Search Result Section */}
                  {(searchedUser || searchedRooms.length > 0) && (
                      <div className="bg-gray-800/50 border border-gold-500/30 rounded-xl p-4 mb-4">
                          <h3 className="text-gold-300 font-bold mb-3 border-b border-gray-700 pb-2">نتائج البحث</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              
                              {/* User Card */}
                              {searchedUser ? (
                                  <div className={`bg-black p-4 rounded-xl border ${searchedUser.isBanned ? 'border-red-600' : 'border-gray-700'}`}>
                                      <div className="flex items-center gap-3 mb-3">
                                          <img src={searchedUser.avatar} className="w-12 h-12 rounded-full border-2 border-gold-500" />
                                          <div>
                                              <div className="font-bold text-white text-lg">{searchedUser.name}</div>
                                              <div className="text-xs text-gray-500">ID: {searchedUser.id}</div>
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

                                      {/* Agency Controls */}
                                      <div className="mt-2 pt-2 border-t border-gray-800">
                                          {searchedUser.isAgent ? (
                                              <div className="space-y-2">
                                                  <div className="flex justify-between text-xs text-blue-300">
                                                      <span>رصيد الوكالة:</span>
                                                      <span className="font-bold">{searchedUser.agencyBalance?.toLocaleString()} 💎</span>
                                                  </div>
                                                  <div className="flex gap-2">
                                                      <button onClick={() => handleRechargeAgency(searchedUser.uid!)} className="flex-1 bg-blue-600/20 text-blue-400 border border-blue-600 py-1 rounded text-xs">شحن وكالة</button>
                                                      <button onClick={() => handleRevokeAgent(searchedUser.uid!)} className="flex-1 bg-red-600/20 text-red-400 border border-red-600 py-1 rounded text-xs">سحب وكالة</button>
                                                  </div>
                                              </div>
                                          ) : (
                                              <button onClick={() => handleAssignAgent(searchedUser.uid!)} className="w-full bg-blue-600 text-white py-1.5 rounded text-xs font-bold flex items-center justify-center gap-2">
                                                  <Database className="w-3 h-3" /> تعيين كوكيل شحن
                                              </button>
                                          )}
                                      </div>
                                      
                                      {/* Role Management Grid */}
                                      <div className="mt-2 pt-2 border-t border-gray-800 grid grid-cols-2 gap-1">
                                           <button onClick={() => handleSetAdminRole(searchedUser.uid!, 'super_admin')} className="bg-red-500/10 text-red-500 border border-red-500/30 text-[10px] py-1 rounded hover:bg-red-500/20">Super Admin</button>
                                           <button onClick={() => handleSetAdminRole(searchedUser.uid!, 'admin')} className="bg-yellow-500/10 text-yellow-500 border border-yellow-500/30 text-[10px] py-1 rounded hover:bg-yellow-500/20">Admin</button>
                                           <button onClick={() => handleSetAdminRole(searchedUser.uid!, 'official_manager')} className="bg-cyan-500/10 text-cyan-500 border border-cyan-500/30 text-[10px] py-1 rounded hover:bg-cyan-500/20">المدير الرسمي</button>
                                           <button onClick={() => handleSetAdminRole(searchedUser.uid!, 'me_manager')} className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 text-[10px] py-1 rounded hover:bg-emerald-500/20">مدير الشرق</button>
                                           <button onClick={() => handleSetAdminRole(searchedUser.uid!, null)} className="col-span-2 bg-gray-700 text-gray-400 text-[10px] py-1 rounded hover:bg-gray-600">إزالة الرتبة</button>
                                      </div>
                                  </div>
                              ) : <div className="text-gray-500 p-4">لم يتم العثور على مستخدم</div>}

                              {/* Rooms List */}
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
                                              {room.isBanned && <span className="mr-auto bg-red-600 text-white text-[10px] px-2 py-1 rounded font-bold">غرفة محظورة</span>}
                                              {room.isHot && <span className="bg-red-600/20 text-red-500 text-[10px] px-2 py-1 rounded font-bold border border-red-500/50 flex items-center gap-1"><Flame className="w-3 h-3"/> HOT</span>}
                                              {room.isActivities && <span className="bg-blue-600/20 text-blue-500 text-[10px] px-2 py-1 rounded font-bold border border-blue-500/50 flex items-center gap-1"><Gamepad2 className="w-3 h-3"/> ACT</span>}
                                              {room.isOfficial && <span className="bg-blue-600/20 text-blue-500 text-[10px] px-2 py-1 rounded font-bold border border-blue-500/50 flex items-center gap-1"><BadgeCheck className="w-3 h-3"/> OFF</span>}
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
                                              <span className={`text-[8px] px-1 rounded border ${
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
                              </div>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {/* Agencies, Banners, Official, System, Modals... same as before */}
      {/* ... (rest of the component remains unchanged, assuming standard structure) ... */}
      {activeTab === 'agencies' && (
          <div className="flex-1 p-6 flex flex-col overflow-y-auto">
              <h3 className="font-bold text-blue-400 mb-4 flex items-center gap-2">
                  <Database className="w-5 h-5"/> وكالات الشحن النشطة
              </h3>
              
              {loading ? (
                  <div className="text-center text-gray-500">جاري التحميل...</div>
              ) : agents.length === 0 ? (
                  <div className="text-center text-gray-500 mt-10 p-10 border border-gray-800 rounded-xl">لا يوجد وكلاء حالياً</div>
              ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {agents.map(agent => (
                          <div key={agent.uid} className="bg-gray-900 border border-blue-900/50 rounded-xl p-4 flex flex-col gap-3 relative overflow-hidden">
                              <div className="absolute top-0 right-0 p-2 opacity-10"><Database className="w-20 h-20 text-blue-500"/></div>
                              
                              <div className="flex items-center gap-3 relative z-10">
                                  <img src={agent.avatar} className="w-12 h-12 rounded-full border-2 border-blue-500" />
                                  <div>
                                      <div className="font-bold text-white">{agent.name}</div>
                                      <div className="text-xs text-gray-400">ID: {agent.id}</div>
                                  </div>
                              </div>
                              
                              <div className="bg-black/40 rounded-lg p-3 flex justify-between items-center relative z-10 border border-blue-500/20">
                                  <span className="text-xs text-gray-400">رصيد الوكالة</span>
                                  <span className="text-xl font-bold text-blue-400">{agent.agencyBalance?.toLocaleString()} 💎</span>
                              </div>

                              <div className="flex gap-2 mt-1 relative z-10">
                                  <button onClick={() => handleRechargeAgency(agent.uid)} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-xs py-2 rounded font-bold flex items-center justify-center gap-1">
                                      <Plus className="w-3 h-3"/> شحن
                                  </button>
                                  <button onClick={() => handleRevokeAgent(agent.uid)} className="flex-1 bg-red-900/50 hover:bg-red-900 text-red-400 border border-red-900 text-xs py-2 rounded font-bold flex items-center justify-center gap-1">
                                      <X className="w-3 h-3"/> سحب الوكالة
                                  </button>
                              </div>
                          </div>
                      ))}
                  </div>
              )}
          </div>
      )}

      {activeTab === 'banners' && (
          <div className="flex-1 p-6 flex flex-col overflow-y-auto">
              <div className="bg-gray-900 p-4 rounded-xl border border-gray-800 mb-4">
                  <h3 className="font-bold text-purple-400 mb-2">إضافة بنر جديد</h3>
                  <div className="flex flex-col gap-2">
                      <label className="bg-black border border-gray-700 p-3 rounded-lg text-gray-400 flex items-center justify-center cursor-pointer hover:border-purple-500">
                          <input type="file" className="hidden" accept="image/*" onChange={handleBannerUpload} />
                          <div className="flex items-center gap-2"><ImageIcon className="w-5 h-5"/> {newBannerImage ? 'تم اختيار الصورة' : 'رفع صورة (تلقائي الضغط)'}</div>
                      </label>
                      {newBannerImage && (
                          <div className="h-20 w-full bg-black rounded-lg overflow-hidden relative">
                              <img src={newBannerImage} className="w-full h-full object-cover opacity-70" />
                              <div className="absolute top-1 right-1 cursor-pointer" onClick={() => setNewBannerImage('')}><XCircle className="w-5 h-5 text-red-500"/></div>
                          </div>
                      )}
                      <input 
                          type="text" 
                          placeholder="عنوان البنر (اختياري)" 
                          value={newBannerTitle} 
                          onChange={(e) => setNewBannerTitle(e.target.value)}
                          className="bg-black border border-gray-700 p-2 rounded text-white text-sm"
                      />
                      <button onClick={handleAddBanner} disabled={!newBannerImage || actionLoading === 'add_banner'} className="bg-purple-600 text-white py-2 rounded font-bold flex items-center justify-center gap-2">
                          <Plus className="w-4 h-4"/> إضافة
                      </button>
                  </div>
              </div>

              <h3 className="font-bold text-white mb-2">البنرات الحالية</h3>
              <div className="space-y-2">
                  {banners.map(b => (
                      <div key={b.id} className="bg-gray-800 rounded-xl p-2 flex items-center justify-between border border-gray-700">
                          <img src={b.imageUrl} className="w-16 h-10 object-cover rounded" />
                          <span className="text-xs text-gray-300 truncate max-w-[100px]">{b.title || 'بدون عنوان'}</span>
                          <button onClick={() => handleDeleteBanner(b.id)} className="p-2 bg-red-500/20 text-red-500 rounded hover:bg-red-500/30"><Trash2 className="w-4 h-4"/></button>
                      </div>
                  ))}
                  {banners.length === 0 && <div className="text-gray-500 text-center text-sm">لا يوجد بنرات</div>}
              </div>
          </div>
      )}

      {activeTab === 'official' && (
          <div className="flex-1 p-6 flex flex-col">
              <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800">
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Megaphone className="w-5 h-5"/> إرسال رسالة رسمية</h2>
                  <div className="space-y-4">
                      <input 
                        type="text" 
                        placeholder="عنوان الرسالة"
                        value={officialTitle}
                        onChange={(e) => setOfficialTitle(e.target.value)}
                        className="w-full bg-black border border-gray-700 p-3 rounded-lg text-white"
                      />
                      <textarea 
                        placeholder="نص الرسالة..."
                        rows={4}
                        value={officialBody}
                        onChange={(e) => setOfficialBody(e.target.value)}
                        className="w-full bg-black border border-gray-700 p-3 rounded-lg text-white"
                      ></textarea>
                      <button 
                        onClick={() => handleBroadcast()}
                        disabled={actionLoading === 'broadcast'}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2"
                      >
                          <Send className="w-4 h-4 ml-2" /> إرسال للجميع
                      </button>
                  </div>
              </div>
          </div>
      )}

      {activeTab === 'system' && (
          <div className="flex-1 p-6 flex flex-col items-center overflow-y-auto space-y-6">
              <div className="bg-red-900/10 p-6 rounded-2xl border border-red-900/50 max-w-sm w-full text-center">
                  <Trash2 className="w-16 h-16 text-red-500 mx-auto mb-4" />
                  <h2 className="text-xl font-bold text-red-500 mb-2">منطقة الخطر</h2>
                  
                  <div className="space-y-3">
                      <button onClick={() => handleDeleteRooms()} disabled={actionLoading === 'system'} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg mt-4">
                          {actionLoading === 'system' ? 'جاري الحذف...' : 'حذف جميع الرومات'}
                      </button>

                      <button onClick={handleResetGhostUsers} disabled={actionLoading === 'reset_ghosts'} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2">
                          <Ghost className="w-5 h-5"/>
                          {actionLoading === 'reset_ghosts' ? 'جاري التنظيف...' : 'تنظيف الحسابات المعلقة'}
                      </button>

                      <button onClick={handleResetAllCoins} disabled={actionLoading === 'reset_coins'} className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2">
                          <Coins className="w-5 h-5"/>
                          {actionLoading === 'reset_coins' ? 'جاري التصفير...' : 'تصفير كوينز الجميع'}
                      </button>

                      <button onClick={handleResetAllCups} disabled={actionLoading === 'reset_cups'} className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2">
                          <Trophy className="w-5 h-5"/>
                          {actionLoading === 'reset_cups' ? 'جاري التصفير...' : 'تصفير الكأس للجميع'}
                      </button>
                  </div>
              </div>

              <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700 max-w-sm w-full text-center">
                  <RefreshCw className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                  <h2 className="text-lg font-bold text-blue-400 mb-2">إصلاح معرفات الغرف</h2>
                  <p className="text-xs text-gray-400 mb-4">تحديث جميع الغرف القديمة لتستخدم معرف المستخدم كمعرف للغرفة.</p>
                  <button onClick={handleSyncRoomIds} disabled={actionLoading === 'sync_ids'} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg">
                      {actionLoading === 'sync_ids' ? 'جاري التحديث...' : 'توحيد معرفات الرومات'}
                  </button>
              </div>
          </div>
      )}

      {/* Ban Modal */}
      {showBanModal && (
          <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur flex items-center justify-center p-4">
              <div className="bg-gray-900 border border-red-500 rounded-xl p-5 w-full max-w-sm shadow-2xl text-right">
                  <h3 className="text-red-500 font-bold mb-4 flex items-center gap-2">
                      <Ban className="w-5 h-5"/> حظر المستخدم
                  </h3>
                  <div className="space-y-2 mb-6">
                      <p className="text-gray-400 text-sm mb-2">اختر مدة الحظر:</p>
                      {[1, 3, 7, 30].map(days => (
                          <button 
                            key={days}
                            onClick={() => setBanDuration(days)}
                            className={`w-full p-2 rounded text-sm font-bold border transition ${banDuration === days ? 'bg-red-600 text-white border-red-600' : 'bg-black border-gray-700 text-gray-300'}`}
                          >
                              {days} يوم
                          </button>
                      ))}
                      <button 
                        onClick={() => setBanDuration(-1)}
                        className={`w-full p-2 rounded text-sm font-bold border transition ${banDuration === -1 ? 'bg-red-900 text-white border-red-600' : 'bg-black border-gray-700 text-red-400'}`}
                      >
                          حظر دائم ⛔
                      </button>
                  </div>
                  <div className="flex gap-2">
                      <button onClick={() => confirmBanUser(showBanModal, true)} className="flex-1 bg-red-600 text-white py-2 rounded font-bold">تأكيد الحظر</button>
                      <button onClick={() => setShowBanModal(null)} className="flex-1 bg-gray-700 text-white py-2 rounded">إلغاء</button>
                  </div>
              </div>
          </div>
      )}

      {/* Gift Modal */}
      {showGiftModal && (
          <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur flex items-center justify-center p-4">
              <div className="bg-gray-900 border border-blue-500 rounded-xl p-5 w-full max-w-xs shadow-2xl text-right">
                  <h3 className="text-blue-400 font-bold mb-4">وكالة الشحن</h3>
                  <input type="number" value={giftAmount} onChange={(e) => setGiftAmount(e.target.value)} placeholder="الكمية" className="w-full bg-black p-2 rounded mb-4 text-white border border-gray-700 text-right"/>
                  <div className="flex gap-2">
                      <button onClick={() => handleGiftSubmit()} className="flex-1 bg-blue-600 text-white py-2 rounded font-bold">إرسال</button>
                      <button onClick={() => setShowGiftModal(null)} className="flex-1 bg-gray-700 text-white py-2 rounded">إلغاء</button>
                  </div>
              </div>
          </div>
      )}

      {/* VIP Modal */}
      {showVipModal && (
          <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur flex items-center justify-center p-4">
              <div className="bg-gray-900 border border-gold-500 rounded-xl p-4 w-full max-w-sm max-h-[80vh] flex flex-col shadow-2xl text-right">
                  <h3 className="text-gold-400 font-bold mb-4">تعيين مستوى VIP</h3>
                  <div className="overflow-y-auto grid grid-cols-2 gap-2">
                       <button onClick={() => handleSelectVip(0)} className="col-span-2 p-2 border border-red-500 text-red-400 rounded">إزالة VIP</button>
                       {VIP_TIERS.filter(t => t.level > 0).map(t => (
                           <button key={t.level} onClick={() => handleSelectVip(t.level)} className="p-2 border border-gray-700 rounded hover:bg-gray-800 text-white text-xs">
                               {t.badge} {t.name[language]} (L{t.level})
                           </button>
                       ))}
                  </div>
                  <button onClick={() => setShowVipModal(null)} className="mt-4 w-full bg-gray-700 text-white py-2 rounded">إغلاق</button>
              </div>
          </div>
      )}

      {/* Custom ID Modal */}
      {showIdModal && (
          <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur flex items-center justify-center p-4">
              <div className="bg-gray-900 border border-purple-500 rounded-xl p-5 w-full max-w-xs shadow-2xl text-right">
                  <h3 className="text-purple-400 font-bold mb-4">تعيين معرف مميز</h3>
                  <input type="text" value={newCustomId} onChange={(e) => setNewCustomId(e.target.value)} placeholder="المعرف الجديد (مثال: KING)" className="w-full bg-black p-2 rounded mb-4 text-white border border-gray-700 text-right"/>
                  <div className="flex gap-2">
                      <button onClick={() => handleUpdateId()} className="flex-1 bg-purple-600 text-white py-2 rounded font-bold">تحديث</button>
                      <button onClick={() => setShowIdModal(null)} className="flex-1 bg-gray-700 text-white py-2 rounded">إلغاء</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default AdminDashboard;
