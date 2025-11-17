import Image from "next/image"
import Link from "next/link"
import { FeaturesGrid } from "@/components/features-grid"

export default function WaitlistPage() {
  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Subtle noise/grain texture overlay for worn, industrial feel */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" aria-hidden="true">
        <svg className="w-full h-full">
          <filter id="noise">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" stitchTiles="stitch" />
          </filter>
          <rect width="100%" height="100%" filter="url(#noise)" />
        </svg>
      </div>

      {/* Subtle grid pattern for technical/dock feel */}
      <div className="absolute inset-0 opacity-[0.02]" aria-hidden="true">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Main content */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-12">
        <div className="max-w-3xl w-full text-center space-y-12">
          {/* Logo */}
          <header className="flex justify-center mb-8">
            <div className="relative w-[280px] h-[40px] md:w-[420px] md:h-[60px]">
              <Image
                src="/stackdock-logo.svg"
                alt="StackDock - Multi-Cloud Management Platform"
                fill
                className="object-contain brightness-100 contrast-100"
                priority
              />
            </div>
          </header>

          {/* Main Heading */}
          <div className="space-y-4">
            <h1 className="text-xl md:text-2xl text-neutral-400 font-mono tracking-wide">
              The Developer Multi-Cloud Management Platform
            </h1>
          </div>

          {/* Description */}
          <p className="text-lg md:text-xl text-neutral-500 max-w-2xl mx-auto text-balance leading-relaxed font-mono">
            Manage websites, applications, servers, databases, observability tools and more across multiple providers through their APIs. One interface. Less context switching. More productivity.
          </p>

          {/* Features Grid */}
          <section className="pt-12" aria-labelledby="features-heading">
            <h2 id="features-heading" className="sr-only">Platform Features</h2>
            <FeaturesGrid />
          </section>

          {/* CTA and Form */}
          <section className="space-y-6 pt-8" aria-labelledby="contact-heading">
            <div className="inline-block">
              <h2 id="contact-heading" className="text-2xl md:text-3xl font-mono font-semibold text-white border-b-2 border-neutral-800 pb-2">
                Validate our mission
              </h2>
            </div>
            <p className="text-neutral-600 font-mono text-lg">Talk to the builder. Directly. Need your thoughts, not just your email.</p>
            <a 
              href="mailto:contact@stackdock.dev" 
              className="text-white hover:text-neutral-300 underline ml-1 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black rounded-sm px-1"
              aria-label="Send feedback via email to contact@stackdock.dev"
            >
              contact@stackdock.dev
            </a>
          </section>

          {/* Features removed for minimal baseline */}

          {/* Footer */}
          <footer className="pt-16 pb-8 mt-16 border-t border-neutral-900">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-neutral-600 font-mono text-sm">
              <div>
                © {new Date().getFullYear()} StackDock. All rights reserved.
              </div>
              <div className="flex gap-6">
                <Link
                  href="/blog"
                  className="hover:text-neutral-400 transition-colors"
                >
                  Blog
                </Link>
                <Link
                  href="/privacy"
                  className="hover:text-neutral-400 transition-colors"
                >
                  Privacy Policy
                </Link>
              </div>
            </div>
          </footer>
        </div>
      </main>

      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neutral-800 to-transparent" aria-hidden="true" />
    </div>
  )
}
