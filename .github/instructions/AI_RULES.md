# Stackdock Development Rules

See detailed conventions in:
- `CONVENTIONS.md` - Code standards and patterns
- `.github/instructions/AUDIT.md` - Quality checklist

## Always Follow
1. Read `CONVENTIONS.md` before suggesting code changes
2. Match existing patterns in the codebase
3. Use design system tokens, never hardcode colors
4. No console.log in production code (console.error/warn only)
5. Explicit TypeScript types, no `any`
6. Server actions: "use server" at file level
7. One concern per file

## File Structure
- API clients: `src/lib/[provider]/`
- Components: `src/components/[feature]/`
- Types: Co-locate or use `types.ts` in same directory

## When Suggesting Changes
1. Show full file path in code blocks
2. Use `// ...existing code...` for unchanged sections
3. Explain WHY, not just WHAT
4. Point out any deviations from conventions

## Red Flags to Avoid
- ❌ Hardcoded colors (bg-blue-500)
- ❌ Mixed async patterns
- ❌ Duplicate code
- ❌ Debug console.logs
- ❌ Unused imports
- ❌ `any` types

## Before Each Session
Ask: "Should I review CONVENTIONS.md and recent changes first?"
