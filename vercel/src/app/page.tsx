import Link from 'next/link';

export const metadata = {
  title: 'CerviTrack — National Cervical Cancer Screening Registry',
  description: 'Kenya\'s unified cervical cancer screening platform. Track screenings, vaccines, and clinical outcomes across all 47 counties.',
};

const stats = [
  { value: '4,000+', label: 'Women die annually from cervical cancer in Kenya', color: 'text-red-400' },
  { value: '17%', label: 'Current national screening coverage', color: 'text-amber-400' },
  { value: '90%', label: 'Preventable with early detection & HPV vaccination', color: 'text-emerald-400' },
  { value: '47', label: 'Counties connected to the registry', color: 'text-sky-300' },
  { value: '100%', label: 'Free for all Kenyan women', color: 'text-white' },
];

const portals = [
  {
    title: 'Patient Mobile App',
    subtitle: 'Android APK & iOS',
    desc: 'Track your screening history, receive reminders, view lab results, and chat with your healthcare provider — all from your phone.',
    features: ['Risk assessment questionnaire', 'Vaccine & appointment reminders', 'Secure provider messaging', 'Offline data storage'],
    color: 'from-sky-500 to-sky-700',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
      </svg>
    ),
    href: '#download-apk',
    cta: 'Download APK',
  },
  {
    title: 'Lab Technician PWA',
    subtitle: 'Offline-First Browser App',
    desc: 'Enter cytology and HPV results from any device. Works offline in low-connectivity labs with automatic batch sync when back online.',
    features: ['Offline result entry', 'Automatic batch sync', 'Specimen tracking', 'Quality assurance flags'],
    color: 'from-violet-500 to-violet-700',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
      </svg>
    ),
    href: '/lab',
    cta: 'Open Lab PWA',
  },
  {
    title: 'Clinician Workspace',
    subtitle: 'Web-Based Point-of-Care',
    desc: 'Manage patient records, capture VIA images, create screenings, make diagnoses, and coordinate referrals — optimized for clinic tablets.',
    features: ['VIA image capture & annotation', 'Clinical protocol workflows', 'Referral management', 'DHIS2 reporting integration'],
    color: 'from-emerald-500 to-emerald-700',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
      </svg>
    ),
    href: '/workspace',
    cta: 'Open Workspace',
  },
  {
    title: 'Sample Kit Tracking',
    subtitle: 'Barcode-Based Chain of Custody',
    desc: 'Track every sample kit from registration to lab results. Scan barcodes at each stage — pairing, collection, transit, lab receipt, and processing.',
    features: ['QR/barcode scanning at every stage', 'Real-time movement tracking', 'Chain of custody audit trail', 'Patient self-collection confirmation'],
    color: 'from-cyan-500 to-cyan-700',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75z" />
      </svg>
    ),
    href: '/workspace?tab=kits',
    cta: 'Open Kit Tracker',
  },
  {
    title: 'Clinician Portal',
    subtitle: 'Doctor Dashboard',
    desc: 'Manage your patients, chat with them, view records, book appointments, and handle scheduling — all in one place.',
    features: ['Patient records & history', 'Secure messaging', 'Appointment management', 'Notification reminders'],
    color: 'from-blue-500 to-blue-700',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
    href: '/clinician',
    cta: 'Open Clinician Portal',
  },
  {
    title: 'Administrative Panels',
    subtitle: 'County & National Surveillance',
    desc: 'Real-time dashboards for screening coverage, disease burden, facility performance, and aggregate reporting across all 47 counties.',
    features: ['Live aggregate dashboards', 'County & national roll-ups', 'DHIS2 export & MOH reporting', 'User & facility management'],
    color: 'from-amber-500 to-amber-700',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
    href: '/admin',
    cta: 'Open Admin Panel',
  },
];

const continuumSteps = [
  { step: '1', label: 'Risk Assessment', desc: 'WHO-based questionnaire identifies high-risk women', color: 'bg-sky-500', detail: 'Women aged 25-65 answer questions about sexual history, HIV status, and symptoms. AI assigns risk tier.' },
  { step: '2', label: 'Screening', desc: 'VIA, Pap smear, or HPV DNA test at nearest facility', color: 'bg-violet-500', detail: 'Results captured digitally at point of care. Lab techs enter cytology results via offline PWA.' },
  { step: '3', label: 'Diagnosis', desc: 'Colposcopy and biopsy for screen-positive cases', color: 'bg-amber-500', detail: 'Clinicians document CIN staging, histopathology results, and classify disease severity.' },
  { step: '4', label: 'Treatment', desc: 'LEEP, cryotherapy, or surgical intervention as needed', color: 'bg-emerald-500', detail: 'Treatment protocols follow Kenya MOH guidelines. Outcomes tracked for follow-up scheduling.' },
  { step: '5', label: 'Follow-Up', desc: 'Scheduled monitoring and post-treatment surveillance', color: 'bg-rose-500', detail: 'Automated reminders ensure patients return for scheduled follow-ups and repeat screenings.' },
];

