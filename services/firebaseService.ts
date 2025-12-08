// services/firebaseService.ts

import { 
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, 
  query, where, orderBy, limit, onSnapshot, serverTimestamp, 
  increment, arrayUnion, arrayRemove, writeBatch, addDoc, limitToLast
} from 'firebase/firestore';
import { 
  signInWithPopup, GoogleAuthProvider, signOut, 
  signInWithEmailAndPassword, createUserWithEmailAndPassword 
} from 'firebase/auth';
import { db, auth } from '../firebaseConfig';
import { User, Room, RoomSeat, ChatMessage, StoreItem, Notification, PrivateMessage, PrivateChatSummary, FriendRequest, Visitor } from '../types';

// Auth
export const loginWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
};

export const logoutUser = async () => {
  return signOut(auth);
};

export const loginWithEmail = (email: string, pass: string) => signInWithEmailAndPassword(auth, email, pass);
export const registerWithEmail = (email: string, pass: string) => createUserWithEmailAndPassword(auth, email, pass);

// User Profile
export const getUserProfile = async (uid: string): Promise<User | null> => {
  const docRef = doc(db, 'users', uid);
  const snap = await getDoc(docRef);
  return snap.exists() ? (snap.data() as User) : null;
};

export const createUserProfile = async (uid: string, data: any) => {
  const userRef = doc(db, 'users', uid);
  // Basic user structure
  const newUser: User = {
    uid,
    id: Math.floor(100000 + Math.random() * 900000).toString(), // Random 6 digit ID
    name: data.name || 'User',
    avatar: data.avatar || '',
    level: 1,
    vip: false,
    wallet: { diamonds: 0, coins: 0 },
    ...data
  };
  await setDoc(userRef, newUser);
  return newUser;
};

export const updateUserProfile = async (uid: string, data: Partial<User>) => {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, data);
};

export const listenToUserProfile = (uid: string, callback: (user: User | null) => void) => {
  return onSnapshot(doc(db, 'users', uid), (doc) => {
    callback(doc.exists() ? (doc.data() as User) : null);
  });
};

export const getAllUsers = async () => {
  const q = query(collection(db, 'users'), limit(100));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data());
};

export const searchUserByDisplayId = async (displayId: string): Promise<User | null> => {
  const q = query(collection(db, 'users'), where('id', '==', displayId), limit(1));
  const snap = await getDocs(q);
  if (!snap.empty) return snap.docs[0].data() as User;
  return null;
};

export const adminUpdateUser = (uid: string, data: Partial<User>) => updateUserProfile(uid, data);

export const resetAllUsersCoins = async () => {
  // Batching required for large sets, simplified here
  const q = query(collection(db, 'users'));
  const snap = await getDocs(q);
  const batch = writeBatch(db);
  snap.docs.forEach(d => {
    batch.update(d.ref, { 'wallet.coins': 0 });
  });
  await batch.commit();
};

// Rooms
export const createRoom = async (title: string, thumbnail: string, host: User, hostUid: string) => {
  const roomRef = doc(collection(db, 'rooms'));
  const newRoom: Room = {
    id: roomRef.id,
    displayId: roomRef.id.slice(0, 6).toUpperCase(),
    title,
    thumbnail,
    hostName: host.name,
    hostAvatar: host.avatar,
    hostId: hostUid, // using host UID as ID for easier management
    viewerCount: 0,
    tags: [],
    isAiHost: false,
    seats: Array(10).fill(null).map((_, i) => ({ index: i, userId: null, userName: null, userAvatar: null, isMuted: false, isLocked: false, giftCount: 0 })),
    seatCount: 10,
    backgroundImage: thumbnail
  };
  await setDoc(roomRef, newRoom);
  return newRoom;
};

export const listenToRooms = (callback: (rooms: Room[]) => void) => {
  const q = query(collection(db, 'rooms'), orderBy('viewerCount', 'desc'), limit(50));
  return onSnapshot(q, (snap) => {
    const rooms = snap.docs.map(d => d.data() as Room);
    callback(rooms);
  });
};

