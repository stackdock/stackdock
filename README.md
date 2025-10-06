![Image of Stackdock logo](/public/stackdock-official-logo-dark.svg "Stackdock logo")

<div align="center">

  # Stackdock

  ### The Open Source Multi-Cloud Management Platform

  **Manage websites and servers across multiple providers from a single, beautiful interface.**

  [![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
  [![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)
  [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](https://github.com/stackdock/stackdock/pulls)

</div>

---

## ✨ Features in development

- 🌐 **Multi-Provider Support** - Manage GridPane and more hosting panel providers coming soon from one dashboard
- 🎨 **Beautiful UI** - Modern interface built with shadcn/ui and Tailwind CSS
- 🌓 **Dark Mode** - Seamless light/dark theme switching
- ⚡ **Real-Time Updates** - Live data with Next.js Server Actions
- 🔐 **Type-Safe** - Full TypeScript coverage for reliability
- 📊 **Comprehensive API** - Rate limiting, error handling, and caching built-in
- 🎯 **Site Management** - PHP version updates, SSL management, backups, and more
- 📦 **Server Control** - Monitor and manage servers across providers
- 🔍 **Smart Search** - Command palette (Cmd+K) for quick navigation

---

## 🎯 Current Provider Support

### GridPane Integration ✅
- ✅ Sites management (list, view, update)
- ✅ PHP version switching with rate limit handling
- ✅ Server monitoring and management
- ✅ Domain management
- ✅ Backup schedules and integrations
- ✅ System users management
- ✅ Teams and user settings

### Coming Soon 🚧
- Kinsta 
- Rocket.net 
- Runcloud
- Coolify
- InstaWP
- Vercel
- Render
- Laravel Forge
- More...

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or pnpm
- API credentials (for each provider)

### Installation

```bash
# Clone the repository
git clone https://github.com/stackdock/stackdock.git
cd stackdock

# Install dependencies
npm install

# Copy environment file
cp example.env .env.local

# Add your API credentials to .env.local
# GRIDPANE_API_URL=https://api.gridpane.com/v2
# GRIDPANE_BEARER_TOKEN=your_token_here

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your dashboard.

---

## 🏗️ Tech Stack

- **Framework:** [Next.js 15](https://nextjs.org/) with App Router
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **UI Components:** [shadcn/ui](https://ui.shadcn.com/)
- **Icons:** [Lucide Icons](https://lucide.dev/)
- **State Management:** React Server Components + Server Actions
- **Deployment:** [Vercel](https://vercel.com/) (recommended)

---

## 📁 Project Structure

```
stackdock/
├── src/
│   ├── app/              # Next.js app router pages
│   │   ├── dashboard/    # Main dashboard routes
│   │   │   ├── sites/    # Site management
│   │   │   ├── servers/  # Server management
│   │   │   ├── domains/  # Domain management
│   │   │   └── backups/  # Backup management
│   │   └── layout.tsx    # Root layout
│   ├── components/       # React components
│   │   ├── ui/          # shadcn/ui components
│   │   ├── sidebar/     # Navigation components
│   │   └── sites/       # Site-specific components
│   ├── lib/             # Utility functions
│   │   └── gridpane/    # GridPane API integration
│   └── hooks/           # Custom React hooks
├── public/              # Static assets
└── .github/
    └── instructions/    # Development documentation
```

---

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file in the root directory:

```bash
# GridPane API Configuration
GRIDPANE_API_URL=https://api.gridpane.com/v2
GRIDPANE_BEARER_TOKEN=your_bearer_token_here

# Optional: Custom configuration
# NODE_ENV=development
```

### API Rate Limits

Stackdock includes intelligent rate limit handling:
- **GridPane:** 60 requests/minute globally, 2 requests/60s per endpoint (PUT operations)
- Automatic retry with exponential backoff
- User-friendly error messages
- Request queuing to prevent 429 errors

---

## 🎨 Development

### Available Scripts

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linter
npm run lint

# Type checking
npx tsc --noEmit
```

### Code Standards

This project follows strict coding conventions documented in `.github/instructions/CONVENTIONS.md`:

- ✅ TypeScript strict mode enabled
- ✅ No console.logs in production
- ✅ Design tokens only (no hardcoded colors)
- ✅ Consistent error handling with `GridPaneApiError`
- ✅ Server Actions for all API calls
- ✅ shadcn/ui components for UI consistency

---

## 🤝 Contributing

Contributions welcome!

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes following our code standards
4. Run tests and linting (`npm run lint && npm run build`)
5. Commit your changes (`git commit -m 'feat: add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `refactor:` Code refactoring
- `style:` Formatting changes
- `test:` Test additions or changes
- `chore:` Maintenance tasks

---

## 📖 Documentation

- **Code Conventions:** `.github/instructions/CONVENTIONS.md`
- **API Patterns:** `.github/instructions/API_PATTERNS.md`
- **Quick Reference:** `.github/instructions/QUICK_REFERENCE.md`
- **Cleanup History:** `.github/instructions/CLEANUP_PLAN.md`

---

## 🐛 Known Issues & Roadmap

See [Issues](https://github.com/stackdock/stackdock/issues) for a list of known issues and planned features.

### Recent Updates

- ✅ **Week 1 Cleanup** - Removed debug logging, consolidated types, standardized error handling
- ✅ **Week 2 Cleanup** - Migrated to design tokens, implemented Alert/Badge components

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 💖 Acknowledgments

- [shadcn](https://twitter.com/shadcn) for the amazing UI components
- [Vercel](https://vercel.com/) for Next.js and hosting
- [GridPane](https://gridpane.com/) for their robust API
- All contributors who help improve Stackdock

---

## 📬 Contact & Support

- **GitHub Issues:** [Report bugs or request features](https://github.com/stackdock/stackdock/issues)
- **Discussions:** [Ask questions or share ideas](https://github.com/stackdock/stackdock/discussions)

---

<div align="center">

  **Built with ❤️ by the Stackdock team**

  ⭐ Star us on GitHub — it helps!

  [Website](https://stackdock.dev) • [Documentation](https://docs.stackdock.com) • [X](https://x.com/stackdock)

</div>
