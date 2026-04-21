import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Users, Upload, Shield, Home, Search, Trash2, Library, 
  CheckCircle, XCircle, Menu, X, Check, PlusCircle, ChevronDown, 
  FileText, Book as BookIcon, GraduationCap, Image as ImageIcon,
  Bell, Info, Edit3, Save, UserPlus, UserCog, LogOut
} from 'lucide-react';

// --- DATA AWAL & KONFIGURASI DATABASE LOKAL ---
const LOCAL_BOOKS_KEY = 'smansa_books_db';
const LOCAL_TEACHERS_KEY = 'smansa_teachers_db';

const initialBooks = [
  { id: '1', title: 'Informatika Kelas X', author: 'Kemdikbud', type: 'ebook', category: 'Informatika', grade: 'X', cover: 'https://images.unsplash.com/photo-1516110833967-0b5716ca1387?auto=format&fit=crop&w=300&q=80', description: 'Materi dasar informatika dan algoritma.', status: 'approved', fileLink: '' },
  { id: '2', title: 'Matematika Tingkat Lanjut', author: 'Kemdikbud', type: 'ebook', category: 'Matematika', grade: 'XI', cover: 'https://images.unsplash.com/photo-1632516643736-2246738c6422?auto=format&fit=crop&w=300&q=80', description: 'Pembahasan trigonometri dan kalkulus.', status: 'approved', fileLink: '' },
  { id: '3', title: 'Si Kalong dari Soppeng', author: 'Andi (XI IPA 1)', type: 'community', genre: 'Komik', cover: 'https://images.unsplash.com/photo-1608222351212-18fe0ec7b13b?auto=format&fit=crop&w=300&q=80', description: 'Komik tentang pahlawan lokal.', status: 'approved', fileLink: '' },
];

