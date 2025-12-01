
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  setDoc, 
  addDoc, 
  onSnapshot, 
  orderBy, 
  limit, 
  increment, 
  arrayUnion, 
  arrayRemove,
  Unsubscribe,
  writeBatch
} from 'firebase/firestore';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut
} from 'firebase/auth';
import { db, auth } from '../firebaseConfig';
import { 
  User, 
  Room, 
  ChatMessage, 
  Banner, 
  Notification, 
  FriendRequest, 
  PrivateMessage, 
  PrivateChatSummary,
  StoreItem
} from '../types';

// --- Auth ---
export const loginWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  return result.user;
};

export const loginWithEmail = async (email: string, pass: string) => {
  return await signInWithEmailAndPassword(auth, email, pass);
};

export const registerWithEmail = async (email: string, pass: string) => {
  return await createUserWithEmailAndPassword(auth, email, pass);
};

export const logoutUser = async () => {
  return await signOut(auth);
};

// --- User Profile ---
export const getUserProfile = async (uid: string): Promise<User | null> => {
  const docRef = doc(db, 'users', uid);
  const snap = await getDoc(docRef);
  return snap.exists() ? (snap.data() as User) : null;
};

export const createUserProfile = async (uid: string, data: Partial<User>) => {
  // Generate a display ID (simple random 6 digit for now)
  const displayId = Math.floor(100000 + Math.random() * 900000).toString();
  const userData: User = {
    uid,
    id: displayId,
    name: data.name || 'User',
    avatar: data.avatar || '',
    level: 1,
    diamondsSpent: 0,
    diamondsReceived: 0,
    vip: false,
    vipLevel: 0,
    wallet: { diamonds: 0, coins: 0 },
    equippedFrame: '',
    equippedBubble: '',
    inventory: {}, // Initialize inventory
    ownedItems: [],
    friendsCount: 0,
    followersCount: 0,
    followingCount: 0,
    visitorsCount: 0,
    isAdmin: false,
    adminRole: null,
    ...data
  };
  await setDoc(doc(db, 'users', uid), userData);
  return userData;
};

export const updateUserProfile = async (uid: string, data: Partial<User>) => {
  const docRef = doc(db, 'users', uid);
  await updateDoc(docRef, data);
};

export const listenToUserProfile = (uid: string, callback: (user: User | null) => void): Unsubscribe => {
  return onSnapshot(doc(db, 'users', uid), (doc) => {
    if (doc.exists()) callback(doc.data() as User);
    else callback(null);
  });
};

export const searchUserByDisplayId = async (displayId: string): Promise<User | null> => {
  const q = query(collection(db, 'users'), where('id', '==', displayId), limit(1));
  const snap = await getDocs(q);
  if (!snap.empty) return snap.docs[0].data() as User;
  return null;
};

// --- Admin ---
export const getAllUsers = async (): Promise<User[]> => {
  const snap = await getDocs(collection(db, 'users'));
  return snap.docs.map(d => d.data() as User);
};

export const adminUpdateUser = async (uid: string, data: Partial<User>) => {
  await updateDoc(doc(db, 'users', uid), data);
};

export const adminBanRoom = async (roomId: string, isBanned: boolean) => {
  await updateDoc(doc(db, 'rooms', roomId), { isBanned });
};

export const deleteRoom = async (roomId: string) => {
  await deleteDoc(doc(db, 'rooms', roomId));
};

export const deleteAllRooms = async () => {
  const snap = await getDocs(collection(db, 'rooms'));
  const batch = writeBatch(db);
  snap.docs.forEach(d => batch.delete(d.ref));
  await batch.commit();
};

export const toggleRoomHotStatus = async (roomId: string, isHot: boolean) => {
  await updateDoc(doc(db, 'rooms', roomId), { isHot });
};

export const toggleRoomActivitiesStatus = async (roomId: string, isActivities: boolean) => {
  await updateDoc(doc(db, 'rooms', roomId), { isActivities });
};

export const sendSystemNotification = async (uid: string, title: string, body: string) => {
  const notif: Notification = {
    id: Date.now().toString(),
    type: 'system',
    title,
    body,
    timestamp: Date.now(),
    read: false
  };
  await addDoc(collection(db, `users/${uid}/notifications`), notif);
};

export const broadcastOfficialMessage = async (title: string, body: string) => {
  await addDoc(collection(db, 'broadcasts'), {
    title,
    body,
    timestamp: Date.now(),
    type: 'official'
  });
};

