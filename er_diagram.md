# Varlık-İlişki (E-R) Diyagramı

Ödev raporunda ("Veritabanı Tasarımının Sunulması") istenen E-R diyagramını aşağıda bulabilirsin. Bu görselleştirme, tabloların birbirlerine nasıl bağlandığını (Foreign Key ve One-to-Many / Many-to-Many yapılarını) göstermektedir. 

Raporuna eklemek için bu diyagramın ekran görüntüsünü alabilirsin.

```mermaid
erDiagram
    Users ||--o{ Favorites : "Favors"
    Users ||--o{ Reservations : "Makes"
    Users ||--o{ Orders : "Places"
    Users ||--o{ Comments : "Writes"
    Users ||--o{ CommentVotes : "Votes on"
    Users ||--o{ SupportTickets : "Opens"
    
    Artists ||--o{ Artworks : "Creates"
    
    Artworks ||--o{ Favorites : "In"
    Artworks ||--o{ OrderDetails : "Part of"
    
    Events ||--o{ Reservations : "Has"
    
    Orders ||--o{ OrderDetails : "Contains"
    
    Comments ||--o{ CommentVotes : "Receives"
    Comments ||--o{ Comments : "Replies to"

    Users {
        int UserID PK
        string FullName
        string Email
        string PasswordHash
        string Role
        datetime CreatedAt
    }
    
    Artists {
        int ArtistID PK
        string Name
        string Biography
        string ProfileImage
    }
    
    Artworks {
        int ArtworkID PK
        int ArtistID FK
        string Title
        string Description
        string Category
        decimal Price
        string StockStatus
        string ImageURL
        datetime CreatedAt
    }
    
    Events {
        int EventID PK
        string Title
        string Description
        datetime EventDate
        int Capacity
        decimal Price
        datetime CreatedAt
    }
    
    Favorites {
        int FavoriteID PK
        int UserID FK
        int ArtworkID FK
    }
    
    Reservations {
        int ReservationID PK
        int UserID FK
        int EventID FK
        int ParticipantCount
        decimal TotalPrice
        string Status
        datetime CreatedAt
    }
    
    Orders {
        int OrderID PK
        int UserID FK
        datetime OrderDate
        decimal TotalAmount
        string PaymentMethod
        string Status
    }
    
    OrderDetails {
        int OrderDetailID PK
        int OrderID FK
        int ArtworkID FK
        decimal Price
    }
    
    Comments {
        int CommentID PK
        int UserID FK
        string EntityType
        int EntityID
        string Content
        int Rating
        int ParentCommentID FK
        datetime CreatedAt
    }
    
    CommentVotes {
        int VoteID PK
        int CommentID FK
        int UserID FK
        boolean IsHelpful
    }
    
    Coupons {
        int CouponID PK
        string Code
        decimal DiscountPercent
        datetime ValidUntil
    }
    
    SupportTickets {
        int TicketID PK
        int UserID FK
        string Subject
        string Message
        string Status
        datetime CreatedAt
    }
```

## Diyagramdaki İlişkilerin Açıklaması (Raporuna Ekleyebilirsin)

*   **Users - Reservations (1:N):** Bir kullanıcı birden fazla etkinlik rezervasyonu yapabilir ancak bir rezervasyon tek bir kullanıcıya aittir.
*   **Users - Favorites - Artworks (N:M):** Çoktan çoğa bir ilişkidir. Bir kullanıcı birden fazla eseri favorileyebilir; bir eser birden fazla kullanıcı tarafından favorilenebilir. `Favorites` tablosu bu ilişkiyi bağlar.
*   **Artists - Artworks (1:N):** Bir sanatçının birden fazla eseri olabilir fakat bir eserin yalnızca tek bir sanatçısı vardır.
*   **Orders - OrderDetails - Artworks (1:N & N:1):** Bir sipariş içinde birden çok eser olabilir. `OrderDetails` (Sipariş Detayları) tablosu hangi siparişte hangi eserlerin olduğunu tutar.
*   **Comments - CommentVotes (1:N):** Bir yorum, birden fazla kullanıcıdan "Faydalı" oyu alabilir.
*   **Comments - Comments (1:N - Self Join):** Galerici bir yoruma yanıt verdiğinde, bu yanıt kendi içinde `Comments` tablosunda tutulur ancak `ParentCommentID` değeriyle asıl yoruma bağlanır.
