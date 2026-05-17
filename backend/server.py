import sqlite3
import os
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__, static_folder='../ui', static_url_path='')
CORS(app) # Tüm domainlerden gelen isteklere izin ver

@app.route('/')
def serve_index():
    return send_from_directory(app.static_folder, 'index.html')

DB_FILE = 'gallery.db'

def init_db():
    # Veritabanı yoksa oluştur ve SQL scriptini çalıştır
    if not os.path.exists(DB_FILE):
        print("Veritabanı oluşturuluyor...")
        conn = sqlite3.connect(DB_FILE)
        with open('init_sqlite.sql', 'r', encoding='utf-8') as f:
            conn.executescript(f.read())
        conn.commit()
        conn.close()
        print("Veritabanı hazır.")

    # Mevcut veritabanlarına eksik kolonları ekleyen basit migration adımı.
    conn = sqlite3.connect(DB_FILE)
    cur = conn.cursor()
    cur.execute("PRAGMA table_info(Artworks)")
    columns = {row[1] for row in cur.fetchall()}
    if 'ViewCount' not in columns:
        print("Migration: Artworks tablosuna ViewCount kolonu ekleniyor...")
        cur.execute('ALTER TABLE Artworks ADD COLUMN ViewCount INTEGER DEFAULT 0')
        conn.commit()
        
    cur.execute("PRAGMA table_info(SavedComparisons)")
    if not cur.fetchall():
        print("Migration: SavedComparisons tablosu ekleniyor...")
        cur.execute('''
        CREATE TABLE SavedComparisons (
            ComparisonID INTEGER PRIMARY KEY AUTOINCREMENT,
            UserID INTEGER REFERENCES Users(UserID),
            EntityType TEXT NOT NULL,
            EntityIDs TEXT NOT NULL,
            CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
        ''')
        conn.commit()
        
    cur.execute("PRAGMA table_info(Artworks)")
    columns = {row[1] for row in cur.fetchall()}
    if 'SellerID' not in columns:
        print("Migration: Artworks tablosuna SellerID kolonu ekleniyor...")
        cur.execute('ALTER TABLE Artworks ADD COLUMN SellerID INTEGER REFERENCES Users(UserID)')
        conn.commit()

    cur.execute("PRAGMA table_info(Artworks)")
    columns = {row[1] for row in cur.fetchall()}
    if 'DiscountRate' not in columns:
        print("Migration: Artworks tablosuna DiscountRate kolonu ekleniyor...")
        cur.execute('ALTER TABLE Artworks ADD COLUMN DiscountRate INTEGER DEFAULT 0')
        conn.commit()

    cur.execute("PRAGMA table_info(Events)")
    columns = {row[1] for row in cur.fetchall()}
    if 'DiscountRate' not in columns:
        print("Migration: Events tablosuna DiscountRate kolonu ekleniyor...")
        cur.execute('ALTER TABLE Events ADD COLUMN DiscountRate INTEGER DEFAULT 0')
        conn.commit()

    cur.execute("PRAGMA table_info(Reservations)")
    columns = {row[1] for row in cur.fetchall()}
    if 'ReservationDate' not in columns:
        print("Migration: Reservations tablosuna ReservationDate kolonu ekleniyor...")
        cur.execute('ALTER TABLE Reservations ADD COLUMN ReservationDate DATETIME')
        conn.commit()
    if 'PaymentMethod' not in columns:
        print("Migration: Reservations tablosuna PaymentMethod kolonu ekleniyor...")
        cur.execute('ALTER TABLE Reservations ADD COLUMN PaymentMethod TEXT')
        conn.commit()

    conn.close()

def get_db_connection():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

@app.route('/api/artworks', methods=['GET'])
def get_artworks():
    conn = get_db_connection()
    artworks = conn.execute('''
        SELECT a.*,
               COALESCE((SELECT AVG(c.Rating) FROM Comments c WHERE c.EntityType='Artwork' AND c.EntityID=a.ArtworkID AND c.Rating IS NOT NULL AND c.ParentCommentID IS NULL), 0) AS AvgRating,
               COALESCE((SELECT COUNT(*) FROM Comments c WHERE c.EntityType='Artwork' AND c.EntityID=a.ArtworkID AND c.ParentCommentID IS NULL), 0) AS ReviewCount,
               u.FullName AS SellerName
        FROM Artworks a
        LEFT JOIN Users u ON a.SellerID = u.UserID
    ''').fetchall()
    conn.close()
    return jsonify([dict(ix) for ix in artworks])

@app.route('/api/artworks/<int:artwork_id>/view', methods=['POST'])
def increment_artwork_view(artwork_id):
    """Eser her görüntülendiğinde (modal açıldığında) ViewCount'u 1 artırır."""
    conn = get_db_connection()
    row = conn.execute('SELECT ViewCount FROM Artworks WHERE ArtworkID = ?', (artwork_id,)).fetchone()
    if not row:
        conn.close()
        return jsonify({'success': False, 'message': 'Eser bulunamadı'}), 404
    conn.execute('UPDATE Artworks SET ViewCount = COALESCE(ViewCount, 0) + 1 WHERE ArtworkID = ?', (artwork_id,))
    conn.commit()
    new_count = conn.execute('SELECT ViewCount FROM Artworks WHERE ArtworkID = ?', (artwork_id,)).fetchone()['ViewCount']
    conn.close()
    return jsonify({'success': True, 'view_count': new_count})

@app.route('/api/artists', methods=['GET'])
def get_artists():
    conn = get_db_connection()
    artists = conn.execute('SELECT * FROM Artists').fetchall()
    conn.close()
    return jsonify([dict(ix) for ix in artists])

