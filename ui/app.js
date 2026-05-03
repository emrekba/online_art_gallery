// ===== DATA =====
let artists = [];
let artworks = [];
let events = [];

const tickets = [
  { id:1, user:'Mehmet Yılmaz', subject:'Ödeme sorunu', date:'02.05.2026', status:'Open' },
  { id:2, user:'Fatma Öztürk', subject:'Rezervasyon iptali', date:'01.05.2026', status:'Closed' },
  { id:3, user:'Ali Koç', subject:'Eser hasarlı geldi', date:'30.04.2026', status:'Open' },
  { id:4, user:'Selin Aydın', subject:'Kargo takibi', date:'29.04.2026', status:'Closed' },
  { id:5, user:'Hasan Çelik', subject:'İndirim kodu', date:'28.04.2026', status:'Open' },
];

const API_URL = 'http://127.0.0.1:5000/api';

async function fetchInitialData() {
  try {
    const [artistsRes, artworksRes, eventsRes] = await Promise.all([
      fetch(`${API_URL}/artists`),
      fetch(`${API_URL}/artworks`),
      fetch(`${API_URL}/events`)
    ]);
    
    const rawArtists = await artistsRes.json();
    artists = rawArtists.map(a => ({
        id: a.ArtistID, name: a.Name, bio: a.Biography, color: a.ProfileImage
    }));
    
    const rawArtworks = await artworksRes.json();
    artworks = rawArtworks.map(a => ({
      id: a.ArtworkID, artistId: a.ArtistID, title: a.Title, category: a.Category,
      price: a.Price, status: a.StockStatus, rating: 4.8, reviews: 24, likes: 142, gradient: a.ImageURL
    }));
    
    const rawEvents = await eventsRes.json();
    events = rawEvents.map(e => {
      const d = new Date(e.EventDate);
      const months = ['OCA','ŞUB','MAR','NİS','MAY','HAZ','TEM','AĞU','EYL','EKİ','KAS','ARA'];
      // Basit bir eşleştirme (Type sütunu DB'de yoksa başlığa göre ayarla)
      const type = e.Title.includes('Sergi') ? 'Sergi' : (e.Title.includes('Workshop') ? 'Workshop' : 'Atölye');
      const colors = ['linear-gradient(135deg,#1a0533,#a855f7)', 'linear-gradient(135deg,#0c4a6e,#22d3ee)', 'linear-gradient(135deg,#78350f,#f59e0b)'];
      return {
        id: e.EventID, title: e.Title, description: e.Description, date: e.EventDate,
        day: d.getDate().toString().padStart(2, '0'), month: months[d.getMonth()],
        capacity: e.Capacity, registered: Math.floor(e.Capacity * 0.7), price: e.Price,
        type: type, gradient: colors[e.EventID % 3], rating: 4.7, reservations: Math.floor(e.Capacity * 0.7)
      };
    });
    
    renderHome();
    renderAdmin();
  } catch(err) {
    console.error("Backend bağlantı hatası:", err);
    showToast("Sunucuya bağlanılamadı! Lütfen backend'i çalıştırın.", "error");
  }
}


// ===== STATE =====
let state = { page:'home', catFilter:'Tümü', evtFilter:'Tümü', artSearch:'', evtSearch:'', favorites:new Set(), loggedIn:false, user:null };
let currentCheckoutArtwork = null;

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
  if (page === 'profile') loadProfile();
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
    <div style="margin-bottom:20px; display:flex; align-items:center; gap:12px; background:var(--bg3); padding:10px; border-radius:8px;">
        <label>Katılımcı Sayısı:</label>
        <input type="number" id="res-count" value="1" min="1" max="${e.capacity - e.registered}" style="width:60px; padding:4px; border-radius:4px; border:1px solid var(--border); background:var(--bg2); color:white;">
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
async function toggleFav(e, id) {
  e.stopPropagation();
  if (!state.loggedIn) { showToast('Favorilere eklemek için giriş yapmalısınız', 'error'); return; }
  
  if (state.favorites.has(id)) { 
      try {
          const res = await fetch(`${API_URL}/favorites/${state.user.id}/${id}`, {method: 'DELETE'});
          if(res.ok) {
              state.favorites.delete(id); 
              showToast('Favorilerden çıkarıldı', 'error'); 
          }
      } catch(err) { return; }
  } else { 
      try {
          const res = await fetch(`${API_URL}/favorites`, {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({user_id: state.user.id, artwork_id: id})
          });
          if(res.ok) {
              state.favorites.add(id); 
              showToast('Favorilere eklendi ♥', 'success'); 
          }
      } catch(err) { return; }
  }
  
  renderArtworks(); renderHome(); renderFavoritesList();
  
  // update modal button if open
  const favBtn = document.getElementById('fav-btn-' + id);
  if (favBtn) { const liked = state.favorites.has(id); favBtn.textContent = liked ? '♥ Favorilerde' : '♡ Favoriye Ekle'; }
}

