// ===== DATA =====
const artists = [
  { id:1, name:'Zeynep Arslan', bio:'Yağlı boya', color:'linear-gradient(135deg,#1a0533,#a855f7)' },
  { id:2, name:'Murat Demir', bio:'Suluboya', color:'linear-gradient(135deg,#0c4a6e,#22d3ee)' },
  { id:3, name:'Ayşe Kaya', bio:'Heykel', color:'linear-gradient(135deg,#78350f,#f59e0b)' },
  { id:4, name:'Can Yıldız', bio:'Dijital', color:'linear-gradient(135deg,#064e3b,#10b981)' },
  { id:5, name:'Elif Şahin', bio:'Fotoğraf', color:'linear-gradient(135deg,#1e1b4b,#6366f1)' },
];

const artworks = [
  { id:1, artistId:1, title:"Boğaz'da Gün Batımı", category:'Yağlı Boya', price:18500, status:'Available', rating:4.8, reviews:24, likes:142, gradient:'linear-gradient(135deg,#1a0533,#4a1a8a,#c2410c,#fbbf24)' },
  { id:2, artistId:2, title:'Mavi Rüya', category:'Suluboya', price:4200, status:'Available', rating:4.5, reviews:18, likes:89, gradient:'linear-gradient(135deg,#0c4a6e,#22d3ee,#a7f3d0)' },
  { id:3, artistId:3, title:'Toprak Ana', category:'Heykel', price:31000, status:'Sold', rating:4.9, reviews:31, likes:203, gradient:'linear-gradient(135deg,#78350f,#d97706,#fef3c7)' },
  { id:4, artistId:4, title:'Dijital Kaos', category:'Dijital', price:2800, status:'Available', rating:4.3, reviews:12, likes:67, gradient:'linear-gradient(135deg,#064e3b,#10b981,#d1fae5)' },
  { id:5, artistId:5, title:'İstanbul Sisli', category:'Fotoğraf', price:6500, status:'Available', rating:4.7, reviews:22, likes:118, gradient:'linear-gradient(135deg,#1e1b4b,#6366f1,#e0e7ff)' },
  { id:6, artistId:1, title:'Kızıl Orman', category:'Yağlı Boya', price:22000, status:'Available', rating:4.6, reviews:19, likes:97, gradient:'linear-gradient(135deg,#450a0a,#dc2626,#fca5a5)' },
  { id:7, artistId:2, title:'Yağmur Sonrası', category:'Suluboya', price:3800, status:'Available', rating:4.4, reviews:15, likes:74, gradient:'linear-gradient(135deg,#1e3a5f,#3b82f6,#bfdbfe)' },
  { id:8, artistId:3, title:'Sonsuzluk', category:'Heykel', price:45000, status:'Sold', rating:5.0, reviews:41, likes:312, gradient:'linear-gradient(135deg,#2d1b69,#8b5cf6,#ede9fe)' },
];

const events = [
  { id:1, title:'Yağlı Boya Atölyesi', description:'Başlangıç seviyesi yağlı boya teknikleri. Malzemeler dahildir.', date:'2026-05-15', day:'15', month:'MAY', capacity:20, registered:17, price:450, type:'Atölye', gradient:'linear-gradient(135deg,#1a0533,#a855f7)', rating:4.8, reservations:17 },
  { id:2, title:'Modern Sanat Sergisi', description:'Çağdaş Türk sanatçıların en güncel eserlerinin buluşma noktası.', date:'2026-05-20', day:'20', month:'MAY', capacity:200, registered:143, price:120, type:'Sergi', gradient:'linear-gradient(135deg,#0c4a6e,#22d3ee)', rating:4.6, reservations:143 },
  { id:3, title:'Suluboya Workshop', description:'Profesyonel suluboya teknikleriyle renk ve doku çalışmaları.', date:'2026-06-02', day:'02', month:'HAZ', capacity:15, registered:15, price:380, type:'Workshop', gradient:'linear-gradient(135deg,#064e3b,#10b981)', rating:4.9, reservations:15 },
  { id:4, title:'Heykel Temel Kurs', description:'Kil ile heykel yapımının temelleri. 3 haftalık yoğun program.', date:'2026-06-10', day:'10', month:'HAZ', capacity:12, registered:8, price:1200, type:'Atölye', gradient:'linear-gradient(135deg,#78350f,#f59e0b)', rating:4.7, reservations:8 },
  { id:5, title:'Fotoğraf & Sanat', description:'Sanat eserlerini fotoğrafla belgeleme ve dijital arşivleme teknikleri.', date:'2026-06-18', day:'18', month:'HAZ', capacity:25, registered:11, price:280, type:'Workshop', gradient:'linear-gradient(135deg,#1e1b4b,#6366f1)', rating:4.5, reservations:11 },
  { id:6, title:'Dijital İllüstrasyon', description:'Tablet ile dijital sanat üretimi. Procreate ve Adobe Fresco eğitimi.', date:'2026-07-05', day:'05', month:'TEM', capacity:18, registered:6, price:650, type:'Atölye', gradient:'linear-gradient(135deg,#450a0a,#dc2626)', rating:4.4, reservations:6 },
];

