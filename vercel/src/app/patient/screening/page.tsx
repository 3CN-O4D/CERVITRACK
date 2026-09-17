'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api-fetch';

type AnswerValue = string | number | null;
interface AnswerMap {
  [key: string]: AnswerValue;
}

interface QuestionConfig {
  key: string;
  title: string;
  type: 'number' | 'single';
  options?: { label: string; value: string }[];
  condition: (a: AnswerMap) => boolean;
}

const ageThreshold = 18;
const riskAgeThreshold = 30;
const riskParityThreshold = 3;
const highRiskThreshold = 8;
const moderateRiskThreshold = 4;

const ALL_QUESTIONS: QuestionConfig[] = [
  { key: 'age', title: 'What is your age?', type: 'number', condition: () => true },
  { key: 'weight', title: 'What is your weight? (kg)', type: 'number', condition: () => true },
  { key: 'bmi', title: 'What is your height? (cm)', type: 'number', condition: () => true },
  {
    key: 'periodStart', title: 'How old were you when you had your first period?', type: 'single',
    options: [{ label: 'Under 12', value: 'under12' }, { label: '12-14', value: '12_14' }, { label: '15+', value: 'over15' }],
    condition: (a) => (a.age as number) >= 12,
  },
  {
    key: 'cycleRegular', title: 'Are your menstrual cycles regular?', type: 'single',
    options: [{ label: 'Yes, regular', value: 'regular' }, { label: 'Sometimes irregular', value: 'sometimes' }, { label: 'Very irregular', value: 'irregular' }],
    condition: (a) => (a.age as number) >= 12,
  },
  {
    key: 'pregnancies', title: 'How many times have you been pregnant?', type: 'single',
    options: [{ label: '0', value: '0' }, { label: '1-2', value: '1_2' }, { label: '3-4', value: '3_4' }, { label: '5+', value: '5plus' }],
    condition: (a) => (a.age as number) >= ageThreshold,
  },
  {
    key: 'births', title: 'How many children have you delivered?', type: 'number',
    condition: (a) => { const p = a.pregnancies as string | null; return p !== null && p !== '0'; },
  },
  {
    key: 'firstPregnancyAge', title: 'How old were you at your first birth?', type: 'single',
    options: [{ label: 'Under 18', value: 'under18' }, { label: '18-25', value: '18_25' }, { label: 'Over 25', value: 'over25' }],
    condition: (a) => { const b = a.births as number | null; return b !== null && b > 0; },
  },
  {
    key: 'sexuallyActive', title: 'Are you currently sexually active?', type: 'single',
    options: [{ label: 'Yes', value: 'yes' }, { label: 'No', value: 'no' }],
    condition: (a) => (a.age as number) >= 14,
  },
  {
    key: 'ageFirstIntercourse', title: 'At what age did you first have sexual intercourse?', type: 'single',
    options: [{ label: 'Under 16', value: 'under16' }, { label: '16-18', value: '16_18' }, { label: '19-25', value: '19_25' }, { label: 'Over 25', value: 'over25' }, { label: 'Prefer not to say', value: 'prefer_not' }],
    condition: (a) => a.sexuallyActive === 'yes' || (a.age as number) >= 16,
  },
  {
    key: 'partners', title: 'How many sexual partners have you had in your lifetime?', type: 'single',
    options: [{ label: '1', value: '1' }, { label: '2-3', value: '2_3' }, { label: '4-6', value: '4_6' }, { label: '7+', value: '7plus' }, { label: 'Prefer not to say', value: 'prefer_not' }],
    condition: () => true,
  },
  {
    key: 'newPartners', title: 'New sexual partners in the last year?', type: 'single',
    options: [{ label: '0', value: '0' }, { label: '1', value: '1' }, { label: '2+', value: '2plus' }],
    condition: (a) => a.sexuallyActive === 'yes',
  },
  {
    key: 'condomUse', title: 'How often do you use condoms?', type: 'single',
    options: [{ label: 'Always', value: 'always' }, { label: 'Sometimes', value: 'sometimes' }, { label: 'Never', value: 'never' }, { label: 'Not applicable', value: 'na' }],
    condition: (a) => a.sexuallyActive === 'yes',
  },
  {
    key: 'stiHistory', title: 'Have you ever been diagnosed with an STI?', type: 'single',
    options: [{ label: 'No', value: 'no' }, { label: 'Yes, treated', value: 'treated' }, { label: 'Yes, recurring', value: 'recurring' }],
    condition: () => true,
  },
  {
    key: 'contraceptives', title: 'Do you use hormonal contraceptives?', type: 'single',
    options: [{ label: 'Yes, 5+ years', value: 'long_term' }, { label: 'Yes, under 5 years', value: 'short_term' }, { label: 'No', value: 'no' }],
    condition: () => true,
  },
  {
    key: 'hiv', title: 'What is your HIV status?', type: 'single',
    options: [{ label: 'Positive', value: 'positive' }, { label: 'Negative', value: 'negative' }, { label: 'Unknown', value: 'unknown' }],
    condition: () => true,
  },
  {
    key: 'immunocompromised', title: 'Do you have any condition that weakens your immune system?', type: 'single',
    options: [{ label: 'No', value: 'no' }, { label: 'Organ transplant', value: 'transplant' }, { label: 'Autoimmune disease', value: 'autoimmune' }, { label: 'Long-term steroid use', value: 'steroids' }, { label: 'Other', value: 'other' }],
    condition: () => true,
  },
  {
    key: 'diabetes', title: 'Do you have diabetes?', type: 'single',
    options: [{ label: 'No', value: 'no' }, { label: 'Type 1', value: 'type1' }, { label: 'Type 2', value: 'type2' }],
    condition: () => true,
  },
  {
    key: 'vaccine', title: 'Have you received the HPV vaccine?', type: 'single',
    options: [{ label: 'Fully vaccinated', value: 'full' }, { label: 'Partially vaccinated', value: 'partial' }, { label: 'Not vaccinated', value: 'none' }],
    condition: () => true,
  },
  {
    key: 'vaccineReason', title: 'Why haven\'t you been vaccinated?', type: 'single',
    options: [{ label: 'Not offered/available', value: 'not_offered' }, { label: 'Too old/young', value: 'age' }, { label: 'Safety concerns', value: 'safety' }, { label: 'Cost', value: 'cost' }, { label: 'Other', value: 'other' }],
    condition: (a) => a.vaccine === 'none' || a.vaccine === 'partial',
  },
  {
    key: 'previous', title: 'Have you had a cervical screening (Pap smear or HPV test) before?', type: 'single',
    options: [{ label: 'Yes, within 3 years', value: 'recent' }, { label: 'Yes, over 3 years ago', value: 'old' }, { label: 'Never screened', value: 'never' }],
    condition: () => true,
  },
  {
    key: 'lastResult', title: 'What was your last screening result?', type: 'single',
    options: [{ label: 'Normal / Negative', value: 'normal' }, { label: 'Abnormal cells found', value: 'abnormal' }, { label: 'HPV positive', value: 'hpv_positive' }, { label: 'Not sure / don\'t remember', value: 'unsure' }],
    condition: (a) => a.previous === 'recent' || a.previous === 'old',
  },
  {
    key: 'symptoms', title: 'Which symptoms are you experiencing?', type: 'single',
    options: [{ label: 'No symptoms', value: 'none' }, { label: 'Bleeding between periods', value: 'abnormal_bleeding' }, { label: 'Bleeding after sex', value: 'postcoital' }, { label: 'Pelvic pain', value: 'pelvic_pain' }, { label: 'Pain during sex', value: 'pain_sex' }, { label: 'Unusual discharge', value: 'discharge' }, { label: 'Multiple symptoms', value: 'multiple' }],
    condition: () => true,
  },
  {
    key: 'symptomDuration', title: 'How long have you had these symptoms?', type: 'single',
    options: [{ label: 'Less than 2 weeks', value: 'acute' }, { label: '2 weeks - 3 months', value: 'subacute' }, { label: 'Over 3 months', value: 'chronic' }],
    condition: (a) => a.symptoms !== null && a.symptoms !== 'none',
  },
  {
    key: 'smoking', title: 'Do you smoke tobacco?', type: 'single',
    options: [{ label: 'Never smoked', value: 'never' }, { label: 'Current smoker', value: 'yes' }, { label: 'Used to smoke, quit', value: 'quit' }],
    condition: () => true,
  },
  {
    key: 'alcohol', title: 'How often do you consume alcohol?', type: 'single',
    options: [{ label: 'Never', value: 'never' }, { label: 'Occasionally', value: 'occasionally' }, { label: 'Weekly', value: 'weekly' }, { label: 'Daily', value: 'daily' }],
    condition: () => true,
  },
  {
    key: 'exercise', title: 'How often do you exercise?', type: 'single',
    options: [{ label: 'Daily', value: 'daily' }, { label: '2-3 times/week', value: 'moderate' }, { label: 'Rarely', value: 'rarely' }, { label: 'Never', value: 'never' }],
    condition: () => true,
  },
  {
    key: 'diet', title: 'How would you describe your diet?', type: 'single',
    options: [{ label: 'Healthy & balanced', value: 'healthy' }, { label: 'Mostly healthy', value: 'mostly_healthy' }, { label: 'Mixed', value: 'mixed' }, { label: 'Mostly processed / fast food', value: 'unhealthy' }],
    condition: () => true,
  },
  {
    key: 'family', title: 'Has anyone in your immediate family had cervical cancer?', type: 'single',
    options: [{ label: 'No', value: 'no' }, { label: 'Yes, mother/sister', value: 'immediate' }, { label: 'Yes, other relative', value: 'extended' }],
    condition: () => true,
  },
  {
    key: 'familyOther', title: 'Has anyone in your family had other cancers?', type: 'single',
    options: [{ label: 'No', value: 'no' }, { label: 'Breast cancer', value: 'breast' }, { label: 'Ovarian cancer', value: 'ovarian' }, { label: 'Other', value: 'other' }],
    condition: () => true,
  },
  {
    key: 'distance', title: 'How far is the nearest health facility from your home?', type: 'single',
    options: [{ label: 'Less than 5 km', value: 'near' }, { label: '5-15 km', value: 'medium' }, { label: 'Over 15 km', value: 'far' }],
    condition: () => true,
  },
  {
    key: 'insurance', title: 'Do you have health insurance?', type: 'single',
    options: [{ label: 'Yes, NHIF', value: 'nhif' }, { label: 'Yes, private', value: 'private' }, { label: 'No insurance', value: 'none' }],
    condition: () => true,
  },
];

