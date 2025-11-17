import Link from 'next/link'
import { ExternalLink, GitBranch } from 'lucide-react'

interface CTACardProps {
  title: string
  description: string
  buttonText: string
  buttonHref: string
  variant?: 'primary' | 'secondary' | 'success' | 'warning'
  external?: boolean
  className?: string
}

export function CTACard({
  title,
  description,
  buttonText,
  buttonHref,
  variant = 'primary',
  external = false,
  className = ''
}: CTACardProps) {
  const variantStyles = {
    primary: 'bg-neutral-900/50 text-white border-neutral-800',
    secondary: 'bg-neutral-900 border-neutral-700 text-white',
    success: 'bg-green-900 border-green-700 text-green-100',
    warning: 'bg-yellow-900 border-yellow-700 text-yellow-100'
  }

  const buttonStyles = {
    primary: 'bg-black text-white hover:bg-neutral-800',
    secondary: 'bg-white text-black hover:bg-neutral-200',
    success: 'bg-green-700 text-white hover:bg-green-600',
    warning: 'bg-yellow-700 text-white hover:bg-yellow-600'
  }

  const iconColor = variant === 'primary' ? 'text-white' : 'text-white'

  return (
    <div className={`border rounded-lg p-6 ${variantStyles[variant]} ${className}`}>
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        {/* Content */}
        <div className="flex-1">
          <h3 className="text-xl font-mono font-semibold mb-2">
            {title}
          </h3>
          <p className="font-mono text-sm opacity-90">
            {description}
          </p>
        </div>

        {/* Button */}
        <div className="flex-shrink-0">
          {external ? (
            <a
              href={buttonHref}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg font-mono font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black ${buttonStyles[variant]}`}
            >
              {buttonText}
              <ExternalLink className="w-4 h-4" />
            </a>
          ) : buttonHref.startsWith('http') ? (
            <a
              href={buttonHref}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg font-mono font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black ${buttonStyles[variant]}`}
            >
              {buttonText}
              <GitBranch className="w-4 h-4" />
            </a>
          ) : (
            <Link
              href={buttonHref as any}
              className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg font-mono font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black ${buttonStyles[variant]}`}
            >
              {buttonText}
              <GitBranch className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

// Predefined CTA variants for common use cases
export function GetStartedCTA() {
  return (
    <CTACard
      title="Follow the voyage, not the hype"
      description="StackDock is in pre-alpha, but we're building something great. Follow our progress and get involved."
      buttonText="Get Onboard"
      buttonHref="https://github.com/stackdock/stackdock"
      variant="primary"
      external
    />
  )
}

export function LearnMoreCTA() {
  return (
    <CTACard
      title="Want to learn more?"
      description="Explore our comprehensive documentation and guides to get the most out of StackDock."
      buttonText="View Documentation"
      buttonHref="/docs"
      variant="secondary"
    />
  )
}

export function CommunityCTA() {
  return (
    <CTACard
      title="Join our community"
      description="Connect with other developers, share your experiences, and get help from the community."
      buttonText="Join Community"
      buttonHref="https://github.com/stackdock/stackdock"
      variant="success"
      external
    />
  )
}

export function NewsletterCTA() {
  return (
    <CTACard
      title="Stay updated"
      description="Get the latest updates, tutorials, and insights delivered to your inbox."
      buttonText="Subscribe"
      buttonHref="mailto:contact@stackdock.dev"
      variant="warning"
    />
  )
}