@app.route('/api/events', methods=['GET'])
def get_events():
    conn = get_db_connection()
    events = conn.execute('''
        SELECT e.*, 
               COALESCE((SELECT SUM(ParticipantCount) FROM Reservations r WHERE r.EventID = e.EventID AND r.Status = 'Active'), 0) as RegisteredCount,
               COALESCE((SELECT AVG(c.Rating) FROM Comments c WHERE c.EntityType='Event' AND c.EntityID=e.EventID AND c.Rating IS NOT NULL AND c.ParentCommentID IS NULL), 0) AS AvgRating,
               COALESCE((SELECT COUNT(*) FROM Comments c WHERE c.EntityType='Event' AND c.EntityID=e.EventID AND c.ParentCommentID IS NULL), 0) AS ReviewCount,
               u.FullName AS SellerName
        FROM Events e
        LEFT JOIN Users u ON e.SellerID = u.UserID
    ''').fetchall()
    conn.close()
    return jsonify([dict(ix) for ix in events])

@app.route('/api/events/<int:event_id>/availability', methods=['GET'])
def get_event_availability(event_id):
    conn = get_db_connection()
    event = conn.execute('SELECT Capacity FROM Events WHERE EventID = ?', (event_id,)).fetchone()
    reservations = conn.execute('''
        SELECT ReservationDate, SUM(ParticipantCount) as TotalRegistered
        FROM Reservations
        WHERE EventID = ? AND Status = 'Active' AND ReservationDate IS NOT NULL
        GROUP BY ReservationDate
    ''', (event_id,)).fetchall()
    conn.close()
    booked = {}
    for r in reservations:
        booked[r['ReservationDate']] = r['TotalRegistered']
    return jsonify({'success': True, 'capacity': event['Capacity'], 'booked': booked})

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    
    conn = get_db_connection()
    user = conn.execute('SELECT * FROM Users WHERE Email = ?', (email,)).fetchone()
    conn.close()
    
    if user and check_password_hash(user['PasswordHash'], password):
        return jsonify({'success': True, 'user': {'id': user['UserID'], 'name': user['FullName'], 'email': user['Email'], 'role': user['Role']}})
    else:
        return jsonify({'success': False, 'message': 'Geçersiz e-posta veya şifre'}), 401

@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')
    role = data.get('role', 'Customer')
    
    if role not in ['Customer', 'Seller']:
        role = 'Customer'
    
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        hashed = generate_password_hash(password)
        cursor.execute('INSERT INTO Users (FullName, Email, PasswordHash, Role) VALUES (?, ?, ?, ?)', (name, email, hashed, role))
        conn.commit()
        user_id = cursor.lastrowid
        conn.close()
        return jsonify({'success': True, 'user': {'id': user_id, 'name': name, 'email': email, 'role': role}})
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({'success': False, 'message': 'Bu e-posta adresi zaten kullanılıyor'}), 400

@app.route('/api/profile/<int:user_id>', methods=['GET'])
def get_profile(user_id):
    conn = get_db_connection()
    user = conn.execute('SELECT UserID, FullName, Email, Role, CreatedAt FROM Users WHERE UserID = ?', (user_id,)).fetchone()
    if not user:
        conn.close()
        return jsonify({'success': False, 'message': 'Kullanıcı bulunamadı'}), 404
        
    orders = conn.execute('''
        SELECT o.OrderID, o.OrderDate, o.TotalAmount, o.Status, o.PaymentMethod,
               a.Title as ArtworkTitle, a.Price, a.ImageURL
        FROM Orders o
        JOIN OrderDetails od ON o.OrderID = od.OrderID
        JOIN Artworks a ON od.ArtworkID = a.ArtworkID
        WHERE o.UserID = ?
        ORDER BY o.OrderDate DESC
    ''', (user_id,)).fetchall()
    
    reservations = conn.execute('''
        SELECT r.ReservationID, r.EventID, r.ParticipantCount, r.TotalPrice, r.Status, r.CreatedAt, r.ReservationDate,
               e.Title as EventTitle, e.EventDate, e.Price as EventPrice
        FROM Reservations r
        JOIN Events e ON r.EventID = e.EventID
        WHERE r.UserID = ?
        ORDER BY r.CreatedAt DESC
    ''', (user_id,)).fetchall()
    
    conn.close()
    return jsonify({
        'success': True,
        'user': dict(user),
        'orders': [dict(ix) for ix in orders],
        'reservations': [dict(ix) for ix in reservations]
    })

@app.route('/api/profile/<int:user_id>', methods=['PUT'])
def update_profile(user_id):
    data = request.json
    name = data.get('name')
    password = data.get('password')
    
    conn = get_db_connection()
    if password:
        conn.execute('UPDATE Users SET FullName = ?, PasswordHash = ? WHERE UserID = ?', (name, password, user_id))
    else:
        conn.execute('UPDATE Users SET FullName = ? WHERE UserID = ?', (name, user_id))
    conn.commit()
    conn.close()
    return jsonify({'success': True, 'message': 'Profil güncellendi'})

@app.route('/api/validate-coupon', methods=['POST'])
def validate_coupon():
    data = request.json
    code = data.get('code')
    
    conn = get_db_connection()
    coupon = conn.execute('SELECT * FROM Coupons WHERE Code = ? AND IsActive = 1', (code,)).fetchone()
    conn.close()
    
    if coupon:
        return jsonify({'success': True, 'coupon': dict(coupon)})
    else:
        return jsonify({'success': False, 'message': 'Geçersiz veya süresi dolmuş kupon kodu.'}), 400

