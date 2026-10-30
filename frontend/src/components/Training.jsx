import { useState } from 'react'
import { GraduationCap, ShieldAlert, ShieldCheck, RotateCcw, ArrowRight } from 'lucide-react'
import { card, SectionTitle, btnPrimary, btnGhost } from '../ui'

// Short training exercises: is this message phishing or safe?
const QUIZ = [
  {
    text: 'Your SBI netbanking will be deactivated today. Update KYC now at http://sbi-verify-kyc.net to continue using your account.',
    answer: 'phishing',
    why: 'Ur