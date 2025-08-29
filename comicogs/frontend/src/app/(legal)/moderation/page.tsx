export default function ModerationPage() {
  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="prose prose-lg max-w-none">
        <h1 className="text-3xl font-bold mb-8">Community Guidelines & Moderation Policy</h1>
        
        <p className="text-muted-foreground mb-6">
          <strong>Last updated:</strong> {new Date().toLocaleDateString()}
        </p>

        <section className="mb-8">
          <p className="mb-4">
            Comicogs is committed to maintaining a safe, respectful, and enjoyable community for all comic book enthusiasts. 
            These guidelines outline our expectations for community behavior and how we moderate content on our platform.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Community Standards</h2>
          
          <h3 className="text-xl font-semibold mb-3">Be Respectful</h3>
          <ul className="list-disc pl-6 mb-4">
            <li>Treat all community members with respect and courtesy</li>
            <li>Avoid personal attacks, harassment, or intimidation</li>
            <li>Respect different opinions and perspectives about comics</li>
            <li>Use appropriate language in all communications</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">Be Honest</h3>
          <ul className="list-disc pl-6 mb-4">
            <li>Provide accurate descriptions of comics you're selling</li>
            <li>Use your real identity when creating accounts</li>
            <li>Don't misrepresent comic conditions, grades, or authenticity</li>
            <li>Report genuine issues, not false claims</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">Be Helpful</h3>
          <ul className="list-disc pl-6 mb-4">
            <li>Share knowledge and help other collectors</li>
            <li>Provide constructive feedback and reviews</li>
            <li>Resolve disputes amicably when possible</li>
            <li>Report content that violates these guidelines</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. Prohibited Content</h2>
          
          <p className="mb-4">The following types of content are not allowed on Comicogs:</p>
          
          <h3 className="text-xl font-semibold mb-3">Illegal Content</h3>
          <ul className="list-disc pl-6 mb-4">
            <li>Counterfeit or fraudulent comics</li>
            <li>Stolen merchandise</li>
            <li>Content that violates copyright laws</li>
            <li>Any illegal goods or services</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">Harmful Content</h3>
          <ul className="list-disc pl-6 mb-4">
            <li>Harassment, bullying, or threats</li>
            <li>Hate speech or discriminatory content</li>
            <li>Spam or excessive promotional content</li>
            <li>Malware, viruses, or malicious links</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">Inappropriate Content</h3>
          <ul className="list-disc pl-6 mb-4">
            <li>Adult content not related to comics</li>
            <li>Excessive violence or graphic imagery</li>
            <li>Content that violates privacy</li>
            <li>Off-topic content unrelated to comics</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. Marketplace Guidelines</h2>
          
          <h3 className="text-xl font-semibold mb-3">Listing Requirements</h3>
          <ul className="list-disc pl-6 mb-4">
            <li>Accurate titles, descriptions, and conditions</li>
            <li>Clear, well-lit photos showing actual condition</li>
            <li>Realistic pricing based on market values</li>
            <li>Proper categorization and tagging</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">Prohibited Listings</h3>
          <ul className="list-disc pl-6 mb-4">
            <li>Counterfeit or reproduction comics sold as originals</li>
            <li>Damaged items misrepresented as higher grades</li>
            <li>Items you don't actually own or possess</li>
            <li>Overpriced items intended to mislead buyers</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. Reporting System</h2>
          
          <p className="mb-4">
            If you encounter content that violates these guidelines, you can report it using our reporting system.
          </p>
          
          <h3 className="text-xl font-semibold mb-3">How to Report</h3>
          <ul className="list-disc pl-6 mb-4">
            <li>Use the "Report" button on listings, profiles, or messages</li>
            <li>Select the appropriate reason for your report</li>
            <li>Provide specific details about the violation</li>
            <li>Include evidence if available (screenshots, links, etc.)</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">Report Categories</h3>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Spam:</strong> Unwanted promotional content or repeated posts</li>
            <li><strong>Counterfeit:</strong> Fake or reproduction items sold as authentic</li>
            <li><strong>Offensive:</strong> Inappropriate language, harassment, or hate speech</li>
            <li><strong>Copyright:</strong> Unauthorized use of copyrighted material</li>
            <li><strong>Other:</strong> Any other guideline violations</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. Moderation Process</h2>
          
          <h3 className="text-xl font-semibold mb-3">Review Process</h3>
          <ul className="list-disc pl-6 mb-4">
            <li>All reports are reviewed by our moderation team</li>
            <li>We investigate each report thoroughly and fairly</li>
            <li>Decisions are based on evidence and community guidelines</li>
            <li>We may contact users for additional information</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">Response Times</h3>
          <ul className="list-disc pl-6 mb-4">
            <li>High priority reports (safety issues): Within 2 hours</li>
            <li>Standard reports: Within 24 hours</li>
            <li>Complex cases may take longer to investigate</li>
            <li>We'll update you on the status of your report</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. Enforcement Actions</h2>
          
          <p className="mb-4">
            When guidelines are violated, we may take the following actions:
          </p>
          
          <h3 className="text-xl font-semibold mb-3">Content Actions</h3>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Content Removal:</strong> Violating content is removed from the platform</li>
            <li><strong>Content Hiding:</strong> Content is hidden but preserved for appeals</li>
            <li><strong>Edit Requests:</strong> Users are asked to modify content to comply</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">Account Actions</h3>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Warning:</strong> Formal notice of guideline violation</li>
            <li><strong>Temporary Restriction:</strong> Limited access to certain features</li>
            <li><strong>Account Suspension:</strong> Temporary loss of access</li>
            <li><strong>Account Termination:</strong> Permanent removal from platform</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. Appeals Process</h2>
          
          <p className="mb-4">
            If you believe a moderation decision was made in error, you can appeal:
          </p>
          
          <ul className="list-disc pl-6 mb-4">
            <li>Submit an appeal within 30 days of the action</li>
            <li>Provide detailed explanation of why you believe the decision was wrong</li>
            <li>Include any relevant evidence or context</li>
            <li>Appeals are reviewed by a different moderator than the original decision</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">8. Transparency</h2>
          
          <p className="mb-4">
            We believe in transparency about our moderation practices:
          </p>
          
          <ul className="list-disc pl-6 mb-4">
            <li>We publish regular transparency reports on moderation actions</li>
            <li>Users receive clear explanations for any actions taken</li>
            <li>We provide statistics on report volumes and response times</li>
            <li>Community feedback helps us improve our guidelines</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">9. Contact Us</h2>
          
          <p className="mb-4">
            If you have questions about these guidelines or need to report an urgent safety issue:
          </p>
          
          <div className="bg-muted p-4 rounded-lg">
            <p><strong>General Inquiries:</strong> support@comicogs.com</p>
            <p><strong>Safety Issues:</strong> safety@comicogs.com</p>
            <p><strong>Appeals:</strong> appeals@comicogs.com</p>
            <p><strong>Emergency:</strong> Call local law enforcement for immediate safety concerns</p>
          </div>
        </section>

        <section className="mb-8">
          <p className="text-sm text-muted-foreground">
            <strong>Remember:</strong> These guidelines may be updated from time to time. 
            We encourage all community members to review them regularly and help us maintain 
            a positive environment for comic book enthusiasts everywhere.
          </p>
        </section>
      </div>
    </main>
  );
}