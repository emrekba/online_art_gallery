# Online Sanat Galerisi ve Atölye Rezervasyon Sistemi - Veritabanı Tasarımı

Aşağıda sistemin mevcut SQLite veritabanı şeması ve tablo açıklamaları bulunmaktadır.

---

## 1. Temel Tablolar (Varlıklar)

### `Users` (Kullanıcılar)
Sisteme kayıt olan tüm kullanıcılar bu tabloda tutulur.
- **UserID** (PK)
- **FullName**: Ad soyad
- **Email**: Giriş için e-posta (Unique)
- **PasswordHash**: Scrypt algoritmasıyla hashlenmiş şifre
- **Role**: Kullanıcı yetkisi — `'Customer'`, `'Admin'`, `'Seller'`
- **CreatedAt**: Kayıt tarihi

### `Artists` (Sanatçılar)
Eserlere atanan sanatçı profilleri.
- **ArtistID** (PK)
- **Name**: Sanatçı adı
- **Biography**: Sanatçı hakkında bilgi
- **ProfileImage**: Profil görseli (URL veya CSS gradient)

### `Artworks` (Eserler)
Sergilenen veya satılan sanat eserleri.
- **ArtworkID** (PK)
- **ArtistID** (FK → `Artists`): Eseri yapan sanatçı (opsiyonel)
- **SellerID** (FK → `Users`): Eseri platforma ekleyen satıcı kullanıcı
- **Title**: Eser adı
- **Description**: Açıklama
- **Category**: Kategori (Yağlı Boya, Suluboya, Heykel, Dijital, Fotoğraf)
- **Price**: Fiyat
- **StockStatus**: Stok durumu (`'Available'`, `'Sold'`)
- **ImageURL**: Eser görseli (URL veya CSS gradient)
- **ViewCount**: Görüntülenme sayısı (varsayılan: 0)
- **DiscountRate**: İndirim oranı % (varsayılan: 0)
- **CreatedAt**: Eklenme tarihi

### `Events` (Etkinlikler / Atölyeler)
Düzenlenen atölye ve etkinlikler.
- **EventID** (PK)
- **SellerID** (FK → `Users`): Etkinliği ekleyen satıcı kullanıcı
- **Title**: Etkinlik adı
- **Description**: Etkinlik detayı
- **EventDate**: Tarih ve saat
- **Capacity**: Toplam kontenjan (kişi)
- **Price**: Kişi başı ücret
- **EventType**: Etkinlik türü (`'Atölye'`, `'Sergi'`, `'Workshop'`) — varsayılan `'Atölye'`
- **DurationDays**: Süre (gün) — varsayılan 3
- **DiscountRate**: İndirim oranı % (varsayılan: 0)
- **CreatedAt**: Eklenme tarihi

---

## 2. İlişki ve İşlem Tabloları

### `Favorites` (Favoriler)
Kullanıcıların beğendiği eserler. (Users ↔ Artworks arası N:M)
- **FavoriteID** (PK)
- **UserID** (FK → `Users`)
- **ArtworkID** (FK → `Artworks`)
- *UNIQUE(UserID, ArtworkID)*

### `Reservations` (Rezervasyonlar)
Etkinlikler için alınan katılım kayıtları.
- **ReservationID** (PK)
- **UserID** (FK → `Users`)
- **EventID** (FK → `Events`)
- **ParticipantCount**: Katılımcı sayısı
- **TotalPrice**: Toplam ödenen tutar
- **ReservationDate**: Rezervasyon/oturum tarihi
- **PaymentMethod**: Ödeme yöntemi (Kredi Kartı, Havale vb.)
- **Status**: Durum (`'Active'`, `'Pending'`, `'Cancelled'`)
- **CreatedAt**: Oluşturulma tarihi

### `Orders` ve `OrderDetails` (Siparişler)
Eser satın alımları için.
- **Orders:** `OrderID` (PK), `UserID` (FK), `OrderDate`, `TotalAmount`, `PaymentMethod`, `Status`
- **OrderDetails:** `OrderDetailID` (PK), `OrderID` (FK), `ArtworkID` (FK), `Price`

### `Coupons` (İndirim Kuponları)
- **CouponID** (PK)
- **Code**: Kupon kodu — Unique (Örn: KTU10)
- **DiscountType**: İndirim türü (`'Percent'`, `'Fixed'`)
- **DiscountValue**: İndirim miktarı (% veya TL)
- **IsActive**: Aktif mi? (1 = Aktif, 0 = Pasif)

### `SavedComparisons` (Kaydedilen Karşılaştırmalar)
Kullanıcıların kaydettiği eser/etkinlik karşılaştırmaları.
- **ComparisonID** (PK)
- **UserID** (FK → `Users`)
- **EntityType**: Karşılaştırılan varlık türü (`'Artwork'`, `'Event'`)
- **EntityIDs**: Virgülle ayrılmış ID listesi (Örn: `"3,7,12"`)
- **CreatedAt**: Kaydetme tarihi

---

## 3. Etkileşim ve Geri Bildirim Tabloları

### `Comments` (Yorumlar)
Hem eserlere hem etkinliklere yapılabilen yorumlar. `ParentCommentID` ile admin yanıtları desteklenir.
- **CommentID** (PK)
- **UserID** (FK → `Users`)
- **EntityType**: `'Artwork'` veya `'Event'`
- **EntityID**: Eserin veya Etkinliğin ID'si
- **Content**: Yorum metni
- **Rating**: 1–5 arası puan (NULL ise puan verilmemiş)
- **ParentCommentID** (FK → `Comments`): Admin yanıtı için self-join
- **CreatedAt**: Yorum tarihi

