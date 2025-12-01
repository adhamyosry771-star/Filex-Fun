
import { 
    signInWithPopup, 
    GoogleAuthProvider, 
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut, 
    User as FirebaseUser
  } from "firebase/auth";
  import { 
    doc, 
    setDoc, 
    getDoc, 
    updateDoc,
    serverTimestamp,
    onSnapshot,
    collection,
    query,
    orderBy,
    Unsubscribe,
    getDocs,
    deleteDoc,
    runTransaction,
    addDoc,
    where,
    limit,
    writeBatch,
    increment,
    arrayUnion,
    arrayRemove
  } from "firebase/firestore";
  import { auth, db } from "../firebaseConfig";
  import { User, Room, ChatMessage, RoomSeat, Notification, FriendRequest, PrivateChatSummary, PrivateMessage, Banner, Contributor } from "../types";
  
  const googleProvider = new GoogleAuthProvider();
  const ADMIN_EMAIL = "admin@flex.com";

  // --- ERROR HANDLER (SANITIZED) ---
  const handleAuthError = (error: any) => {
    const errorCode = error?.code || 'unknown';
    const errorMessage = error?.message || 'Unknown error';

    if (errorCode === 'auth/unauthorized-domain') {
        alert(`⚠️ Domain Unauthorized.\n\nPlease go to Firebase Console > Authentication > Settings > Authorized Domains.`);
    } else if (errorCode === 'auth/configuration-not-found' || errorCode === 'auth/operation-not-allowed') {
        alert("⚠️ Configuration Error: Enable this provider in Firebase Console > Authentication.");
    } else if (errorCode === 'auth/email-already-in-use') {
        alert("⚠️ Email already in use. Please login instead.");
    } else if (errorCode === 'auth/weak-password') {
        alert("⚠️ Password is too weak. Please use at least 6 characters.");
    } else if (errorCode === 'auth/invalid-credential' || errorCode === 'auth/user-not-found' || errorCode === 'auth/wrong-password') {
        alert("⚠️ Invalid email or password.");
    } else {
        alert(`⚠️ Authentication Error: ${errorMessage}`);
    }
  };

  // --- HELPER: Ensure Official Room Exists ---
  const ensureOfficialRoom = async (user: User) => {
      if (user.id !== 'OFFECAL') return;
      
      const roomId = user.uid!;
      const roomRef = doc(db, "rooms", roomId);
      const roomDoc = await getDoc(roomRef);
      
      if (!roomDoc.exists()) {
          console.log("Creating Official Customer Service Room...");
          await createRoom(
              "خدمة العملاء الرسمية",
              "https://images.unsplash.com/photo-1556745753-b2904692b3cd?q=80&w=800&auto=format&fit=crop",
              user,
              user.uid!
          );
          // Force update to be official
          await updateDoc(roomRef, { 
              isOfficial: true, 
              isHot: true, 
              tags: ['Official', 'Support', 'Help']
          });
      }
  };

  // --- AUTHENTICATION ---

  export const loginWithGoogle = async (): Promise<FirebaseUser | null> => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    } catch (error: any) {
      console.error("Error signing in with Google:", error.code || "Unknown");
      handleAuthError(error);
      throw new Error(error.message || "Login failed");
    }
  };

  export const registerWithEmail = async (email: string, pass: string): Promise<FirebaseUser> => {
    try {
        const result = await createUserWithEmailAndPassword(auth, email, pass);
        return result.user;
    } catch (error: any) {
        handleAuthError(error);
        throw new Error(error.message || "Registration failed");
    }
  };

  export const loginWithEmail = async (email: string, pass: string): Promise<FirebaseUser> => {
    try {
        const result = await signInWithEmailAndPassword(auth, email, pass);
        
        if (email === ADMIN_EMAIL) {
             const userRef = doc(db, "users", result.user.uid);
             // Ensure Admin Data
             const adminData = {
                 id: "OFFECAL", 
                 name: "FILEX OFFECAL", 
                 isAdmin: true,
                 vip: true,
                 vipLevel: 8,
                 adminRole: 'super_admin',
                 wallet: { diamonds: 999999999, coins: 999999999 }
             };
             await setDoc(userRef, adminData, { merge: true });
             
             // Check/Create Room
             const fullUser = { uid: result.user.uid, ...adminData } as User;
             await ensureOfficialRoom(fullUser);
        }

        return result.user;
    } catch (error: any) {
        handleAuthError(error);
        throw new Error(error.message || "Login failed");
    }
  };

  export const logoutUser = async () => {
    try {
      await signOut(auth);
    } catch (error: any) {
      console.error("Error signing out:", error.message || "Unknown");
    }
  };

  // --- USER PROFILES ---

  export const getUserProfile = async (uid: string): Promise<User | null> => {
    try {
      const docRef = doc(db, "users", uid);
      const docSnap = await getDoc(docRef);
  
      if (docSnap.exists()) {
        return { uid: docSnap.id, ...docSnap.data() } as User;
      } else {
        return null;
      }
    } catch (error) {
      console.error("Error getting user profile");
      return null;
    }
  };

  export const listenToUserProfile = (uid: string, callback: (user: User | null) => void): Unsubscribe => {
      const docRef = doc(db, "users", uid);
      return onSnapshot(docRef, (docSnap) => {
          if (docSnap.exists()) {
              callback({ uid: docSnap.id, ...docSnap.data() } as User);
          } else {
              callback(null);
          }
      }, (error) => {
          // Silently handle permission errors or missing docs
      });
  };
  
  export const createUserProfile = async (
    uid: string, 
    data: { name: string; country: string; age: number; gender: 'male' | 'female'; avatar: string }
  ): Promise<User> => {
    const randomId = Math.floor(100000 + Math.random() * 900000).toString();
    const isSystemAdmin = auth.currentUser?.email === ADMIN_EMAIL;

    const newUser: User = {
      uid: uid,
      id: isSystemAdmin ? "OFFECAL" : randomId, 
      name: isSystemAdmin ? "FILEX OFFECAL" : data.name,
      avatar: isSystemAdmin ? "https://api.dicebear.com/7.x/bottts/svg?seed=Admin" : data.avatar,
      level: isSystemAdmin ? 100 : 1,
      vip: isSystemAdmin,
      vipLevel: isSystemAdmin ? 8 : 0,
      country: data.country,
      age: data.age,
      gender: data.gender,
      isAdmin: isSystemAdmin,
      adminRole: isSystemAdmin ? 'super_admin' : null,
      isBanned: false,
      wallet: isSystemAdmin ? { diamonds: 999999999, coins: 999999999 } : { diamonds: 0, coins: 0 },
      diamondsSpent: 0,
      diamondsReceived: 0
    };
  
    try {
        await setDoc(doc(db, "users", uid), {
            ...newUser,
            uid: uid,
            createdAt: serverTimestamp()
        });
        if (isSystemAdmin) {
            await ensureOfficialRoom(newUser);
        }
        return newUser;
    } catch (error: any) {
        console.error("Error creating profile:", error.message || "Unknown");
        return newUser;
    }
  };

  export const updateUserProfile = async (uid: string, data: Partial<User>): Promise<void> => {
      try {
          const docRef = doc(db, "users", uid);
          await updateDoc(docRef, data);
      } catch (error: any) {
          console.error("Error updating profile:", error.message || "Unknown");
          throw new Error(error.message || "Update failed");
      }
  };

  export const getAllUsers = async (): Promise<any[]> => {
    try {
        const querySnapshot = await getDocs(collection(db, "users"));
        const users: any[] = [];
        querySnapshot.forEach((doc) => {
            users.push({ uid: doc.id, ...doc.data() });
        });
        return users;
    } catch (e: any) {
        console.error("Error fetching all users:", e.message || "Unknown");
        return [];
    }
  };

  export const adminUpdateUser = async (uid: string, data: Partial<User>) => {
      try {
          const docRef = doc(db, "users", uid);
          await updateDoc(docRef, data);
      } catch (e: any) {
          console.error("Admin update failed:", e.message || "Unknown");
          throw new Error(e.message || "Admin update failed");
      }
  };

  export const adminBanRoom = async (roomId: string, isBanned: boolean) => {
      try {
          const roomRef = doc(db, "rooms", roomId);
          await updateDoc(roomRef, { isBanned });
      } catch (e: any) {
          console.error("Admin ban room failed:", e.message || "Unknown");
          throw new Error(e.message || "Ban room failed");
      }
  };

  export const toggleRoomHotStatus = async (roomId: string, isHot: boolean) => {
      try {
          const roomRef = doc(db, "rooms", roomId);
          await updateDoc(roomRef, { isHot });
      } catch (e: any) {
          console.error("Toggle hot room failed:", e.message || "Unknown");
      }
  };

  export const deleteRoom = async (roomId: string) => {
      try {
          // Delete messages subcollection first (best effort, client SDK is limited)
          const msgsQuery = query(collection(db, `rooms/${roomId}/messages`));
          const msgsSnap = await getDocs(msgsQuery);
          const batch = writeBatch(db);
          msgsSnap.forEach(doc => batch.delete(doc.ref));
          await batch.commit();

          await deleteDoc(doc(db, "rooms", roomId));
      } catch (e: any) {
          console.error("Delete room failed:", e.message || "Unknown");
          throw new Error(e.message || "Delete failed");
      }
  };

  export const deleteAllRooms = async () => {
      try {
          const snapshot = await getDocs(collection(db, "rooms"));
          const batch = writeBatch(db);
          snapshot.forEach(doc => {
              batch.delete(doc.ref);
          });
          await batch.commit();
      } catch (e: any) {
          console.error("Delete all rooms failed:", e.message || "Unknown");
          throw new Error(e.message || "Delete all failed");
      }
  };

  export const getRoomByHostId = async (hostUid: string): Promise<Room | null> => {
      try {
          const docRef = doc(db, "rooms", hostUid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
              return { id: docSnap.id, ...docSnap.data() } as Room;
          }
          return null;
      } catch (e) {
          return null;
      }
  };


  // --- SOCIAL SEARCH & REQUESTS ---

  export const searchUserByDisplayId = async (displayId: string): Promise<User | null> => {
      try {
          const q = query(collection(db, "users"), where("id", "==", displayId));
          const querySnapshot = await getDocs(q);
          if (querySnapshot.empty) return null;
          const doc = querySnapshot.docs[0];
          return { uid: doc.id, ...doc.data() } as User;
      } catch (e: any) {
          console.error("Search error", e.message || String(e));
          return null;
      }
  };

  export const sendFriendRequest = async (currentUid: string, targetUid: string, currentName: string, currentAvatar: string) => {
      try {
          await setDoc(doc(db, `users/${targetUid}/friendRequests`, currentUid), {
              uid: currentUid,
              name: currentName,
              avatar: currentAvatar,
              timestamp: Date.now()
          });
      } catch (e: any) {
          console.error("Send req error", e.message || String(e));
          throw new Error(e.message || "Send request failed");
      }
  };

  export const listenToFriendRequests = (uid: string, callback: (reqs: FriendRequest[]) => void): Unsubscribe => {
      const q = query(collection(db, `users/${uid}/friendRequests`), orderBy('timestamp', 'desc'));
      return onSnapshot(q, (snapshot) => {
          const reqs: FriendRequest[] = [];
          snapshot.forEach(doc => reqs.push(doc.data() as FriendRequest));
          callback(reqs);
      }, (error) => {
          // silent
      });
  };

  export const acceptFriendRequest = async (currentUid: string, targetUid: string) => {
      try {
          await runTransaction(db, async (transaction) => {
              const myRef = doc(db, "users", currentUid);
              const targetRef = doc(db, "users", targetUid);
              const myDoc = await transaction.get(myRef);
              const targetDoc = await transaction.get(targetRef);

              if (!myDoc.exists() || !targetDoc.exists()) return;
              
              const myData = myDoc.data();
              const targetData = targetDoc.data();

              // MUTUAL FOLLOW LOGIC
              const myFriends = (myData?.friendsCount || 0) + 1;
              const myFollowing = (myData?.followingCount || 0) + 1; 
              const myFollowers = (myData?.followersCount || 0) + 1;

              const targetFriends = (targetData?.friendsCount || 0) + 1;
              const targetFollowing = (targetData?.followingCount || 0) + 1;
              const targetFollowers = (targetData?.followersCount || 0) + 1;

              transaction.update(myRef, { 
                  friendsCount: myFriends, 
                  followingCount: myFollowing, 
                  followersCount: myFollowers 
              });
              transaction.update(targetRef, { 
                  friendsCount: targetFriends, 
                  followersCount: targetFollowers,
                  followingCount: targetFollowing
              });
              
              transaction.delete(doc(db, `users/${currentUid}/friendRequests`, targetUid));

              const chatId = [currentUid, targetUid].sort().join('_');
              const now = Date.now();

              const chatDataMe = {
                  chatId: chatId,
                  otherUserUid: targetUid,
                  otherUserName: targetData?.name,
                  otherUserAvatar: targetData?.avatar,
                  lastMessage: "You are now friends! Say Hi 👋",
                  lastMessageTime: now,
                  unreadCount: 0
              };
              
              const chatDataTarget = {
                  chatId: chatId,
                  otherUserUid: currentUid,
                  otherUserName: myData?.name,
                  otherUserAvatar: myData?.avatar,
                  lastMessage: "You are now friends! Say Hi 👋",
                  lastMessageTime: now,
                  unreadCount: 1 
              };

              transaction.set(doc(db, `users/${currentUid}/chats`, targetUid), chatDataMe);
              transaction.set(doc(db, `users/${targetUid}/chats`, currentUid), chatDataTarget);
          });
      } catch (e: any) {
          console.error("Accept error", e.message || String(e));
      }
  };

  export const rejectFriendRequest = async (currentUid: string, targetUid: string) => {
      try {
          await deleteDoc(doc(db, `users/${currentUid}/friendRequests`, targetUid));
      } catch (e: any) {
          console.error("Reject error", e.message || String(e));
      }
  };


  // --- PRIVATE CHAT ---
  
  export const initiatePrivateChat = async (currentUid: string, targetUid: string, targetUser: User): Promise<PrivateChatSummary | null> => {
      try {
          const chatId = [currentUid, targetUid].sort().join('_');
          
          const myChatRef = doc(db, `users/${currentUid}/chats`, targetUid);
          const myChatDoc = await getDoc(myChatRef);
          
          if (myChatDoc.exists()) {
              return myChatDoc.data() as PrivateChatSummary;
          } else {
              const newChat: PrivateChatSummary = {
                  chatId: chatId,
                  otherUserUid: targetUid,
                  otherUserName: targetUser.name,
                  otherUserAvatar: targetUser.avatar,
                  lastMessage: "",
                  lastMessageTime: Date.now(),
                  unreadCount: 0
              };
              
              await setDoc(myChatRef, newChat);
              const otherChatRef = doc(db, `users/${targetUid}/chats`, currentUid);
              const currentUserDoc = await getDoc(doc(db, "users", currentUid));
              const currentUserData = currentUserDoc.data() as User;
              
              await setDoc(otherChatRef, {
                  chatId: chatId,
                  otherUserUid: currentUid,
                  otherUserName: currentUserData.name,
                  otherUserAvatar: currentUserData.avatar,
                  lastMessage: "",
                  lastMessageTime: Date.now(),
                  unreadCount: 0
              });

              return newChat;
          }
      } catch (e: any) {
          console.error("Init chat error:", e.message || String(e));
          return null;
      }
  };

  export const sendPrivateMessage = async (senderUid: string, recipientUid: string, text: string) => {
      try {
          const chatId = [senderUid, recipientUid].sort().join('_');
          const timestamp = Date.now();
          const messageRef = doc(collection(db, `private_chats/${chatId}/messages`));
          
          await setDoc(messageRef, {
              id: messageRef.id,
              senderId: senderUid,
              text,
              timestamp,
              read: false
          });

          await updateDoc(doc(db, `users/${senderUid}/chats`, recipientUid), {
              lastMessage: text,
              lastMessageTime: timestamp
          });

          const recipientChatRef = doc(db, `users/${recipientUid}/chats`, senderUid);
          const recipientChatDoc = await getDoc(recipientChatRef);
          
          if (recipientChatDoc.exists()) {
              const currentUnread = recipientChatDoc.data().unreadCount || 0;
              await updateDoc(recipientChatRef, {
                  lastMessage: text,
                  lastMessageTime: timestamp,
                  unreadCount: currentUnread + 1
              });
          }
      } catch (e: any) {
          console.error("Private msg error:", e.message || String(e));
      }
  };

  export const markChatAsRead = async (myUid: string, otherUid: string) => {
      try {
          await updateDoc(doc(db, `users/${myUid}/chats`, otherUid), {
              unreadCount: 0
          });
      } catch (e) {
          // ignore
      }
  };

  export const listenToChatList = (uid: string, callback: (chats: PrivateChatSummary[]) => void): Unsubscribe => {
      const q = query(collection(db, `users/${uid}/chats`));
      return onSnapshot(q, (snapshot) => {
          const chats: PrivateChatSummary[] = [];
          snapshot.forEach(doc => chats.push(doc.data() as PrivateChatSummary));
          chats.sort((a, b) => b.lastMessageTime - a.lastMessageTime);
          callback(chats);
      });
  };

  export const listenToPrivateMessages = (chatId: string, callback: (msgs: PrivateMessage[]) => void): Unsubscribe => {
      const q = query(collection(db, `private_chats/${chatId}/messages`), orderBy('timestamp', 'asc'));
      return onSnapshot(q, (snapshot) => {
          const msgs: PrivateMessage[] = [];
          snapshot.forEach(doc => msgs.push(doc.data() as PrivateMessage));
          callback(msgs);
      });
  };

  // --- NOTIFICATIONS ---

  export const sendSystemNotification = async (uid: string, title: string, body: string) => {
      try {
          await addDoc(collection(db, `users/${uid}/notifications`), {
              type: 'system',
              title,
              body,
              timestamp: Date.now(),
              read: false
          });
      } catch (e: any) {
          console.error("Failed to send notification:", e.message || "Unknown");
      }
  };

  export const broadcastOfficialMessage = async (title: string, body: string) => {
      try {
          await addDoc(collection(db, "official_messages"), {
              type: 'official',
              title,
              body,
              timestamp: Date.now()
          });
      } catch (e: any) {
          console.error("Broadcast failed:", e.message || "Unknown");
      }
  };
  
  export const listenToNotifications = (uid: string, type: 'system' | 'official', callback: (msgs: Notification[]) => void): Unsubscribe => {
    let q;
    if (type === 'system') {
        q = query(collection(db, `users/${uid}/notifications`), orderBy('timestamp', 'desc'));
    } else {
        q = query(collection(db, "official_messages"), orderBy('timestamp', 'desc'));
    }

    return onSnapshot(q, (snapshot) => {
        const msgs: Notification[] = [];
        snapshot.forEach(doc => {
            msgs.push({ id: doc.id, ...doc.data() } as Notification);
        });
        callback(msgs);
    }, (e) => {
        // Fallback if index missing
        let fallbackQ;
        if (type === 'system') {
             fallbackQ = query(collection(db, `users/${uid}/notifications`));
        } else {
             fallbackQ = query(collection(db, "official_messages"));
        }
        onSnapshot(fallbackQ, (snap) => {
             const msgs: Notification[] = [];
             snap.forEach(doc => msgs.push({ id: doc.id, ...doc.data() } as Notification));
             msgs.sort((a,b) => b.timestamp - a.timestamp);
             callback(msgs);
        });
    });
  };


  // --- ROOMS (REAL-TIME) ---

  export const createRoom = async (title: string, cover: string, user: User, userId: string): Promise<void> => {
      try {
          const roomId = userId; 
          
          if (!roomId) throw new Error("Invalid User ID");

          const roomRef = doc(db, "rooms", roomId);
          const roomSnap = await getDoc(roomRef);
          
          if (roomSnap.exists()) {
              throw new Error("لديك غرفة بالفعل! لا يمكنك إنشاء أكثر من غرفة واحدة.");
          }

          const displayId = user.id; 
          const hostName = user.name;
          const hostAvatar = user.avatar;

          const seats: RoomSeat[] = Array(11).fill(null).map((_, i) => ({
              index: i,
              userId: i === 0 ? user.id : null,
              userName: i === 0 ? hostName : null,
              userAvatar: i === 0 ? (hostAvatar || '') : null, 
              isMuted: false,
              isLocked: false,
              giftCount: 0,
              adminRole: i === 0 ? (user.adminRole || null) : null
          }));

          const newRoom: Room = {
              id: roomId,
              displayId: displayId, 
              title: title,
              description: "Welcome to my room! Respect everyone and have fun. 🎵",
              hostName: hostName,
              hostAvatar: hostAvatar || '',
              hostId: user.id,
              viewerCount: 1,
              thumbnail: cover,
              backgroundImage: cover, // Initialize background with cover
              tags: ['Live', 'Chat'],
              isAiHost: false,
              seats: seats,
              isBanned: false,
              isHot: false,
              contributors: {},
              bannedUsers: [],
              admins: []
          };

          await setDoc(doc(db, "rooms", roomId), newRoom);
      } catch (error: any) {
          console.error("Error creating room:", error.message || "Unknown");
          throw new Error(error.message || "Create room failed");
      }
  };

  export const listenToRooms = (callback: (rooms: Room[]) => void): Unsubscribe => {
    const q = query(collection(db, "rooms"), limit(200)); 
    
    return onSnapshot(q, (snapshot) => {
      const rooms: Room[] = [];
      snapshot.forEach((doc) => {
        rooms.push({ id: doc.id, ...doc.data() } as Room);
      });
      rooms.sort((a, b) => {
          if (a.isHot && !b.isHot) return -1;
          if (!a.isHot && b.isHot) return 1;
          return b.viewerCount - a.viewerCount;
      });
      callback(rooms);
    });
  };

  export const listenToRoom = (roomId: string, callback: (room: Room | null) => void): Unsubscribe => {
      const roomRef = doc(db, "rooms", roomId);
      return onSnapshot(roomRef, (docSnap) => {
          if (docSnap.exists()) {
              callback({ id: docSnap.id, ...docSnap.data() } as Room);
          } else {
              callback(null);
          }
      }, (error) => {
          console.error("Listen to room error:", error);
      });
  };

  export const incrementViewerCount = async (roomId: string) => {
      try {
          const roomRef = doc(db, "rooms", roomId);
          await updateDoc(roomRef, {
              viewerCount: increment(1)
          });
      } catch (e) {
          console.error("Error incrementing viewer count", e);
      }
  };

  export const decrementViewerCount = async (roomId: string) => {
      try {
          const roomRef = doc(db, "rooms", roomId);
          await updateDoc(roomRef, {
              viewerCount: increment(-1)
          });
      } catch (e) {
          console.error("Error decrementing viewer count", e);
      }
  };

  export const updateRoomDetails = async (roomId: string, updates: Partial<Room>) => {
      try {
          const roomRef = doc(db, "rooms", roomId);
          await updateDoc(roomRef, updates);
      } catch (e: any) {
          console.error("Update room error:", e.message || "Unknown");
      }
  };

  // --- ROOM MANAGEMENT (KICK / BAN / ADMINS) ---

  export const kickUserFromSeat = async (roomId: string, seatIndex: number) => {
      const roomRef = doc(db, "rooms", roomId);
      await runTransaction(db, async (transaction) => {
          const roomDoc = await transaction.get(roomRef);
          if (!roomDoc.exists()) return;
          const roomData = roomDoc.data() as Room;
          const seats = roomData.seats;
          
          if (seats[seatIndex]) {
              seats[seatIndex] = {
                  ...seats[seatIndex],
                  userId: null,
                  userName: null,
                  userAvatar: null,
                  giftCount: 0,
                  adminRole: null,
                  isMuted: false
              };
              transaction.update(roomRef, { seats });
          }
      });
  };

  export const banUserFromRoom = async (roomId: string, userId: string) => {
      try {
          const roomRef = doc(db, "rooms", roomId);
          // 1. Add to ban list
          await updateDoc(roomRef, {
              bannedUsers: arrayUnion(userId)
          });
      } catch (e: any) {
          console.error("Ban user failed", e);
      }
  };

  export const unbanUserFromRoom = async (roomId: string, userId: string) => {
      try {
          const roomRef = doc(db, "rooms", roomId);
          await updateDoc(roomRef, {
              bannedUsers: arrayRemove(userId)
          });
      } catch (e: any) {
          console.error("Unban user failed", e);
      }
  };

  export const addRoomAdmin = async (roomId: string, userId: string) => {
      try {
          const roomRef = doc(db, "rooms", roomId);
          await updateDoc(roomRef, {
              admins: arrayUnion(userId)
          });
      } catch (e: any) {
          console.error("Add room admin failed", e);
      }
  };

  export const removeRoomAdmin = async (roomId: string, userId: string) => {
      try {
          const roomRef = doc(db, "rooms", roomId);
          await updateDoc(roomRef, {
              admins: arrayRemove(userId)
          });
      } catch (e: any) {
          console.error("Remove room admin failed", e);
      }
  };

  // --- BANNERS ---

  export const addBanner = async (imageUrl: string, title: string) => {
      try {
          await addDoc(collection(db, "banners"), {
              imageUrl,
              title,
              timestamp: Date.now()
          });
      } catch (e: any) {
          console.error("Add banner failed", e);
          throw e;
      }
  };

  export const deleteBanner = async (id: string) => {
      try {
          await deleteDoc(doc(db, "banners", id));
      } catch (e: any) {
          console.error("Delete banner failed", e);
          throw e;
      }
  };

  export const listenToBanners = (callback: (banners: Banner[]) => void): Unsubscribe => {
      const q = query(collection(db, "banners"), orderBy("timestamp", "desc"));
      return onSnapshot(q, (snapshot) => {
          const banners: Banner[] = [];
          snapshot.forEach(doc => banners.push({ id: doc.id, ...doc.data() } as Banner));
          callback(banners);
      });
  };

  // --- AGENCY TRANSFERS ---

  export const transferAgencyDiamonds = async (agencyUid: string, targetDisplayId: string, amount: number) => {
      const targetUser = await searchUserByDisplayId(targetDisplayId);
      if (!targetUser || !targetUser.uid) {
          throw new Error("Target user not found");
      }
      const targetUid = targetUser.uid;

      try {
          await runTransaction(db, async (transaction) => {
              const agencyRef = doc(db, "users", agencyUid);
              const targetRef = doc(db, "users", targetUid);

              const agencyDoc = await transaction.get(agencyRef);
              const targetDoc = await transaction.get(targetRef);

              if (!agencyDoc.exists()) throw new Error("Agency user not found");
              if (!targetDoc.exists()) throw new Error("Target user not found");

              const agencyData = agencyDoc.data() as User;
              const targetData = targetDoc.data() as User;

              const currentBalance = agencyData.agencyBalance || 0;
              if (currentBalance < amount) {
                  throw new Error("Insufficient agency balance");
              }

              // Deduct from Agency
              transaction.update(agencyRef, {
                  agencyBalance: currentBalance - amount
              });

              // Add to Target
              const currentTargetDiamonds = targetData.wallet?.diamonds || 0;
              transaction.update(targetRef, {
                  wallet: {
                      ...targetData.wallet,
                      diamonds: currentTargetDiamonds + amount,
                      coins: targetData.wallet?.coins || 0
                  }
              });
              
              const notificationRef = doc(collection(db, `users/${targetUid}/notifications`));
              transaction.set(notificationRef, {
                  type: 'system',
                  title: 'شحن وكالة',
                  body: `تم شحن ${amount} ماسة إلى حسابك من قبل الوكيل ${agencyData.name}`,
                  timestamp: Date.now(),
                  read: false
              });
          });
      } catch (e: any) {
          console.error("Transfer failed", e);
          throw e;
      }
  };

  // --- ROOM CHAT ---

  export const sendMessage = async (roomId: string, message: ChatMessage) => {
      try {
          await setDoc(doc(db, `rooms/${roomId}/messages`, message.id), message);
      } catch (e) {
          console.error("Send message error", e);
          throw e;
      }
  };

  export const listenToMessages = (roomId: string, callback: (msgs: ChatMessage[]) => void): Unsubscribe => {
      const q = query(collection(db, `rooms/${roomId}/messages`), orderBy('timestamp', 'asc'), limit(50));
      return onSnapshot(q, (snapshot) => {
          const msgs: ChatMessage[] = [];
          snapshot.forEach(doc => msgs.push(doc.data() as ChatMessage));
          callback(msgs);
      });
  };

  // --- ROOM INTERACTION (Seats, Gifts) ---

  export const takeSeat = async (roomId: string, seatIndex: number, user: User) => {
      const roomRef = doc(db, "rooms", roomId);
      
      await runTransaction(db, async (transaction) => {
          const roomDoc = await transaction.get(roomRef);
          if (!roomDoc.exists()) throw new Error("Room not found");
          
          const roomData = roomDoc.data() as Room;
          const seats = roomData.seats || [];
          
          if (seats[seatIndex].userId) throw new Error("Seat already taken");
          if (seats[seatIndex].isLocked) throw new Error("Seat is locked");
          
          const existingSeatIndex = seats.findIndex(s => s.userId === user.id); 
          
          if (existingSeatIndex !== -1) {
               seats[existingSeatIndex].userId = null;
               seats[existingSeatIndex].userName = null;
               seats[existingSeatIndex].userAvatar = null;
               seats[existingSeatIndex].giftCount = 0;
               seats[existingSeatIndex].adminRole = null;
               seats[existingSeatIndex].isMuted = false; 
          }

          seats[seatIndex].userId = user.id;
          seats[seatIndex].userName = user.name;
          seats[seatIndex].userAvatar = user.avatar;
          seats[seatIndex].adminRole = user.adminRole;
          seats[seatIndex].isMuted = false; 

          transaction.update(roomRef, { seats });
      });
  };

  export const leaveSeat = async (roomId: string, user: User) => {
      const roomRef = doc(db, "rooms", roomId);
      await runTransaction(db, async (transaction) => {
          const roomDoc = await transaction.get(roomRef);
          if (!roomDoc.exists()) return;
          
          const roomData = roomDoc.data() as Room;
          const seats = roomData.seats || [];
          const seatIndex = seats.findIndex(s => s.userId === user.id);
          
          if (seatIndex !== -1) {
              seats[seatIndex].userId = null;
              seats[seatIndex].userName = null;
              seats[seatIndex].userAvatar = null;
              seats[seatIndex].giftCount = 0;
              seats[seatIndex].adminRole = null;
              seats[seatIndex].isMuted = false;
              
              transaction.update(roomRef, { seats });
          }
      });
  };

  export const toggleSeatLock = async (roomId: string, seatIndex: number, isLocked: boolean) => {
      const roomRef = doc(db, "rooms", roomId);
      await runTransaction(db, async (transaction) => {
          const roomDoc = await transaction.get(roomRef);
          if (!roomDoc.exists()) return;
          const roomData = roomDoc.data() as Room;
          const seats = roomData.seats || [];
          
          if (seats[seatIndex]) {
              seats[seatIndex].isLocked = isLocked;
              transaction.update(roomRef, { seats });
          }
      });
  };

  export const toggleSeatMute = async (roomId: string, seatIndex: number, isMuted: boolean) => {
       const roomRef = doc(db, "rooms", roomId);
      await runTransaction(db, async (transaction) => {
          const roomDoc = await transaction.get(roomRef);
          if (!roomDoc.exists()) return;
          const roomData = roomDoc.data() as Room;
          const seats = roomData.seats || [];
          
          if (seats[seatIndex]) {
              seats[seatIndex].isMuted = isMuted;
              transaction.update(roomRef, { seats });
          }
      });
  };

  export const sendGiftTransaction = async (roomId: string, senderUid: string, targetSeatIndex: number, cost: number) => {
       await runTransaction(db, async (transaction) => {
          const roomRef = doc(db, "rooms", roomId);
          const senderRef = doc(db, "users", senderUid);
          
          const roomDoc = await transaction.get(roomRef);
          const senderDoc = await transaction.get(senderRef);
          
          if (!roomDoc.exists()) throw new Error("Room not found");
          if (!senderDoc.exists()) throw new Error("Sender not found");
          
          const senderData = senderDoc.data() as User;
          const roomData = roomDoc.data() as Room;
          
          const wallet = senderData.wallet || { diamonds: 0, coins: 0 };
          if (wallet.diamonds < cost) throw new Error("Insufficient funds");
          
          const newBalance = wallet.diamonds - cost;
          const newSpent = (senderData.diamondsSpent || 0) + cost;
          transaction.update(senderRef, {
              wallet: { ...wallet, diamonds: newBalance },
              diamondsSpent: newSpent
          });
          
          const seats = roomData.seats || [];
          const targetSeat = seats.find(s => s.index === targetSeatIndex);
          
          const contributors = roomData.contributors || {};
          if (!contributors[senderUid]) {
              contributors[senderUid] = { userId: senderUid, name: senderData.name, avatar: senderData.avatar, amount: 0 };
          }
          contributors[senderUid].amount += cost;

          if (targetSeat) {
              targetSeat.giftCount += cost;
          }

          transaction.update(roomRef, { contributors, seats });
       });
  };
