// ===== DATA =====
let artists = [];
let artworks = [];
let events = [];

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
        baseCapacity: e.Capacity, capacity: e.Capacity * 21, registered: e.RegisteredCount || 0, price: e.Price,
        type: type, gradient: colors[e.EventID % 3], rating: 4.7, reservations: e.RegisteredCount || 0
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
let currentCheckoutType = 'artwork'; // 'artwork' | 'event'
let currentCheckoutReservationData = null;
let appliedCoupon = null;
let specialOffer = null;

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
        <span>👥 ${e.registered}/${e.capacity} (3 gün × 7 saat)</span>
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
async function renderAdmin() {
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
    return `<tr>
      <td>${a.title}</td><td>${art ? art.name : '-'}</td>
      <td>₺${a.price.toLocaleString('tr-TR')}</td>
      <td><span class="status-badge available">Satışta</span></td>
      <td>♥ ${a.likes}</td><td>💬 ${a.reviews}</td>
      <td><span class="star-sm">★</span> ${a.rating}</td>
    </tr>`;
  }).join('');
  
  // Tickets
  try {
      const res = await fetch(`${API_URL}/tickets`);
      const data = await res.json();
      if(data.success) {
          document.getElementById('tickets-body').innerHTML = data.tickets.map(t => {
            const sc = t.Status === 'Open' ? 'open' : 'closed';
            return `<tr>
              <td>#${t.TicketID}</td><td>${t.UserName}</td><td>${t.Subject}</td><td>${t.CreatedAt.split(' ')[0]}</td>
              <td><span class="status-badge ${sc}">${t.Status}</span></td>
              <td>
                  ${t.Status === 'Open' ? `<button class="btn-outline" style="padding:4px 8px; font-size:0.8rem;" onclick="openTicketResponseModal(${t.TicketID}, '${t.Subject.replace(/'/g,"\\'").replace(/"/g,"&quot;")}', '${t.Message.replace(/'/g,"\\'").replace(/"/g,"&quot;")}')">Yanıtla</button>` : `<span style="font-size:0.8rem; color:var(--text3);">Yanıtlandı</span>`}
              </td>
            </tr>`;
          }).join('');
      }
  } catch(e) {}
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
let currentOpenArtworkId = null;

function openArtwork(id) {
  const a = artworks.find(x => x.id === id);
  const artist = artists.find(ar => ar.id === a.artistId);
  const liked = state.favorites.has(id);
  currentOpenArtworkId = id;
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
      <button class="btn-primary" onclick="buyArtwork(${id})" id="btn-buy-${id}">🛒 Satın Al</button>
      <button class="btn-outline ${liked?'liked':''}" onclick="toggleFav(event,${id})" id="fav-btn-${id}">
        ${liked ? '♥ Favorilerde' : '♡ Favoriye Ekle'}
      </button>
    </div>
    <div id="artwork-comments-section" style="margin-top:32px;border-top:1px solid var(--border);padding-top:24px">
      <div id="artwork-comments-loading" style="color:var(--text3);font-size:.9rem">Yorumlar yükleniyor...</div>
    </div>`;
  document.getElementById('artwork-modal').classList.add('open');
  loadArtworkComments(id);
}

async function loadArtworkComments(artworkId) {
  const section = document.getElementById('artwork-comments-section');
  if (!section) return;
  try {
    const res = await fetch(`${API_URL}/comments/artwork/${artworkId}`);
    const data = await res.json();
    if (!data.success) throw new Error('fetch failed');

    const a = artworks.find(x => x.id === artworkId);
    if (a && data.count > 0) {
      a.rating = data.average;
      a.reviews = data.count;
    }

    const avgStars = '★'.repeat(Math.round(data.average)) + '☆'.repeat(5 - Math.round(data.average));
    const headerHtml = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;flex-wrap:wrap;gap:12px">
        <div>
          <h3 style="margin:0 0 4px 0;font-family:var(--font-display);font-size:1.3rem">💬 Yorumlar (${data.count})</h3>
          <div style="color:var(--gold);font-size:1rem">${avgStars} <span style="color:var(--text2);font-size:.9rem">${data.average || '—'}/5.0</span></div>
        </div>
        <button class="btn-outline" onclick="openCommentModal(${artworkId})" style="padding:8px 14px;font-size:.85rem">✍️ Yorum Yap</button>
      </div>
    `;

    let listHtml = '';
    if (data.comments.length === 0) {
      listHtml = `<p style="color:var(--text3);font-size:.9rem;text-align:center;padding:20px">
        Henüz yorum yok. Eseri satın aldıysanız ilk yorumu siz yapın!
      </p>`;
    } else {
      listHtml = data.comments.map(c => {
        const stars = c.Rating ? ('★'.repeat(c.Rating) + '☆'.repeat(5 - c.Rating)) : '';
        const dateStr = c.CreatedAt ? c.CreatedAt.split(' ')[0] : '';
        const initials = (c.UserName || '?').split(' ').map(s => s[0]).slice(0,2).join('').toUpperCase();
        return `
          <div style="background:var(--bg3);border:1px solid var(--border);border-radius:10px;padding:14px;margin-bottom:10px">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
              <div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,var(--accent),#ec4899);display:flex;align-items:center;justify-content:center;font-size:.75rem;font-weight:600">${initials}</div>
              <div style="flex:1">
                <div style="font-weight:600;font-size:.9rem">
                  ${c.UserName}
                  ${c.Verified ? '<span style="margin-left:6px;font-size:.7rem;background:rgba(34,197,94,.2);color:#4ade80;padding:2px 6px;border-radius:4px">✓ Doğrulanmış Alıcı</span>' : ''}
                </div>
                <div style="font-size:.75rem;color:var(--text3)">${dateStr}</div>
              </div>
              ${c.Rating ? `<div style="color:var(--gold);font-size:.85rem">${stars}</div>` : ''}
            </div>
            <p style="margin:0;color:var(--text2);font-size:.9rem;line-height:1.5">${escapeHtml(c.Content)}</p>
          </div>
        `;
      }).join('');
    }

    section.innerHTML = headerHtml + listHtml;
  } catch (err) {
    section.innerHTML = '<p style="color:var(--text3);font-size:.85rem">Yorumlar yüklenemedi.</p>';
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function openCommentModal(artworkId) {
  openCommentModalGeneric('Artwork', artworkId);
}

function openEventCommentModal(eventId) {
  openCommentModalGeneric('Event', eventId);
}

function openCommentModalGeneric(entityType, entityId) {
  if (!state.loggedIn) { showToast('Yorum yapmak için giriş yapın.', 'error'); return; }
  let label = '';
  if (entityType === 'Artwork') {
    const a = artworks.find(x => x.id === entityId);
    label = a ? `Eser: ${a.title}` : '';
  } else {
    const e = events.find(x => x.id === entityId);
    label = e ? `Etkinlik: ${e.title}` : '';
  }
  document.getElementById('comment-entity-type').value = entityType;
  document.getElementById('comment-entity-id').value = entityId;
  document.getElementById('comment-modal-target').textContent = label;
  document.getElementById('comment-content').value = '';
  setCommentRating(5);
  document.getElementById('comment-modal').classList.add('open');
}

function setCommentRating(value) {
  document.getElementById('comment-rating-value').value = value;
  document.querySelectorAll('#comment-rating-stars span').forEach(s => {
    s.style.color = parseInt(s.dataset.rating) <= value ? 'var(--gold)' : 'var(--text3)';
  });
}

async function submitComment() {
  if (!state.loggedIn) { showToast('Giriş yapın.', 'error'); return; }
  const entityType = document.getElementById('comment-entity-type').value;
  const entityId = parseInt(document.getElementById('comment-entity-id').value);
  const content = document.getElementById('comment-content').value.trim();
  const rating = parseInt(document.getElementById('comment-rating-value').value);
  if (!content) { showToast('Lütfen bir yorum yazın.', 'error'); return; }

  try {
    const res = await fetch(`${API_URL}/comments`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        user_id: state.user.id,
        entity_type: entityType,
        entity_id: entityId,
        content,
        rating
      })
    });
    const data = await res.json();
    if (data.success) {
      showToast('Yorumunuz eklendi ✓', 'success');
      closeModal('comment-modal');
      if (entityType === 'Artwork' && currentOpenArtworkId === entityId) loadArtworkComments(entityId);
      if (entityType === 'Event' && currentOpenEventId === entityId) loadEventComments(entityId);
    } else {
      showToast(data.message || 'Yorum eklenemedi.', 'error');
    }
  } catch (err) {
    showToast('Sunucu hatası.', 'error');
  }
}