function buyArtwork(id) {
  if (!state.loggedIn) { closeModal('artwork-modal'); openLoginModal(); return; }
  const a = artworks.find(x => x.id === id);
  if (a) {
      currentCheckoutArtwork = a;
      document.getElementById('checkout-summary').innerHTML = `
        <h4>${a.title}</h4>
        <p style="color:var(--text2); margin-top:4px">Kategori: ${a.category}</p>
        <p style="margin-top:12px; font-size:1.2rem;">Toplam Tutar: <strong style="color:var(--gold)">₺${a.price.toLocaleString('tr-TR')}</strong></p>
      `;
      closeModal('artwork-modal');
      document.getElementById('checkout-modal').classList.add('open');
  }
}

async function reserveEvent(id) {
  if (!state.loggedIn) { closeModal('event-modal'); openLoginModal(); return; }
  const e = events.find(x => x.id === id);
  const countInput = document.getElementById('res-count');
  const count = countInput ? parseInt(countInput.value) : 1;
  
  if(!count || count < 1) return;
  
  if (e && e.registered + count <= e.capacity) {
      try {
          const res = await fetch(`${API_URL}/reservations`, {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({ user_id: state.user.id, event_id: e.id, participant_count: count })
          });
          const data = await res.json();
          if(data.success) {
              e.registered += count;
              showToast(`"${e.title}" için ${count} kişilik rezervasyon yapıldı! ✓`, 'success');
              closeModal('event-modal');
              renderEvents(); renderHome();
          } else {
              showToast(data.message, 'error');
          }
      } catch(err) {
          showToast('Rezervasyon başarısız. Sunucu hatası.', 'error');
      }
  } else {
      showToast('Yeterli kontenjan yok!', 'error');
  }
}

// ===== AUTH =====
function openLoginModal() { document.getElementById('login-modal').classList.add('open'); }

async function doLogin() {
  const email = document.getElementById('login-email').value;
  const pass = document.getElementById('login-password').value;
  if (!email || !pass) { showToast('Lütfen tüm alanları doldurun', 'error'); return; }
  
  try {
      const res = await fetch(`${API_URL}/login`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({email, password: pass})
      });
      const data = await res.json();
      
      if (data.success) {
          state.loggedIn = true;
          state.user = data.user;
          document.getElementById('btn-login').textContent = state.user.name;
          document.getElementById('btn-register').textContent = 'Çıkış';
          document.getElementById('nav-item-profile').style.display = 'inline-block';
          closeModal('login-modal');
          showToast(`Hoş geldiniz, ${state.user.name}! ✓`, 'success');
          loadFavorites();
      } else {
          showToast(data.message, 'error');
      }
  } catch(err) {
      showToast('Giriş başarısız, sunucuya ulaşılamıyor.', 'error');
  }
}

async function doSignup() {
  const name = document.getElementById('signup-name').value;
  const email = document.getElementById('signup-email').value;
  const pass = document.getElementById('signup-password').value;
  if (!name || !email || !pass) { showToast('Lütfen tüm alanları doldurun', 'error'); return; }
  
  try {
      const res = await fetch(`${API_URL}/register`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({name, email, password: pass})
      });
      const data = await res.json();
      
      if (data.success) {
          state.loggedIn = true;
          state.user = data.user;
          document.getElementById('btn-login').textContent = data.user.name;
          document.getElementById('btn-register').textContent = 'Çıkış';
          document.getElementById('nav-item-profile').style.display = 'inline-block';
          closeModal('login-modal');
          showToast(`Kayıt başarılı, hoş geldiniz ${data.user.name}! ✓`, 'success');
          loadFavorites();
      } else {
          showToast(data.message, 'error');
      }
  } catch(err) {
      showToast('Kayıt başarısız, sunucuya ulaşılamıyor.', 'error');
  }
}