export default function App() {
  // State untuk Database
  const [books, setBooks] = useState([]);
  const [teachers, setTeachers] = useState([]);
  
  // State UI
  const [currentView, setCurrentView] = useState('home');
  const [selectedGrade, setSelectedGrade] = useState('Semua');
  const [readingBook, setReadingBook] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState(null);
  
  // State Admin & Form
  const [loggedInTeacher, setLoggedInTeacher] = useState(null);
  const [adminTab, setAdminTab] = useState('koleksi'); // 'koleksi' atau 'guru'
  const [editingBook, setEditingBook] = useState(null);
  
  // Form Upload Siswa & Admin
  const [form, setForm] = useState({
    title: '', author: '', genre: 'Komik', coverLink: '', description: '', category: 'Umum', grade: 'X', fileLink: ''
  });

  // Form Akun Guru
  const [teacherForm, setTeacherForm] = useState({ username: '', name: '', password: '' });
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });

  const API_URL = 'http://localhost:5000/api';

  // --- KONEKSI KE SERVER LOKAL (NODE.JS) ---
  useEffect(() => {
    // Muat buku dari Server Lokal
    fetch(`${API_URL}/books`)
      .then(res => res.json())
      .then(data => {
        if (data.length === 0) {
          setBooks(initialBooks);
        } else {
          setBooks(data);
        }
      })
      .catch(err => {
        console.error("Server lokal belum menyala", err);
        setBooks(initialBooks); // Fallback data dummy jika server mati
      });

    // Muat akun guru dari Server Lokal
    fetch(`${API_URL}/teachers`)
      .then(res => res.json())
      .then(data => setTeachers(data))
      .catch(err => console.error("Gagal memuat akun guru", err));
  }, []);

  // --- AUTO HIDE NOTIFIKASI ---
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // --- LOGIKA FILTER UTAMA ---
  const getVisibleBooks = () => {
    return books.filter(book => {
      const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           book.author.toLowerCase().includes(searchQuery.toLowerCase());
      const isApproved = book.status === 'approved';
      
      if (!isApproved || !matchesSearch) return false;

      if (currentView === 'community') return book.type === 'community';
      if (currentView === 'ebooks') {
        const matchesGrade = selectedGrade === 'Semua' || book.grade === selectedGrade;
        return book.type === 'ebook' && matchesGrade;
      }
      return true;
    });
  };

  const showNotif = (msg, type = 'success') => setNotification({ msg, type });

  // --- FUNGSI ADMIN & DATABASE ---
  const handleLogin = (e) => {
    e.preventDefault();
    // Bypass untuk login pertama kali
    if (loginForm.username === 'admin' && loginForm.password === 'admin123') {
      setLoggedInTeacher({ name: 'Super Admin', username: 'admin' });
      showNotif("Selamat datang, Super Admin!");
      return;
    }

    const foundTeacher = teachers.find(t => t.username === loginForm.username && t.password === loginForm.password);
    if (foundTeacher) {
      setLoggedInTeacher(foundTeacher);
      showNotif(`Selamat datang, Bapak/Ibu ${foundTeacher.name}`);
    } else {
      showNotif("Username atau Password salah!", "error");
    }
  };

  const handleAddTeacher = async (e) => {
    e.preventDefault();
    const newTeacher = { id: Date.now().toString(), ...teacherForm };
    
    try {
      await fetch(`${API_URL}/teachers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTeacher)
      });
      setTeachers([...teachers, newTeacher]);
      showNotif("Akun guru berhasil ditambahkan ke server!");
      setTeacherForm({ username: '', name: '', password: '' });
    } catch (error) {
      showNotif("Gagal menyimpan ke server.", "error");
    }
  };

  const handleDeleteTeacher = async (id) => {
    if(confirm("Hapus akun guru ini?")) {
      try {
        await fetch(`${API_URL}/teachers/${id}`, { method: 'DELETE' });
        setTeachers(teachers.filter(t => t.id !== id));
        showNotif("Akun guru dihapus dari server.", "info");
      } catch (error) {
        showNotif("Gagal menghapus.", "error");
      }
    }
  };

  const handleAdminAddBook = async (e) => {
    e.preventDefault();
    const newBook = {
      id: Date.now().toString(),
      title: form.title, author: form.author, type: 'ebook', category: form.category, grade: form.grade,
      cover: form.coverLink || 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=300&q=80',
      description: form.description || 'Buku pelajaran resmi sekolah.', status: 'approved',
      fileLink: form.fileLink
    };
    
    try {
      await fetch(`${API_URL}/books`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBook)
      });
      setBooks([...books, newBook]);
      showNotif("Buku tersimpan ke server lokal!");
      setForm({ title: '', author: '', genre: 'Komik', coverLink: '', description: '', category: 'Umum', grade: 'X', fileLink: '' });
    } catch (error) {
      showNotif("Gagal menyimpan ke server.", "error");
    }
  };

  const handleSiswaUpload = async (e) => {
    e.preventDefault();
    const newBook = {
      id: Date.now().toString(),
      title: form.title, author: form.author, type: 'community', genre: form.genre,
      cover: form.coverLink || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=300&q=80',
      description: form.description, status: 'pending', fileLink: form.fileLink
    };
    
    try {
      await fetch(`${API_URL}/books`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBook)
      });
      setBooks([...books, newBook]);
      showNotif("Karya terkirim! Menunggu moderasi admin.");
      setCurrentView('home');
      setForm({ title: '', author: '', genre: 'Komik', coverLink: '', description: '', category: 'Umum', grade: 'X', fileLink: '' });
    } catch (error) {
      showNotif("Gagal mengirim karya.", "error");
    }
  };

  const handleApprove = async (id) => {
    const bookToApprove = books.find(b => b.id === id);
    if (!bookToApprove) return;
    const updatedBook = { ...bookToApprove, status: 'approved' };
    
    try {
      await fetch(`${API_URL}/books/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedBook)
      });
      setBooks(books.map(b => b.id === id ? updatedBook : b));
      showNotif("Karya siswa diterbitkan publik!");
    } catch (error) {
      showNotif("Gagal menyetujui karya.", "error");
    }
  };

  const handleDeleteBook = async (id) => {
    if(confirm("Hapus koleksi ini dari server?")) {
      try {
        await fetch(`${API_URL}/books/${id}`, { method: 'DELETE' });
        setBooks(books.filter(b => b.id !== id));
        showNotif("Koleksi dihapus permanen.", "info");
      } catch (error) {
        showNotif("Gagal menghapus.", "error");
      }
    }
  };

  const handleUpdateBook = async (e) => {
    e.preventDefault();
    try {
      await fetch(`${API_URL}/books/${editingBook.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingBook)
      });
      setBooks(books.map(b => b.id === editingBook.id ? editingBook : b));
      setEditingBook(null);
      showNotif("Data berhasil diperbarui di server!");
    } catch (error) {
      showNotif("Gagal memperbarui data.", "error");
    }
  };

  // --- KOMPONEN UI ---
  const Toast = () => (
    notification && (
      <div className={`fixed bottom-8 right-8 z-[100] flex items-center p-4 rounded-2xl shadow-2xl border animate-slideUp ${
        notification.type === 'error' ? 'bg-red-600 border-red-400 text-white' : 
        notification.type === 'success' ? 'bg-green-600 border-green-400 text-white' : 
        'bg-blue-900 border-blue-700 text-white'
      }`}>
        <div className="bg-white/20 p-2 rounded-lg mr-3">
          {notification.type === 'success' ? <CheckCircle size={20}/> : <Info size={20}/>}
        </div>
        <div className="pr-8">
      <p className="text-xs font-black uppercase tracking-widest opacity-70">Sistem Node.js</p>
      <p className="font-bold text-sm">{notification.msg}</p>
    </div>
        <button onClick={() => setNotification(null)} className="absolute top-2 right-2 opacity-50 hover:opacity-100"><X size={16}/></button>
      </div>
    )
  );

  const EditModal = () => (
    editingBook && (
      <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-fadeIn">
          <div className="p-6 bg-blue-900 text-white flex justify-between items-center">
            <h3 className="font-black uppercase tracking-widest text-sm flex items-center"><Edit3 className="mr-2 w-4 h-4"/> Edit Buku</h3>
            <button onClick={() => setEditingBook(null)}><X/></button>
          </div>
          <form onSubmit={handleUpdateBook} className="p-6 space-y-4">
            <div><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Judul</label><input className="w-full p-3 border rounded-xl mt-1" value={editingBook.title} onChange={e => setEditingBook({...editingBook, title: e.target.value})} required /></div>
            <div><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Penulis</label><input className="w-full p-3 border rounded-xl mt-1" value={editingBook.author} onChange={e => setEditingBook({...editingBook, author: e.target.value})} required /></div>
            <div><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Link Buku (PDF/Drive)</label><input className="w-full p-3 border rounded-xl mt-1" value={editingBook.fileLink || ''} onChange={e => setEditingBook({...editingBook, fileLink: e.target.value})} /></div>
            <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-black uppercase tracking-widest text-xs">Simpan Perubahan</button>
          </form>
        </div>
      </div>
    )
  );

  const Navbar = () => (
    <nav className="bg-blue-900 text-white shadow-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 flex justify-between h-16 items-center">
        <div className="flex items-center cursor-pointer" onClick={() => {setCurrentView('home'); setSelectedGrade('Semua');}}>
          <Library className="h-8 w-8 mr-2 text-yellow-400" />
          <span className="font-bold text-lg hidden md:block tracking-tight uppercase">Pustaka Smansa</span>
        </div>
        <div className="hidden md:flex space-x-6 items-center font-bold text-xs uppercase tracking-widest">
          <button onClick={() => setCurrentView('home')} className="hover:text-yellow-400 flex items-center"><Home className="w-4 h-4 mr-1"/> Beranda</button>
          
          <div className="relative group">
            <button className="hover:text-yellow-400 flex items-center py-4"><GraduationCap className="w-4 h-4 mr-1"/> Pelajaran <ChevronDown size={12} className="ml-1"/></button>
            <div className="absolute hidden group-hover:block bg-white text-gray-800 shadow-2xl rounded-xl w-40 mt-0 border overflow-hidden">
              {['X', 'XI', 'XII'].map(grade => (
                <button key={grade} onClick={() => {setSelectedGrade(grade); setCurrentView('ebooks');}} className="block w-full text-left px-4 py-3 hover:bg-blue-50 text-[10px] font-black border-b last:border-0 uppercase tracking-widest">Kelas {grade}</button>
              ))}
            </div>
          </div>

          <button onClick={() => setCurrentView('community')} className="hover:text-yellow-400 flex items-center"><Users className="w-4 h-4 mr-1"/> Karya Siswa</button>
          <button onClick={() => setCurrentView('upload')} className="bg-yellow-500 text-blue-900 px-4 py-2 rounded-full hover:bg-yellow-400 flex items-center shadow-lg"><Upload className="w-4 h-4 mr-1"/> Upload</button>
          <button onClick={() => setCurrentView('admin')} className="p-2 hover:bg-blue-800 rounded-full"><Shield className="w-5 h-5"/></button>
        </div>
      </div>
    </nav>
  );

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 text-gray-800 font-sans">
      <Navbar />
      <Toast />
      <EditModal />

      <main className="flex-grow max-w-7xl mx-auto w-full px-4 py-8">
        {/* VIEW: HOME & KATALOG */}
        {(currentView === 'home' || currentView === 'ebooks' || currentView === 'community') && (
          <div className="animate-fadeIn">
            <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
              <div>
            <h1 className="text-3xl font-black text-blue-900 uppercase tracking-tighter italic">
              {currentView === 'community' ? 'Karya Kreatif Siswa' : 
               currentView === 'ebooks' ? `Buku Pelajaran Kelas ${selectedGrade}` : 'Koleksi Digital'}
            </h1>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.3em] mt-1">SMAN 1 Soppeng • Express Server DB</p>
          </div>
              <div className="relative">
                <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                <input type="text" placeholder="Cari judul..." className="pl-10 pr-4 py-3 border border-gray-200 rounded-2xl w-full md:w-80 focus:ring-2 focus:ring-blue-500 outline-none" onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {getVisibleBooks().map(book => (
                <div key={book.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-2xl transition-all group relative flex flex-col">
                  <div className="h-64 relative overflow-hidden flex-shrink-0">
                    <img src={book.cover} className="w-full h-full object-cover transition-transform group-hover:scale-105" alt={book.title} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all flex flex-col justify-end p-4">
                      <p className="text-white text-[10px] leading-relaxed mb-2">{book.description}</p>
                    </div>
                    <span className="absolute top-4 left-4 bg-yellow-400 text-blue-900 text-[9px] font-black px-2 py-1 rounded shadow-lg uppercase">
                      {book.type === 'ebook' ? `Kelas ${book.grade}` : book.genre}
                    </span>
                  </div>
                  <div className="p-5 flex-grow flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-gray-800 line-clamp-2">{book.title}</h3>
                      <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest mt-1 mb-4">By: {book.author}</p>
                    </div>
                    {book.fileLink ? (
                      <a href={book.fileLink} target="_blank" rel="noopener noreferrer" className="w-full bg-blue-900 text-white font-black py-3 rounded-xl hover:bg-yellow-500 hover:text-blue-900 transition-all text-[10px] uppercase tracking-widest flex items-center justify-center cursor-pointer">
                        <BookOpen className="w-3 h-3 mr-2"/> Buka Buku
                      </a>
                    ) : (
                      <button onClick={() => setReadingBook(book)} className="w-full bg-gray-100 text-gray-500 font-black py-3 rounded-xl text-[10px] uppercase tracking-widest flex items-center justify-center">
                        File Kosong
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {getVisibleBooks().length === 0 && (
              <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                <Search size={48} className="mx-auto text-gray-200 mb-4" />
                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Belum ada koleksi tersimpan.</p>
              </div>
            )}
          </div>
        )}

        {/* VIEW: UPLOAD SISWA */}
        {currentView === 'upload' && (
          <div className="max-w-2xl mx-auto animate-fadeIn">
            <div className="bg-white p-8 rounded-3xl shadow-2xl border border-gray-100">
              <h2 className="text-2xl font-black text-gray-800 mb-2 uppercase">Upload Karyamu</h2>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-6 font-bold">Akan tersimpan ke Database Lokal Laptop Ini</p>
              <form onSubmit={handleSiswaUpload} className="space-y-4">
                <input required className="w-full p-4 border rounded-2xl bg-gray-50 outline-none focus:ring-2 focus:ring-blue-100" placeholder="Judul Karya" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
                <div className="grid grid-cols-2 gap-4">
                  <input required className="w-full p-4 border rounded-2xl bg-gray-50 outline-none" placeholder="Nama Penulis" value={form.author} onChange={e => setForm({...form, author: e.target.value})} />
                  <select className="w-full p-4 border rounded-2xl bg-gray-50 outline-none" value={form.genre} onChange={e => setForm({...form, genre: e.target.value})}>
                    <option>Komik</option><option>Novel</option><option>Puisi</option><option>Esai</option>
                  </select>
                </div>
                <input className="w-full p-4 border rounded-2xl bg-gray-50 outline-none" placeholder="Link Sampul Gambar (Opsional)" value={form.coverLink} onChange={e => setForm({...form, coverLink: e.target.value})} />
                <textarea className="w-full p-4 border rounded-2xl bg-gray-50 outline-none" placeholder="Deskripsi singkat tentang karyamu..." rows="3" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
                
                <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 border-dashed">
                   <label className="text-[10px] font-black text-blue-800 uppercase tracking-widest block mb-2"><FileText className="inline w-3 h-3 mr-1"/> Link File Buku (Google Drive / Canva)</label>
                   <input required className="w-full p-3 border border-white rounded-xl bg-white outline-none focus:ring-2 focus:ring-blue-200 text-sm" placeholder="https://drive.google.com/..." value={form.fileLink} onChange={e => setForm({...form, fileLink: e.target.value})} />
                   <p className="text-[9px] text-blue-500 mt-2 font-bold leading-tight">Gunakan link Google Drive dengan akses "Siapa saja yang memiliki link".</p>
                </div>

                <button type="submit" className="w-full bg-blue-900 text-white font-black py-4 rounded-2xl uppercase tracking-widest shadow-xl hover:bg-blue-800">Kirim Ke Admin</button>
              </form>
            </div>
          </div>
        )}

        {/* VIEW: ADMIN LOGIN & DASHBOARD */}
        {currentView === 'admin' && (
          <div className="animate-fadeIn">
            {!loggedInTeacher ? (
              <div className="max-w-xs mx-auto text-center py-20 bg-white p-10 rounded-3xl shadow-xl border-t-8 border-t-blue-900">
                <UserCog size={48} className="mx-auto text-blue-900 mb-6" />
                <h2 className="text-xl font-black mb-2 uppercase text-gray-800">Akses Guru</h2>
                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-6">Sistem Database Lokal</p>
                
                <form onSubmit={handleLogin} className="space-y-4">
                  <input required placeholder="Username" className="w-full p-3 border rounded-xl bg-gray-50 text-center font-bold outline-none" value={loginForm.username} onChange={e => setLoginForm({...loginForm, username: e.target.value})} />
                  <input required type="password" placeholder="Password" className="w-full p-3 border rounded-xl bg-gray-50 text-center font-bold tracking-[0.2em] outline-none" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} />
                  <button type="submit" className="w-full bg-blue-900 text-white font-black py-3 rounded-xl uppercase tracking-widest text-[10px] shadow-lg hover:bg-blue-800">Login</button>
                </form>
                <div className="mt-6 pt-4 border-t border-gray-100">
                  <p className="text-[8px] text-gray-400 font-bold uppercase">Setup Awal: Gunakan user 'admin', pass 'admin123'</p>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-blue-900 p-6 rounded-3xl text-white shadow-xl">
                  <div>
                    <h2 className="text-2xl font-black uppercase tracking-tight">Admin Center</h2>
                    <p className="text-[10px] font-bold text-blue-300 uppercase tracking-widest mt-1">Logged in as: {loggedInTeacher.name}</p>
                  </div>
                  <div className="mt-4 md:mt-0 flex space-x-2">
                    <button onClick={() => setAdminTab('koleksi')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${adminTab === 'koleksi' ? 'bg-white text-blue-900' : 'bg-blue-800 text-white hover:bg-blue-700'}`}>Koleksi Buku</button>
                    <button onClick={() => setAdminTab('guru')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${adminTab === 'guru' ? 'bg-white text-blue-900' : 'bg-blue-800 text-white hover:bg-blue-700'}`}>Akun Guru</button>
                    <button onClick={() => setLoggedInTeacher(null)} className="p-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all" title="Logout"><LogOut size={16}/></button>
                  </div>
                </div>

                {/* TAB 1: KELOLA BUKU */}
                {adminTab === 'koleksi' && (
                  <div className="animate-fadeIn space-y-8">
                    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                      <h3 className="font-black mb-6 flex items-center text-xs uppercase tracking-widest text-blue-600"><PlusCircle className="mr-2"/> Input Buku ke Database</h3>
                      <form onSubmit={handleAdminAddBook} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <input required className="p-3 border rounded-xl text-xs bg-gray-50" placeholder="Judul Buku" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
                        <input required className="p-3 border rounded-xl text-xs bg-gray-50" placeholder="Mapel" value={form.category} onChange={e => setForm({...form, category: e.target.value})} />
                        <select className="p-3 border rounded-xl text-xs bg-gray-50" value={form.grade} onChange={e => setForm({...form, grade: e.target.value})}>
                          <option value="X">Kelas X</option><option value="XI">Kelas XI</option><option value="XII">Kelas XII</option>
                        </select>
                        <input className="p-3 border rounded-xl text-xs bg-gray-50" placeholder="Link File PDF" value={form.fileLink} onChange={e => setForm({...form, fileLink: e.target.value})} />
                        <button type="submit" className="md:col-span-4 bg-blue-900 text-white py-3 font-black rounded-xl uppercase text-[10px] tracking-widest shadow">Simpan Buku Resmi</button>
                      </form>
                    </div>

                    <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
                      <div className="p-6 bg-gray-50 border-b flex justify-between items-center">
                        <h3 className="font-black text-xs uppercase tracking-widest">Koleksi Lokal ({books.length})</h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead className="bg-white text-[10px] font-black uppercase text-gray-400 border-b">
                            <tr>
                              <th className="p-6">Status</th>
                              <th className="p-6">Judul & File</th>
                              <th className="p-6">Kategori</th>
                              <th className="p-6 text-center">Aksi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {books.map(b => (
                              <tr key={b.id} className="hover:bg-blue-50/50 transition-colors">
                                <td className="p-6">
                                  {b.status === 'pending' ? 
                                    <span className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-[9px] font-black uppercase shadow-sm">Review</span> :
                                    <span className="bg-green-100 text-green-600 px-3 py-1 rounded-full text-[9px] font-black uppercase shadow-sm">Live</span>
                                  }
                                </td>
                                <td className="p-6">
                                  <p className="font-bold text-gray-800">{b.title}</p>
                                  {b.fileLink ? (
                                    <a href={b.fileLink} target="_blank" className="text-[10px] text-blue-500 font-bold uppercase tracking-widest hover:underline flex items-center mt-1"><FileText size={10} className="mr-1"/> Tersedia</a>
                                  ) : (
                                    <span className="text-[10px] text-red-400 font-bold uppercase tracking-widest mt-1 block">Tidak Ada Link</span>
                                  )}
                                </td>
                                <td className="p-6">
                                  <span className="text-[9px] font-black uppercase text-gray-600">{b.type === 'ebook' ? `Buku Pelajaran ${b.grade}` : b.genre}</span>
                                </td>
                                <td className="p-6 flex justify-center space-x-2">
                                  {b.status === 'pending' && (
                                    <button onClick={() => handleApprove(b.id)} className="p-2 bg-green-500 text-white rounded-lg shadow"><Check size={16}/></button>
                                  )}
                                  <button onClick={() => setEditingBook(b)} className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Edit3 size={16}/></button>
                                  <button onClick={() => handleDeleteBook(b.id)} className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all"><Trash2 size={16}/></button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: KELOLA AKUN GURU */}
                {adminTab === 'guru' && (
                  <div className="animate-fadeIn space-y-8">
                    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-8">
                      <div className="md:w-1/3">
                        <div className="bg-blue-50 p-4 rounded-2xl text-blue-900 inline-block mb-4"><UserPlus size={24}/></div>
                        <h3 className="font-black text-lg uppercase tracking-tight mb-2">Register Akun Guru</h3>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-relaxed">Tambahkan akun agar guru lain bisa masuk ke panel ini.</p>
                      </div>
                      <form onSubmit={handleAddTeacher} className="md:w-2/3 space-y-4">
                        <input required placeholder="Username (misal: budi_guru)" className="w-full p-3 border rounded-xl text-sm bg-gray-50" value={teacherForm.username} onChange={e => setTeacherForm({...teacherForm, username: e.target.value})} />
                        <input required placeholder="Nama Lengkap (misal: Budi Santoso, S.Pd)" className="w-full p-3 border rounded-xl text-sm bg-gray-50" value={teacherForm.name} onChange={e => setTeacherForm({...teacherForm, name: e.target.value})} />
                        <input required type="password" placeholder="Buat Password" className="w-full p-3 border rounded-xl text-sm bg-gray-50" value={teacherForm.password} onChange={e => setTeacherForm({...teacherForm, password: e.target.value})} />
                        <button type="submit" className="w-full bg-blue-900 text-white py-4 font-black rounded-xl uppercase text-[10px] tracking-widest shadow-lg hover:bg-blue-800">Simpan Akun</button>
                      </form>
                    </div>

                    <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
                      <div className="p-6 bg-gray-50 border-b">
                        <h3 className="font-black text-xs uppercase tracking-widest">Daftar Akun Terdaftar</h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead className="bg-white text-[10px] font-black uppercase text-gray-400 border-b">
                            <tr>
                              <th className="p-6">Nama Lengkap</th>
                              <th className="p-6">Username Login</th>
                              <th className="p-6 text-center">Aksi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {teachers.map(t => (
                              <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                                <td className="p-6 font-bold text-gray-800">{t.name}</td>
                                <td className="p-6 text-sm text-blue-600 font-mono bg-blue-50/50 rounded px-2">{t.username}</td>
                                <td className="p-6 text-center">
                                  <button onClick={() => handleDeleteTeacher(t.id)} className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all"><Trash2 size={16}/></button>
                                </td>
                              </tr>
                            ))}
                            {teachers.length === 0 && (
                              <tr><td colSpan="3" className="p-10 text-center text-[10px] text-gray-400 uppercase font-black tracking-widest">Belum ada akun guru tambahan.</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="bg-blue-950 text-white py-12 mt-20 border-t-4 border-yellow-400">
    <div className="max-w-7xl mx-auto px-4 text-center">
      <Library className="h-10 w-10 mx-auto mb-4 text-yellow-400" />
      <h2 className="font-black text-xl tracking-tighter uppercase mb-1">Pustaka Smansa</h2>
      <p className="text-[10px] text-blue-300 font-black uppercase tracking-[0.4em] mb-4">Node.js Local Server Database</p>
      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">&copy; 2024 SMAN 1 Soppeng</p>
    </div>
  </footer>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(100%); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out forwards; }
        .animate-slideUp { animation: slideUp 0.3s ease-out forwards; }
      `}} />
    </div>
  );
}