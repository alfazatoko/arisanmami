import { useState } from 'react';
import { auth, db } from '../firebase/config';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { Screen } from '../App';

interface Props {
  setScreen: (screen: Screen) => void;
}

export default function Register({ setScreen }: Props) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    const cleanPhone = phone.replace(/\D/g, '');
    if (!name || !cleanPhone || !password) return alert('Lengkapi semua data');
    if (password.length < 6) return alert('Password minimal 6 karakter');

    setLoading(true);
    try {
      const email = `${cleanPhone}@mamaarisan.app`;
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      const profile = {
        uid: userCred.user.uid,
        name: name,
        phone: cleanPhone,
        role: 'bandar',
        createdAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'users', userCred.user.uid), profile);
      setScreen('dashboard');
    } catch (e: any) {
      alert('Pendaftaran Gagal: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="content" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '80vh' }}>
      <div className="card" style={{
        border: '1px solid rgba(168, 85, 247, 0.3)',
        background: 'linear-gradient(180deg, rgba(168, 85, 247, 0.05) 0%, var(--surface-color) 100%)'
      }}>
        <div className="text-center mb-3">
          <div style={{
            background: 'rgba(168, 85, 247, 0.1)',
            width: '70px',
            height: '70px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 15px auto'
          }}>
            <i className="fas fa-user-plus" style={{ fontSize: '2rem', color: 'var(--primary-color)' }}></i>
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Daftar Bandar</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Buat akun admin untuk mengelola arisan</p>
        </div>

        <div className="form-group">
          <label>Nama Lengkap</label>
          <input
            type="text"
            className="input"
            placeholder="Nama Anda"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Nomor HP</label>
          <input
            type="tel"
            className="input"
            placeholder="08123456789"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>PIN / Password</label>
          <input
            type="password"
            className="input"
            placeholder="Minimal 6 karakter"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button
          className="btn btn-primary"
          onClick={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <><i className="fas fa-spinner fa-spin"></i> Mendaftar...</>
          ) : (
            <><i className="fas fa-user-check"></i> Buat Akun Sekarang</>
          )}
        </button>

        <div className="text-center mt-3">
          <button
            onClick={() => setScreen('login')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            <i className="fas fa-arrow-left"></i> Kembali ke Login
          </button>
        </div>
      </div>
    </div>
  );
}
