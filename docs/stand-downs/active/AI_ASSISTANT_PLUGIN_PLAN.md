# AI Assistant Plugin - Implementation Plan

**Mission**: New Feature - AI Infrastructure Assistant  
**Status**: Active - Staging Option 1  
**Priority**: Medium  
**Package**: `packages/plugins/ai-assistant/`

---

## Overview

Build an AI-powered assistant that helps users manage their infrastructure through natural language. Follows StackDock's plugin architecture pattern as the first full-stack plugin implementation.

---

## Architecture Decision

### ✅ Option 1: Build as Plugin (STAGING NOW)

**Create**: `packages/plugins/ai-assistant/`

**Why**:
- AI chat is a complete full-stack feature (routes + API + schema + components)
- Validates the plugin system architecture (first real plugin)
- Reusable across apps (web, docs, marketing)
- Aligns with StackDock's vision

**Structure**:
```
packages/plugins/ai-assistant/
├── src/
│   ├── backend.ts        # Convex actions (OpenAI/Anthropic calls)
│   ├── client.ts         # React components + hooks
│   ├── schema.ts         # aiChats table definition
│   ├── types.ts          # TypeScript types
│   └── components/
│       ├── ChatDialog.tsx
│       ├── ChatMessage.tsx
│       ├── ChatInput.tsx
│       └── ChatThinking.tsx
├── package.json
├── README.md
├── tsconfig.json
└── tests/
    ├── backend.test.ts
    └── client.test.ts
```

---

### 📋 Option 2: Utility Package Pattern (FALLBACK PLAN)

**Create**: `packages/ai/` (like `packages/monitoring/`)

**When to use**:
- If plugin system proves too complex for MVP
- If we need AI utilities FAST
- If plugin architecture isn't ready

**Structure**:
```
packages/ai/
├── src/
│   ├── core.ts           # Core AI utilities
│   ├── index.ts          # Public exports
│   ├── providers/
│   │   ├── openai.ts     # OpenAI provider
│   │   ├── anthropic.ts  # Anthropic provider
│   │   └── types.ts      # Provider interface
│   └── react.tsx         # React hooks (useSendMessage)
├── package.json
├── README.md
└── tests/
```

**Usage Pattern** (if fallback needed):
```typescript
// apps/web/src/lib/ai.ts
import { initAI } from '@stackdock/ai'
import { OpenAIProvider } from '@stackdock/ai/providers/openai'

export const ai = initAI({
  provider: new OpenAIProvider({
    apiKey: process.env.OPENAI_API_KEY,
    model: 'gpt-4o',
  })
})

// apps/web/src/components/ai/ChatDialog.tsx
import { useSendMessage } from '@stackdock/ai/react'

export function ChatDialog() {
  const { sendMessage, messages, isLoading } = useSendMessage()
  // ...
}
```

**Provider Abstraction**:
```typescript
// packages/ai/src/providers/types.ts
export interface AIProvider {
  name: string
  chat(messages: Message[]): Promise<string>
  streamChat(messages: Message[]): AsyncGenerator<string>
}

// packages/ai/src/providers/openai.ts
export class OpenAIProvider implements AIProvider {
  name = 'openai'
  
  async chat(messages: Message[]): Promise<string> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        messages,
      }),
    })
    const data = await response.json()
    return data.choices[0].message.content
  }
}

// packages/ai/src/providers/anthropic.ts
export class AnthropicProvider implements AIProvider {
  name = 'anthropic'
  
  async chat(messages: Message[]): Promise<string> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        messages,
      }),
    })
    const data = await response.json()
    return data.content[0].text
  }
}
```

**Migration Path** (if needed):
1. **Week 1**: Extract utilities to `packages/ai/` if plugin is too slow
2. **Week 2**: Build UI components in `apps/web/src/components/ai/`
3. **Mission 3+**: Migrate to full plugin when plugin system is ready

---

## Implementation Plan - Option 1 (Plugin)

### Phase 1: Plugin Core Setup (2-3 hours)

