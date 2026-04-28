import { useState } from 'react';
import { db, generateId } from '../firebase/config';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Screen } from '../App';

interface Props {
  profile: any;
  activeGroup: any;
  setScreen: (screen: Screen) => void;
}

export default function GroupDetails({ profile, activeGroup: g, setScreen }: Props) {
  const [activeTab, setActiveTab] = useState<'anggota' | 'riwayat'>('anggota');
  const [shuffling, setShuffling] = useState(false);
  const [winner, setWinner] = useState<any>(null);
  const isBandar = profile?.role === 'bandar';

  const formatRp = (angka: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
  };

  const updateParticipants = async (newParticipants: any[]) => {
    await updateDoc(doc(db, 'groups', g.id), { participants: newParticipants });
  };

  const handlePayToggle = async (idx: number) => {
    const p = g.participants[idx];
    const actionText = p.isPaid ? "membatalkan status LUNAS" : "menandai sebagai LUNAS";

    if (!confirm(`Apakah Anda yakin ingin ${actionText} untuk anggota ${p.name}?`)) return;

    const newParticipants = [...g.participants];
    newParticipants[idx].isPaid = !newParticipants[idx].isPaid;
    await updateParticipants(newParticipants);
  };

  const handleEditParticipant = async (idx: number) => {
    const p = g.participants[idx];
    const newName = prompt('Edit Nama:', p.name);
    if (newName === null) return;
    const newPhone = prompt('Edit No HP:', p.phone);
    if (newPhone === null) return;

    const newParticipants = [...g.participants];
    newParticipants[idx].name = newName.trim() || p.name;
    newParticipants[idx].phone = newPhone.trim() || p.phone;
    await updateParticipants(newParticipants);
  };

  const handleDeleteParticipant = async (idx: number) => {
    if (!confirm('Hapus anggota ini dari grup?')) return;
    const newParticipants = g.participants.filter((_: any, i: number) => i !== idx);
    await updateParticipants(newParticipants);
  };

  const handleAddParticipant = async () => {
    const name = prompt('Nama Lengkap:');
    const phone = prompt('No. HP / WA:')?.replace(/\D/g, '');
    if (!name || !phone) return;

    if (g.participants.some((p: any) => p.phone === phone)) {
      return alert('Nomor HP ini sudah ada di grup!');
    }

    const newParticipants = [...g.participants, {
      id: generateId(),
      name,
      phone,
      hasWon: false,
      wonRound: null,
      isPaid: false
    }];

    await updateDoc(doc(db, 'groups', g.id), {
      participants: newParticipants,
      memberIds: [...g.memberIds, phone]
    });
  };

  const handleStartKocok = async () => {
    const eligible = g.participants.filter((p: any) => p.isPaid && !p.hasWon);

    if (eligible.length === 0) {
      const belumMenang = g.participants.filter((p: any) => !p.hasWon);
      if (belumMenang.length === 0 && g.participants.length > 0) {
        if (confirm('Luar biasa! Semua anggota sudah dapat arisan. Mulai siklus putaran baru (Reset data giliran)?')) {
          const resetParticipants = g.participants.map((p: any) => ({
            ...p, hasWon: false, wonRound: null, isPaid: false
          }));
          await updateDoc(doc(db, 'groups', g.id), {
            participants: resetParticipants,
            cycle: (g.cycle || 1) + 1
          });
        }
      } else {
        alert('TIDAK BISA MENGOCOK:\nBelum ada anggota yang LUNAS di antara mereka yang belum dapat giliran.');
      }
      return;
    }

    setShuffling(true);

    // Animation
    await new Promise(r => setTimeout(r, 1500));

    const luckyWinner = eligible[Math.floor(Math.random() * eligible.length)];
    const roundNum = g.participants.filter((p: any) => p.hasWon).length + 1;

    const newParticipants = g.participants.map((p: any) => {
      if (p.id === luckyWinner.id) {
        return { ...p, hasWon: true, wonRound: roundNum };
      }
      return p;
    });

    await updateParticipants(newParticipants);
    setWinner({ ...luckyWinner, wonRound: roundNum, pot: g.contributionAmount * g.participants.length });
    setShuffling(false);
  };

  const handleCloseWinnerModal = async () => {
    // Auto-reset semua anggota menjadi BELUM BAYAR setelah undian
    const resetParticipants = g.participants.map((p: any) => ({ ...p, isPaid: false }));
    await updateParticipants(resetParticipants);
    setWinner(null);
  };

  const handleDeleteGroup = async () => {
    if (confirm('PERINGATAN: Yakin ingin menghapus grup ini beserta semua data di dalamnya?')) {
      await deleteDoc(doc(db, 'groups', g.id));
      setScreen('dashboard');
    }
  };

  const handleWA = (p: any) => {
    if (!p.phone) return alert('Nomor HP tidak tersedia');
    let phone = p.phone.replace(/\D/g, '');
    if (phone.startsWith('0')) phone = '62' + phone.substring(1);

    const msg = p.isPaid
      ? `Halo Bunda ${p.name}, uang arisan grup *${g.name}* bulan ini sudah lunas masuk rekap ya. Terima kasih!`
      : `Halo Bunda ${p.name}, mengingatkan untuk setoran arisan grup *${g.name}* sebesar *${formatRp(g.contributionAmount)}* ya. Yuk segera diselesaikan, terima kasih!`;

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const totalPot = g.contributionAmount * g.participants.length;

  return (
    <div className="content">
      {/* Stats Card */}
      <div className="card" style={{ paddingTop: '25px' }}>
        <div className="info-grid">
          <div className="info-box">
            <p>Setoran/Bln</p>
            <h4>{formatRp(g.contributionAmount)}</h4>
          </div>
          <div className="info-box">
            <p>Anggota</p>
            <h4>{g.participants.length} Orang</h4>
          </div>
          <div className="info-box full">
            <p>Total Tarikan Pemenang</p>
            <h4>{formatRp(totalPot)}</h4>
          </div>
        </div>
        <div className="text-center" style={{
          background: 'rgba(255,255,255,0.05)',
          padding: '8px',
          borderRadius: '10px',
          marginTop: '10px'
        }}>
          <span style={{
            fontSize: '0.85rem',
            color: 'var(--text-primary)',
            fontWeight: 600
          }}>
            Siklus Putaran Ke-{g.cycle || 1}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'anggota' ? 'active' : ''}`}
          onClick={() => setActiveTab('anggota')}
        >
          Data Anggota
        </button>
        <button
          className={`tab ${activeTab === 'riwayat' ? 'active' : ''}`}
          onClick={() => setActiveTab('riwayat')}
        >
          Riwayat Undian
        </button>
      </div>

      {/* Content Anggota */}
      {activeTab === 'anggota' && (
        <>
          {/* Add Member Card - Admin Only */}
          {isBandar && (
            <div className="card">
              <h4 className="mb-3" style={{ fontSize: '1rem' }}>
                <i className="fas fa-user-plus"></i> Tambah Anggota
              </h4>
              <button
                className="btn btn-outline"
                style={{ borderColor: 'var(--primary-color)', color: 'var(--primary-color)' }}
                onClick={handleAddParticipant}
              >
                <i className="fas fa-plus"></i> Tambah Anggota Baru
              </button>
            </div>
          )}

          {/* Members List */}
          {g.participants.length === 0 ? (
            <div className="card text-center">
              <p style={{ color: 'var(--text-secondary)' }}>Belum ada anggota.</p>
            </div>
          ) : (
            g.participants.map((p: any, idx: number) => {
              const isMe = p.phone === profile?.phone;
              const wonClass = p.hasWon ? 'won' : '';

              return (
                <div key={p.id} className={`list-item ${wonClass}`} style={isMe ? { border: '1px solid var(--primary-color)' } : {}}>
                  <div className="item-header">
                    <div className="item-info">
                      <h4>
                        {p.name}
                        {isMe && <span style={{ fontSize: '0.7rem', color: 'var(--primary-color)', marginLeft: '8px' }}>(Anda)</span>}
                      </h4>
                      <p>
                        <i className="fas fa-phone-alt" style={{ fontSize: '0.7rem' }}></i> {p.phone || '-'}
                      </p>
                      <div style={{ marginTop: '5px' }}>
                        {p.hasWon ? (
                          <span className="badge badge-won">
                            <i className="fas fa-check-circle"></i> Sudah Dapat
                          </span>
                        ) : (
                          <span className="badge badge-wait">
                            <i className="fas fa-hourglass-half"></i> Menunggu
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Toggle Switch */}
                    {isBandar ? (
                      <div className="toggle-wrapper" onClick={() => handlePayToggle(idx)}>
                        <span className={`toggle-status ${p.isPaid ? 'status-lunas' : 'status-belum'}`}>
                          {p.isPaid ? 'LUNAS' : 'BELUM'}
                        </span>
                        <div className={`native-switch ${p.isPaid ? 'active' : ''}`}></div>
                      </div>
                    ) : (
                      <div className="toggle-wrapper">
                        <span className={`toggle-status ${p.isPaid ? 'status-lunas' : 'status-belum'}`}>
                          {p.isPaid ? 'LUNAS' : 'BELUM'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Admin Actions */}
                  {isBandar && (
                    <div className="action-row">
                      <button
                        className="btn-sm"
                        style={{ color: '#3b82f6', background: 'rgba(59, 130, 246, 0.1)' }}
                        onClick={() => handleEditParticipant(idx)}
                      >
                        <i className="fas fa-edit"></i> Edit
                      </button>
                      <button
                        className="btn-sm"
                        style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.1)' }}
                        onClick={() => handleWA(p)}
                      >
                        <i className="fab fa-whatsapp"></i> Chat
                      </button>
                      <button
                        className="btn-sm"
                        style={{ color: 'var(--danger-color)', background: 'rgba(239, 68, 68, 0.1)', maxWidth: '50px' }}
                        onClick={() => handleDeleteParticipant(idx)}
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </>
      )}

      {/* Content Riwayat */}
      {activeTab === 'riwayat' && (
        <div className="card" style={{ padding: '10px' }}>
          {(() => {
            const history = g.participants
              .filter((p: any) => p.hasWon && p.wonRound)
              .map((p: any) => ({
                name: p.name,
                round: p.wonRound,
                pot: totalPot
              }))
              .sort((a: any, b: any) => a.round - b.round);

            if (history.length === 0) {
              return (
                <div className="text-center" style={{ padding: '20px' }}>
                  <p style={{ color: 'var(--text-secondary)' }}>Belum ada riwayat undian.</p>
                </div>
              );
            }

            return history.map((h: any, i: number) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '15px',
                  padding: '15px',
                  borderBottom: i < history.length - 1 ? '1px solid var(--border-color)' : 'none'
                }}
              >
                <div style={{
                  background: 'rgba(245, 158, 11, 0.1)',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <i className="fas fa-trophy" style={{ color: 'var(--warning-color)' }}></i>
                </div>
                <div style={{ flexGrow: 1 }}>
                  <div style={{
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    fontSize: '1.05rem'
                  }}>{h.name}</div>
                  <div style={{
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)',
                    marginTop: '2px'
                  }}>
                    <i className="fas fa-hashtag"></i> Putaran ke-{h.round}
                  </div>
                </div>
                <div style={{
                  textAlign: 'right',
                  fontWeight: 700,
                  color: 'var(--primary-color)'
                }}>
                  {formatRp(h.pot)}
                </div>
              </div>
            ));
          })()}
        </div>
      )}

      {/* FAB Kocok - Admin Only */}
      {isBandar && activeTab === 'anggota' && !winner && (
        <div className="fab-container">
          <button className="fab-kocok" onClick={handleStartKocok} disabled={shuffling}>
            {shuffling ? (
              <><i className="fas fa-spinner fa-spin fa-lg"></i> MENGOCOK...</>
            ) : (
              <><i className="fas fa-dice fa-lg"></i> KOCOK PEMENANG</>
            )}
          </button>
        </div>
      )}

      {/* Celebration Effects */}
      {winner && (
        <div className="celebration-overlay">
          {/* Floating Icons */}
          {[...Array(12)].map((_, i) => (
            <i
              key={i}
              className={`fas fa-${['star', 'gift', 'trophy', 'heart', 'gem', 'crown'][i % 6]}`}
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                color: ['#f59e0b', '#ec4899', '#a855f7', '#10b981', '#3b82f6', '#fbbf24'][i % 6]
              }}
              className={`floating-icon fas fa-${['star', 'gift', 'trophy', 'heart', 'gem', 'crown'][i % 6]}`}
            />
          ))}
          {/* Confetti */}
          {[...Array(20)].map((_, i) => (
            <div
              key={`confetti-${i}`}
              className="confetti"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                background: ['#a855f7', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444'][i % 6]
              }}
            />
          ))}
          {/* Money Rain */}
          {[...Array(8)].map((_, i) => (
            <i
              key={`money-${i}`}
              className="fas fa-money-bill-wave money-rain"
              style={{
                left: `${10 + (i * 10)}%`,
                animationDelay: `${i * 0.3}s`,
                color: '#10b981'
              }}
            />
          ))}
        </div>
      )}

      {/* Winner Modal */}
      {winner && (
        <div className="modal-overlay show">
          <div className="winner-box-enhanced">
            {/* Sparkles */}
            {[...Array(6)].map((_, i) => (
              <div
                key={`sparkle-${i}`}
                className="sparkle"
                style={{
                  top: `${20 + Math.random() * 60}%`,
                  left: `${10 + Math.random() * 80}%`,
                  animationDelay: `${i * 0.2}s`
                }}
              />
            ))}

            <div style={{ position: 'relative', zIndex: 1 }}>
              {/* Crown Icon */}
              <div style={{
                background: 'rgba(245, 158, 11, 0.15)',
                width: '90px',
                height: '90px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px auto',
                border: '2px solid rgba(245, 158, 11, 0.3)'
              }}>
                <i className="fas fa-crown crown-icon"></i>
              </div>

              {/* Congratulations Text */}
              <h3 className="congrats-text">SELAMAT KEPADA</h3>

              {/* Big Winner Name */}
              <div className="winner-name-big">
                {winner.name}
              </div>

              {/* Winner Message */}
              <p style={{
                color: 'var(--text-secondary)',
                fontSize: '0.9rem',
                marginBottom: '20px',
                animation: 'fade-slide-down 0.8s ease-out 0.3s both'
              }}>
                <i className="fas fa-trophy" style={{ color: 'var(--warning-color)', marginRight: '5px' }}></i>
                Pemenang Putaran Ke-{winner.wonRound}
              </p>

              {/* Pot Amount Box */}
              <div style={{
                background: 'rgba(0,0,0,0.3)',
                padding: '20px',
                borderRadius: '20px',
                marginBottom: '25px',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                animation: 'pop 0.6s ease-out 0.5s both'
              }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '8px' }}>
                  <i className="fas fa-wallet" style={{ marginRight: '5px' }}></i>
                  Mendapatkan Tarikan
                </p>
                <div className="pot-amount">
                  {formatRp(winner.pot)}
                </div>
              </div>

              {/* Action Button */}
              <button
                className="btn btn-primary"
                onClick={handleCloseWinnerModal}
                style={{ animation: 'fade-slide-down 0.6s ease-out 0.7s both' }}
              >
                <i className="fas fa-check"></i> Selesai & Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Group - Admin Only */}
      {isBandar && (
        <div className="card" style={{ marginTop: '20px' }}>
          <button
            className="btn btn-outline"
            style={{ color: 'var(--danger-color)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
            onClick={handleDeleteGroup}
          >
            <i className="fas fa-trash"></i> Hapus Grup
          </button>
        </div>
      )}
    </div>
  );
}