// ===== TOAST =====
function showToast(msg, type = 'success') {
  const c = document.getElementById('toast-container');
  const t = document.createElement('div');
  t.className = `toast ${type}`; t.textContent = msg; c.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateY(20px)'; t.style.transition = '.3s'; setTimeout(() => t.remove(), 300); }, 2500);
}

// ===== PROFILE SYSTEM =====
async function loadProfile() {
    if(!state.loggedIn) return;
    try {
        const res = await fetch(`${API_URL}/profile/${state.user.id}`);
        const data = await res.json();
        if(data.success) {
            document.getElementById('prof-email').value = data.user.Email;
            document.getElementById('prof-name').value = data.user.FullName;
            
            // Render orders
            const ordersHtml = data.orders.map(o => `
                <div style="background:var(--bg3); padding:16px; border-radius:8px; display:flex; justify-content:space-between;">
                    <div>
                        <h4 style="margin:0 0 8px 0">${o.ArtworkTitle}</h4>
                        <span style="color:var(--text2); font-size:0.85rem;">Tarih: ${o.OrderDate.split(' ')[0]} | Yöntem: ${o.PaymentMethod}</span>
                    </div>
                    <div style="text-align:right;">
                        <span style="font-weight:bold; color:var(--gold);">₺${o.TotalAmount.toLocaleString('tr-TR')}</span>
                        <br><span style="font-size:0.8rem; padding:2px 8px; border-radius:4px; background:rgba(34,197,94,0.2); color:#4ade80;">${o.Status}</span>
                    </div>
                </div>
            `).join('');
            document.getElementById('profile-orders-list').innerHTML = ordersHtml || '<p style="color:var(--text3)">Henüz siparişiniz bulunmamaktadır.</p>';
            
            // Render reservations
            const resHtml = data.reservations.map(r => `
                <div style="background:var(--bg3); padding:16px; border-radius:8px; display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <h4 style="margin:0 0 8px 0">${r.EventTitle}</h4>
                        <span style="color:var(--text2); font-size:0.85rem;">Kayıt Tarihi: ${r.CreatedAt.split(' ')[0]} | Kişi: ${r.ParticipantCount}</span>
                    </div>
                    <div style="text-align:right;">
                        <span style="font-weight:bold; color:var(--gold);">₺${r.TotalPrice.toLocaleString('tr-TR')}</span>
                        <br>
                        ${r.Status === 'Active' 
                            ? `<button class="btn-outline" style="padding:4px 8px; font-size:0.8rem; margin-top:8px; color:#ef4444; border-color:#ef4444" onclick="cancelReservation(${r.ReservationID})">İptal Et</button>`
                            : `<span style="font-size:0.8rem; padding:2px 8px; border-radius:4px; background:rgba(239,68,68,0.2); color:#ef4444;">İptal Edildi</span>`
                        }
                    </div>
                </div>
            `).join('');
            document.getElementById('profile-reservations-list').innerHTML = resHtml || '<p style="color:var(--text3)">Rezervasyonunuz bulunmamaktadır.</p>';
        }
    } catch(err) { console.error(err); }
}

async function updateProfile() {
    const name = document.getElementById('prof-name').value;
    const pass = document.getElementById('prof-pass').value;
    try {
        const res = await fetch(`${API_URL}/profile/${state.user.id}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({name: name, password: pass})
        });
        const data = await res.json();
        if(data.success) {
            showToast('Profil başarıyla güncellendi.', 'success');
            state.user.name = name;
            document.getElementById('btn-login').textContent = name;
            document.getElementById('prof-pass').value = ''; // clear password field
        }
    } catch(err) { showToast('Güncelleme başarısız.', 'error'); }
}

async function cancelReservation(resId) {
    if(!confirm('Bu rezervasyonu iptal etmek istediğinize emin misiniz?')) return;
    try {
        const res = await fetch(`${API_URL}/reservations/${resId}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({action: 'cancel'})
        });
        const data = await res.json();
        if(data.success) {
            showToast('Rezervasyon iptal edildi.', 'success');
            loadProfile(); // refresh list
        }
    } catch(err) {}
}

