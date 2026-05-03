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

if __name__ == '__main__':
    init_db()
    print("Backend sunucusu 5000 portunda çalışıyor...")
    app.run(debug=True, port=5000)
