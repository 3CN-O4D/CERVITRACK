from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
from datetime import datetime, timedelta
import os
import base64
import random
import string

app = Flask(__name__)
CORS(app)
DB_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'cervitrack.db')
CHATS_DB = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'chats.db')

MOCK_ARTICLES = [
    {"id": 1, "title": "Understanding Cervical Cancer", "summary": "Learn about the causes, symptoms, and risk factors of cervical cancer.", "content": "Cervical cancer develops in the cervix and is primarily caused by HPV infection. Regular screening can detect precancerous changes early.", "image": "https://images.unsplash.com/photo-1579154204601-01588f351e67?w=400", "category": "education", "readTime": "5 min"},
    {"id": 2, "title": "HPV Vaccination Guide", "summary": "Everything you need to know about the HPV vaccine and its benefits.", "content": "The HPV vaccine protects against the most common cancer-causing HPV strains. It is recommended for girls and boys aged 9-14.", "image": "https://images.unsplash.com/photo-1584982751601-97dcc096659c?w=400", "category": "prevention", "readTime": "4 min"},
    {"id": 3, "title": "Screening Methods Explained", "summary": "A breakdown of Pap smears, HPV tests, and visual inspection methods.", "content": "Different screening methods are available depending on resources and patient history. Pap smear remains the gold standard in many countries.", "image": "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=400", "category": "education", "readTime": "6 min"},
    {"id": 4, "title": "Healthy Living After Treatment", "summary": "Tips for maintaining health and wellness after cervical cancer treatment.", "content": "Post-treatment care includes regular follow-ups, healthy diet, exercise, and emotional support. Survivorship care plans help coordinate long-term care.", "image": "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400", "category": "wellness", "readTime": "7 min"},
    {"id": 5, "title": "Understanding Your Screening Results", "summary": "What your screening results mean and what to do next.", "content": "Screening results can be negative, positive, or inconclusive. Each result has specific follow-up recommendations based on guidelines.", "image": "https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=400", "category": "education", "readTime": "5 min"},
    {"id": 6, "title": "Risk Factors for Cervical Cancer", "summary": "Key risk factors every woman should be aware of.", "content": "Risk factors include HPV infection, smoking, multiple pregnancies, long-term oral contraceptive use, and family history of cervical cancer.", "image": "https://images.unsplash.com/photo-1584515933487-779824d29309?w=400", "category": "awareness", "readTime": "4 min"},
    {"id": 7, "title": "Cervical Cancer in Kenya", "summary": "Statistics, challenges, and progress in cervical cancer prevention in Kenya.", "content": "Cervical cancer is the leading cause of cancer-related deaths among women in Kenya. Screening coverage remains low at about 16%.", "image": "https://images.unsplash.com/photo-1576671081837-49000212a370?w=400", "category": "awareness", "readTime": "6 min"},
    {"id": 8, "title": "Nutrition for Cervical Health", "summary": "Dietary choices that support cervical health and immunity.", "content": "Foods rich in folate, vitamins A, C, E, and antioxidants may help protect against cervical cancer. A balanced diet supports immune function.", "image": "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=400", "category": "wellness", "readTime": "4 min"},
    {"id": 9, "title": "Frequently Asked Questions About Screening", "summary": "Common questions and answers about cervical cancer screening.", "content": "When should I start screening? How often do I need it? Is it painful? Answers to these and more common screening questions.", "image": "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400", "category": "education", "readTime": "3 min"},
    {"id": 10, "title": "Support Resources for Patients", "summary": "Where to find support groups, counseling, and financial assistance.", "content": "Several organizations provide support for cervical cancer patients including counseling services, support groups, and financial aid programs.", "image": "https://images.unsplash.com/photo-1544027993-37dbfe43562a?w=400", "category": "support", "readTime": "5 min"},
    {"id": 11, "title": "Self-Care During Screening", "summary": "How to prepare for and care for yourself during the screening process.", "content": "Self-care tips before and after screening include staying hydrated, wearing comfortable clothing, and practicing relaxation techniques.", "image": "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400", "category": "wellness", "readTime": "3 min"},
    {"id": 12, "title": "Advances in Cervical Cancer Research", "summary": "Latest research developments in prevention, screening, and treatment.", "content": "New screening technologies including HPV DNA testing and AI-assisted screening are improving early detection rates in low-resource settings.", "image": "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400", "category": "research", "readTime": "8 min"},
]

MOCK_FACILITIES = [
    {"name": "Kenyatta National Hospital", "location": "Nairobi CBD, Hospital Road", "distance": 2.4, "phone": "+254 20 2726300", "hours": "Mon-Sun 24hrs", "services": "Screening, Treatment, Vaccination"},
    {"name": "Aga Khan University Hospital", "location": "Nairobi, 3rd Parklands Avenue", "distance": 4.1, "phone": "+254 20 3666000", "hours": "Mon-Sun 24hrs", "services": "Screening, Treatment, Counseling"},
    {"name": "M.P. Shah Hospital", "location": "Nairobi, Parklands, Shivachi Road", "distance": 3.8, "phone": "+254 20 4291000", "hours": "Mon-Sun 24hrs", "services": "Screening, Vaccination"},
    {"name": "Nairobi Women's Hospital", "location": "Nairobi, Hurlingham, Argwings Kodhek Rd", "distance": 1.9, "phone": "+254 20 2723069", "hours": "Mon-Sat 7am-9pm", "services": "Screening, Treatment, Counseling"},
    {"name": "Mater Misericordiae Hospital", "location": "Nairobi, Mukinyi Road, Industrial Area", "distance": 3.2, "phone": "+254 20 6903000", "hours": "Mon-Sun 24hrs", "services": "Screening, Treatment, Vaccination"},
    {"name": "The Nairobi Hospital", "location": "Nairobi, Upper Hill, Argwings Kodhek Rd", "distance": 2.8, "phone": "+254 20 2845000", "hours": "Mon-Sun 24hrs", "services": "Screening, Treatment, Counseling"},
    {"name": "Coptic Hospital", "location": "Nairobi, Ngong Road", "distance": 5.3, "phone": "+254 20 3870733", "hours": "Mon-Sat 7am-8pm", "services": "Screening, Vaccination"},
    {"name": "Gertrude's Children's Hospital", "location": "Nairobi, Muthaiga, Kiambu Road", "distance": 6.7, "phone": "+254 20 7206000", "hours": "Mon-Sun 24hrs", "services": "Vaccination, Counseling"},
]

SAMPLE_GUIDE_STEPS = [
    {"step": 1, "title": "Prepare", "description": "Avoid sexual intercourse, douching, or using vaginal medications for 48 hours before your test.", "icon": "clipboard", "duration": "48 hours before"},
    {"step": 2, "title": "Visit a Facility", "description": "Visit any of our partner health facilities. The procedure takes about 10-15 minutes.", "icon": "hospital", "duration": "10-15 min"},
    {"step": 3, "title": "Sample Collection", "description": "A health worker will collect a sample from your cervix using a small brush or spatula.", "icon": "flask", "duration": "2-3 min"},
    {"step": 4, "title": "Lab Analysis", "description": "Your sample is sent to a laboratory for analysis. Results are typically ready within 2 weeks.", "icon": "microscope", "duration": "1-2 weeks"},
    {"step": 5, "title": "Get Results", "description": "Receive your results through the app. Our team will contact you if follow-up is needed.", "icon": "file-text", "duration": "Instant"},
]

TRANSLATIONS = {
    "en": {
        "appName": "CerviTrack",
        "welcome": "Welcome to CerviTrack",
        "login": "Login",
        "register": "Register",
        "email": "Email",
        "password": "Password",
        "name": "Full Name",
        "phone": "Phone Number",
        "dashboard": "Dashboard",
        "screenings": "Screenings",
        "vaccines": "Vaccines",
        "appointments": "Appointments",
        "facilities": "Facilities",
        "library": "Library",
        "profile": "Profile",
        "settings": "Settings",
        "logout": "Logout",
        "newScreening": "New Screening",
        "history": "History",
        "riskLevel": "Risk Level",
        "high": "High",
        "low": "Low",
        "positive": "Positive",
        "negative": "Negative",
        "bookAppointment": "Book Appointment",
        "notifications": "Notifications",
        "noNotifications": "No notifications yet",
        "search": "Search",
        "cancel": "Cancel",
        "save": "Save",
        "submit": "Submit",
        "loading": "Loading...",
        "error": "An error occurred",
        "success": "Success",
    },
    "sw": {
        "appName": "CerviTrack",
        "welcome": "Karibu CerviTrack",
        "login": "Ingia",
        "register": "Jisajili",
        "email": "Barua pepe",
        "password": "Nywila",
        "name": "Jina Kamili",
        "phone": "Namba ya Simu",
        "dashboard": "Dashibodi",
        "screenings": "Uchunguzi",
        "vaccines": "Chanjo",
        "appointments": "Miwadi",
        "facilities": "Vituo vya Afya",
        "library": "Maktaba",
        "profile": "Wasifu",
        "settings": "Mipangilio",
        "logout": "Toka",
        "newScreening": "Uchunguzi Mpya",
        "history": "Historia",
        "riskLevel": "Kiwango cha Hatari",
        "high": "Juu",
        "low": "Chini",
        "positive": "Chanya",
        "negative": "Hasi",
        "bookAppointment": "Weka Miadi",
        "notifications": "Arifa",
        "noNotifications": "Hakuna arifa bado",
        "search": "Tafuta",
        "cancel": "Ghairi",
        "save": "Hifadhi",
        "submit": "Wasilisha",
        "loading": "Inapakia...",
        "error": "Hitilafu imetokea",
        "success": "Imefaulu",
    },
}