const features = [
  {
    title: '7-Tier Access Control',
    desc: 'Role-based access from patient to system administrator with Kenya MOH compliance.',
    icon: (
      <svg className="w-7 h-7 text-sky-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
  },
  {
    title: 'DHIS2 / MOH Integration',
    desc: 'Automated aggregate reporting to Kenya\'s national health information system.',
    icon: (
      <svg className="w-7 h-7 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
  },
  {
    title: 'Offline-First Sync',
    desc: 'Lab PWA works without internet. Data batches automatically sync when reconnected.',
    icon: (
      <svg className="w-7 h-7 text-violet-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
      </svg>
    ),
  },
  {
    title: 'Clinical Protocols',
    desc: 'VIA, Pap, HPV DNA, colposcopy, LEEP, and cryotherapy workflows guided by Kenya guidelines.',
    icon: (
      <svg className="w-7 h-7 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
      </svg>
    ),
  },
  {
    title: 'Secure Messaging',
    desc: 'Encrypted patient-provider communication with full audit trail.',
    icon: (
      <svg className="w-7 h-7 text-sky-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.068.157 2.148.279 3.238.364.466.037.893.281 1.153.671L12 21l2.652-3.978c.26-.39.687-.634 1.153-.671 1.09-.085 2.17-.207 3.238-.364 1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
      </svg>
    ),
  },
  {
    title: 'Medical Image Vault',
    desc: 'Cloudinary-powered secure storage for VIA images and clinical photographs.',
    icon: (
      <svg className="w-7 h-7 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
      </svg>
    ),
  },
];

const faqs = [
  { q: 'Is CerviTrack free?', a: 'Yes. CerviTrack is completely free for all users — patients, clinicians, and administrators. No hidden fees, no subscriptions.' },
  { q: 'Is my health data private?', a: 'Absolutely. Your health data is encrypted at rest and in transit. We comply with Kenya\'s Data Protection Act (2019) and never share data without your explicit consent.' },
  { q: 'Do I need internet to use the app?', a: 'The Patient APK and Lab PWA both work offline. Your data is stored securely on-device and syncs automatically when you reconnect to the internet.' },
  { q: 'What phones are supported?', a: 'The Patient APK works on any Android phone running Android 6.0 or later (~15 MB). The web panels work in any modern browser.' },
  { q: 'How does offline lab sync work?', a: 'When offline, lab results are queued in IndexedDB. When connectivity returns, the PWA triggers a batch sync to the central server in one transaction. Conflicts are resolved server-side.' },
  { q: 'Which clinical protocols are supported?', a: 'CerviTrack supports VIA, Pap smear, HPV DNA testing, colposcopy, LEEP, and cryotherapy — all following Kenya MOH clinical guidelines.' },
  { q: 'How does DHIS2 reporting work?', a: 'Facility administrators can export monthly aggregate reports in DHIS2-compatible format. National-level summaries auto-generate from facility data.' },
  { q: 'Where can I get screened?', a: 'The app lists partner health facilities near you with directions, hours, and available services. You can also book appointments directly through CerviTrack.' },
];

const timeline = [
  { date: '2024', event: 'Project inception with Kenya MOH' },
  { date: '2025 Q1', event: 'Pilot launch in 3 counties' },
  { date: '2025 Q3', event: 'Expansion to 15 counties' },
  { date: '2026', event: 'National rollout — all 47 counties' },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white text-gray-800">
      {/* ── Endorsement Banner ── */}
      <div className="bg-sky-900 text-sky-200 text-xs text-center py-2 px-4">
        <span className="font-semibold text-white">Supported by the Ministry of Health, Kenya</span>
        {' '}&middot; Aligned with Kenya Health Policy 2014-2030 &middot; WHO Cervical Cancer Elimination Strategy
      </div>

      {/* ── Nav ── */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto border-b border-gray-100">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-sky-700 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
          </div>
          <span className="text-xl font-bold text-sky-800">CerviTrack</span>
        </Link>
        <div className="hidden md:flex items-center gap-6">
          <a href="#continuum" className="text-gray-600 hover:text-sky-700 text-sm font-medium">How It Works</a>
          <a href="#portals" className="text-gray-600 hover:text-sky-700 text-sm font-medium">Portals</a>
          <Link href="/library" className="text-gray-600 hover:text-sky-700 text-sm font-medium">Library</Link>
          <a href="#faq" className="text-gray-600 hover:text-sky-700 text-sm font-medium">FAQ</a>
          <Link href="/privacy" className="text-gray-600 hover:text-sky-700 text-sm font-medium">Privacy</Link>
        </div>
        <a href="#download-apk" className="bg-sky-700 text-white px-5 py-2 rounded-lg font-medium hover:bg-sky-800 text-sm">
          Get the App
        </a>
      </nav>

      {/* ── Hero ── */}
      <header id="download-apk" className="max-w-7xl mx-auto px-6 pt-16 pb-20">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold px-4 py-1.5 rounded-full mb-6">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              National Cervical Cancer Screening Registry
            </div>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight text-sky-900">
              Eliminating cervical cancer through{' '}
              <span className="text-emerald-600">unified digital screening.</span>
            </h1>
            <p className="mt-6 text-lg text-gray-600 max-w-lg leading-relaxed">
              CerviTrack connects every step of the cervical care continuum — from risk assessment to treatment follow-up — across all 47 counties. Built for Kenyan women, Kenyan clinicians, and Kenya&apos;s health system.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="#"
                className="bg-sky-700 text-white px-8 py-4 rounded-xl font-semibold hover:bg-sky-800 flex items-center gap-3 text-lg shadow-lg shadow-sky-200"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M3 20.5v-17A1.5 1.5 0 014.5 2h15A1.5 1.5 0 0121 3.5v17l-9-4-9 4z"/></svg>
                Download APK
              </a>
              <Link
                href="/auth"
                className="border-2 border-sky-700 text-sky-700 px-8 py-4 rounded-xl font-semibold hover:bg-sky-50 text-lg"
              >
                Sign Up on Web
              </Link>
            </div>
            <p className="mt-4 text-xs text-gray-400 flex items-center gap-4">
              <span>Android 6.0+</span>
              <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
              <span>~15 MB</span>
              <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
              <span>Works offline</span>
              <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span> All systems operational</span>
            </p>
          </div>

          {/* Phone mockup */}
          <div className="hidden md:flex justify-center">
            <div className="relative">
              <div className="w-72 h-[520px] bg-gradient-to-b from-sky-100 via-sky-50 to-emerald-100 rounded-[3rem] border-4 border-gray-200 shadow-2xl flex items-center justify-center overflow-hidden">
                <div className="text-center px-8">
                  <div className="w-20 h-20 bg-sky-700 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg">
                    <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                    </svg>
                  </div>
                  <p className="font-bold text-sky-900 text-xl">CerviTrack</p>
                  <p className="text-sm text-gray-500 mt-2">Cervical Health Registry</p>
                  <div className="mt-6 space-y-2">
                    <div className="bg-white/80 rounded-lg p-3 text-left text-xs">
                      <span className="text-emerald-600 font-semibold">Next Screening</span>
                      <p className="text-gray-700 mt-0.5">VIA — July 2026</p>
                    </div>
                    <div className="bg-white/80 rounded-lg p-3 text-left text-xs">
                      <span className="text-sky-600 font-semibold">HPV Vaccine</span>
                      <p className="text-gray-700 mt-0.5">Dose 2 of 2 — Complete</p>
                    </div>
                    <div className="bg-white/80 rounded-lg p-3 text-left text-xs">
                      <span className="text-amber-600 font-semibold">Lab Results</span>
                      <p className="text-gray-700 mt-0.5">Awaiting cytology results</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-emerald-100 rounded-full blur-3xl opacity-60"></div>
              <div className="absolute -top-4 -left-4 w-24 h-24 bg-sky-100 rounded-full blur-2xl opacity-60"></div>
            </div>
          </div>
        </div>
      </header>

      {/* ── Stats Ticker ── */}
      <section className="bg-sky-900 text-white py-14">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-8">
            <h2 className="text-sm font-semibold text-sky-300 uppercase tracking-wider">Why CerviTrack Exists</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className={`text-3xl md:text-4xl font-bold ${s.color}`}>{s.value}</div>
                <div className="mt-2 text-xs text-sky-300 leading-snug">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Care Continuum ── */}
      <section id="continuum" className="py-24 bg-gradient-to-b from-white to-sky-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-sky-900">The Cervical Care Continuum</h2>
            <p className="mt-3 text-gray-500 max-w-2xl mx-auto">CerviTrack digitizes every step — from identifying at-risk women to tracking treatment outcomes.</p>
          </div>

          {/* Desktop: connected pipeline */}
          <div className="hidden md:block">
            <div className="relative flex items-start justify-between gap-4">
              {/* Connector line */}
              <div className="absolute top-8 left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-sky-300 via-violet-300 via-amber-300 via-emerald-300 to-rose-300"></div>
              {continuumSteps.map((s, i) => (
                <div key={s.step} className="relative flex-1 text-center">
                  <div className={`w-16 h-16 ${s.color} rounded-full flex items-center justify-center mx-auto text-white font-bold text-xl shadow-lg z-10 relative`}>
                    {s.step}
                  </div>
                  <h3 className="mt-4 font-semibold text-sky-900 text-sm">{s.label}</h3>
                  <p className="mt-1 text-xs text-gray-500 leading-relaxed max-w-[180px] mx-auto">{s.desc}</p>
                  <p className="mt-2 text-xs text-gray-400 italic leading-relaxed max-w-[180px] mx-auto">{s.detail}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile: stacked */}
          <div className="md:hidden space-y-6">
            {continuumSteps.map((s) => (
              <div key={s.step} className="flex gap-4 items-start">
                <div className={`w-12 h-12 ${s.color} rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg shrink-0`}>
                  {s.step}
                </div>
                <div>
                  <h3 className="font-semibold text-sky-900">{s.label}</h3>
                  <p className="text-sm text-gray-600 mt-1">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Portal Access Breakout ── */}
      <section id="portals" className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-sky-900">One System, Five Portals</h2>
            <p className="mt-3 text-gray-500 max-w-2xl mx-auto">Every stakeholder gets a purpose-built interface — all reading from and writing to the same unified database.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {portals.map((p) => (
              <div key={p.title} className="rounded-2xl border border-gray-100 bg-white p-8 hover:shadow-xl transition-all duration-300 group">
                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 bg-gradient-to-br ${p.color} rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-transform`}>
                    {p.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-sky-900">{p.title}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{p.subtitle}</p>
                  </div>
                </div>
                <p className="mt-4 text-sm text-gray-600 leading-relaxed">{p.desc}</p>
                <ul className="mt-4 space-y-2">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                      <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="mt-6">
                  <a href={p.href} className="inline-flex items-center gap-2 text-sky-700 font-semibold text-sm hover:underline">
                    {p.cta}
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features Grid ── */}
      <section className="py-24 bg-sky-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-sky-900">Built for Compliance & Scale</h2>
            <p className="mt-3 text-gray-500 max-w-2xl mx-auto">Enterprise-grade features designed for Kenya&apos;s health information ecosystem.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((f) => (
              <div key={f.title} className="p-6 rounded-2xl bg-white border border-sky-100 hover:shadow-md transition-shadow">
                <div className="mb-4">{f.icon}</div>
                <h3 className="font-semibold text-sky-900">{f.title}</h3>
                <p className="mt-2 text-sm text-gray-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Download CTA ── */}
      <section className="py-20 bg-emerald-600 text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">Download CerviTrack Today</h2>
          <p className="text-emerald-100 mb-8 max-w-xl mx-auto">
            Free, private, and built for Kenyan women. Take control of your cervical health with screenings, vaccines, and doctor access — all in your pocket.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="#"
              className="bg-white text-emerald-700 px-8 py-4 rounded-xl font-semibold hover:bg-emerald-50 flex items-center gap-3 text-lg shadow-lg"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M3 20.5v-17A1.5 1.5 0 014.5 2h15A1.5 1.5 0 0121 3.5v17l-9-4-9 4z"/></svg>
              Download APK
            </a>
            <Link
              href="/auth"
              className="border-2 border-white text-white px-8 py-4 rounded-xl font-semibold hover:bg-emerald-700 text-lg"
            >
              Sign Up on Web
            </Link>
          </div>
          <p className="mt-4 text-emerald-200 text-sm">Android 6.0+ &middot; ~15 MB &middot; Works offline</p>
        </div>
      </section>

      {/* ── Health Library Preview ── */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold text-sky-900">Health Library</h2>
              <p className="text-gray-500 mt-1">Evidence-based articles on cervical health, HPV, and prevention — in English and Swahili.</p>
            </div>
            <Link href="/library" className="text-sky-700 font-semibold hover:underline hidden md:block">View all articles →</Link>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: 'What is HPV?', category: 'HPV & Causes', summary: 'Human papillomavirus is the leading cause of cervical cancer. Learn about the types, how it spreads, and why vaccination matters.', readTime: '5 min' },
              { title: 'Cervical Cancer Screening Methods', category: 'Screening', summary: 'Pap smear, HPV DNA test, or visual inspection? Understand which screening method is right for you based on Kenya MOH guidelines.', readTime: '6 min' },
              { title: 'HPV Vaccination in Kenya', category: 'Vaccines', summary: 'The HPV vaccine is free for girls aged 10-14 in Kenya. Learn about the schedule, safety, and where to get it near you.', readTime: '4 min' },
            ].map((a) => (
              <Link key={a.title} href="/library" className="p-6 rounded-2xl border border-gray-100 bg-white hover:shadow-lg transition-all duration-300 block group">
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">{a.category}</span>
                <h3 className="mt-4 font-semibold text-lg text-sky-900 group-hover:text-sky-700">{a.title}</h3>
                <p className="mt-2 text-sm text-gray-600 leading-relaxed">{a.summary}</p>
                <p className="mt-4 text-xs text-gray-400">{a.readTime} read</p>
              </Link>
            ))}
          </div>
          <div className="mt-8 text-center md:hidden">
            <Link href="/library" className="text-sky-700 font-semibold hover:underline">View all articles →</Link>
          </div>
        </div>
      </section>

      {/* ── Timeline ── */}
      <section className="py-20 bg-sky-900 text-white">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-center mb-12">Our Journey</h2>
          <div className="relative">
            <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-0.5 bg-sky-700"></div>
            <div className="space-y-10">
              {timeline.map((t, i) => (
                <div key={t.date} className={`relative flex items-center gap-6 ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} md:justify-center`}>
                  <div className="w-3 h-3 bg-emerald-400 rounded-full absolute left-[18px] md:left-1/2 md:-translate-x-1/2 z-10 ring-4 ring-sky-900"></div>
                  <div className={`ml-14 md:ml-0 md:w-[45%] ${i % 2 === 0 ? 'md:text-right md:pr-12' : 'md:text-left md:pl-12'}`}>
                    <div className="text-sm font-semibold text-emerald-400">{t.date}</div>
                    <div className="text-sky-100 mt-1">{t.event}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-24 bg-sky-50">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12 text-sky-900">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((f) => (
              <details key={f.q} className="bg-white rounded-xl border border-sky-100 p-6 group">
                <summary className="font-semibold text-sky-900 cursor-pointer list-none flex items-center justify-between">
                  {f.q}
                  <svg className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform shrink-0 ml-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </summary>
                <p className="mt-3 text-sm text-gray-600">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── Privacy ── */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold mb-4 text-sky-900">Your privacy matters</h2>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            CerviTrack is built with privacy at its core. Your health data is encrypted, never sold,
            and only shared with your consent. We comply with Kenya&apos;s Data Protection Act (2019) and WHO data governance standards.
          </p>
          <Link href="/privacy" className="text-sky-700 font-semibold hover:underline">Read our full Privacy Policy →</Link>
        </div>
      </section>

      {/* ── Institutional Footer ── */}
      <footer className="py-12 border-t border-gray-200 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-10 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-sky-700 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                  </svg>
                </div>
                <span className="text-lg font-bold text-sky-800">CerviTrack</span>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed">
                Kenya&apos;s national cervical cancer screening registry. Built for every woman, every clinician, every county.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-sky-900 mb-3 text-sm">Portals</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><a href="#download-apk" className="hover:text-sky-700">Patient APK</a></li>
                <li><a href="/lab" className="hover:text-sky-700">Lab Technician PWA</a></li>
                <li><a href="/workspace" className="hover:text-sky-700">Clinician Workspace</a></li>
                <li><a href="/admin" className="hover:text-sky-700">Admin Panel</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sky-900 mb-3 text-sm">Resources</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><Link href="/library" className="hover:text-sky-700">Health Library</Link></li>
                <li><Link href="/privacy" className="hover:text-sky-700">Privacy Policy</Link></li>
                <li><a href="#faq" className="hover:text-sky-700">FAQ</a></li>
                <li><Link href="/auth" className="hover:text-sky-700">Sign In</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sky-900 mb-3 text-sm">Alignment</h4>
              <ul className="space-y-2 text-xs text-gray-400 leading-relaxed">
                <li>Kenya Health Policy 2014-2030</li>
                <li>WHO Cervical Cancer Elimination Strategy</li>
                <li>Kenya Data Protection Act (2019)</li>
                <li>DHIS2 / MOH Reporting Standards</li>
                <li>Kenya Digital Health Strategy</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <span className="text-gray-400 text-xs">&copy; {new Date().getFullYear()} CerviTrack. All rights reserved. A product of 3C Network for Oncology & Digital Health (3CN-O4D).</span>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
              System Status: Operational
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
