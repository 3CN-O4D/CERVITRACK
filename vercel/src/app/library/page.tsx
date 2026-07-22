'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Article {
  id: string;
  title: string;
  category: string;
  summary: string;
  content: string;
  readTime: string;
  tags: string[];
}

const articles: Article[] = [
  {
    id: '1', title: 'What is HPV?', category: 'HPV & Causes',
    summary: 'Human papillomavirus is the leading cause of cervical cancer worldwide.',
    content: 'Human papillomavirus (HPV) is the most common sexually transmitted infection globally. There are over 200 types of HPV, but types 16 and 18 cause approximately 70% of cervical cancers. In Kenya, HPV prevalence among women aged 15-49 is estimated at 25%. HPV is transmitted through skin-to-skin sexual contact. Most infections clear on their own within two years, but persistent high-risk infections can lead to cervical cancer over 10-15 years. HPV also causes other cancers including vulvar, vaginal, anal, penile, and oropharyngeal cancers.',
    readTime: '5 min', tags: ['HPV', 'causes', 'transmission', 'cancer'],
  },
  {
    id: '2', title: 'Cervical Cancer Screening Methods', category: 'Screening',
    summary: 'Understanding Pap smear, HPV DNA test, and visual inspection methods.',
    content: 'Kenya offers three primary screening methods: (1) Visual Inspection with Acetic Acid (VIA) — the most widely available method, performed by trained nurses at primary health facilities. A solution of 3-5% acetic acid is applied to the cervix, and abnormal areas turn white. Results are available immediately. (2) Pap Smear — collects cells from the cervix for laboratory analysis. Requires a trained clinician and lab infrastructure. Recommended every 3 years for women 21-65. (3) HPV DNA Test — detects high-risk HPV types directly. Most sensitive method, can be self-collected. Recommended every 5-10 years for women 30-65. WHO now recommends HPV DNA testing as the preferred primary screening method.',
    readTime: '6 min', tags: ['screening', 'VIA', 'Pap smear', 'HPV DNA', 'methods'],
  },
  {
    id: '3', title: 'HPV Vaccination in Kenya', category: 'Vaccines',
    summary: 'The HPV vaccine is free for girls aged 10-14 through Kenya\'s national immunization program.',
    content: 'Kenya introduced the HPV vaccine into its national immunization program in 2019. The vaccine targets HPV types 16 and 18, which cause approximately 70% of cervical cancers. Target group: Girls aged 10-14 years (before becoming sexually active). Schedule: Two doses, 6-12 months apart. Where to get it: All public health facilities, outreach campaigns in schools. Safety: The HPV vaccine has been administered to over 300 million people globally with an excellent safety profile. It does not cause infertility, promiscuity, or other social harms. Effectiveness: When given before HPV exposure, the vaccine is nearly 100% effective at preventing infection with the targeted HPV types.',
    readTime: '4 min', tags: ['vaccine', 'HPV', 'Kenya', 'immunization', 'girls'],
  },
  {
    id: '4', title: 'Understanding Your Screening Results', category: 'Results',
    summary: 'What abnormal results mean and what steps to take next.',
    content: 'Normal/Negative: No abnormal cells detected. Continue routine screening as recommended (every 3-5 years depending on method). Abnormal/Positive: This does NOT mean you have cancer. It means abnormal cells were found that need further evaluation. Next steps may include: Colposcopy — a closer examination of the cervix using a magnifying instrument. Biopsy — taking a small tissue sample for laboratory analysis. Treatment: If precancerous cells (CIN1, CIN2, CIN3) are found, treatment options include LEEP (Loop Electrosurgical Excision Procedure) or cryotherapy. In Kenya, screen-and-treat protocols allow same-day treatment for eligible cases.',
    readTime: '5 min', tags: ['results', 'abnormal', 'follow-up', 'treatment'],
  },
  {
    id: '5', title: 'CIN Staging and What It Means', category: 'Diagnosis',
    summary: 'Cervical Intraepithelial Neoplasia grades explained in plain language.',
    content: 'Cervical Intraepithelial Neoplasia (CIN) describes precancerous changes in the cervix: CIN1 (Low-grade): Mild dysplasia — abnormal cells in the lower third of the epithelium. Usually resolves on its own. Monitoring recommended. CIN2 (High-grade): Moderate dysplasia — abnormal cells in the middle third. Treatment recommended, especially in HIV-positive women. CIN3/CIS (High-grade): Severe dysplasia or carcinoma in situ — abnormal cells throughout the full thickness. Treatment essential to prevent progression to invasive cancer. Key point: The progression from CIN3 to invasive cervical cancer typically takes 10-15 years, providing a wide window for detection and treatment.',
    readTime: '5 min', tags: ['CIN', 'staging', 'diagnosis', 'precancerous'],
  },
  {
    id: '6', title: 'LEEP and Cryotherapy: Treatment Options', category: 'Treatment',
    summary: 'Safe, effective outpatient procedures for precancerous cervical lesions.',
    content: 'LEEP (Loop Electrosurgical Excision Procedure): Uses a thin wire loop with electrical current to remove abnormal tissue. Takes 10-20 minutes, performed under local anesthesia. Over 90% effective at removing precancerous cells. Recovery: 4-6 weeks. Cryotherapy: Freezes abnormal cells using a probe cooled to -50°C. Best for smaller lesions without involvement of the endocervical canal. Quick procedure, minimal pain. Same-day treatment possible in screen-and-treat programs. Both procedures are available at county hospitals and sub-county hospitals in Kenya. For HIV-positive women, immediate treatment is recommended regardless of CIN grade.',
    readTime: '5 min', tags: ['LEEP', 'cryotherapy', 'treatment', 'procedure'],
  },
  {
    id: '7', title: 'Cervical Cancer Prevention: A Complete Guide', category: 'Prevention',
    summary: 'Three pillars of prevention: vaccination, screening, and treatment of precancerous lesions.',
    content: 'WHO\'s strategy to eliminate cervical cancer as a public health problem rests on three pillars: Pillar 1 — HPV Vaccination: Ensure 90% of girls are vaccinated by age 15. Kenya\'s coverage is currently ~30% — significant room for improvement. Pillar 2 — Screening: Ensure 70% of women are screened with a high-performance test by ages 35 and 45. Kenya\'s current coverage is ~17%. Pillar 3 — Treatment: Ensure 90% of women identified with cervical disease receive treatment. Additional prevention measures: Safe sexual practices (condoms reduce HPV transmission), limiting number of sexual partners, not smoking (smoking doubles cervical cancer risk), regular screening, HIV prevention and treatment (HIV-positive women are 6x more likely to develop cervical cancer).',
    readTime: '7 min', tags: ['prevention', 'WHO', 'strategy', 'vaccination', 'screening'],
  },
  {
    id: '8', title: 'Cervical Cancer and HIV', category: 'HIV & Cervical Cancer',
    summary: 'Why HIV-positive women face higher risk and need more frequent screening.',
    content: 'HIV-positive women are 6 times more likely to develop cervical cancer due to: Weakened immune system unable to clear HPV infections, Higher rates of persistent high-risk HPV infections, Faster progression from precancerous lesions to invasive cancer. Kenya\'s screening guidelines for HIV-positive women: Annual screening starting at age 25 (vs. every 3-5 years for HIV-negative women). Immediate treatment for any precancerous lesion, regardless of grade. ART adherence is critical — immune reconstitution from antiretroviral therapy helps the body fight HPV. CerviTrack tracks HIV status (with patient consent) to ensure appropriate screening frequency.',
    readTime: '6 min', tags: ['HIV', 'risk', 'screening', 'ART', 'immune system'],
  },
  {
    id: '9', title: 'The Kenya National Cervical Cancer Control Program', category: 'Kenya Context',
    summary: 'How Kenya is organized to fight cervical cancer at national and county levels.',
    content: 'Kenya\'s National Cervical Cancer Control Program operates under the Ministry of Health, Division of Reproductive and Maternal Health. Key components: National level: Policy development, guidelines, procurement of supplies, DHIS2 reporting, training curriculum. County level: Implementation through County Health Management Teams (CHMTs), screening services at level 2-5 facilities, referral networks to county hospitals. Facility level: Nurses trained in VIA at primary care facilities, clinicians performing Pap smears and colposcopy at secondary facilities, LEEP and cryotherapy at county hospitals. CerviTrack serves as the digital backbone connecting these levels, enabling real-time data flow from facility to county to national dashboards.',
    readTime: '6 min', tags: ['Kenya', 'MOH', 'program', 'county', 'policy'],
  },
  {
    id: '10', title: 'Self-Collection for HPV Testing', category: 'Screening',
    summary: 'How HPV self-sampling works and why it\'s a game-changer for Kenya.',
    content: 'HPV self-collection allows women to collect their own vaginal sample for HPV DNA testing, eliminating the need for a clinician-administered speculum exam. How it works: A woman inserts a small brush into her vagina, rotates it for 30 seconds, and places the brush in a collection tube. The sample is sent to a lab for HPV DNA testing. Why it matters for Kenya: Overcomes barriers of clinic access, privacy concerns, and shortage of trained providers. Studies show higher uptake compared to clinician-collected samples, especially in rural areas. WHO recommends self-collection as an acceptable alternative to clinician collection. CerviTrack facilitates self-collection by tracking sample submission and delivering results digitally.',
    readTime: '4 min', tags: ['self-collection', 'HPV', 'screening', 'access'],
  },
  {
    id: '11', title: 'Post-Treatment Follow-Up After LEEP or Cryotherapy', category: 'Treatment',
    summary: 'Why follow-up visits are critical after treatment for precancerous lesions.',
    content: 'After treatment (LEEP or cryotherapy), follow-up is essential: First follow-up: 6 months after treatment — HPV test and/or Pap smear. If negative: Continue annual screening for at least 25 years. If positive: Colposcopy and possible re-treatment. Why long-term follow-up? Treatment failure rates are 5-15%. Recurrence risk is higher in HIV-positive women. New HPV infections can develop over time. What to watch for: Abnormal bleeding, unusual discharge, pelvic pain — report these immediately. CerviTrack sends automated reminders for scheduled follow-up visits so no woman falls through the cracks.',
    readTime: '5 min', tags: ['follow-up', 'treatment', 'LEEP', 'cryotherapy'],
  },
  {
    id: '12', title: 'Frequently Asked Questions about Cervical Cancer', category: 'FAQ',
    summary: 'Answers to the most common questions about cervical cancer screening and prevention.',
    content: 'Q: Can I get cervical cancer if I\'ve had a hysterectomy? A: If your cervix was removed (total hysterectomy) and you had no precancerous cells, screening may no longer be needed. If it was a partial hysterectomy (cervix left), continue screening. Q: Does HPV mean I have cancer? A: No. HPV is extremely common — 80% of women will have it at some point. Most infections clear naturally. Only persistent infections with high-risk types can lead to cancer. Q: I\'m over 65 — do I still need screening? A: If you\'ve had regular screening with normal results, you may stop at 65. If you\'ve never been screened, screening is recommended. Q: Can men get cervical cancer? A: No, but men carry and transmit HPV. Vaccinating boys helps protect partners.',
    readTime: '5 min', tags: ['FAQ', 'questions', 'answers', 'common concerns'],
  },
];

