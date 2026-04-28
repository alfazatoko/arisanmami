import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { doc, getDoc, collection, query, where, orderBy, onSnapshot, getDocs } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
import { initUI } from './ui-components.js';

// App State
let state = {
    user: null,
    profile: null,
    groups: [],
    currentScreen: 'loading',
    loading: true,
    activeGroup: null,
    isAuthenticating: false
};

// Initialize UI
const ui = initUI(state, () => renderScreen());

const renderScreen = () => {
    const appDiv = document.getElementById('app');
    if (!appDiv) return;
    appDiv.innerHTML = '';

    if (state.loading && state.currentScreen === 'loading') {
        appDiv.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 80vh;">
                <div class="loader"></div>
                <p style="margin-top: 1.5rem; color: #64748b; font-weight: 500;">Memuat Arisan Mami...</p>
            </div>
        `;
        return;
    }

    if (!state.user) {
        if (state.currentScreen === 'register') ui.renderRegister();
        else ui.renderLogin();
        lucide.createIcons();
        return;
    }

    ui.renderHeader();
    
    const screenMap = {
        'dashboard': ui.renderDashboard,
        'new-group': ui.renderNewGroup,
        'group-details': ui.renderGroupDetails,
        'profile': ui.renderProfile
    };

    const renderer = screenMap[state.currentScreen] || ui.renderDashboard;
    renderer();
    
    ui.renderBottomNav();
    lucide.createIcons();
};

// Auth Listener
onAuthStateChanged(auth, async (user) => {
    state.loading = true;
    renderScreen();
    
    if (user) {
        state.user = user;
        try {
            const profileDoc = await getDoc(doc(db, 'users', user.uid));
            if (profileDoc.exists()) state.profile = profileDoc.data();
            else state.profile = { name: user.displayName || 'Mami', role: 'bandar' };
            
            const q = query(collection(db, 'groups'), where('memberIds', 'array-contains', state.profile.phone || user.uid), orderBy('createdAt', 'desc'));
            onSnapshot(q, (snapshot) => {
                state.groups = [];
                snapshot.forEach(doc => state.groups.push(doc.data()));
                state.loading = false;
                if (state.currentScreen === 'loading') state.currentScreen = 'dashboard';
                renderScreen();
            }, (err) => {
                console.error("Firestore error:", err);
                const qBasic = query(collection(db, 'groups'), where('memberIds', 'array-contains', state.profile.phone || user.uid));
                getDocs(qBasic).then(snap => {
                    state.groups = [];
                    snap.forEach(doc => state.groups.push(doc.data()));
                    state.loading = false;
                    state.currentScreen = 'dashboard';
                    renderScreen();
                });
            });
        } catch (e) {
            console.error("Error fetching data:", e);
            state.loading = false;
            state.currentScreen = 'dashboard';
            renderScreen();
        }
    } else {
        state.user = null; state.profile = null; state.groups = [];
        if (state.currentScreen !== 'register') state.currentScreen = 'login';
        state.loading = false;
        renderScreen();
    }
});

export { state, renderScreen };
