import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Users, Shield, Library, X, FileText, Book as BookIcon, 
  Activity, LogOut, Database, CheckCircle, XCircle, Info, KeyRound, GraduationCap,
  PlusCircle, Edit3, Trash2, Check, Star, User, Camera, Trophy, Home
} from 'lucide-react';

// OTOMATIS MENDETEKSI IP/LOCALHOST (Tidak perlu input manual lagi)
const HOST = window.location.hostname || 'localhost';
const API_URL = `http://${HOST}:5000/api`;

export default function App() {
  // Auth State
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState('siswa'); // 'siswa' atau 'admin'
  
  // Data State
  const [books, setBooks] = useState([]);
  const [serverStatus, setServerStatus] = useState('checking'); 
  
  // UI State
  const [currentView, setCurrentView] = useState('home'); 
  const [notification, setNotification] = useState(null);
  const [readingBook, setReadingBook] = useState(null);
  const [adminTab, setAdminTab] = useState('siswa');

  // Form State
  const [loginForm, setLoginForm] = useState({ username: '', password: '', nisn: '' });
  const [studentInput, setStudentInput] = useState({ nisn: '', grade: 'X', sub: '1' });
  const [profileForm, setProfileForm] = useState({ name: '', avatarBase64: '' });
  const [bookForm, setBookForm] = useState({ title: '', author: '', grade: 'X', category: 'Umum', coverBase64: '', fileBase64: '' });
  const [stats, setStats] = useState({ active: 0, reading: 0, totalVisits: 0 });

  // --- SINKRONISASI SERVER OTOMATIS ---
  useEffect(() => {
    let isMounted = true;

    const checkServer = async () => {
      try {
        const res = await fetch(`${API_URL}/books`);
        if (res.ok && isMounted) {
          const data = await res.json();
          setBooks(data);
          setServerStatus('online');
        } else {
          if (isMounted) setServerStatus('offline');
        }
      } catch (e) {
        if (isMounted) {
          setServerStatus('offline');
          setBooks([]); 
        }
      }
    };

    checkServer();

    const interval = setInterval(() => {
      if (serverStatus === 'online') {
        fetch(`${API_URL}/stats`)
          .then(r => r.json())
          .then(data => { if(isMounted) setStats(data); })
          .catch(() => { if(isMounted) setServerStatus('offline'); });
          
        fetch(`${API_URL}/stats/heartbeat`, { method: 'POST' }).catch(() => {});
      }
    }, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [serverStatus]);

  const showNotif = (msg, type = 'success') => setNotification({ msg, type });

  // --- LOGIC GAMIFICATION ---
  const calculateLevel = (xp) => Math.floor((xp || 0) / 100) + 1;
  const getXpProgress = (xp) => ((xp || 0) % 100);

  const addXP = async (amount, reason) => {
    if (!user || user.level === 'Admin') return;
    try {
      const res = await fetch(`${API_URL}/users/${user.id}/add-xp`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount })
      });
      const data = await res.json();
      setUser({ ...user, xp: data.xp });
      showNotif(`+${amount} XP! (${reason})`);
    } catch (e) {}
  };

  // --- AUTH LOGIC (DIPERBAIKI & DISIMPLIFIKASI) ---
  const handleLogin = async (e) => {
    e.preventDefault();
    
    // BACKUP ADMIN LOGIN (Pasti Bisa Masuk)
    if (userType === 'admin' && loginForm.username === 'admin' && loginForm.password === 'admin1234') {
        setUser({ id: 'admin-0', name: 'Super Admin', level: 'Admin', username: 'admin' });
        showNotif('Login Admin Berhasil');
        setCurrentView('admin');
        return;
    }

    const payload = userType === 'admin' 
        ? { is_admin: true, username: loginForm.username, password: loginForm.password }
        : { is_admin: false, nisn: loginForm.nisn };

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (res.ok) {
        setUser(data);
        showNotif(`Login Sukses, ${data.name.split('_')[0]}`);
        setProfileForm({ name: data.name, avatarBase64: data.avatar || '' });
        if(data.level === 'Admin') setCurrentView('admin');
        else addXP(5, "Login Harian");
      } else {
        showNotif(data.message || "Gagal Login", "error");
      }
    } catch (e) { 
      showNotif("Server Terputus / Tidak Aktif", "error"); 
    }
  };

  // --- PROFILE LOGIC ---
  const convertToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/users/${user.id}/profile`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: profileForm.name, avatar: profileForm.avatarBase64 })
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data);
        showNotif("Profil diperbarui!");
      }
    } catch (e) { showNotif("Gagal perbarui", "error"); }
  };

  // --- TAMPILAN JIKA SERVER MATI (SIMPLE & JELAS) ---
  if (serverStatus === 'offline') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-center font-sans">
        <div className="bg-white p-10 rounded-[3rem] shadow-2xl max-w-md border-t-8 border-red-500 animate-fadeIn w-full">
          <Activity size={60} className="mx-auto text-red-500 mb-6 animate-pulse" />
          <h1 className="text-3xl font-black text-gray-800 uppercase italic">Server Offline</h1>
          <p className="text-gray-500 mt-4 font-medium">Server pusat (Node.js) belum aktif atau tidak dapat diakses.</p>
          <p className="text-xs text-gray-400 mt-2 mb-6">Silakan jalankan <code className="bg-gray-100 px-2 py-1 rounded">node server.js</code> di komputermu.</p>
          
          <button onClick={() => window.location.reload()} className="w-full bg-blue-900 text-white font-black py-4 rounded-2xl uppercase tracking-widest hover:bg-blue-800 shadow-xl transition-all active:scale-95">
            Muat Ulang Web
          </button>
        </div>
      </div>
    );
  }

  // --- TAMPILAN LOGIN ---
  if (!user) {
    return (
      <div className="min-h-screen bg-blue-950 flex flex-col items-center justify-center p-4">
        <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden mt-8 animate-fadeIn">
          <div className="bg-yellow-400 p-8 text-center relative">
            <Library size={40} className="mx-auto text-blue-900 mb-2" />
            <h2 className="font-black text-2xl text-blue-900 uppercase italic tracking-tighter">Smansa Library</h2>
            <p className="text-[10px] font-bold text-blue-800 uppercase tracking-[0.4em]">Sistem Pintar SMAN 1 Soppeng</p>
          </div>
          
          <div className="flex border-b border-gray-100">
            <button onClick={() => setUserType('siswa')} className={`flex-1 py-4 text-xs font-black uppercase flex justify-center items-center gap-2 transition-colors ${userType === 'siswa' ? 'bg-blue-50 text-blue-900 border-b-4 border-blue-900' : 'text-gray-400'}`}><GraduationCap size={16}/> Siswa</button>
            <button onClick={() => setUserType('admin')} className={`flex-1 py-4 text-xs font-black uppercase flex justify-center items-center gap-2 transition-colors ${userType === 'admin' ? 'bg-blue-50 text-blue-900 border-b-4 border-blue-900' : 'text-gray-400'}`}><KeyRound size={16}/> Admin</button>
          </div>

          <div className="p-8">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-2xl mb-4 text-center text-xs font-bold text-blue-800">
                {userType === 'siswa' ? 'Masukkan NISN untuk otomatis membuat akun atau login.' : 'Masuk sebagai Petugas Perpustakaan.'}
              </div>
              
              {userType === 'admin' ? (
                <>
                  <input required placeholder="Username Admin" className="w-full p-4 bg-gray-50 border rounded-2xl outline-none focus:border-blue-500" value={loginForm.username} onChange={e => setLoginForm({...loginForm, username: e.target.value})} />
                  <input required type="password" placeholder="Password Admin" className="w-full p-4 bg-gray-50 border rounded-2xl outline-none font-mono focus:border-blue-500" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} />
                  <p className="text-[9px] text-gray-400 text-center font-bold">Default: admin / admin1234</p>
                </>
              ) : (
                <input required placeholder="Masukkan NISN Kamu" className="w-full p-5 bg-gray-50 border-2 rounded-2xl outline-none focus:border-blue-500 font-mono text-center text-lg tracking-widest" value={loginForm.nisn} onChange={e => setLoginForm({...loginForm, nisn: e.target.value})} />
              )}
              
              <button className="w-full bg-blue-900 text-white p-4 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-800 transition-all mt-4">Masuk Sistem</button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // --- RENDERER DASHBOARD (UNTUK LAPTOP & HP) ---
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans pb-24 md:pb-0">
      
      {/* NAVBAR DESKTOP (Hanya muncul di Laptop/PC) */}
      <nav className="bg-blue-900 text-white p-5 shadow-xl sticky top-0 z-50 hidden md:block">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentView('home')}>
            <div className="bg-yellow-400 p-2 rounded-xl text-blue-900"><Library size={24}/></div>
            <span className="font-black text-xl tracking-tighter uppercase italic">SMANSA</span>
          </div>
          <div className="flex items-center gap-6">
            <button onClick={() => setCurrentView('home')} className={`font-black text-xs uppercase tracking-widest transition-colors ${currentView==='home'?'text-yellow-400':'hover:text-yellow-400'}`}>Beranda</button>
            {user.level !== 'Admin' && <button onClick={() => setCurrentView('profile')} className={`font-black text-xs uppercase tracking-widest transition-colors ${currentView==='profile'?'text-yellow-400':'hover:text-yellow-400'}`}>Profil Saya</button>}
            {user.level === 'Admin' && <button onClick={() => setCurrentView('admin')} className={`font-black text-xs uppercase tracking-widest flex items-center gap-1 transition-colors ${currentView==='admin'?'text-yellow-400':'text-gray-300'}`}><Shield size={14}/> Panel Admin</button>}
            <button onClick={() => setUser(null)} className="p-2 bg-red-500/20 text-red-300 rounded-xl hover:bg-red-500/40"><LogOut size={20}/></button>
          </div>
        </div>
      </nav>

      {/* KONTEN UTAMA */}
      <main className="flex-grow p-4 md:p-10 max-w-7xl mx-auto w-full">
        
        {/* BERANDA SISWA / KATALOG */}
        {currentView === 'home' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Header Gamification */}
            <div className="bg-blue-900 p-8 md:p-12 rounded-[2.5rem] text-white relative overflow-hidden shadow-2xl border-b-8 border-yellow-400">
               <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                  <div>
                    <h1 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter leading-none mb-2">Halo, {user.name.split(' ')[0]}!</h1>
                    {user.level !== 'Admin' && <p className="text-yellow-400 font-bold uppercase tracking-widest text-xs">Siswa Kelas {user.grade}-{user.subClass}</p>}
                    {user.level === 'Admin' && <p className="text-yellow-400 font-bold uppercase tracking-widest text-xs">Akses Petugas Perpustakaan</p>}
                  </div>
                  
                  {user.level !== 'Admin' && (
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-3xl w-full md:w-64 text-center">
                        <div className="flex justify-between items-end mb-2">
                            <span className="font-black uppercase tracking-widest text-xs"><Star className="inline w-4 text-yellow-400 mb-1"/> Level {calculateLevel(user.xp)}</span>
                            <span className="text-[10px] font-bold opacity-70">{user.xp} XP</span>
                        </div>
                        <div className="w-full bg-black/30 rounded-full h-3 overflow-hidden">
                            <div className="bg-yellow-400 h-3 rounded-full transition-all duration-1000" style={{width: `${getXpProgress(user.xp)}%`}}></div>
                        </div>
                    </div>
                  )}
               </div>
            </div>

            {/* Grid Buku */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
              {books.map(book => (
                <div key={book.id} className="bg-white rounded-[2rem] shadow-md hover:shadow-2xl transition-all overflow-hidden flex flex-col">
                  <div className="h-40 md:h-64 bg-slate-100 relative overflow-hidden">
                    <img src={book.cover || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=300'} className="w-full h-full object-cover" />
                    <div className="absolute top-2 left-2 bg-blue-900 text-yellow-400 text-[8px] font-black px-2 py-1 rounded-lg uppercase">Kelas {book.grade}</div>
                  </div>
                  <div className="p-4 md:p-6 flex-grow flex flex-col justify-between">
                    <div>
                      <h3 className="font-black text-gray-800 text-sm md:text-lg leading-tight mb-1 line-clamp-2">{book.title}</h3>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest italic">{book.author}</p>
                    </div>
                    <button 
                      onClick={() => {
                        setReadingBook(book);
                        addXP(10, "Membaca Buku");
                      }}
                      className="w-full mt-4 bg-blue-100 text-blue-900 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-900 hover:text-white transition-all"
                    >
                      Baca (+10 XP)
                    </button>
                  </div>
                </div>
              ))}
              {books.length === 0 && (
                <div className="col-span-full py-20 text-center text-gray-400">
                  <Library size={48} className="mx-auto mb-4 opacity-20" />
                  <p className="font-bold uppercase tracking-widest text-sm">Belum ada buku tersedia.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* PROFIL & GAMIFICATION */}
        {currentView === 'profile' && user.level !== 'Admin' && (
            <div className="animate-fadeIn max-w-2xl mx-auto space-y-6">
                <div className="bg-white p-8 rounded-[3rem] shadow-xl text-center border-t-8 border-yellow-400 relative">
                    <div className="w-32 h-32 mx-auto rounded-full bg-blue-100 border-4 border-white shadow-xl overflow-hidden relative mb-4 flex items-center justify-center">
                        {profileForm.avatarBase64 ? (
                            <img src={profileForm.avatarBase64} className="w-full h-full object-cover"/>
                        ) : (
                            <User size={64} className="text-blue-300"/>
                        )}
                        <label className="absolute bottom-0 w-full bg-black/50 text-white p-2 cursor-pointer hover:bg-black/70 flex justify-center transition-colors">
                            <Camera size={14}/>
                            <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                                if(e.target.files[0]) {
                                    const b64 = await convertToBase64(e.target.files[0]);
                                    setProfileForm({...profileForm, avatarBase64: b64});
                                }
                            }} />
                        </label>
                    </div>

                    <h2 className="text-2xl font-black text-gray-800 uppercase">{user.name}</h2>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">NISN: {user.nisn} • Kelas {user.grade}-{user.subClass}</p>

                    <form onSubmit={handleUpdateProfile} className="bg-gray-50 p-6 rounded-3xl space-y-4">
                        <label className="block text-left text-[10px] font-black uppercase text-gray-500">Ubah Nama Tampilan (Samaran)</label>
                        <input required className="w-full p-4 border rounded-2xl bg-white font-bold outline-none focus:border-blue-500" value={profileForm.name} onChange={e => setProfileForm({...profileForm, name: e.target.value})} />
                        <button type="submit" className="w-full bg-blue-900 text-white font-black py-4 rounded-2xl uppercase tracking-widest text-xs hover:bg-blue-800 transition-colors">Simpan Profil (+50 XP)</button>
                    </form>
                </div>
            </div>
        )}

        {/* ADMIN DASHBOARD */}
        {currentView === 'admin' && user.level === 'Admin' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex bg-white p-2 rounded-2xl shadow-sm border overflow-x-auto">
              {['koleksi', 'siswa'].map(t => (
                <button key={t} onClick={() => setAdminTab(t)} className={`flex-1 py-3 px-6 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${adminTab === t ? 'bg-blue-900 text-white shadow-md' : 'text-gray-400 hover:bg-gray-50'}`}>
                  Kelola {t}
                </button>
              ))}
            </div>

            {adminTab === 'siswa' && (
              <div className="bg-white p-8 rounded-[2rem] shadow-xl space-y-6">
                <div className="bg-yellow-50 p-4 rounded-2xl border border-yellow-200">
                    <h3 className="font-black text-yellow-800 uppercase text-xs mb-1">Penting!</h3>
                    <p className="text-[10px] text-yellow-700 font-bold">Daftarkan NISN siswa agar mereka bisa masuk ke sistem secara otomatis menggunakan NISN tersebut.</p>
                </div>
                <form onSubmit={async (e) => {
                    e.preventDefault();
                    try {
                        await fetch(`${API_URL}/students/bulk`, {
                            method: 'POST', headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ students: [{ ...studentInput, subClass: studentInput.sub }] })
                        });
                        showNotif(`Siswa terdaftar! Kini NISN ${studentInput.nisn} bisa login.`);
                        setStudentInput({ ...studentInput, nisn: '' });
                    } catch(e) { showNotif("Gagal terkoneksi ke Server", "error"); }
                }} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <input required placeholder="NISN Siswa" className="p-4 bg-gray-50 rounded-xl border text-sm font-mono outline-none focus:border-blue-500" value={studentInput.nisn} onChange={e => setStudentInput({...studentInput, nisn: e.target.value})} />
                  <select className="p-4 bg-gray-50 rounded-xl border font-black text-xs outline-none" value={studentInput.grade} onChange={e => setStudentInput({...studentInput, grade: e.target.value})}>
                    <option>X</option><option>XI</option><option>XII</option>
                  </select>
                  <select className="p-4 bg-gray-50 rounded-xl border font-black text-xs outline-none" value={studentInput.sub} onChange={e => setStudentInput({...studentInput, sub: e.target.value})}>
                    {[...Array(11)].map((_, i) => <option key={i+1} value={i+1}>Ruang {i+1}</option>)}
                  </select>
                  <button className="bg-blue-900 text-white rounded-xl font-black text-[10px] uppercase shadow-md hover:bg-blue-800 transition-all">Daftarkan NISN</button>
                </form>
              </div>
            )}

            {adminTab === 'koleksi' && (
              <div className="space-y-6">
                <div className="bg-white p-8 rounded-[2rem] shadow-xl">
                  <h3 className="font-black text-sm uppercase mb-4 flex items-center gap-2"><PlusCircle className="text-blue-600"/> Tambah Koleksi Baru</h3>
                  <form onSubmit={async (e) => {
                      e.preventDefault();
                      const newBook = { id: Date.now().toString(), ...bookForm, type: 'ebook', status: 'approved', cover: bookForm.coverBase64 || 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=300' };
                      try {
                          await fetch(`${API_URL}/books`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newBook) });
                          setBooks([...books, newBook]);
                          showNotif("Buku berhasil diposting!");
                      } catch(e) {}
                  }} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input required className="p-4 border rounded-xl text-sm bg-gray-50 outline-none" placeholder="Judul Buku" value={bookForm.title} onChange={e => setBookForm({...bookForm, title: e.target.value})} />
                    <input required className="p-4 border rounded-xl text-sm bg-gray-50 outline-none" placeholder="Penulis/Mapel" value={bookForm.author} onChange={e => setBookForm({...bookForm, author: e.target.value})} />
                    <select className="p-4 border rounded-xl text-sm font-bold bg-gray-50 outline-none" value={bookForm.grade} onChange={e => setBookForm({...bookForm, grade: e.target.value})}>
                      <option value="X">Kelas X</option><option value="XI">Kelas XI</option><option value="XII">Kelas XII</option>
                    </select>
                    <div className="p-3 border rounded-xl text-xs bg-blue-50 flex items-center md:col-span-2">
                        <FileText size={16} className="text-blue-600 mr-2 shrink-0"/>
                        <input required type="file" accept="application/pdf" onChange={async (e) => {
                            if(e.target.files[0]) {
                                const b64 = await convertToBase64(e.target.files[0]);
                                setBookForm({...bookForm, fileBase64: b64});
                            }
                        }} className="w-full font-bold text-blue-900" />
                    </div>
                    <button type="submit" className="bg-blue-900 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-md hover:bg-blue-800 transition-colors">Simpan Buku</button>
                  </form>
                </div>
                
                {/* Tabel Koleksi */}
                <div className="bg-white rounded-[2rem] shadow-xl overflow-hidden border">
                  <div className="p-6 bg-gray-50 border-b">
                    <h3 className="font-black text-sm uppercase tracking-widest">Daftar Buku Server</h3>
                  </div>
                  <div className="overflow-x-auto p-4">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-white text-[10px] font-black uppercase text-gray-400">
                        <tr>
                          <th className="p-4 border-b">Judul</th>
                          <th className="p-4 border-b">Kelas</th>
                          <th className="p-4 border-b text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {books.map(b => (
                          <tr key={b.id} className="hover:bg-gray-50">
                            <td className="p-4 font-bold text-sm">{b.title}</td>
                            <td className="p-4 text-xs font-black text-blue-600">{b.grade}</td>
                            <td className="p-4 text-center">
                              <button onClick={async () => {
                                if(confirm("Hapus?")) {
                                  await fetch(`${API_URL}/books/${b.id}`, { method: 'DELETE' });
                                  setBooks(books.filter(bk => bk.id !== b.id));
                                  showNotif("Buku Dihapus", "info");
                                }
                              }} className="p-2 bg-red-100 text-red-600 rounded-lg"><Trash2 size={16}/></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}
          </div>
        )}
      </main>

      {/* BOTTOM NAVBAR MOBILE (Hanya muncul di HP) */}
      {user && (
          <nav className="md:hidden fixed bottom-0 w-full bg-white border-t rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-50 px-6 py-4 flex justify-between items-center pb-safe">
              <button onClick={() => setCurrentView('home')} className={`flex flex-col items-center gap-1 transition-all ${currentView==='home'?'text-blue-900 scale-110':'text-gray-400'}`}>
                  <Home fill={currentView==='home'?'currentColor':'none'} size={24}/>
                  <span className="text-[8px] font-black uppercase tracking-widest">Katalog</span>
              </button>
              
              {user.level !== 'Admin' && (
                  <button onClick={() => setCurrentView('profile')} className={`flex flex-col items-center gap-1 transition-all ${currentView==='profile'?'text-blue-900 scale-110':'text-gray-400'}`}>
                      <User fill={currentView==='profile'?'currentColor':'none'} size={24}/>
                      <span className="text-[8px] font-black uppercase tracking-widest">Profilku</span>
                  </button>
              )}

              {user.level === 'Admin' && (
                  <button onClick={() => setCurrentView('admin')} className={`flex flex-col items-center gap-1 transition-all ${currentView==='admin'?'text-blue-900 scale-110':'text-gray-400'}`}>
                      <Shield fill={currentView==='admin'?'currentColor':'none'} size={24}/>
                      <span className="text-[8px] font-black uppercase tracking-widest">Admin</span>
                  </button>
              )}
              
              <button onClick={() => setUser(null)} className="flex flex-col items-center gap-1 text-red-400 hover:text-red-600 transition-all">
                  <LogOut size={24}/>
                  <span className="text-[8px] font-black uppercase tracking-widest">Keluar</span>
              </button>
          </nav>
      )}

      {/* PDF View Modal */}
      {readingBook && (
        <div className="fixed inset-0 z-[200] bg-black/95 flex flex-col p-2 md:p-10 animate-fadeIn pb-20 md:pb-10">
          <div className="max-w-6xl mx-auto w-full h-full bg-white rounded-3xl md:rounded-[3rem] overflow-hidden shadow-2xl flex flex-col relative">
            <div className="p-4 md:p-6 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="bg-yellow-400 p-2 rounded-xl text-blue-900"><BookIcon size={16}/></div>
                <h3 className="font-black text-xs md:text-sm uppercase leading-none line-clamp-1">{readingBook.title}</h3>
              </div>
              <button onClick={() => { setReadingBook(null); fetch(`${API_URL}/stats/reading-stop`, {method:'POST'}); }} className="bg-red-500 p-2 md:p-3 rounded-xl hover:bg-red-600 transition-all"><X size={16}/></button>
            </div>
            <div className="flex-grow bg-slate-100">
              {readingBook.fileBase64 ? (
                <iframe src={readingBook.fileBase64} className="w-full h-full border-none bg-white" />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center opacity-30">
                  <FileText size={80} className="mx-auto mb-4" />
                  <p className="font-black uppercase tracking-widest text-sm">File Tidak Ditemukan</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifikasi */}
      {notification && (
        <div className={`fixed top-10 md:top-auto md:bottom-24 left-1/2 -translate-x-1/2 z-[300] px-6 py-3 md:px-10 md:py-5 rounded-full md:rounded-[2rem] shadow-2xl animate-slideUp flex items-center gap-3 ${notification.type === 'error' ? 'bg-red-600 text-white' : 'bg-blue-900 text-white'}`}>
           {notification.type === 'error' ? <XCircle size={16}/> : <CheckCircle size={16}/>}
           <span className="font-black text-[10px] md:text-xs uppercase tracking-widest">{notification.msg}</span>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translate(-50%, -20px); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }
        @media (min-width: 768px) {
            @keyframes slideUp { from { transform: translate(-50%, 20px); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }
        }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out; }
        .animate-slideUp { animation: slideUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
        .pb-safe { padding-bottom: env(safe-area-inset-bottom, 1rem); }
      `}} />
    </div>
  );
}