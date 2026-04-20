import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Users, Upload, Shield, Home, Search, Trash2, Library, 
  CheckCircle, XCircle, Menu, X, Check, PlusCircle, ChevronDown, 
  FileText, Book as BookIcon, GraduationCap, Image as ImageIcon,
  Bell, Info, Edit3, Save
} from 'lucide-react';

// --- DATA AWAL (SIMULASI DATABASE) ---
const initialBooks = [
  { id: 1, title: 'Informatika Kelas X', author: 'Kemdikbud', type: 'ebook', category: 'Informatika', grade: 'X', cover: 'https://images.unsplash.com/photo-1516110833967-0b5716ca1387?auto=format&fit=crop&w=300&q=80', description: 'Materi dasar informatika dan algoritma.', status: 'approved', fileName: 'informatika_x.pdf' },
  { id: 2, title: 'Matematika Tingkat Lanjut', author: 'Kemdikbud', type: 'ebook', category: 'Matematika', grade: 'XI', cover: 'https://images.unsplash.com/photo-1632516643736-2246738c6422?auto=format&fit=crop&w=300&q=80', description: 'Pembahasan trigonometri dan kalkulus.', status: 'approved', fileName: 'matematika_xi.pdf' },
  { id: 3, title: 'Si Kalong dari Soppeng', author: 'Andi (XI IPA 1)', type: 'community', genre: 'Komik', cover: 'https://images.unsplash.com/photo-1608222351212-18fe0ec7b13b?auto=format&fit=crop&w=300&q=80', description: 'Komik tentang pahlawan lokal.', status: 'approved', fileName: 'komik_kalong.pdf' },
];

