import os
import json
import sqlite3
import datetime
import time
from collections import defaultdict
from functools import wraps
from flask import Flask, request, jsonify, render_template, send_from_directory, redirect, url_for, session
from werkzeug.security import generate_password_hash, check_password_hash

# ── Database backend selection ───────────────────────────────────────────────
DATABASE_URL = os.environ.get("DATABASE_URL", "")
USE_PG = DATABASE_URL.startswith(("postgresql://", "postgres://"))

if USE_PG:
    import psycopg2
    import psycopg2.extras
    DB_ERROR = psycopg2.IntegrityError
else:
    DB_ERROR = sqlite3.IntegrityError

_SQLITE_FILE = os.path.join(os.path.dirname(__file__), "database.sqlite")


class SmartCursor:
    """Unified cursor wrapper: normalises SQLite (?) and PostgreSQL (%s) SQL."""

    def __init__(self, conn):
        if USE_PG:
            self._cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        else:
            self._cur = conn.cursor()

    def execute(self, sql, params=None):
        if USE_PG:
            sql = sql.replace("?", "%s")
        if params is not None:
            self._cur.execute(sql, params)
        else:
            self._cur.execute(sql)
        return self

    def fetchone(self):
        return self._cur.fetchone()

    def fetchall(self):
        return self._cur.fetchall()

    @property
    def rowcount(self):
        return self._cur.rowcount


def db_upsert(cursor, table, pk_col, cols, vals):
    """INSERT … ON CONFLICT DO UPDATE for PostgreSQL; INSERT OR REPLACE for SQLite."""
    col_str = ", ".join(cols)
    ph = ", ".join(["?"] * len(vals))
    if USE_PG:
        updates = ", ".join(f"{c} = EXCLUDED.{c}" for c in cols if c != pk_col)
        sql = (
            f"INSERT INTO {table} ({col_str}) VALUES ({ph}) "
            f"ON CONFLICT ({pk_col}) DO UPDATE SET {updates}"
        )
    else:
        sql = f"INSERT OR REPLACE INTO {table} ({col_str}) VALUES ({ph})"
    cursor.execute(sql, vals)

app = Flask(__name__)

_secret_key = os.environ.get("SECRET_KEY")
if not _secret_key:
    import warnings
    warnings.warn(
        "SECRET_KEY env var is not set. Using an insecure default key. "
        "Set SECRET_KEY in production to a long random string.",
        stacklevel=1
    )
    _secret_key = "vibrantglaze-dev-secret-key-change-in-prod"
app.secret_key = _secret_key

# Session cookie hardening
app.config.update(
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE="Lax",
    # Only send session cookies over HTTPS in production (when DATABASE_URL is set)
    SESSION_COOKIE_SECURE=USE_PG,
)


@app.after_request
def set_security_headers(response):
    """Attach security headers to every response."""
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "SAMEORIGIN"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    response.headers["X-XSS-Protection"] = "0"  # rely on CSP, not legacy browser filter
    # Remove server identity
    response.headers.pop("Server", None)
    return response


# Rate limiting registry: IP -> list of request timestamps
API_LIMITS = defaultdict(list)

def rate_limit(limit=60, period=60):
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            ip = request.remote_addr
            now = time.time()
            # Clean timestamps older than period
            API_LIMITS[ip] = [t for t in API_LIMITS[ip] if now - t < period]
            if len(API_LIMITS[ip]) >= limit:
                return jsonify({"error": "Too many requests. Please try again later."}), 429
            API_LIMITS[ip].append(now)
            return f(*args, **kwargs)
        return wrapper
    return decorator

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not session.get("is_admin"):
            return jsonify({"error": "Unauthorized access. Admin privileges required."}), 403
        return f(*args, **kwargs)
    return decorated_function

# ==========================================
# PAGE ROUTING (Serves HTML from templates/)
# ==========================================

@app.route("/")
@app.route("/index.html")
def serve_index():
    return render_template("index.html")

@app.route("/shop")
@app.route("/shop.html")
def serve_shop():
    return render_template("shop.html")

@app.route("/gallery")
@app.route("/gallery.html")
def serve_gallery():
    return render_template("gallery.html")

@app.route("/faqs")
@app.route("/faqs.html")
def serve_faqs():
    return render_template("faqs.html")

@app.route("/about")
@app.route("/about.html")
def serve_about():
    return render_template("about.html")

@app.route("/contact")
@app.route("/contact.html")
def serve_contact():
    return render_template("contact.html")

@app.route("/checkout")
@app.route("/checkout.html")
def serve_checkout():
    return render_template("checkout.html")

@app.route("/cart")
@app.route("/cart.html")
def serve_cart():
    return render_template("cart.html")

@app.route("/admin")
@app.route("/admin.html")
def serve_admin():
    if not session.get("is_admin"):
        return redirect(url_for('serve_index') + "?auth=required")
    return render_template("admin.html")

@app.route("/dashboard")
@app.route("/dashboard.html")
def serve_dashboard():
    if not session.get("email"):
        return redirect(url_for('serve_index') + "?auth=required")
    return render_template("dashboard.html")

@app.route("/product-entry")
@app.route("/product-entry.html")
def serve_product_entry():
    if not session.get("is_admin"):
        return redirect(url_for('serve_index') + "?auth=required")
    return render_template("product-entry.html")

@app.route("/product")
@app.route("/product.html")
def serve_product():
    return render_template("product.html")

# ========================================================
# LEGACY / ROOT FALLBACK FOR IMAGES & SCRIPTS
# ========================================================

@app.route("/shared.js")
def serve_shared_js():
    return redirect(url_for('static', filename='script.js'))