CHAT_CONTACTS = [
    {"name": "Dr. Sarah Kimani", "role": "Obstetrician/Gynecologist", "online": 1},
    {"name": "Nurse Mercy Wanjiku", "role": "HPV Screening Specialist", "online": 1},
    {"name": "Dr. John Omondi", "role": "Oncologist", "online": 0},
    {"name": "Lab Tech Paul Mwangi", "role": "Cytology", "online": 1},
    {"name": "Nurse Esther Akinyi", "role": "Community Health", "online": 0},
    {"name": "Dr. Anne Kamau", "role": "Reproductive Health", "online": 1},
]


def get_db():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def get_chats_db():
    conn = sqlite3.connect(CHATS_DB)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    conn.execute("ATTACH DATABASE ? AS maindb", (DB_FILE,))
    return conn


def seed_facilities():
    conn = get_db()
    count = conn.execute("SELECT COUNT(*) FROM facilities").fetchone()[0]
    if count == 0:
        for f in MOCK_FACILITIES:
            conn.execute(
                "INSERT INTO facilities (name, location, distance, phone, hours, services) VALUES (?, ?, ?, ?, ?, ?)",
                (f["name"], f["location"], f["distance"], f["phone"], f["hours"], f["services"]),
            )
        conn.commit()
    conn.close()


def seed_articles():
    conn = get_db()
    count = conn.execute("SELECT COUNT(*) FROM articles").fetchone()[0]
    if count == 0:
        for a in MOCK_ARTICLES:
            conn.execute(
                "INSERT INTO articles (title, summary, content, image, category, read_time) VALUES (?, ?, ?, ?, ?, ?)",
                (a["title"], a["summary"], a["content"], a["image"], a["category"], a["readTime"]),
            )
        conn.commit()
    conn.close()


def init_chats_db():
    conn = get_chats_db()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS conversations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            contact_id INTEGER NOT NULL,
            contact_name TEXT NOT NULL,
            contact_role TEXT,
            last_message TEXT,
            last_time TEXT,
            unread INTEGER DEFAULT 0,
            online BOOLEAN DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            conversation_id INTEGER NOT NULL,
            sender_id INTEGER,
            sender_type TEXT DEFAULT 'user',
            message_type TEXT DEFAULT 'text',
            content TEXT,
            file_url TEXT,
            duration TEXT,
            status TEXT DEFAULT 'sent',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS contacts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            role TEXT,
            online BOOLEAN DEFAULT 0
        );
    """)
    count = conn.execute("SELECT COUNT(*) FROM contacts").fetchone()[0]
    if count == 0:
        for c in CHAT_CONTACTS:
            conn.execute(
                "INSERT INTO contacts (name, role, online) VALUES (?, ?, ?)",
                (c["name"], c["role"], c["online"]),
            )
        conn.commit()
    conn.close()


def upgrade_appointments_schema():
    conn = get_db()
    for col in ["title", "facility"]:
        try:
            conn.execute(f"ALTER TABLE appointments ADD COLUMN {col} TEXT")
        except sqlite3.OperationalError:
            pass
    conn.commit()
    conn.close()


def upgrade_users_schema():
    conn = get_db()
    new_cols = {
        "county": "TEXT",
        "sub_county": "TEXT",
        "ward": "TEXT",
        "patient_id": "TEXT",
        "consent_terms": "INTEGER DEFAULT 0",
        "consent_medical": "INTEGER DEFAULT 0",
        "consent_at": "TEXT",
        "total_screenings": "INTEGER DEFAULT 0",
        "total_vaccines": "INTEGER DEFAULT 0",
        "last_screening_date": "TEXT",
        "last_vaccine_date": "TEXT",
        "risk_index": "TEXT DEFAULT 'LOW'",
    }
    for col, typ in new_cols.items():
        try:
            conn.execute(f"ALTER TABLE users ADD COLUMN {col} {typ}")
        except sqlite3.OperationalError:
            pass
    conn.commit()
    conn.close()


def generate_patient_id():
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))


def run_db_migration():
    conn = get_db()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            phone TEXT,
            password TEXT NOT NULL,
            role TEXT DEFAULT 'patient',
            photo TEXT,
            birth_date TEXT,
            last_healed_date TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS screenings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            profile_id INTEGER NOT NULL,
            verdict TEXT NOT NULL,
            risk_tier TEXT NOT NULL,
            age INTEGER,
            parity INTEGER,
            vaccination TEXT,
            previous_screening TEXT,
            hiv_status TEXT,
            smoking TEXT,
            symptoms TEXT,
            family_history TEXT,
            score INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS vaccines (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            hospital TEXT,
            date TEXT,
            status TEXT DEFAULT 'upcoming',
            reminder_day BOOLEAN DEFAULT 0,
            reminder_before BOOLEAN DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS appointments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            facility_name TEXT,
            facility_location TEXT,
            date TEXT,
            notes TEXT,
            status TEXT DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            title TEXT,
            message TEXT,
            type TEXT,
            read BOOLEAN DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            sender TEXT,
            message TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS facilities (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            location TEXT,
            distance REAL,
            phone TEXT,
            hours TEXT,
            services TEXT
        );

        CREATE TABLE IF NOT EXISTS reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            admin_id INTEGER,
            user_id INTEGER,
            type TEXT,
            content TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS articles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            summary TEXT,
            content TEXT,
            image TEXT,
            category TEXT,
            read_time TEXT
        );

        CREATE TABLE IF NOT EXISTS followups (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            screening_id INTEGER,
            completed BOOLEAN DEFAULT 0,
            completed_at TIMESTAMP,
            notes TEXT
        );

        CREATE TABLE IF NOT EXISTS lab_results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            patient_name TEXT,
            result TEXT,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS feedback (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            category TEXT NOT NULL,
            message TEXT NOT NULL,
            contact TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS test_results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            result TEXT NOT NULL,
            date TEXT NOT NULL,
            image_path TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS providers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            phone TEXT,
            password TEXT NOT NULL,
            role TEXT DEFAULT 'doctor',
            specialty TEXT,
            hospital TEXT,
            license_number TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS scheduled_actions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            type TEXT NOT NULL,
            title TEXT,
            scheduled_date TEXT NOT NULL,
            notes TEXT,
            status TEXT DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS consent_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            consent_type TEXT NOT NULL,
            accepted BOOLEAN DEFAULT 1,
            accepted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)
    conn.commit()
    conn.close()
    seed_facilities()
    seed_articles()
    upgrade_appointments_schema()
    upgrade_users_schema()


# ───────────────────────── Helpers ─────────────────────────

def now():
    return datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")


def today_str():
    return datetime.utcnow().strftime("%Y-%m-%d")


def date_range(period):
    today = datetime.utcnow().date()
    if period == "today":
        start = today
    elif period == "this_week":
        start = today - timedelta(days=today.weekday())
    elif period == "this_month":
        start = today.replace(day=1)
    elif period == "three_months":
        start = today - timedelta(days=90)
    elif period == "six_months":
        start = today - timedelta(days=180)
    elif period == "one_year":
        start = today - timedelta(days=365)
    else:
        return None, None
    return start.strftime("%Y-%m-%d"), today.strftime("%Y-%m-%d")


def dict_from_row(row):
    if row is None:
        return None
    return dict(row)


def rows_to_list(rows):
    return [dict(r) for r in rows]


# ───────────────────────── Auth ─────────────────────────

@app.route("/api/auth/register", methods=["POST"])
def register():
    data = request.json
    if not data:
        return jsonify({"error": "Request body required"}), 400
    name = data.get("name")
    email = data.get("email")
    phone = data.get("phone")
    password = data.get("password")
    role = data.get("role", "patient")
    if not all([name, email, password]):
        return jsonify({"error": "name, email, and password are required"}), 400
    conn = get_db()
    try:
        patient_id = generate_patient_id()
        while conn.execute("SELECT id FROM users WHERE patient_id=?", (patient_id,)).fetchone():
            patient_id = generate_patient_id()
        county = data.get("county")
        sub_county = data.get("sub_county")
        ward = data.get("ward")
        consent_terms = 1 if data.get("consent_terms") else 0
        consent_medical = 1 if data.get("consent_medical") else 0
        consent_at = now() if (consent_terms or consent_medical) else None
        cur = conn.execute(
            "INSERT INTO users (name, email, phone, password, role, county, sub_county, ward, patient_id, consent_terms, consent_medical, consent_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (name, email, phone, password, role, county, sub_county, ward, patient_id, consent_terms, consent_medical, consent_at),
        )
        conn.commit()
        user_id = cur.lastrowid
        if consent_terms:
            conn.execute(
                "INSERT INTO consent_log (user_id, consent_type, accepted) VALUES (?, ?, 1)",
                (user_id, "terms"),
            )
        if consent_medical:
            conn.execute(
                "INSERT INTO consent_log (user_id, consent_type, accepted) VALUES (?, ?, 1)",
                (user_id, "medical"),
            )
        if consent_terms or consent_medical:
            conn.commit()
        user = conn.execute("SELECT * FROM users WHERE id=?", (user_id,)).fetchone()
        return jsonify(dict_from_row(user)), 201
    except sqlite3.IntegrityError:
        return jsonify({"error": "Email already exists"}), 409
    finally:
        conn.close()


@app.route("/api/auth/login", methods=["POST"])
def login():
    data = request.json
    if not data:
        return jsonify({"error": "Request body required"}), 400
    email = data.get("email")
    password = data.get("password")
    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400
    conn = get_db()
    user = conn.execute(
        "SELECT * FROM users WHERE email=? AND password=?", (email, password)
    ).fetchone()
    conn.close()
    if user:
        return jsonify(dict_from_row(user)), 200
    return jsonify({"error": "Invalid credentials"}), 401


@app.route("/api/auth/profile", methods=["PUT", "DELETE"])
def profile_route():
    if request.method == "DELETE":
        data = request.json
        if not data or not data.get("user_id"):
            return jsonify({"error": "user_id is required"}), 400
        conn = get_db()
        conn.execute("DELETE FROM users WHERE id=?", (data["user_id"],))
        conn.execute("DELETE FROM screenings WHERE profile_id=?", (data["user_id"],))
        conn.execute("DELETE FROM appointments WHERE user_id=?", (data["user_id"],))
        conn.execute("DELETE FROM notifications WHERE user_id=?", (data["user_id"],))
        conn.commit()
        conn.close()
        return jsonify({"success": True, "message": "Account and all associated data deleted"}), 200
    return update_profile()


def update_profile():
    data = request.json
    if not data:
        return jsonify({"error": "Request body required"}), 400
    user_id = data.get("user_id")
    if not user_id:
        return jsonify({"error": "user_id is required"}), 400
    conn = get_db()
    existing = conn.execute("SELECT * FROM users WHERE id=?", (user_id,)).fetchone()
    if not existing:
        conn.close()
        return jsonify({"error": "User not found"}), 404
    fields = ["name", "email", "phone", "birth_date", "last_healed_date", "photo", "county", "sub_county", "ward"]
    updates = {}
    for f in fields:
        if f in data:
            updates[f] = data[f]
    if not updates:
        conn.close()
        return jsonify({"error": "No fields to update"}), 400
    set_clause = ", ".join(f"{k}=?" for k in updates)
    vals = list(updates.values()) + [user_id]
    conn.execute(f"UPDATE users SET {set_clause} WHERE id=?", vals)
    conn.commit()
    user = conn.execute("SELECT * FROM users WHERE id=?", (user_id,)).fetchone()
    conn.close()
    return jsonify(dict_from_row(user)), 200


# ───────────────────────── Screening ─────────────────────────

@app.route("/api/screening/submit", methods=["POST"])
def submit_screening():
    data = request.json
    if not data:
        return jsonify({"error": "Request body required"}), 400
    profile_id = data.get("profile_id")
    verdict = data.get("verdict", "NEGATIVE")
    risk_tier = data.get("risk_tier", "LOW")
    if not profile_id:
        return jsonify({"error": "profile_id is required"}), 400
    conn = get_db()
    cur = conn.execute(
        """INSERT INTO screenings
           (profile_id, verdict, risk_tier, age, parity, vaccination, previous_screening,
            hiv_status, smoking, symptoms, family_history, score)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (
            profile_id,
            verdict,
            risk_tier,
            data.get("age"),
            data.get("parity"),
            data.get("vaccination"),
            data.get("previous_screening"),
            data.get("hiv_status"),
            data.get("smoking"),
            data.get("symptoms"),
            data.get("family_history"),
            data.get("score"),
        ),
    )
    screening_id = cur.lastrowid
    conn.execute(
        "INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)",
        (
            profile_id,
            "Screening Complete",
            f"Your screening result is {verdict}. Risk tier: {risk_tier}.",
            "screening",
        ),
    )
    conn.execute(
        "UPDATE users SET total_screenings = total_screenings + 1, last_screening_date = ? WHERE id = ?",
        (today_str(), profile_id),
    )
    conn.commit()
    screening = conn.execute("SELECT * FROM screenings WHERE id=?", (screening_id,)).fetchone()
    conn.close()
    return jsonify(dict_from_row(screening)), 201