const tickets = [
  { id:1, user:'Mehmet Yılmaz', subject:'Ödeme sorunu', date:'02.05.2026', status:'Open' },
  { id:2, user:'Fatma Öztürk', subject:'Rezervasyon iptali', date:'01.05.2026', status:'Closed' },
  { id:3, user:'Ali Koç', subject:'Eser hasarlı geldi', date:'30.04.2026', status:'Open' },
  { id:4, user:'Selin Aydın', subject:'Kargo takibi', date:'29.04.2026', status:'Closed' },
  { id:5, user:'Hasan Çelik', subject:'İndirim kodu', date:'28.04.2026', status:'Open' },
];

// ===== STATE =====
let state = { page:'home', catFilter:'Tümü', evtFilter:'Tümü', artSearch:'', evtSearch:'', favorites:new Set(), loggedIn:false, user:null };

// ===== NAVIGATION =====
function navigate(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  document.querySelectorAll('.nav-link').forEach(l => {
    l.classList.toggle('active', l.dataset.page === page);
  });
  state.page = page;
  window.scrollTo({ top:0, behavior:'smooth' });
  if (page === 'artworks') renderArtworks();
  if (page === 'events') renderEvents();
  if (page === 'admin') animateKPIs();
}

// ===== RENDER HOME =====
function renderHome() {
  // Featured artworks (first 4)
  const grid = document.getElementById('home-artworks-grid');
  grid.innerHTML = artworks.slice(0,4).map(a => artworkCard(a)).join('');
  // Events preview (first 3)
  const evtRow = document.getElementById('home-events-row');
  evtRow.innerHTML = events.slice(0,3).map(e => eventCard(e)).join('');
  // Artists
  document.getElementById('artists-row').innerHTML = artists.map(a => `
    <div class="artist-card">
      <div class="artist-avatar"><div class="artist-avatar-gradient" style="background:${a.color}"></div></div>
      <h4>${a.name}</h4><p>${a.bio}</p>
    </div>`).join('');
}

// ===== ARTWORK CARD =====
function artworkCard(a) {
  const artist = artists.find(ar => ar.id === a.artistId);
  const liked = state.favorites.has(a.id);
  return `<div class="artwork-card" data-id="${a.id}" onclick="openArtwork(${a.id})">
    <div class="card-image">
      <div class="artwork-gradient" style="background:${a.gradient}"></div>
      ${a.status==='Sold' ? '<span class="card-badge">SATILDI</span>' : ''}
      <button class="card-fav ${liked?'liked':''}" data-id="${a.id}" onclick="toggleFav(event,${a.id})">♥</button>
    </div>
    <div class="card-body">
      <span class="card-cat">${a.category}</span>
      <h3>${a.title}</h3>
      <p class="card-artist">${artist ? artist.name : ''}</p>
    </div>
    <div class="card-footer">
      <span class="card-price">₺${a.price.toLocaleString('tr-TR')}</span>
      <span class="card-rating"><span class="star">★</span> ${a.rating} (${a.reviews})</span>
    </div>
  </div>`;
}

