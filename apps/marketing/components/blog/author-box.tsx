import { ExternalLink } from 'lucide-react'
import Link from 'next/link'

interface AuthorBoxProps {
  author: string
}

// Mock author data - in a real app, this would come from a CMS or database
const authorData: Record<string, {
  name: string
  bio: string
  avatar: string
}> = {
  'StackDock Team': {
    name: 'StackDock Team',
    bio: 'The StackDock team is passionate about simplifying multi-cloud management for developers. We believe in open source solutions and building tools that make infrastructure management more accessible.',
    avatar: '/stackdock-favicon.png'
  },
  'Default Author': {
    name: 'Default Author',
    bio: 'A passionate developer and writer sharing insights about modern web development and cloud infrastructure.',
    avatar: '/stackdock-favicon.png'
  }
}

export function AuthorBox({ author }: AuthorBoxProps) {
  const authorInfo = authorData[author] || authorData['Default Author']

  return (
    <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-6 mt-12">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Author Avatar */}
        <div className="flex-shrink-0">
          <div className="w-16 h-16 rounded-full bg-neutral-800 border-2 border-neutral-700 flex items-center justify-center overflow-hidden">
            <img
              src={authorInfo.avatar}
              alt={`${authorInfo.name} avatar`}
              className="w-full h-full object-cover scale-110"
            />
          </div>
        </div>

        {/* Author Info */}
        <div className="flex-1">
          <h3 className="text-xl font-mono font-semibold text-white mb-2">
            {authorInfo.name}
          </h3>
          <p className="text-neutral-300 font-mono text-sm leading-relaxed mb-4">
            {authorInfo.bio}
          </p>

          {/* Social Link */}
          <div className="flex items-center gap-2">
            <a
              href="https://x.com/stackdockdev"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:text-neutral-300 underline transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black rounded-sm px-1"
              aria-label="Follow @stackdockdev on X"
            >
              @stackdockdev
            </a>
            <ExternalLink className="w-3 h-3 text-neutral-500" />
          </div>
        </div>
      </div>
    </div>
  )
}
