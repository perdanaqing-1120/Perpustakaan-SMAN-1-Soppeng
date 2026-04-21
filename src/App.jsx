import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Users, Shield, Library, X, FileText, Book as BookIcon, 
  Activity, LogOut, Database, CheckCircle, XCircle, Info, KeyRound, GraduationCap
} from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

export default function App() {
  // Auth State
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState('siswa'); // 'siswa' atau 'admin'
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Data State
  const [books, setBooks] = useState([]);
  const [serverStatus, setServerStatus] = useState('checking'); 
  
  // UI State
  const [currentView, setCurrentView] = useState('home');
  const [notification, setNotification] = useState(null);
  const [readingBook, setReadingBook] = useState(null);
  const [adminTab, setAdminTab] = useState('siswa');
  const [stats, setStats] = useState({ active: 0, reading: 0, totalVisits: 0 });

  // Form State
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [regForm, setRegForm] = useState({ username: '', password: '', name: '' });
  const [studentInput, setStudentInput] = useState({ name: '', nisn: '', grade: 'X', sub: '1' });

  // Sync Server
  useEffect(() => {
    const checkServer = async () => {
      try {
        const res = await fetch(`${API_URL}/books`);
        if (res.ok) {
          const data = await res.json();
          setBooks(data);
          setServerStatus('online');
        }
      } catch (e) {
        setServerStatus('offline');
        setBooks([]); // Buku jadi kosong jika server mati
      }
    };

    checkServer();
    const interval = setInterval(() => {
      if (serverStatus === 'online') {
        fetch(`${API_URL}/stats`).then(r => r.json()).then(setStats);
        fetch(`${API_URL}/stats/heartbeat`, { method: 'POST' });
      } else {
        checkServer();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [serverStatus]);

  const showNotif = (msg, type = 'success') => setNotification({ msg, type });

  // --- AUTH LOGIC (SISWA & ADMIN) ---
  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (userType === 'admin') {
      // Login Admin Lokal
      const savedAdmin = JSON.parse(localStorage.getItem('smansa_admin'));
      if (savedAdmin && loginForm.username === savedAdmin.username && loginForm.password === savedAdmin.password) {
        setUser(savedAdmin);
        showNotif(`Selamat datang kembali, Admin ${savedAdmin.name}`);
      } else if (loginForm.username === 'admin' && loginForm.password === 'admin123') {
        setUser({ name: 'Super Admin', level: 'Admin' });
        showNotif("Login Super Admin Berhasil");
      } else {
        showNotif("Username atau Password Admin salah!", "error");
      }
      return;
    }

    // Login Siswa (Server Node.js)
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      });
      const data = await res.json();
      if (res.ok) setUser(data);
      else showNotif("Username atau NISN salah", "error");
    } catch (e) { showNotif("Server Offline", "error"); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (userType === 'admin') {
      // Register Admin Lokal (Disimpan di browser)
      const newAdmin = { ...regForm, level: 'Admin' };
      localStorage.setItem('smansa_admin', JSON.stringify(newAdmin));
      setUser(newAdmin);
      showNotif("Akun Admin berhasil dibuat!");
      return;
    }

    // Register Siswa (Server Node.js - Membutuhkan NISN valid)
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regForm)
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data);
        showNotif("Registrasi Siswa Berhasil!");
      } else {
        showNotif(data.message, "error");
      }
    } catch (e) { showNotif("Server Offline", "error"); }
  };

  // --- ADMIN LOGIC ---
  const addStudent = async (e) => {
    e.preventDefault();
    try {
      await fetch(`${API_URL}/students/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ students: [{ ...studentInput, subClass: studentInput.sub }] })
      });
      showNotif("Siswa berhasil ditambahkan ke database");
      setStudentInput({ ...studentInput, name: '', nisn: '' });
    } catch (e) { showNotif("Gagal simpan ke server", "error"); }
  };

  // --- RENDERER ---
  if (serverStatus === 'offline') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-center font-sans">
        <div className="bg-white p-10 rounded-[3rem] shadow-2xl max-w-md border-t-8 border-red-500">
          <Activity size={60} className="mx-auto text-red-500 mb-6 animate-bounce" />
          <h1 className="text-3xl font-black text-gray-800 uppercase italic">Server Mati</h1>
          <p className="text-gray-500 mt-4 font-medium italic">Database dan Buku tidak dapat diakses sampai server diaktifkan kembali.</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-blue-950 flex items-center justify-center p-4 font-sans">
        <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden">
          <div className="bg-yellow-400 p-8 text-center relative">
            <Library size={40} className="mx-auto text-blue-900 mb-2" />
            <h2 className="font-black text-2xl text-blue-900 uppercase italic tracking-tighter">Smansa Library</h2>
            <p className="text-[10px] font-bold text-blue-800 uppercase tracking-[0.4em]">Database Terpusat</p>
          </div>
          
          <div className="flex border-b border-gray-100">
            <button 
              onClick={() => { setUserType('siswa'); setIsRegistering(false); }} 
              className={`flex-1 py-4 text-xs font-black uppercase tracking-widest flex justify-center items-center gap-2 ${userType === 'siswa' ? 'bg-blue-50 text-blue-900 border-b-4 border-blue-900' : 'text-gray-400'}`}
            >
              <GraduationCap size={16}/> Siswa
            </button>
            <button 
              onClick={() => { setUserType('admin'); setIsRegistering(false); }} 
              className={`flex-1 py-4 text-xs font-black uppercase tracking-widest flex justify-center items-center gap-2 ${userType === 'admin' ? 'bg-blue-50 text-blue-900 border-b-4 border-blue-900' : 'text-gray-400'}`}
            >
              <KeyRound size={16}/> Admin
            </button>
          </div>

          <div className="p-8">
            <h3 className="font-black text-center uppercase tracking-widest text-sm mb-6 text-gray-700">
              {isRegistering ? `Pendaftaran ${userType === 'admin' ? 'Admin' : 'Siswa'}` : `Login ${userType === 'admin' ? 'Admin' : 'Siswa'}`}
            </h3>
            
            {isRegistering ? (
              <form onSubmit={handleRegister} className="space-y-4 animate-fadeIn">
                <input required placeholder="Nama Lengkap" className="w-full p-4 bg-gray-50 border rounded-2xl outline-none focus:border-blue-500" value={regForm.name} onChange={e => setRegForm({...regForm, name: e.target.value})} />
                <input required placeholder="Username" className="w-full p-4 bg-gray-50 border rounded-2xl outline-none focus:border-blue-500" value={regForm.username} onChange={e => setRegForm({...regForm, username: e.target.value})} />
                <input required type={userType === 'siswa' ? 'text' : 'password'} placeholder={userType === 'siswa' ? "Masukkan NISN (Sebagai Sandi)" : "Buat Password Admin"} className="w-full p-4 bg-gray-50 border rounded-2xl font-mono outline-none focus:border-blue-500" value={regForm.password} onChange={e => setRegForm({...regForm, password: e.target.value})} />
                
                <button className="w-full bg-blue-900 text-white p-4 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-800 transition-all mt-2 shadow-lg">Daftar Sekarang</button>
                <button type="button" onClick={() => setIsRegistering(false)} className="w-full text-xs font-bold text-blue-600 uppercase italic mt-4 hover:underline">Sudah punya akun? Login</button>
              </form>
            ) : (
              <form onSubmit={handleLogin} className="space-y-4 animate-fadeIn">
                <input required placeholder="Username" className="w-full p-4 bg-gray-50 border rounded-2xl outline-none focus:border-blue-500" value={loginForm.username} onChange={e => setLoginForm({...loginForm, username: e.target.value})} />
                <input required type="password" placeholder={userType === 'siswa' ? "Password (NISN)" : "Password Admin"} className="w-full p-4 bg-gray-50 border rounded-2xl font-mono outline-none focus:border-blue-500" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} />
                
                <button className="w-full bg-blue-900 text-white p-4 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-800 shadow-lg transition-all mt-2">Masuk</button>
                <button type="button" onClick={() => setIsRegistering(true)} className="w-full text-xs font-bold text-blue-600 uppercase italic mt-4 hover:underline">Belum punya akun? Register</button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <nav className="bg-blue-900 text-white p-5 shadow-2xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentView('home')}>
            <div className="bg-yellow-400 p-2 rounded-xl text-blue-900"><Library size={24}/></div>
            <span className="font-black text-xl tracking-tighter uppercase italic">SMANSA</span>
          </div>
          
          <div className="flex items-center gap-5">
            {user.level === 'Admin' && (
              <button 
                onClick={() => setCurrentView(currentView === 'admin' ? 'home' : 'admin')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black text-xs uppercase transition-all ${currentView === 'admin' ? 'bg-yellow-400 text-blue-900' : 'bg-blue-800 text-blue-200 hover:bg-blue-700'}`}
              >
                <Shield size={16}/> {currentView === 'admin' ? 'Tutup Panel' : 'Panel Admin'}
              </button>
            )}
            <button onClick={() => { setUser(null); setCurrentView('home'); }} className="p-2 bg-red-500/20 text-red-300 rounded-xl hover:bg-red-500/40"><LogOut size={20}/></button>
          </div>
        </div>
      </nav>

      <main className="flex-grow p-6 md:p-10 max-w-7xl mx-auto w-full">
        {currentView === 'home' && (
          <div className="space-y-10 animate-fadeIn">
            <div className="bg-gradient-to-br from-blue-900 to-blue-800 p-12 rounded-[3.5rem] text-white relative overflow-hidden shadow-2xl border-b-8 border-yellow-400">
               <div className="relative z-10">
                  <h1 className="text-5xl font-black italic uppercase tracking-tighter leading-none">Halo, {user.name.split(' ')[0]}!</h1>
                  <p className="text-blue-200 mt-4 text-lg font-medium opacity-80">Siap menjelajahi ilmu hari ini?</p>
               </div>
               <div className="absolute -top-10 -right-10 opacity-10 rotate-12"><BookOpen size={250}/></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {books.map(book => (
                <div key={book.id} className="bg-white rounded-[2.5rem] shadow-lg hover:shadow-2xl transition-all overflow-hidden flex flex-col group border border-transparent hover:border-blue-200">
                  <div className="h-64 bg-slate-100 relative overflow-hidden">
                    <img src={book.cover || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=300'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute top-4 left-4 bg-blue-900 text-yellow-400 text-[9px] font-black px-3 py-1.5 rounded-full uppercase">Kelas {book.grade}</div>
                  </div>
                  <div className="p-6 flex-grow flex flex-col justify-between">
                    <div>
                      <h3 className="font-black text-gray-800 text-lg leading-tight mb-1">{book.title}</h3>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest italic">{book.author}</p>
                    </div>
                    <button 
                      onClick={() => setReadingBook(book)}
                      className="w-full mt-5 bg-slate-900 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-blue-900 transition-all shadow-md"
                    >
                      Baca Sekarang
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

        {currentView === 'admin' && user.level === 'Admin' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="flex bg-white p-3 rounded-[2rem] shadow-lg border">
              {['siswa', 'statistik', 'koleksi'].map(t => (
                <button key={t} onClick={() => setAdminTab(t)} className={`flex-1 py-4 px-6 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${adminTab === t ? 'bg-blue-900 text-white shadow-xl scale-[1.02]' : 'text-gray-400 hover:bg-gray-50'}`}>
                  {t}
                </button>
              ))}
            </div>

            {adminTab === 'statistik' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white p-10 rounded-[3rem] shadow-xl border-b-8 border-blue-500">
                  <p className="text-xs font-black text-gray-400 uppercase mb-3">Kunjungan</p>
                  <h2 className="text-6xl font-black text-blue-900">{stats.totalVisits}</h2>
                </div>
                <div className="bg-white p-10 rounded-[3rem] shadow-xl border-b-8 border-green-500">
                  <p className="text-xs font-black text-gray-400 uppercase mb-3">Online</p>
                  <h2 className="text-6xl font-black text-green-500">{stats.active}</h2>
                </div>
                <div className="bg-white p-10 rounded-[3rem] shadow-xl border-b-8 border-purple-500">
                  <p className="text-xs font-black text-gray-400 uppercase mb-3">Membaca</p>
                  <h2 className="text-6xl font-black text-purple-500">{stats.reading}</h2>
                </div>
              </div>
            )}

            {adminTab === 'siswa' && (
              <div className="bg-white p-10 rounded-[3.5rem] shadow-xl space-y-8">
                <h2 className="text-2xl font-black uppercase italic flex items-center gap-3"><Users className="text-blue-900" size={32}/> Data Master Siswa</h2>
                <form onSubmit={addStudent} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
                  <input required placeholder="Nama Lengkap" className="p-5 bg-gray-50 rounded-2xl border text-sm" value={studentInput.name} onChange={e => setStudentInput({...studentInput, name: e.target.value})} />
                  <input required placeholder="NISN Resmi" className="p-5 bg-gray-50 rounded-2xl border text-sm font-mono" value={studentInput.nisn} onChange={e => setStudentInput({...studentInput, nisn: e.target.value})} />
                  <select className="p-5 bg-gray-50 rounded-2xl border font-black text-xs" value={studentInput.grade} onChange={e => setStudentInput({...studentInput, grade: e.target.value})}>
                    <option>X</option><option>XI</option><option>XII</option>
                  </select>
                  <select className="p-5 bg-gray-50 rounded-2xl border font-black text-xs" value={studentInput.sub} onChange={e => setStudentInput({...studentInput, sub: e.target.value})}>
                    {[...Array(11)].map((_, i) => <option key={i+1} value={i+1}>Kelas {i+1}</option>)}
                  </select>
                  <button className="bg-blue-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-blue-800">Simpan</button>
                </form>
              </div>
            )}

            {adminTab === 'koleksi' && (
              <div className="bg-white p-8 rounded-3xl border shadow-sm">
                  <h3 className="font-black text-sm uppercase mb-6 flex items-center gap-2"><Database size={16} className="text-blue-600"/> Manajemen Koleksi</h3>
                  <div className="p-10 border-2 border-dashed rounded-3xl text-center text-gray-400">
                    <p className="font-bold uppercase tracking-widest text-xs italic">Modul manajemen koleksi berjalan dengan baik.</p>
                  </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* PDF View Modal */}
      {readingBook && (
        <div className="fixed inset-0 z-[200] bg-black/95 flex flex-col p-4 md:p-10 animate-fadeIn">
          <div className="max-w-6xl mx-auto w-full h-full bg-white rounded-[3rem] overflow-hidden shadow-2xl flex flex-col">
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="bg-yellow-400 p-2.5 rounded-xl text-blue-900"><BookIcon size={20}/></div>
                <div>
                  <h3 className="font-black text-sm uppercase leading-none">{readingBook.title}</h3>
                  <p className="text-[10px] font-bold text-gray-500 uppercase mt-1 italic">{readingBook.author}</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setReadingBook(null);
                  fetch(`${API_URL}/stats/reading-stop`, {method:'POST'});
                }} 
                className="bg-red-500 p-3 rounded-2xl hover:bg-red-600 transition-all"
              >
                <X size={20}/>
              </button>
            </div>
            <div className="flex-grow bg-slate-100 flex items-center justify-center">
              <div className="text-center opacity-20">
                <FileText size={100} className="mx-auto mb-4" />
                <p className="font-black uppercase tracking-widest text-sm">Menghubungkan ke Storage Server...</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notif */}
      {notification && (
        <div className={`fixed bottom-10 left-1/2 -translate-x-1/2 z-[300] px-10 py-5 rounded-[2rem] shadow-2xl border animate-slideUp flex items-center gap-4 ${notification.type === 'error' ? 'bg-red-600 text-white border-red-400' : 'bg-blue-900 text-white border-blue-700'}`}>
           {notification.type === 'error' ? <XCircle size={20}/> : <CheckCircle size={20}/>}
           <span className="font-black text-xs uppercase tracking-widest italic">{notification.msg}</span>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translate(-50%, 100%); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out; }
        .animate-slideUp { animation: slideUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
      `}} />
    </div>
  );
}