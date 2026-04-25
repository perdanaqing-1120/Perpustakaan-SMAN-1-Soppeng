const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 5000;

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '200mb' }));

const DB_PATH = path.join(__dirname, 'database.json');

if (!fs.existsSync(DB_PATH)) {
  fs.writeFileSync(DB_PATH, JSON.stringify({
    users: [{ id: 'admin-0', name: 'Super Admin', username: 'admin', password: 'admin1234', level: 'Admin', xp: 'MAX', avatar: '', background: '', bio: 'Pengelola Terkuat SMANSA' }],
    students: [],
    books: [],
    chats: [],
    stats: { totalVisits: 0 }
  }, null, 2));
}

const readDB = () => JSON.parse(fs.readFileSync(DB_PATH));
const writeDB = (data) => fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));

let activeSessions = {};

app.post('/api/stats/heartbeat', (req, res) => {
  const { userId } = req.body;
  const now = Date.now();
  let activeCount = 0;

  if (userId) {
    activeSessions[userId] = now;
    const db = readDB();
    const uIdx = db.users.findIndex(u => u.id === userId);
    if (uIdx > -1) {
      db.users[uIdx].lastOnline = now;
      if (db.users[uIdx].level !== 'Admin') db.users[uIdx].xp = (db.users[uIdx].xp || 0) + 1;
      writeDB(db);
    }
  }

  activeCount = Object.values(activeSessions).filter(time => now - time < 20000).length;
  res.json({ ok: true, activeUsers: activeCount });
});

const isOnline = (lastOnline) => lastOnline ? (Date.now() - lastOnline < 20000) : false;

const calculateAchievementsCount = (u, worksCount) => {
  let count = 0;
  if ((u.readingTime || 0) >= 600) count++;
  if ((u.readingTime || 0) >= 1800) count++;
  if ((u.xp || 0) >= 400) count++;
  if ((u.favorites || []).length >= 3) count++;
  if ((u.friends || []).length >= 3) count++;
  if (worksCount >= 1) count++;
  return count;
};

app.get('/api/leaderboard', (req, res) => {
  const db = readDB();
  const students = db.users.filter(u => u.level === 'Siswa');

  const topXP = [...students].sort((a, b) => (b.xp || 0) - (a.xp || 0)).slice(0, 10).map(u => ({ id: u.id, name: u.name, avatar: u.avatar, xp: u.xp || 0, online: isOnline(u.lastOnline) }));

  const creatorCounts = {};
  db.books.forEach(b => { if (b.status === 'approved' && b.type === 'community' && b.authorId) creatorCounts[b.authorId] = (creatorCounts[b.authorId] || 0) + 1; });
  const topCreators = Object.entries(creatorCounts).map(([id, count]) => {
    const u = students.find(user => user.id === id);
    return u ? { id, name: u.name, avatar: u.avatar, count, xp: u.xp || 0, online: isOnline(u.lastOnline) } : null;
  }).filter(Boolean).sort((a, b) => b.count - a.count).slice(0, 10);

  const topAchievements = [...students].map(u => {
    const wCount = creatorCounts[u.id] || 0;
    return { id: u.id, name: u.name, avatar: u.avatar, xp: u.xp || 0, online: isOnline(u.lastOnline), achCount: calculateAchievementsCount(u, wCount) };
  }).sort((a, b) => b.achCount - a.achCount || b.xp - a.xp).slice(0, 10);

  res.json({ topXP, topCreators, topAchievements });
});

app.get('/api/users/public/:id', (req, res) => {
  const db = readDB();
  const user = db.users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ message: 'User tidak ditemukan' });

  const viewerId = req.query.viewerId;
  const viewer = db.users.find(u => u.id === viewerId);
  let mutualFriends = [];

  if (viewer && Array.isArray(viewer.friends) && Array.isArray(user.friends)) {
    const mutualIds = viewer.friends.filter(id => user.friends.includes(id));
    mutualFriends = db.users.filter(u => mutualIds.includes(u.id)).map(u => ({ id: u.id, name: u.name, avatar: u.avatar }));
  }

  const uploadedBooks = db.books.filter(b => b.authorId === user.id && b.status === 'approved');
  const favBooks = db.books.filter(b => (user.favorites || []).includes(b.id));
  const wishBooks = db.books.filter(b => (user.wishlist || []).includes(b.id));

  res.json({
    id: user.id, name: user.name, avatar: user.avatar || '', background: user.background || '', bio: user.bio || '',
    xp: user.xp || 0, readingTime: user.readingTime || 0, grade: user.grade, subClass: user.subClass, level: user.level,
    isOnline: isOnline(user.lastOnline), lastOnline: user.lastOnline || null, lastReadTitle: user.lastReadTitle || 'Belum ada',
    works: uploadedBooks, favorites: favBooks, wishlist: wishBooks, mutualFriends, friendsCount: (user.friends || []).length
  });
});

