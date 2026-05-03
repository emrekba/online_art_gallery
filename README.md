# 🎨 ArtVerse — Online Sanat Galerisi & Atölye Rezervasyon Sistemi

Flask + SQLite backend ve vanilla JS/HTML/CSS frontend ile geliştirilmiş bir online sanat galerisidir.

## 📁 Proje Yapısı

```
online_art_gallery/
├── backend/
│   ├── server.py            # Flask uygulaması + REST API
│   ├── init_sqlite.sql      # DB şeması + seed data (ilk açılışta uygulanır)
│   ├── gallery.db           # SQLite veritabanı (otomatik oluşur)
│   ├── requirements.txt     # Python bağımlılıkları
│   └── venv/                # Python sanal ortamı
└── ui/
    ├── index.html
    ├── app.js
    └── style.css
```

## 🚀 Çalıştırma

### Önemli notlar
- `backend/server.py` aynı zamanda `ui/` klasörünü statik dosya olarak serve eder. **Tarayıcıda `index.html`'i çift tıklamana gerek yok** — sunucu adresini aç yeter.
- ⚠️ Sistemdeki global `python` komutu **venv'in dışındadır**; doğrudan `python server.py` yazarsan `ModuleNotFoundError: No module named 'flask'` alırsın. **venv'i aktive etmen ya da venv'in Python'ını doğrudan çağırman gerekir.**
- ⚠️ Bu projedeki venv (Python 3.14) Windows'ta klasik `Scripts/` yerine **`bin/`** klasörünü kullanıyor. Yani `.\venv\Scripts\activate` çalışmaz; doğru yol **`.\venv\bin\Activate.ps1`**.

### Yöntem A — En kısa yol (aktive etmeden)

PowerShell veya CMD'de:

```powershell
cd backend
.\venv\bin\python.exe server.py
```

CMD'de:
```cmd
cd backend
venv\bin\python.exe server.py
```

### Yöntem B — venv'i aktive ederek

PowerShell:
```powershell
cd backend
.\venv\bin\Activate.ps1
python server.py
```

> PowerShell "execution policy" hatası verirse bir kereliğine:  
> `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass`

CMD:
```cmd
cd backend
venv\bin\activate.bat
python server.py
```

### Beklenen çıktı

```
Backend sunucusu 5000 portunda çalışıyor...
 * Running on http://127.0.0.1:5000
```

### Tarayıcıda aç

```
http://127.0.0.1:5000/
```

Bu kadar — `index.html`, `app.js`, `style.css` Flask tarafından otomatik servis edilir, API çağrıları doğrudan `/api/...` üzerinden çalışır.

### İlk kurulum (venv yoksa)

`backend/venv/` zaten projede mevcut. Eğer silinmişse / sıfırdan kuracaksan:

```powershell
cd backend
python -m venv venv
.\venv\bin\python.exe -m pip install -r requirements.txt
```

> Eğer Python 3.13 veya daha eski bir sürümün varsa venv `Scripts/` klasörü oluşturur — o zaman yukarıdaki komutlardaki `bin` yerine `Scripts` yaz.

## 🔑 Hesaplar

- **Admin**: `admin@artverse.com` (init_sqlite.sql ile gelir; şifre kontrolü demo amaçlıdır, herhangi bir değer girebilirsin).
- **Yeni kayıt**: Sağ üstten "Kayıt Ol".

## 💬 Yorum Sistemi (Madde 12 + 15)

| Eylem | Şart |
|-------|------|
| Esere yorum yaz | Kullanıcının `Orders.Status='Completed'` ile o eseri satın almış olması gerekir |
| Etkinliğe yorum yaz | Kullanıcının `Reservations.Status='Active'` ile o etkinliğe kayıtlı olması gerekir |
| Yorum gör | Tüm kullanıcılar görebilir (giriş gerekmez) |
| ✓ Doğrulanmış rozeti | Yorum sahibi yukarıdaki şartları sağlıyorsa otomatik gösterilir |

### Yorum Akışı
- **Eserler**: Eser kartına tıkla → modalın altında yorumlar listesi ve "✍️ Yorum Yap" butonu.  
  Profil > "Satın Aldıklarım" sekmesinde her satın alınan eserin yanında da buton var.
- **Etkinlikler**: Etkinlik kartına tıkla → modalın altında yorumlar listesi ve "✍️ Yorum Yap" butonu.  
  Profil > "Etkinlik Kayıtlarım" sekmesinde her aktif rezervasyonun yanında da buton var.

## 🛠️ DB'yi Sıfırlama

`gallery.db` dosyasını silmen yeterli — sunucu yeniden başlatıldığında `init_sqlite.sql` ile baştan oluşturulur.

```powershell
Remove-Item backend\gallery.db
cd backend; python server.py
```

## 📚 API Uçları (özet)

| Method | Path | Açıklama |
|--------|------|----------|
| GET | `/api/artworks`, `/api/artists`, `/api/events` | Listeleme |
| POST | `/api/login`, `/api/register` | Auth |
| GET/PUT | `/api/profile/<user_id>` | Profil bilgisi & güncelleme |
| GET/POST/DELETE | `/api/favorites...` | Favori yönetimi |
| POST/PUT/DELETE | `/api/reservations`, `/api/reservations/<id>` | Rezervasyon |
| POST | `/api/orders` | Eser satın alma (çoklu satışı destekler) |
| GET/POST | `/api/comments/...`, `/api/comments` | **Yorum sistemi** |
| GET | `/api/user/<id>/purchased-artworks` | Yorumlanabilir eserler |
| GET | `/api/user/<id>/attended-events` | Yorumlanabilir etkinlikler |
| POST | `/api/validate-coupon` | Kupon doğrulama |
| GET | `/api/special-offer/<user_id>` | Kişiye özel %15 indirim |
| GET/POST/PUT | `/api/tickets...` | Destek talepleri |

## 🎯 İlerleme

Detay için bkz. [`task_list.md`](task_list.md). Mevcut tahmini puan: **~43/106**.