@app.route('/api/special-offer/<int:user_id>', methods=['GET'])
def get_special_offer(user_id):
    # Kullanıcıya özel rastgele bir indirim (%15)
    conn = get_db_connection()
    artwork = conn.execute('SELECT * FROM Artworks WHERE StockStatus = "Available" ORDER BY RANDOM() LIMIT 1').fetchone()
    conn.close()
    
    if artwork:
        offer = dict(artwork)
        price = offer['Price']
        discount_rate = offer.get('DiscountRate', 0) or 0
        base_price = price * (1 - discount_rate / 100)
        offer['OriginalPrice'] = price
        offer['DiscountedPrice'] = base_price * 0.85 # %15 indirim (kampanya üzerine)
        return jsonify({'success': True, 'offer': offer})
    return jsonify({'success': False}), 404

@app.route('/api/orders', methods=['POST'])
def create_order():
    data = request.json
    user_id = data.get('user_id')
    artwork_id = data.get('artwork_id')
    payment_method = data.get('payment_method')
    coupon_code = data.get('coupon_code')
    is_special_offer = data.get('is_special_offer', False)
    
    conn = get_db_connection()
    artwork = conn.execute('SELECT Price, DiscountRate FROM Artworks WHERE ArtworkID = ?', (artwork_id,)).fetchone()
    
    if not artwork:
        conn.close()
        return jsonify({'success': False, 'message': 'Eser bulunamadı'}), 404
        
    price = artwork['Price']
    discount_rate = artwork['DiscountRate'] or 0
    final_price = price * (1 - discount_rate / 100)
    
    # Özel teklif %15 indirimi uygula
    if is_special_offer:
        final_price = final_price * 0.85
    # VEYA Kupon kodu indirimi uygula
    elif coupon_code:
        coupon = conn.execute('SELECT * FROM Coupons WHERE Code = ? AND IsActive = 1', (coupon_code,)).fetchone()
        if coupon:
            if coupon['DiscountType'] == 'Percent':
                final_price = final_price * (1 - coupon['DiscountValue'] / 100)
            elif coupon['DiscountType'] == 'Fixed':
                final_price = max(0, final_price - coupon['DiscountValue'])
        
    cursor = conn.cursor()
    cursor.execute('INSERT INTO Orders (UserID, TotalAmount, PaymentMethod, Status) VALUES (?, ?, ?, ?)',
                   (user_id, final_price, payment_method, 'Pending'))
    order_id = cursor.lastrowid
    
    cursor.execute('INSERT INTO OrderDetails (OrderID, ArtworkID, Price) VALUES (?, ?, ?)',
                   (order_id, artwork_id, artwork['Price']))
                   
    conn.commit()
    conn.close()
    
    return jsonify({'success': True, 'message': 'Sipariş başarıyla oluşturuldu'})

@app.route('/api/reservations', methods=['POST'])
def create_reservation():
    data = request.json
    user_id = data.get('user_id')
    event_id = data.get('event_id')
    reservation_date = data.get('reservation_date')
    participant_count = data.get('participant_count', 1)
    
    conn = get_db_connection()
    event = conn.execute('SELECT Price, Capacity, DiscountRate FROM Events WHERE EventID = ?', (event_id,)).fetchone()
    
    # Seçilen tarih+saat için mevcut kayıt sayısını kontrol et
    if reservation_date:
        existing = conn.execute('''
            SELECT COALESCE(SUM(ParticipantCount), 0) as total
            FROM Reservations
            WHERE EventID = ? AND ReservationDate = ? AND Status = 'Active'
        ''', (event_id, reservation_date)).fetchone()
        if existing['total'] + participant_count > event['Capacity']:
            conn.close()
            return jsonify({'success': False, 'message': 'Seçilen saat için yeterli kontenjan yok!'}), 400
    
    payment_method = data.get('payment_method', 'Kredi Kartı')
    price = event['Price']
    discount_rate = event['DiscountRate'] or 0
    final_unit_price = price * (1 - discount_rate / 100)
    total_price = final_unit_price * participant_count
    
    conn.execute('INSERT INTO Reservations (UserID, EventID, ParticipantCount, TotalPrice, ReservationDate, PaymentMethod, Status) VALUES (?, ?, ?, ?, ?, ?, ?)',
                 (user_id, event_id, participant_count, total_price, reservation_date, payment_method, 'Pending'))
    conn.commit()
    conn.close()
    
    return jsonify({'success': True, 'message': 'Rezervasyon başarıyla oluşturuldu'})

@app.route('/api/reservations/<int:res_id>', methods=['PUT', 'DELETE'])
def update_reservation(res_id):
    conn = get_db_connection()
    if request.method == 'DELETE':
        conn.execute('DELETE FROM Reservations WHERE ReservationID = ?', (res_id,))
        conn.commit()
        conn.close()
        return jsonify({'success': True, 'message': 'Rezervasyon silindi'})

    data = request.json
    action = data.get('action')
    
    if action == 'cancel':
        conn.execute('UPDATE Reservations SET Status = ? WHERE ReservationID = ?', ('Cancelled', res_id))
    elif action == 'update':
        count = int(data.get('participant_count'))
        new_date = data.get('reservation_date')
        
        # Get current reservation details
        res = conn.execute('''
            SELECT r.EventID, r.ParticipantCount, r.ReservationDate, e.Price, e.Capacity 
            FROM Reservations r 
            JOIN Events e ON r.EventID = e.EventID 
            WHERE r.ReservationID = ?
        ''', (res_id,)).fetchone()
        
        if not res:
            conn.close()
            return jsonify({'success': False, 'message': 'Rezervasyon bulunamadı.'}), 404
            
        event_id = res['EventID']
        
        # Check capacity excluding the current reservation
        existing = conn.execute('''
            SELECT COALESCE(SUM(ParticipantCount), 0) as total
            FROM Reservations
            WHERE EventID = ? AND ReservationDate = ? AND Status = 'Active' AND ReservationID != ?
        ''', (event_id, new_date, res_id)).fetchone()
        
        if existing['total'] + count > res['Capacity']:
            conn.close()
            return jsonify({'success': False, 'message': 'Seçilen saat için yeterli kontenjan yok!'}), 400

        new_price = res['Price'] * count
        conn.execute('UPDATE Reservations SET ParticipantCount = ?, TotalPrice = ?, ReservationDate = ? WHERE ReservationID = ?', 
                     (count, new_price, new_date, res_id))
        
    conn.commit()
    conn.close()
    return jsonify({'success': True, 'message': 'Rezervasyon güncellendi'})

