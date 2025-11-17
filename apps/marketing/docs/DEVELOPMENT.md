# StackDock Development Guide

## Project Overview

StackDock is a static Next.js application serving as a landing page for "The First Open Source Multi-Cloud Management Platform." The project is designed to be a minimal, accessible, and SEO-optimized website that showcases the platform's features and provides contact information.

## Technology Stack

### Core Framework
- **Next.js 16.0.0** - React framework with App Router
- **React 19.2.0** - UI library
- **TypeScript 5.0.2** - Type safety (Note: Next.js recommends 5.1.0+)

### Styling & UI
- **Tailwind CSS v4.1.9** - Utility-first CSS framework
- **Lucide React 0.548.0** - Icon library
- **PostCSS 8.5** - CSS processing

### Build Tools
- **Turbopack** - Next.js bundler (enabled)
- **Autoprefixer** - CSS vendor prefixing
- **pnpm** - Package manager

## Project Structure

```
stackdock-waitlist/
├── app/                          # Next.js App Router
│   ├── globals.css              # Global styles (Tailwind v4)
│   ├── layout.tsx               # Root layout with metadata
│   ├── page.tsx                 # Homepage
│   └── privacy/
│       └── page.tsx             # Privacy policy page
├── components/
│   ├── features-grid.tsx        # Feature showcase component
│   └── ui/                      # UI components (currently empty)
├── lib/
│   └── utils.ts                 # Utility functions
├── public/
│   ├── manifest.json            # PWA manifest
│   ├── stackdock-favicon.png    # App icon
│   └── stackdock-logo.svg       # Logo
├── docs/                        # Documentation
├── next.config.mjs              # Next.js configuration
├── package.json                 # Dependencies
├── postcss.config.mjs           # PostCSS configuration
└── tsconfig.json                # TypeScript configuration
```

## Key Features

### SEO & Accessibility
- Comprehensive metadata with Open Graph and Twitter Cards
- Semantic HTML structure with proper heading hierarchy
- ARIA labels and screen reader support
- Keyboard navigation with focus states
- WCAG compliance

### Design System
- Dark theme with industrial/technical aesthetic
- Monospace font (font-mono) for technical feel
- Subtle noise texture and grid patterns
- Responsive design (mobile-first)
- Hover and focus states

### PWA Support
- Web app manifest for installability
- Standalone display mode
- App icons and theme colors

## Development Commands

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Start on specific port
pnpm dev --port 3001

# Build for production
pnpm build

# Start production server
pnpm start

# Run linting
pnpm lint
```

## Configuration Details

### Next.js Configuration (`next.config.mjs`)
- `reactStrictMode: true` - Enhanced React development checks
- `typedRoutes: true` - Type-safe routing
- `turbopack.root: process.cwd()` - Fix for ESM `__dirname` issue

### Tailwind CSS v4
- Uses single `@import "tailwindcss"` directive
- Custom CSS variables for theming
- No preflight import needed (included in v4)

### TypeScript Configuration
- Path mapping: `@/*` maps to `./*`
- Target: ES6
- Module resolution: bundler
- Strict mode enabled

## Component Architecture

### FeaturesGrid Component
- Displays platform features in a responsive grid
- Uses Lucide React icons
- Accessible with proper ARIA attributes
- External links with security attributes
- Hover and focus states

### Layout Structure
- Root layout with comprehensive metadata
- Semantic HTML structure
- Global styles and font configuration

## Accessibility Features

### Semantic HTML
- `<main>`, `<header>`, `<section>`, `<article>`, `<footer>`
- Proper heading hierarchy (h1 → h2 → h3)
- Screen reader-only headings with `sr-only` class

### ARIA Support
- `aria-hidden` for decorative elements
- `aria-labelledby` for section relationships
- `aria-label` for interactive elements
- Focus management with visible rings

### Keyboard Navigation
- Tab order optimization
- Focus states with `focus:ring-2 focus:ring-white`
- Focus offset for better visibility

## SEO Implementation

### Metadata
- Title: "StackDock - The First Open Source Multi-Cloud Management Platform"
- Description with key benefits and keywords
- Open Graph tags for social sharing
- Twitter Card metadata
- Robots.txt directives

### Content Structure
- Semantic headings for search engines
- Descriptive alt text for images
- Pre-filled email links for better UX

## Deployment

This is a static Next.js application that can be deployed to:
- Vercel (recommended)
- Netlify
- GitHub Pages
- Any static hosting service

The build generates static files in the `.next` directory.

## Development Notes

### Known Issues
- TypeScript version warning (5.0.2 vs recommended 5.1.0+)
- No critical issues currently

### Recent Changes
- Removed email services (Resend, Mailgun)
- Added comprehensive SEO metadata
- Implemented accessibility features
- Created PWA manifest
- Fixed ARIA role conflicts

### Future Considerations
- Consider upgrading TypeScript to 5.1.0+
- Add more comprehensive testing
- Consider adding analytics (if needed)
- Expand component library in `components/ui/`

## Contact

For development questions or feedback:
- Email: contact@stackdock.dev
- GitHub: https://github.com/stackdock/stackdock