function calculateRisk(answers: AnswerMap): { score: number; level: string; factors: { label: string; active: boolean }[] } {
  let score = 0;
  const factors: { label: string; active: boolean }[] = [];
  const ageNum = (answers.age as number) || 0;
  const births = answers.births as number | null;
  const pregnancies = answers.pregnancies as string | null;
  const vaccine = answers.vaccine as string | null;
  const ageFirstIntercourse = answers.ageFirstIntercourse as string | null;
  const periodStart = answers.periodStart as string | null;
  const partners = answers.partners as string | null;
  const newPartners = answers.newPartners as string | null;
  const condomUse = answers.condomUse as string | null;
  const stiHistory = answers.stiHistory as string | null;
  const contraceptives = answers.contraceptives as string | null;
  const previous = answers.previous as string | null;
  const lastResult = answers.lastResult as string | null;
  const hiv = answers.hiv as string | null;
  const immunocompromised = answers.immunocompromised as string | null;
  const diabetes = answers.diabetes as string | null;
  const smoking = answers.smoking as string | null;
  const alcohol = answers.alcohol as string | null;
  const exercise = answers.exercise as string | null;
  const diet = answers.diet as string | null;
  const symptoms = answers.symptoms as string | null;
  const symptomDuration = answers.symptomDuration as string | null;
  const family = answers.family as string | null;
  const familyOther = answers.familyOther as string | null;
  const distance = answers.distance as string | null;
  const cycleRegular = answers.cycleRegular as string | null;

  if (ageNum >= 50) { score += 2; factors.push({ label: 'Age 50+ (higher risk)', active: true }); }
  else if (ageNum >= riskAgeThreshold) { score += 1; factors.push({ label: 'Age 30+', active: true }); }
  else factors.push({ label: 'Age 30+', active: false });

  if (periodStart === 'under12') { score += 1; factors.push({ label: 'Early first period (under 12)', active: true }); }
  else factors.push({ label: 'Early first period', active: false });

  if (cycleRegular === 'irregular') { score += 1; factors.push({ label: 'Irregular menstrual cycles', active: true }); }
  else factors.push({ label: 'Irregular cycles', active: false });

  if (pregnancies === '3_4' || pregnancies === '5plus') { score += 1; factors.push({ label: '3+ pregnancies', active: true }); }
  else factors.push({ label: '3+ pregnancies', active: false });

  if (births !== null && births >= riskParityThreshold) { score += 1; factors.push({ label: '3+ births', active: true }); }
  else factors.push({ label: '3+ births', active: false });

  if (ageFirstIntercourse === 'under16') { score += 2; factors.push({ label: 'First intercourse under 16 (high risk)', active: true }); }
  else if (ageFirstIntercourse === '16_18') { score += 1; factors.push({ label: 'First intercourse before 18', active: true }); }
  else factors.push({ label: 'First intercourse under 18', active: false });

  if (partners === '7plus') { score += 2; factors.push({ label: '7+ lifetime partners (high risk)', active: true }); }
  else if (partners === '4_6') { score += 1; factors.push({ label: '4-6 lifetime partners', active: true }); }
  else factors.push({ label: 'Multiple partners', active: false });

  if (newPartners === '2plus') { score += 1; factors.push({ label: 'New partners in last year', active: true }); }
  else factors.push({ label: 'New partners', active: false });

  if (condomUse === 'never') { score += 1; factors.push({ label: 'No condom use', active: true }); }
  else factors.push({ label: 'No condom use', active: false });

  if (stiHistory === 'recurring') { score += 2; factors.push({ label: 'Recurring STI history', active: true }); }
  else if (stiHistory === 'treated') { score += 1; factors.push({ label: 'Past STI history', active: true }); }
  else factors.push({ label: 'STI history', active: false });

  if (contraceptives === 'long_term') { score += 1; factors.push({ label: 'Long-term hormonal contraceptives', active: true }); }
  else factors.push({ label: 'Long-term contraceptives', active: false });

  if (previous === 'never') { score += 2; factors.push({ label: 'Never screened (high risk)', active: true }); }
  else if (previous === 'old') { score += 1; factors.push({ label: 'Last screening over 3 years ago', active: true }); }
  else factors.push({ label: 'Up-to-date screening', active: false });

  if (lastResult === 'abnormal' || lastResult === 'hpv_positive') { score += 2; factors.push({ label: 'Previous abnormal screening result', active: true }); }
  else factors.push({ label: 'Previous abnormal result', active: false });

  if (hiv === 'positive') { score += 2; factors.push({ label: 'HIV positive (high risk)', active: true }); }
  else factors.push({ label: 'HIV positive', active: false });

  if (immunocompromised && immunocompromised !== 'no') { score += 2; factors.push({ label: 'Immunocompromised', active: true }); }
  else factors.push({ label: 'Immunocompromised', active: false });

  if (diabetes && diabetes !== 'no') { score += 1; factors.push({ label: 'Diabetes', active: true }); }
  else factors.push({ label: 'Diabetes', active: false });

  if (vaccine === 'none') { score += 1; factors.push({ label: 'Not vaccinated', active: true }); }
  else factors.push({ label: 'Not vaccinated', active: false });

  if (smoking === 'yes') { score += 2; factors.push({ label: 'Current smoker (high risk)', active: true }); }
  else if (smoking === 'quit') { score += 1; factors.push({ label: 'Past smoker', active: true }); }
  else factors.push({ label: 'Smoker', active: false });

  if (alcohol === 'daily') { score += 2; factors.push({ label: 'Daily alcohol consumption', active: true }); }
  else if (alcohol === 'weekly') { score += 1; factors.push({ label: 'Weekly alcohol consumption', active: true }); }
  else factors.push({ label: 'Alcohol consumption', active: false });

  if (exercise === 'never') { score += 1; factors.push({ label: 'Sedentary (no exercise)', active: true }); }
  else factors.push({ label: 'Sedentary', active: false });

  if (diet === 'unhealthy') { score += 1; factors.push({ label: 'Poor diet', active: true }); }
  else factors.push({ label: 'Poor diet', active: false });

  if (symptoms && symptoms !== 'none') {
    score += 2;
    factors.push({ label: 'Has symptoms', active: true });
    if (symptoms === 'multiple') { score += 1; factors.push({ label: 'Multiple symptoms', active: true }); }
    if (symptomDuration === 'chronic') { score += 1; factors.push({ label: 'Chronic symptoms (3+ months)', active: true }); }
    else factors.push({ label: 'Chronic symptoms', active: false });
  } else {
    factors.push({ label: 'Has symptoms', active: false });
    factors.push({ label: 'Multiple symptoms', active: false });
    factors.push({ label: 'Chronic symptoms', active: false });
  }

  if (family === 'immediate') { score += 2; factors.push({ label: 'Immediate family cervical cancer', active: true }); }
  else if (family === 'extended') { score += 1; factors.push({ label: 'Extended family cervical cancer', active: true }); }
  else factors.push({ label: 'Family history', active: false });
  if (familyOther && familyOther !== 'no') { score += 1; factors.push({ label: 'Other family cancer history', active: true }); }
  else factors.push({ label: 'Other family cancer', active: false });

  if (distance === 'far') { score += 1; factors.push({ label: 'Far from health facility', active: true }); }
  else factors.push({ label: 'Far from health facility', active: false });

  const level = score >= highRiskThreshold ? 'High' : score >= moderateRiskThreshold ? 'Moderate' : 'Low';
  return { score, level, factors };
}