let currentOpenEventId = null;

async function openEvent(id) {
  const e = events.find(x => x.id === id);
  const pct = Math.round(e.registered / e.capacity * 100);
  currentOpenEventId = id;

  // 3 günlük tarih butonları oluştur (başlangıç + 2 gün)
  const startDate = new Date(e.date);
  const dayNames = ['Pazar','Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi'];
  const monthNames = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
  let dayButtonsHtml = '';
  for(let i = 0; i < 3; i++) {
      const dd = new Date(startDate);
      dd.setDate(dd.getDate() + i);
      const label = `${dd.getDate()} ${monthNames[dd.getMonth()]} ${dayNames[dd.getDay()]}`;
      const dateKey = `${dd.getFullYear()}-${(dd.getMonth()+1).toString().padStart(2,'0')}-${dd.getDate().toString().padStart(2,'0')}`;
      dayButtonsHtml += `<button class="day-tab ${i===0?'active':''}" data-datekey="${dateKey}" onclick="selectDay(this, ${id}, '${dateKey}')" style="
          flex:1; padding:10px 8px; border-radius:8px; border:2px solid ${i===0?'var(--accent)':'var(--border)'};
          background:${i===0?'rgba(168,85,247,0.15)':'var(--bg2)'}; color:${i===0?'var(--accent)':'var(--text2)'};
          cursor:pointer; font-size:0.85rem; font-weight:${i===0?'600':'400'}; transition:all 0.2s;
      ">${label}</button>`;
  }

  document.getElementById('event-modal-content').innerHTML = `
    <div style="height:200px;border-radius:12px;overflow:hidden;margin-bottom:24px;position:relative">
      <div style="width:100%;height:100%;background:${e.gradient}"></div>
      <span style="position:absolute;top:12px;right:12px;background:rgba(168,85,247,.2);backdrop-filter:blur(8px);padding:4px 12px;border-radius:6px;font-size:.75rem;color:var(--accent)">${e.type}</span>
    </div>
    <h2 style="font-family:var(--font-display);font-size:1.8rem;margin-bottom:12px">${e.title}</h2>
    <p style="color:var(--text2);margin-bottom:20px;line-height:1.6">${e.description}</p>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px">
      <div style="background:var(--bg3);padding:14px;border-radius:10px">📅 <strong>Başlangıç</strong><br><span style="color:var(--text2)">${e.date}</span></div>
      <div style="background:var(--bg3);padding:14px;border-radius:10px">👥 <strong>Saat Başı Kapasite</strong><br><span style="color:var(--text2)">${e.baseCapacity} kişi</span></div>
      <div style="background:var(--bg3);padding:14px;border-radius:10px">★ <strong>Puan</strong><br><span style="color:var(--gold)">${e.rating}/5.0</span></div>
      <div style="background:var(--bg3);padding:14px;border-radius:10px">💰 <strong>Ücret</strong><br><span style="color:var(--gold)">₺${e.price.toLocaleString('tr-TR')}/kişi</span></div>
    </div>
    <div style="margin-bottom:20px; background:var(--bg3); padding:16px; border-radius:10px; border:1px solid var(--border);">
        <label style="font-weight:600; display:block; margin-bottom:10px;">📅 Tarih Seçin:</label>
        <div style="display:flex; gap:8px; margin-bottom:12px;">${dayButtonsHtml}</div>
        <label style="font-weight:600; display:block; margin-bottom:10px;">🕐 Saat Seçin:</label>
        <div id="time-slots-grid" style="display:grid; grid-template-columns:repeat(4,1fr); gap:8px;">
            <p style="color:var(--text3); font-size:0.85rem; grid-column:1/-1;">Yükleniyor...</p>
        </div>
        <input type="hidden" id="selected-datetime" value="">
    </div>
    <div style="margin-bottom:20px; display:flex; align-items:center; gap:12px; background:var(--bg3); padding:10px; border-radius:8px;">
        <label>Katılımcı Sayısı:</label>
        <input type="number" id="res-count" value="1" min="1" max="${e.baseCapacity}" style="width:60px; padding:4px; border-radius:4px; border:1px solid var(--border); background:var(--bg2); color:white;">
    </div>
    <button class="btn-primary btn-full" onclick="reserveEvent(${id})" id="btn-reserve-${id}">📅 Rezervasyon Yap</button>
    <div id="event-comments-section" style="margin-top:32px;border-top:1px solid var(--border);padding-top:24px">
      <div style="color:var(--text3);font-size:.9rem">Yorumlar yükleniyor...</div>
    </div>`;
  document.getElementById('event-modal').classList.add('open');

  // İlk günü yükle
  const firstDateKey = `${startDate.getFullYear()}-${(startDate.getMonth()+1).toString().padStart(2,'0')}-${startDate.getDate().toString().padStart(2,'0')}`;
  loadTimeSlots(id, firstDateKey);
  loadEventComments(id);
}

