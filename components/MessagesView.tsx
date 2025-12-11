import React, { useState, useEffect } from 'react';
import { ShieldCheck, ArrowLeft, Megaphone, Inbox, Clock, ChevronRight, UserPlus, Check, X, MessageCircle, Loader2 } from 'lucide-react';
import { Language, Notification, FriendRequest, PrivateChatSummary } from '../types';
import { listenToNotifications, listenToFriendRequests, acceptFriendRequest, rejectFriendRequest, listenToChatList, markSystemNotificationsRead, listenToUnreadNotifications, getUserProfile, sendPrivateMessage, markOfficialMessagesRead, sendSystemNotification } from '../services/firebaseService';
import { auth } from '../firebaseConfig';
import PrivateChatView from './PrivateChatView'; 

interface MessagesViewProps {
  language: Language;
  onOpenChat?: (chat: PrivateChatSummary) => void;
}

const MessagesView: React.FC<MessagesViewProps> = ({ language, onOpenChat }) => {
  const [subView, setSubView] = useState<'main' | 'official' | 'system' | 'requests'>('main');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [chats, setChats] = useState<PrivateChatSummary[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Unread Counts for Menu (Separated)
  const [unreadSystem, setUnreadSystem] = useState(0);
  const [unreadOfficial, setUnreadOfficial] = useState(0);
  const [unreadRequests, setUnreadRequests] = useState(0);
  
  // Track action loading for specific requests
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const t = (key: string) => {
    const dict: Record<string, { ar: string, en: string }> = {
      messages: { ar: 'الرسائل', en: 'Messages' },
      official: { ar: 'الرسائل الرسمية', en: 'Official Messages' },
      system: { ar: 'رسائل النظام', en: 'System Messages' },
      requests: { ar: 'طلبات المتابعة', en: 'Follow Requests' },
      officialDesc: { ar: 'إعلانات وتحديثات Flex Fun', en: 'Flex Fun updates & news' },
      systemDesc: { ar: 'تنبيهات الأمان والحساب', en: 'Security & account alerts' },
      requestsDesc: { ar: 'طلبات الصداقة الجديدة', en: 'New friend requests' },
      chats: { ar: 'المحادثات', en: 'Chats' },
      noMsgs: { ar: 'لا توجد رسائل جديدة', en: 'No new messages' },
      noChats: { ar: 'لا توجد محادثات خاصة بعد', en: 'No private chats yet' },
      loading: { ar: 'جاري التحميل...', en: 'Loading...' },
      accept: { ar: 'قبول', en: 'Accept' },
      reject: { ar: 'رفض', en: 'Reject' },
      noReqs: { ar: 'لا توجد طلبات جديدة', en: 'No new requests' }
    };
    return dict[key][language];
  };

  useEffect(() => {
      if (!auth.currentUser) return;
      const uid = auth.currentUser.uid;

      let reqUnsub: (() => void) | null = null;
      let sysUnsub: (() => void) | null = null;

      if (subView === 'main') {
          // Listen to Chats List
          const unsub = listenToChatList(uid, (list) => {
              setChats(list);
          });
          
          // Listen to counts for badges (Separated now)
          sysUnsub = listenToUnreadNotifications(uid, (counts) => {
              setUnreadSystem(counts.system);
              setUnreadOfficial(counts.official);
          });
          
          reqUnsub = listenToFriendRequests(uid, (reqs) => {
              setRequests(reqs); // Needed for banner preview
              setUnreadRequests(reqs.length);
          });

          return () => {
              unsub();
              if(sysUnsub) sysUnsub();
              if(reqUnsub) reqUnsub();
          };
      }
      else if (subView === 'requests') {
          setLoading(true);
          const unsub = listenToFriendRequests(uid, (reqs) => {
              setRequests(reqs);
              setLoading(false);
          });
          return () => unsub();
      } 
      else {
          // System & Official
          setLoading(true);
          const unsub = listenToNotifications(uid, subView as 'system' | 'official', (msgs) => {
              setNotifications(msgs);
              setLoading(false);
              
              // Continuously mark as read if active in this view
              if (subView === 'system') {
                  markSystemNotificationsRead(uid);
              }
              if (subView === 'official') {
                  markOfficialMessagesRead(uid);
              }
          });
          return () => unsub();
      }
  }, [subView]);

  const handleRequestAction = async (targetReq: FriendRequest, action: 'accept' | 'reject') => {
      if (!auth.currentUser) return;
      
      // Basic Debounce/Loading
      if (actionLoading) return;
      setActionLoading(targetReq.uid);

      try {
          const myUid = auth.currentUser.uid;

          if (action === 'accept') {
              // 1. Accept Friend Request in DB
              await acceptFriendRequest(myUid, targetReq.uid);

              // 2. Fetch my profile to get correct name/avatar for messages
              const myProfile = await getUserProfile(myUid);
              
              if (myProfile) {
                  // 3. Automatically Send a Message to start the chat
                  const sender = {
                      uid: myUid,
                      name: myProfile.name,
                      avatar: myProfile.avatar,
                      frameId: myProfile.equippedFrame,
                      bubbleId: myProfile.equippedBubble
                  };
                  const receiver = {
                      uid: targetReq.uid,
                      name: targetReq.name,
                      avatar: targetReq.avatar
                  };

                  const welcomeText = language === 'ar' 
                      ? 'لقد قبلت طلب الصداقة الخاص بك، هيا ندردش! 👋' 
                      : 'I accepted your friend request, let\'s chat! 👋';

                  await sendPrivateMessage(sender, receiver, welcomeText);

                  // 4. Notify the *other* user that request was accepted
                  const notifTitle = language === 'ar' ? 'تم قبول الصداقة' : 'Friend Request Accepted';
                  const notifBody = language === 'ar' 
                      ? `لقد قبل ${myProfile.name} طلب الصداقة. هيا ندردش!`
                      : `${myProfile.name} accepted your friend request. Let's chat!`;
                  
                  await sendSystemNotification(targetReq.uid, notifTitle, notifBody);
              }

          } else {
              await rejectFriendRequest(myUid, targetReq.uid);
          }
      } catch (e) {
          console.error("Error handling request:", e);
      } finally {
          setActionLoading(null);
      }
  };

  // SUB-VIEW: Requests
  if (subView === 'requests') {
      return (
        <div className="h-full bg-gray-900 text-white flex flex-col animate-in slide-in-from-right duration-300 font-sans">
            <div className="p-4 bg-gray-800 shadow-md flex items-center gap-3">
                <button onClick={() => setSubView('main')} className="p-2 rounded-full hover:bg-white/10 transition">
                    <ArrowLeft className="w-6 h-6 rtl:rotate-180" />
                </button>
                <h2 className="font-bold text-lg flex items-center gap-2">
                    <div className="p-2 rounded-full bg-green-500/10 text-green-400"><UserPlus className="w-5 h-5" /></div>
                    {t('requests')}
                </h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {requests.length === 0 ? (
                    <div className="text-center text-gray-500 mt-20">{t('noReqs')}</div>
                ) : requests.map(req => (
                    <div key={req.uid} className="bg-gray-800 rounded-xl p-4 flex items-center justify-between border border-gray-700">
                        <div className="flex items-center gap-3">
                            <img src={req.avatar} className="w-12 h-12 rounded-full object-cover" />
                            <div>
                                <h3 className="font-bold">{req.name}</h3>
                                <p className="text-xs text-gray-400">{new Date(req.timestamp).toLocaleDateString()}</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                             <button 
                                onClick={(e) => { e.stopPropagation(); handleRequestAction(req, 'reject'); }}
                                disabled={actionLoading === req.uid}
                                className="p-2 bg-red-500/10 text-red-500 rounded-full hover:bg-red-500/20 transition disabled:opacity-50"
                             >
                                 <X className="w-5 h-5"/>
                             </button>
                             <button 
                                onClick={(e) => { e.stopPropagation(); handleRequestAction(req, 'accept'); }}
                                disabled={actionLoading === req.uid}
                                className="p-2 bg-green-500/10 text-green-500 rounded-full hover:bg-green-500/20 transition disabled:opacity-50"
                             >
                                 {actionLoading === req.uid ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5"/>}
                             </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      );
  }

  // SUB-VIEW: Notification List
  if (subView === 'official' || subView === 'system') {
    const title = subView === 'official' ? t('official') : t('system');
    const Icon = subView === 'official' ? Megaphone : ShieldCheck;
    const colorClass = subView === 'official' ? 'text-blue-400 bg-blue-500/10' : 'text-orange-400 bg-orange-500/10';

    return (
      <div className="h-full bg-gray-900 text-white flex flex-col animate-in slide-in-from-right duration-300 font-sans">
        <div className="p-4 bg-gray-800 shadow-md flex items-center gap-3">
          <button onClick={() => setSubView('main')} className="p-2 rounded-full hover:bg-white/10 transition">
            <ArrowLeft className="w-6 h-6 rtl:rotate-180" />
          </button>
          <h2 className="font-bold text-lg flex items-center gap-2">
             <div className={`p-2 rounded-full ${colorClass}`}>
                 <Icon className="w-5 h-5" />
             </div>
             {title}
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
              <div className="text-center text-gray-500 mt-10">{t('loading')}</div>
          ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center mt-20 opacity-50">
                  <Inbox className="w-16 h-16 text-gray-600 mb-4" />
                  <p className="text-gray-400">{t('noMsgs')}</p>
              </div>
          ) : (
            notifications.map(item => (
                <div key={item.id} className="bg-gray-800 border border-gray-700 rounded-2xl p-4 shadow-sm relative overflow-hidden group hover:border-brand-500/50 transition">
                    <div className="flex justify-between items-start mb-2 relative z-10">
                        <h3 className="font-bold text-brand-100 text-base">{item.title}</h3>
                        <div className="flex items-center gap-1 text-[10px] text-gray-500 bg-black/20 px-2 py-0.5 rounded-full">
                            <Clock className="w-3 h-3" />
                            {new Date(item.timestamp).toLocaleDateString()}
                        </div>
                    </div>
                    <p className="text-sm text-gray-300 leading-relaxed relative z-10">{item.body}</p>
                </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // MAIN VIEW (Menu + Chats)
  return (
    <div className="h-full bg-black text-white flex flex-col font-sans">
      <div className="p-5 pb-2">
        <h1 className="text-2xl font-black mb-6 tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">{t('messages')}</h1>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div onClick={() => setSubView('official')} className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-3xl p-5 cursor-pointer hover:scale-[1.02] transition shadow-lg relative overflow-hidden group">
             <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400 mb-4 border border-blue-500/30 relative">
                <Megaphone className="w-6 h-6" />
                {unreadOfficial > 0 && (
                    <div className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border border-gray-800 animate-pulse">
                        {unreadOfficial}
                    </div>
                )}
             </div>
             <h3 className="font-bold text-base text-white">{t('official')}</h3>
             <div className="flex items-center justify-between mt-2">
                 <p className="text-[10px] text-gray-400 line-clamp-1">{t('officialDesc')}</p>
                 <ChevronRight className="w-4 h-4 text-gray-600 rtl:rotate-180" />
             </div>
          </div>

          <div onClick={() => setSubView('system')} className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-3xl p-5 cursor-pointer hover:scale-[1.02] transition shadow-lg relative overflow-hidden group">
             <div className="w-12 h-12 rounded-2xl bg-orange-500/20 flex items-center justify-center text-orange-400 mb-4 border border-orange-500/30 relative">
                <ShieldCheck className="w-6 h-6" />
                {unreadSystem > 0 && (
                    <div className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border border-gray-800 animate-pulse">
                        {unreadSystem}
                    </div>
                )}
             </div>
             <h3 className="font-bold text-base text-white">{t('system')}</h3>
             <div className="flex items-center justify-between mt-2">
                 <p className="text-[10px] text-gray-400 line-clamp-1">{t('systemDesc')}</p>
                 <ChevronRight className="w-4 h-4 text-gray-600 rtl:rotate-180" />
             </div>
          </div>
        </div>

        {/* Requests Banner */}
        <div onClick={() => setSubView('requests')} className="bg-gray-800 border border-gray-700 rounded-2xl p-4 flex items-center justify-between cursor-pointer hover:bg-gray-700 transition mb-4">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg text-green-500 relative">
                    <UserPlus className="w-5 h-5"/>
                    {unreadRequests > 0 && (
                        <div className="absolute -top-1 -right-1 bg-red-600 text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full border border-gray-800">
                            {unreadRequests}
                        </div>
                    )}
                </div>
                <div>
                    <h3 className="font-bold text-sm">{t('requests')}</h3>
                    <p className="text-[10px] text-gray-400">{t('requestsDesc')}</p>
                </div>
            </div>
            {unreadRequests > 0 && (
                <div className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">{unreadRequests} New</div>
            )}
            <ChevronRight className="w-5 h-5 text-gray-500 rtl:rotate-180" />
        </div>
      </div>

      <div className="flex-1 bg-gray-900 rounded-t-[2.5rem] border-t border-gray-800 overflow-hidden flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.5)] relative z-10">
          <div className="p-6 pb-2">
              <h2 className="font-bold text-sm text-gray-500 uppercase tracking-widest pl-2 border-l-2 border-brand-500">{t('chats')}</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 pb-20">
              {chats.length === 0 ? (
                  <div className="flex flex-col items-center justify-center text-center opacity-60 mt-10">
                      <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mb-4 border-2 border-dashed border-gray-700">
                          <Inbox className="w-10 h-10 text-gray-600" />
                      </div>
                      <h3 className="text-gray-300 font-bold mb-1">{t('noChats')}</h3>
                  </div>
              ) : (
                  <div className="space-y-2">
                      {chats.map(chat => (
                          <div 
                              key={chat.chatId} 
                              onClick={() => onOpenChat && onOpenChat(chat)}
                              className="bg-gray-800/50 hover:bg-gray-800 p-3 rounded-2xl flex items-center gap-3 cursor-pointer transition border border-transparent hover:border-gray-700"
                          >
                              <div className="relative">
                                  <img src={chat.otherUserAvatar} className="w-12 h-12 rounded-full object-cover" />
                                  {chat.unreadCount > 0 && (
                                      <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-gray-900">
                                          {chat.unreadCount}
                                      </div>
                                  )}
                              </div>
                              <div className="flex-1 min-w-0">
                                  <div className="flex justify-between items-center mb-0.5">
                                      <h3 className="font-bold text-white text-sm">{chat.otherUserName}</h3>
                                      <span className="text-[10px] text-gray-500">
                                          {new Date(chat.lastMessageTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                      </span>
                                  </div>
                                  <p className={`text-xs truncate ${chat.unreadCount > 0 ? 'text-brand-300 font-bold' : 'text-gray-400'}`}>
                                      {chat.lastMessage}
                                  </p>
                              </div>
                          </div>
                      ))}
                  </div>
              )}
          </div>
      </div>
    </div>
  );
};

export default MessagesView;