app.get('/api/books', (req, res) => res.json(readDB().books));
app.post('/api/books', (req, res) => {
  const db = readDB();
  db.books.push({ ...req.body, views: 0, comments: [], downloads: [] });
  writeDB(db); res.json({ message: 'Buku diupload' });
});

app.post('/api/books/:id/comment', (req, res) => {
  const db = readDB();
  const bIdx = db.books.findIndex(b => b.id === req.params.id);
  if (bIdx > -1) {
    if (!db.books[bIdx].comments) db.books[bIdx].comments = [];
    const newComment = {
      id: Date.now().toString(),
      userId: req.body.userId,
      userName: req.body.userName || 'User',
      userAvatar: req.body.userAvatar || '',
      text: req.body.text,
      role: req.body.role,
      timestamp: Date.now()
    };
    db.books[bIdx].comments.push(newComment);
    writeDB(db);
    res.json(newComment);
  } else res.status(404).json({ error: 'Buku tidak ditemukan' });
});

app.delete('/api/books/:id/comment/:commentId', (req, res) => {
  const db = readDB();
  const bIdx = db.books.findIndex(b => b.id === req.params.id);
  if (bIdx > -1) {
    if (!db.books[bIdx].comments) db.books[bIdx].comments = [];
    db.books[bIdx].comments = db.books[bIdx].comments.filter(c => c.id !== req.params.commentId);
    writeDB(db);
    res.json({ success: true });
  } else res.status(404).json({ error: 'Komentar tidak ditemukan' });
});

app.post('/api/books/:id/view', (req, res) => {
  const db = readDB();
  const bIdx = db.books.findIndex(b => b.id === req.params.id);
  if (bIdx > -1) {
    db.books[bIdx].views = (db.books[bIdx].views || 0) + 1;
    if (req.body.userId) {
      const uIdx = db.users.findIndex(u => u.id === req.body.userId);
      if (uIdx > -1) db.users[uIdx].lastReadTitle = db.books[bIdx].title;
    }
    writeDB(db); res.json({ views: db.books[bIdx].views });
  } else res.status(404).json({ error: 'Not found' });
});
app.post('/api/books/:id/download', (req, res) => {
  const db = readDB();
  const bIdx = db.books.findIndex(b => b.id === req.params.id);
  if (bIdx > -1 && db.books[bIdx].type === 'ebook') {
    if (!db.books[bIdx].downloads) db.books[bIdx].downloads = [];
    if (!db.books[bIdx].downloads.find(d => d.userId === req.body.userId)) {
      db.books[bIdx].downloads.push({ userId: req.body.userId, userName: req.body.userName, avatar: req.body.userAvatar, timestamp: Date.now() });
      writeDB(db);
    }
    res.json(db.books[bIdx].downloads);
  } else res.status(400).json({ error: 'Bukan buku resmi' });
});
app.put('/api/books/:id', (req, res) => {
  const db = readDB();
  db.books = db.books.map(b => b.id === req.params.id ? { ...b, ...req.body } : b);
  writeDB(db); res.json({ message: 'Diupdate' });
});
app.delete('/api/books/:id', (req, res) => {
  const db = readDB(); db.books = db.books.filter(b => b.id !== req.params.id);
  writeDB(db); res.json({ message: 'Dihapus' });
});

app.post('/api/users/:id/library', (req, res) => {
  const db = readDB();
  const uIdx = db.users.findIndex(u => u.id === req.params.id);
  if (uIdx > -1) {
    if (!db.users[uIdx].favorites) db.users[uIdx].favorites = [];
    if (!db.users[uIdx].wishlist) db.users[uIdx].wishlist = [];
    const { bookId, action } = req.body;
    if (action === 'add_fav' && !db.users[uIdx].favorites.includes(bookId)) db.users[uIdx].favorites.push(bookId);
    if (action === 'remove_fav') db.users[uIdx].favorites = db.users[uIdx].favorites.filter(id => id !== bookId);
    if (action === 'add_wish' && !db.users[uIdx].wishlist.includes(bookId)) db.users[uIdx].wishlist.push(bookId);
    if (action === 'remove_wish') db.users[uIdx].wishlist = db.users[uIdx].wishlist.filter(id => id !== bookId);
    writeDB(db); res.json({ favorites: db.users[uIdx].favorites, wishlist: db.users[uIdx].wishlist });
  }
});

