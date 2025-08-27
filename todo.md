# Stackdock Todo's

## Setup
- [X] Install Next 15, Tailwind 4, Shadcn
- [X] Custom Font
- [X] lib folder utilization for external api
- [ ] Auth
  - [ ] Better Auth?
  - [ ] Login, Signup, Forgot Password
  - [ ] Github integration
- [ ] Database
  - [ ] Works with auth
  - [ ] ORM? Drizzle
- [ ] Frontend
  - [ ] Component organizaion
  - [ ] Proper Code splitting
- [ ] Caching
  - [ ] Figure out generation method
  - [ ] Use next.js built in features first
- [ ] API connections
  - [ ] Gridpane
    - [ ] GET Endpoints
      - [X] Sites
      - [X] Site ID
      - [X] Servers
      - [X] Server ID
      - [X] User
      - [X] System User
      - [X] Backup Integrations
      - [X] Backup Schedules
      - [X] Domains
    - [ ] POST Endpoints
    - [ ] PUT Endpoints
    - [ ] DELETE Endpoints

# OSS Workflow

-[X] Create Daily Branch test
-[X] FITYMI

- [ ] Create `.github/` folder with:
  - [ ] `workflows/ci.yml` (lint, test, build on PR + push to main)
  - [ ] `workflows/deploy-preview.yml` (PR preview deploys via Vercel)
  - [ ] `ISSUE_TEMPLATE.md` (structured issue format)
  - [ ] `PULL_REQUEST_TEMPLATE.md` (PR checklist + issue linking)

- [ ] Add GitHub repo secrets (Settings → Secrets and variables → Actions):
  - [ ] `VERCEL_TOKEN`
  - [ ] `VERCEL_ORG_ID`
  - [ ] `VERCEL_PROJECT_ID`

- [ ] Ensure `package.json` scripts exist:
  - [ ] `"lint": "next lint"`
  - [ ] `"test": "jest"` (or other test runner, optional)
  - [ ] `"build": "next build"`

- [ ] Open a test PR:
  - [ ] Verify **CI runs** (lint/test/build pass)
  - [ ] Verify **Preview URL** is generated from Vercel

- [ ] Start using Issues for all work:
  - [ ] Create issue before starting work
  - [ ] Branch naming: `feature/{issue#}-short-desc`, `bugfix/{issue#}-short-desc`
  - [ ] Reference issue in PR with `Closes #{issue}`

- [ ] (Optional) Add default labels:
  - [ ] `bug`
  - [ ] `enhancement`
  - [ ] `docs`
  - [ ] `good first issue`
  - [ ] `help wanted`
