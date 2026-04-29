import { useState, useEffect } from 'react';
import { auth, db, formatPhone } from './firebase/config';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';

import Login from './screens/Login';
import Register from './screens/Register';
import Dashboard from './screens/Dashboard';
import NewGroup from './screens/NewGroup';
import GroupDetails from './screens/GroupDetails';
import Profile from './screens/Profile';
import Header from './components/Header';
import BottomNav from './components/BottomNav';

export type Screen = 'loading' | 'login' | 'register' | 'dashboard' | 'new-group' | 'group-details' | 'profile';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [groups, setGroups] = useState<any[]>([]);
  const [currentScreen, setCurrentScreen] = useState<Screen>('loading');
  const [activeGroup, setActiveGroup] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      if (user) {
        setUser(user);
        const profileDoc = await getDoc(doc(db, 'users', user.uid));
        const profileData = profileDoc.exists() ? profileDoc.data() : { name: user.displayName || 'Bunda', role: 'bandar' };
        setProfile(profileData);

        // Query grup di mana user adalah pencipta atau anggota
        const searchTerms = [user.uid];
        if (profileData.phone) searchTerms.push(formatPhone(profileData.phone));

        const q = query(
          collection(db, 'groups'),
          where('memberIds', 'array-contains-any', searchTerms)
        );

        const unsubGroups = onSnapshot(q, (snapshot) => {
          const groupsData = snapshot.docs.map(doc => doc.data());
          setGroups(groupsData);
          setLoading(false);
          if (currentScreen === 'loading') setCurrentScreen('dashboard');
        });

        return () => unsubGroups();
      } else {
        setUser(null);
        setProfile(null);
        setGroups([]);
        if (currentScreen !== 'register') setCurrentScreen('login');
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [currentScreen]);

  const renderScreen = () => {
    if (loading && currentScreen === 'loading') {
      return (
        <div className="content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
          <div className="loader"></div>
          <p style={{ marginTop: '1.5rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Memuat Arisan Bunda...</p>
        </div>
      );
    }

    if (!user) {
      return currentScreen === 'register'
        ? <Register setScreen={setCurrentScreen} />
        : <Login setScreen={setCurrentScreen} />;
    }

    const props = { user, profile, groups, setScreen: setCurrentScreen, activeGroup, setActiveGroup };

    switch (currentScreen) {
      case 'new-group': return <NewGroup {...props} />;
      case 'group-details': return <GroupDetails {...props} />;
      case 'profile': return <Profile {...props} />;
      case 'dashboard':
      default: return <Dashboard {...props} />;
    }
  };

  // Determine header title and back button visibility
  const getHeaderProps = () => {
    switch (currentScreen) {
      case 'group-details':
        return { title: activeGroup?.name || 'Detail Grup', showBack: true };
      case 'new-group':
        return { title: 'Buat Grup Baru', showBack: true };
      case 'profile':
        return { title: 'Profil Saya', showBack: true };
      default:
        return { title: 'ARISAN BUNDA', showBack: false };
    }
  };

  const headerProps = getHeaderProps();

  return (
    <div className="container">
      {user && <Header setScreen={setCurrentScreen} {...headerProps} />}
      <main id="app">
        {renderScreen()}
      </main>
      {user && currentScreen !== 'group-details' && <BottomNav currentScreen={currentScreen} setScreen={setCurrentScreen} />}
    </div>
  );
}

export default App;
