# StackDock Context Documentation

## Project Context for AI Assistants

This document provides essential context about the StackDock project to help AI assistants understand the codebase, architecture, and development patterns.

## Project Identity

**StackDock** is a landing page for "The First Open Source Multi-Cloud Management Platform" - a platform designed to help developers manage websites, applications, servers, databases, and APM tools across multiple cloud providers through their APIs.

### Key Value Propositions
- **One Interface**: Unified management across cloud providers
- **Less Context Switching**: Single platform for all cloud operations
- **Open Source**: Transparent, community-driven development
- **API Driven**: Everything accessible through clean APIs

## Current State (December 2024)

### Project Status
- **Phase**: Landing page and validation
- **Development**: Active development with focus on developer feedback
- **Deployment**: Static Next.js application
- **Audience**: Developers and technical decision makers

### Recent Major Changes
1. **Email Service Removal**: Purged all Resend/Mailgun dependencies
2. **SEO Enhancement**: Comprehensive metadata and accessibility improvements
3. **Component Addition**: Added FeaturesGrid component with Lucide icons
4. **Accessibility Fixes**: Resolved ARIA role conflicts and improved keyboard navigation

## Technical Architecture

### Core Stack
```
Next.js 16.0.0 (App Router)
├── React 19.2.0
├── TypeScript 5.0.2
├── Tailwind CSS v4.1.9
├── Lucide React 0.548.0
└── pnpm (package manager)
```

### Key Configuration Files
- `next.config.mjs`: Next.js configuration with Turbopack
- `tsconfig.json`: TypeScript configuration with path mapping
- `postcss.config.mjs`: PostCSS configuration for Tailwind
- `package.json`: Dependencies and scripts

### Build System
- **Bundler**: Turbopack (Next.js default)
- **CSS Processing**: PostCSS with Tailwind CSS v4
- **Type Checking**: TypeScript with strict mode
- **Static Generation**: All pages pre-rendered

## File Structure Context

### App Router Structure
```
app/
├── layout.tsx          # Root layout with comprehensive metadata
├── page.tsx            # Homepage with hero and features
├── globals.css         # Global styles (Tailwind v4)
└── privacy/
    └── page.tsx        # Privacy policy page
```

### Component Architecture
```
components/
├── features-grid.tsx   # Main feature showcase component
└── ui/                 # Future UI component library
```

### Public Assets
```
public/
├── manifest.json       # PWA manifest
├── stackdock-logo.svg  # Main logo (SVG)
└── stackdock-favicon.png # App icon
```

## Design System Context

### Visual Identity
- **Theme**: Dark, industrial, technical aesthetic
- **Typography**: Monospace font (font-mono) for technical feel
- **Colors**: Black background with neutral grays
- **Patterns**: Subtle noise texture and grid overlays

### Responsive Strategy
- **Mobile First**: Designed for mobile, enhanced for desktop
- **Breakpoints**: sm (640px), md (768px), lg (1024px)
- **Grid System**: CSS Grid with responsive columns

### Accessibility Standards
- **WCAG 2.1 AA**: Full compliance
- **Semantic HTML**: Proper heading hierarchy and landmarks
- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Reader Support**: ARIA labels and descriptions

## Development Patterns

### Component Patterns
```typescript
// Feature component structure
interface Feature {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  href?: string
}

// Accessibility-first approach
<section aria-labelledby="features-heading">
  <h2 id="features-heading" className="sr-only">Platform Features</h2>
  <FeaturesGrid />
</section>
```

### Styling Patterns
```css
/* Focus states for accessibility */
.focus\:outline-none:focus {
  outline: none;
}
.focus\:ring-2:focus {
  --tw-ring-width: 2px;
}
.focus\:ring-white:focus {
  --tw-ring-color: rgb(255 255 255);
}

/* Responsive design */
.grid.grid-cols-1.md:grid-cols-2.lg:grid-cols-3
```

### TypeScript Patterns
```typescript
// Path mapping
import { FeaturesGrid } from "@/components/features-grid"

// Component props
interface ComponentProps {
  children: React.ReactNode
  className?: string
  ariaLabel?: string
}
```

## Content Strategy

### Messaging Hierarchy
1. **H1**: "The First Open Source Multi-Cloud Management Platform"
2. **Description**: Benefits and value proposition
3. **Features**: Six key platform features
4. **CTA**: Contact for feedback and validation

