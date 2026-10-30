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
    # ---- Kerala local scam library ----
    {
        "id": 13, "topic": "kerala", "is_phish": True,
        "sender": "+91 9xxxxxxx45 (SMS)",
        "subject": "KSEB bill pending - supply will be cut",
        "body": "Dear KSEB consumer, your bill of Rs 3,112 is pending. Power supply will be disconnected tonight. Pay now at http://kseb-billpay.example/pay or call the officer 9xxxxxxx45.",
        "red_flags": ["Sent from a personal mobile number, not an official sender", "Threat of same-night disconnection", "Payment link is not the official kseb.in site", "Asks you to phone an 'officer' directly"],
        "explanation": "A very common Kerala scam. KSEB does not cut power the same night over an SMS. If a bill worries you, check it yourself on the official KSEB website or app, or at your local section office.",
    },
    {
        "id": 14, "topic": "kerala", "is_phish": False,
        "sender": "KSEB Ltd <noreply@kseb.in>",
        "subject": "Your electricity bill for October is generated",
        "body": "Dear consumer, the bill for consumer number ending 4821 for October is Rs 842, due on 25-Nov. You can pay through the official KSEB website or app, or at your local section office. KSEB staff never ask for payment to a personal number.",
        "red_flags": [],
        "explanation": "Legitimate pattern: official domain, shows partial consumer details, gives a reasonable due date, and points you to channels you open yourself rather than a pressure link.",
    },
    {
        "id": 15, "topic": "kerala", "is_phish": True,
        "sender": "VAHAN-ALERT (SMS)",
        "subject": "Pending traffic challan",
        "body": "Your vehicle KL-07-XX-1234 has an unpaid e-challan of Rs 500. Pay within 24 hours to avoid court notice and licence suspension: http://mvd-echallan-pay.example/KL07. Install the app from this link for details.",
        "red_flags": ["Court and licence threat with a 24-hour deadline", "Payment link is not the official parivahan.gov.in portal", "Asks you to install an app from a link in an SMS", "Does not name the offence, date or location"],
        "explanation": "Fake e-challan messages often push you to install an APK that can read your SMS and OTPs. Real challans list the offence, place and time; check yours by typing the official e-challan portal address yourself.",
    },
    {
        "id": 16, "topic": "kerala", "is_phish": False,
        "sender": "Motor Vehicles Department notice",
        "subject": "Traffic violation notice for KL-07-XX-1234",
        "body": "A violation was recorded on 12-Oct at 4:15 PM near MG Road junction (signal jump). Details and payment options are available on the official e-challan portal of the Government of India. Please open the portal yourself and enter your vehicle number. Do not pay through links in messages.",
        "red_flags": [],
        "explanation": "This one gives the date, time and place of a specific offence and sends you to the official portal to look it up yourself, with no link, app or threat.",
    },
    {
        "id": 17, "topic": "kerala", "is_phish": True,
        "sender": "Phone call + video call (caller says 'Customs / CBI')",
        "subject": "Customs parcel in your name - arrest warning",
        "body": "This is Customs. A parcel booked in your name from abroad contains illegal items and a case is registered. To avoid arrest you must stay on this video call, tell nobody, and transfer a refundable security deposit to the verification account we will share.",
        "red_flags": ["Agencies never arrest or investigate over a phone or video call", "Demands you keep the call going and tell no one", "Asks for a 'refundable deposit' to a private account", "You never sent or expected such a parcel"],
        "explanation": "This is the 'digital arrest' scam. No agency holds people on video calls or collects money to clear a case. Hang up, speak to family, and report it on 1930 or cybercrime.gov.in.",
    },
    {
        "id": 18, "topic": "kerala", "is_phish": True,
        "sender": "WhatsApp message from unknown number",
        "subject": "Gift parcel held at customs",
        "body": "Hello, I sent you a gift parcel from the UK with jewellery and a phone. It is held at Cochin customs. Pay Rs 18,500 clearance fee today to this UPI id to release it: clearance.cus@ybl",
        "red_flags": ["Unknown sender claims to have sent you a gift", "Customs fee demanded to a personal UPI id", "Same-day deadline", "Valuable gift from a stranger"],
        "explanation": "A romance-and-gift variant of the customs scam. Genuine customs duty is never collected through a personal UPI id, and strangers do not send expensive gifts.",
    },
    {
        "id": 19, "topic": "kerala", "is_phish": True,
        "sender": "+91 8xxxxxxxxx (SMS from instant-loan app)",
        "subject": "Loan overdue - final warning",
        "body": "Your instant loan of Rs 5,000 is overdue. Repay Rs 9,800 today or we will send your photos and loan details to everyone in your contacts and call your family and employer.",
        "red_flags": ["Repayment far above the amount borrowed", "Threatens to message your contacts and family", "Uses your phone contacts and photos as leverage", "Pressure to pay the same day"],
        "explanation": "Predatory loan apps copy your contacts and gallery, then harass borrowers. Do not pay under threat, do not install such apps, and report harassment on 1930 or cybercrime.gov.in.",
    },
    {
        "id": 20, "topic": "kerala", "is_phish": True,
        "sender": "Quick Cash Loans <offers@fastloan-approved.example>",
        "subject": "Pre-approved loan of Rs 50,000 - no documents",
        "body": "You are pre-approved for Rs 50,000 with no documents or credit check. Pay a processing fee of Rs 1,500 now to release the amount. Download our app to continue.",
        "red_flags": ["Asks for a fee before any money is paid out", "No documents or credit check", "Unsolicited pre-approval", "Pushes an app install"],
        "explanation": "Regulated lenders do not take an upfront fee before disbursing and do not approve loans without checks. Verify any lender on the RBI website before installing its app.",
    },
    {
        "id": 21, "topic": "kerala", "is_phish": False,
        "sender": "Your Bank <alerts@yourbank.example>",
        "subject": "EMI reminder: due on 5 November",
        "body": "Dear Anitha, your EMI of Rs 4,250 for loan account ending 7712 is due on 5-Nov. Please keep the amount in your account. You can also pay in the bank's official app or at your branch. This is an automated reminder.",
        "red_flags": [],
        "explanation": "A normal reminder: names you, gives the exact amount and a sensible due date, shows only the last digits of the account, makes no threats and asks for nothing unusual.",
    },
]


def get_quiz(n: int = 6, topic: str = "all") -> list:
    pool = [q for q in QUIZ_BANK if q.get("topic") == topic] if topic != "all" else QUIZ_BANK
    n = max(2, min(n, len(pool)))
    questions = random.sample(pool, n)
    # Keep a balanced mix: at least one of each kind when possible
    if all(q["is_phish"] for q in questions):
        questions[-1] = random.choice([q for q in pool if not q["is_phish"]])
    elif not any(q["is_phish"] for q in questions):
        questions[-1] = random.choice([q for q in pool if q["is_phish"]])
    random.shuffle(questions)
    return questions