@app.route('/api/favorites/<int:user_id>', methods=['GET'])
def get_favorites(user_id):
    conn = get_db_connection()
    favorites = conn.execute('SELECT ArtworkID FROM Favorites WHERE UserID = ?', (user_id,)).fetchall()
    conn.close()
    return jsonify({'success': True, 'favorites': [f['ArtworkID'] for f in favorites]})

@app.route('/api/favorites', methods=['POST'])
def add_favorite():
    data = request.json
    user_id = data.get('user_id')
    artwork_id = data.get('artwork_id')
    conn = get_db_connection()
    try:
        conn.execute('INSERT INTO Favorites (UserID, ArtworkID) VALUES (?, ?)', (user_id, artwork_id))
        conn.commit()
    except sqlite3.IntegrityError:
        pass # Already favorited
    conn.close()
    return jsonify({'success': True})

@app.route('/api/favorites/<int:user_id>/<int:artwork_id>', methods=['DELETE'])
def remove_favorite(user_id, artwork_id):
    conn = get_db_connection()
    conn.execute('DELETE FROM Favorites WHERE UserID = ? AND ArtworkID = ?', (user_id, artwork_id))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

@app.route('/api/tickets/<int:user_id>', methods=['GET'])
def get_user_tickets(user_id):
    conn = get_db_connection()
    tickets = conn.execute('SELECT * FROM SupportTickets WHERE UserID = ? ORDER BY CreatedAt DESC', (user_id,)).fetchall()
    conn.close()
    return jsonify({'success': True, 'tickets': [dict(ix) for ix in tickets]})

@app.route('/api/tickets', methods=['POST'])
def create_ticket():
    data = request.json
    user_id = data.get('user_id')
    subject = data.get('subject')
    message = data.get('message')
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('INSERT INTO SupportTickets (UserID, Subject, Message, Status) VALUES (?, ?, ?, ?)',
                   (user_id, subject, message, 'Open'))
    conn.commit()
    conn.close()
    return jsonify({'success': True, 'message': 'Destek talebiniz başarıyla oluşturuldu.'})

@app.route('/api/tickets', methods=['GET'])
def get_all_tickets():
    conn = get_db_connection()
    tickets = conn.execute('''
        SELECT t.*, u.FullName as UserName, u.Email as UserEmail
        FROM SupportTickets t
        JOIN Users u ON t.UserID = u.UserID
        ORDER BY t.CreatedAt DESC
    ''').fetchall()
    conn.close()
    return jsonify({'success': True, 'tickets': [dict(ix) for ix in tickets]})

@app.route('/api/tickets/<int:ticket_id>/respond', methods=['PUT'])
def respond_ticket(ticket_id):
    data = request.json
    response_text = data.get('response')
    
    conn = get_db_connection()
    conn.execute('UPDATE SupportTickets SET AdminResponse = ?, Status = ? WHERE TicketID = ?', 
                 (response_text, 'Answered', ticket_id))
    conn.commit()
    conn.close()
    return jsonify({'success': True, 'message': 'Talep başarıyla yanıtlandı.'})

@app.route('/api/comparisons', methods=['POST'])
def save_comparison():
    data = request.json
    user_id = data.get('user_id')
    entity_type = data.get('entity_type')
    entity_ids = data.get('entity_ids')
    
    if not user_id or not entity_type or not entity_ids:
        return jsonify({'success': False, 'message': 'Eksik parametre'}), 400
        
    ids_str = ','.join(map(str, entity_ids))
    conn = get_db_connection()
    conn.execute('INSERT INTO SavedComparisons (UserID, EntityType, EntityIDs) VALUES (?, ?, ?)', (user_id, entity_type, ids_str))
    conn.commit()
    conn.close()
    return jsonify({'success': True, 'message': 'Karşılaştırma başarıyla kaydedildi'})

@app.route('/api/comparisons/<int:user_id>', methods=['GET'])
def get_comparisons(user_id):
    conn = get_db_connection()
    comparisons = conn.execute('SELECT * FROM SavedComparisons WHERE UserID = ? ORDER BY CreatedAt DESC', (user_id,)).fetchall()
    conn.close()
    return jsonify({'success': True, 'comparisons': [dict(c) for c in comparisons]})

@app.route('/api/comparisons/<int:comparison_id>', methods=['DELETE'])
def delete_comparison(comparison_id):
    conn = get_db_connection()
    conn.execute('DELETE FROM SavedComparisons WHERE ComparisonID = ?', (comparison_id,))
    conn.commit()
    conn.close()
    return jsonify({'success': True})


# ===== COMMENTS / REVIEWS (Madde 12, 13, 14, 15) =====

def _user_purchased_artwork(conn, user_id, artwork_id):
    """Kullanıcı bu eseri satın almış mı? (Tamamlanmış sipariş şartı)"""
    row = conn.execute('''
        SELECT 1
        FROM Orders o
        JOIN OrderDetails od ON od.OrderID = o.OrderID
        WHERE o.UserID = ? AND od.ArtworkID = ? AND o.Status = 'Completed'
        LIMIT 1
    ''', (user_id, artwork_id)).fetchone()
    return row is not None