@app.route('/<path:filename>')
def serve_root_files(filename):
    from werkzeug.utils import safe_join
    # Strip all path components — only serve flat filenames to prevent traversal
    basename = os.path.basename(filename)
    if not basename or basename.startswith('.'):
        return "Not Found", 404

    ext = os.path.splitext(basename)[1].lower()

    # Serve images from static/images
    if ext in ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp']:
        try:
            img_dir = safe_join(app.root_path, 'static', 'images')
            if img_dir and os.path.exists(os.path.join(img_dir, basename)):
                return send_from_directory(img_dir, basename)
        except Exception:
            pass

    # Serve other known static assets (JS/CSS only, no traversal)
    if ext in ['.js', '.css', '.json', '.woff', '.woff2', '.ttf']:
        try:
            static_dir = safe_join(app.root_path, 'static')
            if static_dir and os.path.exists(os.path.join(static_dir, basename)):
                return send_from_directory(static_dir, basename)
        except Exception:
            pass

    return "Not Found", 404

# ==========================================
# DATABASE & DATA MANAGEMENT
# ==========================================

def get_db():
    if USE_PG:
        return psycopg2.connect(DATABASE_URL)
    conn = sqlite3.connect(_SQLITE_FILE, timeout=10)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn

# Database seed data
DEFAULT_PRODUCTS = [
    {
        "id": "p1",
        "title": "Bespoke Floral A-Z Initial Keychain",
        "category": "Keychain",
        "price": 349,
        "image": "resin_keychain.png",
        "color": "Pink & Gold",
        "material": "Epoxy Resin, Dried Petals, Gold Flakes",
        "is_customizable": 1,
        "rating": 4.8,
        "description": "Individually handcrafted initial keychain, cast with crystal-clear resin, authentic copper/gold flakes, and locally-sourced dehydrated pink flower petals. Sealed with a scratch-resistant gloss glaze.",
        "sizes": json.dumps(["Standard (Small Keyring)", "Premium (Tassel & Charm)", "Luxury (Double Tassel & Monogram)"]),
        "size_prices": json.dumps({
            "Standard (Small Keyring)": 0,
            "Premium (Tassel & Charm)": 100,
            "Luxury (Double Tassel & Monogram)": 200
        }),
        "reviews": json.dumps([
            {"name": "Sneha Patel", "rating": 5, "date": "2026-05-14", "comment": "Absolutely stunning! The packaging had a lovely lavender scent and the gold leaf shines beautifully under daylight.", "photo": "resin_keychain.png"},
            {"name": "Rahul Verma", "rating": 4, "date": "2026-05-20", "comment": "Ordered letter 'R' as a gift. The resin is super smooth. Delivery took 8 days as expected for custom art.", "photo": None}
        ])
    },
    {
        "id": "p2",
        "title": "Preserved Botanical Daisy Pendant Necklace",
        "category": "Pendant",
        "price": 499,
        "image": "resin_pendant.png",
        "color": "White & Gold",
        "material": "Epoxy Resin, Daisy Flower, Gold Plated Brass",
        "is_customizable": 1,
        "rating": 4.9,
        "description": "An elegant oval pendant preserving a whole real white daisy flower in high-grade UV-resistant resin. Suspended from an 18K gold-plated nickel-free brass chain.",
        "sizes": json.dumps(["16-Inch Chain", "18-Inch Chain", "20-Inch Chain"]),
        "size_prices": json.dumps({
            "16-Inch Chain": 0,
            "18-Inch Chain": 50,
            "20-Inch Chain": 90
        }),
        "reviews": json.dumps([
            {"name": "Aditi Rao", "rating": 5, "date": "2026-05-02", "comment": "So simple and aesthetic. Matches my casual linen shirts perfectly. Love the real flower preservation!", "photo": None}
        ])
    },
    {
        "id": "p3",
        "title": "Luxury Gold-Plated White Pearl Drop Earrings",
        "category": "Earring",
        "price": 699,
        "image": "pearl_earrings.png",
        "color": "Pearl White",
        "material": "Gold Plating, Brass, Faux Pearl, Cubic Zirconia",
        "is_customizable": 0,
        "rating": 4.7,
        "description": "Exquisite drop earrings highlighting a perfectly round premium shell pearl capped in sparkling micro-pave cubic zirconia settings and finished with high-quality gold plating. Ideal for cocktail parties and weddings.",
        "sizes": json.dumps(["Standard Pair"]),
        "size_prices": json.dumps({"Standard Pair": 0}),
        "reviews": json.dumps([
            {"name": "Neha Sharma", "rating": 5, "date": "2026-04-18", "comment": "Looks like real fine gold jewellery! Light-weight and does not cause allergy. Loved it.", "photo": "pearl_earrings.png"},
            {"name": "Preeti Singh", "rating": 4, "date": "2026-04-29", "comment": "A bit smaller than expected, but extremely shiny and feels luxury.", "photo": None}
        ])
    },
    {
        "id": "p4",
        "title": "Royal Kundan & Pearl Bridal Necklace Set",
        "category": "Pendant",
        "price": 1899,
        "image": "kundan_necklace.png",
        "color": "Gold & Ruby Red",
        "material": "Brass, Kundan Stones, Enamel Work, Cultured Pearls",
        "is_customizable": 0,
        "rating": 5.0,
        "description": "Traditional heavy Kundan choker embellished with deep ruby red glass beads, faux pearls, and detailed meenakari back-enameling. Includes matching statement drop earrings.",
        "sizes": json.dumps(["Choker + Earring Set"]),
        "size_prices": json.dumps({"Choker + Earring Set": 0}),
        "reviews": json.dumps([
            {"name": "Megha Tosawad", "rating": 5, "date": "2026-05-30", "comment": "Breathtaking piece! Wore it for my cousin's wedding and received dozens of compliments. Feels very heavy and premium.", "photo": "kundan_necklace.png"}
        ])
    },
    {
        "id": "p5",
        "title": "Custom Amethyst Resin Coaster Pair",
        "category": "Resin",
        "price": 599,
        "image": "https://images.unsplash.com/photo-1596548438137-d51ef5c43291?auto=format&fit=crop&q=80&w=600",
        "color": "Amethyst Violet",
        "material": "Epoxy Resin, Acrylic Pigment, Silver Leaf",
        "is_customizable": 1,
        "rating": 4.6,
        "description": "Geode-style resin coasters mixed with amethyst-colored alcohol inks and fine glitter, edged with silver metallic gilding. Heat-resistant up to 80°C.",
        "sizes": json.dumps(["2-Piece Set", "4-Piece Set (+Rs. 450)", "6-Piece Set (+Rs. 850)"]),
        "size_prices": json.dumps({
            "2-Piece Set": 0,
            "4-Piece Set (+Rs. 450)": 450,
            "6-Piece Set (+Rs. 850)": 850
        }),
        "reviews": json.dumps([])
    },
    {
        "id": "p6",
        "title": "Classic Gold Foil Floral Resin Bangle",
        "category": "Bangles",
        "price": 449,
        "image": "https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&q=80&w=600",
        "color": "Gold & Yellow",
        "material": "Epoxy Resin, Dried Buttercups, Gold Foil",
        "is_customizable": 1,
        "rating": 4.5,
        "description": "A continuous solid resin bangle containing yellow dried buttercup petals and crushed gold foil flakes. Smooth inner circumference for a comfortable fit.",
        "sizes": json.dumps(["2.4 Size", "2.6 Size (+Rs. 30)", "2.8 Size (+Rs. 60)"]),
        "size_prices": json.dumps({
            "2.4 Size": 0,
            "2.6 Size (+Rs. 30)": 30,
            "2.8 Size (+Rs. 60)": 60
        }),
        "reviews": json.dumps([])
    },
    {
        "id": "p7",
        "title": "Aesthetic Ocean Wave Resin Bookmark",
        "category": "Resin",
        "price": 249,
        "image": "https://images.unsplash.com/photo-1589156280159-27698a70f29e?auto=format&fit=crop&q=80&w=600",
        "color": "Oceanic Blue",
        "material": "Epoxy Resin, Sea Sand, Acrylic Foam Cell, Tassel",
        "is_customizable": 1,
        "rating": 4.9,
        "description": "Perfect gift for bibliophiles. Features a realistic multi-layered ocean shoreline pour complete with real beach sand, blue wave gradients, and seafoam cells, topped with a silken tassel.",
        "sizes": json.dumps(["Standard Bookmark", "Bookmark with Custom Initial Letter charm (+Rs. 50)"]),
        "size_prices": json.dumps({
            "Standard Bookmark": 0,
            "Bookmark with Custom Initial Letter charm (+Rs. 50)": 50
        }),
        "reviews": json.dumps([
            {"name": "John Doe", "rating": 5, "date": "2026-05-18", "comment": "Literally looks like a piece of the beach in my books. Incredible layer work.", "photo": None}
        ])
    },
    {
        "id": "p8",
        "title": "Polished Kundan Gold-Plated Cuff Bracelet",
        "category": "Bracelet",
        "price": 799,
        "image": "https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?auto=format&fit=crop&q=80&w=600",
        "color": "Gold",
        "material": "Gold Plating, Brass, Kundan Stones",
        "is_customizable": 0,
        "rating": 4.8,
        "description": "Openable cuff bracelet lined with geometric Kundan work and backed by a hand-carved floral brass structure. Double lock mechanism for safety.",
        "sizes": json.dumps(["Standard Adjustable Size"]),
        "size_prices": json.dumps({"Standard Adjustable Size": 0}),
        "reviews": json.dumps([])
    },
    {
        "id": "p9",
        "title": "Ruby Resin Teardrop Jhumka Earrings",
        "category": "Earring",
        "price": 350,
        "image": "earring_ruby_teardrop.png",
        "color": "Ruby & Gold",
        "material": "Epoxy Resin, Gold Flakes, Antique Silver Brass",
        "is_customizable": 0,
        "rating": 4.9,
        "description": "Stunning teardrop-shaped resin earrings filled with deep ruby red pigment and real gold foil flakes, set in an intricately detailed antique silver jhumka frame with delicate dangling bell fringe. Lightweight yet bold — perfect for festive occasions.",
        "sizes": json.dumps(["Standard Pair"]),
        "size_prices": json.dumps({"Standard Pair": 0}),
        "reviews": json.dumps([{"name": "Priya Mehta", "rating": 5, "date": "2026-05-10", "comment": "These are absolutely gorgeous! Got so many compliments at the wedding.", "photo": None}])
    },
    {
        "id": "p10",
        "title": "Ruby Resin Square Jhumka Earrings",
        "category": "Earring",
        "price": 350,
        "image": "earring_ruby_square.png",
        "color": "Ruby & Gold",
        "material": "Epoxy Resin, Gold Flakes, Antique Silver Brass",
        "is_customizable": 0,
        "rating": 4.8,
        "description": "Bold square-shaped resin earrings in vibrant ruby pink with chunky gold foil embedded inside, framed in ornate antique silver with a cascading row of silver ghungroo bells. A statement piece that adds traditional elegance to any look.",
        "sizes": json.dumps(["Standard Pair"]),
        "size_prices": json.dumps({"Standard Pair": 0}),
        "reviews": json.dumps([{"name": "Simran Kaur", "rating": 5, "date": "2026-05-18", "comment": "Perfectly crafted. The gold chunks inside look so premium!", "photo": None}])
    },
    {
        "id": "p11",
        "title": "Blue Daisy Resin Square Jhumka Earrings",
        "category": "Earring",
        "price": 350,
        "image": "earring_blue_daisy.png",
        "color": "Turquoise Blue & White",
        "material": "Epoxy Resin, Pressed Daisy Flower, Antique Silver Brass",
        "is_customizable": 0,
        "rating": 5.0,
        "description": "Vibrant turquoise blue resin earrings with a real preserved white daisy flower at the center, set in a diamond-cut antique silver jhumka frame. A beautiful fusion of nature and resin art, perfect for everyday boho styling.",
        "sizes": json.dumps(["Standard Pair"]),
        "size_prices": json.dumps({"Standard Pair": 0}),
        "reviews": json.dumps([{"name": "Aisha Siddiqui", "rating": 5, "date": "2026-06-01", "comment": "The flower inside looks so real! Absolutely love the color.", "photo": None}])
    },
    {
        "id": "p12",
        "title": "Sky Blue Daisy Resin Teardrop Earrings",
        "category": "Earring",
        "price": 350,
        "image": "earring_skyblue_daisy.png",
        "color": "Sky Blue & White",
        "material": "Epoxy Resin, Pressed Daisy Flower, Antique Silver Brass",
        "is_customizable": 0,
        "rating": 4.9,
        "description": "Delicate sky blue teardrop resin earrings with a real dried white daisy preserved inside, encased in an ornate antique silver filigree frame with silver ghungroo bells. Elegant, lightweight, and ideal for both casual and festive wear.",
        "sizes": json.dumps(["Standard Pair"]),
        "size_prices": json.dumps({"Standard Pair": 0}),
        "reviews": json.dumps([{"name": "Divya Nair", "rating": 5, "date": "2026-06-03", "comment": "So pretty and dainty. The sky blue colour is exactly as shown.", "photo": None}])
    },
    {
        "id": "p13",
        "title": "Teal & Gold Daisy Resin Jhumka Earrings",
        "category": "Earring",
        "price": 350,
        "image": "earring_teal_daisy.png",
        "color": "Teal & Gold",
        "material": "Epoxy Resin, Pressed Daisy Flower, Gold Flakes, Antique Silver Brass",
        "is_customizable": 0,
        "rating": 4.9,
        "description": "Rich teal resin earrings featuring a real white daisy flower surrounded by scattered gold foil flakes, housed in a teardrop antique silver jhumka with layered bell dangles. The most luxurious of our floral earring series — a true collector's piece.",
        "sizes": json.dumps(["Standard Pair"]),
        "size_prices": json.dumps({"Standard Pair": 0}),
        "reviews": json.dumps([{"name": "Rukhsana Shaikh", "rating": 5, "date": "2026-06-05", "comment": "Bought all three daisy pairs! This teal one is my absolute favourite.", "photo": None}])
    }
]