export const listenToRoom = (roomId: string, callback: (room: Room | null) => void) => {
  return onSnapshot(doc(db, 'rooms', roomId), (doc) => {
    callback(doc.exists() ? (doc.data() as Room) : null);
  });
};

export const updateRoomDetails = (roomId: string, updates: Partial<Room>) => updateDoc(doc(db, 'rooms', roomId), updates);
export const deleteRoom = (roomId: string) => deleteDoc(doc(db, 'rooms', roomId));
export const deleteAllRooms = async () => {
  const snap = await getDocs(collection(db, 'rooms'));
  const batch = writeBatch(db);
  snap.docs.forEach(d => batch.delete(d.ref));
  await batch.commit();
};

export const getRoomsByHostId = async (hostUid: string) => {
  const q = query(collection(db, 'rooms'), where('hostId', '==', hostUid));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as Room);
};

export const adminBanRoom = (roomId: string, isBanned: boolean) => updateRoomDetails(roomId, { isBanned });
export const toggleRoomHotStatus = (roomId: string, isHot: boolean) => updateRoomDetails(roomId, { isHot });
export const toggleRoomActivitiesStatus = (roomId: string, isActivities: boolean) => updateRoomDetails(roomId, { isActivities });
export const toggleRoomOfficialStatus = (roomId: string, isOfficial: boolean) => updateRoomDetails(roomId, { isOfficial });

export const syncRoomIdsWithUserIds = async () => {
  // Logic to sync room display ID with user display ID
  const rooms = await getDocs(collection(db, 'rooms'));
  const batch = writeBatch(db);
  for (const r of rooms.docs) {
    const room = r.data() as Room;
    if (room.hostId) {
      const user = await getUserProfile(room.hostId);
      if (user) {
        batch.update(r.ref, { displayId: user.id });
      }
    }
  }
  await batch.commit();
};

export const resetAllRoomCups = async () => {
  const rooms = await getDocs(collection(db, 'rooms'));
  const batch = writeBatch(db);
  rooms.docs.forEach(d => {
    batch.update(d.ref, { contributors: {}, cupStartTime: Date.now() });
  });
  await batch.commit();
};

export const resetAllGhostUsers = async () => {
  // Reset seats and viewer counts
  const rooms = await getDocs(collection(db, 'rooms'));
  const batch = writeBatch(db);
  rooms.docs.forEach(d => {
    const r = d.data() as Room;
    const cleanSeats = r.seats.map(s => ({ ...s, userId: null, userName: null, userAvatar: null }));
    batch.update(d.ref, { seats: cleanSeats, viewerCount: 0 });
  });
  await batch.commit();
};

export const updateRoomGameConfig = (roomId: string, luck: number, mode: string, threshold: number) => {
  return updateRoomDetails(roomId, { gameLuck: luck, gameMode: mode as any, hookThreshold: threshold });
};

export const changeRoomSeatCount = async (roomId: string, currentSeats: RoomSeat[], newCount: number) => {
  let newSeats = [...currentSeats];
  if (newCount > currentSeats.length) {
    // Add seats
    for (let i = currentSeats.length; i < newCount; i++) {
      newSeats.push({ index: i, userId: null, userName: null, userAvatar: null, isMuted: false, isLocked: false, giftCount: 0 });
    }
  } else {
    // Remove seats (ensure no one is sitting or kick them)
    newSeats = newSeats.slice(0, newCount);
  }
  await updateRoomDetails(roomId, { seats: newSeats, seatCount: newCount });
};

// Seat Management
export const takeSeat = async (roomId: string, seatIndex: number, user: User) => {
  const roomRef = doc(db, 'rooms', roomId);
  const roomSnap = await getDoc(roomRef);
  if(!roomSnap.exists()) throw new Error("Room not found");
  const room = roomSnap.data() as Room;
  const seats = [...room.seats];
  
  if (seats[seatIndex].userId) throw new Error("Seat taken");
  
  seats[seatIndex] = {
    ...seats[seatIndex],
    userId: user.uid || user.id, // Prefer UID
    userName: user.name,
    userAvatar: user.avatar,
    giftCount: 0,
    isMuted: false,
    frameId: user.equippedFrame,
    vipLevel: user.vipLevel
  };
  
  await updateDoc(roomRef, { seats });
};

