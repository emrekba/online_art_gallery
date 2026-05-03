# 🎨 Online Sanat Galerisi — Ödev Task Listesi

> **Proje:** Online Sanat Galerisi ve Atölye Rezervasyon Sistemi  
> **Ölçek:** 106 ham puan → 100'lük sisteme dönüştürme (Final = Ham/106 × 100)  
> **Kapsam:** 16 gereksinim (her biri 6 puan) + Arayüz kalitesi (10 puan)

---

## 📌 FAZ 0 — Veritabanı Tasarımı ve Dokümantasyon

> Bu faz tamamen tamamlanmış durumdadır. ✅

- [x] **Gereksinim analizi** — 16 madde incelendi, sistem kapsamı belirlendi
- [x] **Tablo tasarımı** — `veritabani_tasarimi.md` oluşturuldu
  - [x] Users, Artists, Artworks, Events tabloları
  - [x] Favorites, Reservations, Orders, OrderDetails tabloları
  - [x] Comments, CommentVotes, Coupons, SupportTickets tabloları
- [x] **ER Diyagramı** — `er_diagram.md` (Mermaid formatında) oluşturuldu
  - [x] 1:N ilişkiler tanımlandı
  - [x] N:M (many-to-many) ilişkiler ara tablolarla kuruldu
  - [x] Self-join (Comments → Comments reply) kuruldu
- [x] **DDL SQL scriptleri** — `init_database.sql` oluşturuldu
  - [x] Tüm tablolar CREATE TABLE ile tanımlandı
  - [x] PK, FK, UNIQUE, CHECK kısıtlamaları eklendi
- [x] **Trigger'lar** — `views_and_triggers.md` ve `init_database.sql` içinde
  - [x] Etkinliğe katılmayanların yorum yapmasını engelleyen trigger (Madde 15)
  - [x] Sadece satın alanların eseri değerlendirebildiği trigger (Madde 15)
- [x] **View'lar** — `views_and_triggers.md` ve `init_database.sql` içinde
  - [x] `EventStatisticsView` — doluluk oranı, ortalama puan (Madde 16)
  - [x] `ArtworkStatisticsView` — beğeni, yorum, puan (Madde 16)
  - [x] `AdminSummaryDashboard` — özet rapor (Madde 16)

---

## 📌 FAZ 1 — Temel Arayüz Altyapısı

> Bu faz tamamlanmış durumdadır. ✅

- [x] **HTML iskelet** — `ui/index.html` oluşturuldu
  - [x] Navbar (logo, nav-links, auth butonları, hamburger)
  - [x] 4 sayfa yapısı: Home, Artworks, Events, Admin Dashboard
  - [x] Artwork Modal, Event Modal, Login Modal
  - [x] Toast bildirimleri container'ı
- [x] **CSS tasarım sistemi** — `ui/style.css` oluşturuldu
  - [x] Dark mode renk paleti (CSS custom properties)
  - [x] Glassmorphism ve gradient efektleri
  - [x] Responsive grid ve flex layout'lar
  - [x] Animasyonlar ve hover efektleri
- [x] **JavaScript çekirdek** — `ui/app.js` oluşturuldu
  - [x] Mock data (artworks, events, artists, tickets)
  - [x] Sayfa navigasyonu (`navigate()`)
  - [x] Kartlar render edildi (artworkCard, eventCard)
  - [x] KPI animasyonları ve hero stat animasyonları

---

## 📌 FAZ 2 — 16 Gereksinim Uygulaması (UI Tarafı)

> Bu faz kısmen tamamlanmış durumdadır. ⚠️

