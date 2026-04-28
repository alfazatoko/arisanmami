import { useState, useEffect } from 'react';
import { auth, db } from '../firebase/config';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { Screen } from '../App';

interface Props {
  setScreen: (screen: Screen) => void;
}

export default function Login({ setScreen }: Props) {
  const [activeTab, setActiveTab] = useState<'bandar' | 'anggota'>('bandar');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [showInstall, setShowInstall] = useState(false);

  // PWA Install Logic
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
      setShowInstall(true);
    };
    window.addEventListener('beforeinstallprompt', handler);

    const installedHandler = () => {
      setShowInstall(false);
      setInstallPrompt(null);
    };
    window.addEventListener('appinstalled', installedHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, []);

  const handleInstallApp = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowInstall(false);
      setInstallPrompt(null);
    }
  };

  const handleLogin = async () => {
    const cleanPhone = phone.replace(/\D/g, '');
    const loginPassword = activeTab === 'bandar' ? password : cleanPhone;

    if (!cleanPhone || (activeTab === 'bandar' && !loginPassword)) {
      return alert('Mohon lengkapi data');
    }

    setLoading(true);
    try {
      const email = `${cleanPhone}@mamaarisan.app`;
      if (activeTab === 'anggota') {
        try {
          await signInWithEmailAndPassword(auth, email, loginPassword);
        } catch (err: any) {
          if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found') {
            try {
              const userCred = await createUserWithEmailAndPassword(auth, email, loginPassword);
              await setDoc(doc(db, 'users', userCred.user.uid), {
                uid: userCred.user.uid,
                name: 'Anggota',
                phone: cleanPhone,
                role: 'anggota',
                createdAt: new Date().toISOString()
              });
            } catch (regErr) {
              throw new Error('Nomor HP belum terdaftar sebagai anggota. Hubungi Bandar Anda.');
            }
          } else throw err;
        }
      } else {
        await signInWithEmailAndPassword(auth, email, loginPassword);
      }
    } catch (e: any) {
      let errorMsg = 'Login gagal. ';
      if (e.code === 'auth/invalid-credential' || e.code === 'auth/invalid-login-credentials') {
        if (activeTab === 'bandar') {
          errorMsg += 'Nomor HP atau PIN salah. Jika belum punya akun, daftar terlebih dahulu.';
        } else {
          errorMsg += 'Nomor HP belum terdaftar sebagai anggota. Hubungi Bandar untuk mendaftarkan Anda.';
        }
      } else if (e.code === 'auth/user-not-found') {
        errorMsg += activeTab === 'bandar'
          ? 'Akun tidak ditemukan. Silakan daftar terlebih dahulu.'
          : 'Anda belum terdaftar sebagai anggota.';
      } else if (e.code === 'auth/wrong-password') {
        errorMsg += 'PIN/Password salah.';
      } else if (e.code === 'auth/too-many-requests') {
        errorMsg += 'Terlalu banyak percobaan. Coba lagi nanti.';
      } else {
        errorMsg += e.message;
      }
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="content" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '80vh' }}>
      <div className="card text-center" style={{ padding: '40px 20px' }}>
        <div style={{
          background: 'rgba(168, 85, 247, 0.1)',
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px auto'
        }}>
          <i className="fas fa-shield-alt" style={{ fontSize: '2.5rem', color: 'var(--primary-color)' }}></i>
        </div>
        <h2 className="mb-3" style={{ fontSize: '1.5rem', fontWeight: 700 }}>Akses Masuk</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '30px', lineHeight: 1.5 }}>
          Masukkan No. HP Anda.<br />
          <span style={{ fontSize: '0.8rem' }}>(Login pertama kali otomatis menjadi Admin/Pemilik)</span>
        </p>

        <div className="tabs" style={{ marginBottom: '20px' }}>
          <button
            className={`tab ${activeTab === 'bandar' ? 'active' : ''}`}
            onClick={() => setActiveTab('bandar')}
          >
            BANDAR
          </button>
          <button
            className={`tab ${activeTab === 'anggota' ? 'active' : ''}`}
            onClick={() => setActiveTab('anggota')}
          >
            ANGGOTA
          </button>
        </div>

        <div className="form-group">
          <input
            type="tel"
            className="input"
            placeholder="Contoh: 08123456789"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={{ textAlign: 'center', fontSize: '1.1rem', letterSpacing: '1px' }}
          />
        </div>

        {activeTab === 'bandar' && (
          <div className="form-group">
            <input
              type="password"
              className="input"
              placeholder="PIN / Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ textAlign: 'center' }}
            />
          </div>
        )}

        <button
          className="btn btn-primary"
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <div className="loader" style={{ width: '20px', height: '20px', borderWidth: '2px' }}></div>
          ) : (
            <><i className="fas fa-sign-in-alt"></i> MASUK APLIKASI</>
          )}
        </button>

        {/* PWA Install Button */}
        {showInstall && (
          <div style={{ marginTop: '25px', paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
            <p style={{
              color: 'var(--text-secondary)',
              fontSize: '0.8rem',
              lineHeight: 1.6,
              marginBottom: '15px'
            }}>
              <i className="fas fa-info-circle" style={{ color: 'var(--primary-color)', marginRight: '5px' }}></i>
              Untuk pengalaman terbaik, pastikan Anda membuka website ini di browser Google Chrome, lalu klik tombol instal di bawah ini.
            </p>
            <button
              onClick={handleInstallApp}
              style={{
                width: '100%',
                padding: '14px',
                border: 'none',
                borderRadius: '14px',
                fontSize: '1rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '8px',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: '#fff',
                boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)',
                transition: '0.2s'
              }}
            >
              <i className="fas fa-download"></i> INSTAL APLIKASI
            </button>
          </div>
        )}

        {activeTab === 'bandar' && (
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Belum punya akun?{' '}
              <a
                href="#"
                onClick={(e) => { e.preventDefault(); setScreen('register'); }}
                style={{ color: 'var(--primary-color)', fontWeight: 700, textDecoration: 'none' }}
              >
                Daftar Bandar
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
