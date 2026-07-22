import os
import random
from datetime import datetime, timedelta
from functools import wraps

import requests
from flask import (Flask, flash, jsonify, redirect, render_template, request,
                   session, url_for)

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'cervitrack-dev-secret-key-2024')
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=7)
API_BASE = 'http://127.0.0.1:5000/api'
MOCK_CONVERSATIONS = []
FALLBACK_CONVERSATIONS_USED = False

MOCK_USERS = [
    {'id': 1, 'name': 'Amina Mwangi', 'email': 'amina@example.com', 'phone': '+254712345678', 'role': 'patient', 'photo': '', 'birthDate': '1990-03-15', 'lastHealedDate': '2025-12-01', 'risk': 'HIGH'},
    {'id': 2, 'name': 'Grace Otieno', 'email': 'grace@example.com', 'phone': '+254723456789', 'role': 'patient', 'photo': '', 'birthDate': '1985-07-22', 'lastHealedDate': '2026-01-10', 'risk': 'LOW'},
    {'id': 3, 'name': 'Dr. Peter Ochieng', 'email': 'ochieng@example.com', 'phone': '+254734567890', 'role': 'nurse', 'photo': '', 'birthDate': '1978-11-02', 'lastHealedDate': '', 'risk': 'LOW'},
    {'id': 4, 'name': 'Sarah Wanjiku', 'email': 'swanjiku@example.com', 'phone': '+254745678901', 'role': 'patient', 'photo': '', 'birthDate': '1995-09-10', 'lastHealedDate': '2025-08-20', 'risk': 'HIGH'},
    {'id': 5, 'name': 'Mary Akinyi', 'email': 'makinyi@example.com', 'phone': '+254756789012', 'role': 'patient', 'photo': '', 'birthDate': '2000-01-05', 'lastHealedDate': '', 'risk': 'LOW'},
    {'id': 6, 'name': 'Dr. James Kariuki', 'email': 'jkariuki@example.com', 'phone': '+254767890123', 'role': 'admin', 'photo': '', 'birthDate': '1972-05-18', 'lastHealedDate': '', 'risk': 'LOW'},
    {'id': 7, 'name': 'Faith Nyambura', 'email': 'fnyambura@example.com', 'phone': '+254778901234', 'role': 'patient', 'photo': '', 'birthDate': '1988-12-30', 'lastHealedDate': '2026-02-14', 'risk': 'HIGH'},
    {'id': 8, 'name': 'Esther Chebet', 'email': 'echebet@example.com', 'phone': '+254789012345', 'role': 'patient', 'photo': '', 'birthDate': '1992-06-25', 'lastHealedDate': '2026-03-01', 'risk': 'LOW'},
]

MOCK_SCREENINGS = []
for i in range(30):
    user = random.choice(MOCK_USERS)
    days_ago = random.randint(0, 60)
    date = (datetime.now() - timedelta(days=days_ago)).strftime('%Y-%m-%d')
    verdict = random.choice(['POSITIVE', 'NEGATIVE', 'POSITIVE', 'NEGATIVE', 'NEGATIVE'])
    risk = 'HIGH' if verdict == 'POSITIVE' else 'LOW'
    MOCK_SCREENINGS.append({
        'id': i + 1,
        'profile_id': user['id'],
        'user_name': user['name'],
        'verdict': verdict,
        'risk_tier': risk,
        'date': date,
    })
MOCK_SCREENINGS.sort(key=lambda x: x['date'], reverse=True)

MOCK_VACCINES = [
    {'id': 1, 'user_id': 1, 'user_name': 'Amina Mwangi', 'name': 'HPV Dose 1', 'hospital': 'Kenyatta National Hospital', 'date': '2026-01-15', 'status': 'done'},
    {'id': 2, 'user_id': 1, 'user_name': 'Amina Mwangi', 'name': 'HPV Dose 2', 'hospital': 'Kenyatta National Hospital', 'date': '2026-07-10', 'status': 'upcoming'},
    {'id': 3, 'user_id': 2, 'user_name': 'Grace Otieno', 'name': 'HPV Dose 1', 'hospital': 'Moi Teaching Hospital', 'date': '2025-11-20', 'status': 'done'},
    {'id': 4, 'user_id': 4, 'user_name': 'Sarah Wanjiku', 'name': 'HPV Dose 1', 'hospital': 'Coast General Hospital', 'date': '2026-03-05', 'status': 'done'},
    {'id': 5, 'user_id': 4, 'user_name': 'Sarah Wanjiku', 'name': 'HPV Dose 2', 'hospital': 'Coast General Hospital', 'date': '2026-09-01', 'status': 'upcoming'},
    {'id': 6, 'user_id': 7, 'user_name': 'Faith Nyambura', 'name': 'HPV Dose 1', 'hospital': 'Kenyatta National Hospital', 'date': '2026-02-28', 'status': 'done'},
    {'id': 7, 'user_id': 5, 'user_name': 'Mary Akinyi', 'name': 'HPV Dose 1', 'hospital': 'Nairobi Hospital', 'date': '2026-08-15', 'status': 'upcoming'},
]