@app.route("/api/screening/history", methods=["GET"])
def screening_history():
    user_id = request.args.get("user_id")
    if not user_id:
        return jsonify({"error": "user_id query parameter required"}), 400
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM screenings WHERE profile_id=? ORDER BY created_at DESC", (user_id,)
    ).fetchall()
    conn.close()
    return jsonify(rows_to_list(rows)), 200


# ───────────────────────── Dashboard ─────────────────────────

@app.route("/api/dashboard/stats", methods=["GET"])
def dashboard_stats():
    period = request.args.get("period")
    conn = get_db()
    total_users = conn.execute("SELECT COUNT(*) FROM users").fetchone()[0]
    total_screenings = conn.execute("SELECT COUNT(*) FROM screenings").fetchone()[0]
    hpv_positive = conn.execute(
        "SELECT COUNT(*) FROM screenings WHERE verdict='POSITIVE'"
    ).fetchone()[0]
    risk_alerts = conn.execute(
        "SELECT COUNT(*) FROM screenings WHERE risk_tier='HIGH'"
    ).fetchone()[0]
    followups_completed = conn.execute(
        "SELECT COUNT(*) FROM followups WHERE completed=1"
    ).fetchone()[0]

    if period:
        start, end = date_range(period)
        if start and end:
            screenings_today = conn.execute(
                "SELECT COUNT(*) FROM screenings WHERE DATE(created_at) BETWEEN ? AND ?",
                (start, end),
            ).fetchone()[0]
        else:
            screenings_today = None
    else:
        today = today_str()
        screenings_today = conn.execute(
            "SELECT COUNT(*) FROM screenings WHERE DATE(created_at)=?", (today,)
        ).fetchone()[0]

    screenings_this_week = conn.execute(
        "SELECT COUNT(*) FROM screenings WHERE DATE(created_at) >= ?",
        (date_range("this_week")[0],),
    ).fetchone()[0]
    screenings_this_month = conn.execute(
        "SELECT COUNT(*) FROM screenings WHERE DATE(created_at) >= ?",
        (date_range("this_month")[0],),
    ).fetchone()[0]

    conn.close()
    return jsonify({
        "registered": total_users,
        "screenings": total_screenings,
        "hpvPositive": hpv_positive,
        "riskAlerts": risk_alerts,
        "screeningsToday": screenings_today,
        "screeningsThisWeek": screenings_this_week,
        "screeningsThisMonth": screenings_this_month,
        "followupsCompleted": followups_completed,
    }), 200


# ───────────────────────── Vaccines ─────────────────────────

@app.route("/api/vaccines/add", methods=["POST"])
def add_vaccine():
    data = request.json
    if not data:
        return jsonify({"error": "Request body required"}), 400
    user_id = data.get("user_id")
    name = data.get("name")
    hospital = data.get("hospital")
    date_val = data.get("date")
    if not all([user_id, name]):
        return jsonify({"error": "user_id and name are required"}), 400
    conn = get_db()
    cur = conn.execute(
        "INSERT INTO vaccines (user_id, name, hospital, date) VALUES (?, ?, ?, ?)",
        (user_id, name, hospital, date_val),
    )
    if date_val:
        conn.execute(
            "UPDATE users SET total_vaccines = total_vaccines + 1, last_vaccine_date = ? WHERE id = ?",
            (date_val, user_id),
        )
    conn.commit()
    vaccine = conn.execute("SELECT * FROM vaccines WHERE id=?", (cur.lastrowid,)).fetchone()
    conn.close()
    return jsonify(dict_from_row(vaccine)), 201


@app.route("/api/vaccines", methods=["GET"])
def get_vaccines():
    user_id = request.args.get("user_id")
    if not user_id:
        return jsonify({"error": "user_id query parameter required"}), 400
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM vaccines WHERE user_id=? ORDER BY date DESC", (user_id,)
    ).fetchall()
    conn.close()
    return jsonify(rows_to_list(rows)), 200


@app.route("/api/vaccines/<int:vaccine_id>/done", methods=["PUT"])
def vaccine_done(vaccine_id):
    conn = get_db()
    existing = conn.execute("SELECT * FROM vaccines WHERE id=?", (vaccine_id,)).fetchone()
    if not existing:
        conn.close()
        return jsonify({"error": "Vaccine not found"}), 404
    conn.execute("UPDATE vaccines SET status='done' WHERE id=?", (vaccine_id,))
    conn.commit()
    vaccine = conn.execute("SELECT * FROM vaccines WHERE id=?", (vaccine_id,)).fetchone()
    conn.close()
    return jsonify(dict_from_row(vaccine)), 200


