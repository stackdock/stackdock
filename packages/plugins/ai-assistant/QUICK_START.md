# AI Assistant Plugin - Quick Start Guide

> **5-Minute Integration Guide**

## Prerequisites

- StackDock app running (`apps/web`)
- Convex configured and running
- OpenAI or Anthropic API key

---

## Step 1: Install Dependencies (1 min)

```bash
cd packages/plugins/ai-assistant
npm install
npm run build
```

Add to `apps/web/package.json`:
```json
{
  "dependencies": {
    "@stackdock/plugins-ai-assistant": "file:../../packages/plugins/ai-assistant"
  }
}
```

Then:
```bash
cd ../../apps/web
npm install
```

---

## Step 2: Environment Variables (1 min)

Add to `apps/web/.env.local`:

```bash
# OpenAI (recommended)
VITE_OPENAI_API_KEY=sk-...

# OR Anthropic
VITE_ANTHROPIC_API_KEY=sk-ant-...
```

---

## Step 3: Add Schema to Convex (1 min)

Update `convex/schema.ts`:

```typescript
import { defineSchema } from 'convex/server'
import { aiAssistantSchema } from '@stackdock/plugins-ai-assistant/schema'

export default defineSchema({
  // ... your existing tables
  ...aiAssistantSchema,
})
```

Push schema:
```bash
npx convex dev  # or restart Convex if already running
```

---

## Step 4: Create Convex Action (2 min)

Create `convex/ai/actions.ts`:

```typescript
import { action } from '../_generated/server'
import { v } from 'convex/values'
import { buildSystemPrompt, callOpenAI } from '@stackdock/plugins-ai-assistant/backend'

export const chat = action({
  args: {
    orgId: v.string(),
    userId: v.string(),
    messages: v.array(v.object({
      role: v.union(v.literal('user'), v.literal('assistant'), v.literal('system')),
      content: v.string(),
      timestamp: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    // Build infrastructure context
    const context = {
      servers: { count: 0, providers: [] },
      webServices: { count: 0, providers: [] },
      domains: { count: 0, providers: [] },
      databases: { count: 0, providers: [] },
    }
    
    const systemPrompt = buildSystemPrompt(context)
    
    // Call OpenAI
    const response = await callOpenAI(
      [
        { role: 'system', content: systemPrompt },
        ...args.messages.map(m => ({ role: m.role, content: m.content })),
      ],
      process.env.OPENAI_API_KEY!,
      'gpt-4o'
    )
    
    return response
  },
})
```

---

## Step 5: Add to UI (30 sec)

Update `apps/web/src/components/dashboard/Header.tsx`:

```tsx
import { ChatDialog } from '@stackdock/plugins-ai-assistant/components/ChatDialog'
import { MessageSquare } from 'lucide-react'
import { useState } from 'react'

export function Header() {
  const [chatOpen, setChatOpen] = useState(false)
  
  return (
    <header className="flex items-center justify-between p-4">
      {/* ... existing header content ... */}
      
      {/* AI Assistant Button */}
      <button
        onClick={() => setChatOpen(true)}
        className="p-2 hover:bg-gray-100 rounded"
        title="AI Assistant (⌘⇧K)"
      >
        <MessageSquare className="h-5 w-5" />
      </button>
      
      {/* Chat Dialog */}
      <ChatDialog open={chatOpen} onOpenChange={setChatOpen} />
    </header>
  )
}
```

---

## Step 6: Test (30 sec)

1. Start app: `npm run dev`
2. Open browser: `http://localhost:3000`
3. Click AI Assistant icon in header
4. Type: "Hello, what can you help me with?"
5. Click Send

You should see a response from the AI!

---

## Optional: Keyboard Shortcut

Add global keyboard shortcut in `apps/web/src/routes/__root.tsx`:

```tsx
import { useEffect, useState } from 'react'
import { ChatDialog } from '@stackdock/plugins-ai-assistant/components/ChatDialog'

export function RootLayout() {
  const [chatOpen, setChatOpen] = useState(false)
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+Shift+K or Ctrl+Shift+K
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'k') {
        e.preventDefault()
        setChatOpen(true)
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])
  
  return (
    <>
      {/* Your app layout */}
      <ChatDialog open={chatOpen} onOpenChange={setChatOpen} />
    </>
  )
}
```

---

## Troubleshooting

### "Module not found: @stackdock/plugins-ai-assistant"
- Run `npm install` in both `packages/plugins/ai-assistant` and `apps/web`
- Rebuild: `cd packages/plugins/ai-assistant && npm run build`

### "OPENAI_API_KEY is not defined"
- Check `.env.local` has the key
- Restart dev server after adding env vars
- Make sure it's `VITE_OPENAI_API_KEY` (with `VITE_` prefix)

### "Chat dialog doesn't open"
- Check browser console for errors
- Verify ChatDialog is imported correctly
- Check that `open` prop is being set to `true`

### "No response from AI"
- Check browser console for API errors
- Verify API key is valid
- Check Convex action is running (check Convex dashboard)

---

## Next Steps

After basic integration works:

1. **Add Infrastructure Context** - Make AI aware of actual resources
2. **Implement RBAC** - Add `ai:chat` permission
3. **Add Audit Logging** - Track all AI interactions
4. **Improve UI** - Add Markdown rendering, syntax highlighting
5. **Add Rate Limiting** - Prevent abuse

See `IMPLEMENTATION_STATUS.md` for full roadmap.

---

## Help

**Documentation**:
- Full README: `packages/plugins/ai-assistant/README.md`
- Implementation Plan: `docs/stand-downs/active/AI_ASSISTANT_PLUGIN_PLAN.md`

**Issues**:
- Check GitHub Issues
- Ask in StackDock Discord/Slack

---

**Estimated Time**: 5 minutes  
**Difficulty**: Easy  
**Prerequisites**: OpenAI API key, Convex running