// --- Rooms ---
export const createRoom = async (title: string, thumbnail: string, host: User, hostUid: string) => {
    const roomRef = doc(collection(db, 'rooms'));
    const newRoom: Room = {
        id: roomRef.id,
        displayId: (100000 + Math.floor(Math.random() * 900000)).toString(),
        title,
        hostName: host.name,
        hostAvatar: host.avatar,
        hostId: host.id, 
        viewerCount: 0,
        thumbnail,
        tags: [],
        isAiHost: false,
        seats: Array(10).fill(null).map((_, i) => ({ 
            index: i, 
            userId: null, 
            userName: null, 
            userAvatar: null, 
            isMuted: false, 
            isLocked: false, 
            giftCount: 0 
        })),
        isBanned: false,
        isHot: false,
        isOfficial: false,
        isActivities: false,
        contributors: {},
        bannedUsers: [],
        admins: []
    };
    await setDoc(roomRef, newRoom);
    return newRoom;
};

export const listenToRooms = (callback: (rooms: Room[]) => void): Unsubscribe => {
  const q = query(collection(db, 'rooms'), orderBy('viewerCount', 'desc')); 
  return onSnapshot(q, (snap) => {
    const rooms: Room[] = [];
    snap.forEach(d => rooms.push(d.data() as Room));
    callback(rooms);
  });
};

export const listenToRoom = (roomId: string, callback: (room: Room | null) => void): Unsubscribe => {
    return onSnapshot(doc(db, 'rooms', roomId), (doc) => {
        if (doc.exists()) callback(doc.data() as Room);
        else callback(null);
    });
};

export const getRoomByHostId = async (hostUid: string): Promise<Room | null> => {
    const user = await getUserProfile(hostUid);
    if (!user) return null;
    const q = query(collection(db, 'rooms'), where('hostId', '==', user.id));
    const snap = await getDocs(q);
    return snap.empty ? null : (snap.docs[0].data() as Room);
};

export const updateRoomDetails = async (roomId: string, updates: Partial<Room>) => {
    await updateDoc(doc(db, 'rooms', roomId), updates);
};

export const incrementViewerCount = async (roomId: string) => {
    await updateDoc(doc(db, 'rooms', roomId), { viewerCount: increment(1) });
};

export const decrementViewerCount = async (roomId: string) => {
    await updateDoc(doc(db, 'rooms', roomId), { viewerCount: increment(-1) });
};

// --- Seats & Moderation ---
export const takeSeat = async (roomId: string, seatIndex: number, user: User) => {
    const roomRef = doc(db, 'rooms', roomId);
    const roomSnap = await getDoc(roomRef);
    if (!roomSnap.exists()) return;
    
    const room = roomSnap.data() as Room;
    const seats = [...room.seats];
    
    // Check if seat is taken or locked
    if (seats[seatIndex].userId || seats[seatIndex].isLocked) return;

    // Check if user is already in a seat
    const existingSeat = seats.findIndex(s => s.userId === user.id);
    if (existingSeat !== -1) return;

    seats[seatIndex] = {
        ...seats[seatIndex],
        userId: user.id,
        userName: user.name,
        userAvatar: user.avatar,
        frameId: user.equippedFrame || undefined, // Store frame on seat
        isMuted: false,
        giftCount: 0
    };
    
    await updateDoc(roomRef, { seats });
};

export const leaveSeat = async (roomId: string, user: User) => {
    const roomRef = doc(db, 'rooms', roomId);
    const roomSnap = await getDoc(roomRef);
    if (!roomSnap.exists()) return;
    
    const room = roomSnap.data() as Room;
    const seats = room.seats.map(s => s.userId === user.id ? { ...s, userId: null, userName: null, userAvatar: null, frameId: undefined, giftCount: 0, isMuted: false } : s);
    
    await updateDoc(roomRef, { seats });
};

export const kickUserFromSeat = async (roomId: string, seatIndex: number) => {
    const roomRef = doc(db, 'rooms', roomId);
    const roomSnap = await getDoc(roomRef);
    if (!roomSnap.exists()) return;
    
    const room = roomSnap.data() as Room;
    const seats = [...room.seats];
    if (seats[seatIndex]) {
        seats[seatIndex] = { ...seats[seatIndex], userId: null, userName: null, userAvatar: null, frameId: undefined, giftCount: 0, isMuted: false };
        await updateDoc(roomRef, { seats });
    }
};