@app.route("/api/vaccines/<int:vaccine_id>/reminder", methods=["PUT"])
def vaccine_reminder(vaccine_id):
    data = request.json or {}
    conn = get_db()
    existing = conn.execute("SELECT * FROM vaccines WHERE id=?", (vaccine_id,)).fetchone()
    if not existing:
        conn.close()
        return jsonify({"error": "Vaccine not found"}), 404
    reminder_day = data.get("reminder_day", existing["reminder_day"])
    reminder_before = data.get("reminder_before", existing["reminder_before"])
    conn.execute(
        "UPDATE vaccines SET reminder_day=?, reminder_before=? WHERE id=?",
        (int(bool(reminder_day)), int(bool(reminder_before)), vaccine_id),
    )
    conn.commit()
    vaccine = conn.execute("SELECT * FROM vaccines WHERE id=?", (vaccine_id,)).fetchone()
    conn.close()
    return jsonify(dict_from_row(vaccine)), 200


# ───────────────────────── Facilities ─────────────────────────

@app.route("/api/facilities", methods=["GET"])
def get_facilities():
    conn = get_db()
    rows = conn.execute("SELECT * FROM facilities").fetchall()
    conn.close()
    return jsonify(rows_to_list(rows)), 200


# ───────────────────────── Appointments (legacy) ─────────────────────────

@app.route("/api/appointments/book", methods=["POST"])
def book_appointment():
    data = request.json
    if not data:
        return jsonify({"error": "Request body required"}), 400
    user_id = data.get("user_id")
    facility_name = data.get("facility_name")
    facility_location = data.get("facility_location")
    date_val = data.get("date")
    notes = data.get("notes")
    if not all([user_id, facility_name, date_val]):
        return jsonify({"error": "user_id, facility_name, and date are required"}), 400
    conn = get_db()
    cur = conn.execute(
        "INSERT INTO appointments (user_id, facility_name, facility_location, date, notes) VALUES (?, ?, ?, ?, ?)",
        (user_id, facility_name, facility_location, date_val, notes),
    )
    conn.commit()
    appt = conn.execute("SELECT * FROM appointments WHERE id=?", (cur.lastrowid,)).fetchone()
    conn.close()
    return jsonify(dict_from_row(appt)), 201


# ───────────────────────── Appointments (new) ─────────────────────────

@app.route("/api/appointments", methods=["GET"])
def get_appointments():
    user_id = request.args.get("user_id")
    if not user_id:
        return jsonify({"error": "user_id query parameter required"}), 400
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM appointments WHERE user_id=? ORDER BY date DESC", (user_id,)
    ).fetchall()
    conn.close()
    return jsonify(rows_to_list(rows)), 200


@app.route("/api/appointments/create", methods=["POST"])
def create_appointment():
    data = request.json
    if not data:
        return jsonify({"error": "Request body required"}), 400
    user_id = data.get("user_id")
    title = data.get("title")
    facility = data.get("facility")
    date_val = data.get("date")
    notes = data.get("notes")
    if not all([user_id, date_val]):
        return jsonify({"error": "user_id and date are required"}), 400
    conn = get_db()
    cur = conn.execute(
        "INSERT INTO appointments (user_id, title, facility, date, notes) VALUES (?, ?, ?, ?, ?)",
        (user_id, title, facility, date_val, notes),
    )
    conn.commit()
    appt = conn.execute("SELECT * FROM appointments WHERE id=?", (cur.lastrowid,)).fetchone()
    conn.close()
    return jsonify(dict_from_row(appt)), 201


@app.route("/api/appointments/<int:appointment_id>/status", methods=["PUT"])
def update_appointment_status(appointment_id):
    data = request.json or {}
    status = data.get("status")
    if not status:
        return jsonify({"error": "status is required"}), 400
    if status not in ("upcoming", "completed", "cancelled"):
        return jsonify({"error": "Invalid status"}), 400
    conn = get_db()
    existing = conn.execute("SELECT * FROM appointments WHERE id=?", (appointment_id,)).fetchone()
    if not existing:
        conn.close()
        return jsonify({"error": "Appointment not found"}), 404
    conn.execute("UPDATE appointments SET status=? WHERE id=?", (status, appointment_id))
    conn.commit()
    appt = conn.execute("SELECT * FROM appointments WHERE id=?", (appointment_id,)).fetchone()
    conn.close()
    return jsonify(dict_from_row(appt)), 200


# ───────────────────────── Lab Results ─────────────────────────

@app.route("/api/lab-results/add", methods=["POST"])
def add_lab_result():
    data = request.json
    if not data:
        return jsonify({"error": "Request body required"}), 400
    user_id = data.get("user_id")
    patient_name = data.get("patient_name")
    result = data.get("result")
    notes = data.get("notes")
    if not all([user_id, patient_name, result]):
        return jsonify({"error": "user_id, patient_name, and result are required"}), 400
    conn = get_db()
    cur = conn.execute(
        "INSERT INTO lab_results (user_id, patient_name, result, notes) VALUES (?, ?, ?, ?)",
        (user_id, patient_name, result, notes),
    )
    conn.commit()
    lab = conn.execute("SELECT * FROM lab_results WHERE id=?", (cur.lastrowid,)).fetchone()
    conn.close()
    return jsonify(dict_from_row(lab)), 201


@app.route("/api/lab-results", methods=["GET"])
def get_lab_results():
    user_id = request.args.get("user_id")
    if not user_id:
        return jsonify({"error": "user_id query parameter required"}), 400
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM lab_results WHERE user_id=? ORDER BY created_at DESC", (user_id,)
    ).fetchall()
    conn.close()
    return jsonify(rows_to_list(rows)), 200


# ───────────────────────── Test Results ──────────────────────

@app.route("/api/test-results", methods=["POST"])
def submit_test_result():
    data = request.json
    if not data:
        return jsonify({"error": "Request body required"}), 400
    user_id = data.get("user_id")
    result = data.get("result")
    date = data.get("date")
    if not all([user_id, result, date]):
        return jsonify({"error": "user_id, result, and date are required"}), 400
    conn = get_db()
    cur = conn.execute(
        "INSERT INTO test_results (user_id, result, date) VALUES (?, ?, ?)",
        (user_id, result, date),
    )
    conn.commit()
    tr = conn.execute("SELECT * FROM test_results WHERE id=?", (cur.lastrowid,)).fetchone()
    conn.close()
    return jsonify(dict_from_row(tr)), 201


@app.route("/api/test-results", methods=["GET"])
def get_test_results():
    user_id = request.args.get("user_id")
    if not user_id:
        return jsonify({"error": "user_id query parameter required"}), 400
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM test_results WHERE user_id=? ORDER BY created_at DESC", (user_id,)
    ).fetchall()
    conn.close()
    return jsonify(rows_to_list(rows)), 200


# ───────────────────────── Follow-ups ─────────────────────────

@app.route("/api/followups", methods=["GET"])
def get_followups():
    user_id = request.args.get("user_id")
    if not user_id:
        return jsonify({"error": "user_id query parameter required"}), 400
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM followups WHERE user_id=? ORDER BY id DESC", (user_id,)
    ).fetchall()
    conn.close()
    return jsonify(rows_to_list(rows)), 200


@app.route("/api/followups/complete", methods=["POST"])
def complete_followup():
    data = request.json
    if not data:
        return jsonify({"error": "Request body required"}), 400
    followup_id = data.get("followup_id")
    notes = data.get("notes")
    if not followup_id:
        return jsonify({"error": "followup_id is required"}), 400
    conn = get_db()
    existing = conn.execute("SELECT * FROM followups WHERE id=?", (followup_id,)).fetchone()
    if not existing:
        conn.close()
        return jsonify({"error": "Follow-up not found"}), 404
    conn.execute(
        "UPDATE followups SET completed=1, completed_at=?, notes=? WHERE id=?",
        (now(), notes, followup_id),
    )
    conn.commit()
    fup = conn.execute("SELECT * FROM followups WHERE id=?", (followup_id,)).fetchone()
    conn.close()
    return jsonify(dict_from_row(fup)), 200


# ───────────────────────── Telehealth ─────────────────────────

@app.route("/api/telehealth/message", methods=["POST"])
def send_message():
    data = request.json
    if not data:
        return jsonify({"error": "Request body required"}), 400
    user_id = data.get("user_id")
    sender = data.get("sender")
    message = data.get("message")
    if not all([user_id, message]):
        return jsonify({"error": "user_id and message are required"}), 400
    conn = get_db()
    cur = conn.execute(
        "INSERT INTO messages (user_id, sender, message) VALUES (?, ?, ?)",
        (user_id, sender, message),
    )
    conn.commit()
    msg = conn.execute("SELECT * FROM messages WHERE id=?", (cur.lastrowid,)).fetchone()
    conn.close()
    return jsonify(dict_from_row(msg)), 201