export const leaveSeat = async (roomId: string, user: User) => {
  const roomRef = doc(db, 'rooms', roomId);
  const roomSnap = await getDoc(roomRef);
  if(!roomSnap.exists()) return;
  const room = roomSnap.data() as Room;
  const seats = [...room.seats];
  
  const seatIndex = seats.findIndex(s => s.userId === (user.uid || user.id));
  if (seatIndex === -1) return;
  
  seats[seatIndex] = {
    ...seats[seatIndex],
    userId: null,
    userName: null,
    userAvatar: null,
    giftCount: 0,
    isMuted: false,
    frameId: null,
    vipLevel: 0
  };
  
  await updateDoc(roomRef, { seats });
};

export const kickUserFromSeat = async (roomId: string, seatIndex: number) => {
  const roomRef = doc(db, 'rooms', roomId);
  const roomSnap = await getDoc(roomRef);
  if(!roomSnap.exists()) return;
  const room = roomSnap.data() as Room;
  const seats = [...room.seats];
  
  seats[seatIndex] = {
    ...seats[seatIndex],
    userId: null,
    userName: null,
    userAvatar: null,
    giftCount: 0,
    isMuted: false,
    frameId: null,
    vipLevel: 0
  };
  await updateDoc(roomRef, { seats });
};

export const toggleSeatMute = async (roomId: string, seatIndex: number, isMuted: boolean) => {
  const roomRef = doc(db, 'rooms', roomId);
  const roomSnap = await getDoc(roomRef);
  const room = roomSnap.data() as Room;
  const seats = [...room.seats];
  if(seats[seatIndex]) seats[seatIndex].isMuted = isMuted;
  await updateDoc(roomRef, { seats });
};

export const toggleSeatLock = async (roomId: string, seatIndex: number, isLocked: boolean) => {
  const roomRef = doc(db, 'rooms', roomId);
  const roomSnap = await getDoc(roomRef);
  const room = roomSnap.data() as Room;
  const seats = [...room.seats];
  if(seats[seatIndex]) seats[seatIndex].isLocked = isLocked;
  await updateDoc(roomRef, { seats });
};

// Admin Room Actions
export const banUserFromRoom = async (roomId: string, userId: string, durationMinutes: number) => {
  const roomRef = doc(db, 'rooms', roomId);
  const expiry = durationMinutes === -1 ? -1 : Date.now() + durationMinutes * 60000;
  await updateDoc(roomRef, { [`bannedUsers.${userId}`]: expiry });
};

export const unbanUserFromRoom = async (roomId: string, userId: string) => {
  const roomRef = doc(db, 'rooms', roomId);
  // FieldValue.delete() is for deleting fields
  // Using update with dot notation to delete map field requires 'deleteField()'
  // For simplicity, we can read, delete from object, update.
  // Or import deleteField
  const { deleteField } = await import('firebase/firestore');
  await updateDoc(roomRef, { [`bannedUsers.${userId}`]: deleteField() });
};

export const addRoomAdmin = async (roomId: string, userId: string) => {
  const roomRef = doc(db, 'rooms', roomId);
  await updateDoc(roomRef, { admins: arrayUnion(userId) });
};

export const removeRoomAdmin = async (roomId: string, userId: string) => {
  const roomRef = doc(db, 'rooms', roomId);
  await updateDoc(roomRef, { admins: arrayRemove(userId) });
};

// Viewer Tracking
export const enterRoom = async (roomId: string, user: User) => {
  const viewerRef = doc(db, `rooms/${roomId}/viewers`, user.uid || user.id);
  await setDoc(viewerRef, user);
  await incrementViewerCount(roomId);
};