def init_db():
    conn = get_db()
    cursor = SmartCursor(conn)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            email TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            password TEXT NOT NULL,
            phone TEXT,
            address TEXT,
            is_admin INTEGER DEFAULT 0,
            wishlist TEXT DEFAULT '[]',
            saved_designs TEXT DEFAULT '[]'
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS products (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            category TEXT NOT NULL,
            price INTEGER NOT NULL,
            image TEXT,
            color TEXT,
            material TEXT,
            is_customizable INTEGER DEFAULT 0,
            rating REAL DEFAULT 5.0,
            description TEXT,
            sizes TEXT DEFAULT '[]',
            size_prices TEXT DEFAULT '{}',
            reviews TEXT DEFAULT '[]'
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS orders (
            order_id TEXT PRIMARY KEY,
            customer_name TEXT NOT NULL,
            customer_email TEXT NOT NULL,
            customer_phone TEXT,
            shipping_address TEXT NOT NULL,
            items TEXT NOT NULL,
            subtotal INTEGER NOT NULL,
            discount INTEGER DEFAULT 0,
            gift_packaging_fee INTEGER DEFAULT 0,
            gift_message TEXT,
            shipping_fee INTEGER DEFAULT 0,
            tax INTEGER DEFAULT 0,
            grand_total INTEGER NOT NULL,
            payment_method TEXT NOT NULL,
            shipping_speed TEXT NOT NULL,
            status TEXT NOT NULL,
            date TEXT NOT NULL,
            tracking_history TEXT NOT NULL
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS coupons (
            code TEXT PRIMARY KEY,
            discount_percent INTEGER NOT NULL,
            is_active INTEGER DEFAULT 1
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        )
    """)

    # SERIAL (PostgreSQL) vs AUTOINCREMENT (SQLite) for auto-generated id
    if USE_PG:
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS contact_messages (
                id SERIAL PRIMARY KEY,
                type TEXT,
                data TEXT,
                timestamp TEXT
            )
        """)
    else:
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS contact_messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                type TEXT,
                data TEXT,
                timestamp TEXT
            )
        """)

    conn.commit()

    # ── Seed: Users ──────────────────────────────────────────────
    cursor.execute("SELECT COUNT(*) as count FROM users")
    if cursor.fetchone()["count"] == 0:
        cursor.execute(
            "INSERT INTO users (email, name, password, phone, address, is_admin, wishlist) VALUES (?, ?, ?, ?, ?, ?, ?)",
            ("neha@vibrantglaze.com", "Neha", generate_password_hash("neha123"), "9228221331", "Godadara, Surat, Gujarat - 395012", 0, json.dumps(["p1", "p3"]))
        )
        cursor.execute(
            "INSERT INTO users (email, name, password, phone, address, is_admin) VALUES (?, ?, ?, ?, ?, ?)",
            ("admin@vibrantglaze.com", "Admin Manager", generate_password_hash("admin123"), "9228221331", "Surat, Gujarat", 1)
        )
        conn.commit()
    else:
        cursor.execute("SELECT email, password FROM users")
        for user in cursor.fetchall():
            pw = user["password"]
            if pw and not pw.startswith(("scrypt:", "pbkdf2:", "bcrypt:")):
                cursor.execute("UPDATE users SET password = ? WHERE email = ?", (generate_password_hash(pw), user["email"]))
        conn.commit()

    # ── Seed: Products ───────────────────────────────────────────
    for p in DEFAULT_PRODUCTS:
        cursor.execute("SELECT id FROM products WHERE id = ?", (p["id"],))
        if not cursor.fetchone():
            cursor.execute(
                "INSERT INTO products (id, title, category, price, image, color, material, is_customizable, rating, description, sizes, size_prices, reviews) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (p["id"], p["title"], p["category"], p["price"], p["image"], p["color"], p["material"], p["is_customizable"], p["rating"], p["description"], p["sizes"], p["size_prices"], p["reviews"])
            )
    conn.commit()

    # ── Seed: Coupons ────────────────────────────────────────────
    cursor.execute("SELECT COUNT(*) as count FROM coupons")
    if cursor.fetchone()["count"] == 0:
        cursor.execute("INSERT INTO coupons (code, discount_percent, is_active) VALUES (?, ?, ?)", ("FESTIVE15", 15, 1))
        cursor.execute("INSERT INTO coupons (code, discount_percent, is_active) VALUES (?, ?, ?)", ("MONSOON50", 10, 1))
        conn.commit()

    # ── Seed: Settings ───────────────────────────────────────────
    cursor.execute("SELECT COUNT(*) as count FROM settings")
    if cursor.fetchone()["count"] == 0:
        cursor.execute("INSERT INTO settings (key, value) VALUES (?, ?)", (
            "announcement", "✨ FESTIVAL OFFER: Use code FESTIVE15 for 15% OFF on all customized resin art!"
        ))
        conn.commit()

    conn.close()

# ==========================================
# API CONTROLLERS
# ==========================================

# Settings Get & Post
@app.route("/api/settings", methods=["GET", "POST"])
def manage_settings():
    if request.method == "POST" and not session.get("is_admin"):
        return jsonify({"error": "Unauthorized"}), 403
    conn = get_db()
    cursor = SmartCursor(conn)
    if request.method == "GET":
        cursor.execute("SELECT value FROM settings WHERE key = 'announcement'")
        row = cursor.fetchone()
        conn.close()
        return jsonify({"announcement": row["value"] if row else ""})
    else:
        data = request.get_json()
        announcement = data.get("announcement", "")
        db_upsert(cursor, "settings", "key", ["key", "value"], ("announcement", announcement))
        conn.commit()
        conn.close()
        return jsonify({"success": True, "announcement": announcement})

# Register Auth
@app.route("/api/auth/register", methods=["POST"])
@rate_limit(limit=5, period=60)
def auth_register():
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    phone = data.get("phone", "")
    address = data.get("address", "")

    if not name or not email or not password:
        return jsonify({"error": "Name, email, and password are required."}), 400

    if len(password) < 8:
        return jsonify({"error": "Password must be at least 8 characters long."}), 400

    import re as _re
    if not _re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email):
        return jsonify({"error": "Please enter a valid email address."}), 400

    conn = get_db()
    cursor = SmartCursor(conn)
    cursor.execute("SELECT email FROM users WHERE email = ?", (email,))
    if cursor.fetchone():
        conn.close()
        return jsonify({"error": "Email address already registered."}), 400

    hashed_pw = generate_password_hash(password)
    cursor.execute("INSERT INTO users (email, name, password, phone, address, is_admin) VALUES (?, ?, ?, ?, ?, 0)", (
        email, name, hashed_pw, phone, address
    ))
    conn.commit()

    # Log user in
    session["email"] = email
    session["is_admin"] = False

    cursor.execute("SELECT email, name, phone, address, is_admin, wishlist, saved_designs FROM users WHERE email = ?", (email,))
    user = cursor.fetchone()
    conn.close()

    return jsonify({
        "success": True,
        "user": {
            "email": user["email"],
            "name": user["name"],
            "phone": user["phone"],
            "address": user["address"],
            "isAdmin": bool(user["is_admin"]),
            "wishlist": json.loads(user["wishlist"] or "[]"),
            "savedDesigns": json.loads(user["saved_designs"] or "[]")
        }
    })

# Login Auth
@app.route("/api/auth/login", methods=["POST"])
@rate_limit(limit=5, period=60)
def auth_login():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not email or not password:
        return jsonify({"error": "Email and password are required."}), 400

    conn = get_db()
    cursor = SmartCursor(conn)
    cursor.execute("SELECT email, name, password, phone, address, is_admin, wishlist, saved_designs FROM users WHERE email = ?", (email,))
    user = cursor.fetchone()
    conn.close()

    if user and check_password_hash(user["password"], password):
        session["email"] = user["email"]
        session["is_admin"] = bool(user["is_admin"])
        return jsonify({
            "success": True,
            "user": {
                "email": user["email"],
                "name": user["name"],
                "phone": user["phone"],
                "address": user["address"],
                "isAdmin": bool(user["is_admin"]),
                "wishlist": json.loads(user["wishlist"] or "[]"),
                "savedDesigns": json.loads(user["saved_designs"] or "[]")
            }
        })
    else:
        return jsonify({"error": "Invalid email or password credentials."}), 401

# Profile update
@app.route("/api/users/profile", methods=["PUT"])
def user_profile():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip()

    if session.get("email") != email:
        return jsonify({"error": "Unauthorized. You cannot update another user's profile."}), 403

    name = (data.get("name") or "").strip()
    phone = (data.get("phone") or "").strip()
    address = (data.get("address") or "").strip()

    if not name:
        return jsonify({"error": "Name is required and cannot be empty."}), 400

    conn = get_db()
    cursor = SmartCursor(conn)
    cursor.execute("UPDATE users SET name = ?, phone = ?, address = ? WHERE email = ?", (name, phone, address, email))
    conn.commit()

    cursor.execute("SELECT email, name, phone, address, is_admin, wishlist, saved_designs FROM users WHERE email = ?", (email,))
    user = cursor.fetchone()
    conn.close()

    if not user:
        return jsonify({"error": "User not found."}), 404

    return jsonify({
        "success": True,
        "user": {
            "email": user["email"],
            "name": user["name"],
            "phone": user["phone"],
            "address": user["address"],
            "isAdmin": bool(user["is_admin"]),
            "wishlist": json.loads(user["wishlist"] or "[]"),
            "savedDesigns": json.loads(user["saved_designs"] or "[]")
        }
    })

# Wishlist Sync
@app.route("/api/users/wishlist", methods=["POST"])
def user_wishlist():
    data = request.get_json()
    email = data.get("email")
    
    # Check session authorization
    if session.get("email") != email:
        return jsonify({"error": "Unauthorized. You cannot modify another user's wishlist."}), 403

    wishlist = data.get("wishlist")

    conn = get_db()
    cursor = SmartCursor(conn)
    cursor.execute("UPDATE users SET wishlist = ? WHERE email = ?", (json.dumps(wishlist), email))
    conn.commit()
    if cursor.rowcount == 0:
        conn.close()
        return jsonify({"error": "User not found."}), 404
    conn.close()
    return jsonify({"success": True})

# Saved Designs Sync
@app.route("/api/users/saved-designs", methods=["POST"])
def user_saved_designs():
    data = request.get_json()
    email = data.get("email")
    
    # Check session authorization
    if session.get("email") != email:
        return jsonify({"error": "Unauthorized. You cannot modify another user's saved designs."}), 403

    saved_designs = data.get("savedDesigns")

    conn = get_db()
    cursor = SmartCursor(conn)
    cursor.execute("UPDATE users SET saved_designs = ? WHERE email = ?", (json.dumps(saved_designs), email))
    conn.commit()
    if cursor.rowcount == 0:
        conn.close()
        return jsonify({"error": "User not found."}), 404
    conn.close()
    return jsonify({"success": True})

# Products: Get Catalog
@app.route("/api/products", methods=["GET", "POST"])
def manage_products():
    if request.method == "POST" and not session.get("is_admin"):
        return jsonify({"error": "Unauthorized"}), 403
    conn = get_db()
    cursor = SmartCursor(conn)
    if request.method == "GET":
        cursor.execute("SELECT * FROM products")
        rows = cursor.fetchall()
        conn.close()
        
        products_list = []
        for r in rows:
            products_list.append({
                "id": r["id"],
                "title": r["title"],
                "category": r["category"],
                "price": r["price"],
                "image": r["image"],
                "color": r["color"],
                "material": r["material"],
                "isCustomizable": bool(r["is_customizable"]),
                "rating": r["rating"],
                "description": r["description"],
                "sizes": json.loads(r["sizes"]),
                "sizePrices": json.loads(r["size_prices"]),
                "reviews": json.loads(r["reviews"])
            })
        return jsonify(products_list)
    else:
        # Create new product
        data = request.get_json()
        cursor.execute(
            "INSERT INTO products (id, title, category, price, image, color, material, is_customizable, rating, description, sizes, size_prices, reviews) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 5.0, ?, ?, ?, '[]')",
            (data["id"], data["title"], data["category"], data["price"], data["image"], data["color"], data["material"], 1 if data["isCustomizable"] else 0, data["description"], json.dumps(data["sizes"]), json.dumps(data["sizePrices"]))
        )
        conn.commit()
        conn.close()
        return jsonify({"success": True})

# Product Edit & Delete
@app.route("/api/products/<p_id>", methods=["PUT", "DELETE"])
@admin_required
def edit_product(p_id):
    conn = get_db()
    cursor = SmartCursor(conn)
    if request.method == "DELETE":
        cursor.execute("DELETE FROM products WHERE id = ?", (p_id,))
        conn.commit()
        conn.close()
        return jsonify({"success": True})
    else:
        data = request.get_json()
        cursor.execute(
            "UPDATE products SET title = ?, category = ?, price = ?, image = ?, color = ?, material = ?, is_customizable = ?, description = ?, sizes = ?, size_prices = ? WHERE id = ?",
            (data["title"], data["category"], data["price"], data["image"], data["color"], data["material"], 1 if data["isCustomizable"] else 0, data["description"], json.dumps(data.get("sizes", [])), json.dumps(data.get("sizePrices", {})), p_id)
        )
        conn.commit()
        conn.close()
        return jsonify({"success": True})

# Product Reviews Submission
@app.route("/api/products/<p_id>/reviews", methods=["POST"])
def submit_product_review(p_id):
    if not session.get("email"):
        return jsonify({"error": "You must be logged in to submit a review."}), 401
    data = request.get_json()
    name = data.get("name", "Anonymous")
    rating = data.get("rating")
    comment = data.get("comment", "")
    photo = data.get("photo")

    try:
        rating = float(rating)
        if not (1 <= rating <= 5):
            raise ValueError()
    except (TypeError, ValueError):
        return jsonify({"error": "Invalid rating value. Must be a number between 1 and 5."}), 400

    conn = get_db()
    cursor = SmartCursor(conn)
    cursor.execute("SELECT reviews FROM products WHERE id = ?", (p_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return jsonify({"error": "Product not found."}), 404

    reviews = json.loads(row["reviews"])
    reviews.insert(0, {
        "name": name,
        "rating": rating,
        "date": datetime.date.today().isoformat(),
        "comment": comment,
        "photo": photo
    })

    avg_rating = round(sum(float(r["rating"]) for r in reviews) / len(reviews), 1)

    cursor.execute("UPDATE products SET reviews = ?, rating = ? WHERE id = ?", (json.dumps(reviews), avg_rating, p_id))
    conn.commit()
    conn.close()

    return jsonify({"success": True, "reviews": reviews, "rating": avg_rating})

# Orders: Place Prepaid Order
@app.route("/api/orders", methods=["GET", "POST"])
def manage_orders():
    conn = get_db()
    cursor = SmartCursor(conn)
    if request.method == "GET":
        user_email = session.get("email")
        is_admin = session.get("is_admin")

        if not user_email:
            conn.close()
            return jsonify({"error": "Authentication required."}), 401

        if is_admin:
            cursor.execute("SELECT * FROM orders")
        else:
            cursor.execute("SELECT * FROM orders WHERE customer_email = ?", (user_email,))

        rows = cursor.fetchall()
        conn.close()
        
        orders_list = []
        for o in rows:
            orders_list.append({
                "orderId": o["order_id"],
                "customerName": o["customer_name"],
                "customerEmail": o["customer_email"],
                "customerPhone": o["customer_phone"],
                "shippingAddress": o["shipping_address"],
                "items": json.loads(o["items"]),
                "subtotal": o["subtotal"],
                "discount": o["discount"],
                "giftPackagingFee": o["gift_packaging_fee"],
                "giftMessage": o["gift_message"],
                "shippingFee": o["shipping_fee"],
                "tax": o["tax"],
                "grandTotal": o["grand_total"],
                "paymentMethod": o["payment_method"],
                "shippingSpeed": o["shipping_speed"],
                "status": o["status"],
                "date": o["date"],
                "trackingHistory": json.loads(o["tracking_history"])
            })
        return jsonify(orders_list)
    else:
        # Rate limit manual check for order submissions (max 10 orders per IP per minute)
        ip = request.remote_addr
        now = time.time()
        API_LIMITS[ip] = [t for t in API_LIMITS[ip] if now - t < 60]
        if len(API_LIMITS[ip]) >= 10:
            conn.close()
            return jsonify({"error": "Too many order requests. Please try again later."}), 429
        API_LIMITS[ip].append(now)

        o = request.get_json(silent=True) or {}
        required = ("orderId", "customerName", "customerEmail", "shippingAddress", "items", "grandTotal", "paymentMethod", "shippingSpeed", "status")
        missing = [k for k in required if k not in o or o[k] in (None, "")]
        if missing:
            conn.close()
            return jsonify({"error": f"Missing required fields: {', '.join(missing)}"}), 400
        
        # Basic field validation
        if o["grandTotal"] <= 0:
            conn.close()
            return jsonify({"error": "Invalid order total."}), 400

        phone = o.get("customerPhone", "")
        if phone and not (phone.isdigit() and len(phone) == 10):
            conn.close()
            return jsonify({"error": "Invalid customer phone number format. Must be 10 digits."}), 400

        if "@" not in o["customerEmail"]:
            conn.close()
            return jsonify({"error": "Invalid email address format."}), 400

        # Server-side price validation — recalculate subtotal from DB to catch manipulated item prices
        items = o.get("items", [])
        if items:
            server_subtotal = 0
            for item in items:
                pid = item.get("id")
                qty = max(1, int(item.get("qty", 1)))
                size = item.get("size", "")
                if pid:
                    cursor.execute("SELECT price, size_prices FROM products WHERE id = ?", (pid,))
                    prow = cursor.fetchone()
                    if prow:
                        base_price = prow["price"]
                        size_prices = json.loads(prow["size_prices"] or "{}")
                        addon = size_prices.get(size, 0)
                        server_subtotal += (base_price + addon) * qty
            # Allow up to 90% discount (max coupon value) but reject clear price manipulation
            if server_subtotal > 0 and o["grandTotal"] < server_subtotal * 0.10:
                conn.close()
                return jsonify({"error": "Order total is inconsistent with product prices. Please refresh and try again."}), 400

        try:
            cursor.execute(
                """INSERT INTO orders (
                    order_id, customer_name, customer_email, customer_phone, shipping_address, items,
                    subtotal, discount, gift_packaging_fee, gift_message, shipping_fee, tax,
                    grand_total, payment_method, shipping_speed, status, date, tracking_history
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    o["orderId"], o["customerName"], o["customerEmail"], o.get("customerPhone", ""), o["shippingAddress"], json.dumps(items),
                    o.get("subtotal", 0), o.get("discount", 0), o.get("giftPackagingFee", 0), o.get("giftMessage", ""), o.get("shippingFee", 0), o.get("tax", 0),
                    o["grandTotal"], o["paymentMethod"], o["shippingSpeed"], o["status"], o.get("date", datetime.date.today().isoformat()), json.dumps(o.get("trackingHistory", []))
                )
            )
            conn.commit()
        except DB_ERROR:
            conn.close()
            return jsonify({"error": "Order ID already exists. Please try again."}), 409
        conn.close()
        return jsonify({"success": True})

