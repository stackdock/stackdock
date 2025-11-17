'use client'

import { useState } from 'react'
import { Menu, X, List } from 'lucide-react'
import type { BlogPost } from '@/lib/blog'

interface BlogSidebarProps {
  post: BlogPost
}

export function BlogSidebar({ post }: BlogSidebarProps) {
  const [isOpen, setIsOpen] = useState(false)

  if (!post.tableOfContents || post.tableOfContents.length === 0) {
    return null
  }

  return (
    <aside className="lg:h-fit">
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden flex items-center gap-2 px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-white font-mono text-sm hover:bg-neutral-800 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black mb-4"
        aria-expanded={isOpen}
        aria-controls="table-of-contents"
      >
        <List className="w-4 h-4" />
        Table of Contents
        {isOpen ? <X className="w-4 h-4 ml-auto" /> : <Menu className="w-4 h-4 ml-auto" />}
      </button>

      {/* Sidebar Content */}
      <div
        id="table-of-contents"
        className={`${
          isOpen ? 'block' : 'hidden'
        } lg:block bg-neutral-900/50 border border-neutral-800 rounded-lg p-4`}
      >
        <h3 className="text-sm font-mono font-semibold text-white mb-3">
          Contents
        </h3>
        
        <nav aria-label="Table of contents">
          <ul className="space-y-1">
            {post.tableOfContents.map((item, index) => (
              <li key={index}>
                <a
                  href={`#${item.id}`}
                  className={`block py-1 px-2 rounded text-xs font-mono transition-colors hover:bg-neutral-800 hover:text-white underline focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black ${
                    item.level === 1
                      ? 'text-white font-medium'
                      : item.level === 2
                      ? 'text-neutral-300 ml-3'
                      : 'text-neutral-400 ml-6'
                  }`}
                  onClick={() => {
                    // Close mobile menu when link is clicked
                    if (window.innerWidth < 1024) {
                      setIsOpen(false)
                    }
                  }}
                >
                  {item.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </aside>
  )
}
