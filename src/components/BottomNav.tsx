import { Screen } from '../App';

interface Props {
  currentScreen: Screen;
  setScreen: (screen: Screen) => void;
}

export default function BottomNav({ currentScreen, setScreen }: Props) {
  return (
    <div className="bottom-nav">
      <div
        className={`nav-item ${currentScreen === 'dashboard' ? 'active' : ''}`}
        onClick={() => setScreen('dashboard')}
      >
        <i className="fas fa-home" style={{ fontSize: '1.25rem' }}></i>
        <span>Beranda</span>
      </div>
      <div
        className={`nav-item ${currentScreen === 'new-group' ? 'active' : ''}`}
        onClick={() => setScreen('new-group')}
      >
        <div style={{
          width: '48px',
          height: '48px',
          background: 'var(--primary-gradient)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          transform: 'translateY(-20px)',
          boxShadow: '0 8px 25px rgba(168, 85, 247, 0.5)',
          border: '3px solid var(--bg-color)'
        }}>
          <i className="fas fa-plus" style={{ fontSize: '1.25rem' }}></i>
        </div>
      </div>
      <div
        className={`nav-item ${currentScreen === 'profile' ? 'active' : ''}`}
        onClick={() => setScreen('profile')}
      >
        <i className="fas fa-user" style={{ fontSize: '1.25rem' }}></i>
        <span>Akun</span>
      </div>
    </div>
  );
}
