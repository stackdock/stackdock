'use client'

import { useState } from 'react'
import Link from 'next/link'
import { X, Tag } from 'lucide-react'

interface TagListProps {
  tags: string[]
}

export function TagList({ tags }: TagListProps) {
  const [selectedTag, setSelectedTag] = useState<string | null>(null)

  const handleTagClick = (tag: string) => {
    setSelectedTag(selectedTag === tag ? null : tag)
  }

  const clearFilter = () => {
    setSelectedTag(null)
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2 text-sm font-mono text-neutral-500">
        <Tag className="w-4 h-4" />
        <span>Filter by tag:</span>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <button
            key={tag}
            onClick={() => handleTagClick(tag)}
            className={`
              px-3 py-1 text-sm font-mono rounded-full border transition-colors
              focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black
              ${
                selectedTag === tag
                  ? 'bg-white text-black border-white'
                  : 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:border-neutral-600'
              }
            `}
            aria-pressed={selectedTag === tag}
            aria-label={`Filter by ${tag} tag`}
          >
            {tag}
          </button>
        ))}
      </div>

      {selectedTag && (
        <button
          onClick={clearFilter}
          className="flex items-center gap-1 px-2 py-1 text-xs font-mono text-neutral-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black rounded-sm"
          aria-label="Clear tag filter"
        >
          <X className="w-3 h-3" />
          Clear
        </button>
      )}
    </div>
  )
}