async function loadEventComments(eventId) {
  const section = document.getElementById('event-comments-section');
  if (!section) return;
  try {
    const res = await fetch(`${API_URL}/comments/event/${eventId}`);
    const data = await res.json();
    if (!data.success) throw new Error('fetch failed');

    const e = events.find(x => x.id === eventId);
    if (e && data.count > 0) {
      e.rating = data.average;
    }

    const avgStars = '★'.repeat(Math.round(data.average)) + '☆'.repeat(5 - Math.round(data.average));
    const headerHtml = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;flex-wrap:wrap;gap:12px">
        <div>
          <h3 style="margin:0 0 4px 0;font-family:var(--font-display);font-size:1.3rem">💬 Katılımcı Yorumları (${data.count})</h3>
          <div style="color:var(--gold);font-size:1rem">${avgStars} <span style="color:var(--text2);font-size:.9rem">${data.average || '—'}/5.0</span></div>
        </div>
        <button class="btn-outline" onclick="openEventCommentModal(${eventId})" style="padding:8px 14px;font-size:.85rem">✍️ Yorum Yap</button>
      </div>
    `;

    let listHtml = '';
    if (data.comments.length === 0) {
      listHtml = `<p style="color:var(--text3);font-size:.9rem;text-align:center;padding:20px">
        Henüz yorum yok. Etkinliğe katıldıysanız ilk yorumu siz yapın!
      </p>`;
    } else {
      listHtml = data.comments.map(c => {
        const stars = c.Rating ? ('★'.repeat(c.Rating) + '☆'.repeat(5 - c.Rating)) : '';
        const dateStr = c.CreatedAt ? c.CreatedAt.split(' ')[0] : '';
        const initials = (c.UserName || '?').split(' ').map(s => s[0]).slice(0,2).join('').toUpperCase();
        return `
          <div style="background:var(--bg3);border:1px solid var(--border);border-radius:10px;padding:14px;margin-bottom:10px">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
              <div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,var(--accent),#ec4899);display:flex;align-items:center;justify-content:center;font-size:.75rem;font-weight:600">${initials}</div>
              <div style="flex:1">
                <div style="font-weight:600;font-size:.9rem">
                  ${c.UserName}
                  ${c.Verified ? '<span style="margin-left:6px;font-size:.7rem;background:rgba(34,197,94,.2);color:#4ade80;padding:2px 6px;border-radius:4px">✓ Doğrulanmış Katılımcı</span>' : ''}
                </div>
                <div style="font-size:.75rem;color:var(--text3)">${dateStr}</div>
              </div>
              ${c.Rating ? `<div style="color:var(--gold);font-size:.85rem">${stars}</div>` : ''}
            </div>
            <p style="margin:0;color:var(--text2);font-size:.9rem;line-height:1.5">${escapeHtml(c.Content)}</p>
          </div>
        `;
      }).join('');
    }

    section.innerHTML = headerHtml + listHtml;
  } catch (err) {
    section.innerHTML = '<p style="color:var(--text3);font-size:.85rem">Yorumlar yüklenemedi.</p>';
  }
}

async function loadTimeSlots(eventId, dateKey) {
    const e = events.find(x => x.id === eventId);
    const grid = document.getElementById('time-slots-grid');
    if(!grid) return;
    grid.innerHTML = '<p style="color:var(--text3); font-size:0.85rem; grid-column:1/-1;">Yükleniyor...</p>';

    let booked = {};
    try {
        const res = await fetch(`${API_URL}/events/${eventId}/availability`);
        const data = await res.json();
        if(data.success) booked = data.booked;
    } catch(err) {}

    const hours = [10,11,12,13,14,15,16];
    let html = '';
    hours.forEach(h => {
        const timeStr = `${h.toString().padStart(2,'0')}:00`;
        const fullDatetime = `${dateKey} ${timeStr}:00`;
        const used = booked[fullDatetime] || 0;
        const remaining = e.baseCapacity - used;
        const isFull = remaining <= 0;
        const selectedVal = document.getElementById('selected-datetime') ? document.getElementById('selected-datetime').value : '';
        const isSelected = selectedVal === fullDatetime;
        html += `<button class="time-slot-btn ${isFull?'slot-full':''} ${isSelected?'slot-selected':''}" 
            ${isFull?'disabled':''} 
            onclick="selectTimeSlot(this, '${fullDatetime}')"
            style="padding:10px 4px; border-radius:8px; border:2px solid ${isSelected?'var(--accent)':isFull?'rgba(239,68,68,0.3)':'var(--border)'};
            background:${isSelected?'rgba(168,85,247,0.15)':isFull?'rgba(239,68,68,0.05)':'var(--bg2)'};
            color:${isFull?'var(--text3)':'var(--text1)'}; cursor:${isFull?'not-allowed':'pointer'};
            font-size:0.9rem; transition:all 0.2s; text-align:center;">
            <div style="font-weight:600;">${timeStr}</div>
            <div style="font-size:0.7rem; margin-top:4px; color:${isFull?'#ef4444':'#4ade80'};">${isFull?'Dolu':'Kalan: '+remaining}</div>
        </button>`;
    });
    grid.innerHTML = html;
}

function selectDay(el, eventId, dateKey) {
    document.querySelectorAll('.day-tab').forEach(btn => {
        btn.style.border = '2px solid var(--border)';
        btn.style.background = 'var(--bg2)';
        btn.style.color = 'var(--text2)';
        btn.style.fontWeight = '400';
        btn.classList.remove('active');
    });
    el.style.border = '2px solid var(--accent)';
    el.style.background = 'rgba(168,85,247,0.15)';
    el.style.color = 'var(--accent)';
    el.style.fontWeight = '600';
    el.classList.add('active');
    // Saat seçimini sıfırla
    const hidden = document.getElementById('selected-datetime');
    if(hidden) hidden.value = '';
    loadTimeSlots(eventId, dateKey);
}

function selectTimeSlot(el, datetime) {
    document.querySelectorAll('.time-slot-btn').forEach(btn => {
        btn.style.border = '2px solid var(--border)';
        btn.style.background = 'var(--bg2)';
        btn.classList.remove('slot-selected');
    });
    el.style.border = '2px solid var(--accent)';
    el.style.background = 'rgba(168,85,247,0.15)';
    el.classList.add('slot-selected');
    document.getElementById('selected-datetime').value = datetime;
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
      currentCheckoutType = 'artwork';
      appliedCoupon = null; // reset
      document.getElementById('checkout-coupon').value = '';
      document.getElementById('coupon-message').innerHTML = '';
      
      let priceHtml = `Toplam Tutar: <strong style="color:var(--gold)">₺${a.price.toLocaleString('tr-TR')}</strong>`;
      if(specialOffer && specialOffer.ArtworkID === id) {
          priceHtml = `<span style="text-decoration:line-through; opacity:0.6; font-size:0.9rem;">₺${specialOffer.OriginalPrice.toLocaleString('tr-TR')}</span> <strong style="color:#4ade80;">%15 Özel İndirim -> ₺${specialOffer.DiscountedPrice.toLocaleString('tr-TR')}</strong>`;
      }
      
      document.getElementById('checkout-summary').innerHTML = `
        <h4>${a.title}</h4>
        <p style="color:var(--text2); margin-top:4px">Kategori: ${a.category}</p>
        <p style="margin-top:12px; font-size:1.2rem;">${priceHtml}</p>
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
  
  // Seçilen tarih+saati al
  const reservationDate = document.getElementById('selected-datetime').value;
  
  if(!reservationDate) {
      showToast('Lütfen bir gün ve saat seçin!', 'error');
      return;
  }
  
  const totalPrice = e.price * count;
  currentCheckoutType = 'event';
  currentCheckoutReservationData = {
      user_id: state.user.id,
      event_id: e.id,
      reservation_date: reservationDate,
      participant_count: count,
      base_price: totalPrice,
      event_title: e.title,
      event_obj: e
  };
  
  appliedCoupon = null; // reset
  document.getElementById('checkout-coupon').value = '';
  document.getElementById('coupon-message').innerHTML = '';
  
  const d = new Date(reservationDate);
  const dateStr = `${d.getDate().toString().padStart(2,'0')}.${(d.getMonth()+1).toString().padStart(2,'0')}.${d.getFullYear()} ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
  
  document.getElementById('checkout-summary').innerHTML = `
    <h4>${e.title} Rezervasyonu</h4>
    <p style="color:var(--text2); margin-top:4px">Tarih & Saat: ${dateStr}</p>
    <p style="color:var(--text2); margin-top:4px">Kişi Sayısı: ${count}</p>
    <p style="margin-top:12px; font-size:1.2rem;">Toplam Tutar: <strong style="color:var(--gold)">₺${totalPrice.toLocaleString('tr-TR')}</strong></p>
  `;
  
  closeModal('event-modal');
  document.getElementById('checkout-modal').classList.add('open');
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
          localStorage.setItem('user', JSON.stringify(data.user));
          document.getElementById('btn-login').textContent = state.user.name;
          document.getElementById('btn-register').textContent = 'Çıkış';
          document.getElementById('nav-item-profile').style.display = 'inline-block';
          closeModal('login-modal');
          showToast(`Hoş geldiniz, ${state.user.name}! ✓`, 'success');
          loadFavorites();
          fetchSpecialOffer();
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
          localStorage.setItem('user', JSON.stringify(data.user));
          document.getElementById('btn-login').textContent = data.user.name;
          document.getElementById('btn-register').textContent = 'Çıkış';
          document.getElementById('nav-item-profile').style.display = 'inline-block';
          closeModal('login-modal');
          showToast(`Kayıt başarılı, hoş geldiniz ${data.user.name}! ✓`, 'success');
          loadFavorites();
          fetchSpecialOffer();
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
            const seenArtworks = new Set();
            const ordersHtml = data.orders.map(o => {
                const aw = artworks.find(x => x.title === o.ArtworkTitle);
                const artworkId = aw ? aw.id : null;
                const showCommentBtn = artworkId && !seenArtworks.has(artworkId);
                if (artworkId) seenArtworks.add(artworkId);
                return `
                <div style="background:var(--bg3); padding:16px; border-radius:8px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
                    <div style="flex:1; min-width:200px;">
                        <h4 style="margin:0 0 8px 0">${o.ArtworkTitle}</h4>
                        <span style="color:var(--text2); font-size:0.85rem;">Tarih: ${o.OrderDate.split(' ')[0]} | Yöntem: ${o.PaymentMethod}</span>
                    </div>
                    <div style="text-align:right;">
                        <span style="font-weight:bold; color:var(--gold);">₺${o.TotalAmount.toLocaleString('tr-TR')}</span>
                        <br><span style="font-size:0.8rem; padding:2px 8px; border-radius:4px; background:rgba(34,197,94,0.2); color:#4ade80;">${o.Status}</span>
                        ${showCommentBtn ? `<br><button class="btn-outline" style="margin-top:8px;padding:4px 10px;font-size:0.78rem;color:var(--accent);border-color:var(--accent)" onclick="openCommentModal(${artworkId})">✍️ Yorum Yap</button>` : ''}
                    </div>
                </div>
            `;}).join('');
            document.getElementById('profile-orders-list').innerHTML = ordersHtml || '<p style="color:var(--text3)">Henüz siparişiniz bulunmamaktadır.</p>';
            
            // Render reservations
            const resHtml = data.reservations.map(r => {
                let dateDisplay = '';
                if(r.ReservationDate) {
                    const rd = new Date(r.ReservationDate);
                    dateDisplay = `${rd.getDate().toString().padStart(2,'0')}.${(rd.getMonth()+1).toString().padStart(2,'0')}.${rd.getFullYear()} ${rd.getHours().toString().padStart(2,'0')}:${rd.getMinutes().toString().padStart(2,'0')}`;
                } else {
                    dateDisplay = r.EventDate ? r.EventDate.split(' ')[0] : '-';
                }
                return `
                <div style="background:var(--bg3); padding:16px; border-radius:8px; display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <h4 style="margin:0 0 8px 0">${r.EventTitle}</h4>
                        <span style="color:var(--text2); font-size:0.85rem;">📅 Seans: ${dateDisplay} | Kişi: ${r.ParticipantCount}</span>
                    </div>
                    <div style="text-align:right;">
                        <span style="font-weight:bold; color:var(--gold);">₺${r.TotalPrice.toLocaleString('tr-TR')}</span>
                        <br>
                        ${r.Status === 'Active' 
                            ? `
                               <button class="btn-outline" style="padding:4px 8px; font-size:0.8rem; margin-top:8px; margin-right:4px; color:var(--accent); border-color:var(--accent)" onclick="openEditReservation(${r.ReservationID}, ${r.EventID}, '${r.ReservationDate}', ${r.ParticipantCount})">Düzenle</button>
                               <button class="btn-outline" style="padding:4px 8px; font-size:0.8rem; margin-top:8px; margin-right:4px; color:#fbbf24; border-color:#fbbf24" onclick="openEventCommentModal(${r.EventID})">✍️ Yorum Yap</button>
                               <button class="btn-outline" style="padding:4px 8px; font-size:0.8rem; margin-top:8px; color:#ef4444; border-color:#ef4444" onclick="handleCancelRes(${r.ReservationID})">İptal Et</button>
                              `
                            : `
                               <button style="padding:4px; font-size:1rem; margin-right:8px; color:var(--text3); border:none; background:transparent; cursor:pointer; display:inline-flex; align-items:center; justify-content:center;" onclick="deleteReservation(${r.ReservationID})" title="Bu kaydı tamamen sil">🗑️</button>
                               <span style="font-size:0.8rem; padding:2px 8px; border-radius:4px; background:rgba(239,68,68,0.2); color:#ef4444; display:inline-block; vertical-align:middle;">İptal Edildi</span>
                              `
                        }
                    </div>
                </div>
            `}).join('');
            document.getElementById('profile-reservations-list').innerHTML = resHtml || '<p style="color:var(--text3)">Rezervasyonunuz bulunmamaktadır.</p>';
            
            // Render tickets
            try {
                const tRes = await fetch(`${API_URL}/tickets/${state.user.id}`);
                const tData = await tRes.json();
                if(tData.success) {
                    const ticketsHtml = tData.tickets.map(t => `
                        <div style="background:var(--bg3); padding:16px; border-radius:8px; border:1px solid var(--border);">
                            <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                                <h4 style="margin:0">${t.Subject}</h4>
                                <span style="font-size:0.8rem; padding:2px 8px; border-radius:4px; background:${t.Status==='Open'?'rgba(234,179,8,0.2)':'rgba(34,197,94,0.2)'}; color:${t.Status==='Open'?'#eab308':'#4ade80'};">${t.Status==='Open'?'Açık':'Yanıtlandı'}</span>
                            </div>
                            <p style="color:var(--text2); font-size:0.9rem; margin-bottom:12px;">${t.Message}</p>
                            ${t.AdminResponse ? `<div style="background:rgba(168,85,247,0.1); padding:12px; border-radius:6px; border-left:3px solid var(--accent); font-size:0.9rem; margin-bottom:8px;"><strong>Admin Yanıtı:</strong><br>${t.AdminResponse}</div>` : ''}
                            <div style="font-size:0.75rem; color:var(--text3);">Tarih: ${t.CreatedAt.split(' ')[0]}</div>
                        </div>
                    `).join('');
                    document.getElementById('profile-tickets-list').innerHTML = ticketsHtml || '<p style="color:var(--text3)">Geçmiş talebiniz bulunmamaktadır.</p>';
                }
            } catch(e) {}
        }
    } catch(err) { console.error(err); }
}

async function submitSupportTicket() {
    const subject = document.getElementById('support-subject').value;
    const message = document.getElementById('support-message').value;
    if(!subject || !message) { showToast('Lütfen tüm alanları doldurun.', 'error'); return; }
    try {
        const res = await fetch(`${API_URL}/tickets`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({user_id: state.user.id, subject, message})
        });
        const data = await res.json();
        if(data.success) {
            showToast('Talebiniz gönderildi.', 'success');
            document.getElementById('support-subject').value = '';
            document.getElementById('support-message').value = '';
            loadProfile(); // refresh list
        } else {
            showToast('Hata oluştu.', 'error');
        }
    } catch(err) {
        showToast('Sunucu hatası.', 'error');
    }
}

function openTicketResponseModal(id, subject, message) {
    document.getElementById('current-ticket-id').value = id;
    document.getElementById('ticket-details').innerHTML = `
        <strong>Konu:</strong> ${subject}<br>
        <div style="margin-top:8px; font-size:0.9rem; color:var(--text2);">${message}</div>
    `;
    document.getElementById('admin-ticket-response').value = '';
    document.getElementById('ticket-modal').classList.add('open');
}

async function deleteReservation(resId) {
    if(!confirm('Bu rezervasyon kaydını kalıcı olarak silmek istediğinize emin misiniz?')) return;
    showToast('Kayıt siliniyor...', 'success');
    try {
        const res = await fetch(`${API_URL}/reservations/${resId}`, { method: 'DELETE' });
        const data = await res.json();
        if(data.success) {
            showToast('Rezervasyon kaydı silindi.', 'success');
            loadProfile();
        } else {
            showToast(data.message, 'error');
        }
    } catch(err) {
        showToast('Silme işlemi başarısız oldu.', 'error');
    }
}

async function handleCancelRes(resId) {
    if(!confirm('Rezervasyonunuzu iptal etmek istediğinize emin misiniz?')) return;
    console.log("handleCancelRes called with:", resId);
    showToast('İptal işlemi başlatılıyor...', 'success');
    try {
        const res = await fetch(`${API_URL}/reservations/${resId}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ action: 'cancel' })
        });
        const data = await res.json();
        if(data.success) {
            showToast('Rezervasyon iptal edildi.', 'success');
            loadProfile(); // Refresh the list
            fetchInitialData(); // Refresh event capacities
        } else {
            showToast(data.message, 'error');
        }
    } catch(err) {
        showToast('İptal işlemi başarısız oldu.', 'error');
    }
}

