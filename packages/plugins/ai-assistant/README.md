# @stackdock/plugins-ai-assistant

> **AI-powered infrastructure assistant for StackDock**

The first full-stack plugin for StackDock that demonstrates the plugin architecture pattern. Provides natural language interface for managing infrastructure.

## Features

- 🤖 **Natural Language Interface** - Ask questions about your infrastructure in plain English
- 🏗️ **Infrastructure Context** - AI has real-time access to your resources (servers, web services, domains)
- 🔒 **RBAC Protected** - Respects user permissions and RBAC rules
- 📊 **Audit Logged** - All AI interactions are logged for compliance
- ⚡ **Provider Agnostic** - Works with OpenAI or Anthropic (more providers coming)
- 🎨 **Beautiful UI** - Polished chat interface with Markdown support

## Installation

This is a plugin package. Install via the StackDock CLI (when available):

```bash
npx stackdock add ai-assistant
```

Or manually add to your project:

```bash
npm install @stackdock/plugins-ai-assistant
```

## Quick Start

### 1. Configure Environment Variables

```bash
# .env.local
VITE_OPENAI_API_KEY=sk-...
# OR
VITE_ANTHROPIC_API_KEY=sk-ant-...
```

### 2. Add Schema to Convex

```typescript
// convex/schema.ts
import { aiAssistantSchema } from '@stackdock/plugins-ai-assistant/schema'

export default defineSchema({
  // ... your existing tables
  ...aiAssistantSchema,
})
```

### 3. Initialize Plugin

```typescript
// apps/web/src/lib/plugins.ts
import { aiAssistantPlugin } from '@stackdock/plugins-ai-assistant'

export const plugins = {
  aiAssistant: aiAssistantPlugin({
    provider: 'openai', // or 'anthropic'
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
    model: 'gpt-4o', // optional
  })
}
```

### 4. Add to Your UI

```tsx
// apps/web/src/components/dashboard/Header.tsx
import { ChatDialog } from '@stackdock/plugins-ai-assistant/components/ChatDialog'
import { MessageSquare } from 'lucide-react'
import { useState } from 'react'

export function Header() {
  const [chatOpen, setChatOpen] = useState(false)
  
  return (
    <header>
      {/* ... your header content */}
      
      <Button 
        variant="ghost" 
        size="icon"
        onClick={() => setChatOpen(true)}
        title="AI Assistant"
      >
        <MessageSquare className="h-4 w-4" />
      </Button>
      
      <ChatDialog 
        open={chatOpen} 
        onOpenChange={setChatOpen} 
      />
    </header>
  )
}
```

### 5. Keyboard Shortcut (Optional)

```tsx
import { useEffect } from 'react'

export function App() {
  const [chatOpen, setChatOpen] = useState(false)
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey && e.shiftKey && e.key === 'k') {
        e.preventDefault()
        setChatOpen(true)
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])
  
  return (
    <ChatDialog open={chatOpen} onOpenChange={setChatOpen} />
  )
}
```

## Usage Examples

### Ask About Your Infrastructure

```
User: "Show me all my servers"
AI: "You have 5 servers across 3 providers:
     - 2 on DigitalOcean (Ubuntu 22.04)
     - 2 on Vultr (Ubuntu 20.04)
     - 1 on Hetzner (Debian 11)"
```

### Check Resource Status

```
User: "Which web services haven't been deployed recently?"
AI: "3 web services haven't been deployed in the last 7 days:
     - my-api (Vercel, last deployed 12 days ago)
     - landing-page (Netlify, last deployed 15 days ago)
     - blog (Cloudflare Pages, last deployed 20 days ago)"
```

### Get Recommendations

```
User: "Any critical issues I should know about?"
AI: "I've detected 2 potential issues:
     1. server-prod-1 has high CPU usage (92%) - consider scaling
     2. You have 3 unused domains expiring in 30 days"
```

## API Reference

### Plugin Configuration

```typescript
interface AIAssistantConfig {
  provider: 'openai' | 'anthropic'
  apiKey: string
  model?: string
  systemPrompt?: string
}
```

### React Hooks

#### `useChatSession()`

```typescript
import { useChatSession } from '@stackdock/plugins-ai-assistant/client'

function MyComponent() {
  const { messages, sendMessage, isLoading } = useChatSession()
  
  const handleSend = async () => {
    await sendMessage('Show me all my servers')
  }
  
  return (
    <div>
      {messages.map(msg => (
        <div key={msg.timestamp}>{msg.content}</div>
      ))}
      <button onClick={handleSend} disabled={isLoading}>
        Send
      </button>
    </div>
  )
}
```

### Components

#### `<ChatDialog />`

Main chat interface component.

```tsx
<ChatDialog 
  open={boolean}
  onOpenChange={(open: boolean) => void}
/>
```