MOCK_REPORTS = [
    {'id': 1, 'user_id': 1, 'user_name': 'Amina Mwangi', 'type': 'Full Screening Report', 'date': '2026-03-10'},
    {'id': 2, 'user_id': 2, 'user_name': 'Grace Otieno', 'type': 'Annual Checkup', 'date': '2026-02-22'},
    {'id': 3, 'user_id': 4, 'user_name': 'Sarah Wanjiku', 'type': 'HPV Risk Assessment', 'date': '2026-03-01'},
    {'id': 4, 'user_id': 7, 'user_name': 'Faith Nyambura', 'type': 'Full Screening Report', 'date': '2026-03-15'},
    {'id': 5, 'user_id': 1, 'user_name': 'Amina Mwangi', 'type': 'Vaccination Record', 'date': '2026-01-20'},
]

MOCK_NOTIFICATIONS = [
    {'id': 1, 'user_id': 1, 'user_name': 'Amina Mwangi', 'title': 'Screening Reminder', 'message': 'Your annual screening is due next week.', 'date': '2026-03-20', 'status': 'sent'},
    {'id': 2, 'user_id': 4, 'user_name': 'Sarah Wanjiku', 'title': 'HPV Vaccine Due', 'message': 'Your HPV Dose 2 is scheduled for September 1st.', 'date': '2026-03-18', 'status': 'sent'},
    {'id': 3, 'user_id': 7, 'user_name': 'Faith Nyambura', 'title': 'Follow-up Required', 'message': 'Please schedule a follow-up screening at your earliest convenience.', 'date': '2026-03-15', 'status': 'sent'},
    {'id': 4, 'user_id': 2, 'user_name': 'Grace Otieno', 'title': 'Results Ready', 'message': 'Your screening results are now available in the app.', 'date': '2026-03-12', 'status': 'delivered'},
    {'id': 5, 'user_id': 5, 'user_name': 'Mary Akinyi', 'title': 'Welcome to CerviTrack', 'message': 'Thank you for joining CerviTrack. Start your first screening today.', 'date': '2026-03-10', 'status': 'sent'},
]

MOCK_APPOINTMENTS = [
    {'id': 1, 'user_id': 1, 'user_name': 'Amina Mwangi', 'title': 'HPV Screening Follow-up', 'facility': 'Kenyatta National Hospital', 'date': '2026-04-15', 'notes': 'Bring previous screening results', 'status': 'upcoming'},
    {'id': 2, 'user_id': 2, 'user_name': 'Grace Otieno', 'title': 'Annual Checkup', 'facility': 'Nairobi Women\'s Hospital', 'date': '2026-03-28', 'notes': '', 'status': 'upcoming'},
    {'id': 3, 'user_id': 4, 'user_name': 'Sarah Wanjiku', 'title': 'Colposcopy', 'facility': 'Aga Khan University Hospital', 'date': '2026-03-10', 'notes': 'Post-HPV positive follow-up', 'status': 'completed'},
    {'id': 4, 'user_id': 7, 'user_name': 'Faith Nyambura', 'title': 'Vaccination Appointment', 'facility': 'M.P. Shah Hospital', 'date': '2026-04-02', 'notes': 'HPV Dose 2', 'status': 'upcoming'},
    {'id': 5, 'user_id': 1, 'user_name': 'Amina Mwangi', 'title': 'Consultation', 'facility': 'The Nairobi Hospital', 'date': '2026-02-20', 'notes': 'Follow-up on treatment plan', 'status': 'completed'},
    {'id': 6, 'user_id': 5, 'user_name': 'Mary Akinyi', 'title': 'Initial Screening', 'facility': 'Mater Hospital', 'date': '2026-03-05', 'notes': '', 'status': 'cancelled'},
]

MOCK_TEST_RESULTS = [
    {'id': 1, 'user_id': 1, 'user_name': 'Amina Mwangi', 'result': 'negative', 'date': '2026-03-20', 'submitted': True},
    {'id': 2, 'user_id': 4, 'user_name': 'Sarah Wanjiku', 'result': 'positive', 'date': '2026-03-18', 'submitted': False},
    {'id': 3, 'user_id': 7, 'user_name': 'Faith Nyambura', 'result': 'invalid', 'date': '2026-03-15', 'submitted': False},
    {'id': 4, 'user_id': 2, 'user_name': 'Grace Otieno', 'result': 'negative', 'date': '2026-03-12', 'submitted': True},
]

MOCK_LAB_RESULTS = [
    {'id': 1, 'user_id': 1, 'user_name': 'Amina Mwangi', 'patient_name': 'Amina Mwangi', 'result': 'HPV Positive (High Risk)', 'notes': 'Refer for colposcopy', 'date': '2026-03-15'},
    {'id': 2, 'user_id': 2, 'user_name': 'Grace Otieno', 'patient_name': 'Grace Otieno', 'result': 'Negative', 'notes': 'Routine screening, no abnormalities', 'date': '2026-02-22'},
    {'id': 3, 'user_id': 4, 'user_name': 'Sarah Wanjiku', 'patient_name': 'Sarah Wanjiku', 'result': 'HPV Positive (Low Risk)', 'notes': 'Repeat screening in 12 months', 'date': '2026-03-01'},
    {'id': 4, 'user_id': 7, 'user_name': 'Faith Nyambura', 'patient_name': 'Faith Nyambura', 'result': 'Positive', 'notes': 'Abnormal cells detected, follow-up required', 'date': '2026-03-15'},
    {'id': 5, 'user_id': 1, 'user_name': 'Amina Mwangi', 'patient_name': 'Amina Mwangi', 'result': 'Normal', 'notes': 'Post-treatment follow-up, clear', 'date': '2026-01-20'},
]