@app.route("/api/telehealth/messages", methods=["GET"])
def get_messages():
    user_id = request.args.get("user_id")
    if not user_id:
        return jsonify({"error": "user_id query parameter required"}), 400
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM messages WHERE user_id=? ORDER BY created_at ASC", (user_id,)
    ).fetchall()
    conn.close()
    return jsonify(rows_to_list(rows)), 200


# ───────────────────────── Library ─────────────────────────

@app.route("/api/library/articles", methods=["GET"])
def get_articles():
    conn = get_db()
    rows = conn.execute("SELECT id, title, summary, image, category, read_time FROM articles").fetchall()
    conn.close()
    return jsonify(rows_to_list(rows)), 200


# ───────────────────────── Notifications ─────────────────────────

@app.route("/api/notifications", methods=["GET"])
def get_notifications():
    user_id = request.args.get("user_id")
    if not user_id:
        return jsonify({"error": "user_id query parameter required"}), 400
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC", (user_id,)
    ).fetchall()
    conn.close()
    return jsonify(rows_to_list(rows)), 200


@app.route("/api/notifications/<int:notification_id>/read", methods=["PUT", "POST"])
def mark_notification_read(notification_id):
    conn = get_db()
    existing = conn.execute("SELECT * FROM notifications WHERE id=?", (notification_id,)).fetchone()
    if not existing:
        conn.close()
        return jsonify({"error": "Notification not found"}), 404
    conn.execute("UPDATE notifications SET read=1 WHERE id=?", (notification_id,))
    conn.commit()
    notif = conn.execute("SELECT * FROM notifications WHERE id=?", (notification_id,)).fetchone()
    conn.close()
    return jsonify(dict_from_row(notif)), 200


@app.route("/api/notifications/mark-all-read", methods=["PUT", "POST"])
def mark_all_notifications_read():
    data = request.json or {}
    user_id = data.get("user_id")
    if not user_id:
        return jsonify({"error": "user_id is required"}), 400
    conn = get_db()
    conn.execute("UPDATE notifications SET read=1 WHERE user_id=?", (user_id,))
    conn.commit()
    conn.close()
    return jsonify({"message": "All notifications marked as read"}), 200


@app.route("/api/notifications/send", methods=["POST"])
def send_notification():
    data = request.json
    if not data:
        return jsonify({"error": "Request body required"}), 400
    user_id = data.get("user_id")
    title = data.get("title")
    message = data.get("message")
    ntype = data.get("type", "general")
    if not all([user_id, title, message]):
        return jsonify({"error": "user_id, title, and message are required"}), 400
    conn = get_db()
    cur = conn.execute(
        "INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)",
        (user_id, title, message, ntype),
    )
    conn.commit()
    notif = conn.execute("SELECT * FROM notifications WHERE id=?", (cur.lastrowid,)).fetchone()
    conn.close()
    return jsonify(dict_from_row(notif)), 201


# ───────────────────────── Chats ─────────────────────────

@app.route("/api/chats/contacts", methods=["GET"])
def chats_contacts():
    conn = get_chats_db()
    rows = conn.execute("SELECT * FROM contacts").fetchall()
    conn.close()
    return jsonify(rows_to_list(rows)), 200


@app.route("/api/chats/conversations", methods=["GET"])
def chats_conversations():
    user_id = request.args.get("user_id")
    if not user_id:
        return jsonify({"error": "user_id query parameter required"}), 400
    conn = get_chats_db()
    rows = conn.execute(
        "SELECT * FROM conversations WHERE user_id=? ORDER BY last_time DESC", (user_id,)
    ).fetchall()
    conn.close()
    return jsonify(rows_to_list(rows)), 200


@app.route("/api/chats/conversations/create", methods=["POST"])
def chats_create_conversation():
    data = request.json
    if not data:
        return jsonify({"error": "Request body required"}), 400
    user_id = data.get("user_id")
    contact_id = data.get("contact_id")
    contact_name = data.get("contact_name")
    contact_role = data.get("contact_role")
    online = data.get("online", 0)
    if not all([user_id, contact_id, contact_name]):
        return jsonify({"error": "user_id, contact_id, and contact_name are required"}), 400
    conn = get_chats_db()
    existing = conn.execute(
        "SELECT * FROM conversations WHERE user_id=? AND contact_id=?",
        (user_id, contact_id),
    ).fetchone()
    if existing:
        conn.close()
        return jsonify(dict_from_row(existing)), 200
    cur = conn.execute(
        "INSERT INTO conversations (user_id, contact_id, contact_name, contact_role, online) VALUES (?, ?, ?, ?, ?)",
        (user_id, contact_id, contact_name, contact_role, online),
    )
    conn.commit()
    conv = conn.execute("SELECT * FROM conversations WHERE id=?", (cur.lastrowid,)).fetchone()
    conn.close()
    return jsonify(dict_from_row(conv)), 201


@app.route("/api/chats/messages", methods=["GET"])
def chats_messages():
    conversation_id = request.args.get("conversation_id")
    if not conversation_id:
        return jsonify({"error": "conversation_id query parameter required"}), 400
    conn = get_chats_db()
    rows = conn.execute(
        "SELECT * FROM messages WHERE conversation_id=? ORDER BY created_at ASC", (conversation_id,)
    ).fetchall()
    conn.close()
    return jsonify(rows_to_list(rows)), 200


@app.route("/api/chats/messages/send", methods=["POST"])
def chats_send_message():
    data = request.json
    if not data:
        return jsonify({"error": "Request body required"}), 400
    conversation_id = data.get("conversation_id")
    sender_id = data.get("sender_id")
    sender_type = data.get("sender_type", "user")
    content = data.get("content")
    if not all([conversation_id, content]):
        return jsonify({"error": "conversation_id and content are required"}), 400
    conn = get_chats_db()
    cur = conn.execute(
        "INSERT INTO messages (conversation_id, sender_id, sender_type, content) VALUES (?, ?, ?, ?)",
        (conversation_id, sender_id, sender_type, content),
    )
    msg_id = cur.lastrowid
    now_val = now()
    conn.execute(
        "UPDATE conversations SET last_message=?, last_time=?, unread=unread+1 WHERE id=?",
        (content, now_val, conversation_id),
    )
    conn.commit()
    msg = conn.execute("SELECT * FROM messages WHERE id=?", (msg_id,)).fetchone()
    conn.close()
    return jsonify(dict_from_row(msg)), 201


@app.route("/api/chats/messages/send-image", methods=["POST"])
def chats_send_image():
    data = request.json
    if not data:
        return jsonify({"error": "Request body required"}), 400
    conversation_id = data.get("conversation_id")
    sender_id = data.get("sender_id")
    content = data.get("content")
    file_url = data.get("file_url")
    if data.get("file_base64"):
        try:
            ext = data.get("file_ext", "png")
            fname = f"chat_img_{int(datetime.utcnow().timestamp())}.{ext}"
            upload_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
            os.makedirs(upload_dir, exist_ok=True)
            fpath = os.path.join(upload_dir, fname)
            with open(fpath, "wb") as f:
                f.write(base64.b64decode(data["file_base64"]))
            file_url = f"/uploads/{fname}"
        except Exception as e:
            return jsonify({"error": f"Failed to save image: {str(e)}"}), 500
    if not all([conversation_id, file_url]):
        return jsonify({"error": "conversation_id and file_url or file_base64 are required"}), 400
    conn = get_chats_db()
    cur = conn.execute(
        "INSERT INTO messages (conversation_id, sender_id, sender_type, message_type, content, file_url) VALUES (?, ?, ?, 'image', ?, ?)",
        (conversation_id, sender_id, data.get("sender_type", "user"), content, file_url),
    )
    msg_id = cur.lastrowid
    now_val = now()
    conn.execute(
        "UPDATE conversations SET last_message='[Image]', last_time=?, unread=unread+1 WHERE id=?",
        (now_val, conversation_id),
    )
    conn.commit()
    msg = conn.execute("SELECT * FROM messages WHERE id=?", (msg_id,)).fetchone()
    conn.close()
    return jsonify(dict_from_row(msg)), 201


@app.route("/api/chats/messages/send-audio", methods=["POST"])
def chats_send_audio():
    data = request.json
    if not data:
        return jsonify({"error": "Request body required"}), 400
    conversation_id = data.get("conversation_id")
    sender_id = data.get("sender_id")
    file_url = data.get("file_url")
    duration = data.get("duration")
    if data.get("file_base64"):
        try:
            fname = f"chat_audio_{int(datetime.utcnow().timestamp())}.mp3"
            upload_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
            os.makedirs(upload_dir, exist_ok=True)
            fpath = os.path.join(upload_dir, fname)
            with open(fpath, "wb") as f:
                f.write(base64.b64decode(data["file_base64"]))
            file_url = f"/uploads/{fname}"
        except Exception as e:
            return jsonify({"error": f"Failed to save audio: {str(e)}"}), 500
    if not all([conversation_id, file_url]):
        return jsonify({"error": "conversation_id and file_url are required"}), 400
    conn = get_chats_db()
    cur = conn.execute(
        "INSERT INTO messages (conversation_id, sender_id, sender_type, message_type, file_url, duration) VALUES (?, ?, ?, 'audio', ?, ?)",
        (conversation_id, sender_id, data.get("sender_type", "user"), file_url, duration),
    )
    msg_id = cur.lastrowid
    now_val = now()
    conn.execute(
        "UPDATE conversations SET last_message='[Audio]', last_time=?, unread=unread+1 WHERE id=?",
        (now_val, conversation_id),
    )
    conn.commit()
    msg = conn.execute("SELECT * FROM messages WHERE id=?", (msg_id,)).fetchone()
    conn.close()
    return jsonify(dict_from_row(msg)), 201


