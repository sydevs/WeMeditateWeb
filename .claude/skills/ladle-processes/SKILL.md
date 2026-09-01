---
name: ladle-processes
description: Start, restart and clean up the Ladle component library (port 61000) and the Vite dev server, and manage long-running background processes. Use when a newly created story or component does not show up in Ladle, HMR looks stale, a port is already in use, or a background dev server needs starting, monitoring or killing.
---

# Ladle and background dev processes

## Development Server Troubleshooting

**Hot Module Replacement (HMR) Behavior**:
- HMR works reliably for **file updates** (editing existing components)
- HMR **DOES NOT detect new files** (newly created components, stories, or routes)
- **ALWAYS restart Ladle** after creating new files - this is expected behavior, not a bug

**When to Restart Servers**:

**ALWAYS restart Ladle** (`pnpm ladle`) when:
- Creating new `.stories.tsx` files (HMR cannot detect new files)
- Creating new component directories
- Changing story title metadata (e.g., "Atoms / Form" → "Molecules / Sections")
- Stories appear as "Story not found" after creation
- New components don't appear in Ladle navigation

**Usually works without restart** (HMR handles these):
- Editing existing component code (component logic, styling, props)
- Editing existing story content
- CSS/styling changes in existing files
- TypeScript type changes in existing files
- Adding/removing/modifying component props

Restart Dev Server (`pnpm dev`) when:
- Adding new pages or routes
- Modifying Vike configuration files (`+config.ts`, `+route.ts`)
- Changes to environment variables in `.env`
- Cloudflare Workers bindings aren't working

**Fast Restart Pattern**:
```bash
# Stop existing process and restart in one command (Ladle)
lsof -ti:61000 | xargs kill && pnpm ladle

# Or use force kill if standard kill fails
lsof -ti:61000 | xargs kill -9 && pnpm ladle

# For dev server (port 5173)
lsof -ti:5173 | xargs kill && pnpm dev
```

**Browser Hard Refresh**:
- Use when CSS/style changes aren't applying: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows/Linux)
- Clears browser cache for the current page
- Usually not needed for component logic changes (HMR handles those)

**Port Conflicts**:
- If you see "Port already in use" errors, use `lsof -ti:<port>` to find the process
- Kill the process with the command above
- Check if you have multiple terminal sessions running the same command


## Background Process Management

When working with background processes (especially Ladle), follow these guidelines:

### Starting Background Processes

- **Check before starting**: Use `BashOutput` to check if a process is already running
- **Use descriptive names**: When calling Bash tool, provide clear description
- **Avoid duplicates**: Don't start multiple instances of the same dev server
- **Track process IDs**: Keep note of shell IDs returned by Bash tool

### Managing Ladle Processes

```bash
# Check existing processes before starting
# Use: BashOutput tool with existing shell_id

# Start Ladle (only if not already running)
pnpm ladle

# Monitor output
# Use: BashOutput tool with shell_id

# Kill when done
# Use: KillShell tool with shell_id
```

### Process Cleanup

**When to kill processes**:
- ✅ Kill Ladle/dev server processes you started when done
- ✅ Kill processes that are no longer needed
- ✅ Kill duplicate processes of the same type

**What NOT to kill**:
- ❌ NEVER kill Chrome debugging processes (port 9222)
- ❌ NEVER kill processes you didn't start
- ❌ Chrome debugging may be shared across Claude instances

### Best Practices

1. **One dev server at a time**: Only run one Ladle instance
2. **Clean up after yourself**: Kill processes before starting new ones
3. **Monitor output**: Use BashOutput to check status and errors
4. **Descriptive descriptions**: Always provide context when starting processes

Example:
```typescript
// ✅ Good
Bash({
  command: "pnpm ladle",
  description: "Start Ladle component library",
  run_in_background: true
})

// ❌ Bad - no description, might be duplicate
Bash({ command: "pnpm ladle", run_in_background: true })
```