### `CommentVotes` (Yorum Değerlendirmeleri)
Yorumlara verilen "Faydalı Buldum" oyları.
- **VoteID** (PK)
- **CommentID** (FK → `Comments`)
- **UserID** (FK → `Users`)
- **IsHelpful**: 1 = Faydalı, 0 = Faydasız
- *UNIQUE(CommentID, UserID)*

### `SupportTickets` (Müşteri Destek)
Kullanıcıların destek talepleri.
- **TicketID** (PK)
- **UserID** (FK → `Users`)
- **Subject**: Konu
- **Message**: Mesaj
- **AdminResponse**: Yönetici yanıtı (NULL ise henüz yanıtlanmamış)
- **Status**: Durum (`'Open'`, `'Closed'`)
- **CreatedAt**: Tarih

---

## Örnek SQL (SQLite DDL)

```sql
CREATE TABLE Users (
    UserID INTEGER PRIMARY KEY AUTOINCREMENT,
    FullName TEXT NOT NULL,
    Email TEXT UNIQUE NOT NULL,
    PasswordHash TEXT NOT NULL,
    Role TEXT DEFAULT 'Customer', -- Customer, Admin, Seller
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Artists (
    ArtistID INTEGER PRIMARY KEY AUTOINCREMENT,
    Name TEXT NOT NULL,
    Biography TEXT,
    ProfileImage TEXT
);

CREATE TABLE Artworks (
    ArtworkID INTEGER PRIMARY KEY AUTOINCREMENT,
    ArtistID INTEGER REFERENCES Artists(ArtistID),
    SellerID INTEGER REFERENCES Users(UserID),
    Title TEXT NOT NULL,
    Description TEXT,
    Category TEXT,
    Price REAL,
    StockStatus TEXT DEFAULT 'Available',
    ImageURL TEXT,
    ViewCount INTEGER DEFAULT 0,
    DiscountRate INTEGER DEFAULT 0,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Events (
    EventID INTEGER PRIMARY KEY AUTOINCREMENT,
    SellerID INTEGER REFERENCES Users(UserID),
    Title TEXT NOT NULL,
    Description TEXT,
    EventDate DATETIME NOT NULL,
    Capacity INTEGER NOT NULL,
    Price REAL NOT NULL,
    EventType TEXT DEFAULT 'Atölye',
    DurationDays INTEGER DEFAULT 3,
    DiscountRate INTEGER DEFAULT 0,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Reservations (
    ReservationID INTEGER PRIMARY KEY AUTOINCREMENT,
    UserID INTEGER REFERENCES Users(UserID),
    EventID INTEGER REFERENCES Events(EventID),
    ParticipantCount INTEGER NOT NULL,
    TotalPrice REAL NOT NULL,
    ReservationDate DATETIME,
    PaymentMethod TEXT,
    Status TEXT DEFAULT 'Pending',
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Favorites (
    FavoriteID INTEGER PRIMARY KEY AUTOINCREMENT,
    UserID INTEGER REFERENCES Users(UserID),
    ArtworkID INTEGER REFERENCES Artworks(ArtworkID),
    UNIQUE(UserID, ArtworkID)
);

CREATE TABLE Comments (
    CommentID INTEGER PRIMARY KEY AUTOINCREMENT,
    UserID INTEGER REFERENCES Users(UserID),
    EntityType TEXT NOT NULL,
    EntityID INTEGER NOT NULL,
    Content TEXT NOT NULL,
    Rating INTEGER CHECK (Rating >= 1 AND Rating <= 5),
    ParentCommentID INTEGER REFERENCES Comments(CommentID),
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE CommentVotes (
    VoteID INTEGER PRIMARY KEY AUTOINCREMENT,
    CommentID INTEGER REFERENCES Comments(CommentID),
    UserID INTEGER REFERENCES Users(UserID),
    IsHelpful INTEGER NOT NULL,
    UNIQUE(CommentID, UserID)
);

CREATE TABLE Orders (
    OrderID INTEGER PRIMARY KEY AUTOINCREMENT,
    UserID INTEGER REFERENCES Users(UserID),
    OrderDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    TotalAmount REAL NOT NULL,
    PaymentMethod TEXT NOT NULL,
    Status TEXT DEFAULT 'Pending'
);

CREATE TABLE OrderDetails (
    OrderDetailID INTEGER PRIMARY KEY AUTOINCREMENT,
    OrderID INTEGER REFERENCES Orders(OrderID),
    ArtworkID INTEGER REFERENCES Artworks(ArtworkID),
    Price REAL NOT NULL
);

CREATE TABLE SupportTickets (
    TicketID INTEGER PRIMARY KEY AUTOINCREMENT,
    UserID INTEGER REFERENCES Users(UserID),
    Subject TEXT NOT NULL,
    Message TEXT NOT NULL,
    AdminResponse TEXT,
    Status TEXT DEFAULT 'Open',
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Coupons (
    CouponID INTEGER PRIMARY KEY AUTOINCREMENT,
    Code TEXT UNIQUE NOT NULL,
    DiscountType TEXT NOT NULL,  -- 'Percent' veya 'Fixed'
    DiscountValue REAL NOT NULL,
    IsActive INTEGER DEFAULT 1
);

CREATE TABLE SavedComparisons (
    ComparisonID INTEGER PRIMARY KEY AUTOINCREMENT,
    UserID INTEGER REFERENCES Users(UserID),
    EntityType TEXT NOT NULL,
    EntityIDs TEXT NOT NULL,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```
