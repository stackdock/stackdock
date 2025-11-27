# AI Assistant Plugin - Implementation Status

**Package**: `@stackdock/plugins-ai-assistant`  
**Status**: Scaffolded (Option 1)  
**Created**: 2025-11-27  
**Implementation Plan**: See `docs/stand-downs/active/AI_ASSISTANT_PLUGIN_PLAN.md`

---

## ✅ Completed (Scaffolded)

### Package Structure
- [x] `package.json` - Package configuration with all dependencies
- [x] `tsconfig.json` - TypeScript configuration
- [x] `README.md` - Comprehensive documentation
- [x] `IMPLEMENTATION_STATUS.md` - This file

### Source Code (Scaffolded)
- [x] `src/types.ts` - TypeScript type definitions
- [x] `src/schema.ts` - Convex schema for aiChats table
- [x] `src/index.ts` - Main entry point with exports
- [x] `src/backend.ts` - Backend utilities (OpenAI/Anthropic API calls)
- [x] `src/client.ts` - React hooks (`useChatSession`, `getSuggestedPrompts`)

### Components (Scaffolded)
- [x] `src/components/ChatDialog.tsx` - Main chat dialog UI
- [x] `src/components/ChatMessage.tsx` - Individual message component
- [x] `src/components/ChatInput.tsx` - Message input component

### Tests (Minimal)
- [x] `tests/backend.test.ts` - Backend utility tests
- [x] `tests/client.test.tsx` - Component tests

---

## 🚧 What's Scaffolded vs. What Needs Work

### Scaffolded ✅
These files exist and have structure, but are placeholders:

1. **Components** - Basic UI structure without:
   - shadcn/ui integration
   - Markdown rendering
   - Code syntax highlighting
   - Proper Tailwind styling

2. **Backend** - Utility functions for API calls, but not integrated with Convex actions

3. **Client Hook** - `useChatSession` exists but doesn't call real Convex actions

4. **Tests** - Minimal smoke tests, not comprehensive

### Needs Implementation 🚧

#### Phase 1: Integration (Next Steps)
1. **Convex Integration**
   - Create `convex/ai/actions.ts` in main app
   - Wire up `useChatSession` to use Convex actions
   - Add aiChats table to main schema

2. **Component Integration**
   - Import shadcn/ui components (Dialog, ScrollArea, Button)
   - Add proper Tailwind styling
   - Integrate with apps/web Header

3. **Environment Setup**
   - Add `VITE_OPENAI_API_KEY` to `.env.local`
   - Add `VITE_ANTHROPIC_API_KEY` (optional)

#### Phase 2: Advanced Features
1. **Infrastructure Context**
   - Query real user resources in Convex action
   - Pass context to AI for better responses

2. **RBAC & Security**
   - Add `ai:chat` permission to roles
   - Enforce RBAC in Convex action
   - Add audit logging

3. **Rate Limiting**
   - Track message count per user
   - Enforce rate limits
   - Show helpful error messages

4. **Cost Tracking**
   - Log token usage
   - Calculate costs
   - Display to admins

---

## 📦 Package Details

### Dependencies

**Peer Dependencies** (must be installed in parent app):
- `react` ^19.0.0
- `react-dom` ^19.0.0
- `convex` ^1.28.0

**Direct Dependencies**:
- `lucide-react` - Icons
- `clsx` - Classname utilities
- `tailwind-merge` - Tailwind class merging

**Dev Dependencies**:
- TypeScript 5.7
- Vitest 3.0.5
- Testing Library

### Exports

The package exports:
```typescript
import { AIAssistantConfig, Message, ChatSession } from '@stackdock/plugins-ai-assistant'
import { aiAssistantSchema } from '@stackdock/plugins-ai-assistant/schema'
import { useChatSession, getSuggestedPrompts } from '@stackdock/plugins-ai-assistant/client'
import { buildSystemPrompt, callOpenAI, callAnthropic } from '@stackdock/plugins-ai-assistant/backend'
import { ChatDialog } from '@stackdock/plugins-ai-assistant/components/ChatDialog'
import { ChatMessage } from '@stackdock/plugins-ai-assistant/components/ChatMessage'
import { ChatInput } from '@stackdock/plugins-ai-assistant/components/ChatInput'
```