export const banUserFromRoom = async (roomId: string, userId: string) => {
    await updateDoc(doc(db, 'rooms', roomId), {
        bannedUsers: arrayUnion(userId)
    });
};

export const unbanUserFromRoom = async (roomId: string, userId: string) => {
    await updateDoc(doc(db, 'rooms', roomId), {
        bannedUsers: arrayRemove(userId)
    });
};

export const addRoomAdmin = async (roomId: string, userId: string) => {
    await updateDoc(doc(db, 'rooms', roomId), {
        admins: arrayUnion(userId)
    });
};

export const removeRoomAdmin = async (roomId: string, userId: string) => {
    await updateDoc(doc(db, 'rooms', roomId), {
        admins: arrayRemove(userId)
    });
};

export const toggleSeatLock = async (roomId: string, seatIndex: number, isLocked: boolean) => {
    const roomRef = doc(db, 'rooms', roomId);
    const roomSnap = await getDoc(roomRef);
    if (roomSnap.exists()) {
        const seats = [...roomSnap.data().seats];
        if (seats[seatIndex]) {
            seats[seatIndex].isLocked = isLocked;
            await updateDoc(roomRef, { seats });
        }
    }
};

export const toggleSeatMute = async (roomId: string, seatIndex: number, isMuted: boolean) => {
    const roomRef = doc(db, 'rooms', roomId);
    const roomSnap = await getDoc(roomRef);
    if (roomSnap.exists()) {
        const seats = [...roomSnap.data().seats];
        if (seats[seatIndex]) {
            seats[seatIndex].isMuted = isMuted;
            await updateDoc(roomRef, { seats });
        }
    }
};

// --- Messaging ---
export const sendMessage = async (roomId: string, message: ChatMessage) => {
    await addDoc(collection(db, `rooms/${roomId}/messages`), message);
};

export const listenToMessages = (roomId: string, callback: (msgs: ChatMessage[]) => void): Unsubscribe => {
    const q = query(collection(db, `rooms/${roomId}/messages`), orderBy('timestamp', 'desc'), limit(50));
    return onSnapshot(q, (snapshot) => {
        const msgs: ChatMessage[] = [];
        snapshot.forEach(doc => msgs.push(doc.data() as ChatMessage));
        callback(msgs.reverse());
    });
};

// --- Banners ---
export const addBanner = async (imageUrl: string, title?: string, link?: string) => {
    await addDoc(collection(db, 'banners'), { imageUrl, title, link, timestamp: Date.now() });
};

export const deleteBanner = async (bannerId: string) => {
    await deleteDoc(doc(db, 'banners', bannerId));
};

export const listenToBanners = (callback: (banners: Banner[]) => void): Unsubscribe => {
    return onSnapshot(collection(db, 'banners'), (snap) => {
        const banners: Banner[] = [];
        snap.forEach(d => banners.push({ id: d.id, ...d.data() } as Banner));
        callback(banners);
    });
};

// --- Store & Inventory ---
export const purchaseStoreItem = async (uid: string, item: StoreItem, currentUser: User) => {
    const price = item.price;
    const currency = item.currency === 'diamonds' ? 'wallet.diamonds' : 'wallet.coins';
    const currentBalance = item.currency === 'diamonds' ? (currentUser.wallet?.diamonds || 0) : (currentUser.wallet?.coins || 0);

    if (currentBalance < price) throw new Error("Insufficient funds");

    // 7 Days in Milliseconds
    const duration = 7 * 24 * 60 * 60 * 1000;
    const currentExpiry = currentUser.inventory?.[item.id] || 0;
    
    // If already owned and not expired, extend. Else start from now.
    const newExpiry = Math.max(currentExpiry, Date.now()) + duration;

    const userRef = doc(db, 'users', uid);
    const batch = writeBatch(db);

    // Deduct Balance
    batch.update(userRef, { [currency]: increment(-price) });

    // Update Inventory
    batch.update(userRef, { [`inventory.${item.id}`]: newExpiry });

    // Auto-equip if not equipped
    if (item.type === 'frame' && !currentUser.equippedFrame) {
        batch.update(userRef, { equippedFrame: item.id });
    }
    if (item.type === 'bubble' && !currentUser.equippedBubble) {
        batch.update(userRef, { equippedBubble: item.id });
    }

    await batch.commit();
};

