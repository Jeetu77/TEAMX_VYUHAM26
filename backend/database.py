import sqlite3, json, os
from datetime import datetime

DB = os.path.join(os.path.dirname(os.path.abspath(__file__)), "phishguard.db")

def init_db():
    conn = sqlite3.connect(DB)
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS analyses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        input_text TEXT,
        verdict TEXT,
        confidence INTEGER,
        tactics TEXT,
        created_at TEXT
    )''')
    c.execute('''CREATE TABLE IF NOT EXISTS campaigns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        email_content TEXT,
        created_at TEXT
    )''')
    c.execute('''CREATE TABLE IF NOT EXISTS campaign_targets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        campaign_id INTEGER,
        employee_name TEXT,
        status TEXT DEFAULT 'unread',
        feedback TEXT,
        updated_at TEXT
    )''')
    conn.commit()
    conn.close()

def save_analysis(input_text, result):
    conn = sqlite3.connect(DB)
    c = conn.cursor()
    c.execute('''INSERT INTO analyses
        (input_text, verdict, confidence, tactics, created_at)
        VALUES (?,?,?,?,?)''',
        (input_text, result.get('verdict'), result.get('confidence'),
         json.dumps(result.get('tactics', [])), datetime.now().isoformat()))
    conn.commit()
    conn.close()

def create_campaign(name, email_content, employees):
    conn = sqlite3.connect(DB)
    c = conn.cursor()
    c.execute('INSERT INTO campaigns (name, email_content, created_at) VALUES (?,?,?)',
              (name, email_content, datetime.now().isoformat()))
    campaign_id = c.lastrowid
    for emp in employees:
        c.execute('INSERT INTO campaign_targets (campaign_id, employee_name, status) VALUES (?,?,?)',
                  (campaign_id, emp, 'unread'))
    conn.commit()
    conn.close()
    return campaign_id

def get_campaign(campaign_id):
    conn = sqlite3.connect(DB)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    campaign = c.execute('SELECT * FROM campaigns WHERE id=?', (campaign_id,)).fetchone()
    targets = c.execute('SELECT * FROM campaign_targets WHERE campaign_id=?', (campaign_id,)).fetchall()
    conn.close()
    if campaign is None:
        return None, []
    return dict(campaign), [dict(t) for t in targets]

def update_target_status(target_id, status):
    conn = sqlite3.connect(DB)
    c = conn.cursor()
    c.execute('UPDATE campaign_targets SET status=?, updated_at=? WHERE id=?',
              (status, datetime.now().isoformat(), target_id))
    updated = c.rowcount
    conn.commit()
    conn.close()
    return updated

def save_feedback(target_id, feedback):
    conn = sqlite3.connect(DB)
    c = conn.cursor()
    c.execute('UPDATE campaign_targets SET feedback=? WHERE id=?', (feedback, target_id))
    conn.commit()
    conn.close()

def get_analyses(limit=50):
    conn = sqlite3.connect(DB)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    rows = c.execute('SELECT * FROM analyses ORDER BY created_at DESC LIMIT ?', (limit,)).fetchall()
    conn.close()
    out = []
    for r in rows:
        d = dict(r)
        d['tactics'] = json.loads(d['tactics'] or '[]')
        out.append(d)
    return out

def get_analysis_stats():
    conn = sqlite3.connect(DB)
    c = conn.cursor()
    rows = c.execute('SELECT verdict, COUNT(*) FROM analyses GROUP BY verdict').fetchall()
    total = c.execute('SELECT COUNT(*) FROM analyses').fetchone()[0]
    conn.close()
    return {"total": total, "by_verdict": {v: n for v, n in rows}}

def delete_campaign(campaign_id):
    conn = sqlite3.connect(DB)
    c = conn.cursor()
    c.execute('DELETE FROM campaign_targets WHERE campaign_id=?', (campaign_id,))
    c.execute('DELETE FROM campaigns WHERE id=?', (campaign_id,))
    deleted = c.rowcount
    conn.commit()
    conn.close()
    return deleted

def get_employee_stats():
    conn = sqlite3.connect(DB)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    rows = c.execute('''SELECT employee_name,
            COUNT(*) AS campaigns,
            SUM(status='clicked') AS clicked,
            SUM(status='reported') AS reported,
            SUM(status='ignored') AS ignored
        FROM campaign_targets
        GROUP BY employee_name
        ORDER BY SUM(status='clicked') DESC, employee_name''').fetchall()
    conn.close()
    out = []
    for r in rows:
        d = dict(r)
        acted = (d['clicked'] or 0) + (d['reported'] or 0) + (d['ignored'] or 0)
        d['risk_score'] = int((d['clicked'] or 0) / acted * 100) if acted else 0
        out.append(d)
    return out

def get_all_campaigns():
    conn = sqlite3.connect(DB)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    rows = c.execute('''SELECT c.*,
            COUNT(t.id) AS total,
            SUM(t.status='clicked') AS clicked,
            SUM(t.status='reported') AS reported,
            SUM(t.status='ignored') AS ignored
        FROM campaigns c LEFT JOIN campaign_targets t ON t.campaign_id = c.id
        GROUP BY c.id ORDER BY c.created_at DESC''').fetchall()
    conn.close()
    out = []
    for r in rows:
        d = dict(r)
        total = d['total'] or 0
        d['awareness_score'] = int((((d['reported'] or 0) + (d['ignored'] or 0) * 0.5) / total) * 100) if total else 0
        out.append(d)
    return out
