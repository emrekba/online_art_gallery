import sqlite3
import os
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app) # Tüm domainlerden gelen isteklere izin ver

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

def get_db_connection():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

@app.route('/api/artworks', methods=['GET'])
def get_artworks():
    conn = get_db_connection()
    artworks = conn.execute('SELECT * FROM Artworks').fetchall()
    conn.close()
    return jsonify([dict(ix) for ix in artworks])

@app.route('/api/artists', methods=['GET'])
def get_artists():
    conn = get_db_connection()
    artists = conn.execute('SELECT * FROM Artists').fetchall()
    conn.close()
    return jsonify([dict(ix) for ix in artists])

@app.route('/api/events', methods=['GET'])
def get_events():
    conn = get_db_connection()
    events = conn.execute('SELECT * FROM Events').fetchall()
    conn.close()
    return jsonify([dict(ix) for ix in events])

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password') # Basitlik için sadece email kontrolü yapalım
    
    conn = get_db_connection()
    user = conn.execute('SELECT * FROM Users WHERE Email = ?', (email,)).fetchone()
    conn.close()
    
    if user:
        # TODO: Password hash check eklenecek
        return jsonify({'success': True, 'user': {'id': user['UserID'], 'name': user['FullName'], 'email': user['Email'], 'role': user['Role']}})
    else:
        return jsonify({'success': False, 'message': 'Geçersiz e-posta veya şifre'}), 401

@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')
    
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        # Gerçek uygulamada şifre hashlenmelidir (örn: werkzeug.security)
        cursor.execute('INSERT INTO Users (FullName, Email, PasswordHash) VALUES (?, ?, ?)', (name, email, password))
        conn.commit()
        user_id = cursor.lastrowid
        conn.close()
        return jsonify({'success': True, 'user': {'id': user_id, 'name': name, 'email': email, 'role': 'Customer'}})
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
        SELECT r.ReservationID, r.ParticipantCount, r.TotalPrice, r.Status, r.CreatedAt,
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
        offer['OriginalPrice'] = offer['Price']
        offer['DiscountedPrice'] = offer['Price'] * 0.85 # %15 indirim
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
    artwork = conn.execute('SELECT Price, StockStatus FROM Artworks WHERE ArtworkID = ?', (artwork_id,)).fetchone()
    
    if not artwork or artwork['StockStatus'] != 'Available':
        conn.close()
        return jsonify({'success': False, 'message': 'Eser müsait değil'}), 400
        
    final_price = artwork['Price']
    
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
                   (user_id, final_price, payment_method, 'Completed'))
    order_id = cursor.lastrowid
    
    cursor.execute('INSERT INTO OrderDetails (OrderID, ArtworkID, Price) VALUES (?, ?, ?)',
                   (order_id, artwork_id, artwork['Price']))
                   
    cursor.execute('UPDATE Artworks SET StockStatus = ? WHERE ArtworkID = ?', ('Sold', artwork_id))
    conn.commit()
    conn.close()
    
    return jsonify({'success': True, 'message': 'Sipariş başarıyla oluşturuldu'})

@app.route('/api/reservations', methods=['POST'])
def create_reservation():
    data = request.json
    user_id = data.get('user_id')
    event_id = data.get('event_id')
    participant_count = data.get('participant_count', 1)
    
    conn = get_db_connection()
    event = conn.execute('SELECT Price, Capacity FROM Events WHERE EventID = ?', (event_id,)).fetchone()
    
    total_price = event['Price'] * participant_count
    
    cursor = conn.cursor()
    cursor.execute('INSERT INTO Reservations (UserID, EventID, ParticipantCount, TotalPrice, Status) VALUES (?, ?, ?, ?, ?)',
                   (user_id, event_id, participant_count, total_price, 'Active'))
    conn.commit()
    conn.close()
    
    return jsonify({'success': True, 'message': 'Rezervasyon başarıyla oluşturuldu'})

@app.route('/api/reservations/<int:res_id>', methods=['PUT'])
def update_reservation(res_id):
    data = request.json
    action = data.get('action')
    
    conn = get_db_connection()
    if action == 'cancel':
        conn.execute('UPDATE Reservations SET Status = ? WHERE ReservationID = ?', ('Cancelled', res_id))
    elif action == 'update':
        count = int(data.get('participant_count'))
        res = conn.execute('SELECT e.Price FROM Reservations r JOIN Events e ON r.EventID = e.EventID WHERE r.ReservationID = ?', (res_id,)).fetchone()
        new_price = res['Price'] * count
        conn.execute('UPDATE Reservations SET ParticipantCount = ?, TotalPrice = ? WHERE ReservationID = ?', (count, new_price, res_id))
        
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

if __name__ == '__main__':
    print("Backend sunucusu 5000 portunda çalışıyor...")
    app.run(debug=True, port=5000)
