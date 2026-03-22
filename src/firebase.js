import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your exact Web App Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAlh87o8MU6YcbKIzt-WlfSIjeqD1vHZCU",
  authDomain: "fadedstudio.firebaseapp.com",
  projectId: "fadedstudio",
  storageBucket: "fadedstudio.firebasestorage.app",
  messagingSenderId: "678066376417",
  appId: "1:678066376417:web:1d2d23023d37e7aa66f1a0",
  measurementId: "G-FKRRQW8T53"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Auth and Database so your SignUp.jsx can use them
export const auth = getAuth(app);
export const db = getFirestore(app);