const categories = [...new Set(articles.map((a) => a.category))];

export default function LibraryPage() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [expandedArticle, setExpandedArticle] = useState<string | null>(null);

  const filtered = articles.filter((a) => {
    const matchesSearch = !search || a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.summary.toLowerCase().includes(search.toLowerCase()) ||
      a.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = !activeCategory || a.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-lg font-bold text-sky-700">CerviTrack</Link>
            <span className="text-gray-300">|</span>
            <span className="text-sm font-medium text-gray-600">Health Library</span>
          </div>
          <Link href="/" className="text-sm text-gray-500 hover:text-sky-700">Home</Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Hero */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-sky-900">Cervical Health Library</h1>
          <p className="text-gray-500 mt-2 max-w-xl mx-auto">
            Evidence-based information about HPV, cervical cancer screening, treatment, and prevention — tailored for Kenya.
          </p>
        </div>

        {/* Search & Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-8">
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search articles, topics, or keywords..."
            className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm mb-4" />
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setActiveCategory('')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                !activeCategory ? 'bg-sky-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>All</button>
            {categories.map((c) => (
              <button key={c} onClick={() => setActiveCategory(c)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  activeCategory === c ? 'bg-sky-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}>{c}</button>
            ))}
          </div>
        </div>

        {/* Results Count */}
        <p className="text-sm text-gray-400 mb-4">{filtered.length} article{filtered.length !== 1 ? 's' : ''} found</p>

        {/* Articles */}
        <div className="space-y-4">
          {filtered.map((a) => (
            <div key={a.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <button onClick={() => setExpandedArticle(expandedArticle === a.id ? null : a.id)}
                className="w-full text-left p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">{a.category}</span>
                      <span className="text-xs text-gray-400">{a.readTime} read</span>
                    </div>
                    <h3 className="font-semibold text-lg text-gray-900">{a.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">{a.summary}</p>
                  </div>
                  <svg className={`w-5 h-5 text-gray-400 shrink-0 ml-4 transition-transform ${expandedArticle === a.id ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </div>
              </button>

              {expandedArticle === a.id && (
                <div className="px-6 pb-6 border-t border-gray-100">
                  <div className="pt-4 text-sm text-gray-600 leading-relaxed whitespace-pre-line">{a.content}</div>
                  <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
                    {a.tags.map((t) => (
                      <span key={t} className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-sky-50 text-sky-700">{t}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-500 font-medium">No articles match your search</p>
            <p className="text-sm text-gray-400 mt-1">Try different keywords or clear filters</p>
          </div>
        )}

        {/* Disclaimer */}
        <div className="mt-12 bg-amber-50 border border-amber-200 rounded-xl p-6">
          <h3 className="font-semibold text-amber-800 mb-2">Medical Disclaimer</h3>
          <p className="text-sm text-amber-700">
            This library provides general health information for educational purposes. It is not a substitute
            for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare
            provider for personalized medical guidance. If you have concerns about your cervical health,
            please visit your nearest health facility or use the CerviTrack app to connect with a provider.
          </p>
        </div>
      </main>
    </div>
  );
}
