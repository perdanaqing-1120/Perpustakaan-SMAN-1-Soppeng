import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Users, Shield, Library, X, FileText, Book as BookIcon, 
  Activity, LogOut, Database, CheckCircle, XCircle, Info, KeyRound, GraduationCap,
  PlusCircle, Edit3, Trash2, Check, UserPlus
} from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

export default function App() {
  // Auth State
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState('siswa'); // 'siswa' atau 'admin'
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Data State
  const [books, setBooks] = useState([]);
  const [adminsList, setAdminsList] = useState([]);
  const [serverStatus, setServerStatus] = useState('checking'); 
  
  // UI State
  const [currentView, setCurrentView] = useState('home');
  const [notification, setNotification] = useState(null);
  const [readingBook, setReadingBook] = useState(null);
  const [adminTab, setAdminTab] = useState('koleksi');
  const [stats, setStats] = useState({ active: 0, reading: 0, totalVisits: 0 });

  // Form State
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [regForm, setRegForm] = useState({ username: '', password: '', name: '' });
  const [studentInput, setStudentInput] = useState({ name: '', nisn: '', grade: 'X', sub: '1' });
  const [bookForm, setBookForm] = useState({ title: '', author: '', grade: 'X', category: 'Umum', coverBase64: '', fileBase64: '' });
  const [newAdminForm, setNewAdminForm] = useState({ username: '', password: '', name: '' });
  const [editingBook, setEditingBook] = useState(null);

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
        setBooks([]); // Buku kosong jika server mati
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

  // Mengambil daftar Admin jika user yang login adalah Admin
  useEffect(() => {
    if (user && user.level === 'Admin' && currentView === 'admin' && adminTab === 'admin') {
      fetch(`${API_URL}/admins`)
        .then(res => res.json())
        .then(data => setAdminsList(data))
        .catch(err => console.error("Gagal memuat admin", err));
    }
  }, [user, currentView, adminTab]);

  const showNotif = (msg, type = 'success') => setNotification({ msg, type });

  // --- AUTH LOGIC ---
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data);
        showNotif(`Selamat Datang, ${data.name}`);
        if(data.level === 'Admin') setCurrentView('admin');
      } else {
        showNotif(data.message, "error");
      }
    } catch (e) { showNotif("Server Offline", "error"); }
  };

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
        showNotif("Registrasi Siswa Berhasil!");
      } else {
        showNotif(data.message, "error"); // Muncul misal jika NISN tidak valid
      }
    } catch (e) { showNotif("Server Offline", "error"); }
  };

  // --- ADMIN LOGIC: SISWA ---
  const addStudent = async (e) => {
    e.preventDefault();
    try {
      await fetch(`${API_URL}/students/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ students: [{ ...studentInput, subClass: studentInput.sub }] })
      });
      showNotif(`NISN ${studentInput.nisn} terdaftar di Master Data!`);
      setStudentInput({ ...studentInput, name: '', nisn: '' });
    } catch (e) { showNotif("Gagal simpan ke server", "error"); }
  };

  // --- ADMIN LOGIC: KOLEKSI BUKU ---
  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.readAsDataURL(file);
      fileReader.onload = () => resolve(fileReader.result);
      fileReader.onerror = (error) => reject(error);
    });
  };

  const handleFileUpload = async (e, field) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showNotif("Ukuran file maksimal 5MB.", "error");
        return;
      }
      const base64 = await convertToBase64(file);
      setBookForm({ ...bookForm, [field]: base64 });
    }
  };

  const handleAdminAddBook = async (e) => {
    e.preventDefault();
    const newBook = {
      id: Date.now().toString(),
      ...bookForm,
      type: 'ebook',
      status: 'approved',
      cover: bookForm.coverBase64 || 'https://images.unsplash.com/photo-1516110833967-0b5716ca1387?auto=format&fit=crop&w=300&q=80',
    };
    try {
      await fetch(`${API_URL}/books`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newBook) });
      setBooks([...books, newBook]);
      showNotif("Buku Pelajaran berhasil diunggah!");
      setBookForm({ title: '', author: '', grade: 'X', category: 'Umum', coverBase64: '', fileBase64: '' });
    } catch (error) { showNotif("Gagal menyimpan ke server.", "error"); }
  };

  const handleApprove = async (id) => {
    const bookToApprove = books.find(b => b.id === id);
    if (!bookToApprove) return;
    const updatedBook = { ...bookToApprove, status: 'approved' };
    try {
      await fetch(`${API_URL}/books/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updatedBook) });
      setBooks(books.map(b => b.id === id ? updatedBook : b));
      showNotif("Buku diterbitkan publik!");
    } catch (error) { showNotif("Gagal ACC", "error"); }
  };

  const handleDeleteBook = async (id) => {
    if(confirm("Hapus buku ini selamanya?")) {
      try {
        await fetch(`${API_URL}/books/${id}`, { method: 'DELETE' });
        setBooks(books.filter(b => b.id !== id));
        showNotif("Buku terhapus.", "info");
      } catch (error) { showNotif("Gagal menghapus.", "error"); }
    }
  };

  // --- ADMIN LOGIC: KELOLA ADMIN ---
  const handleAddAdmin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/admins`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAdminForm)
      });
      const data = await res.json();
      setAdminsList([...adminsList, data]);
      setNewAdminForm({ username: '', password: '', name: '' });
      showNotif("Akun Admin baru berhasil dibuat!");
    } catch (error) { showNotif("Gagal membuat admin", "error"); }
  };

  const handleDeleteAdmin = async (id) => {
    if(confirm("Hapus akun admin ini?")) {
      try {
        await fetch(`${API_URL}/admins/${id}`, { method: 'DELETE' });
        setAdminsList(adminsList.filter(a => a.id !== id));
        showNotif("Admin dihapus.", "info");
      } catch (error) { showNotif("Gagal menghapus.", "error"); }
    }
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
              className={`flex-1 py-4 text-xs font-black uppercase tracking-widest flex justify-center items-center gap-2 transition-colors ${userType === 'siswa' ? 'bg-blue-50 text-blue-900 border-b-4 border-blue-900' : 'text-gray-400 hover:bg-gray-50'}`}
            >
              <GraduationCap size={16}/> Siswa
            </button>
            <button 
              onClick={() => { setUserType('admin'); setIsRegistering(false); }} 
              className={`flex-1 py-4 text-xs font-black uppercase tracking-widest flex justify-center items-center gap-2 transition-colors ${userType === 'admin' ? 'bg-blue-50 text-blue-900 border-b-4 border-blue-900' : 'text-gray-400 hover:bg-gray-50'}`}
            >
              <KeyRound size={16}/> Admin
            </button>
          </div>

          <div className="p-8">
            {userType === 'siswa' && isRegistering ? (
              <form onSubmit={handleRegister} className="space-y-4 animate-fadeIn">
                <h3 className="font-black text-center uppercase tracking-widest text-sm mb-4 text-gray-700">Pendaftaran Siswa</h3>
                <input required placeholder="Nama Lengkap" className="w-full p-4 bg-gray-50 border rounded-2xl outline-none focus:border-blue-500" value={regForm.name} onChange={e => setRegForm({...regForm, name: e.target.value})} />
                <input required placeholder="Username Bebas" className="w-full p-4 bg-gray-50 border rounded-2xl outline-none focus:border-blue-500" value={regForm.username} onChange={e => setRegForm({...regForm, username: e.target.value})} />
                <input required placeholder="NISN Sekolah (Sebagai Sandi)" className="w-full p-4 bg-gray-50 border rounded-2xl font-mono outline-none focus:border-blue-500" value={regForm.password} onChange={e => setRegForm({...regForm, password: e.target.value})} />
                <button className="w-full bg-blue-900 text-white p-4 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-800 transition-all mt-2 shadow-lg">Daftar Sekarang</button>
                <button type="button" onClick={() => setIsRegistering(false)} className="w-full text-xs font-bold text-blue-600 uppercase italic mt-4 hover:underline">Sudah punya akun? Login</button>
              </form>
            ) : (
              <form onSubmit={handleLogin} className="space-y-4 animate-fadeIn">
                <h3 className="font-black text-center uppercase tracking-widest text-sm mb-4 text-gray-700">
                  {userType === 'admin' ? 'Akses Petugas Admin' : 'Login Siswa'}
                </h3>
                <input required placeholder="Username" className="w-full p-4 bg-gray-50 border rounded-2xl outline-none focus:border-blue-500" value={loginForm.username} onChange={e => setLoginForm({...loginForm, username: e.target.value})} />
                <input required type="password" placeholder={userType === 'admin' ? "Password Admin" : "Password (NISN)"} className="w-full p-4 bg-gray-50 border rounded-2xl font-mono outline-none focus:border-blue-500" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} />
                <button className="w-full bg-blue-900 text-white p-4 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-800 shadow-lg transition-all mt-2">Masuk</button>
                {userType === 'siswa' && (
                  <button type="button" onClick={() => setIsRegistering(true)} className="w-full text-xs font-bold text-blue-600 uppercase italic mt-4 hover:underline">Belum punya akun? Register NISN</button>
                )}
                {userType === 'admin' && (
                  <p className="w-full text-center text-[10px] font-bold text-gray-400 uppercase italic mt-4">Gunakan "admin" / "admin1234" untuk login awal</p>
                )}
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
              {books.filter(b => b.status === 'approved').map(book => (
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
                      className={`w-full mt-5 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-md ${book.fileBase64 ? 'bg-slate-900 hover:bg-blue-900' : 'bg-gray-400 cursor-not-allowed'}`}
                    >
                      {book.fileBase64 ? 'Baca Sekarang' : 'File Kosong'}
                    </button>
                  </div>
                </div>
              ))}
              {books.filter(b => b.status === 'approved').length === 0 && (
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
            <div className="flex bg-white p-3 rounded-[2rem] shadow-lg border overflow-x-auto">
              {['koleksi', 'siswa', 'statistik', 'admin'].map(t => (
                <button key={t} onClick={() => setAdminTab(t)} className={`flex-1 py-4 px-6 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${adminTab === t ? 'bg-blue-900 text-white shadow-xl scale-[1.02]' : 'text-gray-400 hover:bg-gray-50'}`}>
                  {t === 'admin' ? 'Akun Admin' : t}
                </button>
              ))}
            </div>

            {adminTab === 'statistik' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white p-10 rounded-[3rem] shadow-xl border-b-8 border-blue-500">
                  <p className="text-xs font-black text-gray-400 uppercase mb-3">Total Kunjungan</p>
                  <h2 className="text-6xl font-black text-blue-900">{stats.totalVisits}</h2>
                </div>
                <div className="bg-white p-10 rounded-[3rem] shadow-xl border-b-8 border-green-500">
                  <p className="text-xs font-black text-gray-400 uppercase mb-3">Orang Aktif</p>
                  <h2 className="text-6xl font-black text-green-500">{stats.active}</h2>
                </div>
                <div className="bg-white p-10 rounded-[3rem] shadow-xl border-b-8 border-purple-500">
                  <p className="text-xs font-black text-gray-400 uppercase mb-3">Sedang Membaca</p>
                  <h2 className="text-6xl font-black text-purple-500">{stats.reading}</h2>
                </div>
              </div>
            )}

            {adminTab === 'siswa' && (
              <div className="bg-white p-10 rounded-[3.5rem] shadow-xl space-y-8">
                <h2 className="text-2xl font-black uppercase italic flex items-center gap-3"><Users className="text-blue-900" size={32}/> Data Master Siswa</h2>
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-2xl">
                  <p className="text-xs text-blue-800 font-medium">Data NISN di bawah ini yang akan digunakan sebagai validasi saat Siswa mendaftar di halaman depan.</p>
                </div>
                <form onSubmit={addStudent} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
                  <input required placeholder="Nama Lengkap" className="p-5 bg-gray-50 rounded-2xl border text-sm" value={studentInput.name} onChange={e => setStudentInput({...studentInput, name: e.target.value})} />
                  <input required placeholder="NISN Resmi" className="p-5 bg-gray-50 rounded-2xl border text-sm font-mono" value={studentInput.nisn} onChange={e => setStudentInput({...studentInput, nisn: e.target.value})} />
                  <select className="p-5 bg-gray-50 rounded-2xl border font-black text-xs" value={studentInput.grade} onChange={e => setStudentInput({...studentInput, grade: e.target.value})}>
                    <option>X</option><option>XI</option><option>XII</option>
                  </select>
                  <select className="p-5 bg-gray-50 rounded-2xl border font-black text-xs" value={studentInput.sub} onChange={e => setStudentInput({...studentInput, sub: e.target.value})}>
                    {[...Array(11)].map((_, i) => <option key={i+1} value={i+1}>Kelas {i+1}</option>)}
                  </select>
                  <button className="bg-blue-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-blue-800">Simpan Database</button>
                </form>
              </div>
            )}

            {/* KEMBALIKAN MANAJEMEN KOLEKSI */}
            {adminTab === 'koleksi' && (
              <div className="space-y-8">
                <div className="bg-white p-10 rounded-[3.5rem] shadow-xl space-y-8">
                  <h3 className="font-black text-xl uppercase flex items-center gap-2"><PlusCircle className="text-blue-600"/> Input Buku Pelajaran</h3>
                  <form onSubmit={handleAdminAddBook} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <input required className="p-4 border rounded-2xl bg-gray-50 text-sm outline-none" placeholder="Judul Buku" value={bookForm.title} onChange={e => setBookForm({...bookForm, title: e.target.value})} />
                    <input required className="p-4 border rounded-2xl bg-gray-50 text-sm outline-none" placeholder="Penulis/Mapel" value={bookForm.author} onChange={e => setBookForm({...bookForm, author: e.target.value})} />
                    <select className="p-4 border rounded-2xl bg-gray-50 text-sm font-bold outline-none" value={bookForm.grade} onChange={e => setBookForm({...bookForm, grade: e.target.value})}>
                      <option value="X">Kelas X</option><option value="XI">Kelas XI</option><option value="XII">Kelas XII</option>
                    </select>
                    
                    <div className="md:col-span-3 grid grid-cols-2 gap-4">
                      <div className="p-3 border rounded-2xl bg-blue-50 text-xs flex items-center">
                        <ImageIcon size={16} className="text-gray-400 mr-2 shrink-0"/>
                        <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'coverBase64')} className="w-full" title="Thumbnail Sampul" />
                      </div>
                      <div className="p-3 border rounded-2xl bg-green-50 text-xs flex items-center border-dashed border-green-300">
                        <FileText size={16} className="text-green-600 mr-2 shrink-0"/>
                        <input required type="file" accept="application/pdf" onChange={(e) => handleFileUpload(e, 'fileBase64')} className="w-full text-green-800 font-bold" title="File PDF Buku" />
                      </div>
                    </div>
                    
                    <button type="submit" className="md:col-span-1 bg-blue-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-blue-800 transition-all">Posting Buku</button>
                  </form>
                </div>

                <div className="bg-white rounded-[3.5rem] shadow-xl overflow-hidden border">
                  <div className="p-8 bg-gray-50 border-b flex justify-between items-center">
                    <h3 className="font-black text-sm uppercase tracking-widest"><Database className="inline mb-1 mr-2 text-blue-600"/> Seluruh Koleksi ({books.length})</h3>
                  </div>
                  <div className="overflow-x-auto p-4">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-white text-[10px] font-black uppercase text-gray-400">
                        <tr>
                          <th className="p-6 border-b">Status</th>
                          <th className="p-6 border-b">Judul Koleksi</th>
                          <th className="p-6 border-b">Tipe / Kelas</th>
                          <th className="p-6 border-b text-center">Tindakan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {books.map(b => (
                          <tr key={b.id} className="hover:bg-blue-50/50 transition-colors">
                            <td className="p-6">
                              {b.status === 'pending' ? 
                                <span className="bg-orange-100 text-orange-600 px-3 py-1.5 rounded-full text-[9px] font-black uppercase shadow-sm">Perlu ACC</span> :
                                <span className="bg-green-100 text-green-600 px-3 py-1.5 rounded-full text-[9px] font-black uppercase shadow-sm">Aktif</span>
                              }
                            </td>
                            <td className="p-6">
                              <p className="font-bold text-gray-800 text-sm">{b.title}</p>
                              <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">{b.author}</p>
                            </td>
                            <td className="p-6">
                              <span className="text-[10px] font-black uppercase text-blue-600 block mb-1">{b.type === 'ebook' ? `Pelajaran` : `Komunitas`}</span>
                              <span className="text-[9px] font-bold text-gray-500">Kelas {b.grade}</span>
                            </td>
                            <td className="p-6 flex justify-center gap-3">
                              {b.status === 'pending' && (
                                <button onClick={() => handleApprove(b.id)} className="p-3 bg-green-500 text-white rounded-xl shadow-md hover:scale-110 transition-transform"><Check size={16}/></button>
                              )}
                              <button onClick={() => handleDeleteBook(b.id)} className="p-3 bg-red-100 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm"><Trash2 size={16}/></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB BARU: KELOLA AKUN ADMIN PENDAMPING */}
            {adminTab === 'admin' && (
              <div className="space-y-8">
                <div className="bg-white p-10 rounded-[3.5rem] shadow-xl space-y-6">
                  <h2 className="text-2xl font-black uppercase italic flex items-center gap-3"><UserPlus className="text-blue-900" size={32}/> Tambah Admin Baru</h2>
                  <form onSubmit={handleAddAdmin} className="grid grid-cols-1 md:grid-cols-4 gap-5">
                    <input required placeholder="Nama Guru/Admin" className="p-5 bg-gray-50 rounded-2xl border text-sm outline-none" value={newAdminForm.name} onChange={e => setNewAdminForm({...newAdminForm, name: e.target.value})} />
                    <input required placeholder="Username" className="p-5 bg-gray-50 rounded-2xl border text-sm outline-none" value={newAdminForm.username} onChange={e => setNewAdminForm({...newAdminForm, username: e.target.value})} />
                    <input required type="password" placeholder="Password Baru" className="p-5 bg-gray-50 rounded-2xl border text-sm font-mono outline-none" value={newAdminForm.password} onChange={e => setNewAdminForm({...newAdminForm, password: e.target.value})} />
                    <button className="bg-blue-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-blue-800">Buat Akun</button>
                  </form>
                </div>

                <div className="bg-white rounded-[3.5rem] shadow-xl overflow-hidden border">
                  <div className="p-8 bg-gray-50 border-b">
                    <h3 className="font-black text-sm uppercase tracking-widest">Daftar Admin Server</h3>
                  </div>
                  <div className="p-4">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-white text-[10px] font-black uppercase text-gray-400">
                        <tr>
                          <th className="p-6 border-b">Nama Lengkap</th>
                          <th className="p-6 border-b">Username Login</th>
                          <th className="p-6 border-b text-center">Tindakan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {adminsList.map(a => (
                          <tr key={a.id} className="hover:bg-blue-50 transition-colors">
                            <td className="p-6 font-bold text-gray-800">{a.name} {a.username === 'admin' && <span className="ml-2 text-[8px] bg-yellow-400 text-blue-900 px-2 py-1 rounded-full uppercase">Utama</span>}</td>
                            <td className="p-6 text-sm font-mono text-blue-600">{a.username}</td>
                            <td className="p-6 text-center">
                              {a.username !== 'admin' && (
                                <button onClick={() => handleDeleteAdmin(a.id)} className="p-3 bg-red-100 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm"><Trash2 size={16}/></button>
                              )}
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
              <button onClick={() => { setReadingBook(null); fetch(`${API_URL}/stats/reading-stop`, {method:'POST'}); }} className="bg-red-500 p-3 rounded-2xl hover:bg-red-600 transition-all"><X size={20}/></button>
            </div>
            <div className="flex-grow bg-slate-100">
              {readingBook.fileBase64 ? (
                <iframe src={readingBook.fileBase64} className="w-full h-full border-none bg-white" />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center opacity-30">
                  <FileText size={100} className="mx-auto mb-4" />
                  <p className="font-black uppercase tracking-widest text-sm">File Tidak Ditemukan</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifikasi */}
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