async function loadFavorites() {
    if(!state.loggedIn) return;
    try {
        const res = await fetch(`${API_URL}/favorites/${state.user.id}`);
        const data = await res.json();
        if(data.success) {
            state.favorites = new Set(data.favorites);
            renderArtworks(); renderHome();
            renderFavoritesList();
        }
    } catch(e) {}
}

function renderFavoritesList() {
    const list = artworks.filter(a => state.favorites.has(a.id));
    document.getElementById('profile-favorites-grid').innerHTML = list.length 
        ? list.map(a => artworkCard(a)).join('') 
        : '<p style="color:var(--text3)">Henüz favori eseriniz bulunmuyor.</p>';
}

function doLogout() {
    state.loggedIn = false; state.user = null; 
    state.favorites.clear();
    document.getElementById('btn-login').textContent = 'Giriş Yap'; 
    document.getElementById('btn-register').textContent = 'Kayıt Ol'; 
    document.getElementById('nav-item-profile').style.display = 'none';
    if(state.page === 'profile') navigate('home');
    renderArtworks(); renderHome();
    showToast('Çıkış yapıldı', 'error');
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  // Fetch data before rendering
  fetchInitialData();

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
    if (state.loggedIn) { navigate('profile'); return; }
    openLoginModal();
  });
  document.getElementById('btn-register').addEventListener('click', () => {
    if (state.loggedIn) { doLogout(); return; }
    openLoginModal();
  });

  // Modal closes
  document.getElementById('artwork-modal-close').addEventListener('click', () => closeModal('artwork-modal'));
  document.getElementById('event-modal-close').addEventListener('click', () => closeModal('event-modal'));
  document.getElementById('login-modal-close').addEventListener('click', () => closeModal('login-modal'));
  document.getElementById('checkout-modal-close').addEventListener('click', () => closeModal('checkout-modal'));
  document.querySelectorAll('.modal-overlay').forEach(m => m.addEventListener('click', e => { if (e.target === m) m.classList.remove('open'); }));

  // Checkout confirm
  document.getElementById('btn-confirm-checkout').addEventListener('click', async () => {
      if(!currentCheckoutArtwork) return;
      const method = document.getElementById('checkout-method').value;
      const btn = document.getElementById('btn-confirm-checkout');
      btn.textContent = 'İşleniyor...'; btn.disabled = true;
      
      try {
          const res = await fetch(`${API_URL}/orders`, {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({
                  user_id: state.user.id,
                  artwork_id: currentCheckoutArtwork.id,
                  payment_method: method
              })
          });
          const data = await res.json();
          if(data.success) {
              showToast(`"${currentCheckoutArtwork.title}" satın alındı! ✓`, 'success');
              currentCheckoutArtwork.status = 'Sold';
              closeModal('checkout-modal');
              renderArtworks(); renderHome();
          } else {
              showToast(data.message, 'error');
          }
      } catch(err) {
          showToast('İşlem başarısız.', 'error');
      } finally {
          btn.textContent = 'Ödemeyi Tamamla'; btn.disabled = false;
      }
  });

  // Profile tabs
  document.querySelectorAll('.profile-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
          document.querySelectorAll('.profile-tab').forEach(t => {
              t.classList.remove('active');
              t.style.background = 'transparent'; t.style.border = '1px solid var(--border)'; t.style.color = 'var(--text2)';
          });
          e.target.classList.add('active');
          e.target.style.background = 'var(--bg3)'; e.target.style.border = 'none'; e.target.style.color = 'var(--text1)';
          
          document.querySelectorAll('.ptab-content').forEach(c => c.style.display = 'none');
          document.getElementById('ptab-' + e.target.dataset.ptab).style.display = 'block';
      });
  });

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
