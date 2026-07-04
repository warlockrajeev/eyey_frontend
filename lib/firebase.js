import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, sendPasswordResetEmail, signInWithEmailAndPassword } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyADH2BPeDIppWTXMIwpN59jVxRBmQ87ATk",
  authDomain: "eyey-e4d56.firebaseapp.com",
  projectId: "eyey-e4d56",
  storageBucket: "eyey-e4d56.firebasestorage.app",
  messagingSenderId: "1078106179743",
  appId: "1:1078106179743:web:d439252363e8f6cf523aaa",
  measurementId: "G-X874NS2YZB"
};

const app = initializeApp(firebaseConfig);

let analytics;
if (typeof window !== "undefined") {
  analytics = getAnalytics(app);
}

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export { analytics, sendPasswordResetEmail, signInWithEmailAndPassword };