export default function App() {
  const [books, setBooks] = useState(initialBooks);
  const [currentView, setCurrentView] = useState('home');
  const [selectedGrade, setSelectedGrade] = useState('Semua');
  const [readingBook, setReadingBook] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState(null);
  const [editingBook, setEditingBook] = useState(null);

  // State untuk form input (Siswa & Admin)
  const [form, setForm] = useState({
    title: '', author: '', genre: 'Komik', coverLink: '', description: '', category: 'Umum', grade: 'X'
  });

  // --- AUTO HIDE NOTIFIKASI ---
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // --- LOGIKA FILTER UTAMA ---
  const getVisibleBooks = () => {
    return books.filter(book => {
      const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           book.author.toLowerCase().includes(searchQuery.toLowerCase());
      const isApproved = book.status === 'approved';
      
      if (!isApproved) return false;
      if (!matchesSearch) return false;

      if (currentView === 'community') return book.type === 'community';
      if (currentView === 'ebooks') {
        const matchesGrade = selectedGrade === 'Semua' || book.grade === selectedGrade;
        return book.type === 'ebook' && matchesGrade;
      }
      
      return true; // Home view menampilkan semua yang approved
    });
  };

  // --- HANDLERS ---
  const showNotif = (msg, type = 'success') => {
    setNotification({ msg, type });
  };

  const handleApprove = (id) => {
    setBooks(books.map(b => b.id === id ? { ...b, status: 'approved' } : b));
    showNotif("Buku berhasil disetujui!");
  };

  const handleDelete = (id) => {
    if(confirm("Hapus buku ini secara permanen?")) {
      setBooks(books.filter(b => b.id !== id));
      showNotif("Buku telah dihapus.", "info");
    }
  };

  const handleAdminAddBook = (e) => {
    e.preventDefault();
    const newBook = {
      id: Date.now(),
      title: form.title,
      author: form.author,
      type: 'ebook',
      category: form.category,
      grade: form.grade,
      cover: form.coverLink || 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=300&q=80',
      description: form.description || 'Buku pelajaran resmi sekolah.',
      status: 'approved',
      fileName: 'buku_pelajaran.pdf'
    };
    setBooks([...books, newBook]);
    showNotif("Buku pelajaran berhasil ditambahkan!");
    setForm({ title: '', author: '', genre: 'Komik', coverLink: '', description: '', category: 'Umum', grade: 'X' });
  };

  const handleSiswaUpload = (e) => {
    e.preventDefault();
    const newBook = {
      id: Date.now(),
      title: form.title,
      author: form.author,
      type: 'community',
      genre: form.genre,
      cover: form.coverLink || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=300&q=80',
      description: form.description,
      status: 'pending',
      fileName: 'karya_siswa.pdf'
    };
    setBooks([...books, newBook]);
    showNotif("Karya berhasil dikirim! Menunggu moderasi admin.");
    setCurrentView('home');
    setForm({ title: '', author: '', genre: 'Komik', coverLink: '', description: '', category: 'Umum', grade: 'X' });
  };

  const handleUpdateBook = (e) => {
    e.preventDefault();
    setBooks(books.map(b => b.id === editingBook.id ? editingBook : b));
    setEditingBook(null);
    showNotif("Data buku diperbarui!");
  };

  // --- KOMPONEN UI ---
  const Toast = () => (
    notification && (
      <div className={`fixed bottom-8 right-8 z-[100] flex items-center p-4 rounded-2xl shadow-2xl border animate-slideUp ${
        notification.type === 'success' ? 'bg-green-600 border-green-400 text-white' : 'bg-blue-900 border-blue-700 text-white'
      }`}>
        <div className="bg-white/20 p-2 rounded-lg mr-3">
          {notification.type === 'success' ? <CheckCircle size={20}/> : <Info size={20}/>}
        </div>
        <div className="pr-8">
          <p className="text-xs font-black uppercase tracking-widest opacity-70">Sistem</p>
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
            <input className="w-full p-3 border rounded-xl" value={editingBook.title} onChange={e => setEditingBook({...editingBook, title: e.target.value})} placeholder="Judul" required />
            <input className="w-full p-3 border rounded-xl" value={editingBook.author} onChange={e => setEditingBook({...editingBook, author: e.target.value})} placeholder="Penulis" required />
            <select className="w-full p-3 border rounded-xl" value={editingBook.grade} onChange={e => setEditingBook({...editingBook, grade: e.target.value})}>
              <option value="X">Kelas X</option><option value="XI">Kelas XI</option><option value="XII">Kelas XII</option>
            </select>
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
        {(currentView === 'home' || currentView === 'ebooks' || currentView === 'community') && (
          <div className="animate-fadeIn">
            <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
              <div>
                <h1 className="text-3xl font-black text-blue-900 uppercase tracking-tighter italic">
                  {currentView === 'community' ? 'Karya Kreatif Siswa' : 
                   currentView === 'ebooks' ? `Buku Pelajaran Kelas ${selectedGrade}` : 'Koleksi Digital'}
                </h1>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.3em] mt-1">SMAN 1 Soppeng</p>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                <input type="text" placeholder="Cari judul atau penulis..." className="pl-10 pr-4 py-3 border border-gray-200 rounded-2xl w-full md:w-80 focus:ring-2 focus:ring-blue-500 outline-none" onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {getVisibleBooks().map(book => (
                <div key={book.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-2xl transition-all group relative">
                  <div className="h-64 relative overflow-hidden">
                    <img src={book.cover} className="w-full h-full object-cover transition-transform group-hover:scale-105" alt={book.title} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all flex flex-col justify-end p-4">
                      <p className="text-white text-[10px] leading-relaxed mb-2">{book.description}</p>
                    </div>
                    <span className="absolute top-4 left-4 bg-yellow-400 text-blue-900 text-[9px] font-black px-2 py-1 rounded shadow-lg uppercase">
                      {book.type === 'ebook' ? `Kelas ${book.grade}` : book.genre}
                    </span>
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-gray-800 line-clamp-1">{book.title}</h3>
                    <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest mt-1 mb-4">By: {book.author}</p>
                    <button onClick={() => setReadingBook(book)} className="w-full bg-blue-900 text-white font-black py-3 rounded-xl hover:bg-yellow-500 hover:text-blue-900 transition-all text-[10px] uppercase tracking-widest flex items-center justify-center">
                      <BookOpen className="w-3 h-3 mr-2"/> Baca Digital
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {getVisibleBooks().length === 0 && (
              <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                <Search size={48} className="mx-auto text-gray-200 mb-4" />
                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Tidak ada koleksi ditemukan</p>
              </div>
            )}
          </div>
        )}

        {currentView === 'upload' && (
          <div className="max-w-2xl mx-auto animate-fadeIn">
            <div className="bg-white p-8 rounded-3xl shadow-2xl border border-gray-100">
              <h2 className="text-2xl font-black text-gray-800 mb-6 uppercase">Upload Karyamu</h2>
              <form onSubmit={handleSiswaUpload} className="space-y-4">
                <input required className="w-full p-4 border rounded-2xl bg-gray-50 focus:bg-white transition-all outline-none" placeholder="Judul Karya" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
                <div className="grid grid-cols-2 gap-4">
                  <input required className="w-full p-4 border rounded-2xl bg-gray-50" placeholder="Nama Penulis" value={form.author} onChange={e => setForm({...form, author: e.target.value})} />
                  <select className="w-full p-4 border rounded-2xl bg-gray-50" value={form.genre} onChange={e => setForm({...form, genre: e.target.value})}>
                    <option>Komik</option><option>Novel</option><option>Puisi</option><option>Esai</option><option>Cerpen</option>
                  </select>
                </div>
                <input className="w-full p-4 border rounded-2xl bg-gray-50" placeholder="Link Gambar Sampul (URL)" value={form.coverLink} onChange={e => setForm({...form, coverLink: e.target.value})} />
                <textarea className="w-full p-4 border rounded-2xl bg-gray-50" placeholder="Deskripsi singkat tentang karyamu..." rows="3" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
                <button type="submit" className="w-full bg-blue-900 text-white font-black py-4 rounded-2xl uppercase tracking-widest shadow-xl hover:bg-blue-800">Kirim Ke Admin</button>
              </form>
            </div>
          </div>
        )}

        {currentView === 'admin' && (
          <div className="animate-fadeIn">
            {!isAdmin ? (
              <div className="max-w-xs mx-auto text-center py-20 bg-white p-10 rounded-3xl shadow-xl">
                <Shield size={48} className="mx-auto text-blue-900 mb-6" />
                <h2 className="text-xl font-black mb-6 uppercase">Admin Only</h2>
                <input type="password" placeholder="PIN" className="w-full p-4 border rounded-2xl text-center mb-4 font-black tracking-[1em]" onKeyUp={(e) => e.key === 'Enter' && e.target.value === '1234' && setIsAdmin(true)} />
                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest italic">Default PIN: 1234</p>
              </div>
            ) : (
              <div className="space-y-10">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-black text-blue-900 uppercase">Dashboard Admin</h2>
                  <button onClick={() => setIsAdmin(false)} className="bg-red-50 text-red-600 px-6 py-2 rounded-full text-xs font-black uppercase">Logout</button>
                </div>

                <div className="bg-white p-8 rounded-3xl border-2 border-blue-50">
                  <h3 className="font-black mb-6 flex items-center text-xs uppercase tracking-widest text-blue-600"><PlusCircle className="mr-2"/> Input Buku Pelajaran Resmi</h3>
                  <form onSubmit={handleAdminAddBook} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <input required className="p-3 border rounded-xl text-xs bg-gray-50" placeholder="Judul Buku" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
                    <input required className="p-3 border rounded-xl text-xs bg-gray-50" placeholder="Mapel" value={form.category} onChange={e => setForm({...form, category: e.target.value})} />
                    <select className="p-3 border rounded-xl text-xs bg-gray-50" value={form.grade} onChange={e => setForm({...form, grade: e.target.value})}>
                      <option value="X">Kelas X</option><option value="XI">Kelas XI</option><option value="XII">Kelas XII</option>
                    </select>
                    <button type="submit" className="bg-blue-900 text-white font-black rounded-xl uppercase text-[9px] tracking-widest">Posting Buku</button>
                  </form>
                </div>

                <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
                  <div className="p-6 bg-gray-50 border-b flex justify-between items-center">
                    <h3 className="font-black text-xs uppercase tracking-widest">Manajemen Koleksi ({books.length})</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-white text-[10px] font-black uppercase text-gray-400 border-b">
                        <tr>
                          <th className="p-6">Status</th>
                          <th className="p-6">Judul</th>
                          <th className="p-6">Kategori</th>
                          <th className="p-6 text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {books.map(b => (
                          <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                            <td className="p-6">
                              {b.status === 'pending' ? 
                                <span className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-[9px] font-black uppercase">Review</span> :
                                <span className="bg-green-100 text-green-600 px-3 py-1 rounded-full text-[9px] font-black uppercase">Live</span>
                              }
                            </td>
                            <td className="p-6">
                              <p className="font-bold text-gray-800">{b.title}</p>
                              <p className="text-[10px] text-gray-400 font-bold uppercase">{b.author}</p>
                            </td>
                            <td className="p-6">
                              <span className="text-[9px] font-black uppercase text-blue-500">{b.type === 'ebook' ? `Buku Pelajaran ${b.grade}` : b.genre}</span>
                            </td>
                            <td className="p-6 flex justify-center space-x-2">
                              {b.status === 'pending' && (
                                <button onClick={() => handleApprove(b.id)} className="p-2 bg-green-500 text-white rounded-lg"><Check size={16}/></button>
                              )}
                              <button onClick={() => setEditingBook(b)} className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Edit3 size={16}/></button>
                              <button onClick={() => handleDelete(b.id)} className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all"><Trash2 size={16}/></button>
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

      {/* Reader Modal (Placeholder) */}
      {readingBook && (
        <div className="fixed inset-0 z-[80] bg-black/90 flex flex-col p-4 animate-fadeIn">
          <div className="flex justify-between items-center text-white mb-4 border-b border-white/20 pb-4">
            <h2 className="font-black uppercase tracking-widest text-sm">{readingBook.title}</h2>
            <button onClick={() => setReadingBook(null)} className="p-2 bg-white/10 rounded-full hover:bg-red-600 transition-all"><X/></button>
          </div>
          <div className="flex-grow bg-white rounded-2xl flex flex-col items-center justify-center text-gray-400">
             <FileText size={80} className="mb-4 opacity-20" />
             <p className="font-black uppercase tracking-widest text-xs">Membuka File: {readingBook.fileName}</p>
          </div>
        </div>
      )}

      <footer className="bg-blue-950 text-white py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <Library className="h-10 w-10 mx-auto mb-4 text-yellow-400" />
          <h2 className="font-black text-xl tracking-tighter uppercase mb-2">Pustaka Smansa Soppeng</h2>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.4em]">&copy; 2026 Multimedia SMAN 1 Soppeng</p>
          <a className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.4em]" href='https://www.instagram.com/perdana_911?igsh=MWJ1MnhzZHE0MHQydw==' >&copy; By:Perdana</a>
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