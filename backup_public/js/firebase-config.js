import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

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

// Helper: Generate ID (fallback for insecure contexts)
export const generateId = () => {
    try {
        return crypto.randomUUID();
    } catch (e) {
        return Math.random().toString(36).substring(2) + Date.now().toString(36);
    }
};