MOCK_FOLLOWUPS = [
    {'id': 1, 'user_id': 1, 'user_name': 'Amina Mwangi', 'screening_id': 1, 'completed': 1, 'completed_at': '2026-03-20 10:30:00', 'notes': 'Follow-up completed, patient stable'},
    {'id': 2, 'user_id': 4, 'user_name': 'Sarah Wanjiku', 'screening_id': 3, 'completed': 0, 'completed_at': None, 'notes': ''},
    {'id': 3, 'user_id': 7, 'user_name': 'Faith Nyambura', 'screening_id': 4, 'completed': 0, 'completed_at': None, 'notes': ''},
    {'id': 4, 'user_id': 2, 'user_name': 'Grace Otieno', 'screening_id': 2, 'completed': 1, 'completed_at': '2026-03-01 14:00:00', 'notes': 'All clear, next screening in 3 years'},
    {'id': 5, 'user_id': 5, 'user_name': 'Mary Akinyi', 'screening_id': 5, 'completed': 0, 'completed_at': None, 'notes': ''},
]


def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if 'admin_logged_in' not in session:
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated


def provider_login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if 'provider_logged_in' not in session and 'admin_logged_in' not in session:
            return redirect(url_for('provider_login'))
        return f(*args, **kwargs)
    return decorated


def fetch_api_stats():
    try:
        resp = requests.get(f'{API_BASE}/dashboard/stats', timeout=5)
        if resp.ok:
            return resp.json()
    except requests.RequestException:
        pass
    return None


@app.route('/')
def index():
    if 'admin_logged_in' in session:
        return redirect(url_for('dashboard'))
    return redirect(url_for('login'))


@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form.get('email', '')
        password = request.form.get('password', '')
        if email == 'admin@cervitrack.com' and password == 'admin123':
            session.permanent = True
            session['admin_logged_in'] = True
            session['admin_name'] = 'Admin'
            return redirect(url_for('dashboard'))
        return render_template('login.html', error='Invalid credentials')
    return render_template('login.html')


@app.route('/statistics')
@login_required
def statistics():
    import json as _json
    stats_data = {}
    try:
        resp = requests.get(f'{API_BASE}/admin/stats', timeout=5)
        if resp.ok:
            stats_data = resp.json()
    except requests.RequestException:
        pass

    chart_data = {}

    counties = stats_data.get('counties', [])
    chart_data['countyLabels'] = [c['county'] for c in counties]
    chart_data['countyPositive'] = [c['positive_cases'] for c in counties]
    chart_data['countyScreenings'] = [c['total_screenings'] for c in counties]

    age = stats_data.get('ageGroups', [])
    chart_data['ageLabels'] = [a['age_group'] for a in age]
    chart_data['ageTotal'] = [a['total'] for a in age]
    chart_data['agePositive'] = [a['positive'] for a in age]

    v = stats_data.get('verdicts', [])
    chart_data['verdictLabels'] = [x['verdict'] for x in v]
    chart_data['verdictCounts'] = [x['count'] for x in v]

    r = stats_data.get('riskTiers', [])
    chart_data['riskLabels'] = [x['risk_tier'] for x in r]
    chart_data['riskCounts'] = [x['count'] for x in r]

    g = stats_data.get('genderDistribution', [])
    chart_data['genderLabels'] = [x['gender'] for x in g]
    chart_data['genderCounts'] = [x['count'] for x in g]

    m = stats_data.get('monthlyTrends', [])
    chart_data['monthLabels'] = [x['month'] for x in m]
    chart_data['monthTotal'] = [x['total'] for x in m]
    chart_data['monthPositive'] = [x['positive'] for x in m]

    vc = stats_data.get('vaccineCoverage', [])[:12]
    chart_data['vaccineCountyLabels'] = [x['county'] for x in vc]
    chart_data['vaccineCounts'] = [x['total_vaccines'] for x in vc]

    return render_template('statistics.html', stats=stats_data, chart=_json.dumps(chart_data))


@app.route('/dashboard')
@login_required
def dashboard():
    api_stats = fetch_api_stats()
    total_users = len(MOCK_USERS)
    screenings_today = len([s for s in MOCK_SCREENINGS if s['date'] == datetime.now().strftime('%Y-%m-%d')])
    if api_stats:
        total_users = api_stats.get('registered', total_users)
        screenings_today = api_stats.get('screenings', screenings_today)

    at_risk_count = len([u for u in MOCK_USERS if u['risk'] == 'HIGH'])
    hpv_positive = len([s for s in MOCK_SCREENINGS if s['verdict'] == 'POSITIVE'])
    followups_completed = len([f for f in MOCK_FOLLOWUPS if f['completed']])

    if api_stats:
        hpv_positive = api_stats.get('hpvPositive', hpv_positive)
        followups_completed = api_stats.get('followupsCompleted', followups_completed)

    risk_distribution = {'high': 0, 'moderate': 0, 'low': 0}
    for u in MOCK_USERS:
        if u['risk'] == 'HIGH':
            risk_distribution['high'] += 1
        else:
            risk_distribution['low'] += 1

    recent_screenings = MOCK_SCREENINGS[:10]

    return render_template('dashboard.html',
                           total_users=total_users,
                           screenings_today=screenings_today,
                           at_risk_count=at_risk_count,
                           hpv_positive=hpv_positive,
                           followups_completed=followups_completed,
                           risk_distribution=risk_distribution,
                           recent_screenings=recent_screenings)


