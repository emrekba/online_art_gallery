# Online Sanat Galerisi ve Atölye Rezervasyon Sistemi - Veritabanı Tasarımı

Aşağıda, 16 maddelik sistem gereksinimlerini karşılayacak olan ilişkisel veritabanı tabloları ve bu tabloların PostgreSQL/MySQL uyumlu SQL kodları (DDL) bulunmaktadır.

## 1. Temel Tablolar (Varlıklar)

### `Users` (Kullanıcılar)
Sisteme kayıt olan müşteriler, yöneticiler ve destek ekipleri bu tabloda tutulur.
- **UserID** (PK)
- **FullName**: Ad soyad
- **Email**: Giriş için e-posta (Unique)
- **PasswordHash**: Şifre
- **Role**: Kullanıcı yetkisi ('Customer', 'Admin', 'GalleryManager')
- **CreatedAt**: Kayıt tarihi

### `Artists` (Sanatçılar)
Eserlerin sahipleridir.
- **ArtistID** (PK)
- **Name**: Sanatçı adı
- **Biography**: Sanatçı hakkında bilgi
- **ProfileImage**: Fotoğraf URL

### `Artworks` (Eserler)
Sergilenen veya satılan sanat eserleri.
- **ArtworkID** (PK)
- **ArtistID** (FK) -> `Artists`
- **Title**: Eser adı
- **Description**: Açıklama
- **Category**: Kategori (Örn: Yağlı Boya, Heykel)
- **Price**: Fiyat
- **StockStatus**: Stok durumu (Satıldı / Satışta)
- **ImageURL**: Eser görseli

### `Events` (Etkinlikler / Atölyeler)
Düzenlenen atölye ve etkinlikler.
- **EventID** (PK)
- **Title**: Etkinlik adı
- **Description**: Etkinlik detayı
- **EventDate**: Tarih ve saat
- **Capacity**: Toplam kontenjan
- **Price**: Kişi başı ücret

---

## 2. İlişki ve İşlem Tabloları

### `Favorites` (Favoriler)
Kullanıcıların beğendiği eserleri listeler. (Many-to-Many ilişkisi)
- **FavoriteID** (PK)
- **UserID** (FK) -> `Users`
- **ArtworkID** (FK) -> `Artworks`

### `Reservations` (Rezervasyonlar)
Atölye ve etkinlikler için alınan kayıtlar.
- **ReservationID** (PK)
- **UserID** (FK) -> `Users`
- **EventID** (FK) -> `Events`
- **ParticipantCount**: Katılımcı sayısı
- **TotalPrice**: Toplam ödenen/ödenecek tutar
- **Status**: Durum ('Active', 'Updated', 'Cancelled')

### `Orders` ve `OrderDetails` (Siparişler)
Eser satın alımları için.
- **Orders:** `OrderID` (PK), `UserID` (FK), `OrderDate`, `TotalAmount`, `PaymentMethod`, `Status`
- **OrderDetails:** `OrderDetailID` (PK), `OrderID` (FK), `ArtworkID` (FK), `Price`

### `Coupons` (İndirim Kuponları)
- **CouponID** (PK)
- **Code**: Kupon kodu (Örn: SANAT20)
- **DiscountPercent**: Yüzdelik indirim
- **ValidUntil**: Son kullanma tarihi

---

## 3. Etkileşim ve Geri Bildirim Tabloları

### `Comments` (Yorumlar)
Hem eserlere hem de etkinliklere yapılabilen yorumlar. "Yanıt Verme" özelliği için `ParentCommentID` kullanılır.
- **CommentID** (PK)
- **UserID** (FK) -> `Users`
- **EntityType**: Neye yorum yapıldığı ('Artwork', 'Event')
- **EntityID**: Eserin veya Etkinliğin ID'si
- **Content**: Yorum metni
- **Rating**: 1-5 arası puan
- **ParentCommentID** (FK - Self Join): Eğer bir yönetici yanıtlarsa bu doludur.

### `CommentVotes` (Yorum Değerlendirmeleri)
Yorumlara verilen "Faydalı Buldum" oyları.
- **VoteID** (PK)
- **CommentID** (FK) -> `Comments`
- **UserID** (FK) -> `Users`
- **VoteType**: ('Helpful', 'NotHelpful')

