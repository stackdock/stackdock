# StackDock - Multi-Cloud Management Platform

> The first open source multi-cloud management platform. Manage websites, applications, servers, databases, and APM tools across multiple cloud providers through their APIs. One interface. Less context switching. Open Source.

> **Note**: This is a private repository for internal development and iteration by the StackDock team.

## Current Version: 1.0.0

See [CHANGELOG.md](./CHANGELOG.md) for detailed version history and changes.

## 🚀 Quick Start

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build
```

## 📋 Project Overview

StackDock is a static Next.js application serving as a landing page and blog for an open source multi-cloud management platform. The project emphasizes accessibility, SEO optimization, and a clean, technical aesthetic with a comprehensive blog system for technical content.

## 🛠 Technology Stack

- **Framework**: Next.js 16.0.0 with App Router
- **Language**: TypeScript 5.0.2
- **Styling**: Tailwind CSS v4.1.9
- **Icons**: Lucide React 0.548.0
- **Package Manager**: pnpm
- **Build Tool**: Turbopack

## 📁 Project Structure

```
stackdock-waitlist/
├── app/                          # Next.js App Router
│   ├── blog/                     # Blog pages
│   │   ├── [slug]/              # Dynamic blog post pages
│   │   └── page.tsx             # Blog listing page
│   ├── drafts/                  # Draft preview page
│   ├── globals.css              # Global styles
│   ├── layout.tsx               # Root layout with metadata
│   ├── page.tsx                 # Homepage
│   └── privacy/
│       └── page.tsx             # Privacy policy
├── components/
│   ├── blog/                    # Blog-specific components
│   │   ├── blog-card.tsx        # Blog post cards
│   │   ├── blog-header.tsx      # Post headers
│   │   ├── blog-sidebar.tsx     # Table of contents
│   │   ├── author-box.tsx       # Author information
│   │   ├── related-articles.tsx # Related posts
│   │   └── cta-card.tsx         # Call-to-action cards
│   ├── features-grid.tsx        # Feature showcase
│   └── ui/                      # UI components (future)
├── content/                     # Content management
│   ├── blog/                    # Published blog posts
│   └── drafts/                  # Draft posts (gitignored)
├── lib/
│   ├── blog.ts                  # Blog utilities and functions
│   └── utils.ts                 # General utility functions
├── public/
│   ├── blog/                    # Blog images (organized by date)
│   │   ├── 2024/12/            # Year/month structure
│   │   └── assets/             # Shared blog assets
│   ├── manifest.json            # PWA manifest
│   ├── stackdock-favicon.png    # App icon
│   └── stackdock-logo.svg       # Logo
├── docs/                        # Documentation
│   ├── DEVELOPMENT.md           # Development guide
│   ├── ARCHITECTURE.md          # System architecture
│   ├── ACCESSIBILITY.md         # Accessibility guide
│   ├── SEO.md                   # SEO documentation
│   ├── COMPONENTS.md            # Component documentation
│   ├── IMAGE-ORGANIZATION.md    # Image management guide
│   └── TROUBLESHOOTING.md       # Error resolution guide
└── README.md                    # This file
```

## ✨ Key Features

### 📝 Blog System
- **MDX-based content management** with frontmatter support
- **SEO-optimized structure** with proper heading hierarchy
- **Image organization** with chronological directory structure
- **Draft system** for content creation and preview
- **Kinsta-style layout** with sidebar, author boxes, and related articles
- **Responsive design** optimized for all devices

### 🎯 SEO & Performance
- Comprehensive metadata with Open Graph and Twitter Cards
- Optimized for Core Web Vitals
- Static generation for fast loading
- Mobile-first responsive design

### ♿ Accessibility
- WCAG 2.1 AA compliant
- Semantic HTML structure
- Keyboard navigation support
- Screen reader optimization
- ARIA labels and descriptions

### 🎨 Design System
- Dark theme with industrial aesthetic
- Monospace typography for technical feel
- Subtle noise texture and grid patterns
- Consistent spacing and color palette

### 📱 PWA Support
- Web app manifest
- Standalone display mode
- App icons and theme colors
- Installable on mobile devices

## 🚀 Development

### Prerequisites
- Node.js 18+ 
- pnpm (recommended) or npm

### Local Development
```bash
# Clone the repository
git clone https://github.com/stackdock/stackdock.git
cd stackdock-waitlist

