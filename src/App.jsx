import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Users, Shield, Library, X, FileText, Book as BookIcon, 
  Activity, LogOut, Database, CheckCircle, XCircle, Info, KeyRound, GraduationCap,
  PlusCircle, Edit3, Trash2, Check, Star, User, Camera, Trophy
} from 'lucide-react';

export default function App() {
  // Pengaturan Jaringan Lokal (WiFi)
  const [serverIp, setServerIp] = useState('localhost');
  const API_URL = `http://${serverIp}:5000/api`;

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

  // Sync Server Dinamis dengan IP
  useEffect(() => {
    let isMounted = true;

    const checkServer = async () => {
      try {
        const res = await fetch(`http://${serverIp}:5000/api/books`);
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

    if (serverStatus === 'checking') {
      checkServer();
    }

    const interval = setInterval(() => {
      if (serverStatus === 'online') {
        fetch(`http://${serverIp}:5000/api/stats`)
          .then(r => r.json())
          .then(data => { if(isMounted) setStats(data); })
          .catch(() => { if(isMounted) setServerStatus('offline'); });
          
        fetch(`http://${serverIp}:5000/api/stats/heartbeat`, { method: 'POST' }).catch(() => {});
      }
    }, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [serverStatus, serverIp]);

  const [stats, setStats] = useState({ active: 0, reading: 0, totalVisits: 0 });

  const showNotif = (msg, type = 'success') => setNotification({ msg, type });

  // --- LOGIC GAMIFICATION (LEVEL) ---
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

  // --- AUTH LOGIC ---
  const handleLogin = async (e) => {
    e.preventDefault();
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
        showNotif(data.message, "error");
      }
    } catch (e) { showNotif("Server Terputus / Diblokir Browser", "error"); }
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

  // --- RENDERER OFFLINE (FORM IP CUSTOM) ---
  if (serverStatus === 'offline') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 md:p-6 text-center font-sans">
        <div className="bg-white p-6 md:p-10 rounded-[3rem] shadow-2xl w-full max-w-md border-t-8 border-red-500 animate-fadeIn">
          <Activity size={60} className="mx-auto text-red-500 mb-6 animate-pulse" />
          <h1 className="text-2xl font-black text-gray-800 uppercase italic">Koneksi Server</h1>
          
          <div className="mt-6 mb-6 text-left">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Alamat IP Server Komputer</label>
            <input 
              type="text" 
              value={serverIp}
              onChange={(e) => setServerIp(e.target.value)}
              placeholder="Contoh: 192.168.1.15"
              className="w-full p-4 border-2 border-gray-200 rounded-2xl font-mono font-bold text-center text-lg outline-none focus:border-blue-500 transition-colors"
            />
            <p className="text-[9px] text-gray-400 mt-2 font-bold leading-relaxed">Jika memakai HP di WiFi yang sama, ubah "localhost" menjadi IPv4 komputermu (misal: 192.168.1.5).</p>
          </div>

          <button 
            onClick={() => setServerStatus('checking')} 
            className="w-full bg-blue-900 text-white font-black py-4 rounded-2xl uppercase tracking-widest hover:bg-blue-800 shadow-xl transition-all active:scale-95"
          >
            Hubungkan Sekarang
          </button>

          <div className="mt-6 p-4 bg-yellow-50 rounded-2xl text-left border border-yellow-200">
            <p className="text-[10px] text-yellow-800 font-black uppercase mb-1"><Info size={12} className="inline mb-0.5 mr-1"/>Penting untuk Akses HP:</p>
            <p className="text-[9px] text-yellow-700 font-medium leading-relaxed">Browser HP mungkin memblokir karena "Mixed Content". Jika gagal konek, buka <b>Site Settings (Pengaturan Situs)</b> di browser HP kamu, lalu izinkan <b>Insecure Content (Konten Tidak Aman)</b> untuk web ini.</p>
          </div>
        </div>
      </div>
    );
  }

  // --- RENDERER LOGIN ---
  if (!user) {
    return (
      <div className="min-h-screen bg-blue-950 flex flex-col items-center justify-center p-4">
        <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden mt-8">
          <div className="bg-yellow-400 p-8 text-center relative">
            <Library size={40} className="mx-auto text-blue-900 mb-2" />
            <h2 className="font-black text-2xl text-blue-900 uppercase italic tracking-tighter">Smansa Library</h2>
            <p className="text-[10px] font-bold text-blue-800 uppercase tracking-[0.4em]">Gamified E-Library</p>
          </div>
          
          <div className="flex border-b border-gray-100">
            <button onClick={() => setUserType('siswa')} className={`flex-1 py-4 text-xs font-black uppercase flex justify-center items-center gap-2 transition-colors ${userType === 'siswa' ? 'bg-blue-50 text-blue-900 border-b-4 border-blue-900' : 'text-gray-400'}`}><GraduationCap size={16}/> Siswa</button>
            <button onClick={() => setUserType('admin')} className={`flex-1 py-4 text-xs font-black uppercase flex justify-center items-center gap-2 transition-colors ${userType === 'admin' ? 'bg-blue-50 text-blue-900 border-b-4 border-blue-900' : 'text-gray-400'}`}><KeyRound size={16}/> Admin</button>
          </div>

          <div className="p-8">
            <form onSubmit={handleLogin} className="space-y-4 animate-fadeIn">
              <div className="bg-blue-50 p-4 rounded-2xl mb-4 text-center text-xs font-bold text-blue-800">
                {userType === 'siswa' ? 'Gunakan NISN saja. Jika pertama kali, akun otomatis dibuat.' : 'Gunakan akun admin default (admin/admin1234).'}
              </div>
              
              {userType === 'admin' ? (
                <>
                  <input required placeholder="Username Admin" className="w-full p-4 bg-gray-50 border rounded-2xl outline-none focus:border-blue-500" value={loginForm.username} onChange={e => setLoginForm({...loginForm, username: e.target.value})} />
                  <input required type="password" placeholder="Password Admin" className="w-full p-4 bg-gray-50 border rounded-2xl outline-none font-mono focus:border-blue-500" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} />
                </>
              ) : (
                <input required placeholder="Masukkan NISN Kamu" className="w-full p-5 bg-gray-50 border-2 rounded-2xl outline-none focus:border-blue-500 font-mono text-center text-lg tracking-widest" value={loginForm.nisn} onChange={e => setLoginForm({...loginForm, nisn: e.target.value})} />
              )}
              
              <button className="w-full bg-blue-900 text-white p-4 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-800 transition-all mt-4">Masuk Sistem</button>
            </form>
          </div>
        </div>
        <p className="mt-8 text-[10px] text-blue-300 uppercase tracking-widest font-black flex items-center gap-2">
            <Activity size={12} className="animate-pulse" /> Terhubung ke Server: {serverIp}
        </p>
      </div>
    );
  }

  // --- RENDERER DASHBOARD UTAMA ---
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans pb-24 md:pb-0">
      
      {/* NAVBAR DESKTOP */}
      <nav className="bg-blue-900 text-white p-5 shadow-xl sticky top-0 z-50 hidden md:block">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentView('home')}>
            <div className="bg-yellow-400 p-2 rounded-xl text-blue-900"><Library size={24}/></div>
            <span className="font-black text-xl tracking-tighter uppercase italic">SMANSA</span>
          </div>
          <div className="flex items-center gap-6">
            <button onClick={() => setCurrentView('home')} className={`font-black text-xs uppercase tracking-widest transition-colors ${currentView==='home'?'text-yellow-400':'hover:text-yellow-400'}`}>Beranda</button>
            {user.level !== 'Admin' && <button onClick={() => setCurrentView('profile')} className={`font-black text-xs uppercase tracking-widest transition-colors ${currentView==='profile'?'text-yellow-400':'hover:text-yellow-400'}`}>Profil Saya</button>}
            {user.level === 'Admin' && <button onClick={() => setCurrentView('admin')} className={`font-black text-xs uppercase tracking-widest flex items-center gap-1 transition-colors ${currentView==='admin'?'text-yellow-400':'text-gray-300'}`}><Shield size={14}/> Admin</button>}
            <button onClick={() => { setUser(null); setServerStatus('checking'); }} className="p-2 bg-red-500/20 text-red-300 rounded-xl hover:bg-red-500/40"><LogOut size={20}/></button>
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
            </div>
          </div>
        )}

        {/* PROFIL & GAMIFICATION */}
        {currentView === 'profile' && user.level !== 'Admin' && (
            <div className="animate-fadeIn max-w-2xl mx-auto space-y-6">
                <div className="bg-white p-8 rounded-[3rem] shadow-xl text-center border-t-8 border-yellow-400 relative">
                    <div className="absolute top-4 right-4 bg-yellow-100 text-yellow-700 px-4 py-2 rounded-2xl font-black uppercase text-[10px] flex items-center gap-1">
                        <Trophy size={14}/> Ranking Aktif
                    </div>
                    
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
                    <p className="text-[10px] text-yellow-700 font-bold">Masukkan NISN siswa di bawah ini agar mereka bisa login di HP mereka masing-masing.</p>
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
                    } catch(e) { showNotif("Gagal terkoneksi ke Server Lokal", "error"); }
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
              </div>
            )}
          </div>
        )}
      </main>

      {/* BOTTOM NAVBAR MOBILE (Khusus HP) */}
      {user && (
          <nav className="md:hidden fixed bottom-0 w-full bg-white border-t rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-50 px-6 py-4 flex justify-between items-center pb-safe">
              <button onClick={() => setCurrentView('home')} className={`flex flex-col items-center gap-1 transition-all ${currentView==='home'?'text-blue-900 scale-110':'text-gray-400'}`}>
                  <Home fill={currentView==='home'?'currentColor':'none'} size={24}/>
                  <span className="text-[8px] font-black uppercase tracking-widest">Katalog</span>
              </button>
              
              {user.level !== 'Admin' && (
                  <button onClick={() => setCurrentView('profile')} className={`flex flex-col items-center gap-1 transition-all ${currentView==='profile'?'text-blue-900 scale-110':'text-gray-400'}`}>
                      <div className="relative">
                          <User fill={currentView==='profile'?'currentColor':'none'} size={24}/>
                          {user.xp > 0 && <span className="absolute -top-1 -right-2 bg-yellow-400 w-2.5 h-2.5 rounded-full border border-white"></span>}
                      </div>
                      <span className="text-[8px] font-black uppercase tracking-widest">Profilku</span>
                  </button>
              )}

              {user.level === 'Admin' && (
                  <button onClick={() => setCurrentView('admin')} className={`flex flex-col items-center gap-1 transition-all ${currentView==='admin'?'text-blue-900 scale-110':'text-gray-400'}`}>
                      <Shield fill={currentView==='admin'?'currentColor':'none'} size={24}/>
                      <span className="text-[8px] font-black uppercase tracking-widest">Admin</span>
                  </button>
              )}
              
              <button onClick={() => { setUser(null); setServerStatus('checking'); }} className="flex flex-col items-center gap-1 text-red-400 hover:text-red-600 transition-all">
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
                <div>
                  <h3 className="font-black text-xs md:text-sm uppercase leading-none line-clamp-1">{readingBook.title}</h3>
                </div>
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
        <div className={`fixed top-10 md:top-auto md:bottom-10 left-1/2 -translate-x-1/2 z-[300] px-6 py-3 md:px-10 md:py-5 rounded-full md:rounded-[2rem] shadow-2xl animate-slideUp flex items-center gap-3 ${notification.type === 'error' ? 'bg-red-600 text-white' : 'bg-blue-900 text-white'}`}>
           {notification.type === 'error' ? <XCircle size={16}/> : <Star fill="currentColor" className="text-yellow-400" size={16}/>}
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