def _normalize_users(raw_users):
    now = datetime.now()
    out = []
    for u in (raw_users or []):
        if not isinstance(u, dict):
            continue
        risk = (u.get('risk_index') or u.get('risk_tier') or u.get('risk') or 'LOW').upper()
        last_screening = u.get('last_screening_date') or 'Never'
        if u.get('latest_screening') and isinstance(u['latest_screening'], dict):
            last_screening = u['latest_screening'].get('created_at', last_screening)
            if last_screening:
                last_screening = last_screening[:10]
        last_healed = u.get('last_healed_date') or u.get('lastHealedDate')
        hpv_free_days = None
        if last_healed:
            try:
                start = datetime.strptime(last_healed, '%Y-%m-%d')
                hpv_free_days = (now - start).days
            except (ValueError, TypeError):
                pass
        out.append({
            'id': u.get('id'),
            'name': u.get('name', 'Unknown'),
            'email': u.get('email', ''),
            'phone': u.get('phone', ''),
            'role': u.get('role', 'patient'),
            'risk': risk,
            'gender': u.get('gender', ''),
            'county': u.get('county', ''),
            'birth_date': u.get('birth_date', ''),
            'last_screening': last_screening[:10] if last_screening and last_screening != 'Never' else 'Never',
            'lastHealedDate': last_healed,
            'hpv_free_days': hpv_free_days,
            'patient_id': u.get('patient_id', ''),
            'total_screenings': u.get('total_screenings', 0),
            'total_vaccines': u.get('total_vaccines', 0),
        })
    return out


def _get_users_list():
    users = _fetch_users()
    if users is None:
        users = _normalize_users(MOCK_USERS)
    return users


def _fetch_users(endpoint=''):
    try:
        url = f'{API_BASE}/admin/users'
        if endpoint:
            url = f'{API_BASE}/admin/users/{endpoint}'
        resp = requests.get(url, timeout=5)
        if resp.ok:
            return _normalize_users(resp.json())
    except requests.RequestException:
        pass
    return None


@app.route('/users')
@login_required
def users():
    search = request.args.get('search', '').lower()
    role_filter = request.args.get('role', '')
    risk_filter = request.args.get('risk', '')
    sort_by = request.args.get('sort', 'name')
    sort_dir = request.args.get('dir', 'asc')

    user_list = _fetch_users()
    if user_list is None:
        user_list = _normalize_users(MOCK_USERS)

    if search:
        user_list = [u for u in user_list if search in u['name'].lower() or search in u['email'].lower()]
    if role_filter:
        user_list = [u for u in user_list if u['role'] == role_filter]
    if risk_filter:
        user_list = [u for u in user_list if u['risk'] == risk_filter]

    reverse = sort_dir == 'desc'
    sort_keys = {
        'name': lambda u: u['name'].lower(),
        'email': lambda u: u['email'].lower(),
        'role': lambda u: u['role'],
        'risk': lambda u: u['risk'],
        'last_screening': lambda u: u['last_screening'] if u['last_screening'] != 'Never' else '',
    }
    key = sort_keys.get(sort_by, sort_keys['name'])
    user_list.sort(key=key, reverse=reverse)

    return render_template('users.html', users=user_list, sort_by=sort_by, sort_dir=sort_dir)


@app.route('/users/at-risk')
@login_required
def users_at_risk():
    user_list = _fetch_users('at-risk')
    if user_list is None:
        user_list = _normalize_users([u for u in MOCK_USERS if u.get('risk') == 'HIGH'])
    return render_template('users.html', users=user_list, filter_label='At-Risk')


@app.route('/users/healthy')
@login_required
def users_healthy():
    user_list = _fetch_users('healthy')
    if user_list is None:
        user_list = _normalize_users([u for u in MOCK_USERS if u.get('risk') == 'LOW'])
    return render_template('users.html', users=user_list, filter_label='Healthy')


def find_user(uid):
    try:
        uid_int = int(uid)
    except (ValueError, TypeError):
        uid_int = None
    users_list = _get_users_list()
    if uid_int:
        match = next((u for u in users_list if u.get('id') == uid_int), None)
        if match:
            return match
    return next((u for u in users_list if str(u.get('id', '')) == str(uid)), None)