# Orders: Status edit (Admin Console)
@app.route("/api/orders/<order_id>/status", methods=["PUT"])
@admin_required
def update_order_status(order_id):
    data = request.get_json()
    status = data.get("status")
    tracking_history = data.get("trackingHistory")

    conn = get_db()
    cursor = SmartCursor(conn)
    cursor.execute("UPDATE orders SET status = ?, tracking_history = ? WHERE order_id = ?", (
        status, json.dumps(tracking_history), order_id
    ))
    conn.commit()
    updated = cursor.rowcount
    conn.close()
    if not updated:
        return jsonify({"error": "Order not found."}), 404
    return jsonify({"success": True})

# Coupons management
@app.route("/api/coupons", methods=["GET", "POST"])
def manage_coupons():
    if not session.get("is_admin"):
        return jsonify({"error": "Unauthorized. Admin privileges required."}), 403
    conn = get_db()
    cursor = SmartCursor(conn)
    if request.method == "GET":
        cursor.execute("SELECT * FROM coupons")
        rows = cursor.fetchall()
        conn.close()
        return jsonify([{
            "code": c["code"],
            "discountPercent": c["discount_percent"],
            "isActive": bool(c["is_active"])
        } for c in rows])
    else:
        data = request.get_json()
        db_upsert(cursor, "coupons", "code",
                  ["code", "discount_percent", "is_active"],
                  (data["code"], data["discountPercent"], 1 if data["isActive"] else 0))
        conn.commit()
        conn.close()
        return jsonify({"success": True})

