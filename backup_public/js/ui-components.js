import { auth, db, generateId } from './firebase-config.js';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { doc, setDoc, collection, query, where, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

export const initUI = (state, renderScreen) => {
    
    const renderHeader = () => {
        const header = document.createElement('header');
        header.innerHTML = `
            <div>
                <h1 class="logo">Arisan Mami</h1>
                <p style="font-size: 0.8rem; color: #64748b; font-weight: 500;">Buku Arisan Digital</p>
            </div>
            <div style="display: flex; gap: 0.5rem;">
                <button class="btn-ghost" id="logout-btn" style="padding: 0.5rem; border-radius: 0.75rem; background: #fee2e2; color: #ef4444;">
                    <i data-lucide="log-out" style="width: 20px;"></i>
                </button>
            </div>
        `;
        document.getElementById('app').appendChild(header);
        document.getElementById('logout-btn')?.addEventListener('click', async () => {
            if(confirm('Yakin ingin keluar?')) {
                await signOut(auth);
                state.currentScreen = 'login';
                renderScreen();
            }
        });
    };

    const renderLogin = () => {
        const div = document.createElement('div');
        div.className = 'screen';
        div.style.paddingTop = '2rem';
        let activeTab = 'bandar';

        const updateLoginUI = () => {
            div.innerHTML = `
                <div style="text-align: center; margin-bottom: 2rem;">
                    <div style="width: 70px; height: 70px; background: var(--gradient); border-radius: 1.75rem; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.25rem; box-shadow: var(--shadow);">
                        <i data-lucide="heart" style="width: 32px; height: 32px; color: white;"></i>
                    </div>
                    <h1 style="font-size: 2rem; color: var(--foreground);">Masuk MamaArisan</h1>
                </div>
                <div class="tabs" style="margin-bottom: 2rem;">
                    <div class="tab ${activeTab === 'bandar' ? 'active' : ''}" id="tab-login-bandar">BANDAR</div>
                    <div class="tab ${activeTab === 'anggota' ? 'active' : ''}" id="tab-login-anggota">ANGGOTA</div>
                </div>
                <div class="card glass">
                    <div class="input-group">
                        <label>Nomor HP</label>
                        <input type="tel" id="login-phone" class="input" placeholder="08xxxxxxxxxx">
                    </div>
                    <div class="input-group" id="pin-group" style="display: ${activeTab === 'bandar' ? 'block' : 'none'};">
                        <label>PIN / Password</label>
                        <input type="password" id="login-password" class="input" placeholder="******">
                    </div>
                    <button class="btn btn-primary" id="do-login" ${state.isAuthenticating ? 'disabled' : ''}>
                        ${state.isAuthenticating ? '<div class="loader" style="width: 20px; height: 20px; border-width: 2px;"></div>' : 'Masuk Sekarang'}
                    </button>
                    <div id="reg-link" style="display: ${activeTab === 'bandar' ? 'block' : 'none'}; text-align: center; margin-top: 1.5rem;">
                        <p style="font-size: 0.9rem; color: #64748b;">
                            Belum punya akun? <a href="#" id="go-register" style="color: var(--primary); font-weight: 700; text-decoration: none;">Daftar Bandar</a>
                        </p>
                    </div>
                </div>
                <p style="text-align: center; margin-top: 2rem; font-size: 0.8rem; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Aman • Transparan • Terpercaya</p>
            `;

            document.getElementById('tab-login-bandar').onclick = () => { activeTab = 'bandar'; updateLoginUI(); };
            document.getElementById('tab-login-anggota').onclick = () => { activeTab = 'anggota'; updateLoginUI(); };
            
            document.getElementById('do-login').onclick = async () => {
                const phone = document.getElementById('login-phone').value.replace(/\D/g, '');
                const password = activeTab === 'bandar' ? document.getElementById('login-password').value : phone;
                if (!phone || (activeTab === 'bandar' && !password)) return alert('Mohon lengkapi data');
                
                state.isAuthenticating = true;
                renderScreen();
                try {
                    const email = `${phone}@mamaarisan.app`;
                    if (activeTab === 'anggota') {
                        try {
                            await signInWithEmailAndPassword(auth, email, password);
                        } catch (err) {
                            if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found') {
                                try {
                                    const userCred = await createUserWithEmailAndPassword(auth, email, password);
                                    await setDoc(doc(db, 'users', userCred.user.uid), {
                                        uid: userCred.user.uid,
                                        name: 'Anggota',
                                        phone: phone,
                                        role: 'anggota',
                                        createdAt: new Date().toISOString()
                                    });
                                } catch (regErr) {
                                    throw new Error('Nomor HP belum terdaftar sebagai anggota. Hubungi Bandar Anda.');
                                }
                            } else throw err;
                        }
                    } else await signInWithEmailAndPassword(auth, email, password);
                } catch (e) { alert('Gagal: ' + e.message); }
                finally { state.isAuthenticating = false; renderScreen(); }
            };
            
            document.getElementById('go-register')?.addEventListener('click', (e) => {
                e.preventDefault();
                state.currentScreen = 'register';
                renderScreen();
            });
            lucide.createIcons();
        };
        document.getElementById('app').appendChild(div);
        updateLoginUI();
    };

    const renderRegister = () => {
        const div = document.createElement('div');
        div.className = 'screen';
        div.style.paddingTop = '2rem';
        div.innerHTML = `
            <div style="margin-bottom: 2rem; display: flex; align-items: center; gap: 1rem;">
                <button class="btn-ghost" id="back-to-login" style="padding: 0.5rem; background: white; border-radius: 0.75rem;"><i data-lucide="chevron-left"></i></button>
                <h2 style="font-size: 1.5rem;">Daftar Bandar</h2>
            </div>
            <div class="card glass">
                <div class="input-group">
                    <label>Nama Lengkap</label>
                    <input type="text" id="reg-name" class="input" placeholder="Nama Anda">
                </div>
                <div class="input-group">
                    <label>Nomor HP</label>
                    <input type="tel" id="reg-phone" class="input" placeholder="08xxxxxxxxxx">
                </div>
                <div class="input-group">
                    <label>PIN / Password</label>
                    <input type="password" id="reg-password" class="input" placeholder="Minimal 6 karakter">
                </div>
                <button class="btn btn-primary" id="do-register" ${state.isAuthenticating ? 'disabled' : ''}>
                    ${state.isAuthenticating ? '<div class="loader" style="width: 20px; height: 20px; border-width: 2px;"></div>' : 'Buat Akun Sekarang'}
                </button>
            </div>
        `;
        document.getElementById('app').appendChild(div);
        document.getElementById('back-to-login').addEventListener('click', () => {
            state.currentScreen = 'login';
            renderScreen();
        });

        document.getElementById('do-register').addEventListener('click', async () => {
            const name = document.getElementById('reg-name').value;
            const phone = document.getElementById('reg-phone').value.replace(/\D/g, '');
            const password = document.getElementById('reg-password').value;
            if (!name || !phone || !password) return alert('Lengkapi semua data');
            if (password.length < 6) return alert('Password minimal 6 karakter');
            state.isAuthenticating = true;
            renderScreen();
            try {
                const email = `${phone}@mamaarisan.app`;
                const userCred = await createUserWithEmailAndPassword(auth, email, password);
                const profile = { uid: userCred.user.uid, name: name, phone: phone, role: 'bandar', createdAt: new Date().toISOString() };
                await setDoc(doc(db, 'users', userCred.user.uid), profile);
                state.profile = profile;
                state.currentScreen = 'dashboard';
            } catch (e) { alert('Pendaftaran Gagal: ' + e.message); }
            finally { state.isAuthenticating = false; renderScreen(); }
        });
    };

    const renderDashboard = () => {
        const div = document.createElement('div');
        div.className = 'screen';
        let groupsHtml = '';
        if (state.groups.length === 0) {
            groupsHtml = `
                <div class="card" style="border: 2px dashed var(--border); background: transparent; text-align: center; padding: 4rem 1.5rem; box-shadow: none;">
                    <div style="width: 64px; height: 64px; background: white; border-radius: 1.5rem; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem; box-shadow: var(--shadow);">
                        <i data-lucide="plus" style="width: 32px; height: 32px; color: var(--primary);"></i>
                    </div>
                    <h3 style="font-size: 1.25rem; margin-bottom: 0.5rem;">Mulai Arisan Baru</h3>
                    <p style="font-size: 0.9rem; color: #64748b; margin-bottom: 2rem;">Belum ada arisan yang aktif. Yuk buat grup pertama mami!</p>
                    <button class="btn btn-secondary" id="btn-create-first" style="background: white; border: 1px solid var(--border);">Buat Sekarang</button>
                </div>
            `;
        } else {
            state.groups.forEach(g => {
                const progress = Math.round((g.participants.filter(p => p.hasWon).length / g.participants.length) * 100);
                groupsHtml += `
                    <div class="card group-card" data-id="${g.id}" style="cursor: pointer;">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.25rem;">
                            <div>
                                <h3 style="color: var(--foreground); font-size: 1.125rem; margin-bottom: 0.25rem;">${g.name}</h3>
                                <span class="badge" style="background: var(--primary-light); color: var(--primary);">Rp ${g.contributionAmount.toLocaleString('id-ID')}</span>
                            </div>
                            <div style="text-align: right;">
                                <div style="font-size: 0.75rem; font-weight: 700; color: #94a3b8; margin-bottom: 0.25rem;">PROGRES</div>
                                <div style="font-size: 1rem; font-weight: 800; color: var(--secondary);">${progress}%</div>
                            </div>
                        </div>
                        <div style="background: #f1f5f9; height: 6px; border-radius: 3px; margin-bottom: 1.25rem; overflow: hidden;">
                            <div style="background: var(--gradient); width: ${progress}%; height: 100%; border-radius: 3px;"></div>
                        </div>
                        <div style="display: flex; justify-content: space-between; font-size: 0.8rem; color: #64748b; font-weight: 600;">
                            <div style="display: flex; align-items: center; gap: 0.5rem;">
                                <i data-lucide="users" style="width: 16px;"></i> ${g.participants.length} Peserta
                            </div>
                            <div style="display: flex; align-items: center; gap: 0.5rem;">
                                <i data-lucide="repeat" style="width: 16px;"></i> ${g.frequency}
                            </div>
                        </div>
                    </div>
                `;
            });
        }
        div.innerHTML = `
            <div style="margin-bottom: 2rem;">
                <h2 style="font-size: 1.75rem;">Halo, ${state.profile?.name || 'Mami'}! 👋</h2>
                <p style="font-size: 0.95rem; color: #64748b; font-weight: 500;">Ayo cek status arisan hari ini.</p>
            </div>
            ${groupsHtml}
            <div style="height: 40px;"></div>
        `;
        document.getElementById('app').appendChild(div);
        document.getElementById('btn-create-first')?.addEventListener('click', () => {
            state.currentScreen = 'new-group';
            renderScreen();
        });
        document.querySelectorAll('.group-card').forEach(card => {
            card.addEventListener('click', () => {
                const id = card.getAttribute('data-id');
                state.activeGroup = state.groups.find(g => g.id === id);
                state.currentScreen = 'group-details';
                renderScreen();
            });
        });
    };

    const renderNewGroup = () => {
        const div = document.createElement('div');
        div.className = 'screen';
        div.innerHTML = `
            <div style="margin-bottom: 2rem; display: flex; align-items: center; gap: 1rem;">
                <button class="btn-ghost" id="back-to-dash" style="padding: 0.5rem; background: white; border-radius: 0.75rem;"><i data-lucide="chevron-left"></i></button>
                <h2 style="font-size: 1.5rem;">Buat Grup Baru</h2>
            </div>
            <div class="card glass">
                <div class="input-group">
                    <label>Nama Grup Arisan</label>
                    <input type="text" id="new-name" class="input" placeholder="Contoh: Arisan Keluarga">
                </div>
                <div class="input-group">
                    <label>Iuran per Putaran (Rp)</label>
                    <input type="number" id="new-amount" class="input" value="100000">
                </div>
                <div class="input-group">
                    <label>Jumlah Peserta</label>
                    <input type="number" id="new-count" class="input" value="10">
                </div>
                <div class="input-group">
                    <label>Frekuensi Kocokan</label>
                    <select id="new-freq" class="input">
                        <option value="Mingguan">Mingguan</option>
                        <option value="Bulanan" selected>Bulanan</option>
                    </select>
                </div>
                <button class="btn btn-primary" id="save-group"><i data-lucide="save"></i> Simpan & Mulai</button>
            </div>
        `;
        document.getElementById('app').appendChild(div);
        document.getElementById('back-to-dash').addEventListener('click', () => { state.currentScreen = 'dashboard'; renderScreen(); });
        document.getElementById('save-group').addEventListener('click', async () => {
            const name = document.getElementById('new-name').value;
            const amount = parseInt(document.getElementById('new-amount').value);
            const count = parseInt(document.getElementById('new-count').value);
            const frequency = document.getElementById('new-freq').value;
            if (!name) return alert('Nama grup harus diisi');
            if (count < 2) return alert('Peserta minimal 2 orang');
            const btn = document.getElementById('save-group');
            btn.disabled = true; btn.innerHTML = 'Menyimpan...';
            try {
                const id = generateId();
                const participants = Array.from({length: count}, (_, i) => ({ id: generateId(), name: `Peserta ${i+1}`, hasWon: false, wonRound: null, isPaid: false }));
                const newGroup = { id, name, contributionAmount: amount, frequency, creatorId: state.user.uid, memberIds: [state.user.uid, state.profile?.phone].filter(Boolean), participants, createdAt: new Date().toISOString() };
                await setDoc(doc(db, 'groups', id), newGroup);
                state.groups.unshift(newGroup);
                state.currentScreen = 'dashboard';
                renderScreen();
            } catch (e) { alert('Gagal simpan: ' + e.message); btn.disabled = false; btn.innerHTML = '<i data-lucide="save"></i> Simpan & Mulai'; }
        });
    };

    const renderGroupDetails = () => {
        const g = state.activeGroup;
        const isBandar = state.profile?.role === 'bandar';
        const div = document.createElement('div');
        div.className = 'screen';
        div.innerHTML = `
            <div style="margin-bottom: 1.5rem; display: flex; align-items: center; gap: 1rem;">
                <button class="btn-ghost" id="back-to-dash-2" style="padding: 0.5rem; background: white; border-radius: 0.75rem;"><i data-lucide="chevron-left"></i></button>
                <div>
                    <h2 style="font-size: 1.25rem;">${g.name}</h2>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <span class="badge" style="font-size: 0.65rem;">Rp ${g.contributionAmount.toLocaleString('id-ID')}</span>
                        <span style="font-size: 0.75rem; color: #64748b;">• ${g.frequency}</span>
                    </div>
                </div>
            </div>
            <div class="tabs">
                <div class="tab active" data-tab="peserta">Peserta</div>
                ${isBandar ? '<div class="tab" data-tab="kocok">Kocok</div>' : ''}
                <div class="tab" data-tab="info">Info</div>
            </div>
            <div id="tab-content" style="min-height: 300px;"></div>
            <div style="height: 40px;"></div>
        `;
        document.getElementById('app').appendChild(div);
        
        const renderTab = (tabName) => {
            const content = document.getElementById('tab-content');
            content.innerHTML = '';
            if (tabName === 'peserta') {
                let listHtml = '';
                g.participants.forEach((p, idx) => {
                    listHtml += `
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem 0; border-bottom: 1px solid #f1f5f9; gap: 1rem;">
                            <div style="display: flex; align-items: center; gap: 0.75rem; flex: 1;">
                                <div style="width: 32px; height: 32px; background: ${p.hasWon ? '#ecfdf5' : '#f1f5f9'}; color: ${p.hasWon ? '#10b981' : '#64748b'}; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.75rem; flex-shrink: 0;">${idx + 1}</div>
                                <div style="min-width: 0;">
                                    <div style="font-weight: 700; font-size: 0.9rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${p.name}</div>
                                    <div style="font-size: 0.7rem; color: #94a3b8; display: flex; align-items: center; gap: 0.25rem;">
                                        ${p.phone || '-'}
                                        ${isBandar ? `<button class="edit-phone-btn btn-ghost" data-idx="${idx}" style="padding: 2px; height: auto; width: auto;"><i data-lucide="edit-2" style="width: 10px; color: var(--primary);"></i></button>` : ''}
                                    </div>
                                </div>
                            </div>
                            <div style="display: flex; align-items: center; gap: 0.5rem;">
                                ${isBandar ? `
                                    <button class="pay-toggle ${p.isPaid ? 'active' : ''}" data-idx="${idx}" style="padding: 0.4rem 0.6rem; border-radius: 0.5rem; font-size: 0.65rem; font-weight: 800; border: 1px solid ${p.isPaid ? '#10b981' : '#e2e8f0'}; background: ${p.isPaid ? '#ecfdf5' : 'white'}; color: ${p.isPaid ? '#10b981' : '#94a3b8'}; cursor: pointer;">${p.isPaid ? 'LUNAS' : 'BELUM'}</button>
                                    <button class="wa-btn" data-idx="${idx}" style="padding: 0.4rem; border-radius: 0.5rem; background: #25d366; color: white; border: none; display: flex; align-items: center; cursor: pointer;"><i data-lucide="message-circle" style="width: 14px;"></i></button>
                                ` : `${p.isPaid ? '<span class="badge" style="background: #ecfdf5; color: #10b981; font-size: 0.6rem;">LUNAS</span>' : '<span class="badge" style="background: #f1f5f9; color: #94a3b8; font-size: 0.6rem;">BELUM</span>'}`}
                                ${p.hasWon ? '<i data-lucide="trophy" style="color: #f59e0b; width: 16px;"></i>' : ''}
                            </div>
                        </div>
                    `;
                });
                content.innerHTML = `<div class="card">${isBandar ? `<button class="btn btn-secondary" id="btn-add-p" style="margin-bottom: 1.5rem; font-size: 0.8rem; height: 40px; border: 1px solid var(--primary); color: var(--primary); background: var(--primary-light);"><i data-lucide="user-plus" style="width: 16px;"></i> Tambah Anggota</button>` : ''}<div style="font-size: 0.75rem; font-weight: 800; color: #94a3b8; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.05em;">Daftar Peserta & Iuran</div>${listHtml}</div>`;
                lucide.createIcons();
                if (isBandar) {
                    document.querySelectorAll('.pay-toggle').forEach(btn => btn.onclick = async () => { const idx = btn.getAttribute('data-idx'); g.participants[idx].isPaid = !g.participants[idx].isPaid; await updateDoc(doc(db, 'groups', g.id), { participants: g.participants }); renderTab('peserta'); });
                    document.querySelectorAll('.edit-phone-btn').forEach(btn => btn.onclick = async () => { const idx = btn.getAttribute('data-idx'); const p = g.participants[idx]; const newName = prompt('Edit Nama:', p.name); const newPhone = prompt('Edit Nomor HP:', p.phone); if (newName !== null && newPhone !== null) { p.name = newName; p.phone = newPhone.replace(/\D/g, ''); await updateDoc(doc(db, 'groups', g.id), { participants: g.participants }); renderTab('peserta'); } });
                    document.querySelectorAll('.wa-btn').forEach(btn => btn.onclick = () => { const idx = btn.getAttribute('data-idx'); const p = g.participants[idx]; if (!p.phone) return alert('Nomor HP tidak tersedia'); const text = encodeURIComponent(`Halo ${p.name}, ini pengingat iuran Arisan "${g.name}" sebesar Rp ${g.contributionAmount.toLocaleString('id-ID')}. Mohon segera melakukan pembayaran ya. Terima kasih! 🙏`); window.open(`https://wa.me/${p.phone.startsWith('0') ? '62' + p.phone.slice(1) : p.phone}?text=${text}`, '_blank'); });
                    document.getElementById('btn-add-p')?.addEventListener('click', () => {
                        const name = prompt('Nama Peserta:'); const phone = prompt('Nomor HP Peserta (08...):')?.replace(/\D/g, '');
                        if (name && phone) { g.participants.push({ id: generateId(), name, phone, hasWon: false, wonRound: null, isPaid: false }); updateDoc(doc(db, 'groups', g.id), { participants: g.participants, memberIds: [...g.memberIds, phone] }).then(() => renderTab('peserta')); }
                    });
                }
            } else if (tabName === 'kocok') {
                const eligible = g.participants.filter(p => !p.hasWon);
                if (eligible.length === 0) content.innerHTML = `<div class="card" style="text-align: center; padding: 3rem 1.5rem;"><div style="width: 80px; height: 80px; background: #ecfdf5; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem;"><i data-lucide="party-popper" style="width: 40px; height: 40px; color: #10b981;"></i></div><h3>Arisan Selesai!</h3><p style="font-size: 0.875rem; color: #64748b; margin-top: 0.5rem;">Semua peserta sudah mendapatkan bagiannya.</p></div>`;
                else {
                    content.innerHTML = `<div class="card" id="kocok-container" style="text-align: center; padding: 3rem 1.5rem;"><div id="kocok-icon" style="width: 100px; height: 100px; background: var(--primary-light); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 2rem; transition: all 0.3s;"><i data-lucide="trophy" style="width: 50px; height: 50px; color: var(--primary);"></i></div><h3 id="kocok-title">Siap Mengundi?</h3><p id="kocok-desc" style="font-size: 0.875rem; color: #64748b; margin-bottom: 2rem;">Terdapat ${eligible.length} peserta yang belum menang.</p><button class="btn btn-primary" id="start-kocok"><i data-lucide="dices"></i> Kocok Sekarang</button></div>`;
                    document.getElementById('start-kocok').addEventListener('click', async () => {
                        const btn = document.getElementById('start-kocok'); const icon = document.getElementById('kocok-icon'); const title = document.getElementById('kocok-title'); const desc = document.getElementById('kocok-desc');
                        btn.disabled = true; icon.classList.add('shuffling'); title.innerText = 'Mengocok...';
                        await new Promise(r => setTimeout(r, 2000));
                        const winner = eligible[Math.floor(Math.random() * eligible.length)];
                        winner.hasWon = true; winner.wonRound = g.participants.filter(p => p.hasWon).length;
                        g.participants.forEach(p => p.isPaid = false);
                        await updateDoc(doc(db, 'groups', g.id), { participants: g.participants });
                        icon.classList.remove('shuffling'); icon.style.background = '#fef3c7'; icon.innerHTML = '<i data-lucide="sparkles" style="width: 50px; height: 50px; color: #f59e0b;"></i>';
                        title.innerHTML = `<span style="color: #f59e0b">Selamat!</span><br>${winner.name}`; desc.innerText = `Pemenang putaran ke-${winner.wonRound}`;
                        btn.innerHTML = '<i data-lucide="refresh-cw"></i> Selesai'; btn.disabled = false;
                        btn.onclick = () => { renderTab('peserta'); document.querySelectorAll('.tab').forEach(x => x.classList.remove('active')); document.querySelector('[data-tab="peserta"]').classList.add('active'); };
                        lucide.createIcons();
                    });
                }
            } else content.innerHTML = `<div class="card"><div style="margin-bottom: 1.5rem;"><label style="font-size: 0.7rem; font-weight: 800; color: #94a3b8; text-transform: uppercase;">ID Grup</label><div style="font-family: monospace; background: #f8fafc; padding: 0.5rem; border-radius: 0.5rem; font-size: 0.8rem; margin-top: 0.25rem; border: 1px solid #e2e8f0;">${g.id}</div></div><div style="margin-bottom: 1.5rem;"><label style="font-size: 0.7rem; font-weight: 800; color: #94a3b8; text-transform: uppercase;">Total Uang Terkumpul</label><div style="font-size: 1.25rem; font-weight: 800; color: var(--secondary); margin-top: 0.25rem;">Rp ${(g.contributionAmount * g.participants.length).toLocaleString('id-ID')}</div></div>${isBandar ? `<button class="btn btn-secondary" id="delete-group" style="background: #fff1f2; color: #e11d48; border: none;"><i data-lucide="trash-2"></i> Hapus Grup</button>` : ''}</div>`;
            document.getElementById('delete-group')?.addEventListener('click', async () => {
                if(confirm('Yakin ingin menghapus grup ini?')) { await deleteDoc(doc(db, 'groups', g.id)); state.groups = state.groups.filter(x => x.id !== g.id); state.currentScreen = 'dashboard'; renderScreen(); }
            });
            lucide.createIcons();
        };
        renderTab('peserta');
        document.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => { document.querySelectorAll('.tab').forEach(x => x.classList.remove('active')); t.classList.add('active'); renderTab(t.getAttribute('data-tab')); }));
        document.getElementById('back-to-dash-2').addEventListener('click', () => { state.currentScreen = 'dashboard'; renderScreen(); });
    };

    const renderProfile = () => {
        const div = document.createElement('div');
        div.className = 'screen';
        div.innerHTML = `
            <div style="margin-bottom: 2rem;"><h2 style="font-size: 1.75rem;">Akun Saya</h2></div>
            <div class="card glass" style="text-align: center; padding: 2.5rem 1.5rem;">
                <div style="width: 100px; height: 100px; background: #f1f5f9; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem; border: 4px solid white; box-shadow: var(--shadow);"><i data-lucide="user" style="width: 50px; height: 50px; color: #cbd5e1;"></i></div>
                <h3 style="font-size: 1.5rem; margin-bottom: 0.25rem;">${state.profile?.name || 'Mami'}</h3>
                <p style="color: #64748b; font-weight: 500; margin-bottom: 2rem;">${state.profile?.phone || '-'}</p>
                <div style="display: grid; grid-template-cols: 1fr 1fr; gap: 1rem; text-align: left; margin-top: 1rem; border-top: 1px solid #f1f5f9; padding-top: 1.5rem;">
                    <div><div style="font-size: 0.7rem; color: #94a3b8; font-weight: 800;">TOTAL GRUP</div><div style="font-size: 1.25rem; font-weight: 800;">${state.groups.length}</div></div>
                    <div><div style="font-size: 0.7rem; color: #94a3b8; font-weight: 800;">STATUS</div><div class="badge" style="background: #ecfdf5; color: #10b981;">Premium</div></div>
                </div>
            </div>
            <button class="btn btn-secondary" id="logout-profile" style="margin-top: 1rem; background: white; color: #ef4444; border: 1px solid #fee2e2;"><i data-lucide="log-out"></i> Keluar Aplikasi</button>
            <p style="text-align: center; font-size: 0.75rem; color: #cbd5e1; margin-top: 3rem;">Arisan Mami v1.0.0</p>
        `;
        document.getElementById('app').appendChild(div);
        document.getElementById('logout-profile').addEventListener('click', async () => { if(confirm('Yakin ingin keluar?')) { await signOut(auth); state.currentScreen = 'login'; renderScreen(); } });
    };

    const renderBottomNav = () => {
        const nav = document.createElement('div');
        nav.className = 'bottom-nav';
        nav.innerHTML = `
            <div class="nav-item ${state.currentScreen === 'dashboard' ? 'active' : ''}" id="nav-dash"><i data-lucide="layout-grid"></i><span>Beranda</span></div>
            <div class="nav-item ${state.currentScreen === 'new-group' ? 'active' : ''}" id="nav-new"><div style="width: 44px; height: 44px; background: var(--gradient); border-radius: 1rem; display: flex; align-items: center; justify-content: center; color: white; transform: translateY(-15px); box-shadow: 0 8px 15px rgba(236, 72, 153, 0.3);"><i data-lucide="plus" style="width: 24px; height: 24px;"></i></div></div>
            <div class="nav-item ${state.currentScreen === 'profile' ? 'active' : ''}" id="nav-profile"><i data-lucide="user"></i><span>Akun</span></div>
        `;
        document.getElementById('app').appendChild(nav);
        document.getElementById('nav-dash').onclick = () => { state.currentScreen = 'dashboard'; renderScreen(); };
        document.getElementById('nav-new').onclick = () => { state.currentScreen = 'new-group'; renderScreen(); };
        document.getElementById('nav-profile').onclick = () => { state.currentScreen = 'profile'; renderScreen(); };
    };

    return { renderScreen, renderHeader, renderLogin, renderRegister, renderDashboard, renderNewGroup, renderGroupDetails, renderProfile, renderBottomNav };
};
