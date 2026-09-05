# MCP Server Usage Guide

This guide covers the MCP servers configured for this project in `.mcp.json`.

## Installed servers

| Server | Type | Purpose |
| --- | --- | --- |
| `github` | http | GitHub API access (issues, PRs, checks) |
| `sentry` | http | Query Sentry errors and issues |
| `cloudflare-docs` | http | Search Cloudflare product documentation |
| `puppeteer` | stdio | Browser automation for design extraction and UI checks |
| `payloadcms-docs` | stdio | Search PayloadCMS documentation |

`.claude/settings.json` pre-approves `mcp__cloudflare-docs__*` and `mcp__github__*` for use
without a confirmation prompt. Other MCP tools ask for confirmation on first use.

## Puppeteer

### `puppeteer_evaluate` returns undefined

**Cause**: The script has no explicit `return` statement. This is normal Puppeteer behavior, not
an MCP bug.

```javascript
// Wrong — no return, result is undefined
const data = { title: document.title };
data;

// Correct — explicit return
return { title: document.title, h1Count: document.querySelectorAll('h1').length };

// Also correct — implicit return, no braces
(() => document.title)();
```

Extract only serializable values. A DOM node cannot cross the bridge back to the caller.

```javascript
// Wrong — returns a DOM node
return document.querySelector('h1');

// Correct — returns its text
return document.querySelector('h1')?.textContent;
```

Use `console.log()` inside the script for debug output. It appears in the tool's console section.

### Chrome debugging setup

Start Chrome with a debug port before the first `puppeteer_connect_active_tab` call.

```bash
./scripts/chrome-debug.sh
# or manually:
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222
```

Check the port is open: `lsof -ti:9222` returns a process id when Chrome is listening.

Multiple MCP sessions can share one Chrome instance. Do not stop a debug session you did not
start — another agent may depend on it. Closing Chrome disconnects every session.

### Design extraction workflow

1. Connect: `puppeteer_connect_active_tab({ debugPort: 9222 })`.
2. Navigate, if the target page is not already open: `puppeteer_navigate({ url })`.
3. Extract HTML structure and class names with `puppeteer_evaluate`.
4. Extract computed styles with `window.getComputedStyle(element)` — read layout, spacing,
   typography, and color properties from the result.
5. Map each extracted value to a Tailwind token (see
   [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md)). Example: `8px` → `2`, `16px` → `4`, `14px` → `text-sm`.

Prefer style extraction over screenshots for token mapping. Use a screenshot only for visual
confirmation, or when the source is a Figma/Sketch file instead of a live page.

## Cloudflare Docs

```javascript
mcp__cloudflare_docs__search_cloudflare_documentation({ query: "KV namespace bindings" });
mcp__cloudflare_docs__migrate_pages_to_workers_guide();
```

Search for a product name (Workers, KV, R2) rather than a specific API when a query returns no
results.

## General guidance

Prefer a built-in tool (Grep, Read) over an equivalent shell command. Check every
MCP tool result for an error before you act on it. A lost connection or a missing dependency —
Chrome not running, for example — can fail a call silently.
