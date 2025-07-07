// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAVUd0nm0JFjp41_uxQbMHyb6xHgfvsdHM",
  authDomain: "lets-chat-22767.firebaseapp.com",
  projectId: "lets-chat-22767",
  storageBucket: "lets-chat-22767.firebasestorage.app",
  messagingSenderId: "368311761606",
  appId: "1:368311761606:web:dca93a197b45c1455c75c7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage }; 