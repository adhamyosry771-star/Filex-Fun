
import React, { useState, useEffect } from 'react';
import { Users, Search, Bell, Plus, X, Image as ImageIcon, Upload, Flame, Tag, UserPlus, BadgeCheck, ChevronRight, ChevronLeft, Gamepad2, Lock, LayoutGrid, List, Info, Home as HomeIcon, Clock, History, Quote, Video } from 'lucide-react';
import { Room, Language, User, Banner } from '../types';
import { createRoom, listenToBanners } from '../services/firebaseService';
import { auth } from '../firebaseConfig';
import { ROOM_BACKGROUNDS } from '../constants';

interface HomeViewProps {
  rooms: Room[];
  onJoinRoom: (room: Room) => void;
  language: Language;
  userProfile: User | null;
  onSearch: () => void;
}

const HomeView: React.FC<HomeViewProps> = ({ rooms, onJoinRoom, language, userProfile, onSearch }) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoomTitle, setNewRoomTitle] = useState('');
  const [selectedBg, setSelectedBg] = useState(ROOM_BACKGROUNDS[0]);
  const [backgroundType, setBackgroundType] = useState<'image' | 'video'>('image');
  const [creating, setCreating] = useState(false);
  
  // Search State
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Category State
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'popular' | 'myRoom'>('all');

  // View Mode State (Grid vs List) with Persistence
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
      const saved = localStorage.getItem('roomViewMode');
      return (saved === 'grid' || saved === 'list') ? saved : 'grid';
  });

  // Banner State
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Lock State
  const [passwordModalRoom, setPasswordModalRoom] = useState<Room | null>(null);
  const [passwordInput, setPasswordInput] = useState('');

  // Recent Rooms State
  const [recentRoomIds, setRecentRoomIds] = useState<string[]>([]);

  useEffect(() => {
      const unsub = listenToBanners((data) => setBanners(data));
      // Load recent rooms from local storage
      try {
          const stored = localStorage.getItem('recentRooms');
          if (stored) setRecentRoomIds(JSON.parse(stored));
      } catch (e) { console.error(e); }
      return () => unsub();
  }, []);

  // Auto-rotate banner
  useEffect(() => {
      if (banners.length <= 1) return;
      const interval = setInterval(() => {
          setCurrentSlide((prev) => (prev + 1) % banners.length);
      }, 5000);
      return () => clearInterval(interval);
  }, [banners.length]);

  const toggleViewMode = () => {
      const newMode = viewMode === 'grid' ? 'list' : 'grid';
      setViewMode(newMode);
      localStorage.setItem('roomViewMode', newMode);
  };

  const t = (key: string) => {
    const dict: Record<string, { ar: string, en: string }> = {
        trending: { ar: 'شائع الآن', en: 'TRENDING' },
        bannerTitle: { ar: 'معركة فليكس: الموسم الخامس', en: 'Flex Battle: Season 5' },
        bannerSub: { ar: 'انضم لأقوى الداعمين الآن!', en: 'Join the top gifters now!' },
        all: { ar: 'الكل', en: 'All' },
        popular: { ar: 'شائع', en: 'Popular' },
        myRoom: { ar: 'غرفتي', en: 'My Room' },
        myRoomsTitle: { ar: 'غرفي الخاصة', en: 'My Rooms' },
        recentRoomsTitle: { ar: 'دخلتها مؤخراً', en: 'Recently Visited' },
        createRoom: { ar: 'إنشاء غرفة', en: 'Create Room' },
        roomName: { ar: 'اسم الغرفة', en: 'Room Name' },
        bg: { ar: 'اختر غلاف الغرفة', en: 'Select Room Cover' },
        create: { ar: 'إنشاء', en: 'Create' },
        cancel: { ar: 'إلغاء', en: 'Cancel' },
        noRooms: { ar: 'لا توجد غرف مطابقة. كن أول من ينشئ غرفة!', en: 'No matching rooms. Be the first to create one!' },
        noMyRooms: { ar: 'لا تملك أي غرف بعد', en: 'You have no rooms yet' },
        noRecent: { ar: 'لم تقم بزيارة أي غرفة مؤخراً', en: 'No recent rooms visited' },
        uploadBg: { ar: 'رفع صورة/فيديو', en: 'Upload Media' },
        searchPlaceholder: { ar: 'بحث عن غرفة، مضيف، أو تاج...', en: 'Search rooms, hosts, or tags...' },
        findUsers: { ar: 'هل تبحث عن مستخدم؟', en: 'Looking for a user?' },
        clear: { ar: 'مسح', en: 'Clear' },
        official: { ar: 'غرفة رسمية', en: 'Official Room' },
        enterPass: { ar: 'أدخل كلمة المرور', en: 'Enter Password' },
        passWrong: { ar: 'كلمة المرور خاطئة', en: 'Wrong Password' },
        join: { ar: 'دخول', en: 'Join' },
        privateRoom: { ar: 'غرفة خاصة', en: 'Private Room' },
        contactAdmin: { ar: 'برجاء التواصل مع الاداره لفتح هذه الميزه', en: 'Please contact administration to unlock this feature' }
    };
    return dict[key][language];
  };

  const categoryKeys: ('all' | 'popular' | 'myRoom')[] = ['all', 'popular', 'myRoom'];

  const getFilteredRooms = () => {
      let filtered = rooms.filter(r => !r.isBanned);

      if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          filtered = filtered.filter(room => 
              room.title.toLowerCase().includes(q) || 
              room.hostName.toLowerCase().includes(q) ||
              (room.displayId && room.displayId.toLowerCase().includes(q)) ||
              (room.tags && room.tags.some(tag => tag.toLowerCase().includes(q)))
          );
          return filtered; // If searching, ignore category tabs logic mostly
      }

      if (selectedCategory === 'popular') {
          // Popular: Must have viewers and sorted by count
          return filtered.filter(r => r.viewerCount > 0).sort((a, b) => b.viewerCount - a.viewerCount);
      }
      
      if (selectedCategory === 'myRoom') {
          // This category has special rendering (2 sections), but for the main list variable we return empty
          // to handle it in the render block specifically.
          return [];
      }

      return filtered; // 'all'
  };

  const displayedRooms = getFilteredRooms();

  const handleCreateRoomClick = () => {
      if (userProfile?.canCreateRoom) {
          setShowCreateModal(true);
      } else {
          alert(t('contactAdmin'));
      }
  };

  const handleCreateRoom = async () => {
      if (!newRoomTitle.trim()) return;
      if (!auth.currentUser || !userProfile) {
          alert("Please login first to create a room.");
          return;
      }

      setCreating(true);
      try {
          // Pass the background type. The selectedBg is already the data URL.
          await createRoom(newRoomTitle, selectedBg, userProfile, auth.currentUser.uid, backgroundType);
          setShowCreateModal(false);
          setNewRoomTitle('');
          setSelectedCategory('myRoom'); // Switch to My Room to see it
      } catch (e: any) {
          alert('Failed to create room: ' + (e.message || 'Unknown error'));
      } finally {
          setCreating(false);
      }
  };

  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          if (file.size > 5 * 1024 * 1024) {
              alert(language === 'ar' ? 'حجم الملف كبير جداً (أقصى 5 ميجا)' : 'File too large (Max 5MB)');
              return;
          }

          const reader = new FileReader();
          reader.onloadend = () => {
              if (typeof reader.result === 'string') {
                  setSelectedBg(reader.result);
                  if (file.type.startsWith('video/')) {
                      setBackgroundType('video');
                  } else {
                      setBackgroundType('image');
                  }
              }
          };
          reader.readAsDataURL(file);
      }
  };

  const handleRoomClick = (room: Room) => {
      // 1. Save to Recent History
      const newRecent = [room.id, ...recentRoomIds.filter(id => id !== room.id)].slice(0, 10);
      setRecentRoomIds(newRecent);
      localStorage.setItem('recentRooms', JSON.stringify(newRecent));

      // 2. Logic for locking
      const isHost = room.hostId === userProfile?.id;
      const isAdmin = room.admins?.includes(auth.currentUser?.uid || '');
      
      // If Locked and NOT Host/Admin
      if (room.isLocked && !isHost && !isAdmin) {
          setPasswordModalRoom(room);
          setPasswordInput('');
          return;
      }

      onJoinRoom(room);
  };

  const submitPassword = () => {
      if (!passwordModalRoom) return;
      if (passwordInput === passwordModalRoom.password) {
          onJoinRoom(passwordModalRoom);
          setPasswordModalRoom(null);
      } else {
          alert(t('passWrong'));
      }
  };

  const renderRoomCard = (room: Room) => {
      const isOfficial = room.isOfficial;
      const isActivities = room.isActivities;
      
      if (viewMode === 'grid') {
          const containerClass = isOfficial 
              ? 'border-2 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]' 
              : isActivities
                  ? 'border-2 border-red-600/70 shadow-[0_0_10px_rgba(220,38,38,0.4)]'
                  : room.isHot 
                      ? 'border-2 border-orange-500/50 shadow-[0_0_10px_rgba(249,115,22,0.3)]'
                      : 'border border-white/5';

          return (
              <div 
                  key={room.id} 
                  onClick={(e) => {
                      e.stopPropagation();
                      handleRoomClick(room);
                  }}
                  className={`relative group cursor-pointer active:scale-95 transition-transform bg-gray-800 rounded-xl overflow-hidden shadow-md cursor-pointer ${containerClass}`}
                  style={{cursor: 'pointer', zIndex: 1}}
              >
                  <div className="aspect-[3/4] relative w-full h-full pointer-events-none">
                      <img 
                          src={room.thumbnail} 
                          alt={room.title} 
                          className="w-full h-full object-cover group-hover:scale-110 transition duration-500 opacity-80"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none"></div>
                      
                      {/* Lock Icon Overlay if Locked */}
                      {room.isLocked && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px] z-10">
                              <div className="bg-black/60 p-3 rounded-full border border-white/20">
                                  <Lock className="w-6 h-6 text-white/80" />
                              </div>
                          </div>
                      )}

                      {/* Music Wave Animation - Top Right */}
                      <div className="absolute top-3 right-3 flex items-end gap-0.5 z-20 pointer-events-none">
                          <div className="w-0.5 h-2 bg-brand-400 rounded-full animate-[pulse_0.6s_ease-in-out_infinite]"></div>
                          <div className="w-0.5 h-4 bg-brand-400 rounded-full animate-[pulse_0.8s_ease-in-out_infinite]"></div>
                          <div className="w-0.5 h-3 bg-brand-400 rounded-full animate-[pulse_1s_ease-in-out_infinite]"></div>
                          <div className="w-0.5 h-2 bg-brand-400 rounded-full animate-[pulse_1.2s_ease-in-out_infinite]"></div>
                      </div>

                      {/* Status Tags */}
                      <div className="absolute top-2 left-2 flex flex-col gap-1 items-start pointer-events-none">
                          {isOfficial && (
                              <div className="bg-blue-600/90 backdrop-blur rounded-full px-2 py-0.5 w-fit flex items-center gap-1 shadow-lg border border-blue-400/50">
                                  <BadgeCheck className="w-3 h-3 text-white fill-blue-600" />
                                  <span className="text-[9px] font-bold text-white">OFFICIAL</span>
                              </div>
                          )}
                          {isActivities && (
                              <div className="bg-red-600/90 backdrop-blur rounded-full px-2 py-0.5 w-fit flex items-center gap-1 shadow-lg border border-red-400/50">
                                  <Gamepad2 className="w-3 h-3 text-white fill-white" />
                                  <span className="text-[9px] font-bold text-white">ACTIVITIES</span>
                              </div>
                          )}
                          {room.isHot && !isOfficial && !isActivities && (
                              <div className="bg-red-600/90 backdrop-blur rounded-full px-2 py-0.5 w-fit flex items-center gap-1 shadow-lg border border-red-500/30">
                                  <Flame className="w-3 h-3 text-white fill-white animate-pulse" />
                                  <span className="text-[10px] font-bold text-white">HOT</span>
                              </div>
                          )}
                      </div>

                      <div className="absolute bottom-3 left-3 right-3 pointer-events-none">
                          <h3 className="font-bold text-sm truncate text-right rtl:text-right ltr:text-left text-white drop-shadow-md">{room.title}</h3>
                          
                          <div className="flex justify-between items-end mt-1">
                              <div className="flex items-center gap-1 text-[10px] text-gray-300 bg-black/40 px-1.5 py-0.5 rounded-lg backdrop-blur-sm">
                                  <Users className="w-3 h-3 text-brand-400" />
                                  <span>{room.viewerCount}</span>
                              </div>
                              <span className="text-[9px] text-gray-400 truncate max-w-[60px] flex items-center gap-1">
                                  {isOfficial && <BadgeCheck className="w-3 h-3 text-blue-500 fill-white"/>}
                                  {room.hostName}
                              </span>
                          </div>
                      </div>
                  </div>
              </div>
          );
      } else {
          return (
              <div 
                  key={room.id}
                  onClick={() => handleRoomClick(room)}
                  className={`relative flex items-center w-full bg-gray-800/40 backdrop-blur-xl border ${room.isHot ? 'border-orange-500/30' : 'border-white/10'} rounded-2xl p-2 cursor-pointer active:scale-[0.98] transition-transform overflow-hidden group`}
              >
                  <div className="relative w-20 h-20 shrink-0">
                      <img src={room.thumbnail} className="w-full h-full object-cover rounded-xl shadow-lg border border-white/5" />
                      <div className="absolute top-1 right-1 flex items-end gap-0.5 z-20 pointer-events-none">
                          <div className="w-0.5 h-2 bg-brand-400 rounded-full animate-[pulse_0.6s_ease-in-out_infinite]"></div>
                          <div className="w-0.5 h-3 bg-brand-400 rounded-full animate-[pulse_0.8s_ease-in-out_infinite]"></div>
                          <div className="w-0.5 h-2 bg-brand-400 rounded-full animate-[pulse_1s_ease-in-out_infinite]"></div>
                      </div>
                      {room.isLocked && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-xl">
                              <Lock className="w-6 h-6 text-white/80" />
                          </div>
                      )}
                  </div>
                  <div className="flex-1 px-4 flex flex-col justify-center min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                          <h3 className="font-bold text-white text-base truncate leading-tight">{room.title}</h3>
                      </div>
                      <div className="flex items-center gap-2 mb-1.5">
                          <img src={room.hostAvatar} className="w-4 h-4 rounded-full border border-gray-500" />
                          <span className="text-xs text-gray-300 truncate">{room.hostName}</span>
                      </div>
                      <div className="flex items-center gap-2 mb-1.5">
                          <div className="bg-black/40 px-2 py-0.5 rounded-lg border border-white/5 flex items-center gap-1.5">
                              <div className="flex items-center gap-1 border-l border-white/10 pl-1 ml-1 rtl:border-r rtl:border-l-0 rtl:pl-0 rtl:pr-1 rtl:mr-1">
                                  <Users className="w-3 h-3 text-brand-400" />
                                  <span className="text-[10px] text-gray-300 font-mono">{room.viewerCount}</span>
                              </div>
                              {isOfficial && <BadgeCheck className="w-4 h-4 text-blue-500 fill-white shrink-0" />}
                              {isActivities && <Gamepad2 className="w-4 h-4 text-red-500 fill-white shrink-0" />}
                              {room.isHot && !isOfficial && !isActivities && <Flame className="w-4 h-4 text-orange-500 fill-orange-500 animate-pulse shrink-0" />}
                          </div>
                      </div>
                      
                      {/* Luxurious Glass Description Frame */}
                      {room.description && (
                          <div className="mt-1 px-2 py-1.5 bg-gradient-to-r from-white/5 to-transparent border border-white/5 rounded-lg backdrop-blur-md shadow-sm w-fit max-w-full">
                              <div className="flex items-center gap-1.5 opacity-80">
                                  <Quote className="w-2.5 h-2.5 text-brand-300 fill-brand-300/20" />
                                  <p className="text-[9px] text-gray-200 line-clamp-1 leading-tight italic font-light tracking-wide">
                                      {room.description}
                                  </p>
                              </div>
                          </div>
                      )}
                  </div>
                  <div className="pl-2">
                      <button className="p-2 bg-white/5 rounded-full text-gray-400 hover:bg-brand-600 hover:text-white transition">
                          {language === 'ar' ? <ChevronLeft className="w-5 h-5"/> : <ChevronRight className="w-5 h-5"/>}
                      </button>
                  </div>
              </div>
          );
      }
  };

  // Get data for "My Room" Tab
  const myOwnedRooms = rooms.filter(r => r.hostId === userProfile?.id);
  const myRecentRooms = recentRoomIds.map(id => rooms.find(r => r.id === id)).filter((r): r is Room => !!r);

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white overflow-y-auto pb-24">
      {/* Top Bar */}
      <div className="sticky top-0 z-20 bg-gray-900/95 backdrop-blur-xl p-4 flex justify-between items-center border-b border-white/5 shadow-sm">
        <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-brand-400 to-accent-500 italic tracking-tight">
          Flex Fun
        </h1>
        <div className="flex gap-3 items-center">
          <button 
            onClick={handleCreateRoomClick}
            className="p-1.5 rounded-full bg-gradient-to-r from-brand-600 to-accent-600 shadow-lg hover:scale-105 transition flex items-center justify-center"
          >
              <HomeIcon className="w-5 h-5 text-white" />
          </button>
          <button 
            onClick={() => {
                setShowSearchBar(!showSearchBar);
                if (!showSearchBar) setTimeout(() => document.getElementById('room-search-input')?.focus(), 100);
            }} 
            className={`p-2 rounded-full transition ${showSearchBar ? 'bg-white/10 text-brand-400' : 'hover:bg-white/5'}`}
          >
              <Search className="w-6 h-6" />
          </button>
          <button className="p-2 rounded-full hover:bg-white/5 relative">
              <Bell className="w-6 h-6" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
          </button>
        </div>
      </div>

      {/* Robust Search Bar Area */}
      {showSearchBar && (
          <div className="px-4 pt-2 pb-4 bg-gray-900/95 backdrop-blur-xl sticky top-[73px] z-20 border-b border-white/5 animate-in slide-in-from-top-2">
              <div className="relative">
                  <Search className="absolute top-3 left-4 rtl:right-4 rtl:left-auto text-gray-500 w-5 h-5" />
                  <input 
                      id="room-search-input"
                      type="text" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t('searchPlaceholder')}
                      className="w-full bg-black/40 border border-gray-700 rounded-xl py-2.5 px-12 text-white focus:border-brand-500 outline-none text-sm transition-all"
                  />
                  {searchQuery && (
                      <button 
                        onClick={() => setSearchQuery('')}
                        className="absolute top-2.5 right-3 rtl:left-3 rtl:right-auto p-0.5 bg-gray-800 rounded-full text-gray-400 hover:text-white"
                      >
                          <X className="w-4 h-4" />
                      </button>
                  )}
              </div>
              <div 
                  onClick={onSearch}
                  className="mt-2 flex items-center gap-2 text-xs text-brand-400 font-bold cursor-pointer hover:underline px-2"
              >
                  <UserPlus className="w-4 h-4" />
                  {t('findUsers')}
              </div>
          </div>
      )}

      <div className="px-4 space-y-6 mt-4">
        
        {/* --- DYNAMIC BANNER CAROUSEL --- */}
        {!searchQuery && (
            <div className="w-full h-40 rounded-2xl bg-gray-800 relative overflow-hidden shadow-lg group" dir="ltr">
                {banners.length > 0 ? (
                    <>
                        <div 
                            className="flex h-full transition-transform duration-700 ease-in-out" 
                            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                        >
                            {banners.map((banner) => (
                                <div key={banner.id} className="min-w-full h-full relative">
                                    <img src={banner.imageUrl} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                                    {banner.title && (
                                        <div className={`absolute bottom-4 ${language === 'ar' ? 'right-4 text-right' : 'left-4 text-left'} z-10 w-full px-4`}>
                                            <h2 className="text-lg font-bold text-white drop-shadow-md">{banner.title}</h2>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        {banners.length > 1 && (
                            <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5 z-20">
                                {banners.map((_, idx) => (
                                    <div 
                                        key={idx} 
                                        className={`w-1.5 h-1.5 rounded-full transition-all ${idx === currentSlide ? 'bg-white w-3' : 'bg-white/40'}`}
                                    />
                                ))}
                            </div>
                        )}
                    </>
                ) : (
                    <div className="w-full h-full relative bg-gradient-to-r from-purple-800 to-indigo-900 cursor-pointer" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=800&auto=format&fit=crop')] bg-cover opacity-40 group-hover:scale-105 transition duration-700"></div>
                        <div className={`absolute bottom-4 ${language === 'ar' ? 'right-4' : 'left-4'}`}>
                            <span className="bg-accent-500 text-xs font-bold px-2 py-1 rounded mb-2 inline-block">
                                {t('trending')}
                            </span>
                            <h2 className="text-xl font-bold">{t('bannerTitle')}</h2>
                            <p className="text-sm text-gray-200">{t('bannerSub')}</p>
                        </div>
                    </div>
                )}
            </div>
        )}

        {/* Categories & View Toggle */}
        {!searchQuery && (
            <div className="flex items-center justify-between gap-2">
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide flex-1">
                    {categoryKeys.map((catKey) => (
                        <button 
                            key={catKey}
                            onClick={() => setSelectedCategory(catKey)}
                            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition ${selectedCategory === catKey ? 'bg-white text-black font-bold' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                        >
                            {t(catKey)}
                        </button>
                    ))}
                </div>
                
                <button 
                    onClick={toggleViewMode}
                    className="p-2 bg-gray-800 rounded-xl text-gray-400 hover:text-white hover:bg-gray-700 transition border border-white/5 shrink-0"
                >
                    {viewMode === 'grid' ? <List className="w-5 h-5"/> : <LayoutGrid className="w-5 h-5"/>}
                </button>
            </div>
        )}

        {/* Main Content Area */}
        {selectedCategory === 'myRoom' && !searchQuery ? (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                {/* Section 1: My Owned Rooms */}
                <div>
                    <h3 className="text-brand-400 font-bold mb-3 flex items-center gap-2 px-1">
                        <HomeIcon className="w-4 h-4"/> {t('myRoomsTitle')}
                    </h3>
                    {myOwnedRooms.length === 0 ? (
                        <div className="bg-gray-800/50 border border-dashed border-gray-700 rounded-xl p-6 text-center text-gray-500 flex flex-col items-center">
                            <HomeIcon className="w-8 h-8 mb-2 opacity-50"/>
                            {t('noMyRooms')}
                        </div>
                    ) : (
                        <div className={viewMode === 'grid' ? "grid grid-cols-2 sm:grid-cols-3 gap-4" : "flex flex-col space-y-3"}>
                            {myOwnedRooms.map(room => renderRoomCard(room))}
                        </div>
                    )}
                </div>

                {/* Section 2: Recently Visited */}
                <div>
                    <h3 className="text-gray-400 font-bold mb-3 flex items-center gap-2 px-1">
                        <History className="w-4 h-4"/> {t('recentRoomsTitle')}
                    </h3>
                    {myRecentRooms.length === 0 ? (
                        <div className="bg-gray-800/50 border border-dashed border-gray-700 rounded-xl p-6 text-center text-gray-500 flex flex-col items-center">
                            <Clock className="w-8 h-8 mb-2 opacity-50"/>
                            {t('noRecent')}
                        </div>
                    ) : (
                        <div className={viewMode === 'grid' ? "grid grid-cols-2 sm:grid-cols-3 gap-4" : "flex flex-col space-y-3"}>
                            {myRecentRooms.map(room => renderRoomCard(room))}
                        </div>
                    )}
                </div>
            </div>
        ) : (
            // Standard List (All / Popular / Search Results)
            displayedRooms.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center opacity-60">
                    <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mb-4 border border-gray-700">
                        {searchQuery ? <Search className="w-10 h-10 text-gray-600" /> : <ImageIcon className="w-10 h-10 text-gray-600" />}
                    </div>
                    <p>{t('noRooms')}</p>
                    {searchQuery && (
                        <button onClick={() => setSearchQuery('')} className="mt-4 text-brand-400 text-sm font-bold">
                            {t('clear')}
                        </button>
                    )}
                </div>
            ) : (
                <div className={viewMode === 'grid' ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 animate-in fade-in duration-500" : "flex flex-col space-y-3 animate-in slide-in-from-bottom-2 duration-500"}>
                    {displayedRooms.map(room => renderRoomCard(room))}
                </div>
            )
        )}
      </div>

      {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
              <div className="bg-gray-900 border border-gray-700 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl">
                  <div className="p-4 border-b border-gray-800 flex justify-between items-center">
                      <h3 className="text-white font-bold">{t('createRoom')}</h3>
                      <button onClick={() => setShowCreateModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
                  </div>
                  <div className="p-6 space-y-4">
                      <div>
                          <label className="text-xs text-gray-400 mb-1 block">{t('roomName')}</label>
                          <input 
                            type="text" 
                            value={newRoomTitle}
                            onChange={(e) => setNewRoomTitle(e.target.value)}
                            className="w-full bg-black/40 border border-gray-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none"
                            placeholder="Ex: Chill Vibes 🎵"
                          />
                      </div>

                      <div>
                          <label className="text-xs text-gray-400 mb-2 block">{t('bg')}</label>
                          <div className="flex gap-3 overflow-x-auto pb-4 pt-1 px-1 scrollbar-hide">
                                <label className="shrink-0 w-24 h-24 rounded-lg border-2 border-dashed border-gray-600 flex flex-col items-center justify-center cursor-pointer hover:border-brand-500 hover:bg-white/5 transition bg-white/5 group">
                                    <input type="file" accept="image/*,video/*" className="hidden" onChange={handleBgUpload} />
                                    <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center group-hover:bg-brand-500 transition mb-1">
                                        <Upload className="w-4 h-4 text-white" />
                                    </div>
                                    <span className="text-[7px] text-gray-500 font-bold">{t('uploadBg')}</span>
                                </label>
                                {ROOM_BACKGROUNDS.map((bg, i) => (
                                    <button 
                                        key={i} 
                                        onClick={() => {
                                            setSelectedBg(bg);
                                            setBackgroundType('image');
                                        }}
                                        className={`shrink-0 w-24 h-24 rounded-lg overflow-hidden border-2 relative transition hover:scale-105 ${selectedBg === bg && backgroundType === 'image' ? 'border-brand-500 ring-2 ring-brand-500/30' : 'border-transparent border-white/10'}`}
                                    >
                                        <img src={bg} className="w-full h-full object-cover" />
                                        {selectedBg === bg && backgroundType === 'image' && (
                                            <div className="absolute inset-0 bg-brand-500/40 flex items-center justify-center backdrop-blur-[1px]">
                                                <div className="bg-white rounded-full p-1 shadow-lg"><BadgeCheck className="w-5 h-5 text-brand-600 fill-white" /></div>
                                            </div>
                                        )}
                                    </button>
                                ))}
                          </div>
                      </div>
                      
                      <div className="flex gap-2 pt-2">
                          <button 
                            onClick={() => setShowCreateModal(false)}
                            className="flex-1 py-3 rounded-xl bg-gray-800 text-gray-400 font-bold"
                          >
                              {t('cancel')}
                          </button>
                          <button 
                            onClick={handleCreateRoom}
                            disabled={creating || !newRoomTitle}
                            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-brand-600 to-accent-600 text-white font-bold disabled:opacity-50"
                          >
                              {creating ? '...' : t('create')}
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {passwordModalRoom && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
              <div className="bg-gray-900 border border-gray-700 rounded-3xl w-full max-w-xs shadow-2xl p-6 relative">
                  <button onClick={() => setPasswordModalRoom(null)} className="absolute top-4 right-4 text-gray-400"><X className="w-5 h-5"/></button>
                  <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center border-2 border-dashed border-gray-600">
                          <Lock className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-white font-bold text-lg">{t('privateRoom')}</h3>
                      <input 
                          type="password" 
                          placeholder={t('enterPass')}
                          value={passwordInput}
                          onChange={(e) => setPasswordInput(e.target.value)}
                          maxLength={6}
                          className="w-full bg-black/50 border border-gray-600 rounded-xl py-3 px-4 text-center text-white tracking-widest text-lg focus:border-brand-500 outline-none"
                      />
                      <button 
                          onClick={submitPassword}
                          disabled={passwordInput.length < 6}
                          className="w-full py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold disabled:opacity-50"
                      >
                          {t('join')}
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default HomeView;
