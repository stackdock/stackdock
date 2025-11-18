# StackDock CLI Plan

This document outlines how to build the StackDock CLI, inspired by the shadcn/ui CLI model and using `@sst/opentui` for an interactive TUI experience.

---

## Goals

- Provide an `npx stackdock` / `stackdock` command.
- Follow the **shadcn/ui** pattern: copy template code into the user’s repo so they own it.
- Use **`@sst/opentui`** for interactive flows (select providers, destinations, etc.).
- Support:
  - `stackdock init`
  - `stackdock add-dock <provider>`
  - `stackdock add-ui <component>`

---

## High-Level Design

### 1. Package Setup (`@stackdock/cli`)

Create a CLI package in your monorepo (e.g. `packages/cli`):

```jsonc
{
  "name": "@stackdock/cli",
  "version": "0.1.0",
  "private": false,
  "bin": {
    "stackdock": "dist/index.js"
  },
  "type": "module",
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "dev": "ts-node src/index.ts"
  },
  "dependencies": {
    "@sst/opentui": "^<latest>",
    "commander": "^12.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "ts-node": "^10.0.0"
  }
}
```

This exposes a `stackdock` binary when the package is installed or run via `npx`.

---

### 2. CLI Entrypoint

Use a small CLI helper (like `commander`) to set up commands, and delegate to command handlers that can use OpenTUI.

```ts
#!/usr/bin/env node
import { Command } from "commander";
import { runInitWizard } from "./commands/init";
import { runAddDockWizard } from "./commands/add-dock";
import { runAddUIWizard } from "./commands/add-ui";

const program = new Command();

program
  .name("stackdock")
  .description("StackDock CLI - manage docks and UI registries")
  .version("0.1.0");

program
  .command("init")
  .description("Initialize StackDock in the current project")
  .action(async () => {
    await runInitWizard();
  });

program
  .command("add-dock")
  .argument("[provider]", "Provider id (e.g. vercel, netlify, coolify)")
  .description("Add a dock adapter to your project (shadcn-style)")
  .action(async (provider) => {
    await runAddDockWizard(provider);
  });

program
  .command("add-ui")
  .argument("[component]", "UI component name (e.g. servers-table)")
  .description("Add a UI component from the registry")
  .action(async (component) => {
    await runAddUIWizard(component);
  });

program.parseAsync(process.argv);
```

---

### 3. Using `@sst/opentui` for Interactive Flows

Use `@sst/opentui` as the UI layer for the CLI to prompt users for missing arguments and options.

Example: `add-dock` wizard.

```ts
import { createApp, select, textInput } from "@sst/opentui";

const AVAILABLE_PROVIDERS = [
  { id: "vercel", label: "Vercel" },
  { id: "netlify", label: "Netlify" },
  { id: "cloudflare", label: "Cloudflare" },
  { id: "coolify", label: "Coolify" }
  // ...
];

export async function runAddDockWizard(providerArg?: string) {
  let providerId = providerArg;

  if (!providerId) {
    const app = createApp();
    const provider = await app.use(
      select({
        title: "Select a provider to add",
        options: AVAILABLE_PROVIDERS.map((p) => ({
          label: p.label,
          value: p.id
        }))
      })
    );
    providerId = provider;
  }

  const app = createApp();
  const destPath = await app.use(
    textInput({
      label: "Destination path for the dock adapter",
      defaultValue: "packages/docks/src/adapters"
    })
  );

  await scaffoldDock(providerId!, destPath);
}
```

---

### 4. shadcn-style Template Scaffolding

Mimic shadcn/ui: ship templates within the CLI package and copy them into the user’s repo.

**Template layout inside `@stackdock/cli`:**

- `templates/docks/vercel.ts`
- `templates/docks/netlify.ts`
- `templates/docks/cloudflare.ts`
- `templates/ui/servers-table.tsx`
- etc.

**Scaffolding function:**

```ts
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function scaffoldDock(providerId: string, destDir: string) {
  const templatePath = path.join(
    __dirname,
    "..",
    "templates",
    "docks",
    `${providerId}.ts`
  );

  const contents = await fs.readFile(templatePath, "utf8");

  const cwd = process.cwd();
  const destination = path.join(cwd, destDir, `${providerId}.ts`);

  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.writeFile(destination, contents, "utf8");

  // Optionally: update a central dock registry file.
}
```

Same pattern can be used for UI components (`add-ui`).

---

## Mapping to Your Questions

- **What shadcn/ui uses**  
  - A Node CLI exposed via `bin` in `package.json`.  
  - Template files that are copied into the user’s project.  
  - Simple argument parsing; everything else is just file operations and config updates.

- **Using `@sst/opentui`**  
  - Wrap the CLI flows in an interactive TUI instead of raw `inquirer` prompts.  
  - Use OpenTUI for:
    - Provider selection
    - Destination path selection
    - Future options (e.g., read-only vs future write-mode scaffolding, etc.)

---

## Minimal First Version Checklist

1. Create `@stackdock/cli` in `packages/cli` with a `stackdock` binary.
2. Implement:
   - `stackdock init` (basic initialization & config).
   - `stackdock add-dock <provider>` (copy dock templates).
3. Use `@sst/opentui` for:
   - Selecting `provider` when omitted.
   - Selecting destination path.
4. Later, add:
   - `stackdock add-ui <component>` for UI registry components.
   - Additional recipes (e.g. “add base providers”).
