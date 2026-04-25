import React, { useState, useEffect, useRef } from 'react';
import {
  BookOpen, Users, Shield, Library, X, FileText, Book as BookIcon,
  Activity, LogOut, CheckCircle, XCircle, KeyRound, GraduationCap,
  PlusCircle, Trash2, Check, Star, User, Camera, Trophy, Home, Search,
  UploadCloud, UserPlus, Eye, MessageSquare, Clock, Award, Download, Bookmark, MessageCircle, Send, Lock, Unlock, Crown, Edit, FileIcon, CheckCheck, Image as ImageIcon
} from 'lucide-react';

let hostIp = window.location.hostname;
if (hostIp.includes('google') || hostIp.includes('usercontent')) hostIp = 'localhost';
const API_URL = `http://${hostIp}:5000/api`;

const fallbackSvg = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM2YjcyODAiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMjAgMjF2LTJhNCA0IDAgMCAwLTQtNEg4YTQgNCAwIDAgMC00DR2MiPjwvcGF0aD48Y2lyY2xlIGN4PSIxMiIgY3k9IjciIHI9IjQiPjwvY2lyY2xlPjwvc3ZnPg==";

// GIF Bawaan ala Instagram
const GIF_LIST = [
  "https://media.tenor.com/2sNcJ_Bv5oQAAAAM/hello-hi.gif",
  "https://media.tenor.com/Z42K-H-XQ9QAAAAM/ok-ok-ok.gif",
  "https://media.tenor.com/T0b4712vI68AAAAM/laughing-emoji.gif",
  "https://media.tenor.com/vH1M2ZzZ42cAAAAM/sad-crying.gif",
  "https://media.tenor.com/t3P9g3gS8S4AAAAM/angry-mad.gif",
  "https://media.tenor.com/6m9iQy-Bmb8AAAAM/dance-party.gif",
  "https://media.tenor.com/5fOaI-uYh1IAAAAM/thumbs-up-good-job.gif",
  "https://media.tenor.com/K2a1ALiQZQsAAAAM/confused-what.gif"
];

const getAvatarSrc = (src) => (src && typeof src === 'string' && src.length > 20) ? src : fallbackSvg;
const getBookSrc = (src) => (src && typeof src === 'string' && src.length > 20) ? src : fallbackSvg;

const handleAvatarErr = (e) => { e.target.onerror = null; e.target.src = fallbackSvg; };
const handleBookErr = (e) => { e.target.onerror = null; e.target.src = fallbackSvg; };

const timeAgo = (ms) => {
  if (!ms) return 'Belum pernah online';
  const seconds = Math.floor((Date.now() - ms) / 1000);
  if (seconds < 60) return 'Baru saja';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  return `${Math.floor(hours / 24)} hari lalu`;
};

const SafeAvatar = ({ src, sizeClassName = "w-10 h-10", className = "" }) => (
  <div className={`${sizeClassName} bg-gray-800 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 border border-gray-700 relative ${className}`}>
    <img src={getAvatarSrc(src)} onError={handleAvatarErr} className="w-full h-full object-cover" alt="Avatar" />
  </div>
);

