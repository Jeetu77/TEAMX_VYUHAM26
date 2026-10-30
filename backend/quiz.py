"""Static question bank for the training quiz (Indian context).

Works identically in mock and AI mode — the bank is curated so the
red flags are accurate, which generated questions can't guarantee.
"""
import random

QUIZ_BANK = [
    {
        "id": 1, "is_phish": True,
        "sender": "SBI Alerts <alert@sbi-secure-verify.com>",
        "subject": "KYC Expired - Account will be blocked",
        "body": "Dear Customer, your SBI KYC has expired. Your account will be blocked within 24 hours. Click http://sbi-secure-verify.com/kyc to update immediately.",
        "red_flags": ["Domain sbi-secure-verify.com is not onlinesbi.sbi", "24-hour deadline pressure", "Generic 'Dear Customer' greeting"],
        "explanation": "SBI never sends KYC links by email or SMS. The sender domain is a lookalike, and the deadline is designed to make you act before thinking.",
    },
    {
        "id": 2, "is_phish": False,
        "sender": "IRCTC <noreply@irctc.co.in>",
        "subject": "Your ticket PNR 4512087632 is confirmed",
        "body": "Dear RAHUL, your booking for Chennai Express (12163) on 15-Nov is CONFIRMED. PNR: 4512087632, Coach S4, Seat 32. Carry a valid ID during the journey.",
        "red_flags": [],
        "explanation": "A legitimate confirmation: official irctc.co.in domain, uses your name, contains specific booking details, and asks you to do nothing unusual.",
    },
    {
        "id": 3, "is_phish": True,
        "sender": "+91 98xxxxxx12 (SMS)",
        "subject": "Electricity bill disconnect notice",
        "body": "Dear consumer, your electricity power will be disconnected tonight at 9.30pm because previous month bill not updated. Immediately contact electricity officer 9832XXXX21. Thank you.",
        "red_flags": ["Utilities never text from personal mobile numbers", "Same-night deadline", "Asks you to call an unknown mobile number"],
        "explanation": "The classic electricity-disconnection scam. Power companies send bills with account references through official channels and never threaten same-night disconnection via SMS from a personal number.",
    },
    {
        "id": 4, "is_phish": True,
        "sender": "HDFC Bank <care@hdfc-rewards.net>",
        "subject": "Your 4,350 reward points expire TODAY",
        "body": "Valued customer, your HDFC credit card reward points worth Rs 4,350 expire today. Redeem now at http://hdfc-rewards.net/redeem by confirming your card number and CVV.",
        "red_flags": ["Asks for card number and CVV", "hdfc-rewards.net is not hdfcbank.com", "Same-day expiry pressure"],
        "explanation": "No bank ever asks for your CVV to redeem points — that's all a scammer needs for online payments. Redemption always happens inside official net banking.",
    },
    {
        "id": 5, "is_phish": False,
        "sender": "Amazon.in <shipment-tracking@amazon.in>",
        "subject": "Your package has been delivered",
        "body": "Hello, your package with order #404-581 was delivered today at 2:14 PM and handed to the resident. If you did not receive it, visit Your Orders on amazon.in for help.",
        "red_flags": [],
        "explanation": "Legitimate: official amazon.in domain, refers to a specific order, and directs you to the website you'd navigate to yourself rather than a link demanding action.",
    },
    {
        "id": 6, "is_phish": True,
        "sender": "Income Tax Dept <refund@incometax-gov.net>",
        "subject": "Income Tax Refund of Rs 24,560 pending",
        "body": "Dear Taxpayer, a refund of Rs 24,560 has been approved. Verify your bank account at http://incometax-gov.net/refund within 48 hours or the refund will lapse.",
        "red_flags": ["Official domain is incometax.gov.in, not incometax-gov.net", "Refunds never lapse in 48 hours", "Asks you to 'verify' bank details via a link"],
        "explanation": "The IT department credits refunds directly to your pre-validated bank account and communicates through the e-filing portal, never through verify-your-account links.",
    },
    {
        "id": 7, "is_phish": True,
        "sender": "WhatsApp message from unknown number",
        "subject": "Part-time job offer - earn 3000/day",
        "body": "Hi dear, I am Anjali from TaskPlanet HR. Earn Rs 2000-5000 daily by liking YouTube videos from home. Registration fee only Rs 199. Join fast, limited slots! Pay to UPI id taskplanet@ybl",
        "red_flags": ["Upfront 'registration fee' to a personal UPI id", "Unrealistic pay for trivial work", "Unknown number, artificial scarcity"],
        "explanation": "Real employers never charge a fee to give you a job. The 'task scam' starts with small payouts to build trust, then asks for larger 'investment' deposits that vanish.",
    },
    {
        "id": 8, "is_phish": False,
        "sender": "Google <no-reply@accounts.google.com>",
        "subject": "Security alert: new sign-in on Windows",
        "body": "New sign-in to your Google Account on a Windows device. If this was you, you don't need to do anything. If not, check activity at myaccount.google.com/notifications.",
        "red_flags": [],
        "explanation": "A genuine Google alert: official accounts.google.com sender, no panic language, and it tells you to navigate to Google's own site rather than click a tracking link.",
    },
    {
        "id": 9, "is_phish": True,
        "sender": "Flipkart Big Billion <offers@flipkart-bigsale.in>",
        "subject": "You won iPhone 16 Pro in Big Billion Lucky Draw!",
        "body": "Congratulations! Your mobile number was selected in the Flipkart Big Billion Days lucky draw. You won an iPhone 16 Pro! Pay delivery charge of Rs 149 at http://flipkart-bigsale.in/claim to receive your prize.",
        "red_flags": ["You can't win a draw you never entered", "Pay-to-receive-prize demand", "flipkart-bigsale.in is not flipkart.com"],
        "explanation": "Lottery/lucky-draw scams collect small 'delivery charges' from thousands of victims. Flipkart runs promotions only inside its official app and never charges to deliver a prize.",
    },
    {
        "id": 10, "is_phish": False,
        "sender": "HR Department <hr@yourcompany.com>",
        "subject": "Reminder: Insurance enrollment closes Friday",
        "body": "Hi team, a reminder that the annual health-insurance enrollment window closes this Friday. Please log in to the HR portal through the intranet to review your plan. Contact HR with questions.",
        "red_flags": [],
        "explanation": "Legitimate internal mail: known sender, routine process, reasonable timeline, and it points you to the intranet portal you already use instead of an external link.",
    },
    {
        "id": 11, "is_phish": True,
        "sender": "FedEx <tracking@fedex-redelivery.info>",
        "subject": "Package held: address incomplete",
        "body": "Your parcel could not be delivered due to incomplete address. Pay Rs 25 re-delivery fee at http://fedex-redelivery.info/pay within 12 hours or the package will be returned.",
        "red_flags": ["Tiny 'fee' designed to capture card details", "fedex-redelivery.info is not fedex.com", "12-hour pressure window"],
        "explanation": "The courier-fee scam: the Rs 25 is irrelevant — the payment page steals your full card details. Couriers resolve address issues through their official apps with your tracking number.",
    },
    {
        "id": 12, "is_phish": False,
        "sender": "PhonePe <support@phonepe.com>",
        "subject": "Monthly statement for September",
        "body": "Hi, your PhonePe transaction statement for September is ready. Open the PhonePe app and go to History > Download Statement to view it. We never ask for your PIN or OTP.",
        "red_flags": [],
        "explanation": "Legitimate: official domain, directs you into the app you already have rather than a link, and explicitly reminds you it never asks for PIN/OTP.",
    },
]


def get_quiz(n: int = 6) -> list:
    n = max(2, min(n, len(QUIZ_BANK)))
    questions = random.sample(QUIZ_BANK, n)
    # Keep a balanced mix: at least one of each kind when possible
    if all(q["is_phish"] for q in questions):
        questions[-1] = random.choice([q for q in QUIZ_BANK if not q["is_phish"]])
    elif not any(q["is_phish"] for q in questions):
        questions[-1] = random.choice([q for q in QUIZ_BANK if q["is_phish"]])
    random.shuffle(questions)
    return questions
