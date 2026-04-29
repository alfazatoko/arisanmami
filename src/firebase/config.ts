import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyBlPS2mJ95zJfxLQ7Shp05rXydcC8nK-lA",
    authDomain: "arisanbunda.firebaseapp.com",
    databaseURL: "https://arisanbunda-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "arisanbunda",
    storageBucket: "arisanbunda.firebasestorage.app",
    messagingSenderId: "941097128571",
    appId: "1:941097128571:web:0efc58d70ed4bd4a6b08de"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export const generateId = () => {
    try {
        return crypto.randomUUID();
    } catch (e) {
        return Math.random().toString(36).substring(2) + Date.now().toString(36);
    }
};
export const formatPhone = (phone: string) => {
    if (!phone) return "";
    let clean = phone.replace(/\D/g, '');
    if (clean.startsWith('0')) return '62' + clean.substring(1);
    if (clean.startsWith('8')) return '62' + clean;
    return clean;
};