def _user_attended_event(conn, user_id, event_id):
    """Kullanıcı bu etkinliğe rezervasyon yapmış mı? (Aktif rezervasyon şartı)"""
    row = conn.execute('''
        SELECT 1 FROM Reservations
        WHERE UserID = ? AND EventID = ? AND Status = 'Active'
        LIMIT 1
    ''', (user_id, event_id)).fetchone()
    return row is not None


def _build_comments_query(entity_type, entity_id, conn, sort='newest', current_user_id=None):
    """Yorumları sıralama seçeneğiyle birlikte getirir (Madde 13 filtre)."""

    order_clause = 'c.CreatedAt DESC'
    if sort == 'highest':
        order_clause = 'c.Rating DESC, c.CreatedAt DESC'
    elif sort == 'helpful':
        order_clause = 'HelpfulCount DESC, c.CreatedAt DESC'

    if entity_type == 'Artwork':
        verified_sub = """(SELECT 1 FROM Orders o
                  JOIN OrderDetails od ON od.OrderID = o.OrderID
                 WHERE o.UserID = c.UserID AND od.ArtworkID = c.EntityID
                   AND o.Status = 'Completed' LIMIT 1)"""
    else:
        verified_sub = """(SELECT 1 FROM Reservations r
                 WHERE r.UserID = c.UserID AND r.EventID = c.EntityID
                   AND r.Status = 'Active' LIMIT 1)"""

    user_vote_sub = '0'
    params = [entity_type, entity_id]
    if current_user_id:
        user_vote_sub = "(SELECT IsHelpful FROM CommentVotes cv WHERE cv.CommentID = c.CommentID AND cv.UserID = ? LIMIT 1)"
        params = [current_user_id, entity_type, entity_id]

    sql = f'''
        SELECT c.CommentID, c.UserID, c.Content, c.Rating, c.CreatedAt,
               c.ParentCommentID,
               u.FullName AS UserName,
               {verified_sub} AS Verified,
               COALESCE((SELECT SUM(CASE WHEN IsHelpful=1 THEN 1 ELSE 0 END) FROM CommentVotes WHERE CommentID=c.CommentID),0) AS HelpfulCount,
               COALESCE((SELECT SUM(CASE WHEN IsHelpful=0 THEN 1 ELSE 0 END) FROM CommentVotes WHERE CommentID=c.CommentID),0) AS UnhelpfulCount,
               {user_vote_sub} AS UserVote
        FROM Comments c
        JOIN Users u ON u.UserID = c.UserID
        WHERE c.EntityType = ? AND c.EntityID = ? AND c.ParentCommentID IS NULL
        ORDER BY {order_clause}
    '''

    rows = conn.execute(sql, params).fetchall()

    # Fetch admin replies (ParentCommentID != NULL)
    replies_sql = '''
        SELECT c.CommentID, c.UserID, c.Content, c.CreatedAt, c.ParentCommentID,
               u.FullName AS UserName, u.Role
        FROM Comments c
        JOIN Users u ON u.UserID = c.UserID
        WHERE c.EntityType = ? AND c.EntityID = ? AND c.ParentCommentID IS NOT NULL
        ORDER BY c.CreatedAt ASC
    '''
    reply_rows = conn.execute(replies_sql, [entity_type, entity_id]).fetchall()
    replies_map = {}
    for r in reply_rows:
        pid = r['ParentCommentID']
        if pid not in replies_map:
            replies_map[pid] = []
        replies_map[pid].append(dict(r))

    comments = []
    for r in rows:
        d = dict(r)
        d['Replies'] = replies_map.get(d['CommentID'], [])
        comments.append(d)

    stats = conn.execute('''
        SELECT COUNT(*) AS cnt,
               COALESCE(AVG(Rating), 0) AS avg_rating
        FROM Comments
        WHERE EntityType = ? AND EntityID = ? AND Rating IS NOT NULL AND ParentCommentID IS NULL
    ''', (entity_type, entity_id)).fetchone()

    return comments, stats


@app.route('/api/comments/event/<int:event_id>', methods=['GET'])
def get_event_comments(event_id):
    """Belirtilen etkinliğe ait tüm yorumları döner."""
    sort = request.args.get('sort', 'newest')
    current_user_id = request.args.get('user_id', type=int)
    conn = get_db_connection()
    comments, stats = _build_comments_query('Event', event_id, conn, sort, current_user_id)
    conn.close()
    return jsonify({
        'success': True,
        'count': stats['cnt'] or 0,
        'average': round(stats['avg_rating'] or 0, 1),
        'comments': comments
    })


@app.route('/api/comments/artwork/<int:artwork_id>', methods=['GET'])
def get_artwork_comments(artwork_id):
    """Belirtilen esere ait tüm yorumları döner."""
    sort = request.args.get('sort', 'newest')
    current_user_id = request.args.get('user_id', type=int)
    conn = get_db_connection()
    comments, stats = _build_comments_query('Artwork', artwork_id, conn, sort, current_user_id)
    conn.close()
    return jsonify({
        'success': True,
        'count': stats['cnt'] or 0,
        'average': round(stats['avg_rating'] or 0, 1),
        'comments': comments
    })