function getGuidance(level: string) {
  switch (level) {
    case 'High':
      return { title: 'High Risk', text: 'Your screening indicates a high risk. Please consult a healthcare provider immediately for further evaluation and a diagnostic test.', bar: 'bg-red-500', soft: 'bg-red-50 border-red-200 text-red-700' };
    case 'Moderate':
      return { title: 'Moderate Risk', text: 'Your screening indicates a moderate risk. Schedule a follow-up screening within the next 3 months and discuss your results with a healthcare provider.', bar: 'bg-amber-500', soft: 'bg-amber-50 border-amber-200 text-amber-700' };
    default:
      return { title: 'Low Risk', text: 'Your screening indicates a low risk. Continue regular checkups and maintain a healthy lifestyle. Schedule your next routine screening as recommended.', bar: 'bg-green-500', soft: 'bg-green-50 border-green-200 text-green-700' };
  }
}

export default function PatientScreening() {
  const router = useRouter();
  const [stage, setStage] = useState<'start' | 'questions' | 'results'>('start');
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [currentQ, setCurrentQ] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const visibleQuestions = useMemo(() => ALL_QUESTIONS.filter((q) => q.condition(answers)), [answers]);
  const currentQDef = visibleQuestions[currentQ];
  const totalVisible = visibleQuestions.length;
  const isLastQuestion = currentQ >= totalVisible - 1;
  const progress = totalVisible > 0 ? ((currentQ + 1) / totalVisible) * 100 : 0;

  const risk = useMemo(() => calculateRisk(answers), [answers]);
  const guidance = useMemo(() => getGuidance(risk.level), [risk.level]);
  const maxScore = 38;
  const scorePct = Math.min(risk.score / maxScore, 1);
  const activeFactors = risk.factors.filter((f) => f.active);

  function advance() {
    if (isLastQuestion) setStage('results');
    else setCurrentQ((p) => p + 1);
  }

  function handleSingle(key: string, value: string) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
    setTimeout(advance, 180);
  }

  function handleNumberNext() {
    if (!currentQDef) return;
    const value = answers[currentQDef.key];
    if (value == null || value === '') return;
    advance();
  }

  async function saveAssessment() {
    setSaving(true);
    setError('');
    try {
      const verdict = risk.level === 'High' ? 'POSITIVE' : 'NEGATIVE';
      const riskTier = risk.level === 'High' ? 'HIGH' : risk.level === 'Moderate' ? 'MODERATE' : 'LOW';
      const res = await apiFetch('/api/screening/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verdict,
          risk_tier: riskTier,
          score: risk.score,
          age: answers.age ? Number(answers.age) : undefined,
          parity: answers.births ? Number(answers.births) : undefined,
          vaccination: String(answers.vaccine ?? ''),
          smoking: String(answers.smoking ?? ''),
          hiv_status: String(answers.hiv ?? ''),
          symptoms: String(answers.symptoms ?? ''),
          family_history: String(answers.family ?? ''),
          previous_screening: String(answers.previous ?? ''),
        }),
      });
      if (!res.ok) {
        const e = await res.json();
        setError(e.error || 'Failed to save assessment');
        return;
      }
      setSaved(true);
      setTimeout(() => router.push('/patient/results'), 1500);
    } catch {
      setError('Failed to save assessment. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <style>{`
        @keyframes qIn { from { opacity: 0; transform: translateX(28px); } to { opacity: 1; transform: translateX(0); } }
        .q-anim { animation: qIn 260ms ease-out; }
      `}</style>

      {stage === 'start' && (
        <div className="flex flex-col items-center px-2 pt-8 text-center">
          <div className="mb-5 flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 text-4xl">🛡️</div>
          <h1 className="text-2xl font-extrabold">HPV Risk Assessment</h1>
          <p className="mt-3 text-sm leading-6 text-gray-500">
            Answer a few questions to assess your risk of cervical cancer. Your responses are private and secure. This assessment takes approximately 2-3 minutes.
          </p>
          <div className="mt-6 w-full space-y-2 text-left text-sm text-gray-600">
            {['Adaptive questionnaire', 'Personalized risk score', 'Actionable guidance'].map((f) => (
              <div key={f} className="flex items-center gap-2"><span className="text-green-500">✓</span>{f}</div>
            ))}
          </div>
          <button onClick={() => setStage('questions')}
            className="mt-8 w-full rounded-2xl bg-primary px-6 py-4 font-bold text-white shadow-lg transition-colors hover:bg-primary/90">
            Start Assessment →
          </button>
        </div>
      )}

      {stage === 'questions' && currentQDef && (
        <div className="px-1 pt-4">
          <div className="mb-6">
            <div className="h-1.5 overflow-hidden rounded-full bg-gray-200">
              <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
            <div className="mt-2 flex items-center justify-between text-xs font-semibold text-gray-500">
              <button onClick={() => (currentQ === 0 ? setStage('start') : setCurrentQ((p) => p - 1))} className="text-primary">
                ← Back
              </button>
              <span>Step {currentQ + 1} of {totalVisible}</span>
            </div>
          </div>

          <div key={currentQ} className="q-anim rounded-3xl border bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold leading-7">{currentQDef.title}</h2>

            {currentQDef.type === 'number' ? (
              <input
                type="number"
                inputMode="numeric"
                value={(answers[currentQDef.key] as string | number | null) != null ? String(answers[currentQDef.key]) : ''}
                onChange={(e) => {
                  const sanitized = e.target.value.replace(/[^0-9]/g, '');
                  setAnswers((prev) => ({ ...prev, [currentQDef.key]: sanitized ? parseInt(sanitized, 10) : null }));
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleNumberNext()}
                placeholder="Enter a number"
                className="mt-5 w-full rounded-2xl border-2 border-gray-200 p-4 text-center text-lg font-semibold focus:border-primary focus:outline-none"
              />
            ) : (
              <div className="mt-5 space-y-2.5">
                {currentQDef.options?.map((opt) => {
                  const isSelected = answers[currentQDef.key] === opt.value;
                  return (
                    <button key={opt.value} onClick={() => handleSingle(currentQDef.key, opt.value)}
                      className={`w-full rounded-2xl border-2 px-4 py-3.5 text-center text-sm font-semibold transition-colors ${isSelected ? 'border-primary bg-primary text-white' : 'border-gray-200 bg-gray-50 hover:bg-gray-100'}`}>
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {currentQDef.type === 'number' && (
            <button onClick={handleNumberNext} disabled={answers[currentQDef.key] == null || answers[currentQDef.key] === ''}
              className="mt-4 w-full rounded-2xl bg-primary px-6 py-4 font-bold text-white transition-colors hover:bg-primary/90 disabled:bg-gray-300">
              {isLastQuestion ? 'See Results' : 'Next'} →
            </button>
          )}
        </div>
      )}

      {stage === 'results' && (
        <div className="space-y-4 pb-8">
          <div className="rounded-3xl border bg-white p-6 text-center shadow-sm">
            <h2 className="text-base font-extrabold">Your Risk Index</h2>
            <div className="mt-4 h-5 overflow-hidden rounded-full bg-gray-100">
              <div className={`h-full rounded-full ${guidance.bar}`} style={{ width: `${scorePct * 100}%` }} />
            </div>
            <div className="mt-2 flex items-center justify-between text-[10px] font-bold text-gray-400">
              <span>Low</span><span>High</span>
            </div>
            <div className={`mt-4 inline-block rounded-full border px-5 py-2 text-sm font-extrabold ${guidance.soft}`}>
              {guidance.title} Risk · Score: {risk.score}/{maxScore}
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <h3 className="font-bold">What this means</h3>
            <p className="mt-2 text-sm leading-6 text-gray-600">{guidance.text}</p>
          </div>

          {activeFactors.length > 0 && (
            <div className="rounded-2xl border bg-white p-5 shadow-sm">
              <h3 className="font-bold">Risk Factors Affecting You ({activeFactors.length})</h3>
              <div className="mt-3 space-y-2">
                {activeFactors.map((f) => (
                  <div key={f.label} className="flex items-center gap-2 border-b border-gray-100 pb-2 text-sm text-gray-700">
                    <span className={guidance.bar.replace('bg-', 'text-')}>⚠</span>{f.label}
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

          {!saved ? (
            <button onClick={saveAssessment} disabled={saving}
              className="w-full rounded-2xl bg-primary px-6 py-4 font-bold text-white transition-colors hover:bg-primary/90 disabled:opacity-60">
              {saving ? 'Saving…' : '💾 Save Assessment'}
            </button>
          ) : (
            <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-center text-sm font-semibold text-green-700">
              ✓ Assessment saved successfully
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={() => { setAnswers({}); setCurrentQ(0); setSaved(false); setStage('start'); }}
              className="flex-1 rounded-2xl border px-6 py-3 text-sm font-semibold text-gray-600">
              Take Assessment Again
            </button>
            <Link href="/patient/results" className="flex-1 rounded-2xl bg-gray-100 px-6 py-3 text-center text-sm font-semibold text-gray-700">
              My Results
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
