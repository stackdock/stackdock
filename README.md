![Image of Stackdock logo](/public/stackdock-logo-dark-mode.svg "Stackdock logo")

<div align="center">
  <h1>StackDock</h1>
  <p><strong>Open Source Multi-Cloud Management Platform</strong></p>
  <p>Manage websites, apps, databases, servers, and APM tools across multiple providers from a unified interface.</p>
  <p>
    <a href="https://nextjs.org/">
      <img src="https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js" alt="Next.js"/>
    </a>
    <a href="https://www.typescriptlang.org/">
      <img src="https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square&logo=typescript" alt="TypeScript"/>
    </a>
    <a href="LICENSE">
      <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="License"/>
    </a>
     <a href="https://github.com/stackdock/stackdock/stargazers">
      <img src="https://img.shields.io/github/stars/stackdock/stackdock?style=flat-square&logo=github" alt="GitHub stars"/>
    </a>
  </p>
</div>

---

## Welcome Aboard Captain! ⚓️

If you're seeing this message, you're early – but welcome to the shipyard! The actual code is still under heavy construction, but the blueprints are evolving, the harbor is secured (`stackdock.com`, `.dev`, `.ai`, `.io`, `.net`, `.org`, `.app`, `.co`, all major social handles, and trademark pending™️), the mission is locked in.

This isn't just another tool. It's the culmination of years spent navigating the chaos of multi-cloud myself. StackDock is being built to be the command center I wish I always had – the home port for your entire digital fleet.

A composable cloud.

Seeing interest already, even at this stage, tells me we're charting the right course. Thanks for being here at the beginning. **Star the repo to watch the build and join the voyage!** ⭐

---

## ⚠️ WARNING: PRE-ALPHA - HEAVY DEVELOPMENT ⚠️

**This project is in a very early, active development stage and is NOT ready for production use, testing, or deployment.**

* Core features are missing or incomplete.
* API integrations are actively being explored and may change.
* **Breaking changes will occur frequently and without notice.**
* There are **NO STABILITY GUARANTEES** of any kind.
* Critical components like database schema and robust authentication are not yet implemented.

**DO NOT use this in any production environment or connect it to critical infrastructure.** Star the repository for updates on future, stable releases.

---

## 🧭 Project Vision & Roadmap

StackDock aims to provide a unified interface for managing resources across various cloud (IaaS/PaaS) and service providers.

**Current Focus (Pre-MVP):**

* **API Exploration:** Systematically mapping and testing the GridPane API (`debug/api-exploration` branch).
* **Core UI Foundation:** Building the main dashboard layout, navigation, and core components using shadcn/ui.
* **Type Safety & DX:** Establishing robust TypeScript patterns and developer workflows.

**Planned MVP Goals:**

* **Multi-Provider Read-Only View:** Connect at least 2-3 providers (e.g., GridPane, Vercel, DigitalOcean) and display core resources (servers, sites, deployments) in a unified dashboard.
* **Basic APM Integration:** Connect at least one APM tool (e.g., Sentry) to display basic project health alongside infrastructure.
* **Intuitive Navigation:** Implement the simplified `/dashboard`, `/projects`, `/infrastructure`, `/operations` navigation structure.
* **Themeable UI:** Support for light/dark modes and basic theme customization.

**Future Vision (Post-MVP):**

* **Write Operations (Mutations):** Gradually add actions like restarting servers, deploying sites, clearing caches, managing backups.
* **Wider Provider Support:** Integrate the extensive list of PaaS, IaaS, and APM providers (see below).
* **Automation Engine:** Implement workflows for scheduled tasks, alert-driven actions, and automated provisioning/scaling.
* **Composable UI:** Explore custom shadcn/ui registry for user-customizable interfaces.
* **Autonomous Capabilities:** Long-term vision includes AI-driven optimization, self-healing, and intent-based infrastructure management.

---

## 🔌 Planned Integrations (Examples)

* **Server Panels/PaaS:** GridPane, Kinsta, Rocket.net, RunCloud, Coolify, Cloudflare, Vercel, Netlify, Render, Fly.io, Railway, Laravel Forge, Ploi, InstaWP
* **IaaS:** AWS, GCP, Azure, Hetzner, Digital Ocean, Linode, Vultr
* **APM:** Posthog, New Relic, Sentry, Datadog

*(This list is ambitious and will be prioritized based on community feedback and development progress.)*

---

## 💻 Tech Stack

* **Framework:** [Next.js 15](https://nextjs.org/) (App Router)
* **Language:** [TypeScript](https://www.typescriptlang.org/)
* **Styling:** [Tailwind CSS](https://tailwindcss.com/)
* **UI Components:** [shadcn/ui](https://ui.shadcn.com/)
* **Icons:** [Lucide React](https://lucide.dev/)
* **State/Fetching:** React Server Components, Server Actions, SWR/React Query (TBD)
* **(Planned) Database:** Turso / LibSQL
* **(Planned) Authentication:** NextAuth.js

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
