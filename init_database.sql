-- ==========================================================
-- Online Sanat Galerisi ve Atölye Rezervasyon Sistemi
-- Veritabanı Oluşturma Scripti (DDL, Views, Triggers)
-- ==========================================================

-- Veritabanı oluşturmak isterseniz aşağıdaki iki satırın başındaki yorum işaretlerini kaldırabilirsiniz:
-- CREATE DATABASE ArtGalleryDB;
-- USE ArtGalleryDB;

-- ==========================================================
-- 1. TABLOLARIN OLUŞTURULMASI
-- ==========================================================

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
    UNIQUE(UserID, ArtworkID)
);

CREATE TABLE Comments (
    CommentID SERIAL PRIMARY KEY,
    UserID INT REFERENCES Users(UserID),
    EntityType VARCHAR(50) NOT NULL, -- 'Artwork' veya 'Event'
    EntityID INT NOT NULL,
    Content TEXT NOT NULL,
    Rating INT CHECK (Rating >= 1 AND Rating <= 5),
    ParentCommentID INT REFERENCES Comments(CommentID),
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE CommentVotes (
    VoteID SERIAL PRIMARY KEY,
    CommentID INT REFERENCES Comments(CommentID),
    UserID INT REFERENCES Users(UserID),
    IsHelpful BOOLEAN NOT NULL,
    UNIQUE(CommentID, UserID)
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

-- ==========================================================
-- 2. TETİKLEYİCİLER (TRIGGERS)
-- ==========================================================

DELIMITER //

CREATE TRIGGER Check_Event_Comment_Eligibility
BEFORE INSERT ON Comments
FOR EACH ROW
BEGIN
    DECLARE is_participant INT;

    IF NEW.EntityType = 'Event' THEN
        SELECT COUNT(*) INTO is_participant
        FROM Reservations
        WHERE UserID = NEW.UserID 
          AND EventID = NEW.EntityID 
          AND Status = 'Active';

        IF is_participant = 0 THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Hata: Bu etkinliğe yorum yapabilmek için katılım sağlamış olmanız gerekmektedir.';
        END IF;
    END IF;
END;
//

CREATE TRIGGER Check_Artwork_Comment_Eligibility
BEFORE INSERT ON Comments
FOR EACH ROW
BEGIN
    DECLARE has_purchased INT;

    IF NEW.EntityType = 'Artwork' THEN
        SELECT COUNT(*) INTO has_purchased
        FROM Orders o
        JOIN OrderDetails od ON o.OrderID = od.OrderID
        WHERE o.UserID = NEW.UserID 
          AND od.ArtworkID = NEW.EntityID
          AND o.Status = 'Completed';

        IF has_purchased = 0 THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Hata: Sadece satın aldığınız eserleri değerlendirebilirsiniz.';
        END IF;
    END IF;
END;
//
DELIMITER ;

-- ==========================================================
-- 3. GÖRÜNÜMLER (VIEWS)
-- ==========================================================

CREATE VIEW EventStatisticsView AS
SELECT 
    e.EventID,
    e.Title AS Etkinlik_Adi,
    e.Capacity AS Toplam_Kontenjan,
    IFNULL(SUM(r.ParticipantCount), 0) AS Toplam_Kayitli_Kisi,
    ROUND((IFNULL(SUM(r.ParticipantCount), 0) / e.Capacity) * 100, 2) AS Doluluk_Orani_Yuzde,
    IFNULL(ROUND(AVG(c.Rating), 1), 0) AS Ortalama_Puan,
    COUNT(DISTINCT r.ReservationID) AS Toplam_Rezervasyon_Islemi
FROM Events e
LEFT JOIN Reservations r ON e.EventID = r.EventID AND r.Status = 'Active'
LEFT JOIN Comments c ON e.EventID = c.EntityID AND c.EntityType = 'Event'
GROUP BY e.EventID, e.Title, e.Capacity;

CREATE VIEW ArtworkStatisticsView AS
SELECT 
    a.ArtworkID,
    a.Title AS Eser_Adi,
    art.Name AS Sanatci,
    a.Price AS Fiyat,
    a.StockStatus AS Durum,
    COUNT(DISTINCT f.FavoriteID) AS Toplam_Begenilme,
    COUNT(DISTINCT c.CommentID) AS Toplam_Yorum,
    IFNULL(ROUND(AVG(c.Rating), 1), 0) AS Ortalama_Puan
FROM Artworks a
JOIN Artists art ON a.ArtistID = art.ArtistID
LEFT JOIN Favorites f ON a.ArtworkID = f.ArtworkID
LEFT JOIN Comments c ON a.ArtworkID = c.EntityID AND c.EntityType = 'Artwork'
GROUP BY a.ArtworkID, a.Title, art.Name, a.Price, a.StockStatus;

CREATE VIEW AdminSummaryDashboard AS
SELECT
    (SELECT COUNT(*) FROM Users WHERE Role = 'Customer') AS Toplam_Musteri_Sayisi,
    (SELECT COUNT(*) FROM Artworks WHERE StockStatus = 'Sold') AS Satilan_Toplam_Eser,
    (SELECT COUNT(*) FROM Reservations WHERE Status = 'Active') AS Aktif_Rezervasyon_Sayisi,
    (SELECT IFNULL(SUM(TotalAmount), 0) FROM Orders WHERE Status = 'Completed') AS Toplam_Satis_Geliri_TL,
    (SELECT IFNULL(SUM(TotalPrice), 0) FROM Reservations WHERE Status = 'Active') AS Toplam_Etkinlik_Geliri_TL;
