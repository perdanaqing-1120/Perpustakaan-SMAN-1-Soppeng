import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Users, Upload, Shield, Home, Search, Trash2, Library, 
  CheckCircle, XCircle, Menu, X, Check, PlusCircle, ChevronDown, 
  FileText, Book as BookIcon, GraduationCap, Image as ImageIcon,
  Activity, Eye, Globe, UserPlus, LogOut, Key, Database, Layers, Info
} from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

export default function App() {
  // Auth State
  const [user, setUser] = useState(null);
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Data State
  const [books, setBooks] = useState([]);
  const [serverStatus, setServerStatus] = useState('checking'); // 'online', 'offline'
  
  // URL / Path State (Untuk akses admin via link)
  const [path, setPath] = useState(window.location.pathname);
  
  // UI State
  const [currentView, setCurrentView] = useState('home');
  const [notification, setNotification] = useState(null);
  const [readingBook, setReadingBook] = useState(null);
  const [adminTab, setAdminTab] = useState('koleksi');
  const [stats, setStats] = useState({ active: 0, reading: 0, totalVisits: 0 });

  // Form State
  const [loginForm, setLoginForm] = useState({ username: 'perdana', password: '12345' });
  const [regForm, setRegForm] = useState({ username: '', password: '', name: '' });
  const [studentInput, setStudentInput] = useState({ name: '', nisn: '', grade: 'X', sub: '1' });

  // Update path saat URL berubah secara manual
  useEffect(() => {
    const handleLocationChange = () => {
      setPath(window.location.pathname);
    };
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  // --- SERVER SYNC ---
  useEffect(() => {
    const checkServer = async () => {
      try {
        const res = await fetch(`${API_URL}/books`);
        if (res.ok) {
          const data = await res.json();
          setBooks(data);
          setServerStatus('online');
          fetch(`${API_URL}/stats/visit`, { method: 'POST' });
        }
      } catch (e) {
        setServerStatus('offline');
        setBooks([]);
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

  // --- AUTH LOGIC ---
  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regForm)
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data);
        showNotif("Registrasi Berhasil! Selamat datang.");
      } else {
        showNotif(data.message, "error");
      }
    } catch (e) { showNotif("Server Offline", "error"); }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    // Hardcoded Admin
    if (loginForm.username === 'admin' && loginForm.password === 'admin123') {
      setUser({ name: 'Super Admin', level: 'Admin' });
      return;
    }
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

  // --- ADMIN LOGIC ---
  const addStudent = async (e) => {
    e.preventDefault();
    const newStudent = { 
        name: studentInput.name, 
        nisn: studentInput.nisn, 
        grade: studentInput.grade, 
        subClass: studentInput.sub 
    };
    try {
        await fetch(`${API_URL}/students/bulk`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ students: [newStudent] })
        });
        showNotif(`Siswa ${newStudent.name} terdaftar di Database Sekolah`);
        setStudentInput({ ...studentInput, name: '', nisn: '' });
    } catch (e) { showNotif("Gagal simpan", "error"); }
  };

  // --- RENDERER ---
  if (serverStatus === 'offline') {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center p-6 text-center">
        <div className="bg-white p-10 rounded-3xl shadow-2xl border-4 border-red-500 max-w-md">
          <Activity size={64} className="mx-auto text-red-500 mb-4 animate-pulse" />
          <h1 className="text-2xl font-black text-gray-800 uppercase">Perpustakaan Offline</h1>
          <p className="text-gray-500 mt-2 font-medium">Server lokal belum dinyalakan. Hubungi admin laboratorium untuk mengaktifkan Node.js.</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-blue-900 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
          <div className="bg-yellow-400 p-8 text-center">
            <Library size={48} className="mx-auto text-blue-900 mb-2" />
            <h2 className="font-black text-2xl text-blue-900 uppercase italic">Pustaka Smansa</h2>
            <p className="text-[10px] font-bold text-blue-800 tracking-[0.3em] uppercase">E-Library System V2</p>
          </div>
          
          <div className="p-8">
            {isRegistering ? (
              <form onSubmit={handleRegister} className="space-y-4">
                <h3 className="font-black text-center uppercase tracking-widest text-sm mb-4">Pendaftaran Akun Baru</h3>
                <input required placeholder="Nama Lengkap" className="w-full p-4 bg-gray-50 border rounded-2xl" value={regForm.name} onChange={e => setRegForm({...regForm, name: e.target.value})} />
                <input required placeholder="Username Bebas" className="w-full p-4 bg-gray-50 border rounded-2xl" value={regForm.username} onChange={e => setRegForm({...regForm, username: e.target.value})} />
                <input required placeholder="Masukkan NISN (Sebagai Sandi)" className="w-full p-4 bg-gray-50 border rounded-2xl font-mono" value={regForm.password} onChange={e => setRegForm({...regForm, password: e.target.value})} />
                <button className="w-full bg-blue-900 text-white p-4 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-800">Daftar Sekarang</button>
                <button type="button" onClick={() => setIsRegistering(false)} className="w-full text-[10px] font-bold text-blue-600 uppercase">Sudah punya akun? Login</button>
              </form>
            ) : (
              <form onSubmit={handleLogin} className="space-y-4">
                <h3 className="font-black text-center uppercase tracking-widest text-sm mb-4">Login Pengguna</h3>
                <input required placeholder="Username" className="w-full p-4 bg-gray-50 border rounded-2xl" value={loginForm.username} onChange={e => setLoginForm({...loginForm, username: e.target.value})} />
                <input required type="password" placeholder="NISN" className="w-full p-4 bg-gray-50 border rounded-2xl font-mono" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} />
                <button className="w-full bg-blue-900 text-white p-4 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-800">Masuk</button>
                <button type="button" onClick={() => setIsRegistering(true)} className="w-full text-[10px] font-bold text-blue-600 uppercase">Baru pertama kali? Register</button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- LOGIC: Akses Admin harus via URL /admin/dashboard ---
  const isAdminPath = path === '/admin/dashboard';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* NAVBAR */}
      <nav className="bg-blue-900 text-white p-4 shadow-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentView('home')}>
            <div className="bg-yellow-400 p-2 rounded-xl text-blue-900"><Library size={20}/></div>
            <span className="font-black tracking-tighter uppercase italic">Smansa Library</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden md:block">
                <p className="text-[10px] font-black uppercase tracking-widest text-yellow-400">{user.level}</p>
                <p className="text-xs font-bold">{user.name}</p>
            </div>
            
            {/* Tombol Shield hanya muncul jika User adalah Admin DAN link-nya /admin/dashboard */}
            {user.level === 'Admin' && isAdminPath && (
              <button 
                onClick={() => setCurrentView(currentView === 'admin' ? 'home' : 'admin')} 
                className={`p-2 rounded-lg transition-all ${currentView === 'admin' ? 'bg-yellow-400 text-blue-900' : 'hover:bg-blue-800'}`}
              >
                <Shield size={18}/>
              </button>
            )}
            
            <button onClick={() => setUser(null)} className="p-2 bg-red-500/20 text-red-300 rounded-lg"><LogOut size={18}/></button>
          </div>
        </div>
      </nav>

      <main className="flex-grow p-4 md:p-8 max-w-7xl mx-auto w-full">
        {/* Konten Home */}
        {currentView === 'home' && (
            <div className="space-y-8 animate-fadeIn">
                <div className="bg-blue-900 p-8 rounded-[2rem] text-white overflow-hidden relative shadow-2xl">
                    <div className="relative z-10">
                        <h1 className="text-4xl font-black italic uppercase tracking-tighter">Selamat Datang, {user.name.split(' ')[0]}!</h1>
                        <p className="text-blue-200 mt-2 font-medium">Akses ribuan buku digital dari genggamanmu.</p>
                    </div>
                    <div className="absolute top-0 right-0 p-10 opacity-10 rotate-12"><BookOpen size={120}/></div>
                </div>

                {/* Pesan Rahasia jika user admin tapi belum di link dashboard */}
                {user.level === 'Admin' && !isAdminPath && (
                  <div className="bg-yellow-50 border-2 border-yellow-200 p-4 rounded-2xl flex items-center gap-3 text-yellow-800">
                    <Info size={20} />
                    <p className="text-xs font-bold uppercase italic">Mode Admin terdeteksi. Gunakan tautan "/admin/dashboard" untuk mengakses panel kontrol.</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {books.length > 0 ? books.map(book => (
                        <div key={book.id} className="bg-white rounded-3xl shadow-sm hover:shadow-xl transition-all border border-gray-100 overflow-hidden flex flex-col">
                            <div className="h-56 bg-gray-200 relative">
                                <img src={book.cover || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=300&q=80'} className="w-full h-full object-cover" />
                                <div className="absolute top-3 left-3 bg-yellow-400 text-blue-900 text-[8px] font-black px-2 py-1 rounded-lg uppercase">Kelas {book.grade}</div>
                            </div>
                            <div className="p-5 flex-grow">
                                <h3 className="font-bold text-gray-800 line-clamp-1">{book.title}</h3>
                                <p className="text-[10px] font-black text-gray-400 uppercase mt-1">{book.author}</p>
                                <button 
                                    onClick={() => {
                                        setReadingBook(book);
                                        fetch(`${API_URL}/stats/reading-start`, {method:'POST'});
                                    }} 
                                    className="w-full mt-4 bg-blue-900 text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-800 transition-colors"
                                >
                                    Baca Digital
                                </button>
                            </div>
                        </div>
                    )) : (
                      <div className="col-span-full py-20 text-center text-gray-400">
                        <Library size={48} className="mx-auto mb-4 opacity-20" />
                        <p className="font-bold uppercase tracking-widest text-sm">Belum ada buku tersedia.</p>
                      </div>
                    )}
                </div>
            </div>
        )}

        {/* Konten Admin (Hanya jika level Admin DAN di path yang benar) */}
        {currentView === 'admin' && user.level === 'Admin' && isAdminPath ? (
            <div className="space-y-6 animate-fadeIn">
                <div className="flex bg-white p-2 rounded-2xl shadow-sm border overflow-x-auto">
                    {['koleksi', 'siswa', 'statistik'].map(tab => (
                        <button key={tab} onClick={() => setAdminTab(tab)} className={`flex-1 py-3 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${adminTab === tab ? 'bg-blue-900 text-white' : 'text-gray-400 hover:bg-gray-50'}`}>
                            {tab}
                        </button>
                    ))}
                </div>

                {adminTab === 'statistik' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-8 rounded-3xl shadow-lg border-b-8 border-blue-500">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Total Kunjungan</p>
                            <h2 className="text-5xl font-black text-blue-900 tracking-tighter">{stats.totalVisits}</h2>
                        </div>
                        <div className="bg-white p-8 rounded-3xl shadow-lg border-b-8 border-green-500">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Online Sekarang</p>
                            <h2 className="text-5xl font-black text-green-600 tracking-tighter">{stats.active}</h2>
                        </div>
                        <div className="bg-white p-8 rounded-3xl shadow-lg border-b-8 border-purple-500">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Sedang Membaca</p>
                            <h2 className="text-5xl font-black text-purple-600 tracking-tighter">{stats.reading}</h2>
                        </div>
                    </div>
                )}

                {adminTab === 'siswa' && (
                    <div className="bg-white p-8 rounded-3xl shadow-sm border space-y-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-blue-100 text-blue-900 rounded-2xl"><Users size={24}/></div>
                            <h2 className="text-xl font-black uppercase">Input Database Siswa (NISN)</h2>
                        </div>
                        <form onSubmit={addStudent} className="grid grid-cols-1 md:grid-cols-5 gap-4">
                            <input required placeholder="Nama Siswa" className="p-4 border rounded-2xl bg-gray-50 text-sm" value={studentInput.name} onChange={e => setStudentInput({...studentInput, name: e.target.value})} />
                            <input required placeholder="NISN Resmi" className="p-4 border rounded-2xl bg-gray-50 text-sm font-mono" value={studentInput.nisn} onChange={e => setStudentInput({...studentInput, nisn: e.target.value})} />
                            <select className="p-4 border rounded-2xl bg-gray-50 font-bold" value={studentInput.grade} onChange={e => setStudentInput({...studentInput, grade: e.target.value})}>
                                <option>X</option><option>XI</option><option>XII</option>
                            </select>
                            <select className="p-4 border rounded-2xl bg-gray-50 font-bold" value={studentInput.sub} onChange={e => setStudentInput({...studentInput, sub: e.target.value})}>
                                {[...Array(11)].map((_, i) => <option key={i+1} value={i+1}>{studentInput.grade}-{i+1}</option>)}
                            </select>
                            <button className="bg-blue-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl">Daftarkan</button>
                        </form>
                    </div>
                )}

                {adminTab === 'koleksi' && (
                    <div className="bg-white p-8 rounded-3xl border shadow-sm">
                        <h3 className="font-black text-sm uppercase mb-6 flex items-center gap-2"><Database size={16} className="text-blue-600"/> Manajemen Koleksi</h3>
                        <div className="p-10 border-2 border-dashed rounded-3xl text-center text-gray-400">
                          <p className="font-bold uppercase tracking-widest text-xs italic">Modul upload buku sedang sinkron...</p>
                        </div>
                    </div>
                )}
            </div>
        ) : currentView === 'admin' && (!isAdminPath || user.level !== 'Admin') ? (
            <div className="bg-white p-20 rounded-[3rem] text-center shadow-2xl">
              <XCircle size={64} className="mx-auto text-red-500 mb-6" />
              <h2 className="text-2xl font-black uppercase text-gray-800">Akses Ditolak</h2>
              <p className="text-gray-500 mt-2 font-medium">Halaman ini hanya dapat diakses melalui link dashboard resmi admin.</p>
              <button onClick={() => setCurrentView('home')} className="mt-8 bg-blue-900 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs">Kembali ke Beranda</button>
            </div>
        ) : null}
      </main>

      {/* PDF READER MODAL */}
      {readingBook && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col p-4 md:p-8 animate-fadeIn">
            <div className="max-w-6xl mx-auto w-full h-full flex flex-col bg-white rounded-3xl overflow-hidden shadow-2xl">
                <div className="p-4 bg-gray-900 text-white flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-yellow-400 rounded-xl flex items-center justify-center text-blue-900"><BookIcon size={20}/></div>
                        <div>
                            <h2 className="font-black text-sm uppercase leading-none">{readingBook.title}</h2>
                            <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase italic tracking-widest">{readingBook.author}</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => {
                            setReadingBook(null);
                            fetch(`${API_URL}/stats/reading-stop`, {method:'POST'});
                        }} 
                        className="bg-red-500 p-3 rounded-xl hover:bg-red-600 shadow-lg"
                    >
                        <X size={20}/>
                    </button>
                </div>
                <div className="flex-grow bg-gray-200">
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <FileText size={80} className="mb-4 opacity-10" />
                        <p className="font-black uppercase tracking-widest">Konten buku dimuat dari server...</p>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* TOAST NOTIFIKASI */}
      {notification && (
        <div className={`fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] px-8 py-4 rounded-2xl shadow-2xl border animate-slideUp flex items-center gap-3 ${notification.type === 'error' ? 'bg-red-600 text-white border-red-500' : 'bg-blue-900 text-white border-blue-700'}`}>
          <div className="bg-white/20 p-2 rounded-lg">
            {notification.type === 'error' ? <X size={16}/> : <CheckCircle size={16}/>}
          </div>
          <p className="font-bold text-xs uppercase tracking-widest">{notification.msg}</p>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translate(-50%, 100%); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }
        .animate-fadeIn { animation: fadeIn 0.5s ease; }
        .animate-slideUp { animation: slideUp 0.4s ease forwards; }
      `}} />
    </div>
  );
}