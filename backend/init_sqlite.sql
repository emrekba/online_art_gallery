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
    ViewCount INTEGER DEFAULT 0,
    SellerID INTEGER REFERENCES Users(UserID),
    DiscountRate INTEGER DEFAULT 0,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Events (
    EventID INTEGER PRIMARY KEY AUTOINCREMENT,
    Title TEXT NOT NULL,
    Description TEXT,
    EventDate DATETIME NOT NULL,
    Capacity INTEGER NOT NULL,
    Price REAL NOT NULL,
    SellerID INTEGER REFERENCES Users(UserID),
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
    IsHelpful INTEGER NOT NULL, -- SQLite doesn't have BOOLEAN, usually 0/1
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
    DiscountType TEXT NOT NULL,
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

-- Seed Data (Örnek Veriler)
INSERT INTO Coupons (Code, DiscountType, DiscountValue) VALUES 
('KTU10', 'Percent', 10),
('ART50', 'Fixed', 50);

-- Mock User (şifre: admin123)
INSERT INTO Users (FullName, Email, PasswordHash, Role) VALUES 
('Admin User', 'admin@artverse.com', 'scrypt:32768:8:1$SD9DBbvb0BCVG3HW$abc013cb2bcf023b9b83a1f16019655647d8c0dd68a79c0dbab72201eb5805c625e883a7ae8d704a53253a1004f48f3d539f5c57d2494a2c31c925330aecfd81', 'Admin');