async function openEditReservation(resId, eventId, currentDate, currentCount) {
    console.log("openEditReservation:", resId, eventId, currentDate, currentCount);
    const e = events.find(x => x.id == eventId);
    if(!e) { showToast('Etkinlik bilgisi bulunamadı', 'error'); return; }

    const startDate = new Date(e.date);
    const dayNames = ['Pazar','Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi'];
    const monthNames = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
    let dayButtonsHtml = '';
    
    let curDateObj = null;
    let curDateKey = '';
    if (currentDate && currentDate !== 'null' && currentDate !== 'undefined') {
        curDateObj = new Date(currentDate);
        if(!isNaN(curDateObj)) {
            curDateKey = `${curDateObj.getFullYear()}-${(curDateObj.getMonth()+1).toString().padStart(2,'0')}-${curDateObj.getDate().toString().padStart(2,'0')}`;
        }
    }

    for(let i = 0; i < 3; i++) {
        const dd = new Date(startDate);
        dd.setDate(dd.getDate() + i);
        const label = `${dd.getDate()} ${monthNames[dd.getMonth()]} ${dayNames[dd.getDay()]}`;
        const dateKey = `${dd.getFullYear()}-${(dd.getMonth()+1).toString().padStart(2,'0')}-${dd.getDate().toString().padStart(2,'0')}`;
        
        const isSelected = (dateKey === curDateKey) || (i === 0 && !curDateKey);
        
        dayButtonsHtml += `<button class="edit-day-tab ${isSelected?'active':''}" data-datekey="${dateKey}" onclick="selectEditDay(this, ${eventId}, '${dateKey}', ${resId})" style="
            flex:1; padding:10px 8px; border-radius:8px; border:2px solid ${isSelected?'var(--accent)':'var(--border)'};
            background:${isSelected?'rgba(168,85,247,0.15)':'var(--bg2)'}; color:${isSelected?'var(--accent)':'var(--text2)'};
            cursor:pointer; font-size:0.85rem; font-weight:${isSelected?'600':'400'}; transition:all 0.2s;
        ">${label}</button>`;
    }

    const contentHtml = `
        <div style="margin-bottom:20px; background:var(--bg3); padding:16px; border-radius:10px; border:1px solid var(--border);">
            <label style="font-weight:600; display:block; margin-bottom:10px;">📅 Yeni Tarih Seçin:</label>
            <div style="display:flex; gap:8px; margin-bottom:12px;">${dayButtonsHtml}</div>
            <label style="font-weight:600; display:block; margin-bottom:10px;">🕐 Yeni Saat Seçin:</label>
            <div id="edit-time-slots-grid" style="display:grid; grid-template-columns:repeat(4,1fr); gap:8px;">
                <p style="color:var(--text3); font-size:0.85rem; grid-column:1/-1;">Yükleniyor...</p>
            </div>
            <input type="hidden" id="edit-selected-datetime" value="${currentDate !== 'null' ? currentDate : ''}">
        </div>
        <div style="margin-bottom:20px; display:flex; align-items:center; gap:12px; background:var(--bg3); padding:10px; border-radius:8px;">
            <label>Katılımcı Sayısı:</label>
            <input type="number" id="edit-res-count" value="${currentCount}" min="1" max="${e.baseCapacity}" style="width:60px; padding:4px; border-radius:4px; border:1px solid var(--border); background:var(--bg2); color:white;">
        </div>
        <button class="btn-primary btn-full" onclick="submitEditReservation(${resId}, ${eventId})">💾 Değişiklikleri Kaydet</button>
    `;

    document.getElementById('edit-res-content').innerHTML = contentHtml;
    document.getElementById('edit-res-modal').classList.add('open');
    
    loadEditTimeSlots(eventId, curDateKey || `${startDate.getFullYear()}-${(startDate.getMonth()+1).toString().padStart(2,'0')}-${startDate.getDate().toString().padStart(2,'0')}`, resId);
}