### Feature Messaging
- **Multi-provider**: Manage across multiple cloud providers
- **API driven**: Everything accessible through clean APIs
- **Open source**: Transparent, community-driven development
- **Custom themable UI**: Registry using shadcn components
- **Prebuilt adapter library**: Ready-to-use integrations
- **Community driven**: Built by developers, for developers

### Contact Strategy
- **Primary Contact**: contact@stackdock.dev
- **Pre-filled Emails**: Subject and body for context
- **External Links**: GitHub repository for open source
- **No Forms**: Direct email contact only

## SEO Context

### Target Keywords
- Multi-cloud management
- Open source cloud platform
- Cloud API management
- Infrastructure as code
- Cloud orchestration
- Developer tools

### Content Optimization
- **Title**: 72 characters with primary keyword
- **Description**: 155 characters with benefits
- **Headings**: Proper H1-H3 hierarchy
- **Images**: Descriptive alt text
- **Links**: Internal and external linking strategy

### Social Media
- **Open Graph**: Rich previews for social sharing
- **Twitter Cards**: Optimized for Twitter sharing
- **Brand Consistency**: Unified messaging across platforms

## Accessibility Context

### Implementation Approach
- **Semantic HTML**: Proper element usage
- **ARIA Attributes**: Labels, descriptions, and landmarks
- **Keyboard Navigation**: Tab order and focus management
- **Screen Reader Support**: Hidden headings and descriptions

### Testing Strategy
- **Manual Testing**: Keyboard and screen reader testing
- **Automated Testing**: Lighthouse and axe-core
- **Cross-browser**: Multiple browser testing
- **Mobile Testing**: Touch and responsive testing

## Performance Context

### Optimization Strategy
- **Static Generation**: Pre-rendered pages
- **Image Optimization**: Next.js Image component
- **CSS Optimization**: Tailwind CSS purging
- **Bundle Size**: Minimal dependencies

### Core Web Vitals
- **LCP**: Optimized with priority loading
- **FID**: Minimal JavaScript, fast interactions
- **CLS**: Stable layout with proper sizing

## Development Workflow

### Local Development
```bash
pnpm dev          # Development server
pnpm build        # Production build
pnpm start        # Production server
```

### Code Quality
- **TypeScript**: Strict mode enabled
- **ESLint**: Code linting
- **Accessibility**: Manual and automated testing
- **Performance**: Lighthouse audits

### Git Workflow
- **Main Branch**: Production-ready code
- **Feature Branches**: New features and fixes
- **Pull Requests**: Code review and testing
- **Deployment**: Automatic deployment on merge

## Common Issues and Solutions

### Known Issues
1. **TypeScript Version**: 5.0.2 vs recommended 5.1.0+
2. **ARIA Roles**: Fixed invalid listitem role on article elements
3. **Build Warnings**: Non-critical warnings in development

### Common Patterns
1. **Accessibility**: Always include ARIA attributes
2. **Responsive Design**: Mobile-first approach
3. **Performance**: Optimize images and CSS
4. **SEO**: Include proper metadata and structure

## Future Considerations

### Planned Features
- **Component Library**: Expand UI components
- **Blog Section**: Technical content and tutorials
- **Documentation**: Interactive user guides
- **Analytics**: Privacy-compliant analytics (optional)

### Technical Debt
- **TypeScript Upgrade**: Consider upgrading to 5.1.0+
- **Testing**: Add comprehensive test suite
- **Monitoring**: Add error tracking and performance monitoring
- **Internationalization**: Multi-language support (if needed)

## AI Assistant Guidelines

### When Working on This Project
1. **Maintain Accessibility**: Always consider WCAG compliance
2. **Follow Patterns**: Use established component and styling patterns
3. **Test Thoroughly**: Verify changes work across devices and browsers
4. **Document Changes**: Update relevant documentation
5. **Consider Performance**: Optimize for speed and bundle size

### Common Tasks
1. **Component Development**: Follow accessibility-first approach
2. **Styling Updates**: Use Tailwind utilities and maintain consistency
3. **Content Changes**: Update both content and metadata
4. **Bug Fixes**: Test across multiple browsers and devices
5. **Feature Additions**: Consider impact on performance and accessibility

### Code Standards
- **TypeScript**: Use strict typing
- **Accessibility**: Include ARIA attributes and semantic HTML
- **Performance**: Optimize for Core Web Vitals
- **SEO**: Maintain proper structure and metadata
- **Documentation**: Update docs for significant changes

This context should help AI assistants understand the project's current state, architecture, and development patterns when working on StackDock.