# Coupon validation endpoint (public — used by cart/checkout)
@app.route("/api/coupons/validate", methods=["POST"])
@rate_limit(limit=20, period=60)
def validate_coupon():
    data = request.get_json(silent=True) or {}
    code = (data.get("code") or "").strip().upper()
    if not code:
        return jsonify({"error": "Coupon code is required."}), 400
    conn = get_db()
    cursor = SmartCursor(conn)
    cursor.execute("SELECT discount_percent FROM coupons WHERE code = ? AND is_active = 1", (code,))
    row = cursor.fetchone()
    conn.close()
    if row:
        return jsonify({"valid": True, "discountPercent": row["discount_percent"]})
    return jsonify({"valid": False, "error": "Invalid or expired coupon code."}), 404

@app.route("/api/coupons/<code_val>", methods=["DELETE"])
@admin_required
def delete_coupon(code_val):
    conn = get_db()
    cursor = SmartCursor(conn)
    cursor.execute("DELETE FROM coupons WHERE code = ?", (code_val,))
    conn.commit()
    conn.close()
    return jsonify({"success": True})

# Admin customers list
@app.route("/api/admin/customers", methods=["GET"])
@admin_required
def get_customers():
    conn = get_db()
    cursor = SmartCursor(conn)
    cursor.execute("SELECT email, name, phone, address, is_admin FROM users")
    rows = cursor.fetchall()
    conn.close()
    return jsonify([{
        "email": r["email"],
        "name": r["name"],
        "phone": r["phone"],
        "address": r["address"],
        "isAdmin": bool(r["is_admin"])
    } for r in rows])