async function loadEditTimeSlots(eventId, dateKey, resId) {
    const e = events.find(x => x.id == eventId);
    const grid = document.getElementById('edit-time-slots-grid');
    if(!grid) return;
    grid.innerHTML = '<p style="color:var(--text3); font-size:0.85rem; grid-column:1/-1;">Yükleniyor...</p>';

    let booked = {};
    try {
        const res = await fetch(`${API_URL}/events/${eventId}/availability`);
        const data = await res.json();
        if(data.success) booked = data.booked;
    } catch(err) {}

    const hours = [10,11,12,13,14,15,16];
    let html = '';
    
    const selectedVal = document.getElementById('edit-selected-datetime').value;
    
    hours.forEach(h => {
        const timeStr = `${h.toString().padStart(2,'0')}:00`;
        const fullDatetime = `${dateKey} ${timeStr}:00`;
        
        const used = booked[fullDatetime] || 0;
        const remaining = e.baseCapacity - used;
        const isSelected = selectedVal === fullDatetime;
        const isFull = remaining <= 0 && !isSelected;
        
        html += `<button class="edit-time-slot-btn ${isFull?'slot-full':''} ${isSelected?'slot-selected':''}" 
            ${isFull?'disabled':''} 
            onclick="selectEditTimeSlot(this, '${fullDatetime}')"
            style="padding:10px 4px; border-radius:8px; border:2px solid ${isSelected?'var(--accent)':isFull?'rgba(239,68,68,0.3)':'var(--border)'};
            background:${isSelected?'rgba(168,85,247,0.15)':isFull?'rgba(239,68,68,0.05)':'var(--bg2)'};
            color:${isFull?'var(--text3)':'var(--text1)'}; cursor:${isFull?'not-allowed':'pointer'};
            font-size:0.9rem; transition:all 0.2s; text-align:center;">
            <div style="font-weight:600;">${timeStr}</div>
            <div style="font-size:0.7rem; margin-top:4px; color:${isFull?'#ef4444':'#4ade80'};">${isFull?'Dolu':'Kalan: '+remaining}</div>
        </button>`;
    });
    grid.innerHTML = html;
}