export default function App() {
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState('siswa');
  const [books, setBooks] = useState([]);
  const [masterStudents, setMasterStudents] = useState([]);
  const [friendsData, setFriendsData] = useState({ friends: [], requests: [] });
  const [leaderboardData, setLeaderboardData] = useState({ topXP: [], topCreators: [], topAchievements: [] });
  const [serverStatus, setServerStatus] = useState('checking');
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const [currentView, setCurrentView] = useState('home');
  const [notification, setNotification] = useState(null);

  const [readingBook, setReadingBook] = useState(null);
  const [readStartTime, setReadStartTime] = useState(null);
  const [bookDetailModal, setBookDetailModal] = useState(null);
  const [publicProfileModal, setPublicProfileModal] = useState(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [adminTab, setAdminTab] = useState('koleksi');

  // Fitur Chat Lanjutan (Edit & GIF)
  const [activeChatFriend, setActiveChatFriend] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [editingMessage, setEditingMessage] = useState(null);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const chatEndRef = useRef(null);

  const [loginForm, setLoginForm] = useState({ username: '', password: '', nisn: '' });
  const [studentInput, setStudentInput] = useState({ nisn: '', grade: 'X', sub: '1', name: '' });
  const [editingStudent, setEditingStudent] = useState(null);
  const [editingBook, setEditingBook] = useState(null);

  const [profileForm, setProfileForm] = useState({ name: '', avatarBase64: '', backgroundBase64: '', bio: '' });
  const [bookForm, setBookForm] = useState({ title: '', author: '', grade: 'X', type: 'ebook', coverBase64: '', fileBase64: '', mimeType: '' });
  const [friendNisn, setFriendNisn] = useState('');
  const [commentText, setCommentText] = useState('');

  // --- SINKRONISASI UMUM (BUKU & XP) ---
  useEffect(() => {
    let isMounted = true;
    const fetchGeneralData = async () => {
      try {
        const res = await fetch(`${API_URL}/books`);
        if (res.ok && isMounted) {
          setBooks(await res.json());
          setServerStatus('online');
        }
      } catch (e) { if (isMounted) setServerStatus('offline'); }
    };

    fetchGeneralData();
    const interval = setInterval(() => {
      if (serverStatus === 'online') {
        const payload = user ? { userId: user.id } : {};
        fetch(`${API_URL}/stats/heartbeat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
          .then(r => r.json()).then(d => {
            if (isMounted) {
              setOnlineUsers(d.activeUsers || 0);
              if (user && user.level !== 'Admin') setUser(prev => ({ ...prev, xp: (prev.xp || 0) + 1 }));
            }
          }).catch(() => { });

        fetch(`${API_URL}/books`).then(r => r.json()).then(d => {
          if (isMounted) {
            setBooks(d);
            if (bookDetailModal) {
              const updatedBook = d.find(b => b.id === bookDetailModal.id);
              if (updatedBook) setBookDetailModal(updatedBook);
            }
          }
        }).catch(() => { });
      }
    }, 10000);
    return () => { isMounted = false; clearInterval(interval); };
  }, [serverStatus, user?.id, bookDetailModal?.id]);

  // --- SINKRONISASI TEMAN ---
  useEffect(() => {
    let isMounted = true;
    const fetchUserData = () => {
      if (user && user.level !== 'Admin') {
        fetch(`${API_URL}/users/${user.id}/friends`)
          .then(r => r.json())
          .then(d => { if (isMounted && d && Array.isArray(d.friends)) setFriendsData(d); })
          .catch(() => { });
      }
    };
    fetchUserData();
    const interval = setInterval(() => { if (serverStatus === 'online') fetchUserData(); }, 10000);
    return () => { isMounted = false; clearInterval(interval); };
  }, [user?.id, serverStatus]);

  // --- SINKRONISASI CHAT (Read Receipts & Anti White Screen) ---
  useEffect(() => {
    let chatInterval;
    let isMounted = true;

    setChatMessages([]);
    setChatInput('');
    setEditingMessage(null);
    setShowGifPicker(false);

    if (activeChatFriend && user) {
      const fetchChat = () => {
        fetch(`${API_URL}/chats/${user.id}/${activeChatFriend.id}`)
          .then(r => r.json()).then(d => {
            if (isMounted && d && Array.isArray(d.messages)) {
              setChatMessages(prev => {
                // Cek apakah perlu update
                if (JSON.stringify(prev) !== JSON.stringify(d.messages)) return d.messages;
                return prev;
              });
            }
          }).catch(() => { });
      };
      fetchChat();
      chatInterval = setInterval(fetchChat, 2000);
    }
    return () => { isMounted = false; clearInterval(chatInterval); };
  }, [activeChatFriend?.id, user?.id]);

  // Tandai Dibaca (Read Receipts Logic)
  useEffect(() => {
    if (activeChatFriend && user && chatMessages.length > 0) {
      const unreadExists = chatMessages.some(m => m.senderId === activeChatFriend.id && m.status !== 'read');
      if (unreadExists) {
        fetch(`${API_URL}/chats/${user.id}/${activeChatFriend.id}/read`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ readerId: user.id })
        }).catch(() => { });
      }
    }
  }, [chatMessages, activeChatFriend, user]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages]);

  useEffect(() => {
    if (currentView === 'leaderboard') fetch(`${API_URL}/leaderboard`).then(r => r.json()).then(d => setLeaderboardData(d)).catch(() => { });
    if (user?.level === 'Admin' && adminTab === 'siswa') fetch(`${API_URL}/students`).then(r => r.json()).then(d => setMasterStudents(d)).catch(() => { });
  }, [currentView, adminTab, user]);

  const showNotif = (msg, type = 'success') => { setNotification({ msg, type }); setTimeout(() => setNotification(null), 3000); };

  const calculateLevel = (xp) => {
    if (xp === 'MAX') return 'MAX';
    return Math.floor((Number(xp) || 0) / 100) + 1;
  };
  const getXpProgress = (xp) => {
    if (xp === 'MAX') return 100;
    return ((Number(xp) || 0) % 100);
  };

  const getAchievements = (u, worksCount = 0) => {
    const isAdmin = u?.level === 'Admin';
    return {
      gifAvatar: isAdmin || (u?.readingTime || 0) >= 600,
      diamondBorder: isAdmin || (u?.readingTime || 0) >= 1800,
      gifBg: isAdmin || calculateLevel(u?.xp || 0) >= 5,
      goldBorder: isAdmin || (u?.favorites?.length || 0) >= 3,
      socialTitle: isAdmin || (u?.friendsCount || u?.friends?.length || 0) >= 3,
      glowName: isAdmin || worksCount >= 1
    };
  };
  const myAchs = getAchievements(user, (books || []).filter(b => b.authorId === user?.id && b.status === 'approved').length);

  // --- ACTIONS ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsAuthenticating(true);

    const payload = userType === 'admin' ? { is_admin: true, username: loginForm.username, password: loginForm.password } : { is_admin: false, nisn: loginForm.nisn.trim() };
    try {
      const res = await fetch(`${API_URL}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();

      setTimeout(async () => {
        setIsAuthenticating(false);
        if (res.ok) {
          if (data.level !== 'Admin') {
            try {
              const fRes = await fetch(`${API_URL}/users/${data.id}/friends`);
              if (fRes.ok) setFriendsData(await fRes.json());
            } catch (e) { }
          }
          setUser(data); showNotif(`Login Sukses, ${data.name}`);
          setProfileForm({ name: data.name, avatarBase64: data.avatar || '', backgroundBase64: data.background || '', bio: data.bio || '' });
          setCurrentView(data.level === 'Admin' ? 'admin' : 'home');
        } else { showNotif(data.message || "Gagal Login", "error"); }
      }, 800);
    } catch (e) { setIsAuthenticating(false); showNotif("Server Terputus", "error"); }
  };

  const handleLogout = () => {
    setIsAuthenticating(true);
    setTimeout(() => {
      setUser(null); setChatMessages([]); setActiveChatFriend(null);
      setCurrentView('home'); setIsAuthenticating(false);
    }, 800);
  };

  const openPublicProfile = async (id) => {
    if (id === user?.id) { setCurrentView('profile'); setBookDetailModal(null); return; }
    try {
      const res = await fetch(`${API_URL}/users/public/${id}?viewerId=${user?.id || ''}`);
      if (res.ok) setPublicProfileModal(await res.json());
    } catch (e) { showNotif("Gagal memuat profil", "error"); }
  };

  const toggleLibrary = async (bookId, type) => {
    if (user.level === 'Admin') return;
    const isFav = user.favorites?.includes(bookId); const isWish = user.wishlist?.includes(bookId);
    let action = type === 'fav' ? (isFav ? 'remove_fav' : 'add_fav') : (isWish ? 'remove_wish' : 'add_wish');
    try {
      const res = await fetch(`${API_URL}/users/${user.id}/library`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bookId, action }) });
      const data = await res.json(); setUser({ ...user, favorites: data.favorites, wishlist: data.wishlist });
      showNotif(action.includes('add') ? 'Koleksi Diperbarui!' : 'Dihapus dari Koleksi');
    } catch (e) { }
  };

  const downloadBook = async (book) => {
    if (!book.fileBase64) return;
    try {
      await fetch(`${API_URL}/books/${book.id}/download`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id, userName: user.name, userAvatar: user.avatar }) });
      const a = document.createElement("a"); a.href = book.fileBase64;
      let ext = "pdf";
      if (book.mimeType && book.mimeType.includes('presentation')) ext = "pptx";
      else if (book.mimeType && book.mimeType.includes('document')) ext = "docx";
      a.download = `${book.title}.${ext}`; a.click();
      showNotif("Mengunduh File...");
    } catch (e) { }
  };

  const submitComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      const res = await fetch(`${API_URL}/books/${bookDetailModal.id}/comment`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, userName: user.name, userAvatar: user.avatar || '', text: commentText, role: user.level })
      });
      if (!res.ok) throw new Error();
      const newComment = await res.json();
      setBookDetailModal(prev => ({ ...prev, comments: [...(prev.comments || []), newComment] }));
      setBooks(prev => prev.map(b => b.id === bookDetailModal.id ? { ...b, comments: [...(b.comments || []), newComment] } : b));
      setCommentText('');
    } catch (e) { showNotif("Gagal mengirim komentar", "error"); }
  };

  const deleteComment = async (commentId) => {
    if (!window.confirm("Hapus komentar ini?")) return;
    try {
      const res = await fetch(`${API_URL}/books/${bookDetailModal.id}/comment/${commentId}`, { method: 'DELETE' });
      if (res.ok) {
        setBookDetailModal(prev => ({ ...prev, comments: prev.comments.filter(c => c.id !== commentId) }));
        setBooks(prev => prev.map(b => b.id === bookDetailModal.id ? { ...b, comments: b.comments.filter(c => c.id !== commentId) } : b));
      }
    } catch (e) { }
  };

  // Fungsi Kirim & Edit Chat (Termasuk GIF)
  const sendChat = async (e, gifUrl = null) => {
    if (e) e.preventDefault();
    if (!activeChatFriend) return;

    // Jika dalam mode Edit
    if (editingMessage) {
      try {
        await fetch(`${API_URL}/chats/${user.id}/${activeChatFriend.id}/${editingMessage.timestamp}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ newText: chatInput })
        });
        setEditingMessage(null); setChatInput('');
      } catch (e) { showNotif("Gagal mengedit pesan", "error"); }
      return;
    }

    const text = gifUrl ? gifUrl : chatInput;
    if (!text.trim()) return;
    if (!gifUrl) setChatInput('');
    setShowGifPicker(false); // Tutup popup GIF setelah pilih

    try {
      const res = await fetch(`${API_URL}/chats/${user.id}/${activeChatFriend.id}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderId: user.id, text, type: gifUrl ? 'gif' : 'text' })
      });
      const d = await res.json();
      if (d && Array.isArray(d.messages)) setChatMessages(d.messages);
    } catch (e) { showNotif("Gagal kirim pesan", "error"); }
  };

  const deleteChatMessage = async (timestamp) => {
    if (!window.confirm("Hapus pesan ini?")) return;
    try {
      await fetch(`${API_URL}/chats/${user.id}/${activeChatFriend.id}/${timestamp}`, { method: 'DELETE' });
      setChatMessages(prev => prev.filter(m => m.timestamp.toString() !== timestamp.toString()));
    } catch (e) { }
  };

  const startReading = async (book) => {
    if (user.level !== 'Admin') fetch(`${API_URL}/books/${book.id}/view`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id }) }).catch(() => { });
    setBookDetailModal(null); setReadingBook(book); setIsPreviewMode(false); setReadStartTime(Date.now());
  };

  const stopReading = async () => {
    if (readStartTime && user && user.level !== 'Admin') {
      const duration = Math.floor((Date.now() - readStartTime) / 1000);
      try {
        await fetch(`${API_URL}/users/${user.id}/profile`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ readingTime: (user.readingTime || 0) + duration }) });
        setUser(prev => ({ ...prev, readingTime: (prev.readingTime || 0) + duration }));
      } catch (e) { }
    }
    setReadingBook(null); setIsPreviewMode(false); setReadStartTime(null);
    if (user?.level !== 'Admin') fetch(`${API_URL}/stats/reading-stop`, { method: 'POST' }).catch(() => { });
  };

  const handleMediaUpload = async (e, type, isDocument = false) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!isDocument && file.type === 'image/gif') {
      if (type === 'avatar' && !myAchs.gifAvatar) { showNotif("GIF Avatar terkunci!", "error"); return; }
      if (type === 'background' && !myAchs.gifBg) { showNotif("GIF Background terkunci!", "error"); return; }
    }

    try {
      const base64 = await convertToBase64(file);
      if (isDocument) {
        setBookForm(prev => ({ ...prev, fileBase64: base64, mimeType: file.type }));
      } else {
        if (type === 'avatar') setProfileForm(prev => ({ ...prev, avatarBase64: base64 }));
        if (type === 'background') setProfileForm(prev => ({ ...prev, backgroundBase64: base64 }));
        if (type === 'cover') setBookForm(prev => ({ ...prev, coverBase64: base64 }));
      }
    } catch (err) { showNotif("Gagal membaca file", "error"); }
  };

  const convertToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader(); reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result); reader.onerror = error => reject(error);
  });

  const getSortedStudents = () => {
    return [...masterStudents].sort((a, b) => {
      const gOrder = { 'X': 1, 'XI': 2, 'XII': 3 };
      if (gOrder[a.grade] !== gOrder[b.grade]) return gOrder[a.grade] - gOrder[b.grade];
      return parseInt(a.subClass) - parseInt(b.subClass);
    });
  };

  // --- TAMPILAN OFFLINE ---
  if (serverStatus === 'offline') {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6 text-center font-sans text-gray-200">
        <div className="bg-gray-900 p-10 rounded-[3rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] max-w-md border-t-8 border-red-500 w-full relative">
          <Activity size={60} className="mx-auto text-red-500 mb-6 animate-pulse" />
          <h1 className="text-2xl font-black uppercase italic tracking-widest text-white">Server Offline</h1>
          <p className="text-sm text-gray-400 mt-4 font-medium">Jalankan <code className="text-red-400 bg-gray-800 px-2 py-1 rounded">node server.js</code> di komputermu.</p>
          <button onClick={() => setServerStatus('checking')} className="w-full mt-8 bg-blue-600 text-white font-black py-4 rounded-2xl uppercase tracking-widest hover:bg-blue-500 transition-all">Muat Ulang</button>
        </div>
      </div>
    );
  }

  // --- TAMPILAN LOADING / SINKRONISASI ---
  if (isAuthenticating) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4 font-sans z-[1000] fixed inset-0">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4 shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
        <h2 className="text-white font-black uppercase tracking-widest text-sm animate-pulse">Menyelaraskan Data...</h2>
      </div>
    );
  }

  // --- TAMPILAN LOGIN ---
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4 font-sans text-gray-200">
        <div className="bg-gray-900 w-full max-w-md rounded-[3rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden animate-fadeIn border border-gray-800">
          <div className="bg-gray-900 p-8 text-center relative border-b border-gray-800">
            <Library size={48} className="mx-auto text-blue-500 mb-3 drop-shadow-[0_0_15px_rgba(59,130,246,0.8)]" />
            <h2 className="font-black text-2xl text-white uppercase italic tracking-tighter">Smansa E-Library</h2>
            <p className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.4em]">Sistem Digital Terpadu</p>
          </div>

          <div className="flex bg-gray-950">
            <button onClick={() => setUserType('siswa')} className={`flex-1 py-4 text-xs font-black uppercase flex justify-center items-center gap-2 ${userType === 'siswa' ? 'bg-gray-900 text-blue-400 border-t-2 border-blue-500' : 'text-gray-600'}`}><GraduationCap size={16} /> Siswa</button>
            <button onClick={() => setUserType('admin')} className={`flex-1 py-4 text-xs font-black uppercase flex justify-center items-center gap-2 ${userType === 'admin' ? 'bg-gray-900 text-blue-400 border-t-2 border-blue-500' : 'text-gray-600'}`}><KeyRound size={16} /> Admin</button>
          </div>

          <div className="p-8">
            <form onSubmit={handleLogin} className="space-y-4">
              {userType === 'admin' ? (
                <div className="animate-fadeIn">
                  <input required placeholder="Username Admin" className="w-full p-4 bg-gray-800 text-white border border-gray-700 rounded-2xl outline-none focus:border-blue-500 mb-4" value={loginForm.username} onChange={e => setLoginForm({ ...loginForm, username: e.target.value })} />
                  <input required type="password" placeholder="Password" className="w-full p-4 bg-gray-800 text-white border border-gray-700 rounded-2xl outline-none font-mono focus:border-blue-500" value={loginForm.password} onChange={e => setLoginForm({ ...loginForm, password: e.target.value })} />
                </div>
              ) : (
                <div className="animate-fadeIn">
                  <div className="bg-gray-800 p-4 rounded-2xl mb-4 border border-gray-700">
                    <p className="text-[10px] text-gray-400 text-center leading-relaxed">Masukkan NISN kamu untuk login. Pastikan Admin sudah mendaftarkan NISN kamu.</p>
                  </div>
                  <input required placeholder="Masukkan NISN" className="w-full p-5 bg-gray-950 text-white border-2 border-gray-700 rounded-2xl outline-none focus:border-blue-500 font-mono text-center text-lg tracking-widest placeholder-gray-700" value={loginForm.nisn} onChange={e => setLoginForm({ ...loginForm, nisn: e.target.value })} />
                </div>
              )}
              <button className="w-full bg-blue-600 text-white p-4 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-500 transition-all mt-4 shadow-[0_0_20px_rgba(59,130,246,0.3)]">Masuk Sistem</button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // --- TAMPILAN DASHBOARD ---
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col font-sans pb-24 md:pb-0 text-gray-200">

      {/* NAVBAR DESKTOP */}
      <nav className="bg-gray-900 border-b border-gray-800 p-4 shadow-xl sticky top-0 z-40 hidden md:block">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentView('home')}>
            <div className="bg-blue-600 p-2 rounded-xl text-white shadow-[0_0_15px_rgba(59,130,246,0.6)]"><Library size={24} /></div>
            <span className="font-black text-xl tracking-tighter uppercase italic text-white">SMANSA</span>
          </div>

          <div className="flex items-center gap-6">
            <button onClick={() => setCurrentView('home')} className={`font-black text-xs uppercase tracking-widest ${currentView === 'home' ? 'text-blue-400' : 'hover:text-blue-400 text-gray-400'}`}>Beranda</button>
            <button onClick={() => setCurrentView('leaderboard')} className={`font-black text-xs uppercase tracking-widest ${currentView === 'leaderboard' ? 'text-blue-400' : 'hover:text-blue-400 text-gray-400'}`}>Peringkat</button>

            {user.level !== 'Admin' && (
              <>
                <button onClick={() => setCurrentView('upload')} className={`font-black text-xs uppercase tracking-widest ${currentView === 'upload' ? 'text-blue-400' : 'hover:text-blue-400 text-gray-400'}`}>Upload</button>
                <button onClick={() => setCurrentView('friends')} className={`font-black text-xs uppercase tracking-widest ${currentView === 'friends' ? 'text-blue-400' : 'hover:text-blue-400 text-gray-400'}`}>Sosial</button>
                <button onClick={() => { setActiveChatFriend(null); setChatMessages([]); setCurrentView('chat'); }} className={`font-black text-xs uppercase tracking-widest ${currentView === 'chat' ? 'text-blue-400' : 'hover:text-blue-400 text-gray-400'}`}>Chat</button>
              </>
            )}

            {user.level === 'Admin' && <button onClick={() => setCurrentView('admin')} className={`font-black text-xs uppercase tracking-widest flex items-center gap-1 ${currentView === 'admin' ? 'text-blue-400' : 'text-gray-400'}`}><Shield size={14} /> Admin</button>}

            <div className="h-8 w-px bg-gray-700 mx-2"></div>

            {/* Profil Menu di Navbar */}
            <div onClick={() => setCurrentView('profile')} className="flex items-center gap-3 cursor-pointer hover:bg-gray-800 p-2 rounded-xl transition-colors relative">
              <div className="text-right">
                <p className={`text-xs font-black uppercase flex items-center gap-1 ${myAchs.glowName ? 'text-white drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]' : 'text-white'}`}>
                  {(user.name || 'User').split(' ')[0]}
                  {myAchs.socialTitle && <Award size={12} className="text-blue-400" title="Sosialita" />}
                </p>
                <p className="text-[9px] font-bold text-blue-400 uppercase tracking-widest">{user.level !== 'Admin' ? `Level ${calculateLevel(user.xp)}` : 'Admin MAX'}</p>
              </div>
              <div className={`rounded-full relative ${myAchs.diamondBorder ? 'ring-2 ring-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.8)]' : myAchs.goldBorder ? 'ring-2 ring-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.6)]' : 'border-2 border-blue-500'}`}>
                <SafeAvatar src={user.avatar} sizeClassName="w-10 h-10" iconSize={20} />
              </div>
              <div className="absolute bottom-2 right-2 w-3 h-3 bg-green-500 border-2 border-gray-900 rounded-full"></div>
            </div>

            <button onClick={handleLogout} className="p-2 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/30"><LogOut size={20} /></button>
          </div>
        </div>
      </nav>

      {/* KONTEN UTAMA */}
      <main className="flex-grow p-4 md:p-8 max-w-7xl mx-auto w-full">

        {/* HOME / KATALOG */}
        {currentView === 'home' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Header Profil untuk HP */}
            <div className="bg-gray-900 border border-gray-800 p-6 md:p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
              <div className="absolute -right-10 -top-10 opacity-10 blur-sm"><Library size={250} /></div>
              <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="text-center md:text-left">
                  <h1 className={`text-3xl md:text-4xl font-black italic uppercase tracking-tighter leading-none mb-2 ${myAchs.glowName ? 'text-white drop-shadow-[0_0_10px_rgba(59,130,246,0.8)]' : 'text-white'}`}>Halo, {(user.name || 'User').split(' ')[0]}!</h1>
                  <p className="text-blue-400 font-bold uppercase tracking-widest text-xs">{user.level === 'Admin' ? 'Akses Pengelola' : 'Makin sering online, makin naik level!'}</p>
                </div>

                {user.level !== 'Admin' && (
                  <div className="bg-gray-950 border border-gray-800 p-4 rounded-3xl w-full md:w-64 text-center cursor-pointer hover:border-blue-500 transition-colors" onClick={() => setCurrentView('profile')}>
                    <div className="flex justify-between items-end mb-2">
                      <span className="font-black uppercase tracking-widest text-xs text-white"><Star className="inline w-4 text-blue-400 mb-1" /> Level {calculateLevel(user.xp)}</span>
                      <span className="text-[10px] font-bold text-gray-500">{user.xp} XP</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
                      <div className="bg-blue-500 h-3 rounded-full transition-all duration-1000" style={{ width: `${getXpProgress(user.xp)}%` }}></div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Katalog Buku */}
            <div>
              <h2 className="text-xl font-black uppercase italic tracking-widest text-white mb-6 border-l-4 border-blue-500 pl-3">Katalog Terbaru</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {(books || []).filter(b => b.status === 'approved').map(book => {
                  const hasCover = book.cover && typeof book.cover === 'string' && book.cover.trim().length > 10;
                  return (
                    <div key={book.id} className="bg-gray-900 rounded-[2rem] shadow-lg hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all overflow-hidden flex flex-col border border-gray-800 hover:border-blue-500 group cursor-pointer" onClick={() => setBookDetailModal(book)}>
                      <div className="h-40 md:h-56 bg-gray-800 relative overflow-hidden flex items-center justify-center">
                        {hasCover ? <img src={book.cover} onError={handleBookErr} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt={book.title} /> : <BookIcon size={48} className="text-gray-600" />}
                        <div className="absolute top-3 left-3 bg-blue-600 text-white text-[8px] font-black px-3 py-1 rounded-full uppercase shadow-md">
                          {book.type === 'community' ? 'Karya Siswa' : `Kelas ${book.grade}`}
                        </div>
                        <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-sm text-white text-[9px] font-bold px-2 py-1 rounded-lg flex items-center gap-1">
                          <Eye size={10} className="text-blue-400" /> {book.views || 0}
                        </div>
                        {(user?.favorites || []).includes(book.id) && <div className="absolute top-3 right-3 bg-yellow-500 text-white p-1.5 rounded-full shadow-md"><Star fill="currentColor" size={12} /></div>}
                      </div>
                      <div className="p-4 md:p-6 flex-grow flex flex-col justify-between">
                        <div>
                          <h3 className="font-black text-white text-sm md:text-lg leading-tight mb-1 line-clamp-2">{book.title}</h3>
                          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest italic line-clamp-1">{book.author}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* HALAMAN LEADERBOARD */}
        {currentView === 'leaderboard' && (
          <div className="animate-fadeIn space-y-6 max-w-6xl mx-auto">
            <div className="bg-gray-900 p-8 rounded-[3rem] shadow-xl border border-gray-800 text-center mb-8 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-900/20 to-purple-900/20"></div>
              <Crown size={56} className="mx-auto text-yellow-500 mb-4 drop-shadow-[0_0_15px_rgba(234,179,8,0.6)]" />
              <h2 className="text-3xl font-black text-white uppercase italic relative z-10">Papan Kehormatan</h2>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-2 relative z-10">Siswa Paling Berdedikasi di SMANSA</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-900 rounded-[2rem] border border-gray-800 p-6 flex flex-col h-[600px]">
                <h3 className="font-black text-sm text-white uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-gray-800 pb-4"><Star className="text-blue-400" /> Top Level (XP)</h3>
                <div className="space-y-3 overflow-y-auto flex-grow pr-2 scrollbar-thin">
                  {(leaderboardData?.topXP || []).map((u, i) => (
                    <div key={u.id} onClick={() => openPublicProfile(u.id)} className="flex items-center gap-3 bg-gray-950 p-3 rounded-2xl border border-gray-800 cursor-pointer hover:border-blue-500 transition-colors relative">
                      <div className={`font-black text-lg w-6 text-center ${i === 0 ? 'text-yellow-500' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-orange-600' : 'text-gray-700'}`}>{i + 1}</div>
                      <div className="relative">
                        <SafeAvatar src={u.avatar} sizeClassName="w-10 h-10" iconSize={16} />
                        {u.online && <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border border-gray-950 rounded-full"></div>}
                      </div>
                      <div className="flex-grow">
                        <h4 className="font-black text-white text-xs uppercase line-clamp-1">{u.name}</h4>
                        <p className="text-[9px] text-gray-500 font-bold uppercase">Level {calculateLevel(u.xp)} • {u.xp} XP</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-900 rounded-[2rem] border border-gray-800 p-6 flex flex-col h-[600px]">
                <h3 className="font-black text-sm text-white uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-gray-800 pb-4"><Trophy className="text-yellow-400" /> Kolektor Prestasi</h3>
                <div className="space-y-3 overflow-y-auto flex-grow pr-2 scrollbar-thin">
                  {(leaderboardData?.topAchievements || []).map((u, i) => (
                    <div key={u.id} onClick={() => openPublicProfile(u.id)} className="flex items-center gap-3 bg-gray-950 p-3 rounded-2xl border border-gray-800 cursor-pointer hover:border-yellow-500 transition-colors relative">
                      <div className={`font-black text-lg w-6 text-center ${i === 0 ? 'text-yellow-500' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-orange-600' : 'text-gray-700'}`}>{i + 1}</div>
                      <div className="relative">
                        <SafeAvatar src={u.avatar} sizeClassName="w-10 h-10" iconSize={16} />
                        {u.online && <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border border-gray-950 rounded-full"></div>}
                      </div>
                      <div className="flex-grow">
                        <h4 className="font-black text-white text-xs uppercase line-clamp-1">{u.name}</h4>
                        <p className="text-[9px] text-yellow-500 font-bold uppercase">{u.achCount} Achievement Buka</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-900 rounded-[2rem] border border-gray-800 p-6 flex flex-col h-[600px]">
                <h3 className="font-black text-sm text-white uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-gray-800 pb-4"><UploadCloud className="text-green-400" /> Kreator Terbanyak</h3>
                <div className="space-y-3 overflow-y-auto flex-grow pr-2 scrollbar-thin">
                  {(leaderboardData?.topCreators || []).map((u, i) => (
                    <div key={u.id} onClick={() => openPublicProfile(u.id)} className="flex items-center gap-3 bg-gray-950 p-3 rounded-2xl border border-gray-800 cursor-pointer hover:border-green-500 transition-colors relative">
                      <div className={`font-black text-lg w-6 text-center ${i === 0 ? 'text-yellow-500' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-orange-600' : 'text-gray-700'}`}>{i + 1}</div>
                      <div className="relative">
                        <SafeAvatar src={u.avatar} sizeClassName="w-10 h-10" iconSize={16} />
                        {u.online && <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border border-gray-950 rounded-full"></div>}
                      </div>
                      <div className="flex-grow">
                        <h4 className="font-black text-white text-xs uppercase line-clamp-1">{u.name}</h4>
                        <p className="text-[9px] text-green-500 font-bold uppercase">{u.count} Karya Terbit</p>
                      </div>
                    </div>
                  ))}
                  {(!leaderboardData?.topCreators || leaderboardData.topCreators.length === 0) && <p className="text-center text-xs text-gray-600 font-bold mt-10">Belum ada kreator.</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* UPLOAD KARYA SISWA */}
        {currentView === 'upload' && user.level !== 'Admin' && (
          <div className="animate-fadeIn max-w-3xl mx-auto space-y-6">
            <div className="bg-gray-900 p-8 md:p-10 rounded-[3rem] shadow-xl border border-gray-800">
              <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-2"><UploadCloud className="inline mr-2 text-blue-500" /> Upload Karyamu</h2>
              <p className="text-xs text-gray-400 font-medium mb-8">Dukung juga format PPT, DOCX, dll. Jika bukan PDF, file otomatis bisa diunduh pembaca.</p>

              <form onSubmit={async (e) => {
                e.preventDefault();
                const newBook = { id: Date.now().toString(), ...bookForm, authorId: user.id, type: 'community', status: 'pending', cover: bookForm.coverBase64 || '' };
                try {
                  await fetch(`${API_URL}/books`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newBook) });
                  showNotif("Karya terkirim ke server Admin! Menunggu ACC.");
                  setBookForm({ title: '', author: user.name, grade: user.grade, type: 'ebook', coverBase64: '', fileBase64: '', mimeType: '' });
                } catch (e) { }
              }} className="space-y-5">
                <input required className="w-full p-4 bg-gray-950 border border-gray-800 text-white rounded-2xl outline-none focus:border-blue-500" placeholder="Judul Karya" value={bookForm.title} onChange={e => setBookForm(prev => ({ ...prev, title: e.target.value }))} />

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-950 border border-gray-800 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-colors relative h-32">
                    <input type="file" accept="image/*" onChange={(e) => handleMediaUpload(e, 'cover')} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                    {bookForm.coverBase64 ? <img src={bookForm.coverBase64} className="h-full object-cover rounded-xl" /> : <><Camera size={24} className="text-gray-500 mb-2" /><span className="text-[10px] font-bold text-gray-500 uppercase text-center">Cover Gambar<br />(Opsional)</span></>}
                  </div>
                  <div className="p-4 bg-gray-950 border border-gray-800 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-colors relative h-32">
                    <input required type="file" accept=".pdf,.ppt,.pptx,.doc,.docx" onChange={(e) => handleMediaUpload(e, 'file', true)} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                    <FileText size={24} className={bookForm.fileBase64 ? "text-blue-500 mb-2" : "text-gray-500 mb-2"} />
                    <span className={`text-[10px] font-bold uppercase text-center ${bookForm.fileBase64 ? 'text-blue-400' : 'text-gray-500'}`}>{bookForm.fileBase64 ? 'File Terpilih!' : 'Pilih File (PDF/PPTX/DOCX)'}</span>
                  </div>
                </div>

                <button type="submit" className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl uppercase tracking-widest hover:bg-blue-500 transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)]">Kirim Karya</button>
              </form>
            </div>
          </div>
        )}

        {/* SOSIAL (TEMAN) */}
        {currentView === 'friends' && user.level !== 'Admin' && (
          <div className="animate-fadeIn space-y-6 max-w-4xl mx-auto">
            <div className="bg-gray-900 p-8 rounded-[3rem] shadow-xl border border-gray-800 text-center">
              <h2 className="text-2xl font-black text-white uppercase italic mb-4"><Users className="inline mr-2 text-blue-500" /> Jaringan Sosial</h2>
              <form onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const res = await fetch(`${API_URL}/friends/request`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fromId: user.id, targetNisn: friendNisn }) });
                  const data = await res.json();
                  if (res.ok) { showNotif(data.message); setFriendNisn(''); } else showNotif(data.message, "error");
                } catch (e) { }
              }} className="flex items-center gap-2 max-w-sm mx-auto bg-gray-950 p-2 rounded-2xl border border-gray-800 focus-within:border-blue-500 transition-colors">
                <input required placeholder="Cari berdasarkan NISN" className="flex-grow bg-transparent text-white p-3 outline-none text-sm font-mono text-center" value={friendNisn} onChange={e => setFriendNisn(e.target.value)} />
                <button type="submit" className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-500"><UserPlus size={20} /></button>
              </form>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-900 p-8 rounded-[2rem] border border-gray-800">
                <h3 className="font-black text-sm text-white uppercase tracking-widest border-b border-gray-800 pb-4 mb-4">Daftar Teman</h3>
                <div className="space-y-4">
                  {(friendsData?.friends || []).map(f => (
                    <div key={f.id} className="flex items-center gap-4 bg-gray-950 p-4 rounded-2xl border border-gray-800 cursor-pointer hover:border-blue-500 transition-colors group" onClick={() => openPublicProfile(f.id)}>
                      <div className="relative">
                        <SafeAvatar src={f.avatar} sizeClassName="w-12 h-12" iconSize={20} />
                        {f.online && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-gray-950 rounded-full"></div>}
                      </div>
                      <div className="flex-grow">
                        <h4 className="font-black text-white text-sm uppercase">{f.name}</h4>
                        <p className="text-[10px] text-gray-500 font-bold uppercase">Level {f.level}</p>
                      </div>
                      <button onClick={(e) => {
                        e.stopPropagation();
                        setActiveChatFriend(f);
                        setCurrentView('chat');
                      }} className="p-2 bg-blue-500/10 text-blue-400 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"><MessageCircle size={16} /></button>
                    </div>
                  ))}
                  {(!friendsData?.friends || friendsData.friends.length === 0) && <p className="text-center text-xs text-gray-600 font-bold py-6">Belum ada teman.</p>}
                </div>
              </div>

              <div className="bg-gray-900 p-8 rounded-[2rem] border border-gray-800">
                <h3 className="font-black text-sm text-white uppercase tracking-widest border-b border-gray-800 pb-4 mb-4">Permintaan Teman</h3>
                <div className="space-y-4">
                  {(friendsData?.requests || []).map(r => (
                    <div key={r.id} className="flex items-center justify-between bg-gray-950 p-4 rounded-2xl border border-gray-800">
                      <div className="flex items-center gap-3 cursor-pointer" onClick={() => openPublicProfile(r.id)}>
                        <SafeAvatar src={r.avatar} sizeClassName="w-10 h-10" iconSize={16} />
                        <h4 className="font-bold text-white text-xs uppercase">{r.name}</h4>
                      </div>
                      <button onClick={async () => {
                        await fetch(`${API_URL}/friends/accept`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id, requesterId: r.id }) });
                        showNotif("Diterima!");
                      }} className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]"><Check size={16} /></button>
                    </div>
                  ))}
                  {(!friendsData?.requests || friendsData.requests.length === 0) && <p className="text-center text-xs text-gray-600 font-bold py-6">Tidak ada permintaan baru.</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* HALAMAN CHAT SYSTEM (SEMPURNA DENGAN EDIT, GIF, DAN READ RECEIPTS) */}
        {currentView === 'chat' && user.level !== 'Admin' && (
          <div className="animate-fadeIn max-w-5xl mx-auto h-[75vh] bg-gray-900 rounded-[3rem] border border-gray-800 flex overflow-hidden shadow-2xl">

            {/* Daftar Teman Kiri */}
            <div className={`${activeChatFriend ? 'hidden md:flex' : 'flex'} w-full md:w-1/3 flex-col border-r border-gray-800 bg-gray-950`}>
              <div className="p-6 border-b border-gray-800"><h3 className="font-black text-white uppercase tracking-widest text-sm">Pesan Langsung</h3></div>
              <div className="flex-grow overflow-y-auto p-4 space-y-2 scrollbar-thin">
                {(friendsData?.friends || []).map(f => (
                  <div key={f.id} onClick={() => { setActiveChatFriend(f); }} className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-colors ${activeChatFriend?.id === f.id ? 'bg-blue-900/30 border border-blue-500/50' : 'hover:bg-gray-800 border border-transparent'}`}>
                    <div className="relative">
                      <SafeAvatar src={f.avatar} sizeClassName="w-10 h-10" iconSize={16} />
                      {f.online && <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border border-gray-950 rounded-full"></div>}
                    </div>
                    <h4 className="font-bold text-white text-xs uppercase line-clamp-1">{f.name}</h4>
                  </div>
                ))}
              </div>
            </div>

            {/* Ruang Obrolan Kanan */}
            <div className={`${!activeChatFriend ? 'hidden md:flex' : 'flex'} w-full md:w-2/3 flex-col bg-gray-900 relative`}>
              {activeChatFriend ? (
                <>
                  {/* Header Chat */}
                  <div className="p-4 border-b border-gray-800 bg-gray-950 flex items-center gap-4 shadow-sm z-10 flex-shrink-0">
                    <button onClick={() => { setActiveChatFriend(null); }} className="md:hidden text-gray-400 hover:text-white"><X size={20} /></button>
                    <div className="cursor-pointer flex-shrink-0" onClick={() => openPublicProfile(activeChatFriend?.id)}>
                      <SafeAvatar src={activeChatFriend?.avatar} sizeClassName="w-10 h-10" iconSize={16} />
                    </div>
                    <div>
                      <h3 className="font-black text-white text-sm uppercase">{(activeChatFriend?.name || 'Teman').split(' ')[0]}</h3>
                      <p className={`text-[10px] font-bold ${activeChatFriend?.online ? 'text-green-500' : 'text-gray-500'}`}>{activeChatFriend?.online ? 'Online' : 'Offline'}</p>
                    </div>
                  </div>

                  {/* Kotak Pesan (Dengan Centang Biru, Edit & GIF) */}
                  <div className="flex-grow overflow-y-auto p-4 md:p-6 flex flex-col gap-6 scrollbar-thin relative bg-gray-900">
                    {(chatMessages || []).map((msg, idx) => {
                      const isMe = msg.senderId === user.id;
                      const avatarSrc = isMe ? user.avatar : activeChatFriend?.avatar;
                      return (
                        <div key={idx} className={`flex gap-3 items-end ${isMe ? 'justify-end' : 'justify-start'}`}>
                          {!isMe && <SafeAvatar src={avatarSrc} sizeClassName="w-8 h-8" iconSize={12} />}

                          <div className="flex flex-col group relative max-w-[75%] md:max-w-md">
                            <div className={`p-3 px-4 rounded-2xl text-sm shadow-sm ${isMe ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-gray-800 text-gray-200 border border-gray-700 rounded-bl-sm'}`}>
                              {msg.type === 'gif' ? (
                                <img src={msg.text} className="w-48 rounded-xl object-cover" />
                              ) : (
                                <p style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>{msg.text}</p>
                              )}
                            </div>

                            {/* Tombol Aksi (Hapus & Edit) */}
                            {isMe && msg.timestamp && (
                              <div className="absolute top-1/2 -translate-y-1/2 -left-16 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                {msg.type !== 'gif' && (
                                  <button onClick={() => { setEditingMessage(msg); setChatInput(msg.text); setShowGifPicker(false); }} className="text-gray-500 hover:text-blue-400 p-2" title="Edit Pesan"><Edit size={14} /></button>
                                )}
                                <button onClick={() => deleteChatMessage(msg.timestamp)} className="text-gray-500 hover:text-red-500 p-2" title="Hapus"><Trash2 size={14} /></button>
                              </div>
                            )}

                            {/* Timestamp & Status Baca */}
                            {msg.timestamp && (
                              <div className={`flex items-center gap-1 mt-1 ${isMe ? 'justify-end pr-1' : 'justify-start pl-1'}`}>
                                {msg.isEdited && <span className="text-[8px] text-gray-500 italic mr-1">Diedit</span>}
                                <span className="text-[8px] font-bold text-gray-500">
                                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                {/* Status Read ala WA */}
                                {isMe && (
                                  msg.status === 'read' ? <CheckCheck size={12} className="text-blue-400" /> : <Check size={12} className="text-gray-500" />
                                )}
                              </div>
                            )}
                          </div>

                          {isMe && <SafeAvatar src={avatarSrc} sizeClassName="w-8 h-8" iconSize={12} />}
                        </div>
                      )
                    })}
                    <div ref={chatEndRef} className="h-1" />
                  </div>

                  {/* Input Chat */}
                  <div className="p-4 bg-gray-950 border-t border-gray-800 z-10 flex-shrink-0 relative">

                    {/* Popup GIF */}
                    {showGifPicker && (
                      <div className="absolute bottom-full mb-2 left-4 bg-gray-800 p-3 rounded-2xl border border-gray-700 shadow-xl grid grid-cols-4 gap-2 w-[280px] animate-slideDown z-20">
                        {GIF_LIST.map((gif, i) => (
                          <img key={i} src={gif} onClick={() => sendChat(null, gif)} className="w-16 h-16 object-cover rounded-lg cursor-pointer hover:ring-2 ring-blue-500" />
                        ))}
                      </div>
                    )}

                    {/* Indikator Mode Edit */}
                    {editingMessage && (
                      <div className="flex justify-between items-center bg-gray-800 p-2 px-4 rounded-t-xl text-[10px] text-gray-400 border border-b-0 border-gray-700">
                        <span className="font-bold">Mengedit Pesan...</span>
                        <button onClick={() => { setEditingMessage(null); setChatInput(''); }} className="hover:text-red-400"><X size={14} /></button>
                      </div>
                    )}

                    <form onSubmit={e => sendChat(e, null)} className={`flex items-center gap-2 bg-gray-900 border border-gray-800 p-1 focus-within:border-blue-500 transition-colors ${editingMessage ? 'rounded-b-2xl rounded-t-none' : 'rounded-2xl'}`}>
                      <button type="button" onClick={() => setShowGifPicker(!showGifPicker)} className={`p-3 rounded-xl transition-colors ${showGifPicker ? 'text-blue-400 bg-gray-800' : 'text-gray-400 hover:text-white'}`}><ImageIcon size={20} /></button>
                      <input required value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder={editingMessage ? "Ketik perbaikan pesan..." : `Kirim pesan ke ${(activeChatFriend?.name || 'teman').split(' ')[0]}...`} className="flex-grow bg-transparent text-white px-2 py-3 text-sm outline-none" />
                      <button type="submit" className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-500"><Send size={18} /></button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex-grow flex flex-col items-center justify-center text-center opacity-30">
                  <MessageSquare size={64} className="mb-4" />
                  <p className="font-black uppercase tracking-widest text-sm text-white">Pilih teman untuk mulai chat</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* HALAMAN PROFIL PRIBADI (ADMIN & SISWA) */}
        {currentView === 'profile' && (
          <div className="animate-fadeIn max-w-3xl mx-auto space-y-6">
            <div className="bg-gray-900 rounded-[3rem] shadow-xl text-center border border-gray-800 relative overflow-hidden flex flex-col">

              {/* Background Banner Edit */}
              <div className="h-48 bg-gray-800 relative group flex-shrink-0">
                {profileForm.backgroundBase64 ? <img src={profileForm.backgroundBase64} onError={handleImgErr} className="w-full h-full object-cover" /> : <div className="absolute inset-0 bg-gradient-to-r from-blue-900/40 to-purple-900/40"></div>}
                <label className={`absolute top-4 right-4 bg-black/60 text-white p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-md border border-white/20 text-xs font-bold flex items-center gap-2 ${!myAchs.gifBg ? 'cursor-not-allowed opacity-100 bg-red-900/60' : 'cursor-pointer'}`}>
                  {myAchs.gifBg ? <Camera size={14} /> : <Lock size={14} />}
                  Ubah Banner (GIF/JPG)
                  {myAchs.gifBg && <input type="file" accept="image/*" className="hidden" onChange={(e) => handleMediaUpload(e, 'background')} />}
                </label>
              </div>

              <div className="px-8 pb-10 pt-0 relative flex-grow">
                <div className={`w-32 h-32 mx-auto rounded-full bg-gray-900 shadow-[0_0_30px_rgba(59,130,246,0.3)] overflow-hidden relative -mt-16 mb-4 flex items-center justify-center group z-10 ${myAchs.diamondBorder ? 'ring-4 ring-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.6)]' : myAchs.goldBorder ? 'ring-4 ring-yellow-400' : 'border-4 border-gray-900'}`}>
                  <SafeAvatar src={profileForm.avatarBase64} sizeClassName="w-full h-full" iconSize={64} />

                  <label className={`absolute inset-0 bg-black/60 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm ${!myAchs.gifAvatar ? 'cursor-not-allowed opacity-100 bg-red-900/60' : 'cursor-pointer'}`}>
                    {myAchs.gifAvatar ? <Camera size={24} className="mb-1" /> : <Lock size={24} className="mb-1 text-red-400" />}
                    <span className="text-[9px] font-black uppercase tracking-widest">Ubah PP</span>
                    {myAchs.gifAvatar && <input type="file" accept="image/*" className="hidden" onChange={(e) => handleMediaUpload(e, 'avatar')} />}
                  </label>
                </div>

                <h2 className={`text-3xl font-black uppercase flex items-center justify-center gap-2 ${myAchs.glowName ? 'text-white drop-shadow-[0_0_10px_rgba(59,130,246,0.8)]' : 'text-white'}`}>
                  {(user?.name || 'User')} {myAchs.socialTitle && <Award size={20} className="text-blue-400 drop-shadow-[0_0_5px_rgba(96,165,250,0.8)]" title="Sosialita" />}
                </h2>
                {user.level !== 'Admin' ? (
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-6 mt-1">NISN: {user.nisn} • Kelas {user.grade}-{user.subClass}</p>
                ) : (
                  <p className="text-xs font-bold text-yellow-500 uppercase tracking-widest mb-6 mt-1">AKUN PENGELOLA PERPUSTAKAAN (MAX LEVEL)</p>
                )}

                <form onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    const res = await fetch(`${API_URL}/users/${user.id}/profile`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: profileForm.name, avatar: profileForm.avatarBase64, background: profileForm.backgroundBase64, bio: profileForm.bio }) });
                    const data = await res.json(); setUser(data); showNotif("Profil Tersimpan");
                  } catch (e) { }
                }} className="bg-gray-950 p-6 rounded-3xl space-y-4 border border-gray-800 text-left relative z-10 mb-6">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-gray-500 mb-2">Nama Tampilan</label>
                    <input required className="w-full p-4 border border-gray-800 rounded-2xl bg-gray-900 text-white font-bold outline-none focus:border-blue-500" value={profileForm.name} onChange={e => setProfileForm(prev => ({ ...prev, name: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-gray-500 mb-2">Bio Singkat</label>
                    <textarea rows="3" className="w-full p-4 border border-gray-800 rounded-2xl bg-gray-900 text-white font-bold outline-none focus:border-blue-500 resize-none" placeholder="Tulis sesuatu tentang dirimu..." value={profileForm.bio} onChange={e => setProfileForm(prev => ({ ...prev, bio: e.target.value }))}></textarea>
                  </div>
                  <button type="submit" className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl uppercase tracking-widest text-xs hover:bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.4)] transition-all">Simpan Perubahan</button>
                </form>

                {/* --- DAFTAR ACHIEVEMENT & REWARD --- */}
                {user.level !== 'Admin' && (
                  <div className="bg-gray-950 p-6 rounded-3xl border border-gray-800 text-left">
                    <h3 className="text-sm font-black text-white uppercase mb-4 flex items-center gap-2"><Trophy size={16} className="text-yellow-500" /> Pencapaian Kosmetik</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className={`p-4 rounded-2xl border flex items-center gap-4 ${myAchs.gifAvatar ? 'bg-green-900/10 border-green-500/30' : 'bg-gray-900 border-gray-800'}`}>
                        <div className="flex-shrink-0">{myAchs.gifAvatar ? <Unlock size={20} className="text-green-500" /> : <Lock size={20} className="text-gray-600" />}</div>
                        <div className="flex-grow">
                          <h4 className="text-[11px] font-black text-white uppercase">Kutu Buku Pemula</h4>
                          <p className="text-[9px] text-gray-400 font-medium">Baca buku 10 Menit ({`${Math.floor((user?.readingTime || 0) / 60)}/10m`})</p>
                          <span className={`inline-block mt-2 text-[8px] font-bold px-2 py-1 rounded ${myAchs.gifAvatar ? 'bg-green-500 text-white' : 'bg-gray-800 text-gray-400'}`}>Avatar GIF</span>
                        </div>
                      </div>
                      <div className={`p-4 rounded-2xl border flex items-center gap-4 ${myAchs.diamondBorder ? 'bg-cyan-900/10 border-cyan-500/30' : 'bg-gray-900 border-gray-800'}`}>
                        <div className="flex-shrink-0">{myAchs.diamondBorder ? <Unlock size={20} className="text-cyan-500" /> : <Lock size={20} className="text-gray-600" />}</div>
                        <div className="flex-grow">
                          <h4 className="text-[11px] font-black text-white uppercase">Kutu Buku Elite</h4>
                          <p className="text-[9px] text-gray-400 font-medium">Baca buku 30 Menit ({`${Math.floor((user?.readingTime || 0) / 60)}/30m`})</p>
                          <span className={`inline-block mt-2 text-[8px] font-bold px-2 py-1 rounded ${myAchs.diamondBorder ? 'bg-cyan-500 text-white' : 'bg-gray-800 text-gray-400'}`}>Bingkai Berlian</span>
                        </div>
                      </div>
                      <div className={`p-4 rounded-2xl border flex items-center gap-4 ${myAchs.gifBg ? 'bg-green-900/10 border-green-500/30' : 'bg-gray-900 border-gray-800'}`}>
                        <div className="flex-shrink-0">{myAchs.gifBg ? <Unlock size={20} className="text-green-500" /> : <Lock size={20} className="text-gray-600" />}</div>
                        <div className="flex-grow">
                          <h4 className="text-[11px] font-black text-white uppercase">Siswa Teladan</h4>
                          <p className="text-[9px] text-gray-400 font-medium">Capai Level 5 (Level {calculateLevel(user.xp)})</p>
                          <span className={`inline-block mt-2 text-[8px] font-bold px-2 py-1 rounded ${myAchs.gifBg ? 'bg-green-500 text-white' : 'bg-gray-800 text-gray-400'}`}>Banner GIF</span>
                        </div>
                      </div>
                      <div className={`p-4 rounded-2xl border flex items-center gap-4 ${myAchs.goldBorder ? 'bg-yellow-900/10 border-yellow-500/30' : 'bg-gray-900 border-gray-800'}`}>
                        <div className="flex-shrink-0">{myAchs.goldBorder ? <Unlock size={20} className="text-yellow-500" /> : <Lock size={20} className="text-gray-600" />}</div>
                        <div className="flex-grow">
                          <h4 className="text-[11px] font-black text-white uppercase">Kolektor Ilmu</h4>
                          <p className="text-[9px] text-gray-400 font-medium">3 Buku Favorit ({(user.favorites || []).length}/3)</p>
                          <span className={`inline-block mt-2 text-[8px] font-bold px-2 py-1 rounded ${myAchs.goldBorder ? 'bg-yellow-500 text-white' : 'bg-gray-800 text-gray-400'}`}>Bingkai Emas</span>
                        </div>
                      </div>
                      <div className={`p-4 rounded-2xl border flex items-center gap-4 ${myAchs.socialTitle ? 'bg-blue-900/10 border-blue-500/30' : 'bg-gray-900 border-gray-800'}`}>
                        <div className="flex-shrink-0">{myAchs.socialTitle ? <Unlock size={20} className="text-blue-500" /> : <Lock size={20} className="text-gray-600" />}</div>
                        <div className="flex-grow">
                          <h4 className="text-[11px] font-black text-white uppercase">Sosialita SMANSA</h4>
                          <p className="text-[9px] text-gray-400 font-medium">Punya 3 Teman ({(user.friends || []).length}/3)</p>
                          <span className={`inline-block mt-2 text-[8px] font-bold px-2 py-1 rounded ${myAchs.socialTitle ? 'bg-blue-500 text-white' : 'bg-gray-800 text-gray-400'}`}>Gelar Khusus</span>
                        </div>
                      </div>
                      <div className={`p-4 rounded-2xl border flex items-center gap-4 ${myAchs.glowName ? 'bg-purple-900/10 border-purple-500/30' : 'bg-gray-900 border-gray-800'}`}>
                        <div className="flex-shrink-0">{myAchs.glowName ? <Unlock size={20} className="text-purple-400" /> : <Lock size={20} className="text-gray-600" />}</div>
                        <div className="flex-grow">
                          <h4 className="text-[11px] font-black text-white uppercase">Kreator Berbakat</h4>
                          <p className="text-[9px] text-gray-400 font-medium">Terbitkan 1 Karya ({(books || []).filter(b => b.authorId === user.id && b.status === 'approved').length}/1)</p>
                          <span className={`inline-block mt-2 text-[8px] font-bold px-2 py-1 rounded ${myAchs.glowName ? 'bg-purple-500 text-white' : 'bg-gray-800 text-gray-400'}`}>Nama Bercahaya</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* HALAMAN ADMIN */}
        {currentView === 'admin' && user.level === 'Admin' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex bg-gray-900 p-2 rounded-2xl shadow-sm border border-gray-800 overflow-x-auto scrollbar-thin">
              {['dashboard', 'koleksi', 'approval', 'siswa'].map(t => (
                <button key={t} onClick={() => setAdminTab(t)} className={`flex-1 py-3 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap ${adminTab === t ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-800'}`}>
                  {t}
                </button>
              ))}
            </div>

            {/* Admin: Dashboard */}
            {adminTab === 'dashboard' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-900 p-10 rounded-[3rem] border border-gray-800 flex flex-col items-center justify-center text-center">
                  <Activity size={40} className="text-green-500 mb-4 animate-pulse" />
                  <h3 className="text-sm font-black text-gray-500 uppercase tracking-widest mb-1">User Online (Live)</h3>
                  <p className="text-7xl font-black text-white">{onlineUsers}</p>
                </div>
                <div className="bg-gray-900 p-10 rounded-[3rem] border border-gray-800 flex flex-col items-center justify-center text-center">
                  <BookOpen size={40} className="text-blue-500 mb-4" />
                  <h3 className="text-sm font-black text-gray-500 uppercase tracking-widest mb-1">Koleksi Aktif</h3>
                  <p className="text-7xl font-black text-white">{(books || []).filter(b => b.status === 'approved').length}</p>
                </div>
                <div className="bg-gray-900 p-10 rounded-[3rem] border border-gray-800 flex flex-col items-center justify-center text-center">
                  <Users size={40} className="text-yellow-500 mb-4" />
                  <h3 className="text-sm font-black text-gray-500 uppercase tracking-widest mb-1">Siswa Terdaftar</h3>
                  <p className="text-7xl font-black text-white">{(masterStudents || []).length}</p>
                </div>
              </div>
            )}

            {/* Admin: Koleksi */}
            {adminTab === 'koleksi' && (
              <div className="space-y-6">
                <div className="bg-gray-900 p-8 rounded-[2rem] border border-gray-800">
                  <h3 className="font-black text-sm text-white uppercase mb-6 flex items-center gap-2"><PlusCircle className="text-blue-500" /> {editingBook ? 'Edit Buku' : 'Tambah Buku Resmi'}</h3>
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    try {
                      if (editingBook) {
                        const updatedBook = { ...editingBook, ...bookForm };
                        await fetch(`${API_URL}/books/${editingBook.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updatedBook) });
                        setBooks(books.map(b => b.id === editingBook.id ? updatedBook : b));
                        showNotif("Buku berhasil diupdate!");
                        setEditingBook(null);
                      } else {
                        const newBook = { id: Date.now().toString(), ...bookForm, type: 'ebook', status: 'approved' };
                        await fetch(`${API_URL}/books`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newBook) });
                        setBooks([...books, newBook]);
                        showNotif("Buku berhasil disimpan!");
                      }
                      setBookForm({ title: '', author: '', grade: 'X', type: 'ebook', coverBase64: '', fileBase64: '', mimeType: '' });
                    } catch (e) { }
                  }} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input required className="p-4 border border-gray-800 rounded-xl text-sm bg-gray-950 text-white outline-none focus:border-blue-500" placeholder="Judul Buku" value={bookForm.title} onChange={e => setBookForm(prev => ({ ...prev, title: e.target.value }))} />
                    <input required className="p-4 border border-gray-800 rounded-xl text-sm bg-gray-950 text-white outline-none focus:border-blue-500" placeholder="Penulis/Mapel" value={bookForm.author} onChange={e => setBookForm(prev => ({ ...prev, author: e.target.value }))} />
                    <select className="p-4 border border-gray-800 rounded-xl text-sm font-bold bg-gray-950 text-white outline-none" value={bookForm.grade} onChange={e => setBookForm(prev => ({ ...prev, grade: e.target.value }))}>
                      <option value="X">Kelas X</option><option value="XI">Kelas XI</option><option value="XII">Kelas XII</option>
                    </select>

                    <div className="md:col-span-3 grid grid-cols-2 gap-4 mt-2">
                      <div className="p-4 border border-gray-800 rounded-xl bg-gray-950 flex flex-col items-center justify-center relative h-24 hover:border-blue-500 transition-all cursor-pointer">
                        <input type="file" accept="image/*" onChange={async (e) => {
                          if (e.target.files && e.target.files[0]) {
                            const b64 = await convertToBase64(e.target.files[0]);
                            setBookForm(prev => ({ ...prev, coverBase64: b64 }));
                          }
                        }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                        {bookForm.coverBase64 ? <span className="text-xs font-bold text-green-400">Thumbnail OK!</span> : <><Camera size={20} className="text-gray-500 mb-1" /><span className="text-[10px] font-bold text-gray-500 uppercase">Pilih Thumbnail</span></>}
                      </div>
                      <div className="p-4 border border-gray-800 rounded-xl bg-gray-950 flex flex-col items-center justify-center relative h-24 hover:border-blue-500 transition-all cursor-pointer">
                        <input type={editingBook ? "text" : "file"} accept=".pdf,.ppt,.pptx,.doc,.docx" onChange={async (e) => {
                          if (e.target.files && e.target.files[0]) {
                            const file = e.target.files[0];
                            const b64 = await convertToBase64(file);
                            setBookForm(prev => ({ ...prev, fileBase64: b64, mimeType: file.type }));
                          } else if (e.target.type === 'text') {
                            setBookForm(prev => ({ ...prev, fileBase64: e.target.value }));
                          }
                        }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                        <FileText size={20} className={bookForm.fileBase64 ? "text-green-500 mb-1" : "text-gray-500 mb-1"} />
                        <span className={`text-[10px] font-bold uppercase ${bookForm.fileBase64 ? "text-green-400" : "text-gray-500"}`}>{bookForm.fileBase64 ? "File Terpilih!" : "Pilih File"}</span>
                      </div>
                    </div>
                    <div className="md:col-span-3 flex gap-2 mt-2">
                      <button type="submit" className="flex-grow bg-blue-600 text-white rounded-xl font-black py-4 uppercase text-[10px] tracking-widest shadow-md hover:bg-blue-500">{editingBook ? 'Simpan Perubahan' : 'Posting Buku Publik'}</button>
                      {editingBook && <button type="button" onClick={() => { setEditingBook(null); setBookForm({ title: '', author: '', grade: 'X', type: 'ebook', coverBase64: '', fileBase64: '', mimeType: '' }); }} className="px-6 bg-gray-800 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-gray-700">Batal</button>}
                    </div>
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
                        {(books || []).filter(b => b.status === 'approved').map(b => (
                          <tr key={b.id} className="hover:bg-gray-800/50">
                            <td className="p-4 font-bold text-sm text-gray-200 flex items-center gap-3">
                              <SafeAvatar src={b.cover} sizeClassName="w-10 h-10" iconSize={16} />
                              <div>{b.title} <span className="block text-[10px] text-blue-400 uppercase mt-1">{b.type === 'community' ? 'Karya Siswa' : `Kelas ${b.grade}`}</span></div>
                            </td>
                            <td className="p-4 text-center whitespace-nowrap">
                              <button onClick={() => { setEditingBook(b); setBookForm({ title: b.title, author: b.author, grade: b.grade, type: b.type, coverBase64: b.cover, fileBase64: b.fileBase64, mimeType: b.mimeType }); }} className="p-3 bg-blue-500/10 text-blue-400 rounded-xl hover:bg-blue-500 hover:text-white transition-all mr-2"><Edit size={16} /></button>
                              <button onClick={async () => {
                                if (window.confirm("Hapus Buku?")) {
                                  await fetch(`${API_URL}/books/${b.id}`, { method: 'DELETE' });
                                  setBooks(books.filter(bk => bk.id !== b.id)); showNotif("Buku Dihapus", "info");
                                }
                              }} className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"><Trash2 size={16} /></button>
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
                <div className="p-6 border-b border-gray-800"><h3 className="font-black text-white text-sm uppercase tracking-widest">Menunggu Persetujuan</h3></div>
                <div className="overflow-x-auto p-4">
                  <table className="w-full text-left border-collapse">
                    <thead className="text-[10px] font-black uppercase text-gray-500">
                      <tr><th className="p-4 border-b border-gray-800">Karya</th><th className="p-4 border-b border-gray-800 text-center">Aksi</th></tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {(books || []).filter(b => b.status === 'pending').map(b => (
                        <tr key={b.id} className="hover:bg-gray-800/50">
                          <td className="p-4 font-bold text-sm text-gray-200 flex items-center gap-3">
                            <SafeAvatar src={b.cover} sizeClassName="w-10 h-10" iconSize={16} />
                            <div>{b.title} <span className="block text-[10px] text-gray-400 uppercase mt-1">Oleh: {b.author}</span></div>
                          </td>
                          <td className="p-4 flex justify-center gap-2">
                            <button onClick={() => { setReadingBook(b); setIsPreviewMode(true); }} className="p-3 bg-blue-500/10 text-blue-400 rounded-xl hover:bg-blue-500 hover:text-white" title="Pratinjau File"><Eye size={16} /></button>
                            <button onClick={async () => {
                              await fetch(`${API_URL}/books/${b.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...b, status: 'approved' }) });
                              setBooks(books.map(bk => bk.id === b.id ? { ...bk, status: 'approved' } : bk)); showNotif("Karya di-ACC!");
                            }} className="p-3 bg-green-500/10 text-green-500 rounded-xl hover:bg-green-500 hover:text-white" title="Terima (ACC)"><Check size={16} /></button>
                            <button onClick={async () => {
                              if (window.confirm("Tolak dan hapus karya ini?")) {
                                await fetch(`${API_URL}/books/${b.id}`, { method: 'DELETE' }); setBooks(books.filter(bk => bk.id !== b.id)); showNotif("Karya ditolak/dihapus", "info");
                              }
                            }} className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white" title="Tolak (Hapus)"><X size={16} /></button>
                          </td>
                        </tr>
                      ))}
                      {(books || []).filter(b => b.status === 'pending').length === 0 && <tr><td colSpan="2" className="p-10 text-center text-xs font-bold text-gray-600">Tidak ada karya yang menunggu ACC.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Admin: Siswa (Master Data) */}
            {adminTab === 'siswa' && (
              <div className="space-y-6">
                <div className="bg-gray-900 p-8 rounded-[2rem] border border-gray-800">
                  <h3 className="font-black text-sm text-white uppercase mb-4 flex items-center gap-2"><UserPlus className="text-blue-500" /> {editingStudent ? 'Edit Master Siswa' : 'Registrasi NISN Siswa'}</h3>
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    try {
                      if (editingStudent) {
                        await fetch(`${API_URL}/students/${editingStudent.nisn}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nisn: studentInput.nisn, name: studentInput.name, grade: studentInput.grade, subClass: studentInput.sub }) });
                        showNotif(`Data siswa diupdate!`);
                        setEditingStudent(null);
                      } else {
                        await fetch(`${API_URL}/students/bulk`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ students: [{ ...studentInput, subClass: studentInput.sub }] }) });
                        showNotif(`NISN ${studentInput.nisn} terdaftar!`);
                      }
                      loadAdminStudents();
                      setStudentInput({ nisn: '', name: '', grade: 'X', sub: '1' });
                    } catch (e) { showNotif("Gagal menyimpan data", "error"); }
                  }} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <input required placeholder="Nama Siswa" className="p-4 bg-gray-950 text-white border border-gray-800 rounded-xl text-sm outline-none" value={studentInput.name} onChange={e => setStudentInput(prev => ({ ...prev, name: e.target.value }))} />
                    <input required placeholder="NISN Resmi" className="p-4 bg-gray-950 text-white border border-gray-800 rounded-xl text-sm font-mono outline-none" value={studentInput.nisn} onChange={e => setStudentInput(prev => ({ ...prev, nisn: e.target.value }))} />
                    <select className="p-4 bg-gray-950 text-white border border-gray-800 rounded-xl font-black text-xs outline-none" value={studentInput.grade} onChange={e => setStudentInput(prev => ({ ...prev, grade: e.target.value, sub: '1' }))}>
                      <option value="X">Kelas X</option><option value="XI">Kelas XI</option><option value="XII">Kelas XII</option>
                    </select>
                    <select className="p-4 bg-gray-950 text-white border border-gray-800 rounded-xl font-black text-xs outline-none" value={studentInput.sub} onChange={e => setStudentInput(prev => ({ ...prev, sub: e.target.value }))}>
                      {[...Array(11)].map((_, i) => <option key={i + 1} value={i + 1}>{studentInput.grade}-{i + 1}</option>)}
                    </select>
                    <div className="md:col-span-4 flex gap-2 mt-2">
                      <button type="submit" className="flex-grow bg-blue-600 text-white rounded-xl font-black py-4 text-[10px] uppercase shadow-md hover:bg-blue-500 transition-all">{editingStudent ? 'Simpan Perubahan' : 'Daftarkan Master'}</button>
                      {editingStudent && <button type="button" onClick={() => { setEditingStudent(null); setStudentInput({ nisn: '', name: '', grade: 'X', sub: '1' }); }} className="px-6 bg-gray-800 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-gray-700">Batal</button>}
                    </div>
                  </form>
                </div>

                <div className="bg-gray-900 rounded-[2rem] border border-gray-800 overflow-hidden">
                  <div className="p-6 border-b border-gray-800"><h3 className="font-black text-white text-sm uppercase tracking-widest">Daftar Siswa (Master Data)</h3></div>
                  <div className="overflow-x-auto p-4 max-h-[600px] overflow-y-auto scrollbar-thin">
                    <table className="w-full text-left border-collapse">
                      <thead className="text-[10px] font-black uppercase text-gray-500 sticky top-0 bg-gray-900 z-10">
                        <tr><th className="p-4 border-b border-gray-800">Nama Siswa</th><th className="p-4 border-b border-gray-800">NISN</th><th className="p-4 border-b border-gray-800">Kelas</th><th className="p-4 border-b border-gray-800 text-center">Aksi</th></tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800">
                        {getSortedStudents().map((s, idx) => (
                          <tr key={idx} className="hover:bg-gray-800/50">
                            <td className="p-4 font-bold text-sm text-gray-200">{s.name}</td>
                            <td className="p-4 font-mono text-xs text-blue-400">{s.nisn}</td>
                            <td className="p-4 text-xs font-bold text-gray-400">{s.grade}-{s.subClass}</td>
                            <td className="p-4 text-center whitespace-nowrap">
                              <button onClick={() => { setEditingStudent(s); setStudentInput({ nisn: s.nisn, name: s.name, grade: s.grade, sub: s.subClass }); }} className="p-2 bg-blue-500/10 text-blue-400 rounded-xl hover:bg-blue-500 hover:text-white transition-all mr-2"><Edit size={14} /></button>
                              <button onClick={async () => {
                                if (window.confirm(`Hapus Siswa dengan NISN ${s.nisn}?`)) {
                                  await fetch(`${API_URL}/students/${s.nisn}`, { method: 'DELETE' });
                                  setMasterStudents(masterStudents.filter(ms => ms.nisn !== s.nisn)); showNotif("Dihapus", "info");
                                }
                              }} className="p-2 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"><Trash2 size={14} /></button>
                            </td>
                          </tr>
                        ))}
                        {masterStudents.length === 0 && <tr><td colSpan="4" className="p-8 text-center text-xs text-gray-500 font-bold">Belum ada siswa terdaftar</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* BOTTOM NAVBAR MOBILE */}
      {user && (
        <nav className="md:hidden fixed bottom-0 w-full bg-gray-900 border-t border-gray-800 rounded-t-3xl shadow-[0_-20px_40px_rgba(0,0,0,0.5)] z-40 px-6 py-4 flex justify-between items-center pb-safe">
          <button onClick={() => setCurrentView('home')} className={`flex flex-col items-center gap-1 transition-all ${currentView === 'home' ? 'text-blue-500 scale-110' : 'text-gray-500'}`}>
            <Home fill={currentView === 'home' ? 'currentColor' : 'none'} size={22} />
          </button>

          {user.level !== 'Admin' && (
            <>
              <button onClick={() => setCurrentView('upload')} className={`flex flex-col items-center gap-1 transition-all ${currentView === 'upload' ? 'text-blue-500 scale-110' : 'text-gray-500'}`}>
                <UploadCloud fill={currentView === 'upload' ? 'currentColor' : 'none'} size={22} />
              </button>
              <button onClick={() => { setActiveChatFriend(null); setChatMessages([]); setCurrentView('chat'); }} className={`flex flex-col items-center gap-1 transition-all ${currentView === 'chat' ? 'text-blue-500 scale-110' : 'text-gray-500'}`}>
                <MessageCircle fill={currentView === 'chat' ? 'currentColor' : 'none'} size={22} />
              </button>
            </>
          )}

          {user.level === 'Admin' && (
            <button onClick={() => setCurrentView('admin')} className={`flex flex-col items-center gap-1 transition-all ${currentView === 'admin' ? 'text-blue-500 scale-110' : 'text-gray-500'}`}>
              <Shield fill={currentView === 'admin' ? 'currentColor' : 'none'} size={22} />
            </button>
          )}

          <button onClick={() => setCurrentView('profile')} className={`flex flex-col items-center gap-1 transition-all`}>
            <div className={`w-6 h-6 rounded-full overflow-hidden border-2 ${currentView === 'profile' ? 'border-blue-500' : 'border-gray-500'}`}>
              <SafeAvatar src={user.avatar} sizeClassName="w-full h-full" iconSize={14} />
            </div>
          </button>
        </nav>
      )}

      {/* MODAL DETAIL BUKU & KOMENTAR (REAL-TIME FIX) */}
      {bookDetailModal && (
        <div className="fixed inset-0 z-[150] bg-black/95 flex flex-col p-4 md:p-10 animate-fadeIn overflow-y-auto">
          <div className="max-w-4xl mx-auto w-full bg-gray-900 rounded-[2.5rem] border border-gray-800 shadow-[0_0_50px_rgba(0,0,0,0.8)] relative my-auto overflow-hidden">
            <button onClick={() => setBookDetailModal(null)} className="absolute top-4 right-4 bg-gray-800 text-gray-400 p-3 rounded-full hover:bg-red-500 hover:text-white transition-colors z-20"><X size={20} /></button>

            <div className="flex flex-col md:flex-row gap-8 p-8 relative z-10">
              <div className="w-full md:w-1/3 flex flex-col gap-4">
                <div className="relative">
                  <SafeAvatar src={bookDetailModal.cover} sizeClassName="w-full rounded-2xl shadow-xl border border-gray-800" iconSize={64} />
                  {/* Wishlist Buttons */}
                  {user.level !== 'Admin' && (
                    <div className="absolute top-3 right-3 flex flex-col gap-2">
                      <button onClick={() => toggleLibrary(bookDetailModal.id, 'fav')} className={`p-2 rounded-full backdrop-blur-md border border-white/10 shadow-lg transition-colors ${user.favorites?.includes(bookDetailModal.id) ? 'bg-yellow-500 text-white' : 'bg-black/50 text-gray-300 hover:bg-black/80'}`}><Star size={16} fill={user.favorites?.includes(bookDetailModal.id) ? 'currentColor' : 'none'} /></button>
                      <button onClick={() => toggleLibrary(bookDetailModal.id, 'wish')} className={`p-2 rounded-full backdrop-blur-md border border-white/10 shadow-lg transition-colors ${user.wishlist?.includes(bookDetailModal.id) ? 'bg-blue-500 text-white' : 'bg-black/50 text-gray-300 hover:bg-black/80'}`}><Bookmark size={16} fill={user.wishlist?.includes(bookDetailModal.id) ? 'currentColor' : 'none'} /></button>
                    </div>
                  )}
                </div>
                <button onClick={() => startReading(bookDetailModal)} className="w-full bg-blue-600 text-white font-black py-4 rounded-xl uppercase tracking-widest hover:bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.4)]">
                  {(bookDetailModal.fileBase64 && (bookDetailModal.fileBase64.startsWith('data:application/pdf') || bookDetailModal.fileBase64.startsWith('data:image'))) ? 'Buka Digital' : 'Unduh & Buka'}
                </button>

                {/* Download Tracker */}
                {bookDetailModal.type === 'ebook' && (
                  <div className="bg-gray-950 border border-gray-800 rounded-xl p-4 mt-2">
                    <button onClick={() => downloadBook(bookDetailModal)} className="w-full bg-green-600 text-white font-black py-3 rounded-lg uppercase tracking-widest text-[10px] hover:bg-green-500 mb-3 flex justify-center items-center gap-2"><Download size={14} /> Unduh File Asli</button>
                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest border-b border-gray-800 pb-2 mb-2">Riwayat Unduhan</p>
                    <div className="max-h-24 overflow-y-auto space-y-2 scrollbar-thin">
                      {(bookDetailModal.downloads || []).map((d, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          <SafeAvatar src={d.avatar} sizeClassName="w-4 h-4" iconSize={10} />
                          <span className="font-bold text-gray-300 line-clamp-1">{d.userName}</span>
                        </div>
                      ))}
                      {(!bookDetailModal.downloads || bookDetailModal.downloads.length === 0) && <p className="text-[10px] text-gray-600">Belum ada yang mengunduh.</p>}
                    </div>
                  </div>
                )}
              </div>

              <div className="w-full md:w-2/3 flex flex-col h-[60vh] md:h-auto">
                <h2 className="text-2xl md:text-3xl font-black text-white uppercase leading-tight mb-2 pr-10">{bookDetailModal.title}</h2>
                <div className="flex items-center gap-4 mb-6">
                  <span onClick={() => { if (bookDetailModal.authorId) openPublicProfile(bookDetailModal.authorId); }} className={`text-sm font-bold uppercase tracking-widest ${bookDetailModal.authorId ? 'text-blue-400 cursor-pointer hover:underline' : 'text-gray-500'}`}>
                    Oleh: {bookDetailModal.author}
                  </span>
                  <div className="h-4 w-px bg-gray-700"></div>
                  <span className="text-xs text-gray-400 font-bold flex items-center gap-1"><Eye size={14} /> {bookDetailModal.views || 0} Pembaca</span>
                </div>

                {/* Komentar (Real Time Rendering) */}
                <div className="bg-gray-950 rounded-2xl p-4 md:p-6 border border-gray-800 flex-grow flex flex-col min-h-0">
                  <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2"><MessageSquare size={14} /> Kolom Diskusi</h3>
                  <div className="flex-grow space-y-3 mb-4 overflow-y-auto pr-2 scrollbar-thin">
                    {(bookDetailModal.comments || []).map(c => (
                      <div key={c.id} className={`p-4 rounded-2xl border relative ${c.role === 'Admin' ? 'bg-blue-900/10 border-blue-500/50' : 'bg-gray-900 border-gray-800'}`}>
                        <div className="flex items-center gap-3 mb-2">
                          <div onClick={() => openPublicProfile(c.userId)} className="cursor-pointer flex-shrink-0">
                            <SafeAvatar src={c.userAvatar} sizeClassName="w-6 h-6" iconSize={12} />
                          </div>
                          <span className={`text-xs font-bold cursor-pointer hover:underline ${c.role === 'Admin' ? 'text-yellow-400' : 'text-blue-400'}`} onClick={() => openPublicProfile(c.userId)}>{(c.userName || 'User').split(' ')[0]}</span>
                          {c.role === 'Admin' && <span className="bg-yellow-500 text-black text-[8px] font-black px-1.5 py-0.5 rounded uppercase">Admin</span>}
                          <span className="text-[9px] text-gray-600 ml-auto">{timeAgo(c.timestamp)}</span>
                        </div>
                        <p className="text-sm text-gray-300 pr-6 whitespace-pre-wrap">{c.text}</p>

                        {(user.id === c.userId || user.level === 'Admin') && (
                          <button onClick={() => deleteComment(c.id)} className="absolute bottom-3 right-3 text-gray-600 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                        )}
                      </div>
                    ))}
                    {(!bookDetailModal.comments || bookDetailModal.comments.length === 0) && <p className="text-xs text-gray-600 text-center italic py-4">Jadilah yang pertama berkomentar!</p>}
                  </div>
                  <form onSubmit={submitComment} className="flex gap-2 mt-auto">
                    <input required value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Tulis komentar..." className="flex-grow bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500" />
                    <button type="submit" className="bg-blue-600 text-white px-5 font-black rounded-xl hover:bg-blue-500"><Send size={16} /></button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PROFIL PUBLIK */}
      {publicProfileModal && (() => {
        const theirAchs = getAchievements(publicProfileModal, (publicProfileModal.works || []).length);
        return (
          <div className="fixed inset-0 z-[250] bg-black/90 flex flex-col items-center justify-center p-4 animate-fadeIn overflow-y-auto py-10">
            <div className="bg-gray-900 rounded-[3rem] w-full max-w-lg shadow-[0_0_50px_rgba(0,0,0,0.8)] relative overflow-hidden border border-gray-800 my-auto">
              <button onClick={() => setPublicProfileModal(null)} className="absolute top-4 right-4 bg-black/60 backdrop-blur-md p-2 rounded-full text-white hover:bg-red-500 z-10 transition-colors border border-white/10"><X size={16} /></button>

              <div className="h-40 bg-gray-800 relative">
                {publicProfileModal.background ? <img src={publicProfileModal.background} onError={handleImgErr} className="w-full h-full object-cover" /> : <div className="absolute inset-0 bg-gradient-to-r from-blue-900/40 to-purple-900/40"></div>}
              </div>
              <div className="px-8 pb-8 pt-0 text-center relative">
                <div className={`w-24 h-24 mx-auto rounded-full bg-gray-900 shadow-xl overflow-hidden relative -mt-12 mb-4 z-10 ${theirAchs.diamondBorder ? 'ring-4 ring-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.6)]' : theirAchs.goldBorder ? 'ring-4 ring-yellow-400' : 'border-4 border-gray-900'}`}>
                  <SafeAvatar src={publicProfileModal.avatar} sizeClassName="w-full h-full" iconSize={48} />
                </div>

                <h2 className={`text-2xl font-black uppercase flex justify-center items-center gap-2 ${theirAchs.glowName ? 'text-white drop-shadow-[0_0_10px_rgba(59,130,246,0.8)]' : 'text-white'}`}>
                  {(publicProfileModal?.name || 'User').split(' ')[0]}
                  {theirAchs.socialTitle && <Award size={18} className="text-blue-400 drop-shadow-[0_0_5px_rgba(96,165,250,0.8)]" title="Sosialita SMANSA" />}
                  {publicProfileModal.isOnline && <div className="w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900" title="Online"></div>}
                </h2>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1 mb-2">{publicProfileModal.level === 'Admin' ? 'Petugas' : `Kelas ${publicProfileModal.grade}-${publicProfileModal.subClass}`}</p>

                {publicProfileModal.bio && <p className="text-sm text-gray-300 italic px-4 mb-4">"{publicProfileModal.bio}"</p>}

                {publicProfileModal.level !== 'Admin' && (
                  <div className="flex justify-center gap-4 mb-6">
                    <div className="bg-gray-950 px-4 py-2 rounded-xl border border-gray-800 flex-1">
                      <p className="text-[10px] text-gray-500 uppercase font-black">Level</p><p className="text-lg font-black text-blue-400">{calculateLevel(publicProfileModal.xp)}</p>
                    </div>
                    <div className="bg-gray-950 px-4 py-2 rounded-xl border border-gray-800 flex-1">
                      <p className="text-[10px] text-gray-500 uppercase font-black">Total XP</p><p className="text-lg font-black text-yellow-500">{publicProfileModal.xp}</p>
                    </div>
                  </div>
                )}

                <div className="bg-gray-950 p-4 rounded-2xl text-left border border-gray-800 space-y-3 mb-6">
                  <div className="flex items-center gap-3 text-sm">
                    <Clock size={16} className="text-blue-500" /><span className="text-gray-400">Status: <span className="text-white font-bold">{publicProfileModal.isOnline ? 'Sedang Online' : timeAgo(publicProfileModal.lastOnline)}</span></span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <BookOpen size={16} className="text-green-500" /><span className="text-gray-400">Terakhir Dibaca: <span className="text-white font-bold line-clamp-1">{publicProfileModal.lastReadTitle}</span></span>
                  </div>
                </div>

                <div className="mb-6 text-left">
                  <h4 className="text-xs font-black uppercase text-gray-500 mb-3 border-b border-gray-800 pb-2 flex items-center gap-2"><Trophy size={14} className="text-yellow-500" /> Badge Pencapaian</h4>
                  <div className="flex flex-wrap gap-2">
                    {theirAchs.gifAvatar && <span className="bg-green-900/40 text-green-400 border border-green-500/50 text-[9px] font-bold px-2 py-1 rounded-lg">Kutu Buku</span>}
                    {theirAchs.diamondBorder && <span className="bg-cyan-900/40 text-cyan-400 border border-cyan-500/50 text-[9px] font-bold px-2 py-1 rounded-lg">Elite Reader</span>}
                    {theirAchs.gifBg && <span className="bg-blue-900/40 text-blue-400 border border-blue-500/50 text-[9px] font-bold px-2 py-1 rounded-lg">Siswa Teladan</span>}
                    {theirAchs.goldBorder && <span className="bg-yellow-900/40 text-yellow-500 border border-yellow-500/50 text-[9px] font-bold px-2 py-1 rounded-lg">Kolektor Ilmu</span>}
                    {theirAchs.socialTitle && <span className="bg-pink-900/40 text-pink-400 border border-pink-500/50 text-[9px] font-bold px-2 py-1 rounded-lg">Sosialita</span>}
                    {theirAchs.glowName && <span className="bg-purple-900/40 text-purple-400 border border-purple-500/50 text-[9px] font-bold px-2 py-1 rounded-lg">Kreator SMANSA</span>}
                  </div>
                </div>

                {(publicProfileModal.mutualFriends || []).length > 0 && (
                  <div className="mb-6 text-left">
                    <h4 className="text-xs font-black uppercase text-gray-500 mb-2 border-b border-gray-800 pb-1">Mutual Friends ({(publicProfileModal.mutualFriends || []).length})</h4>
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                      {(publicProfileModal.mutualFriends || []).map(mf => (
                        <SafeAvatar key={mf.id} src={mf.avatar} sizeClassName="w-8 h-8" iconSize={14} />
                      ))}
                    </div>
                  </div>
                )}

                <div className="text-left space-y-4">
                  {(publicProfileModal.works || []).length > 0 && (
                    <div>
                      <h4 className="text-xs font-black uppercase text-gray-500 mb-2 border-b border-gray-800 pb-1"><UploadCloud size={12} className="inline mr-1" /> Karya Terbit</h4>
                      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
                        {(publicProfileModal.works || []).map(w => (
                          <div key={w.id} className="w-20 flex-shrink-0 cursor-pointer" onClick={() => { setPublicProfileModal(null); setBookDetailModal(w); }}>
                            <SafeAvatar src={w.cover} sizeClassName="w-20 h-28 rounded-xl shadow-md border border-gray-800 hover:border-blue-500" iconSize={24} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {(publicProfileModal.favorites || []).length > 0 && (
                    <div>
                      <h4 className="text-xs font-black uppercase text-gray-500 mb-2 border-b border-gray-800 pb-1"><Star size={12} className="inline mr-1 text-yellow-500" /> Buku Favorit</h4>
                      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
                        {(publicProfileModal.favorites || []).map(w => (
                          <div key={w.id} className="w-20 flex-shrink-0 cursor-pointer" onClick={() => { setPublicProfileModal(null); setBookDetailModal(w); }}>
                            <SafeAvatar src={w.cover} sizeClassName="w-20 h-28 rounded-xl shadow-md border border-gray-800 hover:border-blue-500" iconSize={24} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {(publicProfileModal.wishlist || []).length > 0 && (
                    <div>
                      <h4 className="text-xs font-black uppercase text-gray-500 mb-2 border-b border-gray-800 pb-1"><Bookmark size={12} className="inline mr-1 text-blue-500" /> Wishlist</h4>
                      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
                        {(publicProfileModal.wishlist || []).map(w => (
                          <div key={w.id} className="w-20 flex-shrink-0 cursor-pointer" onClick={() => { setPublicProfileModal(null); setBookDetailModal(w); }}>
                            <SafeAvatar src={w.cover} sizeClassName="w-20 h-28 rounded-xl shadow-md border border-gray-800 hover:border-blue-500" iconSize={24} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* PRATINJAU FILE MODAL */}
      {readingBook && (
        <div className="fixed inset-0 z-[300] bg-black/95 flex flex-col p-2 md:p-6 animate-fadeIn pb-24 md:pb-6">
          <div className="max-w-6xl mx-auto w-full h-full bg-gray-950 rounded-3xl md:rounded-[2rem] border border-gray-800 overflow-hidden shadow-2xl flex flex-col relative">
            <div className="p-4 bg-gray-900 border-b border-gray-800 text-white flex justify-between items-center">
              <h3 className="font-black text-xs md:text-sm uppercase leading-none ml-2 text-gray-200">
                <BookIcon size={16} className="inline mr-2 text-blue-500" />
                {isPreviewMode ? `(PRATINJAU ACC) ${readingBook.title}` : readingBook.title}
              </h3>

              <div className="flex items-center gap-2">
                {isPreviewMode && (
                  <button onClick={async () => {
                    await fetch(`${API_URL}/books/${readingBook.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...readingBook, status: 'approved' }) });
                    setBooks(books.map(bk => bk.id === readingBook.id ? { ...bk, status: 'approved' } : bk)); showNotif("Karya disetujui!");
                    stopReading();
                  }} className="bg-green-600 text-white p-2 md:p-3 rounded-xl hover:bg-green-500 transition-all font-black text-[10px] uppercase flex items-center gap-1">
                    <Check size={14} /> ACC Karya
                  </button>
                )}
                <button onClick={stopReading} className="bg-red-500/20 text-red-400 p-2 md:p-3 rounded-xl hover:bg-red-500 hover:text-white transition-all z-20 relative"><X size={16} /></button>
              </div>
            </div>

            <div className="flex-grow bg-gray-950 relative flex items-center justify-center">
              {readingBook.fileBase64 ? (
                (readingBook.fileBase64.startsWith('data:application/pdf') || readingBook.fileBase64.startsWith('data:image')) ? (
                  <>
                    <div className="absolute top-4 right-6 z-10 animate-fadeIn">
                      <button onClick={() => downloadBook(readingBook)} className="bg-gray-900/80 backdrop-blur-md border border-gray-700 text-white px-4 py-2 rounded-xl text-[10px] font-bold uppercase flex items-center gap-2 hover:bg-blue-600 transition-colors shadow-xl"><Download size={14} /> Unduh PDF (Jika Blank)</button>
                    </div>
                    <iframe src={readingBook.fileBase64} className="w-full h-full border-none absolute inset-0 bg-white" />
                  </>
                ) : (
                  <div className="text-center space-y-4">
                    <FileIcon size={80} className="mx-auto text-blue-500 mb-2" />
                    <h2 className="text-xl font-black text-white uppercase tracking-widest">Dokumen / Presentasi</h2>
                    <p className="text-sm text-gray-400">Browser tidak dapat mempratinjau file Word/PPTX secara langsung.</p>
                    <button onClick={() => downloadBook(readingBook)} className="px-6 py-3 bg-blue-600 text-white font-black rounded-xl uppercase tracking-widest hover:bg-blue-500 flex items-center justify-center gap-2 mx-auto"><Download size={18} /> Unduh File Ke Perangkat</button>
                  </div>
                )
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center opacity-30">
                  <FileText size={80} className="mx-auto mb-4" />
                  <p className="font-black uppercase tracking-widest text-sm text-white">File Kosong</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Notifikasi */}
      {notification && (
        <div className={`fixed top-5 md:top-auto md:bottom-24 left-1/2 -translate-x-1/2 z-[400] px-6 py-3 md:px-8 md:py-4 rounded-full md:rounded-2xl shadow-[0_0_20px_rgba(0,0,0,0.5)] animate-slideUp flex items-center gap-3 ${notification.type === 'error' ? 'bg-red-600 text-white' : 'bg-blue-600 text-white border border-blue-500'}`}>
          {notification.type === 'error' ? <XCircle size={16} /> : <CheckCircle size={16} />}
          <span className="font-black text-[10px] md:text-xs uppercase tracking-widest">{notification.msg}</span>
        </div>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideUp { from { transform: translate(-50%, -20px); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }
        @media (min-width: 768px) { @keyframes slideUp { from { transform: translate(-50%, 20px); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } } }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        .animate-slideDown { animation: slideDown 0.2s ease-out; }
        .animate-slideUp { animation: slideUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
        .pb-safe { padding-bottom: env(safe-area-inset-bottom, 1rem); }
        .scrollbar-thin::-webkit-scrollbar { width: 4px; height: 4px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: #374151; border-radius: 10px; }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover { background: #4B5563; }
      `}} />
    </div>
  );
}