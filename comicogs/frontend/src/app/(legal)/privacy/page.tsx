export default function PrivacyPage() {
  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="prose prose-lg max-w-none">
        <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
        
        <p className="text-muted-foreground mb-6">
          <strong>Last updated:</strong> {new Date().toLocaleDateString()}
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Information We Collect</h2>
          <p className="mb-4">
            At Comicogs, we collect information to provide better services to our users. We collect information in the following ways:
          </p>
          
          <h3 className="text-xl font-semibold mb-3">Information you give us</h3>
          <ul className="list-disc pl-6 mb-4">
            <li>Account information (name, email address, phone number)</li>
            <li>Profile information (avatar, preferences)</li>
            <li>Comic collection data (titles, grades, purchase prices)</li>
            <li>Marketplace listings (comic details, images, pricing)</li>
            <li>Communication data (messages, reviews, support requests)</li>
            <li>Payment information (processed securely by Stripe)</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">Information we collect automatically</h3>
          <ul className="list-disc pl-6 mb-4">
            <li>Usage data (pages visited, features used, time spent)</li>
            <li>Device information (browser type, operating system, IP address)</li>
            <li>Location data (general geographic location)</li>
            <li>Cookies and similar tracking technologies</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. How We Use Your Information</h2>
          <p className="mb-4">We use the information we collect to:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Provide, maintain, and improve our services</li>
            <li>Process transactions and send related information</li>
            <li>Send you technical notices and support messages</li>
            <li>Communicate about products, services, and events</li>
            <li>Monitor and analyze trends and usage</li>
            <li>Detect and prevent fraudulent transactions</li>
            <li>Comply with legal obligations</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. Information Sharing</h2>
          <p className="mb-4">
            We may share your information in the following situations:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>With your consent</strong> - We'll share personal information when we have your consent</li>
            <li><strong>For external processing</strong> - With trusted partners who process it for us (e.g., Stripe for payments)</li>
            <li><strong>For legal reasons</strong> - When required by law or to protect rights and safety</li>
            <li><strong>In aggregated form</strong> - We may share aggregated, non-personally identifiable information</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. Data Security</h2>
          <p className="mb-4">
            We implement appropriate security measures to protect your personal information against unauthorized access, 
            alteration, disclosure, or destruction. These measures include:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Encryption of data in transit and at rest</li>
            <li>Regular security audits and monitoring</li>
            <li>Access controls and authentication requirements</li>
            <li>Secure payment processing through PCI-compliant partners</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. Your Rights and Choices</h2>
          <p className="mb-4">You have the following rights regarding your personal information:</p>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Access</strong> - Request a copy of your personal data</li>
            <li><strong>Correction</strong> - Update or correct your personal information</li>
            <li><strong>Deletion</strong> - Request deletion of your personal data</li>
            <li><strong>Portability</strong> - Export your data in a machine-readable format</li>
            <li><strong>Opt-out</strong> - Unsubscribe from marketing communications</li>
          </ul>
          <p className="mb-4">
            To exercise these rights, visit your account settings or contact us at privacy@comicogs.com.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. Cookies and Tracking</h2>
          <p className="mb-4">
            We use cookies and similar technologies to provide functionality and improve your experience. 
            You can control cookie preferences through your browser settings.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. International Data Transfers</h2>
          <p className="mb-4">
            Your information may be transferred to and processed in countries other than your own. 
            We ensure appropriate safeguards are in place for such transfers.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">8. Children's Privacy</h2>
          <p className="mb-4">
            Our services are not intended for children under 13. We do not knowingly collect 
            personal information from children under 13.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">9. Changes to This Policy</h2>
          <p className="mb-4">
            We may update this Privacy Policy from time to time. We will notify you of any changes 
            by posting the new policy on this page and updating the "Last updated" date.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">10. Contact Us</h2>
          <p className="mb-4">
            If you have any questions about this Privacy Policy, please contact us at:
          </p>
          <div className="bg-muted p-4 rounded-lg">
            <p><strong>Email:</strong> privacy@comicogs.com</p>
            <p><strong>Address:</strong> [Your Business Address]</p>
          </div>
        </section>
      </div>
    </main>
  );
}