// ===== EVENT CARD =====
function eventCard(e) {
  const pct = Math.round(e.registered / e.capacity * 100);
  return `<div class="event-card" onclick="openEvent(${e.id})">
    <div class="event-top">
      <div class="event-gradient" style="background:${e.gradient}"></div>
      <div class="event-date-badge"><span class="day">${e.day}</span><span class="month">${e.month}</span></div>
      <span class="event-type-badge">${e.type}</span>
    </div>
    <div class="event-body">
      <h3>${e.title}</h3>
      <p>${e.description}</p>
      <div class="event-meta">
        <span>👥 ${e.registered}/${e.capacity}</span>
        <span>★ ${e.rating}</span>
      </div>
    </div>
    <div class="event-footer">
      <span class="event-price">₺${e.price.toLocaleString('tr-TR')}</span>
      <div class="capacity-bar"><div class="capacity-fill" style="width:${pct}%"></div></div>
    </div>
  </div>`;
}

// ===== RENDER ARTWORKS PAGE =====
function renderArtworks() {
  let list = [...artworks];
  if (state.catFilter !== 'Tümü') list = list.filter(a => a.category === state.catFilter);
  if (state.artSearch) list = list.filter(a => {
    const art = artists.find(ar => ar.id === a.artistId);
    return a.title.toLowerCase().includes(state.artSearch) || (art && art.name.toLowerCase().includes(state.artSearch));
  });
  const sort = document.getElementById('artwork-sort').value;
  if (sort === 'price-asc') list.sort((a,b) => a.price - b.price);
  else if (sort === 'price-desc') list.sort((a,b) => b.price - a.price);
  else if (sort === 'rating') list.sort((a,b) => b.rating - a.rating);
  document.getElementById('artworks-main-grid').innerHTML = list.length ? list.map(a => artworkCard(a)).join('') : '<p style="color:var(--text3);padding:40px">Eser bulunamadı.</p>';
}

// ===== RENDER EVENTS PAGE =====
function renderEvents() {
  let list = [...events];
  if (state.evtFilter !== 'Tümü') list = list.filter(e => e.type === state.evtFilter);
  if (state.evtSearch) list = list.filter(e => e.title.toLowerCase().includes(state.evtSearch));
  document.getElementById('events-main-grid').innerHTML = list.length ? list.map(e => eventCard(e)).join('') : '<p style="color:var(--text3);padding:40px">Etkinlik bulunamadı.</p>';
}

// ===== ADMIN TABLES =====
function renderAdmin() {
  // Event stats
  document.getElementById('event-stats-body').innerHTML = events.map(e => {
    const pct = Math.round(e.registered / e.capacity * 100);
    return `<tr>
      <td>${e.title}</td><td>${e.capacity}</td><td>${e.registered}</td>
      <td>${pct}% <span class="progress-bar-sm"><span class="progress-fill" style="width:${pct}%"></span></span></td>
      <td><span class="star-sm">★</span> ${e.rating}</td><td>${e.reservations}</td>
    </tr>`;
  }).join('');
  // Artwork stats
  document.getElementById('artwork-stats-body').innerHTML = artworks.map(a => {
    const art = artists.find(ar => ar.id === a.artistId);
    const sc = a.status === 'Available' ? 'available' : 'sold';
    const sl = a.status === 'Available' ? 'Satışta' : 'Satıldı';
    return `<tr>
      <td>${a.title}</td><td>${art ? art.name : '-'}</td>
      <td>₺${a.price.toLocaleString('tr-TR')}</td>
      <td><span class="status-badge ${sc}">${sl}</span></td>
      <td>♥ ${a.likes}</td><td>💬 ${a.reviews}</td>
      <td><span class="star-sm">★</span> ${a.rating}</td>
    </tr>`;
  }).join('');
  // Tickets
  document.getElementById('tickets-body').innerHTML = tickets.map(t => {
    const sc = t.status === 'Open' ? 'open' : 'closed';
    return `<tr>
      <td>#${t.id}</td><td>${t.user}</td><td>${t.subject}</td><td>${t.date}</td>
      <td><span class="status-badge ${sc}">${t.status}</span></td>
    </tr>`;
  }).join('');
}

