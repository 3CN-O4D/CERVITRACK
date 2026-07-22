import Link from 'next/link';

export const metadata = {
  title: 'CerviTrack — Cervical Health for Kenyan Women',
  description: 'Track screenings, vaccines, appointments, and get AI-powered cervical health guidance — all in one app built for Kenya.',
};

const features = [
  {
    title: 'Risk Assessment',
    desc: 'Answer a short questionnaire and get your risk tier instantly, powered by WHO guidelines.',
    icon: (
      <svg className="w-8 h-8 text-sky-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
  },
  {
    title: 'Vaccine Tracker',
    desc: 'Never miss an HPV vaccine dose with smart reminders and schedule tracking.',
    icon: (
      <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
      </svg>
    ),
  },
  {
    title: 'Lab Results',
    desc: 'View screening results directly in the app with clear follow-up guidance.',
    icon: (
      <svg className="w-8 h-8 text-sky-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
  },
  {
    title: 'Secure Messaging',
    desc: 'Chat privately with nurses, gynecologists, and community health workers.',
    icon: (
      <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.068.157 2.148.279 3.238.364.466.037.893.281 1.153.671L12 21l2.652-3.978c.26-.39.687-.634 1.153-.671 1.09-.085 2.17-.207 3.238-.364 1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
      </svg>
    ),
  },
  {
    title: 'Health Library',
    desc: 'Read localized articles about HPV, screening, and cervical cancer prevention.',
    icon: (
      <svg className="w-8 h-8 text-sky-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
      </svg>
    ),
  },
  {
    title: 'Offline First',
    desc: 'Your data is stored safely on-device and syncs automatically when reconnected.',
    icon: (
      <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
      </svg>
    ),
  },
];

const steps = [
  {
    num: '01',
    title: 'Sign Up',
    desc: 'Create your free account in seconds. All you need is a name and email.',
  },
  {
    num: '02',
    title: 'Complete Your Profile',
    desc: 'Take a quick risk assessment and enter your vaccination history.',
  },
  {
    num: '03',
    title: 'Stay On Track',
    desc: 'Get reminders for screenings, vaccines, and appointments. Chat with your provider anytime.',
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-emerald-50 text-gray-800">
      <nav className="flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <Link href="/" className="text-xl font-bold text-sky-700">CerviTrack</Link>
        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-gray-600 hover:text-sky-700 text-sm font-medium">Features</a>
          <a href="#how-it-works" className="text-gray-600 hover:text-sky-700 text-sm font-medium">How It Works</a>
          <Link href="/privacy" className="text-gray-600 hover:text-sky-700 text-sm font-medium">Privacy</Link>
          <a href="#about" className="text-gray-600 hover:text-sky-700 text-sm font-medium">About</a>
        </div>
        <Link href="/auth" className="bg-sky-700 text-white px-5 py-2 rounded-lg font-medium hover:bg-sky-800 text-sm">
          Get Started
        </Link>
      </nav>

      <header className="max-w-6xl mx-auto px-6 pt-20 pb-24">
        <h1 className="text-4xl md:text-6xl font-bold leading-tight text-sky-900">
          Your cervical health,<br />
          <span className="text-emerald-600">your terms.</span>
        </h1>
        <p className="mt-6 text-lg max-w-xl text-gray-600">
          CerviTrack gives Kenyan women a simple, private way to manage HPV screenings, vaccines,
          appointments, and doctor messages — all from one app.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link href="/auth" className="bg-sky-700 text-white px-6 py-3 rounded-xl font-semibold hover:bg-sky-800">
            Start for free
          </Link>
          <a href="#features" className="border border-sky-700 text-sky-700 px-6 py-3 rounded-xl font-medium hover:bg-sky-50">
            Learn more
          </a>
        </div>
      </header>

      <section id="features" className="bg-white py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-4 text-sky-900">Everything you need</h2>
          <p className="text-center text-gray-500 mb-12 max-w-2xl mx-auto">Built for every woman in Kenya with tools to track, manage, and improve cervical health.</p>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((f) => (
              <div key={f.title} className="p-6 rounded-2xl border border-sky-100 bg-sky-50/60 hover:shadow-md transition-shadow">
                <div className="mb-4">{f.icon}</div>
                <h3 className="font-semibold text-lg text-sky-900">{f.title}</h3>
                <p className="mt-2 text-sm text-gray-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-20 bg-gradient-to-b from-white to-sky-50">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-4 text-sky-900">How it works</h2>
          <p className="text-center text-gray-500 mb-12">Three simple steps to take control of your cervical health.</p>
          <div className="grid md:grid-cols-3 gap-10">
            {steps.map((s) => (
              <div key={s.num} className="text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-sky-700 text-white font-bold text-lg mb-4">
                  {s.num}
                </div>
                <h3 className="font-semibold text-lg text-sky-900 mb-2">{s.title}</h3>
                <p className="text-sm text-gray-600">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="about" className="py-20 bg-emerald-50">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4 text-sky-900">Your privacy matters</h2>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            CerviTrack is built with privacy at its core. Your health data is encrypted, never sold,
            and only shared with your consent. We comply with Kenya&apos;s Data Protection Act (2019) and
            international healthcare data standards.
          </p>
          <Link href="/privacy" className="text-sky-700 font-semibold hover:underline">
            Read our full Privacy Policy →
          </Link>
        </div>
      </section>

      <footer className="py-10 border-t border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-gray-500 text-sm">© {new Date().getFullYear()} CerviTrack. All rights reserved.</span>
          <div className="flex gap-6 text-sm">
            <Link href="/privacy" className="text-gray-500 hover:text-sky-700">Privacy</Link>
            <a href="#about" className="text-gray-500 hover:text-sky-700">About</a>
            <Link href="/admin" className="text-gray-500 hover:text-sky-700">Admin</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