// --- Wallet & Exchange ---
export const exchangeCoinsToDiamonds = async (uid: string, amount: number) => {
    if (amount <= 0) return;
    const userRef = doc(db, 'users', uid);
    
    // Convert 1 Coin = 1 Diamond (As per request)
    // Decrement only the specified amount
    await updateDoc(userRef, {
        'wallet.diamonds': increment(amount),
        'wallet.coins': increment(-amount) 
    });
};

// --- Agency ---
export const transferAgencyDiamonds = async (agencyUid: string, targetDisplayId: string, amount: number) => {
    const targetUser = await searchUserByDisplayId(targetDisplayId);
    if (!targetUser || !targetUser.uid) throw new Error("User not found");

    const batch = writeBatch(db);
    
    // Deduct from agency
    const agencyRef = doc(db, 'users', agencyUid);
    batch.update(agencyRef, { agencyBalance: increment(-amount) });
    
    // Add to target
    const targetRef = doc(db, 'users', targetUser.uid);
    batch.update(targetRef, { 'wallet.diamonds': increment(amount) });
    
    await batch.commit();
};

// --- Notifications & Friends ---
export const listenToNotifications = (uid: string, type: 'system' | 'official', callback: (msgs: Notification[]) => void): Unsubscribe => {
    if (type === 'official') {
        // Listen to global broadcasts
        const q = query(collection(db, 'broadcasts'), orderBy('timestamp', 'desc'));
        return onSnapshot(q, (snap) => {
             const msgs: Notification[] = [];
             snap.forEach(d => msgs.push({ id: d.id, ...d.data() } as Notification));
             callback(msgs);
        });
    } else {
        const q = query(collection(db, `users/${uid}/notifications`), orderBy('timestamp', 'desc'));
        return onSnapshot(q, (snap) => {
             const msgs: Notification[] = [];
             snap.forEach(d => msgs.push(d.data() as Notification));
             callback(msgs);
        });
    }
};

export const listenToUnreadNotifications = (uid: string, callback: (count: number) => void): Unsubscribe => {
    const q = query(collection(db, `users/${uid}/notifications`), where('read', '==', false));
    return onSnapshot(q, (snap) => {
        callback(snap.size);
    });
};

export const markSystemNotificationsRead = async (uid: string) => {
    const q = query(collection(db, `users/${uid}/notifications`), where('read', '==', false));
    const snap = await getDocs(q);
    const batch = writeBatch(db);
    snap.forEach(doc => {
        batch.update(doc.ref, { read: true });
    });
    await batch.commit();
};

export const sendFriendRequest = async (fromUid: string, toUid: string, name: string, avatar: string) => {
    const req: FriendRequest = {
        uid: fromUid,
        name,
        avatar,
        timestamp: Date.now()
    };
    await setDoc(doc(db, `users/${toUid}/friendRequests`, fromUid), req);
};

export const listenToFriendRequests = (uid: string, callback: (reqs: FriendRequest[]) => void): Unsubscribe => {
    return onSnapshot(collection(db, `users/${uid}/friendRequests`), (snap) => {
        const reqs: FriendRequest[] = [];
        snap.forEach(d => reqs.push(d.data() as FriendRequest));
        callback(reqs);
    });
};

export const acceptFriendRequest = async (uid: string, targetUid: string) => {
    const batch = writeBatch(db);
    // Add to friends subcollections (bidirectional)
    batch.setDoc(doc(db, `users/${uid}/friends`, targetUid), { timestamp: Date.now() });
    batch.setDoc(doc(db, `users/${targetUid}/friends`, uid), { timestamp: Date.now() });
    // Remove request
    batch.delete(doc(db, `users/${uid}/friendRequests`, targetUid));
    // Update counts
    batch.update(doc(db, 'users', uid), { friendsCount: increment(1) });
    batch.update(doc(db, 'users', targetUid), { friendsCount: increment(1) });
    await batch.commit();
};

export const rejectFriendRequest = async (uid: string, targetUid: string) => {
    await deleteDoc(doc(db, `users/${uid}/friendRequests`, targetUid));
};

// --- Private Chats ---
export const initiatePrivateChat = async (myUid: string, otherUid: string, otherUser: User): Promise<PrivateChatSummary | null> => {
    const chatId = [myUid, otherUid].sort().join('_');
    const chatRef = doc(db, `users/${myUid}/chats`, chatId);
    const snap = await getDoc(chatRef);
    
    if (snap.exists()) return snap.data() as PrivateChatSummary;

    // Create entry
    const summary: PrivateChatSummary = {
        chatId,
        otherUserUid: otherUid,
        otherUserName: otherUser.name,
        otherUserAvatar: otherUser.avatar,
        lastMessage: '',
        lastMessageTime: Date.now(),
        unreadCount: 0
    };
    await setDoc(chatRef, summary);
    return summary;
};