// ===== KPI ANIMATION =====
function animateKPIs() {
  document.querySelectorAll('.kpi-value[data-target]').forEach(el => {
    const target = parseInt(el.dataset.target);
    const isCurrency = el.classList.contains('kpi-currency');
    let start = 0; const dur = 1200; const step = 16;
    const inc = target / (dur / step);
    const timer = setInterval(() => {
      start = Math.min(start + inc, target);
      el.textContent = isCurrency ? '₺' + Math.round(start).toLocaleString('tr-TR') : Math.round(start).toLocaleString('tr-TR');
      if (start >= target) clearInterval(timer);
    }, step);
  });
}

// ===== HERO STAT ANIMATION =====
function animateStats() {
  document.querySelectorAll('.stat-num[data-target]').forEach(el => {
    const target = parseInt(el.dataset.target);
    let start = 0; const dur = 1500; const step = 16;
    const inc = target / (dur / step);
    const timer = setInterval(() => {
      start = Math.min(start + inc, target);
      el.textContent = Math.round(start);
      if (start >= target) clearInterval(timer);
    }, step);
  });
}

// ===== MODALS =====
function openArtwork(id) {
  const a = artworks.find(x => x.id === id);
  const artist = artists.find(ar => ar.id === a.artistId);
  const liked = state.favorites.has(id);
  document.getElementById('artwork-modal-content').innerHTML = `
    <div style="height:280px;border-radius:12px;overflow:hidden;margin-bottom:24px">
      <div style="width:100%;height:100%;background:${a.gradient}"></div>
    </div>
    <span style="font-size:.75rem;color:var(--accent);text-transform:uppercase;letter-spacing:1.5px">${a.category}</span>
    <h2 style="font-family:var(--font-display);font-size:1.8rem;margin:8px 0 4px">${a.title}</h2>
    <p style="color:var(--text2);margin-bottom:20px">Sanatçı: <strong>${artist ? artist.name : '-'}</strong></p>
    <div style="display:flex;gap:16px;align-items:center;margin-bottom:24px">
      <span style="font-size:1.6rem;font-weight:700;color:var(--gold)">₺${a.price.toLocaleString('tr-TR')}</span>
      <span style="color:var(--text2)">★ ${a.rating} · ${a.reviews} yorum</span>
      <span style="color:var(--text2)">♥ ${a.likes} beğeni</span>
    </div>
    <div style="display:flex;gap:12px">
      ${a.status === 'Available'
        ? `<button class="btn-primary" onclick="buyArtwork(${id})" id="btn-buy-${id}">🛒 Satın Al</button>`
        : `<button class="btn-primary" style="opacity:.5;cursor:not-allowed" disabled>Satıldı</button>`}
      <button class="btn-outline ${liked?'liked':''}" onclick="toggleFav(event,${id})" id="fav-btn-${id}">
        ${liked ? '♥ Favorilerde' : '♡ Favoriye Ekle'}
      </button>
    </div>`;
  document.getElementById('artwork-modal').classList.add('open');
}

