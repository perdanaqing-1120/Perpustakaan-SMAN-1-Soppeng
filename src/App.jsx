import React, { useState, useEffect, useRef } from 'react';
import {
  BookOpen, Users, Shield, Library, X, FileText, Book as BookIcon,
  Activity, LogOut, CheckCircle, XCircle, KeyRound, GraduationCap,
  PlusCircle, Trash2, Check, Star, User, Camera, Trophy, Home, Search,
  UploadCloud, UserPlus, Eye, MessageSquare, Clock, Award, Download, Bookmark, MessageCircle, Send, Lock, Unlock, Crown, Edit, FileIcon
} from 'lucide-react';

let hostIp = window.location.hostname;
if (hostIp.includes('google') || hostIp.includes('usercontent')) hostIp = 'localhost';
const API_URL = `http://${hostIp}:5000/api`;

// BUG FIX #1: fallbackAvatar & fallbackBook sebagai konstanta yang valid
const fallbackAvatar = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'/%3E%3Ccircle cx='12' cy='7' r='4'/%3E%3C/svg%3E";
const fallbackBook = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20'/%3E%3C/svg%3E";

const getAvatarSrc = (src) => (src && typeof src === 'string' && src.length > 20) ? src : fallbackAvatar;
const getBookSrc = (src) => (src && typeof src === 'string' && src.length > 20) ? src : fallbackBook;

// BUG FIX #2: Satu handler error universal — tidak ada handleImgErr yang undefined
const handleAvatarErr = (e) => { e.target.onerror = null; e.target.src = fallbackAvatar; };
const handleBookErr = (e) => { e.target.onerror = null; e.target.src = fallbackBook; };

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

// Komponen avatar yang aman
const SafeAvatar = ({ src, sizeClassName = "w-10 h-10", className = "" }) => (
  <div className={`${sizeClassName} bg-gray-800 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 border border-gray-700 relative ${className}`}>
    <img src={getAvatarSrc(src)} onError={handleAvatarErr} className="w-full h-full object-cover" alt="Avatar" />
  </div>
);