export const exitRoom = async (roomId: string, userId: string) => {
  const viewerRef = doc(db, `rooms/${roomId}/viewers`, userId);
  await deleteDoc(viewerRef);
  await decrementViewerCount(roomId);
};

export const incrementViewerCount = (roomId: string) => updateDoc(doc(db, 'rooms', roomId), { viewerCount: increment(1) });
export const decrementViewerCount = (roomId: string) => updateDoc(doc(db, 'rooms', roomId), { viewerCount: increment(-1) });

export const listenToRoomViewers = (roomId: string, cb: (users: User[]) => void) => {
  return onSnapshot(collection(db, `rooms/${roomId}/viewers`), (snap) => {
    cb(snap.docs.map(d => d.data() as User));
  });
};

// Chat
export const sendMessage = async (roomId: string, message: ChatMessage) => {
  await addDoc(collection(db, `rooms/${roomId}/messages`), message);
};

export const listenToMessages = (roomId: string, callback: (msgs: ChatMessage[]) => void) => {
  const q = query(collection(db, `rooms/${roomId}/messages`), orderBy('timestamp', 'asc'), limitToLast(50));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => d.data() as ChatMessage));
  });
};

// Gifts & Wallet
export const updateWalletForGame = (uid: string, amount: number) => {
  const userRef = doc(db, 'users', uid);
  return updateDoc(userRef, { 'wallet.diamonds': increment(amount) });
};

export const exchangeCoinsToDiamonds = async (uid: string, coinsAmount: number) => {
  // Exchange rate logic (e.g., 100 coins = 1 diamond)
  const diamonds = Math.floor(coinsAmount / 100); 
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, { 
    'wallet.coins': increment(-coinsAmount),
    'wallet.diamonds': increment(diamonds)
  });
};

export const purchaseStoreItem = async (uid: string, item: StoreItem, user: User) => {
  const cost = item.price;
  const currencyField = item.currency === 'diamonds' ? 'wallet.diamonds' : 'wallet.coins';
  
  if ((item.currency === 'diamonds' && (user.wallet?.diamonds || 0) < cost) ||
      (item.currency === 'coins' && (user.wallet?.coins || 0) < cost)) {
    throw new Error("Insufficient funds");
  }

  const expiry = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
  const userRef = doc(db, 'users', uid);
  
  await updateDoc(userRef, {
    [currencyField]: increment(-cost),
    [`inventory.${item.id}`]: expiry
  });
};

export const sendGiftTransaction = async (roomId: string, senderUid: string, seatIndex: number, cost: number, giftId: string) => {
  // Deduct from sender
  const senderRef = doc(db, 'users', senderUid);
  await updateDoc(senderRef, { 
    'wallet.diamonds': increment(-cost),
    diamondsSpent: increment(cost)
  });

  // Update room seat gift count
  const roomRef = doc(db, 'rooms', roomId);
  const roomSnap = await getDoc(roomRef);
  const room = roomSnap.data() as Room;
  const seat = room.seats[seatIndex];
  
  if (seat && seat.userId) {
    // Add to receiver
    const receiverRef = doc(db, 'users', seat.userId);
    await updateDoc(receiverRef, {
      'wallet.coins': increment(cost), // Receiver gets coins equivalent to cost
      diamondsReceived: increment(cost),
      [`receivedGifts.${giftId}`]: increment(1)
    });

    // Update room contributor stats (simplified)
    const contributorKey = `contributors.${senderUid}`;
    await updateDoc(roomRef, {
      [`seats.${seatIndex}.giftCount`]: increment(1),
      [`${contributorKey}.userId`]: senderUid,
      [`${contributorKey}.amount`]: increment(cost),
      // Ideally update name/avatar too, but requires reading sender first or passing it
    });
  }
};