@app.route('/api/comments', methods=['POST'])
def create_comment():
    """Yeni yorum veya admin yanıtı oluştur."""
    data = request.json or {}
    user_id = data.get('user_id')
    entity_type = data.get('entity_type', 'Artwork')
    entity_id = data.get('entity_id')
    content = (data.get('content') or '').strip()
    rating = data.get('rating')
    parent_comment_id = data.get('parent_comment_id')  # Madde 14 — yanıt

    if not user_id or not entity_id or not content:
        return jsonify({'success': False, 'message': 'Eksik alanlar var.'}), 400

    conn = get_db_connection()

    # Admin yanıtı mı?
    if parent_comment_id:
        user = conn.execute('SELECT Role FROM Users WHERE UserID = ?', (user_id,)).fetchone()
        if not user or user['Role'] != 'Admin':
            conn.close()
            return jsonify({'success': False, 'message': 'Yalnızca yöneticiler yanıt verebilir.'}), 403
        conn.execute('''
            INSERT INTO Comments (UserID, EntityType, EntityID, Content, Rating, ParentCommentID)
            VALUES (?, ?, ?, ?, NULL, ?)
        ''', (user_id, entity_type, entity_id, content, parent_comment_id))
        conn.commit()
        conn.close()
        return jsonify({'success': True, 'message': 'Yanıtınız eklendi.'})

    # Normal yorum — puan kontrolü
    if rating is not None:
        try:
            rating = int(rating)
            if rating < 1 or rating > 5:
                return jsonify({'success': False, 'message': 'Puan 1-5 arasında olmalı.'}), 400
        except (TypeError, ValueError):
            return jsonify({'success': False, 'message': 'Geçersiz puan değeri.'}), 400

    # Doğrulama (Madde 15)
    if entity_type == 'Artwork':
        if not _user_purchased_artwork(conn, user_id, entity_id):
            conn.close()
            return jsonify({
                'success': False,
                'message': 'Sadece bu eseri satın almış kullanıcılar yorum yazabilir.'
            }), 403
    elif entity_type == 'Event':
        if not _user_attended_event(conn, user_id, entity_id):
            conn.close()
            return jsonify({
                'success': False,
                'message': 'Sadece bu etkinliğe katılan kullanıcılar yorum yazabilir.'
            }), 403
    else:
        conn.close()
        return jsonify({'success': False, 'message': 'Geçersiz yorum türü.'}), 400

    conn.execute('''
        INSERT INTO Comments (UserID, EntityType, EntityID, Content, Rating)
        VALUES (?, ?, ?, ?, ?)
    ''', (user_id, entity_type, entity_id, content, rating))
    conn.commit()
    conn.close()
    return jsonify({'success': True, 'message': 'Yorumunuz eklendi.'})


# ===== COMMENT VOTES (Madde 13) =====

@app.route('/api/comments/<int:comment_id>/vote', methods=['POST'])
def vote_comment(comment_id):
    """Yoruma faydalı/faydasız oyu ver. Toggle mantığıyla çalışır."""
    data = request.json or {}
    user_id = data.get('user_id')
    is_helpful = data.get('is_helpful')  # 1 veya 0

    if not user_id or is_helpful is None:
        return jsonify({'success': False, 'message': 'Eksik parametre.'}), 400

    conn = get_db_connection()
    existing = conn.execute(
        'SELECT VoteID, IsHelpful FROM CommentVotes WHERE CommentID = ? AND UserID = ?',
        (comment_id, user_id)
    ).fetchone()

    if existing:
        if existing['IsHelpful'] == is_helpful:
            # Aynı oya tekrar basıldı → oyu kaldır
            conn.execute('DELETE FROM CommentVotes WHERE VoteID = ?', (existing['VoteID'],))
        else:
            # Farklı oy → güncelle
            conn.execute('UPDATE CommentVotes SET IsHelpful = ? WHERE VoteID = ?', (is_helpful, existing['VoteID']))
    else:
        conn.execute(
            'INSERT INTO CommentVotes (CommentID, UserID, IsHelpful) VALUES (?, ?, ?)',
            (comment_id, user_id, is_helpful)
        )

    conn.commit()

    # Güncel sayıları döndür
    counts = conn.execute('''
        SELECT
            COALESCE(SUM(CASE WHEN IsHelpful=1 THEN 1 ELSE 0 END),0) AS helpful,
            COALESCE(SUM(CASE WHEN IsHelpful=0 THEN 1 ELSE 0 END),0) AS unhelpful
        FROM CommentVotes WHERE CommentID = ?
    ''', (comment_id,)).fetchone()

    user_vote = conn.execute(
        'SELECT IsHelpful FROM CommentVotes WHERE CommentID = ? AND UserID = ?',
        (comment_id, user_id)
    ).fetchone()
    conn.close()

    return jsonify({
        'success': True,
        'helpful': counts['helpful'],
        'unhelpful': counts['unhelpful'],
        'user_vote': user_vote['IsHelpful'] if user_vote else None
    })


@app.route('/api/user/<int:user_id>/attended-events', methods=['GET'])
def get_user_attended_events(user_id):
    """Kullanıcının yorum yapabileceği etkinliklerin listesi (Aktif rezervasyon)."""
    conn = get_db_connection()
    rows = conn.execute('''
        SELECT DISTINCT e.EventID, e.Title, e.EventDate, e.Price
        FROM Reservations r
        JOIN Events e ON e.EventID = r.EventID
        WHERE r.UserID = ? AND r.Status = 'Active'
        ORDER BY e.EventDate DESC
    ''', (user_id,)).fetchall()
    conn.close()
    return jsonify({'success': True, 'events': [dict(r) for r in rows]})


@app.route('/api/user/<int:user_id>/purchased-artworks', methods=['GET'])
def get_user_purchased_artworks(user_id):
    """Kullanıcının satın aldığı (yorum yapabileceği) eserlerin listesi."""
    conn = get_db_connection()
    rows = conn.execute('''
        SELECT DISTINCT a.ArtworkID, a.Title, a.Category, a.ImageURL, a.Price
        FROM Orders o
        JOIN OrderDetails od ON od.OrderID = o.OrderID
        JOIN Artworks a ON a.ArtworkID = od.ArtworkID
        WHERE o.UserID = ? AND o.Status = 'Completed'
        ORDER BY a.Title
    ''', (user_id,)).fetchall()
    conn.close()
    return jsonify({'success': True, 'artworks': [dict(r) for r in rows]})