function openEvent(id) {
  const e = events.find(x => x.id === id);
  const pct = Math.round(e.registered / e.capacity * 100);
  const full = e.registered >= e.capacity;
  document.getElementById('event-modal-content').innerHTML = `
    <div style="height:200px;border-radius:12px;overflow:hidden;margin-bottom:24px;position:relative">
      <div style="width:100%;height:100%;background:${e.gradient}"></div>
      <span style="position:absolute;top:12px;right:12px;background:rgba(168,85,247,.2);backdrop-filter:blur(8px);padding:4px 12px;border-radius:6px;font-size:.75rem;color:var(--accent)">${e.type}</span>
    </div>
    <h2 style="font-family:var(--font-display);font-size:1.8rem;margin-bottom:12px">${e.title}</h2>
    <p style="color:var(--text2);margin-bottom:20px;line-height:1.6">${e.description}</p>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px">
      <div style="background:var(--bg3);padding:14px;border-radius:10px">📅 <strong>Tarih</strong><br><span style="color:var(--text2)">${e.date}</span></div>
      <div style="background:var(--bg3);padding:14px;border-radius:10px">👥 <strong>Kapasite</strong><br><span style="color:var(--text2)">${e.registered}/${e.capacity} (${pct}%)</span></div>
      <div style="background:var(--bg3);padding:14px;border-radius:10px">★ <strong>Puan</strong><br><span style="color:var(--gold)">${e.rating}/5.0</span></div>
      <div style="background:var(--bg3);padding:14px;border-radius:10px">💰 <strong>Ücret</strong><br><span style="color:var(--gold)">₺${e.price.toLocaleString('tr-TR')}/kişi</span></div>
    </div>
    <div style="margin-bottom:20px">
      <div style="display:flex;justify-content:space-between;font-size:.8rem;color:var(--text2);margin-bottom:6px"><span>Doluluk Oranı</span><span>${pct}%</span></div>
      <div style="height:6px;background:var(--bg3);border-radius:4px;overflow:hidden"><div style="height:100%;width:${pct}%;background:var(--accent);border-radius:4px"></div></div>
    </div>
    ${full
      ? `<button class="btn-primary btn-full" style="opacity:.5;cursor:not-allowed" disabled>Kontenjan Doldu</button>`
      : `<button class="btn-primary btn-full" onclick="reserveEvent(${id})" id="btn-reserve-${id}">📅 Rezervasyon Yap</button>`}`;
  document.getElementById('event-modal').classList.add('open');
}

function closeModal(id) { document.getElementById(id).classList.remove('open'); }

// ===== ACTIONS =====
function toggleFav(e, id) {
  e.stopPropagation();
  if (state.favorites.has(id)) { state.favorites.delete(id); showToast('Favorilerden çıkarıldı', 'error'); }
  else { state.favorites.add(id); showToast('Favorilere eklendi ♥', 'success'); }
  renderArtworks(); renderHome();
  // update modal button if open
  const favBtn = document.getElementById('fav-btn-' + id);
  if (favBtn) { const liked = state.favorites.has(id); favBtn.textContent = liked ? '♥ Favorilerde' : '♡ Favoriye Ekle'; }
}

function buyArtwork(id) {
  if (!state.loggedIn) { closeModal('artwork-modal'); openLoginModal(); return; }
  const a = artworks.find(x => x.id === id);
  if (a) { a.status = 'Sold'; showToast(`"${a.title}" satın alındı! ✓`, 'success'); closeModal('artwork-modal'); renderArtworks(); renderHome(); }
}

function reserveEvent(id) {
  if (!state.loggedIn) { closeModal('event-modal'); openLoginModal(); return; }
  const e = events.find(x => x.id === id);
  if (e && e.registered < e.capacity) { e.registered++; showToast(`"${e.title}" için rezervasyon oluşturuldu! ✓`, 'success'); closeModal('event-modal'); renderEvents(); renderHome(); }
}

// ===== AUTH =====
function openLoginModal() { document.getElementById('login-modal').classList.add('open'); }

function doLogin() {
  const email = document.getElementById('login-email').value;
  const pass = document.getElementById('login-password').value;
  if (!email || !pass) { showToast('Lütfen tüm alanları doldurun', 'error'); return; }
  state.loggedIn = true;
  state.user = { email, name: email.split('@')[0] };
  document.getElementById('btn-login').textContent = state.user.name;
  document.getElementById('btn-register').textContent = 'Çıkış';
  closeModal('login-modal');
  showToast(`Hoş geldiniz, ${state.user.name}! ✓`, 'success');
}

function doSignup() {
  const name = document.getElementById('signup-name').value;
  const email = document.getElementById('signup-email').value;
  const pass = document.getElementById('signup-password').value;
  if (!name || !email || !pass) { showToast('Lütfen tüm alanları doldurun', 'error'); return; }
  state.loggedIn = true;
  state.user = { email, name };
  document.getElementById('btn-login').textContent = name;
  document.getElementById('btn-register').textContent = 'Çıkış';
  closeModal('login-modal');
  showToast(`Kayıt başarılı, hoş geldiniz ${name}! ✓`, 'success');
}