#### 1.1 Package Structure
- [x] Create `packages/plugins/ai-assistant/` directory
- [ ] Create `package.json` with dependencies
- [ ] Create `tsconfig.json` extending root config
- [ ] Create `README.md` with usage examples

#### 1.2 Type Definitions
**File**: `packages/plugins/ai-assistant/src/types.ts`

```typescript
export interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
}

export interface ChatSession {
  id: string
  orgId: string
  userId: string
  messages: Message[]
  context?: {
    resourceType?: string
    resourceIds?: string[]
  }
  createdAt: number
  updatedAt: number
}

export interface AIProvider {
  chat(messages: Message[], context?: any): Promise<string>
  streamChat(messages: Message[], context?: any): AsyncGenerator<string>
}

export interface AIAssistantConfig {
  provider: 'openai' | 'anthropic'
  apiKey: string
  model?: string
  systemPrompt?: string
}
```

#### 1.3 Schema Definition
**File**: `packages/plugins/ai-assistant/src/schema.ts`

```typescript
import { defineTable } from 'convex/server'
import { v } from 'convex/values'

export const aiAssistantSchema = {
  aiChats: defineTable({
    orgId: v.string(),
    userId: v.string(),
    messages: v.array(v.object({
      role: v.union(v.literal('user'), v.literal('assistant'), v.literal('system')),
      content: v.string(),
      timestamp: v.number(),
    })),
    context: v.optional(v.object({
      resourceType: v.optional(v.string()),
      resourceIds: v.optional(v.array(v.string())),
    })),
  })
    .index('by_org', ['orgId'])
    .index('by_user', ['userId'])
    .index('by_org_and_user', ['orgId', 'userId']),
}
```

---

### Phase 2: Backend Plugin (3-4 hours)

#### 2.1 Convex Action for AI Calls
**File**: `packages/plugins/ai-assistant/src/backend.ts`

```typescript
import { action } from 'convex/_generated/server'
import { v } from 'convex/values'

export const chat = action({
  args: {
    orgId: v.string(),
    userId: v.string(),
    messages: v.array(v.object({
      role: v.union(v.literal('user'), v.literal('assistant'), v.literal('system')),
      content: v.string(),
      timestamp: v.number(),
    })),
    context: v.optional(v.object({
      resourceType: v.optional(v.string()),
      resourceIds: v.optional(v.array(v.string())),
    })),
  },
  handler: async (ctx, args) => {
    // Get infrastructure context
    const servers = await ctx.runQuery(/* ... */)
    const webServices = await ctx.runQuery(/* ... */)
    
    // Build system prompt with context
    const systemPrompt = `You are an infrastructure assistant for StackDock.
      
User has access to:
- ${servers.length} servers
- ${webServices.length} web services
      
Respond helpfully about their infrastructure.`
    
    // Call OpenAI/Anthropic
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          ...args.messages,
        ],
      }),
    })
    
    const data = await response.json()
    return {
      role: 'assistant' as const,
      content: data.choices[0].message.content,
      timestamp: Date.now(),
    }
  },
})
```

#### 2.2 Provider Abstraction
**File**: `packages/plugins/ai-assistant/src/providers/openai.ts`  
**File**: `packages/plugins/ai-assistant/src/providers/anthropic.ts`

---

### Phase 3: Client Plugin (4-5 hours)

#### 3.1 React Components

**File**: `packages/plugins/ai-assistant/src/components/ChatDialog.tsx`
- Main chat dialog component
- Message list with auto-scroll
- Input field with send button
- Keyboard shortcuts (Cmd+Shift+K)

**File**: `packages/plugins/ai-assistant/src/components/ChatMessage.tsx`
- Individual message component
- User/assistant styling
- Markdown rendering
- Code syntax highlighting

**File**: `packages/plugins/ai-assistant/src/components/ChatInput.tsx`
- Textarea with auto-resize
- Send button
- Loading states
- Character counter

**File**: `packages/plugins/ai-assistant/src/components/ChatThinking.tsx`
- Loading animation
- "Thinking..." indicator

#### 3.2 React Hooks

**File**: `packages/plugins/ai-assistant/src/client.ts`

