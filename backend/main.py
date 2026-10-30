from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Literal
from database import init_db, save_analysis, create_campaign, \
    get_campaign, update_target_status, get_all_campaigns, save_feedback, \
    get_analyses, get_analysis_stats, delete_campaign, get_employee_stats
from analyzer import analyze, generate_phishing_email, generate_feedback, MOCK
from quiz import get_quiz
import random

app = FastAPI(title="PhishGuard API")

app.add_middleware(CORSMiddleware,
    allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

init_db()

# --- MODELS ---
class AnalyzeRequest(BaseModel):
    text: str

class CampaignRequest(BaseModel):
    name: str
    scenario: str
    difficulty: Literal["easy", "medium", "hard"]
    employees: List[str]

class ActionRequest(BaseModel):
    target_id: int
    action: Literal["clicked", "reported", "ignored"]


def _ai_call(fn, *args):
    try:
        return fn(*args)
    except Exception as e:
        raise HTTPException(502, f"AI request failed: {e}")


# --- DETECTION ---
@app.post("/analyze")
async def analyze_message(req: AnalyzeRequest):
    if not req.text.strip():
        raise HTTPException(400, "Empty message")
    result = _ai_call(analyze, req.text)
    save_analysis(req.text, result)
    return result

@app.get("/analyses")
async def list_analyses(limit: int = 50):
    return get_analyses(min(limit, 200))

@app.get("/analyses/stats")
async def analysis_stats():
    return get_analysis_stats()

# --- SIMULATION ---
@app.post("/campaigns")
async def create_sim_campaign(req: CampaignRequest):
    employees = [e.strip() for e in req.employees if e.strip()]
    if not employees:
        raise HTTPException(400, "Add at least one employee")
    email = _ai_call(generate_phishing_email, req.scenario, req.difficulty)
    campaign_id = create_campaign(req.name,
        f"Subject: {email['subject']}\nFrom: {email['sender_display']} <{email['sender_email']}>\n\n{email['body']}",
        employees)
    return {"campaign_id": campaign_id, "email": email}

@app.get("/campaigns")
async def list_campaigns():
    return get_all_campaigns()

@app.get("/campaigns/{campaign_id}")
async def get_campaign_detail(campaign_id: int):
    campaign, targets = get_campaign(campaign_id)
    if campaign is None:
        raise HTTPException(404, "Campaign not found")

    # Calculate stats
    total = len(targets)
    clicked = sum(1 for t in targets if t['status'] == 'clicked')
    reported = sum(1 for t in targets if t['status'] == 'reported')
    ignored = sum(1 for t in targets if t['status'] == 'ignored')
    awareness_score = int(((reported + ignored * 0.5) / total) * 100) if total else 0

    return {
        "campaign": campaign,
        "targets": targets,
        "stats": {
            "total": total,
            "clicked": clicked,
            "reported": reported,
            "ignored": ignored,
            "unread": total - clicked - reported - ignored,
            "awareness_score": awareness_score
        }
    }

@app.delete("/campaigns/{campaign_id}")
async def remove_campaign(campaign_id: int):
    if not delete_campaign(campaign_id):
        raise HTTPException(404, "Campaign not found")
    return {"status": "deleted"}

@app.post("/campaigns/action")
async def record_action(req: ActionRequest):
    if not update_target_status(req.target_id, req.action):
        raise HTTPException(404, "Target not found")
    return {"status": "updated"}

@app.post("/campaigns/{campaign_id}/feedback/{target_id}")
async def get_employee_feedback(campaign_id: int, target_id: int):
    campaign, targets = get_campaign(campaign_id)
    if campaign is None:
        raise HTTPException(404, "Campaign not found")
    target = next((t for t in targets if t['id'] == target_id), None)
    if not target:
        raise HTTPException(404, "Target not found")
    feedback = _ai_call(generate_feedback,
        target['employee_name'],
        target['status'],
        campaign['email_content'].split('\n')[0].replace('Subject: ', '')
    )
    save_feedback(target_id, feedback)
    return {"feedback": feedback}

@app.get("/employees/stats")
async def employee_stats():
    return get_employee_stats()

# --- QUIZ ---
@app.get("/quiz")
async def quiz(n: int = 6):
    return get_quiz(n)

# --- AUTO-SIMULATE ---
# Probability of each action per difficulty (how convincing the email is)
AUTO_PROBS = {
    "easy":   {"clicked": 0.10, "reported": 0.65, "ignored": 0.25},
    "medium": {"clicked": 0.30, "reported": 0.45, "ignored": 0.25},
    "hard":   {"clicked": 0.55, "reported": 0.25, "ignored": 0.20},
}

class AutoSimRequest(BaseModel):
    difficulty: Literal["easy", "medium", "hard"] = "medium"

@app.post("/campaigns/{campaign_id}/auto_simulate")
async def auto_simulate(campaign_id: int, req: AutoSimRequest):
    campaign, targets = get_campaign(campaign_id)
    if campaign is None:
        raise HTTPException(404, "Campaign not found")
    probs = AUTO_PROBS[req.difficulty]
    actions = list(probs.keys())
    weights = list(probs.values())
    changed = []
    for t in targets:
        if t['status'] == 'unread':
            action = random.choices(actions, weights=weights)[0]
            update_target_status(t['id'], action)
            changed.append({"target_id": t['id'], "employee_name": t['employee_name'], "action": action})
    return {"simulated": changed}

@app.get("/health")
async def health():
    return {"status": "ok", "mock_ai": MOCK}