@app.route('/user/<user_id>')
@login_required
def user_detail(user_id):
    user = find_user(user_id)
    if not user:
        return redirect(url_for('users'))

    now = datetime.now()
    if user['lastHealedDate']:
        start = datetime.strptime(user['lastHealedDate'], '%Y-%m-%d')
        user['hpv_free_days'] = (now - start).days
    else:
        user['hpv_free_days'] = None

    screenings = [s for s in MOCK_SCREENINGS if s['profile_id'] == user_id]
    vaccines = [v for v in MOCK_VACCINES if v['user_id'] == user_id]
    appointments = [a for a in MOCK_APPOINTMENTS if a['user_id'] == user_id]
    lab_results = [l for l in MOCK_LAB_RESULTS if l['user_id'] == user_id]
    followups = [f for f in MOCK_FOLLOWUPS if f['user_id'] == user_id]

    return render_template('user_detail.html', user=user, screenings=screenings, vaccines=vaccines,
                           appointments=appointments, lab_results=lab_results, followups=followups)


@app.route('/user/<user_id>/notify', methods=['POST'])
@login_required
def user_notify(user_id):
    user = find_user(user_id)
    if not user:
        return redirect(url_for('users'))
    user_id = user['id']

    title = request.form.get('title', 'Notification')
    message = request.form.get('message', '')

    try:
        resp = requests.post(f'{API_BASE}/admin/notification/send', json={
            'user_id': user_id, 'title': title, 'message': message
        }, timeout=5)
    except requests.RequestException:
        pass

    new_id = len(MOCK_NOTIFICATIONS) + 1
    MOCK_NOTIFICATIONS.insert(0, {
        'id': new_id,
        'user_id': user_id,
        'user_name': user['name'],
        'title': title,
        'message': message,
        'date': datetime.now().strftime('%Y-%m-%d'),
        'status': 'sent',
    })

    flash(f'Notification sent to {user["name"]}: "{title}"', 'success')
    return redirect(url_for('user_detail', user_id=user_id))


@app.route('/user/<user_id>/report')
@login_required
def user_report(user_id):
    user = find_user(user_id)
    if not user:
        return redirect(url_for('users'))
    user_id = user['id']

    try:
        resp = requests.get(f'{API_BASE}/admin/report/{user_id}', timeout=5)
        if resp.ok:
            data = resp.json()
    except requests.RequestException:
        pass

    new_id = len(MOCK_REPORTS) + 1
    report = {
        'id': new_id,
        'user_id': user_id,
        'user_name': user['name'],
        'type': 'Full Screening Report',
        'date': datetime.now().strftime('%Y-%m-%d'),
    }
    MOCK_REPORTS.insert(0, report)

    user_screenings = [s for s in MOCK_SCREENINGS if s['profile_id'] == user_id]
    user_vaccines = [v for v in MOCK_VACCINES if v['user_id'] == user_id]
    now = datetime.now()
    hpv_free_days = None
    if user['lastHealedDate']:
        start = datetime.strptime(user['lastHealedDate'], '%Y-%m-%d')
        hpv_free_days = (now - start).days

    return render_template('report.html', user=user, report=report,
                           screenings=user_screenings, vaccines=user_vaccines,
                           hpv_free_days=hpv_free_days)


@app.route('/reports')
@login_required
def reports():
    reports_list = MOCK_REPORTS
    user_id_filter = request.args.get('user_id', '')
    if user_id_filter:
        try:
            uid = int(user_id_filter)
            reports_list = [r for r in reports_list if r['user_id'] == uid]
        except ValueError:
            pass
    return render_template('reports.html', reports=reports_list, users=_get_users_list())


@app.route('/vaccines')
@login_required
def vaccines():
    return render_template('vaccines.html', vaccines=MOCK_VACCINES, users=_get_users_list())


@app.route('/vaccines/add', methods=['POST'])
@login_required
def vaccine_add():
    user_id = request.form.get('user_id', '')
    name = request.form.get('name', '')
    hospital = request.form.get('hospital', '')
    date = request.form.get('date', '')

    if user_id and name and date:
        try:
            uid = int(user_id)
            user = next((u for u in MOCK_USERS if u['id'] == uid), None)
            if user:
                new_id = len(MOCK_VACCINES) + 1
                MOCK_VACCINES.append({
                    'id': new_id,
                    'user_id': uid,
                    'user_name': user['name'],
                    'name': name,
                    'hospital': hospital,
                    'date': date,
                    'status': 'upcoming',
                })
        except ValueError:
            pass
    return redirect(url_for('vaccines'))


@app.route('/notifications')
@login_required
def notifications():
    return render_template('notifications.html', notifications=MOCK_NOTIFICATIONS, users=_get_users_list())


@app.route('/appointments')
@login_required
def appointments():
    status_filter = request.args.get('status', '')
    search_query = request.args.get('search', '').lower()
    sort_by = request.args.get('sort', 'date')
    sort_dir = request.args.get('dir', 'desc')

    appt_list = MOCK_APPOINTMENTS
    if status_filter:
        appt_list = [a for a in appt_list if a['status'] == status_filter]
    if search_query:
        appt_list = [a for a in appt_list if search_query in a['user_name'].lower() or search_query in a['title'].lower() or search_query in (a.get('notes','') or '').lower()]

    reverse = sort_dir == 'desc'
    sort_keys = {
        'id': lambda a: a['id'],
        'patient': lambda a: a['user_name'].lower(),
        'title': lambda a: a['title'].lower(),
        'facility': lambda a: (a.get('facility') or '').lower(),
        'date': lambda a: a['date'],
        'status': lambda a: a['status'],
    }
    key = sort_keys.get(sort_by, sort_keys['date'])
    appt_list.sort(key=key, reverse=reverse)

    users_list = _get_users_list()
    return render_template('appointments.html', appointments=appt_list, users=users_list, sort_by=sort_by, sort_dir=sort_dir)


