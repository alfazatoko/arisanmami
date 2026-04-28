import { useState } from 'react';
import { db, generateId } from '../firebase/config';
import { doc, setDoc } from 'firebase/firestore';
import { Screen } from '../App';

interface Props {
  user: any;
  profile: any;
  setScreen: (screen: Screen) => void;
}

export default function NewGroup({ user, profile, setScreen }: Props) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState(100000);
  const [count, setCount] = useState(10);
  const [frequency, setFrequency] = useState('Bulanan');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name) return alert('Nama grup harus diisi');
    if (count < 2) return alert('Peserta minimal 2 orang');

    setLoading(true);
    try {
      const id = generateId();
      const contributionAmount = Number(amount);
      const participantCount = Number(count);

      if (isNaN(contributionAmount) || contributionAmount <= 0) throw new Error('Iuran harus berupa angka positif');
      if (isNaN(participantCount) || participantCount < 2) throw new Error('Jumlah peserta minimal 2');

      const participants = Array.from({ length: participantCount }, (_, i) => ({
        id: generateId(),
        name: `Anggota ${i + 1}`,
        phone: '',
        hasWon: false,
        wonRound: null,
        isPaid: false
      }));

      // Pastikan memberIds selalu include user.uid
      const memberIds = [user.uid];
      if (profile?.phone) memberIds.push(profile.phone);

      const newGroup = {
        id,
        name: name.trim(),
        contributionAmount,
        frequency,
        cycle: 1,
        creatorId: user.uid,
        memberIds: [...new Set(memberIds)], // Remove duplicates
        participants,
        createdAt: new Date().toISOString()
      };

      console.log('Creating group:', newGroup);
      await setDoc(doc(db, 'groups', id), newGroup);
      console.log('Group created successfully');

      // Tunggu sebentar agar Firestore update terdeteksi
      setTimeout(() => {
        setScreen('dashboard');
      }, 500);
    } catch (e: any) {
      console.error('Error creating group:', e);
      alert('Gagal simpan: ' + (e.code || e.message || 'Error tidak diketahui'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="content">
      <div className="card" style={{
        border: '1px solid rgba(168, 85, 247, 0.3)',
        background: 'linear-gradient(180deg, rgba(168, 85, 247, 0.05) 0%, var(--surface-color) 100%)'
      }}>
        <h3 className="mb-3" style={{ fontSize: '1.1rem' }}>
          <i className="fas fa-plus-circle" style={{ color: 'var(--primary-color)', marginRight: '8px' }}></i>
          Buat Grup Baru
        </h3>

        <div className="form-group">
          <label>Nama Grup</label>
          <input
            type="text"
            className="input"
            placeholder="Nama Grup (Misal: Arisan RT 01)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Setoran per Bulan (Rp)</label>
          <input
            type="number"
            className="input"
            placeholder="100000"
            value={amount}
            onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
          />
        </div>

        <div className="form-group">
          <label>Jumlah Anggota</label>
          <input
            type="number"
            className="input"
            placeholder="10"
            value={count}
            onChange={(e) => setCount(parseInt(e.target.value) || 0)}
          />
        </div>

        <div className="form-group">
          <label>Frekuensi Kocokan</label>
          <select
            className="input"
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
          >
            <option value="Mingguan">Mingguan</option>
            <option value="Bulanan">Bulanan</option>
          </select>
        </div>

        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? (
            <><i className="fas fa-spinner fa-spin"></i> Menyimpan...</>
          ) : (
            <><i className="fas fa-save"></i> Simpan Grup</>
          )}
        </button>
      </div>
    </div>
  );
}
