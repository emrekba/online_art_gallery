# Gelişmiş Veritabanı İşlemleri (View & Trigger)

Ödev dokümanındaki 15. ve 16. maddelerde yer alan "Doğrulama ve Güvenilirlik" ile "İstatistik ve Raporlama" gereksinimlerini doğrudan veritabanı seviyesinde çözmek için aşağıdaki SQL kodlarını kullanabilirsin. 

Raporuna bu kodları ekleyerek hocana işin sadece tabloları oluşturmaktan ibaret olmadığını, veritabanı güvenliği ve iş mantığı (business logic) kurguladığını gösterebilirsin.

---

## 1. Tetikleyiciler (Triggers)

Tetikleyiciler, veritabanında bir işlem (INSERT, UPDATE, DELETE) yapılmadan önce veya sonra otomatik olarak çalışan kod bloklarıdır.

### A. Etkinliğe Katılmayanların Yorum Yapmasını Engelleme
*(Madde 15: Etkinlik yorumu yapabilmek için kullanıcının ilgili etkinliğe katılmış olması)*

Kullanıcı `Comments` tablosuna bir etkinlik ('Event') için yorum eklemeye çalıştığında, önce `Reservations` tablosuna bakarak o kullanıcının gerçekten o etkinliğe rezervasyonu olup olmadığını kontrol ediyoruz.

```sql
DELIMITER //

CREATE TRIGGER Check_Event_Comment_Eligibility
BEFORE INSERT ON Comments
FOR EACH ROW
BEGIN
    DECLARE is_participant INT;

    -- Eğer yorum bir etkinliğe yapılıyorsa
    IF NEW.EntityType = 'Event' THEN
        -- Kullanıcının bu etkinliğe aktif bir rezervasyonu var mı kontrol et
        SELECT COUNT(*) INTO is_participant
        FROM Reservations
        WHERE UserID = NEW.UserID 
          AND EventID = NEW.EntityID 
          AND Status = 'Active';

        -- Eğer rezervasyon yoksa hata fırlat ve yorumu engelle
        IF is_participant = 0 THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Hata: Bu etkinliğe yorum yapabilmek için katılım sağlamış olmanız gerekmektedir.';
        END IF;
    END IF;
END;
//
DELIMITER ;
```

### B. Sadece Eseri Satın Alanların Doğrulanmış Yorum Yapabilmesi
*(Madde 15: Satın alınan eserler için doğrulanmış değerlendirme sistemi kurulması)*

```sql
DELIMITER //

CREATE TRIGGER Check_Artwork_Comment_Eligibility
BEFORE INSERT ON Comments
FOR EACH ROW
BEGIN
    DECLARE has_purchased INT;

    -- Eğer yorum bir esere yapılıyorsa
    IF NEW.EntityType = 'Artwork' THEN
        -- Kullanıcının bu eseri satın alıp almadığını Orders ve OrderDetails üzerinden kontrol et
        SELECT COUNT(*) INTO has_purchased
        FROM Orders o
        JOIN OrderDetails od ON o.OrderID = od.OrderID
        WHERE o.UserID = NEW.UserID 
          AND od.ArtworkID = NEW.EntityID
          AND o.Status = 'Completed';

        -- Eğer satın almamışsa hata fırlat
        IF has_purchased = 0 THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Hata: Sadece satın aldığınız eserleri değerlendirebilirsiniz.';
        END IF;
    END IF;
END;
//
DELIMITER ;
```

---

## 2. Görünümler (Views)

Görünümler (Views), karmaşık SQL sorgularını (JOIN'ler, Matematiksel hesaplamalar) tek bir sanal tablo gibi çağırabilmemizi sağlar. İstatistik ve Raporlama (Madde 16) için çok önemlidir.

### A. Etkinlik İstatistikleri Görünümü
*(Madde 16: Etkinlik bazında doluluk oranı, ortalama puan ve toplam rezervasyon sayıları)*

Bu View sayesinde, tek bir `SELECT * FROM EventStatisticsView;` sorgusuyla tüm etkinliklerin ne kadar dolduğu ve kaç puan aldığını görebiliriz.

```sql
CREATE VIEW EventStatisticsView AS
SELECT 
    e.EventID,
    e.Title AS Etkinlik_Adi,
    e.Capacity AS Toplam_Kontenjan,
    IFNULL(SUM(r.ParticipantCount), 0) AS Toplam_Kayitli_Kisi,
    -- Doluluk oranını % olarak hesapla
    ROUND((IFNULL(SUM(r.ParticipantCount), 0) / e.Capacity) * 100, 2) AS Doluluk_Orani_Yuzde,
    -- Ortalama yorum puanını hesapla
    IFNULL(ROUND(AVG(c.Rating), 1), 0) AS Ortalama_Puan,
    COUNT(DISTINCT r.ReservationID) AS Toplam_Rezervasyon_Islemi
FROM Events e
LEFT JOIN Reservations r ON e.EventID = r.EventID AND r.Status = 'Active'
LEFT JOIN Comments c ON e.EventID = c.EntityID AND c.EntityType = 'Event'
GROUP BY e.EventID, e.Title, e.Capacity;
```

### B. Eser İstatistikleri Görünümü
*(Madde 16: Eser bazında toplam beğeni ve yorum sayıları)*

```sql
CREATE VIEW ArtworkStatisticsView AS
SELECT 
    a.ArtworkID,
    a.Title AS Eser_Adi,
    art.Name AS Sanatci,
    a.Price AS Fiyat,
    a.StockStatus AS Durum,
    -- Kaç kişi favoriye eklemiş
    COUNT(DISTINCT f.FavoriteID) AS Toplam_Begenilme,
    -- Kaç yorum yapılmış
    COUNT(DISTINCT c.CommentID) AS Toplam_Yorum,
    -- Ortalama eser puanı
    IFNULL(ROUND(AVG(c.Rating), 1), 0) AS Ortalama_Puan
FROM Artworks a
JOIN Artists art ON a.ArtistID = art.ArtistID
LEFT JOIN Favorites f ON a.ArtworkID = f.ArtworkID
LEFT JOIN Comments c ON a.ArtworkID = c.EntityID AND c.EntityType = 'Artwork'
GROUP BY a.ArtworkID, a.Title, art.Name, a.Price, a.StockStatus;
```

### C. Yönetici Özet Raporu (Dashboard)
*(Madde 16: Yönetici için özet rapor ekranı oluşturma)*

Sistemdeki toplam kullanıcı, toplam elde edilen gelir ve satılan eser sayılarını tek bir yerde toplayan rapor.

```sql
CREATE VIEW AdminSummaryDashboard AS
SELECT
    (SELECT COUNT(*) FROM Users WHERE Role = 'Customer') AS Toplam_Musteri_Sayisi,
    (SELECT COUNT(*) FROM Artworks WHERE StockStatus = 'Sold') AS Satilan_Toplam_Eser,
    (SELECT COUNT(*) FROM Reservations WHERE Status = 'Active') AS Aktif_Rezervasyon_Sayisi,
    (SELECT IFNULL(SUM(TotalAmount), 0) FROM Orders WHERE Status = 'Completed') AS Toplam_Satis_Geliri_TL,
    (SELECT IFNULL(SUM(TotalPrice), 0) FROM Reservations WHERE Status = 'Active') AS Toplam_Etkinlik_Geliri_TL;
```