---

## 🧪 Testing Status

### Current Tests
- ✅ `buildSystemPrompt` - Builds prompt with context
- ✅ `formatMessagesForOpenAI` - Formats for OpenAI API
- ✅ `formatMessagesForAnthropic` - Formats for Anthropic API
- ✅ `ChatMessage` component - Renders correctly
- ✅ `getSuggestedPrompts` - Returns context-aware prompts

### Needed Tests
- [ ] Integration test with Convex action
- [ ] Full chat flow (send message, receive response)
- [ ] Error handling
- [ ] Rate limiting
- [ ] RBAC enforcement
- [ ] Cost calculation

---

## 🚀 Next Steps

### Immediate (To Get Working)
1. **Install dependencies**:
   ```bash
   cd packages/plugins/ai-assistant
   npm install
   ```

2. **Build package**:
   ```bash
   npm run build
   ```

3. **Add to main app**:
   ```bash
   # In apps/web/package.json
   {
     "dependencies": {
       "@stackdock/plugins-ai-assistant": "file:../../packages/plugins/ai-assistant"
     }
   }
   ```

4. **Create Convex action**:
   ```bash
   # Create convex/ai/actions.ts
   # Implement chat action using backend utilities
   ```

5. **Update schema**:
   ```typescript
   // convex/schema.ts
   import { aiAssistantSchema } from '@stackdock/plugins-ai-assistant/schema'
   export default defineSchema({
     ...existingTables,
     ...aiAssistantSchema,
   })
   ```

6. **Add to UI**:
   ```tsx
   // apps/web/src/components/dashboard/Header.tsx
   import { ChatDialog } from '@stackdock/plugins-ai-assistant/components/ChatDialog'
   ```

### Short-term (Week 1)
- [ ] Integrate with shadcn/ui components
- [ ] Add Markdown rendering
- [ ] Wire up real Convex actions
- [ ] Test with OpenAI API

### Medium-term (Week 2-3)
- [ ] Add infrastructure context
- [ ] Implement RBAC
- [ ] Add audit logging
- [ ] Implement rate limiting

---

## 📚 Documentation

### Main Docs
- **README**: `packages/plugins/ai-assistant/README.md`
- **Implementation Plan**: `docs/stand-downs/active/AI_ASSISTANT_PLUGIN_PLAN.md`
- **Plugin Architecture**: `packages/plugins/README.md`

### Code Examples
All components and hooks have inline documentation with JSDoc comments.

---

## 🎯 Success Criteria

The plugin will be considered "complete" when:

- [ ] User can open chat dialog (keyboard shortcut works)
- [ ] User can send message and receive AI response
- [ ] AI has context about user's infrastructure
- [ ] RBAC enforced (only users with `ai:chat` permission)
- [ ] Audit logs track all AI interactions
- [ ] Rate limiting prevents abuse
- [ ] Cost tracking monitors API usage
- [ ] Tests cover core functionality
- [ ] Documentation is complete

---

## 🔄 Fallback Plan (Option 2)

If the plugin architecture proves too complex, we have a fallback:

**Create**: `packages/ai/` (utility package pattern like `packages/monitoring/`)

**Migration Path**:
1. Extract provider logic to `packages/ai/src/providers/`
2. Move hooks to `packages/ai/src/react.tsx`
3. Keep components in `apps/web/src/components/ai/`
4. Later migrate to full plugin when ready

**Decision Point**: End of Phase 1 integration (if takes >1 day)

---

**Status**: Scaffolded, ready for integration  
**Next Owner**: Developer integrating with apps/web  
**Updated**: 2025-11-27