app.post('/api/auth/login', (req, res) => {
  const db = readDB();
  const { nisn, username, password, is_admin } = req.body;
  if (is_admin) {
    const admin = db.users.find(u => u.username === username && u.password === password && u.level === 'Admin');
    if (admin) return res.json(admin);
    return res.status(401).json({ message: 'Username/Password Admin salah!' });
  } else {
    if (!nisn) return res.status(400).json({ message: 'NISN kosong' });
    const cleanNisn = String(nisn).trim();
    const isRegistered = db.students.find(s => String(s.nisn).trim() === cleanNisn);
    if (!isRegistered) return res.status(401).json({ message: 'NISN belum terdaftar di Sistem.' });

    let student = db.users.find(u => String(u.nisn).trim() === cleanNisn);
    if (!student) {
      student = {
        id: 'std-' + Date.now(), nisn: cleanNisn, name: isRegistered.name || 'Siswa_' + cleanNisn,
        level: 'Siswa', xp: 0, readingTime: 0, grade: isRegistered.grade, subClass: isRegistered.subClass,
        avatar: '', background: '', bio: '', friends: [], friendRequests: [], favorites: [], wishlist: [],
        lastOnline: Date.now(), lastReadTitle: 'Belum ada'
      };
      db.users.push(student); writeDB(db);
    }
    res.json(student);
  }
});

app.put('/api/users/:id/profile', (req, res) => {
  const db = readDB();
  const idx = db.users.findIndex(u => u.id === req.params.id);
  if (idx > -1) { db.users[idx] = { ...db.users[idx], ...req.body }; writeDB(db); res.json(db.users[idx]); }
});

app.get('/api/users/:id/friends', (req, res) => {
  const db = readDB();
  const user = db.users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ message: 'Not found' });
  const friendsList = db.users.filter(u => (user.friends || []).includes(u.id)).map(u => ({ id: u.id, name: u.name, nisn: u.nisn, avatar: u.avatar, xp: u.xp, level: Math.floor((u.xp || 0) / 100) + 1, online: isOnline(u.lastOnline) }));
  const requestsList = db.users.filter(u => (user.friendRequests || []).includes(u.id)).map(u => ({ id: u.id, name: u.name, nisn: u.nisn, avatar: u.avatar }));
  res.json({ friends: friendsList, requests: requestsList });
});
app.post('/api/friends/request', (req, res) => {
  const db = readDB();
  const targetUser = db.users.find(u => String(u.nisn).trim() === String(req.body.targetNisn).trim() && u.level === 'Siswa');
  if (!targetUser) return res.status(404).json({ message: 'Siswa belum pernah login.' });
  if (targetUser.id === req.body.fromId) return res.status(400).json({ message: 'Masa temenan sama diri sendiri?' });
  if (!targetUser.friendRequests) targetUser.friendRequests = [];
  if ((targetUser.friends || []).includes(req.body.fromId)) return res.status(400).json({ message: 'Sudah berteman.' });
  if (targetUser.friendRequests.includes(req.body.fromId)) return res.status(400).json({ message: 'Sudah pending.' });
  targetUser.friendRequests.push(req.body.fromId); writeDB(db); res.json({ message: 'Permintaan terkirim!' });
});
app.post('/api/friends/accept', (req, res) => {
  const db = readDB();
  const user = db.users.find(u => u.id === req.body.userId);
  const requester = db.users.find(u => u.id === req.body.requesterId);
  if (user && requester) {
    user.friendRequests = user.friendRequests.filter(id => id !== req.body.requesterId);
    if (!user.friends) user.friends = []; if (!requester.friends) requester.friends = [];
    user.friends.push(req.body.requesterId); requester.friends.push(req.body.userId);
    writeDB(db); res.json({ message: 'Diterima.' });
  }
});

// --- CHAT SYSTEM (DIPERBAIKI) ---
app.get('/api/chats/:id1/:id2', (req, res) => {
  const db = readDB();
  if (!db.chats) { db.chats = []; writeDB(db); }
  const { id1, id2 } = req.params;
  let chat = db.chats.find(c => c.participants.includes(id1) && c.participants.includes(id2));
  if (!chat) { chat = { id: `chat-${Date.now()}`, participants: [id1, id2], messages: [] }; db.chats.push(chat); writeDB(db); }
  res.json(chat);
});