#### `<ChatMessage />`

Individual message component.

```tsx
<ChatMessage 
  role="user" | "assistant"
  content={string}
  timestamp={number}
/>
```

#### `<ChatInput />`

Message input component.

```tsx
<ChatInput 
  onSend={(message: string) => void}
  disabled={boolean}
  placeholder={string}
/>
```

## Architecture

This plugin follows StackDock's three-registry architecture:

```
┌─────────────────────────────────────────┐
│  AI Assistant Plugin                     │
│                                          │
│  ┌────────────┐  ┌────────────────────┐ │
│  │  Backend   │  │     Client         │ │
│  │            │  │                    │ │
│  │ • Convex   │  │ • React Components │ │
│  │   Actions  │  │ • Hooks            │ │
│  │ • OpenAI   │  │ • UI               │ │
│  │ • Context  │  │                    │ │
│  └────────────┘  └────────────────────┘ │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │  Schema (aiChats table)            │ │
│  └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### Backend

- **Convex Actions**: Handle external API calls to OpenAI/Anthropic
- **Infrastructure Context**: Queries user's resources in real-time
- **RBAC Integration**: Enforces permissions
- **Audit Logging**: Tracks all AI interactions

### Client

- **React Components**: Beautiful chat UI
- **React Hooks**: State management and API calls
- **Markdown Rendering**: Supports rich formatting
- **Keyboard Shortcuts**: Quick access

### Schema

- **aiChats Table**: Stores conversation history
- **Multi-tenant**: Isolated by organization
- **Indexed**: Optimized queries by org/user

## Provider Support

### OpenAI

```typescript
aiAssistantPlugin({
  provider: 'openai',
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-4o', // or 'gpt-4o-mini' for lower cost
})
```

**Models**:
- `gpt-4o` - Best quality ($2.50/$10 per 1M tokens)
- `gpt-4o-mini` - Budget option ($0.15/$0.60 per 1M tokens)

### Anthropic

```typescript
aiAssistantPlugin({
  provider: 'anthropic',
  apiKey: process.env.ANTHROPIC_API_KEY,
  model: 'claude-3-5-sonnet-20241022', // or 'claude-3-5-haiku-20241022'
})
```

**Models**:
- `claude-3-5-sonnet-20241022` - Best for technical tasks ($3/$15 per 1M tokens)
- `claude-3-5-haiku-20241022` - Faster, cheaper ($0.80/$4 per 1M tokens)

## RBAC & Security

### Required Permission

Users need the `ai:chat` permission to use the assistant.

### RBAC Integration

```typescript
// Backend automatically enforces RBAC
export const chat = action({
  handler: withRBAC('ai:chat')(async (ctx, args, user) => {
    // Only users with ai:chat permission can call this
  }),
})
```

### Audit Logging

All interactions are logged:

```typescript
await auditLog(ctx, 'ai.chat', 'success', {
  userId: args.userId,
  messageCount: args.messages.length,
  provider: 'openai',
})
```

## Rate Limiting

Default: 50 messages per hour per user

Configure in environment:

```bash
VITE_AI_RATE_LIMIT=100  # messages per hour
```

## Cost Tracking

Plugin tracks API costs:

```typescript
{
  inputTokens: 1000,
  outputTokens: 500,
  estimatedCost: 0.0075, // USD
  provider: 'openai',
  model: 'gpt-4o'
}
```

## Development

### Setup

```bash
cd packages/plugins/ai-assistant
npm install
```

### Build

```bash
npm run build
```

### Test

```bash
npm test
```

### Type Check

```bash
npm run type-check
```

## Testing

Minimal test suite included:

```bash
npm test
```

Tests cover:
- Message formatting
- Provider configuration
- Component rendering
- Hook behavior

## Roadmap

- [x] OpenAI integration
- [x] Anthropic integration
- [x] Chat UI components
- [x] Infrastructure context
- [x] RBAC enforcement
- [x] Audit logging
- [ ] Streaming responses
- [ ] Voice input
- [ ] Action execution (create docks, provision resources)
- [ ] Suggested prompts
- [ ] Conversation history
- [ ] Export conversations

## Related Documentation

- [Plugin Architecture](../../docs/architecture/ARCHITECTURE.md#the-three-registries)
- [RBAC System](../../docs/architecture/SECURITY.md#rbac)
- [Stand-Downs Plan](../../docs/stand-downs/active/AI_ASSISTANT_PLUGIN_PLAN.md)

## License

MIT

## Contributing

This is the first full-stack plugin for StackDock. Contributions welcome!

See [CONTRIBUTING.md](../../../docs/guides/CONTRIBUTING.md) for guidelines.

---

**Status**: Active Development  
**Version**: 0.1.0  
**Plugin Type**: Full-stack (backend + client + schema)  
**First Plugin**: Yes - validates plugin architecture
