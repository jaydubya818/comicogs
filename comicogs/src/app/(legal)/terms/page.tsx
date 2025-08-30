export default function TermsPage() {
  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="prose prose-lg max-w-none">
        <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>
        
        <p className="text-muted-foreground mb-6">
          <strong>Last updated:</strong> {new Date().toLocaleDateString()}
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
          <p className="mb-4">
            By accessing and using Comicogs, you accept and agree to be bound by the terms and provision of this agreement.
            If you do not agree to abide by the above, please do not use this service.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
          <p className="mb-4">
            Comicogs is a platform that allows users to:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Catalog and manage their comic book collections</li>
            <li>Buy and sell comic books through our marketplace</li>
            <li>Create and manage want lists</li>
            <li>Connect with other comic book enthusiasts</li>
            <li>Access pricing and market data</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
          <p className="mb-4">
            To use certain features of our service, you must register for an account. When you register:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>You must provide accurate, complete, and current information</li>
            <li>You are responsible for maintaining the confidentiality of your account</li>
            <li>You are responsible for all activities that occur under your account</li>
            <li>You must notify us immediately of any unauthorized use of your account</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. Marketplace Terms</h2>
          
          <h3 className="text-xl font-semibold mb-3">For Sellers</h3>
          <ul className="list-disc pl-6 mb-4">
            <li>You must own the items you list for sale</li>
            <li>All item descriptions must be accurate and complete</li>
            <li>You must honor all sales at the agreed-upon price</li>
            <li>You are responsible for packaging and shipping items safely</li>
            <li>We charge a commission on successful sales</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">For Buyers</h3>
          <ul className="list-disc pl-6 mb-4">
            <li>All sales are final unless the item is significantly misrepresented</li>
            <li>You agree to pay the full purchase price including shipping</li>
            <li>Disputes should be resolved directly with the seller first</li>
            <li>Payment processing is handled by third-party providers (Stripe)</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. Prohibited Uses</h2>
          <p className="mb-4">You may not use our service:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>For any unlawful purpose or to solicit others to perform unlawful acts</li>
            <li>To violate any international, federal, provincial, or state regulations, rules, laws, or local ordinances</li>
            <li>To infringe upon or violate our intellectual property rights or the intellectual property rights of others</li>
            <li>To harass, abuse, insult, harm, defame, slander, disparage, intimidate, or discriminate</li>
            <li>To submit false or misleading information</li>
            <li>To upload or transmit viruses or any other type of malicious code</li>
            <li>To spam, phish, pharm, pretext, spider, crawl, or scrape</li>
            <li>For any obscene or immoral purpose</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. Content and Intellectual Property</h2>
          <p className="mb-4">
            Users retain ownership of content they submit, but grant Comicogs a license to use, 
            display, and distribute such content on the platform. Users must not upload content 
            that infringes on intellectual property rights of others.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. Privacy Policy</h2>
          <p className="mb-4">
            Your privacy is important to us. Please review our Privacy Policy, which also governs 
            your use of the service, to understand our practices.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">8. Fees and Payment</h2>
          <ul className="list-disc pl-6 mb-4">
            <li>Basic account registration is free</li>
            <li>We charge commission fees on marketplace sales</li>
            <li>Premium features may require subscription fees</li>
            <li>All fees are non-refundable unless otherwise stated</li>
            <li>We reserve the right to change our fee structure with notice</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">9. Termination</h2>
          <p className="mb-4">
            We may terminate or suspend your account immediately, without prior notice or liability, 
            for any reason whatsoever, including without limitation if you breach the Terms.
          </p>
          <p className="mb-4">
            Upon termination, your right to use the service will cease immediately. If you wish to 
            terminate your account, you may simply discontinue using the service.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">10. Disclaimers</h2>
          <p className="mb-4">
            The service is provided on an "AS IS" and "AS AVAILABLE" basis. We make no representations 
            or warranties of any kind, whether express, implied, statutory or otherwise regarding the service.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">11. Limitation of Liability</h2>
          <p className="mb-4">
            In no event shall Comicogs, nor its directors, employees, partners, agents, suppliers, or 
            affiliates, be liable for any indirect, incidental, special, consequential, or punitive 
            damages, including without limitation, loss of profits, data, use, goodwill, or other 
            intangible losses, resulting from your use of the service.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">12. Governing Law</h2>
          <p className="mb-4">
            These Terms shall be interpreted and governed by the laws of [Your Jurisdiction], 
            without regard to its conflict of law provisions.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">13. Changes to Terms</h2>
          <p className="mb-4">
            We reserve the right, at our sole discretion, to modify or replace these Terms at any time. 
            If a revision is material, we will try to provide at least 30 days notice prior to any new 
            terms taking effect.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">14. Contact Information</h2>
          <p className="mb-4">
            If you have any questions about these Terms, please contact us at:
          </p>
          <div className="bg-muted p-4 rounded-lg">
            <p><strong>Email:</strong> legal@comicogs.com</p>
            <p><strong>Address:</strong> [Your Business Address]</p>
          </div>
        </section>
      </div>
    </main>
  );
}