# Install dependencies
	pnpm install

# Start development server
pnpm dev

# Open http://localhost:3000
```

### Available Scripts
```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
```

### Development Server
The development server runs on `http://localhost:3000` by default. For alternative ports:
```bash
pnpm dev --port 3001
```

## 🏗 Architecture

### Component Architecture
- **Modular Design**: Reusable, composable components
- **TypeScript**: Strong typing for better development experience
- **Accessibility First**: Built with accessibility in mind
- **Performance Optimized**: Minimal bundle size and fast loading

### Styling Approach
- **Tailwind CSS v4**: Utility-first CSS framework
- **Responsive Design**: Mobile-first approach
- **Design System**: Consistent spacing, colors, and typography
- **Custom Properties**: CSS variables for theming

### Build Process
1. **TypeScript Compilation**: Type checking and compilation
2. **PostCSS Processing**: Tailwind CSS processing
3. **Static Generation**: Pre-rendering all pages
4. **Asset Optimization**: Image and CSS optimization

## 📚 Documentation

Comprehensive documentation is available in the `docs/` directory:

- **[Development Guide](docs/DEVELOPMENT.md)** - Setup, commands, and development workflow
- **[Architecture](docs/ARCHITECTURE.md)** - System architecture and design decisions
- **[Accessibility](docs/ACCESSIBILITY.md)** - Accessibility features and testing
- **[SEO](docs/SEO.md)** - SEO strategy and implementation
- **[Components](docs/COMPONENTS.md)** - Component documentation and guidelines

## 🎯 SEO Features

### Meta Tags
- Optimized title and description
- Open Graph tags for social sharing
- Twitter Card metadata
- Structured data (planned)

### Content Optimization
- Semantic HTML structure
- Proper heading hierarchy
- Descriptive alt text
- Internal linking strategy

### Performance
- Static generation for fast loading
- Image optimization
- CSS optimization
- Core Web Vitals optimization

## ♿ Accessibility Features

### WCAG 2.1 AA Compliance
- Semantic HTML elements
- Proper ARIA attributes
- Keyboard navigation
- Screen reader support

### Testing
- Manual accessibility testing
- Automated testing with axe-core
- Screen reader testing
- Keyboard navigation testing

## 🚀 Deployment

### Static Hosting
This is a static Next.js application that can be deployed to:

- **Vercel** (recommended)
- **Netlify**
- **GitHub Pages**
- **Any CDN or static hosting service**

### Build Output
```bash
pnpm build
```
Generates optimized static files in the `.next` directory.

### Environment Variables
No environment variables required for static deployment.

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### Code Standards
- **TypeScript**: Use TypeScript for all components
- **Accessibility**: Follow WCAG guidelines
- **Performance**: Optimize for speed and bundle size
- **Documentation**: Update docs for new features

### Testing
- **Manual Testing**: Test in multiple browsers
- **Accessibility Testing**: Use screen readers and keyboard navigation
- **Performance Testing**: Use Lighthouse for audits
- **Responsive Testing**: Test on multiple device sizes

## 📞 Contact

- **Email**: contact@stackdock.dev
- **GitHub**: [https://github.com/stackdock/stackdock](https://github.com/stackdock/stackdock)
- **Website**: [https://stackdock.dev](https://stackdock.dev)

## 📄 License

This project is open source. See the repository for license details.

## 🙏 Acknowledgments

- **Next.js Team** - For the excellent framework
- **Tailwind CSS Team** - For the utility-first CSS framework
- **Lucide Team** - For the beautiful icon library
- **Accessibility Community** - For guidance on inclusive design

---

**StackDock** - The First Open Source Multi-Cloud Management Platform