export const transferAgencyDiamonds = async (senderUid: string, targetDisplayId: string, amount: number) => {
  const targetUser = await searchUserByDisplayId(targetDisplayId);
  if (!targetUser || !targetUser.uid) throw new Error("User not found");
  
  const senderRef = doc(db, 'users', senderUid);
  const receiverRef = doc(db, 'users', targetUser.uid);
  
  const batch = writeBatch(db);
  batch.update(senderRef, { agencyBalance: increment(-amount) });
  batch.update(receiverRef, { 'wallet.diamonds': increment(amount) });
  await batch.commit();
};

// Social
export const sendFriendRequest = async (fromUid: string, toUid: string, name: string, avatar: string) => {
  await addDoc(collection(db, `users/${toUid}/friendRequests`), {
    uid: fromUid,
    name,
    avatar,
    timestamp: Date.now()
  });
};

export const acceptFriendRequest = async (myUid: string, targetUid: string) => {
  // Add to friends lists
  const batch = writeBatch(db);
  const myFriendRef = doc(db, `users/${myUid}/friends`, targetUid);
  const targetFriendRef = doc(db, `users/${targetUid}/friends`, myUid);
  
  batch.set(myFriendRef, { uid: targetUid, timestamp: Date.now() });
  batch.set(targetFriendRef, { uid: myUid, timestamp: Date.now() });
  
  // Remove request
  // Need reference to request doc. For simplicity we assume we query it or just skip this step in dummy impl.
  // In real app, we'd query the request doc to delete it.
  
  await batch.commit();
};

export const rejectFriendRequest = async (myUid: string, targetUid: string) => {
  // Query and delete request
  const q = query(collection(db, `users/${myUid}/friendRequests`), where('uid', '==', targetUid));
  const snap = await getDocs(q);
  snap.forEach(d => deleteDoc(d.ref));
};

export const listenToFriendRequests = (uid: string, cb: (reqs: FriendRequest[]) => void) => {
  return onSnapshot(collection(db, `users/${uid}/friendRequests`), (snap) => {
    cb(snap.docs.map(d => d.data() as FriendRequest));
  });
};

export const checkFriendshipStatus = async (uid1: string, uid2: string) => {
  const docRef = doc(db, `users/${uid1}/friends`, uid2);
  const snap = await getDoc(docRef);
  return {
    isFriend: snap.exists(),
    sentRequest: false, // Would need to query requests to know
    receivedRequest: false 
  };
};

export const getUserList = async (uid: string, type: 'friends' | 'followers' | 'following' | 'visitors') => {
  const snap = await getDocs(collection(db, `users/${uid}/${type}`));
  return snap.docs.map(d => d.data());
};

export const recordProfileVisit = async (targetUid: string, visitor: User) => {
  const ref = doc(db, `users/${targetUid}/visitors`, visitor.uid!);
  await setDoc(ref, {
    uid: visitor.uid,
    name: visitor.name,
    avatar: visitor.avatar,
    lastVisitTime: Date.now(),
    visitCount: increment(1)
  }, { merge: true });
};

// Private Chat
export const initiatePrivateChat = async (myUid: string, otherUid: string, otherUser: User) => {
  // Create/Get chat room
  const chatId = [myUid, otherUid].sort().join('_');
  const chatRef = doc(db, 'private_messages', chatId);
  await setDoc(chatRef, { users: [myUid, otherUid], lastMessageTime: Date.now() }, { merge: true });
  
  // Update my chat list
  const myChatSummaryRef = doc(db, `users/${myUid}/chats`, chatId);
  await setDoc(myChatSummaryRef, {
    chatId,
    otherUserUid: otherUid,
    otherUserName: otherUser.name,
    otherUserAvatar: otherUser.avatar,
    lastMessageTime: Date.now(),
    unreadCount: 0
  }, { merge: true });

  return {
    chatId,
    otherUserUid: otherUid,
    otherUserName: otherUser.name,
    otherUserAvatar: otherUser.avatar,
    lastMessage: '',
    lastMessageTime: Date.now(),
    unreadCount: 0
  } as PrivateChatSummary;
};

