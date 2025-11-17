"use client"

import type React from "react"
import { Globe, Zap, Github, Palette, Library, Users } from "lucide-react"

interface Feature {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  href?: string
}

const features: Feature[] = [
  {
    icon: Globe,
    title: "Multi-Cloud Management",
    description: "Manage across multiple cloud providers"
  },
  {
    icon: Zap,
    title: "Purely API Driven",
    description: "Everything accessible through provider APIs"
  },
  {
    icon: Github,
    title: "Free & Open source",
    description: "Transparent, community-driven development",
    href: "https://github.com/stackdock/stackdock"
  },
  {
    icon: Palette,
    title: "Composable & Themable UI",
    description: "Stackdock Registry using shadcn components"
  },
  {
    icon: Library,
    title: "Stackdock Registry",
    description: "Connect to any prebuilt integrations"
  },
  {
    icon: Users,
    title: "Community Driven",
    description: "Built by developers, for developers"
  }
]

export function FeaturesGrid() {
  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, index) => (
          <article
            key={index}
            className="group p-6 border border-neutral-800 rounded-lg hover:border-neutral-700 transition-colors bg-neutral-900/50 hover:bg-neutral-900/70 focus-within:ring-2 focus-within:ring-white focus-within:ring-offset-2 focus-within:ring-offset-black"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <h3 className="text-lg font-mono font-semibold text-white mb-2 group-hover:text-neutral-200 transition-colors leading-tight text-left">
                  {feature.href ? (
                    <a
                      href={feature.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black rounded-sm px-1"
                      aria-label={`${feature.title} - Opens in new tab`}
                    >
                      {feature.title}
                    </a>
                  ) : (
                    feature.title
                  )}
                </h3>
                <p className="text-neutral-400 font-mono text-sm leading-relaxed text-left">
                  {feature.description}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
