import { Screen } from '../App';

interface Props {
  profile: any;
  groups: any[];
  setScreen: (screen: Screen) => void;
  setActiveGroup: (group: any) => void;
}

export default function Dashboard({ profile, groups, setScreen, setActiveGroup }: Props) {
  const formatRp = (angka: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
  };

  return (
    <div className="content">
      {/* Hero Section */}
      <div className="hero-dashboard">
        <i className="fas fa-wallet hero-icon"></i>
        <h1 className="hero-title">ARISAN BUNDA</h1>
        <p className="hero-subtitle">Kelola arisan dengan modern, rapi & transparan</p>
      </div>

      {/* Create Group Card - Admin Only */}
      {profile?.role === 'bandar' && (
        <div className="card" style={{
          border: '1px solid rgba(168, 85, 247, 0.3)',
          background: 'linear-gradient(180deg, rgba(168, 85, 247, 0.05) 0%, var(--surface-color) 100%)'
        }}>
          <h3 className="mb-3" style={{ fontSize: '1.1rem' }}>
            <i className="fas fa-plus-circle" style={{ color: 'var(--primary-color)', marginRight: '8px' }}></i>
            Buat Grup Baru
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '15px' }}>
            Mulai arisan baru dengan mengklik tombol di bawah
          </p>
          <button className="btn btn-primary" onClick={() => setScreen('new-group')}>
            <i className="fas fa-plus"></i> Buat Grup Baru
          </button>
        </div>
      )}

      {/* Group List */}
      <h3 style={{ marginTop: '25px', fontSize: '1.1rem', fontWeight: 600, paddingLeft: '5px', marginBottom: '16px' }}>
        <i className="fas fa-users" style={{ marginRight: '8px', color: 'var(--primary-color)' }}></i>
        Daftar Grup Saya
      </h3>

      {groups.length === 0 ? (
        <div className="card text-center" style={{ padding: '40px 20px' }}>
          <i className="fas fa-inbox" style={{ fontSize: '3rem', color: 'var(--text-secondary)', marginBottom: '15px' }}></i>
          <p style={{ color: 'var(--text-secondary)' }}>
            {profile?.role === 'bandar' ? 'Belum ada grup arisan.' : 'Anda belum terdaftar di grup arisan manapun.'}
          </p>
        </div>
      ) : (
        groups.map(g => {
          const totalPot = g.contributionAmount * g.participants.length;
          const progress = Math.round((g.participants.filter((p: any) => p.hasWon).length / g.participants.length) * 100);

          return (
            <div
              key={g.id}
              className="card"
              onClick={() => { setActiveGroup(g); setScreen('group-details'); }}
              style={{ cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{g.name}</h4>
                <span className="badge" style={{ background: 'var(--surface-variant)' }}>
                  <i className="fas fa-users"></i> {g.participants.length}
                </span>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: '15px',
                background: 'rgba(0,0,0,0.2)',
                padding: '10px',
                borderRadius: '10px'
              }}>
                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block' }}>SETORAN</span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{formatRp(g.contributionAmount)}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block' }}>TARIKAN</span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--primary-color)' }}>{formatRp(totalPot)}</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div style={{ marginTop: '12px' }}>
                <div style={{
                  background: 'rgba(0,0,0,0.3)',
                  height: '6px',
                  borderRadius: '3px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    background: 'var(--primary-gradient)',
                    width: `${progress}%`,
                    height: '100%',
                    borderRadius: '3px',
                    transition: 'width 0.3s ease'
                  }}></div>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)',
                  marginTop: '5px'
                }}>
                  <span>Progres: {progress}%</span>
                  <span>{g.participants.filter((p: any) => p.hasWon).length}/{g.participants.length} selesai</span>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