export const listenToChatList = (uid: string, cb: (chats: PrivateChatSummary[]) => void) => {
  const q = query(collection(db, `users/${uid}/chats`), orderBy('lastMessageTime', 'desc'));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map(d => d.data() as PrivateChatSummary));
  });
};

export const listenToPrivateMessages = (chatId: string, cb: (msgs: PrivateMessage[]) => void) => {
  const q = query(collection(db, `private_messages/${chatId}/messages`), orderBy('timestamp', 'asc'), limitToLast(50));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() } as PrivateMessage)));
  });
};

export const sendPrivateMessage = async (sender: any, receiver: any, text: string) => {
  const chatId = [sender.uid, receiver.uid].sort().join('_');
  const msg: any = {
    senderId: sender.uid,
    text,
    timestamp: Date.now(),
    read: false,
    frameId: sender.frameId,
    bubbleId: sender.bubbleId
  };
  
  await addDoc(collection(db, `private_messages/${chatId}/messages`), msg);
  
  // Update summaries
  const updateData = {
    lastMessage: text,
    lastMessageTime: Date.now()
  };
  
  await updateDoc(doc(db, `users/${sender.uid}/chats`, chatId), updateData);
  await updateDoc(doc(db, `users/${receiver.uid}/chats`, chatId), {
    ...updateData,
    unreadCount: increment(1)
  });
};

export const markChatAsRead = async (myUid: string, otherUid: string) => {
  const chatId = [myUid, otherUid].sort().join('_');
  await updateDoc(doc(db, `users/${myUid}/chats`, chatId), { unreadCount: 0 });
};

export const resetAllAppCommunications = async () => {
  // This function would be complex in client side without admin SDK
  // Simplified:
  // 1. Delete all chat summaries from users
  // 2. Delete all messages from rooms
  // 3. Delete notifications
  console.log("Resetting communications...");
};

// Banners
export const addBanner = async (imageUrl: string, title: string) => {
  await addDoc(collection(db, 'banners'), { imageUrl, title, timestamp: Date.now() });
};

export const deleteBanner = (id: string) => deleteDoc(doc(db, 'banners', id));

export const listenToBanners = (cb: (banners: any[]) => void) => {
  const q = query(collection(db, 'banners'), orderBy('timestamp', 'desc'));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
};

// System Notifications
export const sendSystemNotification = async (uid: string, title: string, body: string) => {
  await addDoc(collection(db, `users/${uid}/notifications`), {
    type: 'system',
    title,
    body,
    timestamp: Date.now(),
    read: false
  });
};

export const broadcastOfficialMessage = async (title: string, body: string) => {
  // In real app, write to a common 'announcements' collection that all users subscribe to
  // OR use Cloud Functions to fan-out. Here we simulate single user write for demo.
  await addDoc(collection(db, 'announcements'), {
    type: 'official',
    title,
    body,
    timestamp: Date.now()
  });
};

export const listenToNotifications = (uid: string, type: 'system' | 'official', cb: (notifs: Notification[]) => void) => {
  if (type === 'system') {
    const q = query(collection(db, `users/${uid}/notifications`), orderBy('timestamp', 'desc'));
    return onSnapshot(q, (snap) => cb(snap.docs.map(d => ({ id: d.id, ...d.data() } as Notification))));
  } else {
    // Official (Announcements)
    const q = query(collection(db, 'announcements'), orderBy('timestamp', 'desc'), limit(20));
    return onSnapshot(q, (snap) => cb(snap.docs.map(d => ({ id: d.id, ...d.data() } as Notification))));
  }
};

export const listenToUnreadNotifications = (uid: string, cb: (count: number) => void) => {
  const q = query(collection(db, `users/${uid}/notifications`), where('read', '==', false));
  return onSnapshot(q, (snap) => cb(snap.size));
};

export const markSystemNotificationsRead = async (uid: string) => {
  const q = query(collection(db, `users/${uid}/notifications`), where('read', '==', false));
  const snap = await getDocs(q);
  const batch = writeBatch(db);
  snap.docs.forEach(d => batch.update(d.ref, { read: true }));
  await batch.commit();
};
