# Varlık-İlişki (E-R) Diyagramı

Aşağıdaki diyagram, projenin mevcut SQLite veritabanı şemasına göre hazırlanmıştır.

```mermaid
erDiagram
    Users ||--o{ Favorites : "Favors"
    Users ||--o{ Reservations : "Makes"
    Users ||--o{ Orders : "Places"
    Users ||--o{ Comments : "Writes"
    Users ||--o{ CommentVotes : "Votes on"
    Users ||--o{ SupportTickets : "Opens"
    Users ||--o{ SavedComparisons : "Saves"
    Users ||--o{ Artworks : "Sells (SellerID)"
    Users ||--o{ Events : "Organizes (SellerID)"

    Artists ||--o{ Artworks : "Creates (ArtistID)"

    Artworks ||--o{ Favorites : "In"
    Artworks ||--o{ OrderDetails : "Part of"

    Events ||--o{ Reservations : "Has"

    Orders ||--o{ OrderDetails : "Contains"

    Comments ||--o{ CommentVotes : "Receives"
    Comments ||--o{ Comments : "Replied to"

    Users {
        int UserID PK
        string FullName
        string Email
        string PasswordHash
        string Role "Customer | Admin | Seller"
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
        int SellerID FK
        string Title
        string Description
        string Category
        real Price
        string StockStatus
        string ImageURL
        int ViewCount
        int DiscountRate
        datetime CreatedAt
    }

    Events {
        int EventID PK
        int SellerID FK
        string Title
        string Description
        datetime EventDate
        int Capacity
        real Price
        string EventType
        int DurationDays
        int DiscountRate
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
        real TotalPrice
        datetime ReservationDate
        string PaymentMethod
        string Status
        datetime CreatedAt
    }

    Orders {
        int OrderID PK
        int UserID FK
        datetime OrderDate
        real TotalAmount
        string PaymentMethod
        string Status
    }

    OrderDetails {
        int OrderDetailID PK
        int OrderID FK
        int ArtworkID FK
        real Price
    }

    Comments {
        int CommentID PK
        int UserID FK
        string EntityType "Artwork | Event"
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
        int IsHelpful "1=Faydalı, 0=Faydasız"
    }

    Coupons {
        int CouponID PK
        string Code
        string DiscountType "Percent | Fixed"
        real DiscountValue
        int IsActive
    }

    SupportTickets {
        int TicketID PK
        int UserID FK
        string Subject
        string Message
        string AdminResponse
        string Status
        datetime CreatedAt
    }

    SavedComparisons {
        int ComparisonID PK
        int UserID FK
        string EntityType "Artwork | Event"
        string EntityIDs
        datetime CreatedAt
    }
```

---

## İlişkilerin Açıklaması

| İlişki | Tür | Açıklama |
|--------|-----|----------|
| **Users → Artworks** (SellerID) | 1:N | Bir satıcı kullanıcı birden fazla eser ekleyebilir. |
| **Users → Events** (SellerID) | 1:N | Bir satıcı kullanıcı birden fazla etkinlik düzenleyebilir. |
| **Artists → Artworks** (ArtistID) | 1:N | Bir sanatçının birden fazla eseri olabilir. Eserler satıcı tarafından eklenirken bir sanatçıya atanabilir. |
| **Users → Reservations** | 1:N | Bir kullanıcı birden fazla etkinlik rezervasyonu yapabilir. |
| **Events → Reservations** | 1:N | Bir etkinliğin birden fazla rezervasyonu olabilir. |
| **Users ↔ Artworks** (Favorites) | N:M | Bir kullanıcı birden fazla eseri favorileyebilir; `Favorites` tablosu bu bağı kurar. |
| **Orders → OrderDetails → Artworks** | 1:N / N:1 | Bir sipariş birden çok eser içerebilir; `OrderDetails` ara tablodur. |
| **Comments → CommentVotes** | 1:N | Bir yorum birden fazla kullanıcıdan oy alabilir. |
| **Comments → Comments** (Self Join) | 1:N | Admin yanıtları `ParentCommentID` ile asıl yoruma bağlanır. |
| **Users → SavedComparisons** | 1:N | Kullanıcı, karşılaştırdığı eser/etkinlik gruplarını kaydedip sonradan tekrar açabilir. |