// BUG FIX #3: Komponen cover buku terpisah — pakai handleBookErr bukan handleAvatarErr
const SafeBookCover = ({ src, className = "" }) => (
  <img
    src={getBookSrc(src)}
    onError={handleBookErr}
    className={`w-full h-full object-cover ${className}`}
    alt="Cover Buku"
  />
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

  const [activeChatFriend, setActiveChatFriend] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const chatEndRef = useRef(null);

  const [loginForm, setLoginForm] = useState({ username: '', password: '', nisn: '' });
  const [studentInput, setStudentInput] = useState({ nisn: '', grade: 'X', sub: '1', name: '' });
  const [editingStudent, setEditingStudent] = useState(null);
  const [editingBook, setEditingBook] = useState(null);

  const [profileForm, setProfileForm] = useState({ name: '', avatarBase64: '', backgroundBase64: '', bio: '' });
  const [bookForm, setBookForm] = useState({ title: '', author: '', grade: 'X', type: 'ebook', coverBase64: '', fileBase64: '', mimeType: '' });
  const [friendNisn, setFriendNisn] = useState('');
  const [commentText, setCommentText] = useState('');

  // GIF, Edit & Read Receipt State
  const [gifSearch, setGifSearch] = useState('');
  const [gifResults, setGifResults] = useState([]);
  const [showGifPicker, setShowGifPicker] = useState(null); // 'chat' | 'comment' | null
  const [editingChatMsg, setEditingChatMsg] = useState(null); // { timestamp, text }
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState('');

  // BUG FIX #4: loadAdminStudents didefinisikan sebagai fungsi mandiri agar bisa dipanggil kapan saja
  const loadAdminStudents = () => {
    fetch(`${API_URL}/students`)
      .then(r => r.json())
      .then(d => setMasterStudents(Array.isArray(d) ? d : []))
      .catch(() => { });
  };

  // --- SINKRONISASI UMUM ---
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
              if (user && user.level !== 'Admin' && user.level !== 'Pengunjung') setUser(prev => ({ ...prev, xp: (prev.xp || 0) + 1 }));
            }
          }).catch(() => { });
        fetch(`${API_URL}/books`).then(r => r.json()).then(d => {
          if (isMounted) {
            setBooks(d);
            // BUG FIX #5: Update bookDetailModal dengan data terbaru secara aman
            if (bookDetailModal) {
              const updatedBook = d.find(b => b.id === bookDetailModal.id);
              if (updatedBook) setBookDetailModal(prev => prev ? updatedBook : null);
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
          .then(d => {
            if (isMounted && d && Array.isArray(d.friends)) setFriendsData(d);
          }).catch(() => { });
      }
    };
    fetchUserData();
    const interval = setInterval(() => { if (serverStatus === 'online') fetchUserData(); }, 10000);
    return () => { isMounted = false; clearInterval(interval); };
  }, [user?.id, serverStatus]);

  // --- SINKRONISASI CHAT ---
  useEffect(() => {
    let chatInterval;
    let isMounted = true;
    setChatMessages([]);
    setChatInput('');
    setEditingChatMsg(null);
    setShowGifPicker(null);
    if (activeChatFriend && user) {
      const fetchChat = () => {
        fetch(`${API_URL}/chats/${user.id}/${activeChatFriend.id}`)
          .then(r => r.json()).then(d => {
            if (isMounted && d && Array.isArray(d.messages)) {
              setChatMessages(prev => {
                // detect if any new messages to update
                if (JSON.stringify(prev) !== JSON.stringify(d.messages)) return d.messages;
                return prev;
              });
            }
          }).catch(() => { });
      };
      fetchChat();
      // Mark messages as read when opening chat
      fetch(`${API_URL}/chats/${user.id}/${activeChatFriend.id}/read`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id })
      }).catch(() => { });
      chatInterval = setInterval(fetchChat, 2000);
    }
    return () => { isMounted = false; clearInterval(chatInterval); };
  }, [activeChatFriend?.id, user?.id]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages]);

  // BUG FIX #6: useEffect leaderboard & admin siswa — gunakan loadAdminStudents yang sudah ada
  useEffect(() => {
    if (currentView === 'leaderboard') {
      fetch(`${API_URL}/leaderboard`).then(r => r.json()).then(d => setLeaderboardData(d)).catch(() => { });
    }
  }, [currentView]);

  useEffect(() => {
    if (user?.level === 'Admin' && adminTab === 'siswa') loadAdminStudents();
    if (user?.level === 'Admin' && adminTab === 'dashboard') loadAdminStudents();
  }, [adminTab, user?.level]);

  // GIF search debounce — auto-search 400ms after typing
  useEffect(() => {
    if (!gifSearch.trim()) { setGifResults([]); return; }
    const timer = setTimeout(() => searchGifs(gifSearch), 400);
    return () => clearTimeout(timer);
  }, [gifSearch]);

  const showNotif = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const calculateLevel = (xp) => {
    if (xp === 'MAX') return 'MAX';
    return Math.floor((Number(xp) || 0) / 100) + 1;
  };
  const getXpProgress = (xp) => {
    if (xp === 'MAX') return 100;
    return ((Number(xp) || 0) % 100);
  };

  // BUG FIX #7: Semua array di-guard dengan || [] agar tidak crash
  const getAchievements = (u, worksCount = 0) => {
    if (!u) return { gifAvatar: false, diamondBorder: false, gifBg: false, goldBorder: false, socialTitle: false, glowName: false };
    const isAdmin = u?.level === 'Admin';
    return {
      gifAvatar: isAdmin || (u?.readingTime || 0) >= 600,
      diamondBorder: isAdmin || (u?.readingTime || 0) >= 1800,
      gifBg: isAdmin || calculateLevel(u?.xp || 0) >= 5,
      goldBorder: isAdmin || ((u?.favorites || []).length) >= 3,
      socialTitle: isAdmin || ((u?.friendsCount || (u?.friends || []).length) >= 3),
      glowName: isAdmin || worksCount >= 1
    };
  };

  const myAchs = getAchievements(
    user,
    (books || []).filter(b => b.authorId === user?.id && b.status === 'approved').length
  );

  // --- ACTIONS ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsAuthenticating(true);
    const payload = userType === 'admin'
      ? { is_admin: true, username: loginForm.username, password: loginForm.password }
      : { is_admin: false, nisn: loginForm.nisn.trim(), password: loginForm.password };
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
          setUser(data);
          showNotif(`Login Sukses, ${data.name}`);
          setProfileForm({ name: data.name, avatarBase64: data.avatar || '', backgroundBase64: data.background || '', bio: data.bio || '' });
          setCurrentView(data.level === 'Admin' ? 'admin' : 'home');
        } else { showNotif(data.message || "Gagal Login", "error"); }
      }, 800);
    } catch (e) { setIsAuthenticating(false); showNotif("Server Terputus", "error"); }
  };

  const handleGuestLogin = () => {
    setIsAuthenticating(true);
    setTimeout(() => {
      const guestUser = {
        id: 'guest-' + Date.now(),
        name: 'Pengunjung',
        username: 'pengunjung',
        level: 'Pengunjung',
        xp: 0,
        readingTime: 0,
        avatar: '',
        background: '',
        bio: 'Melihat-lihat koleksi pustaka.',
        friends: [],
        favorites: [],
        wishlist: []
      };
      setUser(guestUser);
      setIsAuthenticating(false);
      showNotif("Masuk sebagai Pengunjung");
      setCurrentView('home');
    }, 800);
  };

  const handleLogout = () => {
    setIsAuthenticating(true);
    setTimeout(() => {
      setUser(null); setChatMessages([]); setActiveChatFriend(null);
      setCurrentView('home'); setIsAuthenticating(false);
    }, 800);
  };

  // BUG FIX #8: openPublicProfile dibungkus try-catch menyeluruh & set null dulu sebelum set data baru
  const openPublicProfile = async (id) => {
    if (!id) return;
    if (id === user?.id) { setCurrentView('profile'); setBookDetailModal(null); return; }
    setPublicProfileModal(null); // reset dulu agar tidak tampilkan data lama
    try {
      const res = await fetch(`${API_URL}/users/public/${id}?viewerId=${user?.id || ''}`);
      if (res.ok) {
        const data = await res.json();
        // BUG FIX #9: Pastikan semua array tidak undefined
        setPublicProfileModal({
          ...data,
          works: Array.isArray(data.works) ? data.works : [],
          favorites: Array.isArray(data.favorites) ? data.favorites : [],
          wishlist: Array.isArray(data.wishlist) ? data.wishlist : [],
          mutualFriends: Array.isArray(data.mutualFriends) ? data.mutualFriends : [],
        });
      } else {
        showNotif("Gagal memuat profil", "error");
      }
    } catch (e) { showNotif("Gagal memuat profil", "error"); }
  };

  const toggleLibrary = async (bookId, type) => {
    if (!user || user.level === 'Admin') return;
    const isFav = (user.favorites || []).includes(bookId);
    const isWish = (user.wishlist || []).includes(bookId);
    const action = type === 'fav' ? (isFav ? 'remove_fav' : 'add_fav')
      : (isWish ? 'remove_wish' : 'add_wish');
    try {
      const res = await fetch(`${API_URL}/users/${user.id}/library`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bookId, action }) });
      const data = await res.json();
      setUser({ ...user, favorites: data.favorites || [], wishlist: data.wishlist || [] });
      showNotif(action.includes('add') ? 'Koleksi Diperbarui!' : 'Dihapus dari Koleksi');
    } catch (e) { }
  };

  const downloadBook = async (book) => {
    if (!book || !book.fileBase64) return;
    try {
      await fetch(`${API_URL}/books/${book.id}/download`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id, userName: user.name, userAvatar: user.avatar || '' }) });
      const a = document.createElement("a");
      a.href = book.fileBase64;
      let ext = "pdf";
      if (book.mimeType && book.mimeType.includes('presentation')) ext = "pptx";
      else if (book.mimeType && book.mimeType.includes('document')) ext = "docx";
      a.download = `${book.title}.${ext}`;
      a.click();
      showNotif("Mengunduh File...");
    } catch (e) { }
  };

  const submitComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !bookDetailModal) return;
    try {
      const res = await fetch(`${API_URL}/books/${bookDetailModal.id}/comment`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, userName: user.name, userAvatar: user.avatar || '', text: commentText, role: user.level })
      });
      if (!res.ok) throw new Error();
      const newComment = await res.json();
      setBookDetailModal(prev => prev ? ({ ...prev, comments: [...(prev.comments || []), newComment] }) : null);
      setBooks(prev => prev.map(b => b.id === bookDetailModal.id ? { ...b, comments: [...(b.comments || []), newComment] } : b));
      setCommentText('');
    } catch (e) { showNotif("Gagal mengirim komentar", "error"); }
  };

  const deleteComment = async (commentId) => {
    if (!window.confirm("Hapus komentar ini?") || !bookDetailModal) return;
    try {
      const res = await fetch(`${API_URL}/books/${bookDetailModal.id}/comment/${commentId}`, { method: 'DELETE' });
      if (res.ok) {
        setBookDetailModal(prev => prev ? ({ ...prev, comments: (prev.comments || []).filter(c => c.id !== commentId) }) : null);
        setBooks(prev => prev.map(b => b.id === bookDetailModal.id ? { ...b, comments: (b.comments || []).filter(c => c.id !== commentId) } : b));
      }
    } catch (e) { }
  };

  const sendChat = async (e) => {
    e.preventDefault();
    if (editingChatMsg) {
      await editChatMessage(editingChatMsg.timestamp, chatInput);
      return;
    }
    if (!chatInput.trim() || !activeChatFriend) return;
    const text = chatInput; setChatInput('');
    try {
      const res = await fetch(`${API_URL}/chats/${user.id}/${activeChatFriend.id}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ senderId: user.id, text })
      });
      const d = await res.json();
      if (d && Array.isArray(d.messages)) setChatMessages(d.messages);
    } catch (e) { showNotif("Gagal kirim pesan", "error"); }
  };

  const deleteChatMessage = async (timestamp) => {
    if (!window.confirm("Hapus pesan ini?") || !activeChatFriend) return;
    try {
      await fetch(`${API_URL}/chats/${user.id}/${activeChatFriend.id}/${timestamp}`, { method: 'DELETE' });
      setChatMessages(prev => prev.filter(m => String(m.timestamp) !== String(timestamp)));
    } catch (e) { }
  };

  const editChatMessage = async (timestamp, newText) => {
    if (!activeChatFriend || !newText.trim()) { setEditingChatMsg(null); setChatInput(''); return; }
    try {
      const res = await fetch(`${API_URL}/chats/${user.id}/${activeChatFriend.id}/${timestamp}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: newText })
      });
      const d = await res.json();
      if (d && Array.isArray(d.messages)) setChatMessages(d.messages);
    } catch (e) { showNotif('Gagal mengedit pesan', 'error'); }
    setEditingChatMsg(null); setChatInput('');
  };

  const markChatRead = async () => {
    if (!activeChatFriend || !user) return;
    try {
      await fetch(`${API_URL}/chats/${user.id}/${activeChatFriend.id}/read`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id })
      });
    } catch (e) { }
  };

  const searchGifs = async (query) => {
    if (!query.trim()) { setGifResults([]); return; }
    try {
      const res = await fetch(`https://g.tenor.com/v1/search?q=${encodeURIComponent(query)}&limit=12&media_filter=minimal&key=LIVDSRZULELA`);
      const data = await res.json();
      setGifResults((data.results || []).map(r => r.media?.[0]?.gif?.url || '').filter(Boolean));
    } catch (e) { }
  };

  const sendChatGif = async (gifUrl) => {
    if (!activeChatFriend) return;
    setShowGifPicker(null); setGifSearch(''); setGifResults([]);
    try {
      const res = await fetch(`${API_URL}/chats/${user.id}/${activeChatFriend.id}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ senderId: user.id, text: gifUrl, isGif: true })
      });
      const d = await res.json();
      if (d && Array.isArray(d.messages)) setChatMessages(d.messages);
    } catch (e) { showNotif('Gagal kirim GIF', 'error'); }
  };

  const sendCommentGif = async (gifUrl) => {
    if (!bookDetailModal) return;
    setShowGifPicker(null); setGifSearch(''); setGifResults([]);
    try {
      const res = await fetch(`${API_URL}/books/${bookDetailModal.id}/comment`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, userName: user.name, userAvatar: user.avatar || '', text: gifUrl, role: user.level, isGif: true })
      });
      if (!res.ok) throw new Error();
      const newComment = await res.json();
      setBookDetailModal(prev => prev ? ({ ...prev, comments: [...(prev.comments || []), newComment] }) : null);
      setBooks(prev => prev.map(b => b.id === bookDetailModal.id ? { ...b, comments: [...(b.comments || []), newComment] } : b));
    } catch (e) { showNotif('Gagal kirim GIF', 'error'); }
  };

  const editComment = async (commentId, newText) => {
    if (!bookDetailModal || !newText.trim()) { setEditingCommentId(null); setEditingCommentText(''); return; }
    try {
      const res = await fetch(`${API_URL}/books/${bookDetailModal.id}/comment/${commentId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: newText })
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setBookDetailModal(prev => prev ? ({ ...prev, comments: (prev.comments || []).map(c => c.id === commentId ? updated : c) }) : null);
      setBooks(prev => prev.map(b => b.id === bookDetailModal.id ? { ...b, comments: (b.comments || []).map(c => c.id === commentId ? updated : c) } : b));
    } catch (e) { showNotif('Gagal mengedit komentar', 'error'); }
    setEditingCommentId(null); setEditingCommentText('');
  };

  const startReading = async (book) => {
    if (!book) return;
    if (user.level !== 'Admin') {
      fetch(`${API_URL}/books/${book.id}/view`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id }) }).catch(() => { });
    }
    setBookDetailModal(null);
    setReadingBook(book);
    setIsPreviewMode(false);
    setReadStartTime(Date.now());
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
  };

  const convertToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });

  // BUG FIX #10: handleMediaUpload tidak lagi memanggil handleImgErr yang tidak ada
  const handleMediaUpload = async (e, type, isDocument = false) => {
    const file = e.target.files?.[0];
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

  const getSortedStudents = () => {
    return [...(masterStudents || [])].sort((a, b) => {
      const gOrder = { 'X': 1, 'XI': 2, 'XII': 3 };
      if ((gOrder[a.grade] || 0) !== (gOrder[b.grade] || 0)) return (gOrder[a.grade] || 0) - (gOrder[b.grade] || 0);
      return parseInt(a.subClass || 0) - parseInt(b.subClass || 0);
    });
  };

  // --- TAMPILAN OFFLINE ---
  if (serverStatus === 'offline') {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6 text-center font-sans text-gray-200">
        <div className="bg-gray-900 p-10 rounded-[3rem] shadow-xl max-w-md border-t-8 border-red-500 w-full relative">
          <Activity size={60} className="mx-auto text-red-500 mb-6 animate-pulse" />
          <h1 className="text-2xl font-black uppercase italic tracking-widest text-white">Server Offline</h1>
          <button onClick={() => setServerStatus('checking')} className="w-full mt-8 bg-blue-600 text-white font-black py-4 rounded-2xl uppercase tracking-widest hover:bg-blue-500 transition-all">Muat Ulang</button>
        </div>
      </div>
    );
  }

  // --- LOADING ---
  if (isAuthenticating) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4 font-sans z-[1000] fixed inset-0">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4 shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
        <h2 className="text-white font-black uppercase tracking-widest text-sm animate-pulse">Menyelaraskan Data...</h2>
      </div>
    );
  }

  // --- LOGIN ---
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4 font-sans text-gray-200">
        <div className="bg-gray-900 w-full max-w-md rounded-[3rem] shadow-xl overflow-hidden animate-fadeIn border border-gray-800">
          <div className="bg-gray-900 p-8 text-center border-b border-gray-800">
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
                    <p className="text-[10px] text-gray-400 text-center leading-relaxed">Masukkan NISN kamu untuk login. Jika baru pertama kali login, password akan disimpan secara permanen.</p>
                  </div>
                  <input required placeholder="Masukkan NISN" className="w-full p-4 mb-4 bg-gray-950 text-white border-2 border-gray-700 rounded-2xl outline-none focus:border-blue-500 font-mono text-center text-lg tracking-widest placeholder-gray-700" value={loginForm.nisn} onChange={e => setLoginForm({ ...loginForm, nisn: e.target.value })} />
                  <input required type="password" placeholder="Password" className="w-full p-4 bg-gray-950 text-white border-2 border-gray-700 rounded-2xl outline-none focus:border-blue-500 font-mono text-center text-lg tracking-widest placeholder-gray-700" value={loginForm.password} onChange={e => setLoginForm({ ...loginForm, password: e.target.value })} />
                </div>
              )}
              <button className="w-full bg-blue-600 text-white p-4 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-500 transition-all mt-4 shadow-[0_0_20px_rgba(59,130,246,0.3)]">Masuk Sistem</button>
            </form>
            <div className="mt-8 text-center border-t border-gray-800 pt-6">
              <button onClick={handleGuestLogin} className="text-[10px] font-black uppercase text-blue-500 hover:text-blue-400 transition-colors tracking-[0.2em] italic">
                masuk tanpa akun atau sebagai pengunjung
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- DASHBOARD ---
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col font-sans pb-20 md:pb-0 text-gray-200">

      {/* MOBILE TOP HEADER */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur-md border-b border-gray-800 px-4 py-3 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-2" onClick={() => { setCurrentView('home'); setMobileMenuOpen(false); }}>
          <div className="bg-blue-600 p-1.5 rounded-lg text-white shadow-[0_0_10px_rgba(59,130,246,0.5)]"><Library size={18} /></div>
          <span className="font-black text-base tracking-tighter uppercase italic text-white">SMANSA</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Indikator online */}
          <div className="flex items-center gap-1.5 bg-gray-800 px-2.5 py-1 rounded-full border border-gray-700">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-[9px] font-black text-gray-400 uppercase">{onlineUsers} Online</span>
          </div>

          {/* Tombol menu hamburger */}
          <button onClick={() => setMobileMenuOpen(p => !p)} className={`w-9 h-9 rounded-xl flex flex-col items-center justify-center gap-1.5 border transition-all ${mobileMenuOpen ? 'bg-blue-600 border-blue-500' : 'bg-gray-800 border-gray-700'}`}>
            <span className={`block w-4 h-0.5 bg-white rounded-full transition-all ${mobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
            <span className={`block w-4 h-0.5 bg-white rounded-full transition-all ${mobileMenuOpen ? 'opacity-0' : ''}`}></span>
            <span className={`block w-4 h-0.5 bg-white rounded-full transition-all ${mobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
          </button>
        </div>
      </header>

      {/* MOBILE SLIDE-DOWN MENU */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed top-[57px] left-0 right-0 z-40 bg-gray-900/98 backdrop-blur-xl border-b border-gray-800 shadow-2xl animate-slideDown">
          <div className="p-4 space-y-1">
            {/* Info profil di menu */}
            <div className="flex items-center gap-3 bg-gray-800 p-3 rounded-2xl mb-3 border border-gray-700" onClick={() => { if (user.level !== 'Pengunjung') { setCurrentView('profile'); setMobileMenuOpen(false); } }}>
              <div className={`rounded-full ${myAchs.diamondBorder ? 'ring-2 ring-cyan-400' : myAchs.goldBorder ? 'ring-2 ring-yellow-400' : 'border-2 border-blue-500'}`}>
                <SafeAvatar src={user.avatar} sizeClassName="w-10 h-10" />
              </div>
              <div className="flex-grow">
                <p className="font-black text-white text-sm uppercase">{(user.name || '').split(' ')[0]}</p>
                <p className="text-[9px] font-bold text-blue-400 uppercase tracking-widest">
                  {user.level === 'Pengunjung' ? 'Mode Pengunjung' : (user.level !== 'Admin' ? `Level ${calculateLevel(user.xp)} • ${user.xp} XP` : 'Admin MAX')}
                </p>
              </div>
              {user.level !== 'Pengunjung' && <span className="text-[9px] bg-blue-600 text-white px-2 py-1 rounded-lg font-black uppercase">Profil</span>}
            </div>

            {[
              { view: 'home', icon: <Home size={17} />, label: 'Beranda' },
              ...(user.level !== 'Pengunjung' ? [
                { view: 'leaderboard', icon: <Trophy size={17} />, label: 'Peringkat' },
                ...(user.level !== 'Admin' ? [
                  { view: 'upload', icon: <UploadCloud size={17} />, label: 'Upload Karya' },
                  { view: 'friends', icon: <Users size={17} />, label: 'Sosial' },
                  { view: 'chat', icon: <MessageCircle size={17} />, label: 'Chat', action: () => { setActiveChatFriend(null); setChatMessages([]); } },
                ] : [
                  { view: 'admin', icon: <Shield size={17} />, label: 'Panel Admin' },
                ])
              ] : [])
            ].map(item => (
              <button key={item.view} onClick={() => {
                if (item.action) item.action();
                setCurrentView(item.view);
                setMobileMenuOpen(false);
              }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-black text-sm uppercase tracking-wide transition-all ${currentView === item.view ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
                {item.icon} {item.label}
                {currentView === item.view && <div className="ml-auto w-2 h-2 bg-white rounded-full"></div>}
              </button>
            ))}

            <div className="pt-2 border-t border-gray-800 mt-2">
              <button onClick={() => { setMobileMenuOpen(false); handleLogout(); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-black text-sm uppercase text-red-400 hover:bg-red-500/10 transition-all">
                <LogOut size={17} /> Keluar
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Overlay untuk menutup menu */}
      {mobileMenuOpen && <div className="md:hidden fixed inset-0 z-30 bg-black/40 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}></div>}

      {/* NAVBAR DESKTOP */}
      <nav className="bg-gray-900 border-b border-gray-800 p-4 shadow-xl sticky top-0 z-40 hidden md:block">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentView('home')}>
            <div className="bg-blue-600 p-2 rounded-xl text-white shadow-[0_0_15px_rgba(59,130,246,0.6)]"><Library size={24} /></div>
            <span className="font-black text-xl tracking-tighter uppercase italic text-white">SMANSA</span>
          </div>
          <div className="flex items-center gap-6">
            <button onClick={() => setCurrentView('home')} className={`font-black text-xs uppercase tracking-widest ${currentView === 'home' ? 'text-blue-400' : 'hover:text-blue-400 text-gray-400'}`}>Beranda</button>
            {user.level !== 'Pengunjung' && <button onClick={() => setCurrentView('leaderboard')} className={`font-black text-xs uppercase tracking-widest ${currentView === 'leaderboard' ? 'text-blue-400' : 'hover:text-blue-400 text-gray-400'}`}>Peringkat</button>}
            {user.level !== 'Admin' && user.level !== 'Pengunjung' && (
              <>
                <button onClick={() => setCurrentView('upload')} className={`font-black text-xs uppercase tracking-widest ${currentView === 'upload' ? 'text-blue-400' : 'hover:text-blue-400 text-gray-400'}`}>Upload</button>
                <button onClick={() => setCurrentView('friends')} className={`font-black text-xs uppercase tracking-widest ${currentView === 'friends' ? 'text-blue-400' : 'hover:text-blue-400 text-gray-400'}`}>Sosial</button>
                <button onClick={() => { setActiveChatFriend(null); setChatMessages([]); setCurrentView('chat'); }} className={`font-black text-xs uppercase tracking-widest ${currentView === 'chat' ? 'text-blue-400' : 'hover:text-blue-400 text-gray-400'}`}>Chat</button>
              </>
            )}
            {user.level === 'Admin' && <button onClick={() => setCurrentView('admin')} className={`font-black text-xs uppercase tracking-widest flex items-center gap-1 ${currentView === 'admin' ? 'text-blue-400' : 'text-gray-400'}`}><Shield size={14} /> Admin</button>}
            <div className="h-8 w-px bg-gray-700 mx-2"></div>
            <div onClick={() => { if (user.level !== 'Pengunjung') setCurrentView('profile'); }} className={`flex items-center gap-3 p-2 rounded-xl transition-colors relative ${user.level === 'Pengunjung' ? 'cursor-default' : 'cursor-pointer hover:bg-gray-800'}`}>
              <div className="text-right">
                <p className={`text-xs font-black uppercase flex items-center gap-1 ${myAchs.glowName ? 'text-white drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]' : 'text-white'}`}>
                  {(user.name || '').split(' ')[0]}
                  {myAchs.socialTitle && <Award size={12} className="text-blue-400" title="Sosialita" />}
                </p>
                <p className="text-[9px] font-bold text-blue-400 uppercase tracking-widest">
                  {user.level === 'Pengunjung' ? 'Guest Mode' : (user.level !== 'Admin' ? `Level ${calculateLevel(user.xp)}` : 'Admin MAX')}
                </p>
              </div>
              <div className={`rounded-full relative ${myAchs.diamondBorder ? 'ring-2 ring-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.8)]' : myAchs.goldBorder ? 'ring-2 ring-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.6)]' : 'border-2 border-blue-500'}`}>
                <SafeAvatar src={user.avatar} sizeClassName="w-10 h-10" />
              </div>
              {user.level !== 'Pengunjung' && <div className="absolute bottom-2 right-2 w-3 h-3 bg-green-500 border-2 border-gray-900 rounded-full"></div>}
            </div>
            <button onClick={handleLogout} className="p-2 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/30"><LogOut size={20} /></button>
          </div>
        </div>
      </nav>

      {/* KONTEN UTAMA */}
      <main className="flex-grow p-4 md:p-8 max-w-7xl mx-auto w-full pt-[72px] md:pt-8 pb-24 md:pb-8">

        {/* HOME */}
        {currentView === 'home' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="bg-gray-900 border border-gray-800 p-6 md:p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
              <div className="absolute -right-10 -top-10 opacity-10 blur-sm"><Library size={250} /></div>
              <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="text-center md:text-left">
                  <h1 className={`text-3xl md:text-4xl font-black italic uppercase tracking-tighter leading-none mb-2 ${myAchs.glowName ? 'text-white drop-shadow-[0_0_10px_rgba(59,130,246,0.8)]' : 'text-white'}`}>Halo, {user.level === 'Pengunjung' ? 'Tamu' : (user.name || '').split(' ')[0]}!</h1>
                  <p className="text-blue-400 font-bold uppercase tracking-widest text-xs">
                    {user.level === 'Admin' ? 'Akses Pengelola' : (user.level === 'Pengunjung' ? 'Senang melihat Anda di sini!' : 'Makin sering online, makin naik level!')}
                  </p>
                </div>
                {user.level !== 'Admin' && user.level !== 'Pengunjung' && (
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
                {(books || []).filter(b => b.status === 'approved').map(book => (
                  <div key={book.id} className="bg-gray-900 rounded-[2rem] shadow-lg hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all overflow-hidden flex flex-col border border-gray-800 hover:border-blue-500 group cursor-pointer" onClick={() => setBookDetailModal(book)}>
                    {/* BUG FIX #11: Gunakan SafeBookCover bukan SafeAvatar untuk cover buku */}
                    <div className="h-40 md:h-56 bg-gray-800 relative overflow-hidden flex items-center justify-center">
                      <SafeBookCover src={book.cover} className="opacity-80 group-hover:opacity-100 transition-opacity" />
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
                ))}
              </div>
            </div>
          </div>
        )}

        {/* LEADERBOARD */}
        {currentView === 'leaderboard' && (
          <div className="animate-fadeIn space-y-6 max-w-6xl mx-auto">
            <div className="bg-gray-900 p-8 rounded-[3rem] shadow-xl border border-gray-800 text-center mb-8 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-900/20 to-purple-900/20"></div>
              <Crown size={56} className="mx-auto text-yellow-500 mb-4 drop-shadow-[0_0_15px_rgba(234,179,8,0.6)]" />
              <h2 className="text-3xl font-black text-white uppercase italic relative z-10">Papan Kehormatan</h2>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-2 relative z-10">Siswa Paling Berdedikasi di SMANSA</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Top XP */}
              <div className="bg-gray-900 rounded-[2rem] border border-gray-800 p-6 flex flex-col h-[600px]">
                <h3 className="font-black text-sm text-white uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-gray-800 pb-4"><Star className="text-blue-400" /> Top Level (XP)</h3>
                <div className="space-y-3 overflow-y-auto flex-grow pr-2 scrollbar-thin">
                  {(leaderboardData?.topXP || []).map((u, i) => (
                    <div key={u.id} onClick={() => openPublicProfile(u.id)} className="flex items-center gap-3 bg-gray-950 p-3 rounded-2xl border border-gray-800 cursor-pointer hover:border-blue-500 transition-colors">
                      <div className={`font-black text-lg w-6 text-center ${i === 0 ? 'text-yellow-500' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-orange-600' : 'text-gray-700'}`}>{i + 1}</div>
                      <div className="relative">
                        <SafeAvatar src={u.avatar} sizeClassName="w-10 h-10" />
                        {u.online && <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border border-gray-950 rounded-full"></div>}
                      </div>
                      <div className="flex-grow min-w-0">
                        <h4 className="font-black text-white text-xs uppercase line-clamp-1">{u.name}</h4>
                        <p className="text-[9px] text-gray-500 font-bold uppercase">Level {calculateLevel(u.xp)} • {u.xp} XP</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Top Achievements */}
              <div className="bg-gray-900 rounded-[2rem] border border-gray-800 p-6 flex flex-col h-[600px]">
                <h3 className="font-black text-sm text-white uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-gray-800 pb-4"><Trophy className="text-yellow-400" /> Kolektor Prestasi</h3>
                <div className="space-y-3 overflow-y-auto flex-grow pr-2 scrollbar-thin">
                  {(leaderboardData?.topAchievements || []).map((u, i) => (
                    <div key={u.id} onClick={() => openPublicProfile(u.id)} className="flex items-center gap-3 bg-gray-950 p-3 rounded-2xl border border-gray-800 cursor-pointer hover:border-yellow-500 transition-colors">
                      <div className={`font-black text-lg w-6 text-center ${i === 0 ? 'text-yellow-500' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-orange-600' : 'text-gray-700'}`}>{i + 1}</div>
                      <div className="relative">
                        <SafeAvatar src={u.avatar} sizeClassName="w-10 h-10" />
                        {u.online && <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border border-gray-950 rounded-full"></div>}
                      </div>
                      <div className="flex-grow min-w-0">
                        <h4 className="font-black text-white text-xs uppercase line-clamp-1">{u.name}</h4>
                        <p className="text-[9px] text-yellow-500 font-bold uppercase">{u.achCount} Achievement Buka</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Top Creators */}
              <div className="bg-gray-900 rounded-[2rem] border border-gray-800 p-6 flex flex-col h-[600px]">
                <h3 className="font-black text-sm text-white uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-gray-800 pb-4"><UploadCloud className="text-green-400" /> Kreator Terbanyak</h3>
                <div className="space-y-3 overflow-y-auto flex-grow pr-2 scrollbar-thin">
                  {(leaderboardData?.topCreators || []).map((u, i) => (
                    <div key={u.id} onClick={() => openPublicProfile(u.id)} className="flex items-center gap-3 bg-gray-950 p-3 rounded-2xl border border-gray-800 cursor-pointer hover:border-green-500 transition-colors">
                      <div className={`font-black text-lg w-6 text-center ${i === 0 ? 'text-yellow-500' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-orange-600' : 'text-gray-700'}`}>{i + 1}</div>
                      <div className="relative">
                        <SafeAvatar src={u.avatar} sizeClassName="w-10 h-10" />
                        {u.online && <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border border-gray-950 rounded-full"></div>}
                      </div>
                      <div className="flex-grow min-w-0">
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

        {/* UPLOAD */}
        {currentView === 'upload' && user.level !== 'Admin' && (
          <div className="animate-fadeIn max-w-3xl mx-auto space-y-6">
            <div className="bg-gray-900 p-8 md:p-10 rounded-[3rem] shadow-xl border border-gray-800">
              <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-2"><UploadCloud className="inline mr-2 text-blue-500" /> Upload Karyamu</h2>
              <p className="text-xs text-gray-400 font-medium mb-8">Dukung juga format PPT, DOCX, dll.</p>
              {/* BUG FIX #12: bookForm.author diinisialisasi dari user.name saat view berubah ke upload */}
              <form onSubmit={async (e) => {
                e.preventDefault();
                // BUG FIX #13: cover field diambil dari coverBase64 dengan benar
                const newBook = {
                  id: Date.now().toString(),
                  title: bookForm.title,
                  author: bookForm.author || user.name,
                  grade: user.grade || 'X',
                  type: 'community',
                  status: 'pending',
                  cover: bookForm.coverBase64 || '',
                  fileBase64: bookForm.fileBase64 || '',
                  mimeType: bookForm.mimeType || '',
                  authorId: user.id,
                };
                try {
                  await fetch(`${API_URL}/books`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newBook) });
                  showNotif("Karya terkirim! Menunggu ACC Admin.");
                  setBookForm({ title: '', author: user.name, grade: user.grade || 'X', type: 'ebook', coverBase64: '', fileBase64: '', mimeType: '' });
                } catch (e) { showNotif("Gagal mengirim karya", "error"); }
              }} className="space-y-5">
                <input required className="w-full p-4 bg-gray-950 border border-gray-800 text-white rounded-2xl outline-none focus:border-blue-500" placeholder="Judul Karya" value={bookForm.title} onChange={e => setBookForm(prev => ({ ...prev, title: e.target.value }))} />
                <div className="grid grid-cols-2 gap-4">
                  {/* Cover upload */}
                  <label className="p-4 bg-gray-950 border border-gray-800 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-colors relative h-32 overflow-hidden">
                    <input type="file" accept="image/*" onChange={async (e) => await handleMediaUpload(e, 'cover')} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                    {bookForm.coverBase64
                      ? <img src={bookForm.coverBase64} onError={handleBookErr} className="h-full object-cover rounded-xl" alt="cover preview" />
                      : <><Camera size={24} className="text-gray-500 mb-2" /><span className="text-[10px] font-bold text-gray-500 uppercase text-center">Cover Gambar<br />(Opsional)</span></>
                    }
                  </label>
                  {/* File upload */}
                  <label className="p-4 bg-gray-950 border border-gray-800 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-colors relative h-32">
                    <input required type="file" accept=".pdf,.ppt,.pptx,.doc,.docx" onChange={async (e) => await handleMediaUpload(e, 'file', true)} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                    <FileText size={24} className={bookForm.fileBase64 ? "text-blue-500 mb-2" : "text-gray-500 mb-2"} />
                    <span className={`text-[10px] font-bold uppercase text-center ${bookForm.fileBase64 ? 'text-blue-400' : 'text-gray-500'}`}>{bookForm.fileBase64 ? 'File Terpilih!' : 'Pilih File (PDF/PPTX/DOCX)'}</span>
                  </label>
                </div>
                <button type="submit" className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl uppercase tracking-widest hover:bg-blue-500 transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)]">Kirim Karya</button>
              </form>
            </div>
          </div>
        )}

        {/* SOSIAL */}
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
                        <SafeAvatar src={f.avatar} sizeClassName="w-12 h-12" />
                        {f.online && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-gray-950 rounded-full"></div>}
                      </div>
                      <div className="flex-grow min-w-0">
                        <h4 className="font-black text-white text-sm uppercase truncate">{f.name}</h4>
                        <p className="text-[10px] text-gray-500 font-bold uppercase">Level {calculateLevel(f.xp || 0)}</p>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); setActiveChatFriend(f); setCurrentView('chat'); }} className="p-2 bg-blue-500/10 text-blue-400 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"><MessageCircle size={16} /></button>
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
                        <SafeAvatar src={r.avatar} sizeClassName="w-10 h-10" />
                        <h4 className="font-bold text-white text-xs uppercase">{r.name}</h4>
                      </div>
                      <button onClick={async () => {
                        await fetch(`${API_URL}/friends/accept`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id, requesterId: r.id }) });
                        showNotif("Diterima!");
                        const fRes = await fetch(`${API_URL}/users/${user.id}/friends`);
                        if (fRes.ok) setFriendsData(await fRes.json());
                      }} className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-500"><Check size={16} /></button>
                    </div>
                  ))}
                  {(!friendsData?.requests || friendsData.requests.length === 0) && <p className="text-center text-xs text-gray-600 font-bold py-6">Tidak ada permintaan baru.</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CHAT */}
        {currentView === 'chat' && user.level !== 'Admin' && (
          <div className="animate-fadeIn md:max-w-5xl md:mx-auto md:h-[75vh] md:bg-gray-900 md:rounded-[3rem] md:border md:border-gray-800 md:flex md:overflow-hidden md:shadow-2xl
            fixed md:relative inset-0 md:inset-auto top-[57px] md:top-auto bottom-[64px] md:bottom-auto flex bg-gray-900 border-gray-800 overflow-hidden z-20 md:z-auto rounded-none md:rounded-[3rem]">
            {/* Daftar Teman */}
            <div className={`${activeChatFriend ? 'hidden md:flex' : 'flex'} w-full md:w-1/3 flex-col border-r border-gray-800 bg-gray-950`}>
              <div className="p-6 border-b border-gray-800"><h3 className="font-black text-white uppercase tracking-widest text-sm">Pesan Langsung</h3></div>
              <div className="flex-grow overflow-y-auto p-4 space-y-2 scrollbar-thin">
                {(friendsData?.friends || []).map(f => (
                  <div key={f.id} onClick={() => setActiveChatFriend(f)} className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-colors ${activeChatFriend?.id === f.id ? 'bg-blue-900/30 border border-blue-500/50' : 'hover:bg-gray-800 border border-transparent'}`}>
                    <div className="relative">
                      <SafeAvatar src={f.avatar} sizeClassName="w-10 h-10" />
                      {f.online && <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border border-gray-950 rounded-full"></div>}
                    </div>
                    <h4 className="font-bold text-white text-xs uppercase line-clamp-1">{f.name}</h4>
                  </div>
                ))}
                {(!friendsData?.friends || friendsData.friends.length === 0) && (
                  <p className="text-center text-xs text-gray-600 font-bold pt-10">Belum ada teman.<br />Tambah teman di menu Sosial.</p>
                )}
              </div>
            </div>

            {/* Ruang Obrolan */}
            <div className={`${!activeChatFriend ? 'hidden md:flex' : 'flex'} w-full md:w-2/3 flex-col bg-gray-900 relative`}>
              {activeChatFriend ? (
                <>
                  <div className="p-4 border-b border-gray-800 bg-gray-950 flex items-center gap-4 shadow-sm z-10 flex-shrink-0">
                    <button onClick={() => setActiveChatFriend(null)} className="md:hidden text-gray-400 hover:text-white"><X size={20} /></button>
                    <div className="cursor-pointer flex-shrink-0" onClick={() => openPublicProfile(activeChatFriend?.id)}>
                      <SafeAvatar src={activeChatFriend?.avatar} sizeClassName="w-10 h-10" />
                    </div>
                    <div className="flex-grow">
                      <h3 className="font-black text-white text-sm uppercase">{activeChatFriend?.name || 'Teman'}</h3>
                      <p className={`text-[10px] font-bold ${activeChatFriend?.online ? 'text-green-500' : 'text-gray-500'}`}>{activeChatFriend?.online ? 'Online' : 'Offline'}</p>
                    </div>
                  </div>

                  <div className="flex-grow overflow-y-auto p-4 md:p-6 flex flex-col gap-3 scrollbar-thin relative bg-gray-900">
                    {(chatMessages || []).map((msg, idx) => {
                      const isMe = msg.senderId === user.id;
                      const avatarSrc = isMe ? user.avatar : activeChatFriend?.avatar;
                      const isLastMe = isMe && idx === [...chatMessages].map((m, i) => m.senderId === user.id ? i : -1).filter(i => i >= 0).slice(-1)[0];
                      return (
                        <div key={idx} className={`flex gap-2 items-end ${isMe ? 'justify-end' : 'justify-start'}`}>
                          {!isMe && <SafeAvatar src={avatarSrc} sizeClassName="w-8 h-8 flex-shrink-0" />}
                          <div className="flex flex-col group relative max-w-[75%] md:max-w-md">
                            {/* Action buttons — always visible on mobile, hover on desktop */}
                            {isMe && (
                              <div className="absolute -left-[72px] top-0 flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                {!msg.isGif && (
                                  <button onClick={() => { setEditingChatMsg({ timestamp: msg.timestamp, text: msg.text }); setChatInput(msg.text); }} className="p-1.5 bg-gray-800 border border-gray-700 text-blue-400 rounded-lg hover:bg-blue-600 hover:text-white transition-all" title="Edit"><Edit size={13} /></button>
                                )}
                                <button onClick={() => deleteChatMessage(msg.timestamp)} className="p-1.5 bg-gray-800 border border-gray-700 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-all" title="Hapus"><Trash2 size={13} /></button>
                              </div>
                            )}
                            <div className={`rounded-2xl text-sm shadow-sm overflow-hidden ${isMe ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-gray-800 text-gray-200 border border-gray-700 rounded-bl-sm'}`}>
                              {msg.isGif
                                ? <img src={msg.text} alt="GIF" className="max-w-full max-h-48 object-contain" />
                                : <p className="px-4 py-3" style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>{msg.text}{msg.isEdited && <span className="text-[9px] opacity-60 ml-1">(diedit)</span>}</p>
                              }
                            </div>
                            <div className={`flex items-center gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                              {msg.timestamp && (
                                <span className="text-[9px] opacity-50 text-gray-300">
                                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              )}
                              {/* Read receipt — hanya di pesan terakhir saya */}
                              {isMe && isLastMe && (
                                <span className={`text-[10px] font-black ${msg.read ? 'text-blue-400' : 'text-gray-500'}`} title={msg.read ? 'Dibaca' : 'Terkirim'}>
                                  {msg.read ? '✓✓' : '✓'}
                                </span>
                              )}
                            </div>
                          </div>
                          {isMe && <SafeAvatar src={avatarSrc} sizeClassName="w-8 h-8 flex-shrink-0" />}
                        </div>
                      );
                    })}
                    <div ref={chatEndRef} className="h-1" />
                  </div>

                  {/* Input Area */}
                  <div className="p-3 bg-gray-950 border-t border-gray-800 z-10 flex-shrink-0 relative">
                    {/* GIF Picker Panel */}
                    {showGifPicker === 'chat' && (
                      <div className="absolute bottom-full left-0 right-0 mb-2 bg-gray-900 border border-gray-700 rounded-2xl p-3 z-50 shadow-2xl flex flex-col" style={{ maxHeight: '260px' }}>
                        <input
                          autoFocus
                          placeholder="Cari GIF..."
                          className="w-full p-2.5 bg-gray-800 text-white rounded-xl text-sm outline-none mb-2 border border-gray-700 focus:border-blue-500"
                          value={gifSearch}
                          onChange={e => setGifSearch(e.target.value)}
                        />
                        <div className="overflow-y-auto grid grid-cols-3 gap-2 scrollbar-thin">
                          {gifResults.map((url, i) => (
                            <img key={i} src={url} alt="gif" className="w-full h-20 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity border border-gray-700" onClick={() => sendChatGif(url)} />
                          ))}
                          {gifResults.length === 0 && <p className="col-span-3 text-center text-xs text-gray-500 py-4">{gifSearch ? 'Tidak ada hasil...' : 'Ketik untuk mencari GIF 🎬'}</p>}
                        </div>
                      </div>
                    )}
                    {/* Edit mode banner */}
                    {editingChatMsg && (
                      <div className="flex items-center gap-2 bg-blue-900/30 border border-blue-500/50 rounded-xl px-3 py-1.5 mb-2 text-xs text-blue-400 font-bold">
                        <Edit size={12} /> Mode Edit Pesan
                        <button onClick={() => { setEditingChatMsg(null); setChatInput(''); }} className="ml-auto text-gray-500 hover:text-red-400"><X size={14} /></button>
                      </div>
                    )}
                    <form onSubmit={sendChat} className="flex items-center gap-2 bg-gray-900 border border-gray-800 p-1 rounded-2xl focus-within:border-blue-500 transition-colors">
                      <button type="button" onClick={() => { setShowGifPicker(p => p === 'chat' ? null : 'chat'); setGifSearch(''); setGifResults([]); }} className={`p-3 rounded-xl text-xs font-black transition-colors flex-shrink-0 ${showGifPicker === 'chat' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-blue-400'}`}>GIF</button>
                      <input value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder={editingChatMsg ? 'Edit pesan...' : `Pesan ke ${(activeChatFriend?.name || 'teman').split(' ')[0]}...`} className="flex-grow bg-transparent text-white px-2 py-3 text-sm outline-none min-w-0" />
                      <button type="submit" className={`p-3 rounded-xl flex-shrink-0 ${editingChatMsg ? 'bg-green-600 hover:bg-green-500' : 'bg-blue-600 hover:bg-blue-500'} text-white transition-colors`}>{editingChatMsg ? <Check size={18} /> : <Send size={18} />}</button>
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


        {/* PROFIL */}
        {currentView === 'profile' && (
          <div className="animate-fadeIn max-w-3xl mx-auto space-y-6">
            <div className="bg-gray-900 rounded-[3rem] shadow-xl text-center border border-gray-800 relative overflow-hidden flex flex-col">
              {/* Background Banner */}
              <div className="h-48 bg-gray-800 relative group flex-shrink-0 overflow-hidden">
                {profileForm.backgroundBase64
                  ? <img src={profileForm.backgroundBase64} onError={handleAvatarErr} className="w-full h-full object-cover" alt="banner" />
                  : <div className="absolute inset-0 bg-gradient-to-r from-blue-900/40 to-purple-900/40"></div>
                }
                <label className={`absolute top-4 right-4 bg-black/60 text-white p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-md border border-white/20 text-xs font-bold flex items-center gap-2 ${!myAchs.gifBg ? 'cursor-not-allowed opacity-100 bg-red-900/60' : 'cursor-pointer'}`}>
                  {myAchs.gifBg ? <Camera size={14} /> : <Lock size={14} />}
                  Ubah Banner
                  {myAchs.gifBg && <input type="file" accept="image/*" className="hidden" onChange={async (e) => await handleMediaUpload(e, 'background')} />}
                </label>
              </div>

              <div className="px-8 pb-10 pt-0 relative flex-grow">
                <div className={`w-32 h-32 mx-auto rounded-full bg-gray-900 shadow-xl overflow-hidden relative -mt-16 mb-4 flex items-center justify-center group z-10 ${myAchs.diamondBorder ? 'ring-4 ring-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.6)]' : myAchs.goldBorder ? 'ring-4 ring-yellow-400' : 'border-4 border-gray-900'}`}>
                  <SafeAvatar src={profileForm.avatarBase64} sizeClassName="w-full h-full" />
                  <label className={`absolute inset-0 bg-black/60 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm ${!myAchs.gifAvatar ? 'cursor-not-allowed opacity-100 bg-red-900/60' : 'cursor-pointer'}`}>
                    {myAchs.gifAvatar ? <Camera size={24} className="mb-1" /> : <Lock size={24} className="mb-1 text-red-400" />}
                    <span className="text-[9px] font-black uppercase tracking-widest">Ubah PP</span>
                    {myAchs.gifAvatar && <input type="file" accept="image/*" className="hidden" onChange={async (e) => await handleMediaUpload(e, 'avatar')} />}
                  </label>
                </div>

                <h2 className={`text-3xl font-black uppercase flex items-center justify-center gap-2 ${myAchs.glowName ? 'text-white drop-shadow-[0_0_10px_rgba(59,130,246,0.8)]' : 'text-white'}`}>
                  {user?.name || 'User'} {myAchs.socialTitle && <Award size={20} className="text-blue-400" title="Sosialita SMANSA" />}
                </h2>
                {user.level !== 'Admin'
                  ? <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-6 mt-1">NISN: {user.nisn} • Kelas {user.grade}-{user.subClass}</p>
                  : <p className="text-xs font-bold text-yellow-500 uppercase tracking-widest mb-6 mt-1">AKUN PENGELOLA PERPUSTAKAAN (MAX LEVEL)</p>
                }

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

                {user.level !== 'Admin' && (
                  <div className="bg-gray-950 p-6 rounded-3xl border border-gray-800 text-left">
                    <h3 className="text-sm font-black text-white uppercase mb-4 flex items-center gap-2"><Trophy size={16} className="text-yellow-500" /> Pencapaian Kosmetik</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {[
                        { ach: myAchs.gifAvatar, color: 'green', title: 'Kutu Buku Pemula', desc: `Baca buku 10 Menit (${Math.floor((user?.readingTime || 0) / 60)}/10m)`, reward: 'Avatar GIF' },
                        { ach: myAchs.diamondBorder, color: 'cyan', title: 'Kutu Buku Elite', desc: `Baca buku 30 Menit (${Math.floor((user?.readingTime || 0) / 60)}/30m)`, reward: 'Bingkai Berlian' },
                        { ach: myAchs.gifBg, color: 'green', title: 'Siswa Teladan', desc: `Capai Level 5 (Level ${calculateLevel(user.xp)})`, reward: 'Banner GIF' },
                        { ach: myAchs.goldBorder, color: 'yellow', title: 'Kolektor Ilmu', desc: `3 Buku Favorit (${(user.favorites || []).length}/3)`, reward: 'Bingkai Emas' },
                        { ach: myAchs.socialTitle, color: 'blue', title: 'Sosialita SMANSA', desc: `Punya 3 Teman (${(user.friends || []).length}/3)`, reward: 'Gelar Khusus' },
                        { ach: myAchs.glowName, color: 'purple', title: 'Kreator Berbakat', desc: `Terbitkan 1 Karya (${(books || []).filter(b => b.authorId === user.id && b.status === 'approved').length}/1)`, reward: 'Nama Bercahaya' },
                      ].map(({ ach, color, title, desc, reward }) => (
                        <div key={title} className={`p-4 rounded-2xl border flex items-center gap-4 ${ach ? `bg-${color}-900/10 border-${color}-500/30` : 'bg-gray-900 border-gray-800'}`}>
                          <div className="flex-shrink-0">{ach ? <Unlock size={20} className={`text-${color}-500`} /> : <Lock size={20} className="text-gray-600" />}</div>
                          <div className="flex-grow">
                            <h4 className="text-[11px] font-black text-white uppercase">{title}</h4>
                            <p className="text-[9px] text-gray-400 font-medium">{desc}</p>
                            <span className={`inline-block mt-2 text-[8px] font-bold px-2 py-1 rounded ${ach ? `bg-${color}-500 text-white` : 'bg-gray-800 text-gray-400'}`}>{reward}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ADMIN */}
        {currentView === 'admin' && user.level === 'Admin' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex bg-gray-900 p-2 rounded-2xl shadow-sm border border-gray-800 overflow-x-auto scrollbar-thin">
              {['dashboard', 'koleksi', 'approval', 'siswa'].map(t => (
                <button key={t} onClick={() => setAdminTab(t)} className={`flex-1 py-3 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap ${adminTab === t ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-800'}`}>
                  {t}
                </button>
              ))}
            </div>

            {/* Dashboard */}
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

            {/* Koleksi */}
            {adminTab === 'koleksi' && (
              <div className="space-y-6">
                <div className="bg-gray-900 p-8 rounded-[2rem] border border-gray-800">
                  <h3 className="font-black text-sm text-white uppercase mb-6 flex items-center gap-2"><PlusCircle className="text-blue-500" /> {editingBook ? 'Edit Buku' : 'Tambah Buku Resmi'}</h3>
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    try {
                      if (editingBook) {
                        // BUG FIX #14: cover field harus disync dengan coverBase64
                        const updatedBook = {
                          ...editingBook,
                          title: bookForm.title,
                          author: bookForm.author,
                          grade: bookForm.grade,
                          cover: bookForm.coverBase64 || editingBook.cover || '',
                          fileBase64: bookForm.fileBase64 || editingBook.fileBase64 || '',
                          mimeType: bookForm.mimeType || editingBook.mimeType || '',
                        };
                        await fetch(`${API_URL}/books/${editingBook.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updatedBook) });
                        setBooks(prev => prev.map(b => b.id === editingBook.id ? updatedBook : b));
                        showNotif("Buku berhasil diupdate!");
                        setEditingBook(null);
                      } else {
                        const newBook = {
                          id: Date.now().toString(),
                          title: bookForm.title,
                          author: bookForm.author,
                          grade: bookForm.grade,
                          type: 'ebook',
                          status: 'approved',
                          cover: bookForm.coverBase64 || '',
                          fileBase64: bookForm.fileBase64 || '',
                          mimeType: bookForm.mimeType || '',
                          views: 0, comments: [], downloads: []
                        };
                        await fetch(`${API_URL}/books`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newBook) });
                        setBooks(prev => [...prev, newBook]);
                        showNotif("Buku berhasil disimpan!");
                      }
                      setBookForm({ title: '', author: '', grade: 'X', type: 'ebook', coverBase64: '', fileBase64: '', mimeType: '' });
                    } catch (e) { showNotif("Gagal menyimpan buku", "error"); }
                  }} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input required className="p-4 border border-gray-800 rounded-xl text-sm bg-gray-950 text-white outline-none focus:border-blue-500" placeholder="Judul Buku" value={bookForm.title} onChange={e => setBookForm(prev => ({ ...prev, title: e.target.value }))} />
                    <input required className="p-4 border border-gray-800 rounded-xl text-sm bg-gray-950 text-white outline-none focus:border-blue-500" placeholder="Penulis/Mapel" value={bookForm.author} onChange={e => setBookForm(prev => ({ ...prev, author: e.target.value }))} />
                    <select className="p-4 border border-gray-800 rounded-xl text-sm font-bold bg-gray-950 text-white outline-none" value={bookForm.grade} onChange={e => setBookForm(prev => ({ ...prev, grade: e.target.value }))}>
                      <option value="X">Kelas X</option><option value="XI">Kelas XI</option><option value="XII">Kelas XII</option>
                    </select>
                    <div className="md:col-span-3 grid grid-cols-2 gap-4 mt-2">
                      <label className="p-4 border border-gray-800 rounded-xl bg-gray-950 flex flex-col items-center justify-center relative h-24 hover:border-blue-500 transition-all cursor-pointer overflow-hidden">
                        <input type="file" accept="image/*" onChange={async (e) => {
                          if (e.target.files?.[0]) {
                            const b64 = await convertToBase64(e.target.files[0]);
                            setBookForm(prev => ({ ...prev, coverBase64: b64 }));
                          }
                        }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                        {bookForm.coverBase64
                          ? <><img src={bookForm.coverBase64} onError={handleBookErr} className="h-full object-contain rounded" alt="cover" /><span className="text-[9px] text-green-400 font-bold mt-1">Thumbnail OK!</span></>
                          : <><Camera size={20} className="text-gray-500 mb-1" /><span className="text-[10px] font-bold text-gray-500 uppercase">Pilih Thumbnail</span></>
                        }
                      </label>
                      <label className="p-4 border border-gray-800 rounded-xl bg-gray-950 flex flex-col items-center justify-center relative h-24 hover:border-blue-500 transition-all cursor-pointer">
                        <input type="file" accept=".pdf,.ppt,.pptx,.doc,.docx" onChange={async (e) => {
                          if (e.target.files?.[0]) {
                            const file = e.target.files[0];
                            const b64 = await convertToBase64(file);
                            setBookForm(prev => ({ ...prev, fileBase64: b64, mimeType: file.type }));
                          }
                        }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                        <FileText size={20} className={bookForm.fileBase64 ? "text-green-500 mb-1" : "text-gray-500 mb-1"} />
                        <span className={`text-[10px] font-bold uppercase ${bookForm.fileBase64 ? "text-green-400" : "text-gray-500"}`}>{bookForm.fileBase64 ? "File Terpilih!" : "Pilih File"}</span>
                      </label>
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
                            <td className="p-4 font-bold text-sm text-gray-200">
                              <div className="flex items-center gap-3">
                                {/* BUG FIX #15: Cover buku di tabel admin pakai SafeBookCover */}
                                <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-gray-800">
                                  <SafeBookCover src={b.cover} />
                                </div>
                                <div>{b.title} <span className="block text-[10px] text-blue-400 uppercase mt-1">{b.type === 'community' ? 'Karya Siswa' : `Kelas ${b.grade}`}</span></div>
                              </div>
                            </td>
                            <td className="p-4 text-center whitespace-nowrap">
                              <button onClick={() => {
                                setEditingBook(b);
                                setBookForm({ title: b.title, author: b.author, grade: b.grade || 'X', type: b.type, coverBase64: b.cover || '', fileBase64: b.fileBase64 || '', mimeType: b.mimeType || '' });
                              }} className="p-3 bg-blue-500/10 text-blue-400 rounded-xl hover:bg-blue-500 hover:text-white transition-all mr-2"><Edit size={16} /></button>
                              <button onClick={async () => {
                                if (window.confirm("Hapus Buku?")) {
                                  await fetch(`${API_URL}/books/${b.id}`, { method: 'DELETE' });
                                  setBooks(prev => prev.filter(bk => bk.id !== b.id));
                                  showNotif("Buku Dihapus", "info");
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

            {/* Approval */}
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
                          <td className="p-4 font-bold text-sm text-gray-200">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-gray-800">
                                <SafeBookCover src={b.cover} />
                              </div>
                              <div>{b.title} <span className="block text-[10px] text-gray-400 uppercase mt-1">Oleh: {b.author}</span></div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex justify-center gap-2">
                              <button onClick={() => { setReadingBook(b); setIsPreviewMode(true); }} className="p-3 bg-blue-500/10 text-blue-400 rounded-xl hover:bg-blue-500 hover:text-white" title="Pratinjau"><Eye size={16} /></button>
                              <button onClick={async () => {
                                await fetch(`${API_URL}/books/${b.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...b, status: 'approved' }) });
                                setBooks(prev => prev.map(bk => bk.id === b.id ? { ...bk, status: 'approved' } : bk));
                                showNotif("Karya di-ACC!");
                              }} className="p-3 bg-green-500/10 text-green-500 rounded-xl hover:bg-green-500 hover:text-white" title="ACC"><Check size={16} /></button>
                              <button onClick={async () => {
                                if (window.confirm("Tolak dan hapus karya ini?")) {
                                  await fetch(`${API_URL}/books/${b.id}`, { method: 'DELETE' });
                                  setBooks(prev => prev.filter(bk => bk.id !== b.id));
                                  showNotif("Karya ditolak", "info");
                                }
                              }} className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white" title="Tolak"><X size={16} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {(books || []).filter(b => b.status === 'pending').length === 0 && (
                        <tr><td colSpan="2" className="p-10 text-center text-xs font-bold text-gray-600">Tidak ada karya yang menunggu ACC.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Siswa - BUG FIX #16: Form pendaftaran siswa sekarang berfungsi karena loadAdminStudents ada */}
            {adminTab === 'siswa' && (
              <div className="space-y-6">
                <div className="bg-gray-900 p-8 rounded-[2rem] border border-gray-800">
                  <h3 className="font-black text-sm text-white uppercase mb-4 flex items-center gap-2"><UserPlus className="text-blue-500" /> {editingStudent ? 'Edit Master Siswa' : 'Registrasi NISN Siswa'}</h3>
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    try {
                      if (editingStudent) {
                        await fetch(`${API_URL}/students/${editingStudent.nisn}`, {
                          method: 'PUT', headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ nisn: studentInput.nisn, name: studentInput.name, grade: studentInput.grade, subClass: studentInput.sub })
                        });
                        showNotif(`Data siswa diupdate!`);
                        setEditingStudent(null);
                      } else {
                        // BUG FIX #17: Gunakan endpoint yang benar dan struktur data yang tepat
                        const res = await fetch(`${API_URL}/students/bulk`, {
                          method: 'POST', headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ students: [{ nisn: studentInput.nisn, name: studentInput.name, grade: studentInput.grade, subClass: studentInput.sub }] })
                        });
                        if (!res.ok) throw new Error("Gagal");
                        showNotif(`NISN ${studentInput.nisn} terdaftar!`);
                      }
                      // BUG FIX #18: Panggil loadAdminStudents (sudah didefinisikan) untuk refresh data
                      loadAdminStudents();
                      setStudentInput({ nisn: '', name: '', grade: 'X', sub: '1' });
                    } catch (e) { showNotif("Gagal menyimpan data", "error"); }
                  }} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <input required placeholder="Nama Siswa" className="p-4 bg-gray-950 text-white border border-gray-800 rounded-xl text-sm outline-none focus:border-blue-500" value={studentInput.name} onChange={e => setStudentInput(prev => ({ ...prev, name: e.target.value }))} />
                    <input required placeholder="NISN Resmi" className="p-4 bg-gray-950 text-white border border-gray-800 rounded-xl text-sm font-mono outline-none focus:border-blue-500" value={studentInput.nisn} onChange={e => setStudentInput(prev => ({ ...prev, nisn: e.target.value }))} />
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
                        <tr>
                          <th className="p-4 border-b border-gray-800">Nama Siswa</th>
                          <th className="p-4 border-b border-gray-800">NISN</th>
                          <th className="p-4 border-b border-gray-800">Kelas</th>
                          <th className="p-4 border-b border-gray-800 text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800">
                        {getSortedStudents().map((s, idx) => (
                          <tr key={`${s.nisn}-${idx}`} className="hover:bg-gray-800/50">
                            <td className="p-4 font-bold text-sm text-gray-200">{s.name}</td>
                            <td className="p-4 font-mono text-xs text-blue-400">{s.nisn}</td>
                            <td className="p-4 text-xs font-bold text-gray-400">{s.grade}-{s.subClass}</td>
                            <td className="p-4 text-center whitespace-nowrap">
                              <button onClick={() => { setEditingStudent(s); setStudentInput({ nisn: s.nisn, name: s.name, grade: s.grade, sub: s.subClass || '1' }); }} className="p-2 bg-blue-500/10 text-blue-400 rounded-xl hover:bg-blue-500 hover:text-white transition-all mr-2"><Edit size={14} /></button>
                              <button onClick={async () => {
                                if (window.confirm(`Hapus Siswa dengan NISN ${s.nisn}?`)) {
                                  await fetch(`${API_URL}/students/${s.nisn}`, { method: 'DELETE' });
                                  setMasterStudents(prev => prev.filter(ms => ms.nisn !== s.nisn));
                                  showNotif("Dihapus", "info");
                                }
                              }} className="p-2 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"><Trash2 size={14} /></button>
                            </td>
                          </tr>
                        ))}
                        {masterStudents.length === 0 && (
                          <tr><td colSpan="4" className="p-8 text-center text-xs text-gray-500 font-bold">Belum ada siswa terdaftar</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* BOTTOM NAVBAR MOBILE — 3 tombol utama, menu lengkap di top drawer */}
      {user && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-md border-t border-gray-800 z-40 pb-safe">
          <div className="flex items-center justify-around px-8 py-2">
            {/* Beranda */}
            <button onClick={() => { setCurrentView('home'); setMobileMenuOpen(false); }} className={`flex flex-col items-center gap-1 p-2 transition-all duration-200 ${currentView === 'home' ? 'text-blue-500' : 'text-gray-500'}`}>
              <div className={`p-2 rounded-xl transition-all ${currentView === 'home' ? 'bg-blue-600/20' : ''}`}>
                <Home size={20} fill={currentView === 'home' ? 'currentColor' : 'none'} />
              </div>
              <span className="text-[8px] font-black uppercase tracking-wide">Beranda</span>
            </button>

            {/* Tombol tengah — Chat (siswa) atau Admin */}
            {user.level !== 'Pengunjung' && (
              user.level !== 'Admin' ? (
                <button onClick={() => { setActiveChatFriend(null); setChatMessages([]); setCurrentView('chat'); setMobileMenuOpen(false); }} className="flex flex-col items-center gap-1 -mt-5">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl transition-all border-4 ${currentView === 'chat' ? 'bg-blue-600 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)]' : 'bg-gray-800 border-gray-700'}`}>
                    <MessageCircle size={24} fill={currentView === 'chat' ? 'currentColor' : 'none'} className={currentView === 'chat' ? 'text-white' : 'text-gray-400'} />
                  </div>
                  <span className={`text-[8px] font-black uppercase tracking-wide ${currentView === 'chat' ? 'text-blue-500' : 'text-gray-500'}`}>Chat</span>
                </button>
              ) : (
                <button onClick={() => { setCurrentView('admin'); setMobileMenuOpen(false); }} className="flex flex-col items-center gap-1 -mt-5">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl transition-all border-4 ${currentView === 'admin' ? 'bg-blue-600 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)]' : 'bg-gray-800 border-gray-700'}`}>
                    <Shield size={24} fill={currentView === 'admin' ? 'currentColor' : 'none'} className={currentView === 'admin' ? 'text-white' : 'text-gray-400'} />
                  </div>
                  <span className={`text-[8px] font-black uppercase tracking-wide ${currentView === 'admin' ? 'text-blue-500' : 'text-gray-500'}`}>Admin</span>
                </button>
              )
            )}

            {/* Profil */}
            {user.level !== 'Pengunjung' && (
              <button onClick={() => { setCurrentView('profile'); setMobileMenuOpen(false); }} className={`flex flex-col items-center gap-1 p-2 transition-all duration-200 ${currentView === 'profile' ? 'text-blue-500' : 'text-gray-500'}`}>
                <div className={`rounded-full p-0.5 transition-all ${currentView === 'profile' ? 'ring-2 ring-blue-500' : ''}`}>
                  <SafeAvatar src={user.avatar} sizeClassName="w-9 h-9" />
                </div>
                <span className="text-[8px] font-black uppercase tracking-wide">Profil</span>
              </button>
            )}
          </div>
        </nav>
      )}

      {/* MODAL DETAIL BUKU */}
      {bookDetailModal && (
        <div className="fixed inset-0 z-[160] bg-black/95 flex flex-col md:p-10 animate-fadeIn overflow-y-auto">
          <div className="max-w-4xl mx-auto w-full bg-gray-900 rounded-[2rem] md:rounded-[2.5rem] border border-gray-800 shadow-xl relative my-8 mb-32 md:mb-8">
            <button onClick={() => { setBookDetailModal(null); setShowGifPicker(null); setEditingCommentId(null); }} className="absolute top-4 right-4 bg-gray-800/80 backdrop-blur-md text-gray-400 p-2.5 rounded-full hover:bg-red-500 hover:text-white transition-colors z-30 border border-white/10"><X size={18} /></button>
            <div className="flex flex-col md:flex-row gap-6 p-5 md:p-8 relative z-10">
              <div className="w-full md:w-1/3 flex flex-col gap-4">
                {/* BUG FIX #20: Cover di modal detail pakai SafeBookCover */}
                <div className="relative w-full rounded-2xl overflow-hidden border border-gray-800 bg-gray-800" style={{ aspectRatio: '2/3' }}>
                  <SafeBookCover src={bookDetailModal.cover} />
                  {(user.level !== 'Admin' && user.level !== 'Pengunjung') && (
                    <div className="absolute top-3 right-3 flex flex-col gap-2">
                      <button onClick={() => toggleLibrary(bookDetailModal.id, 'fav')} className={`p-2 rounded-full backdrop-blur-md border border-white/10 shadow-lg transition-colors ${(user.favorites || []).includes(bookDetailModal.id) ? 'bg-yellow-500 text-white' : 'bg-black/50 text-gray-300 hover:bg-black/80'}`}><Star size={16} fill={(user.favorites || []).includes(bookDetailModal.id) ? 'currentColor' : 'none'} /></button>
                      <button onClick={() => toggleLibrary(bookDetailModal.id, 'wish')} className={`p-2 rounded-full backdrop-blur-md border border-white/10 shadow-lg transition-colors ${(user.wishlist || []).includes(bookDetailModal.id) ? 'bg-blue-500 text-white' : 'bg-black/50 text-gray-300 hover:bg-black/80'}`}><Bookmark size={16} fill={(user.wishlist || []).includes(bookDetailModal.id) ? 'currentColor' : 'none'} /></button>
                    </div>
                  )}
                </div>
                <button onClick={() => startReading(bookDetailModal)} className="w-full bg-blue-600 text-white font-black py-4 rounded-xl uppercase tracking-widest hover:bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.4)]">
                  {(bookDetailModal.fileBase64 && (bookDetailModal.fileBase64.startsWith('data:application/pdf') || bookDetailModal.fileBase64.startsWith('data:image'))) ? 'Buka Digital' : 'Unduh & Buka'}
                </button>
                {bookDetailModal.type === 'ebook' && (
                  <div className="bg-gray-950 border border-gray-800 rounded-xl p-4 mt-2">
                    <button onClick={() => downloadBook(bookDetailModal)} className="w-full bg-green-600 text-white font-black py-3 rounded-lg uppercase tracking-widest text-[10px] hover:bg-green-500 mb-3 flex justify-center items-center gap-2"><Download size={14} /> Unduh File Asli</button>
                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest border-b border-gray-800 pb-2 mb-2">Riwayat Unduhan</p>
                    <div className="max-h-24 overflow-y-auto space-y-2 scrollbar-thin">
                      {(bookDetailModal.downloads || []).map((d, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          <SafeAvatar src={d.avatar} sizeClassName="w-4 h-4" />
                          <span className="font-bold text-gray-300 line-clamp-1">{d.userName}</span>
                        </div>
                      ))}
                      {(!bookDetailModal.downloads || bookDetailModal.downloads.length === 0) && <p className="text-[10px] text-gray-600">Belum ada yang mengunduh.</p>}
                    </div>
                  </div>
                )}
              </div>

              <div className="w-full md:w-2/3 flex flex-col">
                <h2 className="text-2xl md:text-3xl font-black text-white uppercase leading-tight mb-2 pr-10">{bookDetailModal.title}</h2>
                <div className="flex items-center gap-4 mb-6">
                  <span onClick={() => { if (bookDetailModal.authorId) openPublicProfile(bookDetailModal.authorId); }} className={`text-sm font-bold uppercase tracking-widest ${bookDetailModal.authorId ? 'text-blue-400 cursor-pointer hover:underline' : 'text-gray-500'}`}>
                    Oleh: {bookDetailModal.author}
                  </span>
                  <div className="h-4 w-px bg-gray-700"></div>
                  <span className="text-xs text-gray-400 font-bold flex items-center gap-1"><Eye size={14} /> {bookDetailModal.views || 0} Pembaca</span>
                </div>

                <div className="bg-gray-950 rounded-2xl p-3 md:p-6 border border-gray-800 flex flex-col" style={{ minHeight: '300px' }}>
                  <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2"><MessageSquare size={14} /> Kolom Diskusi</h3>
                  <div className="overflow-y-auto space-y-3 mb-3 scrollbar-thin flex-grow" style={{ maxHeight: '320px' }}>
                    {(bookDetailModal.comments || []).map(c => (
                      <div key={c.id} className={`p-3 rounded-2xl border relative ${c.role === 'Admin' ? 'bg-blue-900/10 border-blue-500/50' : 'bg-gray-900 border-gray-800'}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <div onClick={() => openPublicProfile(c.userId)} className="cursor-pointer flex-shrink-0">
                            <SafeAvatar src={c.userAvatar} sizeClassName="w-6 h-6" />
                          </div>
                          <span className={`text-xs font-bold cursor-pointer hover:underline ${c.role === 'Admin' ? 'text-yellow-400' : 'text-blue-400'}`} onClick={() => openPublicProfile(c.userId)}>{(c.userName || 'User').split(' ')[0]}</span>
                          {c.role === 'Admin' && <span className="bg-yellow-500 text-black text-[8px] font-black px-1.5 py-0.5 rounded uppercase">Admin</span>}
                          <span className="text-[9px] text-gray-600 ml-auto flex-shrink-0">{timeAgo(c.timestamp)}{c.isEdited && ' (diedit)'}</span>
                        </div>
                        {/* Inline edit mode for the comment */}
                        {editingCommentId === c.id ? (
                          <div className="flex gap-2 mt-2">
                            <input autoFocus value={editingCommentText} onChange={e => setEditingCommentText(e.target.value)} className="flex-grow bg-gray-800 border border-blue-500 rounded-xl px-3 py-2 text-sm text-white outline-none" onKeyDown={e => { if (e.key === 'Enter') editComment(c.id, editingCommentText); if (e.key === 'Escape') { setEditingCommentId(null); setEditingCommentText(''); } }} />
                            <button onClick={() => editComment(c.id, editingCommentText)} className="p-2 bg-green-600 text-white rounded-xl hover:bg-green-500"><Check size={14} /></button>
                            <button onClick={() => { setEditingCommentId(null); setEditingCommentText(''); }} className="p-2 bg-gray-700 text-gray-400 rounded-xl hover:bg-gray-600"><X size={14} /></button>
                          </div>
                        ) : (
                          (c.isGif || (typeof c.text === 'string' && c.text.includes('.gif')))
                            ? <img src={c.text} alt="GIF" className="max-w-full max-h-48 object-contain rounded-xl mt-1 border border-gray-800 shadow-lg" />
                            : <p className="text-sm text-gray-200 whitespace-pre-wrap break-words pr-14 leading-relaxed">{c.text}</p>
                        )}
                        {/* Action buttons — visible on mobile, hover on desktop */}
                        {(user.id === c.userId || user.level === 'Admin') && editingCommentId !== c.id && (
                          <div className="absolute bottom-2 right-2 flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                            {user.id === c.userId && !c.isGif && (
                              <button onClick={() => { setEditingCommentId(c.id); setEditingCommentText(c.text); }} className="p-2 bg-gray-800 border border-gray-700 text-blue-400 rounded-lg hover:bg-blue-600 hover:text-white transition-all shadow-md" title="Edit"><Edit size={13} /></button>
                            )}
                            <button onClick={() => deleteComment(c.id)} className="p-2 bg-gray-800 border border-gray-700 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-all shadow-md" title="Hapus"><Trash2 size={13} /></button>
                          </div>
                        )}
                      </div>
                    ))}
                    {(!bookDetailModal.comments || bookDetailModal.comments.length === 0) && <p className="text-xs text-gray-600 text-center italic py-4">Jadilah yang pertama berkomentar!</p>}
                  </div>
                  {/* Comment Input — sticky bottom, always visible */}
                  {user.level !== 'Pengunjung' ? (
                    <form onSubmit={submitComment} className="flex gap-2">
                      <button type="button" onClick={() => { setShowGifPicker(p => p === 'comment' ? null : 'comment'); setGifSearch(''); setGifResults([]); }} className={`p-2.5 rounded-xl text-xs font-black flex-shrink-0 transition-colors ${showGifPicker === 'comment' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-500 hover:text-blue-400'}`}>GIF</button>
                      <input required value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Tulis komentar..." className="flex-grow bg-gray-900 border border-gray-800 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500 min-w-0" />
                      <button type="submit" className="bg-blue-600 text-white px-4 font-black rounded-xl hover:bg-blue-500 flex-shrink-0"><Send size={15} /></button>
                    </form>
                  ) : (
                    <div></div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PROFIL PUBLIK - BUG FIX #21: Seluruh render dibungkus null-check ketat */}
      {publicProfileModal && (() => {
        // Guard semua field yang bisa null/undefined
        const pm = publicProfileModal;
        if (!pm || !pm.id) return null;
        const theirAchs = getAchievements(pm, (pm.works || []).length);
        return (
          <div className="fixed inset-0 z-[250] bg-black/90 flex flex-col items-center justify-center p-4 animate-fadeIn overflow-y-auto py-10">
            <div className="bg-gray-900 rounded-[3rem] w-full max-w-lg shadow-xl relative overflow-hidden border border-gray-800 my-auto">
              <button onClick={() => setPublicProfileModal(null)} className="absolute top-4 right-4 bg-black/60 backdrop-blur-md p-2 rounded-full text-white hover:bg-red-500 z-10 transition-colors border border-white/10"><X size={16} /></button>

              <div className="h-40 bg-gray-800 relative overflow-hidden">
                {pm.background && pm.background.length > 20
                  ? <img src={pm.background} onError={handleAvatarErr} className="w-full h-full object-cover" alt="banner" />
                  : <div className="absolute inset-0 bg-gradient-to-r from-blue-900/40 to-purple-900/40"></div>
                }
              </div>

              <div className="px-8 pb-8 pt-0 text-center relative">
                <div className={`w-24 h-24 mx-auto rounded-full bg-gray-900 shadow-xl overflow-hidden relative -mt-12 mb-4 z-10 ${theirAchs.diamondBorder ? 'ring-4 ring-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.6)]' : theirAchs.goldBorder ? 'ring-4 ring-yellow-400' : 'border-4 border-gray-900'}`}>
                  <SafeAvatar src={pm.avatar} sizeClassName="w-full h-full" />
                </div>

                <h2 className={`text-2xl font-black uppercase flex justify-center items-center gap-2 ${theirAchs.glowName ? 'text-white drop-shadow-[0_0_10px_rgba(59,130,246,0.8)]' : 'text-white'}`}>
                  {(pm.name || 'User').split(' ')[0]}
                  {theirAchs.socialTitle && <Award size={18} className="text-blue-400" title="Sosialita SMANSA" />}
                  {pm.isOnline && <div className="w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900" title="Online"></div>}
                </h2>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1 mb-2">
                  {pm.level === 'Admin' ? 'Petugas' : `Kelas ${pm.grade || '-'}-${pm.subClass || '-'}`}
                </p>

                {pm.bio && <p className="text-sm text-gray-300 italic px-4 mb-4">"{pm.bio}"</p>}

                {pm.level !== 'Admin' && (
                  <div className="flex justify-center gap-4 mb-6">
                    <div className="bg-gray-950 px-4 py-2 rounded-xl border border-gray-800 flex-1">
                      <p className="text-[10px] text-gray-500 uppercase font-black">Level</p>
                      <p className="text-lg font-black text-blue-400">{calculateLevel(pm.xp || 0)}</p>
                    </div>
                    <div className="bg-gray-950 px-4 py-2 rounded-xl border border-gray-800 flex-1">
                      <p className="text-[10px] text-gray-500 uppercase font-black">Total XP</p>
                      <p className="text-lg font-black text-yellow-500">{pm.xp || 0}</p>
                    </div>
                  </div>
                )}

                <div className="bg-gray-950 p-4 rounded-2xl text-left border border-gray-800 space-y-3 mb-6">
                  <div className="flex items-center gap-3 text-sm">
                    <Clock size={16} className="text-blue-500" />
                    <span className="text-gray-400">Status: <span className="text-white font-bold">{pm.isOnline ? 'Sedang Online' : timeAgo(pm.lastOnline)}</span></span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <BookOpen size={16} className="text-green-500" />
                    <span className="text-gray-400">Terakhir Dibaca: <span className="text-white font-bold line-clamp-1">{pm.lastReadTitle || 'Belum ada'}</span></span>
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
                    {!Object.values(theirAchs).some(Boolean) && <span className="text-xs text-gray-600">Belum ada badge.</span>}
                  </div>
                </div>

                {(pm.mutualFriends || []).length > 0 && (
                  <div className="mb-6 text-left">
                    <h4 className="text-xs font-black uppercase text-gray-500 mb-2 border-b border-gray-800 pb-1">Mutual Friends ({pm.mutualFriends.length})</h4>
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                      {pm.mutualFriends.map(mf => (
                        <SafeAvatar key={mf.id} src={mf.avatar} sizeClassName="w-8 h-8" />
                      ))}
                    </div>
                  </div>
                )}

                <div className="text-left space-y-4">
                  {(pm.works || []).length > 0 && (
                    <div>
                      <h4 className="text-xs font-black uppercase text-gray-500 mb-2 border-b border-gray-800 pb-1"><UploadCloud size={12} className="inline mr-1" /> Karya Terbit</h4>
                      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
                        {pm.works.map(w => (
                          <div key={w.id} className="w-20 flex-shrink-0 cursor-pointer h-28 rounded-xl overflow-hidden border border-gray-800 hover:border-blue-500 transition-colors bg-gray-800" onClick={() => { setPublicProfileModal(null); setBookDetailModal(w); }}>
                            <SafeBookCover src={w.cover} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {(pm.favorites || []).length > 0 && (
                    <div>
                      <h4 className="text-xs font-black uppercase text-gray-500 mb-2 border-b border-gray-800 pb-1"><Star size={12} className="inline mr-1 text-yellow-500" /> Buku Favorit</h4>
                      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
                        {pm.favorites.map(w => (
                          <div key={w.id} className="w-20 flex-shrink-0 cursor-pointer h-28 rounded-xl overflow-hidden border border-gray-800 hover:border-blue-500 transition-colors bg-gray-800" onClick={() => { setPublicProfileModal(null); setBookDetailModal(w); }}>
                            <SafeBookCover src={w.cover} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {(pm.wishlist || []).length > 0 && (
                    <div>
                      <h4 className="text-xs font-black uppercase text-gray-500 mb-2 border-b border-gray-800 pb-1"><Bookmark size={12} className="inline mr-1 text-blue-500" /> Wishlist</h4>
                      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
                        {pm.wishlist.map(w => (
                          <div key={w.id} className="w-20 flex-shrink-0 cursor-pointer h-28 rounded-xl overflow-hidden border border-gray-800 hover:border-blue-500 transition-colors bg-gray-800" onClick={() => { setPublicProfileModal(null); setBookDetailModal(w); }}>
                            <SafeBookCover src={w.cover} />
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

      {/* PRATINJAU FILE */}
      {readingBook && (
        <div className="fixed inset-0 z-[300] bg-black/95 flex flex-col p-2 md:p-6 animate-fadeIn pb-24 md:pb-6">
          <div className="max-w-6xl mx-auto w-full h-full bg-gray-950 rounded-3xl md:rounded-[2rem] border border-gray-800 overflow-hidden shadow-2xl flex flex-col relative">
            <div className="p-4 bg-gray-900 border-b border-gray-800 text-white flex justify-between items-center flex-shrink-0">
              <h3 className="font-black text-xs md:text-sm uppercase leading-none ml-2 text-gray-200">
                <BookIcon size={16} className="inline mr-2 text-blue-500" />
                {isPreviewMode ? `(PRATINJAU ACC) ${readingBook.title}` : readingBook.title}
              </h3>
              <div className="flex items-center gap-2">
                {isPreviewMode && (
                  <button onClick={async () => {
                    await fetch(`${API_URL}/books/${readingBook.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...readingBook, status: 'approved' }) });
                    setBooks(prev => prev.map(bk => bk.id === readingBook.id ? { ...bk, status: 'approved' } : bk));
                    showNotif("Karya disetujui!");
                    stopReading();
                  }} className="bg-green-600 text-white p-2 md:p-3 rounded-xl hover:bg-green-500 transition-all font-black text-[10px] uppercase flex items-center gap-1">
                    <Check size={14} /> ACC Karya
                  </button>
                )}
                <button onClick={stopReading} className="bg-red-500/20 text-red-400 p-2 md:p-3 rounded-xl hover:bg-red-500 hover:text-white transition-all"><X size={16} /></button>
              </div>
            </div>

            <div className="flex-grow bg-gray-950 relative flex items-center justify-center">
              {readingBook.fileBase64 ? (
                (readingBook.fileBase64.startsWith('data:application/pdf') || readingBook.fileBase64.startsWith('data:image')) ? (
                  <>
                    <div className="absolute top-4 right-6 z-10 animate-fadeIn">
                      <button onClick={() => downloadBook(readingBook)} className="bg-gray-900/80 backdrop-blur-md border border-gray-700 text-white px-4 py-2 rounded-xl text-[10px] font-bold uppercase flex items-center gap-2 hover:bg-blue-600 transition-colors shadow-xl"><Download size={14} /> Unduh PDF</button>
                    </div>
                    <iframe src={readingBook.fileBase64} className="w-full h-full border-none absolute inset-0 bg-white" title={readingBook.title} />
                  </>
                ) : (
                  <div className="text-center space-y-4 p-8">
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

      {/* NOTIFIKASI */}
      {notification && (
        <div className={`fixed top-5 md:top-auto md:bottom-24 left-1/2 -translate-x-1/2 z-[5000] px-6 py-3 md:px-8 md:py-4 rounded-full md:rounded-2xl shadow-xl animate-slideUp flex items-center gap-3 ${notification.type === 'error' ? 'bg-red-600 text-white' : 'bg-blue-600 text-white border border-blue-500'}`}>
          {notification.type === 'error' ? <XCircle size={16} /> : <CheckCircle size={16} />}
          <span className="font-black text-[10px] md:text-xs uppercase tracking-widest">{notification.msg}</span>
        </div>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes slideDown { from { opacity: 0; transform: translateY(-12px); } to { opacity: 1; transform: translateY(0); } }
        .animate-slideDown { animation: slideDown 0.2s ease-out; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translate(-50%, -20px); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }
        @media (min-width: 768px) { @keyframes slideUp { from { transform: translate(-50%, 20px); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } } }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
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
