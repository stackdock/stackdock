import Link from "next/link"

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-4 py-16">
        {/* Back link */}
        <nav aria-label="Breadcrumb">
          <Link
            href="/"
            className="inline-block mb-8 text-neutral-400 hover:text-white font-mono text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black rounded-sm px-1"
            aria-label="Return to StackDock homepage"
          >
            ← Back to Home
          </Link>
        </nav>

        {/* Header */}
        <h1 className="text-4xl md:text-5xl font-mono font-bold mb-4">Privacy Policy</h1>
        <p className="text-neutral-400 font-mono text-sm mb-12">
          Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </p>

        {/* Content */}
        <main className="space-y-8 text-neutral-300 font-mono">
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Introduction</h2>
            <p className="leading-relaxed">
              StackDock ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains our practices regarding the StackDock website and our open source multi-cloud management platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">About StackDock</h2>
            <p className="leading-relaxed mb-4">
              StackDock is the first open source multi-cloud management platform. We help developers manage websites, applications, servers, APM tools and more across multiple providers through their APIs. One interface. Less context switching. Open Source.
            </p>
            <p className="leading-relaxed">
              We're currently in development and seeking feedback from the developer community to validate our vision.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Information We Collect</h2>
            <p className="leading-relaxed mb-4">
              This website does not collect personal information. We do not have forms, cookies, or tracking that collects your data. The only information we have access to is:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Standard web server logs (IP address, browser type, pages visited)</li>
              <li>Any information you voluntarily provide via email to contact@stackdock.dev</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">How We Use Your Information</h2>
            <p className="leading-relaxed mb-4">
              We use the limited information we have to:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Respond to emails sent to contact@stackdock.dev</li>
              <li>Improve our website and platform based on feedback</li>
              <li>Understand how our website is used (via anonymous analytics)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Data Storage and Security</h2>
            <p className="leading-relaxed">
              Your information is stored securely using industry-standard practices. We do not sell, trade, or transfer your information to third parties.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Your Rights</h2>
            <p className="leading-relaxed mb-4">
              Since we don't collect personal information, your rights are simple:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>You can contact us at any time at contact@stackdock.dev</li>
              <li>You can request information about what data we have (if any)</li>
              <li>You can ask us to delete any information you've shared via email</li>
              <li>You can stop contacting us at any time</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Third-Party Services</h2>
            <p className="leading-relaxed">
              This website is hosted on Vercel and uses standard web technologies. We do not use third-party analytics, tracking, or advertising services. Any emails you send to contact@stackdock.dev are handled through standard email services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Changes to This Policy</h2>
            <p className="leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any changes by updating the "Last updated" date at the top of this policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Contact Us</h2>
            <p className="leading-relaxed">
              If you have any questions about this Privacy Policy or wish to exercise your rights, please contact us at{" "}
              <a
                href="mailto:contact@stackdock.dev?subject=Privacy%20Policy%20Inquiry"
                className="text-white underline hover:text-neutral-300 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black rounded-sm px-1"
                aria-label="Send email to contact@stackdock.dev about privacy policy"
              >
                contact@stackdock.dev
              </a>
              .
            </p>
          </section>
        </main>

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-neutral-900">
          <Link
            href="/"
            className="text-neutral-400 hover:text-white font-mono text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black rounded-sm px-1"
            aria-label="Return to StackDock homepage"
          >
            ← Back to Home
          </Link>
        </footer>
      </div>
    </div>
  )
}
