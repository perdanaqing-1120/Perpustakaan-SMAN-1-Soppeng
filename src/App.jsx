import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Users, Shield, Library, X, FileText, Book as BookIcon, 
  Activity, LogOut, CheckCircle, XCircle, KeyRound, GraduationCap,
  PlusCircle, Trash2, Check, Star, User, Camera, Trophy, Home, Search, UploadCloud, UserPlus
} from 'lucide-react';

let hostIp = window.location.hostname;
if (hostIp.includes('google') || hostIp.includes('usercontent')) hostIp = 'localhost';
const API_URL = `http://${hostIp}:5000/api`;

export default function App() {
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState('siswa');
  const [books, setBooks] = useState([]);
  const [masterStudents, setMasterStudents] = useState([]);
  const [friendsData, setFriendsData] = useState({ friends: [], requests: [] });
  const [serverStatus, setServerStatus] = useState('checking'); 
  const [onlineUsers, setOnlineUsers] = useState(0);
  
  const [currentView, setCurrentView] = useState('home'); 
  const [notification, setNotification] = useState(null);
  const [readingBook, setReadingBook] = useState(null);
  const [adminTab, setAdminTab] = useState('koleksi');

  // Forms
  const [loginForm, setLoginForm] = useState({ username: '', password: '', nisn: '' });
  const [studentInput, setStudentInput] = useState({ nisn: '', grade: 'X', sub: '1', name: '' });
  const [profileForm, setProfileForm] = useState({ name: '', avatarBase64: '' });
  const [bookForm, setBookForm] = useState({ title: '', author: '', grade: 'X', type: 'ebook', coverBase64: '', fileBase64: '' });
  const [friendNisn, setFriendNisn] = useState('');

  // --- SINKRONISASI SERVER ---
  useEffect(() => {
    let isMounted = true;
    const checkServer = async () => {
      try {
        const res = await fetch(`${API_URL}/books`);
        if (res.ok) {
          const data = await res.json();
          if(isMounted) { setBooks(data); setServerStatus('online'); }
        } else {
          if(isMounted) setServerStatus('offline');
        }
      } catch (e) {
        if (isMounted) setServerStatus('offline');
      }
    };

    checkServer();
    const interval = setInterval(() => {
      if (serverStatus === 'online') {
        const payload = user ? { userId: user.id } : {};
        fetch(`${API_URL}/stats/heartbeat`, { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) })
          .then(r => r.json()).then(d => { if(isMounted) setOnlineUsers(d.activeUsers || 0); }).catch(()=>{});
        
        fetch(`${API_URL}/books`).then(r => r.json()).then(d => { if(isMounted) setBooks(d); }).catch(()=>{});
        
        if (user && user.level !== 'Admin') {
            fetch(`${API_URL}/users/${user.id}/friends`).then(r => r.json()).then(d => { if(isMounted) setFriendsData(d); }).catch(()=>{});
        }
      }
    }, 10000);
    return () => { isMounted = false; clearInterval(interval); };
  }, [serverStatus, user]);

  const loadAdminStudents = async () => {
      try {
          const res = await fetch(`${API_URL}/students`);
          setMasterStudents(await res.json());
      } catch(e) {}
  };

  useEffect(() => {
      if (user?.level === 'Admin' && adminTab === 'siswa') loadAdminStudents();
  }, [user, adminTab]);

  const showNotif = (msg, type = 'success') => {
      setNotification({ msg, type });
      setTimeout(() => setNotification(null), 3000);
  };

  const calculateLevel = (xp) => Math.floor((xp || 0) / 100) + 1;
  const getXpProgress = (xp) => ((xp || 0) % 100);

  // --- AUTH ---
  const handleLogin = async (e) => {
    e.preventDefault();
    if (userType === 'admin' && loginForm.username === 'admin' && loginForm.password === 'admin1234') {
        setUser({ id: 'admin-0', name: 'Super Admin', username: 'admin', level: 'Admin', xp: 0 });
        setCurrentView('admin');
        showNotif('Login Admin Berhasil');
        return;
    }
    const payload = userType === 'admin' ? { is_admin: true, username: loginForm.username, password: loginForm.password } : { is_admin: false, nisn: loginForm.nisn.trim() };
    try {
      const res = await fetch(`${API_URL}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (res.ok) {
        setUser(data);
        showNotif(`Login Sukses, ${data.name}`);
        setProfileForm({ name: data.name, avatarBase64: data.avatar || '' });
        setCurrentView(data.level === 'Admin' ? 'admin' : 'home');
      } else {
        showNotif(data.message || "Gagal Login", "error");
      }
    } catch (e) { showNotif("Server Terputus", "error"); }
  };

  const convertToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });

  // --- TAMPILAN OFFLINE ---
  if (serverStatus === 'offline') {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6 text-center font-sans text-gray-200">
        <div className="bg-gray-900 p-10 rounded-[3rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] max-w-md border-t-8 border-red-500 w-full relative">
          <Activity size={60} className="mx-auto text-red-500 mb-6 animate-pulse" />
          <h1 className="text-2xl font-black uppercase italic tracking-widest text-white">Server Offline</h1>
          <p className="text-sm text-gray-400 mt-4 font-medium">Jalankan <code className="text-red-400 bg-gray-800 px-2 py-1 rounded">node server.js</code> di komputermu untuk terhubung.</p>
          <button onClick={() => setServerStatus('checking')} className="w-full mt-8 bg-blue-600 text-white font-black py-4 rounded-2xl uppercase tracking-widest hover:bg-blue-500 transition-all">Muat Ulang</button>
        </div>
      </div>
    );
  }

  // --- TAMPILAN LOGIN ---
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4 font-sans text-gray-200">
        <div className="bg-gray-900 w-full max-w-md rounded-[3rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden animate-fadeIn border border-gray-800">
          <div className="bg-blue-900 p-8 text-center relative border-b-4 border-blue-500">
            <Library size={48} className="mx-auto text-blue-300 mb-3" />
            <h2 className="font-black text-2xl text-white uppercase italic tracking-tighter">Smansa E-Library</h2>
            <p className="text-[10px] font-bold text-blue-300 uppercase tracking-[0.4em]">Sistem Pintar Berbasis XP</p>
          </div>
          
          <div className="flex bg-gray-950">
            <button onClick={() => setUserType('siswa')} className={`flex-1 py-4 text-xs font-black uppercase flex justify-center items-center gap-2 ${userType === 'siswa' ? 'bg-gray-900 text-blue-400 border-t-2 border-blue-500' : 'text-gray-600'}`}><GraduationCap size={16}/> Siswa</button>
            <button onClick={() => setUserType('admin')} className={`flex-1 py-4 text-xs font-black uppercase flex justify-center items-center gap-2 ${userType === 'admin' ? 'bg-gray-900 text-blue-400 border-t-2 border-blue-500' : 'text-gray-600'}`}><KeyRound size={16}/> Admin</button>
          </div>

          <div className="p-8">
            <form onSubmit={handleLogin} className="space-y-4">
              {userType === 'admin' ? (
                <div className="animate-fadeIn">
                  <input required placeholder="Username Admin" className="w-full p-4 bg-gray-800 text-white border border-gray-700 rounded-2xl outline-none focus:border-blue-500 mb-4" value={loginForm.username} onChange={e => setLoginForm({...loginForm, username: e.target.value})} />
                  <input required type="password" placeholder="Password" className="w-full p-4 bg-gray-800 text-white border border-gray-700 rounded-2xl outline-none font-mono focus:border-blue-500" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} />
                  <p className="text-[10px] text-gray-500 text-center font-bold mt-4">Gunakan: admin / admin1234</p>
                </div>
              ) : (
                <div className="animate-fadeIn">
                  <div className="bg-gray-800 p-4 rounded-2xl mb-4 border border-gray-700">
                      <p className="text-[10px] text-gray-400 text-center leading-relaxed">Masukkan NISN kamu. Pastikan Admin sudah mendaftarkan NISN kamu ke dalam database agar bisa masuk.</p>
                  </div>
                  <input required placeholder="Masukkan NISN" className="w-full p-5 bg-gray-950 text-white border-2 border-gray-700 rounded-2xl outline-none focus:border-blue-500 font-mono text-center text-lg tracking-widest placeholder-gray-700" value={loginForm.nisn} onChange={e => setLoginForm({...loginForm, nisn: e.target.value})} />
                </div>
              )}
              <button className="w-full bg-blue-600 text-white p-4 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-500 transition-all mt-4">Masuk Sistem</button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // --- TAMPILAN DASHBOARD (DARK MODE) ---
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col font-sans pb-24 md:pb-0 text-gray-200">
      
      {/* NAVBAR DESKTOP */}
      <nav className="bg-gray-900 border-b border-gray-800 p-4 shadow-xl sticky top-0 z-50 hidden md:block">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentView('home')}>
            <div className="bg-blue-600 p-2 rounded-xl text-white"><Library size={24}/></div>
            <span className="font-black text-xl tracking-tighter uppercase italic text-white">SMANSA</span>
          </div>
          
          <div className="flex items-center gap-6">
            <button onClick={() => setCurrentView('home')} className={`font-black text-xs uppercase tracking-widest ${currentView==='home'?'text-blue-400':'hover:text-blue-400'}`}>Beranda</button>
            
            {user.level !== 'Admin' && (
              <>
                <button onClick={() => setCurrentView('upload')} className={`font-black text-xs uppercase tracking-widest ${currentView==='upload'?'text-blue-400':'hover:text-blue-400'}`}>Upload Karya</button>
                <button onClick={() => setCurrentView('friends')} className={`font-black text-xs uppercase tracking-widest ${currentView==='friends'?'text-blue-400':'hover:text-blue-400'}`}>Teman</button>
              </>
            )}
            
            {user.level === 'Admin' && <button onClick={() => setCurrentView('admin')} className={`font-black text-xs uppercase tracking-widest flex items-center gap-1 ${currentView==='admin'?'text-blue-400':'text-gray-400'}`}><Shield size={14}/> Admin</button>}
            
            <div className="h-8 w-px bg-gray-700 mx-2"></div>
            
            {/* Tampilan Profil Mini di Navbar Desktop */}
            <div onClick={() => { if(user.level !== 'Admin') setCurrentView('profile'); }} className="flex items-center gap-3 cursor-pointer hover:bg-gray-800 p-2 rounded-xl transition-colors">
                <div className="text-right">
                    <p className="text-xs font-black text-white">{user.name.split(' ')[0]}</p>
                    <p className="text-[9px] font-bold text-blue-400 uppercase tracking-widest">{user.level !== 'Admin' ? `Level ${calculateLevel(user.xp)}` : 'Admin'}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-gray-800 border-2 border-blue-500 overflow-hidden flex items-center justify-center">
                    {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover"/> : <User size={20} className="text-gray-500"/>}
                </div>
            </div>

            <button onClick={() => setUser(null)} className="p-2 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/30"><LogOut size={20}/></button>
          </div>
        </div>
      </nav>

      {/* KONTEN */}
      <main className="flex-grow p-4 md:p-8 max-w-7xl mx-auto w-full">
        
        {/* HALAMAN HOME / KATALOG */}
        {currentView === 'home' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Header Profil Singkat untuk HP, karena navbar HP sempit */}
            <div className="bg-gray-900 border border-gray-800 p-6 md:p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
               <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                  <div className="text-center md:text-left">
                    <h1 className="text-3xl md:text-4xl font-black italic uppercase tracking-tighter leading-none mb-2 text-white">Halo, {user.name.split(' ')[0]}!</h1>
                    <p className="text-blue-400 font-bold uppercase tracking-widest text-xs">Jelajahi Dunia Digital SMANSA</p>
                  </div>
                  
                  {user.level !== 'Admin' && (
                    <div className="bg-gray-950 border border-gray-800 p-4 rounded-3xl w-full md:w-64 text-center">
                        <div className="flex justify-between items-end mb-2">
                            <span className="font-black uppercase tracking-widest text-xs text-white"><Star className="inline w-4 text-blue-400 mb-1"/> Level {calculateLevel(user.xp)}</span>
                            <span className="text-[10px] font-bold text-gray-500">{user.xp} XP (Online: +1/10s)</span>
                        </div>
                        <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
                            <div className="bg-blue-500 h-3 rounded-full transition-all duration-1000" style={{width: `${getXpProgress(user.xp)}%`}}></div>
                        </div>
                    </div>
                  )}
               </div>
            </div>

            {/* Katalog Buku & Karya */}
            <div>
              <h2 className="text-xl font-black uppercase italic tracking-widest text-white mb-6 border-l-4 border-blue-500 pl-3">Katalog Terbaru</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {books.filter(b => b.status === 'approved').map(book => (
                  <div key={book.id} className="bg-gray-900 rounded-[2rem] shadow-lg hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all overflow-hidden flex flex-col border border-gray-800 hover:border-blue-500 group">
                    <div className="h-40 md:h-56 bg-gray-800 relative overflow-hidden">
                      <img src={book.cover} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt={book.title} />
                      <div className="absolute top-3 left-3 bg-blue-600 text-white text-[8px] font-black px-3 py-1 rounded-full uppercase shadow-md">
                          {book.type === 'community' ? 'Karya Siswa' : `Kelas ${book.grade}`}
                      </div>
                    </div>
                    <div className="p-4 md:p-6 flex-grow flex flex-col justify-between">
                      <div>
                        <h3 className="font-black text-white text-sm md:text-lg leading-tight mb-1 line-clamp-2">{book.title}</h3>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest italic line-clamp-1">{book.author}</p>
                      </div>
                      <button 
                        onClick={() => setReadingBook(book)}
                        className="w-full mt-4 bg-gray-800 text-blue-400 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-sm border border-gray-700"
                      >
                        Buka Digital
                      </button>
                    </div>
                  </div>
                ))}
                {books.filter(b => b.status === 'approved').length === 0 && (
                    <div className="col-span-full py-20 text-center text-gray-500 bg-gray-900 rounded-[3rem] border border-dashed border-gray-700">
                        <Library size={48} className="mx-auto mb-4 opacity-30" />
                        <p className="font-bold uppercase tracking-widest text-sm">Belum ada buku tersedia.</p>
                    </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* UPLOAD KARYA SISWA */}
        {currentView === 'upload' && user.level !== 'Admin' && (
            <div className="animate-fadeIn max-w-3xl mx-auto space-y-6">
                <div className="bg-gray-900 p-8 md:p-10 rounded-[3rem] shadow-xl border border-gray-800">
                    <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-2"><UploadCloud className="inline mr-2 text-blue-500"/> Upload Karyamu</h2>
                    <p className="text-xs text-gray-400 font-medium mb-8">Kirimkan cerpen, komik, atau esaimu. Karya yang di-ACC Admin akan bisa dibaca seluruh sekolah!</p>

                    <form onSubmit={async (e) => {
                        e.preventDefault();
                        const newBook = { id: Date.now().toString(), ...bookForm, type: 'community', status: 'pending', cover: bookForm.coverBase64 || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=300' };
                        try {
                            await fetch(`${API_URL}/books`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newBook) });
                            showNotif("Karya terkirim ke server Admin! Menunggu ACC.");
                            setBookForm({ title: '', author: user.name, grade: user.grade, category: 'Umum', coverBase64: '', fileBase64: '' });
                        } catch(e) {}
                    }} className="space-y-5">
                        <input required className="w-full p-4 bg-gray-950 border border-gray-800 text-white rounded-2xl outline-none focus:border-blue-500" placeholder="Judul Karya" value={bookForm.title} onChange={e => setBookForm({...bookForm, title: e.target.value})} />
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-gray-950 border border-gray-800 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-colors relative h-32">
                                <input type="file" accept="image/*" onChange={async (e) => { if(e.target.files[0]) setBookForm({...bookForm, coverBase64: await convertToBase64(e.target.files[0])}); }} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                                {bookForm.coverBase64 ? <img src={bookForm.coverBase64} className="h-full object-cover rounded-xl"/> : <><Camera size={24} className="text-gray-500 mb-2"/><span className="text-[10px] font-bold text-gray-500 uppercase text-center">Thumbnail<br/>(Opsional)</span></>}
                            </div>
                            <div className="p-4 bg-gray-950 border border-gray-800 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-colors relative h-32">
                                <input required type="file" accept="application/pdf" onChange={async (e) => { if(e.target.files[0]) setBookForm({...bookForm, fileBase64: await convertToBase64(e.target.files[0])}); }} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                                <FileText size={24} className={bookForm.fileBase64 ? "text-blue-500 mb-2" : "text-gray-500 mb-2"}/>
                                <span className={`text-[10px] font-bold uppercase text-center ${bookForm.fileBase64 ? 'text-blue-400' : 'text-gray-500'}`}>{bookForm.fileBase64 ? 'PDF Terpilih!' : 'Pilih File PDF (Wajib)'}</span>
                            </div>
                        </div>

                        <button type="submit" className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl uppercase tracking-widest hover:bg-blue-500 transition-all">Kirim Karya</button>
                    </form>
                </div>
            </div>
        )}

        {/* PERTEMANAN SISWA */}
        {currentView === 'friends' && user.level !== 'Admin' && (
            <div className="animate-fadeIn space-y-6 max-w-4xl mx-auto">
                <div className="bg-gray-900 p-8 rounded-[3rem] shadow-xl border border-gray-800 text-center">
                    <h2 className="text-2xl font-black text-white uppercase italic mb-4"><Users className="inline mr-2 text-blue-500"/> Jaringan Teman</h2>
                    <form onSubmit={async (e) => {
                        e.preventDefault();
                        try {
                            const res = await fetch(`${API_URL}/friends/request`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fromId: user.id, targetNisn: friendNisn }) });
                            const data = await res.json();
                            if (res.ok) { showNotif(data.message); setFriendNisn(''); } else showNotif(data.message, "error");
                        } catch(e) {}
                    }} className="flex items-center gap-2 max-w-sm mx-auto bg-gray-950 p-2 rounded-2xl border border-gray-800">
                        <input required placeholder="Cari berdasarkan NISN" className="flex-grow bg-transparent text-white p-3 outline-none text-sm font-mono text-center" value={friendNisn} onChange={e => setFriendNisn(e.target.value)} />
                        <button type="submit" className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-500"><Search size={20}/></button>
                    </form>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-900 p-8 rounded-[2rem] border border-gray-800">
                        <h3 className="font-black text-sm text-white uppercase tracking-widest border-b border-gray-800 pb-4 mb-4">Daftar Teman</h3>
                        <div className="space-y-4">
                            {friendsData.friends.map(f => (
                                <div key={f.id} className="flex items-center gap-4 bg-gray-950 p-4 rounded-2xl border border-gray-800">
                                    <div className="w-12 h-12 bg-gray-800 rounded-full border-2 border-blue-500 overflow-hidden flex items-center justify-center flex-shrink-0">
                                        {f.avatar ? <img src={f.avatar} className="w-full h-full object-cover"/> : <User className="text-gray-500" size={20}/>}
                                    </div>
                                    <div>
                                        <h4 className="font-black text-white text-sm uppercase">{f.name}</h4>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase">Level {f.level} • {f.xp} XP</p>
                                    </div>
                                </div>
                            ))}
                            {friendsData.friends.length === 0 && <p className="text-center text-xs text-gray-600 font-bold py-6">Belum ada teman.</p>}
                        </div>
                    </div>

                    <div className="bg-gray-900 p-8 rounded-[2rem] border border-gray-800">
                        <h3 className="font-black text-sm text-white uppercase tracking-widest border-b border-gray-800 pb-4 mb-4">Permintaan Teman</h3>
                        <div className="space-y-4">
                            {friendsData.requests.map(r => (
                                <div key={r.id} className="flex items-center justify-between bg-gray-950 p-4 rounded-2xl border border-gray-800">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gray-800 rounded-full overflow-hidden flex items-center justify-center">
                                            {r.avatar ? <img src={r.avatar} className="w-full h-full object-cover"/> : <User className="text-gray-500" size={16}/>}
                                        </div>
                                        <h4 className="font-bold text-white text-xs uppercase">{r.name}</h4>
                                    </div>
                                    <button onClick={async () => {
                                        await fetch(`${API_URL}/friends/accept`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id, requesterId: r.id }) });
                                        showNotif("Diterima!");
                                    }} className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-500"><Check size={16}/></button>
                                </div>
                            ))}
                            {friendsData.requests.length === 0 && <p className="text-center text-xs text-gray-600 font-bold py-6">Tidak ada permintaan baru.</p>}
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* HALAMAN PROFIL PRIBADI */}
        {currentView === 'profile' && user.level !== 'Admin' && (
            <div className="animate-fadeIn max-w-2xl mx-auto space-y-6">
                <div className="bg-gray-900 p-8 md:p-12 rounded-[3rem] shadow-xl text-center border-t-8 border-blue-500 border-x border-b border-gray-800 relative">
                    <div className="w-32 h-32 mx-auto rounded-full bg-gray-800 border-4 border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.3)] overflow-hidden relative mb-6 flex items-center justify-center group">
                        {profileForm.avatarBase64 ? <img src={profileForm.avatarBase64} className="w-full h-full object-cover" alt="Avatar"/> : <User size={64} className="text-gray-600"/>}
                        <label className="absolute bottom-0 w-full bg-black/70 text-white p-3 cursor-pointer opacity-0 group-hover:opacity-100 flex justify-center transition-all">
                            <Camera size={18}/>
                            <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                                if(e.target.files[0]) {
                                    const b64 = await convertToBase64(e.target.files[0]);
                                    setProfileForm({...profileForm, avatarBase64: b64});
                                }
                            }} />
                        </label>
                    </div>
                    <h2 className="text-3xl font-black text-white uppercase">{user.name}</h2>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-8 mt-2">NISN: {user.nisn} • Kelas {user.grade}-{user.subClass}</p>

                    <form onSubmit={async (e) => {
                        e.preventDefault();
                        try {
                            const res = await fetch(`${API_URL}/users/${user.id}/profile`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ name: profileForm.name, avatar: profileForm.avatarBase64 }) });
                            const data = await res.json();
                            setUser(data); showNotif("Profil Tersimpan");
                        } catch(e) {}
                    }} className="bg-gray-950 p-6 rounded-3xl space-y-4 border border-gray-800">
                        <label className="block text-left text-[10px] font-black uppercase text-gray-500">Ganti Nama Tampilan</label>
                        <input required className="w-full p-4 border border-gray-800 rounded-2xl bg-gray-900 text-white font-bold outline-none focus:border-blue-500" value={profileForm.name} onChange={e => setProfileForm({...profileForm, name: e.target.value})} />
                        <button type="submit" className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl uppercase tracking-widest text-xs hover:bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.4)]">Simpan Perubahan</button>
                    </form>
                </div>
            </div>
        )}

        {/* HALAMAN ADMIN */}
        {currentView === 'admin' && user.level === 'Admin' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex bg-gray-900 p-2 rounded-2xl shadow-sm border border-gray-800 overflow-x-auto">
              {['dashboard', 'koleksi', 'approval', 'siswa'].map(t => (
                <button key={t} onClick={() => setAdminTab(t)} className={`flex-1 py-3 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap ${adminTab === t ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-800'}`}>
                  {t}
                </button>
              ))}
            </div>

            {/* Admin: Dashboard (Online Stats) */}
            {adminTab === 'dashboard' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-900 p-10 rounded-[3rem] border border-gray-800 flex flex-col items-center justify-center text-center">
                  <Activity size={40} className="text-green-500 mb-4 animate-pulse"/>
                  <h3 className="text-sm font-black text-gray-500 uppercase tracking-widest mb-1">User Online (Real-time)</h3>
                  <p className="text-7xl font-black text-white">{onlineUsers}</p>
                </div>
                <div className="bg-gray-900 p-10 rounded-[3rem] border border-gray-800 flex flex-col items-center justify-center text-center">
                  <BookOpen size={40} className="text-blue-500 mb-4"/>
                  <h3 className="text-sm font-black text-gray-500 uppercase tracking-widest mb-1">Total Koleksi Aktif</h3>
                  <p className="text-7xl font-black text-white">{books.filter(b=>b.status==='approved').length}</p>
                </div>
                <div className="bg-gray-900 p-10 rounded-[3rem] border border-gray-800 flex flex-col items-center justify-center text-center">
                  <Users size={40} className="text-yellow-500 mb-4"/>
                  <h3 className="text-sm font-black text-gray-500 uppercase tracking-widest mb-1">Siswa Terdaftar</h3>
                  <p className="text-7xl font-black text-white">{masterStudents.length}</p>
                </div>
              </div>
            )}

            {/* Admin: Koleksi */}
            {adminTab === 'koleksi' && (
              <div className="space-y-6">
                <div className="bg-gray-900 p-8 rounded-[2rem] border border-gray-800">
                  <h3 className="font-black text-sm text-white uppercase mb-6 flex items-center gap-2"><PlusCircle className="text-blue-500"/> Tambah Buku Pelajaran</h3>
                  <form onSubmit={async (e) => {
                      e.preventDefault();
                      const newBook = { id: Date.now().toString(), ...bookForm, type: 'ebook', status: 'approved', cover: bookForm.coverBase64 || 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=300' };
                      try {
                          await fetch(`${API_URL}/books`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newBook) });
                          setBooks([...books, newBook]);
                          showNotif("Buku berhasil disimpan!");
                          setBookForm({ title: '', author: '', grade: 'X', type: 'ebook', coverBase64: '', fileBase64: '' });
                      } catch(e) {}
                  }} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input required className="p-4 border border-gray-800 rounded-xl text-sm bg-gray-950 text-white outline-none focus:border-blue-500" placeholder="Judul Buku" value={bookForm.title} onChange={e => setBookForm({...bookForm, title: e.target.value})} />
                    <input required className="p-4 border border-gray-800 rounded-xl text-sm bg-gray-950 text-white outline-none focus:border-blue-500" placeholder="Penulis/Mapel" value={bookForm.author} onChange={e => setBookForm({...bookForm, author: e.target.value})} />
                    <select className="p-4 border border-gray-800 rounded-xl text-sm font-bold bg-gray-950 text-white outline-none" value={bookForm.grade} onChange={e => setBookForm({...bookForm, grade: e.target.value})}>
                      <option value="X">Kelas X</option><option value="XI">Kelas XI</option><option value="XII">Kelas XII</option>
                    </select>
                    
                    {/* INPUT THUMBNAIL & PDF */}
                    <div className="md:col-span-3 grid grid-cols-2 gap-4 mt-2">
                        <div className="p-4 border border-gray-800 rounded-xl bg-gray-950 flex flex-col items-center justify-center relative h-24 hover:border-blue-500 transition-all cursor-pointer">
                            <input type="file" accept="image/*" onChange={async (e) => { if(e.target.files[0]) setBookForm({...bookForm, coverBase64: await convertToBase64(e.target.files[0])}); }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"/>
                            {bookForm.coverBase64 ? <span className="text-xs font-bold text-green-400">Thumbnail OK!</span> : <><Camera size={20} className="text-gray-500 mb-1"/><span className="text-[10px] font-bold text-gray-500 uppercase">Pilih Thumbnail</span></>}
                        </div>
                        <div className="p-4 border border-gray-800 rounded-xl bg-gray-950 flex flex-col items-center justify-center relative h-24 hover:border-blue-500 transition-all cursor-pointer">
                            <input required type="file" accept="application/pdf" onChange={async (e) => { if(e.target.files[0]) setBookForm({...bookForm, fileBase64: await convertToBase64(e.target.files[0])}); }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"/>
                            <FileText size={20} className={bookForm.fileBase64 ? "text-green-500 mb-1" : "text-gray-500 mb-1"}/>
                            <span className={`text-[10px] font-bold uppercase ${bookForm.fileBase64 ? "text-green-400" : "text-gray-500"}`}>{bookForm.fileBase64 ? "PDF Terpilih!" : "Pilih File PDF"}</span>
                        </div>
                    </div>

                    <button type="submit" className="md:col-span-3 bg-blue-600 text-white rounded-xl font-black py-4 uppercase text-[10px] tracking-widest shadow-md hover:bg-blue-500 mt-2">Posting Buku</button>
                  </form>
                </div>

                <div className="bg-gray-900 rounded-[2rem] border border-gray-800 overflow-hidden">
                  <div className="p-6 border-b border-gray-800"><h3 className="font-black text-white text-sm uppercase tracking-widest">Daftar Buku Publik</h3></div>
                  <div className="overflow-x-auto p-4">
                    <table className="w-full text-left border-collapse">
                      <thead className="text-[10px] font-black uppercase text-gray-500">
                        <tr><th className="p-4 border-b border-gray-800">Judul</th><th className="p-4 border-b border-gray-800 text-center">Aksi</th></tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800">
                        {books.filter(b=>b.status==='approved').map(b => (
                          <tr key={b.id} className="hover:bg-gray-800/50">
                            <td className="p-4 font-bold text-sm text-gray-200 flex items-center gap-3">
                                <img src={b.cover} className="w-10 h-10 object-cover rounded-md border border-gray-700"/>
                                <div>{b.title} <span className="block text-[10px] text-blue-400 uppercase mt-1">{b.type === 'community' ? 'Karya Siswa' : `Kelas ${b.grade}`}</span></div>
                            </td>
                            <td className="p-4 text-center">
                              <button onClick={async () => {
                                if(window.confirm("Hapus Buku?")) {
                                  await fetch(`${API_URL}/books/${b.id}`, { method: 'DELETE' });
                                  setBooks(books.filter(bk => bk.id !== b.id));
                                  showNotif("Buku Dihapus", "info");
                                }
                              }} className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"><Trash2 size={16}/></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Admin: Approval Karya Siswa */}
            {adminTab === 'approval' && (
              <div className="bg-gray-900 rounded-[2rem] border border-gray-800 overflow-hidden">
                  <div className="p-6 border-b border-gray-800"><h3 className="font-black text-white text-sm uppercase tracking-widest">Menunggu Persetujuan (Karya Siswa)</h3></div>
                  <div className="overflow-x-auto p-4">
                    <table className="w-full text-left border-collapse">
                      <thead className="text-[10px] font-black uppercase text-gray-500">
                        <tr><th className="p-4 border-b border-gray-800">Karya</th><th className="p-4 border-b border-gray-800 text-center">Aksi</th></tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800">
                        {books.filter(b=>b.status==='pending').map(b => (
                          <tr key={b.id} className="hover:bg-gray-800/50">
                            <td className="p-4 font-bold text-sm text-gray-200 flex items-center gap-3">
                                <img src={b.cover} className="w-10 h-10 object-cover rounded-md border border-gray-700"/>
                                <div>{b.title} <span className="block text-[10px] text-gray-400 uppercase mt-1">Oleh: {b.author}</span></div>
                            </td>
                            <td className="p-4 flex justify-center gap-2">
                              <button onClick={async () => {
                                  await fetch(`${API_URL}/books/${b.id}`, { method: 'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({...b, status:'approved'}) });
                                  setBooks(books.map(bk => bk.id === b.id ? {...bk, status:'approved'} : bk));
                                  showNotif("Karya di-ACC!");
                              }} className="p-3 bg-green-500/10 text-green-500 rounded-xl hover:bg-green-500 hover:text-white"><Check size={16}/></button>
                              <button onClick={async () => {
                                  await fetch(`${API_URL}/books/${b.id}`, { method: 'DELETE' });
                                  setBooks(books.filter(bk => bk.id !== b.id));
                                  showNotif("Karya ditolak/dihapus", "info");
                              }} className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white"><X size={16}/></button>
                            </td>
                          </tr>
                        ))}
                        {books.filter(b=>b.status==='pending').length === 0 && <tr><td colSpan="2" className="p-10 text-center text-xs font-bold text-gray-600">Tidak ada karya yang menunggu ACC.</td></tr>}
                      </tbody>
                    </table>
                  </div>
              </div>
            )}

            {/* Admin: Siswa (Master Data) */}
            {adminTab === 'siswa' && (
              <div className="space-y-6">
                  <div className="bg-gray-900 p-8 rounded-[2rem] border border-gray-800">
                    <h3 className="font-black text-sm text-white uppercase mb-4 flex items-center gap-2"><UserPlus className="text-blue-500"/> Registrasi NISN Siswa</h3>
                    <form onSubmit={async (e) => {
                        e.preventDefault();
                        try {
                            const newStudent = { ...studentInput, subClass: studentInput.sub };
                            await fetch(`${API_URL}/students/bulk`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ students: [newStudent] }) });
                            showNotif(`NISN ${studentInput.nisn} berhasil didaftarkan!`);
                            setMasterStudents([...masterStudents, newStudent]);
                            setStudentInput({ ...studentInput, nisn: '', name: '' });
                        } catch(e) { showNotif("Gagal", "error"); }
                    }} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <input required placeholder="Nama Siswa" className="p-4 bg-gray-950 text-white border border-gray-800 rounded-xl text-sm outline-none" value={studentInput.name} onChange={e => setStudentInput({...studentInput, name: e.target.value})} />
                      <input required placeholder="NISN Resmi" className="p-4 bg-gray-950 text-white border border-gray-800 rounded-xl text-sm font-mono outline-none" value={studentInput.nisn} onChange={e => setStudentInput({...studentInput, nisn: e.target.value})} />
                      <select className="p-4 bg-gray-950 text-white border border-gray-800 rounded-xl font-black text-xs outline-none" value={studentInput.grade} onChange={e => setStudentInput({...studentInput, grade: e.target.value})}>
                        <option>X</option><option>XI</option><option>XII</option>
                      </select>
                      <button className="bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase shadow-md hover:bg-blue-500 transition-all">Daftarkan Master</button>
                    </form>
                  </div>

                  <div className="bg-gray-900 rounded-[2rem] border border-gray-800 overflow-hidden">
                    <div className="p-6 border-b border-gray-800"><h3 className="font-black text-white text-sm uppercase tracking-widest">Daftar Siswa (Master Data)</h3></div>
                    <div className="overflow-x-auto p-4">
                      <table className="w-full text-left border-collapse">
                        <thead className="text-[10px] font-black uppercase text-gray-500">
                          <tr><th className="p-4 border-b border-gray-800">Nama Siswa</th><th className="p-4 border-b border-gray-800">NISN</th><th className="p-4 border-b border-gray-800">Kelas</th><th className="p-4 border-b border-gray-800 text-center">Aksi</th></tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                          {masterStudents.map((s, idx) => (
                            <tr key={idx} className="hover:bg-gray-800/50">
                              <td className="p-4 font-bold text-sm text-gray-200">{s.name}</td>
                              <td className="p-4 font-mono text-xs text-blue-400">{s.nisn}</td>
                              <td className="p-4 text-xs font-bold text-gray-400">{s.grade}-{s.subClass}</td>
                              <td className="p-4 text-center">
                                <button onClick={async () => {
                                  if(window.confirm(`Hapus Siswa dengan NISN ${s.nisn}?`)) {
                                    await fetch(`${API_URL}/students/${s.nisn}`, { method: 'DELETE' });
                                    setMasterStudents(masterStudents.filter(ms => ms.nisn !== s.nisn));
                                    showNotif("Siswa Dihapus", "info");
                                  }
                                }} className="p-2 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"><Trash2 size={14}/></button>
                              </td>
                            </tr>
                          ))}
                          {masterStudents.length===0 && <tr><td colSpan="4" className="p-8 text-center text-xs text-gray-500 font-bold">Belum ada siswa terdaftar</td></tr>}
                        </tbody>
                      </table>
                    </div>
                  </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* BOTTOM NAVBAR MOBILE (Hanya HP) */}
      {user && (
          <nav className="md:hidden fixed bottom-0 w-full bg-gray-900 border-t border-gray-800 rounded-t-3xl shadow-[0_-20px_40px_rgba(0,0,0,0.5)] z-50 px-6 py-4 flex justify-between items-center pb-safe">
              <button onClick={() => setCurrentView('home')} className={`flex flex-col items-center gap-1 transition-all ${currentView==='home'?'text-blue-500 scale-110':'text-gray-500'}`}>
                  <Home fill={currentView==='home'?'currentColor':'none'} size={24}/>
                  <span className="text-[8px] font-black uppercase tracking-widest">Beranda</span>
              </button>
              
              {user.level !== 'Admin' && (
                  <button onClick={() => setCurrentView('upload')} className={`flex flex-col items-center gap-1 transition-all ${currentView==='upload'?'text-blue-500 scale-110':'text-gray-500'}`}>
                      <UploadCloud fill={currentView==='upload'?'currentColor':'none'} size={24}/>
                      <span className="text-[8px] font-black uppercase tracking-widest">Upload</span>
                  </button>
              )}
              {user.level !== 'Admin' && (
                  <button onClick={() => setCurrentView('friends')} className={`flex flex-col items-center gap-1 transition-all ${currentView==='friends'?'text-blue-500 scale-110':'text-gray-500'}`}>
                      <Users fill={currentView==='friends'?'currentColor':'none'} size={24}/>
                      <span className="text-[8px] font-black uppercase tracking-widest">Teman</span>
                  </button>
              )}

              {user.level === 'Admin' && (
                  <button onClick={() => setCurrentView('admin')} className={`flex flex-col items-center gap-1 transition-all ${currentView==='admin'?'text-blue-500 scale-110':'text-gray-500'}`}>
                      <Shield fill={currentView==='admin'?'currentColor':'none'} size={24}/>
                      <span className="text-[8px] font-black uppercase tracking-widest">Admin</span>
                  </button>
              )}

              {user.level !== 'Admin' && (
                  <button onClick={() => setCurrentView('profile')} className={`flex flex-col items-center gap-1 transition-all`}>
                      <div className={`w-7 h-7 rounded-full overflow-hidden border-2 ${currentView==='profile'?'border-blue-500':'border-gray-500'}`}>
                         {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover"/> : <User size={24} className="text-gray-500"/>}
                      </div>
                      <span className={`text-[8px] font-black uppercase tracking-widest ${currentView==='profile'?'text-blue-500':'text-gray-500'}`}>Profil</span>
                  </button>
              )}
          </nav>
      )}

      {/* Pembaca PDF Modal */}
      {readingBook && (
        <div className="fixed inset-0 z-[200] bg-black/95 flex flex-col p-2 md:p-6 animate-fadeIn pb-24 md:pb-6">
          <div className="max-w-5xl mx-auto w-full h-full bg-gray-950 rounded-[2rem] border border-gray-800 overflow-hidden shadow-2xl flex flex-col relative">
            <div className="p-4 bg-gray-900 border-b border-gray-800 text-white flex justify-between items-center">
              <h3 className="font-black text-xs md:text-sm uppercase leading-none ml-2 text-gray-200"><BookIcon size={16} className="inline mr-2 text-blue-500"/> {readingBook.title}</h3>
              <button onClick={() => { setReadingBook(null); fetch(`${API_URL}/stats/reading-stop`, {method:'POST'}).catch(()=>{}); }} className="bg-red-500/20 text-red-400 p-2 md:p-3 rounded-xl hover:bg-red-500 hover:text-white transition-all"><X size={16}/></button>
            </div>
            <div className="flex-grow bg-gray-950 relative">
              {readingBook.fileBase64 ? (
                <iframe src={readingBook.fileBase64} className="w-full h-full border-none absolute inset-0 bg-white" />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center opacity-30">
                  <FileText size={80} className="mx-auto mb-4" />
                  <p className="font-black uppercase tracking-widest text-sm text-white">File PDF Kosong</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Notifikasi */}
      {notification && (
        <div className={`fixed top-5 md:top-auto md:bottom-24 left-1/2 -translate-x-1/2 z-[300] px-6 py-3 md:px-8 md:py-4 rounded-full md:rounded-2xl shadow-2xl animate-slideUp flex items-center gap-3 ${notification.type === 'error' ? 'bg-red-600 text-white' : 'bg-blue-600 text-white border border-blue-500'}`}>
           {notification.type === 'error' ? <XCircle size={16}/> : <CheckCircle size={16}/>}
           <span className="font-black text-[10px] md:text-xs uppercase tracking-widest">{notification.msg}</span>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translate(-50%, -20px); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }
        @media (min-width: 768px) { @keyframes slideUp { from { transform: translate(-50%, 20px); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } } }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        .animate-slideUp { animation: slideUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
        .pb-safe { padding-bottom: env(safe-area-inset-bottom, 1rem); }
      `}} />
    </div>
  );
}