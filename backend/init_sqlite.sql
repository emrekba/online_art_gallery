-- SQLite Uyumlu Veritabanı Şeması
-- init_database.sql dosyasından SQLite'a uyarlanmıştır.

CREATE TABLE Users (
    UserID INTEGER PRIMARY KEY AUTOINCREMENT,
    FullName TEXT NOT NULL,
    Email TEXT UNIQUE NOT NULL,
    PasswordHash TEXT NOT NULL,
    Role TEXT DEFAULT 'Customer',
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
    Title TEXT NOT NULL,
    Description TEXT,
    Category TEXT,
    Price REAL,
    StockStatus TEXT DEFAULT 'Available',
    ImageURL TEXT,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Events (
    EventID INTEGER PRIMARY KEY AUTOINCREMENT,
    Title TEXT NOT NULL,
    Description TEXT,
    EventDate DATETIME NOT NULL,
    Capacity INTEGER NOT NULL,
    Price REAL NOT NULL,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Reservations (
    ReservationID INTEGER PRIMARY KEY AUTOINCREMENT,
    UserID INTEGER REFERENCES Users(UserID),
    EventID INTEGER REFERENCES Events(EventID),
    ParticipantCount INTEGER NOT NULL,
    TotalPrice REAL NOT NULL,
    Status TEXT DEFAULT 'Active',
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
    IsHelpful INTEGER NOT NULL, -- SQLite doesn't have BOOLEAN, usually 0/1
    UNIQUE(CommentID, UserID)
);

CREATE TABLE Orders (
    OrderID INTEGER PRIMARY KEY AUTOINCREMENT,
    UserID INTEGER REFERENCES Users(UserID),
    OrderDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    TotalAmount REAL NOT NULL,
    PaymentMethod TEXT NOT NULL,
    Status TEXT DEFAULT 'Completed'
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
    DiscountType TEXT NOT NULL,
    DiscountValue REAL NOT NULL,
    IsActive INTEGER DEFAULT 1
);

-- Seed Data (Örnek Veriler)
INSERT INTO Coupons (Code, DiscountType, DiscountValue) VALUES 
('KTU10', 'Percent', 10),
('ART50', 'Fixed', 50);
INSERT INTO Artists (Name, Biography, ProfileImage) VALUES 
('Zeynep Arslan', 'Yağlı boya sanatçısı', 'linear-gradient(135deg,#1a0533,#a855f7)'),
('Murat Demir', 'Suluboya ustası', 'linear-gradient(135deg,#0c4a6e,#22d3ee)'),
('Ayşe Kaya', 'Modern heykel', 'linear-gradient(135deg,#78350f,#f59e0b)'),
('Can Yıldız', 'Dijital illüstratör', 'linear-gradient(135deg,#064e3b,#10b981)'),
('Elif Şahin', 'Profesyonel fotoğrafçı', 'linear-gradient(135deg,#1e1b4b,#6366f1)');

INSERT INTO Artworks (ArtistID, Title, Category, Price, StockStatus, ImageURL) VALUES 
(1, 'Boğazd''da Gün Batımı', 'Yağlı Boya', 18500, 'Available', 'linear-gradient(135deg,#1a0533,#4a1a8a,#c2410c,#fbbf24)'),
(2, 'Mavi Rüya', 'Suluboya', 4200, 'Available', 'linear-gradient(135deg,#0c4a6e,#22d3ee,#a7f3d0)'),
(3, 'Toprak Ana', 'Heykel', 31000, 'Available', 'linear-gradient(135deg,#78350f,#d97706,#fef3c7)'),
(4, 'Dijital Kaos', 'Dijital', 2800, 'Available', 'linear-gradient(135deg,#064e3b,#10b981,#d1fae5)'),
(5, 'İstanbul Sisli', 'Fotoğraf', 6500, 'Available', 'linear-gradient(135deg,#1e1b4b,#6366f1,#e0e7ff)'),
(1, 'Kızıl Orman', 'Yağlı Boya', 22000, 'Available', 'linear-gradient(135deg,#450a0a,#dc2626,#fca5a5)'),
(2, 'Yağmur Sonrası', 'Suluboya', 3800, 'Available', 'linear-gradient(135deg,#1e3a5f,#3b82f6,#bfdbfe)'),
(3, 'Sonsuzluk', 'Heykel', 45000, 'Available', 'linear-gradient(135deg,#2d1b69,#8b5cf6,#ede9fe)');

INSERT INTO Events (Title, Description, EventDate, Capacity, Price) VALUES 
('Yağlı Boya Atölyesi', 'Başlangıç seviyesi yağlı boya teknikleri.', '2026-05-15 10:00:00', 20, 450),
('Modern Sanat Sergisi', 'Çağdaş Türk sanatçıların sergisi.', '2026-05-20 18:00:00', 200, 120),
('Suluboya Workshop', 'Profesyonel suluboya teknikleri.', '2026-06-02 14:00:00', 15, 380),
('Heykel Temel Kurs', 'Kil ile heykel yapımının temelleri.', '2026-06-10 10:00:00', 12, 1200),
('Fotoğraf & Sanat', 'Dijital arşivleme teknikleri.', '2026-06-18 13:00:00', 25, 280),
('Dijital İllüstrasyon', 'Tablet ile dijital sanat üretimi.', '2026-07-05 11:00:00', 18, 650);

-- Mock User (şifre 123456 hash'lenmiş varsayalım)
INSERT INTO Users (FullName, Email, PasswordHash, Role) VALUES 
('Admin User', 'admin@artverse.com', 'scrypt:32768:8:1$7eL9s2A4$b2b...', 'Admin');