function selectEditDay(el, eventId, dateKey, resId) {
    document.querySelectorAll('.edit-day-tab').forEach(btn => {
        btn.style.border = '2px solid var(--border)';
        btn.style.background = 'var(--bg2)';
        btn.style.color = 'var(--text2)';
        btn.style.fontWeight = '400';
        btn.classList.remove('active');
    });
    el.style.border = '2px solid var(--accent)';
    el.style.background = 'rgba(168,85,247,0.15)';
    el.style.color = 'var(--accent)';
    el.style.fontWeight = '600';
    el.classList.add('active');
    loadEditTimeSlots(eventId, dateKey, resId);
}

function selectEditTimeSlot(el, datetime) {
    document.querySelectorAll('.edit-time-slot-btn').forEach(btn => {
        btn.style.border = '2px solid var(--border)';
        btn.style.background = 'var(--bg2)';
        btn.classList.remove('slot-selected');
    });
    el.style.border = '2px solid var(--accent)';
    el.style.background = 'rgba(168,85,247,0.15)';
    el.classList.add('slot-selected');
    document.getElementById('edit-selected-datetime').value = datetime;
}

async function submitEditReservation(resId, eventId) {
    const reservationDate = document.getElementById('edit-selected-datetime').value;
    const count = parseInt(document.getElementById('edit-res-count').value);
    
    if(!reservationDate || isNaN(count) || count < 1) {
        showToast('Geçerli bir tarih ve katılımcı sayısı seçin.', 'error');
        return;
    }
    
    try {
        const res = await fetch(`${API_URL}/reservations/${resId}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ 
                action: 'update',
                reservation_date: reservationDate,
                participant_count: count 
            })
        });
        const data = await res.json();
        if(data.success) {
            showToast(data.message, 'success');
            closeModal('edit-res-modal');
            loadProfile(); // Refresh the list
            fetchInitialData(); // Refresh event capacities
        } else {
            showToast(data.message, 'error');
        }
    } catch(err) {
        showToast('Güncelleme başarısız.', 'error');
    }
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

async function fetchSpecialOffer() {
    if(!state.loggedIn) return;
    try {
        const res = await fetch(`${API_URL}/special-offer/${state.user.id}`);
        const data = await res.json();
        if(data.success && data.offer) {
            specialOffer = data.offer;
            const banner = document.getElementById('special-offer-banner');
            banner.innerHTML = `
                <div>
                    <strong style="color:#fcd34d;">🔥 Sana Özel Fırsat!</strong> "${specialOffer.Title}" isimli eser kısa süreliğine %15 indirimle!
                    <br><span style="font-size:0.85rem; opacity:0.8;">Normal Fiyat: ₺${specialOffer.OriginalPrice.toLocaleString('tr-TR')} | İndirimli Fiyat: ₺${specialOffer.DiscountedPrice.toLocaleString('tr-TR')}</span>
                </div>
                <button class="btn-primary" onclick="openArtwork(${specialOffer.ArtworkID})" style="background:white; color:var(--accent); white-space:nowrap; border:none; border-radius:8px; font-weight:bold;">İncele</button>
            `;
            banner.style.display = 'flex';
        }
    } catch(e) {}
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
    localStorage.removeItem('user');
    document.getElementById('btn-login').textContent = 'Giriş Yap'; 
    document.getElementById('btn-register').textContent = 'Kayıt Ol'; 
    document.getElementById('nav-item-profile').style.display = 'none';
    if(state.page === 'profile') navigate('home');
    renderArtworks(); renderHome();
    showToast('Çıkış yapıldı', 'error');
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  // Check auth state
  const savedUser = localStorage.getItem('user');
  if (savedUser) {
      try {
          state.user = JSON.parse(savedUser);
          state.loggedIn = true;
          document.getElementById('btn-login').textContent = state.user.name;
          document.getElementById('btn-register').textContent = 'Çıkış';
          document.getElementById('nav-item-profile').style.display = 'inline-block';
          loadFavorites();
          fetchSpecialOffer();
      } catch (e) {
          localStorage.removeItem('user');
      }
  }

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
  document.getElementById('ticket-modal-close').addEventListener('click', () => closeModal('ticket-modal'));
  const cmcBtn = document.getElementById('comment-modal-close');
  if (cmcBtn) cmcBtn.addEventListener('click', () => closeModal('comment-modal'));
  document.querySelectorAll('.modal-overlay').forEach(m => m.addEventListener('click', e => { if (e.target === m) m.classList.remove('open'); }));

  // Comment rating stars
  const starsEl = document.getElementById('comment-rating-stars');
  if (starsEl) {
    starsEl.addEventListener('click', e => {
      if (e.target && e.target.dataset.rating) setCommentRating(parseInt(e.target.dataset.rating));
    });
  }

  // Ticket Modal Submit
  document.getElementById('submit-ticket-response').addEventListener('click', async () => {
      const id = document.getElementById('current-ticket-id').value;
      const resp = document.getElementById('admin-ticket-response').value;
      if(!resp) return;
      const btn = document.getElementById('submit-ticket-response');
      btn.textContent = 'Gönderiliyor...'; btn.disabled = true;
      try {
          const res = await fetch(`${API_URL}/tickets/${id}/respond`, {
              method: 'PUT',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({response: resp})
          });
          const data = await res.json();
          if(data.success) {
              showToast('Yanıt gönderildi.', 'success');
              closeModal('ticket-modal');
              renderAdmin(); // refresh
          }
      } catch(e) {} finally {
          btn.textContent = 'Yanıtı Gönder'; btn.disabled = false;
      }
  });

  // Coupon Apply
  document.getElementById('btn-apply-coupon').addEventListener('click', async () => {
      if(!currentCheckoutArtwork && !currentCheckoutReservationData) return;
      const code = document.getElementById('checkout-coupon').value.trim();
      if(!code) return;
      try {
          const res = await fetch(`${API_URL}/validate-coupon`, {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({code})
          });
          const data = await res.json();
          if(data.success) {
              appliedCoupon = data.coupon;
              let discountStr = '';
              let newPrice = currentCheckoutType === 'artwork' ? currentCheckoutArtwork.price : currentCheckoutReservationData.base_price;
              
              if(currentCheckoutType === 'artwork' && specialOffer && specialOffer.ArtworkID === currentCheckoutArtwork.id) {
                  newPrice = specialOffer.DiscountedPrice;
              }
              
              if(appliedCoupon.DiscountType === 'Percent') {
                  discountStr = `%${appliedCoupon.DiscountValue} İndirim`;
                  newPrice = newPrice * (1 - appliedCoupon.DiscountValue/100);
              } else {
                  discountStr = `₺${appliedCoupon.DiscountValue} İndirim`;
                  newPrice = Math.max(0, newPrice - appliedCoupon.DiscountValue);
              }
              document.getElementById('coupon-message').innerHTML = `<span style="color:#4ade80;">✓ ${code} Uygulandı: ${discountStr}</span><br><strong>Yeni Toplam: ₺${newPrice.toLocaleString('tr-TR')}</strong>`;
          } else {
              document.getElementById('coupon-message').innerHTML = `<span style="color:#ef4444;">✗ ${data.message}</span>`;
              appliedCoupon = null;
          }
      } catch(e) {}
  });

  // Checkout confirm
  document.getElementById('btn-confirm-checkout').addEventListener('click', async () => {
      const method = document.getElementById('checkout-method').value;
      const btn = document.getElementById('btn-confirm-checkout');
      btn.textContent = 'İşleniyor...'; btn.disabled = true;
      
      if(currentCheckoutType === 'artwork' && currentCheckoutArtwork) {
          const payload = {
              user_id: state.user.id,
              artwork_id: currentCheckoutArtwork.id,
              payment_method: method
          };
          if(appliedCoupon) payload.coupon_code = appliedCoupon.Code;
          if(specialOffer && specialOffer.ArtworkID === currentCheckoutArtwork.id) payload.is_special_offer = true;
          
          try {
              const res = await fetch(`${API_URL}/orders`, {
                  method: 'POST',
                  headers: {'Content-Type': 'application/json'},
                  body: JSON.stringify(payload)
              });
              const data = await res.json();
              if(data.success) {
                  showToast(`"${currentCheckoutArtwork.title}" satın alındı! ✓`, 'success');
                  closeModal('checkout-modal');
                  if(specialOffer && specialOffer.ArtworkID === currentCheckoutArtwork.id) {
                      document.getElementById('special-offer-banner').style.display = 'none';
                      specialOffer = null;
                  }
                  renderArtworks(); renderHome(); loadProfile();
              } else {
                  showToast(data.message, 'error');
              }
          } catch(err) {
              showToast('İşlem başarısız.', 'error');
          } finally {
              btn.textContent = 'Ödemeyi Tamamla'; btn.disabled = false;
          }
      } 
      else if(currentCheckoutType === 'event' && currentCheckoutReservationData) {
          const payload = {
              ...currentCheckoutReservationData,
              payment_method: method
          };
          
          try {
              const res = await fetch(`${API_URL}/reservations`, {
                  method: 'POST',
                  headers: {'Content-Type': 'application/json'},
                  body: JSON.stringify(payload)
              });
              const data = await res.json();
              if(data.success) {
                  const e = currentCheckoutReservationData.event_obj;
                  const count = currentCheckoutReservationData.participant_count;
                  const dateStr = currentCheckoutReservationData.reservation_date;
                  
                  showToast(`"${e.title}" için ${count} kişilik rezervasyon yapıldı! ✓`, 'success');
                  closeModal('checkout-modal');
                  fetchInitialData(); // Refresh all capacities
                  loadProfile();
              } else {
                  showToast(data.message, 'error');
              }
          } catch(err) {
              showToast('Rezervasyon başarısız. Sunucu hatası.', 'error');
          } finally {
              btn.textContent = 'Ödemeyi Tamamla'; btn.disabled = false;
          }
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