@app.route('/api/seller/artworks/<int:user_id>', methods=['GET'])
def get_seller_artworks(user_id):
    conn = get_db_connection()
    artworks = conn.execute('SELECT * FROM Artworks WHERE SellerID = ? ORDER BY CreatedAt DESC', (user_id,)).fetchall()
    conn.close()
    return jsonify({'success': True, 'artworks': [dict(ix) for ix in artworks]})

@app.route('/api/seller/artworks', methods=['POST'])
def add_seller_artwork():
    data = request.json
    seller_id = data.get('seller_id')
    title = data.get('title')
    artist_name = data.get('artist_name', '').strip()
    category = data.get('category')
    price = data.get('price')
    image_url = data.get('image_url')
    discount_rate = data.get('discount_rate', 0)

    conn = get_db_connection()
    cursor = conn.cursor()

    # Sanatçı adı girilmişse: bul veya oluştur
    artist_id = None
    if artist_name:
        existing = conn.execute('SELECT ArtistID FROM Artists WHERE LOWER(Name) = LOWER(?)', (artist_name,)).fetchone()
        if existing:
            artist_id = existing['ArtistID']
        else:
            cursor.execute('INSERT INTO Artists (Name) VALUES (?)', (artist_name,))
            artist_id = cursor.lastrowid

    cursor.execute(
        'INSERT INTO Artworks (Title, ArtistID, Category, Price, ImageURL, SellerID, DiscountRate) VALUES (?, ?, ?, ?, ?, ?, ?)',
        (title, artist_id, category, price, image_url, seller_id, discount_rate)
    )
    conn.commit()
    conn.close()
    return jsonify({'success': True, 'message': 'Eser eklendi'})

@app.route('/api/seller/artworks/<int:artwork_id>', methods=['PUT'])
def edit_seller_artwork(artwork_id):
    data = request.json
    seller_id = data.get('seller_id')
    title = data.get('title')
    category = data.get('category')
    price = data.get('price')
    image_url = data.get('image_url')
    discount_rate = data.get('discount_rate', 0)
    
    conn = get_db_connection()
    # Verify ownership
    row = conn.execute('SELECT SellerID FROM Artworks WHERE ArtworkID = ?', (artwork_id,)).fetchone()
    if not row or row['SellerID'] != seller_id:
        conn.close()
        return jsonify({'success': False, 'message': 'Yetkiniz yok veya eser bulunamadı'}), 403

    conn.execute('UPDATE Artworks SET Title = ?, Category = ?, Price = ?, ImageURL = ?, DiscountRate = ? WHERE ArtworkID = ?',
                   (title, category, price, image_url, discount_rate, artwork_id))
    conn.commit()
    conn.close()
    return jsonify({'success': True, 'message': 'Eser güncellendi'})

@app.route('/api/seller/events/<int:user_id>', methods=['GET'])
def get_seller_events(user_id):
    conn = get_db_connection()
    events = conn.execute('SELECT * FROM Events WHERE SellerID = ? ORDER BY CreatedAt DESC', (user_id,)).fetchall()
    conn.close()
    return jsonify({'success': True, 'events': [dict(ix) for ix in events]})

