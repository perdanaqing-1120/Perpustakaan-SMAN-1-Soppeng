import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Users, Shield, Library, X, FileText, Book as BookIcon, 
  Activity, LogOut, Database, CheckCircle, XCircle, Info, KeyRound, GraduationCap,
  PlusCircle, Edit3, Trash2, Check, Star, User, Camera, Trophy, Home, Settings
} from 'lucide-react';

export default function App() {
  // Pengaturan Server dinamis (tersimpan di browser)
  const defaultApiUrl = 'http://localhost:5000/api';
  const [apiUrl, setApiUrl] = useState(localStorage.getItem('smansa_api_url') || defaultApiUrl);
  const [showSettings, setShowSettings] = useState(false);

  // App States
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState('siswa');
  const [books, setBooks] = useState([]);
  const [serverStatus, setServerStatus] = useState('checking'); // online, offline
  const [serverErrorMsg, setServerErrorMsg] = useState('');
  
  // UI States
  const [currentView, setCurrentView] = useState('home'); 
  const [notification, setNotification] = useState(null);
  const [readingBook, setReadingBook] = useState(null);
  const [adminTab, setAdminTab] = useState('koleksi');

  // Form States
  const [loginForm, setLoginForm] = useState({ username: '', password: '', nisn: '' });
  const [studentInput, setStudentInput] = useState({ nisn: '', grade: 'X', sub: '1', name: '' });
  const [profileForm, setProfileForm] = useState({ name: '', avatarBase64: '' });
  const [bookForm, setBookForm] = useState({ title: '', author: '', grade: 'X', category: 'Umum', coverBase64: '', fileBase64: '' });
  const [stats, setStats] = useState({ active: 0, reading: 0, totalVisits: 0 });

  // --- CEK KONEKSI SERVER ---
  useEffect(() => {
    let isMounted = true;
    const checkServer = async () => {
      try {
        const res = await fetch(`${apiUrl}/books`);
        if (res.ok) {
          const data = await res.json();
          if(isMounted) { setBooks(data); setServerStatus('online'); setServerErrorMsg(''); }
        } else {
          if(isMounted) { setServerStatus('offline'); setServerErrorMsg('Server menolak koneksi.'); }
        }
      } catch (e) {
        if (isMounted) {
          setServerStatus('offline');
          setBooks([]); 
          // Cek apakah error karena HTTP vs HTTPS
          if(window.location.protocol === 'https:' && apiUrl.startsWith('http://')) {
             setServerErrorMsg('Diblokir oleh Browser (Mixed Content). Izinkan konten tidak aman di pengaturan situs browser Anda.');
          } else {
             setServerErrorMsg('Server Node.js belum dinyalakan atau IP salah.');
          }
        }
      }
    };

    if (serverStatus === 'checking') checkServer();
    const interval = setInterval(() => {
      if (serverStatus === 'online') {
        fetch(`${apiUrl}/stats`).then(r => r.json()).then(d => { if(isMounted) setStats(d); }).catch(()=>{});
      }
    }, 5000);
    return () => { isMounted = false; clearInterval(interval); };
  }, [serverStatus, apiUrl]);

  const saveServerUrl = (newUrl) => {
      localStorage.setItem('smansa_api_url', newUrl);
      setApiUrl(newUrl);
      setShowSettings(false);
      setServerStatus('checking');
  };

  const showNotif = (msg, type = 'success') => {
      setNotification({ msg, type });
      setTimeout(() => setNotification(null), 3000);
  };

  // --- GAMIFICATION ---
  const calculateLevel = (xp) => Math.floor((xp || 0) / 100) + 1;
  const getXpProgress = (xp) => ((xp || 0) % 100);

  const addXP = async (amount, reason) => {
    if (!user || user.level === 'Admin') return;
    try {
      const res = await fetch(`${apiUrl}/users/${user.id}/add-xp`, {
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
      const res = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data);
        showNotif(`Login Sukses, ${data.name.split('_')[0]}`);
        setProfileForm({ name: data.name, avatarBase64: data.avatar || '' });
        setCurrentView(data.level === 'Admin' ? 'admin' : 'home');
        if(data.level !== 'Admin') addXP(5, "Login Harian");
      } else {
        showNotif(data.message || "Gagal Login", "error");
      }
    } catch (e) { showNotif("Gagal Terhubung ke Server", "error"); }
  };

  // --- FILE TO BASE64 ---
  const convertToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });

  // --- MODAL PENGATURAN SERVER ---
  const ServerSettingsModal = () => (
      showSettings && (
          <div className="fixed inset-0 z-[500] bg-black/80 flex items-center justify-center p-4">
              <div className="bg-white p-8 rounded-3xl w-full max-w-md shadow-2xl relative">
                  <button onClick={() => setShowSettings(false)} className="absolute top-4 right-4 bg-gray-100 p-2 rounded-full hover:bg-red-100 hover:text-red-500"><X size={16}/></button>
                  <div className="flex items-center gap-3 mb-6">
                      <div className="bg-blue-100 text-blue-900 p-3 rounded-xl"><Settings size={24}/></div>
                      <h2 className="text-xl font-black uppercase">Pengaturan Server</h2>
                  </div>
                  <div className="space-y-4">
                      <label className="text-xs font-bold text-gray-500 uppercase">Alamat API Server (URL)</label>
                      <input 
                          type="text" 
                          className="w-full p-4 bg-gray-50 border rounded-xl font-mono text-sm"
                          defaultValue={apiUrl}
                          id="urlInput"
                      />
                      <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200 mt-2">
                          <p className="text-[10px] text-yellow-800 font-bold leading-relaxed">
                              • Jika di Komputer ini: <b>http://localhost:5000/api</b><br/>
                              • Jika akses lewat HP (WiFi sama): <b>http://192.168.x.x:5000/api</b> (Ganti dengan IPv4 komputer).
                          </p>
                      </div>
                      <button onClick={() => saveServerUrl(document.getElementById('urlInput').value)} className="w-full bg-blue-900 text-white font-black py-4 rounded-xl uppercase hover:bg-blue-800">Simpan Koneksi</button>
                  </div>
              </div>
          </div>
      )
  );

  // --- TAMPILAN JIKA SERVER OFFLINE ---
  if (serverStatus === 'offline') {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center font-sans">
        <ServerSettingsModal />
        <div className="bg-white p-10 rounded-[3rem] shadow-2xl max-w-md border-t-8 border-red-500 w-full relative">
          <button onClick={() => setShowSettings(true)} className="absolute top-6 right-6 text-gray-400 hover:text-blue-900"><Settings size={24}/></button>
          <Activity size={60} className="mx-auto text-red-500 mb-6 animate-pulse" />
          <h1 className="text-2xl font-black text-gray-800 uppercase italic">Server Offline</h1>
          <p className="text-sm text-gray-600 mt-4 font-bold">{serverErrorMsg}</p>
          
          <button onClick={() => setServerStatus('checking')} className="w-full mt-6 bg-blue-900 text-white font-black py-4 rounded-2xl uppercase tracking-widest hover:bg-blue-800 shadow-xl transition-all">
            Coba Hubungkan Ulang
          </button>
        </div>
      </div>
    );
  }

  // --- TAMPILAN LOGIN ---
  if (!user) {
    return (
      <div className="min-h-screen bg-blue-950 flex flex-col items-center justify-center p-4">
        <ServerSettingsModal />
        <button onClick={() => setShowSettings(true)} className="absolute top-6 right-6 text-white/50 hover:text-white p-2 bg-black/20 rounded-full"><Settings size={20}/></button>
        
        <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden animate-fadeIn">
          <div className="bg-yellow-400 p-8 text-center relative">
            <Library size={40} className="mx-auto text-blue-900 mb-2" />
            <h2 className="font-black text-2xl text-blue-900 uppercase italic tracking-tighter">Smansa Library</h2>
            <p className="text-[10px] font-bold text-blue-800 uppercase tracking-[0.4em]">Sistem Pintar</p>
          </div>
          
          <div className="flex border-b border-gray-100">
            <button onClick={() => setUserType('siswa')} className={`flex-1 py-4 text-xs font-black uppercase flex justify-center items-center gap-2 ${userType === 'siswa' ? 'bg-blue-50 text-blue-900 border-b-4 border-blue-900' : 'text-gray-400'}`}><GraduationCap size={16}/> Siswa</button>
            <button onClick={() => setUserType('admin')} className={`flex-1 py-4 text-xs font-black uppercase flex justify-center items-center gap-2 ${userType === 'admin' ? 'bg-blue-50 text-blue-900 border-b-4 border-blue-900' : 'text-gray-400'}`}><KeyRound size={16}/> Admin</button>
          </div>

          <div className="p-8">
            <form onSubmit={handleLogin} className="space-y-4">
              {userType === 'admin' ? (
                <>
                  <input required placeholder="Username Admin" className="w-full p-4 bg-gray-50 border rounded-2xl outline-none focus:border-blue-500" value={loginForm.username} onChange={e => setLoginForm({...loginForm, username: e.target.value})} />
                  <input required type="password" placeholder="Password" className="w-full p-4 bg-gray-50 border rounded-2xl outline-none font-mono focus:border-blue-500" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} />
                  <p className="text-[10px] text-gray-400 text-center font-bold">Default Login: admin / admin1234</p>
                </>
              ) : (
                <>
                  <input required placeholder="Masukkan NISN Kamu" className="w-full p-5 bg-gray-50 border-2 border-gray-200 rounded-2xl outline-none focus:border-blue-500 font-mono text-center text-lg tracking-widest" value={loginForm.nisn} onChange={e => setLoginForm({...loginForm, nisn: e.target.value})} />
                  <p className="text-[10px] text-gray-400 text-center font-bold">Akun akan otomatis dibuat jika baru pertama kali.</p>
                </>
              )}
              <button className="w-full bg-blue-900 text-white p-4 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-800 transition-all mt-4 shadow-lg">Masuk Sistem</button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // --- TAMPILAN DASHBOARD UTAMA ---
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans pb-24 md:pb-0">
      <ServerSettingsModal />
      
      {/* NAVBAR DESKTOP */}
      <nav className="bg-blue-900 text-white p-5 shadow-xl sticky top-0 z-50 hidden md:block">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentView('home')}>
            <div className="bg-yellow-400 p-2 rounded-xl text-blue-900"><Library size={24}/></div>
            <span className="font-black text-xl tracking-tighter uppercase italic">SMANSA</span>
          </div>
          <div className="flex items-center gap-6">
            <button onClick={() => setCurrentView('home')} className={`font-black text-xs uppercase tracking-widest ${currentView==='home'?'text-yellow-400':'hover:text-yellow-400'}`}>Beranda</button>
            {user.level !== 'Admin' && <button onClick={() => setCurrentView('profile')} className={`font-black text-xs uppercase tracking-widest ${currentView==='profile'?'text-yellow-400':'hover:text-yellow-400'}`}>Profil Saya</button>}
            {user.level === 'Admin' && <button onClick={() => setCurrentView('admin')} className={`font-black text-xs uppercase tracking-widest flex items-center gap-1 ${currentView==='admin'?'text-yellow-400':'text-gray-300'}`}><Shield size={14}/> Admin</button>}
            <button onClick={() => setShowSettings(true)} className="p-2 hover:bg-blue-800 rounded-xl"><Settings size={18}/></button>
            <button onClick={() => { setUser(null); setServerStatus('checking'); }} className="p-2 bg-red-500/20 text-red-300 rounded-xl hover:bg-red-500/40"><LogOut size={20}/></button>
          </div>
        </div>
      </nav>

      {/* KONTEN */}
      <main className="flex-grow p-4 md:p-10 max-w-7xl mx-auto w-full">
        
        {/* HALAMAN HOME / KATALOG */}
        {currentView === 'home' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="bg-blue-900 p-8 md:p-12 rounded-[2.5rem] text-white relative overflow-hidden shadow-2xl border-b-8 border-yellow-400">
               <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                  <div>
                    <h1 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter leading-none mb-2">Halo, {user.name.split(' ')[0]}!</h1>
                    {user.level !== 'Admin' ? 
                       <p className="text-yellow-400 font-bold uppercase tracking-widest text-xs">Siswa Kelas {user.grade}-{user.subClass}</p> :
                       <p className="text-yellow-400 font-bold uppercase tracking-widest text-xs">Akses Petugas Perpustakaan</p>
                    }
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

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
              {books.map(book => (
                <div key={book.id} className="bg-white rounded-[2rem] shadow-md hover:shadow-2xl transition-all overflow-hidden flex flex-col">
                  <div className="h-40 md:h-64 bg-slate-100 relative overflow-hidden">
                    <img src={book.cover || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=300'} className="w-full h-full object-cover" alt={book.title} />
                    <div className="absolute top-2 left-2 bg-blue-900 text-yellow-400 text-[8px] font-black px-2 py-1 rounded-lg uppercase">Kelas {book.grade}</div>
                  </div>
                  <div className="p-4 md:p-6 flex-grow flex flex-col justify-between">
                    <div>
                      <h3 className="font-black text-gray-800 text-sm md:text-lg leading-tight mb-1 line-clamp-2">{book.title}</h3>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest italic">{book.author}</p>
                    </div>
                    <button 
                      onClick={() => { setReadingBook(book); addXP(10, "Membaca Buku"); }}
                      className="w-full mt-4 bg-blue-100 text-blue-900 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-900 hover:text-white transition-all shadow-sm"
                    >
                      Baca (+10 XP)
                    </button>
                  </div>
                </div>
              ))}
              {books.length === 0 && (
                  <div className="col-span-full py-20 text-center text-gray-400 bg-white rounded-[3rem] border border-dashed">
                      <Library size={48} className="mx-auto mb-4 opacity-20" />
                      <p className="font-bold uppercase tracking-widest text-sm">Belum ada buku tersedia.</p>
                  </div>
              )}
            </div>
          </div>
        )}

        {/* HALAMAN PROFIL */}
        {currentView === 'profile' && user.level !== 'Admin' && (
            <div className="animate-fadeIn max-w-2xl mx-auto space-y-6">
                <div className="bg-white p-8 rounded-[3rem] shadow-xl text-center border-t-8 border-yellow-400 relative">
                    <div className="w-32 h-32 mx-auto rounded-full bg-blue-100 border-4 border-white shadow-xl overflow-hidden relative mb-4 flex items-center justify-center">
                        {profileForm.avatarBase64 ? (
                            <img src={profileForm.avatarBase64} className="w-full h-full object-cover" alt="Avatar"/>
                        ) : <User size={64} className="text-blue-300"/>}
                        <label className="absolute bottom-0 w-full bg-black/50 text-white p-2 cursor-pointer hover:bg-black/70 flex justify-center">
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

                    <form onSubmit={async (e) => {
                        e.preventDefault();
                        try {
                            const res = await fetch(`${apiUrl}/users/${user.id}/profile`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ name: profileForm.name, avatar: profileForm.avatarBase64 }) });
                            const data = await res.json();
                            setUser(data); showNotif("Profil Tersimpan");
                        } catch(e) {}
                    }} className="bg-gray-50 p-6 rounded-3xl space-y-4">
                        <label className="block text-left text-[10px] font-black uppercase text-gray-500">Nama Panggilan</label>
                        <input required className="w-full p-4 border rounded-2xl bg-white font-bold outline-none focus:border-blue-500" value={profileForm.name} onChange={e => setProfileForm({...profileForm, name: e.target.value})} />
                        <button type="submit" className="w-full bg-blue-900 text-white font-black py-4 rounded-2xl uppercase tracking-widest text-xs hover:bg-blue-800">Simpan Profil (+50 XP)</button>
                    </form>
                </div>
            </div>
        )}

        {/* HALAMAN ADMIN */}
        {currentView === 'admin' && user.level === 'Admin' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex bg-white p-2 rounded-2xl shadow-sm border overflow-x-auto">
              {['koleksi', 'siswa'].map(t => (
                <button key={t} onClick={() => setAdminTab(t)} className={`flex-1 py-3 px-6 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${adminTab === t ? 'bg-blue-900 text-white shadow-md' : 'text-gray-400 hover:bg-gray-50'}`}>
                  Kelola {t}
                </button>
              ))}
            </div>

            {/* Admin: Koleksi */}
            {adminTab === 'koleksi' && (
              <div className="space-y-6">
                <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-gray-100">
                  <h3 className="font-black text-sm uppercase mb-6 flex items-center gap-2"><PlusCircle className="text-blue-600"/> Tambah Buku Baru</h3>
                  <form onSubmit={async (e) => {
                      e.preventDefault();
                      const newBook = { id: Date.now().toString(), ...bookForm, status: 'approved', cover: bookForm.coverBase64 || 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=300' };
                      try {
                          await fetch(`${apiUrl}/books`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newBook) });
                          setBooks([...books, newBook]);
                          showNotif("Buku berhasil disimpan!");
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
                    <button type="submit" className="bg-blue-900 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-md hover:bg-blue-800 transition-colors">Posting Buku</button>
                  </form>
                </div>

                <div className="bg-white rounded-[2rem] shadow-xl overflow-hidden border">
                  <div className="p-6 bg-gray-50 border-b"><h3 className="font-black text-sm uppercase tracking-widest">Daftar Buku Server</h3></div>
                  <div className="overflow-x-auto p-4">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-white text-[10px] font-black uppercase text-gray-400">
                        <tr><th className="p-4 border-b">Judul</th><th className="p-4 border-b text-center">Aksi</th></tr>
                      </thead>
                      <tbody>
                        {books.map(b => (
                          <tr key={b.id} className="hover:bg-blue-50">
                            <td className="p-4 font-bold text-sm">{b.title} <span className="block text-[10px] text-gray-400 uppercase mt-1">Kelas {b.grade}</span></td>
                            <td className="p-4 text-center">
                              <button onClick={async () => {
                                if(window.confirm("Hapus Buku?")) {
                                  await fetch(`${apiUrl}/books/${b.id}`, { method: 'DELETE' });
                                  setBooks(books.filter(bk => bk.id !== b.id));
                                  showNotif("Buku Dihapus", "info");
                                }
                              }} className="p-3 bg-red-100 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm"><Trash2 size={16}/></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Admin: Siswa */}
            {adminTab === 'siswa' && (
              <div className="bg-white p-8 rounded-[2rem] shadow-xl space-y-6 border border-gray-100">
                <div className="bg-blue-50 p-4 rounded-2xl border border-blue-200">
                    <p className="text-[10px] text-blue-800 font-bold uppercase tracking-widest leading-relaxed">Tambahkan NISN siswa di bawah ini. Siswa tidak akan bisa mendaftar jika NISN-nya belum kamu daftarkan di sini.</p>
                </div>
                <form onSubmit={async (e) => {
                    e.preventDefault();
                    try {
                        await fetch(`${apiUrl}/students/bulk`, {
                            method: 'POST', headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ students: [{ ...studentInput, subClass: studentInput.sub }] })
                        });
                        showNotif(`NISN ${studentInput.nisn} terdaftar!`);
                        setStudentInput({ ...studentInput, nisn: '', name: '' });
                    } catch(e) { showNotif("Gagal terkoneksi ke Server", "error"); }
                }} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <input required placeholder="Nama Lengkap" className="p-4 bg-gray-50 rounded-xl border text-sm outline-none" value={studentInput.name} onChange={e => setStudentInput({...studentInput, name: e.target.value})} />
                  <input required placeholder="NISN Resmi" className="p-4 bg-gray-50 rounded-xl border text-sm font-mono outline-none" value={studentInput.nisn} onChange={e => setStudentInput({...studentInput, nisn: e.target.value})} />
                  <select className="p-4 bg-gray-50 rounded-xl border font-black text-xs outline-none" value={studentInput.grade} onChange={e => setStudentInput({...studentInput, grade: e.target.value})}>
                    <option>X</option><option>XI</option><option>XII</option>
                  </select>
                  <button className="bg-blue-900 text-white rounded-xl font-black text-[10px] uppercase shadow-md hover:bg-blue-800 transition-all">Simpan Database</button>
                </form>
              </div>
            )}
          </div>
        )}
      </main>

      {/* BOTTOM NAVBAR (Hanya HP) */}
      {user && (
          <nav className="md:hidden fixed bottom-0 w-full bg-white border-t rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-50 px-6 py-4 flex justify-between items-center pb-safe">
              <button onClick={() => setCurrentView('home')} className={`flex flex-col items-center gap-1 transition-all ${currentView==='home'?'text-blue-900 scale-110':'text-gray-400'}`}>
                  <Home fill={currentView==='home'?'currentColor':'none'} size={24}/>
                  <span className="text-[8px] font-black uppercase tracking-widest">Katalog</span>
              </button>
              
              {user.level !== 'Admin' && (
                  <button onClick={() => setCurrentView('profile')} className={`flex flex-col items-center gap-1 transition-all ${currentView==='profile'?'text-blue-900 scale-110':'text-gray-400'}`}>
                      <User fill={currentView==='profile'?'currentColor':'none'} size={24}/>
                      <span className="text-[8px] font-black uppercase tracking-widest">Profil</span>
                  </button>
              )}

              {user.level === 'Admin' && (
                  <button onClick={() => setCurrentView('admin')} className={`flex flex-col items-center gap-1 transition-all ${currentView==='admin'?'text-blue-900 scale-110':'text-gray-400'}`}>
                      <Shield fill={currentView==='admin'?'currentColor':'none'} size={24}/>
                      <span className="text-[8px] font-black uppercase tracking-widest">Admin</span>
                  </button>
              )}
              
              <button onClick={() => { setUser(null); setServerStatus('checking'); }} className="flex flex-col items-center gap-1 text-red-400 transition-all hover:scale-110">
                  <LogOut size={24}/>
                  <span className="text-[8px] font-black uppercase tracking-widest">Keluar</span>
              </button>
          </nav>
      )}

      {/* NOTIFIKASI TOAST */}
      {notification && (
        <div className={`fixed top-10 left-1/2 -translate-x-1/2 p-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-fadeIn z-[1000] ${notification.type === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
            {notification.type === 'error' ? <XCircle size={20}/> : <CheckCircle size={20}/>}
            <span className="font-bold text-sm">{notification.msg}</span>
        </div>
      )}

      {/* MODAL BACA BUKU */}
      {readingBook && (
        <div className="fixed inset-0 z-[600] bg-black/90 flex flex-col p-4 md:p-10 animate-fadeIn">
            <div className="flex justify-between items-center bg-white p-4 rounded-3xl mb-4 max-w-5xl mx-auto w-full">
                <div>
                    <h3 className="font-black text-blue-900">{readingBook.title}</h3>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">{readingBook.author}</p>
                </div>
                <button onClick={() => setReadingBook(null)} className="p-3 bg-red-100 text-red-600 rounded-xl hover:bg-red-500 hover:text-white transition-all"><X size={20}/></button>
            </div>
            <div className="flex-grow bg-white rounded-[2rem] overflow-hidden flex items-center justify-center max-w-5xl mx-auto w-full shadow-2xl">
                {readingBook.fileBase64 ? (
                   <iframe src={readingBook.fileBase64} className="w-full h-full border-none" title={readingBook.title}></iframe>
                ) : (
                   <div className="text-center text-gray-400 flex flex-col items-center">
                       <BookIcon size={64} className="mx-auto mb-6 opacity-20"/>
                       <p className="font-black uppercase tracking-widest">Konten PDF tidak tersedia</p>
                       <p className="text-xs mt-2">Silakan hubungi pustakawan.</p>
                   </div>
                )}
            </div>
        </div>
      )}

    </div>
  );
}