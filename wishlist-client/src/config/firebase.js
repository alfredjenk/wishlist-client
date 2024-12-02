// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD_VZKqVKI7i1MAg6RSGO9lsVtq9_TKdhQ",
  authDomain: "wishlist-745de.firebaseapp.com",
  projectId: "wishlist-745de",
  storageBucket: "wishlist-745de.firebasestorage.app",
  messagingSenderId: "560369710225",
  appId: "1:560369710225:web:2f130523b1047721c07b30"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export const db = getFirestore(app);