@app.route('/api/seller/events', methods=['POST'])
def add_seller_event():
    data = request.json
    seller_id = data.get('seller_id')
    title = data.get('title')
    description = data.get('description')
    event_date = data.get('event_date')
    capacity = data.get('capacity')
    price = data.get('price')
    event_type = data.get('event_type')
    duration_days = data.get('duration_days', 3)
    discount_rate = data.get('discount_rate', 0)
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('INSERT INTO Events (Title, Description, EventDate, Capacity, Price, SellerID, EventType, DurationDays, DiscountRate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                   (title, description, event_date, capacity, price, seller_id, event_type, duration_days, discount_rate))
    conn.commit()
    conn.close()
    return jsonify({'success': True, 'message': 'Etkinlik eklendi'})

@app.route('/api/seller/events/<int:event_id>', methods=['PUT'])
def edit_seller_event(event_id):
    data = request.json
    seller_id = data.get('seller_id')
    title = data.get('title')
    description = data.get('description')
    event_date = data.get('event_date')
    capacity = data.get('capacity')
    price = data.get('price')
    event_type = data.get('event_type')
    duration_days = data.get('duration_days', 3)
    discount_rate = data.get('discount_rate', 0)
    
    conn = get_db_connection()
    row = conn.execute('SELECT SellerID FROM Events WHERE EventID = ?', (event_id,)).fetchone()
    if not row or row['SellerID'] != seller_id:
        conn.close()
        return jsonify({'success': False, 'message': 'Yetkiniz yok veya etkinlik bulunamadı'}), 403

    conn.execute('UPDATE Events SET Title = ?, Description = ?, EventDate = ?, Capacity = ?, Price = ?, EventType = ?, DurationDays = ?, DiscountRate = ? WHERE EventID = ?',
                   (title, description, event_date, capacity, price, event_type, duration_days, discount_rate, event_id))
    conn.commit()
    conn.close()
    return jsonify({'success': True, 'message': 'Etkinlik güncellendi'})

@app.route('/api/seller/events/<int:event_id>', methods=['DELETE'])
def delete_seller_event(event_id):
    seller_id = request.args.get('seller_id', type=int)
    conn = get_db_connection()
    row = conn.execute('SELECT SellerID FROM Events WHERE EventID = ?', (event_id,)).fetchone()
    if not row or row['SellerID'] != seller_id:
        conn.close()
        return jsonify({'success': False, 'message': 'Yetkiniz yok veya etkinlik bulunamadı'}), 403

    conn.execute('DELETE FROM Events WHERE EventID = ?', (event_id,))
    conn.commit()
    conn.close()
    return jsonify({'success': True, 'message': 'Etkinlik silindi'})

@app.route('/api/seller/artworks/<int:artwork_id>', methods=['DELETE'])
def delete_seller_artwork(artwork_id):
    seller_id = request.args.get('seller_id', type=int)
    conn = get_db_connection()
    row = conn.execute('SELECT SellerID FROM Artworks WHERE ArtworkID = ?', (artwork_id,)).fetchone()
    if not row or row['SellerID'] != seller_id:
        conn.close()
        return jsonify({'success': False, 'message': 'Yetkiniz yok veya eser bulunamadı'}), 403

    conn.execute('DELETE FROM Artworks WHERE ArtworkID = ?', (artwork_id,))
    conn.commit()
    conn.close()
    return jsonify({'success': True, 'message': 'Eser silindi'})


@app.route('/api/seller/sales/<int:user_id>', methods=['GET'])
def get_seller_sales(user_id):
    conn = get_db_connection()
    
    # Eser Satışları (Artwork Sales)
    artwork_sales = conn.execute('''
        SELECT o.OrderID, o.OrderDate, o.TotalAmount, o.Status, o.PaymentMethod,
               a.Title as ArtworkTitle, a.Price as OriginalPrice, u.FullName as CustomerName, a.ArtworkID
        FROM Orders o
        JOIN OrderDetails od ON o.OrderID = od.OrderID
        JOIN Artworks a ON od.ArtworkID = a.ArtworkID
        JOIN Users u ON o.UserID = u.UserID
        WHERE a.SellerID = ?
        ORDER BY o.OrderDate DESC
    ''', (user_id,)).fetchall()
    
    # Etkinlik Rezervasyonları (Event Reservations)
    event_sales = conn.execute('''
        SELECT r.ReservationID, r.ParticipantCount, r.TotalPrice, r.Status, r.ReservationDate, r.CreatedAt,
               e.Title as EventTitle, e.Price as OriginalPrice, u.FullName as CustomerName, e.EventID
        FROM Reservations r
        JOIN Events e ON r.EventID = e.EventID
        JOIN Users u ON r.UserID = u.UserID
        WHERE e.SellerID = ?
        ORDER BY r.CreatedAt DESC
    ''', (user_id,)).fetchall()
    
    conn.close()
    return jsonify({
        'success': True,
        'artwork_sales': [dict(ix) for ix in artwork_sales],
        'event_sales': [dict(ix) for ix in event_sales]
    })

@app.route('/api/seller/sales/status', methods=['POST'])
def update_sale_status():
    data = request.json
    seller_id = data.get('seller_id')
    type = data.get('type') # 'artwork' veya 'event'
    id = data.get('id') # OrderID veya ReservationID
    status = data.get('status') # 'Completed', 'Rejected', 'Active', 'Cancelled'
    
    conn = get_db_connection()
    
    if type == 'artwork':
        # Verify ownership
        row = conn.execute('''
            SELECT a.SellerID FROM Orders o
            JOIN OrderDetails od ON o.OrderID = od.OrderID
            JOIN Artworks a ON od.ArtworkID = a.ArtworkID
            WHERE o.OrderID = ?
        ''', (id,)).fetchone()
        
        if not row or row['SellerID'] != seller_id:
            conn.close()
            return jsonify({'success': False, 'message': 'Yetkiniz yok'}), 403
            
        conn.execute('UPDATE Orders SET Status = ? WHERE OrderID = ?', (status, id))
    else:
        # Verify ownership
        row = conn.execute('''
            SELECT e.SellerID FROM Reservations r
            JOIN Events e ON r.EventID = e.EventID
            WHERE r.ReservationID = ?
        ''', (id,)).fetchone()
        
        if not row or row['SellerID'] != seller_id:
            conn.close()
            return jsonify({'success': False, 'message': 'Yetkiniz yok'}), 403
            
        conn.execute('UPDATE Reservations SET Status = ? WHERE ReservationID = ?', (status, id))
        
    conn.commit()
    conn.close()
    return jsonify({'success': True, 'message': 'Durum güncellendi'})


@app.route('/api/admin/stats', methods=['GET'])
def get_admin_stats():
    conn = get_db_connection()
    try:
        user_count = conn.execute('SELECT COUNT(*) FROM Users WHERE Role = "User"').fetchone()[0]
        artwork_sold = conn.execute('SELECT COUNT(*) FROM Orders WHERE Status IN ("Approved", "Completed")').fetchone()[0]
        active_reservations = conn.execute('SELECT COUNT(*) FROM Reservations WHERE Status IN ("Pending", "Approved")').fetchone()[0]
        
        art_revenue = conn.execute('SELECT SUM(TotalAmount) FROM Orders WHERE Status IN ("Approved", "Completed")').fetchone()[0] or 0
        evt_revenue = conn.execute('SELECT SUM(TotalPrice) FROM Reservations WHERE Status IN ("Approved", "Completed")').fetchone()[0] or 0
        total_revenue = art_revenue + evt_revenue
        
        return jsonify({
            'success': True,
            'stats': {
                'users': user_count,
                'sold': artwork_sold,
                'reservations': active_reservations,
                'total_revenue': total_revenue,
                'event_revenue': evt_revenue
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        conn.close()

if __name__ == '__main__':
    init_db()
    print("Backend sunucusu 5000 portunda çalışıyor...")
    app.run(debug=True, port=5000)