### `SupportTickets` (Müşteri Destek)
Kullanıcıların iletişim veya canlı destek talepleri.
- **TicketID** (PK)
- **UserID** (FK) -> `Users`
- **Subject**: Konu
- **Message**: Mesaj
- **Status**: Durum ('Open', 'Closed')

---

## Örnek SQL (DDL) Kodları

Aşağıdaki SQL kodlarını kendi veritabanında çalıştırarak tabloları oluşturabilirsin:

```sql
CREATE TABLE Users (
    UserID SERIAL PRIMARY KEY,
    FullName VARCHAR(100) NOT NULL,
    Email VARCHAR(150) UNIQUE NOT NULL,
    PasswordHash VARCHAR(255) NOT NULL,
    Role VARCHAR(50) DEFAULT 'Customer', -- Customer, Admin, GalleryManager
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Artists (
    ArtistID SERIAL PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Biography TEXT,
    ProfileImage VARCHAR(255)
);

CREATE TABLE Artworks (
    ArtworkID SERIAL PRIMARY KEY,
    ArtistID INT REFERENCES Artists(ArtistID),
    Title VARCHAR(200) NOT NULL,
    Description TEXT,
    Category VARCHAR(100),
    Price DECIMAL(10, 2),
    StockStatus VARCHAR(50) DEFAULT 'Available',
    ImageURL VARCHAR(255),
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Events (
    EventID SERIAL PRIMARY KEY,
    Title VARCHAR(200) NOT NULL,
    Description TEXT,
    EventDate TIMESTAMP NOT NULL,
    Capacity INT NOT NULL,
    Price DECIMAL(10, 2) NOT NULL,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Reservations (
    ReservationID SERIAL PRIMARY KEY,
    UserID INT REFERENCES Users(UserID),
    EventID INT REFERENCES Events(EventID),
    ParticipantCount INT NOT NULL,
    TotalPrice DECIMAL(10, 2) NOT NULL,
    Status VARCHAR(50) DEFAULT 'Active', -- Active, Cancelled
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Favorites (
    FavoriteID SERIAL PRIMARY KEY,
    UserID INT REFERENCES Users(UserID),
    ArtworkID INT REFERENCES Artworks(ArtworkID),
    UNIQUE(UserID, ArtworkID) -- Bir kullanıcı bir eseri sadece bir kez favoriye ekleyebilir
);

CREATE TABLE Comments (
    CommentID SERIAL PRIMARY KEY,
    UserID INT REFERENCES Users(UserID),
    EntityType VARCHAR(50) NOT NULL, -- 'Artwork' veya 'Event'
    EntityID INT NOT NULL,
    Content TEXT NOT NULL,
    Rating INT CHECK (Rating >= 1 AND Rating <= 5),
    ParentCommentID INT REFERENCES Comments(CommentID), -- Yönetici yanıtları için
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE CommentVotes (
    VoteID SERIAL PRIMARY KEY,
    CommentID INT REFERENCES Comments(CommentID),
    UserID INT REFERENCES Users(UserID),
    IsHelpful BOOLEAN NOT NULL,
    UNIQUE(CommentID, UserID) -- Bir yoruma sadece bir kez oy verilebilir
);

CREATE TABLE Orders (
    OrderID SERIAL PRIMARY KEY,
    UserID INT REFERENCES Users(UserID),
    OrderDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    TotalAmount DECIMAL(10, 2) NOT NULL,
    PaymentMethod VARCHAR(50) NOT NULL,
    Status VARCHAR(50) DEFAULT 'Completed'
);

CREATE TABLE OrderDetails (
    OrderDetailID SERIAL PRIMARY KEY,
    OrderID INT REFERENCES Orders(OrderID),
    ArtworkID INT REFERENCES Artworks(ArtworkID),
    Price DECIMAL(10, 2) NOT NULL
);

CREATE TABLE SupportTickets (
    TicketID SERIAL PRIMARY KEY,
    UserID INT REFERENCES Users(UserID),
    Subject VARCHAR(200) NOT NULL,
    Message TEXT NOT NULL,
    Status VARCHAR(50) DEFAULT 'Open',
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```