@app.route('/appointments/create', methods=['POST'])
@login_required
def appointment_create():
    user_id = request.form.get('user_id', '')
    title = request.form.get('title', '')
    facility = request.form.get('facility', '')
    date = request.form.get('date', '')
    notes = request.form.get('notes', '')

    if user_id and title and date:
        try:
            uid = int(user_id)
            user = find_user(uid)
            if user:
                new_id = len(MOCK_APPOINTMENTS) + 1
                MOCK_APPOINTMENTS.append({
                    'id': new_id,
                    'user_id': uid,
                    'user_name': user['name'],
                    'title': title,
                    'facility': facility,
                    'date': date,
                    'notes': notes,
                    'status': 'upcoming',
                })
                flash(f'Appointment created for {user["name"]}: {title}', 'success')
        except ValueError:
            flash('Invalid user ID', 'danger')
    else:
        flash('Please fill in required fields (Patient, Title, Date)', 'danger')
    return redirect(url_for('appointments'))


@app.route('/appointments/<int:appointment_id>/status', methods=['POST'])
@login_required
def appointment_update_status(appointment_id):
    appt = next((a for a in MOCK_APPOINTMENTS if a['id'] == appointment_id), None)
    if not appt:
        flash('Appointment not found', 'danger')
        return redirect(url_for('appointments'))
    new_status = request.form.get('status', '')
    if new_status in ('upcoming', 'completed', 'cancelled'):
        appt['status'] = new_status
        flash(f'Appointment #{appointment_id} marked as {new_status}', 'success')
    return redirect(url_for('appointments'))


@app.route('/lab-results')
@login_required
def lab_results():
    return render_template('lab_results.html', lab_results=MOCK_LAB_RESULTS, users=_get_users_list())


@app.route('/lab-results/add', methods=['POST'])
@login_required
def lab_results_add():
    user_id = request.form.get('user_id', '')
    patient_name = request.form.get('patient_name', '')
    result = request.form.get('result', '')
    notes = request.form.get('notes', '')
    if user_id and patient_name and result:
        try:
            uid = int(user_id)
            new_id = len(MOCK_LAB_RESULTS) + 1
            MOCK_LAB_RESULTS.insert(0, {
                'id': new_id,
                'user_id': uid,
                'user_name': next((u['name'] for u in MOCK_USERS if u['id'] == uid), patient_name),
                'patient_name': patient_name,
                'result': result,
                'notes': notes,
                'date': datetime.now().strftime('%Y-%m-%d'),
            })
            flash('Lab result added successfully', 'success')
        except ValueError:
            flash('Invalid user ID', 'danger')
    return redirect(url_for('lab_results'))


@app.route('/test-results')
@login_required
def test_results():
    return render_template('test_results.html', test_results=MOCK_TEST_RESULTS, users=_get_users_list())


@app.route('/followups')
@login_required
def followups():
    return render_template('followups.html', followups=MOCK_FOLLOWUPS, users=_get_users_list())