// ===== TOAST =====
function showToast(msg, type = 'success') {
  const c = document.getElementById('toast-container');
  const t = document.createElement('div');
  t.className = `toast ${type}`; t.textContent = msg; c.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateY(20px)'; t.style.transition = '.3s'; setTimeout(() => t.remove(), 300); }, 2500);
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  renderHome();
  renderAdmin();

  // Navbar scroll
  window.addEventListener('scroll', () => {
    document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 40);
  });

  // Nav links
  document.querySelectorAll('[data-page]').forEach(el => {
    el.addEventListener('click', e => { e.preventDefault(); navigate(el.dataset.page); });
  });
  document.querySelectorAll('[data-goto]').forEach(el => {
    el.addEventListener('click', () => navigate(el.dataset.goto));
  });

  // Hamburger
  document.getElementById('hamburger').addEventListener('click', () => {
    document.getElementById('nav-links').classList.toggle('open');
    document.querySelector('.nav-actions').classList.toggle('open');
  });

  // Auth buttons
  document.getElementById('btn-login').addEventListener('click', () => {
    if (state.loggedIn) { state.loggedIn = false; state.user = null; document.getElementById('btn-login').textContent = 'Giriş Yap'; document.getElementById('btn-register').textContent = 'Kayıt Ol'; showToast('Çıkış yapıldı', 'error'); return; }
    openLoginModal();
  });
  document.getElementById('btn-register').addEventListener('click', () => {
    if (state.loggedIn) { state.loggedIn = false; state.user = null; document.getElementById('btn-login').textContent = 'Giriş Yap'; document.getElementById('btn-register').textContent = 'Kayıt Ol'; showToast('Çıkış yapıldı', 'error'); return; }
    openLoginModal();
  });

  // Modal closes
  document.getElementById('artwork-modal-close').addEventListener('click', () => closeModal('artwork-modal'));
  document.getElementById('event-modal-close').addEventListener('click', () => closeModal('event-modal'));
  document.getElementById('login-modal-close').addEventListener('click', () => closeModal('login-modal'));
  document.querySelectorAll('.modal-overlay').forEach(m => m.addEventListener('click', e => { if (e.target === m) m.classList.remove('open'); }));

  // Auth tabs
  document.getElementById('tab-login').addEventListener('click', () => {
    document.getElementById('tab-login').classList.add('active'); document.getElementById('tab-signup').classList.remove('active');
    document.getElementById('form-login').classList.remove('hidden'); document.getElementById('form-signup').classList.add('hidden');
  });
  document.getElementById('tab-signup').addEventListener('click', () => {
    document.getElementById('tab-signup').classList.add('active'); document.getElementById('tab-login').classList.remove('active');
    document.getElementById('form-signup').classList.remove('hidden'); document.getElementById('form-login').classList.add('hidden');
  });
  document.getElementById('submit-login').addEventListener('click', doLogin);
  document.getElementById('submit-signup').addEventListener('click', doSignup);

  // Category filters
  document.getElementById('category-filters').addEventListener('click', e => {
    if (!e.target.classList.contains('chip')) return;
    document.querySelectorAll('#category-filters .chip').forEach(c => c.classList.remove('active'));
    e.target.classList.add('active');
    state.catFilter = e.target.dataset.cat;
    renderArtworks();
  });

  // Event type filters
  document.getElementById('event-type-filters').addEventListener('click', e => {
    if (!e.target.classList.contains('chip')) return;
    document.querySelectorAll('#event-type-filters .chip').forEach(c => c.classList.remove('active'));
    e.target.classList.add('active');
    state.evtFilter = e.target.dataset.type;
    renderEvents();
  });

  // Sort & search
  document.getElementById('artwork-sort').addEventListener('change', renderArtworks);
  document.getElementById('artwork-search').addEventListener('input', e => { state.artSearch = e.target.value.toLowerCase(); renderArtworks(); });
  document.getElementById('event-search').addEventListener('input', e => { state.evtSearch = e.target.value.toLowerCase(); renderEvents(); });

  // Animate hero stats
  animateStats();
});
