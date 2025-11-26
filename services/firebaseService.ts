
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
    increment
  } from "firebase/firestore";
  import { auth, db } from "../firebaseConfig";
  import { User, Room, ChatMessage, RoomSeat, Notification, FriendRequest, PrivateChatSummary, PrivateMessage, Banner } from "../types";
  
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
              tags: ['Live', 'Chat'],
              isAiHost: false,
              seats: seats,
              isBanned: false,
              isHot: false
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

  export const listenToMessages = (roomId: string, callback: (messages: ChatMessage[]) => void): Unsubscribe => {
    const q = query(collection(db, "rooms", roomId, "messages"), orderBy("timestamp", "asc"));
    return onSnapshot(q, (snapshot) => {
      const messages: ChatMessage[] = [];
      snapshot.forEach((doc) => {
        messages.push({ id: doc.id, ...doc.data() } as ChatMessage);
      });
      callback(messages);
    });
  };

  export const sendMessage = async (roomId: string, message: ChatMessage) => {
      try {
          await addDoc(collection(db, "rooms", roomId, "messages"), message);
      } catch (error: any) {
          console.error("Error sending message:", error.message || "Unknown");
          throw new Error(error.message || "Send message failed");
      }
  };

  // --- SEAT MANAGEMENT ---

  export const takeSeat = async (roomId: string, seatIndex: number, user: User) => {
      try {
        const roomRef = doc(db, "rooms", roomId);
        await runTransaction(db, async (transaction) => {
            const roomDoc = await transaction.get(roomRef);
            if (!roomDoc.exists()) throw new Error("Room does not exist");
            
            const roomData = roomDoc.data() as Room;
            const seats = roomData.seats || [];
            
            const existingSeat = seats.find(s => s.userId === user.id);
            if (existingSeat) {
                seats[existingSeat.index] = {
                    ...seats[existingSeat.index],
                    userId: null,
                    userName: null,
                    userAvatar: null,
                    isMuted: false,
                    adminRole: null
                };
            }

            const targetSeat = seats.find(s => s.index === seatIndex);
            if (!targetSeat) throw new Error("Seat not found");
            if (targetSeat.userId) throw new Error("Seat occupied");
            if (targetSeat.isLocked) throw new Error("Seat is locked");

            seats[seatIndex] = {
                ...targetSeat,
                userId: user.id,
                userName: user.name,
                userAvatar: user.avatar,
                isMuted: false,
                adminRole: user.adminRole || null
            };

            transaction.update(roomRef, { seats });
        });
      } catch (e: any) {
          const msg = e.message || "Unknown error";
          console.error("Take seat error:", msg);
          throw new Error(msg);
      }
  };

  export const leaveSeat = async (roomId: string, user: User) => {
      try {
        const roomRef = doc(db, "rooms", roomId);
        await runTransaction(db, async (transaction) => {
            const roomDoc = await transaction.get(roomRef);
            if (!roomDoc.exists()) return;
            
            const roomData = roomDoc.data() as Room;
            const seats = roomData.seats || [];
            
            const targetSeat = seats.find(s => s.userId === user.id);
            if (!targetSeat) return;

            seats[targetSeat.index] = {
                ...targetSeat,
                userId: null,
                userName: null,
                userAvatar: null,
                isMuted: false,
                adminRole: null
            };

            transaction.update(roomRef, { seats });
        });
      } catch (e: any) {
          console.error("Leave seat error:", e.message || "Unknown");
      }
  };

  export const toggleSeatLock = async (roomId: string, seatIndex: number, isLocked: boolean) => {
      try {
        const roomRef = doc(db, "rooms", roomId);
        const roomDoc = await getDoc(roomRef);
        if (!roomDoc.exists()) return;

        const seats = (roomDoc.data() as Room).seats;
        seats[seatIndex].isLocked = isLocked;
        
        await updateDoc(roomRef, { seats });
      } catch (e: any) {
          console.error("Lock seat error:", e.message || "Unknown");
      }
  };

  export const toggleSeatMute = async (roomId: string, seatIndex: number, isMuted: boolean) => {
      try {
        const roomRef = doc(db, "rooms", roomId);
        const roomDoc = await getDoc(roomRef);
        if (!roomDoc.exists()) return;

        const seats = (roomDoc.data() as Room).seats;
        seats[seatIndex].isMuted = isMuted;
        
        await updateDoc(roomRef, { seats });
      } catch (e: any) {
          console.error("Mute seat error:", e.message || "Unknown");
      }
  };

  // --- TRANSACTIONS ---

  export const sendGiftTransaction = async (roomId: string, senderUid: string, targetSeatIndex: number, cost: number) => {
      try {
          await runTransaction(db, async (transaction) => {
              const roomRef = doc(db, "rooms", roomId);
              const roomDoc = await transaction.get(roomRef);
              if (!roomDoc.exists()) throw new Error("Room does not exist");
              
              const roomData = roomDoc.data() as Room;
              const seats = roomData.seats || [];
              const targetSeat = seats.find(s => s.index === targetSeatIndex);
              
              if (!targetSeat) throw new Error("Target seat not found");

              const userRef = doc(db, "users", senderUid);
              const userDoc = await transaction.get(userRef);
              if (!userDoc.exists()) throw new Error("User not found");
              
              const userData = userDoc.data() as User;
              const currentDiamonds = userData.wallet?.diamonds || 0;
              const currentSpent = userData.diamondsSpent || 0;

              if (currentDiamonds < cost) {
                  throw new Error("Insufficient funds");
              }

              transaction.update(userRef, {
                  "wallet.diamonds": currentDiamonds - cost,
                  "diamondsSpent": currentSpent + cost
              });

              const updatedSeats = [...seats];
              updatedSeats[targetSeatIndex] = {
                  ...targetSeat,
                  giftCount: (targetSeat.giftCount || 0) + 1
              };

              transaction.update(roomRef, { seats: updatedSeats });
          });
      } catch (error: any) {
          console.error("Gift transaction failed:", error.message || "Unknown");
          throw new Error(error.message || "Gift failed");
      }
  };

  // --- BANNERS / SLIDER ---

  export const addBanner = async (imageUrl: string, title?: string) => {
      try {
          await addDoc(collection(db, "banners"), {
              imageUrl,
              title: title || '',
              timestamp: Date.now()
          });
      } catch (e: any) {
          console.error("Add banner failed:", e.message || "Unknown");
          throw new Error("Add banner failed");
      }
  };

  export const deleteBanner = async (bannerId: string) => {
      try {
          await deleteDoc(doc(db, "banners", bannerId));
      } catch (e: any) {
          console.error("Delete banner failed:", e.message || "Unknown");
          throw new Error("Delete banner failed");
      }
  };

  export const listenToBanners = (callback: (banners: Banner[]) => void): Unsubscribe => {
      const q = query(collection(db, "banners"), orderBy("timestamp", "desc"));
      return onSnapshot(q, (snapshot) => {
          const banners: Banner[] = [];
          snapshot.forEach(doc => {
              banners.push({ id: doc.id, ...doc.data() } as Banner);
          });
          callback(banners);
      }, (e) => {
          console.log("Banner fetch fallback");
          const q2 = query(collection(db, "banners"));
          onSnapshot(q2, (snap) => {
              const b: Banner[] = [];
              snap.forEach(d => b.push({id: d.id, ...d.data()} as Banner));
              callback(b);
          });
      });
  };

  // --- AGENCY SYSTEM ---

  export const transferAgencyDiamonds = async (agentUid: string, targetDisplayId: string, amount: number) => {
      try {
          // Find Target User by Display ID
          const usersRef = collection(db, "users");
          const q = query(usersRef, where("id", "==", targetDisplayId));
          const querySnapshot = await getDocs(q);
          
          if (querySnapshot.empty) {
              throw new Error("User not found");
          }
          const targetUserDoc = querySnapshot.docs[0];
          const targetUid = targetUserDoc.id;

          await runTransaction(db, async (transaction) => {
              // Get Agent
              const agentRef = doc(db, "users", agentUid);
              const agentDoc = await transaction.get(agentRef);
              if (!agentDoc.exists()) throw new Error("Agent not found");
              
              const agentData = agentDoc.data() as User;
              if (!agentData.isAgent) throw new Error("User is not an agent");
              
              const currentBalance = agentData.agencyBalance || 0;
              if (currentBalance < amount) throw new Error("Insufficient agency balance");

              // Get Target
              const targetRef = doc(db, "users", targetUid);
              const targetDoc = await transaction.get(targetRef);
              if (!targetDoc.exists()) throw new Error("Target user error");
              const targetData = targetDoc.data() as User;

              // Update Agent
              transaction.update(agentRef, {
                  agencyBalance: currentBalance - amount
              });

              // Update Target
              const currentDiamonds = targetData.wallet?.diamonds || 0;
              transaction.update(targetRef, {
                  "wallet.diamonds": currentDiamonds + amount
              });
              
              // Log transaction (Optional: create collection 'agency_logs')
              const logRef = doc(collection(db, "agency_logs"));
              transaction.set(logRef, {
                  agentId: agentData.id,
                  targetId: targetData.id,
                  amount: amount,
                  timestamp: Date.now()
              });
          });
      } catch (e: any) {
          console.error("Agency Transfer Error:", e.message || "Unknown");
          throw new Error(e.message || "Transfer failed");
      }
  };