@app.route('/followups/<int:followup_id>/toggle', methods=['POST'])
@login_required
def followup_toggle(followup_id):
    fup = next((f for f in MOCK_FOLLOWUPS if f['id'] == followup_id), None)
    if not fup:
        flash('Follow-up not found', 'danger')
        return redirect(url_for('followups'))
    fup['completed'] = 1 if not fup['completed'] else 0
    if fup['completed']:
        fup['completed_at'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    else:
        fup['completed_at'] = None
    flash(f'Follow-up #{followup_id} updated', 'success')
    return redirect(url_for('followups'))


@app.route('/chats')
@login_required
def chats():
    global MOCK_CONVERSATIONS, FALLBACK_CONVERSATIONS_USED
    conv_data = {'conversations': [], 'contacts': []}
    try:
        resp = requests.get(f'{API_BASE}/admin/chats/conversations', timeout=5)
        if resp.ok:
            conv_data = resp.json()
            MOCK_CONVERSATIONS = conv_data.get('conversations', [])
            FALLBACK_CONVERSATIONS_USED = False
    except requests.RequestException:
        pass
    if not conv_data.get('conversations'):
        if not MOCK_CONVERSATIONS:
            MOCK_CONVERSATIONS = [
                {'id': 1, 'user_id': 1, 'user_name': 'Amina Mwangi', 'contact_id': 1, 'contact_name': 'Dr. Sarah Kimani', 'contact_role': 'Gynecologist', 'online': 1, 'last_message': 'Your results are ready', 'last_time': '2026-07-02 09:30:00'},
                {'id': 2, 'user_id': 4, 'user_name': 'Sarah Wanjiku', 'contact_id': 2, 'contact_name': 'Nurse Mercy Wanjiku', 'contact_role': 'HPV Specialist', 'online': 1, 'last_message': 'When is my next screening?', 'last_time': '2026-07-01 14:15:00'},
                {'id': 3, 'user_id': 7, 'user_name': 'Faith Nyambura', 'contact_id': 1, 'contact_name': 'Dr. Sarah Kimani', 'contact_role': 'Gynecologist', 'online': 1, 'last_message': 'I have some questions about my results', 'last_time': '2026-06-30 11:00:00'},
            ]
            FALLBACK_CONVERSATIONS_USED = True
        conv_data = {
            'conversations': MOCK_CONVERSATIONS,
            'contacts': [
                {'id': 1, 'name': 'Dr. Sarah Kimani', 'role': 'Gynecologist', 'online': 1},
                {'id': 2, 'name': 'Nurse Mercy Wanjiku', 'role': 'HPV Specialist', 'online': 1},
            ],
        }
    selected_user_id = request.args.get('user_id', '')
    selected_conv_id = request.args.get('conv_id', '')
    selected_contact_id = request.args.get('contact_id', '')
    selected_user_name = ''
    selected_contact_name = ''
    for conv in (conv_data.get('conversations') or []):
        if str(conv.get('id')) == str(selected_conv_id):
            selected_user_name = conv.get('user_name', '')
            selected_contact_name = conv.get('contact_name', '')
            break
    return render_template('chats.html', **conv_data, users=_get_users_list(),
                           selected_conv_id=selected_conv_id,
                           selected_user_id=selected_user_id,
                           selected_user_name=selected_user_name,
                           selected_contact_id=selected_contact_id,
                           selected_contact_name=selected_contact_name)


@app.route('/chats/start', methods=['POST'])
@login_required
def chat_start():
    user_id = request.form.get('user_id', '')
    contact_id = request.form.get('contact_id', '')
    message = request.form.get('message', '')

    user = find_user(user_id)
    contact = find_user(contact_id)
    if not user or not contact:
        flash('Invalid patient or staff selection', 'danger')
        return redirect(url_for('chats'))

    new_id = len(MOCK_USERS) + 100
    new_conv = {
        'id': new_id,
        'user_id': user['id'],
        'user_name': user['name'],
        'contact_id': contact['id'],
        'contact_name': contact['name'],
        'contact_role': contact.get('role', 'Staff').capitalize(),
        'online': 1,
        'last_message': message or 'Chat started',
        'last_time': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
    }

    try:
        resp = requests.post(f'{API_BASE}/admin/chats/start', json={
            'user_id': user['id'],
            'contact_id': contact['id'],
            'message': message,
        }, timeout=5)
        if resp.ok:
            data = resp.json()
            new_conv['id'] = data.get('id', new_id)
    except requests.RequestException:
        pass

    global MOCK_CONVERSATIONS
    if not MOCK_CONVERSATIONS:
        MOCK_CONVERSATIONS = []
    MOCK_CONVERSATIONS.insert(0, new_conv)

    flash(f'Chat started with {user["name"]}', 'success')
    return redirect(url_for('chats', conv_id=new_conv['id'], user_id=user['id']))


@app.route('/api/chats', methods=['GET'])
@login_required
def api_chats_messages():
    conversation_id = request.args.get('conversation_id')
    if not conversation_id:
        return jsonify([])
    try:
        resp = requests.get(f'{API_BASE}/admin/chats/messages?conversation_id={conversation_id}', timeout=5)
        if resp.ok:
            return jsonify(resp.json())
    except requests.RequestException:
        pass
    return jsonify([
        {'id': 1, 'conversation_id': int(conversation_id), 'sender_type': 'user', 'content': 'Hello doctor, I have a question about my results.', 'created_at': '2026-07-02 09:00:00', 'status': 'read'},
        {'id': 2, 'conversation_id': int(conversation_id), 'sender_type': 'staff', 'content': 'Of course! What would you like to know?', 'created_at': '2026-07-02 09:05:00', 'status': 'read'},
    ])


@app.route('/api/chats/send', methods=['POST'])
@login_required
def api_chats_send():
    data = request.json or {}
    try:
        resp = requests.post(f'{API_BASE}/admin/chats/send', json=data, timeout=5)
        if resp.ok:
            flash('Message sent', 'success')
            return jsonify(resp.json())
    except requests.RequestException:
        pass
    flash('Message sent (offline)', 'success')
    return jsonify({'success': True})


@app.route('/api/appointments')
@login_required
def api_appointments():
    status_filter = request.args.get('status', '')
    appt_list = MOCK_APPOINTMENTS
    if status_filter:
        appt_list = [a for a in appt_list if a['status'] == status_filter]
    return jsonify(appt_list)


@app.route('/api/lab-results')
@login_required
def api_lab_results():
    return jsonify(MOCK_LAB_RESULTS)


@app.route('/api/followups')
@login_required
def api_followups():
    return jsonify(MOCK_FOLLOWUPS)


@app.route('/settings', methods=['GET', 'POST'])
@login_required
def settings():
    if request.method == 'POST':
        lang = request.form.get('language', 'en')
        theme = request.form.get('theme', 'light')
        session['admin_lang'] = lang
        session['admin_theme'] = theme
        flash(f'Settings saved: Language = {lang.upper()}, Theme = {theme.capitalize()}', 'success')
        return redirect(url_for('settings'))
    return render_template('settings.html', admin_lang=session.get('admin_lang', 'en'), admin_theme=session.get('admin_theme', 'light'))


@app.context_processor
def inject_settings():
    return {
        'admin_lang': session.get('admin_lang', 'en'),
        'admin_theme': session.get('admin_theme', 'light'),
        'datetime': datetime,
    }


@app.route('/provider/login', methods=['GET', 'POST'])
def provider_login():
    if request.method == 'POST':
        email = request.form.get('email', '')
        password = request.form.get('password', '')
        try:
            resp = requests.post(f'{API_BASE}/providers/login', json={
                'email': email, 'password': password
            }, timeout=5)
            if resp.ok:
                data = resp.json()
                session.permanent = True
                session['provider_logged_in'] = True
                session['provider_name'] = data.get('name', 'Provider')
                session['provider_id'] = data.get('id', data.get('provider_id', 0))
                return redirect(url_for('provider_dashboard'))
        except requests.RequestException:
            pass
        return render_template('provider_login.html', error='Invalid credentials or server unavailable')
    return render_template('provider_login.html')


@app.route('/provider/logout')
def provider_logout():
    session.pop('provider_logged_in', None)
    session.pop('provider_name', None)
    session.pop('provider_id', None)
    return redirect(url_for('provider_login'))


@app.route('/provider/dashboard')
@provider_login_required
def provider_dashboard():
    search = request.args.get('search', '')
    location = request.args.get('location', '')
    risk = request.args.get('risk', '')
    patients = []
    try:
        params = {}
        if search:
            params['search'] = search
        if location:
            params['location'] = location
        if risk:
            params['risk'] = risk
        resp = requests.get(f'{API_BASE}/providers/patients', params=params, timeout=5)
        if resp.ok:
            patients = resp.json()
    except requests.RequestException:
        pass

    if not isinstance(patients, list):
        patients = []
    if location and patients:
        patients = [p for p in patients if location.lower() in (p.get('county') or p.get('location') or '').lower()]
    if risk and patients:
        patients = [p for p in patients if risk.upper() in (p.get('risk') or p.get('risk_tier') or p.get('risk_index') or '').upper()]

    return render_template('provider_dashboard.html', patients=patients,
                           provider_name=session.get('provider_name', 'Provider'))


@app.route('/provider/patient/<patient_id>')
@provider_login_required
def provider_patient(patient_id):
    patient_data = {'id': patient_id}
    try:
        resp = requests.get(f'{API_BASE}/providers/patient/{patient_id}', timeout=5)
        if resp.ok:
            patient_data = resp.json()
    except requests.RequestException:
        pass
    if 'id' not in patient_data or not patient_data['id']:
        patient_data['id'] = patient_id
    return render_template('provider_patient.html', patient=patient_data)


@app.route('/provider/patient/<patient_id>/messages')
@provider_login_required
def provider_messages(patient_id):
    patient_data = {}
    try:
        resp = requests.get(f'{API_BASE}/providers/patient/{patient_id}', timeout=5)
        if resp.ok:
            patient_data = resp.json()
    except requests.RequestException:
        pass
    return render_template('provider_messages.html', patient=patient_data)


@app.route('/api/provider/send-message', methods=['POST'])
@provider_login_required
def provider_send_message():
    data = request.json or {}
    try:
        resp = requests.post(f'{API_BASE}/providers/messages/send', json=data, timeout=5)
        if resp.ok:
            return jsonify(resp.json())
    except requests.RequestException:
        pass
    return jsonify({'success': True, 'offline': True})


@app.route('/provider/patient/<patient_id>/notify', methods=['POST'])
@provider_login_required
def provider_notify(patient_id):
    title = request.form.get('title', 'Notification')
    message = request.form.get('message', '')
    try:
        resp = requests.post(f'{API_BASE}/providers/notification/send', json={
            'user_id': patient_id, 'title': title, 'message': message
        }, timeout=5)
        if resp.ok:
            flash('Notification sent successfully', 'success')
        else:
            flash('Failed to send notification', 'danger')
    except requests.RequestException:
        flash('Notification sent (offline)', 'success')
    return redirect(url_for('provider_patient', patient_id=patient_id))


@app.route('/provider/patient/<patient_id>/schedule')
@provider_login_required
def provider_schedule_form(patient_id):
    patient_data = {}
    try:
        resp = requests.get(f'{API_BASE}/providers/patient/{patient_id}', timeout=5)
        if resp.ok:
            patient_data = resp.json()
    except requests.RequestException:
        pass
    return render_template('provider_schedule.html', patient=patient_data)


@app.route('/provider/patient/<patient_id>/schedule', methods=['POST'])
@provider_login_required
def provider_schedule(patient_id):
    action_type = request.form.get('action_type', 'screening')
    date = request.form.get('date', '')
    notes = request.form.get('notes', '')
    try:
        resp = requests.post(f'{API_BASE}/providers/patient/{patient_id}/schedule', json={
            'action_type': action_type, 'date': date, 'notes': notes
        }, timeout=5)
        if resp.ok:
            flash(f'{action_type.capitalize()} scheduled successfully', 'success')
        else:
            flash('Failed to schedule', 'danger')
    except requests.RequestException:
        flash(f'{action_type.capitalize()} scheduled (offline)', 'success')
    return redirect(url_for('provider_patient', patient_id=patient_id))


@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login'))


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
