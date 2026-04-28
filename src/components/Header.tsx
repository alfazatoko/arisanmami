import { signOut } from 'firebase/auth';
import { auth } from '../firebase/config';
import { Screen } from '../App';

interface Props {
  setScreen: (screen: Screen) => void;
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
}

export default function Header({ setScreen, title = 'ARISAN BUNDA', showBack = false, onBack }: Props) {
  const handleLogout = async () => {
    if (confirm('Yakin ingin keluar dari akun ini?')) {
      await signOut(auth);
      setScreen('login');
    }
  };

  return (
    <header>
      <button
        className={`icon-btn-header ${!showBack ? 'hidden' : ''}`}
        onClick={onBack || (() => setScreen('dashboard'))}
        title="Kembali"
      >
        <i className="fas fa-chevron-left"></i>
      </button>
      <div className="header-title">{title}</div>
      <button className="icon-btn-header" onClick={handleLogout} title="Keluar">
        <i className="fas fa-user"></i>
      </button>
    </header>
  );
}
