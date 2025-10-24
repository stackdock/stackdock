![Image of Stackdock logo](/public/stackdock-official-logo-dark.svg "Stackdock logo")

<div align="center">

  # Stackdock

  ### Open Source Multi-Cloud Management Platform

  **Manage websites and servers across multiple providers from a unified interface.**

  [![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
  [![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

</div>

---

## WARNING: EARLY DEVELOPMENT

**This project is in active development and is NOT ready for production use, testing, or deployment.**

- Core features are incomplete and under heavy iteration
- API integrations are being systematically documented and tested
- Breaking changes occur frequently without notice
- No stability guarantees of any kind
- Database schema and authentication are not yet implemented

**DO NOT use this in any production environment or with production data.**

If you're interested in following development progress, star the repository and check back later.

---

## Features in Development

- **Multi-Provider Support** - GridPane integration in progress, additional providers planned
- **Modern UI** - Interface built with shadcn/ui and Tailwind CSS
- **Theme Support** - Light and dark mode switching
- **Type Safety** - Full TypeScript coverage
- **API Foundation** - Rate limiting, error handling, and request logging
- **Site Management** - PHP version updates, SSL management, backups
- **Server Control** - Monitor and manage servers across providers

---

## Current Provider Status

### GridPane Integration (In Progress)
- Sites management (list, view, update)
- PHP version switching with rate limit handling
- Server monitoring and management
- Domain management
- Backup schedules and integrations
- System users management
- Teams and user settings

### Planned PAAS Providers
- Kinsta
- Rocket.net
- Runcloud
- Coolify
- InstaWP
- Cloudflare
- Vercel
- Netlify
- Render
- Fly.io
- Railway
- Laravel Forge
- Ploi

### Planned IAAS Providers
- AWS (ofc)
- GCP
- Azure
- Hetzner
- Digital Ocean
- Linode
- Vultr
- More...

### Planned APM Tools
- Posthog
- New Relic
- Sentry
- Datadog
- More...

---

## For Developers Only

**WARNING:** This section is for developers who want to explore the codebase. This is NOT an invitation to test or use the application.

### Prerequisites

- Node.js 18+
- npm or pnpm
- GridPane API credentials (for development only)

### Local Development Setup

```bash
# Clone the repository
git clone https://github.com/stackdock/stackdock.git
cd stackdock

# Install dependencies
npm install

# Copy environment file
cp example.env .env.local

# Add your API credentials to .env.local
# GRIDPANE_API_URL=https://my.gridpane.com/oauth/api/v1
# GRIDPANE_BEARER_TOKEN=your_token_here

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

**Note:** Development is conducted on the `debug/api-exploration` branch for API mapping work.

---

## Tech Stack

- **Framework:** [Next.js 15](https://nextjs.org/) with App Router
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **UI Components:** [shadcn/ui](https://ui.shadcn.com/)
- **Icons:** [Lucide Icons](https://lucide.dev/)
- **State Management:** React Server Components + Server Actions
- **Landing Page Deployment:** [Vercel](https://vercel.com/) (planned)

---

## Project Structure

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
├── docs/                # Documentation
│   └── gridpane/        # GridPane API documentation
├── public/              # Static assets
└── .github/
    └── instructions/    # Development documentation
```

---

## Configuration

### Environment Variables

Create a `.env.local` file in the root directory:

```bash
# GridPane API Configuration
GRIDPANE_API_URL=https://my.gridpane.com/oauth/api/v1
GRIDPANE_BEARER_TOKEN=your_bearer_token_here
```

### API Rate Limits

Stackdock includes rate limit discovery for GridPane:
- GET requests: 12 per minute per endpoint
- PUT requests: 2 per minute account-wide
- Automatic tracking and user feedback
- Request queuing to prevent 429 errors

---

## Development

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

This project follows strict TypeScript conventions:

- Strict mode enabled
- No console.logs in production code
- Design tokens only (no hardcoded colors)
- Consistent error handling
- Server Actions for all API calls
- shadcn/ui components for UI consistency

---

## Contributing

This project is not currently accepting contributions while core architecture is being established.

If you'd like to be notified when contributions are welcome, please star the repository.

---

## Documentation

- **Provider API Documentation:** `docs/{provider}/`
- **Code Conventions:** `.github/instructions/CONVENTIONS.md`
- **API Patterns:** `.github/instructions/API_PATTERNS.md`
- **Quick Reference:** `.github/instructions/QUICK_REFERENCE.md`

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Security

If you discover a security vulnerability, please email security@stackdock.dev immediately.

Do not create a public GitHub issue for security vulnerabilities.

---

## Contact

- **Security Issues:** security@stackdock.dev
- **General Inquiries:** contact@stackdock.dev
- **GitHub Issues:** [Report bugs](https://github.com/stackdock/stackdock/issues) (non-security only)

---

<div align="center">

  **Stackdock** - Built for managing multi-cloud infrastructure

  [Website](https://stackdock.dev)

</div>