export const listenToChatList = (uid: string, callback: (chats: PrivateChatSummary[]) => void): Unsubscribe => {
    const q = query(collection(db, `users/${uid}/chats`), orderBy('lastMessageTime', 'desc'));
    return onSnapshot(q, (snap) => {
        const chats: PrivateChatSummary[] = [];
        snap.forEach(d => chats.push(d.data() as PrivateChatSummary));
        callback(chats);
    });
};

export const listenToPrivateMessages = (chatId: string, callback: (msgs: PrivateMessage[]) => void): Unsubscribe => {
    const q = query(collection(db, `private_messages/${chatId}/messages`), orderBy('timestamp', 'asc'));
    return onSnapshot(q, (snap) => {
        const msgs: PrivateMessage[] = [];
        snap.forEach(d => msgs.push(d.data() as PrivateMessage));
        callback(msgs);
    });
};

export const sendPrivateMessage = async (
  sender: { uid: string; name: string; avatar: string; frameId?: string; bubbleId?: string },
  receiver: { uid: string; name: string; avatar: string },
  text: string
) => {
    const chatId = [sender.uid, receiver.uid].sort().join('_');
    const msg: PrivateMessage = {
        id: Date.now().toString(),
        senderId: sender.uid,
        text,
        timestamp: Date.now(),
        read: false,
        frameId: sender.frameId, // Persist current frame
        bubbleId: sender.bubbleId // Persist current bubble
    };

    const batch = writeBatch(db);
    const msgRef = doc(collection(db, `private_messages/${chatId}/messages`));
    batch.set(msgRef, msg);

    // Update Sender Summary (Create if not exists)
    const senderChatRef = doc(db, `users/${sender.uid}/chats`, chatId);
    batch.set(senderChatRef, {
        chatId,
        otherUserUid: receiver.uid,
        otherUserName: receiver.name,
        otherUserAvatar: receiver.avatar,
        lastMessage: text,
        lastMessageTime: Date.now()
    }, { merge: true });

    // Update Receiver Summary (Create if not exists)
    const receiverChatRef = doc(db, `users/${receiver.uid}/chats`, chatId);
    batch.set(receiverChatRef, {
        chatId,
        otherUserUid: sender.uid,
        otherUserName: sender.name,
        otherUserAvatar: sender.avatar,
        lastMessage: text,
        lastMessageTime: Date.now(),
        unreadCount: increment(1)
    }, { merge: true });

    await batch.commit();
};

export const markChatAsRead = async (myUid: string, otherUid: string) => {
    const chatId = [myUid, otherUid].sort().join('_');
    await updateDoc(doc(db, `users/${myUid}/chats`, chatId), { unreadCount: 0 });
};

// --- Gifts ---
export const sendGiftTransaction = async (roomId: string, senderUid: string, targetSeatIndex: number, cost: number) => {
    const batch = writeBatch(db);
    
    // Deduct from sender
    const senderRef = doc(db, 'users', senderUid);
    batch.update(senderRef, { 
        'wallet.diamonds': increment(-cost),
        diamondsSpent: increment(cost)
    });

    const roomRef = doc(db, 'rooms', roomId);
    const roomSnap = await getDoc(roomRef);
    
    if (roomSnap.exists()) {
        const room = roomSnap.data() as Room;
        const newSeats = [...room.seats];
        newSeats[targetSeatIndex].giftCount += cost;
        batch.update(roomRef, { seats: newSeats });

        // --- Recipient Coin Logic ---
        // 30% of the diamond cost goes to the recipient's wallet as Coins
        const recipientUserId = newSeats[targetSeatIndex].userId;
        if (recipientUserId) {
            // Find user doc by custom ID (seats store custom ID, not UID mostly)
            const q = query(collection(db, 'users'), where('id', '==', recipientUserId), limit(1));
            const userSnap = await getDocs(q);
            
            if (!userSnap.empty) {
                const recipientDoc = userSnap.docs[0];
                const coinsAmount = Math.floor(cost * 0.30); // 30%
                
                batch.update(recipientDoc.ref, {
                    'wallet.coins': increment(coinsAmount),
                    diamondsReceived: increment(cost) // Also track received value for charm level
                });
            }
        }
    }
    
    await batch.commit();
};
