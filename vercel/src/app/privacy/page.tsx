import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy — CerviTrack',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white text-gray-800">
      <nav className="flex items-center justify-between px-6 py-5 max-w-4xl mx-auto">
        <Link href="/" className="text-xl font-bold text-sky-700">CerviTrack</Link>
        <Link href="/" className="text-sky-700 text-sm font-medium hover:underline">← Back to home</Link>
      </nav>

      <main className="max-w-4xl mx-auto px-6 pb-20">
        <h1 className="text-4xl font-bold text-sky-900 mb-8">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

        <div className="space-y-8 text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-2xl font-semibold text-sky-800 mb-3">1. Data Collection</h2>
            <p className="mb-3">CerviTrack collects only the information necessary to provide cervical health tracking services:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              <li>Personal identifiers: name, email, phone number</li>
              <li>Health data: screening results, HPV test results, vaccination records</li>
              <li>Demographic data: county, age group (used for aggregated statistics only)</li>
              <li>Appointments and follow-up information</li>
              <li>Messages sent through secure in-app messaging</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-sky-800 mb-3">2. Data Storage &amp; Security</h2>
            <p className="mb-3">All data is stored securely using industry-standard encryption:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              <li>Data is encrypted at rest and in transit (TLS 1.3)</li>
              <li>Hosted on Supabase with SOC 2 Type II compliance</li>
              <li>Access is restricted to authenticated users and authorized healthcare providers</li>
              <li>Regular security audits and vulnerability assessments</li>
              <li>Offline data on mobile devices is encrypted locally</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-sky-800 mb-3">3. Data Sharing</h2>
            <p className="mb-3">We do not sell or share your personal data with third parties. Your data may be accessed by:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              <li>Authorized healthcare providers assigned to your care</li>
              <li>System administrators for operational purposes only</li>
              <li>Aggregated, anonymized data may be used for public health research in Kenya</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-sky-800 mb-3">4. Your Rights</h2>
            <p className="mb-3">Under Kenya&apos;s Data Protection Act (2019) and international best practices, you have the right to:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              <li>Access all personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data (subject to legal retention requirements)</li>
              <li>Withdraw consent for data processing at any time</li>
              <li>Receive a copy of your data in a portable format</li>
              <li>Lodge a complaint with the Office of the Data Protection Commissioner of Kenya</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-sky-800 mb-3">5. Data Retention</h2>
            <p>We retain your health records as required by Kenyan healthcare regulations. Personal data is retained for as long as your account is active or as needed to provide services. You may request deletion of your account and associated data at any time.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-sky-800 mb-3">6. Children&apos;s Privacy</h2>
            <p>CerviTrack is designed for women aged 18 and above. We do not knowingly collect data from minors. If we learn that a minor has provided us with personal data, we will take steps to delete that information promptly.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-sky-800 mb-3">7. Changes to This Policy</h2>
            <p>We may update this privacy policy from time to time. Changes will be posted on this page with an updated revision date. Continued use of CerviTrack after changes constitutes acceptance of the revised policy.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-sky-800 mb-3">8. Contact Us</h2>
            <p>If you have questions about this privacy policy or your data, please contact us through the app&apos;s secure messaging feature or email support@cervitrack.co.ke.</p>
          </section>
        </div>
      </main>
    </div>
  );
}