```typescript
import { useAction } from 'convex/react'
import { useState } from 'react'

export function useChatSession() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const chat = useAction(/* backend.chat */)
  
  const sendMessage = async (content: string) => {
    setIsLoading(true)
    const userMessage = { role: 'user', content, timestamp: Date.now() }
    setMessages(prev => [...prev, userMessage])
    
    try {
      const response = await chat({
        messages: [...messages, userMessage],
        /* ... */
      })
      setMessages(prev => [...prev, response])
    } catch (error) {
      console.error('Chat error:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  return { messages, sendMessage, isLoading }
}
```

---

### Phase 4: Integration (2-3 hours)

#### 4.1 Add to Convex Schema
**File**: `convex/schema.ts`

```typescript
import { aiAssistantSchema } from '@stackdock/plugins/ai-assistant/schema'

export default defineSchema({
  // ... existing tables
  ...aiAssistantSchema,
})
```

#### 4.2 Add to Apps/Web
**File**: `apps/web/src/lib/plugins.ts` (new file)

```typescript
import { aiAssistantPlugin } from '@stackdock/plugins/ai-assistant'

export const plugins = {
  aiAssistant: aiAssistantPlugin({
    provider: 'openai',
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  })
}
```

**File**: `apps/web/src/components/dashboard/Header.tsx`

Add AI Assistant button:
```tsx
import { ChatDialog } from '@stackdock/plugins/ai-assistant/components/ChatDialog'

export function Header() {
  const [chatOpen, setChatOpen] = useState(false)
  
  return (
    <header>
      {/* ... existing header */}
      <Button 
        variant="ghost" 
        size="icon"
        onClick={() => setChatOpen(true)}
      >
        <MessageSquare className="h-4 w-4" />
      </Button>
      
      <ChatDialog open={chatOpen} onOpenChange={setChatOpen} />
    </header>
  )
}
```

#### 4.3 Environment Variables
**File**: `apps/web/.env.local`

```bash
# AI Assistant
VITE_OPENAI_API_KEY=sk-...
# OR
VITE_ANTHROPIC_API_KEY=sk-ant-...
```

---

### Phase 5: Testing (2-3 hours)

#### 5.1 Minimal Test Suite
**File**: `packages/plugins/ai-assistant/tests/backend.test.ts`

```typescript
import { describe, it, expect } from 'vitest'

describe('AI Assistant Backend', () => {
  it('should format messages correctly', () => {
    const messages = [{ role: 'user', content: 'Hello' }]
    expect(messages).toHaveLength(1)
  })
  
  it('should have API key configured', () => {
    expect(process.env.OPENAI_API_KEY).toBeDefined()
  })
})
```

#### 5.2 Component Tests
**File**: `packages/plugins/ai-assistant/tests/client.test.tsx`

```typescript
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { ChatMessage } from '../src/components/ChatMessage'

describe('ChatMessage', () => {
  it('renders user message', () => {
    const { getByText } = render(
      <ChatMessage role="user" content="Hello" />
    )
    expect(getByText('Hello')).toBeDefined()
  })
})
```

---

## Infrastructure Context Features

### Phase 6: Infrastructure Integration (Advanced)

#### 6.1 Context-Aware Responses
AI has access to user's resources:

```typescript
// Get user's infrastructure context
const context = {
  servers: await ctx.runQuery(api.resources.servers.list, { orgId }),
  webServices: await ctx.runQuery(api.resources.webServices.list, { orgId }),
  domains: await ctx.runQuery(api.resources.domains.list, { orgId }),
  databases: await ctx.runQuery(api.resources.databases.list, { orgId }),
}

// Include in system prompt
const systemPrompt = `You are an infrastructure assistant.

User's Infrastructure:
- ${context.servers.length} servers (${context.servers.map(s => s.provider).join(', ')})
- ${context.webServices.length} web services
- ${context.domains.length} domains
- ${context.databases.length} databases

Answer questions about their actual infrastructure.`
```

#### 6.2 Suggested Prompts
Based on current page context:

