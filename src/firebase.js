
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";


export const firebaseConfig = {
  apiKey: "AIzaSyDC3C2WNZByfsvc4G7BVmE6-t1WPvdZJz8",
  authDomain: "corteya-5f474.firebaseapp.com",
  databaseURL: "https://corteya-5f474-default-rtdb.firebaseio.com",
  projectId: "corteya-5f474",
  storageBucket: "corteya-5f474.firebasestorage.app",
  messagingSenderId: "355079626833",
  appId: "1:355079626833:web:ab048cf816ee69d17e9870",
  measurementId: "G-EST1QFB3RG",
};

// Inicializa Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