# Image upload endpoint
@app.route("/api/upload", methods=["POST"])
@admin_required
def upload_image():
    from werkzeug.utils import secure_filename
    import uuid
    
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
        
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
        
    # Check if the file is allowed
    allowed_extensions = {'png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico'}
    filename = secure_filename(file.filename)
    ext = filename.rsplit('.', 1)[1].lower() if '.' in filename else ''
    
    if not ext or ext not in allowed_extensions:
        return jsonify({"error": f"File type .{ext} is not allowed"}), 400
        
    # Generate unique filename using UUID to prevent clashes
    unique_filename = f"product_{uuid.uuid4().hex[:8]}.{ext}"
    
    # Ensure static/images directory exists
    images_dir = os.path.join(app.root_path, 'static', 'images')
    os.makedirs(images_dir, exist_ok=True)
    
    filepath = os.path.join(images_dir, unique_filename)
    file.save(filepath)
    
    return jsonify({
        "success": True,
        "filename": unique_filename
    })

# Contact form submissions
@app.route("/api/contact", methods=["POST"])
@rate_limit(limit=10, period=60)
def submit_contact():
    data = request.json or {}
    conn = get_db()
    cursor = SmartCursor(conn)
    cursor.execute(
        "INSERT INTO contact_messages (type, data, timestamp) VALUES (?, ?, ?)",
        (data.get("type", "general"), json.dumps(data), data.get("timestamp", datetime.datetime.now().isoformat()))
    )
    conn.commit()
    conn.close()
    return jsonify({"success": True, "message": "Message received"})