// Kirim Pesan (Mendukung Type Text & GIF)
app.post('/api/chats/:id1/:id2', (req, res) => {
  const db = readDB();
  const { id1, id2 } = req.params;
  let chat = db.chats.find(c => c.participants.includes(id1) && c.participants.includes(id2));
  if (!chat) { chat = { id: `chat-${Date.now()}`, participants: [id1, id2], messages: [] }; db.chats.push(chat); }

  chat.messages.push({
    senderId: req.body.senderId,
    text: req.body.text,
    type: req.body.type || 'text', // text atau gif
    status: 'sent',                // sent atau read
    isEdited: false,
    timestamp: Date.now()
  });
  writeDB(db); res.json(chat);
});

// Edit Pesan
app.put('/api/chats/:id1/:id2/:timestamp', (req, res) => {
  const db = readDB();
  const { id1, id2, timestamp } = req.params;
  const { newText } = req.body;
  let chat = db.chats.find(c => c.participants.includes(id1) && c.participants.includes(id2));
  if (chat) {
    const msg = chat.messages.find(m => m.timestamp.toString() === timestamp);
    if (msg) {
      msg.text = newText;
      msg.isEdited = true;
      writeDB(db);
      res.json(chat);
    } else res.status(404).json({ error: 'Message not found' });
  } else res.status(404).json({ error: 'Chat not found' });
});

// Tandai Chat Telah Dibaca (Read Receipts)
app.post('/api/chats/:id1/:id2/read', (req, res) => {
  const db = readDB();
  const { id1, id2 } = req.params;
  const { readerId } = req.body;
  let chat = db.chats.find(c => c.participants.includes(id1) && c.participants.includes(id2));
  if (chat) {
    let updated = false;
    chat.messages.forEach(m => {
      if (m.senderId !== readerId && m.status !== 'read') {
        m.status = 'read';
        updated = true;
      }
    });
    if (updated) writeDB(db);
    res.json(chat);
  } else {
    res.status(404).json({ error: 'Chat not found' });
  }
});

app.delete('/api/chats/:id1/:id2/:timestamp', (req, res) => {
  const db = readDB();
  const chat = db.chats.find(c => c.participants.includes(req.params.id1) && c.participants.includes(req.params.id2));
  if (chat) {
    chat.messages = chat.messages.filter(m => m.timestamp.toString() !== req.params.timestamp);
    writeDB(db); res.json({ success: true });
  } else res.status(404).json({ error: 'Chat not found' });
});

app.get('/api/students', (req, res) => res.json(readDB().students));
app.post('/api/students/bulk', (req, res) => {
  const db = readDB();
  req.body.students.forEach(s => {
    const cleanNisn = String(s.nisn).trim();
    if (!db.students.find(st => String(st.nisn).trim() === cleanNisn)) db.students.push({ ...s, nisn: cleanNisn });
  });
  writeDB(db); res.json({ message: 'Terdaftar' });
});
app.put('/api/students/:oldNisn', (req, res) => {
  const db = readDB();
  const sIdx = db.students.findIndex(s => s.nisn === req.params.oldNisn);
  if (sIdx > -1) {
    db.students[sIdx] = { nisn: req.body.nisn, name: req.body.name, grade: req.body.grade, subClass: req.body.subClass };
    const uIdx = db.users.findIndex(u => u.nisn === req.params.oldNisn);
    if (uIdx > -1) {
      db.users[uIdx].nisn = req.body.nisn; db.users[uIdx].name = req.body.name;
      db.users[uIdx].grade = req.body.grade; db.users[uIdx].subClass = req.body.subClass;
    }
    writeDB(db); res.json(db.students[sIdx]);
  } else res.status(404).json({ error: 'Not found' });
});
app.delete('/api/students/:nisn', (req, res) => {
  const db = readDB();
  const cleanNisn = String(req.params.nisn).trim();
  db.students = db.students.filter(st => String(st.nisn).trim() !== cleanNisn);
  db.users = db.users.filter(u => String(u.nisn).trim() !== cleanNisn);
  writeDB(db); res.json({ message: 'Dihapus' });
});

app.listen(PORT, '0.0.0.0', () => console.log(`🚀 SERVER V8.4 AKTIF DI PORT ${PORT}`));