# StackDock State Management System

## 🎯 Why This Exists

**Problem:** Cursor AI loses context between sessions. Every new chat or editor restart = blank slate.

**Result:** 8+ hours lost in circular setup instructions because AI kept reading different markdown files.

**Solution:** Machine-readable state file that survives ALL context resets.

---

## 📋 The System

### `.stackdock-state.json`
**Single source of truth** - Machine-readable, version-controlled, explicit state tracking.

### This File (`STATE-README.md`)
Human-readable companion guide for understanding and updating state.

---

## 🤖 For AI Sessions (How This Works)

Every new Cursor chat session MUST:

1. **Read `.stackdock-state.json` FIRST**
2. **Verify against filesystem** (don't trust blindly)
3. **Report current state** to user
4. **Check blockers** before suggesting actions
5. **Update state file** after any changes
6. **Never assume completion** - only user can mark `loginTested: true`

---

## 👤 For Humans (You)

### View Current State
```bash
# Full state
cat .stackdock-state.json

# Just blockers and next steps
cat .stackdock-state.json | jq '{blockers, nextSteps}'

# Just what's completed
cat .stackdock-state.json | jq '.completedSteps'
```

### Update State When You Complete Tasks

**Example:** You created `.env.local` file:
```json
{
  "setup": {
    "envFiles": {
      "apps/web/.env.local": true  // Change false → true
    }
  },
  "blockers": [
    // Remove the "env-file-missing" blocker
  ],
  "completedSteps": [
    "user-creates-env-file"  // Add to list
  ],
  "nextSteps": [
    // Remove "user-creates-env-file" from here
  ]
}
```

### Mark Login Tested (Most Important!)

**DO NOT set this to `true` until you ACTUALLY test it:**
```json
{
  "app": {
    "loginTested": true  // Only change when YOU confirm login works
  },
  "blockers": [
    // Remove "login-not-tested" blocker
  ]
}
```

---

## 📊 Critical State Fields

### `blockers[]`
Lists what's preventing progress:
- **`critical`** = App won't run, must fix
- **`warning`** = Might cause issues later
- **`info`** = Nice to know

Each blocker has:
- `id`: Unique identifier
- `severity`: How urgent
- `description`: What's wrong
- `resolution`: How to fix
- `resolvedBy`: Who/what fixed it (null until resolved)

### `nextSteps[]`
Ordered list of what needs to happen next. Update as you complete items.

### `completedSteps[]`
What's actually done and **verified by you**. Don't add until tested.

### `setup.services`
Current state of external services:
- `configured`: Setup done?
- `running`: Currently active?
- Connection details

### `app.loginTested`
**MOST IMPORTANT FIELD**
- `false` = Login never tested or not working
- `true` = User confirmed login works

AI will keep treating app as "not ready" until this is `true`.

---

## 🔄 Workflow Example

### Scenario: New Cursor Chat Session

**AI does this automatically:**
```
1. Read .stackdock-state.json
2. See: blockers = ["env-file-missing", "clerk-secret-missing", "login-not-tested"]
3. Report to user: "You have 3 critical blockers preventing login test"
4. Don't assume anything is done
5. Ask user what they want to tackle first
```

### Scenario: You Fixed Something

**You update state file:**
```json
// Before
"blockers": [
  {"id": "env-file-missing", ...}
]

// After you create the file
"blockers": [],
"completedSteps": ["user-creates-env-file"]
```

**Next AI session:**
```
1. Read .stackdock-state.json
2. See: env file blocker resolved
3. See: Still 2 blockers remaining
4. Continue from correct state
```

---

## 🚫 What This Prevents

❌ "It should work now" (when it doesn't)  
❌ Multiple conflicting setup guides  
❌ AI forgetting what's running  
❌ Circular instructions  
❌ Wasting 8 hours in setup loops  
❌ AI saying "ready" before user tests  

✅ Clear state across sessions  
✅ Explicit blocker tracking  
✅ Verified completions only  
✅ No assumptions  
✅ Machine + human readable  

---

## 📁 File Hierarchy (What AI Reads First)

```
Priority Order:
1. .stackdock-state.json     ← GROUND TRUTH (what's real)
2. .cursorrules               ← BEHAVIOR RULES (how AI acts)
3. README.md                  ← PROJECT OVERVIEW (vision)
4. STATE-README.md            ← THIS FILE (state guide)
5. SETUP_NOW.md               ← SETUP STEPS (reference)
6. ARCHITECTURE.md            ← SYSTEM DESIGN (reference)
7. Other .md files            ← REFERENCE ONLY
```

If state file conflicts with any doc, **state file wins**.

---

## 🎯 Success Criteria

**System works when:**
- New AI session reads state file first
- AI reports actual blockers immediately
- AI doesn't suggest completed steps
- AI asks user for verification before marking done
- User can update state and AI picks up changes
- No circular instructions across sessions

**You know it's working when:**
- AI says "I see you have X blockers" at session start
- AI doesn't repeat completed steps
- Progress persists across editor restarts
- Login test only happens when YOU confirm ready

---

## 🔧 Maintenance

### Update State File
Edit `.stackdock-state.json` directly - it's designed to be human-editable.

### Verify State Accuracy
```bash
# Check if env file actually exists
ls apps/web/.env.local

# Check if Convex is running
ps aux | grep convex

# Update state file to match reality
```

### Reset State (Nuclear Option)
If state gets corrupted, delete `.stackdock-state.json` and ask AI to regenerate from scratch.

---

## 💡 Philosophy

**Traditional docs:** "Here's what to do"  
**This system:** "Here's what IS, here's what's BLOCKING, here's what's NEXT"

**Traditional AI:** "I'll assume X is done"  
**This system:** "State file says X is done/not done, I'll verify"

**Traditional progress:** Lost in chat history  
**This system:** Persisted in version-controlled JSON

---

**This is how we prevent the 8-hour setup loop from ever happening again.** 🚀
