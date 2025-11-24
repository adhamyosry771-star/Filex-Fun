import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Real Firebase Configuration for Flex Fun (filex-fun)
const firebaseConfig = {
  apiKey: "AIzaSyBPilZsTihvQQOh0FYQw9k_MxuXXoLLg8U",
  authDomain: "filex-fun.firebaseapp.com",
  projectId: "filex-fun",
  storageBucket: "filex-fun.firebasestorage.app",
  messagingSenderId: "571151873178",
  appId: "1:571151873178:web:3086edfd24d3ba53c49b23",
  measurementId: "G-HN9X5LE4ZP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);