# Order Return/Exchange request flow
@app.route("/api/orders/<order_id>/return", methods=["POST"])
@rate_limit(limit=10, period=60)
def request_order_return(order_id):
    user_email = session.get("email")
    if not user_email:
        return jsonify({"error": "Authentication required."}), 401

    data = request.get_json() or {}
    reason = data.get("reason", "")
    return_type = data.get("type", "Return") # 'Return' or 'Exchange'
    
    new_status = "Return Requested" if return_type == "Return" else "Exchange Requested"
    
    conn = get_db()
    cursor = SmartCursor(conn)
    cursor.execute("SELECT status, tracking_history, customer_email FROM orders WHERE order_id = ?", (order_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return jsonify({"error": "Order not found."}), 404

    if row["customer_email"] != user_email and not session.get("is_admin"):
        conn.close()
        return jsonify({"error": "Unauthorized. This order does not belong to you."}), 403

    if row["status"] != "Delivered":
        conn.close()
        return jsonify({"error": "Only delivered orders can be returned or exchanged."}), 400
        
    history = json.loads(row["tracking_history"])
    history.append({
        "status": new_status,
        "note": f"Request submitted. Reason: {reason}",
        "time": datetime.datetime.now().strftime("%d/%m/%Y, %H:%M:%S")
    })
    
    cursor.execute("UPDATE orders SET status = ?, tracking_history = ? WHERE order_id = ?", (new_status, json.dumps(history), order_id))
    conn.commit()
    conn.close()
    return jsonify({"success": True, "status": new_status, "trackingHistory": history})

init_db()

if __name__ == "__main__":
    print("\n" + "="*55)
    print("  VibrantGlaze is running!")
    print("  Open in browser: http://localhost:5000")
    print("  Admin: admin@vibrantglaze.com / admin123")
    print("="*55 + "\n")
    app.run(host="0.0.0.0", port=5000, debug=False)
