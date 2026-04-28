import { signOut } from 'firebase/auth';
import { auth } from '../firebase/config';
import { Screen } from '../App';

interface Props {
  profile: any;
  groups: any[];
  setScreen: (screen: Screen) => void;
}

export default function Profile({ profile, groups, setScreen }: Props) {
  const handleLogout = async () => {
    if (confirm('Yakin ingin keluar dari akun ini?')) {
      await signOut(auth);
      setScreen('login');
    }
  };

  return (
    <div className="content">
      {/* Profile Card */}
      <div className="card text-center" style={{
        border: '1px solid rgba(168, 85, 247, 0.3)',
        background: 'linear-gradient(180deg, rgba(168, 85, 247, 0.05) 0%, var(--surface-color) 100%)'
      }}>
        <div style={{
          width: '100px',
          height: '100px',
          background: 'var(--surface-variant)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px auto',
          border: '3px solid rgba(168, 85, 247, 0.3)'
        }}>
          <i className="fas fa-user" style={{ fontSize: '3rem', color: 'var(--primary-color)' }}></i>
        </div>
        <h3 style={{ fontSize: '1.5rem', marginBottom: '5px', fontWeight: 700 }}>{profile?.name || 'Bunda'}</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
          <i className="fas fa-phone-alt" style={{ fontSize: '0.8rem', marginRight: '5px' }}></i>
          {profile?.phone || '-'}
        </p>

        {/* Stats */}
        <div className="info-grid" style={{ marginBottom: 0 }}>
          <div className="info-box">
            <p>Total Grup</p>
            <h4>{groups.length}</h4>
          </div>
          <div className="info-box">
            <p>Status</p>
            <h4 style={{ color: 'var(--success-color)' }}>Aktif</h4>
          </div>
        </div>
      </div>

      {/* Role Info */}
      <div className="card">
        <h4 style={{ fontSize: '1rem', marginBottom: '15px' }}>
          <i className="fas fa-id-badge" style={{ color: 'var(--primary-color)', marginRight: '8px' }}></i>
          Informasi Akun
        </h4>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          padding: '10px 0',
          borderBottom: '1px solid var(--border-color)'
        }}>
          <span style={{ color: 'var(--text-secondary)' }}>Role</span>
          <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{profile?.role || 'Anggota'}</span>
        </div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          padding: '10px 0'
        }}>
          <span style={{ color: 'var(--text-secondary)' }}>User ID</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{profile?.uid?.slice(0, 8) || '-'}</span>
        </div>
      </div>

      {/* Logout Button */}
      <button
        className="btn btn-outline"
        onClick={handleLogout}
        style={{ color: 'var(--danger-color)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
      >
        <i className="fas fa-sign-out-alt"></i> Keluar Aplikasi
      </button>

      {/* Version */}
      <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '30px' }}>
        Arisan Bunda v2.0.0
      </p>
    </div>
  );
}