### Madde 1 — Eserleri İnceleme ✅
- [x] Eser listesi (grid görünümü, kategori, fiyat)
- [x] Eser detay modalı (görsel, açıklama, sanatçı bilgisi)
- [x] Eser görselleri (gradient placeholder'lar)

### Madde 2 — Atölye ve Etkinlikleri Görüntüleme ✅
- [x] Etkinlik listesi (tarih, kontenjan, ücret)
- [x] Etkinlik detay modalı
- [x] Doluluk çubuğu ve kapasite bilgisi

### Madde 3 — Favorilere Ekleme ✅ Tamamlandı
- [x] Favoriye ekleme butonu ve toggle
- [x] Toast bildirimi
- [x] Profil sekmesinde Favorilerim sayfası
- [x] Backend /api/favorites bağlantısı (kullanıcı bazlı veritabanı kaydı)

### Madde 4 — Rezervasyon Oluşturma ✅ Tamamlandı
- [x] "Rezervasyon Yap" butonu
- [x] Giriş kontrolü (login gerektirir)
- [x] Katılımcı sayısı seçme formu 
- [x] Backend API bağlantısı

### Madde 5 — Rezervasyonu Güncelleme ✅ Tamamlandı
- [x] Profil sayfasında rezervasyon listesi
- [x] Rezervasyon iptal etme (Backend 'Cancelled' güncellemesi)
- [x] Kişi sayısı fiyat yansıması

### Madde 6 — Satın Alma ve Ödeme ✅ Tamamlandı
- [x] "Satın Al" butonu ve stok durumu güncellemesi
- [x] Ödeme yöntemi seçimi (kredi kartı, havale) modalı
- [x] Sipariş onay ekranı ve bildirimler

### Madde 7 — Hesap Yönetimi ✅ Tamamlandı
- [x] Kullanıcı kaydı (signup formu)
- [x] Kullanıcı girişi (login formu)
- [x] Profil bilgilerini güncelleme (Ad Soyad)
- [x] Şifre değiştirme

### Madde 8 — Sipariş ve Rezervasyon Takibi ✅ Tamamlandı
- [x] Profil sayfasında Satın Alınan Eserler listesi
- [x] Yapılan etkinlik rezervasyonlarının durumu ve listesi
- [x] Geçmiş sipariş detayları (Tutar, Tarih, Ödeme Yöntemi)

### Madde 9 — İndirim ve Kampanyalar ✅ Tamamlandı
- [x] Kupon kodu girişi ve geçerlilik kontrolü (API)
- [x] Kampanyalı eser gösterimi (Rastgele Özel Fırsat Banner'ı)
- [x] Kullanıcıya özel %15 indirim fırsatı
- [x] İndirimli tutarın veritabanına ve profildeki siparişlere yansıması

### Madde 10 — Müşteri Destek ⚠️ Yarım
- [x] Admin panelinde SupportTickets tablosu görünümü var (sadece listeleme)
- [ ] **İletişim formu (soru gönderme) YOK**
- [ ] Canlı destek/mesaj sistemi YOK
- [ ] Destek talebi durumu kullanıcı tarafından görüntüleme YOK

### Madde 11 — Karşılaştırma ❌ Eksik
- [ ] Etkinlik karşılaştırma özelliği YOK
- [ ] Eser karşılaştırma özelliği YOK
- [ ] Karşılaştırma sonuçlarını kaydetme YOK

### Madde 12 — Yorum Ekleme ❌ Eksik
- [ ] Eserlere yorum yapma formu YOK
- [ ] Etkinliklere değerlendirme yazma YOK
- [ ] Diğer kullanıcı yorumlarını görüntüleme YOK

### Madde 13 — Yorumları Değerlendirme ve Filtreleme ❌ Eksik
- [ ] Yorumlara puan verme YOK
- [ ] "Faydalı buldum" oy sistemi YOK
- [ ] Yorumları filtreleme (en yeni, en yüksek puanlı) YOK
- [ ] Ortalama puan gösterimi YOK (sadece mock data'da var)

### Madde 14 — Yorumlara Yanıt Verme ❌ Eksik
- [ ] Yönetici/sorumlu yanıt verme özelliği YOK
- [ ] Yanıtları kullanıcıların görebileceği UI YOK

### Madde 15 — Doğrulama ve Güvenilirlik ⚠️ Kısmen
- [x] Giriş yapmış kullanıcı kontrolü (login guard) — satın alma ve rezervasyonda
- [x] **Trigger'lar veritabanı seviyesinde yazıldı** (`init_database.sql`)
- [ ] UI'da "Doğrulanmış Alıcı" rozeti YOK
- [ ] Etkinliğe katılım kontrolü UI'da gösterilmiyor

### Madde 16 — İstatistik ve Raporlama ✅ Büyük Ölçüde Tamamlandı
- [x] Admin Dashboard KPI kartları (müşteri, satış, rezervasyon, gelir)
- [x] EventStatisticsView tablosu (doluluk, puan, rezervasyon sayısı)
- [x] ArtworkStatisticsView tablosu (beğeni, yorum, puan)
- [x] SupportTickets tablosu
- [ ] Görüntülenme sayısı (view count) eksik

---

## 📌 FAZ 3 — Gerçek Backend Kurulumu (API)

> **Mevcut Durum:** Devam Ediyor... ⏳

- [x] **Proje Altyapısı**
  - [x] Python virtual environment kurulumu
  - [x] Flask ve Flask-CORS paketlerinin yüklenmesi
- [x] **Veritabanı (SQLite)**
  - [x] `init_sqlite.sql` şemasının oluşturulması
  - [x] Tabloların oluşturulup örnek (seed) verilerin eklenmesi
- [ ] **REST API Uç Noktaları**
  - [x] `GET /api/artworks` ve `GET /api/events` (Listeleme)
  - [x] `POST /api/register` ve `POST /api/login` (Auth)
  - [ ] `POST /api/favorites` (Favorilere ekleme/çıkarma)
  - [ ] `POST /api/reservations` (Rezervasyon yapma)
  - [ ] `POST /api/orders` (Satın alma)
  - [ ] Yorumlar ve İstatistikler için API endpointleri

---

## 📌 FAZ 4 — UI Entegrasyonu ve Eksik Özelliklerin Tamamlanması

> **Mevcut Durum:** Bekliyor... ❌

### Öncelik 1 — Backend Bağlantısı (Fetch API)
- [x] Eserler ve Etkinlikler mock veriler yerine sunucudan çekilecek
- [x] Giriş/Kayıt işlemleri gerçek API üzerinden yapılacak

### Öncelik 2 — Eksik Arayüzlerin Eklenmesi
- [ ] **Favori Listesi Sayfası** ekle (Madde 3)
- [x] **Rezervasyon Formu** — katılımcı sayısı seçimi (Madde 4)
- [x] **Profil Sayfası** — bilgi güncelleme, geçmiş siparişler, rezervasyon yönetimi (Madde 5, 7, 8)
- [x] **Ödeme Ekranı Modalı** — yöntem seçimi ve onay (Madde 6)
- [ ] **Yorum Sistemi** — eser/etkinlik detayında (Madde 12, 13, 14)

### Öncelik 3 — Ekstra Özellikler
- [ ] **İndirim/Kupon Sistemi** — ödeme ekranında (Madde 9)
- [ ] **Karşılaştırma Aracı** — eser/etkinlik kıyaslama (Madde 11)
- [ ] **Destek Formu** — profil üzerinden iletişim (Madde 10)

---

## 📌 FAZ 5 — Rapor Hazırlama

> **Mevcut Durum:** Bekliyor... ❌

- [ ] **Kapak sayfası** — sistem görseli (ekran görüntüsü) dahil
- [ ] **Veritabanı tasarımı bölümü** — `veritabani_tasarimi.md` → PDF
- [ ] **ER Diyagramı bölümü** — `er_diagram.md` Mermaid → ekran görüntüsü
- [ ] **Tablo ve ilişkiler açıklaması** 
- [ ] **Kullanıcı arayüzü tanıtımı** — ekran görüntüleri
- [ ] **View ve Trigger açıklamaları** — `views_and_triggers.md` → PDF
- [ ] **Raporu PDF olarak dışa aktar**

---

## 📊 Mevcut Durum Özeti

| # | Madde | Durum | Puan Tahmini |
|---|-------|-------|-------------|
| 1 | Eserleri İnceleme | ✅ Tam (UI) | 6/6 |
| 2 | Atölye/Etkinlik Görüntüleme | ✅ Tam (UI) | 6/6 |
| 3 | Favorilere Ekleme | ✅ Tamamlandı | 6/6 |
| 4 | Rezervasyon Oluşturma | ✅ Tamamlandı | 6/6 |
| 5 | Rezervasyonu Güncelleme | ✅ Tamamlandı | 6/6 |
| 6 | Satın Alma ve Ödeme | ✅ Tamamlandı | 6/6 |
| 7 | Hesap Yönetimi | ✅ Tamamlandı | 6/6 |
| 8 | Sipariş ve Rezervasyon Takibi | ✅ Tamamlandı | 6/6 |
| 9 | İndirim ve Kampanyalar | ✅ Tamamlandı | 6/6 |
| 10 | Müşteri Destek | ⏳ Yapılacak | 0/6 |
| 11 | Karşılaştırma | ⏳ Yapılacak | 0/6 |
| 12 | Yorum Ekleme | ⏳ Yapılacak | 0/6 |
| 13 | Yorumları Değerlendirme | ⏳ Yapılacak | 0/6 |
| 14 | Yorumlara Yanıt | ⏳ Yapılacak | 0/6 |
| 15 | Doğrulama ve Güvenilirlik | ⚠️ DB Kısmen ✅ | 3/6 |
| 16 | İstatistik ve Raporlama | ✅ Büyük Ölçüde | 5/6 |
| — | Arayüz Kalitesi | ✅ İyi | 7/10 |
| **TOPLAM** | | | **~33/106** |

> ⚠️ **Uyarı:** Proje gerçek veritabanı ile çalışacak şekilde yeniden yapılandırıldığı için bazı puanlar (Favori vb.) Backend tamamlanana kadar "Yapılacak" durumuna çekilmiştir.