@app.route("/api/chats/messages/<int:message_id>/read", methods=["PUT"])
def chats_mark_message_read(message_id):
    conn = get_chats_db()
    existing = conn.execute("SELECT * FROM messages WHERE id=?", (message_id,)).fetchone()
    if not existing:
        conn.close()
        return jsonify({"error": "Message not found"}), 404
    conn.execute("UPDATE messages SET status='read' WHERE id=?", (message_id,))
    conn.commit()
    msg = conn.execute("SELECT * FROM messages WHERE id=?", (message_id,)).fetchone()
    conn.close()
    return jsonify(dict_from_row(msg)), 200


@app.route("/api/chats/conversations/<int:conversation_id>/read", methods=["PUT"])
def chats_mark_conversation_read(conversation_id):
    conn = get_chats_db()
    existing = conn.execute("SELECT * FROM conversations WHERE id=?", (conversation_id,)).fetchone()
    if not existing:
        conn.close()
        return jsonify({"error": "Conversation not found"}), 404
    conn.execute("UPDATE conversations SET unread=0 WHERE id=?", (conversation_id,))
    conn.execute("UPDATE messages SET status='read' WHERE conversation_id=? AND status!='read'", (conversation_id,))
    conn.commit()
    conv = conn.execute("SELECT * FROM conversations WHERE id=?", (conversation_id,)).fetchone()
    conn.close()
    return jsonify(dict_from_row(conv)), 200


# ───────────────────────── Self-Sampling Guide ─────────────────────────

@app.route("/api/sampling/guide", methods=["GET"])
def sampling_guide():
    return jsonify(SAMPLE_GUIDE_STEPS), 200


# ───────────────────────── i18n ─────────────────────────

@app.route("/api/i18n/<lang>", methods=["GET"])
def i18n(lang):
    translations = TRANSLATIONS.get(lang)
    if not translations:
        return jsonify({"error": f"Language '{lang}' not supported"}), 404
    return jsonify(translations), 200


# ───────────────────────── Admin ─────────────────────────

@app.route("/api/admin/users", methods=["GET"])
def admin_users():
    conn = get_db()
    rows = conn.execute("SELECT * FROM users ORDER BY created_at DESC").fetchall()
    result = []
    for u in rows:
        user = dict(u)
        latest = conn.execute(
            "SELECT verdict, risk_tier, created_at FROM screenings WHERE profile_id=? ORDER BY created_at DESC LIMIT 1",
            (user["id"],),
        ).fetchone()
        if latest:
            user["latest_screening"] = dict(latest)
        result.append(user)
    conn.close()
    return jsonify(result), 200


@app.route("/api/admin/users/at-risk", methods=["GET"])
def admin_users_at_risk():
    conn = get_db()
    rows = conn.execute("""
        SELECT DISTINCT u.* FROM users u
        JOIN screenings s ON s.profile_id = u.id
        WHERE s.risk_tier = 'HIGH'
        ORDER BY u.created_at DESC
    """).fetchall()
    result = []
    for u in rows:
        user = dict(u)
        latest = conn.execute(
            "SELECT verdict, risk_tier, created_at FROM screenings WHERE profile_id=? ORDER BY created_at DESC LIMIT 1",
            (user["id"],),
        ).fetchone()
        if latest:
            user["latest_screening"] = dict(latest)
        result.append(user)
    conn.close()
    return jsonify(result), 200


@app.route("/api/admin/users/healthy", methods=["GET"])
def admin_users_healthy():
    conn = get_db()
    rows = conn.execute("""
        SELECT DISTINCT u.* FROM users u
        JOIN screenings s ON s.profile_id = u.id
        WHERE s.risk_tier = 'LOW'
        AND u.id NOT IN (
            SELECT DISTINCT profile_id FROM screenings WHERE risk_tier = 'HIGH'
        )
        ORDER BY u.created_at DESC
    """).fetchall()
    result = []
    for u in rows:
        user = dict(u)
        latest = conn.execute(
            "SELECT verdict, risk_tier, created_at FROM screenings WHERE profile_id=? ORDER BY created_at DESC LIMIT 1",
            (user["id"],),
        ).fetchone()
        if latest:
            user["latest_screening"] = dict(latest)
        result.append(user)
    conn.close()
    return jsonify(result), 200


@app.route("/api/admin/dashboard", methods=["GET"])
def admin_dashboard():
    conn = get_db()
    total_users = conn.execute("SELECT COUNT(*) FROM users").fetchone()[0]
    today = today_str()
    this_week_start = date_range("this_week")[0]
    this_month_start = date_range("this_month")[0]

    screenings_today = conn.execute(
        "SELECT COUNT(*) FROM screenings WHERE DATE(created_at)=?", (today,)
    ).fetchone()[0]
    screenings_this_week = conn.execute(
        "SELECT COUNT(*) FROM screenings WHERE DATE(created_at)>=?", (this_week_start,)
    ).fetchone()[0]
    screenings_this_month = conn.execute(
        "SELECT COUNT(*) FROM screenings WHERE DATE(created_at)>=?", (this_month_start,)
    ).fetchone()[0]

    high_risk = conn.execute(
        "SELECT COUNT(*) FROM screenings WHERE risk_tier='HIGH'"
    ).fetchone()[0]
    low_risk = conn.execute(
        "SELECT COUNT(*) FROM screenings WHERE risk_tier='LOW'"
    ).fetchone()[0]
    positive = conn.execute(
        "SELECT COUNT(*) FROM screenings WHERE verdict='POSITIVE'"
    ).fetchone()[0]
    negative = conn.execute(
        "SELECT COUNT(*) FROM screenings WHERE verdict='NEGATIVE'"
    ).fetchone()[0]
    followups_completed = conn.execute(
        "SELECT COUNT(*) FROM followups WHERE completed=1"
    ).fetchone()[0]

    recent = conn.execute(
        "SELECT s.*, u.name AS user_name FROM screenings s JOIN users u ON u.id=s.profile_id ORDER BY s.created_at DESC LIMIT 10"
    ).fetchall()

    conn.close()
    return jsonify({
        "totalUsers": total_users,
        "screeningsToday": screenings_today,
        "screeningsThisWeek": screenings_this_week,
        "screeningsThisMonth": screenings_this_month,
        "riskBreakdown": {"high": high_risk, "low": low_risk},
        "verdictBreakdown": {"positive": positive, "negative": negative},
        "recentScreenings": rows_to_list(recent),
        "followupsCompleted": followups_completed,
    }), 200


