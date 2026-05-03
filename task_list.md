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
- [x] Uygun tarih ve saat seçimi yapma

### Madde 5 — Rezervasyonu Güncelleme ✅ Tamamlandı
- [x] Profil sayfasında rezervasyon listesi
- [x] Rezervasyon iptal etme (Backend 'Cancelled' güncellemesi)
- [x] Kişi sayısı fiyat yansıması
- [x] Rezervasyon tarihini ve saatini değiştirme özelliği
- [x] Katılımcı sayısını UI üzerinden güncelleme

### Madde 6 — Satın Alma ve Ödeme ⚠️ Kısmen
- [x] Eserler için "Satın Al" butonu (eserler birden fazla kez satın alınabilir; "SATILDI" rozeti kaldırıldı — print/limited-edition mantığı)
- [x] Ödeme yöntemi seçimi (kredi kartı, havale) modalı
- [x] Sipariş onay ekranı ve bildirimler
- [x] Kullanıcı uygun tarih ve saat seçebilmeli.
- [x] Kullanıcı rezervasyon bilgilerini güncelleyebilmeli ve iptal edebilmeli.
- [x] Rezervasyon alırken ödeme modülü entegrasyonu.

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

### Madde 10 — Müşteri Destek ✅ Tamamlandı
- [x] Admin panelinde SupportTickets tablosu görünümü var
- [x] İletişim formu üzerinden soru gönderme
- [x] Canlı destek/mesaj sistemi (Talep/Ticket sistemi olarak uygulandı)
- [x] Destek taleplerinin durumunu görüntüleme
- [x] Admin panelinden taleplere yanıt verme özelliği

### Madde 11 — Karşılaştırma ❌ Eksik
- [ ] Birden fazla etkinliği tarih, ücret ve kontenjan açısından karşılaştırma YOK
- [ ] Birden fazla eseri kategori, fiyat ve sanatçı açısından karşılaştırma YOK
- [ ] Karşılaştırma sonuçlarını kaydetme YOK

### Madde 12 — Yorum Ekleme ✅ Tamamlandı
- [x] Kullanıcıların eserler hakkında yorum yapabilmesi (Profil > Satın Aldıklarım > "Yorum Yap" + Eser modalı)
- [x] Kullanıcıların katıldıkları etkinlikler hakkında değerlendirme yazabilmesi (Profil > Etkinlik Kayıtlarım > "Yorum Yap" + Etkinlik modalı)
- [x] Diğer kullanıcı yorumlarını görüntüleyebilmesi (Eser & Etkinlik modallarında liste + ortalama puan + "Doğrulanmış Alıcı/Katılımcı" rozeti)

### Madde 13 — Yorumları Değerlendirme ve Filtreleme ❌ Eksik
- [ ] Yorumlara puan verme veya faydalı bulma oyu verme YOK
- [ ] Yorumları en yeni, en yüksek puanlı veya en faydalı olacak şekilde filtreleme YOK
- [ ] Ortalama puan bilgilerini görüntüleme YOK (sadece mock data'da var)

### Madde 14 — Yorumlara Yanıt Verme ❌ Eksik
- [ ] Galeri yöneticisinin veya etkinlik sorumlusunun yorumlara yanıt verebilmesi YOK
- [ ] Kullanıcıların bu yanıtları görüntüleyebilmesi YOK

### Madde 15 — Doğrulama ve Güvenilirlik ✅ Tamamlandı
- [x] Yorumların yalnızca giriş yapmış kullanıcılar tarafından yapılabilmesi (UI + backend kontrol)
- [x] Etkinlik yorumu yapabilmek için kullanıcının ilgili etkinliğe katılmış olması (Backend `/api/comments` POST `Reservations.Status='Active'` kontrolü; UI'da "✓ Doğrulanmış Katılımcı" rozeti)
- [x] Satın alınan eserler için doğrulanmış değerlendirme sistemi (Backend `/api/comments` POST yalnızca `Orders.Status='Completed'` alıcıyı kabul eder; UI'da "✓ Doğrulanmış Alıcı" rozeti)

### Madde 16 — İstatistik ve Raporlama ✅ Tamamlandı
- [x] Etkinlik bazında doluluk oranı, ortalama puan ve toplam rezervasyon sayılarını gösterme
- [x] Eser bazında toplam beğeni ve yorum sayısını gösterme
- [x] Yönetici için özet rapor ekranı oluşturma
- [x] Eserler için görüntülenme sayısı (view count) — eser modalı her açıldığında `Artworks.ViewCount` 1 artar; modalde ve admin panelinde gösterilir

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
  - [x] `POST /api/favorites` (Favorilere ekleme/çıkarma)
  - [x] `POST /api/reservations` (Rezervasyon yapma)
  - [x] `POST /api/orders` (Satın alma — çoklu satın almayı destekler)
  - [x] `GET /api/comments/artwork/<id>` ve `GET /api/comments/event/<id>` (yorumları listele)
  - [x] `POST /api/comments` (eser & etkinlik için doğrulamalı yorum oluşturma)
  - [x] `GET /api/user/<id>/purchased-artworks` & `GET /api/user/<id>/attended-events` (yorumlanabilir varlıklar)
  - [ ] İleri istatistik API'leri (Madde 13-14 için: vote, reply)

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
- [x] **Yorum Sistemi (Eser & Etkinlik)** — modal ve profilde "Yorum Yap" + Doğrulanmış Alıcı/Katılımcı rozetleri (Madde 12 ✅)
- [ ] **Faydalı Bulma + Yanıt** — Madde 13, 14 (CommentVotes & ParentCommentID)

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
| 10 | Müşteri Destek | ✅ Tamamlandı | 6/6 |
| 11 | Karşılaştırma | ⏳ Yapılacak | 0/6 |
| 12 | Yorum Ekleme | ✅ Tamamlandı | 6/6 |
| 13 | Yorumları Değerlendirme | ⏳ Yapılacak | 0/6 |
| 14 | Yorumlara Yanıt | ⏳ Yapılacak | 0/6 |
| 15 | Doğrulama ve Güvenilirlik | ✅ Tamamlandı | 6/6 |
| 16 | İstatistik ve Raporlama | ✅ Tamamlandı | 6/6 |
| — | Arayüz Kalitesi | ✅ İyi | 7/10 |
| **TOPLAM** | | | **~43/106** |

> ⚠️ **Uyarı:** Proje gerçek veritabanı ile çalışacak şekilde yeniden yapılandırıldığı için bazı puanlar (Favori vb.) Backend tamamlanana kadar "Yapılacak" durumuna çekilmiştir.