```typescript
export function getSuggestedPrompts(page: string) {
  switch (page) {
    case '/dashboard/infrastructure/servers':
      return [
        'Show me servers with high CPU usage',
        'Which servers need updates?',
        'What providers do I have servers with?',
      ]
    case '/dashboard/infrastructure/web-services':
      return [
        'Which services haven\'t been deployed recently?',
        'Show me all Vercel deployments',
        'What services are using the most resources?',
      ]
    default:
      return [
        'What\'s the status of my infrastructure?',
        'Any critical issues I should know about?',
        'Show me a summary of all resources',
      ]
  }
}
```

---

## RBAC Integration

### Phase 7: Security & Permissions (1-2 hours)

#### 7.1 RBAC Checks
```typescript
export const chat = action({
  handler: withRBAC('ai:chat')(async (ctx, args, user) => {
    // User must have ai:chat permission
    // ...
  }),
})
```

#### 7.2 Audit Logging
```typescript
await auditLog(ctx, 'ai.chat', 'success', {
  userId: args.userId,
  messageCount: args.messages.length,
  hasContext: !!args.context,
})
```

---

## Cost Management

### Phase 8: Rate Limiting & Costs (1-2 hours)

#### 8.1 Rate Limiting
```typescript
const RATE_LIMIT = 50 // messages per hour

export const chat = action({
  handler: async (ctx, args) => {
    const recentMessages = await ctx.runQuery(/* count recent messages */)
    
    if (recentMessages >= RATE_LIMIT) {
      throw new Error('Rate limit exceeded. Please wait before sending more messages.')
    }
    
    // ... proceed
  },
})
```

#### 8.2 Cost Tracking
```typescript
const estimatedCost = {
  inputTokens: 1000,
  outputTokens: 500,
  cost: (1000 * 0.0025 + 500 * 0.010) / 1_000_000, // GPT-4o pricing
}

await ctx.runMutation(/* track cost */)
```

---

## Timeline

### Week 1: Core Plugin
- Day 1-2: Package structure, types, schema
- Day 3-4: Backend plugin (OpenAI integration)
- Day 5: Testing backend

### Week 2: Frontend
- Day 1-2: React components
- Day 3: React hooks
- Day 4: Integration with apps/web
- Day 5: Testing components

### Week 3: Advanced Features
- Day 1-2: Infrastructure context
- Day 3: Suggested prompts
- Day 4: RBAC + audit logging
- Day 5: Rate limiting + cost tracking

---

## Success Criteria

- [ ] User can open chat dialog with keyboard shortcut
- [ ] User can send message and receive response
- [ ] AI has context about user's infrastructure
- [ ] RBAC enforced (only users with ai:chat permission)
- [ ] Audit logs track all AI interactions
- [ ] Rate limiting prevents abuse
- [ ] Cost tracking monitors API usage
- [ ] Tests cover core functionality
- [ ] Documentation complete

---

## Dependencies

**Required**:
- OpenAI API key OR Anthropic API key
- Convex actions working
- RBAC system functional
- Audit logging functional

**Optional**:
- Plugin system fully defined (can proceed without full plugin system)
- Fallback to Option 2 if plugin architecture too complex

---

## Fallback Strategy

If plugin architecture proves too complex or time-consuming:

1. **Immediate**: Switch to Option 2 (utility package)
2. **Create**: `packages/ai/` with provider abstraction
3. **Build**: UI components in `apps/web/src/components/ai/`
4. **Later**: Migrate to full plugin when plugin system matures

**Decision Point**: End of Phase 1 (after 2-3 hours)
**Criteria**: If package structure + types + schema takes >4 hours, switch to Option 2

---

## Notes

- Plugin system is in "prototype/planning" phase - this validates it
- First real full-stack plugin implementation
- Proves copy/paste/own model works
- Can be published to registry later
- Option 2 (utility package) ready as fallback

---

## References

- `packages/plugins/README.md` - Plugin architecture philosophy
- `packages/monitoring/` - Similar provider abstraction pattern
- `docs/architecture/ARCHITECTURE.md` - The Three Registries
- `.cursorrules` - RBAC, encryption, audit requirements

---

**Status**: Active - Staging Option 1  
**Owner**: Captain  
**Updated**: 2025-11-27