@app.route("/api/admin/stats", methods=["GET"])
def admin_stats():
    conn = get_db()

    # County prevalence
    counties = conn.execute("""
        SELECT u.county,
               COUNT(DISTINCT u.id) AS total_patients,
               COUNT(DISTINCT s.id) AS total_screenings,
               SUM(CASE WHEN s.verdict='POSITIVE' THEN 1 ELSE 0 END) AS positive_cases,
               SUM(CASE WHEN s.verdict='NEGATIVE' THEN 1 ELSE 0 END) AS negative_cases,
               SUM(CASE WHEN s.risk_tier='HIGH' THEN 1 ELSE 0 END) AS high_risk,
               SUM(CASE WHEN s.risk_tier='LOW' THEN 1 ELSE 0 END) AS low_risk
        FROM users u
        LEFT JOIN screenings s ON s.profile_id = u.id
        WHERE u.county IS NOT NULL AND u.county != ''
        GROUP BY u.county
        ORDER BY positive_cases DESC
    """).fetchall()

    # Age group distribution (from screenings with age data)
    age_groups = conn.execute("""
        SELECT
            CASE
                WHEN age < 25 THEN '18-24'
                WHEN age BETWEEN 25 AND 34 THEN '25-34'
                WHEN age BETWEEN 35 AND 44 THEN '35-44'
                WHEN age BETWEEN 45 AND 54 THEN '45-54'
                ELSE '55+'
            END AS age_group,
            COUNT(*) AS total,
            SUM(CASE WHEN verdict='POSITIVE' THEN 1 ELSE 0 END) AS positive,
            SUM(CASE WHEN verdict='NEGATIVE' THEN 1 ELSE 0 END) AS negative
        FROM screenings
        WHERE age IS NOT NULL
        GROUP BY age_group
        ORDER BY age_group
    """).fetchall()

    # Verdict breakdown
    verdicts = conn.execute("""
        SELECT verdict, COUNT(*) AS count
        FROM screenings
        GROUP BY verdict
    """).fetchall()

    # Risk tier breakdown
    risk_tiers = conn.execute("""
        SELECT risk_tier, COUNT(*) AS count
        FROM screenings
        GROUP BY risk_tier
    """).fetchall()

    # Gender distribution (users table)
    gender_dist = conn.execute("""
        SELECT gender, COUNT(*) AS count
        FROM users
        WHERE role='patient' AND gender IS NOT NULL
        GROUP BY gender
    """).fetchall()

    # Monthly screening trends (last 12 months)
    monthly = conn.execute("""
        SELECT strftime('%Y-%m', created_at) AS month,
               COUNT(*) AS total,
               SUM(CASE WHEN verdict='POSITIVE' THEN 1 ELSE 0 END) AS positive
        FROM screenings
        WHERE created_at >= date('now', '-12 months')
        GROUP BY month
        ORDER BY month ASC
    """).fetchall()

    # Vaccine coverage by county
    vaccine_coverage = conn.execute("""
        SELECT u.county,
               COUNT(DISTINCT u.id) AS total_patients,
               COUNT(DISTINCT v.id) AS total_vaccines
        FROM users u
        LEFT JOIN vaccines v ON v.user_id = u.id
        WHERE u.county IS NOT NULL AND u.county != ''
        GROUP BY u.county
        ORDER BY total_vaccines DESC
    """).fetchall()

    # Gender vs risk cross-tab
    gender_risk = conn.execute("""
        SELECT u.gender, s.risk_tier, COUNT(*) AS count
        FROM screenings s
        JOIN users u ON u.id = s.profile_id
        WHERE u.gender IS NOT NULL
        GROUP BY u.gender, s.risk_tier
    """).fetchall()

    # Overall totals
    totals = conn.execute("""
        SELECT
            (SELECT COUNT(*) FROM users WHERE role='patient') AS total_patients,
            (SELECT COUNT(*) FROM screenings) AS total_screenings,
            (SELECT COUNT(*) FROM vaccines) AS total_vaccines,
            (SELECT COUNT(*) FROM screenings WHERE verdict='POSITIVE') AS total_positive,
            (SELECT COUNT(*) FROM screenings WHERE verdict='NEGATIVE') AS total_negative,
            (SELECT COUNT(*) FROM screenings WHERE verdict='INCONCLUSIVE') AS total_inconclusive,
            (SELECT COUNT(*) FROM screenings WHERE risk_tier='HIGH') AS total_high_risk,
            (SELECT COUNT(*) FROM screenings WHERE risk_tier='MODERATE') AS total_moderate_risk,
            (SELECT COUNT(*) FROM screenings WHERE risk_tier='LOW') AS total_low_risk
    """).fetchone()

    conn.close()
    return jsonify({
        "totals": dict(totals) if totals else {},
        "counties": rows_to_list(counties),
        "ageGroups": rows_to_list(age_groups),
        "verdicts": rows_to_list(verdicts),
        "riskTiers": rows_to_list(risk_tiers),
        "genderDistribution": rows_to_list(gender_dist),
        "monthlyTrends": rows_to_list(monthly),
        "vaccineCoverage": rows_to_list(vaccine_coverage),
        "genderRisk": rows_to_list(gender_risk),
    }), 200


@app.route("/api/admin/appointments", methods=["GET"])
def admin_appointments():
    conn = get_db()
    rows = conn.execute("""
        SELECT a.*, u.name AS user_name, u.email AS user_email
        FROM appointments a
        JOIN users u ON u.id = a.user_id
        ORDER BY a.date DESC
    """).fetchall()
    conn.close()
    return jsonify(rows_to_list(rows)), 200


@app.route("/api/admin/lab-results", methods=["GET"])
def admin_lab_results():
    conn = get_db()
    rows = conn.execute("""
        SELECT l.*, u.name AS user_name, u.email AS user_email
        FROM lab_results l
        JOIN users u ON u.id = l.user_id
        ORDER BY l.created_at DESC
    """).fetchall()
    conn.close()
    return jsonify(rows_to_list(rows)), 200


@app.route("/api/admin/followups", methods=["GET"])
def admin_followups():
    conn = get_db()
    rows = conn.execute("""
        SELECT f.*, u.name AS user_name, u.email AS user_email
        FROM followups f
        JOIN users u ON u.id = f.user_id
        ORDER BY f.id DESC
    """).fetchall()
    conn.close()
    return jsonify(rows_to_list(rows)), 200


@app.route("/api/admin/report/generate", methods=["POST"])
def generate_report():
    data = request.json
    if not data:
        return jsonify({"error": "Request body required"}), 400
    admin_id = data.get("admin_id")
    user_id = data.get("user_id")
    rtype = data.get("type", "general")
    if not all([admin_id, user_id]):
        return jsonify({"error": "admin_id and user_id are required"}), 400
    conn = get_db()
    user = conn.execute("SELECT * FROM users WHERE id=?", (user_id,)).fetchone()
    if not user:
        conn.close()
        return jsonify({"error": "User not found"}), 404
    screenings = conn.execute(
        "SELECT * FROM screenings WHERE profile_id=? ORDER BY created_at DESC", (user_id,)
    ).fetchall()
    content = f"Report for {user['name']} ({user['email']})\nScreenings: {len(screenings)}\n"
    for s in screenings:
        content += f"  - {s['created_at']}: {s['verdict']} ({s['risk_tier']})\n"
    cur = conn.execute(
        "INSERT INTO reports (admin_id, user_id, type, content) VALUES (?, ?, ?, ?)",
        (admin_id, user_id, rtype, content),
    )
    conn.commit()
    report = conn.execute("SELECT * FROM reports WHERE id=?", (cur.lastrowid,)).fetchone()
    conn.close()
    return jsonify(dict_from_row(report)), 201


@app.route("/api/admin/reports", methods=["GET"])
def admin_reports():
    user_id = request.args.get("user_id")
    if not user_id:
        return jsonify({"error": "user_id query parameter required"}), 400
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM reports WHERE user_id=? ORDER BY created_at DESC", (user_id,)
    ).fetchall()
    conn.close()
    return jsonify(rows_to_list(rows)), 200


@app.route("/api/admin/notification/send", methods=["POST"])
def admin_send_notification():
    data = request.json
    if not data:
        return jsonify({"error": "Request body required"}), 400
    user_id = data.get("user_id")
    title = data.get("title")
    message = data.get("message")
    ntype = data.get("type", "admin")
    if not all([user_id, title, message]):
        return jsonify({"error": "user_id, title, and message are required"}), 400
    conn = get_db()
    cur = conn.execute(
        "INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)",
        (user_id, title, message, ntype),
    )
    conn.commit()
    notif = conn.execute("SELECT * FROM notifications WHERE id=?", (cur.lastrowid,)).fetchone()
    conn.close()
    return jsonify(dict_from_row(notif)), 201


# ───────────────────────── Admin Chats ─────────────────────────

@app.route("/api/admin/chats/conversations", methods=["GET"])
def admin_chats_conversations():
    conn = get_chats_db()
    contacts = conn.execute("SELECT * FROM contacts").fetchall()
    conversations = conn.execute("""
        SELECT c.*, COALESCE(u.name, 'Patient') AS user_name
        FROM conversations c
        LEFT JOIN maindb.users u ON CAST(u.id AS TEXT) = c.user_id
        ORDER BY c.last_time DESC
    """).fetchall()

    result = []
    seen = set()
    for conv in conversations:
        key = (conv["contact_id"], conv["user_id"])
        if key in seen:
            continue
        seen.add(key)
        result.append(dict(conv))

    conn.close()
    return jsonify({
        "contacts": rows_to_list(contacts),
        "conversations": result,
    }), 200


@app.route("/api/admin/chats/messages", methods=["GET"])
def admin_chat_messages():
    conversation_id = request.args.get("conversation_id")
    if not conversation_id:
        return jsonify({"error": "conversation_id required"}), 400
    conn = get_chats_db()
    rows = conn.execute(
        "SELECT * FROM messages WHERE conversation_id=? ORDER BY created_at ASC",
        (conversation_id,),
    ).fetchall()
    conn.close()
    return jsonify(rows_to_list(rows)), 200


@app.route("/api/admin/chats/send", methods=["POST"])
def admin_chat_send():
    data = request.json
    if not data:
        return jsonify({"error": "Request body required"}), 400
    conversation_id = data.get("conversation_id")
    content = data.get("content")
    if not all([conversation_id, content]):
        return jsonify({"error": "conversation_id and content required"}), 400
    conn = get_chats_db()
    cur = conn.execute(
        "INSERT INTO messages (conversation_id, sender_id, sender_type, content) VALUES (?, ?, 'staff', ?)",
        (conversation_id, data.get("sender_id", 0), content),
    )
    msg_id = cur.lastrowid
    now_val = now()
    conn.execute(
        "UPDATE conversations SET last_message=?, last_time=? WHERE id=?",
        (content, now_val, conversation_id),
    )
    conn.commit()
    msg = conn.execute("SELECT * FROM messages WHERE id=?", (msg_id,)).fetchone()
    conn.close()
    return jsonify(dict_from_row(msg)), 201


# ───────────────────────── Feedback ──────────────────────

@app.route("/api/feedback", methods=["POST"])
def submit_feedback():
    data = request.json
    if not data:
        return jsonify({"error": "Request body required"}), 400
    conn = get_db()
    conn.execute(
        "INSERT INTO feedback (user_id, category, message, contact) VALUES (?, ?, ?, ?)",
        (data.get("user_id"), data.get("category"), data.get("message"), data.get("contact", "")),
    )
    conn.commit(); conn.close()
    return jsonify({"success": True}), 201


# ───────────────────────── Providers ──────────────────────

@app.route("/api/providers/login", methods=["POST"])
def provider_login():
    data = request.json
    if not data:
        return jsonify({"error": "Request body required"}), 400
    email = data.get("email")
    password = data.get("password")
    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400
    conn = get_db()
    provider = conn.execute(
        "SELECT * FROM providers WHERE email=? AND password=?", (email, password)
    ).fetchone()
    conn.close()
    if provider:
        return jsonify(dict_from_row(provider)), 200
    return jsonify({"error": "Invalid credentials"}), 401


@app.route("/api/providers/patient/<patient_id>", methods=["GET"])
def provider_patient_lookup(patient_id):
    conn = get_db()
    user = conn.execute("SELECT * FROM users WHERE patient_id=? OR id=?", (patient_id, patient_id)).fetchone()
    if not user:
        conn.close()
        return jsonify({"error": "Patient not found"}), 404
    user_dict = dict(user)
    uid = user_dict["id"]
    user_dict["screenings"] = rows_to_list(conn.execute(
        "SELECT * FROM screenings WHERE profile_id=? ORDER BY created_at DESC", (uid,)
    ).fetchall())
    user_dict["vaccines"] = rows_to_list(conn.execute(
        "SELECT * FROM vaccines WHERE user_id=? ORDER BY date DESC", (uid,)
    ).fetchall())
    user_dict["appointments"] = rows_to_list(conn.execute(
        "SELECT * FROM appointments WHERE user_id=? ORDER BY date DESC", (uid,)
    ).fetchall())
    user_dict["test_results"] = rows_to_list(conn.execute(
        "SELECT * FROM test_results WHERE user_id=? ORDER BY created_at DESC", (uid,)
    ).fetchall())
    user_dict["lab_results"] = rows_to_list(conn.execute(
        "SELECT * FROM lab_results WHERE user_id=? ORDER BY created_at DESC", (uid,)
    ).fetchall())
    conn.close()
    return jsonify(user_dict), 200


@app.route("/api/providers/notification/send", methods=["POST"])
def provider_send_notification():
    data = request.json
    if not data:
        return jsonify({"error": "Request body required"}), 400
    user_id = data.get("user_id")
    title = data.get("title")
    message = data.get("message")
    if not all([user_id, title, message]):
        return jsonify({"error": "user_id, title, and message are required"}), 400
    conn = get_db()
    cur = conn.execute(
        "INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)",
        (user_id, title, message, "provider"),
    )
    conn.commit()
    notif = conn.execute("SELECT * FROM notifications WHERE id=?", (cur.lastrowid,)).fetchone()
    conn.close()
    return jsonify(dict_from_row(notif)), 201


@app.route("/api/providers/messages/send", methods=["POST"])
def provider_send_message():
    data = request.json
    if not data:
        return jsonify({"error": "Request body required"}), 400
    user_id = data.get("user_id")
    sender = data.get("sender", "Provider")
    message = data.get("message")
    if not all([user_id, message]):
        return jsonify({"error": "user_id and message are required"}), 400
    conn = get_db()
    cur = conn.execute(
        "INSERT INTO messages (user_id, sender, message) VALUES (?, ?, ?)",
        (user_id, sender, message),
    )
    conn.commit()
    msg = conn.execute("SELECT * FROM messages WHERE id=?", (cur.lastrowid,)).fetchone()
    conn.close()
    return jsonify(dict_from_row(msg)), 201


@app.route("/api/providers/patients", methods=["GET"])
def provider_patients():
    search = request.args.get("search", "")
    conn = get_db()
    if search:
        pattern = f"%{search}%"
        rows = conn.execute(
            "SELECT * FROM users WHERE role='patient' AND (name LIKE ? OR email LIKE ? OR patient_id LIKE ?) ORDER BY created_at DESC",
            (pattern, pattern, pattern),
        ).fetchall()
    else:
        rows = conn.execute(
            "SELECT * FROM users WHERE role='patient' ORDER BY created_at DESC"
        ).fetchall()
    conn.close()
    return jsonify(rows_to_list(rows)), 200


# ───────────────────────── Scheduled Actions ──────────────

@app.route("/api/providers/patient/<int:patient_id>/schedule", methods=["POST"])
def provider_schedule_action(patient_id):
    data = request.json
    if not data:
        return jsonify({"error": "Request body required"}), 400
    action_type = data.get("action_type", "screening")
    scheduled_date = data.get("date")
    notes = data.get("notes", "")
    if not scheduled_date:
        return jsonify({"error": "Date is required"}), 400
    conn = get_db()
    cur = conn.execute(
        "INSERT INTO scheduled_actions (user_id, type, title, scheduled_date, notes) VALUES (?, ?, ?, ?, ?)",
        (patient_id, action_type, f"{action_type.capitalize()} - Patient #{patient_id}", scheduled_date, notes),
    )
    conn.commit()
    conn.close()
    return jsonify({"success": True, "id": cur.lastrowid}), 201


@app.route("/api/scheduled-actions", methods=["POST"])
def create_scheduled_action():
    data = request.json
    if not data:
        return jsonify({"error": "Request body required"}), 400
    user_id = data.get("user_id")
    action_type = data.get("type")
    scheduled_date = data.get("scheduled_date")
    if not all([user_id, action_type, scheduled_date]):
        return jsonify({"error": "user_id, type, and scheduled_date are required"}), 400
    conn = get_db()
    cur = conn.execute(
        "INSERT INTO scheduled_actions (user_id, type, title, scheduled_date, notes) VALUES (?, ?, ?, ?, ?)",
        (user_id, action_type, data.get("title"), scheduled_date, data.get("notes")),
    )
    conn.commit()
    action = conn.execute("SELECT * FROM scheduled_actions WHERE id=?", (cur.lastrowid,)).fetchone()
    conn.close()
    return jsonify(dict_from_row(action)), 201


@app.route("/api/scheduled-actions", methods=["GET"])
def get_scheduled_actions():
    user_id = request.args.get("user_id")
    if not user_id:
        return jsonify({"error": "user_id query parameter required"}), 400
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM scheduled_actions WHERE user_id=? ORDER BY scheduled_date ASC", (user_id,)
    ).fetchall()
    conn.close()
    return jsonify(rows_to_list(rows)), 200


# ───────────────────────── Consent Log ────────────────────

@app.route("/api/consent/<int:user_id>", methods=["GET"])
def get_consent_log(user_id):
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM consent_log WHERE user_id=? ORDER BY accepted_at DESC", (user_id,)
    ).fetchall()
    conn.close()
    return jsonify(rows_to_list(rows)), 200


# ───────────────────────── Admin Sync ─────────────────────

@app.route("/api/admin/sync", methods=["GET"])
def admin_sync():
    conn = get_db()
    users = conn.execute("SELECT * FROM users ORDER BY created_at DESC").fetchall()
    total_users = len(users)
    total_screenings = conn.execute("SELECT COUNT(*) FROM screenings").fetchone()[0]
    total_vaccines = conn.execute("SELECT COUNT(*) FROM vaccines").fetchone()[0]
    conn.close()
    return jsonify({
        "users": rows_to_list(users),
        "stats": {
            "total_users": total_users,
            "total_screenings": total_screenings,
            "total_vaccines": total_vaccines,
        },
    }), 200


# ───────────────────────── Register Provider ──────────────

@app.route("/api/auth/register-provider", methods=["POST"])
def register_provider():
    data = request.json
    if not data:
        return jsonify({"error": "Request body required"}), 400
    name = data.get("name")
    email = data.get("email")
    password = data.get("password")
    if not all([name, email, password]):
        return jsonify({"error": "name, email, and password are required"}), 400
    conn = get_db()
    try:
        cur = conn.execute(
            "INSERT INTO providers (name, email, phone, password, role, specialty, hospital, license_number) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (name, email, data.get("phone"), password, data.get("role", "doctor"), data.get("specialty"), data.get("hospital"), data.get("license_number")),
        )
        conn.commit()
        provider_id = cur.lastrowid
        provider = conn.execute("SELECT * FROM providers WHERE id=?", (provider_id,)).fetchone()
        return jsonify(dict_from_row(provider)), 201
    except sqlite3.IntegrityError:
        return jsonify({"error": "Email already exists"}), 409
    finally:
        conn.close()


# ───────────────────────── Start ─────────────────────────

if __name__ == "__main__":
    run_db_migration()
    init_chats_db()
    app.run(host="0.0.0.0", port=5000, debug=False)
